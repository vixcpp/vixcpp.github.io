# Quick Start

This quick start shows the two most common ways to use the `process` module. Use `output()` when you want to run a short command and capture its result. Use `spawn()` with `wait()` when you want a child process handle and want to control its lifecycle yourself.

The examples use small commands that exist on common POSIX and Windows systems. When the example needs shell behavior, the shell is named explicitly. The process module does not silently parse shell syntax.

## Header

Use the public process header:

```cpp id="y034k5"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="f8d97k"
#include <vix/print.hpp>
```

## Run a command and capture output

`output()` is the simplest starting point. It runs a command, waits for it to finish, and returns the exit code, captured standard output, and captured standard error.

```cpp id="apm6hw"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from process");
#else
  vix::process::Command command("echo");
  command.arg("hello from process");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("output failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);
  vix::print("success", out.success());

  return out.success() ? 0 : 1;
}
```

Output shape:

```txt id="ryoupi"
exit code 0
stdout hello from process

stderr
success true
```

The exact formatting of the captured output may include a trailing newline because many command-line programs print one. The important part is that the result contains both the exit code and the captured text.

## Handle errors

Process APIs return Vix result types. A failed command launch is reported through the result error.

```cpp id="g4hb76"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("");

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("error", result.error().message());
    return 0;
  }

  return 1;
}
```

A command with an empty program is invalid, so the process module returns an error instead of trying to launch it.

## Spawn a process

Use `spawn()` when you want a `Child` handle. The child handle represents the launched process and is passed to lifecycle functions such as `status()`, `wait()`, `terminate()`, and `kill()`.

```cpp id="xj6o2d"
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

  vix::print("spawned process id", child.id());

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

`spawn()` starts the process and returns immediately after the child is created. `wait()` is the blocking operation that collects the final exit code.

## Check process status

`status()` checks whether a child is still running without performing a full blocking wait.

```cpp id="dss61q"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("ping 127.0.0.1 -n 2 > nul");
#else
  vix::process::Command command("sleep");
  command.arg("1");
#endif

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  auto running = vix::process::status(child);

  if (!running)
  {
    vix::print("status failed", running.error().message());
    return 1;
  }

  vix::print("running", running.value());

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("exit code", waited.value());

  return 0;
}
```

The process may exit quickly on some systems, so `status()` should be treated as a snapshot. It tells you what the module could observe at that moment.

## Capture stdout and stderr

`output()` captures both streams. This is useful when a command prints useful data to stdout and diagnostics to stderr.

```cpp id="hmol85"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo stdout text & echo stderr text 1>&2");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("echo stdout text; echo stderr text 1>&2");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("output failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  return out.success() ? 0 : 1;
}
```

This example uses a shell because redirection is shell syntax. The shell is part of the command on purpose. Without that explicit shell, the process module passes arguments directly to the chosen program.

## Set environment and working directory

A command can include environment overrides and a working directory.

```cpp id="p5u96p"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo %VIX_PROCESS_EXAMPLE%");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("printf '%s\n' \"$VIX_PROCESS_EXAMPLE\"");
#endif

  command.env("VIX_PROCESS_EXAMPLE", "hello from env");
  command.cwd(".");

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("output failed", result.error().message());
    return 1;
  }

  vix::print("stdout", result.value().stdout_text);

  return result.value().success() ? 0 : 1;
}
```

Environment overrides are stored on the `Command`. Depending on the command options, they are merged with the inherited parent environment or used with a non-inherited environment.

## Control stream behavior

`PipeMode` controls how stdin, stdout, and stderr are handled.

```cpp id="kw8e1s"
vix::process::Command command("my-tool");

command.stdin_mode(vix::process::PipeMode::Null);
command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);
```

For `output()`, the module configures the common capture behavior internally. For lower-level `spawn()` workflows, setting stream modes directly makes the process configuration visible in the command object.

The available modes are:

```txt id="ha8uzn"
PipeMode::Inherit  use the parent stream
PipeMode::Pipe     create a pipe
PipeMode::Null     redirect to the null device
```

## Run a two-stage pipeline

A pipeline connects the standard output of the first command to the standard input of the second command.

```cpp id="0fptev"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command first("cmd");
  first.arg("/C");
  first.arg("echo hello from pipeline");

  vix::process::Command second("sort");
#else
  vix::process::Command first("echo");
  first.arg("hello from pipeline");

  vix::process::Command second("cat");
#endif

  auto spawned = vix::process::pipeline::spawn(first, second);

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
  vix::print("success", result.success());

  return result.success() ? 0 : 1;
}
```

The pipeline API currently models a two-stage pipeline. It is useful when the application wants structured process composition without writing a full shell command string.

## Minimal CMake target

A small CMake application links the process module target.

```cmake id="o0l5w2"
cmake_minimum_required(VERSION 3.20)

project(my_process_app LANGUAGES CXX)

add_executable(my_process_app
  src/main.cpp
)

target_compile_features(my_process_app
  PRIVATE
    cxx_std_20
)

target_link_libraries(my_process_app
  PRIVATE
    vix::process
)
```

The module uses C++20. Keep the consuming target on C++20 or newer so the public headers and examples remain consistent.

## What to remember

Start with `Command`. Add arguments with `arg()` or `args()` instead of building one shell string. Use `output()` when you want a completed result with captured text. Use `spawn()` when you need a `Child` handle. Use `wait()` to collect the final exit code, `status()` for a running-state snapshot, and `terminate()` or `kill()` when the child must be stopped.

## Next step

Continue with commands to understand how `Command` stores the program, arguments, environment overrides, and execution options.

```md id="zl291y"
[Commands](./commands.md)
```
