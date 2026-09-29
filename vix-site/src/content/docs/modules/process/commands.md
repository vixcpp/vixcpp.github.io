# Commands

`Command` is the builder object used to describe a process before it is launched. It stores the executable name or path, the argument list, environment overrides, the working directory, and execution options such as stream handling and `PATH` lookup.

The important idea is that a command is structured data. The program is not mixed with its arguments, and arguments are not parsed by a hidden shell. This makes process execution easier to read, easier to validate, and more predictable across POSIX and Windows.

## Header

Use the public process header:

```cpp id="xj3m6n"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="gy8vo9"
#include <vix/print.hpp>
```

## Create a command

A command starts with a program name or an executable path.

```cpp id="o3pygp"
vix::process::Command command("git");
```

The program may be a simple executable name that can be resolved through `PATH`, or a direct path to an executable.

```cpp id="culizg"
vix::process::Command command("./tools/generate");
```

The command is valid when the program is not empty.

```cpp id="fa1ku0"
vix::process::Command command("git");

if (command.valid())
{
  vix::print("program", command.program());
}
```

An empty program is invalid and will cause APIs such as `spawn()` or `output()` to return a structured error.

## Add arguments

Arguments are added separately with `arg()`.

```cpp id="p3y979"
vix::process::Command command("git");

command.arg("status");
command.arg("--short");
```

The resulting command represents this process invocation:

```txt id="tibv91"
git status --short
```

The module does not require you to write that as one string. This matters because shell quoting rules are platform-specific and easy to get wrong. By keeping arguments separate, the command object expresses the exact values that should be passed to the child process.

## Add many arguments

Use `args()` when several arguments are known together.

```cpp id="fsaer2"
vix::process::Command command("git");

command.args({
  "log",
  "--oneline",
  "-n",
  "5"
});
```

This is equivalent to calling `arg()` several times. The arguments are appended in order.

```cpp id="uf9fnj"
vix::process::Command command("git");

command.arg("log");
command.arg("--oneline");
command.arg("-n");
command.arg("5");
```

Use whichever form keeps the code clearer.

## Change the program

The `program()` setter replaces the executable name or path.

```cpp id="q30mab"
vix::process::Command command("python");

command.program("python3");
```

The getter returns the currently configured program.

```cpp id="tukjdm"
vix::print("program", command.program());
```

Changing the program does not remove existing arguments. This can be useful when a command is built in stages, but it also means the final command should be checked before it is executed.

## Command is not a shell string

A `Command` does not automatically interpret shell syntax.

```cpp id="clz8em"
vix::process::Command command("echo hello");
```

This describes a program literally named `echo hello`, not the program `echo` with the argument `hello`.

The structured version is:

```cpp id="z0zup5"
vix::process::Command command("echo");
command.arg("hello");
```

When shell syntax is actually needed, name the shell explicitly.

```cpp id="1m3in1"
#if defined(_WIN32)
vix::process::Command command("cmd");
command.arg("/C");
command.arg("echo hello && echo done");
#else
vix::process::Command command("sh");
command.arg("-c");
command.arg("echo hello && echo done");
#endif
```

This keeps the boundary visible. The process module launches the program you describe. Shell parsing only happens when the shell itself is the program.

## Environment overrides

Use `env()` to add or replace an environment variable for the child process.

```cpp id="ej9fbt"
vix::process::Command command("my-tool");

command.env("APP_ENV", "development");
command.env("VIX_LOG_LEVEL", "debug");
```

Environment values are stored as key-value pairs. During process creation, the platform backend builds the environment used by the child. When environment inheritance is enabled, overrides are merged into the parent environment. When inheritance is disabled, the command environment becomes the explicit environment set for the child.

```cpp id="y2dyp6"
command.inherit_environment(false);
command.env("APP_ENV", "test");
```

This is useful for tests, build tools, and commands that should run with a controlled environment.

## Working directory

Use `cwd()` to set the child process working directory.

```cpp id="kswsro"
vix::process::Command command("git");

command.arg("status");
command.cwd("/path/to/project");
```

An empty working directory means the child uses the current working directory of the parent process.

The working directory belongs to the command description, not to the whole application. This lets different commands run in different project directories without changing the parent process state.

## Search in PATH

By default, a command can search for the executable in `PATH`.

```cpp id="db4xkf"
vix::process::Command command("git");

command.search_in_path(true);
```

Disable `PATH` lookup when the command should only use the exact program path.

```cpp id="ddcxub"
vix::process::Command command("/usr/bin/git");

command.search_in_path(false);
```

This is useful when a tool must run a specific executable instead of whichever executable happens to appear first in the environment.

On Windows, `search_in_path(true)` lets the platform process creation behavior search for the command. On POSIX, the backend uses path-search behavior when the option is enabled.

## Stream modes

A command stores how stdin, stdout, and stderr should be handled.

```cpp id="nsg35p"
vix::process::Command command("my-tool");

command.stdin_mode(vix::process::PipeMode::Null);
command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);
```

The available modes are:

```txt id="yhpxfs"
PipeMode::Inherit  use the parent process stream
PipeMode::Pipe     create a pipe
PipeMode::Null     redirect to the null device
```

For most captured commands, `output()` is easier because it configures stdin, stdout, and stderr for the capture workflow internally. Set pipe modes directly when using lower-level spawn workflows or when the command should inherit or discard specific streams.

## Detached processes

Use `detach()` when the child should run independently from the parent process.

```cpp id="ybj6ug"
vix::process::Command command("my-daemon");

command.detach(true);
```

A detached child should not be treated like a normal short-lived command. The parent may not wait for it in the usual workflow, and platform behavior differs. Use detach mode for processes that are intentionally launched as independent background work.

## Access command data

`Command` exposes read-only accessors for the configured values.

```cpp id="mrqjlm"
const auto &program = command.program();
const auto &args = command.args();
const auto &environment = command.environment();
const auto &options = command.options();

vix::print("program", program);
vix::print("argument count", args.size());
vix::print("environment override count", environment.size());
vix::print("search in path", options.search_in_path);
```

These accessors are useful for logging, diagnostics, testing, and higher-level wrappers that build commands before executing them.

## Complete example

This example builds a command in a portable way, runs it with `output()`, and prints the captured result.

```cpp id="p1tvip"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo %VIX_PROCESS_MODE%");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("printf '%s\n' \"$VIX_PROCESS_MODE\"");
#endif

  command.env("VIX_PROCESS_MODE", "command-builder");
  command.cwd(".");
  command.inherit_environment(true);
  command.stdin_mode(vix::process::PipeMode::Null);
  command.stdout_mode(vix::process::PipeMode::Pipe);
  command.stderr_mode(vix::process::PipeMode::Pipe);

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("command failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  return out.success() ? 0 : 1;
}
```

This example uses a shell because it reads an environment variable using shell syntax. The shell is named explicitly, so the command remains honest about what is being executed.

## Validate before execution

A command with an empty program is invalid.

```cpp id="id9zci"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("");

  if (!command.valid())
  {
    vix::print("command is invalid");
    return 0;
  }

  auto result = vix::process::spawn(command);

  return result ? 1 : 0;
}
```

`valid()` only checks the basic requirement that the program is not empty. It does not prove that the executable exists, that the working directory is valid, or that the current user has permission to launch the program. Those checks happen when the command is executed and are reported through the process result error.

## Common mistakes

Do not put the whole command line into the program field. Use `Command("git").arg("status")`, not `Command("git status")`.

Do not rely on shell features unless a shell is part of the command. Redirection, pipes written as `|`, environment expansion, `&&`, and wildcard expansion are shell behavior.

Do not forget that arguments are passed in order. A command builder keeps the code clear, but it still represents the exact argument order the target program receives.

Do not disable environment inheritance without adding the variables the child actually needs. Some programs depend on variables such as `PATH`, `HOME`, `USERPROFILE`, or language/runtime configuration.

## Next step

Continue with options and pipes to understand stdin, stdout, stderr, `PipeMode`, working directory, environment inheritance, and process execution options in more detail.

```md id="o4h0cn"
[Options and Pipes](./options-and-pipes.md)
```
