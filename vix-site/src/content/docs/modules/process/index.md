# Process

The `process` module provides structured process execution for Vix applications. It gives C++ code a portable way to describe a command, launch a child process, inspect its state, wait for completion, capture output, terminate a running process, and connect two commands through a simple pipeline.

This module exists because process execution is easy to make unsafe or unclear when it is treated as a raw shell string. In `vix::process`, a command is built as data: the program name is separate from its arguments, environment overrides are explicit, stream behavior is configured through options, and the result is returned through Vix error-aware types. That makes the workflow easier to read and easier to handle across POSIX and Windows.

## Header

Use the public process header in normal application code:

```cpp id="w53xsq"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="peiqot"
#include <vix/print.hpp>
```

The module also exposes narrower headers under `<vix/process/...>` for files that intentionally depend on a specific part of the API, but application code should normally start with the public module header.

## First example

The simplest high-level workflow is `output()`. It runs a command to completion and captures its standard output and standard error.

```cpp id="l0o8cs"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from vix process");
#else
  vix::process::Command command("echo");
  command.arg("hello from vix process");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("process failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  return out.success() ? 0 : 1;
}
```

On POSIX, `echo` is commonly available as a program. On Windows, this example uses `cmd /C` because `echo` is normally a shell command. The process module does not silently parse shell syntax for you; when shell behavior is needed, the shell should be named explicitly.

## Mental model

The process module is built around a small workflow.

```txt id="v96fup"
Command -> spawn() -> Child -> status() / wait() / terminate() / kill()
Command -> output() -> ProcessOutput
Command + Command -> pipeline::spawn() -> PipelineChildren -> pipeline::wait()
```

`Command` describes what should be launched. `spawn()` creates a `Child` handle. The child handle can then be inspected, waited on, or terminated. `output()` is the convenience path for short-lived commands where the application wants the final exit code and captured text. The pipeline API is used when the output of one command should feed the input of another command.

## Command

`Command` is the builder object used to describe a process.

```cpp id="91s7tg"
vix::process::Command command("git");

command.arg("status");
command.arg("--short");
command.cwd("/path/to/project");
command.env("GIT_TERMINAL_PROMPT", "0");
```

A command stores the program, arguments, environment overrides, working directory, stream options, and process execution options. Arguments are added as separate values. The module does not ask the user to concatenate one large command string and hope that shell quoting behaves the same on every platform.

This is the main design choice of the module. Process execution should be explicit enough that a developer can read the code and understand exactly which executable is launched and which arguments are passed to it.

## Process options

`Command` exposes execution options through builder methods. These options control how the child process is created.

```cpp id="sks5bc"
vix::process::Command command("my-tool");

command.arg("--check");
command.cwd("./project");
command.search_in_path(true);
command.inherit_environment(true);
command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);
```

`PipeMode` controls the standard streams:

```txt id="vjsy3t"
PipeMode::Inherit  use the parent process stream
PipeMode::Pipe     create a pipe for capture or communication
PipeMode::Null     redirect the stream to the null device
```

The high-level `output()` function configures the streams for capture internally. Lower-level spawn workflows can set the modes directly when they need more control.

## Child processes

`spawn()` launches a command and returns a `Child` handle.

```cpp id="d7t6av"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 0");
#else
  vix::process::Command command("true");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  vix::print("process id", child.id());

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("exit code", waited.value());

  return waited.value() == 0 ? 0 : 1;
}
```

`Child` is a lightweight public handle. It stores a portable process id and an opaque backend handle used internally by the POSIX or Windows implementation. Application code should treat it as the handle required by `status()`, `wait()`, `terminate()`, and `kill()`.

## Capturing output

`output()` is the preferred API for short-lived commands where the application needs the final output.

```cpp id="jblfp6"
vix::process::Command command("git");

command.arg("--version");

auto result = vix::process::output(command);

if (result && result.value().success())
{
  vix::print(result.value().stdout_text);
}
```

The returned `ProcessOutput` contains:

```txt id="e263it"
exit_code
stdout_text
stderr_text
success()
```

This is useful for tooling, diagnostics, CLI integration, feature detection, and small process-based tasks where the parent should wait for the command to finish.

## Status and waiting

`status()` checks whether a child process is still running without performing a full blocking wait.

```cpp id="p7050h"
auto running = vix::process::status(child);

if (!running)
{
  vix::print("status failed", running.error().message());
  return 1;
}

vix::print("running", running.value());
```

`wait()` blocks until the child exits and returns its final exit code.

```cpp id="p2ibtz"
auto exit_code = vix::process::wait(child);

if (!exit_code)
{
  vix::print("wait failed", exit_code.error().message());
  return 1;
}

vix::print("exit code", exit_code.value());
```

The two functions serve different purposes. `status()` is for checking the current state. `wait()` is for collecting the final result.

## Terminate and kill

The module exposes two termination functions.

```cpp id="b4j6xn"
auto err = vix::process::terminate(child);

if (err)
{
  vix::print("terminate failed", err.message());
}
```

`terminate()` requests a graceful stop when the platform can provide one. On POSIX this maps to `SIGTERM`. On Windows the implementation uses the available platform termination strategy.

```cpp id="d4l4wo"
auto err = vix::process::kill(child);

if (err)
{
  vix::print("kill failed", err.message());
}
```

`kill()` is the stronger operation. On POSIX this maps to `SIGKILL`; on Windows it maps to process termination through the platform API. Use `terminate()` when the child should have a chance to shut down cleanly. Use `kill()` when the process must be stopped forcefully.

## Pipelines

The pipeline API connects two commands. The standard output of the first command becomes the standard input of the second command.

```cpp id="qduziu"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command producer("cmd");
  producer.arg("/C");
  producer.arg("echo hello from pipeline");

  vix::process::Command consumer("sort");
#else
  vix::process::Command producer("echo");
  producer.arg("hello from pipeline");

  vix::process::Command consumer("cat");
#endif

  auto spawned = vix::process::pipeline::spawn(producer, consumer);

  if (!spawned)
  {
    vix::print("pipeline spawn failed", spawned.error().message());
    return 1;
  }

  auto waited = vix::process::pipeline::wait(spawned.value());

  if (!waited)
  {
    vix::print("pipeline wait failed", waited.error().message());
    return 1;
  }

  const auto &result = waited.value();

  vix::print("first exit code", result.first_exit_code);
  vix::print("second exit code", result.second_exit_code);
  vix::print("pipeline success", result.success());

  return result.success() ? 0 : 1;
}
```

The pipeline API is intentionally focused on two stages. It gives applications a structured way to express a common process pattern without turning the whole module into a shell language.

## Async process APIs

The module also integrates with `vix::async`.

```txt id="smbe97"
vix::process::async::spawn()
vix::process::async::output()
vix::process::async::wait()
vix::process::pipeline::async::spawn()
vix::process::pipeline::async::wait()
```

The async spawn and output functions offload the blocking process operation to the async runtime CPU pool and resume the coroutine on the owning `io_context` scheduler. The async wait function checks process status periodically and supports cancellation through `cancel_token`.

This makes the process module usable in coroutine-based applications without forcing the main scheduler to block while a child process is running.

## Error model

Synchronous process APIs return Vix result types or structured errors.

```cpp id="dawf1f"
auto result = vix::process::spawn(command);

if (!result)
{
  vix::print("error", result.error().message());
  return 1;
}
```

Process-specific errors are represented by `ProcessErrorCode` and converted into the generic Vix error system. This keeps failures explicit. Empty commands, invalid child handles, failed spawns, failed waits, permission errors, capture failures, and unsupported operations can all be reported without relying on exceptions in the synchronous API.

The async APIs use coroutine-friendly behavior and throw when the underlying process operation fails or when cancellation is observed by the async runtime.

## When to use this module

Use `process` when a Vix application needs to call another executable, integrate with command-line tools, capture the result of a short process, run a child process and wait for it later, inspect or stop a running child, or build a small two-stage pipeline.

The module is not meant to hide platform behavior completely. Process creation, signal behavior, executable lookup, and shell commands still have platform-specific rules. The purpose of the module is to give those operations a consistent C++ API and a clear error model.

## Main components

| Component           | Purpose                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `Command`           | Describes the program, arguments, environment, working directory, and process options.            |
| `ProcessOptions`    | Stores stream behavior, environment inheritance, PATH lookup, detach mode, and working directory. |
| `PipeMode`          | Defines how stdin, stdout, and stderr are handled.                                                |
| `Child`             | Represents a spawned process handle.                                                              |
| `spawn()`           | Starts a child process and returns `Child`.                                                       |
| `status()`          | Checks whether a child process is still running.                                                  |
| `wait()`            | Waits for process completion and returns an exit code.                                            |
| `output()`          | Runs a command to completion and captures stdout and stderr.                                      |
| `terminate()`       | Requests graceful termination when possible.                                                      |
| `kill()`            | Forcefully stops a child process.                                                                 |
| `pipeline::spawn()` | Starts a two-stage process pipeline.                                                              |
| `pipeline::wait()`  | Waits for both pipeline stages and returns both exit codes.                                       |
| `process::async`    | Provides coroutine-based process helpers.                                                         |

## Next step

Continue with the quick start to run a small command, capture its output, and handle errors through the process result API.

```md id="wq1kh0"
[Quick Start](./quick-start.md)
```
