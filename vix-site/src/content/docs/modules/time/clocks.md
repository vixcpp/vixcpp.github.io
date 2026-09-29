# Clocks

The `time` module provides two clock helpers: `SystemClock` for wall-clock time and `SteadyClock` for elapsed-time measurement.

These two clocks solve different problems. Wall-clock time is the time a user, operating system, database, or log file understands as the current real-world time. Elapsed time is different: it measures how long work took, without depending on the system clock. Keeping those two meanings separate makes time-related code easier to read and safer to maintain.

## Header

Use the public Vix header when working with clocks:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## System clock

`SystemClock` reads the current wall-clock time and returns a `Timestamp`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Timestamp now = vix::time::SystemClock::now();

  vix::print("seconds since epoch:", now.seconds_since_epoch());
  vix::print("nanoseconds since epoch:", now.nanoseconds_since_epoch());

  return 0;
}
```

Use `SystemClock` when the value describes when something happened. This includes log timestamps, database fields such as `created_at` and `updated_at`, persisted records, cache metadata, audit events, and synchronization markers.

## SystemClock and Timestamp

`SystemClock::now()` is intentionally small. It delegates to the same timestamp model used by the rest of the module.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp created_at = SystemClock::now();
  Timestamp expires_at = created_at + Duration::minutes(10);

  vix::print("created:", created_at.seconds_since_epoch());
  vix::print("expires:", expires_at.seconds_since_epoch());

  return 0;
}
```

This keeps the workflow direct. Read the current wall time as a `Timestamp`, then use `Duration` when you need to compute another absolute time from it.

## Wall time can change

Wall-clock time is connected to the operating system clock. It can move forward normally, but it can also jump because of NTP synchronization, manual clock changes, virtual machine suspend and resume, or system time correction.

That behavior is expected for real-world timestamps, but it is not ideal for measuring elapsed work. For example, if you are measuring how long a function took to run, the measurement should not be affected by a system clock adjustment. In that case, use `SteadyClock`.

## Steady clock

`SteadyClock` is used for monotonic elapsed-time measurement. It does not represent a calendar time and it is not converted to `Timestamp`.

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

Use `SteadyClock` for benchmarks, profiling, timeout measurement, retry loops, and any code where the important question is how much time passed.

## Measure a block of work

A common pattern is to capture a steady-clock start value before the work begins, then call `SteadyClock::since(start)` after the work finishes.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

void run_work()
{
  long long value = 0;

  for (int i = 0; i < 500000; ++i)
  {
    value += i;
  }

  vix::print("value:", value);
}

int main()
{
  using namespace vix::time;

  auto start = SteadyClock::now_chrono();

  run_work();

  Duration elapsed = SteadyClock::since(start);

  vix::print("elapsed ms:", elapsed.count_ms());

  return 0;
}
```

The result is a `Duration`, because the difference between the start point and the current steady-clock point is an elapsed span of time.

## Choose the right clock

Use `SystemClock` when the value will be stored or interpreted as a real-world time. Use `SteadyClock` when the value is only used to measure elapsed work.

| Use case                   | Recommended clock             |
| -------------------------- | ----------------------------- |
| `created_at` field         | `SystemClock`                 |
| `updated_at` field         | `SystemClock`                 |
| Log timestamp              | `SystemClock`                 |
| Cache expiration timestamp | `SystemClock` with `Duration` |
| Benchmark measurement      | `SteadyClock`                 |
| Profiling a function       | `SteadyClock`                 |
| Timeout measurement        | `SteadyClock`                 |
| Measuring retry delay      | `SteadyClock`                 |

The distinction is simple but important. A timestamp should describe a moment in real time. An elapsed measurement should come from a monotonic clock.

## API overview

| API                         | Purpose                                                         |
| --------------------------- | --------------------------------------------------------------- |
| `SystemClock::now()`        | Return the current wall-clock time as a `Timestamp`.            |
| `SteadyClock::now_chrono()` | Return the current monotonic time point.                        |
| `SteadyClock::since(start)` | Return the elapsed `Duration` since a steady-clock start point. |
| `SteadyClock::chrono_tp`    | The internal steady-clock time point type used by the module.   |

## Next step

Continue with dates to see how the module represents calendar days without mixing them with clock time.

- [Dates](./dates)
