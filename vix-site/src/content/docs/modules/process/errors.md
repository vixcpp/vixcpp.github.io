# Errors

The `process` module uses the Vix error system to report failures from process operations. Synchronous APIs return `vix::error::Result<T>` when they produce a value, or `vix::error::Error` when the operation only needs to report success or failure.

This is important because process execution has two different failure layers. The process API can fail because the command is invalid, the executable cannot be started, the child handle is invalid, or the platform operation fails. The child process can also run successfully from the module’s point of view and still return a non-zero exit code. The documentation and application code should keep those two meanings separate.

## Header

Use the public process header:

```cpp id="zag39m"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="vzt7hy"
#include <vix/print.hpp>
```

## Result-based APIs

Most synchronous APIs return a `Result<T>`.

```cpp id="bb60lk"
auto spawned = vix::process::spawn(command);

if (!spawned)
{
  vix::print("spawn failed", spawned.error().message());
  return 1;
}

vix::process::Child child = spawned.value();
```

The main result aliases are:

```cpp id="dr1p79"
using ProcessExitCodeResult = vix::error::Result<int>;
using ProcessRunningResult = vix::error::Result<bool>;
using ProcessOutputResult = vix::error::Result<ProcessOutput>;
using SpawnResult = vix::error::Result<Child>;
```

These aliases make the API easier to read while keeping the standard Vix result model.

## Error-returning APIs

`terminate()` and `kill()` return `vix::error::Error` directly because they do not produce a value on success.

```cpp id="i12hto"
auto err = vix::process::terminate(child);

if (err)
{
  vix::print("terminate failed", err.message());
  return 1;
}
```

A default-constructed error represents success. A non-empty error carries the failure details.

## API failure and process exit code

A process API error is not the same thing as a child process exit code.

This is an API failure:

```cpp id="vwn3oa"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("");

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("process API failed", result.error().message());
    return 0;
  }

  return 1;
}
```

The command is invalid because the program is empty, so the module returns an error before any child process is launched.

This is a child process failure:

```cpp id="t23rtc"
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

Here the module successfully launched the process, waited for it, and captured the result. The child program chose to exit with code `7`, so `ProcessOutput::success()` returns false, but the Vix result itself is valid.

## ProcessErrorCode

The module defines process-specific semantic error codes.

```cpp id="kttno5"
enum class ProcessErrorCode
{
  None = 0,
  EmptyProgram,
  InvalidProgram,
  ProgramNotFound,
  InvalidArgument,
  InvalidWorkingDirectory,
  SpawnFailed,
  WaitFailed,
  StatusFailed,
  KillFailed,
  TerminateFailed,
  PipeCreationFailed,
  CaptureFailed,
  NotRunning,
  AlreadyExited,
  PermissionDenied,
  Timeout,
  UnsupportedOperation
};
```

These codes describe process-domain failures before they are mapped into the generic Vix error system.

| Code                      | Meaning                                                 |
| ------------------------- | ------------------------------------------------------- |
| `None`                    | No process error.                                       |
| `EmptyProgram`            | The command program is empty.                           |
| `InvalidProgram`          | The program value is invalid.                           |
| `ProgramNotFound`         | The executable could not be found.                      |
| `InvalidArgument`         | A process argument or handle is invalid.                |
| `InvalidWorkingDirectory` | The requested working directory is invalid.             |
| `SpawnFailed`             | The platform process creation operation failed.         |
| `WaitFailed`              | Waiting for the child process failed.                   |
| `StatusFailed`            | Querying the child process status failed.               |
| `KillFailed`              | Forceful termination failed.                            |
| `TerminateFailed`         | Graceful termination request failed.                    |
| `PipeCreationFailed`      | Creating a pipe or null redirection failed.             |
| `CaptureFailed`           | Capturing process output failed.                        |
| `NotRunning`              | The operation expected a running process.               |
| `AlreadyExited`           | The process has already exited.                         |
| `PermissionDenied`        | The current process lacks permission for the operation. |
| `Timeout`                 | A process operation timed out.                          |
| `UnsupportedOperation`    | The requested operation is not supported.               |

## Generic error mapping

`ProcessErrorCode` values are mapped to the generic Vix error code system.

| Process error             | Generic category   |
| ------------------------- | ------------------ |
| `None`                    | `Ok`               |
| `EmptyProgram`            | `InvalidArgument`  |
| `InvalidProgram`          | `InvalidArgument`  |
| `InvalidArgument`         | `InvalidArgument`  |
| `InvalidWorkingDirectory` | `InvalidArgument`  |
| `ProgramNotFound`         | `NotFound`         |
| `PermissionDenied`        | `PermissionDenied` |
| `Timeout`                 | `Timeout`          |
| `UnsupportedOperation`    | `NotSupported`     |
| `NotRunning`              | `InvalidState`     |
| `AlreadyExited`           | `InvalidState`     |
| `SpawnFailed`             | `ExternalError`    |
| `WaitFailed`              | `ExternalError`    |
| `StatusFailed`            | `ExternalError`    |
| `KillFailed`              | `ExternalError`    |
| `TerminateFailed`         | `ExternalError`    |
| `PipeCreationFailed`      | `ExternalError`    |
| `CaptureFailed`           | `ExternalError`    |

This lets process-specific failures remain meaningful while still fitting into the broader Vix error model.

## Error category

Process errors use the `process` error category.

```cpp id="zdcijo"
auto category = vix::process::process_error_category();
```

The category is useful when a higher-level system wants to distinguish process errors from errors produced by other modules.

## Convert a process error to text

`to_string()` converts a `ProcessErrorCode` into a stable textual name.

```cpp id="k8205q"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  auto name = vix::process::to_string(
    vix::process::ProcessErrorCode::SpawnFailed
  );

  vix::print("process error", name);

  return 0;
}
```

Output shape:

```txt id="xmz7zm"
process error spawn_failed
```

This is useful for logs, tests, and diagnostics.

## Build a process error

`make_process_error()` creates a structured Vix error from a process error code and message.

```cpp id="bqs6rd"
auto err = vix::process::make_process_error(
  vix::process::ProcessErrorCode::InvalidArgument,
  "child process handle is invalid"
);
```

Most application code does not need to call this helper. It is mainly useful inside the module itself or in code that implements process-like behavior and wants to report errors consistently with the process module.

## Empty command errors

A command with an empty program fails before process creation.

```cpp id="hb5jmg"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command command("");

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 0;
  }

  return 1;
}
```

The same validation is applied by `output()` and pipeline spawn functions. The module does not try to repair an empty command because there is no executable to launch.

## Invalid child errors

A default `Child` is invalid. Lifecycle functions report this as an error.

```cpp id="hff6t2"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Child child;

  auto running = vix::process::status(child);

  if (!running)
  {
    vix::print("status failed", running.error().message());
  }

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait failed", waited.error().message());
  }

  auto killed = vix::process::kill(child);

  if (killed)
  {
    vix::print("kill failed", killed.message());
  }

  return 0;
}
```

This validation keeps invalid handles from reaching platform process calls.

## Spawn errors

`spawn()` can fail because the command is invalid or because the platform cannot create the process.

```cpp id="ep7y69"
auto spawned = vix::process::spawn(command);

if (!spawned)
{
  vix::print("spawn failed", spawned.error().message());
  return 1;
}
```

Common causes include an empty program, missing executable, invalid working directory, permission problems, failed pipe creation, or a platform process creation error.

## Wait and status errors

`status()` and `wait()` can fail when the child handle is invalid, the backend handle is missing, or the platform operation fails.

```cpp id="sfmlv8"
auto running = vix::process::status(child);

if (!running)
{
  vix::print("status failed", running.error().message());
  return 1;
}

auto exit_code = vix::process::wait(child);

if (!exit_code)
{
  vix::print("wait failed", exit_code.error().message());
  return 1;
}
```

`status()` returns the observed running state. `wait()` returns the final exit code. Both still use `Result<T>` because either operation can fail before producing its value.

## Output errors

`output()` can fail before or during capture.

```cpp id="q50d75"
auto result = vix::process::output(command);

if (!result)
{
  vix::print("output failed", result.error().message());
  return 1;
}
```

The command’s own non-zero exit code is not reported through `result.error()`. It is stored in `result.value().exit_code`.

```cpp id="d3hmey"
const auto &out = result.value();

if (!out.success())
{
  vix::print("command exited with code", out.exit_code);
}
```

This distinction lets a tool inspect stdout and stderr even when the child program reports failure.

## Terminate and kill errors

`terminate()` and `kill()` return `vix::error::Error`.

```cpp id="p8b10q"
auto err = vix::process::terminate(child);

if (err)
{
  vix::print("terminate failed", err.message());
  return 1;
}
```

These operations can fail because the child handle is invalid, the backend handle is missing, the process cannot be found, or the current process does not have permission to terminate it.

## Pipeline errors

Pipeline spawn validates both commands.

```cpp id="smxceg"
vix::process::Command first("");
vix::process::Command second("cat");

auto spawned = vix::process::pipeline::spawn(first, second);

if (!spawned)
{
  vix::print("pipeline spawn failed", spawned.error().message());
  return 0;
}
```

Pipeline wait validates both child handles.

```cpp id="ipqafu"
vix::process::pipeline::PipelineChildren children;

auto waited = vix::process::pipeline::wait(children);

if (!waited)
{
  vix::print("pipeline wait failed", waited.error().message());
  return 0;
}
```

A pipeline can also complete with non-zero exit codes. That is represented by `PipelineResult`, not by a Vix API error.

```cpp id="j9ek4u"
const auto &result = waited.value();

if (!result.success())
{
  vix::print("first exit code", result.first_exit_code);
  vix::print("second exit code", result.second_exit_code);
}
```

## Async errors

The async process APIs report failures through exceptions from the awaited operation.

`async::spawn()` and `async::output()` convert failed synchronous process results into `std::runtime_error`.

```cpp id="tdnu6i"
try
{
  vix::process::Command command("");

  auto child = co_await vix::process::async::spawn(
    ctx,
    std::move(command)
  );

  (void)child;
}
catch (const std::runtime_error &error)
{
  vix::print("async spawn failed", error.what());
}
```

`async::wait()` throws `std::runtime_error` for invalid input or process status/wait failures.

```cpp id="b0wdfu"
try
{
  vix::process::Child child;

  int code = co_await vix::process::async::wait(ctx, child);

  (void)code;
}
catch (const std::runtime_error &error)
{
  vix::print("async wait failed", error.what());
}
```

Cancellation is reported as `std::system_error`.

```cpp id="wpe9qy"
try
{
  int code = co_await vix::process::async::wait(
    ctx,
    child,
    cancel.token()
  );

  (void)code;
}
catch (const std::system_error &error)
{
  vix::print("async wait cancelled", error.what());
}
```

Cancellation stops the async wait operation. It does not automatically terminate the child process.

## Complete example

This example handles both API errors and child process exit codes.

```cpp id="j0cid6"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo stdout text & echo stderr text 1>&2 & exit 3");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("echo stdout text; echo stderr text 1>&2; exit 3");
#endif

  auto result = vix::process::output(command);

  if (!result)
  {
    vix::print("process API failed", result.error().message());
    return 1;
  }

  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);

  if (!out.success())
  {
    vix::print("child process reported failure");
    return out.exit_code;
  }

  return 0;
}
```

The module succeeded if `result` contains a value. The child process reported failure through its exit code. Keeping those two layers separate makes process-based tooling much easier to debug.

## Common mistakes

Do not treat a non-zero exit code as a `Result` failure. A child program can fail while the process API succeeds.

Do not ignore `Result<T>` before calling `value()`. Check the result first and print or return the error when it fails.

Do not assume async process helpers return `Result<T>`. They throw from awaited operations when the process operation fails.

Do not treat async cancellation as process termination. A cancelled wait only cancels the wait operation.

Do not hide process errors behind generic messages when writing tools. Print the Vix error message so the user can see whether the failure came from spawn, wait, status, capture, permission, or invalid input.

## Next step

Continue with CMake to see how to link the process module and its async dependencies from an application or another Vix module.

```md id="ik8osr"
[CMake](./cmake.md)
```
