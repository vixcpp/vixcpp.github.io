# Outbox

The `Outbox` is the durable queue used by the `sync` module to hold operations before they are delivered. Application code records work in the outbox first, then a worker or engine can claim ready operations and send them through a transport.

This design keeps the risky part of synchronization away from the moment where the application creates work. A network call may fail, but an operation that has already been written to the outbox can be retried, inspected, or recovered after a restart. The outbox is therefore the central coordination point between local intent and remote delivery.

## Header

Use the public sync header:

```cpp id="whl8sr"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="8jhdlp"
#include <vix/print.hpp>
```

## Create an outbox

An `Outbox` is built from a configuration object and an `OutboxStore`. The outbox owns the high-level lifecycle decisions, while the store owns persistence.

```cpp id="ymqjja"
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

  vix::sync::outbox::Outbox outbox(
    vix::sync::outbox::Outbox::Config{
      .owner = "app-sync"
    },
    store
  );

  return 0;
}
```

The `owner` value is written when an operation is claimed. It is a logical name for the process, engine, or worker using the outbox. In small applications, one stable owner name is usually enough. In more advanced integrations, the owner can help identify which worker claimed an in-flight operation.

## Enqueue an operation

`enqueue()` stores an operation before it becomes eligible for delivery. The caller passes the current time in milliseconds so the outbox can set missing timestamps and schedule the first processing time.

```cpp id="m68owy"
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
      .owner = "app-sync"
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"conversation_id":"c1","text":"hello"})";
  op.idempotency_key = "message-c1-001";

  const auto id = outbox.enqueue(op, now_ms());

  vix::print("queued operation", id);

  return 0;
}
```

The outbox can generate a local operation id and an idempotency key when they are missing. That is useful for simple cases, but application workflows that already have a stable domain identity should provide their own idempotency key. A message id, order id, mutation id, or command id is usually a better deduplication key than a generated value that only exists locally.

## Ready operations

`peek_ready()` returns operations that are eligible to be processed at the given time. It does not claim them. It only gives the caller a view of candidates that are not done, not permanently failed, not currently in-flight, and not waiting for a future retry time.

```cpp id="e6b4yk"
auto ready = outbox.peek_ready(now_ms(), 25);

vix::print("ready operations", ready.size());
```

This separation matters because listing and ownership are different actions. A worker can look at ready operations first, then claim each operation before sending it. If another worker already claimed the same operation, the claim fails and the caller can skip it safely.

## Claim before delivery

Before a worker sends an operation, it should claim it through the outbox.

```cpp id="uqv1ly"
const bool claimed = outbox.claim(id, now_ms());

if (!claimed)
{
  vix::print("operation was already claimed or no longer exists");
}
```

Claiming changes the operation status to `InFlight` and associates the operation with the configured owner. This prevents two workers from processing the same local operation at the same time when they share the same store.

A claim is not a delivery confirmation. It only means the operation has been reserved for processing. The worker still needs to report the final result by calling `complete()` or `fail()`.

## Complete an operation

When delivery succeeds, the worker marks the operation as complete.

```cpp id="s3eq8o"
const bool completed = outbox.complete(id, now_ms());

if (completed)
{
  vix::print("operation completed", id);
}
```

A completed operation receives the `Done` status. The file-backed store also removes ownership metadata for that operation, because it is no longer in-flight. Completed operations remain in the store until they are pruned by the store implementation.

## Fail an operation

When delivery fails, the worker reports the failure through `fail()`. The last argument tells the outbox whether retrying can still make sense.

```cpp id="uh1p7x"
outbox.fail(
  id,
  "temporary network error",
  now_ms(),
  true
);
```

A retryable failure is stored with the error message and a future retry time computed from the configured `RetryPolicy`. Until that time arrives, the operation remains in the outbox but should not be returned as ready.

For a failure that should not be retried, pass `false`:

```cpp id="f0n1k4"
outbox.fail(
  id,
  "invalid payload",
  now_ms(),
  false
);
```

A non-retryable failure becomes `PermanentFailed`. It remains visible in the store for diagnostics, but it is not selected again as ready work.

## Configure retry behavior

The outbox uses `RetryPolicy` to decide when a retryable failure should be attempted again.

```cpp id="5jehj1"
vix::sync::RetryPolicy retry;
retry.max_attempts = 8;
retry.base_delay_ms = 500;
retry.max_delay_ms = 30'000;
retry.factor = 2.0;

auto outbox = std::make_shared<vix::sync::outbox::Outbox>(
  vix::sync::outbox::Outbox::Config{
    .owner = "app-sync",
    .retry = retry
  },
  store
);
```

The policy keeps retry timing deterministic. Given the same attempt count and configuration, the next delay can be recomputed. This is useful in durable systems because retry state must stay understandable across process restarts.

## Manual lifecycle example

The following example shows the outbox lifecycle without using `SyncEngine`. It enqueues an operation, lists ready work, claims it, completes it, and then reads the final stored state.

```cpp id="mt0c5s"
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

  const std::filesystem::path dir = "./.vix_outbox_example";

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
      .owner = "manual-worker"
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"stored before delivery"})";
  op.idempotency_key = "message-quick-demo";

  const auto t0 = now_ms();
  const auto id = outbox.enqueue(op, t0);

  auto ready = outbox.peek_ready(t0, 10);

  vix::print("ready operations", ready.size());

  if (!ready.empty() && outbox.claim(ready.front().id, t0))
  {
    vix::print("claimed operation", ready.front().id);

    outbox.complete(ready.front().id, now_ms());
  }

  auto saved = store->get(id);

  if (saved)
  {
    vix::print("final status", status_name(saved->status));
  }

  return 0;
}
```

Output shape:

```txt id="s32xsf"
ready operations 1
claimed operation op_1804289383
final status Done
```

The generated operation id will differ between runs. The important part is the lifecycle: the operation is stored, selected, claimed, completed, and then read back from the store.

## Access the underlying store

`store()` returns the store used by the outbox.

```cpp id="bl99hi"
auto store = outbox.store();
```

This is useful when an engine or worker needs store-level recovery helpers, such as requeueing old in-flight operations. Application code should still prefer the outbox methods for normal lifecycle changes, because the outbox applies the configured ownership and retry policy.

## Configuration

`Outbox::Config` keeps the outbox behavior small and explicit.

| Field                           | Purpose                                                                  |
| ------------------------------- | ------------------------------------------------------------------------ |
| `owner`                         | Logical owner used when claiming operations.                             |
| `retry`                         | Retry policy used after retryable failures.                              |
| `auto_generate_ids`             | Generates a local operation id when `Operation::id` is empty.            |
| `auto_generate_idempotency_key` | Generates an idempotency key when `Operation::idempotency_key` is empty. |

The automatic generation options are convenient for examples and local tools. For business operations that can be retried against a remote system, a domain-specific idempotency key is usually the safer choice.

## Outbox and stores

The outbox itself is not a database. It is the lifecycle façade above an `OutboxStore`. The default `FileOutboxStore` persists operations in a JSON file, while another application could provide a database-backed store with the same contract.

This boundary is what keeps the outbox useful in different environments. The application and engine can use the same outbox workflow while the persistence layer changes behind it.

## Common mistakes

Do not send an operation before it is stored. The outbox pattern only gives useful recovery behavior when the operation is persisted before the network attempt.

Do not treat `peek_ready()` as ownership. A ready operation still needs to be claimed before delivery. This is especially important when more than one worker can read from the same store.

Do not report every failure as retryable. A temporary connection error and an invalid payload are different outcomes. Retry temporary failures, but mark permanent failures as non-retryable so they do not keep returning to the queue.

Do not mutate a stored operation only in a local copy. Once an operation is in the outbox, lifecycle changes should go through `Outbox` or the underlying store.

## Next step

Continue with the file outbox store to understand how the default JSON-backed persistence works and when a custom store may be more appropriate.

```md id="m126en"
[File Outbox Store](./file-outbox-store.md)
```
