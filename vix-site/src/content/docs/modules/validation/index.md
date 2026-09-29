# Validation

The `validation` module provides structured validation tools for Vix applications.

Validation is different from conversion. Conversion answers a technical question: can this text become an `int`, a `double`, a `bool`, or another supported type? Validation answers an application question: is this value acceptable for this field, this form, this model, or this request?

The module is built around explicit rules, accumulated errors, and reusable schemas. A validation operation does not need to stop at the first failure. It can collect all field errors and return them together through a `ValidationResult`, which makes the module useful for forms, HTTP request validation, configuration checks, and model-level constraints.

## Header

Use the public Vix header when working with the validation module:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic example

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
                    .length_max(120, "email is too long")
                    .result();

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

  vix::print("email is valid");

  return 0;
}
```

The workflow is direct. Build a validator for a field, attach rules, execute the validation, then inspect the result. If the result is not valid, the errors contain the field name, a stable error code, a message, and optional metadata.

## Core model

The module represents validation as a result with accumulated errors.

| API area                  | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `ValidationError`         | Describes one validation failure.                |
| `ValidationErrors`        | Stores multiple validation errors.               |
| `ValidationResult`        | Represents the result of a validation operation. |
| `Rule<T>`                 | Represents one rule for a typed value.           |
| `rules::*`                | Built-in validation rules.                       |
| `validate(...)`           | Fluent validator for a single typed field.       |
| `validate_parsed<T>(...)` | Parse text first, then validate the typed value. |
| `Schema<T>`               | Declarative validation schema for an object.     |
| `BaseModel<T>`            | CRTP helper for schema-driven model validation.  |
| `Form<T>`                 | High-level `bind -> validate -> clean` workflow. |

This structure keeps validation code readable at small scale while still making it possible to build reusable schemas for larger application models.

## Errors

A single validation failure is represented by `ValidationError`.

```cpp
struct ValidationError
{
  std::string field;
  ValidationErrorCode code;
  std::string message;
  std::unordered_map<std::string, std::string> meta;
};
```

The `field` identifies where the failure happened. The `code` is a stable semantic identifier such as `Required`, `Min`, `Max`, `Format`, or `InSet`. The `message` explains the failure, and `meta` can carry details such as minimum value, maximum value, received value, or parser diagnostics.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string password = "123";

  auto result = vix::validation::validate("password", password)
                    .required()
                    .length_min(8, "password is too short")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("field:", error.field);
    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);
  }

  return 0;
}
```

Validation errors are meant to be useful for forms, APIs, logs, and diagnostics. They describe the rule that failed, not the low-level parsing details unless those details are intentionally placed in metadata.

## Built-in rules

The module provides built-in rules for common validation work.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string username = "gaspard";

  auto result = vix::validation::validate("username", username)
                    .required()
                    .length_min(3)
                    .length_max(30)
                    .in_set({"gaspard", "admin", "user"})
                    .result();

  if (!result.ok())
  {
    vix::print("username is invalid");
    return 1;
  }

  vix::print("username is valid");

  return 0;
}
```

The main built-in rules are:

| Rule         | Use                                                     |
| ------------ | ------------------------------------------------------- |
| `required`   | Require a non-empty string or a present optional value. |
| `min`        | Require a numeric value to be at least a minimum.       |
| `max`        | Require a numeric value to be at most a maximum.        |
| `between`    | Require a numeric value to stay within a range.         |
| `length_min` | Require a string to have a minimum length.              |
| `length_max` | Require a string to have a maximum length.              |
| `email`      | Apply a lightweight email format check.                 |
| `in_set`     | Require a string to belong to a set of allowed values.  |

Rules are intentionally focused. They provide common building blocks, while application-specific policy can be added through custom rules or schema checks.

## Single field validation

`validate(...)` is the simplest entry point when the value is already typed.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int age = 17;

  auto result = vix::validation::validate("age", age)
                    .between(18, 120, "age must be between 18 and 120")
                    .result();

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("age is valid");

  return 0;
}
```

This style is useful for small checks, command-line input after parsing, configuration values, and local validation logic.

## Parsed validation

`validate_parsed<T>(...)` is used when the input is still text but the rules should apply to a typed value.

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

This is the bridge between `conversion` and `validation`. If parsing fails, the conversion error is mapped to a validation `Format` error. If parsing succeeds, the typed rules are applied to the parsed value.

## Schemas

`Schema<T>` validates an object through a declarative set of field rules and object-level checks.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterForm
{
  std::string email;
  std::string password;
};

static vix::validation::Schema<RegisterForm> register_schema()
{
  return vix::validation::schema<RegisterForm>()
      .field(
          "email",
          &RegisterForm::email,
          vix::validation::field<std::string>()
              .required("email is required")
              .email("invalid email")
              .length_max(120))
      .field(
          "password",
          &RegisterForm::password,
          vix::validation::field<std::string>()
              .required("password is required")
              .length_min(8)
              .length_max(64));
}

int main()
{
  RegisterForm form{
      "not-an-email",
      "123"};

  auto result = register_schema().validate(form);

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("form is valid");

  return 0;
}
```

Schemas are useful when validation belongs to a type instead of a single local value. They also make the rules easier to reuse across request handlers, service functions, tests, or form wrappers.

## Parsed fields in schemas

A schema can also validate a string field by parsing it first.

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
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This keeps raw input models practical. A field can remain a string at the boundary while the schema still applies typed numeric rules after parsing.

## Base models

`BaseModel<T>` binds a schema to a type through CRTP. The derived type provides a static `schema()` function, and instances can call `validate()` directly.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct UserInput : vix::validation::BaseModel<UserInput>
{
  std::string email;

  static vix::validation::Schema<UserInput> schema()
  {
    return vix::validation::schema<UserInput>()
        .field(
            "email",
            &UserInput::email,
            vix::validation::field<std::string>()
                .required()
                .email());
  }
};

int main()
{
  UserInput input{"not-an-email"};

  auto result = input.validate();

  if (!result.ok())
  {
    vix::print("user input is invalid");
    return 1;
  }

  vix::print("user input is valid");

  return 0;
}
```

The schema is cached internally and reused, so validation stays easy to call without rebuilding the schema every time.

## Forms

`Form<T>` is the highest-level workflow in the module. It is designed for cases where raw input must be bound into a form object, validated, and optionally cleaned into a safer output type.

The flow is:

```txt
bind input -> validate schema -> return cleaned value or errors
```

This is useful for HTTP handlers, CLI commands, configuration loading, and any place where raw input needs to become an application-ready value.

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
                .required()
                .email());
  }
};

int main()
{
  auto result = vix::validation::Form<LoginForm>::validate_kv({
      {"email", "gaspard@example.com"},
  });

  if (!result)
  {
    for (const auto &error : result.errors().all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("login email:", result.value().email);

  return 0;
}
```

Forms keep boundary validation organized. The binding step handles raw input, the schema handles rules, and the final result gives the caller either a validated value or structured errors.

## Internal aggregation header

The module also exposes an internal aggregation header:

```cpp
#include <vix/validation/all.hpp>
```

For normal Vix application code and documentation examples, prefer the public root header:

```cpp
#include <vix/validation.hpp>
```

## Next step

Start with the quick start page to see the normal workflow, then continue with results, errors, rules, and schema-driven validation.

- [Quick Start](./quick-start)
- [Results](./results)
- [Errors](./errors)
- [Rules](./rules)
- [Single Field Validation](./single-field-validation)
- [Parsed Validation](./parsed-validation)
- [Schemas](./schemas)
- [Base Models](./base-models)
- [Forms](./forms)
- [API Reference](./api-reference)
