# Integers

Integer conversion turns text into a concrete integral C++ type.

This is useful when values arrive from configuration files, environment variables, command-line arguments, request parameters, or small protocol fields. In those places, the application receives text, but the rest of the code usually needs a real integer. The `conversion` module handles that boundary explicitly and reports failures with `ConversionError`.

Integer parsing is strict. The input is trimmed using ASCII whitespace rules, an optional leading `+` or `-` is accepted, and the remaining characters must be base-10 digits. Overflow and underflow are detected instead of being ignored.

## Header

Use the public Vix header when working with integer conversion:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Convert to int32

Use `to_int32` when the target value should fit in a signed 32-bit integer.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_int32("8080");

  if (!port)
  {
    vix::print(
        "invalid integer:",
        vix::conversion::to_string(port.error().code));

    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

The result must be checked before reading the value. If the conversion fails, the result contains a `ConversionError`.

## Trimmed input

Leading and trailing ASCII whitespace are removed before parsing.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("   42  ");

  if (!value)
  {
    vix::print(
        "conversion failed:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

Only the edges are trimmed. Characters inside the number are still parsed strictly.

## Signs

Signed integer conversion accepts an optional leading `+` or `-`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto positive = vix::conversion::to_int32("+7");
  auto negative = vix::conversion::to_int32("-7");

  if (!positive || !negative)
  {
    vix::print("integer conversion failed");
    return 1;
  }

  vix::print("positive:", positive.value());
  vix::print("negative:", negative.value());

  return 0;
}
```

A sign without digits is rejected.

## Invalid characters

The parser does not accept partial integer parsing. If a non-digit appears where a digit is expected, the conversion fails.

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

This strict behavior is important for configuration and request input. A value like `12a` should not become `12` silently.

## Overflow and underflow

Integer conversion checks whether the parsed value fits the target type.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("2147483648");

  if (!value)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

For a signed 32-bit integer, `2147483648` is too large and returns `ConversionErrorCode::Overflow`. A value below the signed 32-bit minimum returns `ConversionErrorCode::Underflow`.

## 64-bit integers

Use `to_int64` when the value may require a signed 64-bit integer.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int64("9223372036854775807");

  if (!value)
  {
    vix::print(
        "invalid int64:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

The same strict parsing rules apply. The only difference is the target type and its range.

## Unsigned integers

Use `to_uint32` or `to_uint64` when the target type is unsigned.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_uint32("42");

  if (!value)
  {
    vix::print(
        "invalid unsigned integer:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

Negative input is rejected for unsigned targets.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_uint32("-1");

  if (!value)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  return 0;
}
```

For unsigned conversion, a negative sign reports an underflow-style error because the value cannot be represented by the target type.

## Generic integer conversion

Use `to_int<T>` when the target integral type is known in generic code.

```cpp
#include <cstdint>
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int<std::int64_t>("123456");

  if (!value)
  {
    vix::print(
        "conversion failed:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

The target type must be integral. For normal application code, the named helpers such as `to_int32`, `to_int64`, `to_uint32`, and `to_uint64` are usually easier to read.

## Generic parse

`parse<T>` also supports integral types.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto workers = vix::conversion::parse<int>("4");

  if (!workers)
  {
    vix::print(
        "invalid worker count:",
        vix::conversion::to_string(workers.error().code));

    return 1;
  }

  vix::print("workers:", workers.value());

  return 0;
}
```

Use this form when a generic parser already knows the target type. Use the named integer functions when the code is easier to understand with an explicit conversion name.

## Common errors

Integer conversion can return several error codes depending on the input.

| Input                           | Typical error      |
| ------------------------------- | ------------------ |
| `""`                            | `EmptyInput`       |
| `"   "`                         | `EmptyInput`       |
| `"abc"`                         | `InvalidCharacter` |
| `"12a"`                         | `InvalidCharacter` |
| `"+"`                           | `InvalidCharacter` |
| `"--1"`                         | `InvalidCharacter` |
| `"2147483648"` with `to_int32`  | `Overflow`         |
| `"-2147483649"` with `to_int32` | `Underflow`        |
| `"-1"` with `to_uint32`         | `Underflow`        |

The exact error code lets calling code distinguish malformed input from values that are well-shaped but outside the target type range.

## API overview

| API                | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| `to_int<T>(input)` | Convert input to an integral type `T`.          |
| `to_int32(input)`  | Convert input to `int`.                         |
| `to_int64(input)`  | Convert input to `std::int64_t`.                |
| `to_uint32(input)` | Convert input to `unsigned`.                    |
| `to_uint64(input)` | Convert input to `std::uint64_t`.               |
| `parse<T>(input)`  | Generic parsing entry point for integral types. |

All integer conversion functions return `expected<T, ConversionError>`.

## Next step

Continue with floating-point conversion to see how the module handles decimal values, scientific notation, and numeric range errors.

- [Floats](./floats)
