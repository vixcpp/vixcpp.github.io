# Rules

Rules are the smallest validation unit in the `validation` module.

A rule checks one typed value and adds a `ValidationError` when the value does not respect the expected condition. Rules are used by single-field validation, schemas, parsed validation, base models, and forms. This keeps the module consistent: whether validation starts from one value or from a full object, the same rule model is used underneath.

A rule does not return a boolean. It receives a field name, a value, and a shared error collector. If the value is valid, it does nothing. If the value is invalid, it adds one or more errors.

## Header

Use the public Vix header when working with validation rules:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Rule type

A rule is represented by `Rule<T>`.

```cpp
template <typename T>
using Rule =
    std::function<void(
        std::string_view field,
        const T &value,
        ValidationErrors &out)>;
```

The field name identifies the value being validated. The value is the typed value being checked. The error collector receives any validation errors produced by the rule.

## Use rules through `validate`

The simplest way to use rules is through the fluent `validate(...)` helper.

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
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("email is valid");

  return 0;
}
```

The fluent API is often the most readable form for local validation. It builds rules internally and applies them when `result()` is called.

## Required strings

Use `required` to require a non-empty `std::string`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string name = "";

  auto result = vix::validation::validate("name", name)
                    .required("name is required")
                    .result();

  if (!result.ok())
  {
    vix::print(
        "error:",
        vix::validation::to_string(result.errors.all()[0].code),
        result.errors.all()[0].message);

    return 1;
  }

  return 0;
}
```

For strings, `required` only checks whether the string is empty. It does not trim the value. Trimming, normalization, or input cleaning should happen before validation when the application needs that behavior.

## Required string views

Use `required_sv` for `std::string_view`.

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

This keeps string and string-view validation explicit, while still using the same `ValidationResult` and `ValidationError` types.

## Required optionals

Use `required` with `std::optional<T>` when a value must be present.

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
    vix::print(result.errors.all()[0].message);
    return 1;
  }

  return 0;
}
```

For optionals, `required` checks whether the optional contains a value. It does not validate the contained value itself. Validate the contained value separately when additional rules are needed.

## Numeric minimum

Use `min` to require an arithmetic value to be at least a minimum.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int age = 16;

  auto result = vix::validation::validate("age", age)
                    .min(18, "age must be at least 18")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print(error.field, error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }

    return 1;
  }

  return 0;
}
```

When the rule fails, it adds a `Min` error. The metadata includes the minimum value and the received value.

## Numeric maximum

Use `max` to require an arithmetic value to be at most a maximum.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int quantity = 200;

  auto result = vix::validation::validate("quantity", quantity)
                    .max(100, "quantity is too high")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print(
        error.field,
        vix::validation::to_string(error.code),
        error.message);

    return 1;
  }

  return 0;
}
```

When the rule fails, it adds a `Max` error.

## Numeric range

Use `between` to require an arithmetic value to stay inside a range.

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

    vix::print(error.field, error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }

    return 1;
  }

  return 0;
}
```

When the rule fails, it adds a `Between` error. The metadata includes `min`, `max`, and `got`.

## Minimum string length

Use `length_min` to require a string to have a minimum size.

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

    vix::print(error.field, error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }

    return 1;
  }

  return 0;
}
```

When the rule fails, it adds a `LengthMin` error. The metadata includes the required minimum length and the received length.

## Maximum string length

Use `length_max` to require a string to stay under a maximum size.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string username = "this-name-is-too-long-for-the-field";

  auto result = vix::validation::validate("username", username)
                    .length_max(20, "username is too long")
                    .result();

  if (!result.ok())
  {
    const auto &error = result.errors.all()[0];

    vix::print(
        error.field,
        vix::validation::to_string(error.code),
        error.message);

    return 1;
  }

  return 0;
}
```

When the rule fails, it adds a `LengthMax` error.

## Email format

Use `email` to apply a lightweight email format check.

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

    vix::print(error.field, error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }

    return 1;
  }

  return 0;
}
```

The built-in email rule is intentionally lightweight. It checks that the value is not empty, has no spaces, contains exactly one `@`, has text before `@`, and has a dot after `@`. It is useful as a basic input guard, not as a full RFC email validator.

## Allowed string values

Use `in_set` when a string must belong to a small set of accepted values.

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

    vix::print(
        error.field,
        vix::validation::to_string(error.code),
        error.message);

    return 1;
  }

  return 0;
}
```

This rule is useful for small string enums, modes, roles, states, and configuration values.

## Conditional rules

Use `rule_if` when a rule should only be added under a condition.

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

This keeps conditional validation readable without moving the whole validation flow into separate branches.

## Use rules directly

Rules can be used directly with `apply_rules`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string name = "";

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

This is useful when a function already has a list of rules and does not need the fluent `validate(...)` builder.

## Append errors into an existing collector

Use `apply_rules_into` when multiple validation steps should write into the same `ValidationErrors` container.

```cpp
#include <string>
#include <vector>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "bad";
  std::string password = "123";

  vix::validation::ValidationErrors errors;

  std::vector<vix::validation::Rule<std::string>> email_rules = {
      vix::validation::rules::required("email is required"),
      vix::validation::rules::email("invalid email"),
  };

  std::vector<vix::validation::Rule<std::string>> password_rules = {
      vix::validation::rules::required("password is required"),
      vix::validation::rules::length_min(8, "password is too short"),
  };

  vix::validation::apply_rules_into(
      "email",
      email,
      email_rules,
      errors);

  vix::validation::apply_rules_into(
      "password",
      password,
      password_rules,
      errors);

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

This lower-level API is useful when building custom validators, schemas, or adapters that need to collect errors from several places.

## Custom rules

A custom rule is any callable that matches `Rule<T>`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string username = "root";

  vix::validation::Rule<std::string> not_reserved =
      [](std::string_view field,
         const std::string &value,
         vix::validation::ValidationErrors &out)
      {
        if (value == "root" || value == "admin")
        {
          out.add(
              std::string(field),
              vix::validation::ValidationErrorCode::Custom,
              "username is reserved");
        }
      };

  auto result = vix::validation::validate("username", username)
                    .required()
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

Custom rules are the normal way to express application-specific checks while still returning standard validation errors.

## Reusable rule packs

Because rules are values, they can be grouped and reused.

```cpp
#include <string>
#include <vector>
#include <vix/validation.hpp>
#include <vix/print.hpp>

std::vector<vix::validation::Rule<std::string>> username_rules()
{
  return {
      vix::validation::rules::required("username is required"),
      vix::validation::rules::length_min(3, "username is too short"),
      vix::validation::rules::length_max(30, "username is too long"),
  };
}

int main()
{
  std::string username = "ga";

  auto result = vix::validation::apply_rules(
      "username",
      username,
      username_rules());

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

This is useful when the same field policy appears in several schemas or request handlers.

## Rules in schemas

Schemas use the same rules through `field<T>()`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput
{
  std::string email;
  std::string password;
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
              .length_max(64, "password is too long"));
}

int main()
{
  RegisterInput input{
      "bad",
      "123"};

  auto result = register_schema().validate(input);

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

This lets the same rule system scale from one field to full object validation.

## Rules after parsing

Parsed validation applies typed rules after converting string input to a typed value.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string age = "17";

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

  return 0;
}
```

If parsing fails, validation produces a `Format` error. If parsing succeeds, the typed rules such as `min`, `max`, or `between` are applied to the parsed value.

## Built-in rules

| Rule          | Supported type     | Error code  |
| ------------- | ------------------ | ----------- |
| `required`    | `std::string`      | `Required`  |
| `required_sv` | `std::string_view` | `Required`  |
| `required<T>` | `std::optional<T>` | `Required`  |
| `min<T>`      | Arithmetic types   | `Min`       |
| `max<T>`      | Arithmetic types   | `Max`       |
| `between<T>`  | Arithmetic types   | `Between`   |
| `length_min`  | `std::string`      | `LengthMin` |
| `length_max`  | `std::string`      | `LengthMax` |
| `email`       | `std::string`      | `Format`    |
| `in_set`      | `std::string`      | `InSet`     |

The fluent `validate(...)` builder exposes the rules that match the type being validated. For example, string validators expose string rules, arithmetic validators expose numeric rules, and optional validators expose optional presence checks.

## API overview

| API                          | Purpose                                                   |
| ---------------------------- | --------------------------------------------------------- |
| `Rule<T>`                    | Callable validation rule for a typed value.               |
| `rules::required(...)`       | Require a non-empty string or present optional value.     |
| `rules::required_sv(...)`    | Require a non-empty `std::string_view`.                   |
| `rules::min<T>(...)`         | Require a numeric value to be at least a minimum.         |
| `rules::max<T>(...)`         | Require a numeric value to be at most a maximum.          |
| `rules::between<T>(...)`     | Require a numeric value to stay inside a range.           |
| `rules::length_min(...)`     | Require a string to have a minimum length.                |
| `rules::length_max(...)`     | Require a string to stay below a maximum length.          |
| `rules::email(...)`          | Apply a lightweight email format check.                   |
| `rules::in_set(...)`         | Require a string to belong to an allowed set.             |
| `apply_rules(...)`           | Apply rules and return a `ValidationResult`.              |
| `apply_rules_into(...)`      | Apply rules and append errors into an existing collector. |
| `validate(...).rule(...)`    | Add a custom rule through the fluent builder.             |
| `validate(...).rule_if(...)` | Add a rule only when a condition is true.                 |

## Next step

Continue with single field validation to see how the fluent `validate(...)` builder uses these rules in normal application code.

- [Single Field Validation](./single-field-validation)
