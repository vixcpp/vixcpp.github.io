# io_context

`io_context` is the runtime owner of the Vix Async module.

It gives asynchronous tasks one place to run and one place to access services such as timers, CPU work, signals, and networking. A program can create tasks without an `io_context`, but most real asynchronous workflows need one because the context owns the scheduler that resumes coroutine continuations.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a context

Create an `io_context` as a normal local object:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

int main()
{
  vix::async::io_context ctx;

  vix::print("context created");

  return 0;
}
```

Creating the context creates its scheduler. Other services are created only when they are requested.

This keeps the initial runtime small when an application does not need every Async capability.

## Run asynchronous work

A root task must be started on the context scheduler before the context can execute it.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> run()
{
  vix::print("async task running");
  co_return;
}

int main()
{
  vix::async::io_context ctx;

  std::move(run()).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

`ctx.run()` runs the scheduler loop on the thread that called it.

The context does not create a separate event-loop thread for `run()`. If `main()` calls `ctx.run()`, the scheduler executes on the main thread until the runtime stops.

## Access the scheduler

Use `get_scheduler()` when a task or composition helper needs the scheduler explicitly.

```cpp
auto& scheduler = ctx.get_scheduler();
```

For example:

```cpp
auto task = run();

std::move(task).start(ctx.get_scheduler());
```

Some higher-level operations such as `when_all` and `when_any` also receive a scheduler so the tasks they coordinate can be started on the same execution loop.

Most application code should not need to manage scheduler queues directly. The context exists so tasks and services can share that execution boundary.

## Timer service

Use `timers()` to access asynchronous timer operations.

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> run(vix::async::io_context& ctx)
{
  vix::print("waiting");

  co_await ctx.timers().sleep_for(100ms);

  vix::print("done");
}
```

The timer service is created when `timers()` is first requested.

The coroutine suspends while the timer is pending. When the deadline is reached, its continuation returns to the context scheduler.

## CPU pool

Use `cpu_pool()` when work should execute outside the scheduler thread.

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  int value = co_await ctx.cpu_pool().submit([](){
    return 21 * 2;
  });

  vix::print("value:", value);
}
```

The callable runs on a CPU worker.

The coroutine waits asynchronously for the result and continues through the Vix runtime when the submitted work completes.

The CPU pool is a service owned by the context. It does not replace the context scheduler.

## Signal service

Use `signals()` when a coroutine needs to wait for supported operating-system signals.

```cpp
auto& signals = ctx.signals();
```

The signal service waits outside the scheduler thread and posts completion back to the runtime when a signal is received.

Only one active signal waiter is supported at a time.

The service also participates in cancellation and context shutdown.

## Network service

Use `net()` to access TCP, UDP, and DNS operations.

```cpp
auto& net = ctx.net();
```

The networking backend is initialized when it is first needed.

Network operations execute through an Asio backend, but coroutine continuations return through the Vix scheduler.

Conceptually:

```text
coroutine
    ↓
network operation
    ↓
Asio backend
    ↓
completion
    ↓
context scheduler
    ↓
coroutine resumes
```

Network objects keep the backend they depend on alive for as long as necessary.

## Services are created when needed

A context can be used only for task scheduling:

```cpp
vix::async::io_context ctx;

std::move(run()).start(ctx.get_scheduler());

ctx.run();
```

In this case, there is no need to initialize timers, the CPU pool, signals, or networking.

Requesting a service creates that service:

```cpp
ctx.timers();
ctx.cpu_pool();
ctx.signals();
ctx.net();
```

This is useful because each service has different runtime resources. The CPU pool owns worker threads, timers have their own waiting mechanism, signals use a signal-waiting thread, and networking owns an Asio execution backend.

## One execution context

The services do not create separate coroutine models.

They all return asynchronous completion to the scheduler owned by the same `io_context`.

```text
                         io_context
                             │
                         scheduler
                             │
                         task<T>
                             ▲
                             │
              ┌──────────────┼──────────────┐
              │              │              │
            timers          CPU          networking
                                             │
                                       TCP / UDP / DNS
```

Signals follow the same completion model.

This gives application code a consistent expectation: after a supported asynchronous operation completes, the continuation proceeds through the context scheduler.

## `run()`

`run()` drives the scheduler.

A typical root program is:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> app(vix::async::io_context& ctx)
{
  vix::print("application started");

  co_return;
}

int main()
{
  vix::async::io_context ctx;

  std::move(app(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

`run()` blocks the calling thread while the scheduler loop is active.

That does not mean asynchronous operations block the scheduler. A suspended coroutine leaves the scheduler free to execute other ready work.

## `stop()`

`stop()` requests scheduler termination.

This is useful when the application wants the execution loop to finish.

```cpp
ctx.stop();
```

Stopping the context scheduler is different from shutting down every service.

A timer service, CPU pool, network backend, or signal service can own work and resources independently of the scheduler queue. For that reason, use `shutdown()` when the complete runtime should be brought down in an ordered way.

## `shutdown()`

`shutdown()` coordinates runtime service shutdown.

```cpp
ctx.shutdown();
```

The order matters because services may still have suspended coroutines that need to return through the scheduler.

The intended relationship is:

```text
stop services
     ↓
cancel or finish pending operations
     ↓
post final continuations
     ↓
scheduler processes ready work
     ↓
scheduler stops
```

Stopping the scheduler first could leave a service with a completed operation but no normal runtime path for its continuation.

This is why `stop()` and `shutdown()` are separate operations.

## Context lifetime

The context must remain alive while asynchronous work still depends on it.

This includes tasks that use:

- its scheduler
- timers
- CPU workers
- signals
- network operations

A common lifetime is:

```text
create io_context
        ↓
create root task
        ↓
start root task
        ↓
run context
        ↓
asynchronous work completes
        ↓
shutdown
        ↓
destroy context
```

This becomes especially important with `when_any`, because the tasks that do not win continue running after the first result has been returned.

Their scheduler and any services they use must remain alive until those tasks can finish.

## Context and CPU work

A long-running synchronous function should not execute directly on the scheduler thread if other asynchronous work needs to remain responsive.

Avoid doing this inside a coroutine:

```cpp
vix::async::task<void> run()
{
  perform_expensive_work();

  co_return;
}
```

The function executes synchronously and prevents the scheduler thread from progressing until it returns.

Move that work to the CPU pool instead:

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  co_await ctx.cpu_pool().submit([](){
    perform_expensive_work();
  });
}
```

The coroutine can suspend while the worker executes the function.

## Context and timers

Timer waiting is also separate from scheduler execution.

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::seconds(1)
);
```

The scheduler does not repeatedly check whether the second has passed.

The timer service waits for the deadline and makes the coroutine ready when the wait completes.

If the operation is cancelled, the timer service can wake it before the original deadline.

## Context and networking

The context also controls the lifetime relationship between networking and the scheduler.

A network operation may still be active when shutdown begins.

The network service first stops or cancels its active work, then resulting continuations can return through the scheduler before scheduler shutdown completes.

This avoids resuming normal coroutine code directly from the network backend during runtime teardown.

## Typical program shape

A small application often keeps one context near the top of the program and passes it to the asynchronous parts that need runtime services.

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> app(vix::async::io_context& ctx)
{
  vix::print("starting");

  co_await ctx.timers().sleep_for(100ms);

  int result = co_await ctx.cpu_pool().submit([](){
    return 42;
  });

  vix::print("result:", result);
}

int main()
{
  vix::async::io_context ctx;

  std::move(app(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

The context stays alive for the entire asynchronous workflow. The coroutine uses the services it needs without creating separate runtimes for each operation.

## Next step

Continue with [Scheduler](./scheduler) to understand how ready coroutine continuations and callbacks are executed.

Then read:

- [Execution Model](./execution-model)
- [Tasks](./tasks)
- [Timers](./timers)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
