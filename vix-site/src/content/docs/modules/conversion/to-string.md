# To String

The `conversion` module can convert supported C++ values back into text.

This is useful when typed values need to be written into configuration output, diagnostics, generated files, logs, small serialized records, or protocol fields. The API follows the same expected-style model used by parsing functions: a successful conversion returns a `std::string`, and a failed conversion returns a `ConversionError`.

For error codes, the module also provides a lightweight diagnostic `to_string` overload that returns a `std::string_view`. That overload is meant for logging and developer diagnostics.

## Header

Use the public Vix header when working with string conversion:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Convert an integer

Integral values are formatted as base-10 strings.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto text = vix::conversion::to_string(8080);

  if (!text)
  {
    vix::print(
        "integer formatting failed:",
        vix::conversion::to_string(text.error().code));

    return 1;
  }

  vix::print("port:", text.value());

  return 0;
}
```

Integer formatting uses `std::to_chars` internally. The conversion is direct and does not depend on stream formatting or locale state.

## Signed and unsigned values

The integer overload supports signed and unsigned integral types, except `bool`, which has its own overload.

```cpp
#include <cstdint>
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto signed_value = vix::conversion::to_string(std::int64_t{-42});
  auto unsigned_value = vix::conversion::to_string(std::uint64_t{42});

  if (!signed_value || !unsigned_value)
  {
    vix::print("integer string conversion failed");
    return 1;
  }

  vix::print("signed:", signed_value.value());
  vix::print("unsigned:", unsigned_value.value());

  return 0;
}
```

This is useful when writing numeric values back into text-based formats without mixing conversion code with application formatting logic.

## Convert a floating-point value

Floating-point values are also formatted with `std::to_chars`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto text = vix::conversion::to_string(3.14);

  if (!text)
  {
    vix::print(
        "float formatting failed:",
        vix::conversion::to_string(text.error().code));

    return 1;
  }

  vix::print("value:", text.value());

  return 0;
}
```

The exact textual representation is produced by the standard library formatter. Use this for technical conversion to text, not for polished user-facing number formatting.

## Convert a boolean

Boolean values are converted to `"true"` or `"false"`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::to_string(true);
  auto debug = vix::conversion::to_string(false);

  if (!enabled || !debug)
  {
    vix::print("boolean string conversion failed");
    return 1;
  }

  vix::print("enabled:", enabled.value());
  vix::print("debug:", debug.value());

  return 0;
}
```

This keeps boolean output stable. The module does not preserve the original input form such as `yes`, `no`, `on`, or `off`; it writes the canonical C++ boolean words.

## Convert an enum

Enum values are converted to strings through an explicit mapping table.

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
  auto name = vix::conversion::to_string(Role::Admin, roles);

  if (!name)
  {
    vix::print(
        "enum formatting failed:",
        vix::conversion::to_string(name.error().code));

    return 1;
  }

  vix::print("role:", name.value());

  return 0;
}
```

The same mapping table can be used for parsing and formatting. This keeps the accepted input names and output names aligned.

## Unknown enum values

If the enum value is not found in the mapping table, conversion fails with `ConversionErrorCode::UnknownEnumValue`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Status
{
  Pending,
  Active,
  Disabled
};

static constexpr vix::conversion::EnumEntry<Status> statuses[] = {
    {"pending", Status::Pending},
    {"active", Status::Active},
};

int main()
{
  auto name = vix::conversion::to_string(Status::Disabled, statuses);

  if (!name)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(name.error().code));

    return 1;
  }

  return 0;
}
```

The conversion module only formats enum values that are declared in the table. If a new enum value is added, the mapping should be updated as part of the same change.

## Pointer and count overload

When the mapping table is not available as a static array reference, use the overload that accepts a pointer and count.

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
  auto name = vix::conversion::to_string(
      Mode::Production,
      modes,
      2);

  if (!name)
  {
    vix::print(
        "mode formatting failed:",
        vix::conversion::to_string(name.error().code));

    return 1;
  }

  vix::print("mode:", name.value());

  return 0;
}
```

The static array overload is usually easier to read, but the pointer-and-count overload is useful when the mapping table is passed through another structure.

## Error code strings

`ConversionErrorCode` has a separate `to_string` overload that returns a short diagnostic string.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("abc");

  if (!value)
  {
    std::string_view message =
        vix::conversion::to_string(value.error().code);

    vix::print("error:", message);

    return 1;
  }

  return 0;
}
```

This text is not localized and should not be treated as final UI copy. It is useful for logs, diagnostics, tests, and developer-facing output.

## Complete example

This example parses a few values, then converts them back to strings.

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
  auto enabled = vix::conversion::to_bool("on");
  auto ratio = vix::conversion::to_float64("0.75");
  auto environment =
      vix::conversion::to_enum("production", environments);

  if (!port || !enabled || !ratio || !environment)
  {
    vix::print("one input conversion failed");
    return 1;
  }

  auto port_text = vix::conversion::to_string(port.value());
  auto enabled_text = vix::conversion::to_string(enabled.value());
  auto ratio_text = vix::conversion::to_string(ratio.value());
  auto environment_text =
      vix::conversion::to_string(environment.value(), environments);

  if (!port_text || !enabled_text || !ratio_text || !environment_text)
  {
    vix::print("one string conversion failed");
    return 1;
  }

  vix::print("port:", port_text.value());
  vix::print("enabled:", enabled_text.value());
  vix::print("ratio:", ratio_text.value());
  vix::print("environment:", environment_text.value());

  return 0;
}
```

The workflow stays the same in both directions. Convert explicitly, check the result, then use the value.

## API overview

| API                                     | Purpose                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| `to_string(Int value)`                  | Convert an integral value, except `bool`, to a base-10 string. |
| `to_string(Float value)`                | Convert a floating-point value to a string.                    |
| `to_string(bool value)`                 | Convert a boolean to `"true"` or `"false"`.                    |
| `to_string(Enum value, entries)`        | Convert an enum value using a static array mapping table.      |
| `to_string(Enum value, entries, count)` | Convert an enum value using a pointer and count.               |
| `to_string(ConversionErrorCode code)`   | Return a short diagnostic string for an error code.            |

Value-to-string overloads return `expected<std::string, ConversionError>`. The error-code overload returns `std::string_view`.

## Next step

Continue with generic parsing to see how `parse<T>` provides a single entry point for scalar conversion.

- [Generic Parse](./generic-parse)
