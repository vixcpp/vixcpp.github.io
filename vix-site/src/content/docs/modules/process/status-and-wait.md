# Status and Wait

`status()` and `wait()` are the two main APIs used to observe a spawned child process. `status()` checks whether the process is still running. `wait()` waits for the process to exit and returns its final exit code.

These functions belong to the lower-level process lifecycle workflow. Use them after `spawn()` when the application needs a `Child` handle and wants to decide when to observe, wait for, or stop the child process.

## Header

Use the public process header:

```cpp id="i5by0e"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="q81auc"
#include <vix/print.hpp>
```

## Status

`status()` checks the current running state of a child process.

```cpp id="j430do"
auto running = vix::process::status(child);
```

The return type is `ProcessRunningResult`, which is a Vix `Result<bool>`.

```cpp id="jz9vol"
if (!running)
{
  vix::print("status failed", running.error().message());
  return 1;
}

vix::print("running", running.value());
```

A value of `true` means the process was observed as still running. A value of `false` means the process has already exited. This is a snapshot, not a permanent fact. A process that is running now can exit immediately after the check.

## Wait

`wait()` blocks until the child process exits and returns the final exit code.

```cpp id="v79r3t"
auto exit_code = vix::process::wait(child);
```

The return type is `ProcessExitCodeResult`, which is a Vix `Result<int>`.

```cpp id="hhjsr1"
if (!exit_code)
{
  vix::print("wait failed", exit_code.error().message());
  return 1;
}

vix::print("exit code", exit_code.value());
```

Use `wait()` when the final result matters. It is the function that turns a running child process into a completed process result.

## Basic wait example

This example starts a process and waits for its exit code.

```cpp id="x2oism"
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

The process module returns the exit code produced by the child process. A code of `0` usually means success, but the exact meaning belongs to the program that was launched.

## Status before wait

A common lifecycle is to spawn a process, check whether it is running, and then wait for the final exit code.

```cpp id="mnch4l"
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

  command.stdin_mode(vix::process::PipeMode::Null);
  command.stdout_mode(vix::process::PipeMode::Null);
  command.stderr_mode(vix::process::PipeMode::Null);

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

  vix::print("running before wait", running.value());

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

This pattern is useful when the application wants to observe a child process without immediately blocking for the final result.

## Status is a snapshot

`status()` should not be used as a final result. It only reports what the backend can observe at the time of the call.

```cpp id="aq74yf"
auto running = vix::process::status(child);

if (running && running.value())
{
  vix::print("child is still running");
}
```

The process may exit after this check. When the application needs the final exit code, call `wait()`.

```cpp id="qhqnyn"
auto exit_code = vix::process::wait(child);
```

This distinction matters in tools and services. `status()` is useful for polling and monitoring. `wait()` is useful for completion.

## Non-zero exit codes

A non-zero exit code is still a successful process API operation when the module was able to launch and wait for the child.

```cpp id="mu1nts"
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

  return waited.value() == 7 ? 0 : 1;
}
```

The Vix result reports whether the process operation succeeded. The exit code reports what the child program decided. Keep those two meanings separate.

## Invalid child handles

Both `status()` and `wait()` validate the child handle.

```cpp id="uckx8h"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Child child;

  auto running = vix::process::status(child);

  if (!running)
  {
    vix::print("status error", running.error().message());
  }

  auto waited = vix::process::wait(child);

  if (!waited)
  {
    vix::print("wait error", waited.error().message());
  }

  return 0;
}
```

A default-constructed `Child` is invalid because it does not refer to a process. This is useful as an empty value, but it cannot be used for lifecycle operations.

## Waiting after status reports false

A process can finish before or during a `status()` check. When `status()` returns `false`, the child is no longer running, but the application may still use `wait()` to collect the final exit code from the child handle.

```cpp id="b9nc6b"
auto running = vix::process::status(child);

if (running && !running.value())
{
  auto exit_code = vix::process::wait(child);

  if (exit_code)
  {
    vix::print("exit code", exit_code.value());
  }
}
```

This keeps the workflow clear: `status()` answers the running-state question, while `wait()` answers the completion-result question.

## Polling with status

For synchronous code, polling can be built with `status()`. Keep the loop simple and include a sleep so the process is not checked continuously.

```cpp id="e5x503"
#include <chrono>
#include <thread>

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

  command.stdin_mode(vix::process::PipeMode::Null);
  command.stdout_mode(vix::process::PipeMode::Null);
  command.stderr_mode(vix::process::PipeMode::Null);

  auto spawned = vix::process::spawn(command);

  if (!spawned)
  {
    vix::print("spawn failed", spawned.error().message());
    return 1;
  }

  vix::process::Child child = spawned.value();

  while (true)
  {
    auto running = vix::process::status(child);

    if (!running)
    {
      vix::print("status failed", running.error().message());
      return 1;
    }

    if (!running.value())
    {
      break;
    }

    vix::print("child is still running");

    std::this_thread::sleep_for(std::chrono::milliseconds(100));
  }

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

For coroutine-based code, prefer `vix::process::async::wait()`. It uses the async timer service and supports cancellation through `cancel_token`.

## Async wait

The async API provides a coroutine-friendly wait function.

```cpp id="paxf40"
auto exit_code = co_await vix::process::async::wait(ctx, child);
```

The async wait function checks the child status periodically and suspends the coroutine between checks. It accepts a cancellation token and a polling interval.

```cpp id="sg5sxb"
auto exit_code = co_await vix::process::async::wait(
  ctx,
  child,
  cancel.token(),
  std::chrono::milliseconds(50)
);
```

This is better than writing a blocking wait in an async application, because it gives the `io_context` a chance to keep running other work.

## Status, wait, and output

`status()` and `wait()` are used with a `Child` returned by `spawn()`.

```cpp id="yenvl4"
auto spawned = vix::process::spawn(command);
```

`output()` is different. It runs the full workflow internally and returns a completed `ProcessOutput`.

```cpp id="texfib"
auto result = vix::process::output(command);
```

Use `spawn()` with `status()` and `wait()` when the application needs lifecycle control. Use `output()` when the application wants a finished result with captured stdout and stderr.

## Common mistakes

Do not use `status()` as if it were a final process result. It only reports whether the child is running at the time of the call.

Do not treat a non-zero exit code as a Vix API error. The API can succeed while the child program exits with a failure code.

Do not wait on a default-constructed `Child`. It does not represent a process.

Do not spin in a tight loop around `status()`. Add a delay in synchronous code, or use the async wait API in coroutine-based code.

Do not use `wait()` when the current thread must remain responsive. In that case, use the async process API or move the blocking work to a controlled worker thread.

## Next step

Continue with terminate and kill to understand how the module requests graceful termination and forceful process shutdown.

```md id="wjkoj7"
[Terminate and Kill](./terminate-and-kill.md)
```
