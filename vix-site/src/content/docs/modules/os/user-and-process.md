# User and Process

The `os` module provides a small set of helpers for reading information about the process that is currently running and the user account behind it. These functions are useful in command-line tools, diagnostics, startup checks, installers, local development utilities, and any application that needs to adapt slightly to the environment where it is executed.

C++ already has access to platform APIs for this kind of information, but those APIs are not the same across systems. On Unix-like platforms, process and user information usually comes from functions such as `getpid`, `getuid`, `getpwuid`, or `geteuid`. On Windows, the same ideas are exposed through different APIs. Vix keeps those differences inside the module and gives application code a small result-based API under `vix::os`.

## Header

```cpp id="77f1i8"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## Current process ID

Use `current_pid()` to get the ID of the current process.

```cpp id="i1pu9h"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto pid = vix::os::current_pid();

  if (!pid.ok())
  {
    vix::eprint("failed to read current process id:", pid.error().message());
    return 1;
  }

  vix::print("pid:", pid.value());

  return 0;
}
```

The process ID is mostly useful for diagnostics and runtime reporting. A server may print it during startup, a test runner may include it in a report, and a tool that launches or supervises processes may need it to identify the current execution.

The value is returned as an `IntResult`, which follows the same `Result<T>` pattern as the rest of the module. In normal environments this query is expected to succeed, but using the result model keeps the API consistent with other OS operations that may fail.

## Current user

Use `current_user()` to read basic information about the user account running the process.

```cpp id="ccjuxy"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto user = vix::os::current_user();

  if (!user.ok())
  {
    vix::eprint("failed to read current user:", user.error().message());
    return 1;
  }

  const auto &info = user.value();

  vix::print("username:", info.username);
  vix::print("home:", info.home_dir);

  if (!info.shell.empty())
    vix::print("shell:", info.shell);

  return 0;
}
```

`current_user()` returns a `UserInfo` value. It contains the login name, the home directory, and the default shell when that value is available. The username and home directory are the most useful fields for application code. The shell field should be treated as optional because it depends on what the platform and user database expose.

```cpp id="u5g5j7"
struct UserInfo
{
  std::string username;
  std::string home_dir;
  std::string shell;
};
```

This function is useful when a program needs to create user-specific files, display diagnostic information, or make a decision based on the current execution context. For example, a local tool may use the username in a report, while a setup command may use the home directory as a base location for configuration.

## Administrative privileges

Use `is_admin()` to check whether the current process has administrative privileges.

```cpp id="qszqjc"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto admin = vix::os::is_admin();

  if (!admin.ok())
  {
    vix::eprint("failed to check privileges:", admin.error().message());
    return 1;
  }

  if (admin.value())
    vix::print("running with administrative privileges");
  else
    vix::print("running as a normal user");

  return 0;
}
```

On Unix-like systems, this means the process is running with an effective user ID of `0`. On Windows, it means the current token belongs to the Administrators group. The exact mechanism is platform-specific, but the value returned by Vix is intentionally simple: `true` when the process is running with administrative privileges, and `false` when it is not.

This check should be used carefully. It is useful before operations that require elevated permissions, but it should not replace proper error handling around the operation itself. A privilege check can tell the program what is likely to happen; the real file, network, or system operation can still fail for another reason.

## A practical startup check

A small application can combine these helpers to print the execution context at startup.

```cpp id="lf5wvh"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto pid = vix::os::current_pid();
  auto user = vix::os::current_user();
  auto admin = vix::os::is_admin();

  vix::print_header("Process");

  if (pid.ok())
    vix::print_named("pid", pid.value());
  else
    vix::eprint("pid:", pid.error().message());

  if (user.ok())
  {
    const auto &info = user.value();

    vix::print_named("username", info.username);
    vix::print_named("home", info.home_dir);

    if (!info.shell.empty())
      vix::print_named("shell", info.shell);
  }
  else
  {
    vix::eprint("user:", user.error().message());
  }

  if (admin.ok())
    vix::print_named("admin", admin.value());
  else
    vix::eprint("admin:", admin.error().message());

  return 0;
}
```

This style works well for diagnostic commands because it avoids treating every missing value as fatal. The program prints what it can read, reports what failed, and leaves the caller with enough context to understand the current process.

## When to use these helpers

Use `current_pid()` when the process needs to identify itself in logs, diagnostic output, or local tooling. Use `current_user()` when the application needs account-level information such as the username or home directory. Use `is_admin()` when an operation may require elevated privileges and the program wants to explain the situation before attempting the operation.

These functions are intentionally small. They expose the common process and user details that Vix applications need without turning the module into a complete account-management or permission framework.

## Next step

Continue with directories to see how the OS module resolves the current user’s home directory and the system temporary directory in a portable way.
