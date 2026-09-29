# Pruning

Pruning removes cache entries that are too old to be useful under the active `CachePolicy`. It is a cleanup operation. It does not decide whether one specific request should be served from cache; that is the role of `Cache::get`. Instead, pruning helps keep long-running caches and file-backed caches from keeping entries that can no longer be returned in any allowed context.

The cache module keeps pruning policy-driven. An entry is removed only when its age is greater than the maximum age allowed by the policy, including normal freshness, stale-if-offline, and stale-if-error windows.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic usage

Call `prune` on the cache facade and pass the current time in milliseconds.

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

The return value is the number of entries removed.

```cpp
std::size_t removed = cache.prune(now_ms);
```

Use this in cleanup loops, application startup, shutdown maintenance, or after a group of cache writes when old entries should be removed.

## What pruning removes

Pruning removes entries whose age is greater than the maximum useful age under the active policy.

The entry age is calculated from the current time and the entry creation time.

```cpp
const auto age_ms = now_ms - entry.created_at_ms;
```

The maximum useful age starts with `ttl_ms`.

```cpp
policy.ttl_ms = 1'000;
```

If stale-if-error is enabled, the error stale window can extend the maximum useful age.

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

If stale-if-offline is enabled, the offline stale window can also extend the maximum useful age.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

With this policy, an entry can be useful up to `10'000` milliseconds because the offline stale window is the largest active window. Entries older than that can be pruned.

## Strict policy

A strict policy only allows fresh entries.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = false;
policy.allow_stale_if_error = false;
```

With this policy, pruning removes entries older than `1'000` milliseconds.

```cpp
const auto removed = cache.prune(now_ms);
```

This is useful when stale data should not be kept after it expires.

## Offline-first policy

An offline-first policy often keeps entries longer because stale data can still be useful when the application is offline.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 10'000;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10 * 60'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5 * 60'000;
```

With this policy, pruning keeps entries that may still be useful during offline operation. An entry older than the largest active window can be removed because no supported context should serve it.

## Supported stores

`Cache::prune()` removes entries from stores that provide predicate-based removal.

The current cache facade prunes:

```text
LruMemoryStore
FileStore
```

For other stores, `prune()` may return `0`.

This matters for `MemoryStore`. A plain memory store is intentionally minimal. Use direct lifecycle operations when needed:

```cpp
store->erase(key);
store->clear();
```

For automatic size control, use `LruMemoryStore`. For durable cache cleanup, use `FileStore`.

## Pruning with LruMemoryStore

`LruMemoryStore` can be pruned by policy age.

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

## Pruning with FileStore

`FileStore` can also be pruned. Removed entries are deleted from the in-memory map and the JSON file is flushed again.

```cpp
#include <filesystem>
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
  const std::filesystem::path file = "./.vix/cache_prune.json";

  auto store = std::make_shared<vix::cache::FileStore>(
      vix::cache::FileStore::Config{
          .file_path = file,
          .pretty_json = true});

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

This is useful for persistent offline caches because old entries are removed from disk once they are no longer useful under the active policy.

## Pruning and stale windows

Pruning respects stale windows. An entry older than the TTL is not always removed if the policy still allows it in an offline or network-error context.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

With this policy, an entry that is `4'000` milliseconds old is stale, but still useful. It can be served after a network error and while offline. Pruning should keep it.

An entry that is `20'000` milliseconds old is older than every active window, so it can be removed.

## Example with stale windows

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

  policy.allow_stale_if_offline = true;
  policy.stale_if_offline_ms = 10'000;

  policy.allow_stale_if_error = true;
  policy.stale_if_error_ms = 5'000;

  vix::cache::Cache cache(policy, store);

  const std::int64_t now = 10'000;

  cache.put("fresh", make_entry("fresh", now));
  cache.put("still-useful", make_entry("still useful", now - 4'000));
  cache.put("too-old", make_entry("too old", now - 20'000));

  const auto removed = cache.prune(now);

  auto fresh = cache.get(
      "fresh",
      now,
      vix::cache::CacheContext::Online());

  auto still_useful = cache.get(
      "still-useful",
      now,
      vix::cache::CacheContext::Offline());

  auto too_old = cache.get(
      "too-old",
      now,
      vix::cache::CacheContext::Offline());

  vix::print("removed:", removed);
  vix::print("fresh:", fresh ? "present" : "missing");
  vix::print("still useful:", still_useful ? "present" : "missing");
  vix::print("too old:", too_old ? "present" : "missing");

  return 0;
}
```

Expected output:

```text
removed: 1
fresh: present
still useful: present
too old: missing
```

The stale but still useful entry remains because it is inside the offline stale window.

## Pruning is not LRU eviction

Pruning and LRU eviction solve different problems.

LRU eviction removes entries because the store has exceeded its capacity.

```cpp
vix::cache::LruMemoryStore::Config{
    .max_entries = 1024}
```

Pruning removes entries because they are too old under the active policy.

```cpp
cache.prune(now_ms);
```

An entry can be evicted even if it is fresh when the store is full. An entry can also remain in the store but be rejected by `Cache::get()` because it is expired. These mechanisms are separate by design.

## Pruning is not a cache lookup

`Cache::get()` answers whether one key can be served now.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

`Cache::prune()` removes old entries from the store.

```cpp
const auto removed = cache.prune(now_ms);
```

Use `get()` on the request path. Use `prune()` as a maintenance operation.

## When to prune

Prune when the application has a natural maintenance point.

```text
application startup
after a group of cache writes
before shutdown
inside a periodic cleanup loop
before compacting a file-backed cache
```

For long-running processes, periodic pruning prevents old entries from accumulating. For file-backed caches, pruning keeps the JSON file smaller and easier to inspect.

## Choosing a pruning schedule

The pruning schedule should match the cache policy and workload. A very short TTL with a busy cache may benefit from periodic cleanup. A small file-backed cache may only need pruning at startup or after writes.

Avoid pruning too aggressively when stale windows are important. If the policy allows offline reuse for ten minutes, pruning every second is fine as long as pruning uses the same policy. The entries inside the stale window are still kept.

## Direct cleanup

Stores still expose direct cleanup operations.

Remove one entry:

```cpp
store->erase(key);
```

Remove all entries:

```cpp
store->clear();
```

Use direct cleanup when the application knows a specific entry is invalid, such as after logout, account switch, or an explicit cache reset.

Use pruning when the decision is based on age and policy.

## Header normalization and pruning

Pruning does not modify response headers. Header normalization happens when entries are inserted through `Cache::put`.

```cpp
cache.put(key, entry);
```

Pruning only decides whether an entry should remain in the store.

## Common mistakes

### Expecting prune to serve a response

`prune()` is cleanup. It does not return a cached entry.

```cpp
const auto removed = cache.prune(now_ms);
```

Use `Cache::get()` to read a cache entry.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

### Expecting MemoryStore pruning to remove entries

The current pruning path removes entries from stores that support predicate-based removal through the cache facade, such as `LruMemoryStore` and `FileStore`.

For a plain memory store, use direct cleanup when needed.

```cpp
store->erase(key);
store->clear();
```

### Forgetting stale windows

An entry older than the TTL may still be useful if the policy allows stale offline or stale-on-error reuse.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

Pruning uses the largest active useful window, not only the TTL.

### Using one policy for reads and another for pruning

Pruning should use the same policy concept as cache reads. If reads allow offline stale reuse for ten minutes, pruning with a stricter policy can remove entries that offline mode expected to use.

### Treating pruning as persistence

Pruning removes old entries. It does not make entries durable. Use `FileStore` when entries must survive process restarts.

## CMake

Pruning is part of the cache module implementation.

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

Continue with the context mapper page to understand how cache contexts can be built from network state and request outcomes.
