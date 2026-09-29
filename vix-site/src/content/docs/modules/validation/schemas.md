# Schemas

Schemas are the main object-level validation tool in the `validation` module.

A schema describes how a type should be validated. It can validate typed fields, parse string fields before applying typed rules, and run whole-object checks for constraints that depend on more than one field. This makes `Schema<T>` the right tool when validation belongs to a model, a request input, a form object, or any reusable application structure.

The schema itself stores a list of checks. When `validate(...)` is called, every check is executed and all produced errors are accumulated into a `ValidationResult`.

## Header

Use the public Vix header when working with schemas:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic schema

Use `vix::validation::schema<T>()` to create a schema for a type.

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
      "not-an-email",
      "123"};

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

  vix::print("input is valid");

  return 0;
}
```

The schema validates every registered field and returns all errors together. This is useful for forms and APIs because the caller can receive the full list of invalid fields in one result.

## Schema type

`Schema<T>` is a declarative validator for a type `T`.

```cpp
template <typename T>
class Schema;
```

A schema stores checks that receive an object and append errors into a shared `ValidationErrors` container. The public API keeps this internal flow hidden behind `validate(...)`.

```cpp
ValidationResult validate(const T &obj) const;
```

The result is valid when no errors were collected.

## Typed fields

Use `.field(...)` when the member already has the type you want to validate.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct ProductInput
{
  std::string title;
  int quantity;
};

static vix::validation::Schema<ProductInput> product_schema()
{
  return vix::validation::schema<ProductInput>()
      .field(
          "title",
          &ProductInput::title,
          vix::validation::field<std::string>()
              .required("title is required")
              .length_min(3, "title is too short")
              .length_max(120, "title is too long"))
      .field(
          "quantity",
          &ProductInput::quantity,
          vix::validation::field<int>()
              .min(1, "quantity must be at least 1")
              .max(100, "quantity must be at most 100"));
}

int main()
{
  ProductInput input{
      "TV",
      0};

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

Typed fields use `FieldSpec<T>`, created with `field<T>()`. A field spec collects the rules that should be applied to the member.

## FieldSpec

`FieldSpec<T>` is a fluent rule pack for one field type.

```cpp
vix::validation::field<std::string>()
    .required()
    .email()
    .length_max(120)
```

For string fields, it supports string rules such as `required`, `length_min`, `length_max`, `email`, and `in_set`.

For arithmetic fields, it supports numeric rules such as `min`, `max`, and `between`.

```cpp
vix::validation::field<int>()
    .between(18, 120, "age is out of range")
```

This keeps schema declarations short without hiding the validation rules.

## Parsed fields

Use `.parsed<T>(...)` when the member is text but the rules should apply to a parsed value.

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

In this example, the schema reads `age` as a string, parses it as an `int`, then applies the numeric range rule. If parsing fails, the field receives a `Format` validation error.

## ParsedSpec

`ParsedSpec<T>` is the schema-level equivalent of `validate_parsed<T>(...)`.

```cpp
vix::validation::parsed<int>()
    .between(18, 120, "age is out of range")
    .parse_message("age must be a number")
```

It stores the typed rules to apply after parsing succeeds, and the message to use when parsing fails.

```cpp
vix::validation::parsed<double>()
    .min(0.0, "ratio must be positive")
    .max(1.0, "ratio must be at most 1")
    .parse_message("ratio must be a number")
```

Use parsed specs when your boundary model stores raw text but your validation policy depends on typed values.

## Parsed string views

Parsed schema fields can be `std::string` or `std::string_view`.

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

This is useful for request adapters where field values are views into a larger input buffer.

## Field validation with a callable

`Schema::field(...)` can also accept a callable. The callable can return a `ValidationResult` or a `Validator<FieldT>`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct UserInput
{
  std::string username;
};

static vix::validation::Schema<UserInput> user_schema()
{
  return vix::validation::schema<UserInput>()
      .field(
          "username",
          &UserInput::username,
          [](std::string_view field, const std::string &value)
          {
            return vix::validation::validate(field, value)
                .required("username is required")
                .length_min(3, "username is too short")
                .length_max(30, "username is too long");
          });
}

int main()
{
  UserInput input{"ga"};

  auto result = user_schema().validate(input);

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

This form is useful when a field needs custom logic but still fits naturally into the fluent single-field validator.

## Callable returning ValidationResult

A field callable can execute validation immediately and return a `ValidationResult`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct UserInput
{
  std::string email;
};

static vix::validation::Schema<UserInput> user_schema()
{
  return vix::validation::schema<UserInput>()
      .field(
          "email",
          &UserInput::email,
          [](std::string_view field, const std::string &value)
          {
            return vix::validation::validate(field, value)
                .required("email is required")
                .email("invalid email")
                .result();
          });
}

int main()
{
  UserInput input{"bad"};

  auto result = user_schema().validate(input);

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

Use this form when the callable should return the final validation result instead of returning a builder.

## Parsed validation with a callable

`Schema::parsed(...)` can also accept a callable. The callable can return a `ValidationResult` or a `ParsedValidator<T>`.

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

The callable receives the field name and the raw text input. It can then build a parsed validator with the exact rules needed by that field.

## Whole-object checks

Use `.check(...)` for validation that depends on the whole object.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RegisterInput
{
  std::string password;
  std::string confirm_password;
};

static vix::validation::Schema<RegisterInput> register_schema()
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

int main()
{
  RegisterInput input{
      "secret-123",
      "other-secret"};

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

Whole-object checks are the right place for cross-field constraints. They keep individual field rules focused while still allowing the schema to express invariants that depend on multiple fields.

## Check returning ValidationResult

A schema check can also return a `ValidationResult`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct RangeInput
{
  int start;
  int end;
};

static vix::validation::ValidationResult
validate_range_order(const RangeInput &input)
{
  vix::validation::ValidationResult result;

  if (input.start > input.end)
  {
    result.add(
        "end",
        vix::validation::ValidationErrorCode::Custom,
        "end must be greater than or equal to start");
  }

  return result;
}

static vix::validation::Schema<RangeInput> range_schema()
{
  return vix::validation::schema<RangeInput>()
      .field(
          "start",
          &RangeInput::start,
          vix::validation::field<int>())
      .field(
          "end",
          &RangeInput::end,
          vix::validation::field<int>())
      .check(validate_range_order);
}

int main()
{
  RangeInput input{10, 5};

  auto result = range_schema().validate(input);

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

This form is useful when a whole-object rule is reused in several schemas or tests.

## Custom field rules inside schemas

A schema field can include custom rules through `field<T>().rule(...)`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct AccountInput
{
  std::string username;
};

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

static vix::validation::Schema<AccountInput> account_schema()
{
  return vix::validation::schema<AccountInput>()
      .field(
          "username",
          &AccountInput::username,
          vix::validation::field<std::string>()
              .required("username is required")
              .length_min(3, "username is too short")
              .rule(not_reserved_username()));
}

int main()
{
  AccountInput input{"admin"};

  auto result = account_schema().validate(input);

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

This keeps application-specific field rules close to the schema while still using the standard `ValidationError` model.

## Reusable schemas

Because a schema is just a value, you can create it in a function and reuse it wherever the same type needs validation.

```cpp
#include <string>
#include <vix/validation.hpp>

struct LoginInput
{
  std::string email;
  std::string password;
};

static vix::validation::Schema<LoginInput> login_schema()
{
  return vix::validation::schema<LoginInput>()
      .field(
          "email",
          &LoginInput::email,
          vix::validation::field<std::string>()
              .required("email is required")
              .email("invalid email"))
      .field(
          "password",
          &LoginInput::password,
          vix::validation::field<std::string>()
              .required("password is required")
              .length_min(8, "password is too short"));
}
```

For larger models, `BaseModel<T>` and `Form<T>` can cache the schema internally so the same schema is not rebuilt for every validation call.

## Schema helper

Use `schema<T>()` as the normal entry point.

```cpp
vix::validation::schema<MyType>()
```

It returns an empty `Schema<MyType>` that can be extended with `.field(...)`, `.parsed(...)`, and `.check(...)`.

```cpp
auto s = vix::validation::schema<MyType>();
```

This style keeps schema declarations consistent and easy to read.

## Schema validation result

`Schema<T>::validate(...)` returns `ValidationResult`.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

struct Input
{
  std::string name;
};

int main()
{
  auto s = vix::validation::schema<Input>()
      .field(
          "name",
          &Input::name,
          vix::validation::field<std::string>()
              .required("name is required"));

  Input input{""};

  auto result = s.validate(input);

  if (!result)
  {
    vix::print("schema validation failed");
    vix::print("errors:", result.size());
  }

  return 0;
}
```

The boolean operator has the same meaning as `ok()`: `true` means no errors, and `false` means one or more errors were collected.

## Schema in BaseModel

`BaseModel<T>` expects the derived type to provide a static schema.

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
  UserInput input{"bad"};

  auto result = input.validate();

  if (!result.ok())
  {
    vix::print("user input is invalid");
    return 1;
  }

  return 0;
}
```

This is a good fit when a type owns its validation rules and should expose `validate()` directly.

## Schema in Form

`Form<T>` also expects the form type to provide a static schema.

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

The form handles raw input binding first, then validates the bound object with its schema.

## What schemas should contain

A schema should describe validation policy for a type. It should not perform unrelated business work, database queries, network calls, or mutation that changes the object being validated.

A good schema usually contains field rules, parsed field rules, and whole-object checks that express the shape and consistency of the input. Business decisions that require external state are usually better handled by a service layer after schema validation succeeds.

## API overview

| API                               | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `Schema<T>`                       | Declarative validator for a type.                        |
| `schema<T>()`                     | Create an empty schema for type `T`.                     |
| `Schema<T>::field(...)`           | Register typed field validation.                         |
| `Schema<T>::parsed<ParsedT>(...)` | Register parsed field validation.                        |
| `Schema<T>::check(...)`           | Register whole-object validation.                        |
| `Schema<T>::validate(...)`        | Execute all schema checks and return `ValidationResult`. |
| `FieldSpec<T>`                    | Fluent rule pack for typed fields.                       |
| `field<T>()`                      | Create a `FieldSpec<T>`.                                 |
| `ParsedSpec<T>`                   | Fluent rule pack for parsed fields.                      |
| `parsed<T>()`                     | Create a `ParsedSpec<T>`.                                |

## Next step

Continue with base models to see how a type can own its schema and expose direct instance validation through `BaseModel<T>`.

- [Base Models](./base-models)
