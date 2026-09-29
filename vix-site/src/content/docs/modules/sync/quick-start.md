# Quick Start

This page shows the smallest useful workflow with the `sync` module: create an operation, persist it in an outbox, send it through a transport, and inspect the final state.

The example uses a manual `tick()` instead of a background thread. That makes the synchronization flow easier to understand because the program controls exactly when the engine processes the outbox.

## Create a small sync program

Create a file such as `main.cpp`:

```cpp id="bfb3de"
#include <chrono>
#include <cstdint>
#include <filesystem>
#include <memory>
#include <string>

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
    vix::print("sending operation", op.id);
    vix::print("kind:", op.kind);
    vix::print("target:", op.target);
    vix::print("payload:", op.payload);

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

  const std::filesystem::path dir = "./.vix_sync_quick_start";

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
      .owner = "quick-start"
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
  op.kind = "http.post";
  op.target = "/api/messages";
  op.payload = R"({"text":"hello from the outbox"})";

  const auto id = outbox->enqueue(op, now_ms());

  vix::print("queued operation", id);

  const auto processed = engine.tick(now_ms());

  vix::print("processed operations", processed);

  auto saved = store->get(id);

  if (saved)
  {
    vix::print("final status", status_name(saved->status));
  }

  return 0;
}
```

## What happens in the example

The program starts by creating a file-backed outbox store. The store writes operations to `./.vix_sync_quick_start/outbox.json`, which makes the result easy to inspect after the program runs.

The application then creates an `Outbox` on top of that store. This is the object application code normally uses to enqueue work. The operation is not sent directly when `enqueue()` is called. It is first persisted locally with its metadata, status, timestamps, and idempotency key.

The `NetworkProbe` in this example always reports that the network is available. In a real application, the probe can represent actual connectivity checks, but the quick start keeps it predictable so the first run focuses on the sync flow itself.

`DemoTransport` is the delivery boundary. It implements `ISyncTransport` and returns a successful `SendResult`. The sync module does not need to know whether a real application uses HTTP, WebSocket, P2P, or another protocol. It only needs the transport to report whether the operation was accepted and whether a failure should be retried.

Finally, the program calls `engine.tick(now_ms())`. One tick asks the worker to look for ready operations, claim them, send them through the transport, and update their status. Because the transport succeeds, the operation ends as `Done`.

## Expected output

The exact operation id is generated at runtime, so the value will be different on each run.

```txt id="80h9c7"
queued operation op_1804289383
sending operation op_1804289383
kind: http.post
target: /api/messages
payload: {"text":"hello from the outbox"}
processed operations 1
final status Done
```

The important part is the final status. It shows that the operation moved from a queued local record to a completed operation after the engine tick.

## Inspect the outbox file

After running the program, open the generated file:

```bash id="amszld"
cat ./.vix_sync_quick_start/outbox.json
```

The file contains the stored operation and its final state. With `pretty_json = true`, the file is readable enough for local debugging and tests.

```json id="e6vfw5"
{
  "version": 1,
  "ops": {
    "op_1804289383": {
      "id": "op_1804289383",
      "kind": "http.post",
      "target": "/api/messages",
      "payload": "{\"text\":\"hello from the outbox\"}",
      "idempotency_key": "idem_846930886",
      "created_at_ms": 123456789,
      "updated_at_ms": 123456789,
      "attempt": 0,
      "next_retry_at_ms": 123456789,
      "status": 2,
      "last_error": ""
    }
  },
  "owners": {}
}
```

The numeric status is the serialized form of `OperationStatus`. In this example, `Done` is stored as `2`.

## Try a retryable failure

To see retry behavior, change the transport result:

```cpp id="t5dh8z"
return {
  .ok = false,
  .retryable = true,
  .error = "temporary network error"
};
```

With this result, the worker marks the operation as `Failed` and schedules a later retry based on the configured `RetryPolicy`. The operation remains in the outbox instead of being discarded, which is the core behavior expected from an offline-first sync queue.

## Try a permanent failure

A permanent failure is used when retrying would not help, for example when the remote side rejects the operation because the payload is invalid.

```cpp id="12d0mn"
return {
  .ok = false,
  .retryable = false,
  .error = "invalid payload"
};
```

In that case, the operation is marked as `PermanentFailed` and is not selected again by `peek_ready()`.

## Run the engine in the background

The quick start uses `tick()` because it is the clearest way to understand the workflow. When an application wants the sync loop to run by itself, it can start the engine in a background thread:

```cpp id="lypt3j"
engine.start();

// The application continues doing other work.

engine.stop();
```

The engine owns the thread started by `start()`, and `stop()` requests shutdown and joins it. For tests, examples, and deterministic integrations, prefer manual ticks.

## Next step

Continue with the offline-first model to understand why the module persists operations before delivery and how that changes the structure of application code.

```md id="s2y89k"
[Offline-first Model](./offline-first-model.md)
```
