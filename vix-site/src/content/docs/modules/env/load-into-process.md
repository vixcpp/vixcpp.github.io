# Load Into Process

Loading into the process means taking parsed dotenv values and writing them into the current process environment. After that step, the same values can be read with `get()`, `get_int()`, `get_bool()`, and the other Env helpers.

This is useful during application startup. A local `.env` file can be read once near the beginning of `main()`, then the rest of the application can use the normal process environment API without needing to know whether values came from the shell, a service manager, or a dotenv file.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Basic dotenv file

Start with a simple `.env` file.

```dotenv
APP_ENV=development
PORT=8080
DEBUG=true
```

The file stores plain text values. Loading the file into the process makes those keys visible to the process environment readers.

## Load one file into the process

Use `load_into_process()` when the application should read one explicit dotenv file and inject its values into the current process environment.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::load_into_process(".env");

  if (error)
  {
    vix::print("failed to load .env:", error.message());
    return 1;
  }

  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("PORT is missing or invalid:", port.error().message());
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

`load_into_process()` first loads and parses the file. If parsing succeeds, each parsed entry is injected with `set()`. If the file cannot be opened, the content cannot be parsed, or one of the process environment operations fails, the function returns a structured error.

## What changes after loading

Before a dotenv file is loaded into the process, its values only exist on disk. After loading, they are part of the current process environment and can be read by name.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  if (!vix::env::has("APP_ENV"))
  {
    vix::print("APP_ENV is not available before loading");
  }

  auto error = vix::env::load_into_process(".env");

  if (error)
  {
    vix::print("failed to load environment:", error.message());
    return 1;
  }

  auto app_env = vix::env::get("APP_ENV");

  if (!app_env.ok())
  {
    vix::print("APP_ENV is still unavailable:", app_env.error().message());
    return 1;
  }

  vix::print("environment:", app_env.value());

  return 0;
}
```

This change is local to the running process. It does not edit the user’s shell profile, it does not update systemd, and it does not rewrite the `.env` file.

## Overwrite behavior

By default, values loaded from the file may overwrite variables that already exist in the current process environment. This behavior is controlled by `EnvFileOptions::env.overwrite_existing`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto set_error = vix::env::set("APP_ENV", "production");

  if (set_error)
  {
    vix::print("failed to prepare APP_ENV:", set_error.message());
    return 1;
  }

  vix::env::EnvFileOptions options;
  options.env.overwrite_existing = false;

  auto load_error = vix::env::load_into_process(".env", options);

  if (load_error)
  {
    vix::print("failed to load .env:", load_error.message());
    return 1;
  }

  auto app_env = vix::env::get("APP_ENV");

  if (app_env.ok())
  {
    vix::print("environment:", app_env.value());
  }

  return 0;
}
```

With `overwrite_existing` set to `false`, values that already exist in the process are preserved. This is often the safer behavior when production values are provided by the surrounding runtime and a local file should not replace them.

## Load layered files into the process

Use `load_layered_into_process()` when the application uses the layered dotenv workflow.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.mode = vix::env::EnvFileMode::Layered;
  options.base_dir = ".";
  options.filename = ".env";
  options.environment_name = "production";
  options.load_base_file = true;
  options.load_local_file = true;
  options.load_environment_file = true;
  options.load_environment_local_file = true;
  options.ignore_missing_files = true;
  options.env.overwrite_existing = true;

  auto error = vix::env::load_layered_into_process(options);

  if (error)
  {
    vix::print("failed to load layered environment:", error.message());
    return 1;
  }

  auto app_env = vix::env::get("APP_ENV");
  auto port = vix::env::get_int("PORT");

  if (!app_env.ok() || !port.ok())
  {
    vix::print("invalid environment configuration");
    return 1;
  }

  vix::print("environment:", app_env.value());
  vix::print("port:", port.value());

  return 0;
}
```

Layered loading resolves the selected files, loads the files that are available, and injects their entries in resolver order. When overwrite is enabled, later files may replace values from earlier files.

## Loading and validation

Loading into the process does not replace validation. It only makes values available through the environment API. The application should still read the values it depends on and check that they exist and parse correctly.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::load_into_process(".env");

  if (error)
  {
    vix::print("environment load failed:", error.message());
    return 1;
  }

  auto app_env = vix::env::get("APP_ENV");
  auto port = vix::env::get_int("PORT");
  auto debug = vix::env::get_bool("DEBUG");

  if (!app_env.ok())
  {
    vix::print("APP_ENV is required");
    return 1;
  }

  if (!port.ok())
  {
    vix::print("PORT is required and must be an integer");
    return 1;
  }

  if (!debug.ok())
  {
    vix::print("DEBUG is required and must be a boolean");
    return 1;
  }

  vix::print("configuration ready");

  return 0;
}
```

This pattern keeps startup predictable. File loading happens first, validation happens immediately after, and the application only continues when the runtime environment is complete enough to run.

## When to use `load_file()` instead

Use `load_file()` when you want to inspect a dotenv file without changing the process environment.

```cpp
auto file = vix::env::load_file(".env");
```

Use `load_into_process()` when the parsed values should become part of the current process environment.

```cpp
auto error = vix::env::load_into_process(".env");
```

The distinction is important. Tools, diagnostics, and tests may only need the parsed `EnvFile`. Application startup usually wants to inject values so the rest of the program can read configuration through the same Env API.

## Next steps

Continue with the options page to understand how `EnvOptions` and `EnvFileOptions` control whitespace handling, quote stripping, overwrite behavior, missing files, base directories, filenames, and layered loading.
