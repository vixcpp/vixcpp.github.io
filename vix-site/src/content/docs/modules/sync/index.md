# Sync

The `sync` module provides offline-first synchronization primitives for Vix applications. It gives an application a durable way to record work locally before attempting network delivery, so temporary network failures do not immediately become lost application state.

This module is built around a simple idea: an application should be able to create an operation, persist it, and let a synchronization loop deliver it when the environment is ready. The operation may succeed immediately, fail and be retried later, or be marked as permanently failed when the transport reports that retrying would not help. This keeps the network edge of an application explicit without forcing the application code to handle every retry and recovery detail directly.

`sync` is especially useful when a Vix application needs to keep accepting local work while connectivity is unstable. A backend service can queue outbound messages, a local-first application can store mutations before sending them to a server, and a peer-oriented system can keep durable work pending until a transport becomes available. The module does not require a specific protocol. HTTP, WebSocket, P2P, or another delivery layer can be connected through the transport interface.

## Header

Use the public module header in normal application code:

```cpp
#include <vix/sync.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Mental model

The central unit in the module is an `Operation`. It describes the work that must eventually be delivered: its kind, target, payload, idempotency key, timestamps, retry state, and current status.

An application usually does not send an operation directly. It first enqueues the operation in an `Outbox`. The outbox persists it through an `OutboxStore`, then the sync engine asks workers to claim ready operations and send them through an `ISyncTransport`. The transport is responsible for the actual I/O. The worker only needs to know whether delivery succeeded, whether a failure is retryable, and what error message should be recorded.

This separation is important because the synchronization loop is not the same thing as the network protocol. The module manages durable operation state, retry timing, ownership, and recovery of stuck in-flight work. The transport decides how an operation is delivered to the outside world.

## Basic workflow

A typical sync workflow has four steps. The application creates an operation, stores it in an outbox, provides a transport, then lets the engine process ready operations.

```cpp
#include <chrono>
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

class LocalTransport final : public vix::sync::engine::ISyncTransport
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
  using namespace vix::sync::outbox;
  using namespace vix::sync::engine;

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = "./.vix/outbox.json",
      .pretty_json = true
    }
  );

  auto outbox = std::make_shared<Outbox>(
    Outbox::Config{
      .owner = "app-sync"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return true;
    }
  );

  auto transport = std::make_shared<LocalTransport>();

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
  op.payload = R"({"text":"hello from sync"})";

  const auto id = outbox->enqueue(op, now_ms());

  vix::print("queued operation", id);

  const auto processed = engine.tick(now_ms());

  vix::print("processed operations", processed);

  return 0;
}
```

This example uses `tick()` directly so the control flow stays visible. In an application that wants the sync loop to run in the background, the same engine can be started with `start()` and later stopped with `stop()`.

## Main components

`Operation` is the durable description of one piece of work. It stores the operation kind, target, payload, idempotency key, retry metadata, timestamps, status, and last error.

`Outbox` is the high-level queue used by application code. It persists operations before delivery, claims operations before processing, records successful completion, and schedules retryable failures through a retry policy.

`OutboxStore` is the storage contract behind the outbox. The default implementation, `FileOutboxStore`, stores operations in a JSON file and is suitable for simple local-first workflows, tests, and applications that need an inspectable durable queue.

`RetryPolicy` defines retry timing with exponential backoff. It gives the outbox a deterministic way to compute the next retry time after a retryable failure.

`ISyncTransport` is the boundary between the sync module and the outside world. A transport may send operations over HTTP, WebSocket, P2P, or another protocol, as long as it returns a `SendResult`.

`SyncWorker` processes ready operations from the outbox. It checks network availability, claims operations, sends them through the transport, and updates the outbox based on the result.

`SyncEngine` coordinates one or more workers. It can be driven manually with `tick()` or run in its own thread with `start()`.

`Wal` provides a lower-level write-ahead log primitive. It is useful when a system needs append-only records and replay, but it should be understood as a separate primitive from the JSON outbox pipeline.

## Operation lifecycle

A normal operation begins as `Pending`. When a worker claims it, the operation becomes `InFlight`. If delivery succeeds, it becomes `Done`. If delivery fails and the transport reports that the error is retryable, the operation becomes `Failed` and receives a future retry time. If the transport reports a non-retryable failure, the operation becomes `PermanentFailed`.

This lifecycle gives the application a durable view of what happened. Work is not only attempted; it is recorded. That makes retries, diagnostics, and recovery easier to reason about than a direct network call hidden inside business logic.

## Offline behavior

The engine uses `vix::net::NetworkProbe` to decide whether workers should attempt delivery. When the probe reports that the application is offline, workers leave pending operations in the outbox instead of sending them. The next tick can try again once the probe reports that the network is available.

The outbox also protects against operations that were claimed but never completed. This can happen if a process crashes or a worker stops while an operation is in-flight. During a worker tick, old in-flight operations can be requeued after the configured timeout so they are not left permanently stuck.

## Storage

The default store is file-backed:

```cpp
auto store = std::make_shared<vix::sync::outbox::FileOutboxStore>(
  vix::sync::outbox::FileOutboxStore::Config{
    .file_path = "./.vix/outbox.json",
    .pretty_json = true
  }
);
```

This store keeps the module easy to inspect while developing. The JSON file contains the persisted operations and ownership metadata used by the outbox. For applications with heavier concurrency or larger operation volumes, a custom `OutboxStore` can be implemented behind the same outbox contract.

## When to use this module

Use `sync` when local work must survive process restarts, temporary network failures, or delayed delivery. It fits workflows where the application can record intent now and deliver it later.

This is different from making a direct network request and hoping it succeeds. With `sync`, the operation becomes part of durable local state before the network attempt happens. That is the main design decision of the module, and it is what makes the rest of the workflow predictable.

## Next step

Continue with the quick start to build a small working example that enqueues one operation, sends it through a custom transport, and verifies the final operation status.

```md
[Quick Start](./quick-start.md)
```
