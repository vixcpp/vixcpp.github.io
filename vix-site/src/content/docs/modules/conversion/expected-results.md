# Expected Results

The `conversion` module returns expected-style results instead of throwing exceptions or silently producing fallback values.

This matters because conversion usually happens at the boundary of an application. A value may come from a configuration file, an environment variable, a command-line argument, or a request parameter. At that point, failure is normal and should be handled directly. The result type makes that workflow explicit: the conversion either contains a typed value, or it contains a `ConversionError`.

## Header

Use the public Vix header when working with conversion results:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Result shape

Most conversion functions return this form:

```cpp
vix::conversion::expected<T, vix::conversion::ConversionError>
```

For example, `to_int32` returns a result that either contains an `int` or a `ConversionError`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto result = vix::conversion::to_int32("42");

  if (!result)
  {
    vix::print(
        "conversion failed:",
        vix::conversion::to_string(result.error().code));

    return 1;
  }

  int value = result.value();

  vix::print("value:", value);

  return 0;
}
```

The important rule is simple: check the result before reading the value. When the result is false, read the error. When the result is true, read the converted value.

## Check success

The result can be checked with `if (result)`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("3.14");

  if (value)
  {
    vix::print("parsed:", value.value());
  }

  return 0;
}
```

This keeps conversion code compact without hiding failure. The condition is not checking whether the parsed value is truthy; it is checking whether the conversion succeeded.

## Use `has_value`

The same check can be written with `has_value()` when that reads better in the surrounding code.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::to_bool("yes");

  if (enabled.has_value())
  {
    vix::print("enabled:", enabled.value());
  }

  return 0;
}
```

Both forms are valid. Use the one that makes the code easier to read.

## Read the error

When conversion fails, the result contains a `ConversionError`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("12a");

  if (!value)
  {
    const auto &error = value.error();

    vix::print("error:", vix::conversion::to_string(error.code));
    vix::print("input:", error.input);
    vix::print("position:", error.position);

    return 1;
  }

  return 0;
}
```

The error gives technical information about the failed conversion. Higher layers can map that into a user-facing message, a log entry, or a domain-specific validation error.

## Avoid reading value before checking

`value()` should only be used after checking that the result contains a value.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_int32("8080");

  if (!port)
  {
    vix::print("invalid port");
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

This pattern is clear and safe. It makes the failure path visible before the converted value is used.

## Return conversion results from functions

A function can return the expected result directly when conversion is part of its own responsibility.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

vix::conversion::expected<int, vix::conversion::ConversionError>
parse_port(std::string_view input)
{
  return vix::conversion::to_int32(input);
}

int main()
{
  auto port = parse_port("8080");

  if (!port)
  {
    vix::print(
        "invalid port:",
        vix::conversion::to_string(port.error().code));

    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

This is useful when a lower-level function only knows about conversion. The caller can decide whether the error should become a log message, an HTTP error, a CLI message, or a configuration failure.

## Map conversion errors at the boundary

The conversion module reports technical errors. Application code should add context when presenting the failure.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto workers = vix::conversion::to_int32("many");

  if (!workers)
  {
    vix::print(
        "WORKERS must be a base-10 integer:",
        vix::conversion::to_string(workers.error().code));

    return 1;
  }

  vix::print("workers:", workers.value());

  return 0;
}
```

The conversion error says what failed technically. The surrounding code says what the input meant in the application.

## Expected implementation

The module uses `std::expected` when the standard library supports it. When `std::expected` is not available, Vix provides a small fallback implementation with the API needed by the conversion module.

The public workflow stays the same in both cases:

```cpp
auto result = vix::conversion::to_int32("42");

if (result)
{
  vix::print(result.value());
}
else
{
  vix::print(vix::conversion::to_string(result.error().code));
}
```

This allows the conversion API to work in C++20 projects while still using the standard library implementation in environments where C++23 `std::expected` is available.

## `make_unexpected`

`make_unexpected` is used internally and in advanced code to construct an error result.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

vix::conversion::expected<int, vix::conversion::ConversionError>
always_fail(std::string_view input)
{
  return vix::conversion::make_unexpected(
      vix::conversion::ConversionError{
          vix::conversion::ConversionErrorCode::InvalidCharacter,
          input});
}

int main()
{
  auto result = always_fail("abc");

  if (!result)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(result.error().code));
  }

  return 0;
}
```

Most application code will not need to call `make_unexpected` directly. It is mainly useful when writing helper functions that follow the same result style as the conversion module.

## API overview

| API                      | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `expected<T, E>`         | Represents either a value of type `T` or an error of type `E`. |
| `unexpected<E>`          | Wraps an error value for constructing failed results.          |
| `make_unexpected(error)` | Creates an unexpected error result.                            |
| `operator bool()`        | Checks whether the result contains a value.                    |
| `has_value()`            | Checks whether the result contains a value.                    |
| `value()`                | Returns the contained value. Use only after success.           |
| `error()`                | Returns the contained error. Use only after failure.           |

## Next step

Continue with errors to understand the structure and meaning of `ConversionError`.

- [Errors](./errors)
