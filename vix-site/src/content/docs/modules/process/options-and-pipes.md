# Options and Pipes

Process options define how a child process is started. They control the working directory, environment inheritance, executable lookup, detach mode, and the behavior of stdin, stdout, and stderr.

In `vix::process`, these options are part of `Command`. That keeps the launch configuration close to the program and its arguments. A command can be read as one complete description of the child process the application wants to start.

## Header

Use the public process header:

```cpp id="s8i0fl"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="h2ycga"
#include <vix/print.hpp>
```

## ProcessOptions

`ProcessOptions` stores the execution settings used by `Command`.

```cpp id="lkc1to"
struct ProcessOptions
{
  PipeMode stdin_mode{PipeMode::Inherit};
  PipeMode stdout_mode{PipeMode::Inherit};
  PipeMode stderr_mode{PipeMode::Inherit};

  bool search_in_path{true};
  bool detach{false};
  bool inherit_environment{true};

  std::string working_directory{};
};
```

The default behavior is conservative: the child inherits the parent streams, the executable may be found through `PATH`, the parent environment is inherited, the process is not detached, and an empty working directory means the child starts in the parent’s current directory.

## Access options through Command

Most code does not create `ProcessOptions` directly. The usual workflow is to configure a `Command` through its builder methods.

```cpp id="qal7cd"
vix::process::Command command("my-tool");

command.arg("--check");
command.cwd("./project");
command.search_in_path(true);
command.inherit_environment(true);
command.stdin_mode(vix::process::PipeMode::Null);
command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);
```

The configured options can be inspected through `command.options()`.

```cpp id="bj4ikh"
const auto &options = command.options();

vix::print("search in path", options.search_in_path);
vix::print("inherit environment", options.inherit_environment);
vix::print("working directory", options.working_directory);
```

This is useful in tests, diagnostics, and higher-level wrappers that build commands before executing them.

## PipeMode

`PipeMode` defines how a standard stream is handled.

```cpp id="pe5gy4"
enum class PipeMode
{
  Inherit,
  Pipe,
  Null
};
```

| Mode                | Meaning                                          |
| ------------------- | ------------------------------------------------ |
| `PipeMode::Inherit` | Use the parent process stream.                   |
| `PipeMode::Pipe`    | Create a pipe for the stream.                    |
| `PipeMode::Null`    | Redirect the stream to the platform null device. |

On POSIX, null redirection uses `/dev/null`. On Windows, it uses `NUL`.

## Default stream behavior

By default, all three standard streams are inherited.

```cpp id="g6su21"
vix::process::Command command("my-tool");

const auto &options = command.options();

vix::print("stdin inherited", options.stdin_mode == vix::process::PipeMode::Inherit);
vix::print("stdout inherited", options.stdout_mode == vix::process::PipeMode::Inherit);
vix::print("stderr inherited", options.stderr_mode == vix::process::PipeMode::Inherit);
```

Inherited streams are useful when the child should behave like it was launched from the same terminal as the parent process. Output appears directly in the parent console, and input can come from the same stdin.

## Redirect stdin to null

A child process that should not read from the parent can receive null stdin.

```cpp id="zyndge"
vix::process::Command command("my-tool");

command.stdin_mode(vix::process::PipeMode::Null);
```

This is a good default for commands launched by tools or services when the child should not wait for interactive input. The high-level `output()` API uses this kind of behavior internally because it runs a command to completion and captures the result without expecting interactive input.

## Capture stdout and stderr

For normal output capture, use `output()`.

```cpp id="rk0z9x"
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

`output()` is the public convenience API for capturing both streams. It configures the process for capture, waits for completion, and returns a `ProcessOutput` value.

You can still set stream modes manually on a command, but the current public high-level API for reading captured text is `output()`.

## Manual pipe configuration

A command can explicitly request pipes for stdout or stderr.

```cpp id="erq9tr"
vix::process::Command command("my-tool");

command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);
```

This records the intended stream behavior on the command. The platform backend uses that information when spawning the child. For application code that simply wants the captured text, `output()` remains the clearest API because it performs the full spawn, capture, wait, and result-building workflow.

## Discard stdout or stderr

Use `PipeMode::Null` when a stream should be discarded.

```cpp id="m8k0dw"
vix::process::Command command("my-tool");

command.stdout_mode(vix::process::PipeMode::Null);
command.stderr_mode(vix::process::PipeMode::Null);
```

This is useful for commands where the exit code matters but the text output does not. It can also keep background tools from writing into the parent console.

## Working directory

Use `cwd()` to set the child process working directory.

```cpp id="uv2zlj"
vix::process::Command command("git");

command.arg("status");
command.cwd("/path/to/project");
```

The working directory is applied to the child process when it is launched. An empty working directory means the child uses the current working directory of the parent.

Keeping the working directory inside the command is useful because the parent process does not need to change its own working directory before launching a child.

## Environment inheritance

By default, a child inherits the parent environment.

```cpp id="ehyu41"
vix::process::Command command("my-tool");

command.inherit_environment(true);
```

Environment overrides can be added with `env()`.

```cpp id="by0hos"
command.env("APP_ENV", "test");
command.env("VIX_LOG_LEVEL", "debug");
```

When inheritance is enabled, these overrides are merged with the parent environment. If a variable already exists, the command value replaces it for the child process.

When inheritance is disabled, the command uses only the environment values explicitly provided through the command.

```cpp id="zdt37p"
vix::process::Command command("my-tool");

command.inherit_environment(false);
command.env("APP_ENV", "test");
```

This is useful for tests or controlled subprocesses, but it should be used carefully. Many programs depend on environment variables such as `PATH`, `HOME`, `USERPROFILE`, locale settings, or runtime configuration.

## Environment example

This example sets an environment variable and reads it from the child process.

```cpp id="wgauvl"
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

  command.env("VIX_PROCESS_MODE", "options-example");
  command.inherit_environment(true);

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

The example names a shell explicitly because environment expansion is shell syntax. The process module passes arguments to the program; it does not perform shell expansion itself.

## Executable lookup

`search_in_path()` controls whether the process backend may look for the executable in `PATH`.

```cpp id="b9fwxm"
vix::process::Command command("git");

command.search_in_path(true);
```

This is the default behavior and is convenient for common tools such as `git`, `cmake`, `python`, or platform commands.

Disable path search when the application must run a specific executable.

```cpp id="ehsbap"
vix::process::Command command("/usr/bin/git");

command.search_in_path(false);
```

This makes the command more explicit. It is useful for tools that must avoid accidentally running another executable with the same name earlier in `PATH`.

## Detached processes

`detach()` controls whether a child should run independently.

```cpp id="pp402a"
vix::process::Command command("my-daemon");

command.detach(true);
```

Detached processes are different from normal short-lived child processes. The parent should not treat them as commands that will always be waited on immediately. Platform behavior also differs, so detach mode should be used only when the application intentionally wants the child to continue independently.

For most command execution workflows, keep `detach(false)` and use `wait()` or `output()` to observe completion.

## Options with spawn

This example configures a command, spawns it, then waits for the child.

```cpp id="d8kpdj"
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

  command.stdin_mode(vix::process::PipeMode::Null);
  command.stdout_mode(vix::process::PipeMode::Null);
  command.stderr_mode(vix::process::PipeMode::Null);
  command.search_in_path(true);
  command.inherit_environment(true);
  command.cwd(".");

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  auto waited = vix::process::wait(spawned.value());

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
    return 1;
  }

  vix::print("exit code", waited.value());

  return waited.value() == 0 ? 0 : 1;
}
```

This pattern is useful when the application needs a `Child` handle but does not need to capture output.

## Pipes and pipelines

The pipeline API uses pipes internally to connect two commands.

```cpp id="qyobmc"
vix::process::Command first("echo");
first.arg("hello");

vix::process::Command second("cat");

auto spawned = vix::process::pipeline::spawn(first, second);
```

The first command’s stdout is connected to the second command’s stdin. The application receives `PipelineChildren`, then waits for both processes with `pipeline::wait()`.

This is the structured process API for a two-stage pipeline. It is different from writing a shell string such as `"echo hello | cat"`. The module creates the pipe between the two child processes directly.

## Common option patterns

For a short command where text output matters, prefer `output()`.

```cpp id="dqicgs"
auto result = vix::process::output(command);
```

For a command where only the exit code matters, spawn and wait.

```cpp id="eduxn1"
auto child = vix::process::spawn(command);

if (child)
{
  auto code = vix::process::wait(child.value());
}
```

For a command that should not read from the parent terminal, set stdin to null.

```cpp id="okx7pv"
command.stdin_mode(vix::process::PipeMode::Null);
```

For a command that should not write into the parent terminal, set stdout and stderr to null.

```cpp id="sonj8l"
command.stdout_mode(vix::process::PipeMode::Null);
command.stderr_mode(vix::process::PipeMode::Null);
```

For a command that needs shell syntax, run the shell explicitly.

```cpp id="u32abd"
#if defined(_WIN32)
vix::process::Command command("cmd");
command.arg("/C");
command.arg("echo hello & echo done");
#else
vix::process::Command command("sh");
command.arg("-c");
command.arg("echo hello && echo done");
#endif
```

## Common mistakes

Do not assume `PipeMode::Pipe` means your application automatically receives public read and write methods on `Child`. For captured text, use `output()`. For two-stage command composition, use the pipeline API.

Do not use shell syntax unless the shell is the program. Redirection, pipes written as `|`, variable expansion, wildcard expansion, and command chaining are shell features.

Do not disable environment inheritance without providing the variables the child needs. A minimal environment can be useful for tests, but it can also break tools that rely on `PATH` or platform-specific variables.

Do not use detach mode for normal command execution. Detached children are intentionally independent, while most process workflows should be observed with `wait()` or `output()`.

## Next step

Continue with spawn and child to understand how `spawn()` creates a `Child` handle and how that handle is used by `status()`, `wait()`, `terminate()`, and `kill()`.

```md id="ozoy21"
[Spawn and Child](./spawn-and-child.md)
```
