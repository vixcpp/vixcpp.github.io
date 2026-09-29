# LRU Memory Store

`LruMemoryStore` is an in-memory cache store with least-recently-used eviction. It keeps cache entries in memory, but unlike `MemoryStore`, it has a fixed maximum number of entries.

Use `LruMemoryStore` when a cache must stay fast and bounded. It is useful for servers, local runtimes, edge processes, and application layers where persistence is not required but unbounded memory growth would be a problem.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the LRU store:

```cpp
#include <vix/cache/LruMemoryStore.hpp>
```

## Role

`LruMemoryStore` implements `CacheStore`.

It provides the normal store operations:

```cpp
put(key, entry)
get(key)
erase(key)
clear()
```

It also keeps an internal recency order. The most recently used entries stay in the cache. When the number of entries becomes greater than `max_entries`, the least recently used entry is removed.

The store decides what to keep in memory. The `Cache` facade still decides whether a stored entry is fresh, stale, or expired under the active `CachePolicy`.

## Configuration

Create an LRU store with `LruMemoryStore::Config`.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 1024});
```

`max_entries` is the maximum number of entries the store should keep.

```cpp
vix::cache::LruMemoryStore::Config config;

config.max_entries = 512;
```

A small value is useful for examples and tests. A larger value is more practical for real application caches.

## Minimal example

This example creates an LRU cache with room for two entries.

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

  auto k1 = cache.get(
      "k1",
      t0 + 1,
      vix::cache::CacheContext::Online());

  vix::print("k1:", k1 ? "present" : "missing");

  return 0;
}
```

At this point both `k1` and `k2` fit in the store because `max_entries` is `2`.

## Eviction behavior

When a new entry is inserted and the store is already full, the least recently used entry is removed.

```cpp
cache.put("k1", make_entry("A", t0));
cache.put("k2", make_entry("B", t0));

cache.put("k3", make_entry("C", t0 + 1));
```

With `max_entries = 2`, the store cannot keep all three entries. Since `k1` is the least recently used entry, it is evicted.

## Access updates recency

A successful `get()` marks the entry as recently used.

```cpp
cache.put("k1", make_entry("A", t0));
cache.put("k2", make_entry("B", t0));

(void)cache.get(
    "k1",
    t0 + 1,
    vix::cache::CacheContext::Online());

cache.put("k3", make_entry("C", t0 + 2));
```

Here `k1` is touched before `k3` is inserted. That makes `k2` the least recently used entry, so `k2` is evicted.

## Complete eviction example

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

Expected output:

```text
k1: present
k2: missing
k3: present
```

`k2` is missing because `k1` was accessed before `k3` was inserted. That access moved `k1` to the most recently used position.

## Store hit and cache hit

A direct store lookup checks whether an entry exists in the LRU store.

```cpp
auto raw = store->get("k1");
```

A cache lookup checks whether the entry exists and whether it is usable under the active policy.

```cpp
auto cached = cache.get(
    "k1",
    now_ms,
    vix::cache::CacheContext::Online());
```

These are not the same question. The store can contain an entry that the cache refuses to serve because it is expired.

## LRU eviction and policy expiration

LRU eviction and policy expiration are separate mechanisms.

LRU eviction removes entries because the store has reached its size limit.

```cpp
vix::cache::LruMemoryStore::Config{
    .max_entries = 2}
```

Policy expiration rejects entries because they are too old for the current context.

```cpp
policy.ttl_ms = 1'000;
```

An entry can be evicted even if it is still fresh. An entry can also remain in the store but be rejected by `Cache::get()` because it is expired. The store controls memory size, while the cache policy controls usability.

## Example: present in store but expired by policy

```cpp
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  auto store = std::make_shared<vix::cache::LruMemoryStore>(
      vix::cache::LruMemoryStore::Config{
          .max_entries = 10});

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 1'000;
  policy.allow_stale_if_offline = false;
  policy.allow_stale_if_error = false;

  vix::cache::Cache cache(policy, store);

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = "old but still stored";
  entry.created_at_ms = 10'000;

  cache.put("key", entry);

  auto raw = store->get("key");

  auto cached = cache.get(
      "key",
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

The entry is still in the store because it has not been evicted. The cache rejects it because it is too old for the policy.

## Offline and network-error reuse

`LruMemoryStore` works with the same policy rules as every other store.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

A stale entry can be returned while offline:

```cpp
auto cached = cache.get(
    key,
    created_at + 3'000,
    vix::cache::CacheContext::Offline());
```

A stale entry can also be returned after a network error:

```cpp
auto cached = cache.get(
    key,
    created_at + 4'000,
    vix::cache::CacheContext::NetworkError());
```

The store keeps entries in memory. The policy decides whether those entries can be served.

## Pruning

`Cache::prune()` can remove entries from `LruMemoryStore` when they are older than the maximum useful age under the active policy.

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

This is different from LRU eviction. LRU eviction removes entries because the store is over capacity. Pruning removes entries because they are too old to be useful under the policy.

## Complete pruning example

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
          .max_entries = 1024});

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 1'000;
  policy.allow_stale_if_offline = false;
  policy.allow_stale_if_error = false;

  vix::cache::Cache cache(policy, store);

  const std::int64_t now = 10'000;

  cache.put("fresh", make_entry("fresh", now));
  cache.put("stale", make_entry("stale", now - 5'000));

  const auto removed = cache.prune(now + 500);

  auto fresh = cache.get(
      "fresh",
      now + 500,
      vix::cache::CacheContext::Online());

  auto stale = cache.get(
      "stale",
      now + 500,
      vix::cache::CacheContext::Online());

  vix::print("removed:", removed);
  vix::print("fresh:", fresh ? "present" : "missing");
  vix::print("stale:", stale ? "present" : "missing");

  return 0;
}
```

Expected output:

```text
removed: 1
fresh: present
stale: missing
```

The stale entry is removed because it is older than the maximum age allowed by the strict policy.

## Direct store operations

`LruMemoryStore` can be used directly through the `CacheStore` interface.

```cpp
auto store = std::make_shared<vix::cache::LruMemoryStore>(
    vix::cache::LruMemoryStore::Config{
        .max_entries = 2});

vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = "direct";
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

Direct usage is useful for tests and low-level store checks. Normal application reads should go through `Cache::get()` so the policy and context are applied.

## Erase and clear

Remove one entry with `erase`.

```cpp
store->erase("GET /api/users?page=1");
```

Remove all entries with `clear`.

```cpp
store->clear();
```

These operations update the internal map and the LRU list together.

## Thread-safety

`LruMemoryStore` protects its internal state with a mutex. The map and recency list are updated under that lock.

Basic operations such as `put`, `get`, `erase`, and `clear` are protected at the store level. A larger application flow, such as cache lookup followed by a network request and a later cache write, is still controlled by the caller.

## Performance characteristics

`LruMemoryStore` uses a hash map and a linked list internally.

The hash map provides average constant-time lookup by key. The list keeps the recency order. When an entry is read or updated, the store moves its key to the most recently used position. When the store exceeds `max_entries`, it removes keys from the least recently used side.

This gives the store predictable behavior for hot-path memory caching.

## No persistence

`LruMemoryStore` is memory-only. It does not write entries to disk.

When the store object is destroyed, its entries are gone. When the process exits, the cache is gone.

Use `FileStore` when entries must survive process restarts.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

## Header normalization

When entries are inserted through `Cache::put`, response header names are normalized to lowercase before the entry reaches the store.

```cpp
entry.headers["Content-Type"] = "application/json";

cache.put(key, entry);
```

A later read returns normalized header names:

```text
content-type
```

Direct store insertion bypasses this cache-level normalization. Use `Cache::put()` for normal application writes.

## CMake

`LruMemoryStore` is part of the cache module target.

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

`LruMemoryStore` does not persist entries. It is a bounded in-memory store. Use `FileStore` when cached entries must survive process restarts.

### Forgetting that `get()` changes recency

A successful `get()` marks the entry as recently used.

```cpp
(void)cache.get(
    "k1",
    now_ms,
    vix::cache::CacheContext::Online());
```

This can change which entry will be evicted next.

### Treating LRU eviction as expiration

LRU eviction is based on capacity. Expiration is based on time and policy. They solve different problems.

### Setting `max_entries` too low

A very small `max_entries` value can cause useful entries to be evicted quickly.

```cpp
vix::cache::LruMemoryStore::Config{
    .max_entries = 2}
```

Use a value that matches the application workload.

### Reading directly from the store for serving responses

Direct store reads do not apply `CachePolicy`.

```cpp
auto raw = store->get(key);
```

Use `Cache::get()` when deciding whether an entry can be served.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

## Next step

Continue with the File Store page to understand how cache entries are persisted to disk and reloaded across process restarts.
