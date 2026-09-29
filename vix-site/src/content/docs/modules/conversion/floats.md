# Floats

Floating-point conversion turns text into a concrete floating-point C++ type.

This is useful when values such as ratios, prices, thresholds, weights, percentages, timeouts, or configuration limits arrive as strings. The conversion module keeps that boundary explicit: the input is parsed strictly, the result must be checked, and failures are reported with `ConversionError`.

Floating-point parsing trims ASCII whitespace, accepts decimal notation and scientific notation, and requires the entire trimmed input to be consumed. A value such as `1.2abc` is not accepted as `1.2`, because partial parsing often hides mistakes in configuration files and request input.

## Header

Use the public Vix header when working with floating-point conversion:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Convert to double

Use `to_float64` when you want a normal C++ `double`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("3.14");

  if (!value)
  {
    vix::print(
        "invalid float:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

This is the common choice for most application-level floating-point values.

## Trimmed input

Leading and trailing ASCII whitespace are removed before parsing.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("   2.5  ");

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

Only the edges are trimmed. Characters that remain after the parsed number are still treated as an error.

## Decimal values

The parser accepts normal decimal values.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto positive = vix::conversion::to_float64("12.5");
  auto negative = vix::conversion::to_float64("-1.25");

  if (!positive || !negative)
  {
    vix::print("float conversion failed");
    return 1;
  }

  vix::print("positive:", positive.value());
  vix::print("negative:", negative.value());

  return 0;
}
```

The decimal separator is `.`. This keeps parsing predictable across platforms and avoids locale-dependent behavior in the conversion layer.

## Scientific notation

Scientific notation is supported with `e` or `E`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto large = vix::conversion::to_float64("1e3");
  auto small = vix::conversion::to_float64("2.5E-2");

  if (!large || !small)
  {
    vix::print("scientific notation conversion failed");
    return 1;
  }

  vix::print("large:", large.value());
  vix::print("small:", small.value());

  return 0;
}
```

This is useful for configuration values and numeric input where compact notation is expected.

## Invalid input

The parser rejects input that cannot be read as a floating-point value.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("abc");

  if (!value)
  {
    const auto &error = value.error();

    vix::print("error:", vix::conversion::to_string(error.code));
    vix::print("input:", error.input);

    return 1;
  }

  return 0;
}
```

For this kind of input, the result normally contains `ConversionErrorCode::InvalidFloat`.

## Trailing characters

The conversion is strict. If the number is followed by extra characters, the conversion fails.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("1.25ms");

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

This behavior is intentional. A string such as `1.25ms` carries a unit, and the conversion module should not silently discard that part. The caller should parse the unit explicitly if the format allows one.

## Overflow and underflow

Floating-point conversion reports range errors when the parsed value cannot be represented by the target type.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("1e10000");

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

A value that is too large reports `Overflow`. A value that is too small to represent normally reports `Underflow`.

## Float sizes

The module provides named helpers for common floating-point targets.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto a = vix::conversion::to_float32("3.5");
  auto b = vix::conversion::to_float64("3.5");
  auto c = vix::conversion::to_float80("3.5");

  if (!a || !b || !c)
  {
    vix::print("float conversion failed");
    return 1;
  }

  vix::print("float32:", a.value());
  vix::print("float64:", b.value());
  vix::print("float80:", c.value());

  return 0;
}
```

`to_float32` returns `float`, `to_float64` returns `double`, and `to_float80` returns `long double`. The actual precision of `long double` depends on the platform ABI.

## Generic floating-point conversion

Use `to_float<T>` when the target floating-point type is known in generic code.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float<double>("0.75");

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

The target type must be a floating-point type. For normal application code, the named helpers are usually easier to read.

## Generic parse

`parse<T>` also supports floating-point types.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto ratio = vix::conversion::parse<double>("0.75");

  if (!ratio)
  {
    vix::print(
        "invalid ratio:",
        vix::conversion::to_string(ratio.error().code));

    return 1;
  }

  vix::print("ratio:", ratio.value());

  return 0;
}
```

Use this form when generic code already knows the target type. Use `to_float32`, `to_float64`, or `to_float80` when the conversion name should make the target precision clear.

## Common errors

Floating-point conversion can return several error codes depending on the input.

| Input        | Typical error                          |
| ------------ | -------------------------------------- |
| `""`         | `EmptyInput`                           |
| `"   "`      | `EmptyInput`                           |
| `"abc"`      | `InvalidFloat`                         |
| `"1.2.3"`    | `InvalidFloat` or `TrailingCharacters` |
| `"1.25ms"`   | `TrailingCharacters`                   |
| `"1e10000"`  | `Overflow`                             |
| `"1e-10000"` | `Underflow`                            |

The exact error code depends on where the underlying parser detects the failure, but the workflow stays the same: check the result, read the error, and let the surrounding application add context.

## API overview

| API                  | Purpose                                               |
| -------------------- | ----------------------------------------------------- |
| `to_float<T>(input)` | Convert input to a floating-point type `T`.           |
| `to_float32(input)`  | Convert input to `float`.                             |
| `to_float64(input)`  | Convert input to `double`.                            |
| `to_float80(input)`  | Convert input to `long double`.                       |
| `parse<T>(input)`    | Generic parsing entry point for floating-point types. |

All floating-point conversion functions return `expected<T, ConversionError>`.

## Next step

Continue with boolean conversion to see how the module handles common text forms such as `true`, `false`, `yes`, `no`, `on`, and `off`.

- [Booleans](./booleans)
