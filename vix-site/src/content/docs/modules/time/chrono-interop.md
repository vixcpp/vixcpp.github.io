# Chrono Interop

The `time` module is built to work cleanly with `std::chrono`.

Vix provides types such as `Duration` and `Timestamp` so application code can express time more clearly. A `Duration` says that a value is an elapsed span of time. A `Timestamp` says that a value is an absolute point in time. At the same time, C++ libraries and low-level APIs often expect `std::chrono` types, so the module keeps conversion points available where they are needed.

This page explains how to move between Vix time types and standard chrono types without losing the meaning of the value in your code.

## Header

Use the public Vix header when working with the time module:

```cpp
#include <vix/time.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

Some examples also use standard chrono utilities:

```cpp
#include <chrono>
```

## Duration and chrono durations

`Duration` stores elapsed time as nanoseconds. Use `to_chrono()` when you need a `std::chrono::nanoseconds` value.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Duration timeout = vix::time::Duration::milliseconds(250);

  std::chrono::nanoseconds chrono_timeout = timeout.to_chrono();

  vix::print("timeout ns:", chrono_timeout.count());

  return 0;
}
```

This is useful when passing a Vix duration into standard C++ APIs or third-party code that expects chrono durations.

## Build Duration from chrono

`Duration` can also be constructed from `std::chrono::nanoseconds`.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  std::chrono::nanoseconds chrono_value{500000000};

  vix::time::Duration duration{chrono_value};

  vix::print("milliseconds:", duration.count_ms());
  vix::print("nanoseconds:", duration.count_ns());

  return 0;
}
```

The constructor is explicit, so the conversion is visible at the call site. This keeps the unit boundary clear when moving from standard chrono code into Vix code.

## Convert other chrono durations

When you have another chrono duration type, cast it to nanoseconds before constructing a `Duration`.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace std::chrono;

  milliseconds input{1500};

  vix::time::Duration duration{
      duration_cast<nanoseconds>(input)};

  vix::print("seconds:", duration.count_seconds());
  vix::print("milliseconds:", duration.count_ms());

  return 0;
}
```

This makes truncation or precision changes explicit. Vix stores the final value in nanoseconds, but the conversion from the original unit stays under the control of the caller.

## Timestamp and chrono time points

`Timestamp` stores an absolute point in time as nanoseconds since the Unix epoch. Use `to_chrono()` when you need a `std::chrono::time_point` backed by `std::chrono::system_clock`.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Timestamp timestamp = vix::time::Timestamp::now();

  auto chrono_timestamp = timestamp.to_chrono();

  vix::print(
      "timestamp ns:",
      chrono_timestamp.time_since_epoch().count());

  return 0;
}
```

This is useful when integrating with standard chrono algorithms, storage code, or external libraries that already use `std::chrono::system_clock`.

## Build Timestamp from chrono

`Timestamp` can be constructed from its chrono time point type.

```cpp
#include <chrono>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Timestamp original = Timestamp::now();

  Timestamp::chrono_tp chrono_value = original.to_chrono();
  Timestamp roundtrip{chrono_value};

  vix::print("original:", original.nanoseconds_since_epoch());
  vix::print("roundtrip:", roundtrip.nanoseconds_since_epoch());

  return 0;
}
```

This pattern is useful when a value leaves Vix code as a chrono time point and later returns to the Vix time model.

## Use chrono with standard APIs

Many standard C++ APIs accept chrono durations directly. Convert a Vix `Duration` at the boundary.

```cpp
#include <chrono>
#include <thread>
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  vix::time::Duration delay = vix::time::Duration::milliseconds(100);

  std::this_thread::sleep_for(delay.to_chrono());

  vix::print("done");

  return 0;
}
```

Application code can keep using `Duration`, while the standard library receives the chrono type it expects.

## Use SteadyClock with chrono

`SteadyClock` exposes a chrono time point because monotonic measurements are naturally tied to `std::chrono::steady_clock`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  SteadyClock::chrono_tp start = SteadyClock::now_chrono();

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

The start value remains a steady-clock time point, and the measured result comes back as a Vix `Duration`. This keeps the clock source precise without leaking chrono arithmetic through the rest of the code.

## Date and DateTime conversion path

`Date` and `DateTime` do not expose every internal chrono type directly. Their normal conversion path is through `Timestamp`.

```cpp
#include <vix/time.hpp>
#include <vix/print.hpp>

int main()
{
  using namespace vix::time;

  Date date = Date::parse("2026-02-07");
  DateTime datetime = DateTime::parse("2026-02-07T10:30:15Z");

  Timestamp date_timestamp = date.to_timestamp_utc();
  Timestamp datetime_timestamp = datetime.to_timestamp_utc();

  auto chrono_date = date_timestamp.to_chrono();
  auto chrono_datetime = datetime_timestamp.to_chrono();

  vix::print("date ns:", chrono_date.time_since_epoch().count());
  vix::print("datetime ns:", chrono_datetime.time_since_epoch().count());

  return 0;
}
```

This keeps calendar types focused on their meaning, while `Timestamp` remains the bridge to epoch-based chrono time points.

## Keep conversions at the boundary

A good pattern is to keep Vix time types inside Vix application code and convert to chrono only when calling APIs that require it.

```cpp
#include <chrono>
#include <thread>
#include <vix/time.hpp>
#include <vix/print.hpp>

void wait_for(vix::time::Duration delay)
{
  std::this_thread::sleep_for(delay.to_chrono());
}

int main()
{
  vix::time::Duration retry_delay = vix::time::Duration::milliseconds(250);

  wait_for(retry_delay);

  vix::print("retry delay completed");

  return 0;
}
```

The function signature keeps the application meaning clear. The chrono conversion happens only at the standard-library boundary.

## API overview

| Vix API                              | Chrono type                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `Duration::to_chrono()`              | `std::chrono::nanoseconds`                                                     |
| `Duration(std::chrono::nanoseconds)` | Build `Duration` from chrono nanoseconds                                       |
| `Timestamp::to_chrono()`             | `Timestamp::chrono_tp`                                                         |
| `Timestamp(Timestamp::chrono_tp)`    | Build `Timestamp` from a chrono time point                                     |
| `Timestamp::chrono_tp`               | `std::chrono::time_point<std::chrono::system_clock, std::chrono::nanoseconds>` |
| `SteadyClock::chrono_tp`             | `std::chrono::time_point<std::chrono::steady_clock, std::chrono::nanoseconds>` |
| `SteadyClock::now_chrono()`          | Current steady-clock chrono time point                                         |
| `SteadyClock::since(start)`          | Convert elapsed steady-clock time to `Duration`                                |

## Next step

Continue with the API reference when you need the full list of public types and functions exposed by the module.

- [API Reference](./api-reference)
