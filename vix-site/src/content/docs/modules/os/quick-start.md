# Quick Start

The `os` module is useful when an application needs to read basic information from the system without writing platform-specific code in the application itself. Instead of checking compiler macros or calling operating system APIs directly, the program asks `vix::os` for the value it needs and handles the result in the same style as other Vix modules.

## Include the module

Use the public OS header together with `vix::print` for simple output in examples and small tools.

```cpp id="rwcctm"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

Most functions in this module return a `vix::error::Result<T>`. This matters because system information is not always guaranteed to be available. A platform may not support a specific query, a system call may fail, or the runtime environment may not expose the value in the usual way. The quick-start pattern is therefore to call the function, check `ok()`, then read the value.

## Read platform information

```cpp id="z55k5i"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto platform = vix::os::platform();
  auto arch = vix::os::arch();

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

  vix::print("platform:", platform.value());
  vix::print("architecture:", arch.value());

  return 0;
}
```

`platform()` returns a short platform name such as `linux`, `windows`, `macos`, `freebsd`, or `unknown`. `arch()` returns the CPU architecture detected at compile time, such as `x86_64`, `arm64`, `arm`, `riscv64`, or `unknown`.

## Read machine details

Some programs need a little more context about the machine where they are running. This is common in diagnostics, local development tools, startup logs, test reports, and runtime checks.

```cpp id="fmkjzh"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto hostname = vix::os::hostname();
  auto kernel = vix::os::kernel_version();

  if (hostname.ok())
    vix::print("hostname:", hostname.value());
  else
    vix::eprint("hostname unavailable:", hostname.error().message());

  if (kernel.ok())
    vix::print("kernel:", kernel.value());
  else
    vix::eprint("kernel version unavailable:", kernel.error().message());

  return 0;
}
```

The example does not fail the whole program when a value is unavailable. That is often the right choice for diagnostics: print what can be read, report what cannot, and let the application continue when the missing value is not essential.

## Read the current user and process

The current user and process helpers are useful when a program needs to know who is running it, where the user’s home directory is, or whether the process has administrative privileges.

```cpp id="gbxm7l"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto pid = vix::os::current_pid();
  auto user = vix::os::current_user();
  auto admin = vix::os::is_admin();

  if (pid.ok())
    vix::print("pid:", pid.value());

  if (user.ok())
  {
    const auto &info = user.value();

    vix::print("username:", info.username);
    vix::print("home:", info.home_dir);

    if (!info.shell.empty())
      vix::print("shell:", info.shell);
  }

  if (admin.ok())
    vix::print("admin:", admin.value());

  return 0;
}
```

`current_user()` returns a `UserInfo` structure. The username and home directory are the most commonly useful fields. The shell field is available on systems where it can be resolved, but application code should not assume it is always filled.

## Read common directories

Use `home_dir()` when the program needs a user-specific location, and `temp_dir()` when it needs a temporary working location.

```cpp id="09j8mm"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto home = vix::os::home_dir();
  auto temp = vix::os::temp_dir();

  if (!home.ok())
  {
    vix::eprint("home directory unavailable:", home.error().message());
    return 1;
  }

  if (!temp.ok())
  {
    vix::eprint("temporary directory unavailable:", temp.error().message());
    return 1;
  }

  vix::print("home:", home.value());
  vix::print("temp:", temp.value());

  return 0;
}
```

These helpers keep directory resolution consistent across platforms. On Unix-like systems, the home directory may come from `HOME` or the user database. On Windows, it may come from user profile environment variables or system APIs. The application code does not need to handle those branches directly.

## Read system resources

The resource helpers expose small values that can influence runtime behavior. For example, an application may use the CPU count to choose a worker count, or the page size when working near lower-level memory behavior.

```cpp id="j6x1vq"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto cpus = vix::os::cpu_count();
  auto page = vix::os::page_size();
  auto up = vix::os::uptime();

  if (cpus.ok())
    vix::print("logical cpus:", cpus.value());

  if (page.ok())
    vix::print("page size:", page.value(), "bytes");

  if (up.ok())
    vix::print("uptime:", up.value(), "seconds");

  return 0;
}
```

`cpu_count()` returns the number of available logical CPUs. `page_size()` returns the memory page size in bytes. `uptime()` returns the system uptime in seconds on supported platforms.

## Sleep briefly

The module also provides small blocking sleep helpers. They are intentionally simple and are useful in examples, tests, polling loops, and local tools.

```cpp id="8g8j0g"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  vix::print("waiting...");
  vix::os::sleep_for_ms(500);
  vix::print("done");

  return 0;
}
```

For longer-running application scheduling, prefer the appropriate runtime, async, or worker abstraction. The sleep helpers are direct blocking delays.

## A compact system summary

A small diagnostic command can combine several OS helpers into one readable summary.

```cpp id="rftndi"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto platform = vix::os::platform();
  auto arch = vix::os::arch();
  auto hostname = vix::os::hostname();
  auto user = vix::os::current_user();
  auto cpus = vix::os::cpu_count();
  auto uptime = vix::os::uptime();

  vix::print_header("System");

  if (platform.ok())
    vix::print_named("platform", platform.value());

  if (arch.ok())
    vix::print_named("architecture", arch.value());

  if (hostname.ok())
    vix::print_named("hostname", hostname.value());

  if (user.ok())
    vix::print_named("user", user.value().username);

  if (cpus.ok())
    vix::print_named("logical cpus", cpus.value());

  if (uptime.ok())
    vix::print_named("uptime seconds", uptime.value());

  return 0;
}
```

This is the typical shape of `os` module usage: query the values that matter, handle unavailable values deliberately, and keep the rest of the application free from platform-specific system code.

## Next step

Continue with platform and architecture to understand how Vix identifies the operating system and CPU architecture, then move to the user, directory, and system resource pages as your application needs more specific OS information.
