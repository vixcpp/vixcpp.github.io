# Platform and Architecture

The `os` module can identify the platform and CPU architecture of the machine running the program. These values are often needed when a tool prints diagnostics, chooses a platform-specific path, selects an optimized code path, or records enough context to understand where a program was executed.

Vix keeps these checks behind small functions in `vix::os`, so application code does not need to spread compiler macros such as `_WIN32`, `__linux__`, `__APPLE__`, or architecture-specific branches across the project. The result is not meant to replace a build system or a full platform abstraction layer. It gives the application a clean way to ask basic questions about the system and handle the answer through the same `Result` model used by other Vix modules.

## Header

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## Platform name

Use `platform()` to read the current platform name.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto result = vix::os::platform();

  if (!result.ok())
  {
    vix::eprint("failed to read platform:", result.error().message());
    return 1;
  }

  vix::print("platform:", result.value());

  return 0;
}
```

The function returns a short lowercase name. Current values include:

```text
linux
windows
macos
freebsd
unknown
```

The `unknown` value is still a successful result. It means the module could not match the current target to one of the known platform names at compile time. This is different from a failed result, where the function could not provide a value because an operation itself failed.

## CPU architecture

Use `arch()` to read the CPU architecture name.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto result = vix::os::arch();

  if (!result.ok())
  {
    vix::eprint("failed to read architecture:", result.error().message());
    return 1;
  }

  vix::print("architecture:", result.value());

  return 0;
}
```

The function returns a short architecture name. Current values include:

```text
x86_64
x86
arm64
arm
riscv64
riscv32
unknown
```

This value is useful for diagnostics and runtime decisions that only need a broad architecture category. It should not be treated as a full CPU feature detector. If a program needs to know about instruction sets, SIMD support, cache layout, or vendor-specific capabilities, that should be handled by a more specialized layer.

## Kernel version

Use `kernel_version()` when the application needs the operating system or kernel version string.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto result = vix::os::kernel_version();

  if (!result.ok())
  {
    vix::eprint("kernel version unavailable:", result.error().message());
    return 1;
  }

  vix::print("kernel:", result.value());

  return 0;
}
```

Unlike `platform()` and `arch()`, this function may need to ask the operating system at runtime. On Unix-like platforms, it can use the system `uname` information. On Windows, it uses the Windows version API available to the module. On unsupported platforms, the function returns a structured error instead of inventing a value.

Kernel version strings should be used with care. They are useful in logs, support reports, and diagnostics, but they are not always a stable way to decide whether a feature exists. Prefer direct feature checks when the program depends on a specific capability.

## Hostname

Use `hostname()` to read the current machine hostname.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto result = vix::os::hostname();

  if (!result.ok())
  {
    vix::eprint("failed to read hostname:", result.error().message());
    return 1;
  }

  vix::print("hostname:", result.value());

  return 0;
}
```

The hostname is mainly useful for diagnostics, development tools, test output, and server startup information. It can help identify where a process is running, especially when the same program is deployed across several machines or containers.

## Building a small system identity summary

A common use of these functions is to print a compact identity summary at startup or inside a diagnostic command.

```cpp
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto platform = vix::os::platform();
  auto arch = vix::os::arch();
  auto kernel = vix::os::kernel_version();
  auto hostname = vix::os::hostname();

  vix::print_header("System identity");

  if (platform.ok())
    vix::print_named("platform", platform.value());
  else
    vix::eprint("platform:", platform.error().message());

  if (arch.ok())
    vix::print_named("architecture", arch.value());
  else
    vix::eprint("architecture:", arch.error().message());

  if (kernel.ok())
    vix::print_named("kernel", kernel.value());
  else
    vix::eprint("kernel:", kernel.error().message());

  if (hostname.ok())
    vix::print_named("hostname", hostname.value());
  else
    vix::eprint("hostname:", hostname.error().message());

  return 0;
}
```

This pattern keeps the program tolerant of missing information. Platform and architecture are expected to succeed on supported builds, but kernel version and hostname can still fail depending on the operating system, runtime permissions, or execution environment.

## Handling `unknown`

`unknown` is a valid value for platform and architecture detection. It is useful because it lets a program continue running on a platform that Vix does not recognize yet, while still making that situation visible to the caller.

```cpp
auto platform = vix::os::platform();

if (!platform.ok())
{
  vix::eprint("platform detection failed:", platform.error().message());
  return 1;
}

if (platform.value() == "unknown")
{
  vix::eprint("running on an unknown platform");
}
else
{
  vix::print("platform:", platform.value());
}
```

Use this distinction when the difference matters. A failed result means the function could not produce a value. An `unknown` value means the function produced a value, but the current target was not recognized by the module.

## Next step

Continue with user and process information to read the current process ID, current user details, and administrative privilege state.
