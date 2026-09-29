# Parsing

The `time` module includes small parsing helpers for simple date and time strings.

Parsing is intentionally kept narrow. The helpers read predictable text shapes such as `YYYY-MM-DD` and `HH:MM:SS`, then return the parsed numeric fields to the caller. Calendar and range validation are handled by higher-level types such as `Date` and `DateTime`, where the full meaning of the value is known.

Most application code should start with `Date::parse()` or `DateTime::parse()`. The lower-level helpers under `vix::time::parse` are useful when you are building custom input handling, command-line parsing, configuration loading, or a parser that needs to inspect the fields before deciding what to do with them.

## Header

Use the public Vix header when working with the time module:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Prefer the high-level parsers

For normal application code, use the type-level parsers first. They make the intent clearer and keep parsing close to the type that will use the value.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Date date = Date::parse("2026-02-07");
  DateTime datetime = DateTime::parse("2026-02-07T10:30:15Z");

  if (!date.is_valid())
  {
    vix::print("invalid date");
    return 1;
  }

  vix::print("date:", date.to_string());
  vix::print("datetime:", datetime.to_string_utc());

  return 0;
}
```

This is the best starting point when the input is expected to become a `Date` or `DateTime`.

## Parse a date shape

`parse_ymd()` parses a string in the form `YYYY-MM-DD`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int year = 0;
  int month = 0;
  int day = 0;

  bool ok = vix::time::parse::parse_ymd(
      "2026-02-07",
      year,
      month,
      day);

  if (!ok)
  {
    vix::print("invalid date shape");
    return 1;
  }

  vix::print("year:", year);
  vix::print("month:", month);
  vix::print("day:", day);

  return 0;
}
```

The function checks the string shape and separators. It expects exactly ten characters, with `-` between the year, month, and day. It does not decide whether the parsed fields form a real calendar date.

## Validate after parsing

Because `parse_ymd()` only parses the shape, a value such as `2026-02-31` can be parsed successfully even though it is not a valid calendar day. Use `Date` when you need calendar validation.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int year = 0;
  int month = 0;
  int day = 0;

  if (!vix::time::parse::parse_ymd("2026-02-31", year, month, day))
  {
    vix::print("invalid date shape");
    return 1;
  }

  vix::time::Date date{year, month, day};

  if (!date.is_valid())
  {
    vix::print("invalid calendar date");
    return 1;
  }

  vix::print("date:", date.to_string());

  return 0;
}
```

This separation is useful when the caller wants to report different errors for malformed input and calendar-invalid input.

## Parse a time shape

`parse_hms()` parses a string in the form `HH:MM:SS`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int hour = 0;
  int minute = 0;
  int second = 0;

  bool ok = vix::time::parse::parse_hms(
      "10:30:15",
      hour,
      minute,
      second);

  if (!ok)
  {
    vix::print("invalid time shape");
    return 1;
  }

  vix::print("hour:", hour);
  vix::print("minute:", minute);
  vix::print("second:", second);

  return 0;
}
```

The function reads digits and separators only. It expects exactly eight characters, with `:` between the hour, minute, and second fields.

## Validate time ranges

`parse_hms()` does not enforce ranges such as hour `0..23` or minute `0..59`. This keeps the helper small and allows the caller to decide which ranges are acceptable for the surrounding workflow.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int hour = 0;
  int minute = 0;
  int second = 0;

  if (!vix::time::parse::parse_hms("25:10:00", hour, minute, second))
  {
    vix::print("invalid time shape");
    return 1;
  }

  if (hour < 0 || hour > 23 ||
      minute < 0 || minute > 59 ||
      second < 0 || second > 60)
  {
    vix::print("invalid time range");
    return 1;
  }

  vix::print("valid time:", hour, minute, second);

  return 0;
}
```

The higher-level `DateTime::parse()` already performs basic range checks for its supported date-time format.

## Build a DateTime from parsed fields

The low-level helpers are useful when a format arrives in pieces and you want to assemble a `DateTime` manually.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int year = 0;
  int month = 0;
  int day = 0;

  int hour = 0;
  int minute = 0;
  int second = 0;

  bool date_ok = vix::time::parse::parse_ymd(
      "2026-02-07",
      year,
      month,
      day);

  bool time_ok = vix::time::parse::parse_hms(
      "10:30:15",
      hour,
      minute,
      second);

  if (!date_ok || !time_ok)
  {
    vix::print("invalid input shape");
    return 1;
  }

  vix::time::DateTime datetime{
      year,
      month,
      day,
      hour,
      minute,
      second};

  vix::time::Timestamp timestamp = datetime.to_timestamp_utc();

  vix::print("datetime:", datetime.to_string_utc());
  vix::print("timestamp:", timestamp.seconds_since_epoch());

  return 0;
}
```

When you construct values manually, keep validation close to the place where the parsed fields become a real time value.

## Parse user input carefully

For input that comes from users, configuration files, request bodies, or command-line arguments, parse shape first, then validate meaning. This gives clearer error handling than treating every failure as the same problem.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  int year = 0;
  int month = 0;
  int day = 0;

  const char *input = "2026-02-07";

  if (!vix::time::parse::parse_ymd(input, year, month, day))
  {
    vix::print("expected date format: YYYY-MM-DD");
    return 1;
  }

  vix::time::Date date{year, month, day};

  if (!date.is_valid())
  {
    vix::print("date is not a valid calendar day");
    return 1;
  }

  vix::print("accepted date:", date.to_string());

  return 0;
}
```

This pattern is practical in CLIs and APIs because it lets you return precise messages without making the parsing helper responsible for every possible policy decision.

## API overview

| API                                                        | Purpose                                 |
| ---------------------------------------------------------- | --------------------------------------- |
| `vix::time::parse::parse_ymd(value, year, month, day)`     | Parse `YYYY-MM-DD` into integer fields. |
| `vix::time::parse::parse_hms(value, hour, minute, second)` | Parse `HH:MM:SS` into integer fields.   |

Both functions return `true` when the expected shape was parsed and `false` when the input does not match the expected form.

## Next step

Continue with chrono interop to see how the time module connects back to standard C++ time types.

- [Chrono Interop](./chrono-interop)
