# Context Mapper

The cache context mapper connects the `cache` module with runtime network state. It helps build a `CacheContext` from a `vix::net::NetworkProbe` and, when available, from the outcome of a network request.

This is useful in offline-first code because cache behavior should follow the real situation of the application. If the network probe says the application is offline, the cache should be asked with an offline context. If a request was attempted and failed because of the network, the cache should be asked with a network-error context.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that use `NetworkProbe` directly:

```cpp
#include <vix/net/NetworkProbe.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct cache mapper header is also available when a file only needs this part of the module:

```cpp
#include <vix/cache/CacheContextMapper.hpp>
```

## Why context mapping exists

`Cache::get` needs a `CacheContext`.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

In small examples, the context can be chosen manually:

```cpp
auto ctx = vix::cache::CacheContext::Offline();
```

Real applications often know the context from another subsystem. A network probe may tell the application that connectivity is unavailable. A network request may fail and report a network error. The context mapper turns those signals into the `CacheContext` expected by the cache layer.

This keeps the cache module focused. `Cache` does not perform network probing by itself. It receives context from the caller.

## RequestOutcome

`RequestOutcome` describes the result of a network-backed request.

```cpp
enum class RequestOutcome
{
  Ok,
  NetworkError
};
```

`Ok` means the request completed successfully. `NetworkError` means the request failed due to a network problem.

This enum is used by `contextFromProbeAndOutcome` to enrich the cache context after a request has been attempted.

## contextFromProbe

`contextFromProbe` builds a `CacheContext` from a `NetworkProbe`.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

If the probe says the application is offline, the returned context has `offline = true`.

```cpp
if (!probe.is_online(now_ms))
{
  ctx.offline = true;
}
```

The function does not mark `network_error` by itself because probing network state and handling a failed request are different signals.

## contextFromProbeAndOutcome

`contextFromProbeAndOutcome` builds a context from both the network probe and the request outcome.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::NetworkError);
```

This first derives the online or offline state from the probe. Then it marks `network_error = true` when the request outcome is `NetworkError`.

Use this after a network request has been attempted.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::Ok);
```

When the outcome is `Ok`, the context does not need to mark a network error.

## Convenience helpers

The mapper also provides small convenience helpers.

```cpp
auto online = vix::cache::contextOnline();
auto offline = vix::cache::contextOffline();
auto network_error = vix::cache::contextNetworkError();
```

These are equivalent to the `CacheContext` factory helpers.

```cpp
vix::cache::CacheContext::Online();
vix::cache::CacheContext::Offline();
vix::cache::CacheContext::NetworkError();
```

They are useful when code is already written around the mapper functions and wants a consistent naming style.

## Offline cache flow

A common offline-aware flow starts by asking the probe whether the application is online.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

If the context is offline, the application can skip the network request and ask the cache directly.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

This means the cache policy can apply `stale_if_offline_ms` when offline stale reuse is enabled.

## Network-error fallback flow

When the application is online, it usually attempts the network request first. If that request fails because of the network, the context should include the request outcome.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::NetworkError);

auto cached = cache.get(key, now_ms, ctx);
```

This means the cache policy can apply `stale_if_error_ms` when stale-on-error reuse is enabled.

The important detail is that the application does not use stale data silently. It tells the cache why stale reuse is being considered.

## Complete example

The following example simulates an offline probe and reads a cached entry with the context built from that probe.

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/net/NetworkProbe.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 100;
  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"cached":true})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  vix::net::NetworkProbe probe(
      vix::net::NetworkProbe::Config{},
      []
      {
        return false;
      });

  const std::int64_t now = created_at + 3'000;

  auto ctx = vix::cache::contextFromProbe(probe, now);

  auto cached = cache.get(key, now, ctx);

  vix::print("offline:", ctx.offline ? "yes" : "no");
  vix::print("cache:", cached ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
offline: yes
cache: hit
```

The entry is stale because the TTL is only `100` milliseconds, but it is still inside the offline stale window.

## Complete network-error example

This example simulates a network error and uses `contextFromProbeAndOutcome` to request a stale fallback.

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/net/NetworkProbe.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 100;
  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"cached":"profile"})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  vix::net::NetworkProbe probe(
      vix::net::NetworkProbe::Config{},
      []
      {
        return true;
      });

  const std::int64_t now = created_at + 4'000;

  auto ctx = vix::cache::contextFromProbeAndOutcome(
      probe,
      now,
      vix::cache::RequestOutcome::NetworkError);

  auto cached = cache.get(key, now, ctx);

  vix::print("offline:", ctx.offline ? "yes" : "no");
  vix::print("network error:", ctx.network_error ? "yes" : "no");
  vix::print("cache:", cached ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
offline: no
network error: yes
cache: hit
```

The probe reports that the application is online, but the request outcome says a network error happened. The cache can therefore apply the stale-if-error policy.

## Request flow with mapper

A practical request flow can be written like this:

```text
1. Build a deterministic cache key.
2. Ask NetworkProbe for the current connectivity context.
3. If offline, try the cache with the mapped offline context.
4. If online, attempt the network request.
5. If the request succeeds, store the response in cache.
6. If the request fails due to the network, map the outcome to NetworkError context.
7. Try the cache again with the network-error context.
```

This keeps each decision explicit. The network probe detects connectivity. The network request reports its outcome. The mapper turns those signals into a cache context. The cache policy decides whether the stored entry can be served.

## Example request helper

The following example shows the core logic as a small helper. The network result is simulated so the example stays focused on cache behavior.

```cpp
#include <memory>
#include <optional>
#include <string>

#include <vix/cache.hpp>
#include <vix/net/NetworkProbe.hpp>
#include <vix/print.hpp>

struct NetworkResult
{
  bool ok{false};
  bool network_error{false};
  int status{0};
  std::string body;
};

enum class Decision
{
  CacheHit,
  NetworkOk,
  OfflineMiss,
  NetworkErrorMiss
};

static Decision handle_get_with_cache(
    vix::cache::Cache &cache,
    const std::string &key,
    std::int64_t now,
    vix::net::NetworkProbe &probe,
    const NetworkResult &network)
{
  auto ctx = vix::cache::contextFromProbe(probe, now);

  if (ctx.offline)
  {
    auto cached = cache.get(key, now, ctx);
    return cached ? Decision::CacheHit : Decision::OfflineMiss;
  }

  if (network.ok)
  {
    vix::cache::CacheEntry entry;

    entry.status = network.status;
    entry.body = network.body;
    entry.created_at_ms = now;

    cache.put(key, entry);

    return Decision::NetworkOk;
  }

  if (network.network_error)
  {
    auto error_ctx = vix::cache::contextFromProbeAndOutcome(
        probe,
        now,
        vix::cache::RequestOutcome::NetworkError);

    auto cached = cache.get(key, now, error_ctx);

    return cached ? Decision::CacheHit : Decision::NetworkErrorMiss;
  }

  return Decision::NetworkErrorMiss;
}

static const char *decision_name(Decision decision)
{
  switch (decision)
  {
  case Decision::CacheHit:
    return "cache hit";
  case Decision::NetworkOk:
    return "network ok";
  case Decision::OfflineMiss:
    return "offline miss";
  case Decision::NetworkErrorMiss:
    return "network error miss";
  }

  return "unknown";
}

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 100;
  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;
  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry cached_entry;

  cached_entry.status = 200;
  cached_entry.body = R"({"cached":"profile"})";
  cached_entry.created_at_ms = created_at;

  cache.put(key, cached_entry);

  vix::net::NetworkProbe probe(
      vix::net::NetworkProbe::Config{},
      []
      {
        return true;
      });

  NetworkResult failed_request;
  failed_request.network_error = true;

  const auto decision = handle_get_with_cache(
      cache,
      key,
      created_at + 4'000,
      probe,
      failed_request);

  vix::print(decision_name(decision));

  return 0;
}
```

Expected output:

```text
cache hit
```

The probe reports online, the simulated request fails with a network error, and the cache returns the stale entry because the policy allows stale-if-error reuse.

## Difference between offline and network error

Offline and network error should not be collapsed into one state.

Offline:

```cpp
auto ctx = vix::cache::CacheContext::Offline();
```

This means the application knows there is no network and can skip the network request.

Network error:

```cpp
auto ctx = vix::cache::CacheContext::NetworkError();
```

This means the application attempted a network request and it failed because of the network.

The policy can choose different windows for both cases.

```cpp
policy.stale_if_offline_ms = 10 * 60'000;
policy.stale_if_error_ms = 60'000;
```

This is useful when offline mode is expected to tolerate older data, while online requests should only fall back briefly after a failure.

## Mapper helpers and direct contexts

These two forms are equivalent:

```cpp
auto ctx = vix::cache::contextOffline();
```

```cpp
auto ctx = vix::cache::CacheContext::Offline();
```

The mapper helpers are mostly convenience functions. Use the direct `CacheContext` helpers when the context is known manually. Use the mapper functions when the context comes from network state or request outcome.

## Context mapping and cache policy

The mapper does not decide whether an entry is usable. It only creates the context.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now);
```

The cache policy still controls the decision.

```cpp
auto cached = cache.get(key, now, ctx);
```

If the policy does not allow stale offline reuse, an offline context does not make stale entries valid.

```cpp
policy.allow_stale_if_offline = false;
```

If the policy does not allow stale-on-error reuse, a network-error context does not make stale entries valid.

```cpp
policy.allow_stale_if_error = false;
```

This separation keeps runtime state and cache rules independent.

## Common mistakes

### Using Online context after a failed request

After a network request fails because of the network, use network-error context.

```cpp
auto ctx = vix::cache::contextNetworkError();
```

or:

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now,
    vix::cache::RequestOutcome::NetworkError);
```

Using online context would reject stale entries that may be valid fallback responses under `stale_if_error_ms`.

### Treating the mapper as a network client

The mapper does not perform the network request. It only builds cache context from a probe and an outcome.

The application still owns the network request:

```text
attempt request
inspect result
map outcome
ask cache
```

### Expecting mapped context to override policy

A context only describes the runtime situation. The policy must still allow stale reuse.

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

Without this policy, a network-error context cannot serve stale data.

### Forgetting to pass the current time

`contextFromProbe` receives `now_ms` because the probe may use time internally when checking or refreshing its network state.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

Use the same time value for the cache lookup when the decision belongs to the same request flow.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

## CMake

The context mapper is part of the cache module target. Because it uses the Vix network module, `vix::cache` publicly depends on the Vix net target.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

If the program uses `vix::print`, link `vix::io` too:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

## Next step

Continue with the CMake page to understand how the cache module is built, linked, and consumed from applications or other Vix modules.
