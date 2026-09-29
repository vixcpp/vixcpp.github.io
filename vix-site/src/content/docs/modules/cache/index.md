# Cache

The `cache` module provides a small, deterministic caching layer for Vix applications. It is designed for local-first and offline-aware workflows where cached data is not only a performance detail, but also part of how an application behaves when the network is slow, unstable, or unavailable.

The module is built around explicit pieces. `Cache` coordinates the cache operation, `CachePolicy` decides when an entry is fresh or stale, `CacheContext` describes the runtime situation, and a `CacheStore` stores the entries. This keeps cache behavior easy to test because the decision depends on the cache entry, the policy, the current time, and the context passed by the caller.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The module also provides direct headers under `vix/cache/` for files that only need one specific type, but application code should usually include the aggregator.

## What the module solves

Caching is often treated as a simple lookup table, but offline-first code needs more precise behavior. A response can be fresh while the application is online, stale but still useful when the device is offline, or stale but acceptable after a network error.

The `cache` module makes those decisions explicit. The caller chooses a policy, stores entries with timestamps, and asks for an entry with a runtime context.

```cpp
auto cached = cache.get(key, now_ms, vix::cache::CacheContext::Online());
```

The same entry can be accepted or rejected depending on the context.

```cpp
auto cached = cache.get(key, now_ms, vix::cache::CacheContext::Offline());
```

This model is useful for HTTP GET caching, local application state, offline-first clients, edge runtimes, and higher-level modules that need predictable cache reuse.

## Core types

The public API is centered on a small set of types.

| Type             | Role                                                                    |
| ---------------- | ----------------------------------------------------------------------- |
| `Cache`          | High-level facade that applies policy and delegates storage to a store. |
| `CacheEntry`     | Stored response data: status, body, headers, and creation time.         |
| `CachePolicy`    | Freshness and stale reuse rules.                                        |
| `CacheContext`   | Runtime context such as online, offline, or network error.              |
| `CacheKey`       | Deterministic key builder for request-based caching.                    |
| `CacheStore`     | Abstract storage interface.                                             |
| `MemoryStore`    | Simple in-memory store.                                                 |
| `LruMemoryStore` | In-memory store with least-recently-used eviction.                      |
| `FileStore`      | File-backed JSON store for persistent cache entries.                    |

Each type has a narrow responsibility. The cache facade does not decide where entries are stored. The store does not decide whether an entry is usable. The policy does not know how the entry was loaded. This separation keeps the module predictable.

## Minimal example

This example stores a response in memory and reads it back while the entry is still fresh.

```cpp
#include <chrono>
#include <memory>

#include <vix/cache.hpp>
#include <vix/print.hpp>

static std::int64_t now_ms()
{
  using namespace std::chrono;

  return duration_cast<milliseconds>(
             steady_clock::now().time_since_epoch())
      .count();
}

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/users?page=1";
  const auto created_at = now_ms();

  vix::cache::CacheEntry entry;
  entry.status = 200;
  entry.body = R"({"users":[1,2,3]})";
  entry.headers["Content-Type"] = "application/json";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto cached = cache.get(
      key,
      created_at + 100,
      vix::cache::CacheContext::Online());

  if (!cached)
  {
    vix::print("cache miss");
    return 1;
  }

  vix::print("cache hit");
  vix::print("status:", cached->status);
  vix::print("body:", cached->body);

  return 0;
}
```

`Cache::put` stores the entry in the selected store. `Cache::get` reads it back only if the active policy says it is usable for the provided context.

## Cache entries

A cache entry contains the stored response body and the metadata needed by policy decisions.

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = R"({"ok":true})";
entry.headers["Content-Type"] = "application/json";
entry.created_at_ms = now_ms();
```

`created_at_ms` is important because the policy calculates entry age from the current time passed to `Cache::get`.

```cpp
const auto age_ms = now_ms - entry.created_at_ms;
```

The cache does not hide time. The caller passes the current time so cache behavior can be tested with fixed timestamps.

## Cache policy

`CachePolicy` defines when an entry is fresh and when stale data may still be reused.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 5'000;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 60'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 30'000;
```

An entry younger than `ttl_ms` is fresh. An older entry can still be returned when the context is offline or when a network error happened, but only if the corresponding stale window allows it.

This is the core offline-first behavior of the module.

## Cache context

`CacheContext` describes the runtime situation for one cache decision.

```cpp
auto online = vix::cache::CacheContext::Online();
auto offline = vix::cache::CacheContext::Offline();
auto network_error = vix::cache::CacheContext::NetworkError();
```

Use `Online()` when the application is operating normally. Use `Offline()` when the application knows no network is available. Use `NetworkError()` when a request was attempted but failed because of the network.

```cpp
auto cached = cache.get(key, now, vix::cache::CacheContext::NetworkError());
```

This tells the policy that a stale entry may be acceptable if `allow_stale_if_error` is enabled.

## Cache keys

`CacheKey` builds deterministic request-based keys. It normalizes the method, sorts query parameters, and can include selected headers.

```cpp
#include <unordered_map>
#include <vector>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  std::unordered_map<std::string, std::string> headers;

  headers["Accept"] = "application/json";
  headers["X-Device"] = "mobile";

  const std::string key = vix::cache::CacheKey::fromRequest(
      "get",
      "/api/users",
      "b=2&a=1",
      headers,
      {"Accept"});

  vix::print(key);

  return 0;
}
```

The query string is normalized, so the same logical request produces the same cache key even when query parameters arrive in a different order.

```text
GET /api/users?a=1&b=2 |h:accept=application/json;
```

This helps avoid cache fragmentation and makes behavior easier to debug.

## Stores

The cache module separates policy from storage. A `CacheStore` can keep entries in memory, on disk, or in another backend.

### MemoryStore

`MemoryStore` is the simplest backend. It stores entries in an in-memory map protected by a mutex.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

Use it for tests, short-lived applications, and small runtime caches where persistence is not required.

### LruMemoryStore

`LruMemoryStore` keeps entries in memory and evicts the least recently used entry when the cache exceeds its configured size.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

Use it when memory must stay bounded.

### FileStore

`FileStore` persists cache entries into a JSON file.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

Use it when cached responses should survive process restarts.

## Offline and network-error behavior

The recommended offline-first flow is simple:

```text
1. Build a cache key for the request.
2. If the application is offline, try the cache with Offline context.
3. If the application is online, attempt the network request.
4. If the request succeeds, store the new response.
5. If the request fails because of the network, try the cache with NetworkError context.
```

This gives the application controlled fallback behavior without pretending that all stale data is always safe.

```cpp
auto cached = cache.get(
    key,
    now,
    vix::cache::CacheContext::NetworkError());

if (cached)
{
  vix::print("using stale cached response after network error");
}
```

The policy decides how old that stale response may be.

## Header normalization

`Cache::put` normalizes response header names to lowercase before storing the entry.

```cpp
entry.headers["Content-Type"] = "application/json";
entry.headers["X-Powered-By"] = "Vix";

cache.put(key, entry);
```

After insertion, the cached entry uses normalized header keys such as:

```text
content-type
x-powered-by
```

This avoids inconsistent behavior caused by HTTP header case differences.

## Pruning

`Cache::prune` removes entries that are older than the maximum age allowed by the active policy.

```cpp
const auto removed = cache.prune(now_ms());

vix::print("removed:", removed);
```

Pruning is useful for long-running processes, file-backed caches, and memory-bounded systems. The cache removes entries that are too old to be served as fresh, stale-if-offline, or stale-if-error under the current policy.

## Context mapping

The module can build cache context from the network module.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

When the request result is known, the context can include the outcome.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::NetworkError);
```

This connects cache behavior to runtime network state without putting network probing logic inside the cache facade.

## CMake

The cache module exposes the public target:

```cmake
vix::cache
```

A minimal application links it like this:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

If the example uses `vix::print`, link `vix::io` as well:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

The cache target requires C++20 and publicly depends on the Vix networking and JSON modules.

## When to use this module

Use `cache` when a program needs deterministic cache behavior instead of ad-hoc maps. It is especially useful when the application must decide whether to reuse a response based on age, online state, network errors, and storage strategy.

For a short-lived in-memory cache, use `MemoryStore`. For bounded memory, use `LruMemoryStore`. For persistence across process restarts, use `FileStore`.

## Next step

Continue with the quick start page to build a small cache example, run it, and see how fresh entries, stale entries, offline context, and network-error context behave in practice.
