# Single Field Validation

Single field validation is the simplest way to use the `validation` module.

It is useful when you already have a typed C++ value and want to check it with a small set of rules. This can happen in request handlers, command-line tools, configuration loading, tests, or local application logic. The value is already available as a `std::string`, `int`, `double`, `std::optional<T>`, or another supported type, and the validation module decides whether it satisfies the rules attached to that field.

The entry point is `validate(...)`.

## Header

Use the public Vix header when working with single field validation:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic workflow

`validate(...)` creates a fluent validator for one field and one value.

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

The field name is stored in every error produced by the validator. This makes the result easy to use in forms, API responses, logs, and tests.

## Validate required strings

Use `required(...)` when a `std::string` must not be empty.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string username = "";

  auto result = vix::validation::validate("username", username)
                    .required("username is required")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("field:", error.field);
    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

For strings, `required` checks whether the string is empty. It does not trim whitespace. If the application wants `"   "` to count as empty, normalize or trim the value before validation.

## Validate string length

Use `length_min(...)` and `length_max(...)` for string size constraints.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string password = "123";

  auto result = vix::validation::validate("password", password)
                    .required("password is required")
                    .length_min(8, "password is too short")
                    .length_max(64, "password is too long")
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

  vix::print("password is valid");

  return 0;
}
```

Length rules add metadata when they fail. This can include the expected limit and the received length.

## Validate email format

Use `email(...)` for a lightweight email format check.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "gaspard@example.com";

  auto result = vix::validation::validate("email", email)
                    .required("email is required")
                    .email("invalid email")
                    .result();

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("email is valid");

  return 0;
}
```

The email rule is intentionally small. It checks the common shape of an email address, not every RFC edge case. It is a practical input guard for application validation.

## Validate allowed string values

Use `in_set(...)` when a string must belong to a small set of accepted values.

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

    vix::print("field:", error.field);
    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

This is useful for small mode fields, roles, statuses, categories, and configuration values where the accepted list is known.

## Validate numeric values

Numeric values can use `min(...)`, `max(...)`, and `between(...)`.

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

Numeric rules are available for arithmetic types. When they fail, they add semantic errors such as `Min`, `Max`, or `Between`.

## Use minimum and maximum separately

Use separate `min(...)` and `max(...)` rules when each side of the range needs its own message.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int quantity = 0;

  auto result = vix::validation::validate("quantity", quantity)
                    .min(1, "quantity must be at least 1")
                    .max(100, "quantity must be at most 100")
                    .result();

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

This style is useful when the lower and upper limits have different meaning in the application.

## Validate string views

Use `required_sv(...)` when the value is a `std::string_view`.

```cpp
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string_view token = "";

  auto result = vix::validation::validate("token", token)
                    .required_sv("token is required")
                    .result();

  if (!result.ok())
  {
    vix::print(result.errors.all()[0].message);
    return 1;
  }

  return 0;
}
```

The module keeps `std::string` and `std::string_view` required checks separate so the rule type remains explicit.

## Validate optional values

Use `required<T>(...)` when a `std::optional<T>` must contain a value.

```cpp
#include <optional>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::optional<int> age;

  auto result = vix::validation::validate("age", age)
                    .required<int>("age is required")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print("field:", error.field);
    vix::print("message:", error.message);

    return 1;
  }

  return 0;
}
```

For optionals, `required<T>` only checks presence. It does not apply rules to the contained value. Validate the contained value separately when it exists and needs more checks.

## Add a custom rule

Use `.rule(...)` to add application-specific validation logic.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string username = "admin";

  vix::validation::Rule<std::string> not_reserved =
      [](std::string_view field,
         const std::string &value,
         vix::validation::ValidationErrors &out)
      {
        if (value == "admin" || value == "root")
        {
          out.add(
              std::string(field),
              vix::validation::ValidationErrorCode::Custom,
              "username is reserved");
        }
      };

  auto result = vix::validation::validate("username", username)
                    .required("username is required")
                    .length_min(3, "username is too short")
                    .rule(not_reserved)
                    .result();

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

Custom rules are useful when the rule belongs to the application and is not part of the built-in rule set.

## Add a rule conditionally

Use `.rule_if(...)` when a rule should only be active under a condition.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  bool require_email = true;
  std::string email = "";

  auto result = vix::validation::validate("email", email)
                    .rule_if(
                        require_email,
                        vix::validation::rules::required("email is required"))
                    .email("invalid email")
                    .result();

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

This keeps validation chains readable when a rule depends on a feature flag, mode, or another field that has already been checked.

## Append into an existing error container

Use `result_into(...)` when several validators should contribute to one shared `ValidationErrors` container.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "bad";
  std::string password = "123";

  vix::validation::ValidationErrors errors;

  vix::validation::validate("email", email)
      .required("email is required")
      .email("invalid email")
      .result_into(errors);

  vix::validation::validate("password", password)
      .required("password is required")
      .length_min(8, "password is too short")
      .result_into(errors);

  if (!errors.ok())
  {
    for (const auto &error : errors.all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This is useful when writing custom validation functions that need to accumulate field errors without creating separate results for every field.

## Accumulate multiple errors

A single field can produce more than one error.

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

The validator applies every rule that was added. This gives the caller the full list of field issues instead of only the first failure.

## Use `apply_rules` directly

`validate(...)` is a fluent wrapper around rules. When you already have a list of rules, use `apply_rules(...)` directly.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string name = "ga";

  auto result = vix::validation::apply_rules(
      "name",
      name,
      {
          vix::validation::rules::required("name is required"),
          vix::validation::rules::length_min(3, "name is too short"),
      });

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

This lower-level API is useful when rules are created elsewhere and passed into a helper.

## Type-specific fluent methods

The fluent validator exposes methods based on the type being validated.

| Value type         | Available methods                                                            |
| ------------------ | ---------------------------------------------------------------------------- |
| `std::string`      | `required`, `length_min`, `length_max`, `email`, `in_set`, `rule`, `rule_if` |
| `std::string_view` | `required_sv`, `rule`, `rule_if`                                             |
| Arithmetic types   | `min`, `max`, `between`, `rule`, `rule_if`                                   |
| `std::optional<T>` | `required<T>`, `rule`, `rule_if`                                             |

This makes invalid combinations fail at compile time. For example, `email()` is only available for `std::string`, and `between()` is only available for arithmetic types.

## When to use single field validation

Use single field validation when the validation logic is local and does not need a reusable object schema.

Good examples include checking one configuration value, validating a command-line option after parsing, testing a single field policy, or composing a custom validation function with a shared error container.

When validation belongs to a full object or should be reused across handlers, use `Schema<T>` instead.

## API overview

| API                              | Purpose                                                         |
| -------------------------------- | --------------------------------------------------------------- |
| `validate(field, value)`         | Create a fluent validator for one typed value.                  |
| `Validator<T>::rule(...)`        | Add a custom `Rule<T>`.                                         |
| `Validator<T>::rule_if(...)`     | Add a rule only when a condition is true.                       |
| `Validator<T>::required(...)`    | Require a non-empty `std::string`.                              |
| `Validator<T>::required_sv(...)` | Require a non-empty `std::string_view`.                         |
| `Validator<T>::required<U>(...)` | Require a `std::optional<U>` to contain a value.                |
| `Validator<T>::min(...)`         | Require an arithmetic value to be at least a minimum.           |
| `Validator<T>::max(...)`         | Require an arithmetic value to be at most a maximum.            |
| `Validator<T>::between(...)`     | Require an arithmetic value to be inside a range.               |
| `Validator<T>::length_min(...)`  | Require a string to have a minimum length.                      |
| `Validator<T>::length_max(...)`  | Require a string to stay below a maximum length.                |
| `Validator<T>::email(...)`       | Apply a lightweight email format check.                         |
| `Validator<T>::in_set(...)`      | Require a string to be one of the allowed values.               |
| `Validator<T>::result()`         | Execute the rules and return a `ValidationResult`.              |
| `Validator<T>::result_into(...)` | Execute the rules and append errors into an existing collector. |
| `apply_rules(...)`               | Apply a rule list directly and return a result.                 |
| `apply_rules_into(...)`          | Apply a rule list directly into an existing collector.          |

## Next step

Continue with parsed validation to see how the module validates string input that must first be converted into a typed value.

- [Parsed Validation](./parsed-validation)
