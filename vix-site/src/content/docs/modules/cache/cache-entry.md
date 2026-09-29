# Cache Entry

`CacheEntry` represents one cached response. It stores the response payload and the minimal metadata needed by the cache policy to decide whether the entry can still be used.

A cache entry does not decide its own validity. It only carries data. The decision is made later by `Cache`, using the active `CachePolicy`, the current time, and the `CacheContext` passed by the caller.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the entry type:

```cpp
#include <vix/cache/CacheEntry.hpp>
```

## Structure

A cache entry contains four fields:

```cpp
vix::cache::CacheEntry entry;

entry.status = 200;
entry.body = R"({"ok":true})";
entry.headers["Content-Type"] = "application/json";
entry.created_at_ms = 1'000;
```

| Field           | Type                                           | Purpose                        |
| --------------- | ---------------------------------------------- | ------------------------------ |
| `status`        | `int`                                          | Response status code.          |
| `body`          | `std::string`                                  | Stored response body.          |
| `headers`       | `std::unordered_map<std::string, std::string>` | Stored response headers.       |
| `created_at_ms` | `std::int64_t`                                 | Creation time in milliseconds. |

The default status is `200`. The body starts empty, headers start empty, and `created_at_ms` starts at `0`.

## Why `created_at_ms` matters

The cache policy works from entry age. The age is calculated from the time passed to `Cache::get` and the entry creation time.

```cpp
const auto age_ms = now_ms - entry.created_at_ms;
```

This is why every real cache entry should set `created_at_ms` before it is stored.

```cpp
entry.created_at_ms = now_ms();
```

The cache does not call the clock for you when checking an entry. The caller passes the current time. This makes cache behavior deterministic and easy to test with fixed timestamps.

## Minimal example

This example creates one entry, stores it, and reads it back while it is fresh.

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

The entry is returned because it is only `100` milliseconds old and the policy TTL is `10'000` milliseconds.

## Status

`status` stores the response status code.

```cpp
entry.status = 200;
```

For HTTP-style caching, this is usually the status code returned by the server. The cache module does not force a specific meaning on the value. It stores the status so higher layers can decide how to interpret the cached response.

```cpp
if (cached->status == 200)
{
  vix::print("cached response is ok");
}
```

A higher-level HTTP cache can use this field to preserve the shape of the original response.

## Body

`body` stores the response payload.

```cpp
entry.body = R"({"source":"cache"})";
```

The cache module treats the body as a string. It does not parse JSON, HTML, text, or binary formats. This keeps the cache layer simple and lets higher layers decide how the body should be interpreted.

```cpp
vix::print("body:", cached->body);
```

For HTTP GET caching, this is usually the response body returned by the network layer.

## Headers

`headers` stores response headers.

```cpp
entry.headers["Content-Type"] = "application/json";
entry.headers["X-Powered-By"] = "Vix";
```

Headers are useful when a higher layer wants to preserve response metadata together with the body. They can also help debugging because the cached entry remains close to the original response shape.

When an entry is inserted through `Cache::put`, header names are normalized to lowercase before the entry is stored.

```cpp
cache.put(key, entry);
```

After insertion, headers such as `Content-Type` and `X-Powered-By` are stored as:

```text
content-type
x-powered-by
```

This avoids duplicated header names caused by case differences.

## Header normalization example

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

  const std::string key = "GET /api/headers";
  const auto created_at = now_ms();

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = "ok";
  entry.headers["Content-Type"] = "application/json";
  entry.headers["X-Powered-By"] = "Vix";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto cached = cache.get(
      key,
      created_at + 1,
      vix::cache::CacheContext::Online());

  if (!cached)
  {
    vix::print("cache miss");
    return 1;
  }

  for (const auto &[name, value] : cached->headers)
  {
    vix::print(name, "=", value);
  }

  return 0;
}
```

The printed header names are lowercase because the cache normalizes them before storing the entry.

## Entry age and policy decisions

The same entry can be accepted or rejected depending on its age and context.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 100;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
```

An entry created at `t0` is fresh at `t0 + 50`:

```cpp
auto fresh = cache.get(
    key,
    t0 + 50,
    vix::cache::CacheContext::Online());
```

The same entry is stale at `t0 + 3'000`, but it can still be returned if the application is offline and the policy allows stale offline reuse:

```cpp
auto offline = cache.get(
    key,
    t0 + 3'000,
    vix::cache::CacheContext::Offline());
```

The entry carries the timestamp. The policy and context decide whether the timestamp is still acceptable.

## Fresh entry example

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

  vix::cache::Cache cache(policy, store);

  const std::string key = "GET /api/profile";
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"name":"Vix"})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto cached = cache.get(
      key,
      10'500,
      vix::cache::CacheContext::Online());

  vix::print(cached ? "fresh hit" : "miss");

  return 0;
}
```

The entry is returned because its age is `500` milliseconds and the TTL is `1'000` milliseconds.

## Expired entry example

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
  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"name":"Vix"})";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  auto cached = cache.get(
      key,
      15'000,
      vix::cache::CacheContext::Online());

  vix::print(cached ? "cache hit" : "cache miss");

  return 0;
}
```

The entry is not returned because it is older than the TTL and the policy does not allow stale reuse for this context.

## FileStore persistence

When a `CacheEntry` is stored in `FileStore`, it is serialized into the cache JSON file with its status, body, headers, and creation timestamp.

```cpp
auto store = std::make_shared<vix::cache::FileStore>(
    vix::cache::FileStore::Config{
        .file_path = "./.vix/cache_http.json",
        .pretty_json = true});
```

A later cache instance can reload the entry from disk and apply the same policy rules.

```cpp
auto cached = cache.get(
    key,
    now_ms(),
    vix::cache::CacheContext::Online());
```

The store preserves the entry. The cache still decides whether it is usable.

## Common mistakes

### Forgetting `created_at_ms`

An entry with `created_at_ms = 0` may be treated as very old when the current time is passed to `Cache::get`.

```cpp
entry.created_at_ms = now_ms();
```

Set the timestamp when the response is produced or received.

### Treating the entry as the policy

`CacheEntry` only stores data. It does not know whether it is fresh, stale, expired, or acceptable while offline. Those decisions belong to `CachePolicy` and `CacheContext`.

### Depending on header case

Headers are normalized when the entry is stored through `Cache::put`.

```cpp
entry.headers["Content-Type"] = "application/json";
cache.put(key, entry);
```

Read normalized names from cached entries:

```cpp
auto it = cached->headers.find("content-type");
```

### Storing different response types under the same key

A cache entry is only as correct as its key. If two different requests use the same key, the later entry can replace the earlier one. Use `CacheKey::fromRequest()` when the entry comes from a request.

```cpp
const std::string key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers);
```

## Next step

Continue with the cache policy page to understand how TTL, stale-if-offline, and stale-if-error decide whether a `CacheEntry` can be served.
