# Parsed Validation

Parsed validation is used when input arrives as text but the validation rules should apply to a typed value.

This is common at application boundaries. Request parameters, form fields, environment values, and command-line options often arrive as `std::string` or `std::string_view`. Before the application can validate a rule such as “age must be between 18 and 120”, the text must first become an `int`.

The `validation` module handles this with `validate_parsed<T>(...)`. It parses the input with the `conversion` module. If parsing fails, the failure is reported as a validation `Format` error. If parsing succeeds, the typed rules are applied to the parsed value.

## Header

Use the public Vix header when working with parsed validation:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic workflow

Use `validate_parsed<T>(field, input)` when the input is text and the target type is known.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "25";

  auto result = vix::validation::validate_parsed<int>("age", age)
                    .between(18, 120, "age is out of range")
                    .result("age must be a number");

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  vix::print("age is valid");

  return 0;
}
```

The string `"25"` is parsed as an `int`. The `between` rule is then applied to the parsed integer, not to the original string.

## Parse failure becomes a format error

If the input cannot be parsed into the target type, parsed validation returns a `ValidationErrorCode::Format` error.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "abc";

  auto result = vix::validation::validate_parsed<int>("age", age)
                    .between(18, 120, "age is out of range")
                    .result("age must be a number");

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("field:", error.field);
    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }

    return 1;
  }

  return 0;
}
```

The validation error stays semantic: the field has an invalid format. The lower-level conversion details are preserved in metadata for debugging and observability.

## Metadata from conversion errors

When parsing fails, the validation error can contain metadata from the conversion layer.

Common metadata keys include:

| Key               | Meaning                                          |
| ----------------- | ------------------------------------------------ |
| `conversion_code` | String form of the conversion error code.        |
| `position`        | Position hint reported by the conversion parser. |
| `input`           | Original input when available.                   |

This keeps the public validation result clean while still allowing logs and diagnostics to inspect what happened during parsing.

## Custom parse message

The message passed to `result(...)` is used when parsing fails.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string quantity = "many";

  auto result = vix::validation::validate_parsed<int>("quantity", quantity)
                    .min(1, "quantity must be at least 1")
                    .max(100, "quantity must be at most 100")
                    .result("quantity must be a number");

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print(error.field, error.message);

    return 1;
  }

  return 0;
}
```

The parse message should explain the type expected by the application. The conversion module provides the technical failure, and the validation layer provides the field-level message.

## Typed rules after parsing

After parsing succeeds, parsed validation applies normal typed rules.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "10";

  auto result = vix::validation::validate_parsed<int>("age", age)
                    .between(18, 120, "age must be between 18 and 120")
                    .result("age must be a number");

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

In this example, parsing succeeds because `"10"` is a valid integer. Validation fails because the parsed value is outside the allowed range, so the error code is `Between`, not `Format`.

## Minimum and maximum rules

For arithmetic parsed types, use `min(...)`, `max(...)`, and `between(...)`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string workers = "0";

  auto result = vix::validation::validate_parsed<int>("workers", workers)
                    .min(1, "workers must be at least 1")
                    .max(32, "workers must be at most 32")
                    .result("workers must be a number");

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  vix::print("workers is valid");

  return 0;
}
```

Use separate `min` and `max` rules when each side of the range needs its own message. Use `between` when the range should be expressed as one rule.

## Floating-point parsed values

Parsed validation also works with floating-point target types supported by the conversion module.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string ratio = "0.75";

  auto result = vix::validation::validate_parsed<double>("ratio", ratio)
                    .between(0.0, 1.0, "ratio must be between 0 and 1")
                    .result("ratio must be a number");

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("ratio is valid");

  return 0;
}
```

The same workflow applies: parse text first, then validate the typed value.

## Append errors into an existing container

Use `result_into(...)` when parsed validation should contribute to a shared `ValidationErrors` container.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "abc";
  std::string score = "150";

  vix::validation::ValidationErrors errors;

  vix::validation::validate_parsed<int>("age", age)
      .between(18, 120, "age is out of range")
      .result_into(errors, "age must be a number");

  vix::validation::validate_parsed<int>("score", score)
      .between(0, 100, "score is out of range")
      .result_into(errors, "score must be a number");

  if (!errors.ok())
  {
    for (const auto &error : errors.all())
    {
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  return 0;
}
```

This is useful when writing custom validators that need to accumulate several field errors before returning a final result.

## Add custom typed rules

`validate_parsed<T>(...)` can accept custom rules through `.rule(...)`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string value = "13";

  vix::validation::Rule<int> even_number =
      [](std::string_view field,
         const int &number,
         vix::validation::ValidationErrors &out)
      {
        if (number % 2 != 0)
        {
          out.add(
              std::string(field),
              vix::validation::ValidationErrorCode::Custom,
              "value must be even");
        }
      };

  auto result = vix::validation::validate_parsed<int>("value", value)
                    .rule(even_number)
                    .result("value must be a number");

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

Custom rules receive the parsed value. They do not need to deal with string parsing themselves.

## Use parsed validation in schemas

`Schema<T>` can validate a string field by parsing it first with `.parsed<ParsedT>(...)`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProfileInput
{
  std::string age;
};

static vix::validation::Schema<ProfileInput> profile_schema()
{
  return vix::validation::schema<ProfileInput>()
      .parsed<int>(
          "age",
          &ProfileInput::age,
          vix::validation::parsed<int>()
              .between(18, 120, "age is out of range")
              .parse_message("age must be a number"));
}

int main()
{
  ProfileInput input{"abc"};

  auto result = profile_schema().validate(input);

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  return 0;
}
```

This keeps raw input models simple. A boundary object can store values as strings while the schema applies typed rules after parsing.

## Parsed string views in schemas

Schema parsed fields support both `std::string` and `std::string_view` members.

```cpp
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct QueryInput
{
  std::string_view limit;
};

static vix::validation::Schema<QueryInput> query_schema()
{
  return vix::validation::schema<QueryInput>()
      .parsed<int>(
          "limit",
          &QueryInput::limit,
          vix::validation::parsed<int>()
              .between(1, 100, "limit is out of range")
              .parse_message("limit must be a number"));
}

int main()
{
  QueryInput input{"200"};

  auto result = query_schema().validate(input);

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This is useful for lightweight request adapters where values may be views into a larger input buffer.

## ParsedSpec

`parsed<T>()` creates a `ParsedSpec<T>` for schema declarations.

```cpp
vix::validation::parsed<int>()
    .between(18, 120, "age is out of range")
    .parse_message("age must be a number")
```

A parsed spec stores typed rules and the message used when parsing fails. It is the schema-level equivalent of `validate_parsed<T>(...)`.

## Callable parsed schema checks

`Schema::parsed` can also accept a callable that returns a parsed validator.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProductInput
{
  std::string quantity;
};

static vix::validation::Schema<ProductInput> product_schema()
{
  return vix::validation::schema<ProductInput>()
      .parsed<int>(
          "quantity",
          &ProductInput::quantity,
          [](std::string_view field, std::string_view input)
          {
            return vix::validation::validate_parsed<int>(field, input)
                .min(1, "quantity must be at least 1")
                .max(100, "quantity must be at most 100");
          });
}

int main()
{
  ProductInput input{"0"};

  auto result = product_schema().validate(input);

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This form is useful when a field needs custom validation logic but should still use the parsed validator workflow.

## Callable parsed result checks

A parsed schema field can also use a callable that returns a `ValidationResult`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct Input
{
  std::string age;
};

static vix::validation::Schema<Input> input_schema()
{
  return vix::validation::schema<Input>()
      .parsed<int>(
          "age",
          &Input::age,
          [](std::string_view field, std::string_view input)
          {
            return vix::validation::validate_parsed<int>(field, input)
                .between(18, 120, "age is out of range")
                .result("age must be a number");
          });
}

int main()
{
  Input input{"abc"};

  auto result = input_schema().validate(input);

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

Use this form when the callable should execute validation immediately and return the final result.

## Conversion details stay behind validation

Parsed validation intentionally maps conversion failures into validation `Format` errors. This prevents low-level parsing errors from leaking directly into form or API validation logic.

The conversion details are still available in metadata. That gives diagnostics enough information without forcing callers to understand the conversion module for normal validation handling.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "999999999999999999999";

  auto result = vix::validation::validate_parsed<int>("age", age)
                    .between(18, 120)
                    .result("age must be a number");

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("validation code:", vix::validation::to_string(error.code));

    auto it = error.meta.find("conversion_code");
    if (it != error.meta.end())
    {
      vix::print("conversion code:", it->second);
    }

    return 1;
  }

  return 0;
}
```

The public validation code remains `format`, while metadata may show the underlying conversion issue such as overflow.

## Common parsed validation outcomes

| Input                     | Target   | Rules                | Typical result |
| ------------------------- | -------- | -------------------- | -------------- |
| `"25"`                    | `int`    | `between(18, 120)`   | Valid          |
| `"10"`                    | `int`    | `between(18, 120)`   | `Between`      |
| `"abc"`                   | `int`    | `between(18, 120)`   | `Format`       |
| `"999999999999999999999"` | `int`    | `max(120)`           | `Format`       |
| `"0.75"`                  | `double` | `between(0.0, 1.0)`  | Valid          |
| `"1.5"`                   | `double` | `between(0.0, 1.0)`  | `Between`      |
| `"maybe"`                 | `bool`   | custom boolean rules | `Format`       |

A format error means the input could not become the requested target type. A range error means parsing succeeded, but the typed value failed the validation rule.

## API overview

| API                                    | Purpose                                                       |
| -------------------------------------- | ------------------------------------------------------------- |
| `validate_parsed<T>(field, input)`     | Create a parsed validator for text input.                     |
| `ParsedValidator<T>::rule(...)`        | Add a custom typed rule after parsing.                        |
| `ParsedValidator<T>::min(...)`         | Apply a minimum rule after parsing.                           |
| `ParsedValidator<T>::max(...)`         | Apply a maximum rule after parsing.                           |
| `ParsedValidator<T>::between(...)`     | Apply a range rule after parsing.                             |
| `ParsedValidator<T>::result(...)`      | Execute parsing and validation, returning `ValidationResult`. |
| `ParsedValidator<T>::result_into(...)` | Append parsed validation errors into an existing collector.   |
| `conversion_error_to_validation(...)`  | Map a conversion error to a validation `Format` error.        |
| `parsed<T>()`                          | Create a schema-level parsed field specification.             |
| `ParsedSpec<T>::rule(...)`             | Add a typed rule to a parsed field specification.             |
| `ParsedSpec<T>::min(...)`              | Add a minimum rule to a parsed field specification.           |
| `ParsedSpec<T>::max(...)`              | Add a maximum rule to a parsed field specification.           |
| `ParsedSpec<T>::between(...)`          | Add a range rule to a parsed field specification.             |
| `ParsedSpec<T>::parse_message(...)`    | Set the message used when parsing fails.                      |
| `Schema<T>::parsed(...)`               | Register a parsed field in an object schema.                  |

## Next step

Continue with schemas to see how typed fields, parsed fields, and object-level checks are composed into reusable validation definitions.

- [Schemas](./schemas)
