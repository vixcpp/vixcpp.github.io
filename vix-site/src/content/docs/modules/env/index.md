# Env

The `env` module provides environment configuration helpers for Vix applications. It gives C++ code a clear way to read process environment variables, convert values into common runtime types, parse `.env` content, load `.env` files, and inject parsed values into the current process environment.

This module exists because configuration often lives outside the program that uses it. A server port may come from the shell, a database URL may come from deployment secrets, and local development values may live in a `.env` file. Application code should be able to read those values without spreading direct calls to `getenv`, platform-specific environment APIs, or handwritten `.env` parsers throughout the codebase. The `env` module keeps that work behind a small Vix API and returns structured results when a value is missing, invalid, or cannot be parsed.

## Header

Use the Env module through the public Env header:

```cpp
#include <vix/env.hpp>
```

Some internal headers are available under `vix/env/...`, but application code should prefer the public module header unless it has a specific reason to include only one function group.

## Basic example

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("failed to read PORT:", port.error().message());
    return 1;
  }

  vix::print("server port:", port.value());

  return 0;
}
```

Most read operations return a `vix::error::Result<T>`. This keeps configuration handling explicit: a variable may exist and parse correctly, or it may be missing, invalid, or unusable for the type requested. The caller decides whether to stop startup, use a fallback, or report a diagnostic.

## What the module covers

The Env module is focused on the configuration workflow that appears in ordinary applications. It can check whether a variable exists, read a value from the current process environment, return a default value when a variable is absent, set or unset process variables, and parse values into the common types used during startup.

```cpp
#include <string>
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  std::string app_env = vix::env::get_or("APP_ENV", "development");

  if (vix::env::has("DATABASE_URL"))
  {
    vix::print("database configuration is present");
  }

  vix::print("environment:", app_env);

  return 0;
}
```

The module also understands `.env` files. It can parse a single line, parse full file content, load a file from disk, resolve layered files such as `.env.production.local`, and load parsed values into the process so the rest of the application can read them through the same environment API.

## Typed values

Environment variables are stored as strings, but application code usually needs values with a more precise type. The Env module provides typed readers for booleans, signed integers, unsigned integers, and floating-point values.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto debug = vix::env::get_bool("DEBUG");
  auto port = vix::env::get_int("PORT");
  auto workers = vix::env::get_uint("WORKERS");

  if (!debug.ok() || !port.ok() || !workers.ok())
  {
    vix::print("invalid environment configuration");
    return 1;
  }

  vix::print("debug:", debug.value());
  vix::print("port:", port.value());
  vix::print("workers:", workers.value());

  return 0;
}
```

The typed readers are strict. Surrounding whitespace is ignored, but the remaining content must match the requested type. This prevents configuration mistakes from being accepted silently. A value such as `8080` can be read as an integer, but `8080abc` is rejected.

## `.env` files

A `.env` file is useful when local configuration should live near the application without being compiled into it. The parser supports the common forms used in development and deployment configuration.

```dotenv
APP_ENV=development
PORT=8080
DEBUG=true
export DB_HOST=localhost
APP_NAME="Vix App"
```

Loading a file returns an `EnvFile`. It keeps the parsed entries in their original order and also provides a key-value map for direct lookup.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::load_file(".env");

  if (!file.ok())
  {
    vix::print("failed to load .env:", file.error().message());
    return 1;
  }

  vix::print("loaded entries:", file.value().entries.size());

  return 0;
}
```

The ordered entries are useful when the original file order matters, while the map is convenient when application code only needs the final value for a key. If a key appears more than once, the map stores the last value, while the entry list still preserves the parsed sequence.

## Layered configuration

Many applications use more than one environment file. A base file can define shared values, a local file can hold machine-specific overrides, and an environment-specific file can describe production, test, or development behavior.

The layered resolver can build paths such as:

```txt
.env
.env.local
.env.production
.env.production.local
```

The exact set of files is controlled by `EnvFileOptions`.

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

  auto files = vix::env::load_layered(options);

  if (!files.ok())
  {
    vix::print("failed to load environment files:", files.error().message());
    return 1;
  }

  vix::print("loaded files:", files.value().size());

  return 0;
}
```

Layered loading is useful because not every file is required in every environment. A developer may have `.env.local`, while a container image may only ship `.env.production`. When missing files are ignored, optional layers can participate in the workflow without making startup fragile.

## Loading into the process

Parsing a file gives the application an in-memory representation of the configuration. Loading into the process goes one step further: parsed entries are written into the current process environment, so later calls to `get()`, `get_int()`, `get_bool()`, and the other readers can access those values by name.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::load_into_process(".env");

  if (error)
  {
    vix::print("failed to load environment:", error.message());
    return 1;
  }

  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("PORT is missing or invalid");
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

This is usually done near application startup, before the rest of the program reads configuration. The overwrite behavior is controlled through the module options, so an application can decide whether file values may replace variables that were already provided by the surrounding environment.

## Result-based API

The Env module follows the same structured error style as the rest of Vix. Functions that produce values return `vix::error::Result<T>`, while operations that only report success or failure return `vix::error::Error`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::env::get("APP_ENV");

  if (!value.ok())
  {
    vix::print("environment error:", value.error().message());
    return 1;
  }

  vix::print("APP_ENV:", value.value());

  return 0;
}
```

Environment-specific failures are represented by `EnvErrorCode` and mapped into the generic Vix error system. This keeps error handling consistent with other Vix modules while still giving the caller messages that describe configuration, parsing, file loading, and process environment failures.

## Main areas

The module is organized around a few practical groups.

Process environment helpers read and modify variables in the current process. `has()` checks whether a key exists, `get()` reads a string value, `get_or()` returns a default when reading fails, and `set()` or `unset()` update the current process environment.

Typed readers convert environment values into useful runtime types. `get_bool()`, `get_int()`, `get_uint()`, and `get_double()` read from the process environment and return structured errors when conversion fails.

Parsing helpers handle `.env` syntax. `parse_line()` parses a single line, while `parse_content()` parses a full text buffer into an `EnvFile`.

File loading helpers read `.env` files from disk. `load_file()` loads one explicit file, while `load_layered()` resolves and loads a selected set of files according to `EnvFileOptions`.

Process injection helpers load parsed values into the current process environment. `load_into_process()` handles one file, and `load_layered_into_process()` handles the layered workflow.

## Next steps

Start with the quick start page if you want to load and read configuration immediately, then move to the process environment and typed values pages to understand how Env should be used during normal application startup.
