# Dates

`Date` represents a calendar day in the Vix time module.

A date is useful when the value only needs a day-level meaning: a release date, a report date, a due date, or any field that should be stored as `YYYY-MM-DD`. It does not store a time of day or timezone information. When a date needs to become a timestamp, Vix converts it as UTC at midnight, which keeps the behavior explicit and predictable.

## Header

Use the public Vix header when working with dates:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a date

A `Date` can be created from explicit year, month, and day fields.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date release{2026, 2, 7};

  vix::print("date:", release.to_string());

  return 0;
}
```

The constructor stores the fields directly. It does not reject invalid calendar values at construction time, so code that receives user input or external data should call `is_valid()` before using the date for conversion.

## Get today's date

Use `Date::today()` when you need the current UTC calendar date.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date today = vix::time::Date::today();

  vix::print("today:", today.to_string());

  return 0;
}
```

`Date::now()` is also available as an alias for `Date::today()`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date today = vix::time::Date::now();

  vix::print("today:", today.to_string());

  return 0;
}
```

Use either form based on what reads best in the surrounding code.

## Parse a date

`Date::parse` reads the `YYYY-MM-DD` format.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date date = vix::time::Date::parse("2026-02-07");

  vix::print("year:", date.year());
  vix::print("month:", date.month());
  vix::print("day:", date.day());
  vix::print("date:", date.to_string());

  return 0;
}
```

On parse failure, `Date::parse` returns the default date, `1970-01-01`. Parsing checks the shape of the string, but calendar validation remains a separate step. This keeps parsing simple while still giving application code control over how invalid input should be handled.

## Validate a date

Use `is_valid()` to check whether the stored fields form a real calendar date.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date date = vix::time::Date::parse("2026-02-31");

  if (!date.is_valid())
  {
    vix::print("invalid date");
    return 1;
  }

  vix::print("valid date:", date.to_string());

  return 0;
}
```

This is important when accepting dates from configuration files, request bodies, command-line input, or persisted data that may have been edited outside the application.

## Convert a date to a timestamp

A `Date` can be converted to a UTC timestamp at `00:00:00`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Date date = Date::parse("2026-02-07");

  if (!date.is_valid())
  {
    vix::print("invalid date");
    return 1;
  }

  Timestamp start_of_day = date.to_timestamp_utc();

  vix::print("date:", date.to_string());
  vix::print("start of day seconds:", start_of_day.seconds_since_epoch());

  return 0;
}
```

If the date is invalid, `to_timestamp_utc()` returns a default `Timestamp`. Validating first makes the intent clearer and avoids treating an invalid date as a meaningful epoch value.

## Format a date

Use `to_string()` to format a date as `YYYY-MM-DD`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date date{2026, 2, 7};

  vix::print(date.to_string());

  return 0;
}
```

Formatting prints the stored fields. It does not validate the date before printing, which allows diagnostics and error handling code to display the value that was actually received.

## Compare dates

Dates support equality and ordering comparisons.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Date first{2026, 2, 7};
  Date second{2026, 3, 1};

  if (first < second)
  {
    vix::print(first.to_string(), "comes before", second.to_string());
  }

  return 0;
}
```

Ordering is based on the stored year, month, and day fields. This makes dates useful for sorting day-level records before converting them into timestamps.

## Read date fields

The year, month, and day fields can be accessed directly through small getter functions.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Date date{2026, 2, 7};

  vix::print("year:", date.year());
  vix::print("month:", date.month());
  vix::print("day:", date.day());

  return 0;
}
```

These getters return the stored values. When the date comes from external input, validate it before making calendar decisions based on the fields.

## API overview

| API                      | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `Date()`                 | Create the default date, `1970-01-01`.               |
| `Date(year, month, day)` | Create a date from explicit fields.                  |
| `Date::today()`          | Return the current UTC date.                         |
| `Date::now()`            | Alias for `Date::today()`.                           |
| `Date::parse(value)`     | Parse a date in `YYYY-MM-DD` form.                   |
| `year()`                 | Return the stored year.                              |
| `month()`                | Return the stored month.                             |
| `day()`                  | Return the stored day.                               |
| `is_valid()`             | Check whether the fields form a valid calendar date. |
| `to_timestamp_utc()`     | Convert the date to a UTC timestamp at midnight.     |
| `to_string()`            | Format the date as `YYYY-MM-DD`.                     |

## Next step

Continue with `DateTime` when you need both a calendar date and a time of day.

- [DateTime](./datetimes)
