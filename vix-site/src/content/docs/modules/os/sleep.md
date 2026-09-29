# Sleep

The `os` module includes two small sleep helpers for blocking the current thread for a fixed amount of time. They are useful in examples, tests, simple polling loops, local tools, and small programs that need a direct delay without introducing a larger runtime abstraction.

A sleep function is intentionally simple: the current thread stops running for the requested duration, then execution continues. This is different from scheduling asynchronous work or waiting inside an event loop. When an application needs non-blocking timers, background tasks, or coordinated async execution, it should use the appropriate runtime or async module. The sleep helpers are for the cases where a direct blocking delay is the clearest tool.

## Header

```cpp id="gobjqk"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## Sleep for milliseconds

Use `sleep_for_ms()` when the delay is expressed in milliseconds.

```cpp id="ukfdtg"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  vix::print("starting work");

  vix::os::sleep_for_ms(500);

  vix::print("work resumed");

  return 0;
}
```

This pauses the current thread for roughly the requested number of milliseconds. The exact wake-up time is controlled by the operating system scheduler, so the function should not be used when a program needs precise real-time timing. It is appropriate for simple delays where a small scheduling difference is acceptable.

## Sleep for seconds

Use `sleep_for_seconds()` when the delay is naturally expressed in seconds.

```cpp id="8qprte"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  vix::print("waiting before retry");

  vix::os::sleep_for_seconds(2);

  vix::print("retrying now");

  return 0;
}
```

This is mostly a convenience wrapper around a seconds-based delay. It keeps examples and small tools readable when the delay is not meant to be configured at millisecond precision.

## Simple retry delay

A common use of a blocking sleep is to add a small pause between retry attempts in a local tool or script-like program.

```cpp id="a6hrnx"
#include <vix/os.hpp>
#include <vix/print.hpp>

bool try_connect()
{
  return false;
}

int main()
{
  for (int attempt = 1; attempt <= 3; ++attempt)
  {
    vix::print("attempt:", attempt);

    if (try_connect())
    {
      vix::print("connected");
      return 0;
    }

    if (attempt < 3)
    {
      vix::print("connection failed, waiting before retry");
      vix::os::sleep_for_seconds(1);
    }
  }

  vix::eprint("connection failed after retries");
  return 1;
}
```

This kind of pattern is useful when the program is small and the delay is part of a simple control flow. In a server, worker system, or async application, a blocking sleep can hold a thread that could otherwise be doing useful work. In those cases, prefer a timer or task abstraction that fits the runtime model.

## Blocking behavior

Both sleep functions block the current thread. They do not return a `Result`, because sleeping through the standard C++ thread facilities does not expose the same kind of recoverable OS query failure as functions like `hostname()`, `page_size()`, or `uptime()`.

```cpp id="ixuh8d"
vix::os::sleep_for_ms(100);
vix::os::sleep_for_seconds(1);
```

Use these helpers when the blocking behavior is expected and harmless. Avoid placing them in request handlers, UI event paths, or hot loops where holding the thread would make the program less responsive.

## Sleep API overview

| Function                              | Return type | Purpose                                                        |
| ------------------------------------- | ----------- | -------------------------------------------------------------- |
| `vix::os::sleep_for_ms(milliseconds)` | `void`      | Block the current thread for the given number of milliseconds. |
| `vix::os::sleep_for_seconds(seconds)` | `void`      | Block the current thread for the given number of seconds.      |

Both functions accept `std::uint64_t` values.

## Next step

Continue with errors to understand how the OS module represents unsupported operations, failed system calls, permission issues, missing values, and invalid arguments.
