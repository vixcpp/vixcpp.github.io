# Architecture

The `async` module is organized around one execution loop and a set of services that feed work back into that loop.

The central relationship is:

```text
task<T>
   ↓
scheduler
   ↓
io_context
   ↓
services
```

A coroutine does not need to know which thread waits for a timer, performs DNS resolution, accepts a TCP connection, or runs CPU work. It suspends, and the corresponding service arranges for its continuation to return to the Vix scheduler when the operation is ready to continue.

## Header

Use the public Vix header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Runtime structure

A simplified view of the runtime looks like this:

```text
                         io_context
                             │
                ┌────────────┴────────────┐
                │                         │
            scheduler                 services
                │                         │
             task<T>          ┌───────────┼────────────┐
                              │           │            │
                            timers       CPU        networking
                                                      │
                                                TCP / UDP / DNS
```

Signals are another service coordinated by the context.

The scheduler is the point where coroutine continuations return. The services may use other threads internally, but they do not create independent coroutine execution models.

## `io_context` owns the runtime

`io_context` is the main runtime object.

```cpp
vix::async::io_context ctx;
```

It owns the scheduler directly and creates its services when they are first requested.

```cpp
auto& scheduler = ctx.get_scheduler();
auto& timers = ctx.timers();
auto& cpu = ctx.cpu_pool();
auto& signals = ctx.signals();
auto& net = ctx.net();
```

This lazy service creation means a program that only uses tasks and scheduling does not need to initialize networking, timers, signals, or CPU workers unnecessarily.

The context also coordinates shutdown so services can finish or cancel pending operations before the scheduler disappears.

## Scheduler architecture

The scheduler has two ready queues:

```text
coroutine handles
callbacks
```

Coroutine handles represent suspended coroutines that are ready to continue.

Callbacks represent ordinary functions posted to the event loop.

The scheduler checks coroutine handles first, then callbacks.

Conceptually:

```text
handle
handle
handle
callback
callback
```

Each queue is FIFO within its own category.

This does not imply a global completion order across the runtime. Different asynchronous services can complete at different times, and new coroutine handles may arrive while callbacks are waiting.

The scheduler only defines how ready work is consumed once it reaches the event loop.

## The event-loop thread

The scheduler does not create its own execution thread.

Calling:

```cpp
ctx.run();
```

runs the scheduler on the calling thread.

For example:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> run()
{
  vix::print("running");
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

The coroutine runs through the scheduler on the same thread that called `ctx.run()`.

This thread is the primary coroutine execution boundary of the context.

## Service threads

Some asynchronous operations need another thread to wait or perform work.

The current runtime uses separate execution resources for different responsibilities:

```text
scheduler
   │
   └── calling thread of io_context::run()

timer service
   │
   └── timer worker thread

CPU service
   │
   └── fixed worker threads

signal service
   │
   └── signal waiting thread

network service
   │
   └── Asio io_context thread
```

These threads exist to perform or wait for operations that should not occupy the scheduler thread.

They are implementation resources, not places where application coroutine code should normally continue.

## Returning to the scheduler

A service completion is normally converted back into scheduled coroutine work.

For a timer:

```text
coroutine
   ↓
sleep_for()
   ↓
timer service
   ↓
deadline reached
   ↓
scheduler
   ↓
coroutine resumes
```

For networking:

```text
coroutine
   ↓
async TCP / UDP / DNS operation
   ↓
Asio backend
   ↓
operation completes
   ↓
scheduler
   ↓
coroutine resumes
```

For CPU work:

```text
coroutine
   ↓
cpu_pool().submit(...)
   ↓
worker thread
   ↓
callable finishes
   ↓
continuation becomes ready
   ↓
coroutine resumes
```

This separation keeps the code after a `co_await` inside the Vix coroutine execution model rather than allowing every service backend to decide where user code continues.

## Tasks and ownership

`task<T>` owns a coroutine frame.

A task starts suspended:

```cpp
vix::async::task<int> value()
{
  co_return 42;
}
```

Calling the function creates the frame but does not run the body immediately.

```cpp
auto task = value();
```

That frame is move-only and must have a clear owner.

A root task transfers execution to a scheduler:

```cpp
std::move(task).start(ctx.get_scheduler());
```

A child task transfers control naturally through `co_await`:

```cpp
int result = co_await value();
```

The task object is therefore part of the execution and lifetime model, not only a container for a result.

## Timer service

The timer service maintains pending deadlines independently of the scheduler.

The scheduler does not continuously poll time.

Instead:

```text
timer request
    ↓
timer service stores deadline
    ↓
timer thread waits
    ↓
deadline becomes ready
    ↓
continuation posted
    ↓
scheduler resumes task
```

If a newly registered timer expires earlier than the current next deadline, the timer thread updates its wait so the earlier timer can fire first.

Cancellation also wakes a pending `sleep_for()` so the coroutine does not need to wait until the original deadline before observing cancellation.

## CPU service

CPU work uses a fixed worker pool.

The pool owns a shared queue of submitted callables. Workers take work from that queue and execute it outside the scheduler thread.

There are two public submission models.

`submit()` is used when a coroutine wants to wait for a result:

```cpp
int result = co_await ctx.cpu_pool().submit([](){
  return 42;
});
```

`post()` is used for fire-and-forget work:

```cpp
bool accepted = ctx.cpu_pool().post([](){
  perform_work();
});
```

This distinction matters because a coroutine-returning submission needs a continuation to resume, while fire-and-forget work does not.

The CPU pool is not a replacement for the scheduler. Its role is to move work away from the event-loop thread when that work should not run there.

## Network service

The networking layer uses Asio internally.

Its backend owns an `asio::io_context` and runs it on a dedicated network thread.

Public network objects share ownership of the backend they depend on. This prevents a socket or acceptor from holding an executor whose network runtime has already been destroyed.

The ownership shape is roughly:

```text
io_context
    │
    └── network service
            │
            └── shared backend
                  ├── TCP socket
                  ├── TCP acceptor
                  ├── UDP socket
                  └── DNS operations
```

The context can request the backend to stop during shutdown, while existing network objects keep the backend storage valid for as long as they still depend on it.

## Network cancellation

Supported Asio operations are connected to Vix cancellation.

A pending operation can therefore follow this path:

```text
coroutine
    ↓
network operation + cancel token
    ↓
Asio operation active
    ↓
cancellation requested
    ↓
Asio cancellation
    ↓
operation completes as canceled
    ↓
scheduler
    ↓
coroutine resumes
```

This is different from merely checking a token before and after a blocking operation. The active network operation itself participates in cancellation.

## Signals

The signal service waits for operating-system signals outside the scheduler thread.

One coroutine waiter can be active at a time.

```text
coroutine waits
      ↓
signal service
      ↓
signal received
      ↓
scheduler
      ↓
coroutine resumes with signal number
```

Cancellation and service shutdown can also wake the waiter.

The one-waiter rule is part of the public behavior. A second concurrent waiter is rejected rather than silently replacing the first one.

## Task composition

`when_all` and `when_any` are built from tasks and scheduling rather than from a separate execution engine.

For `when_all`:

```text
task A ─┐
task B ─┼── run concurrently ── wait for all ── return results
task C ─┘
```

For `when_any`:

```text
task A ─┐
task B ─┼── first completion ── return winner
task C ─┘
```

The losing `when_any` tasks keep running.

This has an architectural consequence: the scheduler and services used by those tasks must remain alive after `when_any` has already returned.

`when_any` does not invent a cancellation mechanism for arbitrary tasks.

## Cancellation architecture

Cancellation uses shared state.

A `cancel_source` owns the ability to request cancellation:

```cpp
vix::async::cancel_source source;
```

A `cancel_token` observes that state:

```cpp
auto token = source.token();
```

Supported asynchronous operations can register callbacks with that state so they can react when cancellation is requested.

Conceptually:

```text
cancel_source
      │
   shared state
      │
  cancel_token
      │
 asynchronous operation
```

Cancellation callbacks have their own lifetime registration, so an operation can unregister safely when its awaiter is destroyed or completes.

This avoids leaving callbacks attached to cancellation state after the operation no longer exists.

## Exceptions and detached work

Awaited tasks can propagate exceptions through the coroutine chain.

Detached work is different because there is no awaiting coroutine available to receive the exception.

`spawn_detached()` therefore treats detached execution as a terminal boundary. Exceptions from that detached task do not propagate into another task.

Likewise, ordinary callbacks posted to the scheduler do not terminate the scheduler loop if they throw.

This keeps one failed detached callback from bringing down the complete event loop.

## Shutdown architecture

Shutdown order matters because services can still have suspended coroutines that need the scheduler to resume.

The safe relationship is:

```text
request services to stop
          ↓
timers / CPU / signals / network
finish or cancel pending work
          ↓
continuations return to scheduler
          ↓
scheduler finishes queued work
          ↓
scheduler stops
```

Stopping the scheduler before the services would create the opposite relationship:

```text
scheduler gone
     ↓
service completes
     ↓
nowhere safe to resume continuation
```

For that reason, `io_context::shutdown()` coordinates service shutdown before completing scheduler shutdown.

This is also why `stop()` and `shutdown()` are separate concepts.

## Architecture summary

The runtime is intentionally split by responsibility:

| Component               | Responsibility                                             |
| ----------------------- | ---------------------------------------------------------- |
| `task<T>`               | Own coroutine work and its result or exception.            |
| `scheduler`             | Execute ready coroutine continuations and callbacks.       |
| `io_context`            | Own and coordinate the async runtime.                      |
| Timer service           | Wait for deadlines without blocking the scheduler.         |
| CPU pool                | Execute blocking or CPU-heavy callables on workers.        |
| Signal service          | Wait for operating-system signals.                         |
| Network service         | Perform TCP, UDP, and DNS operations through Asio.         |
| Cancellation            | Notify supported pending operations that they should stop. |
| `when_all` / `when_any` | Coordinate multiple tasks using the existing scheduler.    |

The main boundary to remember is simple: service threads perform or wait for external work, while coroutine continuations return through the scheduler.

## Next step

Continue with [`io_context`](./io-context) to see how the runtime is created, driven, stopped, and shut down.

Then read:

- [Scheduler](./scheduler)
- [Execution Model](./execution-model)
- [Tasks](./tasks)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
