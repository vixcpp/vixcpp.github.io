# File Store

`FileStore` is the file-backed cache store provided by the `cache` module. It stores cache entries in a JSON file so cached responses can survive process restarts.

Use `FileStore` when the cache must be local, simple, and durable. It is useful for offline-first applications, local developer tools, edge runtimes, and small HTTP cache layers that need persistence without introducing an external database.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the file-backed store:

```cpp
#include <vix/cache/FileStore.hpp>
```

## Role

`FileStore` implements `CacheStore`.

It provides the standard store operations:

```cpp
put(key, entry)
get(key)
erase(key)
clear()
```

The store is responsible for persistence. It does not decide whether a cached entry is fresh, stale, expired, acceptable while offline, or acceptable after a network error. Those decisions belong to `Cache`, using `CachePolicy` and `CacheContext`.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

This means a file can contain an entry that `Cache::get()` refuses to serve because the entry is too old for the active policy.

## Configuration

`FileStore` is configured with `FileStore::Config`.

```cpp
vix::cache::FileStore::Config config;

config.file_path = "./.vix/cache_http.json";
config.pretty_json = true;
```

| Field         | Purpose                                                   |
| ------------- | --------------------------------------------------------- |
| `file_path`   | Path to the JSON file used for persistence.               |
| `pretty_json` | Writes formatted JSON when enabled. Useful for debugging. |

The default file path is:

```text
./.vix/cache_http.json
```

## Create a file store

Create the store with `std::make_shared`.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

Then pass it to `Cache`.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 10'000;

vix::cache::Cache cache(policy, store);
```

The cache facade applies the policy. The file store keeps the entries on disk.

## Minimal example

This example writes one entry to a file-backed cache, then reads it back.

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
  vix::print("body:", cached->body);

  return 0;
}
```

The entry is written to the configured JSON file and returned because it is still fresh under the active policy.

## Persistence across cache instances

`FileStore` is useful because a later store instance can reload entries from the same file.

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

The first scope writes the entry. The second scope creates a new store and reads the entry from the same file.

## JSON format

`FileStore` persists entries as JSON. Each cache key maps to a stored entry containing the response status, body, headers, and creation timestamp.

A simplified file can look like this:

```json
{
  "GET /api/products?limit=3": {
    "status": 200,
    "body": "{\"source\":\"disk\"}",
    "headers": {
      "content-type": "application/json"
    },
    "created_at_ms": 10000
  }
}
```

The exact file is an implementation detail, but it is intentionally inspectable. This makes debugging easier when working with local-first applications and offline cache behavior.

## Pretty JSON

`pretty_json` controls whether the file is formatted for readability.

```cpp
vix::cache::FileStore::Config config;

config.file_path = "./.vix/cache_http.json";
config.pretty_json = true;
```

Pretty JSON is useful during development because the cache file can be opened and inspected directly. For normal runtime use, compact JSON is smaller.

```cpp
config.pretty_json = false;
```

The choice does not change cache behavior. It only changes how the JSON file is written.

## Lazy loading

`FileStore` does not read the file immediately when the store object is constructed. It loads the file lazily on first access.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});
```

The file is loaded when an operation such as `get`, `put`, `erase`, or `clear` needs the internal map.

This keeps construction cheap and avoids unnecessary file work when the store is created but not used.

## Flush on mutation

Mutating operations write the in-memory state back to disk.

```cpp
cache.put(key, entry);
store->erase(key);
store->clear();
```

This makes the store simple and durable. When an entry is inserted, removed, or the store is cleared, the JSON file is updated.

This design favors correctness and simplicity over high write throughput. For very large caches or workloads with many writes per second, a different backend may be more appropriate.

## Directory creation

When the store flushes data, it creates the parent directories for the configured file path.

```cpp
vix::cache::FileStore::Config config;

config.file_path = "./.vix/cache_http.json";
```

The `.vix` directory can be created when the file is written.

This is useful for local-first applications because the cache path can point to a project-local or application-local directory without requiring the caller to create every directory manually.

## Header normalization

When an entry is inserted through `Cache::put`, response header names are normalized to lowercase before reaching the store.

```cpp
entry.headers["Content-Type"] = "application/json";

cache.put(key, entry);
```

The persisted JSON stores the normalized header name:

```json
{
  "content-type": "application/json"
}
```

Direct store insertion bypasses that cache-level normalization.

```cpp
store->put(key, entry);
```

Use `Cache::put()` for normal application writes.

## Store hit and cache hit

A file can contain an entry that is not usable under the active cache policy.

A direct store lookup only checks whether the entry exists:

```cpp
auto raw = store->get(key);
```

A cache lookup checks whether the entry exists and whether it can be served for the current time and context:

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

For serving application responses, use `Cache::get()`.

## Example: stored on disk but expired by policy

```cpp
#include <filesystem>
#include <memory>
#include <string>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  const std::filesystem::path file = "./.vix/cache_expired.json";
  const std::string key = "GET /api/profile";

  auto store = std::make_shared<vix::cache::FileStore>(
      vix::cache::FileStore::Config{
          .file_path = file,
          .pretty_json = true});

  vix::cache::CachePolicy policy;

  policy.ttl_ms = 1'000;
  policy.allow_stale_if_offline = false;
  policy.allow_stale_if_error = false;

  vix::cache::Cache cache(policy, store);

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

The entry exists on disk, but the cache rejects it because it is too old for the active policy.

## Offline reuse

`FileStore` works with offline-first policies in the same way as memory stores.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

A stale entry can be returned while offline:

```cpp
auto cached = cache.get(
    key,
    created_at + 3'000,
    vix::cache::CacheContext::Offline());
```

Because the entry is persisted, this can work even after the application restarts, as long as the entry is still inside the allowed stale window.

## Network-error reuse

A file-backed cache can also serve stale data after a network error.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

After a network request fails because of the network, use `NetworkError` context:

```cpp
auto cached = cache.get(
    key,
    created_at + 4'000,
    vix::cache::CacheContext::NetworkError());
```

This gives the application a controlled fallback when the latest response cannot be fetched.

## Pruning

`Cache::prune()` can remove old entries from `FileStore`.

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

Pruning uses the active policy to determine the maximum useful age. Entries older than that age are removed from the file-backed store and the JSON file is flushed again.

## Complete pruning example

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

The stale entry is removed from the file-backed cache because it is older than the maximum useful age under the policy.

## Direct store operations

`FileStore` can be used directly through the `CacheStore` interface.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json"});

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

Direct usage is useful for tests and store-level maintenance code. Normal application reads should go through `Cache::get()` so policy and context are applied.

## Clear and erase

Remove one entry with `erase`.

```cpp
store->erase("GET /api/users?page=1");
```

Remove all entries with `clear`.

```cpp
store->clear();
```

Both operations flush the updated state back to the JSON file.

## Thread-safety

`FileStore` protects its internal map with a mutex. Basic operations such as `put`, `get`, `erase`, and `clear` are protected at the store level.

The store keeps an in-memory map after loading the file. Mutations update that map and flush it back to disk.

This does not make larger application flows automatically atomic. A sequence such as cache lookup, network request, and cache write is still controlled by the caller.

## Performance model

`FileStore` prioritizes simple durable persistence.

It is appropriate when:

```text
the cache is small or moderate
writes are not extremely frequent
local JSON inspection is useful
external storage is not desired
```

It is not meant to be a high-throughput cache database. For heavy write workloads or very large caches, a different backend should be considered.

## CMake

`FileStore` is part of the cache module target.

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

### Expecting FileStore to ignore policy

The store persists entries. It does not make them valid forever.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

A persisted entry can still be rejected when it is too old.

### Using FileStore for high-write workloads

`FileStore` flushes mutations to disk. This is simple and durable, but not designed for heavy write throughput.

### Reading directly from the store to serve responses

Direct store reads do not apply TTL or stale rules.

```cpp
auto raw = store->get(key);
```

Use `Cache::get()` when deciding whether an entry can be served.

```cpp
auto cached = cache.get(key, now_ms, ctx);
```

### Forgetting that `pretty_json` is only formatting

`pretty_json` changes how the file is written. It does not change cache behavior.

```cpp
.pretty_json = true
```

Use it for debugging and inspection. Disable it when compact output is preferred.

### Bypassing header normalization

Header normalization is applied by `Cache::put`.

```cpp
cache.put(key, entry);
```

Direct `store->put` bypasses that cache-level behavior.

## Next step

Continue with the offline and network errors page to see how `FileStore`, `MemoryStore`, and `LruMemoryStore` behave under offline-first cache policies.
