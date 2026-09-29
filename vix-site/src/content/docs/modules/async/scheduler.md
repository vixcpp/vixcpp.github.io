# Scheduler

The `scheduler` is the execution loop used by Vix Async to resume coroutine work.

Asynchronous services such as timers and networking may wait on other threads, but the coroutine should not continue directly on those service threads. When an operation becomes ready, its continuation is sent back to the scheduler. The scheduler then resumes it on the thread running the Async event loop.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Why the scheduler exists

A coroutine can suspend when the result it needs is not ready yet.

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(100)
);
```

At that point, something must eventually decide where the coroutine continues.

Vix uses the scheduler for that boundary:

```text
coroutine suspends
        ↓
operation continues elsewhere
        ↓
operation becomes ready
        ↓
scheduler receives continuation
        ↓
coroutine resumes
```

This gives timers, networking, signals, CPU work, and task composition a common place to return ready work.

## Get the scheduler

An `io_context` owns its scheduler.

```cpp
vix::async::io_context ctx;

auto& scheduler = ctx.get_scheduler();
```

Most applications use the scheduler through the context rather than constructing a separate execution model.

A root task can be started on it:

```cpp
auto task = run(ctx);

std::move(task).start(ctx.get_scheduler());
```

Then:

```cpp
ctx.run();
```

drives the scheduler.

## The scheduler runs on the calling thread

The scheduler does not create a dedicated event-loop thread.

If `main()` calls:

```cpp
ctx.run();
```

the scheduler runs on the main thread until the loop stops.

For example:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> run()
{
  vix::print("task running");
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

The task is resumed by the scheduler on the thread executing `ctx.run()`.

This is different from the worker threads used by services such as the CPU pool or networking backend.

## Ready work

The scheduler handles two forms of ready work:

```text
coroutine handles
callbacks
```

A coroutine handle represents a suspended coroutine that can now continue.

A callback is an ordinary function posted for execution on the event loop.

The scheduler keeps separate FIFO queues for these two categories.

Conceptually:

```text
handle queue
  task A
  task B
  task C

callback queue
  callback 1
  callback 2
```

Within each queue, work is consumed in insertion order.

## Coroutine work has priority

When both queues contain work, coroutine handles are processed before callbacks.

For example, if the scheduler contains:

```text
handle A
handle B

callback X
callback Y
```

the normal execution order is:

```text
handle A
handle B
callback X
callback Y
```

This priority applies to work that is already ready in the scheduler.

It is not a global ordering guarantee for the whole runtime. Services can complete concurrently and post new work while the scheduler is running.

## Posting a callback

The scheduler can also execute ordinary callbacks.

This is useful when code needs to return a small piece of work to the event-loop thread without creating another coroutine.

Conceptually:

```text
service thread
     ↓
post callback
     ↓
scheduler queue
     ↓
callback executes on event loop
```

Callbacks should remain short. A long-running callback occupies the scheduler thread and prevents other ready coroutine work from progressing.

For CPU-heavy or blocking work, use the context CPU pool instead.

## Do not block the scheduler thread

Code running through the scheduler executes synchronously until it reaches a suspension point or returns.

This coroutine blocks the event loop while `expensive_work()` runs:

```cpp
vix::async::task<void> run()
{
  expensive_work();

  co_return;
}
```

If that work should not occupy the event-loop thread, move it to the CPU pool:

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  co_await ctx.cpu_pool().submit([](){
    expensive_work();
  });
}
```

The coroutine suspends while a worker executes the callable, allowing the scheduler to continue processing other ready work.

## Suspension gives the scheduler control back

A coroutine runs normally until it reaches an operation that suspends.

Consider:

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> run(vix::async::io_context& ctx)
{
  vix::print("before");

  co_await ctx.timers().sleep_for(100ms);

  vix::print("after");
}
```

The execution can be viewed as:

```text
scheduler resumes run()
        ↓
print "before"
        ↓
sleep_for() suspends
        ↓
scheduler can run other work
        ↓
timer completes
        ↓
continuation returned to scheduler
        ↓
scheduler resumes run()
        ↓
print "after"
```

The scheduler is therefore not waiting for every asynchronous operation itself. It runs work that is ready.

## Service completions

Different services use different mechanisms to perform their work, but they return to the same scheduler.

Timers:

```text
timer thread
    ↓
deadline reached
    ↓
scheduler
    ↓
coroutine
```

Networking:

```text
Asio thread
    ↓
I/O completes
    ↓
scheduler
    ↓
coroutine
```

Signals:

```text
signal waiting thread
    ↓
signal received
    ↓
scheduler
    ↓
coroutine
```

CPU work:

```text
worker thread
    ↓
callable completes
    ↓
awaiting operation becomes ready
    ↓
coroutine continues
```

The service threads perform or wait for external work. The scheduler remains the execution loop for coroutine continuations.

## Exceptions from callbacks

A posted callback is fire-and-forget work. There is no awaiting coroutine available to receive an exception from it.

If a callback throws, the scheduler prevents that exception from escaping `run()` and terminating the complete event loop.

This keeps one failed callback from leaving the scheduler loop in an invalid state.

For operations where the caller needs to observe an error, use an awaited task or another result-bearing asynchronous operation instead of relying on a detached callback.

## Stopping the scheduler

The scheduler can receive a stop request through the context:

```cpp
ctx.stop();
```

A stop request does not mean that already queued work is immediately discarded.

The scheduler drains work that was already accepted before finishing the loop.

This is important because a continuation may already be queued when shutdown begins.

## Stop is not full runtime shutdown

The scheduler is only one part of `io_context`.

Other services can still own pending work:

```text
timer
CPU worker
signal wait
TCP operation
UDP operation
DNS operation
```

For this reason:

```cpp
ctx.stop();
```

and:

```cpp
ctx.shutdown();
```

have different meanings.

`stop()` requests scheduler termination.

`shutdown()` coordinates the services first so their pending operations can finish or be cancelled while the scheduler is still available to process resulting continuations.

The complete behavior is covered in [Lifecycle and Shutdown](./lifecycle-and-shutdown).

## Scheduler lifetime

Anything that can later post a continuation to a scheduler depends on that scheduler remaining alive.

This matters particularly when using a scheduler directly.

For example, `when_any` returns after the first task completes, but the other tasks continue running. If one of those tasks later posts to the scheduler, destroying the scheduler immediately after `when_any` returns would leave that task with an invalid execution target.

The safe relationship is:

```text
start asynchronous work
        ↓
keep scheduler alive
        ↓
all work that depends on it finishes
        ↓
destroy scheduler
```

An `io_context` normally manages this relationship for its own services.

## Scheduler and `io_context`

The scheduler and context have different responsibilities.

| Component    | Responsibility                                                    |
| ------------ | ----------------------------------------------------------------- |
| `scheduler`  | Run ready coroutine continuations and callbacks.                  |
| `io_context` | Own the scheduler and coordinate asynchronous services around it. |

The scheduler does not perform DNS resolution, wait for timers, manage sockets, or execute CPU work itself.

Those operations belong to services.

The scheduler receives the work that becomes ready as a result.

## What to keep in mind

The scheduler is best understood as a ready-work executor:

```text
not ready
   ↓
wait in service
   ↓
becomes ready
   ↓
scheduler
   ↓
execute continuation
```

It does not make blocking operations asynchronous by itself. The surrounding services provide the asynchronous operation, while the scheduler provides the place where execution continues.

## Next step

Continue with [Execution Model](./execution-model) to follow a coroutine through creation, suspension, service completion, resumption, and shutdown.

Then read:

- [`io_context`](./io-context)
- [Tasks](./tasks)
- [CPU Offloading](./cpu-offloading)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
