# Offline-first Model

The offline-first model used by the `sync` module starts from a practical constraint: network delivery is not a reliable place to store application intent. A request can fail because the device is offline, because the remote service is temporarily unavailable, because the process stops during delivery, or because the connection changes while the application is already doing useful work.

The module addresses this by separating intent from delivery. The application records what should happen as a durable `Operation`, then the sync loop tries to deliver that operation when it can. This makes the local record the first source of truth for pending work, while the network becomes a delivery step that may succeed now or later.

## Record first, deliver later

In a direct network workflow, application code often builds a request and sends it immediately. If the request fails, the application must decide at that exact moment whether to retry, report an error, or reconstruct the request later. That becomes difficult when the operation was part of a larger local workflow.

With the `sync` module, the application first writes the operation to an `Outbox`. Once the operation is persisted, the application can move forward knowing that the work has not been lost. A worker can later claim the operation, send it through a transport, and update its state.

```cpp id="zdtdzm"
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
      .owner = "local-app"
    },
    store
  );

  Operation op;
  op.kind = "http.post";
  op.target = "/api/messages";
  op.payload = R"({"text":"created while offline"})";

  const auto id = outbox.enqueue(op, now_ms());

  vix::print("operation stored locally", id);

  return 0;
}
```

This program does not need the network to preserve the operation. The outbox file becomes the durable place where pending work is stored until a sync worker is able to process it.

## Connectivity is a condition, not the owner of the workflow

Offline-first does not mean that an application ignores the network. It means the application does not make the network the only place where important work exists. The network is still used, but it is checked at the boundary where workers attempt delivery.

The `SyncWorker` uses `vix::net::NetworkProbe` before sending operations. If the probe reports that the application is offline, ready operations remain in the outbox. They can be attempted again on a later tick.

```cpp id="dttwsj"
auto offline_probe = std::make_shared<vix::net::NetworkProbe>(
  vix::net::NetworkProbe::Config{},
  [] {
    return false;
  }
);
```

A probe like this causes the engine to leave pending operations untouched. The operation is not considered failed simply because the application is currently offline. It remains durable local work waiting for a better moment.

## Operation state makes recovery explicit

The offline-first model depends on visible state. An operation can be `Pending`, `InFlight`, `Done`, `Failed`, or `PermanentFailed`. These states are stored with the operation, so the sync loop can reason about what happened before the current tick.

`Pending` means the operation exists and has not been claimed by a worker. `InFlight` means a worker claimed it and started processing it. `Done` means the transport accepted it. `Failed` means delivery did not succeed, but retrying may still be useful. `PermanentFailed` means the transport reported a failure that should not be retried.

This state is important after a restart. If a process stops while an operation is in-flight, the next run should not leave that operation locked forever. The module provides an in-flight timeout path so old claimed operations can be requeued and attempted again.

## Retry belongs to the queue

Retry logic is often easier to reason about when it belongs to the durable queue rather than to scattered network call sites. The `RetryPolicy` attached to the outbox computes when a retryable failure should become eligible again.

```cpp id="i6bqfi"
vix::sync::RetryPolicy retry;
retry.max_attempts = 8;
retry.base_delay_ms = 500;
retry.max_delay_ms = 30'000;
retry.factor = 2.0;

auto outbox = std::make_shared<vix::sync::outbox::Outbox>(
  vix::sync::outbox::Outbox::Config{
    .owner = "sync-worker",
    .retry = retry
  },
  store
);
```

The practical result is that a temporary failure does not have to be handled by rebuilding the operation from application memory. The operation already exists, the last error can be recorded, and the next retry time can be persisted.

## Idempotency matters

A durable sync system may send the same operation more than once. This can happen after a timeout, a process restart, or a retryable failure where the local application did not receive a final answer. For that reason, each operation carries an `idempotency_key`.

The key gives the remote side a stable value it can use to deduplicate repeated delivery attempts. The `Outbox` can generate this key automatically when it is missing, but applications that already have a domain-specific idempotency key can provide their own.

```cpp id="3md7z8"
vix::sync::Operation op;
op.kind = "order.create";
op.target = "/api/orders";
op.payload = R"({"cart_id":"cart_42"})";
op.idempotency_key = "order-from-cart-42";
```

This keeps retry behavior safer because the same logical operation has the same deduplication identity across delivery attempts.

## Where this model fits

The offline-first model is useful when an application can safely describe work as operations. Good examples include sending queued messages, pushing local mutations, writing audit events to a remote service, notifying another system, or forwarding work to a peer.

The model works best when the remote side can accept idempotent operations. If the remote endpoint cannot deduplicate retries, the application must design the payload and target carefully before relying on automatic retry.

## A simple offline tick

The following example shows the shape of an offline tick. The operation is stored, the engine runs once, and the operation remains pending because the probe reports that the network is unavailable.

```cpp id="efqr8u"
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

class NoopTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &) override
  {
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

  auto store = std::make_shared<FileOutboxStore>(
    FileOutboxStore::Config{
      .file_path = "./.vix/offline-outbox.json",
      .pretty_json = true
    }
  );

  auto outbox = std::make_shared<Outbox>(
    Outbox::Config{
      .owner = "offline-example"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return false;
    }
  );

  auto transport = std::make_shared<NoopTransport>();

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
  op.payload = R"({"text":"wait for network"})";

  const auto id = outbox->enqueue(op, now_ms());

  const auto processed = engine.tick(now_ms());

  auto saved = store->get(id);

  vix::print("processed operations", processed);

  if (saved)
  {
    vix::print("operation is still pending", saved->is_pending());
  }

  return 0;
}
```

The transport exists in this example, but it is not called while the probe reports offline. That distinction is the point of the model: pending work stays local until the delivery boundary is ready.

## Design boundary

The `sync` module gives the application a durable operation pipeline. It does not decide the domain meaning of an operation, the remote API contract, or the conflict resolution rules of a distributed data model. Those choices belong to the application and the transport layer.

This boundary keeps the module focused. It provides the mechanics needed to persist, claim, retry, complete, and recover operations. The application remains responsible for designing operations that can be delivered safely.

## Next step

Continue with operations to understand the fields stored in `vix::sync::Operation` and how they describe both the intent and the lifecycle of sync work.

```md id="g5nmbr"
[Operations](./operations.md)
```
