# Error Object

`Error` is the structured error object used by the Vix Error module. It stores three pieces of information: an `ErrorCode`, an `ErrorCategory`, and a human-readable message. Together, they describe what failed, where the failure belongs, and what concrete detail should be shown to a developer.

The object is intentionally small. It is meant to be easy to construct, return, compare, log, and preserve across module boundaries. Lower-level code can return an `Error` directly when it does not need to produce a value, while value-returning APIs usually wrap it inside `Result<T>`.

```cpp id="bv6mbe"
#include <vix/error/Error.hpp>

vix::error::Error err(
  vix::error::ErrorCode::InvalidArgument,
  vix::error::ErrorCategory::validation(),
  "port must be greater than 0"
);
```

## Success and failure

A default-constructed `Error` represents success. Its code is `ErrorCode::Ok`, its category is `ErrorCategory::generic()`, and its message is empty.

```cpp id="ggvk4h"
vix::error::Error err;

if (err.ok()) {
  // no error
}
```

This design makes `Error` useful for APIs that only need to report whether an operation failed. The caller can check `ok()` when reading for success, or `has_error()` when reading for failure.

```cpp id="kbd9t2"
if (err.has_error()) {
  // handle failure
}
```

The boolean conversion follows the failure-oriented meaning of the object. An `Error` converts to `true` when it contains a real error, and to `false` when it represents success.

```cpp id="wqswqo"
if (err) {
  // err contains a failure
}
```

This is different from `Result<T>`, where the boolean conversion means success. The difference comes from the role of each type: `Error` describes a failure state, while `Result<T>` describes a successful value-or-error state.

## Codes, categories, and messages

The error code is the stable part of the object. It gives the failure a known meaning that can be checked in code.

```cpp id="mv4dls"
if (err.code() == vix::error::ErrorCode::NotFound) {
  // handle missing resource
}
```

The category gives the failure a broader domain. This is useful when different modules report similar kinds of failures, but the caller still wants to understand where the problem came from.

```cpp id="xvnnre"
if (err.category() == vix::error::ErrorCategory::io()) {
  // handle I/O-related failure
}
```

The message explains the concrete failure. It should be written for a developer reading logs, diagnostics, or command output. A good message is specific enough to be useful, but it should not try to replace the code and category.

```cpp id="he1fnc"
std::string_view message = err.message();
```

For APIs that need a C string, such as `std::exception::what()`, `message_c_str()` returns a null-terminated pointer to the stored message.

```cpp id="p95g63"
const char* text = err.message_c_str();
```

## Constructing errors

An `Error` can be constructed with only an `ErrorCode`, with an `ErrorCode` and a message, or with the full code, category, and message.

```cpp id="l3a7zg"
using namespace vix::error;

Error unknown(ErrorCode::Unknown);

Error invalid(
  ErrorCode::InvalidArgument,
  "invalid input"
);

Error config(
  ErrorCode::ConfigError,
  ErrorCategory::config(),
  "missing application name"
);
```

When the category is not provided, it defaults to `generic`. This keeps small errors easy to create, while still allowing more precise classification when the caller has enough context.

In most Vix code, prefer the full constructor when the failure belongs clearly to a domain such as validation, I/O, network, configuration, security, or internal runtime behavior. The extra category makes logs and diagnostics easier to understand without making the call site complicated.

## Comparing errors

`Error` supports equality and inequality comparison. Two errors are equal when their code, category, and message are all equal.

```cpp id="dne082"
using namespace vix::error;

Error a(
  ErrorCode::IoError,
  ErrorCategory::io(),
  "failed to read file"
);

Error b(
  ErrorCode::IoError,
  ErrorCategory::io(),
  "failed to read file"
);

if (a == b) {
  // same structured error
}
```

This is mostly useful in tests and in code that needs to verify a precise failure. In normal application flow, checking the code or category is often enough.

## Returning Error directly

Use `Error` directly when the operation does not need to return a success value.

```cpp id="qzawna"
vix::error::Error validate_port(int port)
{
  if (port <= 0) {
    return vix::error::Error(
      vix::error::ErrorCode::InvalidArgument,
      vix::error::ErrorCategory::validation(),
      "port must be greater than 0"
    );
  }

  return {};
}
```

The empty return creates a success-state `Error`. This pattern keeps simple validation and setup functions direct: success is represented by `ErrorCode::Ok`, and failure carries the structured details the caller needs.

```cpp id="n4fl8q"
auto err = validate_port(0);

if (err) {
  // handle err
}
```

## Practical rule

Use `Error` as the common failure object. Choose a stable `ErrorCode`, choose an `ErrorCategory` that describes the domain, and write a message that explains the concrete reason for the failure. When the function also needs to return a value, wrap the error in `Result<T>` instead of inventing a separate return convention.

The next page lists the built-in error codes and explains when each one should be used.
