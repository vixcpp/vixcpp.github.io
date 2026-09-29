# API Reference

This page lists the public API exposed by the Vix `validation` module.

The module provides structured validation for typed values, parsed input, object schemas, models, and forms. Validation functions do not return silent fallback values. They return explicit results that contain either no errors or a collection of `ValidationError` values.

## Header

Use the public Vix header when working with the validation module:

```cpp
#include <vix/validation.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The module also exposes an internal aggregation header:

```cpp
#include <vix/validation/all.hpp>
```

For normal Vix application code and documentation examples, prefer the public root header:

```cpp
#include <vix/validation.hpp>
```

## Namespace

All public validation APIs live in the `vix::validation` namespace.

```cpp
namespace vix::validation
{
}
```

Built-in rules live in:

```cpp
namespace vix::validation::rules
{
}
```

Internal helpers live in:

```cpp
namespace vix::validation::detail
{
}
```

Application code should normally use the public APIs from `vix::validation` and `vix::validation::rules`.

## ValidationErrorCode

`ValidationErrorCode` describes the semantic rule that failed.

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

### Values

| Code        | Meaning                                      |
| ----------- | -------------------------------------------- |
| `Required`  | A required value is missing or empty.        |
| `Min`       | A numeric value is below the minimum.        |
| `Max`       | A numeric value is above the maximum.        |
| `LengthMin` | A string is shorter than the minimum length. |
| `LengthMax` | A string is longer than the maximum length.  |
| `Between`   | A numeric value is outside an allowed range. |
| `Format`    | A value has an invalid format.               |
| `InSet`     | A string is not part of an allowed set.      |
| `Custom`    | A custom validation rule failed.             |

## Error code strings

Use `to_string` to convert a validation error code into a stable string identifier.

```cpp
[[nodiscard]] std::string_view
to_string(ValidationErrorCode code) noexcept;
```

Example:

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  auto code = vix::validation::ValidationErrorCode::Required;

  vix::print(vix::validation::to_string(code));

  return 0;
}
```

Returned identifiers include:

```txt
required
min
max
length_min
length_max
between
format
in_set
custom
unknown
```

These strings are useful for JSON responses, logs, tests, and client-side error handling.

## ValidationError

`ValidationError` represents one validation failure.

```cpp
struct ValidationError
{
  std::string field;
  ValidationErrorCode code{ValidationErrorCode::Custom};
  std::string message;
  std::unordered_map<std::string, std::string> meta;

  ValidationError() = default;

  ValidationError(
      std::string f,
      ValidationErrorCode c,
      std::string msg);

  ValidationError(
      std::string f,
      ValidationErrorCode c,
      std::string msg,
      std::unordered_map<std::string, std::string> m);
};
```

### Fields

| Field     | Purpose                                            |
| --------- | -------------------------------------------------- |
| `field`   | Field name, such as `email`, `age`, or `password`. |
| `code`    | Stable semantic validation code.                   |
| `message` | Human-readable validation message.                 |
| `meta`    | Optional structured metadata.                      |

Example:

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

  vix::print(error.field);
  vix::print(vix::validation::to_string(error.code));
  vix::print(error.message);

  return 0;
}
```

## ValidationErrors

`ValidationErrors` stores multiple validation errors.

```cpp
class ValidationErrors
{
public:
  using container_type = std::vector<ValidationError>;
  using iterator = container_type::iterator;
  using const_iterator = container_type::const_iterator;

  ValidationErrors() = default;

  bool empty() const noexcept;
  std::size_t size() const noexcept;
  bool ok() const noexcept;

  const container_type &all() const noexcept;
  container_type &all_mut() noexcept;

  const ValidationError &operator[](std::size_t i) const noexcept;
  ValidationError &operator[](std::size_t i) noexcept;

  void reserve(std::size_t n);

  void add(ValidationError error);

  void add(
      std::string field,
      ValidationErrorCode code,
      std::string message);

  void add(
      std::string field,
      ValidationErrorCode code,
      std::string message,
      std::unordered_map<std::string, std::string> meta);

  void merge(const ValidationErrors &other);
  void merge(ValidationErrors &&other);

  void clear() noexcept;

  iterator begin() noexcept;
  iterator end() noexcept;

  const_iterator begin() const noexcept;
  const_iterator end() const noexcept;

  const_iterator cbegin() const noexcept;
  const_iterator cend() const noexcept;
};
```

Example:

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationErrors errors;

  errors.add(
      "email",
      vix::validation::ValidationErrorCode::Format,
      "invalid email");

  if (!errors.ok())
  {
    for (const auto &error : errors.all())
    {
      vix::print(error.field, error.message);
    }
  }

  return 0;
}
```

## ValidationResult

`ValidationResult` represents the result of a validation operation.

```cpp
struct ValidationResult
{
  ValidationErrors errors;

  ValidationResult() = default;

  explicit ValidationResult(ValidationErrors e);

  bool ok() const noexcept;
  bool empty() const noexcept;
  std::size_t size() const noexcept;

  explicit operator bool() const noexcept;

  void merge(const ValidationResult &other);
  void merge(ValidationResult &&other);

  void add(ValidationError e);

  void add(
      std::string field,
      ValidationErrorCode code,
      std::string message);

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

Example:

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::ValidationResult result;

  result.add(
      "password",
      vix::validation::ValidationErrorCode::LengthMin,
      "password is too short");

  if (!result.ok())
  {
    vix::print("errors:", result.size());
  }

  return 0;
}
```

`ok()` returns `true` when no validation errors were collected.

## Rule

`Rule<T>` represents one validation rule for a typed value.

```cpp
template <typename T>
using Rule =
    std::function<void(
        std::string_view field,
        const T &value,
        ValidationErrors &out)>;
```

A rule receives a field name, a typed value, and an error collector. It adds errors when the value is invalid.

Example:

```cpp
#include <string>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  vix::validation::Rule<std::string> not_admin =
      [](std::string_view field,
         const std::string &value,
         vix::validation::ValidationErrors &out)
      {
        if (value == "admin")
        {
          out.add(
              std::string(field),
              vix::validation::ValidationErrorCode::Custom,
              "username is reserved");
        }
      };

  std::string username = "admin";

  auto result = vix::validation::validate("username", username)
                    .rule(not_admin)
                    .result();

  if (!result.ok())
  {
    vix::print(result.errors.all()[0].message);
  }

  return 0;
}
```

## apply_rules_into

Applies a list of rules to a value and appends errors into an existing collector.

```cpp
template <typename T>
void apply_rules_into(
    std::string_view field,
    const T &value,
    const std::vector<Rule<T>> &rules,
    ValidationErrors &out);
```

Example:

```cpp
#include <string>
#include <vector>
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  std::string email = "bad";

  std::vector<vix::validation::Rule<std::string>> rules = {
      vix::validation::rules::required("email is required"),
      vix::validation::rules::email("invalid email"),
  };

  vix::validation::ValidationErrors errors;

  vix::validation::apply_rules_into(
      "email",
      email,
      rules,
      errors);

  vix::print("errors:", errors.size());

  return 0;
}
```

## apply_rules

Applies rules to a value and returns a `ValidationResult`.

```cpp
template <typename T>
[[nodiscard]] ValidationResult apply_rules(
    std::string_view field,
    const T &value,
    const std::vector<Rule<T>> &rules);
```

Initializer-list overload:

```cpp
template <typename T>
[[nodiscard]] ValidationResult apply_rules(
    std::string_view field,
    const T &value,
    std::initializer_list<Rule<T>> rules);
```

Example:

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
  }

  return 0;
}
```

## Built-in rules

Built-in rules live in `vix::validation::rules`.

### required for std::string

```cpp
[[nodiscard]] Rule<std::string>
required(std::string message = "field is required");
```

Requires a `std::string` to be non-empty.

### required_sv

```cpp
[[nodiscard]] Rule<std::string_view>
required_sv(std::string message = "field is required");
```

Requires a `std::string_view` to be non-empty.

### required for std::optional

```cpp
template <typename T>
[[nodiscard]] Rule<std::optional<T>>
required(std::string message = "field is required");
```

Requires a `std::optional<T>` to contain a value.

### min

```cpp
template <typename T>
[[nodiscard]] Rule<T>
min(T min_value, std::string message = "value is below minimum");
```

Requires an arithmetic value to be at least `min_value`.

### max

```cpp
template <typename T>
[[nodiscard]] Rule<T>
max(T max_value, std::string message = "value is above maximum");
```

Requires an arithmetic value to be at most `max_value`.

### between

```cpp
template <typename T>
[[nodiscard]] Rule<T>
between(
    T min_value,
    T max_value,
    std::string message = "value is out of range");
```

Requires an arithmetic value to stay inside the inclusive range.

### length_min

```cpp
[[nodiscard]] Rule<std::string>
length_min(
    std::size_t n,
    std::string message = "length is below minimum");
```

Requires a string to have at least `n` characters.

### length_max

```cpp
[[nodiscard]] Rule<std::string>
length_max(
    std::size_t n,
    std::string message = "length is above maximum");
```

Requires a string to have at most `n` characters.

### in_set

```cpp
[[nodiscard]] Rule<std::string>
in_set(
    std::vector<std::string> allowed,
    std::string message = "value is not allowed");
```

Requires a string to belong to a set of allowed values.

### email

```cpp
[[nodiscard]] Rule<std::string>
email(std::string message = "invalid email format");
```

Applies a lightweight email format check.

The email rule checks that the value is not empty, has no spaces, contains exactly one `@`, has text before `@`, and has a dot after `@`.

## Validator

`Validator<T>` is the fluent builder returned by `validate(...)`.

```cpp
template <typename T>
class Validator
{
public:
  Validator(std::string_view field, const T &value);

  Validator &rule(Rule<T> r);
  Validator &rule_if(bool enabled, Rule<T> r);

  ValidationResult result() const;
  void result_into(ValidationErrors &out) const;
};
```

Type-specific methods are enabled only when they make sense for `T`.

### String methods

```cpp
Validator &required(std::string message = "field is required")
  requires std::is_same_v<T, std::string>;

Validator &length_min(
    std::size_t n,
    std::string message = "length is below minimum")
  requires std::is_same_v<T, std::string>;

Validator &length_max(
    std::size_t n,
    std::string message = "length is above maximum")
  requires std::is_same_v<T, std::string>;

Validator &email(std::string message = "invalid email format")
  requires std::is_same_v<T, std::string>;

Validator &in_set(
    std::vector<std::string> allowed,
    std::string message = "value is not allowed")
  requires std::is_same_v<T, std::string>;
```

### String-view methods

```cpp
Validator &required_sv(std::string message = "field is required")
  requires std::is_same_v<T, std::string_view>;
```

### Optional methods

```cpp
template <typename U>
Validator &required(std::string message = "field is required")
  requires std::is_same_v<T, std::optional<U>>;
```

### Arithmetic methods

```cpp
Validator &min(T min_value, std::string message = "value is below minimum")
  requires std::is_arithmetic_v<T>;

Validator &max(T max_value, std::string message = "value is above maximum")
  requires std::is_arithmetic_v<T>;

Validator &between(
    T min_value,
    T max_value,
    std::string message = "value is out of range")
  requires std::is_arithmetic_v<T>;
```

Example:

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
    vix::print(result.errors.all()[0].message);
  }

  return 0;
}
```

## validate

Creates a fluent validator for one field and one typed value.

```cpp
template <typename T>
[[nodiscard]] Validator<T>
validate(std::string_view field, const T &value);
```

Example:

```cpp
#include <vix/validation.hpp>
#include <vix/print.hpp>

int main()
{
  int age = 17;

  auto result = vix::validation::validate("age", age)
                    .between(18, 120, "age is out of range")
                    .result();

  if (!result.ok())
  {
    vix::print(result.errors.all()[0].message);
  }

  return 0;
}
```

## conversion_error_to_validation

Maps a conversion error into a validation error.

```cpp
[[nodiscard]] ValidationError
conversion_error_to_validation(
    std::string_view field,
    const vix::conversion::ConversionError &err,
    std::string message = "invalid value");
```

The returned validation error uses `ValidationErrorCode::Format`. Conversion details are stored in metadata.

Common metadata keys are:

| Key               | Meaning                            |
| ----------------- | ---------------------------------- |
| `conversion_code` | Conversion error code as a string. |
| `position`        | Parser position hint.              |
| `input`           | Original input when available.     |

## ParsedValidator

`ParsedValidator<T>` validates text input by parsing it to `T` first.

```cpp
template <typename T>
class ParsedValidator
{
public:
  ParsedValidator(std::string_view field, std::string_view input);

  ParsedValidator &rule(Rule<T> r);

  ParsedValidator &min(
      T v,
      std::string message = "value is below minimum")
    requires std::is_arithmetic_v<T>;

  ParsedValidator &max(
      T v,
      std::string message = "value is above maximum")
    requires std::is_arithmetic_v<T>;

  ParsedValidator &between(
      T a,
      T b,
      std::string message = "value is out of range")
    requires std::is_arithmetic_v<T>;

  bool result_into(
      ValidationErrors &out,
      std::string parse_message = "invalid value") const;

  ValidationResult result(
      std::string parse_message = "invalid value") const;
};
```

Example:

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
    vix::print(result.errors.all()[0].message);
  }

  return 0;
}
```

## validate_parsed

Creates a parsed validator for text input.

```cpp
template <typename T>
[[nodiscard]] ParsedValidator<T>
validate_parsed(
    std::string_view field,
    std::string_view input);
```

Parsing is done with `vix::conversion::parse<T>`. If parsing fails, the result receives a validation `Format` error. If parsing succeeds, the typed rules are applied to the parsed value.

## FieldSpec

`FieldSpec<T>` is a fluent rule pack used by schemas for typed fields.

```cpp
template <typename FieldT>
class FieldSpec
{
public:
  FieldSpec() = default;

  FieldSpec &rule(Rule<FieldT> r);

  const std::vector<Rule<FieldT>> &rules() const;
};
```

### String methods

```cpp
FieldSpec &required(std::string message = "field is required")
  requires std::is_same_v<FieldT, std::string>;

FieldSpec &length_min(
    std::size_t n,
    std::string message = "length is below minimum")
  requires std::is_same_v<FieldT, std::string>;

FieldSpec &length_max(
    std::size_t n,
    std::string message = "length is above maximum")
  requires std::is_same_v<FieldT, std::string>;

FieldSpec &email(std::string message = "invalid email format")
  requires std::is_same_v<FieldT, std::string>;

FieldSpec &in_set(
    std::vector<std::string> allowed,
    std::string message = "value is not allowed")
  requires std::is_same_v<FieldT, std::string>;
```

### Arithmetic methods

```cpp
FieldSpec &min(FieldT v, std::string message = "value is below minimum")
  requires std::is_arithmetic_v<FieldT>;

FieldSpec &max(FieldT v, std::string message = "value is above maximum")
  requires std::is_arithmetic_v<FieldT>;

FieldSpec &between(
    FieldT a,
    FieldT b,
    std::string message = "value is out of range")
  requires std::is_arithmetic_v<FieldT>;
```

## field

Creates a `FieldSpec<T>`.

```cpp
template <typename FieldT>
[[nodiscard]] FieldSpec<FieldT> field();
```

Example:

```cpp
vix::validation::field<std::string>()
    .required()
    .email()
    .length_max(120)
```

## ParsedSpec

`ParsedSpec<T>` is a fluent rule pack used by schemas for parsed fields.

```cpp
template <typename ParsedT>
class ParsedSpec
{
public:
  ParsedSpec() = default;

  ParsedSpec &rule(Rule<ParsedT> r);

  ParsedSpec &min(
      ParsedT v,
      std::string message = "value is below minimum")
    requires std::is_arithmetic_v<ParsedT>;

  ParsedSpec &max(
      ParsedT v,
      std::string message = "value is above maximum")
    requires std::is_arithmetic_v<ParsedT>;

  ParsedSpec &between(
      ParsedT a,
      ParsedT b,
      std::string message = "value is out of range")
    requires std::is_arithmetic_v<ParsedT>;

  ParsedSpec &parse_message(std::string msg);

  const std::vector<Rule<ParsedT>> &rules() const;
  const std::string &parse_message() const;
};
```

Example:

```cpp
vix::validation::parsed<int>()
    .between(18, 120, "age is out of range")
    .parse_message("age must be a number")
```

## parsed

Creates a `ParsedSpec<T>`.

```cpp
template <typename ParsedT>
[[nodiscard]] ParsedSpec<ParsedT> parsed();
```

## Schema

`Schema<T>` is the object-level validator.

```cpp
template <typename T>
class Schema
{
public:
  using CheckFn =
      std::function<void(const T &, ValidationErrors &)>;

  Schema() = default;

  ValidationResult validate(const T &obj) const;
};
```

A schema stores checks that can validate typed fields, parsed fields, and whole-object constraints.

## Schema::field with callable

Registers a typed field validation using a callable.

```cpp
template <typename FieldT, typename F>
Schema &field(
    std::string field_name,
    FieldT T::*member,
    F &&fn);
```

The callable must return either:

```cpp
ValidationResult
```

or:

```cpp
Validator<FieldT>
```

Example:

```cpp
#include <string>
#include <vix/validation.hpp>

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
                .required()
                .email();
          });
}
```

## Schema::field with FieldSpec

Registers a typed field validation using a `FieldSpec`.

```cpp
template <typename FieldT>
Schema &field(
    std::string field_name,
    FieldT T::*member,
    FieldSpec<FieldT> spec);
```

Example:

```cpp
#include <string>
#include <vix/validation.hpp>

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
              .required()
              .email()
              .length_max(120))
      .field(
          "password",
          &RegisterInput::password,
          vix::validation::field<std::string>()
              .required()
              .length_min(8)
              .length_max(64));
}
```

## Schema::parsed with callable

Registers parsed field validation using a callable.

```cpp
template <typename ParsedT, typename FieldT, typename F>
Schema &parsed(
    std::string field_name,
    FieldT T::*member,
    F &&fn)
  requires(
      std::is_same_v<FieldT, std::string> ||
      std::is_same_v<FieldT, std::string_view>);
```

The callable must return either:

```cpp
ValidationResult
```

or:

```cpp
ParsedValidator<ParsedT>
```

Example:

```cpp
#include <string>
#include <vix/validation.hpp>

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
```

## Schema::parsed with ParsedSpec

Registers parsed field validation using a `ParsedSpec`.

```cpp
template <typename ParsedT, typename FieldT>
Schema &parsed(
    std::string field_name,
    FieldT T::*member,
    ParsedSpec<ParsedT> spec)
  requires(
      std::is_same_v<FieldT, std::string> ||
      std::is_same_v<FieldT, std::string_view>);
```

Example:

```cpp
#include <string>
#include <vix/validation.hpp>

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
```

## Schema::check

Registers a whole-object validation check.

```cpp
template <typename F>
Schema &check(F &&fn);
```

The callable may have either of these signatures:

```cpp
void(const T &obj, ValidationErrors &out)
```

or:

```cpp
ValidationResult(const T &obj)
```

Example:

```cpp
#include <string>
#include <vix/validation.hpp>

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
              .required()
              .length_min(8))
      .field(
          "confirm_password",
          &RegisterInput::confirm_password,
          vix::validation::field<std::string>()
              .required())
      .check([](const RegisterInput &input,
                vix::validation::ValidationErrors &errors)
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
```

## Schema::validate

Executes all checks and returns accumulated errors.

```cpp
[[nodiscard]] ValidationResult
validate(const T &obj) const;
```

Example:

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

  if (!result.ok())
  {
    vix::print("errors:", result.size());
  }

  return 0;
}
```

## schema

Creates an empty schema for a type.

```cpp
template <typename T>
[[nodiscard]] Schema<T> schema();
```

Example:

```cpp
auto s = vix::validation::schema<MyType>();
```

## BaseModel

`BaseModel<Derived>` is a CRTP base class for schema-driven model validation.

```cpp
template <typename Derived>
class BaseModel
{
public:
  ValidationResult validate() const;
  bool is_valid() const;

  static ValidationResult validate(const Derived &obj);
  static const Schema<Derived> &schema();
};
```

The derived type must provide:

```cpp
static vix::validation::Schema<Derived> schema();
```

Example:

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
    vix::print("invalid input");
  }

  return 0;
}
```

The schema is cached internally and reused across validation calls.

## FormResult

`FormResult<T>` is the value-or-errors result returned by `Form<Derived>`.

```cpp
template <typename T>
class FormResult
{
public:
  FormResult() = default;

  explicit FormResult(T v);
  explicit FormResult(ValidationErrors e);

  explicit operator bool() const;

  const T &value() const;
  T &value();

  const ValidationErrors &errors() const;
  ValidationErrors &errors();
};
```

Use the boolean operator before reading the value.

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

## Form

`Form<Derived>` provides the `bind -> validate -> clean` workflow.

```cpp
template <typename Derived>
class Form
{
public:
  using cleaned_type = /* Derived or Derived::cleaned_type */;

  template <typename Input>
  [[nodiscard]] static FormResult<cleaned_type>
  validate(const Input &in);

  using kv_pair = std::pair<std::string_view, std::string_view>;
  using kv_list = std::initializer_list<kv_pair>;
  using kv_input = std::vector<kv_pair>;

  [[nodiscard]] static FormResult<cleaned_type>
  validate_kv(kv_list kv);

  [[nodiscard]] static const Schema<Derived> &schema();
};
```

The form type must provide:

```cpp
static vix::validation::Schema<Derived> schema();
```

It must also provide one compatible binding contract.

Preferred binding contract:

```cpp
static bool bind(
    Derived &out,
    const Input &in,
    vix::validation::ValidationErrors &errors);
```

Simpler binding contract:

```cpp
static bool bind(
    Derived &out,
    const Input &in);
```

Minimal key-value binding contract:

```cpp
static bool set(
    Derived &out,
    std::string_view field,
    std::string_view value);
```

Optional cleaned output:

```cpp
using cleaned_type = MyCleanType;

MyCleanType clean() const;
```

Example:

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

  vix::print("email:", result.value().email);

  return 0;
}
```

## Complete example

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
      .check([](const RegisterInput &input,
                vix::validation::ValidationErrors &errors)
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

## Summary

| API family                | Main use                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| `ValidationErrorCode`     | Stable semantic validation error codes.                            |
| `ValidationError`         | One validation failure.                                            |
| `ValidationErrors`        | Collection of validation failures.                                 |
| `ValidationResult`        | Result of rule, field, schema, or model validation.                |
| `Rule<T>`                 | One validation rule for a typed value.                             |
| `rules::*`                | Built-in validation rules.                                         |
| `validate(...)`           | Fluent single-field validation.                                    |
| `validate_parsed<T>(...)` | Parse text, then validate the typed value.                         |
| `FieldSpec<T>`            | Rule pack for schema typed fields.                                 |
| `ParsedSpec<T>`           | Rule pack for schema parsed fields.                                |
| `Schema<T>`               | Declarative object validation.                                     |
| `BaseModel<T>`            | CRTP model validation with cached schema.                          |
| `Form<T>`                 | Boundary workflow for binding, validating, and cleaning raw input. |
| `FormResult<T>`           | Value-or-errors result returned by forms.                          |

Use `validate(...)` for one typed field, `validate_parsed<T>(...)` for text input that must become a typed value, `Schema<T>` for reusable object validation, `BaseModel<T>` when a type should own its schema, and `Form<T>` when raw input must be bound and cleaned before use.
