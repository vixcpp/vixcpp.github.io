# Quick Start

This page shows the smallest practical workflow for using the `env` module in a Vix application. The usual startup flow is simple: load configuration from a `.env` file when needed, read the values through the environment API, convert them into the types the application expects, and stop early when the configuration is incomplete.

The module is designed for ordinary application startup. It does not force a global configuration object, and it does not hide errors behind silent defaults. Values can be read directly from the process environment, or they can first be loaded from a dotenv file into the current process.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Create a `.env` file

Start with a small dotenv file at the root of the project.

```dotenv
APP_ENV=development
PORT=8080
DEBUG=true
WORKERS=4
```

These values are still plain text. The type conversion happens in C++ when the application reads them.

## Load the file into the process

Use `load_into_process()` near the beginning of the application. Once the file has been loaded, the rest of the program can read the values with `get()`, `get_int()`, `get_bool()`, and the other environment helpers.

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

  auto app_env = vix::env::get("APP_ENV");
  auto port = vix::env::get_int("PORT");
  auto debug = vix::env::get_bool("DEBUG");
  auto workers = vix::env::get_uint("WORKERS");

  if (!app_env.ok() || !port.ok() || !debug.ok() || !workers.ok())
  {
    vix::print("invalid environment configuration");
    return 1;
  }

  vix::print("environment:", app_env.value());
  vix::print("port:", port.value());
  vix::print("debug:", debug.value());
  vix::print("workers:", workers.value());

  return 0;
}
```

This example treats configuration as part of startup. If the file cannot be loaded, or if a required value cannot be parsed, the application exits before it starts running with an unclear state.

## Read a value with a default

Not every value needs to be required. For values where the application has a safe default, use `get_or()`.

```cpp
#include <string>
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

  std::string app_env = vix::env::get_or("APP_ENV", "development");

  vix::print("environment:", app_env);

  return 0;
}
```

`get_or()` is intentionally simple. It returns the provided default when the key cannot be read. Use it for optional settings, not for values that must be correct for the application to run.

## Read without loading a file

The module can also read variables that already exist in the process environment. This is common in production, where values may be provided by the shell, a service manager, a container runtime, or a deployment platform.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("PORT is missing or invalid:", port.error().message());
    return 1;
  }

  vix::print("server port:", port.value());

  return 0;
}
```

In this form, the application does not read a `.env` file at all. It only reads from the environment that already exists when the process starts.

## Parse dotenv content directly

When the dotenv content is already available as text, use `parse_content()` instead of reading from disk.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::parse_content(
      "APP_ENV=test\n"
      "PORT=9000\n",
      ".env.test");

  if (!file.ok())
  {
    vix::print("failed to parse dotenv content:", file.error().message());
    return 1;
  }

  vix::print("entries:", file.value().entries.size());
  vix::print("port:", file.value().values.at("PORT"));

  return 0;
}
```

This is useful in tests and tools that generate or inspect configuration without writing a temporary file first.

## Common startup pattern

A clean application startup usually separates loading from validation. Load the environment first, then read the values your application actually requires.

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

  auto port = vix::env::get_int("PORT");
  auto debug = vix::env::get_bool("DEBUG");

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
  vix::print("port:", port.value());
  vix::print("debug:", debug.value());

  return 0;
}
```

This style keeps configuration errors close to the point where the application starts. It also makes the expected runtime contract clear to the reader.

## Next steps

Continue with the process environment page to understand how `has()`, `get()`, `get_or()`, `set()`, and `unset()` work with the current process environment.
