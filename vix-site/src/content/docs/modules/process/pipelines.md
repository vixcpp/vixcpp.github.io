# Pipelines

The pipeline API connects two commands so that the standard output of the first process becomes the standard input of the second process. It gives Vix applications a structured way to express a common process pattern without writing one shell command string.

The current pipeline model is intentionally focused on two stages. A producer command is spawned first, a consumer command is spawned second, and the module returns both child handles. The application can then wait for both processes and inspect their exit codes.

## Header

Use the public process header:

```cpp id="nmy1nh"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="sn2z4h"
#include <vix/print.hpp>
```

## Pipeline model

A two-stage pipeline has one producer and one consumer.

```txt id="n87pk2"
producer stdout -> consumer stdin
```

The API is split into two steps:

```cpp id="n7gw6w"
auto spawned = vix::process::pipeline::spawn(first, second);
auto waited = vix::process::pipeline::wait(spawned.value());
```

`spawn()` starts both commands and returns their child handles. `wait()` waits for both children and returns both exit codes.

This is different from passing a shell string such as `"echo hello | sort"`. In the pipeline API, the two commands are still structured `Command` objects, and the module creates the pipe between them.

## PipelineChildren

`PipelineChildren` stores the two child handles returned by a spawned pipeline.

```cpp id="lf9a33"
struct PipelineChildren
{
  Child first;
  Child second;

  bool valid() const noexcept;
};
```

`first` is the producer command. `second` is the consumer command. The pipeline children are valid only when both child handles are valid.

```cpp id="madus9"
auto spawned = vix::process::pipeline::spawn(first, second);

if (!spawned)
{
  vix::print("pipeline spawn failed", spawned.error().message());
  return 1;
}

const auto &children = spawned.value();

vix::print("first pid", children.first.id());
vix::print("second pid", children.second.id());
vix::print("valid", children.valid());
```

The handles can be inspected like normal `Child` values, but the usual pipeline workflow is to pass them to `pipeline::wait()`.

## PipelineResult

`PipelineResult` stores the exit codes of the two pipeline stages.

```cpp id="q5lpbe"
struct PipelineResult
{
  int first_exit_code{0};
  int second_exit_code{0};

  bool success() const noexcept;
};
```

`success()` returns true only when both commands exited with code `0`.

```cpp id="mzgkgm"
auto waited = vix::process::pipeline::wait(children);

if (!waited)
{
  vix::print("pipeline wait failed", waited.error().message());
  return 1;
}

const auto &result = waited.value();

vix::print("first exit code", result.first_exit_code);
vix::print("second exit code", result.second_exit_code);
vix::print("pipeline success", result.success());
```

This matters because the first command and the second command can fail independently. A pipeline should not be treated as successful just because the consumer exited with `0`.

## Basic pipeline example

This example connects a small producer to a simple consumer.

```cpp id="bn0piy"
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

  const auto &children = spawned.value();

  vix::print("first pid", children.first.id());
  vix::print("second pid", children.second.id());

  auto waited = vix::process::pipeline::wait(children);

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

On POSIX, `echo` writes text and `cat` reads it. On Windows, the example uses `cmd /C echo ...` as the producer and `sort` as the consumer. The commands are still built as separate `Command` objects.

## Pipeline spawn errors

`pipeline::spawn()` validates both commands before delegating to the platform backend.

```cpp id="dheh2j"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Command producer("");
  vix::process::Command consumer("cat");

  auto spawned = vix::process::pipeline::spawn(producer, consumer);

  if (!spawned)
  {
    vix::print("pipeline spawn error", spawned.error().message());
    return 0;
  }

  return 1;
}
```

An empty producer or consumer program is invalid. Other failures can come from pipe creation, process creation, executable lookup, permissions, or platform-specific process errors.

## Pipeline wait errors

`pipeline::wait()` expects both child handles to be valid.

```cpp id="zjajg4"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::pipeline::PipelineChildren children;

  auto waited = vix::process::pipeline::wait(children);

  if (!waited)
  {
    vix::print("pipeline wait error", waited.error().message());
    return 0;
  }

  return 1;
}
```

A default `PipelineChildren` value does not refer to real child processes. It is an empty value and cannot be waited on successfully.

## Pipeline and shell syntax

The pipeline API should not be confused with shell pipeline syntax.

This is a shell command:

```cpp id="rxjdgw"
#if defined(_WIN32)
vix::process::Command command("cmd");
command.arg("/C");
command.arg("echo orange & echo apple | sort");
#else
vix::process::Command command("sh");
command.arg("-c");
command.arg("printf 'orange\napple\n' | sort");
#endif
```

That approach is valid when the application intentionally wants shell behavior. The shell parses the string, expands syntax, creates its own pipeline, and decides how to run the commands.

The structured Vix pipeline uses two commands:

```cpp id="th3dvs"
vix::process::Command first("echo");
first.arg("hello");

vix::process::Command second("cat");

auto spawned = vix::process::pipeline::spawn(first, second);
```

Here, the module receives the producer and consumer as separate command descriptions and connects the stdout of the first process to the stdin of the second process.

## Command options in pipelines

Each stage is still a normal `Command`. You can set arguments, environment overrides, working directories, and execution options on either stage.

```cpp id="z5p7pn"
vix::process::Command producer("my-generator");
producer.arg("--format");
producer.arg("plain");
producer.env("APP_ENV", "test");
producer.cwd("./project");

vix::process::Command consumer("my-consumer");
consumer.arg("--strict");
consumer.env("APP_ENV", "test");
consumer.cwd("./project");

auto spawned = vix::process::pipeline::spawn(producer, consumer);
```

The pipeline overrides the connection between producer stdout and consumer stdin. Other command options still belong to their respective stages.

## Exit codes

A pipeline has two exit codes because it has two processes.

```cpp id="hms3dp"
const auto &result = waited.value();

if (result.first_exit_code != 0)
{
  vix::print("producer failed", result.first_exit_code);
}

if (result.second_exit_code != 0)
{
  vix::print("consumer failed", result.second_exit_code);
}
```

This is more explicit than collapsing the whole pipeline into one result. It lets the application decide which stage failed and what that failure means.

## Capturing pipeline output

The current two-stage pipeline API returns child handles and exit codes. It does not return a `ProcessOutput` containing the final consumer stdout.

When the application wants captured text from a shell pipeline, use `output()` with an explicit shell command.

```cpp id="nprys1"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("(echo orange& echo apple& echo banana) | sort");
#else
  vix::process::Command command("sh");
  command.arg("-c");
  command.arg("printf 'orange\napple\nbanana\n' | sort");
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

This example is intentionally shell-based because the goal is to capture the output of a shell pipeline. Use the structured pipeline API when you need process handles and stage exit codes.

## Async pipelines

The module also provides coroutine-friendly pipeline helpers.

```cpp id="ew4he2"
auto children = co_await vix::process::pipeline::async::spawn(
  ctx,
  std::move(first),
  std::move(second)
);

auto result = co_await vix::process::pipeline::async::wait(
  ctx,
  children
);
```

The async spawn function offloads the blocking pipeline spawn operation to the async runtime CPU pool. The async wait function waits for both children using the async process wait API and returns a `PipelineResult`.

This is useful in coroutine-based applications where the event loop should keep running while the pipeline is being observed.

## Complete async example

```cpp id="l8kyom"
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void> run(vix::async::core::io_context &ctx)
{
#if defined(_WIN32)
  vix::process::Command producer("cmd");
  producer.arg("/C");
  producer.arg("echo hello from async pipeline");

  vix::process::Command consumer("sort");
#else
  vix::process::Command producer("echo");
  producer.arg("hello from async pipeline");

  vix::process::Command consumer("cat");
#endif

  auto children = co_await vix::process::pipeline::async::spawn(
    ctx,
    std::move(producer),
    std::move(consumer)
  );

  auto result = co_await vix::process::pipeline::async::wait(
    ctx,
    children
  );

  vix::print("first exit code", result.first_exit_code);
  vix::print("second exit code", result.second_exit_code);
  vix::print("success", result.success());

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

Async pipeline errors are reported as exceptions from the awaited operation. Use normal coroutine error handling when the application needs to recover from failed pipeline spawn or wait operations.

## When to use pipeline APIs

Use `pipeline::spawn()` and `pipeline::wait()` when the application wants a structured two-stage process pipeline and needs the child handles or both exit codes.

Use `output()` with an explicit shell when the application mainly wants the final text produced by a shell pipeline.

Use separate `spawn()` calls when the application needs a more custom process graph than one producer and one consumer. The current pipeline API is intentionally focused on the common two-stage case.

## Common mistakes

Do not expect `pipeline::spawn()` to return captured output. It returns child handles. Use `pipeline::wait()` to get exit codes.

Do not treat the second exit code as the whole pipeline result. The producer and consumer can fail independently.

Do not pass shell pipeline syntax to `Command` unless the shell itself is the program. `Command("echo hello | cat")` looks for a program with that literal name.

Do not use the structured pipeline API when the real requirement is complex shell behavior. If the application needs shell expansion, command chaining, or a longer pipeline written as shell syntax, run the shell explicitly and use `output()` or `spawn()` around that shell command.

## Next step

Continue with async to understand how process operations integrate with `vix::async`, coroutine tasks, cancellation, and the async runtime scheduler.

```md id="b19uhk"
[Async](./async.md)
```
