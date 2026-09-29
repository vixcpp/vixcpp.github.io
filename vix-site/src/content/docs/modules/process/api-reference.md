# API Reference

This page is a compact reference for the public API exposed by the `process` module. It lists the main headers, types, result aliases, synchronous functions, pipeline helpers, async helpers, error codes, and the CMake target used by applications.

For conceptual explanations and practical examples, read the previous pages first. This reference is meant to help developers quickly find the name, namespace, and shape of the API they need.

## Main header

Use the public module entry point in normal application code:

```cpp id="w4ez8q"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="o74qqu"
#include <vix/print.hpp>
```

The module also provides narrower headers under `<vix/process/...>` for files that intentionally depend on a specific part of the API.

## Namespace

Most process APIs live in:

```cpp id="lhgoyp"
namespace vix::process
```

Pipeline APIs live in:

```cpp id="hluqig"
namespace vix::process::pipeline
```

Async process APIs live in:

```cpp id="d3xd37"
namespace vix::process::async
namespace vix::process::pipeline::async
```

## CMake target

Link the public target:

```cmake id="uq5ilb"
target_link_libraries(my_target
  PRIVATE
    vix::process
)
```

The process module requires C++20.

```cmake id="xxaa2w"
target_compile_features(my_target
  PRIVATE
    cxx_std_20
)
```

## Public headers

The main application header is:

```cpp id="yt4yrb"
#include <vix/process.hpp>
```

Direct headers include:

```cpp id="nswj3r"
#include <vix/process/Command.hpp>
#include <vix/process/Child.hpp>
#include <vix/process/PipeMode.hpp>
#include <vix/process/ProcessOptions.hpp>
#include <vix/process/ProcessId.hpp>
#include <vix/process/ProcessResult.hpp>
#include <vix/process/ProcessError.hpp>

#include <vix/process/Spawn.hpp>
#include <vix/process/Output.hpp>
#include <vix/process/Status.hpp>
#include <vix/process/Wait.hpp>
#include <vix/process/Terminate.hpp>
#include <vix/process/Kill.hpp>

#include <vix/process/async/SpawnAsync.hpp>
#include <vix/process/async/OutputAsync.hpp>
#include <vix/process/async/WaitAsync.hpp>

#include <vix/process/pipeline/Pipeline.hpp>
#include <vix/process/pipeline/PipelineAsync.hpp>
```

Prefer `<vix/process.hpp>` unless a narrow include is useful for compile-time or API boundary reasons.

## ProcessId

`ProcessId` is the portable process identifier type used by `Child`.

```cpp id="ym7oy6"
using ProcessId = std::uint64_t;
```

A valid child process has a non-zero process id.

```cpp id="dtb7gq"
vix::process::ProcessId pid = child.id();
```

The process id is public information. Platform-specific process handles remain hidden behind the backend implementation.

## PipeMode

`PipeMode` describes how a standard stream should be handled.

```cpp id="gp2vj3"
enum class PipeMode
{
  Inherit,
  Pipe,
  Null
};
```

| Value               | Meaning                                          |
| ------------------- | ------------------------------------------------ |
| `PipeMode::Inherit` | Use the parent process stream.                   |
| `PipeMode::Pipe`    | Create a pipe for the stream.                    |
| `PipeMode::Null`    | Redirect the stream to the platform null device. |

`output()` is the normal public API for capturing stdout and stderr as strings. The pipeline API uses pipes internally to connect two commands.

## ProcessOptions

`ProcessOptions` stores execution settings for a command.

```cpp id="qxjw6l"
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

These options are usually configured through `Command` builder methods.

```cpp id="ga7058"
command.stdin_mode(vix::process::PipeMode::Null);
command.stdout_mode(vix::process::PipeMode::Pipe);
command.stderr_mode(vix::process::PipeMode::Pipe);

command.search_in_path(true);
command.detach(false);
command.inherit_environment(true);
command.cwd(".");
```

## Command

`Command` describes a process before it is launched. It stores the program, arguments, environment overrides, working directory, and process options.

```cpp id="tuycga"
class Command;
```

Common constructors:

```cpp id="q86pne"
Command();
explicit Command(std::string program);
```

Program configuration:

```cpp id="asqijn"
Command &program(std::string value);
const std::string &program() const noexcept;
```

Argument configuration:

```cpp id="ugm711"
Command &arg(std::string value);
Command &args(std::vector<std::string> values);
const std::vector<std::string> &args() const noexcept;
```

Environment configuration:

```cpp id="mquq80"
Command &env(std::string key, std::string value);
const std::map<std::string, std::string> &environment() const noexcept;
```

Working directory and options:

```cpp id="rftlsl"
Command &cwd(std::string value);
Command &stdin_mode(PipeMode mode);
Command &stdout_mode(PipeMode mode);
Command &stderr_mode(PipeMode mode);
Command &search_in_path(bool enabled);
Command &detach(bool enabled);
Command &inherit_environment(bool enabled);

const ProcessOptions &options() const noexcept;
```

Validation:

```cpp id="ox9irr"
bool valid() const noexcept;
```

A command is valid when the program is not empty.

```cpp id="dqvogs"
vix::process::Command command("git");

command.arg("status");
command.arg("--short");

if (command.valid())
{
  auto result = vix::process::output(command);
}
```

## Child

`Child` is the public handle returned by `spawn()`.

```cpp id="p7tjce"
class Child;
```

A child stores a portable process id and an opaque backend handle used by the platform implementation.

```cpp id="j8ejqk"
ProcessId id() const noexcept;
bool valid() const noexcept;
explicit operator bool() const noexcept;
```

Example:

```cpp id="mddt8b"
auto spawned = vix::process::spawn(command);

if (!spawned)
{
  return 1;
}

vix::process::Child child = spawned.value();

if (child)
{
  vix::print("pid", child.id());
}
```

Application code should use public lifecycle functions such as `status()`, `wait()`, `terminate()`, and `kill()` instead of depending on backend details.

## ProcessOutput

`ProcessOutput` is returned by `output()` when a command is launched, captured, and waited successfully.

```cpp id="oqb2bx"
struct ProcessOutput
{
  int exit_code{0};
  std::string stdout_text{};
  std::string stderr_text{};

  bool success() const noexcept;
};
```

`success()` returns true when `exit_code == 0`.

```cpp id="g2hcyp"
auto result = vix::process::output(command);

if (result)
{
  const auto &out = result.value();

  vix::print("exit code", out.exit_code);
  vix::print("stdout", out.stdout_text);
  vix::print("stderr", out.stderr_text);
}
```

A non-zero `exit_code` is the child program’s result. It is not automatically a Vix API error.

## Result aliases

The synchronous process APIs use Vix result types.

```cpp id="gjxrzp"
using ProcessExitCodeResult = vix::error::Result<int>;
using ProcessRunningResult = vix::error::Result<bool>;
using ProcessOutputResult = vix::error::Result<ProcessOutput>;
using SpawnResult = vix::error::Result<Child>;
```

These aliases are used by the main synchronous functions.

## spawn

`spawn()` launches a command and returns a `Child`.

```cpp id="etgk0b"
[[nodiscard]] SpawnResult spawn(const Command &command);
```

Example:

```cpp id="yd8nnk"
vix::process::Command command("git");
command.arg("--version");

auto spawned = vix::process::spawn(command);

if (!spawned)
{
  vix::print("spawn failed", spawned.error().message());
  return 1;
}

vix::process::Child child = spawned.value();
```

`spawn()` does not wait for the process to exit. Use `wait()` to collect the final exit code.

## output

`output()` runs a command to completion and captures stdout and stderr.

```cpp id="fir6gl"
[[nodiscard]] ProcessOutputResult output(const Command &command);
```

Example:

```cpp id="a0ktly"
vix::process::Command command("git");
command.arg("--version");

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
```

Use `output()` for short-lived commands with bounded output.

## status

`status()` checks whether a child process is still running.

```cpp id="h9xtvc"
[[nodiscard]] ProcessRunningResult status(const Child &child);
```

Example:

```cpp id="g6v8yz"
auto running = vix::process::status(child);

if (!running)
{
  vix::print("status failed", running.error().message());
  return 1;
}

vix::print("running", running.value());
```

The returned boolean is a snapshot. Use `wait()` when the final exit code matters.

## wait

`wait()` blocks until the child process exits and returns the final exit code.

```cpp id="tp60ex"
[[nodiscard]] ProcessExitCodeResult wait(const Child &child);
```

Example:

```cpp id="xf9rhw"
auto exit_code = vix::process::wait(child);

if (!exit_code)
{
  vix::print("wait failed", exit_code.error().message());
  return 1;
}

vix::print("exit code", exit_code.value());
```

For normal attached child processes, waiting is the clean lifecycle step after spawning.

## terminate

`terminate()` requests process termination.

```cpp id="k5h324"
[[nodiscard]] vix::error::Error terminate(const Child &child);
```

Example:

```cpp id="ohe7rb"
auto err = vix::process::terminate(child);

if (err)
{
  vix::print("terminate failed", err.message());
  return 1;
}
```

On POSIX, this maps to `SIGTERM`. On Windows, the implementation uses the platform termination mechanism available to the module. After requesting termination, call `wait()` when the parent owns the child lifecycle.

## kill

`kill()` forcefully stops a child process when possible.

```cpp id="wtim3t"
[[nodiscard]] vix::error::Error kill(const Child &child);
```

Example:

```cpp id="noje9k"
auto err = vix::process::kill(child);

if (err)
{
  vix::print("kill failed", err.message());
  return 1;
}
```

Use `kill()` when the child must be stopped and a softer termination request is not enough.

## PipelineChildren

`PipelineChildren` stores the two child handles returned by a two-stage pipeline.

```cpp id="f7m8vv"
namespace vix::process::pipeline
{
  struct PipelineChildren
  {
    Child first;
    Child second;

    bool valid() const noexcept;
  };
}
```

`first` is the producer. `second` is the consumer.

```cpp id="wqbrre"
auto spawned = vix::process::pipeline::spawn(first, second);

if (spawned)
{
  const auto &children = spawned.value();

  vix::print("first pid", children.first.id());
  vix::print("second pid", children.second.id());
}
```

## PipelineResult

`PipelineResult` stores the exit codes of both pipeline stages.

```cpp id="qlg37t"
namespace vix::process::pipeline
{
  struct PipelineResult
  {
    int first_exit_code{0};
    int second_exit_code{0};

    bool success() const noexcept;
  };
}
```

`success()` returns true when both exit codes are `0`.

```cpp id="fm2z6q"
const auto &result = waited.value();

vix::print("first exit code", result.first_exit_code);
vix::print("second exit code", result.second_exit_code);
vix::print("success", result.success());
```

## Pipeline aliases

The pipeline API uses Vix result types.

```cpp id="b7xzq8"
namespace vix::process::pipeline
{
  using PipelineChildrenResult =
    vix::error::Result<PipelineChildren>;

  using PipelineResultResult =
    vix::error::Result<PipelineResult>;
}
```

If the implementation does not expose these exact aliases in a public header, the function return types should still be read as `vix::error::Result<PipelineChildren>` and `vix::error::Result<PipelineResult>`.

## pipeline::spawn

`pipeline::spawn()` connects the stdout of the first command to the stdin of the second command and returns both child handles.

```cpp id="vqkmrm"
namespace vix::process::pipeline
{
  [[nodiscard]]
  vix::error::Result<PipelineChildren>
  spawn(const Command &first, const Command &second);
}
```

Example:

```cpp id="xrd01e"
vix::process::Command first("echo");
first.arg("hello");

vix::process::Command second("cat");

auto spawned = vix::process::pipeline::spawn(first, second);

if (!spawned)
{
  vix::print("pipeline spawn failed", spawned.error().message());
  return 1;
}
```

The pipeline API is structured. It is not the same as passing a shell string containing `|`.

## pipeline::wait

`pipeline::wait()` waits for both pipeline stages and returns their exit codes.

```cpp id="nq157l"
namespace vix::process::pipeline
{
  [[nodiscard]]
  vix::error::Result<PipelineResult>
  wait(const PipelineChildren &children);
}
```

Example:

```cpp id="nyjhfz"
auto waited = vix::process::pipeline::wait(spawned.value());

if (!waited)
{
  vix::print("pipeline wait failed", waited.error().message());
  return 1;
}

const auto &result = waited.value();

return result.success() ? 0 : 1;
```

## Async spawn

`vix::process::async::spawn()` launches a command from a coroutine and returns a `Child`.

```cpp id="cvtutf"
namespace vix::process::async
{
  vix::async::core::task<Child>
  spawn(
    vix::async::core::io_context &ctx,
    Command command,
    vix::async::core::cancel_token cancel = {}
  );
}
```

Example:

```cpp id="azldkc"
auto child = co_await vix::process::async::spawn(
  ctx,
  std::move(command)
);
```

The async helper reports process operation failures by throwing from the awaited operation.

## Async output

`vix::process::async::output()` runs a command asynchronously and returns `ProcessOutput`.

```cpp id="rviklb"
namespace vix::process::async
{
  vix::async::core::task<ProcessOutput>
  output(
    vix::async::core::io_context &ctx,
    Command command,
    vix::async::core::cancel_token cancel = {}
  );
}
```

Example:

```cpp id="ncggqn"
auto out = co_await vix::process::async::output(
  ctx,
  std::move(command)
);

vix::print("exit code", out.exit_code);
vix::print("stdout", out.stdout_text);
```

Like synchronous `output()`, this API captures stdout and stderr as strings.

## Async wait

`vix::process::async::wait()` waits for a child without blocking the async scheduler for the whole process lifetime.

```cpp id="uxjn3y"
namespace vix::process::async
{
  vix::async::core::task<int>
  wait(
    vix::async::core::io_context &ctx,
    const Child &child,
    vix::async::core::cancel_token cancel = {},
    std::chrono::milliseconds poll_interval =
      std::chrono::milliseconds(50)
  );
}
```

Example:

```cpp id="jcdzlo"
int exit_code = co_await vix::process::async::wait(
  ctx,
  child
);
```

Cancellation cancels the waiting operation. It does not automatically stop the child process.

## Async pipeline spawn

The async pipeline spawn helper starts a two-stage pipeline from a coroutine.

```cpp id="e43pru"
namespace vix::process::pipeline::async
{
  vix::async::core::task<PipelineChildren>
  spawn(
    vix::async::core::io_context &ctx,
    Command first,
    Command second,
    vix::async::core::cancel_token cancel = {}
  );
}
```

Example:

```cpp id="u5r443"
auto children = co_await vix::process::pipeline::async::spawn(
  ctx,
  std::move(first),
  std::move(second)
);
```

## Async pipeline wait

The async pipeline wait helper waits for both pipeline stages.

```cpp id="xatxvn"
namespace vix::process::pipeline::async
{
  vix::async::core::task<PipelineResult>
  wait(
    vix::async::core::io_context &ctx,
    const PipelineChildren &children,
    vix::async::core::cancel_token cancel = {},
    std::chrono::milliseconds poll_interval =
      std::chrono::milliseconds(50)
  );
}
```

Example:

```cpp id="rn662d"
auto result = co_await vix::process::pipeline::async::wait(
  ctx,
  children
);

vix::print("first exit code", result.first_exit_code);
vix::print("second exit code", result.second_exit_code);
```

## ProcessErrorCode

`ProcessErrorCode` describes process-domain failures.

```cpp id="jwjrw5"
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

These values are converted into the generic Vix error model when returned as `vix::error::Error`.

## Process error helpers

The module exposes helper functions for process errors.

```cpp id="mzsfgg"
const vix::error::ErrorCategory &process_error_category();

std::string_view to_string(ProcessErrorCode code);

vix::error::Error make_process_error(
  ProcessErrorCode code,
  std::string message
);
```

Example:

```cpp id="n7dcpt"
auto err = vix::process::make_process_error(
  vix::process::ProcessErrorCode::InvalidArgument,
  "child process handle is invalid"
);
```

Most application code only reads errors returned by the process APIs. These helpers are mainly useful for module internals and advanced integration code.

## Minimal output example

```cpp id="awcpqf"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello");
#else
  vix::process::Command command("echo");
  command.arg("hello");
#endif

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

## Minimal spawn example

```cpp id="tzp056"
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

  auto exit_code = vix::process::wait(spawned.value());

  if (!exit_code)
  {
    vix::print("wait failed", exit_code.error().message());
    return 1;
  }

  return exit_code.value() == 0 ? 0 : 1;
}
```

## Minimal pipeline example

```cpp id="hj3akh"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command first("cmd");
  first.arg("/C");
  first.arg("echo hello");

  vix::process::Command second("sort");
#else
  vix::process::Command first("echo");
  first.arg("hello");

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

  return waited.value().success() ? 0 : 1;
}
```

## Minimal async output example

```cpp id="mtcgtk"
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void>
run(vix::async::core::io_context &ctx)
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello");
#else
  vix::process::Command command("echo");
  command.arg("hello");
#endif

  auto out = co_await vix::process::async::output(
    ctx,
    std::move(command)
  );

  vix::print("stdout", out.stdout_text);

  ctx.stop();
  co_return;
}

int main()
{
  vix::async::core::io_context ctx;

  vix::async::core::spawn_detached(ctx, run(ctx));

  ctx.run();

  return 0;
}
```

## API selection guide

Use `output()` when the application wants captured stdout, stderr, and an exit code from a short-lived command.

Use `spawn()` when the application needs a `Child` handle and wants to decide when to call `status()`, `wait()`, `terminate()`, or `kill()`.

Use `pipeline::spawn()` and `pipeline::wait()` when two commands should be connected directly and both stage exit codes matter.

Use async APIs when the application runs on `vix::async` and the scheduler should remain responsive while process work is pending.

## Common mistakes

Do not confuse a `Result<T>` failure with a child process exit code. A non-zero exit code belongs to the child process result.

Do not pass a full shell command string as the program name. Use `Command("git").arg("status")`, or run a shell explicitly when shell syntax is needed.

Do not expect `pipeline::spawn()` to return captured text. It returns child handles and `pipeline::wait()` returns exit codes.

Do not assume async wait cancellation stops the child process. Cancellation stops the wait operation. Use `terminate()` or `kill()` for process shutdown.

Do not link internal implementation details. Link `vix::process` from CMake and include `<vix/process.hpp>` in normal application code.
