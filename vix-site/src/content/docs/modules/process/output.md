# Output

`output()` is the high-level API for running a command to completion and capturing its output. It starts the process, captures standard output and standard error, waits for the process to exit, and returns a `ProcessOutput` value containing the exit code and captured text.

Use this API for short-lived commands where the application wants the final result. It is a good fit for tooling integration, version checks, diagnostics, code generators, build helpers, and commands that produce a bounded amount of output.

## Header

Use the public process header:

```cpp id="ak8q23"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="ti28hx"
#include <vix/print.hpp>
```

## Run and capture a command

The simplest `output()` workflow is to build a `Command`, pass it to `output()`, check the result, and inspect the captured output.

```cpp id="d5cvwa"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from output");
#else
  vix::process::Command command("echo");
  command.arg("hello from output");
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

Output shape:

```txt id="ukytpj"
exit code 0
stdout hello from output

stderr
```

Many command-line programs print a trailing newline, so captured output may contain one. The module returns the text as it was written by the child process.

## ProcessOutput

`output()` returns `ProcessOutputResult`, which is a Vix `Result<ProcessOutput>`.

```cpp id="jz12kp"
struct ProcessOutput
{
  int exit_code{0};
  std::string stdout_text{};
  std::string stderr_text{};

  bool success() const noexcept;
};
```

`success()` returns true when `exit_code` is `0`.

```cpp id="qu94dr"
if (out.success())
{
  vix::print("command succeeded");
}
else
{
  vix::print("command exited with code", out.exit_code);
}
```

The exit code belongs to the process. It is not the same thing as a module error. A process can launch correctly, run correctly from the module’s point of view, and still return a non-zero exit code.

## API errors and process failures

`output()` returns an error when the process operation itself fails. Examples include an empty program, a failed spawn, a failed wait, or a capture error.

```cpp id="tnddru"
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

A non-zero exit code is different. The command ran, and the result contains that exit code.

```cpp id="ltn8xq"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 7");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("exit 7");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("process API failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("success", out.success());

  return out.exit_code == 7 ? 0 : 1;
}
```

This distinction is important for tools. A compiler, linter, test runner, or shell command may use a non-zero exit code to report its own result. The process module preserves that result instead of converting it into a Vix API failure.

## Capture stdout and stderr

`output()` captures both standard output and standard error.

```cpp id="jqrnlb"
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

  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  return out.success() ? 0 : 1;
}
```

This example uses a shell because redirection is shell syntax. The shell is named explicitly so the command remains clear. Without an explicit shell, the process module passes the arguments directly to the selected program.

## Output configures stream capture

When `output()` runs a command, it uses the command description but configures the process for the capture workflow. Standard input is redirected away from the parent, and standard output and standard error are captured.

That means the caller usually does not need to set pipe modes manually before calling `output()`.

```cpp id="k49x3x"
vix::process::Command command("git");

command.arg("--version");

auto result = vix::process::output(command);
```

Manual stream configuration is more relevant when using `spawn()` directly. For captured text, `output()` is the clearest public API.

## Use arguments, not one command string

The command program and its arguments should be separate.

```cpp id="ivpfyj"
vix::process::Command command("git");

command.arg("status");
command.arg("--short");
```

Avoid putting the whole command line in the program field.

```cpp id="z3na0g"
vix::process::Command command("git status --short");
```

That describes a program literally named `git status --short`. It does not mean program `git` with arguments `status` and `--short`.

When shell features are needed, use the shell explicitly.

```cpp id="gb2tvu"
#if defined(_WIN32)
vix::process::Command command("cmd");
command.arg("/C");
command.arg("dir /B | sort");
#else
vix::process::Command command("sh");
command.arg("-c");
command.arg("ls | sort");
#endif
```

## Environment and working directory

`output()` respects the environment and working directory stored on the command.

```cpp id="h7gtzf"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo %VIX_PROCESS_OUTPUT_MODE%");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("printf '%s\n' \"$VIX_PROCESS_OUTPUT_MODE\"");
#endif

  command.env("VIX_PROCESS_OUTPUT_MODE", "capture");
  command.cwd(".");
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

The environment variable is expanded by the shell in this example. The process module passes the environment to the child; it does not expand shell variables itself.

## Search in PATH

By default, commands may be resolved through `PATH`.

```cpp id="y1grsa"
vix::process::Command command("git");

command.arg("--version");
command.search_in_path(true);
```

Disable this when the executable path should be exact.

```cpp id="v2rz66"
vix::process::Command command("/usr/bin/git");

command.arg("--version");
command.search_in_path(false);
```

This is useful when the application needs a known executable instead of whichever program appears first in the environment.

## Capturing larger output

`output()` stores captured stdout and stderr in memory as strings. That is convenient for small and medium command output, but it should be used carefully for commands that can produce very large output.

```cpp id="whn7ag"
auto result = vix::process::output(command);

if (result)
{
  vix::print("stdout bytes", result.value().stdout_text.size());
  vix::print("stderr bytes", result.value().stderr_text.size());
}
```

For bounded command output, this is simple and practical. For long-running commands, streaming logs, or unbounded output, prefer a lifecycle design based on `spawn()` and a more specific process-handling strategy.

## Commands that need input

`output()` is not an interactive process API. It is designed to run a command to completion and capture the result. Commands that wait for user input can block or fail depending on their behavior.

For commands that should not read from the parent, this is usually fine because the capture workflow does not provide interactive stdin. For real interactive use cases, design a dedicated process workflow instead of relying on `output()`.

## Complete example

This example runs a command, captures both streams, checks the exit code, and distinguishes API failure from process failure.

```cpp id="wft6m1"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo generated output & echo diagnostic output 1>&2 & exit 0");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("echo generated output; echo diagnostic output 1>&2; exit 0");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("process API error", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  if (!out.success())
  {
    vix::print("command completed with a non-zero exit code");
    return out.exit_code;
  }

  return 0;
}
```

This is the normal shape of `output()` code: handle the Vix result first, then handle the child process exit code.

## Common mistakes

Do not treat every non-zero exit code as a process module error. The module returns a successful `ProcessOutput` when it successfully launched, captured, and waited for a command, even if the command itself exits with a non-zero code.

Do not use `output()` for unbounded streams. The captured text is stored in memory.

Do not expect shell syntax to work unless the shell is the program. Redirection, pipes written as `|`, variable expansion, and command chaining are handled by a shell, not by `Command`.

Do not use `output()` for interactive processes. It is a run-to-completion capture API.

Do not manually set stream modes when `output()` already expresses the intent better. Use direct stream configuration for lower-level `spawn()` workflows.

## Next step

Continue with status and wait to understand how to inspect a child process and collect its final exit code through the lower-level lifecycle API.

```md id="cs7g2q"
[Status and Wait](./status-and-wait.md)
```
