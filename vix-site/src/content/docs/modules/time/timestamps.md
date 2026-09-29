# Timestamps

`Timestamp` represents an absolute point in time in the Vix time module.

A timestamp answers the question “when?”. It is the right type for values that need to be stored, compared, ordered, or exchanged between parts of an application. Logs, cache metadata, WAL entries, synchronization records, API timestamps, and `created_at` or `updated_at` fields all need this kind of value.

In Vix, a `Timestamp` is stored as a signed 64-bit number of nanoseconds since the Unix epoch: `1970-01-01T00:00:00Z`. This gives the type a stable integer representation while still keeping direct interoperability with `std::chrono`.

## Header

Use the public Vix header when working with timestamps:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create the current timestamp

Use `Timestamp::now()` when you need the current wall-clock time as an absolute timestamp.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp now = Timestamp::now();

  vix::print("seconds since epoch:", now.seconds_since_epoch());
  vix::print("nanoseconds since epoch:", now.nanoseconds_since_epoch());

  return 0;
}
```

This is useful for application records that need to capture when something happened.

## Create a timestamp from epoch values

A timestamp can also be built from seconds or nanoseconds since the Unix epoch.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp from_seconds = Timestamp::from_seconds(1);
  Timestamp from_nanoseconds = Timestamp::from_nanoseconds(1'000'000'000);

  vix::print("from seconds:", from_seconds.nanoseconds_since_epoch());
  vix::print("from nanoseconds:", from_nanoseconds.seconds_since_epoch());

  return 0;
}
```

Use these constructors when loading persisted values, reading serialized data, or adapting an external API that already gives epoch-based time.

## Read timestamp values

`Timestamp` exposes both nanosecond and second views of the same stored value.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp ts = Timestamp::now();

  vix::print("ns:", ts.nanoseconds_since_epoch());
  vix::print("sec:", ts.seconds_since_epoch());

  return 0;
}
```

`nanoseconds_since_epoch()` keeps the full precision. `seconds_since_epoch()` truncates the value to whole seconds, which is often enough for logs, simple API responses, or human-readable diagnostics.

## Add a duration

Adding a `Duration` to a `Timestamp` produces another timestamp.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp created_at = Timestamp::now();
  Duration lifetime = Duration::seconds(30);

  Timestamp expires_at = created_at + lifetime;

  vix::print("created:", created_at.seconds_since_epoch());
  vix::print("expires:", expires_at.seconds_since_epoch());

  return 0;
}
```

This is the common pattern for expiration values, cache entries, retry windows, and scheduled runtime work.

## Subtract a duration

Subtracting a `Duration` from a `Timestamp` produces an earlier timestamp.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp now = Timestamp::now();
  Timestamp one_hour_ago = now - Duration::hours(1);

  vix::print("now:", now.seconds_since_epoch());
  vix::print("one hour ago:", one_hour_ago.seconds_since_epoch());

  return 0;
}
```

This is useful when building time windows, filtering recent records, or checking whether a value is older than a specific duration.

## Compute the duration between timestamps

Subtracting one timestamp from another gives a `Duration`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp started_at = Timestamp::now();
  Timestamp finished_at = started_at + Duration::milliseconds(750);

  Duration elapsed = finished_at - started_at;

  vix::print("elapsed ms:", elapsed.count_ms());

  return 0;
}
```

The result is a duration because the difference between two absolute moments is an elapsed span of time.

## Compare timestamps

Timestamps can be compared directly. This makes them useful for ordering events, checking expiration, and sorting records.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp now = Timestamp::now();
  Timestamp expires_at = now + Duration::seconds(10);

  if (now < expires_at)
  {
    vix::print("still valid");
  }
  else
  {
    vix::print("expired");
  }

  return 0;
}
```

The comparison is based on the stored epoch nanoseconds.

## Check for the epoch value

A default-constructed `Timestamp` represents the Unix epoch. Use `is_zero()` when that value has special meaning in your code.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp ts;

  if (ts.is_zero())
  {
    vix::print("timestamp is unset or epoch");
  }

  return 0;
}
```

This can be useful for simple default states, but application code should be clear about whether zero means “the Unix epoch” or “not configured”.

## Convert to chrono

Use `to_chrono()` when you need to pass a timestamp to code that expects a `std::chrono::time_point`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp ts = Timestamp::now();
  auto chrono_value = ts.to_chrono();

  Timestamp roundtrip{chrono_value};

  vix::print("original:", ts.nanoseconds_since_epoch());
  vix::print("roundtrip:", roundtrip.nanoseconds_since_epoch());

  return 0;
}
```

This keeps normal Vix application code readable while preserving compatibility with lower-level C++ APIs.

## Timestamp and SystemClock

`Timestamp::now()` and `SystemClock::now()` both return the current wall-clock time as a timestamp.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp a = Timestamp::now();
  Timestamp b = SystemClock::now();

  vix::print("timestamp now:", a.seconds_since_epoch());
  vix::print("system clock now:", b.seconds_since_epoch());

  return 0;
}
```

Use the form that reads most clearly in the surrounding code. `SystemClock::now()` can make the clock source explicit, while `Timestamp::now()` is concise when the timestamp type is already the main subject.

## API overview

| API                                  | Purpose                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `Timestamp()`                        | Create a timestamp at the Unix epoch.                                                      |
| `Timestamp::now()`                   | Create a timestamp from the current wall-clock time.                                       |
| `Timestamp::from_nanoseconds(value)` | Create from nanoseconds since the Unix epoch.                                              |
| `Timestamp::from_seconds(value)`     | Create from seconds since the Unix epoch.                                                  |
| `nanoseconds_since_epoch()`          | Return the stored epoch value in nanoseconds.                                              |
| `seconds_since_epoch()`              | Return the stored epoch value in seconds, truncated.                                       |
| `to_chrono()`                        | Convert to `std::chrono::time_point<std::chrono::system_clock, std::chrono::nanoseconds>`. |
| `is_zero()`                          | Check whether the timestamp is the epoch value.                                            |

## Next step

Continue with clocks to understand when to use wall-clock time and when to use monotonic time for elapsed measurements.

- [Clocks](./clocks)
