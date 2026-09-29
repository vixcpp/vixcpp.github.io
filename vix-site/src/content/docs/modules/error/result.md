# Result

`Result<T>` is the main value-returning error type in the Vix Error module. It represents an operation that can either produce a value of type `T` or fail with a structured `Error`.

This is useful for APIs where failure is part of the normal workflow. Parsing a configuration file, opening a resource, validating input, resolving a path, or preparing a runtime operation can all fail without the program being in an exceptional state. `Result<T>` makes that possibility visible in the function signature and gives the caller a clear place to handle it.

```cpp id="ab3f7k"
#include <vix/error/Result.hpp>
#include <vix/error/Error.hpp>

vix::error::Result<int> parse_port(int port)
{
  if (port <= 0) {
    return vix::error::Error(
      vix::error::ErrorCode::InvalidArgument,
      vix::error::ErrorCategory::validation(),
      "port must be greater than 0"
    );
  }

  return port;
}
```

A `Result<T>` always contains exactly one state: either a value or an error. The successful path stores the value directly, while the failure path stores an `Error` object with a code, a category, and a message.

## Checking the result

Use `ok()` when you want to test explicitly for success. Use `has_error()` when the failure branch is the main thing being checked.

```cpp id="n9y1st"
auto result = parse_port(8080);

if (result.ok()) {
  int port = result.value();
}
```

The boolean conversion of `Result<T>` also means success, so the same check can be written more compactly.

```cpp id="e1m776"
auto result = parse_port(8080);

if (!result) {
  const auto& err = result.error();
  // handle err
  return;
}

int port = result.value();
```

This is different from `Error`, where the boolean conversion means failure. In practice, the distinction reads naturally: a `Result<T>` is true when it contains a usable value, while an `Error` is true when it contains a failure.

## Reading the value

Call `value()` only after checking that the result is successful. The method returns the stored value by reference for normal access, by const reference for const results, and by rvalue reference when the result itself is moved.

```cpp id="hvd2p4"
vix::error::Result<std::string> read_name();

auto result = read_name();

if (!result) {
  return result.error();
}

const std::string& name = result.value();
```

`Result<T>` does not hide the cost of moving or copying. If the stored type is expensive to copy, move the result or design the surrounding API in the same way you would design any other C++ value-returning function.

```cpp id="up8n8f"
std::string name = std::move(result).value();
```

## Reading the error

Call `error()` only when `has_error()` is true or when the result failed a boolean check.

```cpp id="jz8upb"
auto result = parse_port(0);

if (!result) {
  const auto& err = result.error();

  // err.code()
  // err.category().name()
  // err.message()
}
```

The stored error is the same `Error` object returned by the failing operation. This means the code, category, and message are preserved as the error moves through the call chain.

## Returning errors

A function returning `Result<T>` can return a value directly on success and an `Error` on failure.

```cpp id="b0v3ou"
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

`Result<T>` only accepts real failures in its error state. Passing a success-state `Error`, such as a default-constructed `Error`, is rejected because it would make the result ambiguous. A result should either contain a value or contain a failure; it should not contain an error object that means success.

## Transforming values with map

`map()` transforms the success value while preserving the error branch. If the result contains a value, the function is applied and a new `Result` is returned. If the result contains an error, the same error is propagated.

```cpp id="yfgw23"
auto result = divide(10, 2).map([](int value) {
  return value * 2;
});
```

This keeps simple value transformations readable without repeating the same error check after every step. `map()` is best used when the next operation cannot fail and only needs to transform the successful value.

## Chaining operations with and_then

Use `and_then()` when the next operation can also fail and returns another `Result`.

```cpp id="mkudtr"
vix::error::Result<int> parse_port_from_string(const std::string& value);
vix::error::Result<int> validate_port_range(int port);

auto result = parse_port_from_string("8080")
  .and_then([](int port) {
    return validate_port_range(port);
  });
```

If the first operation succeeds, the function passed to `and_then()` is executed. If it fails, the error is propagated into the returned result type. This gives Vix code a simple way to compose fallible operations without turning the main workflow into deeply nested conditionals.

## Type restrictions

`Result<T>` is meant to store concrete success values. It does not support reference types, `Result<Error>`, or `Result<void>` through the primary template.

Reference types are avoided because ownership would be unclear. `Result<Error>` is rejected because an `Error` should be returned directly when it is the only meaningful result. `Result<void>` requires a separate specialization, because a result without a success value needs a slightly different representation.

## Practical rule

Use `Result<T>` when an operation returns a value and can fail in a way the caller is expected to handle. Keep the error message specific, use a stable `ErrorCode`, and choose an `ErrorCategory` that tells the reader where the failure belongs.

The next page explains the `Error` object itself: how codes, categories, and messages are stored together.
