# API Reference

This page lists the public API exposed by the Vix `time` module.

The module is organized around a small set of value types. `Duration` represents elapsed time, `Timestamp` represents an absolute epoch-based point in time, `Date` represents a calendar day, and `DateTime` represents a UTC-oriented date and time value. `SystemClock`, `SteadyClock`, and the parsing helpers complete the module by covering the common runtime workflows around current time, elapsed measurement, and simple input parsing.

## Header

Use the public Vix header when working with the time module:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Namespace

All time module APIs live in the `vix::time` namespace.

```cpp
using namespace vix::time;
```

Low-level parsing helpers live in the nested namespace:

```cpp
vix::time::parse
```

## Duration

`Duration` is a strongly typed elapsed-time value stored internally as nanoseconds.

```cpp
class Duration;
```

### Types

```cpp
using rep = std::int64_t;
using chrono_ns = std::chrono::nanoseconds;
```

### Constructors

```cpp
constexpr Duration() noexcept;
```

Creates a zero duration.

```cpp
explicit constexpr Duration(chrono_ns ns) noexcept;
```

Creates a duration from `std::chrono::nanoseconds`.

### Factory functions

```cpp
static constexpr Duration nanoseconds(rep ns) noexcept;
static constexpr Duration microseconds(rep us) noexcept;
static constexpr Duration milliseconds(rep ms) noexcept;
static constexpr Duration seconds(rep s) noexcept;
static constexpr Duration minutes(rep m) noexcept;
static constexpr Duration hours(rep h) noexcept;
```

These functions create a `Duration` from a clear unit. They are the preferred way to construct durations in normal application code because the unit is visible at the call site.

### Accessors

```cpp
constexpr rep count_ns() const noexcept;
constexpr rep count_us() const noexcept;
constexpr rep count_ms() const noexcept;
constexpr rep count_seconds() const noexcept;
```

Returns the duration in the requested unit. Larger units are truncated because the return value is an integer.

```cpp
constexpr chrono_ns to_chrono() const noexcept;
```

Converts the duration to `std::chrono::nanoseconds`.

```cpp
constexpr bool is_zero() const noexcept;
```

Returns `true` when the duration is zero.

### Operators

```cpp
friend constexpr bool operator==(const Duration &a, const Duration &b) noexcept;
friend constexpr bool operator!=(const Duration &a, const Duration &b) noexcept;
friend constexpr bool operator<(const Duration &a, const Duration &b) noexcept;
friend constexpr bool operator>(const Duration &a, const Duration &b) noexcept;
friend constexpr bool operator<=(const Duration &a, const Duration &b) noexcept;
friend constexpr bool operator>=(const Duration &a, const Duration &b) noexcept;
```

Compares two durations by their stored nanosecond value.

```cpp
friend constexpr Duration operator+(const Duration &a, const Duration &b) noexcept;
friend constexpr Duration operator-(const Duration &a, const Duration &b) noexcept;
```

Adds or subtracts two durations.

```cpp
constexpr Duration &operator+=(const Duration &other) noexcept;
constexpr Duration &operator-=(const Duration &other) noexcept;
```

Updates a duration in place.

## Timestamp

`Timestamp` represents an absolute point in time as nanoseconds since the Unix epoch.

```cpp
class Timestamp;
```

The epoch used by the module is:

```txt
1970-01-01T00:00:00Z
```

### Types

```cpp
using rep = std::int64_t;

using chrono_tp =
  std::chrono::time_point<
    std::chrono::system_clock,
    std::chrono::nanoseconds
  >;
```

### Constructors

```cpp
constexpr Timestamp() noexcept;
```

Creates a timestamp at the Unix epoch.

```cpp
explicit constexpr Timestamp(rep ns_since_epoch) noexcept;
```

Creates a timestamp from nanoseconds since the Unix epoch.

```cpp
explicit constexpr Timestamp(chrono_tp tp) noexcept;
```

Creates a timestamp from a chrono system-clock time point.

### Factory functions

```cpp
static Timestamp now() noexcept;
```

Returns the current wall-clock time as a timestamp.

```cpp
static constexpr Timestamp from_nanoseconds(rep ns) noexcept;
static constexpr Timestamp from_seconds(rep sec) noexcept;
```

Creates a timestamp from an epoch-based integer value.

### Accessors

```cpp
constexpr rep nanoseconds_since_epoch() const noexcept;
constexpr rep seconds_since_epoch() const noexcept;
```

Returns the stored epoch value in nanoseconds or seconds. The seconds value is truncated.

```cpp
constexpr chrono_tp to_chrono() const noexcept;
```

Converts the timestamp to a chrono system-clock time point.

```cpp
constexpr bool is_zero() const noexcept;
```

Returns `true` when the timestamp is the Unix epoch value.

### Operators

```cpp
friend constexpr Timestamp operator+(const Timestamp &ts, const Duration &d) noexcept;
friend constexpr Timestamp operator-(const Timestamp &ts, const Duration &d) noexcept;
```

Adds or subtracts a duration from a timestamp.

```cpp
friend constexpr Duration operator-(const Timestamp &a, const Timestamp &b) noexcept;
```

Returns the elapsed duration between two timestamps.

```cpp
friend constexpr bool operator==(const Timestamp &a, const Timestamp &b) noexcept;
friend constexpr bool operator!=(const Timestamp &a, const Timestamp &b) noexcept;
friend constexpr bool operator<(const Timestamp &a, const Timestamp &b) noexcept;
friend constexpr bool operator>(const Timestamp &a, const Timestamp &b) noexcept;
friend constexpr bool operator<=(const Timestamp &a, const Timestamp &b) noexcept;
friend constexpr bool operator>=(const Timestamp &a, const Timestamp &b) noexcept;
```

Compares timestamps by their stored epoch nanosecond value.

## SystemClock

`SystemClock` provides access to the current wall-clock time.

```cpp
struct SystemClock;
```

Use this when the value represents real-world time, such as log timestamps, persisted records, `created_at`, `updated_at`, or cache metadata.

### Functions

```cpp
static Timestamp now() noexcept;
```

Returns the current wall-clock time as a `Timestamp`.

## SteadyClock

`SteadyClock` provides monotonic elapsed-time measurement.

```cpp
class SteadyClock;
```

Use this for benchmarks, profiling, timeout measurement, and any code that needs to know how much time passed. A steady-clock time point is not a wall-clock timestamp and should not be stored as a real-world time.

### Types

```cpp
using chrono_tp =
  std::chrono::time_point<
    std::chrono::steady_clock,
    std::chrono::nanoseconds
  >;
```

### Functions

```cpp
static chrono_tp now_chrono() noexcept;
```

Returns the current monotonic chrono time point with nanosecond precision.

```cpp
static Duration since(const chrono_tp &start) noexcept;
```

Returns the elapsed `Duration` since a steady-clock start point.

## Date

`Date` represents a calendar date without storing a time of day or timezone.

```cpp
class Date;
```

A `Date` stores year, month, and day fields. When converted to a timestamp, it is interpreted as UTC at `00:00:00`.

### Constructors

```cpp
constexpr Date() noexcept;
```

Creates the default date:

```txt
1970-01-01
```

```cpp
constexpr Date(int year, int month, int day) noexcept;
```

Creates a date from explicit fields. The constructor stores the fields directly. Use `is_valid()` when the value comes from external input or needs calendar validation.

### Factory functions

```cpp
static Date now() noexcept;
static Date today() noexcept;
```

Returns the current UTC date. `now()` is an alias for `today()`.

```cpp
static Date parse(std::string_view s) noexcept;
```

Parses a date in `YYYY-MM-DD` form. On parse failure, it returns the default date.

### Accessors

```cpp
constexpr int year() const noexcept;
constexpr int month() const noexcept;
constexpr int day() const noexcept;
```

Returns the stored date fields.

```cpp
constexpr bool is_valid() const noexcept;
```

Returns `true` when the stored fields form a valid calendar date.

```cpp
Timestamp to_timestamp_utc() const noexcept;
```

Converts the date to a UTC timestamp at midnight. If the date is invalid, this returns a default `Timestamp`.

```cpp
std::string to_string() const;
```

Formats the stored fields as `YYYY-MM-DD`.

### Operators

```cpp
friend constexpr bool operator==(const Date &a, const Date &b) noexcept;
friend constexpr bool operator!=(const Date &a, const Date &b) noexcept;
friend constexpr bool operator<(const Date &a, const Date &b) noexcept;
friend constexpr bool operator>(const Date &a, const Date &b) noexcept;
friend constexpr bool operator<=(const Date &a, const Date &b) noexcept;
friend constexpr bool operator>=(const Date &a, const Date &b) noexcept;
```

Compares dates by year, then month, then day.

## DateTime

`DateTime` represents a calendar date and time of day.

```cpp
class DateTime;
```

In the current module design, `DateTime` is UTC-oriented. It does not store timezone information. Parsing, timestamp conversion, and formatting are treated as UTC.

### Types

```cpp
using nanos_rep = std::int32_t;
```

### Constructors

```cpp
constexpr DateTime() noexcept;
```

Creates the default date-time:

```txt
1970-01-01T00:00:00Z
```

```cpp
constexpr DateTime(
  int year,
  int month,
  int day,
  int hour,
  int minute,
  int second,
  nanos_rep nanosecond = 0
) noexcept;
```

Creates a date-time from explicit fields. The constructor stores the fields directly. Calendar validation is performed by conversions that require a valid date.

### Factory functions

```cpp
static DateTime now_utc() noexcept;
```

Returns the current UTC date-time.

```cpp
static DateTime from_timestamp_utc(const Timestamp &ts) noexcept;
```

Builds a UTC date-time from an epoch-based timestamp.

```cpp
static DateTime parse(std::string_view s);
```

Parses a UTC-oriented date-time string.

Supported forms include:

```txt
YYYY-MM-DDTHH:MM:SSZ
YYYY-MM-DD HH:MM:SS
YYYY-MM-DDTHH:MM:SS.sssZ
YYYY-MM-DDTHH:MM:SS.ssssssZ
YYYY-MM-DDTHH:MM:SS.sssssssssZ
```

On parse failure, this returns the default date-time.

### Accessors

```cpp
constexpr int year() const noexcept;
constexpr int month() const noexcept;
constexpr int day() const noexcept;

constexpr int hour() const noexcept;
constexpr int minute() const noexcept;
constexpr int second() const noexcept;
constexpr nanos_rep nanosecond() const noexcept;
```

Returns the stored date and time fields.

```cpp
Timestamp to_timestamp_utc() const noexcept;
```

Converts the date-time to a UTC timestamp. If the calendar date is invalid, this returns a default `Timestamp`.

```cpp
std::string to_string_utc() const;
```

Formats the date-time as an ISO-like UTC string. Fractional seconds are omitted when the nanosecond field is zero.

### Operators

```cpp
friend constexpr bool operator==(const DateTime &a, const DateTime &b) noexcept;
friend constexpr bool operator!=(const DateTime &a, const DateTime &b) noexcept;
```

Compares date-time values field by field.

```cpp
friend bool operator<(const DateTime &a, const DateTime &b) noexcept;
friend bool operator>(const DateTime &a, const DateTime &b) noexcept;
friend bool operator<=(const DateTime &a, const DateTime &b) noexcept;
friend bool operator>=(const DateTime &a, const DateTime &b) noexcept;
```

Orders date-time values through UTC timestamp conversion.

## Parsing helpers

Low-level parsing helpers live in `vix::time::parse`.

These helpers parse string shapes and return numeric fields to the caller. They are intentionally small and do not perform full calendar or policy validation.

### parse_ymd

```cpp
bool parse_ymd(
  std::string_view s,
  int &year,
  int &month,
  int &day
) noexcept;
```

Parses a date string in this form:

```txt
YYYY-MM-DD
```

Returns `true` when the expected shape was parsed and `false` otherwise.

The function checks digits and separators. It does not validate whether the parsed fields form a real calendar date.

### parse_hms

```cpp
bool parse_hms(
  std::string_view s,
  int &hour,
  int &minute,
  int &second
) noexcept;
```

Parses a time string in this form:

```txt
HH:MM:SS
```

Returns `true` when the expected shape was parsed and `false` otherwise.

The function checks digits and separators. It does not enforce hour, minute, or second ranges.

## Umbrella header

The module also exposes an internal module header:

```cpp
#include <vix/time/time.hpp>
```

For normal Vix application code and documentation examples, prefer the public root aggregator:

```cpp
#include <vix/time.hpp>
```

## Complete example

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp started_at = SystemClock::now();

  Duration lifetime = Duration::seconds(30);
  Timestamp expires_at = started_at + lifetime;

  Date date = Date::parse("2026-02-07");
  DateTime datetime = DateTime::parse("2026-02-07T10:30:15Z");

  auto steady_start = SteadyClock::now_chrono();

  long long total = 0;
  for (int i = 0; i < 100000; ++i)
  {
    total += i;
  }

  Duration elapsed = SteadyClock::since(steady_start);

  vix::print("started:", started_at.seconds_since_epoch());
  vix::print("expires:", expires_at.seconds_since_epoch());
  vix::print("date:", date.to_string());
  vix::print("datetime:", datetime.to_string_utc());
  vix::print("total:", total);
  vix::print("elapsed ns:", elapsed.count_ns());

  return 0;
}
```

## Summary

The `time` module exposes a small set of focused types:

| Type               | Main use                                 |
| ------------------ | ---------------------------------------- |
| `Duration`         | Elapsed spans of time.                   |
| `Timestamp`        | Absolute epoch-based points in time.     |
| `SystemClock`      | Current wall-clock time.                 |
| `SteadyClock`      | Monotonic elapsed-time measurement.      |
| `Date`             | Calendar days.                           |
| `DateTime`         | UTC-oriented date and time values.       |
| `vix::time::parse` | Low-level date and time parsing helpers. |

Use `Duration` for “how long”, `Timestamp` for “when”, `SystemClock` for current real-world time, and `SteadyClock` for elapsed measurement.
