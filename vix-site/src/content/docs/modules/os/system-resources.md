# System Resources

The `os` module exposes a few small resource values from the current machine. These values are useful when an application needs to understand the environment where it is running, choose a reasonable default for local work, or print diagnostic information during startup.

The goal is not to provide a complete hardware inspection layer. Vix keeps this part of the module focused on practical values that ordinary applications often need: the number of logical CPUs, the system memory page size, and the system uptime. Each query returns a `Result` because these values may depend on operating system support or runtime access to system APIs.

## Header

```cpp id="0j7ha2"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## CPU count

Use `cpu_count()` to read the number of available logical CPUs.

```cpp id="qk6gef"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto cpus = vix::os::cpu_count();

  if (!cpus.ok())
  {
    vix::eprint("failed to read cpu count:", cpus.error().message());
    return 1;
  }

  vix::print("logical cpus:", cpus.value());

  return 0;
}
```

This value is useful when an application wants to choose a default worker count or print a useful runtime summary. It should still be treated as a starting point, not as a final scheduling decision. The best number of workers depends on the kind of work being done, whether the program is CPU-bound or I/O-bound, and what else is running on the same machine.

A common pattern is to use the CPU count to choose a conservative default, then allow the user or configuration file to override it.

```cpp id="tn8gq8"
#include <algorithm>
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto cpus = vix::os::cpu_count();

  if (!cpus.ok())
  {
    vix::eprint("cpu count unavailable:", cpus.error().message());
    return 1;
  }

  unsigned int workers = std::max(1u, cpus.value());

  vix::print("worker count:", workers);

  return 0;
}
```

## Page size

Use `page_size()` to read the system memory page size in bytes.

```cpp id="b3q527"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto page = vix::os::page_size();

  if (!page.ok())
  {
    vix::eprint("failed to read page size:", page.error().message());
    return 1;
  }

  vix::print("page size:", page.value(), "bytes");

  return 0;
}
```

Most application code does not need the page size directly, but it becomes useful near lower-level system work, memory mapping, allocation strategies, runtime diagnostics, and tools that need to explain how the operating system sees memory. Vix exposes it as a simple `SizeResult`, so the caller can keep the low-level detail in one place instead of writing separate platform branches.

The value returned by `page_size()` is the size reported by the operating system. It should not be hardcoded because it can vary by system and target.

## Uptime

Use `uptime()` to read the system uptime in seconds.

```cpp id="b93t30"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto up = vix::os::uptime();

  if (!up.ok())
  {
    vix::eprint("uptime unavailable:", up.error().message());
    return 1;
  }

  vix::print("uptime:", up.value(), "seconds");

  return 0;
}
```

Uptime is useful in diagnostics and health output because it gives context about the machine, not only the current process. A server report, for example, may include process information together with system uptime to make it easier to understand whether the host has recently rebooted.

The implementation depends on the platform. Linux reads uptime from the system uptime information, macOS computes it from the boot time, and Windows uses the platform tick counter. When the platform cannot provide the value through the supported implementation, the function returns a structured OS error.

## Printing a resource summary

A small diagnostic command can combine these helpers into a readable system resource summary.

```cpp id="2mfmw4"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto cpus = vix::os::cpu_count();
  auto page = vix::os::page_size();
  auto up = vix::os::uptime();

  vix::print_header("System resources");

  if (cpus.ok())
    vix::print_named("logical cpus", cpus.value());
  else
    vix::eprint("logical cpus:", cpus.error().message());

  if (page.ok())
    vix::print_named("page size", vix::sprint(page.value(), "bytes"));
  else
    vix::eprint("page size:", page.error().message());

  if (up.ok())
    vix::print_named("uptime seconds", up.value());
  else
    vix::eprint("uptime:", up.error().message());

  return 0;
}
```

This is often the right style for diagnostics: each value is useful when available, but the program does not need to fail completely because one system query could not be read. When a resource value is required for the program to run correctly, handle that specific result as fatal near the place where the value is needed.

## Resource API overview

| Function               | Return type                         | Purpose                                      |
| ---------------------- | ----------------------------------- | -------------------------------------------- |
| `vix::os::cpu_count()` | `UIntResult`                        | Return the number of available logical CPUs. |
| `vix::os::page_size()` | `SizeResult`                        | Return the system memory page size in bytes. |
| `vix::os::uptime()`    | `vix::error::Result<std::uint64_t>` | Return the system uptime in seconds.         |

The module also defines `CpuInfo` and `MemoryInfo` structures for basic resource information. In the current public API shown here, the direct resource queries are `cpu_count()`, `page_size()`, and `uptime()`.

## Next step

Continue with sleep helpers to see how the OS module provides simple blocking delays for examples, tests, and small local tools.
