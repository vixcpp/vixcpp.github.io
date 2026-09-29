# Async

The `process` module provides coroutine-friendly helpers for applications that use `vix::async`. These helpers make blocking process operations usable from an async workflow without forcing the main scheduler to stay blocked while a command is launched, captured, or waited on.

The async API does not replace the synchronous process model. It builds on it. `async::spawn()` and `async::output()` offload the blocking synchronous operation to the async runtime CPU pool, then resume the awaiting coroutine on the owning `io_context` scheduler. `async::wait()` observes a child process by polling its status and sleeping between checks with the async timer service.

## Header

Use the public process header:

```cpp id="b4uvmq"
#include <vix/process.hpp>
```

Async examples also need the async module:

```cpp id="gnb9cr"
#include <vix/async/async.hpp>
```

For examples that print output or diagnostics:

```cpp id="dne37j"
#include <vix/print.hpp>
```

## Async API surface

The process module exposes async helpers in two namespaces.

```txt id="z9uc7b"
vix::process::async::spawn()
vix::process::async::output()
vix::process::async::wait()

vix::process::pipeline::async::spawn()
vix::process::pipeline::async::wait()
```

The first namespace handles normal process operations. The second namespace handles two-stage process pipelines.

## Async output

`vix::process::async::output()` runs a command asynchronously and returns a `ProcessOutput`.

```cpp id="f3s399"
auto result = co_await vix::process::async::output(
  ctx,
  std::move(command)
);
```

The operation runs the same high-level capture workflow as synchronous `vix::process::output()`: spawn the command, capture stdout and stderr, wait for completion, and return the final output structure.

```cpp id="o2yxfe"
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void> run(vix::async::core::io_context &ctx)
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("echo hello from async output");
#else
  vix::process::Command command("echo");
  command.arg("hello from async output");
#endif

  auto result = co_await vix::process::async::output(
    ctx,
    std::move(command)
  );

  vix::print("exit code", result.exit_code);
  vix::print("stdout", result.stdout_text);
  vix::print("stderr", result.stderr_text);

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

This is the simplest async process workflow when the application wants a completed result with captured text.

## Async spawn

`vix::process::async::spawn()` launches a command asynchronously and returns a `Child`.

```cpp id="ctnpre"
auto child = co_await vix::process::async::spawn(
  ctx,
  std::move(command)
);
```

Use this when the application needs a process handle and wants to decide when to wait, cancel the wait, terminate, or kill the child.

```cpp id="ve7wkn"
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void> run(vix::async::core::io_context &ctx)
{
#if defined(_WIN32)
  vix::process::Command command("cmd");
  command.arg("/C");
  command.arg("exit 0");
#else
  vix::process::Command command("true");
#endif

  auto child = co_await vix::process::async::spawn(
    ctx,
    std::move(command)
  );

  vix::print("spawned process id", child.id());

  int exit_code = co_await vix::process::async::wait(ctx, child);

  vix::print("exit code", exit_code);

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

`async::spawn()` only creates the process. Waiting is still a separate step, just like in the synchronous API.

## Async wait

`vix::process::async::wait()` waits until a child exits and returns the final exit code.

```cpp id="xof3av"
int exit_code = co_await vix::process::async::wait(ctx, child);
```

Unlike synchronous `wait()`, the async wait does not block the scheduler thread for the whole process lifetime. It checks the child status, sleeps for the configured polling interval, and checks again.

```cpp id="kbp8g1"
int exit_code = co_await vix::process::async::wait(
  ctx,
  child,
  {},
  std::chrono::milliseconds(50)
);
```

The default polling interval is `50` milliseconds. A shorter interval observes process completion sooner but wakes the scheduler more often. A longer interval reduces polling but may delay completion observation.

## Cancellation

Async wait supports cancellation through `vix::async::core::cancel_token`.

```cpp id="v00u9q"
vix::async::core::cancel_source cancel;

int exit_code = co_await vix::process::async::wait(
  ctx,
  child,
  cancel.token()
);
```

When cancellation is requested, the async wait operation throws `std::system_error`. Cancellation stops the waiting operation. It does not automatically stop the child process.

This distinction is important. A cancelled wait means the coroutine no longer wants to wait. The child may still be running, so the application must decide whether to leave it running, request termination, or kill it.

## Cancellation example

This example starts a long-running child, cancels the async wait, then kills and waits for the child during cleanup.

```cpp id="gdzn0p"
#include <chrono>
#include <system_error>
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void> run(vix::async::core::io_context &ctx)
{
  vix::async::core::cancel_source cancel;

#if defined(_WIN32)
  vix::process::Command command("ping");
  command.arg("127.0.0.1");
  command.arg("-n");
  command.arg("6");
#else
  vix::process::Command command("sleep");
  command.arg("5");
#endif

  auto child = co_await vix::process::async::spawn(
    ctx,
    std::move(command)
  );

  vix::print("started process id", child.id());

  ctx.timers().after(
    std::chrono::milliseconds(100),
    [&cancel]() {
      cancel.request_cancel();
    }
  );

  try
  {
    int exit_code = co_await vix::process::async::wait(
      ctx,
      child,
      cancel.token(),
      std::chrono::milliseconds(20)
    );

    vix::print("exit code", exit_code);
  }
  catch (const std::system_error &error)
  {
    vix::print("wait cancelled", error.what());

    auto kill_error = vix::process::kill(child);

    if (kill_error)
    {
      vix::print("kill failed", kill_error.message());
    }

    auto waited = vix::process::wait(child);

    if (waited)
    {
      vix::print("cleanup exit code", waited.value());
    }
  }

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

This is the safe mental model: cancellation belongs to the async operation, while process termination belongs to the process lifecycle API.

## Async errors

The async process helpers throw exceptions when the underlying process operation fails.

For `async::spawn()` and `async::output()`, a failed synchronous result is converted into `std::runtime_error`.

```cpp id="khja21"
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
  vix::print("spawn failed", error.what());
}
```

For `async::wait()`, invalid child handles and invalid polling intervals are reported as runtime errors. Cancellation is reported as `std::system_error`.

```cpp id="tish5m"
try
{
  vix::process::Child child;

  int exit_code = co_await vix::process::async::wait(ctx, child);

  (void)exit_code;
}
catch (const std::runtime_error &error)
{
  vix::print("wait failed", error.what());
}
```

This is different from the synchronous API, where process operations return `Result<T>` or `Error`. In coroutine code, handle failures with normal exception handling around the awaited operation.

## Async pipeline spawn

The pipeline async API starts a two-stage pipeline from a coroutine.

```cpp id="jyaptx"
auto children = co_await vix::process::pipeline::async::spawn(
  ctx,
  std::move(first),
  std::move(second)
);
```

The producer’s stdout is connected to the consumer’s stdin, just like the synchronous pipeline API. The async function offloads the blocking pipeline spawn operation to the async runtime CPU pool.

```cpp id="gc5v1f"
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

  vix::print("first pid", children.first.id());
  vix::print("second pid", children.second.id());

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

The returned `PipelineChildren` contains both child handles.

## Async pipeline wait

Use `vix::process::pipeline::async::wait()` to wait for both pipeline stages.

```cpp id="jidq96"
auto result = co_await vix::process::pipeline::async::wait(
  ctx,
  children
);
```

The function waits for both children and returns a `PipelineResult`.

```cpp id="x88ble"
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

A pipeline is successful only when both stages exit with code `0`.

## Poll interval for async wait

Both process async wait and pipeline async wait accept a polling interval.

```cpp id="r93ikl"
auto result = co_await vix::process::pipeline::async::wait(
  ctx,
  children,
  {},
  std::chrono::milliseconds(100)
);
```

The interval controls how often the process status is checked. It should not be negative. A negative interval is treated as invalid input by the async wait logic.

## Choosing sync or async

Use synchronous process APIs when the current thread is allowed to block and the workflow is simple.

```cpp id="f6lw8a"
auto result = vix::process::output(command);
```

Use async process APIs when the application is already built around `vix::async` and the scheduler should continue running other work while the process operation is pending.

```cpp id="wgatkx"
auto result = co_await vix::process::async::output(
  ctx,
  std::move(command)
);
```

The async API is especially useful for services, agents, UI loops, and coroutine-based tools where blocking the main event loop would make the application less responsive.

## Complete example

This example uses async spawn and async wait, with explicit error handling.

```cpp id="q5ny2l"
#include <stdexcept>
#include <system_error>
#include <utility>

#include <vix/async/async.hpp>
#include <vix/print.hpp>
#include <vix/process.hpp>

vix::async::core::task<void> run(vix::async::core::io_context &ctx)
{
  try
  {
#if defined(_WIN32)
    vix::process::Command command("cmd");
    command.arg("/C");
    command.arg("exit 0");
#else
    vix::process::Command command("true");
#endif

    auto child = co_await vix::process::async::spawn(
      ctx,
      std::move(command)
    );

    vix::print("pid", child.id());

    int exit_code = co_await vix::process::async::wait(ctx, child);

    vix::print("exit code", exit_code);
  }
  catch (const std::system_error &error)
  {
    vix::print("async operation failed", error.what());
  }
  catch (const std::runtime_error &error)
  {
    vix::print("process operation failed", error.what());
  }

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

This is the normal shape of async process code: build a command, await the process operation, and handle exceptions at the coroutine boundary.

## Common mistakes

Do not assume cancelling `async::wait()` stops the process. It only cancels the waiting operation. Use `terminate()` or `kill()` when the child itself must be stopped.

Do not call blocking `vix::process::wait()` inside a coroutine when the scheduler should remain responsive. Use `vix::process::async::wait()` instead.

Do not ignore exceptions from awaited process operations. The async APIs report process operation failures through exceptions.

Do not use very small polling intervals by default. A short interval can be useful in tests, but normal applications should choose a value that balances responsiveness and scheduler activity.

Do not use async output for unbounded command output. Like synchronous `output()`, it returns captured stdout and stderr as strings.

## Next step

Continue with errors to understand the structured error codes used by the synchronous process APIs and how async failures are reported.

```md id="r75qz4"
[Errors](./errors.md)
```
