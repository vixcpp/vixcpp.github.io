# API Reference

This page summarizes the public types exposed by the Vix Error module. For the design and usage model, start with the previous pages in this section. This reference is meant for quick lookup while writing or reviewing code.

## Headers

```cpp
#include <vix/error/ErrorCode.hpp>
#include <vix/error/ErrorCategory.hpp>
#include <vix/error/Error.hpp>
#include <vix/error/Result.hpp>
#include <vix/error/Exception.hpp>
```

## Namespace

All public types are declared in the `vix::error` namespace.

```cpp
namespace vix::error
{
}
```

## ErrorCode

```cpp
enum class ErrorCode : std::uint32_t
{
  Ok = 0,
  Unknown,
  InvalidArgument,
  InvalidState,
  NotFound,
  AlreadyExists,
  Timeout,
  Cancelled,
  PermissionDenied,
  Unauthorized,
  Forbidden,
  NotSupported,
  ResourceExhausted,
  OutOfMemory,
  IoError,
  FilesystemError,
  NetworkError,
  ProtocolError,
  ParseError,
  ValidationError,
  ConfigError,
  InternalError,
  NotImplemented,
  ExternalError
};
```

`ErrorCode` is the canonical code used to describe what went wrong. `Ok` represents success. Every other value represents a failure.

## ErrorCategory

```cpp
class ErrorCategory
{
public:
  constexpr explicit ErrorCategory(std::string_view name) noexcept;

  [[nodiscard]] constexpr std::string_view name() const noexcept;

  [[nodiscard]] constexpr bool operator==(const ErrorCategory& other) const noexcept;
  [[nodiscard]] constexpr bool operator!=(const ErrorCategory& other) const noexcept;

  static constexpr ErrorCategory generic() noexcept;
  static constexpr ErrorCategory system() noexcept;
  static constexpr ErrorCategory io() noexcept;
  static constexpr ErrorCategory network() noexcept;
  static constexpr ErrorCategory validation() noexcept;
  static constexpr ErrorCategory config() noexcept;
  static constexpr ErrorCategory security() noexcept;
  static constexpr ErrorCategory internal() noexcept;
};
```

`ErrorCategory` stores a lightweight category name. Built-in categories are returned by static factory methods.

### Constructor

```cpp
constexpr explicit ErrorCategory(std::string_view name) noexcept;
```

Creates a category from a name. The name is stored as a `std::string_view`, so it should refer to stable storage.

```cpp
auto category = vix::error::ErrorCategory("registry");
```

### name

```cpp
[[nodiscard]] constexpr std::string_view name() const noexcept;
```

Returns the category name.

```cpp
auto name = vix::error::ErrorCategory::io().name();
```

### Built-in categories

```cpp
ErrorCategory::generic();
ErrorCategory::system();
ErrorCategory::io();
ErrorCategory::network();
ErrorCategory::validation();
ErrorCategory::config();
ErrorCategory::security();
ErrorCategory::internal();
```

## Error

```cpp
class Error
{
public:
  Error() = default;

  explicit Error(ErrorCode code) noexcept;
  Error(ErrorCode code, std::string message);
  Error(ErrorCode code, ErrorCategory category, std::string message);

  [[nodiscard]] constexpr ErrorCode code() const noexcept;
  [[nodiscard]] constexpr ErrorCategory category() const noexcept;
  [[nodiscard]] std::string_view message() const noexcept;
  [[nodiscard]] const char* message_c_str() const noexcept;

  [[nodiscard]] constexpr bool ok() const noexcept;
  [[nodiscard]] constexpr bool has_error() const noexcept;
  [[nodiscard]] explicit constexpr operator bool() const noexcept;

  [[nodiscard]] bool operator==(const Error& other) const noexcept;
  [[nodiscard]] bool operator!=(const Error& other) const noexcept;
};
```

`Error` stores a code, a category, and a message. A default-constructed `Error` represents success and uses `ErrorCode::Ok`.

### Constructors

```cpp
Error() = default;
```

Creates a success-state error object.

```cpp
vix::error::Error err;

err.ok();        // true
err.has_error(); // false
```

```cpp
explicit Error(ErrorCode code) noexcept;
```

Creates an error with a code. The category defaults to `ErrorCategory::generic()`.

```cpp
vix::error::Error err(vix::error::ErrorCode::Unknown);
```

```cpp
Error(ErrorCode code, std::string message);
```

Creates an error with a code and message. The category defaults to `ErrorCategory::generic()`.

```cpp
vix::error::Error err(
  vix::error::ErrorCode::InvalidArgument,
  "invalid input"
);
```

```cpp
Error(ErrorCode code, ErrorCategory category, std::string message);
```

Creates an error with a code, category, and message.

```cpp
vix::error::Error err(
  vix::error::ErrorCode::ValidationError,
  vix::error::ErrorCategory::validation(),
  "module name cannot be empty"
);
```

### code

```cpp
[[nodiscard]] constexpr ErrorCode code() const noexcept;
```

Returns the stored error code.

### category

```cpp
[[nodiscard]] constexpr ErrorCategory category() const noexcept;
```

Returns the stored error category.

### message

```cpp
[[nodiscard]] std::string_view message() const noexcept;
```

Returns the stored human-readable message as a `std::string_view`.

### message_c_str

```cpp
[[nodiscard]] const char* message_c_str() const noexcept;
```

Returns the stored message as a null-terminated C string. This is mainly useful for interoperability with APIs such as `std::exception::what()`.

### ok

```cpp
[[nodiscard]] constexpr bool ok() const noexcept;
```

Returns `true` when the error represents success.

### has_error

```cpp
[[nodiscard]] constexpr bool has_error() const noexcept;
```

Returns `true` when the error represents a failure.

### Boolean conversion

```cpp
[[nodiscard]] explicit constexpr operator bool() const noexcept;
```

Returns `true` when the object contains an error.

```cpp
if (err) {
  // err represents a failure
}
```

### Equality

```cpp
[[nodiscard]] bool operator==(const Error& other) const noexcept;
[[nodiscard]] bool operator!=(const Error& other) const noexcept;
```

Two errors are equal when their code, category, and message are equal.

## Result

```cpp
template <typename T>
class Result
{
public:
  using value_type = T;
  using error_type = Error;

  Result(const T& value);
  Result(T&& value);

  Result(const Error& error);
  Result(Error&& error);

  [[nodiscard]] bool ok() const noexcept;
  [[nodiscard]] bool has_error() const noexcept;
  [[nodiscard]] explicit operator bool() const noexcept;

  [[nodiscard]] T& value() &;
  [[nodiscard]] const T& value() const &;
  [[nodiscard]] T&& value() &&;

  [[nodiscard]] Error& error() &;
  [[nodiscard]] const Error& error() const &;
  [[nodiscard]] Error&& error() &&;

  template <typename F>
  [[nodiscard]] auto map(F&& fn) const
    -> Result<std::invoke_result_t<F, T>>;

  template <typename F>
  [[nodiscard]] auto and_then(F&& fn) const
    -> decltype(fn(std::declval<T>()));
};
```

`Result<T>` stores either a success value of type `T` or an `Error`. It is the preferred return type for Vix APIs that produce a value and can fail.

The primary template does not support reference types, `Result<Error>`, or `Result<void>`.

### Constructors

```cpp
Result(const T& value);
Result(T&& value);
```

Creates a successful result.

```cpp
vix::error::Result<int> result(42);
```

```cpp
Result(const Error& error);
Result(Error&& error);
```

Creates a failed result. The provided `Error` must represent a real failure. Passing a success-state `Error` throws `std::invalid_argument`.

```cpp
vix::error::Result<int> result(
  vix::error::Error(
    vix::error::ErrorCode::InvalidArgument,
    vix::error::ErrorCategory::validation(),
    "division by zero"
  )
);
```

### ok

```cpp
[[nodiscard]] bool ok() const noexcept;
```

Returns `true` when the result contains a value.

### has_error

```cpp
[[nodiscard]] bool has_error() const noexcept;
```

Returns `true` when the result contains an error.

### Boolean conversion

```cpp
[[nodiscard]] explicit operator bool() const noexcept;
```

Returns `true` when the result contains a value.

```cpp
if (result) {
  // result contains a value
}
```

### value

```cpp
[[nodiscard]] T& value() &;
[[nodiscard]] const T& value() const &;
[[nodiscard]] T&& value() &&;
```

Returns the stored success value. Call this only when `ok()` is true.

```cpp
if (result) {
  int value = result.value();
}
```

### error

```cpp
[[nodiscard]] Error& error() &;
[[nodiscard]] const Error& error() const &;
[[nodiscard]] Error&& error() &&;
```

Returns the stored error. Call this only when `has_error()` is true.

```cpp
if (!result) {
  const auto& err = result.error();
}
```

### map

```cpp
template <typename F>
[[nodiscard]] auto map(F&& fn) const
  -> Result<std::invoke_result_t<F, T>>;
```

Transforms the success value and propagates the error unchanged.

```cpp
auto doubled = result.map([](int value) {
  return value * 2;
});
```

Use `map()` when the next operation cannot fail and only transforms the value.

### and_then

```cpp
template <typename F>
[[nodiscard]] auto and_then(F&& fn) const
  -> decltype(fn(std::declval<T>()));
```

Chains another operation that returns a `Result`.

```cpp
auto result = parse_port("8080")
  .and_then([](int port) {
    return validate_port_range(port);
  });
```

Use `and_then()` when the next operation can also fail.

## Exception

```cpp
class Exception : public std::exception
{
public:
  explicit Exception(Error error) noexcept;

  Exception(ErrorCode code, std::string message) noexcept;
  Exception(ErrorCode code, ErrorCategory category, std::string message) noexcept;

  const char* what() const noexcept override;

  [[nodiscard]] const Error& error() const noexcept;
};
```

`Exception` wraps an `Error` inside a standard C++ exception. It is useful when structured Vix errors need to cross exception-based code paths.

### Constructors

```cpp
explicit Exception(Error error) noexcept;
```

Creates an exception from an existing `Error`.

```cpp
throw vix::error::Exception(
  vix::error::Error(
    vix::error::ErrorCode::IoError,
    vix::error::ErrorCategory::io(),
    "failed to open file"
  )
);
```

```cpp
Exception(ErrorCode code, std::string message) noexcept;
```

Creates an exception from a code and message. The category defaults to `ErrorCategory::generic()`.

```cpp
throw vix::error::Exception(
  vix::error::ErrorCode::InvalidState,
  "runtime has already stopped"
);
```

```cpp
Exception(ErrorCode code, ErrorCategory category, std::string message) noexcept;
```

Creates an exception from a code, category, and message.

```cpp
throw vix::error::Exception(
  vix::error::ErrorCode::IoError,
  vix::error::ErrorCategory::io(),
  "failed to open file"
);
```

### what

```cpp
const char* what() const noexcept override;
```

Returns the wrapped error message as a C string.

### error

```cpp
[[nodiscard]] const Error& error() const noexcept;
```

Returns the wrapped `Error` object.

```cpp
try {
  load_project();
} catch (const vix::error::Exception& ex) {
  const auto& err = ex.error();
}
```

## Minimal example

```cpp
#include <vix/error/Error.hpp>
#include <vix/error/Result.hpp>

vix::error::Result<int> divide(int a, int b)
{
  if (b == 0) {
    return vix::error::Error(
      vix::error::ErrorCode::InvalidArgument,
      vix::error::ErrorCategory::validation(),
      "division by zero"
    );
  }

  return a / b;
}
```

```cpp
auto result = divide(10, 2);

if (!result) {
  const auto& err = result.error();
  return;
}

int value = result.value();
```

This completes the Error module reference.
