# Time

The `time` module provides the core time primitives used by Vix applications: durations, timestamps, clocks, calendar dates, UTC date-times, and lightweight parsing helpers.

Time appears in many parts of an application. Logs need stable timestamps, caches need expiration values, background work needs elapsed-time measurement, and persisted records often need values such as `created_at` or `updated_at`. The purpose of this module is to make those workflows explicit in C++ without forcing every part of the application to work directly with raw `std::chrono` types.

The module keeps the model small and predictable. A `Duration` represents a span of time. A `Timestamp` represents an absolute point in time since the Unix epoch. `SystemClock` reads the current wall-clock time, while `SteadyClock` measures elapsed time without depending on system clock changes. `Date` and `DateTime` provide practical calendar-facing types for common UTC workflows.

## Header

Use the public Vix header when working with the time module:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic example

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp created_at = SystemClock::now();

  Duration timeout = Duration::seconds(30);
  Timestamp expires_at = created_at + timeout;

  Date today = Date::today();
  DateTime now = DateTime::now_utc();

  vix::print("created_at seconds:", created_at.seconds_since_epoch());
  vix::print("expires_at seconds:", expires_at.seconds_since_epoch());
  vix::print("today:", today.to_string());
  vix::print("now:", now.to_string_utc());

  return 0;
}
```

## Core model

The module separates the different meanings of time instead of treating everything as one generic value. This matters because application code usually needs different time semantics in different places. A database record should store an absolute timestamp. A timeout should use a duration. A benchmark should use a monotonic clock. A user-facing calendar value may only need a date.

| Type          | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| `Duration`    | Represents a span of elapsed time with nanosecond precision.              |
| `Timestamp`   | Represents an absolute point in time as nanoseconds since the Unix epoch. |
| `SystemClock` | Reads the current wall-clock time as a `Timestamp`.                       |
| `SteadyClock` | Measures elapsed time using a monotonic clock.                            |
| `Date`        | Represents a calendar date in `YYYY-MM-DD` form.                          |
| `DateTime`    | Represents a UTC-oriented date and time value.                            |
| `parse`       | Provides small parsing helpers used by the higher-level types.            |

This separation keeps code easier to read. When a function accepts a `Duration`, the reader knows the value means “how long”. When it accepts a `Timestamp`, the value means “when”. That distinction is simple, but it prevents many small mistakes in runtime, storage, and scheduling code.

## Durations

`Duration` is used for spans of time. It stores nanoseconds internally and provides explicit factories for common units.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration one_second = Duration::seconds(1);
  Duration half_second = Duration::milliseconds(500);

  Duration total = one_second + half_second;

  vix::print("total milliseconds:", total.count_ms());
  vix::print("total nanoseconds:", total.count_ns());

  return 0;
}
```

Use `Duration` when the value means elapsed time: timeouts, delays, retry windows, benchmark results, or arithmetic between timestamps.

## Timestamps

`Timestamp` represents an absolute moment in time as nanoseconds since `1970-01-01T00:00:00Z`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp now = Timestamp::now();
  Timestamp later = now + Duration::seconds(5);

  Duration delta = later - now;

  vix::print("now:", now.seconds_since_epoch());
  vix::print("delta seconds:", delta.count_seconds());

  return 0;
}
```

This type is useful for persisted values, logs, WAL entries, cache metadata, synchronization records, and event ordering. It keeps a stable integer representation while still allowing conversion to and from `std::chrono`.

## Clocks

The module exposes two clock concepts because wall time and elapsed time solve different problems.

`SystemClock` reads the current real-world time and returns a `Timestamp`. It is the right choice for values that will be stored, displayed, or compared as real events.

```cpp
Timestamp created_at = vix::time::SystemClock::now();
```

`SteadyClock` is used for measuring elapsed time. It is monotonic, which makes it better for profiling, benchmarks, and timeout calculations.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  auto start = SteadyClock::now_chrono();

  for (int i = 0; i < 100000; ++i)
  {
    // work
  }

  Duration elapsed = SteadyClock::since(start);

  vix::print("elapsed ns:", elapsed.count_ns());

  return 0;
}
```

## Dates

`Date` represents a calendar day without storing a time or timezone. It is useful for values such as release dates, due dates, report dates, and other day-level information.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Date release = Date::parse("2026-02-07");

  if (!release.is_valid())
  {
    vix::print("invalid date");
    return 1;
  }

  Timestamp start_of_day = release.to_timestamp_utc();

  vix::print("date:", release.to_string());
  vix::print("start of day:", start_of_day.seconds_since_epoch());

  return 0;
}
```

A `Date` can be converted to a UTC timestamp at midnight. This keeps conversion behavior predictable and avoids hiding timezone decisions inside a small value type.

## Date and time

`DateTime` represents a date and time value. In the current module design, parsing and conversion are UTC-oriented. This makes it practical for logs, APIs, storage, and internal runtime values that need a simple ISO-like representation.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  DateTime dt = DateTime::parse("2026-02-07T10:30:15Z");

  Timestamp ts = dt.to_timestamp_utc();
  DateTime roundtrip = DateTime::from_timestamp_utc(ts);

  vix::print("datetime:", dt.to_string_utc());
  vix::print("timestamp:", ts.seconds_since_epoch());
  vix::print("roundtrip:", roundtrip.to_string_utc());

  return 0;
}
```

`DateTime` supports common UTC forms such as `YYYY-MM-DDTHH:MM:SSZ`, a space between the date and time, and optional fractional seconds up to nanosecond precision.

## Parsing

The module includes lightweight parsing helpers under `vix::time::parse`. These helpers parse simple date and time shapes, while calendar validation belongs to higher-level types such as `Date` and `DateTime`.

Most application code should prefer `Date::parse` or `DateTime::parse` directly:

```cpp
Date date = Date::parse("2026-02-07");
DateTime datetime = DateTime::parse("2026-02-07T10:30:15Z");
```

The lower-level helpers are useful when building custom input handling around the same rules.

## Chrono interop

The module is designed to work with `std::chrono` without exposing raw chrono expressions everywhere in application code.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration duration = Duration::milliseconds(250);
  auto chrono_duration = duration.to_chrono();

  Timestamp timestamp = Timestamp::now();
  auto chrono_timestamp = timestamp.to_chrono();

  vix::print("duration ms:", duration.count_ms());
  vix::print("timestamp ns:", timestamp.nanoseconds_since_epoch());

  return 0;
}
```

This keeps normal Vix code readable while still allowing lower-level chrono usage when needed.

## Next step

Start with the quick start page to see the common workflow in a small program, then move through the focused pages for durations, timestamps, clocks, dates, and UTC date-time handling.

- [Quick Start](./quick-start)
- [Durations](./durations)
- [Timestamps](./timestamps)
- [Clocks](./clocks)
- [Dates](./dates)
- [DateTime](./datetimes)
- [Parsing](./parsing)
- [Chrono Interop](./chrono-interop)
- [API Reference](./api-reference)
