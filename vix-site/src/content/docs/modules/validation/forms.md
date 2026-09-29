# Forms

`Form<T>` provides the highest-level validation workflow in the `validation` module.

A form is useful when input starts outside the application as raw data. A request body, a key-value list, a CLI payload, or a configuration source usually needs three steps before it becomes safe to use: bind the raw input into a C++ object, validate that object, and optionally return a cleaned output value. `Form<T>` groups that workflow into one entry point.

The flow is:

```txt
raw input -> bind -> validate schema -> return value or errors
```

This keeps boundary code organized. Binding is responsible for reading raw input. The schema is responsible for validation rules. The final result contains either a validated value or structured `ValidationErrors`.

## Header

Use the public Vix header when working with forms:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic form

A form type provides a static `schema()` function and a binding function.

For simple key-value input, the easiest binding contract is `set(...)`.

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
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  vix::print("login email:", result.value().email);

  return 0;
}
```

`validate_kv(...)` is a convenience helper for small key-value inputs. It builds the input list, binds the fields, validates the form, and returns a `FormResult`.

## Form contract

A form type must provide a schema:

```cpp
static vix::validation::Schema<MyForm> schema();
```

It must also provide one compatible binding method.

The preferred binding contract is:

```cpp
static bool bind(
    MyForm &out,
    const Input &in,
    vix::validation::ValidationErrors &errors);
```

A simpler binding contract is also supported:

```cpp
static bool bind(
    MyForm &out,
    const Input &in);
```

For key-value input, a form can provide:

```cpp
static bool set(
    MyForm &out,
    std::string_view field,
    std::string_view value);
```

The `set(...)` form is useful for small examples and simple forms. The `bind(..., errors)` form is better when binding itself can produce field-level errors.

## FormResult

`Form<T>` returns `FormResult<T>`.

```cpp
template <typename T>
class FormResult;
```

A form result contains either a validated value or validation errors.

```cpp
explicit operator bool() const;

const T &value() const;
T &value();

const ValidationErrors &errors() const;
ValidationErrors &errors();
```

Use the boolean operator before calling `value()`.

```cpp
auto result = vix::validation::Form<LoginForm>::validate_kv({
    {"email", "bad"},
});

if (!result)
{
  const auto &errors = result.errors();
}
else
{
  const auto &value = result.value();
}
```

This is different from `ValidationResult`. A `ValidationResult` only contains errors. A `FormResult<T>` can contain a validated output value.

## Invalid form input

If binding succeeds but validation fails, the result contains validation errors from the schema.

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
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

The schema still produces the normal `ValidationError` values. Forms do not introduce a separate error system.

## Unknown key-value fields

When using `set(...)`, returning `false` means the field is unknown or invalid for binding.

```cpp
#include <string>
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProfileForm
{
  std::string username;

  static bool set(
      ProfileForm &out,
      std::string_view field,
      std::string_view value)
  {
    if (field == "username")
    {
      out.username = std::string(value);
      return true;
    }

    return false;
  }

  static vix::validation::Schema<ProfileForm> schema()
  {
    return vix::validation::schema<ProfileForm>()
        .field(
            "username",
            &ProfileForm::username,
            vix::validation::field<std::string>()
                .required("username is required")
                .length_min(3, "username is too short"));
  }
};

int main()
{
  auto result = vix::validation::Form<ProfileForm>::validate_kv({
      {"unknown", "value"},
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

For this minimal binding style, the form creates a form-level error when a field cannot be bound.

## Preferred bind with errors

Use `bind(out, input, errors)` when binding can report detailed field errors.

```cpp
#include <string>
#include <string_view>
#include <vector>
#include <utility>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterForm
{
  using kv_pair = std::pair<std::string_view, std::string_view>;
  using input_type = std::vector<kv_pair>;

  std::string email;
  std::string password;

  static bool bind(
      RegisterForm &out,
      const input_type &input,
      vix::validation::ValidationErrors &errors)
  {
    for (const auto &[field, value] : input)
    {
      if (field == "email")
      {
        out.email = std::string(value);
      }
      else if (field == "password")
      {
        out.password = std::string(value);
      }
      else
      {
        errors.add(
            std::string(field),
            vix::validation::ValidationErrorCode::Format,
            "unknown field");
      }
    }

    return errors.ok();
  }

  static vix::validation::Schema<RegisterForm> schema()
  {
    return vix::validation::schema<RegisterForm>()
        .field(
            "email",
            &RegisterForm::email,
            vix::validation::field<std::string>()
                .required("email is required")
                .email("invalid email"))
        .field(
            "password",
            &RegisterForm::password,
            vix::validation::field<std::string>()
                .required("password is required")
                .length_min(8, "password is too short"));
  }
};

int main()
{
  RegisterForm::input_type input = {
      {"email", "bad"},
      {"password", "123"},
      {"extra", "value"},
  };

  auto result = vix::validation::Form<RegisterForm>::validate(input);

  if (!result)
  {
    for (const auto &error : result.errors().all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This is the preferred contract for real application boundaries because binding errors can point to the exact field that failed.

## Simple bind without errors

A form can also provide a smaller `bind(out, input)` function.

```cpp
#include <string>
#include <string_view>
#include <vector>
#include <utility>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct TokenForm
{
  using input_type = std::vector<std::pair<std::string_view, std::string_view>>;

  std::string token;

  static bool bind(
      TokenForm &out,
      const input_type &input)
  {
    for (const auto &[field, value] : input)
    {
      if (field == "token")
      {
        out.token = std::string(value);
      }
      else
      {
        return false;
      }
    }

    return true;
  }

  static vix::validation::Schema<TokenForm> schema()
  {
    return vix::validation::schema<TokenForm>()
        .field(
            "token",
            &TokenForm::token,
            vix::validation::field<std::string>()
                .required("token is required")
                .length_min(10, "token is too short"));
  }
};

int main()
{
  TokenForm::input_type input = {
      {"token", "abc"},
  };

  auto result = vix::validation::Form<TokenForm>::validate(input);

  if (!result)
  {
    for (const auto &error : result.errors().all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  return 0;
}
```

This form is convenient for small cases. If it returns `false`, `Form<T>` adds a generic form-level error because the binder did not provide field-level details.

## Cleaned output

A form can return a different output type after validation.

To do that, define `using cleaned_type = X;` and implement `clean() const`.

```cpp
#include <string>
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct LoginData
{
  std::string email;
};

struct LoginForm
{
  using cleaned_type = LoginData;

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

  LoginData clean() const
  {
    return LoginData{
        email};
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

  LoginData data = result.value();

  vix::print("email:", data.email);

  return 0;
}
```

This is useful when the raw form type contains temporary fields, raw strings, or intermediate state, but the application should receive a cleaner output structure.

## Cleaned output with parsed fields

A form can store raw text, validate parsed values through the schema, then clean into a typed output.

```cpp
#include <string>
#include <string_view>
#include <vix/conversion.hpp>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProfileData
{
  int age;
};

struct ProfileForm
{
  using cleaned_type = ProfileData;

  std::string age;

  static bool set(
      ProfileForm &out,
      std::string_view field,
      std::string_view value)
  {
    if (field == "age")
    {
      out.age = std::string(value);
      return true;
    }

    return false;
  }

  static vix::validation::Schema<ProfileForm> schema()
  {
    return vix::validation::schema<ProfileForm>()
        .parsed<int>(
            "age",
            &ProfileForm::age,
            vix::validation::parsed<int>()
                .between(18, 120, "age is out of range")
                .parse_message("age must be a number"));
  }

  ProfileData clean() const
  {
    auto parsed = vix::conversion::parse<int>(age);

    return ProfileData{
        parsed.value()};
  }
};

int main()
{
  auto result = vix::validation::Form<ProfileForm>::validate_kv({
      {"age", "25"},
  });

  if (!result)
  {
    for (const auto &error : result.errors().all())
    {
      vix::print(error.field, error.message);
    }

    return 1;
  }

  vix::print("age:", result.value().age);

  return 0;
}
```

The schema guarantees that `age` can be parsed and is within range before `clean()` runs on the success path. That keeps the cleaned output type typed and practical.

## Form schema access

Use `Form<T>::schema()` when advanced code needs direct access to the cached schema.

```cpp
#include <string>
#include <string_view>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct SettingsForm
{
  std::string mode;

  static bool set(
      SettingsForm &out,
      std::string_view field,
      std::string_view value)
  {
    if (field == "mode")
    {
      out.mode = std::string(value);
      return true;
    }

    return false;
  }

  static vix::validation::Schema<SettingsForm> schema()
  {
    return vix::validation::schema<SettingsForm>()
        .field(
            "mode",
            &SettingsForm::mode,
            vix::validation::field<std::string>()
                .required("mode is required")
                .in_set(
                    {"development", "production"},
                    "mode is not allowed"));
  }
};

int main()
{
  SettingsForm form;
  form.mode = "test";

  const auto &schema = vix::validation::Form<SettingsForm>::schema();
  auto result = schema.validate(form);

  if (!result.ok())
  {
    vix::print("settings form is invalid");
    return 1;
  }

  return 0;
}
```

Most application code should use `Form<T>::validate(...)`. Direct schema access is mainly useful for advanced integrations and tests.

## Schema caching

`Form<T>` caches the schema for each form type.

The form type still declares:

```cpp
static vix::validation::Schema<MyForm> schema()
{
  return vix::validation::schema<MyForm>()
      .field(...);
}
```

But `Form<T>` constructs the schema once and reuses it across validation calls. This keeps the form API convenient without rebuilding the schema every time.

## Binding before validation

The form workflow always binds input before validating the schema.

This matters because schema validation runs on the form object, not directly on the raw input. A missing field, unknown field, malformed key, or unsupported input shape should be handled during binding. A present but invalid value should usually be handled by the schema.

This separation keeps code clear:

```txt
binding decides what input means
schema decides whether the form is valid
cleaning decides what value the application receives
```

## Form-level errors

When a binder fails without providing detailed errors, `Form<T>` creates a form-level error with the field name:

```txt
__form__
```

This is used for generic binding failures where no specific field error was provided. For real request and form handling, prefer the `bind(out, input, errors)` contract so the binder can attach precise errors.

## Use forms at boundaries

Forms are designed for boundaries. They are a good fit for HTTP handlers, command handlers, configuration loading, and any place where raw input needs to become a validated application value.

Inside core business logic, prefer receiving already validated and typed values. That keeps the validation layer close to the edge of the application and prevents the rest of the system from repeatedly checking the same raw input.

## API overview

| API                                        | Purpose                                                          |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `Form<Derived>`                            | High-level `bind -> validate -> clean` workflow.                 |
| `Form<Derived>::validate(input)`           | Bind and validate raw input.                                     |
| `Form<Derived>::validate_kv({ ... })`      | Convenience helper for key-value input.                          |
| `Form<Derived>::schema()`                  | Access the cached schema for the form type.                      |
| `Form<Derived>::cleaned_type`              | Validated output type. Defaults to `Derived`.                    |
| `FormResult<T>`                            | Value-or-errors result returned by forms.                        |
| `FormResult<T>::operator bool()`           | Returns `true` when the form produced a value and has no errors. |
| `FormResult<T>::value()`                   | Access the validated output value.                               |
| `FormResult<T>::errors()`                  | Access validation errors on failure.                             |
| `static Derived::schema()`                 | Required schema function for the form type.                      |
| `static Derived::bind(out, input, errors)` | Preferred binding contract with detailed errors.                 |
| `static Derived::bind(out, input)`         | Simpler binding contract.                                        |
| `static Derived::set(out, field, value)`   | Minimal key-value binding contract.                              |
| `using Derived::cleaned_type = X`          | Optional cleaned output type.                                    |
| `Derived::clean() const`                   | Optional cleaned output producer.                                |

## Next step

Continue with the API reference for a compact list of the public types and functions exposed by the validation module.

- [API Reference](./api-reference)
