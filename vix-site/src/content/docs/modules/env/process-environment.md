# Process Environment

The process environment is the set of variables visible to a running program. In a Vix application, these values often describe runtime configuration such as the application mode, server port, database URL, feature flags, or paths provided by the shell, service manager, container runtime, or deployment platform.

The `env` module provides a small API for working with that environment from C++. It keeps direct calls to platform environment functions out of application code and returns structured errors when a requested value cannot be read safely.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Reading a variable

Use `get()` when a variable is required and the application should handle a missing value explicitly.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto app_env = vix::env::get("APP_ENV");

  if (!app_env.ok())
  {
    vix::print("APP_ENV is missing:", app_env.error().message());
    return 1;
  }

  vix::print("environment:", app_env.value());

  return 0;
}
```

`get()` reads from the current process environment and returns a `vix::error::Result<std::string>`. This is useful during startup because configuration errors can be reported before the application begins running with an incomplete setup.

## Reading with a default

Use `get_or()` when a value is optional and the application has a safe fallback.

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

`get_or()` returns the provided default when the key cannot be read. That includes missing variables and invalid keys, so it should be used for optional values rather than required runtime settings.

## Checking whether a variable exists

Use `has()` when the application only needs to know whether a value is present.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  if (vix::env::has("DATABASE_URL"))
  {
    vix::print("database configuration is present");
  }
  else
  {
    vix::print("database configuration is not set");
  }

  return 0;
}
```

This is useful for optional integrations, feature-specific configuration, and diagnostics where the application should not read or parse a value yet.

## Setting a variable

Use `set()` to write a variable into the current process environment.

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

  auto app_env = vix::env::get("APP_ENV");

  if (app_env.ok())
  {
    vix::print("environment:", app_env.value());
  }

  return 0;
}
```

Setting a variable changes the environment of the current process. It does not edit the user’s shell configuration or rewrite a `.env` file. This makes it useful for tests, startup preparation, and workflows where parsed configuration needs to become visible through the normal environment API.

## Controlling overwrite behavior

By default, `set()` may replace an existing value. Pass `false` as the third argument when an existing variable should be preserved.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto first = vix::env::set("APP_ENV", "development");
  auto second = vix::env::set("APP_ENV", "production", false);

  if (first || second)
  {
    vix::print("failed to configure APP_ENV");
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

This behavior matters when values may already be provided by the surrounding runtime. In production, a service manager or container platform may provide values that should not be overwritten by local defaults.

## Removing a variable

Use `unset()` to remove a variable from the current process environment.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto error = vix::env::unset("APP_ENV");

  if (error)
  {
    vix::print("failed to unset APP_ENV:", error.message());
    return 1;
  }

  if (!vix::env::has("APP_ENV"))
  {
    vix::print("APP_ENV is not set");
  }

  return 0;
}
```

Removing a missing variable is treated as a successful operation. An error is returned when the key itself is invalid or when the platform operation fails.

## Environment key rules

Environment keys accepted by the Env module must start with a letter or `_`, and the remaining characters must be letters, digits, or `_`.

```txt
APP_ENV
DATABASE_URL
VIX_LOG_LEVEL
_WORKER_COUNT
```

Keys such as `APP-ENV`, `1PORT`, or an empty key are rejected by functions that validate names. This keeps behavior predictable across platforms and avoids accepting names that are not suitable for normal environment configuration.

## Reading process values before type conversion

The process environment stores values as strings. `get()` returns the raw string value, while typed readers such as `get_bool()`, `get_int()`, `get_uint()`, and `get_double()` read from the same process environment and then parse the value.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto raw_port = vix::env::get("PORT");

  if (!raw_port.ok())
  {
    vix::print("PORT is missing");
    return 1;
  }

  vix::print("raw port:", raw_port.value());

  return 0;
}
```

Use raw string access when the value should remain text, such as an application name, URL, token, path, or mode. Use the typed readers when the value must be validated as a number or boolean.

## Next steps

Continue with the typed values page to read environment variables as booleans, integers, unsigned integers, and doubles while keeping configuration parsing strict and explicit.
