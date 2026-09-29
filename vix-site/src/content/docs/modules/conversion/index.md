# Conversion

The `conversion` module provides strict, predictable type conversion utilities for Vix applications.

Application code often receives values as text before it can use them as real C++ types. Configuration files, environment variables, command-line arguments, request parameters, database fields, and small protocol values may all arrive as strings. The conversion module exists to handle those cases without silent fallbacks, locale surprises, or unchecked casts.

The core model is simple: a conversion returns either a typed value or a structured `ConversionError`. This makes conversion failures explicit at the call site and gives higher layers enough information to log, diagnose, or map the failure into a domain-level error.

## Header

Use the public Vix header when working with the conversion module:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic example

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_int32("8080");

  if (!port)
  {
    vix::print(
        "conversion failed:",
        vix::conversion::to_string(port.error().code));

    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

The returned value behaves like an `expected` result. When the conversion succeeds, it contains the parsed value. When it fails, it contains a `ConversionError` with a stable error code and the original input.

## Core model

The module separates conversion from business validation. It checks whether a string can be converted into a technical type such as an integer, float, boolean, enum, or string representation. It does not decide whether a value is allowed by the application. For example, converting `"8080"` to an integer is a conversion concern. Deciding whether port `8080` is allowed in a production configuration belongs to a higher layer.

| API area                       | Purpose                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `expected<T, ConversionError>` | Represents either a converted value or a conversion error.              |
| `ConversionError`              | Carries a structured error code, original input, and optional position. |
| `to_int`                       | Converts strict base-10 integer input.                                  |
| `to_float`                     | Converts strict floating-point input.                                   |
| `to_bool`                      | Converts common boolean text forms.                                     |
| `to_enum`                      | Converts strings to enum values using an explicit mapping table.        |
| `to_string`                    | Converts supported values back to strings.                              |
| `parse<T>`                     | Generic parsing entry point for scalar types.                           |

This design keeps parsing code readable. A function that needs an integer can ask for an integer. A function that needs a boolean can ask for a boolean. If the input cannot be converted, the error is returned directly instead of being hidden behind a default value.

## Integers

Integer conversion is strict and base 10. The input is trimmed first, an optional sign is allowed, and the entire remaining input must be numeric.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32(" 42 ");

  if (!value)
  {
    vix::print(
        "invalid integer:",
        vix::conversion::to_string(value.error().code));

    return 1;
  }

  vix::print("value:", value.value());

  return 0;
}
```

Overflow and underflow are detected. This matters when parsing values from configuration, request input, or storage because a value that does not fit the target type should not silently wrap.

## Floating-point values

Floating-point conversion supports decimal and scientific notation. The input is trimmed, the full value must be consumed, and range errors are reported.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("2.5e3");

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

The parser expects the normal C-style decimal form. This keeps behavior deterministic and avoids locale-dependent parsing rules.

## Booleans

Boolean conversion accepts the common forms used in configuration and small text protocols.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::to_bool("on");

  if (!enabled)
  {
    vix::print(
        "invalid boolean:",
        vix::conversion::to_string(enabled.error().code));

    return 1;
  }

  vix::print("enabled:", enabled.value());

  return 0;
}
```

Accepted true values are `true`, `1`, `yes`, and `on`. Accepted false values are `false`, `0`, `no`, and `off`. Keyword matching is ASCII case-insensitive after trimming.

## Enums

Enum conversion uses an explicit mapping table. This is important because enum names are application decisions, and the conversion module should not guess them.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Role
{
  Admin,
  User,
  Guest
};

static constexpr vix::conversion::EnumEntry<Role> roles[] = {
    {"admin", Role::Admin},
    {"user", Role::User},
    {"guest", Role::Guest},
};

int main()
{
  auto role = vix::conversion::to_enum("USER", roles);

  if (!role)
  {
    vix::print(
        "unknown role:",
        vix::conversion::to_string(role.error().code));

    return 1;
  }

  vix::print("role parsed");

  return 0;
}
```

By default, enum matching is ASCII case-insensitive. Case-sensitive matching is also available when the input format requires exact names.

## Generic parsing

`parse<T>` provides a generic entry point for common scalar types.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto count = vix::conversion::parse<int>("12");
  auto active = vix::conversion::parse<bool>("true");
  auto ratio = vix::conversion::parse<double>("0.75");

  if (!count || !active || !ratio)
  {
    vix::print("one conversion failed");
    return 1;
  }

  vix::print("count:", count.value());
  vix::print("active:", active.value());
  vix::print("ratio:", ratio.value());

  return 0;
}
```

Use `parse<T>` when generic code already knows the target type. For enums, use `parse_enum` or `to_enum` with an explicit mapping table.

## Convert values to strings

The module also provides `to_string` overloads for supported values.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto a = vix::conversion::to_string(42);
  auto b = vix::conversion::to_string(3.14);
  auto c = vix::conversion::to_string(true);

  if (!a || !b || !c)
  {
    vix::print("string conversion failed");
    return 1;
  }

  vix::print(a.value());
  vix::print(b.value());
  vix::print(c.value());

  return 0;
}
```

This is useful when a value needs to be written back into a text format without mixing formatting logic into the rest of the code.

## Errors

Conversion failures are represented by `ConversionError`.

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

The error code is stable and intended for diagnostics, logs, and higher-level error mapping. It is not meant to be polished user-facing UI text.

## Internal helpers

The module has internal helpers for ASCII checks, trimming, integer parsing, and floating-point parsing. These live under `vix::conversion::detail` and support the public API.

Normal application code should prefer the public functions from `vix::conversion`: `to_int`, `to_float`, `to_bool`, `to_enum`, `to_string`, and `parse`.

## Next step

Start with the quick start page to see the common workflow, then continue with the focused pages for expected results, errors, and each conversion family.

- [Quick Start](./quick-start)
- [Expected Results](./expected-results)
- [Errors](./errors)
- [Integers](./integers)
- [Floats](./floats)
- [Booleans](./booleans)
- [Enums](./enums)
- [To String](./to-string)
- [Generic Parse](./generic-parse)
- [API Reference](./api-reference)
