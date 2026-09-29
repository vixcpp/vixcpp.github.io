# Errors

The `os` module uses the same result-based error style as the rest of Vix. Functions that depend on the operating system return `vix::error::Result<T>` values, either directly or through aliases such as `StringResult`, `BoolResult`, `IntResult`, `UIntResult`, and `SizeResult`.

This matters because system calls are not always predictable from application code. A value can be unavailable because the platform does not support the query, because the operating system call failed, because permissions are not sufficient, or because the runtime environment is restricted. The OS module makes those cases explicit instead of hiding them behind empty strings, magic numbers, or platform-specific checks scattered through the application.

## Header

```cpp id="o2xm3n"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## Handling a failed OS result

Most OS functions follow the same pattern: call the function, check `ok()`, then read either the value or the error.

```cpp id="01yyvv"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto hostname = vix::os::hostname();

  if (!hostname.ok())
  {
    vix::eprint("failed to read hostname:", hostname.error().message());
    return 1;
  }

  vix::print("hostname:", hostname.value());

  return 0;
}
```

This style keeps the failure close to the operation that produced it. That is useful for OS code because the same call may succeed on one machine and fail on another depending on the platform, permissions, system configuration, or container environment.

## OS error codes

The OS module defines `OsErrorCode` for errors that come from OS-level operations.

```cpp id="17af9w"
enum class OsErrorCode
{
  None = 0,
  Unsupported,
  SystemCallFailed,
  PermissionDenied,
  NotFound,
  InvalidArgument,
  Unknown
};
```

These codes describe the OS-specific reason before it is converted into the generic Vix error model. They keep the module precise internally while still returning standard `vix::error::Error` values to the caller.

| OS error code                   | Meaning                                                   |
| ------------------------------- | --------------------------------------------------------- |
| `OsErrorCode::None`             | No OS error.                                              |
| `OsErrorCode::Unsupported`      | The operation is not supported on the current platform.   |
| `OsErrorCode::SystemCallFailed` | A system call or platform API failed.                     |
| `OsErrorCode::PermissionDenied` | The operation was blocked by permissions.                 |
| `OsErrorCode::NotFound`         | The requested value or resource could not be found.       |
| `OsErrorCode::InvalidArgument`  | The caller provided an invalid argument.                  |
| `OsErrorCode::Unknown`          | The module could not classify the failure more precisely. |

Application code usually does not need to create these errors directly. They are mainly useful when reading the API reference, writing tests, or implementing new OS helpers inside the module.

## Generic Vix error mapping

OS errors are converted to generic `vix::error::ErrorCode` values so callers can handle them in the same way as errors from other Vix modules.

| OS error code                   | Generic error code                        |
| ------------------------------- | ----------------------------------------- |
| `OsErrorCode::None`             | `vix::error::ErrorCode::Ok`               |
| `OsErrorCode::Unsupported`      | `vix::error::ErrorCode::NotSupported`     |
| `OsErrorCode::SystemCallFailed` | `vix::error::ErrorCode::ExternalError`    |
| `OsErrorCode::PermissionDenied` | `vix::error::ErrorCode::PermissionDenied` |
| `OsErrorCode::NotFound`         | `vix::error::ErrorCode::NotFound`         |
| `OsErrorCode::InvalidArgument`  | `vix::error::ErrorCode::InvalidArgument`  |
| `OsErrorCode::Unknown`          | `vix::error::ErrorCode::Unknown`          |

This mapping is important because it lets application code handle errors at the right level. A low-level OS helper can preserve the OS category, while higher-level code can still react to general conditions such as “not supported”, “not found”, or “permission denied”.

## Error category

OS errors use the `os` error category.

```cpp id="0rxhwy"
auto category = vix::os::os_error_category();
```

The category is useful when an application wants to distinguish where an error came from. For example, an error from the OS module is different from an error produced by a path parser, a filesystem operation, a network request, or an application-specific validator, even when the generic error code is similar.

## Checking for unsupported operations

Some OS queries are platform-dependent. For example, a function may be implemented on Linux, macOS, and Windows, but return `NotSupported` on another target.

```cpp id="ru64jf"
#include <vix/error/ErrorCode.hpp>
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto uptime = vix::os::uptime();

  if (!uptime.ok())
  {
    if (uptime.error().code() == vix::error::ErrorCode::NotSupported)
    {
      vix::eprint("uptime is not supported on this platform");
      return 0;
    }

    vix::eprint("failed to read uptime:", uptime.error().message());
    return 1;
  }

  vix::print("uptime:", uptime.value(), "seconds");

  return 0;
}
```

This pattern is useful when a missing OS feature is acceptable. A diagnostic command, for example, can skip one value and still print the rest of the report. A program that requires the value to run correctly may choose to fail early instead.

## Missing values

Some functions can fail because the requested information cannot be found. `home_dir()` is a good example: the home directory may come from an environment variable or from user account information, and both can be unavailable in unusual runtime environments.

```cpp id="2rv632"
#include <vix/error/ErrorCode.hpp>
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto home = vix::os::home_dir();

  if (!home.ok())
  {
    if (home.error().code() == vix::error::ErrorCode::NotFound)
    {
      vix::eprint("home directory could not be resolved");
      return 1;
    }

    vix::eprint("failed to read home directory:", home.error().message());
    return 1;
  }

  vix::print("home:", home.value());

  return 0;
}
```

A missing directory should be handled deliberately because the returned path often becomes the base for later filesystem operations. Failing close to the lookup usually gives a clearer error than allowing a later file operation to fail with a less obvious path.

## Creating an OS error

The module provides `make_os_error()` for internal helpers and tests that need to create a structured OS error.

```cpp id="ce3hho"
auto error = vix::os::make_os_error(
  vix::os::OsErrorCode::SystemCallFailed,
  "failed to query hostname"
);
```

The function creates a `vix::error::Error` with the mapped generic error code, the `os` category, and the provided message. Most application code should receive these errors from OS functions rather than constructing them directly.

## Converting OS error codes to strings

Use `to_string()` when a diagnostic message needs the symbolic OS error name.

```cpp id="ng21hf"
auto name = vix::os::to_string(vix::os::OsErrorCode::PermissionDenied);

vix::print("os error:", name);
```

The returned strings are stable lowercase names such as `unsupported`, `system_call_failed`, `permission_denied`, `not_found`, and `invalid_argument`. They are useful for diagnostics and tests, but user-facing error messages should usually prefer the message stored in the `vix::error::Error`.

## Practical error handling style

A good OS error handling style depends on whether the value is required or optional. If the value is required for the program to continue, return or fail immediately. If the value is only diagnostic, report the error and keep going.

```cpp id="0anxys"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto platform = vix::os::platform();
  auto hostname = vix::os::hostname();
  auto uptime = vix::os::uptime();

  if (!platform.ok())
  {
    vix::eprint("cannot continue without platform information:", platform.error().message());
    return 1;
  }

  vix::print_named("platform", platform.value());

  if (hostname.ok())
    vix::print_named("hostname", hostname.value());
  else
    vix::eprint("hostname unavailable:", hostname.error().message());

  if (uptime.ok())
    vix::print_named("uptime seconds", uptime.value());
  else
    vix::eprint("uptime unavailable:", uptime.error().message());

  return 0;
}
```

This keeps the code honest. The required value is treated as required. Optional diagnostics are still reported, but they do not make the whole program fail.

## Error API overview

| API                                     | Purpose                                                        |
| --------------------------------------- | -------------------------------------------------------------- |
| `vix::os::OsErrorCode`                  | OS-specific semantic error code.                               |
| `vix::os::os_error_category()`          | Return the `os` error category.                                |
| `vix::os::to_error_code(code)`          | Convert an `OsErrorCode` to a generic `vix::error::ErrorCode`. |
| `vix::os::to_string(code)`              | Convert an `OsErrorCode` to a symbolic string.                 |
| `vix::os::make_os_error(code, message)` | Create a structured `vix::error::Error` for the OS module.     |
| `vix::os::StringResult`                 | Alias for `vix::error::Result<std::string>`.                   |
| `vix::os::BoolResult`                   | Alias for `vix::error::Result<bool>`.                          |
| `vix::os::IntResult`                    | Alias for `vix::error::Result<int>`.                           |
| `vix::os::UIntResult`                   | Alias for `vix::error::Result<unsigned int>`.                  |
| `vix::os::SizeResult`                   | Alias for `vix::error::Result<std::size_t>`.                   |

## Next step

Continue with the API reference for a compact lookup of every public type and function provided by the OS module.
