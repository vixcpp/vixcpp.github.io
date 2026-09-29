# Quick Start

This page shows the fastest way to use the `cache` module in a Vix application. It starts with an in-memory cache, stores one response, reads it back while it is fresh, and then shows how the same cached entry can be reused when the application is offline or when a network request fails.

The cache module is intentionally explicit. A cache lookup needs a key, the current time, and a `CacheContext`. This makes the behavior easy to test and avoids hidden decisions inside the storage layer.

## Header

Use the public cache aggregator:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a memory cache

A cache instance needs two things: a policy and a store.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();

vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

`MemoryStore` keeps entries in memory. `CachePolicy` defines how long an entry is fresh and whether stale entries can still be reused in offline or network-error situations.

## Complete example

Create a file such as `main.cpp`:

```cpp
#include <chrono>
#include <memory>
#include <string>

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

Run it:

```bash
vix run main.cpp
```

The entry is returned because it is younger than the policy TTL.

```text
cache hit
status: 200
body: {"users":[1,2,3]}
```

## What happens in this example

The cache entry stores the response data:

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = R"({"users":[1,2,3]})";
entry.headers["Content-Type"] = "application/json";
entry.created_at_ms = created_at;
```

The policy defines the freshness window:

```cpp
policy.ttl_ms = 10'000;
```

The lookup passes the current time and the runtime context:

```cpp
auto cached = cache.get(
    key,
    created_at + 100,
    vix::cache::CacheContext::Online());
```

The cache returns the entry because its age is only `100` milliseconds, which is still inside the `10'000` millisecond TTL.

## Add offline reuse

Offline-first applications often need to reuse stale data when no network is available. Enable the offline stale window in the policy:

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

Then read the cache with an offline context:

```cpp
auto cached = cache.get(
    key,
    created_at + 3'000,
    vix::cache::CacheContext::Offline());
```

At `3'000` milliseconds, the entry is no longer fresh because the TTL is only `100` milliseconds. It can still be returned because the context is offline and the entry is inside the `stale_if_offline_ms` window.

## Add network-error reuse

A network-error context is different from an offline context. It means the application attempted a request, but the request failed because of the network.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

Then use `CacheContext::NetworkError()` after a failed network request:

```cpp
auto cached = cache.get(
    key,
    created_at + 4'000,
    vix::cache::CacheContext::NetworkError());
```

This lets the application fall back to a stale cached response without pretending that the response is fresh.

## One example with fresh, offline, and network-error reads

```cpp
#include <chrono>
#include <memory>
#include <string>

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
  policy.ttl_ms = 100;
  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;
  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const auto created_at = now_ms();

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

The final lookup misses because the entry is older than the offline stale window.

## Build a deterministic cache key

For request-based caching, use `CacheKey::fromRequest()` instead of writing keys manually.

```cpp
#include <string>
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

The method is normalized, the query parameters are sorted, and the selected header is included in the key.

```text
GET /api/users?a=1&b=2 |h:accept=application/json;
```

This avoids different cache entries for the same logical request.

## Choose a store

Use `MemoryStore` for a simple in-memory cache:

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

Use `LruMemoryStore` when the cache must stay bounded:

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

Use `FileStore` when entries should survive process restarts:

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

The `Cache` facade works with all three because each one implements `CacheStore`.

## Prune old entries

`Cache::prune()` removes entries that are too old for the active policy.

```cpp
const auto removed = cache.prune(now_ms());

vix::print("removed:", removed);
```

This is useful for long-running applications and file-backed caches. The cache calculates the maximum age allowed by the policy, including the stale-if-offline and stale-if-error windows, then removes entries older than that maximum.

## CMake

The cache module exposes:

```cmake
vix::cache
```

A minimal target can link it like this:

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

Continue with the cache entry page to understand exactly what is stored in `CacheEntry` and how its timestamp is used by policy decisions.
