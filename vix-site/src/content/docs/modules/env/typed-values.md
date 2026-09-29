# Typed Values

Environment variables are stored as strings, but most applications eventually need those strings as real runtime values. A server port should become an integer, a debug flag should become a boolean, and a timeout may need to become a floating-point value. The `env` module keeps that conversion explicit by providing typed readers that read from the process environment and return structured results.

Typed readers are useful during application startup because configuration mistakes should be caught early. If `PORT` contains `8080`, the application can continue. If it contains `8080abc`, the value is invalid and should be reported before the server starts.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Reading a boolean

Use `get_bool()` when an environment variable represents a flag.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto debug = vix::env::get_bool("DEBUG");

  if (!debug.ok())
  {
    vix::print("DEBUG is missing or invalid:", debug.error().message());
    return 1;
  }

  vix::print("debug:", debug.value());

  return 0;
}
```

Boolean parsing accepts common environment values. The truthy values are `1`, `true`, `yes`, and `on`. The falsy values are `0`, `false`, `no`, and `off`. Comparison is case-insensitive, and surrounding whitespace is ignored.

```txt
DEBUG=true
DEBUG=FALSE
DEBUG=on
DEBUG=0
```

A value such as `maybe` is rejected because it does not clearly describe a boolean state.

## Reading a signed integer

Use `get_int()` when a value may be positive or negative and must be a base-10 integer.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("PORT must be a valid integer:", port.error().message());
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

The parser accepts values such as `8080`, `0`, and `-1`. It ignores surrounding whitespace, but it does not accept extra characters after the number.

```txt
PORT=8080
PORT= 8080
PORT=8080abc
```

In this example, the first two values can be parsed as integers. The last value is rejected because the full value is not a valid integer.

## Reading an unsigned integer

Use `get_uint()` when the value must be a non-negative integer. This is useful for counts, limits, worker numbers, retry attempts, and similar configuration values.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto workers = vix::env::get_uint("WORKERS");

  if (!workers.ok())
  {
    vix::print("WORKERS must be a non-negative integer:", workers.error().message());
    return 1;
  }

  vix::print("workers:", workers.value());

  return 0;
}
```

A value such as `4` is accepted, but `-1` is rejected because it is not valid for an unsigned integer. This keeps configuration intent clear: when a setting cannot logically be negative, the parser should not allow it.

## Reading a double

Use `get_double()` when the value may contain a decimal part.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto timeout = vix::env::get_double("TIMEOUT_SECONDS");

  if (!timeout.ok())
  {
    vix::print("TIMEOUT_SECONDS must be a valid number:", timeout.error().message());
    return 1;
  }

  vix::print("timeout:", timeout.value());

  return 0;
}
```

The parser accepts ordinary floating-point values such as `0.5`, `2.0`, and `-1.25`. Like the integer readers, it requires the remaining content to be valid after surrounding whitespace is removed.

## Reading several values during startup

A common startup pattern is to read all required values before the rest of the application is initialized. This keeps configuration validation in one visible place and avoids discovering a bad value after the application has already started.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto app_env = vix::env::get("APP_ENV");
  auto port = vix::env::get_int("PORT");
  auto debug = vix::env::get_bool("DEBUG");
  auto workers = vix::env::get_uint("WORKERS");
  auto timeout = vix::env::get_double("TIMEOUT_SECONDS");

  if (!app_env.ok())
  {
    vix::print("APP_ENV is required:", app_env.error().message());
    return 1;
  }

  if (!port.ok())
  {
    vix::print("PORT is required and must be an integer:", port.error().message());
    return 1;
  }

  if (!debug.ok())
  {
    vix::print("DEBUG is required and must be a boolean:", debug.error().message());
    return 1;
  }

  if (!workers.ok())
  {
    vix::print("WORKERS is required and must be an unsigned integer:", workers.error().message());
    return 1;
  }

  if (!timeout.ok())
  {
    vix::print("TIMEOUT_SECONDS is required and must be a number:", timeout.error().message());
    return 1;
  }

  vix::print("environment:", app_env.value());
  vix::print("port:", port.value());
  vix::print("debug:", debug.value());
  vix::print("workers:", workers.value());
  vix::print("timeout:", timeout.value());

  return 0;
}
```

This style is intentionally direct. The application reads the variables it depends on, checks each result, and reports a clear error when the runtime environment does not match what the program expects.

## Missing variables and invalid values

Typed readers can fail for two common reasons: the variable does not exist, or the value exists but cannot be parsed as the requested type. Both cases return a failed result.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("invalid PORT:", port.error().message());
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

When a value is optional, use `get_or()` for string defaults, or read the variable with `get()` first and decide whether to parse it only when it is present. The typed readers are best for values that are expected to exist and must be valid.

## Choosing the right reader

Use `get()` when the value should remain text, such as an application name, URL, path, token, or environment name. Use `get_bool()` for flags, `get_int()` for signed numeric values, `get_uint()` for counts and limits that cannot be negative, and `get_double()` for decimal values such as durations, ratios, and thresholds.

The important point is to validate configuration at the boundary. Once a value has been read and parsed successfully, the rest of the application can work with the correct C++ type instead of repeatedly interpreting strings.

## Next steps

Continue with the `.env` files page to see how dotenv files are loaded from disk and represented as parsed `EnvFile` values.
