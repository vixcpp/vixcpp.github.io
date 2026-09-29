# `.env` Files

The `env` module can load dotenv-style files from disk and represent them as structured C++ data. This is useful when local configuration should live near the application, while the application code still reads clear keys and handles errors explicitly.

A `.env` file is usually part of the runtime setup, not part of the compiled program. It may define the application mode, port, database path, logging behavior, or local development values. The Env module reads that file, parses its entries, and returns an `EnvFile` that contains both the ordered entries and a key-value map.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## A basic `.env` file

A dotenv file is a plain text file made of key-value entries.

```dotenv
APP_ENV=development
PORT=8080
DEBUG=true
DATABASE_PATH=storage/app.db
```

The file should stay simple. Each line describes one value, and the application decides how that value should be interpreted when it reads it.

## Loading a file

Use `load_file()` when you want to read and parse one explicit file.

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

`load_file()` reads the file content, parses it with the dotenv parser, and returns an `EnvFile`. If the path is empty, the file does not exist, the file cannot be read, or the content is invalid, the result contains a structured error.

## The `EnvFile` structure

An `EnvFile` keeps the original file path, the parsed entries in order, and a map of final values.

```cpp
struct EnvFile
{
  std::string path;
  EnvEntryList entries;
  EnvMap values;
};
```

The ordered `entries` list is useful when a tool needs to preserve the sequence found in the file. The `values` map is useful when application code wants to look up the final value for a key.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::load_file(".env");

  if (!file.ok())
  {
    vix::print("failed to load file:", file.error().message());
    return 1;
  }

  const auto &env_file = file.value();

  vix::print("path:", env_file.path);

  if (env_file.values.contains("APP_ENV"))
  {
    vix::print("APP_ENV:", env_file.values.at("APP_ENV"));
  }

  return 0;
}
```

If the same key appears more than once, the entry list keeps every parsed entry, while the map stores the last value for that key. This gives tools access to the original shape of the file while still giving application code a practical lookup view.

## Supported dotenv syntax

The parser supports the common forms used in simple environment files.

```dotenv
APP_ENV=production
PORT = 8080
export DB_HOST=localhost
APP_NAME="Vix App"
```

Blank lines are ignored, and comment lines beginning with `#` are ignored.

```dotenv
# Application mode
APP_ENV=development

# HTTP port
PORT=8080
```

Inline comments are supported for unquoted values.

```dotenv
PORT=8080 # local development port
```

Quoted values can contain `#` as part of the value.

```dotenv
APP_NAME="Vix # Runtime"
```

By default, quotes around values are removed during parsing. This behavior can be changed with `EnvFileOptions`.

## Loading with options

`load_file()` accepts `EnvFileOptions` when the parser behavior needs to be adjusted.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.strip_quotes = false;
  options.env.allow_empty_values = false;

  auto file = vix::env::load_file(".env", options);

  if (!file.ok())
  {
    vix::print("failed to load .env:", file.error().message());
    return 1;
  }

  vix::print("loaded entries:", file.value().entries.size());

  return 0;
}
```

Options should be used deliberately. In most application code, the defaults are enough: whitespace is trimmed, comments are ignored, quoted values are unquoted, and empty values are allowed.

## Handling missing files

A single-file load treats a missing file as an error.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::load_file(".env");

  if (!file.ok())
  {
    vix::print("environment file unavailable:", file.error().message());
    return 1;
  }

  vix::print("configuration file loaded");

  return 0;
}
```

This is the right behavior when the file is required for the application to start. When some files are optional, use the layered loading workflow instead. Layered loading can ignore missing selected files while still loading the files that are present.

## Loading versus injecting

`load_file()` only parses the file and returns an `EnvFile`. It does not write the parsed values into the process environment.

```cpp
auto file = vix::env::load_file(".env");
```

Use this when a tool wants to inspect a file, validate it, display entries, compare values, or read from the returned map directly.

When the application wants the parsed values to become available through `get()`, `get_int()`, `get_bool()`, and the other process environment readers, use `load_into_process()` instead.

```cpp
auto error = vix::env::load_into_process(".env");
```

Keeping these two operations separate is important. Some code only needs to parse a file, while startup code often wants to load values into the process before the rest of the application reads configuration.

## A practical startup example

A common startup flow is to load the file into the process, then read the values through typed readers.

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

  if (!app_env.ok() || !port.ok() || !debug.ok())
  {
    vix::print("invalid environment configuration");
    return 1;
  }

  vix::print("environment:", app_env.value());
  vix::print("port:", port.value());
  vix::print("debug:", debug.value());

  return 0;
}
```

This keeps file loading at the edge of the program and keeps the rest of the configuration logic based on normal environment reads.

## Next steps

Continue with the parsing page to see how `parse_line()` and `parse_content()` handle dotenv syntax before values are loaded from disk or injected into the process.
