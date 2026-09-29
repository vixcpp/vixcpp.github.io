# File Outbox Store

`FileOutboxStore` is the default persistent store for the sync outbox. It stores operations in a JSON file, keeps an in-memory copy while the process is running, and flushes changes back to disk whenever the outbox state changes.

This store is meant to give Vix applications a simple durable queue without requiring a database. It is useful for local-first applications, development tools, tests, small services, and any workflow where an inspectable file is enough to preserve pending sync work across restarts.

## Header

Use the public sync header:

```cpp id="wtb2c8"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="brn3a8"
#include <vix/print.hpp>
```

## Create a file-backed store

A `FileOutboxStore` is created with a path to the JSON file used for persistence.

```cpp id="2ad7gb"
#include <memory>

#include <vix/sync.hpp>

int main()
{
  auto store = std::make_shared<vix::sync::outbox::FileOutboxStore>(
    vix::sync::outbox::FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json",
      .pretty_json = true
    }
  );

  return 0;
}
```

The default path is:

```txt id="ttl3k6"
./.vix/outbox.json
```

The store creates the parent directory when it writes the file. In application code, prefer a path with an explicit parent directory, such as `./.vix/outbox.json` or an application-specific state directory.

## Use it with an outbox

Most code should not call the store directly for normal sync work. The usual workflow is to create a store, pass it to `Outbox`, and let the outbox handle enqueueing, claiming, completion, and failures.

```cpp id="st1x70"
#include <chrono>
#include <cstdint>
#include <memory>

#include <vix/print.hpp>
#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::outbox;

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json",
      .pretty_json = true
    }
  );

  Outbox outbox(
    Outbox::Config{
      .owner = "file-store-example"
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"stored in a JSON outbox"})";

  const auto id = outbox.enqueue(op, now_ms());

  vix::print("stored operation", id);

  return 0;
}
```

After this program runs, the operation is present in the configured JSON file. It can be inspected manually, loaded again after a restart, and processed later by a worker or engine.

## Stored file shape

The file contains a version number, a map of operations, and ownership metadata for operations that are currently in-flight.

```json id="tjl9yo"
{
  "version": 1,
  "ops": {
    "op_1804289383": {
      "id": "op_1804289383",
      "kind": "message.send",
      "target": "/api/messages",
      "payload": "{\"text\":\"stored in a JSON outbox\"}",
      "idempotency_key": "idem_846930886",
      "created_at_ms": 123456789,
      "updated_at_ms": 123456789,
      "attempt": 0,
      "next_retry_at_ms": 123456789,
      "status": 0,
      "last_error": ""
    }
  },
  "owners": {}
}
```

The `ops` object stores the durable operation state. The `owners` object stores claim ownership for in-flight operations. This makes the file useful not only as a queue, but also as a diagnostic artifact when a sync process stops before finishing an operation.

## Lazy loading

`FileOutboxStore` loads the JSON file lazily. Construction does not immediately read the file; the first store operation triggers loading. This keeps setup cheap and avoids touching the filesystem until the store is actually used.

Once loaded, the store keeps operations in memory and protects access with a mutex. Mutations are then flushed back to the configured file. This gives a simple and predictable persistence model: read once into memory, update in memory, write the new state to disk after changes.

## Reading an operation

Use `get()` to read one operation by id.

```cpp id="vnwjj3"
auto saved = store->get(id);

if (saved)
{
  vix::print("operation kind", saved->kind);
  vix::print("operation target", saved->target);
}
```

This is useful for tests, diagnostics, and status screens. Normal application delivery should still go through `Outbox` and `SyncEngine`.

## Listing operations

The store implements `list()` through `ListOptions`. This is the lower-level operation used by `Outbox::peek_ready()`.

```cpp id="w0wyhe"
vix::sync::outbox::ListOptions opt;
opt.limit = 25;
opt.now_ms = now_ms();
opt.only_ready = true;
opt.include_inflight = false;

auto ready = store->list(opt);

vix::print("ready operations", ready.size());
```

When `only_ready` is true, operations waiting for a future retry time are skipped. Done operations and permanently failed operations are not returned. In-flight operations are skipped unless `include_inflight` is enabled.

For application code, prefer:

```cpp id="ahseqx"
auto ready = outbox.peek_ready(now_ms(), 25);
```

The outbox version keeps the higher-level workflow clearer.

## Claiming and ownership

A worker claims an operation before attempting delivery. In the file store, claiming marks the operation as `InFlight`, updates its timestamp, and records the owner name.

```cpp id="kccxu1"
const bool claimed = store->claim(
  id,
  "worker-1",
  now_ms()
);

if (claimed)
{
  vix::print("claimed", id);
}
```

Most code should use `Outbox::claim()` instead of calling the store directly, because the outbox already knows the configured owner.

```cpp id="gq6qt7"
outbox.claim(id, now_ms());
```

The store-level method exists because `OutboxStore` is the persistence contract. It is useful when implementing custom orchestration, but the outbox method is the normal public workflow.

## Completion and failure

The store can mark an operation as done:

```cpp id="64m5th"
store->mark_done(id, now_ms());
```

It can also record a retryable failure with a future retry time:

```cpp id="jea8kq"
store->mark_failed(
  id,
  "temporary network error",
  now_ms(),
  now_ms() + 1000
);
```

For a failure that should not be retried, the store can mark the operation as permanently failed:

```cpp id="0rkdnz"
store->mark_permanent_failed(
  id,
  "invalid payload",
  now_ms()
);
```

In normal sync code, prefer `Outbox::complete()` and `Outbox::fail()`. The outbox applies the configured retry policy and keeps the lifecycle decision in one place.

## Requeue old in-flight operations

A process can stop after claiming an operation but before recording success or failure. Without recovery, that operation would remain `InFlight` and would not be selected as ready work again.

`FileOutboxStore` provides `requeue_inflight_older_than()` for this case.

```cpp id="l48enp"
const auto requeued = store->requeue_inflight_older_than(
  now_ms(),
  10'000
);

vix::print("requeued operations", requeued);
```

The sync worker uses this recovery path during a tick. Operations that have been in-flight longer than the configured timeout are moved back into a retryable state so they can be attempted again.

This is not a replacement for idempotency. A timeout can happen after the remote side received the operation but before the local process recorded completion. The operation may be sent again, so the remote side should use the operation idempotency key to deduplicate repeated delivery attempts.

## Prune completed operations

Completed operations can be removed once they are no longer needed for inspection.

```cpp id="n3mpde"
const auto removed = store->prune_done(now_ms() - 60'000);

vix::print("removed completed operations", removed);
```

The argument is a cutoff timestamp in milliseconds. Done operations with `updated_at_ms` older than or equal to that value are removed. Failed and pending operations are not pruned by this method.

Pruning is useful for long-running applications where the outbox file should not keep every completed operation forever.

## Complete example

This example creates a file-backed store, enqueues an operation through the outbox, claims it, completes it, and then prunes completed work.

```cpp id="p4hpl5"
#include <chrono>
#include <cstdint>
#include <filesystem>
#include <memory>

#include <vix/print.hpp>
#include <vix/sync.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}

static const char *status_name(vix::sync::OperationStatus status)
{
  using vix::sync::OperationStatus;

  switch (status)
  {
  case OperationStatus::Pending:
    return "Pending";
  case OperationStatus::InFlight:
    return "InFlight";
  case OperationStatus::Done:
    return "Done";
  case OperationStatus::Failed:
    return "Failed";
  case OperationStatus::PermanentFailed:
    return "PermanentFailed";
  }

  return "Unknown";
}

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::outbox;

  const std::filesystem::path dir = "./.vix_file_store_example";

  std::error_code ec;
  std::filesystem::remove_all(dir, ec);
  std::filesystem::create_directories(dir, ec);

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = dir / "outbox.json",
      .pretty_json = true
    }
  );

  Outbox outbox(
    Outbox::Config{
      .owner = "file-store-worker"
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"file-backed operation"})";
  op.idempotency_key = "message-file-store-demo";

  const auto t0 = now_ms();
  const auto id = outbox.enqueue(op, t0);

  vix::print("queued", id);

  if (outbox.claim(id, t0))
  {
    vix::print("claimed", id);
    outbox.complete(id, now_ms());
  }

  auto saved = store->get(id);

  if (saved)
  {
    vix::print("status", status_name(saved->status));
  }

  const auto removed = store->prune_done(now_ms());

  vix::print("pruned", removed);

  return 0;
}
```

This example uses the outbox for lifecycle transitions and the store for inspection and pruning. That is the usual balance: let the outbox manage operation state, and use the store when you need persistence-level operations.

## Configuration

`FileOutboxStore::Config` contains the file storage settings.

| Field            | Purpose                                                       |
| ---------------- | ------------------------------------------------------------- |
| `file_path`      | JSON file used to persist outbox operations.                  |
| `pretty_json`    | Writes formatted JSON that is easier to inspect by hand.      |
| `fsync_on_write` | Reserved for stronger write durability behavior in store use. |

Use `pretty_json = true` while developing or writing tests where the file is useful to inspect. Use compact JSON when file size matters more than readability.

When stronger crash-durability guarantees matter, review the store behavior on the target platform and test the exact persistence configuration you plan to rely on.

## When to use a custom store

`FileOutboxStore` favors simplicity and readability. It is a good default when the operation volume is modest and when a single JSON file is acceptable.

A custom `OutboxStore` becomes more appropriate when the application needs database transactions, high write volume, multiple processes sharing the same queue, advanced indexing, or stronger operational controls. The important part is that the higher-level `Outbox` and `SyncEngine` do not need to change when the storage implementation changes.

## Common mistakes

Avoid editing the outbox JSON file by hand while the process is running. The store keeps an in-memory copy after loading and may overwrite manual changes on the next flush.

Avoid using the file store as a high-throughput database. It rewrites the stored JSON state after mutations, which is simple and inspectable, but not designed for large operation volumes.

Avoid depending on claim ownership as a distributed lock across unrelated processes unless the store implementation has been designed and tested for that environment. The default file store is intended as a simple local persistence layer.

Avoid pruning too aggressively. Completed operations can be useful when diagnosing delivery behavior, especially during early development.

## Next step

Continue with retry policy to understand how retryable failures receive their next processing time.

```md id="xet8jv"
[Retry Policy](./retry-policy.md)
```
