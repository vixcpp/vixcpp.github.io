# Cache Policy

`CachePolicy` defines the freshness and stale reuse rules used by the `cache` module. It answers one precise question: given the age of a cached entry and the runtime context, can this entry still be served?

The policy does not store entries and does not read from a backend. It only contains the rules. `Cache` applies those rules when `get()` is called, using the current time, the cached entry timestamp, and the `CacheContext` supplied by the caller.

## Header

Use the public cache aggregator in normal application code:

```cpp
#include <vix/cache.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The direct header is also available when a file only needs the policy type:

```cpp
#include <vix/cache/CachePolicy.hpp>
```

## Structure

A cache policy contains a normal freshness window and two optional stale reuse windows.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 60'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5 * 60'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10 * 60'000;
```

| Field                    | Purpose                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `ttl_ms`                 | Time-to-live in milliseconds. Entries younger than this value are fresh. |
| `stale_if_error_ms`      | Maximum age allowed when serving stale data after a network error.       |
| `stale_if_offline_ms`    | Maximum age allowed when serving stale data while offline.               |
| `allow_stale_if_error`   | Enables or disables stale reuse after a network error.                   |
| `allow_stale_if_offline` | Enables or disables stale reuse while offline.                           |

The policy works with entry age. The cache calculates the age from the current time and the entry creation time.

```cpp
const auto age_ms = now_ms - entry.created_at_ms;
```

## Freshness

An entry is fresh when its age is less than or equal to `ttl_ms`.

```cpp
policy.ttl_ms = 10'000;
```

An entry created at `t0` is fresh at `t0 + 5'000`:

```cpp
policy.is_fresh(5'000);
```

It is not fresh at `t0 + 20'000`:

```cpp
policy.is_fresh(20'000);
```

Fresh entries can be served during normal online operation.

```cpp
auto cached = cache.get(
    key,
    created_at + 5'000,
    vix::cache::CacheContext::Online());
```

## Stale entries

An entry becomes stale when it is older than `ttl_ms`. A stale entry is not automatically useless. In offline-first systems, stale data can still be valuable when the network is unavailable or when a request fails because of the network.

The policy separates those cases:

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 60'000;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 30'000;
```

This means the application may serve stale entries for up to `60` seconds while offline and up to `30` seconds after a network error.

## Online context

In normal online operation, the cache serves fresh entries.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

If the entry is older than `ttl_ms`, the cache returns a miss in online context.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 1'000;
```

An entry with age `5'000` milliseconds is expired for online use.

```cpp
auto cached = cache.get(
    key,
    created_at + 5'000,
    vix::cache::CacheContext::Online());
```

The caller can then fetch a fresh response from the network and store the new entry.

## Offline context

Offline context tells the cache that no network connectivity is available.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

A stale entry can be returned when `allow_stale_if_offline` is enabled and the entry age is inside `stale_if_offline_ms`.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 60'000;
```

An entry with age `10'000` milliseconds is stale, but still allowed while offline.

```cpp
auto cached = cache.get(
    key,
    created_at + 10'000,
    vix::cache::CacheContext::Offline());
```

An entry with age `120'000` milliseconds is too old for this policy and should be rejected.

## Network-error context

Network-error context tells the cache that a request was attempted, but it failed because of the network.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::NetworkError());
```

This is different from offline context. Offline means the application knows there is no network. Network error means the application tried the network and received a network failure.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 1'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 30'000;
```

An entry with age `5'000` milliseconds is stale, but it can still be returned after a network error.

```cpp
auto cached = cache.get(
    key,
    created_at + 5'000,
    vix::cache::CacheContext::NetworkError());
```

This gives the application a controlled fallback when a fresh network request fails.

## Minimal policy example

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
      created_at + 500,
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

The same entry is accepted or rejected depending on its age and the context used for the lookup.

## Policy helper functions

`CachePolicy` exposes small helper functions that make the rules easy to test directly.

### `is_fresh`

```cpp
bool is_fresh(std::int64_t age_ms) const noexcept;
```

Returns `true` when the entry age is inside the TTL.

```cpp
vix::cache::CachePolicy policy;
policy.ttl_ms = 1'000;

vix::print(policy.is_fresh(500) ? "fresh" : "stale");
vix::print(policy.is_fresh(2'000) ? "fresh" : "stale");
```

### `allow_stale_error`

```cpp
bool allow_stale_error(std::int64_t age_ms) const noexcept;
```

Returns `true` when stale reuse after a network error is enabled and the age is inside the error stale window.

```cpp
vix::cache::CachePolicy policy;

policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;

vix::print(policy.allow_stale_error(4'000) ? "allowed" : "rejected");
vix::print(policy.allow_stale_error(8'000) ? "allowed" : "rejected");
```

### `allow_stale_offline`

```cpp
bool allow_stale_offline(std::int64_t age_ms) const noexcept;
```

Returns `true` when stale reuse while offline is enabled and the age is inside the offline stale window.

```cpp
vix::cache::CachePolicy policy;

policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;

vix::print(policy.allow_stale_offline(4'000) ? "allowed" : "rejected");
vix::print(policy.allow_stale_offline(20'000) ? "allowed" : "rejected");
```

These helpers are useful in tests, but application code usually calls `Cache::get()` and lets the cache apply the policy.

## Strict policy

A strict policy serves only fresh entries. It does not allow stale reuse when offline or after a network error.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 5'000;
policy.allow_stale_if_offline = false;
policy.allow_stale_if_error = false;
```

Use this policy when stale data would be misleading or unsafe.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Offline());
```

In this configuration, an expired entry is rejected even when the context is offline.

## Offline-first policy

An offline-first policy keeps a short freshness window but allows a longer offline fallback.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 10'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10 * 60'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5 * 60'000;
```

This is useful for local-first applications where the latest response is preferred, but a previously validated response is still valuable when the network is unavailable.

## Short-lived server policy

A server-side memory cache often needs a smaller window.

```cpp
vix::cache::CachePolicy policy;

policy.ttl_ms = 2'000;
policy.allow_stale_if_offline = false;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 10'000;
```

This keeps normal responses fresh for a short period while still allowing a short fallback if the upstream service has a temporary network failure.

## Policy and pruning

`Cache::prune()` uses the active policy to remove entries that are older than the maximum usable age.

```cpp
const auto removed = cache.prune(now_ms);

vix::print("removed:", removed);
```

The maximum usable age is not always only `ttl_ms`. If stale-if-offline or stale-if-error is enabled, pruning keeps entries that may still be usable in those contexts.

For example:

```cpp
policy.ttl_ms = 1'000;
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 10'000;
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 5'000;
```

The maximum useful age is `10'000` milliseconds because the offline stale window is the largest active window. Entries older than that can be pruned.

## Complete example with pruning

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

  vix::print("removed:", removed);

  auto fresh = cache.get(
      "fresh",
      now + 500,
      vix::cache::CacheContext::Online());

  auto stale = cache.get(
      "stale",
      now + 500,
      vix::cache::CacheContext::Online());

  vix::print("fresh:", fresh ? "present" : "missing");
  vix::print("stale:", stale ? "present" : "missing");

  return 0;
}
```

With this strict policy, the old entry is no longer useful and can be pruned.

## Common mistakes

### Using stale windows without enabling them

The stale window value is not enough by itself.

```cpp
policy.stale_if_offline_ms = 60'000;
```

The corresponding flag must also be enabled.

```cpp
policy.allow_stale_if_offline = true;
policy.stale_if_offline_ms = 60'000;
```

The same rule applies to network-error reuse.

```cpp
policy.allow_stale_if_error = true;
policy.stale_if_error_ms = 30'000;
```

### Treating offline and network error as the same context

Offline and network error are different signals.

```cpp
vix::cache::CacheContext::Offline();
vix::cache::CacheContext::NetworkError();
```

Offline means the application knows the network is unavailable. Network error means a network request failed. Keeping those cases separate lets the policy use different stale windows.

### Forgetting that time is passed by the caller

The cache does not hide the current time. The caller passes it to `Cache::get`.

```cpp
auto cached = cache.get(
    key,
    now_ms,
    vix::cache::CacheContext::Online());
```

This is intentional because it makes cache behavior testable with fixed timestamps.

### Making stale windows too long without a reason

A long stale window can be useful in offline-first applications, but it should be chosen deliberately. The older an entry becomes, the more likely it is to be different from the current server state.

```cpp
policy.stale_if_offline_ms = 10 * 60'000;
```

Use a window that matches the kind of data being cached.

## Next step

Continue with the cache context page to understand how `Online`, `Offline`, and `NetworkError` change the way a policy is applied.
