# API Reference

This page lists the public API exposed by the `env` module. For normal application code, include the public module header and use the symbols from the `vix::env` namespace.

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Namespace

All Env APIs live in the `vix::env` namespace.

```cpp
vix::env::get("APP_ENV");
vix::env::load_file(".env");
vix::env::load_into_process(".env");
```

## Error codes

`EnvErrorCode` describes environment-specific failures before they are mapped into the generic Vix error system.

```cpp
enum class EnvErrorCode
{
  None = 0,
  EmptyKey,
  InvalidKey,
  EmptyPath,
  InvalidPath,
  FileNotFound,
  FileReadFailed,
  ParseFailed,
  InvalidLine,
  InvalidValue,
  MissingValue,
  UnsupportedOperation,
  AlreadyExists,
  NotFound
};
```

| Code                   | Meaning                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `None`                 | No environment error.                                        |
| `EmptyKey`             | The environment key is empty.                                |
| `InvalidKey`           | The key does not follow the accepted environment key format. |
| `EmptyPath`            | A required path or path component is empty.                  |
| `InvalidPath`          | A path is invalid for the requested operation.               |
| `FileNotFound`         | A dotenv file could not be opened.                           |
| `FileReadFailed`       | A dotenv file was opened but could not be read correctly.    |
| `ParseFailed`          | Full dotenv content failed to parse.                         |
| `InvalidLine`          | A dotenv line is syntactically invalid.                      |
| `InvalidValue`         | A value cannot be parsed or used as requested.               |
| `MissingValue`         | A value is empty when empty values are not allowed.          |
| `UnsupportedOperation` | A platform environment operation failed or is unsupported.   |
| `AlreadyExists`        | A value already exists where duplication is not allowed.     |
| `NotFound`             | A requested environment variable or resource was not found.  |

## Error helpers

```cpp
vix::error::ErrorCategory env_error_category() noexcept;
vix::error::ErrorCode to_error_code(EnvErrorCode code) noexcept;
const char *to_string(EnvErrorCode code) noexcept;
vix::error::Error make_env_error(EnvErrorCode code, std::string message);
```

`env_error_category()` returns the default error category for the module. `to_error_code()` maps an `EnvErrorCode` to the generic `vix::error::ErrorCode` used across Vix. `to_string()` returns a stable text name for an Env error code. `make_env_error()` builds a structured Vix error from an Env error code and a human-readable message.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::make_env_error(
      vix::env::EnvErrorCode::InvalidKey,
      "environment key is invalid");

  vix::print("error:", error.message());

  return 0;
}
```

## Result aliases

The module uses `vix::error::Result<T>` for APIs that return a value and may fail.

```cpp
using EnvStringResult = vix::error::Result<std::string>;
using EnvBoolResult = vix::error::Result<bool>;
using EnvIntResult = vix::error::Result<int>;
using EnvUintResult = vix::error::Result<unsigned>;
using EnvDoubleResult = vix::error::Result<double>;
using EnvEntryResult = vix::error::Result<EnvEntry>;
using EnvEntryListResult = vix::error::Result<EnvEntryList>;
using EnvMapResult = vix::error::Result<EnvMap>;
```

These aliases make function signatures easier to read while keeping error handling consistent with the rest of Vix.

## `EnvEntry`

`EnvEntry` represents one parsed key-value pair from dotenv content.

```cpp
struct EnvEntry
{
  std::string key;
  std::string value;
};
```

A blank line or comment line parsed with `parse_line()` succeeds with an empty `EnvEntry`.

## `EnvMap`

`EnvMap` stores parsed values by key.

```cpp
using EnvMap = std::unordered_map<std::string, std::string>;
```

When a key appears more than once in parsed content, the map stores the last value for that key.

## `EnvEntryList`

`EnvEntryList` stores parsed entries in their original order.

```cpp
using EnvEntryList = std::vector<EnvEntry>;
```

This is useful for tools that need to inspect or preserve the order of a dotenv file.

## `EnvFile`

`EnvFile` is the in-memory representation of a parsed dotenv file.

```cpp
struct EnvFile
{
  std::string path;
  EnvEntryList entries;
  EnvMap values;
};
```

| Field     | Purpose                                                |
| --------- | ------------------------------------------------------ |
| `path`    | Original file path associated with the parsed content. |
| `entries` | Ordered parsed entries.                                |
| `values`  | Key-value map of final parsed values.                  |

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

  vix::print("path:", file.value().path);
  vix::print("entries:", file.value().entries.size());

  return 0;
}
```

## `EnvFileResult`

```cpp
using EnvFileResult = vix::error::Result<EnvFile>;
```

This is the standard result type for functions that load or parse a dotenv file.

## `EnvOptions`

`EnvOptions` contains common settings used by process environment operations and dotenv parsing.

```cpp
struct EnvOptions
{
  bool trim_whitespace{true};
  bool case_insensitive_bools{true};
  bool allow_empty_values{true};
  bool overwrite_existing{true};
  bool require_existing{false};
};
```

| Field                    | Default | Purpose                                                                 |
| ------------------------ | ------- | ----------------------------------------------------------------------- |
| `trim_whitespace`        | `true`  | Trim leading and trailing whitespace when parsing.                      |
| `case_insensitive_bools` | `true`  | Boolean parsing is case-insensitive.                                    |
| `allow_empty_values`     | `true`  | Allow entries such as `KEY=`.                                           |
| `overwrite_existing`     | `true`  | Allow process injection to overwrite existing variables.                |
| `require_existing`       | `false` | Common strictness option for workflows that require existing variables. |

## `EnvFileMode`

`EnvFileMode` controls whether file resolution targets one file or a layered set of files.

```cpp
enum class EnvFileMode
{
  Single,
  Layered
};
```

`Single` resolves the primary file named by `filename`. `Layered` resolves the selected base, local, environment-specific, and environment-local files.

## `EnvFileOptions`

`EnvFileOptions` controls dotenv file resolution, parsing, and loading.

```cpp
struct EnvFileOptions
{
  EnvOptions env{};
  vix::path::PathOptions path{};

  std::string base_dir{"."};
  std::string filename{".env"};
  std::string environment_name{};

  EnvFileMode mode{EnvFileMode::Single};

  bool load_base_file{true};
  bool load_local_file{false};
  bool load_environment_file{false};
  bool load_environment_local_file{false};

  bool ignore_missing_files{true};

  bool ignore_blank_lines{true};
  bool ignore_comments{true};
  bool strip_quotes{true};
};
```

| Field                         | Default               | Purpose                                                              |
| ----------------------------- | --------------------- | -------------------------------------------------------------------- |
| `env`                         | `{}`                  | Common environment options.                                          |
| `path`                        | `{}`                  | Path options used when resolving dotenv file paths.                  |
| `base_dir`                    | `"."`                 | Base directory used to resolve files.                                |
| `filename`                    | `".env"`              | Base dotenv filename.                                                |
| `environment_name`            | `""`                  | Environment suffix such as `production` or `test`.                   |
| `mode`                        | `EnvFileMode::Single` | Single-file or layered resolution mode.                              |
| `load_base_file`              | `true`                | Include the base file, such as `.env`.                               |
| `load_local_file`             | `false`               | Include the local file, such as `.env.local`.                        |
| `load_environment_file`       | `false`               | Include the environment-specific file, such as `.env.production`.    |
| `load_environment_local_file` | `false`               | Include the environment-local file, such as `.env.production.local`. |
| `ignore_missing_files`        | `true`                | Skip missing selected files during layered loading.                  |
| `ignore_blank_lines`          | `true`                | Ignore blank lines while parsing.                                    |
| `ignore_comments`             | `true`                | Ignore comment lines beginning with `#`.                             |
| `strip_quotes`                | `true`                | Remove matching quotes around parsed values.                         |

## Process environment functions

These functions read and modify the current process environment.

```cpp
bool has(std::string_view key) noexcept;
EnvStringResult get(std::string_view key);
std::string get_or(std::string_view key, std::string_view default_value = "");
vix::error::Error set(std::string_view key, std::string_view value, bool overwrite = true) noexcept;
vix::error::Error unset(std::string_view key) noexcept;
```

### `has`

```cpp
bool has(std::string_view key) noexcept;
```

Returns `true` when the variable exists in the current process environment. Empty or invalid keys return `false`.

```cpp
if (vix::env::has("DATABASE_URL"))
{
  vix::print("database configuration is present");
}
```

### `get`

```cpp
EnvStringResult get(std::string_view key);
```

Reads a variable as a string. The result fails when the key is empty, the key is invalid, or the variable is not found.

```cpp
auto value = vix::env::get("APP_ENV");

if (!value.ok())
{
  vix::print("APP_ENV is missing:", value.error().message());
  return 1;
}

vix::print("APP_ENV:", value.value());
```

### `get_or`

```cpp
std::string get_or(std::string_view key, std::string_view default_value = "");
```

Reads a variable as a string and returns the provided default when the value cannot be read.

```cpp
std::string app_env = vix::env::get_or("APP_ENV", "development");
```

Use `get_or()` for optional values where falling back is the intended behavior.

### `set`

```cpp
vix::error::Error set(
    std::string_view key,
    std::string_view value,
    bool overwrite = true) noexcept;
```

Sets a variable in the current process environment.

```cpp
auto error = vix::env::set("APP_ENV", "test");

if (error)
{
  vix::print("failed to set APP_ENV:", error.message());
  return 1;
}
```

When `overwrite` is `false`, an existing value is preserved.

### `unset`

```cpp
vix::error::Error unset(std::string_view key) noexcept;
```

Removes a variable from the current process environment.

```cpp
auto error = vix::env::unset("APP_ENV");

if (error)
{
  vix::print("failed to unset APP_ENV:", error.message());
  return 1;
}
```

Removing a missing variable succeeds. Invalid keys still return an error.

## Typed readers

Typed readers read from the current process environment and parse the string value into the requested type.

```cpp
EnvBoolResult get_bool(std::string_view key);
EnvIntResult get_int(std::string_view key);
EnvUintResult get_uint(std::string_view key);
EnvDoubleResult get_double(std::string_view key);
```

### `get_bool`

```cpp
EnvBoolResult get_bool(std::string_view key);
```

Reads a variable as a boolean. Accepted truthy values are `1`, `true`, `yes`, and `on`. Accepted falsy values are `0`, `false`, `no`, and `off`.

```cpp
auto debug = vix::env::get_bool("DEBUG");

if (!debug.ok())
{
  vix::print("DEBUG must be a boolean:", debug.error().message());
  return 1;
}

vix::print("debug:", debug.value());
```

### `get_int`

```cpp
EnvIntResult get_int(std::string_view key);
```

Reads a variable as a signed base-10 integer.

```cpp
auto port = vix::env::get_int("PORT");

if (!port.ok())
{
  vix::print("PORT must be an integer:", port.error().message());
  return 1;
}
```

### `get_uint`

```cpp
EnvUintResult get_uint(std::string_view key);
```

Reads a variable as an unsigned base-10 integer.

```cpp
auto workers = vix::env::get_uint("WORKERS");

if (!workers.ok())
{
  vix::print("WORKERS must be an unsigned integer:", workers.error().message());
  return 1;
}
```

### `get_double`

```cpp
EnvDoubleResult get_double(std::string_view key);
```

Reads a variable as a floating-point value.

```cpp
auto timeout = vix::env::get_double("TIMEOUT_SECONDS");

if (!timeout.ok())
{
  vix::print("TIMEOUT_SECONDS must be a number:", timeout.error().message());
  return 1;
}
```

## Parsing functions

Parsing functions convert dotenv text into structured data. They do not modify the process environment.

```cpp
EnvEntryResult parse_line(std::string_view line, const EnvFileOptions &options = {});
EnvFileResult parse_content(
    std::string_view content,
    std::string_view path = {},
    const EnvFileOptions &options = {});
```

### `parse_line`

```cpp
EnvEntryResult parse_line(
    std::string_view line,
    const EnvFileOptions &options = {});
```

Parses one dotenv line into an `EnvEntry`.

Supported forms include:

```dotenv
KEY=VALUE
KEY = VALUE
export KEY=VALUE
```

Blank lines and comment lines succeed with an empty entry.

```cpp
auto entry = vix::env::parse_line("APP_ENV=production");

if (!entry.ok())
{
  vix::print("failed to parse line:", entry.error().message());
  return 1;
}

vix::print("key:", entry.value().key);
vix::print("value:", entry.value().value);
```

### `parse_content`

```cpp
EnvFileResult parse_content(
    std::string_view content,
    std::string_view path = {},
    const EnvFileOptions &options = {});
```

Parses complete dotenv content into an `EnvFile`.

```cpp
auto file = vix::env::parse_content(
    "APP_ENV=test\n"
    "PORT=9000\n",
    ".env.test");

if (!file.ok())
{
  vix::print("failed to parse content:", file.error().message());
  return 1;
}

vix::print("entries:", file.value().entries.size());
```

When parsing fails, the returned error message includes the line number.

## File resolution

These functions resolve dotenv file paths from `EnvFileOptions`.

```cpp
using EnvPathListResult = vix::error::Result<std::vector<std::string>>;

vix::error::Result<std::string> resolve_env_file(
    const EnvFileOptions &options = {});

EnvPathListResult resolve_env_files(
    const EnvFileOptions &options = {});
```

### `resolve_env_file`

```cpp
vix::error::Result<std::string> resolve_env_file(
    const EnvFileOptions &options = {});
```

Resolves the primary dotenv file path from `base_dir` and `filename`.

```cpp
vix::env::EnvFileOptions options;
options.base_dir = ".";
options.filename = ".env";

auto path = vix::env::resolve_env_file(options);

if (!path.ok())
{
  vix::print("failed to resolve .env path:", path.error().message());
  return 1;
}

vix::print("path:", path.value());
```

### `resolve_env_files`

```cpp
EnvPathListResult resolve_env_files(
    const EnvFileOptions &options = {});
```

Resolves all selected dotenv file paths. In single mode, it returns one path. In layered mode, it may return paths such as `.env`, `.env.local`, `.env.production`, and `.env.production.local`.

```cpp
vix::env::EnvFileOptions options;
options.mode = vix::env::EnvFileMode::Layered;
options.environment_name = "production";
options.load_base_file = true;
options.load_local_file = true;
options.load_environment_file = true;
options.load_environment_local_file = true;

auto paths = vix::env::resolve_env_files(options);

if (!paths.ok())
{
  vix::print("failed to resolve environment files:", paths.error().message());
  return 1;
}

for (const auto &path : paths.value())
{
  vix::print(path);
}
```

## File loading

File loading functions read dotenv files from disk and return parsed data.

```cpp
EnvFileResult load_file(
    std::string_view path,
    const EnvFileOptions &options = {});

using EnvFileListResult = vix::error::Result<std::vector<EnvFile>>;

EnvFileListResult load_layered(
    const EnvFileOptions &options = {});
```

### `load_file`

```cpp
EnvFileResult load_file(
    std::string_view path,
    const EnvFileOptions &options = {});
```

Loads and parses one explicit dotenv file.

```cpp
auto file = vix::env::load_file(".env");

if (!file.ok())
{
  vix::print("failed to load .env:", file.error().message());
  return 1;
}

vix::print("entries:", file.value().entries.size());
```

### `load_layered`

```cpp
EnvFileListResult load_layered(
    const EnvFileOptions &options = {});
```

Resolves and loads selected dotenv layers according to `EnvFileOptions`.

```cpp
vix::env::EnvFileOptions options;
options.mode = vix::env::EnvFileMode::Layered;
options.environment_name = "production";
options.load_base_file = true;
options.load_local_file = true;
options.load_environment_file = true;
options.load_environment_local_file = true;
options.ignore_missing_files = true;

auto files = vix::env::load_layered(options);

if (!files.ok())
{
  vix::print("failed to load layered environment:", files.error().message());
  return 1;
}

vix::print("loaded files:", files.value().size());
```

`load_layered()` returns parsed files. It does not inject values into the current process environment.

## Process injection

Process injection loads parsed dotenv values into the current process environment.

```cpp
vix::error::Error load_into_process(
    std::string_view path,
    const EnvFileOptions &options = {});

vix::error::Error load_layered_into_process(
    const EnvFileOptions &options = {});
```

### `load_into_process`

```cpp
vix::error::Error load_into_process(
    std::string_view path,
    const EnvFileOptions &options = {});
```

Loads one dotenv file and injects its parsed entries into the current process environment.

```cpp
auto error = vix::env::load_into_process(".env");

if (error)
{
  vix::print("failed to load .env:", error.message());
  return 1;
}
```

### `load_layered_into_process`

```cpp
vix::error::Error load_layered_into_process(
    const EnvFileOptions &options = {});
```

Loads selected dotenv layers and injects their parsed entries into the current process environment.

```cpp
vix::env::EnvFileOptions options;
options.mode = vix::env::EnvFileMode::Layered;
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
```

After successful injection, values can be read with the normal process environment readers.

```cpp
auto port = vix::env::get_int("PORT");
```

## Key format

Environment keys accepted by the module must start with a letter or `_`. The remaining characters must be letters, digits, or `_`.

```txt
APP_ENV
DATABASE_URL
VIX_LOG_LEVEL
_WORKER_COUNT
```

Invalid keys include:

```txt
APP-ENV
1PORT
EMPTY KEY
```

Strict key validation keeps behavior predictable across platforms and avoids accepting names that are unsuitable for normal environment configuration.

## Complete startup example

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
  options.env.overwrite_existing = false;

  auto load_error = vix::env::load_layered_into_process(options);

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

  vix::print("environment:", app_env.value());
  vix::print("port:", port.value());
  vix::print("debug:", debug.value());

  return 0;
}
```

## Next steps

Return to the overview for the conceptual model, or continue through the topic pages when you need more detail about process environment access, typed values, dotenv parsing, layered loading, process injection, options, and error handling.
