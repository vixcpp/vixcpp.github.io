# Directories

The `os` module provides helpers for resolving common directories from the current operating system. These functions are useful when an application needs a user-specific location for configuration, cache files, local state, or a temporary working directory, without writing separate directory resolution code for each platform.

Directory lookup looks simple from the outside, but the details are different across systems. Unix-like systems usually rely on environment variables such as `HOME`, or on the user database when the environment is incomplete. Windows uses a different set of environment variables and system APIs. Vix keeps these differences inside `vix::os` and returns a result that makes failure explicit when a directory cannot be resolved.

## Header

```cpp id="bq7g2d"
#include <vix/os.hpp>
#include <vix/print.hpp>
```

## Home directory

Use `home_dir()` to resolve the current user’s home directory.

```cpp id="rzd3k5"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto home = vix::os::home_dir();

  if (!home.ok())
  {
    vix::eprint("failed to resolve home directory:", home.error().message());
    return 1;
  }

  vix::print("home:", home.value());

  return 0;
}
```

The home directory is normally the best base location for user-specific files. A command-line tool may place configuration under the user’s home directory, a local development utility may create a cache there, and a small application may need a stable location that belongs to the current user instead of the current working directory.

The function returns a `StringResult`, which is an alias for `vix::error::Result<std::string>`. This is important because a home directory is not guaranteed to be available in every environment. Containers, restricted services, unusual user accounts, or missing environment variables can all make directory resolution fail.

## Temporary directory

Use `temp_dir()` when the program needs a temporary working location.

```cpp id="y1w2rv"
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto temp = vix::os::temp_dir();

  if (!temp.ok())
  {
    vix::eprint("failed to resolve temporary directory:", temp.error().message());
    return 1;
  }

  vix::print("temp:", temp.value());

  return 0;
}
```

The temporary directory is useful for files that are not part of the application’s long-term state. Examples include generated intermediate files, extracted archives, short-lived test output, or scratch files created during a build or conversion step.

On Unix-like systems, `temp_dir()` checks common temporary directory environment variables and falls back to `/tmp` when no explicit value is available. On Windows, it uses the platform temporary path API. The caller receives a string path and can decide how to combine it with a filename or a project-specific subdirectory.

## Use directories as base paths

The OS module only resolves the directory path. It does not create application folders automatically, and it does not decide the layout of files inside that directory. That decision belongs to the application or to a higher-level filesystem helper.

```cpp id="es42gh"
#include <string>
#include <vix/os.hpp>
#include <vix/print.hpp>

int main()
{
  auto home = vix::os::home_dir();

  if (!home.ok())
  {
    vix::eprint("home directory unavailable:", home.error().message());
    return 1;
  }

  std::string config_dir = home.value() + "/.config/my-app";

  vix::print("config directory:", config_dir);

  return 0;
}
```

This example keeps the idea clear: `home_dir()` gives the user base directory, and the application chooses the location it wants under that base. In real code, prefer the Vix path or filesystem helpers when you need stronger path joining, directory creation, or file operations.

## Handle missing directories deliberately

A missing home directory should not always be treated the same way as a missing temporary directory. For configuration files, failing early may be the correct behavior because the application cannot safely choose where to read or write user state. For temporary files, an application may be able to fall back to a project-local directory or disable a feature that requires temporary storage.

```cpp id="5ldofu"
auto home = vix::os::home_dir();

if (!home.ok())
{
  vix::eprint("cannot continue without a home directory:", home.error().message());
  return 1;
}

auto temp = vix::os::temp_dir();

if (!temp.ok())
{
  vix::eprint("temporary directory unavailable:", temp.error().message());
}
```

The important part is not to ignore the result. Directory paths often become the base for later filesystem operations, and a bad assumption at this stage can turn into confusing errors later. Checking the result close to the lookup makes the failure easier to understand.

## Directory API overview

| Function              | Return type    | Purpose                                   |
| --------------------- | -------------- | ----------------------------------------- |
| `vix::os::home_dir()` | `StringResult` | Return the current user’s home directory. |
| `vix::os::temp_dir()` | `StringResult` | Return the system temporary directory.    |

Both functions return paths as strings. Use the path and filesystem modules when you need lexical path manipulation, directory creation, file checks, or read and write operations.

## Next step

Continue with system resources to read CPU count, memory page size, and system uptime from the OS module.
