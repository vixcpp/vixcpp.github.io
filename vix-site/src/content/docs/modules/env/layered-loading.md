# Layered Loading

Layered loading is the workflow for applications that read configuration from more than one dotenv file. A base file can hold shared values, a local file can override values on a developer machine, and an environment-specific file can describe production, test, or development behavior without changing the application code.

The `env` module keeps this workflow explicit. The application chooses which layers are allowed, the resolver builds the matching file paths in a predictable order, and the loader reads the files that are present. This makes configuration easier to reason about than scattering conditional file names throughout startup code.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Layer order

A common layered setup starts with `.env` and then applies more specific files after it.

```txt
.env
.env.local
.env.production
.env.production.local
```

The order matters. Earlier files provide the base configuration, and later files can provide more specific values. For example, `.env` may define the default port, while `.env.production.local` may override it for a specific production machine.

```dotenv
# .env
APP_ENV=development
PORT=8080
DEBUG=true
```

```dotenv
# .env.production
APP_ENV=production
DEBUG=false
```

Layered loading does not require every file to exist. In many projects, `.env.local` exists only on a developer machine, while `.env.production` may only exist on a server or in a deployment image.

## Configure layered loading

Use `EnvFileOptions` to describe which files should be resolved and loaded.

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

This configuration asks the module to consider the base file, the local override file, the environment-specific file, and the environment-local override file. Because `ignore_missing_files` is enabled, selected files that do not exist are skipped instead of failing the whole operation.

## Resolve paths without loading files

Sometimes a tool needs to know which files would be used before reading them. Use `resolve_env_files()` for that.

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

  return 0;
}
```

Resolving paths is useful for diagnostics, project checks, and tools that want to show the configuration plan before reading any files from disk.

## Loading selected layers

The loader only uses the layers selected in `EnvFileOptions`. If an application does not want local override files, it can disable them.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.mode = vix::env::EnvFileMode::Layered;
  options.base_dir = ".";
  options.filename = ".env";
  options.environment_name = "test";
  options.load_base_file = true;
  options.load_local_file = false;
  options.load_environment_file = true;
  options.load_environment_local_file = false;
  options.ignore_missing_files = false;

  auto files = vix::env::load_layered(options);

  if (!files.ok())
  {
    vix::print("failed to load selected environment files:", files.error().message());
    return 1;
  }

  vix::print("loaded files:", files.value().size());

  return 0;
}
```

With this setup, the loader expects only `.env` and `.env.test`. Because missing files are not ignored, the load fails if one of the selected files cannot be opened.

## Missing files

Missing files are common in layered configuration. A local override file may be intentionally absent, and an environment-specific local file may only exist on one machine. The `ignore_missing_files` option controls whether that situation is treated as normal or as a startup error.

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
    vix::print("environment loading failed:", files.error().message());
    return 1;
  }

  vix::print("loaded available layers:", files.value().size());

  return 0;
}
```

Enable `ignore_missing_files` when optional layers are part of the normal workflow. Disable it when every selected file is required for the application to start correctly.

## Environment name

The environment name is used to build environment-specific file names.

```txt
.env.production
.env.production.local
.env.test
.env.test.local
```

If `load_environment_file` or `load_environment_local_file` is enabled, `environment_name` must not be empty.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.mode = vix::env::EnvFileMode::Layered;
  options.filename = ".env";
  options.environment_name = "production";
  options.load_environment_file = true;

  auto paths = vix::env::resolve_env_files(options);

  if (!paths.ok())
  {
    vix::print("invalid layered configuration:", paths.error().message());
    return 1;
  }

  vix::print("resolved files:", paths.value().size());

  return 0;
}
```

This check prevents ambiguous configuration. If the application asks for an environment-specific layer, it must also say which environment should be used.

## Loading into the process

`load_layered()` reads the selected files and returns them as parsed `EnvFile` values. It does not inject the values into the process environment. Use `load_layered_into_process()` when the application wants the parsed values to become visible through `get()`, `get_int()`, `get_bool()`, and the other process environment readers.

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
    vix::print("failed to load environment into process:", error.message());
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

The overwrite option matters when the surrounding environment already provides values. With `overwrite_existing` enabled, later injected values can replace existing process variables. With it disabled, existing process variables are preserved.

## Single mode and layered mode

`EnvFileMode::Single` resolves only the primary file named by `filename`. This is useful when an application or tool wants to treat configuration as one explicit file.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.mode = vix::env::EnvFileMode::Single;
  options.base_dir = ".";
  options.filename = ".env";

  auto files = vix::env::load_layered(options);

  if (!files.ok())
  {
    vix::print("failed to load environment file:", files.error().message());
    return 1;
  }

  vix::print("loaded files:", files.value().size());

  return 0;
}
```

Even though `load_layered()` can be called in single mode, the result contains only the primary file. Use layered mode when the application really wants the ordered multi-file workflow.

## Next steps

Continue with the load into process page to see how parsed dotenv values are injected into the current process environment and then read through the normal Env API.
