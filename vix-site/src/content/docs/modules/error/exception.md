# Exception Bridge

`Exception` is the exception-based bridge for the Vix Error module. It wraps a structured `Error` object inside a standard `std::exception`, so code that uses `throw` and `catch` can still preserve the same error code, category, and message used by the rest of Vix.

The main error-handling model in Vix is explicit: use `Result<T>` when an operation returns a value and can fail, and use `Error` directly when the operation only needs to report success or failure. Exceptions are still useful at some boundaries, especially when integrating with existing C++ code that already expects `std::exception`, or when an error needs to cross a call path where explicit return values are not practical.

```cpp id="dkkm0f"
#include <vix/error/Exception.hpp>

throw vix::error::Exception(
  vix::error::ErrorCode::IoError,
  vix::error::ErrorCategory::io(),
  "failed to open file"
);
```

The important detail is that the structured error is not lost. `what()` exposes the message for normal exception handling, while `error()` gives access to the original `Error` object.

## Throwing a structured error

An exception can be constructed from an existing `Error`.

```cpp id="spx9ym"
#include <vix/error/Error.hpp>
#include <vix/error/Exception.hpp>

vix::error::Error err(
  vix::error::ErrorCode::ConfigError,
  vix::error::ErrorCategory::config(),
  "missing project name in vix.app"
);

throw vix::error::Exception(err);
```

This is useful when a lower-level operation already produced a structured error, but the current boundary needs to expose it through exceptions.

The exception can also be constructed directly from a code and message. In that form, the category defaults to `generic`.

```cpp id="qp43ab"
throw vix::error::Exception(
  vix::error::ErrorCode::InvalidState,
  "runtime has already stopped"
);
```

When the domain is clear, prefer passing the category explicitly. It gives the catch site more context and keeps the error consistent with the rest of the module.

```cpp id="dayjns"
throw vix::error::Exception(
  vix::error::ErrorCode::InvalidState,
  vix::error::ErrorCategory::internal(),
  "runtime has already stopped"
);
```

## Catching the exception

`Exception` derives from `std::exception`, so it can be caught as a normal C++ exception. When the catch site knows it is dealing with Vix errors, catch `vix::error::Exception` first and inspect the structured error.

```cpp id="j7o6xt"
try {
  load_project();
} catch (const vix::error::Exception& ex) {
  const auto& err = ex.error();

  // err.code()
  // err.category().name()
  // err.message()
}
```

`what()` returns the stored error message. This keeps the exception compatible with generic exception handling, logging code, and APIs that only know about `std::exception`.

```cpp id="kt982c"
try {
  load_project();
} catch (const std::exception& ex) {
  // ex.what()
}
```

The structured information is available only when the exception is caught as `vix::error::Exception`. Catching it as `std::exception` is still valid, but only the message is visible through the standard interface.

## Preserving Error information

The purpose of `Exception` is not to replace `Error`. It exists to carry the same `Error` object through exception-based code paths.

```cpp id="u0oz4u"
try {
  throw vix::error::Exception(
    vix::error::ErrorCode::IoError,
    vix::error::ErrorCategory::io(),
    "failed to open file"
  );
} catch (const vix::error::Exception& ex) {
  const auto& err = ex.error();

  if (err.code() == vix::error::ErrorCode::IoError) {
    // handle I/O failure
  }
}
```

This keeps error handling consistent across both styles. A function that returns `Result<T>` and a function that throws `Exception` can still describe failures with the same codes and categories.

## When to use Exception

Use `Exception` when the surrounding API is already exception-based, when a third-party interface expects a `std::exception`, or when explicit error returns would make the boundary harder to use safely.

For normal Vix APIs, prefer `Result<T>` or `Error`. They keep failure visible at the call site and make ordinary control flow easier to reason about. `Exception` is best kept for integration boundaries and places where exception semantics are already part of the design.

## Practical rule

Throw `Exception` only when an exception boundary is the right shape for the API. When you do throw it, include the same structured information you would include in an `Error`: a stable `ErrorCode`, a useful `ErrorCategory`, and a concrete message.

The next page contains the API reference for the Error module.
