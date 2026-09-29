# Errors

The `env` module uses structured Vix errors for operations that can fail. Reading a required variable, parsing a typed value, loading a dotenv file, resolving layered files, and injecting values into the process can all fail for normal reasons. A key may be invalid, a file may be missing, or a value may not match the type the application expects.

The goal is to make configuration failures visible at the boundary of the application. Startup code should be able to read the environment, check each result, and stop with a clear diagnostic when the runtime configuration is incomplete or malformed.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Result-based failures

Functions that return a value use `vix::error::Result<T>`. This includes readers such as `get()`, `get_bool()`, `get_int()`, `get_uint()`, `get_double()`, parsing functions, file loaders, and resolvers.

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

  vix::print("port:", port.value());

  return 0;
}
```

This style keeps the success path and the failure path close together. A caller does not need to catch an exception or guess whether an empty value means failure. The result either contains the parsed value or an error that explains why the value could not be produced.

## Error-only operations

Some operations do not return a value. They only report whether the operation succeeded. These functions return `vix::error::Error`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::set("APP_ENV", "test");

  if (error)
  {
    vix::print("failed to set APP_ENV:", error.message());
    return 1;
  }

  vix::print("APP_ENV configured");

  return 0;
}
```

`set()`, `unset()`, `load_into_process()`, and `load_layered_into_process()` follow this pattern. A default-constructed error represents success, while an error with content represents failure.

## Environment error codes

The module defines `EnvErrorCode` for environment-specific failures. These codes describe the domain problem before it is mapped into the generic Vix error system.

| Env error code         | Meaning                                                     |
| ---------------------- | ----------------------------------------------------------- |
| `None`                 | No environment error.                                       |
| `EmptyKey`             | The provided environment key is empty.                      |
| `InvalidKey`           | The key does not match the accepted environment key format. |
| `EmptyPath`            | A required file path or path component is empty.            |
| `InvalidPath`          | A path is not valid for the requested operation.            |
| `FileNotFound`         | A selected dotenv file could not be opened.                 |
| `FileReadFailed`       | A dotenv file was opened but could not be read correctly.   |
| `ParseFailed`          | Full dotenv content failed to parse.                        |
| `InvalidLine`          | A dotenv line is syntactically invalid.                     |
| `InvalidValue`         | A value cannot be parsed or used as requested.              |
| `MissingValue`         | A value is empty when empty values are not allowed.         |
| `UnsupportedOperation` | The platform operation failed or is unsupported.            |
| `AlreadyExists`        | A value already exists where duplication is not allowed.    |
| `NotFound`             | A requested environment variable or resource was not found. |

These codes are mapped to the generic Vix error codes used by the rest of the framework. That means callers can handle errors consistently while still receiving messages that are specific to environment configuration.

## Invalid keys

Environment keys must start with a letter or `_`. The remaining characters must be letters, digits, or `_`.

```txt
APP_ENV
DATABASE_URL
VIX_LOG_LEVEL
_WORKER_COUNT
```

Keys such as `APP-ENV`, `1PORT`, and an empty key are rejected.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto value = vix::env::get("APP-ENV");

  if (!value.ok())
  {
    vix::print("invalid environment key:", value.error().message());
    return 1;
  }

  return 0;
}
```

Strict key validation avoids accepting names that may behave differently across platforms or are not suitable for normal environment configuration.

## Missing variables

A missing variable is an error when the caller uses `get()` or one of the typed readers.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto database_url = vix::env::get("DATABASE_URL");

  if (!database_url.ok())
  {
    vix::print("DATABASE_URL is required:", database_url.error().message());
    return 1;
  }

  vix::print("database configuration is present");

  return 0;
}
```

Use this pattern for required configuration. If the value is optional and the application has a safe fallback, use `get_or()` instead.

```cpp
#include <string>
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  std::string app_env = vix::env::get_or("APP_ENV", "development");

  vix::print("environment:", app_env);

  return 0;
}
```

`get_or()` does not expose the underlying error. It is meant for optional values where falling back is the correct behavior.

## Invalid typed values

Typed readers fail when the variable exists but cannot be parsed as the requested type.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto port = vix::env::get_int("PORT");

  if (!port.ok())
  {
    vix::print("PORT must be a valid integer:", port.error().message());
    return 1;
  }

  vix::print("port:", port.value());

  return 0;
}
```

A value such as `8080` is valid for `get_int()`, but `8080abc` is rejected. The parser ignores surrounding whitespace, but it requires the remaining content to match the requested type completely.

The same principle applies to booleans and floating-point values. A boolean must be one of the supported truthy or falsy forms, and a double must be a valid floating-point value.

## Dotenv parse errors

Parsing fails when a dotenv line is malformed. A line without an `=` separator, a line with an empty key, or a line with an invalid key is treated as an error.

```dotenv
APP_ENV=production
INVALID_LINE
PORT=8080
```

When parsing full content with `parse_content()`, the returned error includes the line number that caused the failure.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::parse_content(
      "APP_ENV=production\n"
      "INVALID_LINE\n"
      "PORT=8080\n",
      ".env");

  if (!file.ok())
  {
    vix::print("failed to parse dotenv content:", file.error().message());
    return 1;
  }

  return 0;
}
```

Line numbers are important for real configuration files because a parsing failure should point directly to the part of the file that needs to be fixed.

## File loading errors

`load_file()` can fail when the path is empty, the file does not exist, the file cannot be read, or the file content is invalid.

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

A missing file is an error for a direct file load. If the application uses optional files, use layered loading with `ignore_missing_files` enabled.

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
    vix::print("failed to load environment layers:", files.error().message());
    return 1;
  }

  vix::print("loaded files:", files.value().size());

  return 0;
}
```

This lets optional files such as `.env.local` participate in development without making production startup depend on their presence.

## Layered resolution errors

Layered resolution can fail before any file is read. For example, the resolver cannot build an environment-specific file name when the environment name is empty.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.mode = vix::env::EnvFileMode::Layered;
  options.filename = ".env";
  options.environment_name = "";
  options.load_environment_file = true;

  auto paths = vix::env::resolve_env_files(options);

  if (!paths.ok())
  {
    vix::print("invalid layered environment options:", paths.error().message());
    return 1;
  }

  return 0;
}
```

This check keeps the layered workflow predictable. If an application asks for `.env.production`, `.env.test`, or another environment-specific layer, it must provide the environment name used to build that filename.

## Process injection errors

Loading into the process can fail while reading the file, parsing its content, or injecting a parsed entry with `set()`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::load_into_process(".env");

  if (error)
  {
    vix::print("failed to load environment into process:", error.message());
    return 1;
  }

  vix::print("environment loaded");

  return 0;
}
```

When process injection succeeds, the parsed values become visible to later calls such as `get()`, `get_int()`, and `get_bool()`. When it fails, startup should usually stop, because the application cannot assume the process environment is complete.

## Reporting startup errors

A good startup path reports configuration failures close to the point where they are detected.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto load_error = vix::env::load_into_process(".env");

  if (load_error)
  {
    vix::print("environment load failed:", load_error.message());
    return 1;
  }

  auto app_env = vix::env::get("APP_ENV");
  auto port = vix::env::get_int("PORT");
  auto debug = vix::env::get_bool("DEBUG");

  if (!app_env.ok())
  {
    vix::print("APP_ENV is required:", app_env.error().message());
    return 1;
  }

  if (!port.ok())
  {
    vix::print("PORT is required and must be an integer:", port.error().message());
    return 1;
  }

  if (!debug.ok())
  {
    vix::print("DEBUG is required and must be a boolean:", debug.error().message());
    return 1;
  }

  vix::print("configuration ready");

  return 0;
}
```

This style keeps the runtime contract visible. The application says which values it requires, how they should be parsed, and what happens when the environment does not match that contract.

## Next steps

Continue with the API reference for a compact list of the public Env types, functions, options, result aliases, and error codes.
