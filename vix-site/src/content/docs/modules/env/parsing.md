# Parsing

The `env` module includes a small dotenv parser for cases where configuration is already available as text or needs to be inspected before it is loaded from disk. The parser can read one line at a time with `parse_line()`, or it can parse a complete dotenv document with `parse_content()`.

Parsing is separate from process injection. When you parse dotenv content, the module returns structured data. It does not automatically modify the current process environment. This makes parsing useful for tests, validation tools, diagnostics, and workflows where you want to inspect configuration before deciding whether to use it.

## Header

Use the public Env module header:

```cpp
#include <vix/env.hpp>
```

For examples that print output or diagnostics, include:

```cpp
#include <vix/print.hpp>
```

## Dotenv syntax

The parser supports simple key-value entries.

```dotenv
APP_ENV=development
PORT=8080
DEBUG=true
```

Whitespace around the `=` separator is allowed.

```dotenv
APP_ENV = development
PORT = 8080
```

The `export` prefix is also accepted.

```dotenv
export DB_HOST=localhost
```

Blank lines are ignored, and comment lines beginning with `#` are ignored.

```dotenv
# Runtime mode
APP_ENV=production

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

By default, quotes around values are removed during parsing.

## Parse one line

Use `parse_line()` when you want to parse a single dotenv entry.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto entry = vix::env::parse_line("APP_ENV=production");

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

A successful parsed entry contains a `key` and a `value`. If the line is blank or is a comment, the parser succeeds with an empty entry. This lets `parse_content()` skip ignored lines without treating them as errors.

## Ignored lines

Blank lines and comment lines are considered valid input. They do not create real entries.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto blank = vix::env::parse_line("   ");
  auto comment = vix::env::parse_line("# local settings");

  if (!blank.ok() || !comment.ok())
  {
    vix::print("unexpected parse error");
    return 1;
  }

  vix::print("blank key is empty:", blank.value().key.empty());
  vix::print("comment key is empty:", comment.value().key.empty());

  return 0;
}
```

This behavior keeps dotenv files readable. Comments and spacing can be used to organize configuration without changing the parsed values.

## Inline comments

Inline comments are removed only when they appear outside quoted values.

```dotenv
APP_NAME=vix # application name
TITLE="Vix # Runtime"
```

The first value is parsed as `vix`. The second value is parsed as `Vix # Runtime`, because the `#` belongs to the quoted value.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto name = vix::env::parse_line("APP_NAME=vix # application name");
  auto title = vix::env::parse_line("TITLE=\"Vix # Runtime\"");

  if (!name.ok() || !title.ok())
  {
    vix::print("failed to parse dotenv lines");
    return 1;
  }

  vix::print("name:", name.value().value);
  vix::print("title:", title.value().value);

  return 0;
}
```

This rule makes comments useful for simple values while still allowing quoted strings to contain characters that would otherwise have special meaning.

## Parse full content

Use `parse_content()` when you already have the complete dotenv text in memory.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::parse_content(
      "APP_ENV=test\n"
      "PORT=9000\n"
      "DEBUG=false\n",
      ".env.test");

  if (!file.ok())
  {
    vix::print("failed to parse content:", file.error().message());
    return 1;
  }

  vix::print("path:", file.value().path);
  vix::print("entries:", file.value().entries.size());
  vix::print("port:", file.value().values.at("PORT"));

  return 0;
}
```

`parse_content()` returns an `EnvFile`. The `path` argument is stored in the result so diagnostics and tools can keep track of where the content came from, even when the content was not read directly from disk.

## Entries and values

A parsed `EnvFile` contains both an ordered list of entries and a map of values.

```cpp
struct EnvFile
{
  std::string path;
  EnvEntryList entries;
  EnvMap values;
};
```

The ordered entries preserve the sequence found in the dotenv content. The map provides direct lookup by key.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  auto file = vix::env::parse_content(
      "APP_ENV=development\n"
      "APP_ENV=production\n",
      ".env");

  if (!file.ok())
  {
    vix::print("failed to parse content:", file.error().message());
    return 1;
  }

  vix::print("entry count:", file.value().entries.size());
  vix::print("final APP_ENV:", file.value().values.at("APP_ENV"));

  return 0;
}
```

If a key appears more than once, `entries` keeps every occurrence, while `values` stores the last value. This is useful because tools can still inspect the original file shape, while application code can read the effective value.

## Parsing errors

A line is invalid when it does not contain an `=` separator, when the key is empty, or when the key contains unsupported characters.

```dotenv
INVALID_LINE
=value
APP-ENV=production
```

When `parse_content()` fails, the error message includes the line number that caused the failure.

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
    vix::print("parse error:", file.error().message());
    return 1;
  }

  return 0;
}
```

This makes configuration problems easier to locate in real files, especially when the dotenv content is generated or maintained by more than one person.

## Parsing options

Parsing behavior can be adjusted with `EnvFileOptions`.

```cpp
#include <vix/env.hpp>
#include <vix/print.hpp>

int main()
{
  vix::env::EnvFileOptions options;
  options.strip_quotes = false;
  options.env.allow_empty_values = false;

  auto entry = vix::env::parse_line("TITLE=\"Hello Vix\"", options);

  if (!entry.ok())
  {
    vix::print("failed to parse line:", entry.error().message());
    return 1;
  }

  vix::print("value:", entry.value().value);

  return 0;
}
```

With `strip_quotes` disabled, surrounding quotes are kept in the parsed value. With `allow_empty_values` disabled, a line such as `EMPTY_VALUE=` is rejected.

## Key rules

Environment keys must start with a letter or `_`. The remaining characters must be letters, digits, or `_`.

```txt
APP_ENV
DATABASE_URL
_WORKER_COUNT
VIX_LOG_LEVEL
```

Keys such as `APP-ENV`, `1PORT`, and an empty key are rejected. Keeping the key rules strict avoids accepting names that behave differently across platforms or are unsuitable for normal environment configuration.

## Parsing and loading

Parsing does not load values into the process environment.

```cpp
auto file = vix::env::parse_content("PORT=8080\n", ".env");
```

This returns parsed data. It does not make `PORT` visible to `vix::env::get_int("PORT")`.

To inject values into the current process environment, use `load_into_process()` for a file on disk or `set()` for individual values.

```cpp
auto error = vix::env::load_into_process(".env");
```

Keeping parsing separate from injection makes the workflow clearer. A tool can inspect a dotenv file without changing the process, while application startup code can deliberately load values before reading them through the normal environment API.

## Next steps

Continue with layered loading to see how the module resolves and loads `.env`, `.env.local`, environment-specific files, and local environment overrides in a predictable order.
