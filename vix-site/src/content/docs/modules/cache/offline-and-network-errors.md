# Offline and Network Errors

The `cache` module is designed for offline-aware applications. It can serve a fresh entry during normal online operation, reuse a stale entry when the application is offline, or reuse a stale entry after a network request fails.

This behavior is not automatic magic. It is controlled by `CachePolicy` and `CacheContext`. The policy defines how long entries remain fresh and how long stale entries may be reused. The context tells the cache why the entry is being requested: normal online operation, offline operation, or a network failure.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## The three cache contexts

The cache module provides three common contexts:

```cpp
vix::cache::CacheContext::Online();
vix::cache::CacheContext::Offline();
vix::cache::CacheContext::NetworkError();
```

Each context describes a different runtime situation.

| Context          | Meaning                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `Online()`       | Normal operation. Fresh cache entries can be used.                                         |
| `Offline()`      | No network connectivity is available. Stale entries may be used if policy allows it.       |
| `NetworkError()` | A network request was attempted and failed. Stale entries may be used if policy allows it. |

Offline and network error are intentionally separate. Offline means the application already knows there is no network. Network error means the application tried the network and the request failed.

## Policy for offline-first behavior

A normal offline-aware policy has a short freshness window and longer stale fallback windows.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

With this policy:

```text
0ms to 100ms      fresh
100ms to 5s       stale, usable after network error
100ms to 10s      stale, usable while offline
after 10s         too old for this policy
```

The exact values should match the kind of data being cached. A product list, profile response, or static API response may tolerate a longer offline window than data that changes constantly.

## Online behavior

In online context, the cache serves entries that are still fresh.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

If the entry is older than `ttl_ms`, the cache returns a miss in online context.

```cpp
policy.ttl_ms = 1'000;
```

An entry created at `10'000` is fresh at `10'500`:

```cpp
auto cached = cache.get(
    key,
    10'500,
    vix::cache::CacheContext::Online());
```

The same entry is not fresh at `20'000`:

```cpp
auto cached = cache.get(
    key,
    20'000,
    vix::cache::CacheContext::Online());
```

At that point, the caller should usually fetch a fresh response from the network and store it.

## Offline behavior

Offline context is used when the application knows there is no network connectivity.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

A stale entry can be returned when the policy allows stale offline reuse.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

This lets a local-first application continue to show previously validated data instead of failing immediately.

```cpp
auto cached = cache.get(
    key,
    created_at + 3'000,
    vix::cache::CacheContext::Offline());
```

The entry is stale if the TTL is shorter than `3'000` milliseconds, but it can still be returned while offline if it is inside the offline stale window.

## Network-error behavior

Network-error context is used after a network request fails.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

A stale entry can be returned when the policy allows stale reuse after network errors.

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

This is useful when the application tried to fetch a fresh response but the network failed. Instead of returning nothing, the application can fall back to a cached response that is stale but still inside the allowed error window.

```cpp
auto cached = cache.get(
    key,
    created_at + 4'000,
    vix::cache::CacheContext::NetworkError());
```

The caller should treat this as a fallback response, not as a fresh network response.

## Complete example

This example stores one entry and reads it in fresh, offline, network-error, and too-old states.

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

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

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"cached":true})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto fresh = cache.get(
      key,
      created_at + 50,
      vix::cache::CacheContext::Online());

  auto offline_stale = cache.get(
      key,
      created_at + 3'000,
      vix::cache::CacheContext::Offline());

  auto error_stale = cache.get(
      key,
      created_at + 4'000,
      vix::cache::CacheContext::NetworkError());

  auto too_old = cache.get(
      key,
      created_at + 20'000,
      vix::cache::CacheContext::Offline());

  vix::print("fresh online:", fresh ? "hit" : "miss");
  vix::print("offline stale:", offline_stale ? "hit" : "miss");
  vix::print("network error stale:", error_stale ? "hit" : "miss");
  vix::print("too old offline:", too_old ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
fresh online: hit
offline stale: hit
network error stale: hit
too old offline: miss
```

The final lookup misses because the entry is older than the maximum stale window allowed by the policy.

## Recommended request flow

A practical offline-aware GET flow usually follows this structure:

```text
1. Build a deterministic cache key.
2. Detect whether the application is offline.
3. If offline, try the cache with Offline context.
4. If online, attempt the network request.
5. If the network request succeeds, store the new response.
6. If the network request fails because of the network, try the cache with NetworkError context.
7. If no cached response is usable, return a real miss or error.
```

This flow keeps the reason for cache reuse visible. The application does not serve stale data silently. It serves stale data because the current context makes that acceptable under the active policy.

## Offline-first GET example

The following example uses a small simulated network result to show the recommended flow.

```cpp
#include <memory>
#include <optional>
#include <string>

#include <vix/cache.hpp>
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
    bool offline,
    const NetworkResult &network)
{
  if (offline)
  {
    auto cached = cache.get(
        key,
        now,
        vix::cache::CacheContext::Offline());

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
    auto cached = cache.get(
        key,
        now,
        vix::cache::CacheContext::NetworkError());

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

  NetworkResult failed_request;
  failed_request.ok = false;
  failed_request.network_error = true;

  const auto decision = handle_get_with_cache(
      cache,
      key,
      created_at + 4'000,
      false,
      failed_request);

  vix::print(decision_name(decision));

  return 0;
}
```

Expected output:

```text
cache hit
```

The network request failed, but the cached entry is still inside the `stale_if_error_ms` window, so the cache can return it as a controlled fallback.

## Online success should refresh the cache

When the network request succeeds, store the new response with the current timestamp.

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = response_body;
entry.headers = response_headers;
entry.created_at_ms = now_ms;

cache.put(key, entry);
```

This refreshes the cached value and resets its age.

The next online cache read can then return the fresh entry:

```cpp
auto cached = cache.get(
    key,
    now_ms + 100,
    vix::cache::CacheContext::Online());
```

## Offline miss

An offline miss means the application is offline and no usable cached entry exists.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());

if (!cached)
{
  vix::print("offline miss");
}
```

This can happen when the entry was never stored or when the stored entry is too old for the offline stale window.

An offline miss should be handled honestly by the application. The cache should not invent a response when no usable entry exists.

## Network-error miss

A network-error miss means the network request failed and no usable fallback exists.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());

if (!cached)
{
  vix::print("network error miss");
}
```

This can happen when the entry is missing or older than `stale_if_error_ms`.

A network-error miss is different from an offline miss because the application did try the network. That distinction can help higher layers show better diagnostics.

## Different windows for different failures

Offline reuse and network-error reuse can use different windows.

```cpp
policy.stale_if_offline_ms = 10 * 60'000;
policy.stale_if_error_ms = 60'000;
```

This configuration allows a longer offline fallback than network-error fallback. That can be useful when offline mode is an expected application state, while network errors during online operation should fall back for a shorter period.

The reverse is also possible when the application wants to be stricter offline but more tolerant during temporary network failures.

## Strict policy

A strict policy does not serve stale entries in failure contexts.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = false;
policy.allow_stale_if_error = false;
```

With this policy, expired entries are rejected even when the application is offline or a network request fails.

Use this when stale data would be unsafe or misleading.

## Offline-first policy

A typical local-first application can use a short fresh window and a longer offline fallback.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 10'000;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10 * 60'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5 * 60'000;
```

This configuration prefers fresh data, but still lets the application continue with cached data when the network is not available.

## Cache keys in offline flows

Offline fallback is only correct when the key identifies the request precisely.

```cpp
const std::string key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/profile",
    "",
    request_headers,
    {"Accept"});
```

A weak key can cause the application to return the wrong response. A deterministic key keeps offline fallback tied to the same logical request.

## Stores and offline behavior

All stores work with the same offline and network-error rules.

```cpp
auto memory = std::make_shared<vix::cache::MemoryStore>();

auto lru = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});

auto file = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

The store decides where entries live. The cache policy decides whether an entry can be served.

`FileStore` is especially useful for offline-first behavior because cached entries can survive process restarts.

## Common mistakes

### Serving stale data without a context

Do not treat stale data as a normal online hit. Use the correct context.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

or:

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

The context explains why stale reuse is being considered.

### Forgetting to enable the stale window

The stale window value is not enough. The policy flag must be enabled.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

For network errors:

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

### Treating offline and network error as identical

Offline means no connectivity is available. Network error means a request was attempted and failed. Keeping those contexts separate lets the application use different fallback rules.

### Using a stale fallback forever

A stale window should have a limit.

```cpp
policy.stale_if_offline_ms = 10'000;
```

When the entry is too old, the cache should return a miss. This prevents very old data from being presented as a valid fallback forever.

### Using weak cache keys

A fallback response is only safe when the key identifies the request correctly.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers,
    {"Accept"});
```

Manual keys can be acceptable in small examples, but request-based caching should use deterministic keys.

## Next step

Continue with the pruning page to understand how old entries are removed from stores once they are no longer useful under the active policy.
