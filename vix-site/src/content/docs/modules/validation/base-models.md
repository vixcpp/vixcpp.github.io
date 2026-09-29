# Base Models

`BaseModel<T>` lets a type own its validation schema.

This is useful when validation belongs naturally to a model or input type. Instead of creating a schema in every handler or helper function, the type declares a static `schema()` function once and then receives instance-level validation methods through CRTP.

The result is a simple workflow:

```txt
model instance -> model schema -> ValidationResult
```

`BaseModel<T>` does not add fields to the derived type. It only gives the derived type a reusable validation entry point built on top of `Schema<T>`.

## Header

Use the public Vix header when working with base models:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic model

A base model inherits from `vix::validation::BaseModel<Derived>` and provides a static `schema()` function.

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
      vix::print(
          error.field,
          vix::validation::to_string(error.code),
          error.message);
    }

    return 1;
  }

  vix::print("user input is valid");

  return 0;
}
```

The model owns its validation policy. Any place that receives a `UserInput` can call `input.validate()` without knowing how the schema is built.

## BaseModel contract

A derived type must follow this shape:

```cpp
struct MyType : vix::validation::BaseModel<MyType>
{
  static vix::validation::Schema<MyType> schema()
  {
    return vix::validation::schema<MyType>();
  }
};
```

The static `schema()` function must return exactly:

```cpp
vix::validation::Schema<MyType>
```

This is checked at compile time. If the derived type does not provide the expected schema function, the error is reported while compiling the validation code.

## Instance validation

Use `validate()` on an instance when you want to validate the object itself.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput : vix::validation::BaseModel<RegisterInput>
{
  std::string email;
  std::string password;

  static vix::validation::Schema<RegisterInput> schema()
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
                .length_min(8, "password is too short"));
  }
};

int main()
{
  RegisterInput input{
      "bad",
      "123"};

  auto result = input.validate();

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

This is the most common use of `BaseModel<T>`.

## Convenience validity check

Use `is_valid()` when you only need a boolean answer.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct TokenInput : vix::validation::BaseModel<TokenInput>
{
  std::string token;

  static vix::validation::Schema<TokenInput> schema()
  {
    return vix::validation::schema<TokenInput>()
        .field(
            "token",
            &TokenInput::token,
            vix::validation::field<std::string>()
                .required("token is required")
                .length_min(10, "token is too short"));
  }
};

int main()
{
  TokenInput input{"abc"};

  if (!input.is_valid())
  {
    vix::print("token input is invalid");
    return 1;
  }

  vix::print("token input is valid");

  return 0;
}
```

`is_valid()` is convenient for small checks. Use `validate()` when you need the errors.

## Static validation

`BaseModel<T>` can also validate an object without calling through the instance.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProductInput : vix::validation::BaseModel<ProductInput>
{
  std::string title;
  int quantity{0};

  static vix::validation::Schema<ProductInput> schema()
  {
    return vix::validation::schema<ProductInput>()
        .field(
            "title",
            &ProductInput::title,
            vix::validation::field<std::string>()
                .required("title is required")
                .length_min(3, "title is too short"))
        .field(
            "quantity",
            &ProductInput::quantity,
            vix::validation::field<int>()
                .min(1, "quantity must be at least 1"));
  }
};

int main()
{
  ProductInput input{
      "TV",
      0};

  auto result = ProductInput::validate(input);

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

This form is useful in generic code or helper functions where the object is passed separately.

## Access the cached schema

Use `BaseModel<T>::schema()` through the derived type when advanced code needs direct access to the schema.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProfileInput : vix::validation::BaseModel<ProfileInput>
{
  std::string username;

  static vix::validation::Schema<ProfileInput> schema()
  {
    return vix::validation::schema<ProfileInput>()
        .field(
            "username",
            &ProfileInput::username,
            vix::validation::field<std::string>()
                .required("username is required")
                .length_min(3, "username is too short")
                .length_max(30, "username is too long"));
  }
};

int main()
{
  ProfileInput input{"ga"};

  const auto &schema = ProfileInput::BaseModel::schema();
  auto result = schema.validate(input);

  if (!result.ok())
  {
    vix::print("profile input is invalid");
    return 1;
  }

  return 0;
}
```

In normal application code, `input.validate()` is clearer. Direct schema access is mainly useful for advanced workflows such as introspection, reusable adapters, or integration code.

## Schema caching

`BaseModel<T>` caches the schema internally.

The derived type still declares the schema as a function:

```cpp
static vix::validation::Schema<UserInput> schema()
{
  return vix::validation::schema<UserInput>()
      .field(...);
}
```

But `BaseModel<T>` stores the constructed schema in a static local cache and reuses it for validation calls. This avoids rebuilding the schema every time `validate()` is called.

The cache is initialized once and is thread-safe under normal C++11 static local initialization rules.

## Use typed fields

Base models use the same `Schema<T>` field validation API.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct AccountInput : vix::validation::BaseModel<AccountInput>
{
  std::string username;
  int age{0};

  static vix::validation::Schema<AccountInput> schema()
  {
    return vix::validation::schema<AccountInput>()
        .field(
            "username",
            &AccountInput::username,
            vix::validation::field<std::string>()
                .required("username is required")
                .length_min(3, "username is too short")
                .length_max(30, "username is too long"))
        .field(
            "age",
            &AccountInput::age,
            vix::validation::field<int>()
                .between(18, 120, "age is out of range"));
  }
};

int main()
{
  AccountInput input{
      "ga",
      10};

  auto result = input.validate();

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

The model can mix string rules, numeric rules, and custom field rules through the schema.

## Use parsed fields

A base model schema can also parse text fields before applying typed rules.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProfileInput : vix::validation::BaseModel<ProfileInput>
{
  std::string age;

  static vix::validation::Schema<ProfileInput> schema()
  {
    return vix::validation::schema<ProfileInput>()
        .parsed<int>(
            "age",
            &ProfileInput::age,
            vix::validation::parsed<int>()
                .between(18, 120, "age is out of range")
                .parse_message("age must be a number"));
  }
};

int main()
{
  ProfileInput input{"abc"};

  auto result = input.validate();

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

This is useful for boundary models that store raw text but still need typed validation rules.

## Use whole-object checks

The schema owned by a base model can include object-level checks.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput : vix::validation::BaseModel<RegisterInput>
{
  std::string password;
  std::string confirm_password;

  static vix::validation::Schema<RegisterInput> schema()
  {
    return vix::validation::schema<RegisterInput>()
        .field(
            "password",
            &RegisterInput::password,
            vix::validation::field<std::string>()
                .required("password is required")
                .length_min(8, "password is too short"))
        .field(
            "confirm_password",
            &RegisterInput::confirm_password,
            vix::validation::field<std::string>()
                .required("password confirmation is required"))
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
};

int main()
{
  RegisterInput input{
      "secret-123",
      "other-secret"};

  auto result = input.validate();

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

Whole-object checks are useful for constraints that cannot be expressed by validating one field alone.

## Add custom rules

Custom rules can be used inside a base model schema the same way they are used in normal schemas.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct UserInput : vix::validation::BaseModel<UserInput>
{
  std::string username;

  static vix::validation::Rule<std::string> not_reserved_username()
  {
    return [](std::string_view field,
              const std::string &value,
              vix::validation::ValidationErrors &errors)
    {
      if (value == "admin" || value == "root")
      {
        errors.add(
            std::string(field),
            vix::validation::ValidationErrorCode::Custom,
            "username is reserved");
      }
    };
  }

  static vix::validation::Schema<UserInput> schema()
  {
    return vix::validation::schema<UserInput>()
        .field(
            "username",
            &UserInput::username,
            vix::validation::field<std::string>()
                .required("username is required")
                .length_min(3, "username is too short")
                .rule(not_reserved_username()));
  }
};

int main()
{
  UserInput input{"admin"};

  auto result = input.validate();

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

This keeps application-specific validation close to the type that owns the data.

## Use BaseModel in helper functions

A helper can accept a base-model type and call validation directly on it.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct SettingsInput : vix::validation::BaseModel<SettingsInput>
{
  std::string mode;

  static vix::validation::Schema<SettingsInput> schema()
  {
    return vix::validation::schema<SettingsInput>()
        .field(
            "mode",
            &SettingsInput::mode,
            vix::validation::field<std::string>()
                .required("mode is required")
                .in_set(
                    {"development", "production"},
                    "mode is not allowed"));
  }
};

template <typename Model>
bool print_validation_status(const Model &model)
{
  auto result = model.validate();

  if (!result.ok())
  {
    for (const auto &error : result.errors.all())
    {
      vix::print(error.field, error.message);
    }

    return false;
  }

  vix::print("model is valid");
  return true;
}

int main()
{
  SettingsInput input{"test"};

  if (!print_validation_status(input))
  {
    return 1;
  }

  return 0;
}
```

This works well when your application uses several validated input types with a consistent validation interface.

## When to use BaseModel

Use `BaseModel<T>` when a type should own its validation rules and expose validation as part of its interface.

It is a good fit for request input models, configuration models, command input structures, and internal DTOs that have stable validation rules.

For one-off field checks, use `validate(...)`. For reusable validation of a type without inheritance, use a standalone `Schema<T>`. For raw input binding and cleaned output, use `Form<T>`.

## API overview

| API                                   | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `BaseModel<Derived>`                  | CRTP base class for schema-driven validation.                     |
| `Derived::schema()`                   | Static function required by the derived type.                     |
| `validate() const`                    | Validate the current instance.                                    |
| `is_valid() const`                    | Return `true` when the current instance has no validation errors. |
| `static validate(const Derived &obj)` | Validate a provided instance.                                     |
| `static schema()`                     | Access the cached schema through the base model.                  |

## Next step

Continue with forms to see how the module handles the full boundary workflow: binding raw input, validating the form object, and returning either cleaned output or structured errors.

- [Forms](./forms)
