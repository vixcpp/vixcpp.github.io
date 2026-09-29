# Generic Parse

The `conversion` module provides `parse<T>` as a generic entry point for scalar conversion.

Most conversion code should use the focused functions when the target type is obvious: `to_int32`, `to_float64`, `to_bool`, or `to_enum`. Those names make application code easy to read. `parse<T>` is useful when the target type is already known by the surrounding code, especially in generic helpers, configuration loaders, or small parsing functions that should work with several scalar types.

`parse<T>` returns the same expected-style result as the rest of the module. On success, it contains the parsed value. On failure, it contains a `ConversionError`.

## Header

Use the public Vix header when working with generic parsing:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Parse an integer

When `T` is an integral type, `parse<T>` uses the integer conversion path.

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

The same strict integer rules apply. Input is trimmed, base-10 digits are expected, and overflow or underflow is reported.

## Parse a floating-point value

When `T` is a floating-point type, `parse<T>` uses the floating-point conversion path.

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

Decimal notation and scientific notation are supported. The entire trimmed input must be consumed.

## Parse a boolean

When `T` is `bool`, `parse<T>` uses boolean conversion.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::parse<bool>("yes");

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

The accepted true values are `true`, `1`, `yes`, and `on`. The accepted false values are `false`, `0`, `no`, and `off`.

## Use generic parsing in helper functions

`parse<T>` is most useful when writing a helper that should parse different scalar types with the same workflow.

```cpp
#include <string_view>
#include <vix/conversion.hpp>
#include <vix/print.hpp>

template <typename T>
vix::conversion::expected<T, vix::conversion::ConversionError>
read_value(std::string_view input)
{
  return vix::conversion::parse<T>(input);
}

int main()
{
  auto port = read_value<int>("8080");
  auto timeout = read_value<double>("2.5");
  auto enabled = read_value<bool>("on");

  if (!port || !timeout || !enabled)
  {
    vix::print("one value failed to parse");
    return 1;
  }

  vix::print("port:", port.value());
  vix::print("timeout:", timeout.value());
  vix::print("enabled:", enabled.value());

  return 0;
}
```

This keeps the caller responsible for the target type while keeping the parsing workflow consistent.

## Add context around generic parsing

A generic parser knows the target type, but it usually does not know what the value means in the application. Add context at the call site when reporting errors.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::parse<int>("abc");

  if (!port)
  {
    vix::print(
        "APP_PORT must be a base-10 integer:",
        vix::conversion::to_string(port.error().code));

    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

The conversion module reports the technical failure. The application explains the meaning of the failed value.

## Parse enums with `parse_enum`

`parse<T>` does not parse enum values directly. Enums need an explicit mapping table, so the module provides `parse_enum`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Environment
{
  Development,
  Production
};

static constexpr vix::conversion::EnumEntry<Environment> environments[] = {
    {"development", Environment::Development},
    {"production", Environment::Production},
};

int main()
{
  auto environment =
      vix::conversion::parse_enum<Environment>(
          "production",
          environments);

  if (!environment)
  {
    vix::print(
        "invalid environment:",
        vix::conversion::to_string(environment.error().code));

    return 1;
  }

  vix::print("environment parsed");

  return 0;
}
```

This keeps enum parsing explicit. The mapping table defines the accepted strings and their corresponding enum values.

## Case-sensitive enum parsing

`parse_enum` uses ASCII case-insensitive matching by default. Pass `false` when exact matching is required.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Mode
{
  Development,
  Production
};

static constexpr vix::conversion::EnumEntry<Mode> modes[] = {
    {"development", Mode::Development},
    {"production", Mode::Production},
};

int main()
{
  auto mode =
      vix::conversion::parse_enum<Mode>(
          "Production",
          modes,
          false);

  if (!mode)
  {
    vix::print(
        "invalid mode:",
        vix::conversion::to_string(mode.error().code));

    return 1;
  }

  vix::print("mode parsed");

  return 0;
}
```

Use this when the input belongs to a strict protocol or file format where letter case is part of the contract.

## Unsupported types

`parse<T>` supports these target types:

| Target type          | Conversion path |
| -------------------- | --------------- |
| `bool`               | `to_bool`       |
| Integral types       | `to_int<T>`     |
| Floating-point types | `to_float<T>`   |

Other types are rejected at compile time. For enums, use `parse_enum` or `to_enum`. For custom types, write a small application-level parser that uses the public conversion functions for the fields it needs.

## Complete example

This example parses a small configuration-like group of values with `parse<T>` and `parse_enum`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Environment
{
  Development,
  Production
};

static constexpr vix::conversion::EnumEntry<Environment> environments[] = {
    {"development", Environment::Development},
    {"production", Environment::Production},
};

int main()
{
  auto port = vix::conversion::parse<int>("8080");
  auto workers = vix::conversion::parse<int>("4");
  auto ratio = vix::conversion::parse<double>("0.75");
  auto debug = vix::conversion::parse<bool>("off");
  auto environment =
      vix::conversion::parse_enum<Environment>(
          "production",
          environments);

  if (!port)
  {
    vix::print("invalid port:", vix::conversion::to_string(port.error().code));
    return 1;
  }

  if (!workers)
  {
    vix::print("invalid workers:", vix::conversion::to_string(workers.error().code));
    return 1;
  }

  if (!ratio)
  {
    vix::print("invalid ratio:", vix::conversion::to_string(ratio.error().code));
    return 1;
  }

  if (!debug)
  {
    vix::print("invalid debug:", vix::conversion::to_string(debug.error().code));
    return 1;
  }

  if (!environment)
  {
    vix::print(
        "invalid environment:",
        vix::conversion::to_string(environment.error().code));

    return 1;
  }

  vix::print("port:", port.value());
  vix::print("workers:", workers.value());
  vix::print("ratio:", ratio.value());
  vix::print("debug:", debug.value());
  vix::print("environment parsed");

  return 0;
}
```

The important part is the consistency of the workflow. Every conversion returns a result, every result is checked, and every failure can be mapped with context.

## API overview

| API                                                         | Purpose                                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `parse<T>(input)`                                           | Generic parsing entry point for `bool`, integral types, and floating-point types. |
| `parse_enum<Enum>(input, entries, case_insensitive)`        | Parse an enum using a static array mapping table.                                 |
| `parse_enum<Enum>(input, entries, count, case_insensitive)` | Parse an enum using a pointer and count.                                          |

All generic parsing functions return expected-style results with `ConversionError` on failure.

## Next step

Continue with the API reference for a compact list of all public types and functions exposed by the conversion module.

- [API Reference](./api-reference)
