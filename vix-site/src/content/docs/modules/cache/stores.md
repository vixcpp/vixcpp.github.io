# Stores

A store is the storage backend used by the `cache` module. It decides where cache entries live, while `CachePolicy` decides whether those entries can be used.

This separation is central to the module design. The `Cache` facade can work with memory, LRU memory, or file-backed storage because every backend implements the same `CacheStore` interface. The application chooses the storage model, and the cache applies the same policy rules on top of it.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct store headers are also available:

```cpp
#include <vix/cache/CacheStore.hpp>
#include <vix/cache/MemoryStore.hpp>
#include <vix/cache/LruMemoryStore.hpp>
#include <vix/cache/FileStore.hpp>
```

## Store role

A store is responsible for persistence operations:

```cpp
store->put(key, entry);
auto entry = store->get(key);
store->erase(key);
store->clear();
```

The store does not decide whether an entry is fresh, stale, or expired. That decision belongs to `Cache`, using the active `CachePolicy` and the `CacheContext`.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

This is why the same store can be used with different cache policies.

## CacheStore interface

`CacheStore` is the abstract base class for cache storage backends.

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

The interface is intentionally small. It gives the cache facade enough operations to store entries, read entries, remove one entry, or remove all entries.

## Available stores

The module provides three store implementations.

| Store            | Storage                         | Main use                                        |
| ---------------- | ------------------------------- | ----------------------------------------------- |
| `MemoryStore`    | In-memory map                   | Tests, prototypes, short-lived caches.          |
| `LruMemoryStore` | In-memory map with LRU eviction | Bounded memory caches.                          |
| `FileStore`      | JSON file on disk               | Persistent local cache across process restarts. |

Each store implements `CacheStore`, so it can be passed to `Cache` through `std::shared_ptr<CacheStore>`.

```cpp
std::shared_ptr<vix::cache::CacheStore> store =
    std::make_shared<vix::cache::MemoryStore>();
```

## MemoryStore

`MemoryStore` is the simplest store. It keeps entries in an in-memory map protected by a mutex.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

Use it when the cache should live only for the lifetime of the process.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

`MemoryStore` does not persist entries to disk and does not evict entries automatically. It is a good default for tests, small examples, and runtime caches with explicit lifecycle control.

## LruMemoryStore

`LruMemoryStore` keeps entries in memory and evicts the least recently used entries when the configured maximum size is exceeded.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

Use it when the cache should be fast but bounded.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

When the store is full and a new entry is inserted, the least recently used entry is removed. A successful `get()` updates the entry recency, so frequently used entries stay in the cache longer.

## FileStore

`FileStore` persists entries into a JSON file on disk.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

Use it when cached responses should survive process restarts.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 60'000;

vix::cache::Cache cache(policy, store);
```

`FileStore` loads its file lazily on first access and keeps an in-memory map protected by a mutex. Mutations are flushed back to disk. This favors simplicity and durability over high write throughput.

## Choosing a store

Use `MemoryStore` when the cache is temporary.

```cpp
auto store = std::make_shared<vix::cache::MemoryStore>();
```

Use `LruMemoryStore` when the cache must stay within a fixed number of entries.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 512});
```

Use `FileStore` when entries must be available after the process exits.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = false});
```

The right store depends on the lifecycle of the data. A server hot path often wants memory or LRU memory. A local-first application often wants file persistence.

## Complete example with MemoryStore

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
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto cached = cache.get(
      key,
      created_at + 100,
      vix::cache::CacheContext::Online());

  vix::print(cached ? "cache hit" : "cache miss");

  return 0;
}
```

This example uses memory only. When the program exits, the cache is gone.

## Complete example with LruMemoryStore

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

static vix::cache::CacheEntry make_entry(
    const std::string &body,
    std::int64_t created_at)
{
  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = body;
  entry.created_at_ms = created_at;

  return entry;
}

int main()
{
  auto store = std::make_shared<vix::cache::LruMemoryStore>(
      vix::cache::LruMemoryStore::Config{
          .max_entries = 2});

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  const std::int64_t t0 = 10'000;

  cache.put("k1", make_entry("A", t0));
  cache.put("k2", make_entry("B", t0));

  (void)cache.get(
      "k1",
      t0 + 1,
      vix::cache::CacheContext::Online());

  cache.put("k3", make_entry("C", t0 + 2));

  auto k1 = cache.get(
      "k1",
      t0 + 3,
      vix::cache::CacheContext::Online());

  auto k2 = cache.get(
      "k2",
      t0 + 3,
      vix::cache::CacheContext::Online());

  auto k3 = cache.get(
      "k3",
      t0 + 3,
      vix::cache::CacheContext::Online());

  vix::print("k1:", k1 ? "present" : "missing");
  vix::print("k2:", k2 ? "present" : "missing");
  vix::print("k3:", k3 ? "present" : "missing");

  return 0;
}
```

`k2` is removed because `k1` was touched before `k3` was inserted. With a maximum size of two entries, the least recently used entry is evicted.

## Complete example with FileStore

```cpp
#include <filesystem>
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  const std::filesystem::path file = "./.vix/cache_http.json";
  const std::string key = "GET /api/products?limit=3";
  const std::int64_t created_at = 10'000;

  {
    auto store = std::make_shared<vix::cache::FileStore>(
        vix::cache::FileStore::Config{
            .file_path = file,
            .pretty_json = true});

    vix::cache::CachePolicy policy;
    policy.ttl_ms = 10'000;

    vix::cache::Cache cache(policy, store);

    vix::cache::CacheEntry entry;

    entry.status = 200;
    entry.body = R"({"source":"disk"})";
    entry.headers["Content-Type"] = "application/json";
    entry.created_at_ms = created_at;

    cache.put(key, entry);

    vix::print("entry written");
  }

  {
    auto store = std::make_shared<vix::cache::FileStore>(
        vix::cache::FileStore::Config{
            .file_path = file,
            .pretty_json = false});

    vix::cache::CachePolicy policy;
    policy.ttl_ms = 10'000;

    vix::cache::Cache cache(policy, store);

    auto cached = cache.get(
        key,
        created_at + 100,
        vix::cache::CacheContext::Online());

    if (!cached)
    {
      vix::print("cache miss after reload");
      return 1;
    }

    vix::print("cache hit after reload");
    vix::print("body:", cached->body);
  }

  return 0;
}
```

The first scope writes the entry. The second scope creates a new store and reads the same entry from disk.

## Direct store operations

The cache facade is the normal way to use stores because it applies policy. Direct store operations are still useful for tests and maintenance code.

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

Direct store reads do not apply `CachePolicy`. They only tell you whether the entry exists in the backend.

## Store and policy separation

A store can contain an entry that `Cache::get()` refuses to return.

```cpp
auto raw = store->get(key);
```

The raw store may return the entry because it exists.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

The cache may return a miss because the entry is expired under the active policy.

This distinction is important. Storage presence and cache usability are not the same thing.

## Header normalization

Header normalization happens when an entry is inserted through `Cache::put`.

```cpp
entry.headers["Content-Type"] = "application/json";

cache.put(key, entry);
```

The stored entry uses lowercase header names.

```text
content-type
```

If an entry is inserted directly into a store, the cache facade is bypassed and header normalization is not applied by `Cache::put`. Use the cache facade for normal application writes.

## Pruning support

`Cache::prune()` removes entries that are too old under the active policy.

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

The current pruning implementation can remove expired entries from `LruMemoryStore` and `FileStore`.

```cpp
auto lru_store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});

auto file_store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

For a plain `MemoryStore`, direct lifecycle control is usually enough: erase specific entries or clear the store.

```cpp
store->erase(key);
store->clear();
```

## Thread-safety

The provided stores use a mutex to protect their internal maps. This makes basic store operations safe against concurrent access to the store object.

This does not make every larger application workflow automatically atomic. A sequence such as `get`, then network request, then `put` is still an application-level operation. The store protects its internal state, while the caller remains responsible for the larger request flow.

## CMake

The store implementations are part of the cache module target.

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
)
```

If the example uses `vix::print`, link `vix::io` too:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::cache
    vix::io
)
```

## Common mistakes

### Treating store hits as valid cache hits

A store can return an entry that is too old for the active cache policy.

```cpp
auto raw = store->get(key);
```

Use `Cache::get()` when the question is whether the entry can be served.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

### Using MemoryStore when persistence is required

`MemoryStore` does not survive process restarts. Use `FileStore` when the cache must be reused later.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

### Using unbounded memory for long-running processes

A plain memory store has no eviction policy. Use `LruMemoryStore` when memory should stay bounded.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

### Bypassing Cache::put without a reason

`Cache::put()` normalizes response headers before storing the entry. Direct store insertion bypasses that behavior. Use `Cache::put()` for normal application writes.

### Expecting FileStore to be a high-throughput database

`FileStore` persists a JSON file and flushes mutations to disk. It is useful for simple durable local caches, not for large high-write workloads.

## Next step

Continue with the Memory Store page to see the simplest cache backend in detail.
