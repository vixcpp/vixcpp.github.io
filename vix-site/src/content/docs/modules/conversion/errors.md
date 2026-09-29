# Errors

The `conversion` module reports failures with `ConversionError`.

A conversion error is a technical error produced while turning text into a C++ value. It is not a business rule and it is not meant to be a polished user-facing message. Its job is to preserve enough information for diagnostics, logs, and higher-level code that wants to map the failure into an application-specific error.

This keeps the conversion layer small and predictable. The module can say that an input was empty, contained an invalid character, overflowed the target type, or did not match a known enum value. The application can then decide whether that becomes a CLI message, an HTTP response, a configuration error, or a validation result.

## Header

Use the public Vix header when working with conversion errors:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic error handling

A failed conversion returns an expected-style result containing a `ConversionError`.

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

The error object carries the original input and, when available, a position hint. This is useful when a parser can point to the character that caused the failure.

## ConversionError

`ConversionError` is a lightweight structure.

```cpp
struct ConversionError
{
  ConversionErrorCode code;
  std::string_view input;
  std::size_t position;
};
```

The `code` field describes the failure. The `input` field keeps the original input that was passed to the public conversion function. The `position` field is an optional character index used by parsers that can report where the failure happened.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::conversion::to_int32("80x0");

  if (!port)
  {
    const auto &error = port.error();

    vix::print("code:", vix::conversion::to_string(error.code));
    vix::print("input:", error.input);
    vix::print("position:", error.position);

    return 1;
  }

  return 0;
}
```

The position is a diagnostic hint, not a replacement for application-level error messages. When the input comes from a file, request body, or command-line option, the surrounding code should add the field name or source location.

## Error codes

`ConversionErrorCode` lists the technical failures the module can report.

| Code                 | Meaning                                                         |
| -------------------- | --------------------------------------------------------------- |
| `None`               | No error.                                                       |
| `EmptyInput`         | The input was empty after trimming, or no input was provided.   |
| `InvalidCharacter`   | An unexpected character was found while parsing.                |
| `TrailingCharacters` | A value was parsed, but extra characters remained.              |
| `Overflow`           | The parsed value is larger than the target type can represent.  |
| `Underflow`          | The parsed value is smaller than the target type can represent. |
| `InvalidBoolean`     | The input does not match a supported boolean value.             |
| `UnknownEnumValue`   | The input does not match any enum mapping entry.                |
| `InvalidFloat`       | The input could not be parsed as a floating-point value.        |

These codes are stable enough for diagnostics and higher-level mapping. They are not localized and should not be treated as final UI text.

## Convert an error code to text

Use `vix::conversion::to_string` to get a short diagnostic string for an error code.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_bool("maybe");

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

The returned text is intended for logs and developer diagnostics. For user-facing output, add application context around the error.

## Empty input

`EmptyInput` is returned when the input is empty, or when trimming leaves no content.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_int32("   ");

  if (!value)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(value.error().code));
  }

  return 0;
}
```

This error is common when reading optional configuration values. The caller should decide whether an empty value is allowed, should use a default, or should stop the program.

## Invalid characters

`InvalidCharacter` is returned when the parser finds a character that does not belong to the expected input shape.

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
    vix::print("position:", error.position);
  }

  return 0;
}
```

For integer parsing, this usually means that a non-digit appeared after the optional sign. The position can help identify where parsing stopped.

## Trailing characters

`TrailingCharacters` is used when a parser accepts a valid value at the beginning of the input but extra characters remain after it.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_float64("1.2abc");

  if (!value)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(value.error().code));
  }

  return 0;
}
```

The conversion module is strict. It does not accept partial conversion as success, because partial conversion often hides mistakes in configuration and request input.

## Overflow and underflow

Numeric conversion reports overflow and underflow when the parsed value does not fit the target type.

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

  return 0;
}
```

This is one of the main reasons to use the conversion module instead of unchecked casts or permissive parsing. A value that does not fit should be reported clearly.

## Invalid boolean values

`InvalidBoolean` is returned when the input does not match one of the supported boolean forms.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::to_bool("maybe");

  if (!enabled)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(enabled.error().code));

    return 1;
  }

  return 0;
}
```

Boolean conversion accepts `true`, `false`, `1`, `0`, `yes`, `no`, `on`, and `off`, with ASCII case-insensitive keyword matching.

## Unknown enum values

`UnknownEnumValue` is returned when no entry in the mapping table matches the input.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

enum class Role
{
  Admin,
  User
};

static constexpr vix::conversion::EnumEntry<Role> roles[] = {
    {"admin", Role::Admin},
    {"user", Role::User},
};

int main()
{
  auto role = vix::conversion::to_enum("guest", roles);

  if (!role)
  {
    vix::print(
        "error:",
        vix::conversion::to_string(role.error().code));

    return 1;
  }

  return 0;
}
```

The enum parser only uses the mapping table provided by the application. This keeps enum conversion explicit and avoids guessing names.

## Add application context

A conversion error tells you what failed technically. The calling code should explain what the value meant.

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

This is the right separation. The conversion module reports the technical failure, and the application adds the name, source, and policy of the value being parsed.

## Check for no error

`ConversionError` has an `ok()` helper.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  vix::conversion::ConversionError error;

  if (error.ok())
  {
    vix::print("no conversion error");
  }

  return 0;
}
```

Most application code will interact with errors through failed expected results, but `ok()` is useful when working directly with a `ConversionError` value.

## API overview

| API                              | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `ConversionErrorCode`            | Enum of conversion failure codes.                        |
| `ConversionError`                | Structured conversion error.                             |
| `ConversionError::code`          | Technical error code.                                    |
| `ConversionError::input`         | Original input passed to the public conversion function. |
| `ConversionError::position`      | Optional position hint for parsing failures.             |
| `ConversionError::ok()`          | Returns `true` when the code is `None`.                  |
| `to_string(ConversionErrorCode)` | Returns a short diagnostic string for an error code.     |

## Next step

Continue with integer conversion to see how numeric parsing reports these errors in practice.

- [Integers](./integers)
