# Transports

A transport is the boundary between the `sync` module and the system that receives an operation. The outbox and engine know how to store, claim, retry, and complete operations, but they do not decide how an operation is sent over the network. That responsibility belongs to an implementation of `ISyncTransport`.

This separation keeps the sync module focused on durable operation flow. An application can send operations with HTTP, WebSocket, P2P, an edge relay, or another delivery mechanism without changing the outbox model. The worker only needs a result that says whether delivery succeeded and whether a failure should be retried.

## Header

Use the public sync header:

```cpp id="dkm8yw"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="aaoqcz"
#include <vix/print.hpp>
```

## Transport interface

A transport implements one method:

```cpp id="vc2e2i"
class ISyncTransport
{
public:
  virtual ~ISyncTransport() = default;

  virtual vix::sync::engine::SendResult send(
    const vix::sync::Operation &op
  ) = 0;
};
```

The sync worker calls `send()` after it has selected and claimed an operation from the outbox. The transport receives the operation as application data: `kind`, `target`, `payload`, `idempotency_key`, and the rest of its metadata. It then performs the real delivery work and returns a `SendResult`.

## Send result

`SendResult` tells the worker what happened.

```cpp id="of65pd"
struct SendResult
{
  bool ok{false};
  bool retryable{true};
  std::string error;
};
```

When `ok` is true, the worker marks the operation as complete. When `ok` is false and `retryable` is true, the worker reports a retryable failure to the outbox. When `ok` is false and `retryable` is false, the operation is marked as permanently failed.

The `error` field is stored as diagnostic information when delivery fails. It should be short enough to inspect in the outbox file, but specific enough to explain the failure.

## A minimal transport

The smallest useful transport can print the operation and return success.

```cpp id="qw46wv"
#include <vix/print.hpp>
#include <vix/sync.hpp>

class DemoTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
  {
    vix::print("send", op.kind, "to", op.target);
    vix::print("payload", op.payload);

    return {
      .ok = true,
      .retryable = false,
      .error = {}
    };
  }
};
```

This transport does not perform network I/O, but it shows the contract clearly. A real transport would replace the print calls with an HTTP request, a WebSocket frame, a P2P message, or another application-specific delivery step.

## Return a retryable failure

A retryable failure should be used when the operation may succeed later without changing the operation itself. Temporary network errors, service unavailability, timeouts, and transient remote failures usually belong in this category.

```cpp id="tj5rhe"
vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
{
  vix::print("temporary failure while sending", op.id);

  return {
    .ok = false,
    .retryable = true,
    .error = "temporary network error"
  };
}
```

The worker records the error and lets the outbox schedule the next retry using its `RetryPolicy`. The operation remains durable and can be selected again when its retry time arrives.

## Return a permanent failure

A permanent failure should be used when retrying the same operation would repeat the same error. Invalid payloads, unsupported operation kinds, authorization failures that require user action, or remote validation errors often belong here.

```cpp id="fehfxs"
vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
{
  if (op.payload.empty())
  {
    return {
      .ok = false,
      .retryable = false,
      .error = "empty payload"
    };
  }

  return {
    .ok = true,
    .retryable = false,
    .error = {}
  };
}
```

A permanently failed operation is kept in the store for inspection, but it is not returned again as ready work. This prevents a malformed operation from staying in the retry loop forever.

## Use operation kind and target

The transport can use `kind` and `target` to decide how to deliver an operation.

```cpp id="wsn9ll"
#include <vix/print.hpp>
#include <vix/sync.hpp>

class RoutingTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
  {
    if (op.kind == "message.send")
    {
      vix::print("sending message to", op.target);

      return {
        .ok = true,
        .retryable = false,
        .error = {}
      };
    }

    if (op.kind == "audit.write")
    {
      vix::print("writing audit event to", op.target);

      return {
        .ok = true,
        .retryable = false,
        .error = {}
      };
    }

    return {
      .ok = false,
      .retryable = false,
      .error = "unsupported operation kind"
    };
  }
};
```

This pattern is useful when one sync engine handles several kinds of application work. The operation remains small, while the transport owns the protocol-specific mapping.

## Use idempotency keys

A transport should forward the operation idempotency key when the remote side supports deduplication. This is important because a retryable operation may be delivered more than once, especially after a timeout or process restart.

```cpp id="fbq8xs"
vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
{
  vix::print("target", op.target);
  vix::print("idempotency key", op.idempotency_key);
  vix::print("payload", op.payload);

  return {
    .ok = true,
    .retryable = false,
    .error = {}
  };
}
```

In an HTTP transport, the idempotency key might become a request header. In a P2P transport, it might be part of the message envelope. The exact representation belongs to the transport and the receiving system.

## Complete example with an engine

This example creates a custom transport, enqueues one operation, and lets the engine process it with a manual tick.

```cpp id="it7c1d"
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

class MessageTransport final : public vix::sync::engine::ISyncTransport
{
public:
  vix::sync::engine::SendResult send(const vix::sync::Operation &op) override
  {
    if (op.kind != "message.send")
    {
      return {
        .ok = false,
        .retryable = false,
        .error = "unsupported operation kind"
      };
    }

    vix::print("delivering message");
    vix::print("target", op.target);
    vix::print("idempotency", op.idempotency_key);
    vix::print("payload", op.payload);

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

  const std::filesystem::path dir = "./.vix_transport_example";

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
      .owner = "transport-example"
    },
    store
  );

  auto probe = std::make_shared<vix::net::NetworkProbe>(
    vix::net::NetworkProbe::Config{},
    [] {
      return true;
    }
  );

  auto transport = std::make_shared<MessageTransport>();

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
  op.payload = R"({"conversation_id":"c1","text":"hello"})";
  op.idempotency_key = "message-c1-001";

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

```txt id="b86w1j"
delivering message
target /api/messages
idempotency message-c1-001
payload {"conversation_id":"c1","text":"hello"}
processed operations 1
final status Done
```

The example uses a manual tick so the result is deterministic. In a long-running application, the same transport can be passed to a background `SyncEngine`.

## Transport and network probing

The transport is not responsible for deciding whether the application is online. That decision belongs to the worker through `vix::net::NetworkProbe`. When the probe reports offline, the worker does not call the transport and the operation remains in the outbox.

This keeps the transport focused on delivery. It may still detect protocol-level errors during a send attempt, but general online/offline gating is handled before the transport is called.

## Transport ownership

A transport should avoid mutating the outbox directly. The normal flow is that the worker calls `send()`, receives a `SendResult`, and updates the outbox based on that result. This keeps lifecycle transitions in one place and makes the operation state easier to reason about.

A transport may keep its own client object, connection pool, authentication state, or peer handle. Those details are outside the sync module. The only required contract is the `send()` result.

## Common mistakes

Do not hide retry decisions inside the transport. The transport should report whether a failure is retryable, but the outbox should schedule the retry.

Do not treat every remote error as retryable. Retrying an invalid payload will only create noise in the outbox. Return a permanent failure when the operation itself must be changed before it can succeed.

Do not ignore idempotency keys. A durable outbox can send the same logical operation more than once, so the receiving side should have a way to recognize repeated attempts.

Do not perform outbox completion inside `send()`. Return `ok = true` and let the worker mark the operation as done.

## Next step

Continue with the sync engine to see how workers use the outbox, network probe, and transport together.

```md id="lz0ir9"
[Sync Engine](./sync-engine.md)
```
