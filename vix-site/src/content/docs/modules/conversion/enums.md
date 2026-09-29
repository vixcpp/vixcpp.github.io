# Enums

Enum conversion turns text into an application-defined enum value.

Enums are different from integers, floats, and booleans because the conversion module cannot know which names belong to your application. A role may be called `admin`, a runtime mode may be called `production`, and a status may be called `pending`. For that reason, enum conversion in Vix uses an explicit mapping table. The application declares the accepted names, and the conversion module matches the input against that table.

This keeps enum parsing predictable. The module does not guess names, inspect enum symbols, or invent fallback values. It trims the input, compares it with the provided entries, and returns either the matching enum value or a structured `ConversionError`.

## Header

Use the public Vix header when working with enum conversion:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Define an enum mapping

Use `EnumEntry<Enum>` to describe how strings map to enum values.

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
  auto role = vix::conversion::to_enum("admin", roles);

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

The mapping table is part of the application contract. It defines exactly which text values are accepted.

## Case-insensitive matching

By default, enum conversion uses ASCII case-insensitive matching.

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
  auto role = vix::conversion::to_enum(" USER ", roles);

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

The input is trimmed before matching. This makes enum conversion practical for configuration and request input, where values may contain extra whitespace.

## Case-sensitive matching

Pass `false` when the input must match the mapping table exactly.

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
  auto mode = vix::conversion::to_enum(
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

This is useful when the accepted values are part of a strict protocol or file format where case matters.

## Unknown values

If no mapping entry matches the input, the conversion returns `ConversionErrorCode::UnknownEnumValue`.

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

The module only accepts what the mapping table declares. If `guest` should be accepted, it should be added to the table.

## Empty input

An empty input, or an input that becomes empty after trimming, returns `ConversionErrorCode::EmptyInput`.

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
  auto role = vix::conversion::to_enum("   ", roles);

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

The caller can decide whether an empty enum field should use a default, fail validation, or be treated as a missing configuration value.

## Use `parse_enum`

`parse_enum` provides the same enum parsing behavior through the generic parsing API family.

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

Use `parse_enum` when you want enum parsing to read like the rest of the `parse` API. Use `to_enum` when you want the conversion function name to be more direct.

## Use a pointer and count

When the mapping table is not available as a static array reference, use the overload that accepts a pointer and count.

```cpp
#include <cstddef>
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
    {"disabled", Status::Disabled},
};

int main()
{
  auto status = vix::conversion::to_enum<Status>(
      "active",
      statuses,
      3);

  if (!status)
  {
    vix::print(
        "invalid status:",
        vix::conversion::to_string(status.error().code));

    return 1;
  }

  vix::print("status parsed");

  return 0;
}
```

The static array overload is usually more convenient, but the pointer-and-count overload is useful when the mapping table comes from another structure.

## Convert an enum back to string

The conversion module can also convert an enum value back to a string using the same mapping table.

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
        "enum string conversion failed:",
        vix::conversion::to_string(name.error().code));

    return 1;
  }

  vix::print("role:", name.value());

  return 0;
}
```

This keeps parsing and formatting aligned. The same table defines the accepted text input and the text output for enum values.

## Keep enum mappings close to the enum

A good practice is to keep the mapping table close to the enum definition. This makes it easier to update the accepted names when the enum changes.

```cpp
#include <vix/conversion.hpp>

enum class LogLevel
{
  Debug,
  Info,
  Warn,
  Error
};

static constexpr vix::conversion::EnumEntry<LogLevel> log_levels[] = {
    {"debug", LogLevel::Debug},
    {"info", LogLevel::Info},
    {"warn", LogLevel::Warn},
    {"error", LogLevel::Error},
};
```

The conversion module will not know that a new enum value was added unless the mapping table is updated. Keeping both definitions together reduces that risk.

## Common errors

Enum conversion has a small and clear error surface.

| Input                                                      | Typical error      |
| ---------------------------------------------------------- | ------------------ |
| `""`                                                       | `EmptyInput`       |
| `"   "`                                                    | `EmptyInput`       |
| `"unknown"`                                                | `UnknownEnumValue` |
| `"Admin"` with case-sensitive matching and entry `"admin"` | `UnknownEnumValue` |

When a value fails, the caller should add application context. For example, a CLI can say that `--mode` must be one of `development` or `production`, while an HTTP API can map the same error into a validation response.

## API overview

| API                                                   | Purpose                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------- |
| `EnumEntry<Enum>`                                     | Mapping entry between a string name and an enum value.        |
| `to_enum(input, entries, case_insensitive)`           | Convert text to an enum using a static array mapping table.   |
| `to_enum(input, entries, count, case_insensitive)`    | Convert text to an enum using a pointer and count.            |
| `parse_enum(input, entries, case_insensitive)`        | Generic-style enum parser using a static array mapping table. |
| `parse_enum(input, entries, count, case_insensitive)` | Generic-style enum parser using a pointer and count.          |
| `to_string(value, entries)`                           | Convert an enum value back to a string using a mapping table. |

All enum conversion functions return `expected<Enum, ConversionError>`, except enum-to-string conversion, which returns `expected<std::string, ConversionError>`.

## Next step

Continue with string conversion to see how supported values are converted back into text.

- [To String](./to-string)
