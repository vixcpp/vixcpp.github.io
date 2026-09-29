# Booleans

Boolean conversion turns text into a C++ `bool`.

This is common in configuration and small text-based inputs. Values such as `DEBUG=true`, `CACHE=off`, or `FEATURE_ENABLED=yes` arrive as strings, but application code usually needs a real boolean before it can make decisions. The conversion module handles this in a strict and predictable way, while still accepting the common boolean words developers use in configuration files.

`to_bool` trims ASCII whitespace before parsing. Keyword matching is ASCII case-insensitive, so values such as `TRUE`, `True`, and `true` are treated the same.

## Header

Use the public Vix header when working with boolean conversion:

```cpp
#include <vix/conversion.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Convert a true value

The true values are `true`, `1`, `yes`, and `on`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto enabled = vix::conversion::to_bool("true");

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

Use this when parsing feature flags, environment values, command-line options, or simple request parameters.

## Convert a false value

The false values are `false`, `0`, `no`, and `off`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto debug = vix::conversion::to_bool("off");

  if (!debug)
  {
    vix::print(
        "invalid boolean:",
        vix::conversion::to_string(debug.error().code));

    return 1;
  }

  vix::print("debug:", debug.value());

  return 0;
}
```

This keeps configuration readable. A file can use words such as `on` and `off`, while the application receives a normal C++ `bool`.

## Trimmed input

Leading and trailing ASCII whitespace are removed before parsing.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_bool("  yes  ");

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

Only the edges are trimmed. The boolean word itself still has to match one of the supported values.

## Case-insensitive keywords

Boolean keywords are matched with ASCII case-insensitive comparison.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto a = vix::conversion::to_bool("TRUE");
  auto b = vix::conversion::to_bool("No");
  auto c = vix::conversion::to_bool("On");

  if (!a || !b || !c)
  {
    vix::print("boolean conversion failed");
    return 1;
  }

  vix::print("a:", a.value());
  vix::print("b:", b.value());
  vix::print("c:", c.value());

  return 0;
}
```

The comparison is ASCII-based and locale-free. This keeps parsing deterministic across platforms.

## Invalid boolean input

If the value is not recognized, `to_bool` returns `ConversionErrorCode::InvalidBoolean`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_bool("maybe");

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

The conversion module does not guess. If an application wants to accept additional values such as `enabled`, `disabled`, `y`, or `n`, that policy should be handled by the application layer before or around the conversion call.

## Empty input

An empty value, or a value that becomes empty after trimming, returns `ConversionErrorCode::EmptyInput`.

```cpp
#include <vix/conversion.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::conversion::to_bool("   ");

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

This is useful when parsing configuration. The caller can decide whether an empty value should use a default, fail the startup process, or be reported as a missing setting.

## Use with generic parse

`parse<T>` supports `bool`.

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

Use `parse<bool>` when generic code already knows the target type. Use `to_bool` when the code is specifically about boolean conversion and readability matters more than generic dispatch.

## Accepted values

`to_bool` accepts a small set of common boolean forms.

| Input   | Result  |
| ------- | ------- |
| `true`  | `true`  |
| `1`     | `true`  |
| `yes`   | `true`  |
| `on`    | `true`  |
| `false` | `false` |
| `0`     | `false` |
| `no`    | `false` |
| `off`   | `false` |

Keyword values are ASCII case-insensitive. Numeric values are matched exactly as `1` and `0`.

## Common errors

Boolean conversion has a small error surface.

| Input       | Typical error    |
| ----------- | ---------------- |
| `""`        | `EmptyInput`     |
| `"   "`     | `EmptyInput`     |
| `"maybe"`   | `InvalidBoolean` |
| `"truee"`   | `InvalidBoolean` |
| `"10"`      | `InvalidBoolean` |
| `"enabled"` | `InvalidBoolean` |

The module keeps this strict so that configuration mistakes are visible instead of being interpreted in surprising ways.

## API overview

| API                  | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `to_bool(input)`     | Convert text to `bool`.                   |
| `parse<bool>(input)` | Generic parsing entry point for booleans. |

Both functions return `expected<bool, ConversionError>`.

## Next step

Continue with enum conversion to see how the module converts text into application-defined enum values through explicit mapping tables.

- [Enums](./enums)
