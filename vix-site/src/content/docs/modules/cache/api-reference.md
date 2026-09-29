# API Reference

This page is a compact reference for the main public types in the `cache` module. It is meant for lookup after the main cache concepts are already clear.

The cache module is centered on a small runtime model:

```text
CacheEntry + CachePolicy + CacheContext + CacheStore -> Cache
```

A cache entry stores the response data. A policy defines freshness and stale reuse rules. A context describes the runtime situation. A store persists entries. The `Cache` facade coordinates those pieces.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

Direct headers are also available under `vix/cache/` when a file only needs one specific type.

## Namespace

The cache module lives in:

```cpp
namespace vix::cache
```

Most types on this page are under that namespace.

## Cache

`Cache` is the high-level cache facade. It applies the active `CachePolicy`, reads and writes through a `CacheStore`, and uses `CacheContext` to decide whether stale entries can be returned.

```cpp
vix::cache::Cache cache(policy, store);
```

### Constructor

```cpp
Cache(
    CachePolicy policy,
    std::shared_ptr<CacheStore> store);
```

Creates a cache from a policy and a store.

Example:

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();

vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

### get

```cpp
std::optional<CacheEntry> get(
    const std::string &key,
    std::int64_t now_ms,
    CacheContext ctx);
```

Reads an entry from the store and returns it only when the active policy allows it for the provided context.

Example:

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());

if (cached)
{
  vix::print("cache hit");
  vix::print(cached->body);
}
```

`get()` can return a fresh entry, a stale entry allowed while offline, or a stale entry allowed after a network error. It returns `std::nullopt` when the entry is missing or not usable under the policy.

### put

```cpp
void put(
    const std::string &key,
    const CacheEntry &entry);
```

Stores or replaces an entry.

Example:

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = R"({"ok":true})";
entry.headers["Content-Type"] = "application/json";
entry.created_at_ms = now_ms;

cache.put(key, entry);
```

`Cache::put()` normalizes response header names before storing the entry.

### prune

```cpp
std::size_t prune(std::int64_t now_ms);
```

Removes entries that are older than the maximum useful age under the active policy.

Example:

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

The current pruning path works with stores that expose predicate-based removal through the cache facade, such as `LruMemoryStore` and `FileStore`.

## CacheEntry

`CacheEntry` represents one stored response.

```cpp
vix::cache::CacheEntry entry;
```

### Fields

| Field           | Type                                           | Purpose                                  |
| --------------- | ---------------------------------------------- | ---------------------------------------- |
| `status`        | `int`                                          | Response status code. Defaults to `200`. |
| `body`          | `std::string`                                  | Stored response body.                    |
| `headers`       | `std::unordered_map<std::string, std::string>` | Stored response headers.                 |
| `created_at_ms` | `std::int64_t`                                 | Creation timestamp in milliseconds.      |

Example:

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = R"({"users":[1,2,3]})";
entry.headers["Content-Type"] = "application/json";
entry.created_at_ms = 10'000;
```

The cache policy uses `created_at_ms` to calculate entry age.

```cpp
const auto age_ms = now_ms - entry.created_at_ms;
```

## CachePolicy

`CachePolicy` defines freshness and stale reuse rules.

```cpp
vix::cache::CachePolicy policy;
```

### Fields

| Field                    | Type           | Purpose                                                 |
| ------------------------ | -------------- | ------------------------------------------------------- |
| `ttl_ms`                 | `std::int64_t` | Freshness window in milliseconds. Defaults to `60'000`. |
| `stale_if_error_ms`      | `std::int64_t` | Maximum age for stale reuse after network error.        |
| `stale_if_offline_ms`    | `std::int64_t` | Maximum age for stale reuse while offline.              |
| `allow_stale_if_error`   | `bool`         | Enables stale reuse after network error.                |
| `allow_stale_if_offline` | `bool`         | Enables stale reuse while offline.                      |

Example:

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 10'000;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10 * 60'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5 * 60'000;
```

### is_fresh

```cpp
bool is_fresh(std::int64_t age_ms) const noexcept;
```

Returns `true` when an entry is inside the TTL window.

```cpp
vix::print(policy.is_fresh(500) ? "fresh" : "stale");
```

### allow_stale_error

```cpp
bool allow_stale_error(std::int64_t age_ms) const noexcept;
```

Returns `true` when stale reuse after a network error is enabled and the entry age is inside `stale_if_error_ms`.

```cpp
vix::print(
    policy.allow_stale_error(4'000) ? "allowed" : "rejected");
```

### allow_stale_offline

```cpp
bool allow_stale_offline(std::int64_t age_ms) const noexcept;
```

Returns `true` when stale reuse while offline is enabled and the entry age is inside `stale_if_offline_ms`.

```cpp
vix::print(
    policy.allow_stale_offline(4'000) ? "allowed" : "rejected");
```

## CacheContext

`CacheContext` describes the runtime situation for one cache decision.

```cpp
vix::cache::CacheContext ctx;
```

### Fields

| Field           | Type   | Purpose                                           |
| --------------- | ------ | ------------------------------------------------- |
| `offline`       | `bool` | True when no network connectivity is available.   |
| `network_error` | `bool` | True when a request failed due to network issues. |

### Online

```cpp
static CacheContext Online() noexcept;
```

Creates a normal online context.

```cpp
auto ctx = vix::cache::CacheContext::Online();
```

### Offline

```cpp
static CacheContext Offline() noexcept;
```

Creates an offline context.

```cpp
auto ctx = vix::cache::CacheContext::Offline();
```

### NetworkError

```cpp
static CacheContext NetworkError() noexcept;
```

Creates a network-error context.

```cpp
auto ctx = vix::cache::CacheContext::NetworkError();
```

Use `Offline()` when the application knows the network is unavailable. Use `NetworkError()` after a network request was attempted and failed.

## RequestOutcome

`RequestOutcome` describes the result of a network-backed request for context mapping.

```cpp
enum class RequestOutcome
{
  Ok,
  NetworkError
};
```

`Ok` means the request completed successfully. `NetworkError` means the request failed due to a network issue.

## Context mapper helpers

The context mapper connects cache context with `vix::net::NetworkProbe`.

### contextFromProbe

```cpp
CacheContext contextFromProbe(
    vix::net::NetworkProbe &probe,
    std::int64_t now_ms);
```

Builds a context from the current network probe state.

```cpp
auto ctx = vix::cache::contextFromProbe(probe, now_ms);
```

If the probe reports offline state, the returned context has `offline = true`.

### contextFromProbeAndOutcome

```cpp
CacheContext contextFromProbeAndOutcome(
    vix::net::NetworkProbe &probe,
    std::int64_t now_ms,
    RequestOutcome outcome);
```

Builds a context from both the network probe and the request outcome.

```cpp
auto ctx = vix::cache::contextFromProbeAndOutcome(
    probe,
    now_ms,
    vix::cache::RequestOutcome::NetworkError);
```

When the outcome is `NetworkError`, the returned context has `network_error = true`.

### contextOnline

```cpp
CacheContext contextOnline() noexcept;
```

Convenience helper for online context.

```cpp
auto ctx = vix::cache::contextOnline();
```

### contextOffline

```cpp
CacheContext contextOffline() noexcept;
```

Convenience helper for offline context.

```cpp
auto ctx = vix::cache::contextOffline();
```

### contextNetworkError

```cpp
CacheContext contextNetworkError() noexcept;
```

Convenience helper for network-error context.

```cpp
auto ctx = vix::cache::contextNetworkError();
```

## CacheKey

`CacheKey` builds deterministic request-based cache keys.

```cpp
const std::string key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers);
```

### fromRequest

```cpp
static std::string fromRequest(
    std::string_view method,
    std::string_view path,
    std::string_view query,
    const std::unordered_map<std::string, std::string> &headers,
    const std::vector<std::string> &include_headers = {});
```

Builds a normalized cache key.

| Parameter         | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `method`          | Request method. It is uppercased in the key. |
| `path`            | Request path without query string.           |
| `query`           | Raw query string without the leading `?`.    |
| `headers`         | Request headers.                             |
| `include_headers` | Header names that should affect the key.     |

Example:

```cpp
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
```

Generated form:

```text
GET /api/users?a=1&b=2 |h:accept=application/json;
```

The method is normalized, query parameters are sorted, and selected header names are lowercased.

## CacheStore

`CacheStore` is the abstract storage interface.

```cpp
class CacheStore
{
public:
  virtual ~CacheStore() = default;

  virtual void put(
      const std::string &key,
      const CacheEntry &entry) = 0;

  virtual std::optional<CacheEntry> get(
      const std::string &key) = 0;

  virtual void erase(
      const std::string &key) = 0;

  virtual void clear() = 0;
};
```

A store persists entries. It does not decide whether an entry is fresh or usable. Use `Cache::get()` when policy decisions matter.

## MemoryStore

`MemoryStore` is a simple in-memory store.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

It stores entries in an in-memory map protected by a mutex. It does not persist entries and does not evict entries automatically.

Example:

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();

vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

Use it for tests, examples, short-lived caches, and small runtime caches.

## LruMemoryStore

`LruMemoryStore` is an in-memory store with least-recently-used eviction.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

### Config

```cpp
struct Config
{
  std::size_t max_entries{1024};
};
```

`max_entries` controls the maximum number of entries kept in memory.

A successful `get()` marks the entry as recently used. When the store exceeds `max_entries`, the least recently used entry is removed.

## FileStore

`FileStore` stores cache entries in a JSON file.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

### Config

```cpp
struct Config
{
  std::filesystem::path file_path{"./.vix/cache_http.json"};
  bool pretty_json{false};
};
```

| Field         | Purpose                             |
| ------------- | ----------------------------------- |
| `file_path`   | JSON file used for persistence.     |
| `pretty_json` | Writes formatted JSON when enabled. |

`FileStore` loads lazily on first access, keeps an in-memory map protected by a mutex, and flushes mutations back to disk.

### eraseIf

```cpp
template <typename Pred>
std::size_t eraseIf(Pred pred);
```

Removes entries matching a predicate and flushes the updated state when entries were removed.

This is used by `Cache::prune()`.

## LruMemoryStore eraseIf

`LruMemoryStore` also exposes predicate-based removal.

```cpp
template <typename Pred>
std::size_t eraseIf(Pred pred);
```

This removes matching entries from both the map and the LRU list.

It is used by `Cache::prune()` to remove entries that are too old under the active policy.

## HeaderUtil

`HeaderUtil` provides small helpers for HTTP header normalization.

### toLower

```cpp
static std::string toLower(const std::string &s);
```

Returns a lowercase copy of the input string.

```cpp
const auto name = vix::cache::HeaderUtil::toLower("Content-Type");

vix::print(name);
```

Output:

```text
content-type
```

### normalizeInPlace

```cpp
static void normalizeInPlace(
    std::unordered_map<std::string, std::string> &headers);
```

Normalizes header names in-place by converting keys to lowercase.

```cpp
std::unordered_map<std::string, std::string> headers;

headers["Content-Type"] = "application/json";
headers["X-Powered-By"] = "Vix";

vix::cache::HeaderUtil::normalizeInPlace(headers);
```

After normalization, the map contains keys such as:

```text
content-type
x-powered-by
```

`Cache::put()` calls this behavior before storing an entry.

## Complete example

The following example shows the main public cache workflow.

```cpp
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  std::unordered_map<std::string, std::string> request_headers;

  request_headers["Accept"] = "application/json";

  const std::string key = vix::cache::CacheKey::fromRequest(
      "get",
      "/api/users",
      "b=2&a=1",
      request_headers,
      {"Accept"});

  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 1'000;
  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;
  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"users":[1,2,3]})";
  entry.headers["Content-Type"] = "application/json";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto fresh = cache.get(
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

  vix::print("key:", key);
  vix::print("fresh:", fresh ? "hit" : "miss");
  vix::print("offline:", offline ? "hit" : "miss");
  vix::print("network error:", network_error ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
key: GET /api/users?a=1&b=2 |h:accept=application/json;
fresh: hit
offline: hit
network error: hit
```

The same entry is evaluated through the same policy, but each lookup uses a different context.

## Direct store example

Direct store access is useful in tests and maintenance code.

```cpp
#include <memory>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = "direct store entry";
  entry.created_at_ms = 10'000;

  store->put("key", entry);

  auto got = store->get("key");

  if (got)
  {
    vix::print(got->body);
  }

  store->erase("key");

  vix::print(store->get("key") ? "present" : "missing");

  return 0;
}
```

Direct store access does not apply `CachePolicy`. Use `Cache::get()` when deciding whether a response can be served.

## CMake target

The public CMake target is:

```cmake
vix::cache
```

A minimal consumer links it like this:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

If the program uses `vix::print`, link `vix::io` as well:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

The concrete module target is:

```cmake
vix_cache
```

Consumers should prefer the public alias `vix::cache`.

## Public dependencies

The cache module publicly depends on:

```cmake
vix::net
vix::json
```

`vix::net` is used by the context mapper through `NetworkProbe`. `vix::json` is used by the file-backed store.

Consumers normally link only `vix::cache`; CMake carries the public dependencies through the target graph.

## Common lookup patterns

### Store a fresh response

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = response_body;
entry.headers = response_headers;
entry.created_at_ms = now_ms;

cache.put(key, entry);
```

### Read while online

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

### Read while offline

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

### Read after network error

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

### Remove old entries

```cpp
const auto removed = cache.prune(now_ms);
```

### Clear a store

```cpp
store->clear();
```

## Common mistakes

### Reading from the store instead of the cache facade

A direct store lookup does not apply TTL or stale reuse rules.

```cpp
auto raw = store->get(key);
```

Use `Cache::get()` when the question is whether an entry can be served.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

### Forgetting `created_at_ms`

Policy decisions depend on entry age.

```cpp
entry.created_at_ms = now_ms;
```

An entry without a correct timestamp can be rejected unexpectedly or kept longer than intended.

### Using stale windows without enabling them

Set the flag and the window.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

For network errors:

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

### Building weak cache keys

Use `CacheKey::fromRequest()` for request-based caching.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers,
    {"Accept"});
```

This avoids cache fragmentation and accidental collisions.

### Expecting MemoryStore to prune through Cache::prune

`Cache::prune()` removes entries from stores with predicate-based removal support, such as `LruMemoryStore` and `FileStore`.

For `MemoryStore`, use explicit lifecycle operations when needed.

```cpp
store->erase(key);
store->clear();
```

## Next step

Use this page as a lookup reference while reading the detailed pages for cache entries, policy, context, keys, stores, offline behavior, pruning, context mapping, and CMake integration.
