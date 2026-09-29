# Quick Start

The `validation` module gives Vix applications a structured way to check values, collect errors, and validate complete objects.

Validation usually happens after input enters an application. A request body, a form, a configuration value, or a command-line option may already be available as a C++ value, but the application still needs to decide whether that value is acceptable. The validation module handles that step with explicit rules and accumulated errors.

A validation operation returns a `ValidationResult`. When the result is valid, it has no errors. When it is invalid, it contains one or more `ValidationError` values that describe what failed.

## Header

Use the public Vix header when working with validation:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Validate a string field

Use `validate(...)` when the value is already typed and you want to apply rules to it.

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

This is the simplest validation workflow. Create a validator, add rules, call `result()`, then inspect the errors when validation fails.

## Validate a numeric field

Numeric values can use rules such as `min`, `max`, and `between`.

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

The rule is applied to the typed value. The validation module does not parse text here. It only checks the value it receives.

## Validate text that must be parsed first

Use `validate_parsed<T>(...)` when the input is still text, but the validation rules should apply to a typed value.

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

This is useful for raw form fields, request parameters, and configuration values. The module first parses the text through `vix::conversion::parse<T>`. If parsing fails, the error becomes a validation `Format` error. If parsing succeeds, the typed rules are applied.

## Inspect validation errors

Each validation error carries a field name, an error code, a message, and optional metadata.

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

The error code is a stable semantic identifier. The message is useful for simple output, while higher layers can map the same error code into JSON responses, localized messages, or application-specific diagnostics.

## Accumulate multiple errors

Validation does not stop at the first failure. Multiple rules can add multiple errors for the same field.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "";

  auto result = vix::validation::validate("email", email)
                    .required("email is required")
                    .email("invalid email")
                    .length_min(5, "email is too short")
                    .result();

  if (!result.ok())
  {
    vix::print("error count:", result.size());

    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This behavior is useful for forms and APIs because the caller can receive all field problems at once instead of fixing them one by one.

## Build a schema for an object

Use `Schema<T>` when validation belongs to an object instead of one local value.

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
              .length_max(120, "email is too long"))
      .field(
          "password",
          &RegisterForm::password,
          vix::validation::field<std::string>()
              .required("password is required")
              .length_min(8, "password is too short")
              .length_max(64, "password is too long"));
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

A schema makes validation reusable. The same schema can be used in a request handler, a test, a service function, or a form wrapper.

## Add a parsed field to a schema

Schemas can validate string fields that need to be parsed before rules are applied.

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

This keeps raw input models practical. The field can remain text at the boundary, while the schema still applies typed validation rules after parsing.

## Use BaseModel

`BaseModel<T>` lets a type carry its own schema. The type declares a static `schema()` function and can then call `validate()` directly.

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
                .required("email is required")
                .email("invalid email"));
  }
};

int main()
{
  UserInput input{"not-an-email"};

  auto result = input.validate();

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("user input is valid");

  return 0;
}
```

The schema is cached internally and reused. This keeps model validation convenient without rebuilding the schema on every validation call.

## Use Form for raw input

`Form<T>` handles a complete boundary workflow: bind raw input, validate the form object, and return either a validated value or structured errors.

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

This is the highest-level entry point in the module. It is useful when input starts as raw key-value data, request data, or another external payload that must be bound before validation.

## Complete example

This example shows a small registration input with typed validation, parsed validation, and an object-level check.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput
{
  std::string email;
  std::string password;
  std::string confirm_password;
  std::string age;
};

static vix::validation::Schema<RegisterInput> register_schema()
{
  return vix::validation::schema<RegisterInput>()
      .field(
          "email",
          &RegisterInput::email,
          vix::validation::field<std::string>()
              .required("email is required")
              .email("invalid email")
              .length_max(120, "email is too long"))
      .field(
          "password",
          &RegisterInput::password,
          vix::validation::field<std::string>()
              .required("password is required")
              .length_min(8, "password is too short")
              .length_max(64, "password is too long"))
      .parsed<int>(
          "age",
          &RegisterInput::age,
          vix::validation::parsed<int>()
              .between(18, 120, "age is out of range")
              .parse_message("age must be a number"))
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
      "456",
      "abc"};

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

  vix::print("registration input is valid");

  return 0;
}
```

The schema keeps all validation rules in one place. Field rules handle individual values, parsed rules handle text that must become a typed value, and `check(...)` handles constraints that depend on the whole object.

## Next step

Continue with validation results to understand how `ValidationResult`, `ValidationErrors`, and `ValidationError` work together.

- [Results](./results)
- [Errors](./errors)
- [Rules](./rules)
- [Single Field Validation](./single-field-validation)
- [Parsed Validation](./parsed-validation)
- [Schemas](./schemas)
- [Base Models](./base-models)
- [Forms](./forms)
