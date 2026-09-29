# Terminate and Kill

`terminate()` and `kill()` are the process control APIs used when a child process must be stopped by the parent. Both functions take a `Child` handle and return a structured Vix error. A default-constructed error means the termination request was accepted or the process was already no longer running.

The difference is the intention. `terminate()` is the softer API: it asks the process to stop when the platform can express that kind of request. `kill()` is the stronger API: it forcefully stops the process when possible. After either operation, the application should still think about the child lifecycle and collect the final state when appropriate.

## Header

Use the public process header:

```cpp id="kql4v8"
#include <vix/process.hpp>
```

For examples that print output or diagnostics:

```cpp id="o6alr7"
#include <vix/print.hpp>
```

## Terminate a child process

`terminate()` requests process termination.

```cpp id="xzu4ub"
auto err = vix::process::terminate(child);

if (err)
{
  vix::print("terminate failed", err.message());
}
```

On POSIX systems, this maps to `SIGTERM`. On Windows, the implementation uses the available platform termination mechanism. The exact shutdown behavior can therefore differ by platform and by the child program. Some programs handle termination requests cleanly; others may stop immediately or ignore the request depending on the operating system and the program design.

A typical synchronous workflow is to spawn the process, request termination, then wait for the final exit code.

```cpp id="hq2br3"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("ping");
  command.arg("127.0.0.1");
  command.arg("-n");
  command.arg("6");
#else
  vix::process::Command command("sleep");
  command.arg("5");
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

  auto err = vix::process::terminate(child);

  if (err)
  {
    vix::print("terminate failed", err.message());
    return 1;
  }

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

The exit code after termination is platform-specific. On POSIX, a process terminated by a signal is commonly represented as `128 + signal_number`. On Windows, the module reports the exit code observed or assigned by the backend.

## Kill a child process

`kill()` is the forceful stop API.

```cpp id="v6butm"
auto err = vix::process::kill(child);

if (err)
{
  vix::print("kill failed", err.message());
}
```

On POSIX systems, this maps to `SIGKILL`. On Windows, it uses the platform process termination API. This operation is intended for cases where the process must be stopped and a softer termination request is not enough.

```cpp id="flhpbz"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
#if defined(_WIN32)
  vix::process::Command command("ping");
  command.arg("127.0.0.1");
  command.arg("-n");
  command.arg("6");
#else
  vix::process::Command command("sleep");
  command.arg("5");
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

  auto err = vix::process::kill(child);

  if (err)
  {
    vix::print("kill failed", err.message());
    return 1;
  }

  auto waited = vix::process::wait(child);

  if (waited)
  {
    vix::print("exit code", waited.value());
  }

  return 0;
}
```

Use `kill()` when the parent must stop the process even if the child does not cooperate. It is the right fallback when a termination request does not lead to shutdown.

## Error return

Both functions return `vix::error::Error`.

```cpp id="z5dlsx"
vix::error::Error err = vix::process::terminate(child);
```

A successful operation returns an empty error.

```cpp id="ztv5eb"
if (!err)
{
  vix::print("termination request accepted");
}
```

An invalid child handle returns an error.

```cpp id="h8pdnr"
#include <vix/print.hpp>
#include <vix/process.hpp>

int main()
{
  vix::process::Child child;

  auto err = vix::process::kill(child);

  if (err)
  {
    vix::print("kill failed", err.message());
    return 0;
  }

  return 1;
}
```

This follows the same validation model as `status()` and `wait()`: a default `Child` is an empty handle, not a running process.

## Terminate first, then kill if needed

A common shutdown pattern is to try `terminate()` first, give the process a short period to exit, and then use `kill()` as a fallback.

The process module does not provide a dedicated timeout-wait API in the synchronous layer. You can build a small polling loop with `status()` when this behavior is needed.

```cpp id="wgy8q7"
#include <chrono>
#include <thread>

#include <vix/print.hpp>
#include <vix/process.hpp>

static bool wait_until_exit(
  const vix::process::Child &child,
  std::chrono::milliseconds timeout,
  std::chrono::milliseconds interval
)
{
  const auto deadline = std::chrono::steady_clock::now() + timeout;

  while (std::chrono::steady_clock::now() < deadline)
  {
    auto running = vix::process::status(child);

    if (!running)
    {
      return false;
    }

    if (!running.value())
    {
      return true;
    }

    std::this_thread::sleep_for(interval);
  }

  return false;
}

int main()
{
#if defined(_WIN32)
  vix::process::Command command("ping");
  command.arg("127.0.0.1");
  command.arg("-n");
  command.arg("6");
#else
  vix::process::Command command("sleep");
  command.arg("5");
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

  auto term = vix::process::terminate(child);

  if (term)
  {
    vix::print("terminate failed", term.message());
    return 1;
  }

  const bool exited = wait_until_exit(
    child,
    std::chrono::seconds(1),
    std::chrono::milliseconds(50)
  );

  if (!exited)
  {
    auto forced = vix::process::kill(child);

    if (forced)
    {
      vix::print("kill failed", forced.message());
      return 1;
    }
  }

  auto waited = vix::process::wait(child);

  if (waited)
  {
    vix::print("exit code", waited.value());
  }

  return 0;
}
```

This pattern keeps the shutdown policy in the application. The process module provides the primitive operations; the application decides how long it is willing to wait before escalating.

## Why wait after termination

Stopping a process and waiting for a process answer different questions. `terminate()` and `kill()` ask the operating system to stop the child. `wait()` collects the final exit status and lets the module update the child state.

```cpp id="xos3nf"
auto err = vix::process::terminate(child);

if (!err)
{
  auto exit_code = vix::process::wait(child);
}
```

For normal attached child processes, waiting after shutdown is the clean lifecycle step. It gives the parent the final exit code and avoids leaving the child state unresolved.

## Already exited children

Calling `terminate()` or `kill()` on a child that already exited can still succeed. The backend checks the process state where possible and treats an already exited process as no longer needing termination.

```cpp id="en1hrl"
auto waited = vix::process::wait(child);

if (waited)
{
  auto err = vix::process::kill(child);

  if (!err)
  {
    vix::print("child was already stopped");
  }
}
```

This makes cleanup code easier to write because a shutdown path can be called even when the process finished earlier than expected.

## Permission errors

Process termination can fail because of permissions. For example, the current user may not be allowed to stop the target process.

```cpp id="dam0w2"
auto err = vix::process::kill(child);

if (err)
{
  vix::print("kill error", err.message());
}
```

The module reports these failures through the Vix error system. Application code should treat termination errors as real operational failures, especially in tools that manage external commands or background workers.

## Detached processes

Detach mode changes the ownership model.

```cpp id="j5zgss"
vix::process::Command command("my-background-tool");

command.detach(true);
```

A detached process is intended to run independently. In that model, the parent should not assume it has the same lifecycle relationship as a normal attached child. Termination behavior can also vary by platform and by how the process was detached.

Use `terminate()` and `kill()` mainly for child processes the application intentionally manages.

## Terminate, kill, and async code

The module provides async helpers for `spawn()`, `output()`, and `wait()`. Termination functions themselves are synchronous process-control calls.

In async code, a common pattern is to cancel an async wait, then stop the child with `kill()` or `terminate()` as part of cleanup.

```cpp id="p25m00"
try
{
  int code = co_await vix::process::async::wait(ctx, child, cancel.token());
  vix::print("exit code", code);
}
catch (const std::system_error &)
{
  auto err = vix::process::kill(child);

  if (err)
  {
    vix::print("kill failed", err.message());
  }
}
```

Cancellation of the async wait does not automatically stop the child process. It cancels the waiting operation. The application still decides what should happen to the process itself.

## Common mistakes

Do not assume `terminate()` always gives every program a full graceful shutdown on every platform. It expresses the softer termination request where the platform can support it, but the exact behavior depends on the operating system and the child program.

Do not use `kill()` as the first choice when a clean shutdown matters. Try `terminate()` first, then escalate when the process does not exit.

Do not forget to wait for managed child processes after stopping them. Termination requests and lifecycle collection are separate steps.

Do not treat async wait cancellation as process termination. A cancelled wait only stops waiting; the child may still be running.

Do not call termination APIs on a default `Child` and expect them to refer to a real process. A default child handle is invalid.

## Next step

Continue with pipelines to understand how the module connects two commands by piping the stdout of the first process into the stdin of the second.

```md id="x9dznk"
[Pipelines](./pipelines.md)
```
