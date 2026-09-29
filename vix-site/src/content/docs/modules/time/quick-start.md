# Quick Start

The `time` module gives Vix applications a small set of explicit types for working with time. This page shows the basic workflow: create durations, read the current time, perform timestamp arithmetic, parse dates, and measure elapsed work with a monotonic clock.

The goal is not to hide C++ time completely. The goal is to make the common cases clear. When your code says `Duration`, it means an elapsed span of time. When it says `Timestamp`, it means an absolute point in time. When it uses `SteadyClock`, it is measuring work instead of reading the system clock.

## Header

Use the public Vix header when working with the time module:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a small time program

Create a file named `main.cpp`:

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

This example uses the main pieces of the module together. `SystemClock::now()` gives the current wall-clock time as a `Timestamp`. `Duration::seconds(30)` creates a clear timeout value. Adding the duration to the timestamp produces another timestamp that can be stored, compared, or used as an expiration value. `Date::today()` gives the current UTC date, while `DateTime::now_utc()` gives a UTC date-time view of the current moment.

## Work with durations

A `Duration` represents elapsed time. It is useful for timeouts, delays, retry windows, and the result of measuring work.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Duration a = Duration::seconds(2);
  Duration b = Duration::milliseconds(500);

  Duration total = a + b;

  vix::print("seconds:", total.count_seconds());
  vix::print("milliseconds:", total.count_ms());
  vix::print("nanoseconds:", total.count_ns());

  return 0;
}
```

The conversion functions return integer values. Smaller units keep more precision, while larger units are truncated.

## Work with timestamps

A `Timestamp` represents an absolute point in time. It stores nanoseconds since the Unix epoch and is useful for logs, persisted records, cache metadata, and event ordering.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp start = Timestamp::now();
  Timestamp end = start + Duration::seconds(5);

  Duration delta = end - start;

  vix::print("start:", start.seconds_since_epoch());
  vix::print("end:", end.seconds_since_epoch());
  vix::print("delta:", delta.count_seconds());

  return 0;
}
```

Timestamp arithmetic is explicit. Adding a duration to a timestamp gives a new timestamp. Subtracting two timestamps gives a duration.

## Parse a date

Use `Date` when the value only needs a calendar day. It stores year, month, and day without storing a time or timezone.

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

  vix::print("release:", release.to_string());
  vix::print("start of day:", start_of_day.seconds_since_epoch());

  return 0;
}
```

`Date::parse` reads the `YYYY-MM-DD` form. Validation is kept separate, so code that accepts external input should call `is_valid()` before using the date for conversion.

## Parse a UTC date-time

Use `DateTime` when you need both a calendar date and a time of day. In the current module design, parsing and timestamp conversion are UTC-oriented.

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

This is useful for API values, logs, stored records, and internal runtime data where UTC is the expected representation.

## Measure elapsed work

Use `SteadyClock` when you need elapsed time. It is based on a monotonic clock, so it is the right choice for profiling, benchmarks, and timeout measurement.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  auto start = SteadyClock::now_chrono();

  long long total = 0;
  for (int i = 0; i < 100000; ++i)
  {
    total += i;
  }

  Duration elapsed = SteadyClock::since(start);

  vix::print("total:", total);
  vix::print("elapsed ns:", elapsed.count_ns());

  return 0;
}
```

For persisted timestamps, use `SystemClock` or `Timestamp::now()`. For elapsed work, use `SteadyClock`. Keeping that distinction clear avoids bugs caused by system clock changes.

## Next step

After this quick start, continue with the focused pages for each part of the module.

- [Durations](./durations)
- [Timestamps](./timestamps)
- [Clocks](./clocks)
- [Dates](./dates)
- [DateTime](./datetimes)
- [Parsing](./parsing)
- [Chrono Interop](./chrono-interop)
