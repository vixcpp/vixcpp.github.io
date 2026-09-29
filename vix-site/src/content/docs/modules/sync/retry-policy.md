# Retry Policy

`RetryPolicy` defines how the sync outbox schedules retryable failures. When an operation cannot be delivered because of a temporary error, the outbox needs a predictable way to decide when that operation should become eligible again. The retry policy provides that timing rule.

Retry is an important part of the offline-first model because failure is not always final. A network timeout, a temporary remote error, or a short loss of connectivity can be handled by keeping the operation in the outbox and trying again later. The policy keeps that behavior explicit instead of scattering retry delays across transport code.

## Header

Use the public sync header:

```cpp id="c4i4vb"
#include <vix/sync.hpp>
```

For examples that print output:

```cpp id="eeyryi"
#include <vix/print.hpp>
```

## Default policy

A default `RetryPolicy` uses exponential backoff. The first retry uses the base delay, then each later attempt grows by the configured factor until the delay reaches the maximum.

```cpp id="hiakp9"
#include <cstdint>

#include <vix/print.hpp>
#include <vix/sync.hpp>

int main()
{
  vix::sync::RetryPolicy retry;

  for (std::uint32_t attempt = 0; attempt < 6; ++attempt)
  {
    vix::print(
      "attempt",
      attempt,
      "delay_ms",
      retry.compute_delay_ms(attempt)
    );
  }

  return 0;
}
```

Output shape:

```txt id="v3v8ql"
attempt 0 delay_ms 500
attempt 1 delay_ms 1000
attempt 2 delay_ms 2000
attempt 3 delay_ms 4000
attempt 4 delay_ms 8000
attempt 5 delay_ms 16000
```

The exact values come from the default configuration: a base delay of `500` milliseconds, a factor of `2.0`, and a maximum delay of `30'000` milliseconds.

## Configure retry timing

A retry policy is a small value object. You can configure it before passing it to the outbox.

```cpp id="x9eknt"
vix::sync::RetryPolicy retry;

retry.max_attempts = 8;
retry.base_delay_ms = 1'000;
retry.max_delay_ms = 60'000;
retry.factor = 2.0;
retry.jitter_ratio = 0.2;
```

The policy is intentionally simple. It does not perform I/O, does not inspect the transport, and does not mutate operation state by itself. It only answers two questions: whether another retry is allowed for an attempt count, and how long the next delay should be.

## Use a policy with an outbox

The outbox owns retry decisions for stored operations. When a retryable failure is reported through `Outbox::fail()`, the outbox uses the configured policy to compute the next retry time.

```cpp id="l3k3mp"
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
      .file_path = "./.vix/retry-outbox.json",
      .pretty_json = true
    }
  );

  RetryPolicy retry;
  retry.max_attempts = 5;
  retry.base_delay_ms = 1'000;
  retry.max_delay_ms = 30'000;
  retry.factor = 2.0;

  Outbox outbox(
    Outbox::Config{
      .owner = "retry-example",
      .retry = retry
    },
    store
  );

  Operation op;
  op.kind = "message.send";
  op.target = "/api/messages";
  op.payload = R"({"text":"retry if needed"})";
  op.idempotency_key = "message-retry-demo";

  const auto t0 = now_ms();
  const auto id = outbox.enqueue(op, t0);

  if (outbox.claim(id, t0))
  {
    outbox.fail(
      id,
      "temporary network error",
      t0,
      true
    );
  }

  auto saved = store->get(id);

  if (saved)
  {
    vix::print("status is failed", saved->is_failed());
    vix::print("next retry at", saved->next_retry_at_ms);
  }

  return 0;
}
```

The operation stays in the outbox after a retryable failure. It is not ready again until its `next_retry_at_ms` is less than or equal to the time passed to `peek_ready()` or to the engine tick.

## Retryable and permanent failures

A retry policy only applies to failures that are still worth retrying. The transport decides this by returning a `SendResult` with `retryable = true` or `retryable = false`.

A temporary network error is usually retryable:

```cpp id="z8anjd"
return {
  .ok = false,
  .retryable = true,
  .error = "temporary network error"
};
```

An invalid payload is usually permanent:

```cpp id="spwbr5"
return {
  .ok = false,
  .retryable = false,
  .error = "invalid payload"
};
```

This distinction matters because retrying the wrong failure can hide real application errors. A timeout should usually remain in the queue. A malformed operation should be marked permanently failed so it can be inspected and fixed.

## Delay calculation

`compute_delay_ms()` grows the delay exponentially and clamps it to the configured maximum.

```cpp id="ivfekq"
vix::sync::RetryPolicy retry;

retry.base_delay_ms = 250;
retry.factor = 3.0;
retry.max_delay_ms = 5'000;

vix::print("attempt 0", retry.compute_delay_ms(0));
vix::print("attempt 1", retry.compute_delay_ms(1));
vix::print("attempt 2", retry.compute_delay_ms(2));
vix::print("attempt 3", retry.compute_delay_ms(3));
```

Output shape:

```txt id="dqq0f9"
attempt 0 250
attempt 1 750
attempt 2 2250
attempt 3 5000
```

The last value is clamped to `max_delay_ms`. This prevents long-running failures from producing retry delays that grow without a practical upper bound.

## Retry limits

`can_retry()` checks whether another retry is allowed for the given attempt count.

```cpp id="m06tm6"
#include <cstdint>

#include <vix/print.hpp>
#include <vix/sync.hpp>

int main()
{
  vix::sync::RetryPolicy retry;
  retry.max_attempts = 3;

  for (std::uint32_t attempt = 0; attempt < 5; ++attempt)
  {
    vix::print(
      "attempt",
      attempt,
      "can_retry",
      retry.can_retry(attempt)
    );
  }

  return 0;
}
```

Output shape:

```txt id="g5rfvi"
attempt 0 can_retry true
attempt 1 can_retry true
attempt 2 can_retry true
attempt 3 can_retry false
attempt 4 can_retry false
```

The attempt count is zero-based. With `max_attempts = 3`, attempts `0`, `1`, and `2` are still allowed. Attempt `3` is outside the retry window.

## Jitter

`RetryPolicy` includes `jitter_ratio`, but the policy itself does not apply randomness when computing a delay. `compute_delay_ms()` is deterministic.

This is useful for durable systems because the same attempt count and policy produce the same delay. When an application wants jitter, it should apply it in the higher-level scheduling logic where randomness can be controlled, tested, and recorded if necessary.

```cpp id="k25i3w"
vix::sync::RetryPolicy retry;

retry.jitter_ratio = 0.2;

const auto deterministic_delay = retry.compute_delay_ms(2);

vix::print("base retry delay", deterministic_delay);
```

The configured ratio still communicates the intended jitter window to higher-level code, but it should not be read as meaning that `compute_delay_ms()` randomizes the value.

## Choosing retry values

Start with conservative values. A short base delay makes the first retry responsive, while a maximum delay prevents persistent failures from creating constant pressure on the remote service. For many application workflows, a base delay between `500` and `2'000` milliseconds and a maximum delay between `30'000` and `120'000` milliseconds is a reasonable starting point.

The right values depend on the operation. A chat message may retry sooner than a heavy background export. A remote API that rate-limits aggressively may need longer delays. The important decision is to make retry behavior visible in the outbox configuration rather than burying it inside each transport implementation.

## Common mistakes

Do not retry every failure. Some failures are useful signals that the operation itself is invalid. Mark those failures as non-retryable so the outbox can stop selecting them.

Do not use extremely small retry delays for a long-running background queue. A failing remote service can cause the application to keep waking up and sending work that has no chance of succeeding yet.

Do not depend on jitter being applied by `compute_delay_ms()`. The policy exposes a jitter ratio, but the deterministic delay function does not randomize its result.

Do not choose retry settings without considering idempotency. A retryable operation may be delivered more than once, especially after a timeout or process restart. The remote side should use the operation idempotency key to deduplicate repeated attempts.

## Next step

Continue with transports to see how the sync module delegates real network delivery to an application-defined `ISyncTransport`.

```md id="f9j2zd"
[Transports](./transports.md)
```
