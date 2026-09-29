# API Reference

This page lists the public API exposed by the `os` module. The module lives in the `vix::os` namespace and provides small, portable helpers for reading platform information, user and process information, common directories, basic system resources, and simple blocking sleep delays.

For normal application code, include the public OS header:

```cpp id="43t7fs"
#include <vix/os.hpp>
```

For examples that print values, include the Vix print API:

```cpp id="qjta63"
#include <vix/print.hpp>
```

## Namespace

All OS module APIs are available under:

```cpp id="qgx8pj"
namespace vix::os
```

## Result aliases

Most OS functions return `vix::error::Result<T>`. The module defines a few aliases to keep the function signatures readable.

```cpp id="8q7r1k"
using StringResult = vix::error::Result<std::string>;
using BoolResult   = vix::error::Result<bool>;
using IntResult    = vix::error::Result<int>;
using UIntResult   = vix::error::Result<unsigned int>;
using SizeResult   = vix::error::Result<std::size_t>;
```

These aliases do not introduce a different error model. They are only named forms of `Result<T>` for common OS return types.

| Alias          | Meaning                                |
| -------------- | -------------------------------------- |
| `StringResult` | A result containing a `std::string`.   |
| `BoolResult`   | A result containing a `bool`.          |
| `IntResult`    | A result containing an `int`.          |
| `UIntResult`   | A result containing an `unsigned int`. |
| `SizeResult`   | A result containing a `std::size_t`.   |

## Platform and system identity

### `platform`

```cpp id="y2c336"
[[nodiscard]] StringResult platform();
```

Returns the current platform name.

Typical values are:

```text id="9zn4e5"
linux
windows
macos
freebsd
unknown
```

`unknown` is a valid successful value. It means the platform was not recognized by the current compile-time checks.

```cpp id="za3x7z"
auto result = vix::os::platform();

if (result.ok())
  vix::print("platform:", result.value());
```

### `arch`

```cpp id="gmxl92"
[[nodiscard]] StringResult arch();
```

Returns the current CPU architecture name.

Typical values are:

```text id="erglmn"
x86_64
x86
arm64
arm
riscv64
riscv32
unknown
```

The value is useful for diagnostics and broad runtime decisions. It should not be treated as a complete CPU feature detector.

```cpp id="z08qps"
auto result = vix::os::arch();

if (result.ok())
  vix::print("architecture:", result.value());
```

### `kernel_version`

```cpp id="e7d0ge"
[[nodiscard]] StringResult kernel_version();
```

Returns the current kernel or operating system version string when the platform supports the query.

```cpp id="4u5n7s"
auto result = vix::os::kernel_version();

if (result.ok())
  vix::print("kernel:", result.value());
else
  vix::eprint("kernel version unavailable:", result.error().message());
```

This function can fail with `NotSupported` when the current platform is not supported by the implementation.

### `hostname`

```cpp id="ilckh5"
[[nodiscard]] StringResult hostname();
```

Returns the current machine hostname.

```cpp id="n4m4n0"
auto result = vix::os::hostname();

if (result.ok())
  vix::print("hostname:", result.value());
```

The hostname is mainly useful for diagnostics, startup output, and local tools that need to identify where a process is running.

## User and process

### `current_pid`

```cpp id="3fbc0x"
[[nodiscard]] IntResult current_pid();
```

Returns the current process ID.

```cpp id="jgci6w"
auto result = vix::os::current_pid();

if (result.ok())
  vix::print("pid:", result.value());
```

### `current_user`

```cpp id="bpc7km"
[[nodiscard]] vix::error::Result<UserInfo> current_user();
```

Returns basic information about the current user.

```cpp id="u6scba"
auto result = vix::os::current_user();

if (result.ok())
{
  const auto &user = result.value();

  vix::print("username:", user.username);
  vix::print("home:", user.home_dir);

  if (!user.shell.empty())
    vix::print("shell:", user.shell);
}
```

The returned value is a `UserInfo` structure.

```cpp id="qlijui"
struct UserInfo
{
  std::string username;
  std::string home_dir;
  std::string shell;
};
```

The `shell` field depends on the platform and runtime environment. Code that uses it should allow it to be empty.

### `is_admin`

```cpp id="ew07v6"
[[nodiscard]] BoolResult is_admin();
```

Checks whether the current process is running with administrative privileges.

```cpp id="e8h74l"
auto result = vix::os::is_admin();

if (result.ok())
  vix::print("admin:", result.value());
```

On Unix-like systems, this checks whether the effective user ID is `0`. On Windows, it checks whether the current token belongs to the Administrators group.

## Directories

### `home_dir`

```cpp id="vylvxe"
[[nodiscard]] StringResult home_dir();
```

Returns the current user’s home directory.

```cpp id="2987d9"
auto result = vix::os::home_dir();

if (result.ok())
  vix::print("home:", result.value());
else
  vix::eprint("home directory unavailable:", result.error().message());
```

The function may use environment variables or user account information depending on the platform.

### `temp_dir`

```cpp id="pqvx5t"
[[nodiscard]] StringResult temp_dir();
```

Returns the system temporary directory.

```cpp id="vj4khz"
auto result = vix::os::temp_dir();

if (result.ok())
  vix::print("temp:", result.value());
```

On Unix-like systems, the function checks common temporary directory environment variables and can fall back to `/tmp`. On Windows, it uses the platform temporary path API.

## System resources

### `cpu_count`

```cpp id="p2kn4u"
[[nodiscard]] UIntResult cpu_count();
```

Returns the number of available logical CPUs.

```cpp id="uz3ega"
auto result = vix::os::cpu_count();

if (result.ok())
  vix::print("logical cpus:", result.value());
```

The result is useful as a default for worker counts and diagnostics, but application configuration should still be allowed to override it when the workload requires a different value.

### `page_size`

```cpp id="ars60v"
[[nodiscard]] SizeResult page_size();
```

Returns the system memory page size in bytes.

```cpp id="y2sa8f"
auto result = vix::os::page_size();

if (result.ok())
  vix::print("page size:", result.value(), "bytes");
```

This value is mostly useful in lower-level memory work, runtime diagnostics, and system-aware tools.

### `uptime`

```cpp id="dmyqwa"
[[nodiscard]] vix::error::Result<std::uint64_t> uptime();
```

Returns the system uptime in seconds when supported.

```cpp id="fqnlk2"
auto result = vix::os::uptime();

if (result.ok())
  vix::print("uptime:", result.value(), "seconds");
else
  vix::eprint("uptime unavailable:", result.error().message());
```

This function can fail when the platform does not support the query through the current implementation.

## Sleep helpers

### `sleep_for_ms`

```cpp id="yhl9y3"
void sleep_for_ms(std::uint64_t milliseconds);
```

Blocks the current thread for the given number of milliseconds.

```cpp id="2cql0o"
vix::print("waiting");
vix::os::sleep_for_ms(500);
vix::print("done");
```

### `sleep_for_seconds`

```cpp id="nqxll6"
void sleep_for_seconds(std::uint64_t seconds);
```

Blocks the current thread for the given number of seconds.

```cpp id="7eehaf"
vix::print("waiting before retry");
vix::os::sleep_for_seconds(1);
vix::print("retrying");
```

The sleep helpers do not return `Result` values. They are simple blocking delays built on the standard C++ thread facilities.

## Data structures

### `OsInfo`

```cpp id="uu2yvk"
struct OsInfo
{
  std::string platform;
  std::string architecture;
  std::string kernel_version;
  std::string hostname;
};
```

Represents basic operating system identity information.

The structure is available as a public type, but the current public function set shown in this module exposes the individual queries directly through `platform()`, `arch()`, `kernel_version()`, and `hostname()`.

### `UserInfo`

```cpp id="hnop4i"
struct UserInfo
{
  std::string username;
  std::string home_dir;
  std::string shell;
};
```

Represents basic information about the current user.

This structure is returned by `current_user()`.

### `CpuInfo`

```cpp id="8pe8lj"
struct CpuInfo
{
  std::string model;
  std::uint32_t cores{0};
  std::uint32_t threads{0};
};
```

Represents basic CPU information.

The structure is part of the public OS type set. The current resource query exposed by the module for CPU availability is `cpu_count()`.

### `MemoryInfo`

```cpp id="y763wp"
struct MemoryInfo
{
  std::uint64_t total_bytes{0};
  std::uint64_t available_bytes{0};
};
```

Represents basic system memory information.

The structure is part of the public OS type set. The current public resource helpers shown here do not expose a direct `memory_info()` query.

## OS errors

### `OsErrorCode`

```cpp id="q14txl"
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

Represents semantic OS-level error cases before they are mapped into the generic Vix error model.

| Value              | Meaning                                                 |
| ------------------ | ------------------------------------------------------- |
| `None`             | No OS error.                                            |
| `Unsupported`      | The operation is not supported on the current platform. |
| `SystemCallFailed` | A system call or platform API failed.                   |
| `PermissionDenied` | The operation was blocked by permissions.               |
| `NotFound`         | The requested value or resource could not be found.     |
| `InvalidArgument`  | The caller provided an invalid argument.                |
| `Unknown`          | The failure could not be classified more precisely.     |

### `os_error_category`

```cpp id="dkd0vt"
[[nodiscard]] inline constexpr vix::error::ErrorCategory
os_error_category() noexcept;
```

Returns the OS module error category.

```cpp id="msgmk2"
auto category = vix::os::os_error_category();
```

The category name is `os`.

### `to_error_code`

```cpp id="aeen7p"
[[nodiscard]] inline constexpr vix::error::ErrorCode
to_error_code(OsErrorCode code) noexcept;
```

Converts an `OsErrorCode` to the generic `vix::error::ErrorCode`.

| OS error code                   | Generic error code                        |
| ------------------------------- | ----------------------------------------- |
| `OsErrorCode::None`             | `vix::error::ErrorCode::Ok`               |
| `OsErrorCode::Unsupported`      | `vix::error::ErrorCode::NotSupported`     |
| `OsErrorCode::SystemCallFailed` | `vix::error::ErrorCode::ExternalError`    |
| `OsErrorCode::PermissionDenied` | `vix::error::ErrorCode::PermissionDenied` |
| `OsErrorCode::NotFound`         | `vix::error::ErrorCode::NotFound`         |
| `OsErrorCode::InvalidArgument`  | `vix::error::ErrorCode::InvalidArgument`  |
| `OsErrorCode::Unknown`          | `vix::error::ErrorCode::Unknown`          |

### `to_string`

```cpp id="cl351h"
[[nodiscard]] inline const char *to_string(OsErrorCode code) noexcept;
```

Converts an `OsErrorCode` to a stable symbolic string.

```cpp id="nqyxc2"
auto name = vix::os::to_string(vix::os::OsErrorCode::SystemCallFailed);

vix::print("os error:", name);
```

Typical returned values include:

```text id="9s23eh"
none
unsupported
system_call_failed
permission_denied
not_found
invalid_argument
unknown
```

### `make_os_error`

```cpp id="7r26ll"
[[nodiscard]] inline vix::error::Error
make_os_error(OsErrorCode code, std::string message);
```

Creates a structured `vix::error::Error` for the OS module.

```cpp id="kjk1op"
auto error = vix::os::make_os_error(
  vix::os::OsErrorCode::SystemCallFailed,
  "failed to query hostname"
);
```

This helper is mostly useful inside OS module implementations and tests. Application code usually receives these errors from public OS functions.

## Complete API overview

| API                                     | Return type             | Purpose                                                  |
| --------------------------------------- | ----------------------- | -------------------------------------------------------- |
| `vix::os::platform()`                   | `StringResult`          | Return the current platform name.                        |
| `vix::os::arch()`                       | `StringResult`          | Return the current CPU architecture name.                |
| `vix::os::kernel_version()`             | `StringResult`          | Return the kernel or OS version string.                  |
| `vix::os::hostname()`                   | `StringResult`          | Return the current machine hostname.                     |
| `vix::os::current_pid()`                | `IntResult`             | Return the current process ID.                           |
| `vix::os::current_user()`               | `Result<UserInfo>`      | Return information about the current user.               |
| `vix::os::is_admin()`                   | `BoolResult`            | Check whether the process has administrative privileges. |
| `vix::os::home_dir()`                   | `StringResult`          | Return the current user’s home directory.                |
| `vix::os::temp_dir()`                   | `StringResult`          | Return the system temporary directory.                   |
| `vix::os::cpu_count()`                  | `UIntResult`            | Return the number of available logical CPUs.             |
| `vix::os::page_size()`                  | `SizeResult`            | Return the system memory page size in bytes.             |
| `vix::os::uptime()`                     | `Result<std::uint64_t>` | Return system uptime in seconds.                         |
| `vix::os::sleep_for_ms(milliseconds)`   | `void`                  | Block the current thread for milliseconds.               |
| `vix::os::sleep_for_seconds(seconds)`   | `void`                  | Block the current thread for seconds.                    |
| `vix::os::os_error_category()`          | `ErrorCategory`         | Return the OS error category.                            |
| `vix::os::to_error_code(code)`          | `ErrorCode`             | Convert an OS error code to a generic Vix error code.    |
| `vix::os::to_string(code)`              | `const char *`          | Convert an OS error code to a symbolic string.           |
| `vix::os::make_os_error(code, message)` | `Error`                 | Create a structured OS error.                            |

## Related pages

Use the topic pages when you need more explanation around a specific group of APIs:

- [Platform and Architecture](/modules/os/platform-and-architecture)
- [User and Process](/modules/os/user-and-process)
- [Directories](/modules/os/directories)
- [System Resources](/modules/os/system-resources)
- [Sleep](/modules/os/sleep)
- [Errors](/modules/os/errors)
