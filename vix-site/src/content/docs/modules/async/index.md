# Async

The `async` module provides coroutine-based asynchronous execution for Vix applications.

Asynchronous code often needs to wait for something that is not ready yet: a timer, a network operation, a signal, or work running on another thread. Blocking the current thread for each of those operations makes it harder for one runtime to manage several independent tasks efficiently.

Vix Async uses C++20 coroutines to let a task suspend while it waits, then continue when the operation completes. The module keeps this model centered on three concepts: `task<T>` represents asynchronous work, `scheduler` resumes work, and `io_context` coordinates the scheduler with asynchronous services.

## Header

Use the public Vix header when working with the async module:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Basic example

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> hello(vix::async::io_context& ctx)
{
  co_await ctx.timers().sleep_for(100ms);

  vix::print("Hello from Vix Async");
}

int main()
{
  vix::async::io_context ctx;

  std::move(hello(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

The call to `hello(ctx)` creates a coroutine task. The task is lazy, so creating it does not immediately run its body.

`start()` schedules the task on the context scheduler. `ctx.run()` then drives the scheduler on the calling thread.

When the coroutine reaches `sleep_for()`, it suspends. The scheduler remains free to run other work while the timer waits. Once the timer completes, the coroutine is scheduled again and continues after the `co_await`.

## Core model

Most of the module can be understood from three types:

```text
task<T>
   +
scheduler
   +
io_context
   ↓
asynchronous execution
```

`task<T>` represents a computation that may suspend and later resume.

`scheduler` owns the execution queue used to resume coroutine continuations and run posted callbacks.

`io_context` brings the runtime together. It owns the scheduler and provides access to services for timers, CPU work, signals, and networking.

These services use the same coroutine model. A timer does not introduce one runtime while TCP introduces another. Operations may use dedicated threads internally when necessary, but their continuations return to the Vix scheduler.

## Tasks

A coroutine that returns `task<T>` can produce a value asynchronously:

```cpp
vix::async::task<int> compute()
{
  co_return 42;
}
```

Another coroutine can wait for it with `co_await`:

```cpp
vix::async::task<void> run()
{
  int value = co_await compute();

  vix::print("value:", value);
}
```

Tasks can also return `void`, propagate exceptions, and compose with other asynchronous operations.

See [Tasks](./tasks) for the task lifecycle and ownership rules.

## Waiting without blocking the scheduler

Timers are one example of why coroutine suspension matters.

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(250)
);
```

The coroutine waits for 250 milliseconds, but the scheduler thread does not spend those 250 milliseconds blocked inside `sleep_for()`.

Other tasks can continue running during that time.

The same idea applies to supported network and signal operations.

## CPU work

CPU-intensive or blocking work should not run directly on the scheduler thread when it would prevent other coroutine work from progressing.

The context exposes a CPU thread pool for this case:

```cpp
int value = co_await ctx.cpu_pool().submit([](){
  return 21 * 2;
});

vix::print("value:", value);
```

The callable executes on a worker thread. The awaiting coroutine suspends until the result is available, then continues through the async runtime.

The pool also provides `post()` for work that does not need to return a coroutine result.

## Networking

The networking service provides asynchronous TCP, UDP, and DNS operations.

A network operation follows the same general flow:

```text
coroutine
    ↓
start network operation
    ↓
coroutine suspends
    ↓
operation completes
    ↓
scheduler resumes coroutine
```

This lets network code use normal coroutine control flow instead of splitting one operation across several nested callbacks.

## Cancellation

Supported asynchronous operations can receive a cancellation token.

```cpp
vix::async::cancel_source source;

auto token = source.token();
```

Cancellation is cooperative. Requesting cancellation tells the operation that it should stop when its cancellation path can be processed.

```cpp
source.cancel();
```

It does not forcibly terminate arbitrary C++ code that is already executing.

Timers, networking, signals, and other supported operations integrate cancellation according to their own execution boundary.

## Composing tasks

The module provides helpers for coordinating several tasks.

`when_all` waits until every supplied task completes.

`when_any` returns when the first supplied task completes.

The remaining `when_any` tasks continue running after the result is returned. The scheduler and services they depend on must therefore remain alive until those tasks can finish.

Task composition is covered separately so the basic task model remains clear before introducing coordination between multiple coroutines.

## Runtime lifecycle

A small Async program usually follows this sequence:

```text
create io_context
        ↓
create root task
        ↓
start task on scheduler
        ↓
run io_context
        ↓
asynchronous work executes
        ↓
stop or shutdown runtime
```

`io_context` also coordinates shutdown of the services it owns. This matters when timers, CPU tasks, signal waits, or network operations are still active.

The distinction between stopping the scheduler and shutting down the complete context is covered in [Lifecycle and Shutdown](./lifecycle-and-shutdown).

## Where to continue

Start with [Quick Start](./quick-start) to build a small program using tasks, timers, and the runtime.

Then continue with:

- [Core Concepts](./core-concepts)
- [Architecture](./architecture)
- [`io_context`](./io-context)
- [Scheduler](./scheduler)
- [Tasks](./tasks)
- [Cancellation](./cancellation)
- [Networking](./networking)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)

For the complete public surface, see [API Reference](./api-reference).
