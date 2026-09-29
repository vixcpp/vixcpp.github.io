# DateTime

`DateTime` represents a calendar date and a time of day in the Vix time module.

Use `DateTime` when a value needs more precision than a `Date`, but still needs to remain simple enough for application code, API values, logs, stored records, and UTC-oriented runtime data. In the current design, `DateTime` does not store timezone information. Parsing, formatting, and timestamp conversion are treated as UTC.

This keeps the type predictable. A `DateTime` can be parsed from a simple ISO-like string, converted to a `Timestamp`, reconstructed from a `Timestamp`, and formatted back to a UTC string without hiding timezone decisions inside the value.

## Header

Use the public Vix header when working with date-times:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a DateTime

A `DateTime` can be created from explicit fields.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt{2026, 2, 7, 10, 30, 15};

  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

The constructor stores the fields directly. It performs only the construction of the value, so code that creates date-times from external input should prefer `DateTime::parse()` or convert with care.

## Get the current UTC DateTime

Use `DateTime::now_utc()` when you need the current moment represented as a UTC date-time.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime now = vix::time::DateTime::now_utc();

  vix::print("now:", now.to_string_utc());

  return 0;
}
```

This is useful for diagnostics, API output, local tools, and records that need a readable UTC representation.

## Parse a UTC DateTime

`DateTime::parse()` accepts simple UTC-oriented date-time strings.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt =
      vix::time::DateTime::parse("2026-02-07T10:30:15Z");

  vix::print("year:", dt.year());
  vix::print("month:", dt.month());
  vix::print("day:", dt.day());
  vix::print("hour:", dt.hour());
  vix::print("minute:", dt.minute());
  vix::print("second:", dt.second());
  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

The parser accepts `YYYY-MM-DDTHH:MM:SSZ`. It also accepts a space between the date and time, which is useful when reading simple database-style strings.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt =
      vix::time::DateTime::parse("2026-02-07 10:30:15");

  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

The value is still treated as UTC by the module.

## Fractional seconds

`DateTime` supports fractional seconds up to nanosecond precision.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt =
      vix::time::DateTime::parse("2026-02-07T10:30:15.123456789Z");

  vix::print("nanosecond:", dt.nanosecond());
  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

When fewer than nine fractional digits are provided, the value is padded to nanoseconds. Extra digits beyond nanosecond precision are ignored.

## Convert to a Timestamp

Use `to_timestamp_utc()` to convert a `DateTime` into an epoch-based `Timestamp`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  DateTime dt = DateTime::parse("2026-02-07T10:30:15Z");

  Timestamp ts = dt.to_timestamp_utc();

  vix::print("datetime:", dt.to_string_utc());
  vix::print("timestamp seconds:", ts.seconds_since_epoch());

  return 0;
}
```

This conversion assumes the stored fields represent UTC. If the calendar date is invalid, the conversion returns a default `Timestamp`.

## Convert from a Timestamp

Use `DateTime::from_timestamp_utc()` to build a UTC date-time view from a `Timestamp`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp ts = Timestamp::now();
  DateTime dt = DateTime::from_timestamp_utc(ts);

  vix::print("timestamp:", ts.seconds_since_epoch());
  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

This is useful when a system stores time as epoch-based timestamps but needs to display or serialize a UTC date-time string.

## Round-trip through Timestamp

A common workflow is to parse a date-time string, convert it to a timestamp, then rebuild a date-time from that timestamp.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  DateTime input = DateTime::parse("2026-02-07T10:30:15.123Z");

  Timestamp ts = input.to_timestamp_utc();
  DateTime output = DateTime::from_timestamp_utc(ts);

  vix::print("input:", input.to_string_utc());
  vix::print("output:", output.to_string_utc());

  return 0;
}
```

This pattern is useful for API handling, tests, serialization checks, and storage code that uses `Timestamp` internally while exposing UTC strings at the edges.

## Format as UTC

Use `to_string_utc()` to format a date-time as an ISO-like UTC string.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt{2026, 2, 7, 10, 30, 15};

  vix::print(dt.to_string_utc());

  return 0;
}
```

When the nanosecond field is zero, the formatted string omits fractional seconds.

```txt
2026-02-07T10:30:15Z
```

When the nanosecond field is not zero, fractional seconds are included.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt{2026, 2, 7, 10, 30, 15, 123000000};

  vix::print(dt.to_string_utc());

  return 0;
}
```

Output shape:

```txt
2026-02-07T10:30:15.123000000Z
```

## Read fields

The individual date and time fields can be read through small getter functions.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt =
      vix::time::DateTime::parse("2026-02-07T10:30:15.123Z");

  vix::print("year:", dt.year());
  vix::print("month:", dt.month());
  vix::print("day:", dt.day());
  vix::print("hour:", dt.hour());
  vix::print("minute:", dt.minute());
  vix::print("second:", dt.second());
  vix::print("nanosecond:", dt.nanosecond());

  return 0;
}
```

These getters return the stored values. They are useful for formatting, validation flows, tests, and code that needs to map a `DateTime` into another representation.

## Compare DateTime values

`DateTime` supports equality and ordering comparisons.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  DateTime start = DateTime::parse("2026-02-07T10:30:15Z");
  DateTime end = DateTime::parse("2026-02-07T10:45:15Z");

  if (start < end)
  {
    vix::print(start.to_string_utc(), "comes before", end.to_string_utc());
  }

  return 0;
}
```

Ordering is based on UTC timestamp conversion. This keeps comparisons aligned with the way the module stores absolute time through `Timestamp`.

## Parse failure behavior

When parsing fails, `DateTime::parse()` returns the default value: `1970-01-01T00:00:00Z`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::DateTime dt =
      vix::time::DateTime::parse("not-a-datetime");

  vix::print("datetime:", dt.to_string_utc());

  return 0;
}
```

For user input or external data, application code should treat the default value carefully. It may be a valid epoch value in some systems, so it is better to validate input at the boundary before depending on the parsed result.

## API overview

| API                                                            | Purpose                                               |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| `DateTime()`                                                   | Create the default date-time, `1970-01-01T00:00:00Z`. |
| `DateTime(year, month, day, hour, minute, second, nanosecond)` | Create a date-time from explicit fields.              |
| `DateTime::now_utc()`                                          | Return the current UTC date-time.                     |
| `DateTime::parse(value)`                                       | Parse a UTC-oriented date-time string.                |
| `DateTime::from_timestamp_utc(timestamp)`                      | Build a UTC date-time from a `Timestamp`.             |
| `to_timestamp_utc()`                                           | Convert the date-time to a UTC `Timestamp`.           |
| `to_string_utc()`                                              | Format the date-time as an ISO-like UTC string.       |
| `year()`                                                       | Return the stored year.                               |
| `month()`                                                      | Return the stored month.                              |
| `day()`                                                        | Return the stored day.                                |
| `hour()`                                                       | Return the stored hour.                               |
| `minute()`                                                     | Return the stored minute.                             |
| `second()`                                                     | Return the stored second.                             |
| `nanosecond()`                                                 | Return the stored nanosecond field.                   |

## Next step

Continue with parsing to understand the low-level helpers used by `Date` and `DateTime`.

- [Parsing](./parsing)
