# Cache Context

`CacheContext` describes the runtime situation in which a cached entry is being evaluated. It tells the cache whether the application is online, offline, or handling a network failure.

This matters because the same cached entry can be valid in one situation and rejected in another. A stale response may be unacceptable during normal online operation, but still useful when the application is offline or when a network request failed. `CacheContext` gives the cache policy the missing runtime signal needed to make that decision.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the context type:

```cpp
#include <vix/cache/CacheContext.hpp>
```

## Structure

`CacheContext` contains two boolean signals:

```cpp
vix::cache::CacheContext ctx;

ctx.offline = false;
ctx.network_error = false;
```

| Field           | Purpose                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| `offline`       | Indicates that no network connectivity is available.                              |
| `network_error` | Indicates that a network request was attempted but failed because of the network. |

The default context represents normal online operation.

```cpp
vix::cache::CacheContext ctx{};
```

This is equivalent to:

```cpp
auto ctx = vix::cache::CacheContext::Online();
```

## Factory helpers

Use the named helpers instead of setting fields manually in normal application code.

```cpp
auto online = vix::cache::CacheContext::Online();
auto offline = vix::cache::CacheContext::Offline();
auto network_error = vix::cache::CacheContext::NetworkError();
```

These helpers make code easier to read because the cache decision is described in domain terms.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

This line clearly says that the caller is asking the cache whether the entry can be used while offline.

## Online context

Online context is used during normal operation.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

In online context, the cache serves fresh entries. If an entry is older than the policy TTL, the cache returns a miss unless another context allows stale reuse.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 1'000;
```

An entry with age `500` milliseconds is fresh:

```cpp
auto cached = cache.get(
    key,
    created_at + 500,
    vix::cache::CacheContext::Online());
```

An entry with age `5'000` milliseconds is expired for normal online use:

```cpp
auto cached = cache.get(
    key,
    created_at + 5'000,
    vix::cache::CacheContext::Online());
```

The caller can then fetch a fresh response and store a new entry.

## Offline context

Offline context is used when the application knows there is no network connectivity.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

A stale entry can be returned in offline context when the policy allows stale offline reuse.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 60'000;
```

With this policy, an entry that is older than the TTL can still be served while offline if its age is less than or equal to `60'000` milliseconds.

```cpp
auto cached = cache.get(
    key,
    created_at + 10'000,
    vix::cache::CacheContext::Offline());
```

This is useful for local-first applications where a previously validated response is better than no response at all.

## Network-error context

Network-error context is used after a network request was attempted and failed because of the network.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

This is different from offline context. Offline means the application already knows it cannot reach the network. Network error means the application tried to reach the network, but the request failed.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 30'000;
```

With this policy, an entry that is no longer fresh can still be served after a network error if its age is inside the error stale window.

```cpp
auto cached = cache.get(
    key,
    created_at + 5'000,
    vix::cache::CacheContext::NetworkError());
```

This gives the application a controlled fallback when a fresh response could not be fetched.

## Why context is passed to `get`

The context is passed to `Cache::get` because cache validity is not only a property of the entry. It also depends on the situation in which the entry is being used.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

The cache uses:

```text
entry.created_at_ms
current time
CachePolicy
CacheContext
```

Together, these values decide whether the entry is returned.

A fresh entry can be returned online. A stale entry may be returned offline. A stale entry may also be returned after a network error. An entry that is too old for the active policy is rejected.

## Complete example

This example stores one entry and reads it with three different contexts.

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 1'000;

  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;

  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"cached":true})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto online = cache.get(
      key,
      created_at + 500,
      vix::cache::CacheContext::Online());

  auto offline = cache.get(
      key,
      created_at + 4'000,
      vix::cache::CacheContext::Offline());

  auto network_error = cache.get(
      key,
      created_at + 4'000,
      vix::cache::CacheContext::NetworkError());

  auto too_old = cache.get(
      key,
      created_at + 20'000,
      vix::cache::CacheContext::Offline());

  vix::print("online:", online ? "hit" : "miss");
  vix::print("offline:", offline ? "hit" : "miss");
  vix::print("network error:", network_error ? "hit" : "miss");
  vix::print("too old:", too_old ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
online: hit
offline: hit
network error: hit
too old: miss
```

The same stored entry is evaluated differently depending on the context and the active policy.

## Context and policy

`CacheContext` does not decide by itself whether a stale entry can be used. It only describes the situation. `CachePolicy` defines what is allowed in that situation.

For offline reuse:

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

For network-error reuse:

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

Without the corresponding policy flag, the context is not enough to allow stale data.

```cpp
policy.allow_stale_if_offline = false;
```

In that configuration, an expired entry is rejected even when the context is offline.

## Manual context creation

The named helpers are preferred, but a context can also be created manually.

```cpp
vix::cache::CacheContext ctx;

ctx.offline = true;
ctx.network_error = false;
```

This is equivalent to:

```cpp
auto ctx = vix::cache::CacheContext::Offline();
```

Manual creation is useful when the application combines signals from different subsystems. For most code, the helper functions are clearer.

## Context from network state

The cache module can also build context from the Vix network module through the context mapper helpers.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

When the request outcome is known, the context can include a network-error signal.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::NetworkError);
```

This keeps cache decisions connected to real network state without putting network probing logic inside `Cache`.

The context mapper is documented in its own page.

## Recommended request flow

A typical offline-aware GET flow looks like this:

```text
1. Build a deterministic cache key.
2. Check whether the application is offline.
3. If offline, call Cache::get with Offline context.
4. If online, try the network request.
5. If the network request succeeds, store the new response.
6. If the network request fails because of the network, call Cache::get with NetworkError context.
```

The important part is that the context describes why the cache is being consulted.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

This line means the application is not pretending the entry is fresh. It is deliberately asking whether a stale fallback is acceptable after a network failure.

## Common mistakes

### Treating offline and network error as the same state

Offline and network error describe different situations.

```cpp
vix::cache::CacheContext::Offline();
vix::cache::CacheContext::NetworkError();
```

Use offline context when the application knows there is no connectivity. Use network-error context after a request failed because of the network.

### Expecting context to override policy

Context does not override policy. The policy must allow stale reuse.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

Without the flag, a stale entry is rejected even if the context says the application is offline.

### Passing online context after a network failure

After a network request fails because of the network, use `NetworkError()`.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

Passing `Online()` would ask the cache to behave as if the application were in normal online operation, where stale entries are rejected.

### Using stale data without making the reason explicit

A stale response should be reused for a clear reason: offline operation or network failure. Passing the right context makes that reason visible in code.

```cpp
vix::cache::CacheContext::Offline();
vix::cache::CacheContext::NetworkError();
```

This keeps cache behavior easier to audit and easier to test.

## Next step

Continue with the cache keys page to understand how `CacheKey::fromRequest()` builds stable keys from methods, paths, query strings, and selected headers.
