# Operations

An `Operation` is the durable unit of work handled by the `sync` module. It describes something the application wants to deliver later, together with enough state to know whether that work is still pending, currently being processed, completed, retryable, or permanently failed.

The important point is that an operation is not only a network request. It is a local record of intent. The application writes that intent into an outbox first, then the sync engine can attempt delivery through a transport. This gives the application a stable local object to inspect, retry, recover, and diagnose when the network is not reliable.

## Header

Use the public sync header:

```cpp id="rrfg5x"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="koog0x"
#include <vix/print.hpp>
```

## Create an operation

A minimal operation usually needs a `kind`, a `target`, and a `payload`.

```cpp id="4ohqml"
#include <vix/sync.hpp>

int main()
{
  vix::sync::Operation op;

  op.kind = "http.post";
  op.target = "/api/messages";
  op.payload = R"({"text":"hello from sync"})";

  return 0;
}
```

The `kind` gives the operation a logical category. The `target` tells the transport where the operation should go. The `payload` is intentionally stored as an opaque string, because the sync module should not need to understand the application protocol. A transport can interpret the payload as JSON, a serialized command, a P2P message, or another application-defined format.

## Operation identity

Each operation has an `id` and an `idempotency_key`.

```cpp id="3lmgp7"
vix::sync::Operation op;

op.id = "op-message-42";
op.idempotency_key = "message-42";
op.kind = "http.post";
op.target = "/api/messages";
op.payload = R"({"id":42,"text":"hello"})";
```

The `id` identifies the local outbox record. The `idempotency_key` identifies the logical delivery attempt from the point of view of the remote side. These two values often look similar in small examples, but they solve different problems. The local id helps the outbox claim, update, and inspect a record. The idempotency key helps the receiver deduplicate repeated deliveries of the same logical operation.

When an operation is enqueued through `Outbox`, missing ids and idempotency keys can be generated automatically depending on the outbox configuration. For application workflows that already have a stable domain identity, such as an order id, message id, or mutation id, it is better to provide an idempotency key explicitly.

## Payloads

The payload is a string because the operation layer is deliberately protocol-neutral.

```cpp id="jz14e5"
vix::sync::Operation op;

op.kind = "order.create";
op.target = "/api/orders";
op.payload = R"({
  "cart_id": "cart_42",
  "currency": "USD",
  "total": 120
})";
```

The sync module stores and passes this value without parsing it. That keeps the operation model small and lets each transport decide how to encode, sign, compress, or send the payload. A backend transport might send it as an HTTP body, while a peer transport might wrap it in a custom message envelope.

## Status

An operation moves through a small lifecycle represented by `OperationStatus`.

```cpp id="balpr8"
enum class OperationStatus : std::uint8_t
{
  Pending = 0,
  InFlight,
  Done,
  Failed,
  PermanentFailed
};
```

`Pending` means the operation is stored and waiting to be processed. `InFlight` means a worker has claimed it and is currently attempting delivery. `Done` means the operation completed successfully. `Failed` means the last attempt failed but the operation may be retried later. `PermanentFailed` means the failure should not be retried.

In normal application code, status changes are handled by the outbox and the engine. You usually create an operation, enqueue it, and let the worker update the status after the transport returns a result.

## Inspect a status

For simple diagnostics, an application can inspect the stored operation after a tick.

```cpp id="wdu9k7"
#include <vix/print.hpp>
#include <vix/sync.hpp>

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
  vix::sync::Operation op;

  op.kind = "http.post";
  op.target = "/api/messages";
  op.payload = R"({"text":"hello"})";

  vix::print("initial status", status_name(op.status));

  op.done(1000);

  vix::print("final status", status_name(op.status));

  return 0;
}
```

Output shape:

```txt id="70fd2y"
initial status Pending
final status Done
```

This example calls `done()` directly only to show the state transition on the value itself. In the full sync workflow, completion should normally be recorded through `Outbox::complete()` so the store is updated durably.

## Timestamps

An operation stores three time-related values:

| Field              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `created_at_ms`    | Time when the operation was first created or queued. |
| `updated_at_ms`    | Time when the operation state was last changed.      |
| `next_retry_at_ms` | Time when the operation becomes eligible for retry.  |

The module expects these values to be expressed in milliseconds. The examples usually use a monotonic clock for local scheduling:

```cpp id="xey9g6"
#include <chrono>
#include <cstdint>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
    steady_clock::now().time_since_epoch()
  ).count();
}
```

When an operation is enqueued through `Outbox`, missing timestamps are filled from the `now_ms` value passed to `enqueue()`. This keeps time handling explicit and makes tests easier because the caller can control the current time.

## Attempts and retry state

The `attempt` field records how many delivery attempts have been made. After a retryable failure, the outbox uses `RetryPolicy` to compute a future `next_retry_at_ms`. Until that time is reached, `peek_ready()` should not return the operation as ready for processing.

```cpp id="t8a6jp"
vix::sync::Operation op;

op.kind = "http.post";
op.target = "/api/messages";
op.payload = R"({"text":"retry later"})";
op.attempt = 1;
op.next_retry_at_ms = 5000;
op.status = vix::sync::OperationStatus::Failed;
op.last_error = "temporary network error";
```

Application code rarely needs to set these fields manually. They are part of the durable lifecycle that lets the outbox and workers make safe retry decisions.

## Helper methods

`Operation` includes small helper methods for common state checks and direct state transitions.

```cpp id="5srx9u"
vix::sync::Operation op;

if (op.is_pending())
{
  op.fail("temporary failure", 1000);
}

if (op.is_failed())
{
  op.done(2000);
}
```

These helpers are useful for tests and small local transformations. In the normal outbox workflow, prefer the outbox methods because they update the persistent store:

```cpp id="esxk8d"
outbox->complete(id, now_ms);
outbox->fail(id, "temporary failure", now_ms, true);
```

The operation object holds the state, but the outbox is responsible for making that state durable.

## Field overview

The operation structure is intentionally small. It stores the minimum information needed by the outbox, the worker, and the transport.

| Field              | Meaning                                                        |
| ------------------ | -------------------------------------------------------------- |
| `id`               | Local identifier used by the outbox store.                     |
| `kind`             | Logical operation type, such as `http.post` or `order.create`. |
| `target`           | Destination understood by the transport.                       |
| `payload`          | Opaque operation data.                                         |
| `idempotency_key`  | Stable key used to deduplicate repeated delivery attempts.     |
| `created_at_ms`    | Creation time in milliseconds.                                 |
| `updated_at_ms`    | Last update time in milliseconds.                              |
| `attempt`          | Number of delivery attempts already made.                      |
| `next_retry_at_ms` | Next time the operation may be retried.                        |
| `status`           | Current lifecycle status.                                      |
| `last_error`       | Last recorded error message.                                   |

This table is useful as a reference, but most application code should not fill every field manually. A common application operation only sets `kind`, `target`, `payload`, and sometimes an explicit `idempotency_key`. The outbox fills or updates the operational fields as the sync lifecycle moves forward.

## Designing operation kinds

Use operation kinds that describe intent rather than implementation details that may change later. For example, `message.send`, `order.create`, or `profile.update` are usually clearer than names tied to one temporary endpoint.

```cpp id="jg261q"
vix::sync::Operation op;

op.kind = "message.send";
op.target = "/api/messages";
op.payload = R"({"conversation_id":"c1","text":"hello"})";
```

The transport can still map this operation to an HTTP request, but the operation itself remains understandable as application work. This matters when inspecting the outbox file or debugging a failure after a restart.

## Common mistakes

Avoid using a random payload without a stable idempotency strategy when the operation can be retried. If the remote side creates something new on every request, repeated delivery can create duplicates. Give the operation a stable idempotency key and make sure the receiver knows how to use it.

Avoid updating a stored operation only in memory after it has been enqueued. Once an operation belongs to an outbox store, state changes should go through `Outbox` or `OutboxStore` so the persisted copy remains correct.

Avoid putting transport-only behavior into the operation model. The operation should describe what needs to be delivered. The transport should decide how to deliver it.

## Next step

Continue with the outbox page to see how operations are persisted, claimed, completed, and failed through the durable queue.

```md id="qj0san"
[Outbox](./outbox.md)
```
