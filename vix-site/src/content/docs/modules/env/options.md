# Options

The `env` module uses options to keep environment behavior explicit. Most applications can use the defaults, but startup code, tests, and production loaders sometimes need more control over whitespace handling, empty values, quote stripping, missing files, path resolution, and overwrite behavior.

There are two option structures. `EnvOptions` controls common environment behavior, especially parsing and process injection. `EnvFileOptions` extends that with file-oriented settings such as the base directory, filename, layered loading mode, and dotenv parsing options.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Default behavior

The default options are meant for ordinary dotenv files and application startup. Whitespace is trimmed, comments are ignored, quoted values are unquoted, empty values are allowed, and existing process variables may be overwritten when values are loaded into the process.

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

  vix::print("environment loaded");

  return 0;
}
```

This is the right starting point for most applications. Add explicit options when the project has a reason to change the default behavior.

## `EnvOptions`

`EnvOptions` contains the common settings used by environment operations.

```cpp
vix::env::EnvOptions options;
options.trim_whitespace = true;
options.allow_empty_values = true;
options.overwrite_existing = true;
options.require_existing = false;
```

`trim_whitespace` controls whether leading and trailing whitespace should be removed when parsing dotenv keys and values. Keeping it enabled makes files such as `PORT = 8080` behave as expected.

`allow_empty_values` controls whether entries such as `API_TOKEN=` are accepted. Empty values are allowed by default because some configuration files intentionally leave values blank in local development or examples.

`overwrite_existing` controls whether loading values into the process may replace variables that already exist. This matters when a deployment platform, service manager, or shell already provides a value.

`require_existing` is part of the common option model for environment workflows where missing variables should be treated strictly. Most direct read functions already make the required behavior explicit through their result type.

## Preserve existing process values

When a surrounding runtime already provides variables, a dotenv file should sometimes fill only the missing values. Set `overwrite_existing` to `false` for that workflow.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto set_error = vix::env::set("APP_ENV", "production");

  if (set_error)
  {
    vix::print("failed to set APP_ENV:", set_error.message());
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
    vix::print("APP_ENV:", app_env.value());
  }

  return 0;
}
```

In this example, an existing `APP_ENV` value is preserved. This is useful when production values should take priority over local dotenv defaults.

## Reject empty values

Empty values are allowed by default, but some applications want stricter configuration. Disable `allow_empty_values` when a key must have a real value.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.env.allow_empty_values = false;

  auto entry = vix::env::parse_line("DATABASE_URL=", options);

  if (!entry.ok())
  {
    vix::print("invalid dotenv entry:", entry.error().message());
    return 1;
  }

  vix::print("value:", entry.value().value);

  return 0;
}
```

This is most useful for required secrets, connection strings, paths, and runtime values where an empty string would be misleading.

## `EnvFileOptions`

`EnvFileOptions` controls file resolution, dotenv parsing, and layered loading.

```cpp
vix::env::EnvFileOptions options;
options.base_dir = ".";
options.filename = ".env";
options.environment_name = "production";
options.mode = vix::env::EnvFileMode::Layered;
```

`base_dir` defines the directory from which dotenv files are resolved. `filename` defines the base file name, usually `.env`. `environment_name` is used when resolving environment-specific files such as `.env.production` or `.env.test`.

The `mode` field controls whether the resolver behaves as a single-file loader or as a layered loader.

```cpp
options.mode = vix::env::EnvFileMode::Single;
```

Single mode resolves only the primary file.

```cpp
options.mode = vix::env::EnvFileMode::Layered;
```

Layered mode can resolve a selected set of base, local, environment-specific, and environment-local files.

## Layer selection

Layered loading is controlled by four boolean fields.

```cpp
options.load_base_file = true;
options.load_local_file = true;
options.load_environment_file = true;
options.load_environment_local_file = true;
```

With `filename = ".env"` and `environment_name = "production"`, these fields correspond to the following files:

```txt
.env
.env.local
.env.production
.env.production.local
```

The files are resolved in that order. When values are later injected into the process with overwrite enabled, later layers may replace values from earlier layers.

## Missing files

Use `ignore_missing_files` to decide whether selected files are required.

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

When `ignore_missing_files` is enabled, absent selected files are skipped. This is useful for optional local overrides. When it is disabled, every selected file must exist and load successfully.

## Quote handling

By default, quoted values are unquoted during parsing.

```dotenv
APP_NAME="Vix App"
```

With the default options, this value is parsed as `Vix App`.

Disable `strip_quotes` when a tool needs to preserve the original quoted form.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.strip_quotes = false;

  auto entry = vix::env::parse_line("APP_NAME=\"Vix App\"", options);

  if (!entry.ok())
  {
    vix::print("failed to parse line:", entry.error().message());
    return 1;
  }

  vix::print("value:", entry.value().value);

  return 0;
}
```

This is usually more useful for tooling than for application startup. Most applications want the final value, not the source-level quoting.

## Comment and whitespace behavior

Dotenv parsing ignores comment lines by default and trims whitespace around keys and values.

```dotenv
# Runtime mode
APP_ENV = production
```

With default options, the parsed key is `APP_ENV` and the parsed value is `production`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.env.trim_whitespace = true;
  options.ignore_comments = true;

  auto entry = vix::env::parse_line(" APP_ENV = production ", options);

  if (!entry.ok())
  {
    vix::print("failed to parse line:", entry.error().message());
    return 1;
  }

  vix::print("key:", entry.value().key);
  vix::print("value:", entry.value().value);

  return 0;
}
```

Whitespace trimming should normally stay enabled. Disabling it makes parsing stricter and is mainly useful when building tools that need to expose malformed input instead of accepting it.

## Path resolution options

`EnvFileOptions` also contains a `path` field for path normalization behavior.

```cpp
vix::env::EnvFileOptions options;
options.base_dir = "./config";
options.filename = ".env";
```

When a file is resolved, the module joins `base_dir` and `filename`, then normalizes the result using the configured path options.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.base_dir = "./config";
  options.filename = ".env";

  auto path = vix::env::resolve_env_file(options);

  if (!path.ok())
  {
    vix::print("failed to resolve .env path:", path.error().message());
    return 1;
  }

  vix::print("resolved path:", path.value());

  return 0;
}
```

This keeps file resolution consistent with the Vix path module instead of relying on ad hoc string concatenation.

## Practical layered setup

A typical production-aware setup enables layered mode, names the target environment, allows optional local files, and preserves values already provided by the surrounding process.

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

  auto error = vix::env::load_layered_into_process(options);

  if (error)
  {
    vix::print("failed to load environment:", error.message());
    return 1;
  }

  vix::print("environment loaded");

  return 0;
}
```

This setup lets local or environment-specific files exist when they are useful, while still respecting values that were already provided by the runtime.

## Option summary

| Option                                        | Default  | Purpose                                                      |
| --------------------------------------------- | -------- | ------------------------------------------------------------ |
| `EnvOptions::trim_whitespace`                 | `true`   | Trim whitespace around parsed keys and values.               |
| `EnvOptions::case_insensitive_bools`          | `true`   | Describes case-insensitive boolean parsing behavior.         |
| `EnvOptions::allow_empty_values`              | `true`   | Allow entries such as `KEY=`.                                |
| `EnvOptions::overwrite_existing`              | `true`   | Allow process injection to replace existing variables.       |
| `EnvOptions::require_existing`                | `false`  | Common option for strict environment workflows.              |
| `EnvFileOptions::base_dir`                    | `"."`    | Base directory used to resolve dotenv files.                 |
| `EnvFileOptions::filename`                    | `".env"` | Base dotenv filename.                                        |
| `EnvFileOptions::environment_name`            | `""`     | Environment suffix used for files such as `.env.production`. |
| `EnvFileOptions::mode`                        | `Single` | Resolve one file or layered files.                           |
| `EnvFileOptions::load_base_file`              | `true`   | Include the base file.                                       |
| `EnvFileOptions::load_local_file`             | `false`  | Include the local override file.                             |
| `EnvFileOptions::load_environment_file`       | `false`  | Include the environment-specific file.                       |
| `EnvFileOptions::load_environment_local_file` | `false`  | Include the environment-local override file.                 |
| `EnvFileOptions::ignore_missing_files`        | `true`   | Skip selected files that are absent.                         |
| `EnvFileOptions::ignore_blank_lines`          | `true`   | Treat blank lines as ignored input.                          |
| `EnvFileOptions::ignore_comments`             | `true`   | Ignore comment lines beginning with `#`.                     |
| `EnvFileOptions::strip_quotes`                | `true`   | Remove matching quotes around parsed values.                 |

## Next steps

Continue with the errors page to understand the environment-specific error codes, how they map into the Vix error system, and how to report configuration failures clearly during startup.
