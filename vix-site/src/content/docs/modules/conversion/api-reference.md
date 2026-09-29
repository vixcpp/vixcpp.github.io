# API Reference

This page lists the public API exposed by the Vix `conversion` module.

The module provides strict text conversion for common scalar types. Public conversion functions return expected-style results: success contains the converted value, and failure contains a `ConversionError`. This keeps conversion failures explicit without forcing the caller into exceptions, silent defaults, or unchecked casts.

## Header

Use the public Vix header when working with the conversion module:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The module also has an internal aggregation header:

```cpp
#include <vix/conversion/conversion.hpp>
```

For normal Vix application code and documentation examples, prefer the public root header:

```cpp
#include <vix/conversion.hpp>
```

## Namespace

All public conversion APIs live in the `vix::conversion` namespace.

```cpp
namespace vix::conversion
{
}
```

Internal helpers live under:

```cpp
namespace vix::conversion::detail
{
}
```

Application code should normally use the public APIs from `vix::conversion`.

## ConversionErrorCode

`ConversionErrorCode` describes the technical reason a conversion failed.

```cpp
enum class ConversionErrorCode : std::uint8_t
{
  None = 0,

  EmptyInput,
  InvalidCharacter,
  TrailingCharacters,

  Overflow,
  Underflow,

  InvalidBoolean,

  UnknownEnumValue,

  InvalidFloat
};
```

### Values

| Code                 | Meaning                                                         |
| -------------------- | --------------------------------------------------------------- |
| `None`               | No conversion error.                                            |
| `EmptyInput`         | The input was empty or became empty after trimming.             |
| `InvalidCharacter`   | An unexpected character was found.                              |
| `TrailingCharacters` | A value was parsed, but extra characters remained.              |
| `Overflow`           | The parsed value is larger than the target type can represent.  |
| `Underflow`          | The parsed value is smaller than the target type can represent. |
| `InvalidBoolean`     | The input does not match a supported boolean value.             |
| `UnknownEnumValue`   | The input does not match any enum mapping entry.                |
| `InvalidFloat`       | The input could not be parsed as a floating-point value.        |

## ConversionError

`ConversionError` is the structured error type returned by failed conversions.

```cpp
struct ConversionError
{
  ConversionErrorCode code{ConversionErrorCode::None};
  std::string_view input{};
  std::size_t position{0};

  constexpr ConversionError() = default;

  constexpr ConversionError(
      ConversionErrorCode c,
      std::string_view in,
      std::size_t pos = 0) noexcept;

  [[nodiscard]] constexpr bool ok() const noexcept;
};
```

### Fields

| Field      | Purpose                                                  |
| ---------- | -------------------------------------------------------- |
| `code`     | Technical conversion failure code.                       |
| `input`    | Original input passed to the public conversion function. |
| `position` | Optional character position hint.                        |

### `ok`

```cpp
[[nodiscard]] constexpr bool ok() const noexcept;
```

Returns `true` when `code` is `ConversionErrorCode::None`.

## Error code strings

The module provides a diagnostic string for `ConversionErrorCode`.

```cpp
[[nodiscard]] constexpr std::string_view
to_string(ConversionErrorCode code) noexcept;
```

Example:

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("abc");

  if (!value)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(value.error().code));
  }

  return 0;
}
```

The returned text is intended for diagnostics and logs. It is not localized and should not be treated as final user-facing UI copy.

## expected

The conversion module uses an expected-style result type.

```cpp
template <typename T, typename E>
using expected = /* std::expected when available, otherwise Vix fallback */;
```

When the standard library provides C++23 `std::expected`, Vix uses it. Otherwise, the module provides a small C++20 fallback with the API needed by conversion functions.

### Observers

```cpp
[[nodiscard]] bool has_value() const noexcept;
[[nodiscard]] explicit operator bool() const noexcept;
```

Both forms check whether the result contains a value.

### Accessors

```cpp
[[nodiscard]] T &value() & noexcept;
[[nodiscard]] const T &value() const & noexcept;
[[nodiscard]] T &&value() && noexcept;

[[nodiscard]] E &error() & noexcept;
[[nodiscard]] const E &error() const & noexcept;
[[nodiscard]] E &&error() && noexcept;
```

Use `value()` only after checking that the result succeeded. Use `error()` only after checking that the result failed.

## unexpected

`unexpected` wraps an error value when constructing a failed expected result.

```cpp
template <typename E>
class unexpected;
```

### Type alias

```cpp
using error_type = E;
```

### Accessors

```cpp
[[nodiscard]] const E &error() const & noexcept;
[[nodiscard]] E &error() & noexcept;
[[nodiscard]] E &&error() && noexcept;
```

Most application code does not need to construct `unexpected` directly. It is mainly useful when writing helpers that return the same expected-style result as the conversion module.

## make_unexpected

`make_unexpected` creates an unexpected error result.

```cpp
template <typename E>
[[nodiscard]] unexpected<E> make_unexpected(E err);
```

Example:

```cpp
#include <vix/conversion.hpp>

vix::conversion::expected<int, vix::conversion::ConversionError>
fail_conversion(std::string_view input)
{
  return vix::conversion::make_unexpected(
      vix::conversion::ConversionError{
          vix::conversion::ConversionErrorCode::InvalidCharacter,
          input});
}
```

## Integer conversion

Integer conversion parses strict base-10 input.

The input is trimmed with ASCII whitespace rules. An optional leading `+` or `-` is accepted. At least one digit is required, the entire trimmed input must be consumed, and overflow or underflow is reported.

### to_int

```cpp
template <typename Int>
[[nodiscard]] expected<Int, ConversionError>
to_int(std::string_view input) noexcept;
```

`Int` must be an integral type.

Example:

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int<int>("42");

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

### to_int32

```cpp
[[nodiscard]] expected<int, ConversionError>
to_int32(std::string_view input) noexcept;
```

Parses a signed 32-bit style integer value into `int`.

### to_int64

```cpp
[[nodiscard]] expected<std::int64_t, ConversionError>
to_int64(std::string_view input) noexcept;
```

Parses a signed 64-bit integer value.

### to_uint32

```cpp
[[nodiscard]] expected<unsigned, ConversionError>
to_uint32(std::string_view input) noexcept;
```

Parses an unsigned 32-bit style integer value into `unsigned`.

### to_uint64

```cpp
[[nodiscard]] expected<std::uint64_t, ConversionError>
to_uint64(std::string_view input) noexcept;
```

Parses an unsigned 64-bit integer value.

### Integer errors

| Case                               | Error              |
| ---------------------------------- | ------------------ |
| Empty input                        | `EmptyInput`       |
| Sign without digits                | `InvalidCharacter` |
| Non-digit character                | `InvalidCharacter` |
| Value too large                    | `Overflow`         |
| Value too small                    | `Underflow`        |
| Negative input for unsigned target | `Underflow`        |

## Floating-point conversion

Floating-point conversion parses strict numeric input.

The input is trimmed with ASCII whitespace rules. Decimal and scientific notation are supported. The entire trimmed input must be consumed, and range errors are reported.

### to_float

```cpp
template <typename Float>
[[nodiscard]] expected<Float, ConversionError>
to_float(std::string_view input) noexcept;
```

`Float` must be a floating-point type.

Example:

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float<double>("3.14");

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

### to_float32

```cpp
[[nodiscard]] expected<float, ConversionError>
to_float32(std::string_view input) noexcept;
```

Parses a `float`.

### to_float64

```cpp
[[nodiscard]] expected<double, ConversionError>
to_float64(std::string_view input) noexcept;
```

Parses a `double`.

### to_float80

```cpp
[[nodiscard]] expected<long double, ConversionError>
to_float80(std::string_view input) noexcept;
```

Parses a `long double`. The actual precision depends on the platform ABI.

### Floating-point errors

| Case                              | Error                |
| --------------------------------- | -------------------- |
| Empty input                       | `EmptyInput`         |
| No conversion performed           | `InvalidFloat`       |
| Extra characters after the number | `TrailingCharacters` |
| Value too large                   | `Overflow`           |
| Value too small                   | `Underflow`          |

## Boolean conversion

Boolean conversion parses common configuration-style boolean values.

### to_bool

```cpp
[[nodiscard]] expected<bool, ConversionError>
to_bool(std::string_view input) noexcept;
```

The input is trimmed before parsing. Keyword matching is ASCII case-insensitive.

Accepted true values:

```txt
true
1
yes
on
```

Accepted false values:

```txt
false
0
no
off
```

Example:

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

### Boolean errors

| Case                  | Error            |
| --------------------- | ---------------- |
| Empty input           | `EmptyInput`     |
| Unknown boolean value | `InvalidBoolean` |

## EnumEntry

`EnumEntry` defines a mapping between a string name and an enum value.

```cpp
template <typename Enum>
struct EnumEntry
{
  std::string_view name;
  Enum value;
};
```

Example:

```cpp
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
```

## Enum conversion

Enum conversion uses an explicit mapping table. The module does not guess enum names or inspect enum symbols.

### to_enum with pointer and count

```cpp
template <typename Enum>
[[nodiscard]] expected<Enum, ConversionError>
to_enum(
    std::string_view input,
    const EnumEntry<Enum> *entries,
    std::size_t count,
    bool case_insensitive = true) noexcept;
```

`Enum` must be an enum type.

### to_enum with static array

```cpp
template <typename Enum, std::size_t N>
[[nodiscard]] expected<Enum, ConversionError>
to_enum(
    std::string_view input,
    const EnumEntry<Enum> (&entries)[N],
    bool case_insensitive = true) noexcept;
```

Example:

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
        "invalid role:",
        vix::conversion::to_string(role.error().code));

    return 1;
  }

  vix::print("role parsed");

  return 0;
}
```

### Enum errors

| Case              | Error              |
| ----------------- | ------------------ |
| Empty input       | `EmptyInput`       |
| No matching entry | `UnknownEnumValue` |

## Generic parse

`parse<T>` is a generic entry point for scalar conversion.

### parse

```cpp
template <typename T>
[[nodiscard]] expected<T, ConversionError>
parse(std::string_view input) noexcept;
```

Supported target types:

| Target type          | Conversion path |
| -------------------- | --------------- |
| `bool`               | `to_bool`       |
| Integral types       | `to_int<T>`     |
| Floating-point types | `to_float<T>`   |

Unsupported target types are rejected at compile time. For enums, use `parse_enum` or `to_enum`.

Example:

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto workers = vix::conversion::parse<int>("4");
  auto enabled = vix::conversion::parse<bool>("true");
  auto ratio = vix::conversion::parse<double>("0.75");

  if (!workers || !enabled || !ratio)
  {
    vix::print("one conversion failed");
    return 1;
  }

  vix::print("workers:", workers.value());
  vix::print("enabled:", enabled.value());
  vix::print("ratio:", ratio.value());

  return 0;
}
```

### parse_enum with pointer and count

```cpp
template <typename Enum>
[[nodiscard]] expected<Enum, ConversionError>
parse_enum(
    std::string_view input,
    const EnumEntry<Enum> *entries,
    std::size_t count,
    bool case_insensitive = true) noexcept;
```

### parse_enum with static array

```cpp
template <typename Enum, std::size_t N>
[[nodiscard]] expected<Enum, ConversionError>
parse_enum(
    std::string_view input,
    const EnumEntry<Enum> (&entries)[N],
    bool case_insensitive = true) noexcept;
```

Example:

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

## Value-to-string conversion

The module provides `to_string` overloads for supported value types.

Most value-to-string overloads return:

```cpp
expected<std::string, ConversionError>
```

### Integral values

```cpp
template <typename Int>
  requires(std::is_integral_v<Int> &&
           !std::is_same_v<std::remove_cv_t<Int>, bool>)
[[nodiscard]] expected<std::string, ConversionError>
to_string(Int value) noexcept;
```

Converts an integral value to a base-10 string.

Example:

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto text = vix::conversion::to_string(8080);

  if (!text)
  {
    vix::print(
        "formatting failed:",
        vix::conversion::to_string(text.error().code));

    return 1;
  }

  vix::print("port:", text.value());

  return 0;
}
```

### Floating-point values

```cpp
template <typename Float>
  requires(std::is_floating_point_v<Float>)
[[nodiscard]] expected<std::string, ConversionError>
to_string(Float value) noexcept;
```

Converts a floating-point value to a string.

### Boolean values

```cpp
[[nodiscard]] expected<std::string, ConversionError>
to_string(bool value) noexcept;
```

Returns `"true"` for `true` and `"false"` for `false`.

### Enum values with pointer and count

```cpp
template <typename Enum>
  requires(std::is_enum_v<Enum>)
[[nodiscard]] expected<std::string, ConversionError>
to_string(
    Enum value,
    const EnumEntry<Enum> *entries,
    std::size_t count) noexcept;
```

Converts an enum value to a string using a mapping table.

### Enum values with static array

```cpp
template <typename Enum, std::size_t N>
  requires(std::is_enum_v<Enum>)
[[nodiscard]] expected<std::string, ConversionError>
to_string(
    Enum value,
    const EnumEntry<Enum> (&entries)[N]) noexcept;
```

Example:

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

### Value-to-string errors

| Case                                  | Error              |
| ------------------------------------- | ------------------ |
| Integral formatting failure           | `InvalidCharacter` |
| Floating-point formatting failure     | `InvalidFloat`     |
| Enum value not found in mapping table | `UnknownEnumValue` |

## Internal detail helpers

The module includes internal helpers under `vix::conversion::detail`.

These helpers support the public API and are not the normal entry point for application code.

| Helper          | Purpose                                       |
| --------------- | --------------------------------------------- |
| `is_space`      | Check ASCII whitespace.                       |
| `is_digit`      | Check ASCII digit `[0-9]`.                    |
| `is_alpha`      | Check ASCII letter.                           |
| `is_alnum`      | Check ASCII letter or digit.                  |
| `is_lower`      | Check ASCII lowercase letter.                 |
| `is_upper`      | Check ASCII uppercase letter.                 |
| `to_lower`      | Convert ASCII uppercase letter to lowercase.  |
| `to_upper`      | Convert ASCII lowercase letter to uppercase.  |
| `ltrim`         | Remove leading ASCII whitespace.              |
| `rtrim`         | Remove trailing ASCII whitespace.             |
| `trim`          | Remove leading and trailing ASCII whitespace. |
| `parse_integer` | Strict low-level integer parser.              |
| `parse_float`   | Strict low-level floating-point parser.       |

Public functions such as `to_int`, `to_float`, `to_bool`, and `to_enum` use these helpers internally.

## Complete example

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
  auto workers = vix::conversion::parse<int>("4");
  auto ratio = vix::conversion::to_float64("0.75");
  auto debug = vix::conversion::to_bool("off");
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
    vix::print(
        "invalid workers:",
        vix::conversion::to_string(workers.error().code));

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

  auto port_text = vix::conversion::to_string(port.value());
  auto debug_text = vix::conversion::to_string(debug.value());
  auto environment_text =
      vix::conversion::to_string(environment.value(), environments);

  if (!port_text || !debug_text || !environment_text)
  {
    vix::print("string conversion failed");
    return 1;
  }

  vix::print("port:", port_text.value());
  vix::print("workers:", workers.value());
  vix::print("ratio:", ratio.value());
  vix::print("debug:", debug_text.value());
  vix::print("environment:", environment_text.value());

  return 0;
}
```

## Summary

| API family        | Main use                                         |
| ----------------- | ------------------------------------------------ |
| `expected`        | Represent conversion success or failure.         |
| `ConversionError` | Carry structured conversion failure information. |
| `to_int`          | Parse strict base-10 integers.                   |
| `to_float`        | Parse strict floating-point values.              |
| `to_bool`         | Parse common boolean text values.                |
| `to_enum`         | Parse enums through explicit mapping tables.     |
| `parse<T>`        | Generic scalar parsing.                          |
| `parse_enum`      | Generic-style enum parsing.                      |
| `to_string`       | Convert supported values back to text.           |

Use focused conversion functions when readability matters, use `parse<T>` when generic code already knows the target type, and use `ConversionError` to map technical conversion failures into application-level context.
