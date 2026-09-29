# Durations

`Duration` represents an elapsed span of time in the Vix time module.

A duration answers the question “how long?”. It is the right type for timeouts, delays, retry windows, benchmark results, elapsed work, and arithmetic between timestamps. It does not represent a calendar date or an absolute moment in history. For those cases, use `Date`, `DateTime`, or `Timestamp`.

Internally, `Duration` stores a signed 64-bit count of nanoseconds. This gives the module one precise representation while still allowing code to create and read durations in common units such as milliseconds, seconds, minutes, and hours.

## Header

Use the public Vix header when working with durations:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create durations

Use the named factory functions to create a `Duration`. This keeps units visible in the code and avoids the common mistake of passing a raw number without knowing what it means.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration a = Duration::seconds(2);
  Duration b = Duration::milliseconds(500);
  Duration c = Duration::microseconds(250);
  Duration d = Duration::nanoseconds(100);

  vix::print("seconds:", a.count_seconds());
  vix::print("milliseconds:", b.count_ms());
  vix::print("microseconds:", c.count_us());
  vix::print("nanoseconds:", d.count_ns());

  return 0;
}
```

The available factories are:

| Factory                         | Meaning                   |
| ------------------------------- | ------------------------- |
| `Duration::nanoseconds(value)`  | Create from nanoseconds.  |
| `Duration::microseconds(value)` | Create from microseconds. |
| `Duration::milliseconds(value)` | Create from milliseconds. |
| `Duration::seconds(value)`      | Create from seconds.      |
| `Duration::minutes(value)`      | Create from minutes.      |
| `Duration::hours(value)`        | Create from hours.        |

## Read durations

A duration can be read back in several units. The value is stored in nanoseconds, so reading in a larger unit may truncate the result.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration duration = Duration::milliseconds(1500);

  vix::print("nanoseconds:", duration.count_ns());
  vix::print("microseconds:", duration.count_us());
  vix::print("milliseconds:", duration.count_ms());
  vix::print("seconds:", duration.count_seconds());

  return 0;
}
```

For example, `1500ms` becomes `1` when read with `count_seconds()` because the result is an integer number of seconds.

## Add and subtract durations

Durations support simple arithmetic. Adding two durations produces a new duration. Subtracting one duration from another also produces a duration.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration base = Duration::seconds(2);
  Duration extra = Duration::milliseconds(500);

  Duration total = base + extra;
  Duration remaining = total - Duration::seconds(1);

  vix::print("total ms:", total.count_ms());
  vix::print("remaining ms:", remaining.count_ms());

  return 0;
}
```

Use this when building retry delays, timeout budgets, or elapsed-time calculations that need to be adjusted step by step.

## Update a duration in place

`Duration` also supports `+=` and `-=` when you want to update an existing value.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration timeout = Duration::seconds(5);

  timeout += Duration::seconds(2);
  timeout -= Duration::milliseconds(500);

  vix::print("timeout ms:", timeout.count_ms());

  return 0;
}
```

This is useful when a duration is part of a small calculation and keeping a named variable makes the code easier to read.

## Compare durations

Durations can be compared directly. This is useful for checking limits, elapsed time, retry windows, or timeout budgets.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration elapsed = Duration::milliseconds(750);
  Duration limit = Duration::seconds(1);

  if (elapsed < limit)
  {
    vix::print("still inside the limit");
  }
  else
  {
    vix::print("limit reached");
  }

  return 0;
}
```

The comparison is based on the internal nanosecond value, so durations created from different units can still be compared safely.

## Check for zero

Use `is_zero()` when a zero duration has special meaning in your code.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration delay;

  if (delay.is_zero())
  {
    vix::print("no delay configured");
  }

  return 0;
}
```

A default-constructed `Duration` is zero.

## Use with timestamps

Durations are often used with `Timestamp`. Adding a duration to a timestamp gives a later timestamp. Subtracting two timestamps gives a duration.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp started_at = Timestamp::now();
  Timestamp expires_at = started_at + Duration::seconds(30);

  Duration lifetime = expires_at - started_at;

  vix::print("lifetime seconds:", lifetime.count_seconds());

  return 0;
}
```

This is the common workflow for expiration values, cache metadata, token lifetimes, and scheduled runtime work.

## Convert to chrono

`Duration` can be converted back to `std::chrono::nanoseconds` when you need to interoperate with lower-level C++ APIs.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration timeout = Duration::milliseconds(250);
  std::chrono::nanoseconds chrono_timeout = timeout.to_chrono();

  vix::print("timeout ns:", chrono_timeout.count());

  return 0;
}
```

The Vix type keeps application code explicit, while `to_chrono()` keeps the module compatible with existing C++ code.

## API overview

| API                             | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `Duration()`                    | Create a zero duration.                         |
| `Duration::nanoseconds(value)`  | Create a duration from nanoseconds.             |
| `Duration::microseconds(value)` | Create a duration from microseconds.            |
| `Duration::milliseconds(value)` | Create a duration from milliseconds.            |
| `Duration::seconds(value)`      | Create a duration from seconds.                 |
| `Duration::minutes(value)`      | Create a duration from minutes.                 |
| `Duration::hours(value)`        | Create a duration from hours.                   |
| `count_ns()`                    | Return the duration in nanoseconds.             |
| `count_us()`                    | Return the duration in microseconds, truncated. |
| `count_ms()`                    | Return the duration in milliseconds, truncated. |
| `count_seconds()`               | Return the duration in seconds, truncated.      |
| `to_chrono()`                   | Convert to `std::chrono::nanoseconds`.          |
| `is_zero()`                     | Check whether the duration is zero.             |

## Next step

Continue with timestamps to see how durations are used with absolute points in time.

- [Timestamps](./timestamps)
