# Thread Pool

The Async thread pool moves blocking or CPU-heavy synchronous work away from the scheduler thread.

A coroutine can submit a callable to the pool, suspend while a worker executes it, then continue with the result. The pool is therefore an execution service used by the Async runtime, not another coroutine scheduler.

## Header

Use the public Vix Async header:

```cpp id="z6g6it"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="trb61y"
#include <vix/print.hpp>
```

The thread pool API lives in:

```cpp id="5mbw5j"
vix::async::core
```

## Access the context pool

An `io_context` creates its CPU pool lazily.

```cpp id="o40u5i"
using namespace vix::async::core;

io_context ctx;

auto& pool = ctx.cpu_pool();
```

The pool is created on the first call to `cpu_pool()`.

Its default worker count comes from:

```cpp id="gqt1o8"
std::thread::hardware_concurrency()
```

If that value is zero, the pool still creates at least one worker.

## Submit work and await the result

Use `submit()` when a coroutine needs the result of work executed on a worker thread.

```cpp id="fb01uy"
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> run(io_context& ctx)
{
  int value = co_await ctx.cpu_pool().submit([](){
    return 21 * 2;
  });

  vix::print("value:", value);
}

int main()
{
  io_context ctx;

  std::move(run(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

The callable runs on a pool worker.

The awaiting coroutine suspends while that happens.

## Execution flow

A submission follows this relationship:

```text id="pvzlpj"
scheduler thread
      ↓
submit callable
      ↓
coroutine suspends
      ↓
worker queue
      ↓
worker thread executes callable
      ↓
result stored
      ↓
continuation posted to io_context
      ↓
coroutine resumes
```

The code after `co_await` does not continue directly on the worker thread.

The worker returns the coroutine continuation to the owning `io_context`.

## Why offload CPU work

A coroutine does not automatically make synchronous code asynchronous.

This still runs directly on the scheduler thread:

```cpp id="fs29g7"
task<void> run()
{
  perform_expensive_work();

  co_return;
}
```

Until `perform_expensive_work()` returns, the scheduler cannot run another coroutine on that same thread.

Move the work to the pool instead:

```cpp id="oisrk5"
task<void> run(io_context& ctx)
{
  co_await ctx.cpu_pool().submit([](){
    perform_expensive_work();
  });
}
```

Now the coroutine can suspend while a worker executes the expensive function.

## Returning values

`submit()` returns a `task<R>`, where `R` is the return type of the callable.

For:

```cpp id="4buz83"
auto operation = ctx.cpu_pool().submit([](){
  return 42;
});
```

the operation has the logical type:

```cpp id="mlyl4z"
task<int>
```

It can be awaited normally:

```cpp id="oa4h0v"
int value = co_await ctx.cpu_pool().submit([](){
  return 42;
});
```

The result is transferred back through the coroutine await boundary.

## Void callables

A submitted callable can return `void`.

```cpp id="x1s22n"
co_await ctx.cpu_pool().submit([](){
  update_index();
});
```

In this case `submit()` returns:

```cpp id="c8hz1f"
task<void>
```

The awaiting coroutine resumes when the callable has finished.

## Exceptions from `submit()`

If the submitted callable throws, the worker catches the exception and stores it with the asynchronous operation.

For example:

```cpp id="t4nz1w"
#include <stdexcept>

auto value = co_await ctx.cpu_pool().submit([]() -> int {
  throw std::runtime_error("computation failed");
});
```

When the awaiting coroutine resumes, that exception is rethrown.

It can be handled with normal C++ exception handling:

```cpp id="1s4q51"
try
{
  int value = co_await ctx.cpu_pool().submit([]() -> int {
    throw std::runtime_error("computation failed");
  });

  vix::print("value:", value);
}
catch (const std::exception& error)
{
  vix::print("error:", error.what());
}
```

This makes `submit()` appropriate when the caller needs both completion and failure information.

## Fire-and-forget work

Use `post()` when no coroutine needs to await the result.

```cpp id="b7mlo9"
bool accepted = ctx.cpu_pool().post([](){
  perform_background_work();
});
```

`post()` returns:

```cpp id="qln8rz"
bool
```

A return value of `true` means the callable was accepted into the worker queue.

```cpp id="52axyo"
if (!ctx.cpu_pool().post([](){
  perform_background_work();
}))
{
  vix::print("work rejected");
}
```

There is no result value to await later.

## `post()` and `submit()` are different

Use `submit()` when the caller cares about completion, a returned value, or an exception.

```cpp id="j9y715"
int value = co_await ctx.cpu_pool().submit([](){
  return compute();
});
```

Use `post()` when the work is intentionally detached from the caller:

```cpp id="m9wusv"
bool accepted = ctx.cpu_pool().post([](){
  perform_background_work();
});
```

The relationship is:

```text id="mb2t7u"
submit()
   ↓
worker executes
   ↓
result / exception
   ↓
awaiting coroutine resumes

post()
   ↓
worker executes
   ↓
no result channel
```

## Exceptions from `post()`

A `post()` callable has no awaiting coroutine and no result channel.

If it throws, the worker consumes the exception so it does not terminate the worker thread or escape into the Async runtime.

```text id="c6y5ss"
post callable
     ↓
throws
     ↓
worker catches exception
     ↓
worker continues
```

If a failure needs to be observed, use `submit()` instead, or handle the error explicitly inside the posted callable.

## FIFO worker queue

Accepted callables are placed into a shared FIFO queue.

Conceptually:

```text id="1hfps0"
queue
  ↓
job A
job B
job C
```

Workers take work from the front of that queue.

With several workers, FIFO determines dequeue order, not completion order.

For example:

```text id="3ywsgl"
worker 1 -> job A ───────────── complete
worker 2 -> job B ─── complete
worker 3 -> job C ─────── complete
```

A later-dequeued job can finish before an earlier one if its work takes less time.

Do not use completion order as an implicit synchronization mechanism.

## Several submissions

Submitting several operations sequentially with `co_await` remains sequential:

```cpp id="4fq03x"
int first = co_await ctx.cpu_pool().submit([](){
  return compute_first();
});

int second = co_await ctx.cpu_pool().submit([](){
  return compute_second();
});
```

The second submission is not reached until the first one completes.

When the jobs are independent, task composition can be used to coordinate them together.

```cpp id="9b42nt"
auto results = co_await when_all(
  ctx.get_scheduler(),
  ctx.cpu_pool().submit([](){
    return compute_first();
  }),
  ctx.cpu_pool().submit([](){
    return compute_second();
  })
);
```

The pool provides worker execution. `when_all` provides task coordination.

## Cancellation

`submit()` accepts an optional `cancel_token`.

```cpp id="a4r2gw"
cancel_source source;

int value = co_await ctx.cpu_pool().submit(
  [](){
    return compute();
  },
  source.token()
);
```

Cancellation is checked before the worker begins executing the callable.

If the token is already cancelled when the queued job reaches execution, the callable is skipped and the awaiting coroutine receives:

```cpp id="yd9afn"
errc::canceled
```

through `std::system_error`.

## Cancellation does not interrupt running C++

Once the callable has started, the thread pool does not forcibly terminate it.

This is intentional.

```text id="fpp13m"
job queued
   ↓
token cancelled
   ↓
job reaches worker
   ↓
callable skipped

but

job starts running
   ↓
token cancelled
   ↓
callable keeps running
```

Arbitrary C++ cannot be safely interrupted at an unknown instruction.

If the computation needs to stop while it is running, make it cooperative:

```cpp id="pnzq8i"
cancel_token token = source.token();

co_await ctx.cpu_pool().submit(
  [token](){
    while (!token.is_cancelled())
    {
      if (!perform_next_step())
      {
        break;
      }
    }
  }
);
```

The callable now defines its own safe cancellation points.

## Pool size

A directly constructed `thread_pool` accepts the number of workers:

```cpp id="h564ie"
thread_pool pool(ctx, 4);
```

Use:

```cpp id="4ukudc"
std::size_t workers = pool.size();

vix::print("workers:", workers);
```

to inspect the number of worker threads.

A requested size of zero is normalized to one worker:

```cpp id="setb41"
thread_pool pool(ctx, 0);
```

still creates one worker.

Most applications should use the pool owned by `io_context`:

```cpp id="4m9wek"
ctx.cpu_pool();
```

rather than creating unrelated pools unless they need a separate execution resource.

## Stop accepting new work

Call:

```cpp id="4myab6"
ctx.cpu_pool().stop();
```

to request pool stop.

After this point, new jobs are rejected.

For `post()`:

```cpp id="k5m6fo"
ctx.cpu_pool().stop();

bool accepted = ctx.cpu_pool().post([](){
  perform_work();
});

vix::print("accepted:", accepted);
```

`accepted` is `false`.

Use:

```cpp id="mhi7ic"
ctx.cpu_pool().stopped();
```

to inspect whether stop has been requested.

## Pending work is drained

`stop()` does not discard jobs that were already accepted into the queue.

Workers continue taking queued jobs until the queue becomes empty, then exit.

```text id="txd6v7"
job A accepted
job B accepted
job C accepted
      ↓
stop()
      ↓
new jobs rejected
      ↓
A / B / C still processed
      ↓
workers exit
```

This distinction matters during shutdown because work already accepted by the pool has an existing execution commitment.

## Rejected `submit()`

A submitted coroutine also needs a clear failure path if the pool is already stopped.

```cpp id="jp4h6r"
ctx.cpu_pool().stop();

co_await ctx.cpu_pool().submit([](){
  return 42;
});
```

The callable is not accepted.

The awaiting coroutine resumes with:

```cpp id="0vb8l6"
errc::rejected
```

as a `std::system_error`.

For example:

```cpp id="61ysf5"
try
{
  int value = co_await ctx.cpu_pool().submit([](){
    return 42;
  });
}
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::rejected))
  {
    vix::print("submission rejected");
  }
}
```

A rejected submission does not remain suspended indefinitely.

## Invalid `post()`

`post()` also rejects an empty callable.

```cpp id="cvyhcm"
std::function<void()> fn;

bool accepted = ctx.cpu_pool().post(fn);
```

`accepted` is `false`.

This follows the same API principle as posting after stop: `false` means the work was not accepted into the queue.

## Shutdown

Use:

```cpp id="6l6m7l"
ctx.cpu_pool().shutdown();
```

to stop the pool and join its worker threads.

`shutdown()` is idempotent, so calling it more than once is safe.

The destructor also calls `shutdown()` automatically.

The normal sequence is:

```text id="4oa0e7"
shutdown()
    ↓
stop accepting new work
    ↓
drain accepted queue
    ↓
workers exit
    ↓
join workers
```

The pool therefore owns the complete lifetime of its worker threads.

## Destruction from a worker

The pool also protects against joining the thread that is currently executing its own destruction.

A worker that causes its pool to be destroyed cannot join itself.

The shutdown path detects that case and avoids a self-join deadlock.

This is mainly a lifetime guarantee of the service. Application code normally does not need to design around the internal joining mechanism.

## Context shutdown

The pool owned by an `io_context` participates in context shutdown.

The context stops its services before completing scheduler shutdown because submitted coroutine operations may still need to resume through that scheduler.

The relationship is:

```text id="ihnq7d"
CPU job active
     ↓
context shutdown
     ↓
pool stops and drains accepted work
     ↓
submitted operation completes
     ↓
continuation returned to scheduler
     ↓
coroutine resumes
     ↓
scheduler can finish
```

This is another reason the pool and scheduler are separate components.

The pool performs synchronous work.

The scheduler resumes asynchronous control flow.

## Thread pool and scheduler

The two components serve different purposes.

| Component     | Responsibility                                       |
| ------------- | ---------------------------------------------------- |
| `scheduler`   | Execute ready coroutine continuations and callbacks. |
| `thread_pool` | Execute synchronous callables on worker threads.     |

A useful mental model is:

```text id="iv1dnj"
coroutine code
     │
     ├── short asynchronous control flow
     │        ↓
     │     scheduler
     │
     └── expensive synchronous work
              ↓
          thread_pool
              ↓
           scheduler
              ↓
        coroutine continues
```

Do not move work to the pool simply because it appears inside a coroutine.

Use the pool when that work would otherwise occupy the scheduler thread for too long or block it on a synchronous operation.

## API overview

The thread pool exposes these main operations:

| API                                     | Purpose                                              |
| --------------------------------------- | ---------------------------------------------------- |
| `thread_pool(io_context&, std::size_t)` | Create a fixed worker pool attached to a context.    |
| `submit(fn, token)`                     | Execute a callable on a worker and await its result. |
| `post(fn)`                              | Queue fire-and-forget worker work.                   |
| `stop()`                                | Reject new work and let already accepted work drain. |
| `shutdown()`                            | Stop the pool and join worker threads.               |
| `stopped()`                             | Check whether stop has been requested.               |
| `size()`                                | Return the number of worker threads.                 |

`submit()` returns:

```cpp id="4qh16j"
task<std::invoke_result_t<Fn&>>
```

and can report:

```text id="3i88mw"
errc::canceled
errc::rejected
```

depending on cancellation and pool state.

`post()` returns `false` when the callable cannot be accepted.

## Next step

Continue with [CPU Offloading](./cpu-offloading) to see how to decide which work belongs on the scheduler thread and which work should be moved to the CPU pool.

Then read:

- [Task Composition](./task-composition)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
