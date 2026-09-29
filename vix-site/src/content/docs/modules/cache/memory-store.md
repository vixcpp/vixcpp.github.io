# Memory Store

`MemoryStore` is the simplest storage backend in the `cache` module. It stores cache entries in memory using a key-value map and protects access with a mutex.

Use `MemoryStore` when the cache only needs to live for the lifetime of the process. It is a good fit for tests, examples, small runtime caches, and application layers where persistence and eviction are not required.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the memory store:

```cpp
#include <vix/cache/MemoryStore.hpp>
```

## Role

`MemoryStore` implements `CacheStore`.

It provides the basic store operations:

```cpp
put(key, entry)
get(key)
erase(key)
clear()
```

The store only answers whether an entry exists in memory. It does not decide whether the entry is fresh, stale, expired, acceptable while offline, or acceptable after a network error.

Those decisions belong to `Cache`, through `CachePolicy` and `CacheContext`.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

## Create a memory store

Create a memory store with `std::make_shared`.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

Then pass it to `Cache`.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

The cache facade applies the policy. The store keeps the data.

## Minimal example

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/users?page=1";
  const std::int64_t created_at = 10'000;

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

The entry is returned because it is still inside the configured TTL.

## In-memory lifecycle

`MemoryStore` does not persist entries to disk.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

When the store object is destroyed, its entries are gone. When the process exits, the cache is gone.

This is useful when the cached data should be temporary. It also makes tests simple because each test can start with a fresh store.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
store->clear();
```

For cache entries that must survive process restarts, use `FileStore`.

## No automatic eviction

`MemoryStore` does not evict entries automatically. Entries remain in the store until they are erased, the store is cleared, or the store object is destroyed.

```cpp
store->erase("GET /api/users?page=1");
store->clear();
```

For bounded memory behavior, use `LruMemoryStore`.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

`MemoryStore` is intentionally minimal. It is not trying to be a memory manager. It is a simple cache backend.

## Store operations

`MemoryStore` supports direct store operations.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();

vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = "stored directly";
entry.created_at_ms = 10'000;

store->put("key", entry);

auto got = store->get("key");

if (got)
{
  vix::print(got->body);
}

store->erase("key");
store->clear();
```

Direct store operations are useful in tests and low-level code. Normal application code should usually go through `Cache`, because `Cache` applies policy and context.

## Store hit and cache hit

A store hit and a cache hit are not the same thing.

A direct store lookup only checks whether the entry exists:

```cpp
auto raw = store->get(key);
```

A cache lookup checks whether the entry is usable under the active policy and context:

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

The store can contain an entry that `Cache::get()` refuses to serve because it is expired.

## Example: stored entry but expired by policy

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
  policy.allow_stale_if_offline = false;
  policy.allow_stale_if_error = false;

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"name":"Vix"})";
  entry.created_at_ms = 10'000;

  cache.put(key, entry);

  auto raw = store->get(key);

  auto cached = cache.get(
      key,
      20'000,
      vix::cache::CacheContext::Online());

  vix::print("store:", raw ? "present" : "missing");
  vix::print("cache:", cached ? "hit" : "miss");

  return 0;
}
```

Expected output:

```text
store: present
cache: miss
```

The entry exists in memory, but it is too old for the active policy.

## Offline reuse

`MemoryStore` works with the same offline-first policy rules as other stores.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

A stale entry can be returned while offline when it is still inside the offline stale window.

```cpp
auto cached = cache.get(
    key,
    created_at + 3'000,
    vix::cache::CacheContext::Offline());
```

The store does not know this rule. It only returns the entry to the cache facade. The cache facade applies the policy.

## Network-error reuse

A memory-backed cache can also serve stale data after a network error.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

After a network request fails, call `Cache::get` with `NetworkError` context.

```cpp
auto cached = cache.get(
    key,
    created_at + 4'000,
    vix::cache::CacheContext::NetworkError());
```

This keeps the fallback explicit. The application is not pretending the entry is fresh. It is asking whether a stale response is acceptable after a network failure.

## Complete offline example

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

The store is simple, but the cache behavior remains policy-driven.

## Header normalization

When an entry is inserted through `Cache::put`, response header names are normalized to lowercase before the entry reaches the store.

```cpp
entry.headers["Content-Type"] = "application/json";
cache.put(key, entry);
```

A later read returns normalized header names.

```cpp
auto cached = cache.get(
    key,
    created_at + 1,
    vix::cache::CacheContext::Online());

if (cached)
{
  auto it = cached->headers.find("content-type");

  if (it != cached->headers.end())
  {
    vix::print("content-type:", it->second);
  }
}
```

Direct store insertion bypasses this cache facade behavior.

```cpp
store->put(key, entry);
```

Use `Cache::put` for normal application writes.

## Clear and erase

Remove one entry with `erase`.

```cpp
store->erase("GET /api/users?page=1");
```

Remove all entries with `clear`.

```cpp
store->clear();
```

These operations are useful for tests, logout flows, and explicit cache invalidation.

```cpp
#include <memory>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CacheEntry entry;
  entry.status = 200;
  entry.body = "temporary";
  entry.created_at_ms = 10'000;

  store->put("key", entry);

  vix::print(store->get("key") ? "present" : "missing");

  store->erase("key");

  vix::print(store->get("key") ? "present" : "missing");

  return 0;
}
```

Expected output:

```text
present
missing
```

## Thread-safety

`MemoryStore` protects its internal map with a mutex. Basic operations such as `put`, `get`, `erase`, and `clear` are protected at the store level.

This does not make a larger application workflow automatically atomic. For example, a sequence that checks the cache, performs a network request, and then writes a new entry is still an application-level flow.

```text
cache get
network request
cache put
```

The store protects its internal state. The caller still controls the larger request behavior.

## CMake

The memory store is part of the cache module target.

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

## Common mistakes

### Expecting persistence

`MemoryStore` does not write to disk. Use `FileStore` when entries must survive process restarts.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

### Expecting eviction

`MemoryStore` does not evict entries automatically. Use `LruMemoryStore` when the cache must stay bounded.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

### Treating direct store reads as policy decisions

Direct store reads do not apply TTL or stale rules.

```cpp
auto raw = store->get(key);
```

Use `Cache::get` when the question is whether the entry can be served.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

### Bypassing header normalization

`Cache::put` normalizes response headers. Direct `store->put` does not apply that cache-level behavior.

```cpp
cache.put(key, entry);
```

Use the cache facade for normal writes.

### Forgetting to set `created_at_ms`

The store will accept the entry, but policy decisions depend on the timestamp.

```cpp
entry.created_at_ms = now_ms;
```

A missing or incorrect timestamp can make an entry look too old or too new.

## Next step

Continue with the LRU Memory Store page to see how to keep an in-memory cache bounded with least-recently-used eviction.
