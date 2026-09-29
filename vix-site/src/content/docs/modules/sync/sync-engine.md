# Sync Engine

`SyncEngine` coordinates the delivery loop for the `sync` module. It owns one or more workers, gives them access to the same outbox, network probe, and transport, and lets them process ready operations over time.

The engine is the part that connects the durable queue to actual delivery. The application records operations in an outbox, then the engine runs ticks that let workers claim ready operations, send them through the configured transport, and update their state. This keeps synchronization work outside the application code that created the operation.

## Header

Use the public sync header:

```cpp id="k41oyv"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="lp6ks2"
#include <vix/print.hpp>
```

## What the engine owns

A `SyncEngine` is constructed from four pieces: a configuration object, an outbox, a network probe, and a transport.

```cpp id="bnm49d"
vix::sync::engine::SyncEngine engine(
  vix::sync::engine::SyncEngine::Config{
    .worker_count = 1,
    .batch_limit = 10
  },
  outbox,
  probe,
  transport
);
```

The outbox provides durable operations. The probe tells workers whether delivery should be attempted. The transport sends an operation to the outside world and reports the result. The engine creates workers from this shared set of dependencies and calls them when a tick runs.

This design keeps the engine small. It does not know the meaning of an operation payload, and it does not know how the remote system works. It only coordinates the sync loop.

## Manual ticks

The clearest way to use the engine is to call `tick()` manually. One tick asks every worker owned by the engine to process ready operations for the current time.

```cpp id="rw57ca"
const auto processed = engine.tick(now_ms());

vix::print("processed operations", processed);
```

Manual ticks are useful in tests, command-line tools, embedded loops, and examples. They make time explicit and keep the control flow easy to inspect. The caller chooses when the engine runs and which timestamp is used for retry checks.

## Complete manual example

This example creates an engine, enqueues one operation, runs one tick, and reads the final status from the store.

```cpp id="huxk7r"
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

class DemoTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
  {
    vix::print("sending", op.kind, "to", op.target);

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

  const std::filesystem::path dir = "./.vix_engine_example";

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
      .owner = "engine-example"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return true;
    }
  );

  auto transport = std::make_shared<DemoTransport>();

  SyncEngine engine(
    SyncEngine::Config{
      .worker_count = 1,
      .batch_limit = 10
    },
    outbox,
    probe,
    transport
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"hello from the engine"})";
  op.idempotency_key = "message-engine-demo";

  const auto id = outbox->enqueue(op, now_ms());

  const auto processed = engine.tick(now_ms());

  auto saved = store->get(id);

  vix::print("processed operations", processed);

  if (saved)
  {
    vix::print("final status", status_name(saved->status));
  }

  return 0;
}
```

Output shape:

```txt id="chq3ay"
sending message.send to /api/messages
processed operations 1
final status Done
```

The engine does not send the operation directly when it is enqueued. Delivery happens when `tick()` gives the worker a chance to process ready work.

## Background loop

`SyncEngine` can also run its own background loop. Calling `start()` creates an internal thread that repeatedly calls `tick()`. Calling `stop()` requests shutdown and joins the thread.

```cpp id="2sthex"
engine.start();

// The application continues doing other work.

engine.stop();
```

This mode is useful for long-running applications where sync work should continue while the rest of the application handles requests, UI events, peer activity, or local writes. The engine destructor also stops the engine, but explicit `stop()` keeps shutdown easier to reason about.

A small background example can look like this:

```cpp id="rl77oy"
#include <chrono>
#include <thread>

engine.start();

std::this_thread::sleep_for(std::chrono::milliseconds(500));

engine.stop();
```

Use manual ticks when you need deterministic behavior. Use the background loop when the application wants the sync engine to run continuously.

## Configuration

`SyncEngine::Config` controls how the engine creates and drives workers.

| Field                 | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `worker_count`        | Number of worker instances created by the engine.            |
| `idle_sleep_ms`       | Sleep duration used by the background loop when no work ran. |
| `offline_sleep_ms`    | Offline sleep value carried into worker configuration.       |
| `batch_limit`         | Maximum number of operations a worker processes per tick.    |
| `inflight_timeout_ms` | Age after which old in-flight operations can be requeued.    |

For most applications, start with one worker and a modest batch limit. Increase worker count only when the store, transport, and remote side are designed for concurrent delivery.

```cpp id="qb8qfy"
vix::sync::engine::SyncEngine::Config cfg;

cfg.worker_count = 1;
cfg.batch_limit = 25;
cfg.idle_sleep_ms = 250;
cfg.inflight_timeout_ms = 10'000;
```

The configuration is intentionally small because the engine should remain a coordinator, not a policy-heavy runtime. Retry timing belongs to `RetryPolicy`, persistence belongs to the store, and delivery behavior belongs to the transport.

## Workers

Each worker performs the same basic sequence during a tick. It first asks the store to requeue old in-flight operations that exceeded the configured timeout. It then checks the network probe. If the probe reports that delivery should proceed, the worker asks the outbox for ready operations, claims them, sends them through the transport, and records the result.

This means the engine does not need to know the details of each operation. It simply gives workers regular opportunities to advance the outbox state.

## Network probe

The engine receives a `vix::net::NetworkProbe` and passes it to workers. The worker calls the probe before sending operations. When the probe reports offline, the worker returns without calling the transport.

```cpp id="j1k59m"
auto probe = std::make_shared<vix::net::NetworkProbe>(
  vix::net::NetworkProbe::Config{},
  [] {
    return false;
  }
);
```

With a probe like this, operations remain in the outbox. They are not failed merely because the process is offline. A later tick can attempt delivery when the probe reports that the network is available.

## Transport result handling

The engine does not interpret application protocols. It only receives the result reported by the transport through the worker.

When the transport returns success, the operation is completed:

```cpp id="zmj2x9"
return {
  .ok = true,
  .retryable = false,
  .error = {}
};
```

When the transport returns a retryable failure, the operation is failed with a retry time:

```cpp id="wez1o5"
return {
  .ok = false,
  .retryable = true,
  .error = "temporary network error"
};
```

When the transport returns a non-retryable failure, the operation is marked permanently failed:

```cpp id="gcwdd1"
return {
  .ok = false,
  .retryable = false,
  .error = "invalid payload"
};
```

This keeps the transport responsible for delivery knowledge while keeping lifecycle updates inside the sync workflow.

## In-flight recovery

During each worker tick, old in-flight operations can be requeued through the store. This protects the queue from operations that were claimed but never completed, which can happen after a crash, a timeout, or a worker interruption.

The timeout is configured on the engine:

```cpp id="ic8bik"
vix::sync::engine::SyncEngine::Config cfg;

cfg.inflight_timeout_ms = 10'000;
```

A requeued operation becomes eligible for processing again. This is one of the reasons idempotency keys matter: the remote side may have received the operation before the local process lost track of the result.

## Choosing `tick()` or `start()`

Use `tick()` when the application already has a loop or when tests need precise control. A server, command-line tool, or deterministic test can call `tick()` at well-defined moments.

Use `start()` when the sync loop should run independently. This is convenient in long-running applications, but it also means operation processing happens in another thread. The outbox store and transport should be safe for the way they are used.

For documentation examples, `tick()` is usually better because it shows the workflow directly. For production application structure, either approach can be valid depending on how the application manages background work.

## Threading notes

`start()` and `stop()` manage the internal background thread. Calling `start()` when the engine is already running has no effect. Calling `stop()` when it is not running also has no effect.

Avoid calling `tick()` concurrently with the engine background loop. If the engine is running with `start()`, let the engine thread drive ticks. If another part of the application wants deterministic control, keep the engine stopped and call `tick()` manually.

The engine shares the same outbox, probe, and transport across workers. The default file outbox store protects its internal state with a mutex, but a custom store or custom transport should be designed with the intended worker count in mind.

## Common mistakes

Do not enqueue an operation and expect it to be sent automatically unless the engine is running. An operation becomes ready work in the outbox, but delivery happens only when `tick()` runs or the background loop is started.

Do not use multiple workers with a transport that is not safe for concurrent calls. The engine may create several workers, and each worker can call the shared transport during its tick.

Do not use the engine as the place to encode application protocol rules. Put protocol-specific delivery behavior in the transport, and keep the operation payload meaningful to the application.

Do not forget idempotency when enabling recovery and retries. The engine may attempt the same logical operation again after a retryable failure or an in-flight timeout.

## Next step

Continue with in-flight recovery to understand how the module handles operations that were claimed but not completed.

```md id="pnftc5"
[In-flight Recovery](./inflight-recovery.md)
```
