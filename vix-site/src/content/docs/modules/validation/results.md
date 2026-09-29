# Results

The `validation` module represents validation output with `ValidationResult`.

A validation result is simple: it is valid when it contains no errors, and invalid when one or more `ValidationError` values were collected. This design is useful for forms, APIs, configuration checks, and model validation because the caller can inspect all failures at once instead of stopping at the first rule that fails.

The main result types are `ValidationResult`, `ValidationErrors`, and `ValidationError`.

## Header

Use the public Vix header when working with validation results:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic result handling

A validation call returns a `ValidationResult`.

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

The result owns a `ValidationErrors` container. When `ok()` returns `true`, that container is empty. When `ok()` returns `false`, the container contains the errors produced by the rules.

## ValidationResult

`ValidationResult` is the standard result type returned by validation operations.

```cpp
struct ValidationResult
{
  ValidationErrors errors;

  bool ok() const noexcept;
  bool empty() const noexcept;
  std::size_t size() const noexcept;

  explicit operator bool() const noexcept;

  void merge(const ValidationResult &other);
  void merge(ValidationResult &&other);

  void add(ValidationError e);
  void add(std::string field, ValidationErrorCode code, std::string message);
  void add(
      std::string field,
      ValidationErrorCode code,
      std::string message,
      std::unordered_map<std::string, std::string> meta);

  void clear() noexcept;

  static ValidationResult success();
  static ValidationResult failure(ValidationErrors e);
  static ValidationResult from_errors(ValidationErrors e);
};
```

A result does not contain a validated value. It only describes whether validation passed and which errors were produced. Value-returning workflows, such as `Form<T>`, use a separate `FormResult<T>`.

## Check whether validation passed

Use `ok()` when checking a validation result.

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
                    .result();

  if (result.ok())
  {
    vix::print("username is valid");
  }

  return 0;
}
```

`ok()` returns `true` when there are no validation errors.

## Use the boolean operator

`ValidationResult` can also be used directly in an `if` statement.

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

  if (!result)
  {
    vix::print("password is invalid");
    return 1;
  }

  vix::print("password is valid");

  return 0;
}
```

The boolean operator follows the same meaning as `ok()`: `true` means valid, and `false` means invalid.

## Count errors

Use `size()` to get the number of collected errors.

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

Validation can collect several errors for the same field. This is useful for form validation because the user or caller can receive the complete list of problems.

## ValidationErrors

`ValidationErrors` is the container used to collect multiple validation errors.

```cpp
class ValidationErrors
{
public:
  bool empty() const noexcept;
  std::size_t size() const noexcept;
  bool ok() const noexcept;

  const container_type &all() const noexcept;
  container_type &all_mut() noexcept;

  const ValidationError &operator[](std::size_t i) const noexcept;
  ValidationError &operator[](std::size_t i) noexcept;

  void reserve(std::size_t n);

  void add(ValidationError error);
  void add(std::string field, ValidationErrorCode code, std::string message);
  void add(
      std::string field,
      ValidationErrorCode code,
      std::string message,
      std::unordered_map<std::string, std::string> meta);

  void merge(const ValidationErrors &other);
  void merge(ValidationErrors &&other);

  void clear() noexcept;
};
```

Most code accesses this container through `ValidationResult::errors`.

## Iterate over errors

Use `all()` when you want to inspect every error.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "bad";

  auto result = vix::validation::validate("email", email)
                    .email("invalid email")
                    .length_min(5, "email is too short")
                    .result();

  for (const auto &error : result.errors.all())
  {
    vix::print("field:", error.field);
    vix::print("code:", vix::validation::to_string(error.code));
    vix::print("message:", error.message);
  }

  return 0;
}
```

Each error gives enough information to build logs, diagnostics, JSON responses, or simple messages.

## Access an error by index

Use `operator[]` when you need a specific error.

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

  if (!result.ok() && result.size() > 0)
  {
    const auto &error = result.errors[0];

    vix::print(error.field);
    vix::print(error.message);
  }

  return 0;
}
```

Index access is useful in tests and small diagnostics. For normal output, iterating through `all()` is usually clearer.

## Add errors manually

A `ValidationResult` can be built manually when writing custom validation logic.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationResult result;

  result.add(
      "password",
      vix::validation::ValidationErrorCode::Custom,
      "password confirmation does not match");

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

This is useful inside object-level schema checks or when a function needs to produce validation errors directly.

## Add errors with metadata

Metadata carries additional structured details about the failure.

```cpp
#include <unordered_map>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationResult result;

  result.add(
      "age",
      vix::validation::ValidationErrorCode::Between,
      "age is out of range",
      {
          {"min", "18"},
          {"max", "120"},
          {"got", "10"},
      });

  for (const auto &error : result.errors.all())
  {
    vix::print(error.field, error.message);

    for (const auto &[key, value] : error.meta)
    {
      vix::print(key, value);
    }
  }

  return 0;
}
```

Metadata is useful for APIs and client-side validation because the caller can receive both a stable error code and useful details about the rule.

## Merge results

Validation results can be merged. This is useful when several validation steps contribute to the final result.

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "bad";
  std::string password = "123";

  auto email_result = vix::validation::validate("email", email)
                          .email("invalid email")
                          .result();

  auto password_result = vix::validation::validate("password", password)
                             .length_min(8, "password is too short")
                             .result();

  vix::validation::ValidationResult result;
  result.merge(email_result);
  result.merge(password_result);

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

Merging lets you compose validation logic without losing errors produced by earlier steps.

## Merge error containers

You can also merge `ValidationErrors` directly.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationErrors a;
  vix::validation::ValidationErrors b;

  a.add(
      "email",
      vix::validation::ValidationErrorCode::Format,
      "invalid email");

  b.add(
      "password",
      vix::validation::ValidationErrorCode::LengthMin,
      "password is too short");

  a.merge(b);

  vix::print("error count:", a.size());

  return 0;
}
```

This is useful when lower-level helpers accumulate errors into a shared container.

## Clear a result

Use `clear()` to remove all errors from a result.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationResult result;

  result.add(
      "field",
      vix::validation::ValidationErrorCode::Custom,
      "temporary error");

  result.clear();

  if (result.ok())
  {
    vix::print("result is clean");
  }

  return 0;
}
```

After `clear()`, the result becomes valid because it no longer contains errors.

## Create a success result

Use `ValidationResult::success()` when a function needs to return an explicit successful result.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

vix::validation::ValidationResult validate_nothing()
{
  return vix::validation::ValidationResult::success();
}

int main()
{
  auto result = validate_nothing();

  if (result.ok())
  {
    vix::print("ok");
  }

  return 0;
}
```

This is mostly useful in custom validation helpers or object-level schema checks.

## Create a failure result

Use `ValidationResult::failure(...)` or `ValidationResult::from_errors(...)` when a function already has a `ValidationErrors` container.

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

vix::validation::ValidationResult validate_age(int age)
{
  vix::validation::ValidationErrors errors;

  if (age < 18)
  {
    errors.add(
        "age",
        vix::validation::ValidationErrorCode::Min,
        "age must be at least 18");
  }

  if (!errors.ok())
  {
    return vix::validation::ValidationResult::failure(std::move(errors));
  }

  return vix::validation::ValidationResult::success();
}

int main()
{
  auto result = validate_age(16);

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

This pattern is useful for custom validators that need to accumulate more than one error before returning.

## Result from rules

Single-field validation uses the same result type.

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

This is the lower-level version of the fluent `validate(...)` API. Both workflows produce `ValidationResult`.

## Result from schemas

Schemas also return `ValidationResult`.

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
          vix::validation::field<std::string>()
              .required()
              .email());
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

This consistency is important. Whether validation starts from rules, a field validator, parsed validation, a schema, or a model, the normal output is still a `ValidationResult`.

## FormResult

`Form<T>` uses a different result type because it needs to return either a validated value or validation errors.

```cpp
auto result = vix::validation::Form<MyForm>::validate(input);

if (!result)
{
  const auto &errors = result.errors();
}
else
{
  const auto &value = result.value();
}
```

`FormResult<T>` is covered in the Forms page. The important distinction is that `ValidationResult` only contains errors, while `FormResult<T>` can contain a validated output value.

## API overview

| API                                  | Purpose                                           |
| ------------------------------------ | ------------------------------------------------- |
| `ValidationResult::errors`           | Error container owned by the result.              |
| `ValidationResult::ok()`             | Returns `true` when no errors were collected.     |
| `ValidationResult::empty()`          | Returns `true` when the error container is empty. |
| `ValidationResult::size()`           | Returns the number of errors.                     |
| `ValidationResult::operator bool()`  | Same meaning as `ok()`.                           |
| `ValidationResult::merge(...)`       | Merge another result into this result.            |
| `ValidationResult::add(...)`         | Add one validation error.                         |
| `ValidationResult::clear()`          | Remove all errors.                                |
| `ValidationResult::success()`        | Create a successful result.                       |
| `ValidationResult::failure(...)`     | Create a failed result from errors.               |
| `ValidationResult::from_errors(...)` | Create a result from an error container.          |
| `ValidationErrors::all()`            | Access all errors.                                |
| `ValidationErrors::add(...)`         | Add one error to the container.                   |
| `ValidationErrors::merge(...)`       | Merge another error container.                    |
| `ValidationErrors::clear()`          | Remove all errors from the container.             |

## Next step

Continue with errors to understand the structure of `ValidationError` and the meaning of each `ValidationErrorCode`.

- [Errors](./errors)
