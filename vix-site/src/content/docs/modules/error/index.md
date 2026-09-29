# Error

The Error module gives Vix a common way to represent failures across the runtime, CLI, backend modules, filesystem code, networking code, configuration loading, and other parts of the system. It is built around a small set of types that keep errors explicit without forcing every API to use exceptions as its normal control flow.

In Vix, many operations can fail in expected ways. A file may be missing, a port may be invalid, a network request may time out, a configuration file may be incomplete, or a runtime component may reject an operation because it is in the wrong state. These failures should be easy to return, inspect, log, and propagate. The Error module provides that shared language.

## The basic model

The module separates error handling into three parts.

An `ErrorCode` describes what happened in a stable and machine-readable way. Codes such as `InvalidArgument`, `NotFound`, `Timeout`, `IoError`, `ConfigError`, and `InternalError` give Vix modules a common vocabulary for failure.

An `ErrorCategory` describes the domain where the failure belongs. A validation error and a filesystem error can both be reported clearly without inventing a new error type for every module. Built-in categories include `generic`, `system`, `io`, `network`, `validation`, `config`, `security`, and `internal`.

An `Error` combines the code, the category, and a human-readable message. The code and category are useful for structured handling, while the message explains the concrete failure in a way that can be shown in logs, diagnostics, or developer-facing output.

```cpp
#include <vix/error/Error.hpp>

vix::error::Error err(
  vix::error::ErrorCode::InvalidArgument,
  vix::error::ErrorCategory::validation(),
  "port must be greater than 0"
);
```

A default-constructed `Error` represents success. This makes it possible to use `Error` directly in lower-level APIs that only need to report whether something failed.

```cpp
vix::error::Error err;

if (!err.ok()) {
  // handle failure
}
```

## Returning values with Result

Most APIs that return a value should use `Result<T>`. A `Result<T>` contains either a successful value of type `T` or an `Error`. This keeps failure visible in the function signature and lets the caller decide how to handle it.

```cpp
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

The caller can check the result before accessing the value.

```cpp
auto port = parse_port(8080);

if (!port) {
  const auto& err = port.error();
  // log err.code(), err.category().name(), and err.message()
  return;
}

int value = port.value();
```

The boolean conversion of `Result<T>` means success. The boolean conversion of `Error` means failure. This difference is intentional, but it is worth remembering when reading code that uses both types.

```cpp
if (result) {
  // Result<T> contains a value.
}

if (err) {
  // Error contains a failure.
}
```

## Exceptions when they are needed

Vix uses `Error` and `Result<T>` as the main model for explicit error handling. Some C++ code, however, is already exception-based, and some integration points are easier to express with `throw` and `catch`. For those cases, the module provides `Exception`, a standard `std::exception` wrapper around `Error`.

```cpp
#include <vix/error/Exception.hpp>

throw vix::error::Exception(
  vix::error::ErrorCode::IoError,
  vix::error::ErrorCategory::io(),
  "failed to open file"
);
```

The exception still preserves the structured error object, so code that catches it can inspect the original code, category, and message instead of relying only on `what()`.

## When to use each type

Use `Result<T>` when a function returns a value and failure is part of the normal control flow. This is the common case for parsing, validation, filesystem access, configuration loading, networking, and runtime operations.

Use `Error` directly when the operation does not need to return a value and only needs to report success or failure.

Use `Exception` when interacting with exception-based code paths, or when an error must cross an API boundary that expects `std::exception`.

## Pages in this section

- [Result](./result.md)
- [Error Object](./error-object.md)
- [Error Codes](./error-codes.md)
- [Error Categories](./error-categories.md)
- [Exception Bridge](./exception.md)
- [API Reference](./api-reference.md)

Start with `Result` if you are writing a Vix API that returns a value and needs to report failure explicitly.
