# Cache Keys

`CacheKey` builds deterministic cache keys from request components. It is mainly used for HTTP-style caching, where the same logical request should map to the same cache entry even when small formatting details change.

A cache key should be stable. If two requests are logically the same, they should produce the same key. If two requests are meaningfully different, the key should reflect that difference. `CacheKey::fromRequest()` helps with this by normalizing the HTTP method, sorting query parameters, and optionally including selected headers.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the key builder:

```cpp
#include <vix/cache/CacheKey.hpp>
```

## Why cache keys matter

A cache store only sees string keys.

```cpp
cache.put(key, entry);
auto cached = cache.get(key, now_ms, ctx);
```

If a program builds keys inconsistently, it can create multiple entries for the same request or reuse the wrong entry for a different request. This is especially common with query strings and headers.

These two requests are logically the same:

```text
GET /api/users?b=2&a=1
GET /api/users?a=1&b=2
```

A manual key builder may treat them as different strings. `CacheKey::fromRequest()` normalizes the query order so both requests produce the same key.

## Basic usage

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

The generated key has a normalized form:

```text
GET /api/users?a=1&b=2 |h:accept=application/json;
```

The method is uppercased, the query parameters are sorted, and the selected header name is normalized to lowercase.

## Function

`CacheKey::fromRequest()` builds a key from request parts.

```cpp
static std::string fromRequest(
    std::string_view method,
    std::string_view path,
    std::string_view query,
    const std::unordered_map<std::string, std::string> &headers,
    const std::vector<std::string> &include_headers = {});
```

| Parameter         | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `method`          | Request method, such as `GET`.            |
| `path`            | Request path without query string.        |
| `query`           | Raw query string without the leading `?`. |
| `headers`         | Request headers.                          |
| `include_headers` | Header names that should affect the key.  |

The header list is explicit. Headers only affect the key when their names are passed in `include_headers`.

## Method normalization

The method is converted to uppercase.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "get",
    "/api/users",
    "",
    {});
```

The key starts with:

```text
GET /api/users
```

This avoids different cache entries for `get`, `Get`, and `GET`.

## Query normalization

Query parameters are sorted lexicographically by key and value.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "b=2&a=1",
    {});
```

The query becomes:

```text
a=1&b=2
```

So the full key starts with:

```text
GET /api/users?a=1&b=2
```

This is useful because query parameter order is often not meaningful for a request, but raw string comparison would treat different orders as different keys.

## Empty query

When the query string is empty, the key does not include a question mark.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/profile",
    "",
    {});
```

The key is:

```text
GET /api/profile
```

This keeps simple paths clean.

## Header variation

Some responses vary depending on selected request headers. For example, an API may return different data depending on `Accept`, `Authorization`, `X-Device`, or another application-specific header.

`CacheKey::fromRequest()` includes only the headers listed in `include_headers`.

```cpp
std::unordered_map<std::string, std::string> headers;

headers["Accept"] = "application/json";
headers["X-Device"] = "mobile";

const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers,
    {"Accept"});
```

The key includes `Accept` but not `X-Device`:

```text
GET /api/users?page=1 |h:accept=application/json;
```

This gives the caller explicit control over which headers affect cache identity.

## Header names

Header names included in the key are normalized to lowercase.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "",
    headers,
    {"Accept"});
```

The header part uses:

```text
accept=application/json;
```

This avoids cache differences caused only by header casing.

## Header values

Header values are trimmed before being added to the key.

```cpp
std::unordered_map<std::string, std::string> headers;

headers["Accept"] = "  application/json  ";

const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "",
    headers,
    {"Accept"});
```

The key contains the trimmed value:

```text
|h:accept=application/json;
```

This helps avoid accidental key differences caused by surrounding whitespace.

## Complete cache example

This example builds a deterministic key, stores a response, and reads it back using the same logical request with a different query order.

```cpp
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>

#include <vix/cache.hpp>
#include <vix/print.hpp>

int main()
{
  std::unordered_map<std::string, std::string> headers;

  headers["Accept"] = "application/json";

  const std::string key = vix::cache::CacheKey::fromRequest(
      "get",
      "/api/users",
      "b=2&a=1",
      headers,
      {"Accept"});

  auto store = std::make_shared<vix::cache::MemoryStore>();

  vix::cache::CachePolicy policy;
  policy.ttl_ms = 10'000;

  vix::cache::Cache cache(policy, store);

  const std::int64_t created_at = 10'000;

  vix::cache::CacheEntry entry;

  entry.status = 200;
  entry.body = R"({"users":[1,2,3]})";
  entry.headers["Content-Type"] = "application/json";
  entry.created_at_ms = created_at;

  cache.put(key, entry);

  const std::string same_request_key = vix::cache::CacheKey::fromRequest(
      "GET",
      "/api/users",
      "a=1&b=2",
      headers,
      {"Accept"});

  auto cached = cache.get(
      same_request_key,
      created_at + 100,
      vix::cache::CacheContext::Online());

  if (!cached)
  {
    vix::print("cache miss");
    return 1;
  }

  vix::print("cache hit");
  vix::print("key:", same_request_key);
  vix::print("body:", cached->body);

  return 0;
}
```

The second lookup succeeds because both query strings produce the same normalized key.

## Varying on headers

Only include a header when it changes the response meaning.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/feed",
    "page=1",
    headers,
    {"Accept", "X-Device"});
```

This produces a key that varies by response format and device type.

```text
GET /api/feed?page=1 |h:accept=application/json;x-device=mobile;
```

Do not include headers that do not affect the response. Adding unnecessary headers can fragment the cache because two equivalent requests may no longer share the same entry.

## Different headers, different keys

```cpp
std::unordered_map<std::string, std::string> mobile_headers;
mobile_headers["Accept"] = "application/json";
mobile_headers["X-Device"] = "mobile";

std::unordered_map<std::string, std::string> desktop_headers;
desktop_headers["Accept"] = "application/json";
desktop_headers["X-Device"] = "desktop";

const auto mobile_key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/feed",
    "page=1",
    mobile_headers,
    {"X-Device"});

const auto desktop_key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/feed",
    "page=1",
    desktop_headers,
    {"X-Device"});

vix::print(mobile_key);
vix::print(desktop_key);
```

These keys are different because the selected header value is different.

```text
GET /api/feed?page=1 |h:x-device=mobile;
GET /api/feed?page=1 |h:x-device=desktop;
```

This is the correct behavior when the response really varies by device.

## Query parameters without values

A query parameter can exist without an explicit value.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/search",
    "debug&q=vix",
    {});
```

The key keeps the parameter name and still sorts the query parts.

```text
GET /api/search?debug&q=vix
```

Use this for request identity, not for query parsing. `CacheKey` is a key builder, not a full URL parser.

## Path responsibility

`CacheKey::fromRequest()` expects the path and query to be passed separately.

```cpp
vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers);
```

Do not include the query string in the path while also passing it as `query`.

```cpp
vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users?page=1",
    "page=1",
    headers);
```

That would make the key represent a different path than intended.

## Key format

The normalized key follows this shape:

```text
METHOD path?sorted_query |h:header=value;header=value;
```

When there is no query, the `?sorted_query` part is omitted.

```text
GET /api/profile
```

When no headers are included, the header section is omitted.

```text
GET /api/users?a=1&b=2
```

When selected headers are included, the header section is appended.

```text
GET /api/users?a=1&b=2 |h:accept=application/json;
```

This format is human-readable on purpose. It makes cache entries easier to inspect in memory, logs, tests, and file-backed cache data.

## Cache keys and response headers

`CacheKey::fromRequest()` uses request headers to build identity. `Cache::put()` normalizes response headers before storing the entry.

These are separate operations:

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    request_headers,
    {"Accept"});

cache.put(key, response_entry);
```

The key decides where the entry is stored. The entry headers preserve response metadata.

## Common mistakes

### Building keys manually for HTTP requests

Manual keys are easy to get wrong.

```cpp
const std::string key = "GET /api/users?b=2&a=1";
```

Prefer the key builder:

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "b=2&a=1",
    headers);
```

This keeps query ordering deterministic.

### Including too many headers

Only include headers that affect the response.

```cpp
{"Accept", "X-Device"}
```

Do not include changing headers that do not represent response identity. A timestamp, trace id, or random request id can make every request produce a different key.

### Forgetting a header that changes the response

When the server returns different content for a header, include that header.

```cpp
const auto key = vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/feed",
    "page=1",
    headers,
    {"Accept"});
```

This avoids reusing a response with the wrong format.

### Passing the query with a leading question mark

The `query` argument should not include `?`.

```cpp
vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "page=1",
    headers);
```

Do not pass:

```cpp
vix::cache::CacheKey::fromRequest(
    "GET",
    "/api/users",
    "?page=1",
    headers);
```

The key builder adds `?` when the normalized query is not empty.

### Mixing path and query

Keep the path and query separate.

```cpp
path = "/api/users";
query = "page=1";
```

This keeps the key format predictable.

## Next step

Continue with the stores page to understand how `CacheStore`, `MemoryStore`, `LruMemoryStore`, and `FileStore` store entries behind the same cache facade.
