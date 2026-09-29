# Quick Start

The `conversion` module gives Vix applications a clear way to convert text into typed C++ values.

This is useful whenever a value enters the application as a string but needs to become a real type before it can be used. Configuration values, environment variables, command-line options, request parameters, and small protocol fields often follow this pattern. The module keeps that step explicit by returning an expected-style result: either the converted value is available, or a structured `ConversionError` explains why the conversion failed.

## Header

Use the public Vix header when working with the conversion module:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Convert an integer

Integer conversion is strict. The input is trimmed, an optional sign is accepted, and the remaining characters must be base-10 digits.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_int32("8080");

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

This is the common shape of conversion code in Vix. Check the result first, then read the value with `.value()` only when the conversion succeeded.

## Convert a floating-point value

Floating-point conversion accepts decimal values and scientific notation. The entire trimmed input must be consumed.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto ratio = vix::conversion::to_float64("0.75");

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

Use `to_float32`, `to_float64`, or `to_float80` when the target precision matters in the surrounding code.

## Convert a boolean

Boolean conversion is useful for configuration and small text protocols.

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

The accepted true values are `true`, `1`, `yes`, and `on`. The accepted false values are `false`, `0`, `no`, and `off`. Keyword matching is ASCII case-insensitive after trimming.

## Convert an enum

Enum conversion uses an explicit mapping table. This keeps the conversion predictable because the module does not guess the names that belong to your application.

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
  auto mode = vix::conversion::to_enum("Production", modes);

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

By default, enum matching ignores ASCII case. Pass `false` as the third argument when the input must match the mapping table exactly.

```cpp
auto mode = vix::conversion::to_enum(
    "Production",
    modes,
    false);
```

## Use the generic parser

`parse<T>` is a generic entry point for scalar values. It supports booleans, integral types, and floating-point types.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto workers = vix::conversion::parse<int>("4");
  auto enabled = vix::conversion::parse<bool>("true");
  auto timeout = vix::conversion::parse<double>("2.5");

  if (!workers || !enabled || !timeout)
  {
    vix::print("one conversion failed");
    return 1;
  }

  vix::print("workers:", workers.value());
  vix::print("enabled:", enabled.value());
  vix::print("timeout:", timeout.value());

  return 0;
}
```

Use `parse<T>` when generic code already knows the target type. For enums, use `to_enum` or `parse_enum` with an explicit mapping table.

## Convert values back to strings

The module also provides `to_string` for supported values.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_string(8080);
  auto enabled = vix::conversion::to_string(true);

  if (!port || !enabled)
  {
    vix::print("string conversion failed");
    return 1;
  }

  vix::print("port:", port.value());
  vix::print("enabled:", enabled.value());

  return 0;
}
```

This is useful when writing typed values back into text formats such as configuration files, generated output, diagnostics, or small serialized records.

## Handle conversion errors

Every failed conversion returns a `ConversionError`. The error contains a code, the original input, and sometimes a position that points to where the failure happened.

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

  vix::print("value:", value.value());

  return 0;
}
```

The error code is intended for logs, diagnostics, and higher-level error mapping. User-facing messages should usually be written by the layer that understands the application context.

## Complete example

This example parses a small configuration-like set of values.

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
  auto port = vix::conversion::to_int32("8080");
  auto debug = vix::conversion::to_bool("off");
  auto ratio = vix::conversion::to_float64("0.75");
  auto environment = vix::conversion::to_enum("production", environments);

  if (!port)
  {
    vix::print("invalid port:", vix::conversion::to_string(port.error().code));
    return 1;
  }

  if (!debug)
  {
    vix::print("invalid debug value:", vix::conversion::to_string(debug.error().code));
    return 1;
  }

  if (!ratio)
  {
    vix::print("invalid ratio:", vix::conversion::to_string(ratio.error().code));
    return 1;
  }

  if (!environment)
  {
    vix::print("invalid environment:", vix::conversion::to_string(environment.error().code));
    return 1;
  }

  vix::print("port:", port.value());
  vix::print("debug:", debug.value());
  vix::print("ratio:", ratio.value());
  vix::print("environment parsed");

  return 0;
}
```

The important part is not the amount of code. The important part is the workflow: convert each value explicitly, check the result, and let the application decide how to handle failures.

## Next step

Continue with expected results to understand the result type used by all conversion functions.

- [Expected Results](./expected-results)
- [Errors](./errors)
- [Integers](./integers)
- [Floats](./floats)
- [Booleans](./booleans)
- [Enums](./enums)
- [To String](./to-string)
- [Generic Parse](./generic-parse)
