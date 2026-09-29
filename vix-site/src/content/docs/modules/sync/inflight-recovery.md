# In-flight Recovery

In-flight recovery protects the outbox from operations that were claimed but never completed. This can happen when a process stops after a worker has claimed an operation, when a transport call hangs longer than expected, or when the application loses the result of a delivery attempt before it can update the outbox.

The `sync` module handles this by giving workers a timeout-based recovery path. During a tick, old `InFlight` operations can be moved back into a retryable state so they are not left permanently stuck. This keeps the outbox useful after crashes and interruptions, while still making the application responsible for idempotent delivery.

## Header

Use the public sync header:

```cpp id="lpzx4o"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="men5jf"
#include <vix/print.hpp>
```

## Why in-flight operations can get stuck

A normal operation moves from `Pending` to `InFlight` when a worker claims it. After that, the worker should either complete it or fail it.

```txt id="uurm2r"
Pending -> InFlight -> Done
Pending -> InFlight -> Failed
Pending -> InFlight -> PermanentFailed
```

The difficult case is the gap between claim and final result. Once an operation is claimed, it is no longer returned as ready work. If the process stops during that gap, the store may still contain an operation marked `InFlight`, but no worker is actually processing it anymore.

In-flight recovery exists for that gap. It treats old claimed operations as abandoned and makes them eligible for retry.

## Configure the timeout

The timeout is configured on `SyncEngine::Config`.

```cpp id="m7masu"
vix::sync::engine::SyncEngine::Config cfg;

cfg.worker_count = 1;
cfg.batch_limit = 10;
cfg.inflight_timeout_ms = 10'000;
```

The value is expressed in milliseconds. If an operation has been `InFlight` longer than this timeout, the store can requeue it during a worker tick.

Choose this value based on the kind of work your transport performs. A small HTTP request may use a short timeout. A heavier upload, peer operation, or remote write may need a longer one. The timeout should be long enough to avoid requeueing normal slow work too early, but short enough that a real crash does not leave operations stuck for too long.

## Store-level recovery

The recovery operation is exposed by `OutboxStore`:

```cpp id="bzn6bb"
std::size_t requeue_inflight_older_than(
  std::int64_t now_ms,
  std::int64_t timeout_ms
);
```

`FileOutboxStore` implements this method by scanning stored operations. When it finds an operation whose status is `InFlight` and whose age is greater than or equal to the timeout, it changes the operation to a retryable failed state, updates its timestamp, clears its owner, and makes the operation eligible for processing again.

```cpp id="g1h15a"
const auto requeued = store->requeue_inflight_older_than(
  now_ms(),
  10'000
);

vix::print("requeued operations", requeued);
```

Application code usually does not need to call this directly. `SyncWorker::tick()` already performs this sweep before attempting to send ready operations.

## Manual recovery example

The following example simulates a crash-like situation. It enqueues an operation, claims it manually, does not complete or fail it, then advances time beyond the in-flight timeout. When the engine ticks, the operation can be recovered and processed.

```cpp id="d0oakh"
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

class SuccessTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
  {
    vix::print("sending recovered operation", op.id);

    return {
      .ok = true,
      .retryable = false,
      .error = {}
    };
  }
};

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::engine;
  using namespace vix::sync::outbox;

  const std::filesystem::path dir = "./.vix_inflight_example";

  std::error_code ec;
  std::filesystem::remove_all(dir, ec);
  std::filesystem::create_directories(dir, ec);

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = dir / "outbox.json",
      .pretty_json = true
    }
  );

  auto outbox = std::make_shared<Outbox>(
    Outbox::Config{
      .owner = "inflight-example"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return true;
    }
  );

  auto transport = std::make_shared<SuccessTransport>();

  SyncEngine::Config cfg;
  cfg.worker_count = 1;
  cfg.batch_limit = 10;
  cfg.inflight_timeout_ms = 50;

  SyncEngine engine(cfg, outbox, probe, transport);

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"recover me"})";
  op.idempotency_key = "message-inflight-demo";

  const auto t0 = now_ms();
  const auto id = outbox->enqueue(op, t0);

  const bool claimed = outbox->claim(id, t0);

  vix::print("claimed before interruption", claimed);

  auto before = store->get(id);

  if (before)
  {
    vix::print("status before recovery", status_name(before->status));
  }

  const auto t1 = t0 + 60;

  const auto processed = engine.tick(t1);

  auto after = store->get(id);

  vix::print("processed operations", processed);

  if (after)
  {
    vix::print("status after recovery", status_name(after->status));
  }

  return 0;
}
```

Output shape:

```txt id="wk4g3y"
claimed before interruption true
status before recovery InFlight
sending recovered operation op_1804289383
processed operations 1
status after recovery Done
```

The operation id is generated at runtime, so it will differ between runs. The important part is the transition. The operation starts as `InFlight`, becomes recoverable after the timeout, and can then be delivered by the engine.

## What happens during a worker tick

A worker tick begins by asking the store to requeue old in-flight operations. This happens before the worker checks whether it should send ready work.

The practical effect is that a recovered operation can be picked up quickly. If the network probe reports online and the operation becomes ready during the recovery sweep, the same tick may also send it. If the probe reports offline, the operation remains in the outbox and can be attempted later.

This behavior is useful because recovery does not require a separate maintenance job. It is part of the normal sync loop.

## Recovery does not prove delivery failed

An in-flight timeout only proves that the local process did not record a final result in time. It does not prove that the remote side never received the operation.

This distinction is important. The process may have crashed after the remote server accepted the operation but before the local outbox was marked `Done`. After recovery, the operation can be sent again. That is why idempotency keys are part of the operation model.

```cpp id="mo82q6"
vix::sync::Operation op;

op.kind = "order.create";
op.target = "/api/orders";
op.payload = R"({"cart_id":"cart_42"})";
op.idempotency_key = "order-from-cart-42";
```

The receiving system should use the idempotency key to recognize repeated attempts of the same logical operation. Without that, recovery and retry can create duplicates.

## Direct store recovery

For maintenance tools or tests, recovery can be performed directly on the store.

```cpp id="mhwls7"
const auto requeued = store->requeue_inflight_older_than(
  now_ms(),
  30'000
);

vix::print("requeued", requeued);
```

This is useful when an application wants an explicit recovery pass at startup before creating the engine. In many cases, it is enough to let the engine tick perform the same sweep.

## Inspecting recovered operations

A recovered operation is marked as failed with a diagnostic error. In the file store, the `last_error` field is updated so the reason is visible when inspecting the JSON file.

```cpp id="d5sbxv"
auto saved = store->get(id);

if (saved)
{
  vix::print("status", status_name(saved->status));
  vix::print("last error", saved->last_error);
}
```

This makes recovery easier to diagnose. A recovered operation did not fail because the transport returned an application error; it was requeued because it stayed in-flight beyond the timeout.

## Choosing a timeout

Use a timeout that reflects the longest normal delivery time for the operation type. If the timeout is too short, slow but valid operations may be requeued while the original delivery is still running. If the timeout is too long, abandoned operations will remain unavailable for longer than necessary.

For simple message or event delivery, a timeout of a few seconds may be enough. For heavier operations, choose a larger value and make sure the transport has its own timeout behavior. The outbox timeout should be part of a broader delivery design, not the only timeout in the system.

## Common mistakes

Do not treat recovery as a guarantee that the previous delivery did not happen. Recovery is a local-state repair mechanism, not a remote-state proof.

Do not use recovery without idempotent remote handling. A recovered operation may be delivered again, and the receiving side should be able to deduplicate it.

Do not make the in-flight timeout shorter than the normal transport timeout. If the transport can legitimately take ten seconds, a two-second in-flight timeout can cause duplicate work.

Do not ignore recovered operations in diagnostics. A repeated `"requeued after inflight timeout"` error usually means the process is stopping during delivery, the transport is hanging, or the timeout value does not match the real delivery behavior.

## Next step

Continue with the WAL page to understand the lower-level append-only log primitives provided by the sync module.

```md id="vb1jro"
[WAL](./wal.md)
```
