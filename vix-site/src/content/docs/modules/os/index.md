# OS

The `os` module provides a small system layer for Vix applications that need to read information about the machine they are running on. It gives access to common operating system details such as the platform name, CPU architecture, hostname, current process ID, current user, home directory, temporary directory, page size, CPU count, uptime, and simple sleep helpers.

This module exists because many C++ programs eventually need a few pieces of system information, but the native APIs are different on Linux, macOS, and Windows. A program that only wants to know the current platform or resolve the user’s home directory should not have to expose `unistd.h`, `windows.h`, `/proc`, `sysctl`, or platform-specific branches throughout the application. The `os` module keeps that logic behind a small Vix API and returns structured results when a system call can fail.

## Header

Use the OS module through the public OS header:

```cpp
#include <vix/os.hpp>
```

Some internal headers are available under `vix/os/...`, but application code should prefer the public module header unless it has a specific reason to include only one function group.

## Basic example

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto platform = vix::os::platform();
  auto arch = vix::os::arch();
  auto hostname = vix::os::hostname();

  if (!platform.ok())
  {
    vix::eprint("failed to read platform:", platform.error().message());
    return 1;
  }

  if (!arch.ok())
  {
    vix::eprint("failed to read architecture:", arch.error().message());
    return 1;
  }

  if (!hostname.ok())
  {
    vix::eprint("failed to read hostname:", hostname.error().message());
    return 1;
  }

  vix::print("platform:", platform.value());
  vix::print("architecture:", arch.value());
  vix::print("hostname:", hostname.value());

  return 0;
}
```

Most OS queries return a `vix::error::Result<T>`. This keeps the API explicit: a value may be available, or the operating system call may fail because the information is unsupported, unavailable, or blocked by the current environment. The caller decides how to handle that case instead of relying on exceptions or silently returning an empty value.

## What the module covers

The OS module is intentionally focused on information that is useful in ordinary application code. It can identify the current platform and CPU architecture, inspect the current user and process, resolve common directories, and read basic system resource values.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto pid = vix::os::current_pid();
  auto home = vix::os::home_dir();
  auto cpu_count = vix::os::cpu_count();

  if (pid.ok())
    vix::print("pid:", pid.value());

  if (home.ok())
    vix::print("home:", home.value());

  if (cpu_count.ok())
    vix::print("cpus:", cpu_count.value());

  return 0;
}
```

The module does not try to become a full POSIX or Windows abstraction layer. Its role is narrower: provide stable, practical helpers for the information Vix applications commonly need during startup, diagnostics, configuration, tests, and small system-aware tools.

## Result-based API

Functions that can fail return one of the OS result aliases, such as `StringResult`, `BoolResult`, `IntResult`, `UIntResult`, or `SizeResult`. These aliases are built on top of `vix::error::Result<T>`, so they follow the same pattern as other Vix modules that use structured errors.

```cpp
auto uptime = vix::os::uptime();

if (!uptime.ok())
{
  vix::eprint("uptime unavailable:", uptime.error().message());
  return 1;
}

vix::print("uptime seconds:", uptime.value());
```

This style is useful for system code because failure is often normal. A value may be unsupported on a platform, unavailable in a container, or dependent on an environment variable that is not set. Returning `Result<T>` makes those cases visible without forcing every caller into platform-specific code.

## Main areas

The module is organized around a few practical groups.

Platform and architecture functions describe where the program is running. `platform()` returns values such as `linux`, `windows`, `macos`, `freebsd`, or `unknown`, while `arch()` returns values such as `x86_64`, `x86`, `arm64`, `arm`, `riscv64`, `riscv32`, or `unknown`. `kernel_version()` and `hostname()` provide additional machine details when they are available.

User and process functions expose information about the current execution context. `current_pid()` returns the current process ID, `current_user()` returns a `UserInfo` structure with the username, home directory, and shell when available, and `is_admin()` checks whether the current process is running with administrative privileges.

Directory helpers resolve common filesystem locations. `home_dir()` returns the current user’s home directory, while `temp_dir()` returns the system temporary directory. These functions hide the platform differences between environment variables, user database lookups, and Windows directory APIs.

System resource helpers expose small values that are often needed when configuring workloads. `cpu_count()` returns the number of available logical CPUs, `page_size()` returns the memory page size in bytes, and `uptime()` returns the system uptime in seconds when the platform supports it.

The module also includes `sleep_for_ms()` and `sleep_for_seconds()` for simple blocking delays.

## Next step

Start with the quick start page if you want to use the module immediately, then move to the topic pages for platform information, user and process details, directories, system resources, sleep helpers, and OS-specific errors.
