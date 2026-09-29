# Errors

The `validation` module reports validation failures with `ValidationError`.

A validation error describes a rule that failed for a field or an object. It is different from a low-level conversion error. A conversion error explains why text could not be parsed into a type. A validation error explains why a value is not acceptable for the application rule being checked.

This distinction matters because validation errors are closer to forms, APIs, request handlers, and user-facing diagnostics. They carry a field name, a stable semantic code, a message, and optional metadata that can be used by logs, JSON responses, client-side UI, or tests.

## Header

Use the public Vix header when working with validation errors:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic error handling

Validation functions return a `ValidationResult`. When the result is not valid, inspect `result.errors`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "not-an-email";

  auto result = vix::validation::validate("email", email)
                    .required("email is required")
                    .email("invalid email")
                    .result();

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print("field:", error.field);
      vix::print("code:", vix::validation::to_string(error.code));
      vix::print("message:", error.message);
    }

    return 1;
  }

  return 0;
}
```

The error code is stable and machine-readable. The message is human-readable and useful for simple diagnostics. Higher layers can still replace the message with localized or application-specific text.

## ValidationError

`ValidationError` represents one validation failure.

```cpp
struct ValidationError
{
  std::string field;
  ValidationErrorCode code;
  std::string message;
  std::unordered_map<std::string, std::string> meta;
};
```

The `field` identifies the value that failed. The `code` describes the kind of rule that failed. The `message` explains the failure. The `meta` map carries optional structured details such as minimum value, maximum value, received value, or conversion diagnostics.

## Create an error manually

Most errors are produced by rules, but custom validation logic can create errors directly.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationError error{
      "password",
      vix::validation::ValidationErrorCode::Custom,
      "password confirmation does not match"};

  vix::print("field:", error.field);
  vix::print("code:", vix::validation::to_string(error.code));
  vix::print("message:", error.message);

  return 0;
}
```

Manual errors are useful inside schema-level checks where the rule depends on more than one field.

## Add metadata

Metadata gives the caller more information about the failed rule.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationError error{
      "age",
      vix::validation::ValidationErrorCode::Between,
      "age is out of range",
      {
          {"min", "18"},
          {"max", "120"},
          {"got", "10"},
      }};

  vix::print("field:", error.field);
  vix::print("message:", error.message);

  for (const auto &[key, value] : error.meta)
  {
    vix::print(key, value);
  }

  return 0;
}
```

Metadata is especially useful when returning structured validation errors from an API. A client can display the message while still using metadata to highlight limits or build better UI feedback.

## ValidationErrorCode

`ValidationErrorCode` describes the semantic validation failure.

```cpp
enum class ValidationErrorCode : std::uint8_t
{
  Required = 0,
  Min,
  Max,
  LengthMin,
  LengthMax,
  Between,
  Format,
  InSet,
  Custom
};
```

These codes describe which validation rule failed. They do not describe low-level parsing details unless a parsing failure has been mapped into a validation error.

## Error codes

| Code        | Meaning                                      |
| ----------- | -------------------------------------------- |
| `Required`  | A required value is missing or empty.        |
| `Min`       | A numeric value is below the minimum.        |
| `Max`       | A numeric value is above the maximum.        |
| `LengthMin` | A string is shorter than the minimum length. |
| `LengthMax` | A string is longer than the maximum length.  |
| `Between`   | A numeric value is outside an allowed range. |
| `Format`    | A value has an invalid format.               |
| `InSet`     | A string is not part of the allowed set.     |
| `Custom`    | A custom validation rule failed.             |

The codes are stable identifiers. They are suitable for logs, JSON responses, tests, and client-side error handling.

## Convert an error code to text

Use `to_string(ValidationErrorCode)` to get a stable string identifier.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  auto code = vix::validation::ValidationErrorCode::LengthMin;

  vix::print("code:", vix::validation::to_string(code));

  return 0;
}
```

The returned strings are stable identifiers such as `required`, `min`, `max`, `length_min`, `length_max`, `between`, `format`, `in_set`, and `custom`.

## Required errors

`Required` is used when a required value is missing.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "";

  auto result = vix::validation::validate("email", email)
                    .required("email is required")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);
  }

  return 0;
}
```

For strings, `required` means the string must not be empty. For `std::optional<T>`, it means the optional must contain a value.

## Numeric errors

Numeric rules produce `Min`, `Max`, or `Between` errors.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int age = 10;

  auto result = vix::validation::validate("age", age)
                    .between(18, 120, "age is out of range")
                    .result();

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
  }

  return 0;
}
```

Numeric rules attach useful metadata such as `min`, `max`, and `got` when those values are available.

## Length errors

String length rules produce `LengthMin` and `LengthMax` errors.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string password = "123";

  auto result = vix::validation::validate("password", password)
                    .length_min(8, "password is too short")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }
  }

  return 0;
}
```

Length errors normally include the expected length limit and the actual value length in metadata.

## Format errors

`Format` is used when a value has an invalid format.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "not-an-email";

  auto result = vix::validation::validate("email", email)
                    .email("invalid email")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }
  }

  return 0;
}
```

The built-in email rule is intentionally lightweight. It checks the common shape of an email address and reports `Format` when that shape is not respected.

## InSet errors

`InSet` is used when a string is not part of an allowed set.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string role = "owner";

  auto result = vix::validation::validate("role", role)
                    .in_set(
                        {"admin", "user", "guest"},
                        "role is not allowed")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }
  }

  return 0;
}
```

This rule is useful for small string enums, modes, roles, states, and configuration values.

## Custom errors

Use `Custom` when the rule is specific to your application.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput
{
  std::string password;
  std::string confirm_password;
};

int main()
{
  RegisterInput input{
      "secret-123",
      "other-secret"};

  vix::validation::ValidationResult result;

  if (input.password != input.confirm_password)
  {
    result.add(
        "confirm_password",
        vix::validation::ValidationErrorCode::Custom,
        "password confirmation does not match");
  }

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

Custom errors should still use clear field names and messages. They can also use metadata when the caller needs structured details.

## Parsed validation errors

`validate_parsed<T>(...)` maps conversion failures into validation errors.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "abc";

  auto result = vix::validation::validate_parsed<int>("age", age)
                    .between(18, 120)
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
  }

  return 0;
}
```

When parsing fails, the validation error code is `Format`. The original conversion details are stored in metadata, including the conversion code and position. This keeps the public validation error semantic while preserving debugging information.

## Errors in schemas

Schemas accumulate validation errors from every registered field and check.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput
{
  std::string email;
  std::string password;
  std::string confirm_password;
};

static vix::validation::Schema<RegisterInput> register_schema()
{
  return vix::validation::schema<RegisterInput>()
      .field(
          "email",
          &RegisterInput::email,
          vix::validation::field<std::string>()
              .required("email is required")
              .email("invalid email"))
      .field(
          "password",
          &RegisterInput::password,
          vix::validation::field<std::string>()
              .required("password is required")
              .length_min(8, "password is too short"))
      .check([](const RegisterInput &input, vix::validation::ValidationErrors &errors)
      {
        if (input.password != input.confirm_password)
        {
          errors.add(
              "confirm_password",
              vix::validation::ValidationErrorCode::Custom,
              "password confirmation does not match");
        }
      });
}

int main()
{
  RegisterInput input{
      "not-an-email",
      "123",
      "456"};

  auto result = register_schema().validate(input);

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

A schema does not stop after the first invalid field. It runs its checks and returns the accumulated result.

## Errors in forms

`Form<T>` returns a value-or-errors result. On failure, use `errors()` to inspect validation errors.

```cpp
#include <string>
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct LoginForm
{
  std::string email;

  static bool set(
      LoginForm &out,
      std::string_view field,
      std::string_view value)
  {
    if (field == "email")
    {
      out.email = std::string(value);
      return true;
    }

    return false;
  }

  static vix::validation::Schema<LoginForm> schema()
  {
    return vix::validation::schema<LoginForm>()
        .field(
            "email",
            &LoginForm::email,
            vix::validation::field<std::string>()
                .required("email is required")
                .email("invalid email"));
  }
};

int main()
{
  auto result = vix::validation::Form<LoginForm>::validate_kv({
      {"email", "not-an-email"},
  });

  if (!result)
  {
    for (const auto &error : result.errors().all())
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

Forms use the same `ValidationError` and `ValidationErrors` types, even though the outer result type is `FormResult<T>`.

## Common error sources

| Source                          | Common codes                           |
| ------------------------------- | -------------------------------------- |
| `required`                      | `Required`                             |
| `min`                           | `Min`                                  |
| `max`                           | `Max`                                  |
| `between`                       | `Between`                              |
| `length_min`                    | `LengthMin`                            |
| `length_max`                    | `LengthMax`                            |
| `email`                         | `Format`                               |
| `in_set`                        | `InSet`                                |
| `validate_parsed` parse failure | `Format`                               |
| `Schema::check` custom logic    | `Custom` or an application-chosen code |
| `Form` binding failure          | Usually `Format`                       |

The caller should add context around validation errors when presenting them. For example, an API may serialize the error code and metadata, while a CLI may print a short message.

## API overview

| API                              | Purpose                                              |
| -------------------------------- | ---------------------------------------------------- |
| `ValidationErrorCode`            | Enum of semantic validation failure codes.           |
| `ValidationError`                | One validation failure.                              |
| `ValidationError::field`         | Field that failed validation.                        |
| `ValidationError::code`          | Stable validation error code.                        |
| `ValidationError::message`       | Human-readable message.                              |
| `ValidationError::meta`          | Optional structured metadata.                        |
| `to_string(ValidationErrorCode)` | Convert an error code to a stable string identifier. |
| `ValidationErrors`               | Container of multiple validation errors.             |
| `ValidationResult`               | Validation operation result with accumulated errors. |

## Next step

Continue with rules to see how the built-in validation rules produce these errors.

- [Rules](./rules)
