# CPU Offloading

Vix Async keeps coroutine continuations on the scheduler thread.

That works well for short asynchronous control flow, but not for long-running synchronous computation. If a coroutine spends too much time executing ordinary C++ code, the scheduler cannot make progress on other ready tasks.

CPU offloading moves that work to the Async thread pool.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The CPU pool API lives in:

```cpp
vix::async::core
```

## The problem

A coroutine is not automatically parallel.

Consider:

```cpp
using namespace vix::async::core;

task<void> run()
{
  perform_expensive_computation();

  co_return;
}
```

`perform_expensive_computation()` runs synchronously on the thread that resumed the coroutine.

If that coroutine is running through the Vix scheduler:

```text
scheduler
   ↓
run()
   ↓
expensive computation
   ↓
scheduler cannot process other ready work
```

No suspension occurs until the computation returns.

Returning `task<void>` does not change that.

## Move the work to the CPU pool

Use `cpu_pool().submit()` when the coroutine needs to wait for the result.

```cpp
task<void> run(io_context& ctx)
{
  int result = co_await ctx.cpu_pool().submit([](){
    return perform_expensive_computation();
  });

  vix::print("result:", result);
}
```

The flow becomes:

```text
scheduler thread
      ↓
submit work
      ↓
coroutine suspends
      ↓
CPU worker executes callable
      ↓
result becomes ready
      ↓
coroutine resumes
```

The scheduler thread is no longer occupied by the computation.

## What should be offloaded

CPU offloading is appropriate for synchronous work that would otherwise keep the scheduler busy for too long.

Examples include:

- image processing
- compression
- parsing large inputs
- cryptographic computation
- large transformations
- expensive numerical work
- synchronous libraries that perform significant CPU work
- other blocking synchronous functions when no asynchronous API is available

The important property is not the function name. It is whether the call occupies the scheduler thread while other asynchronous work should remain responsive.

## What should stay on the scheduler

Short application logic normally belongs directly inside the coroutine.

For example:

```cpp
task<void> process()
{
  int value = 42;

  value *= 2;

  vix::print("value:", value);

  co_return;
}
```

Moving every small computation to a worker would add queueing, synchronization, and thread switching without solving a real problem.

The scheduler is designed to execute ordinary coroutine code.

Offload work when its synchronous execution becomes expensive enough to interfere with the event loop.

## Asynchronous waiting is not CPU work

A timer should not be moved to the CPU pool.

Avoid:

```cpp
co_await ctx.cpu_pool().submit([](){
  std::this_thread::sleep_for(
    std::chrono::seconds(1)
  );
});
```

Vix already has an asynchronous timer service:

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::seconds(1)
);
```

The first version occupies a worker thread for one second.

The second version suspends the coroutine while the timer service waits efficiently.

The same principle applies to networking.

Do not move a synchronous socket wait to the CPU pool when Vix Async already provides an asynchronous TCP, UDP, or DNS operation.

## CPU offloading is not asynchronous I/O

These two cases solve different problems.

```text
CPU offloading
    ↓
execute synchronous work on another thread

asynchronous I/O
    ↓
suspend until an external operation becomes ready
```

For CPU work:

```cpp
co_await ctx.cpu_pool().submit([](){
  return compute();
});
```

For a timer:

```cpp
co_await ctx.timers().sleep_for(100ms);
```

For networking:

```cpp
co_await stream->async_read(buffer);
```

All three suspend the caller, but the underlying execution is different.

## Returning a result

The normal CPU offloading pattern is:

```cpp
auto result = co_await ctx.cpu_pool().submit([](){
  return compute();
});
```

The worker executes the callable and stores its result.

The coroutine resumes with that value after the worker finishes.

For example:

```cpp
task<void> run(io_context& ctx)
{
  std::size_t count = co_await ctx.cpu_pool().submit([](){
    return count_records();
  });

  vix::print("records:", count);
}
```

The continuation after `co_await` is again part of the normal coroutine workflow.

## Void CPU work

When the callable has no result:

```cpp
co_await ctx.cpu_pool().submit([](){
  rebuild_index();
});
```

the returned operation is a `task<void>`.

The coroutine still waits for completion before continuing.

```cpp
task<void> run(io_context& ctx)
{
  co_await ctx.cpu_pool().submit([](){
    rebuild_index();
  });

  vix::print("index rebuilt");
}
```

Use this when the caller cares that the work finished even though no value is returned.

## Fire-and-forget CPU work

Use `post()` when the caller intentionally does not need completion or a result.

```cpp
bool accepted = ctx.cpu_pool().post([](){
  rebuild_cache();
});
```

Check whether the pool accepted the job:

```cpp
if (!accepted)
{
  vix::print("work rejected");
}
```

The distinction is:

```text
submit()
   ↓
caller observes completion

post()
   ↓
caller only observes acceptance
```

If the caller needs to know whether the operation later succeeded, `post()` is the wrong boundary.

## Exceptions

Exceptions from `submit()` remain observable by the awaiting coroutine.

```cpp
task<void> run(io_context& ctx)
{
  try
  {
    int result = co_await ctx.cpu_pool().submit([]() -> int {
      throw std::runtime_error("failed");
    });

    vix::print("result:", result);
  }
  catch (const std::exception& error)
  {
    vix::print("error:", error.what());
  }
}
```

The worker catches the exception and transfers it through the asynchronous result.

For `post()`, there is no awaiting coroutine. Exceptions from the posted callable are consumed by the pool.

If failure matters, use `submit()`.

## Several CPU jobs

Independent CPU jobs can be composed with `when_all`.

```cpp
task<void> run(io_context& ctx)
{
  auto results = co_await when_all(
    ctx.get_scheduler(),
    ctx.cpu_pool().submit([](){
      return compute_left();
    }),
    ctx.cpu_pool().submit([](){
      return compute_right();
    })
  );

  vix::print("left:", std::get<0>(results));
  vix::print("right:", std::get<1>(results));
}
```

The jobs can be consumed by different workers while the waiting coroutine remains suspended.

Conceptually:

```text
              scheduler
                  ↓
              when_all
               /     \
              /       \
         submit A   submit B
             ↓         ↓
          worker     worker
             \         /
              \       /
            both complete
                  ↓
              coroutine
```

The thread pool provides parallel worker execution.

`when_all` provides coroutine coordination.

## Sequential submissions remain sequential

This code does not run both computations at the same time:

```cpp
int first = co_await ctx.cpu_pool().submit([](){
  return compute_first();
});

int second = co_await ctx.cpu_pool().submit([](){
  return compute_second();
});
```

The second submission is not reached until the first `co_await` completes.

Use sequential code when there is a dependency:

```text
compute first
     ↓
use first result
     ↓
compute second
```

Use composition only when the work is genuinely independent.

## Avoid unnecessary worker hops

Consider:

```cpp
int value = co_await ctx.cpu_pool().submit([](){
  return 42;
});
```

This is valid, but moving `return 42` to another thread provides no benefit.

The operation now requires:

```text
scheduler
   ↓
worker queue
   ↓
worker
   ↓
completion
   ↓
scheduler
```

instead of simply computing the value locally.

Offloading is useful when the work justifies that boundary.

## Blocking synchronous libraries

Sometimes an application depends on a library that only exposes a blocking API.

For example:

```cpp
auto result = blocking_library_call();
```

If this operation can take significant time and cannot be replaced with an asynchronous API, it can be isolated on the CPU pool:

```cpp
auto result = co_await ctx.cpu_pool().submit([](){
  return blocking_library_call();
});
```

This protects the scheduler thread.

It does not make the underlying library asynchronous. A worker thread is still blocked until the call returns.

This distinction matters when many such operations can happen simultaneously, because worker threads are a finite resource.

## Worker threads are finite

The pool has a fixed number of workers.

If every worker is occupied:

```text
worker 1 -> busy
worker 2 -> busy
worker 3 -> busy
worker 4 -> busy

new job -> waits in queue
```

Additional submitted work remains queued until a worker becomes available.

This is another reason not to use the CPU pool as a replacement for asynchronous timers or networking. Thousands of suspended network operations do not need thousands of worker threads, while thousands of blocking calls eventually compete for a finite worker pool.

## Avoid nested blocking dependencies

A worker should not synchronously depend on another job from the same limited pool in a way that requires another worker to make progress.

Conceptually:

```text
worker A
   ↓
waits synchronously for job B

job B
   ↓
waiting for free worker
```

If all workers enter this pattern, progress can stop.

Prefer coroutine composition outside the worker:

```cpp
auto first = ctx.cpu_pool().submit([](){
  return compute_first();
});

auto second = ctx.cpu_pool().submit([](){
  return compute_second();
});

auto results = co_await when_all(
  ctx.get_scheduler(),
  std::move(first),
  std::move(second)
);
```

Keep worker callables self-contained whenever possible.

## Cancellation before execution

`submit()` can receive a `cancel_token`.

```cpp
cancel_source source;

auto result = co_await ctx.cpu_pool().submit(
  [](){
    return compute();
  },
  source.token()
);
```

If the job reaches a worker after cancellation has already been requested, the callable is skipped.

The awaiting coroutine receives:

```cpp
errc::canceled
```

through `std::system_error`.

This can prevent queued work from starting after the application no longer needs it.

## Cancellation after execution begins

Once arbitrary C++ is running, the pool does not forcibly interrupt it.

```text
queued
  ↓
cancellation
  ↓
skip callable

running
  ↓
cancellation
  ↓
callable keeps executing
```

If long-running CPU work needs cancellation after it starts, it must cooperate.

```cpp
cancel_token token = source.token();

co_await ctx.cpu_pool().submit(
  [token](){
    while (!token.is_cancelled())
    {
      if (!process_next_chunk())
      {
        break;
      }
    }
  }
);
```

The callable chooses safe points where cancellation can be observed.

## Chunk long computations when useful

Some CPU algorithms naturally support incremental work.

Instead of one large opaque operation:

```cpp
co_await ctx.cpu_pool().submit([](){
  process_everything();
});
```

a callable can periodically inspect cancellation:

```cpp
co_await ctx.cpu_pool().submit(
  [token](){
    for (std::size_t i = 0; i < chunk_count(); ++i)
    {
      if (token.is_cancelled())
      {
        return;
      }

      process_chunk(i);
    }
  }
);
```

This does not make the worker preemptive.

It simply gives the application explicit interruption points.

## Data passed to workers

A submitted callable may execute after the submitting coroutine has suspended.

Captured references must therefore remain valid until the worker has finished using them.

Be careful with:

```cpp
ctx.cpu_pool().submit([&value](){
  process(value);
});
```

The referenced object must outlive the worker operation.

Capturing an owned value can make the relationship clearer:

```cpp
auto result = co_await ctx.cpu_pool().submit(
  [data = std::move(data)](){
    return process(data);
  }
);
```

Normal C++ ownership rules still apply across the worker boundary.

## Shared state

Several worker jobs can execute concurrently.

If they modify shared state:

```cpp
ctx.cpu_pool().post([&state](){
  update(state);
});

ctx.cpu_pool().post([&state](){
  update(state);
});
```

normal C++ synchronization rules apply.

The thread pool does not automatically serialize access to shared objects.

Use appropriate synchronization or redesign the work so workers operate on independent data.

For many workloads, isolated inputs and explicit result transfer are easier to reason about than shared mutable state.

## Scheduler state belongs on the scheduler

A useful design pattern is:

```text
scheduler
   ↓
prepare immutable input
   ↓
CPU worker
   ↓
compute result
   ↓
scheduler
   ↓
apply result to application state
```

For example:

```cpp
task<void> run(io_context& ctx)
{
  auto input = make_input();

  auto result = co_await ctx.cpu_pool().submit(
    [input = std::move(input)](){
      return compute(input);
    }
  );

  apply_result(result);
}
```

The worker performs isolated computation.

After `co_await`, the coroutine returns to the Async execution flow and can update scheduler-owned application state.

This reduces unnecessary synchronization between worker threads.

## Pool shutdown

When the pool stops, it rejects new submissions but drains work that was already accepted.

```text
accepted jobs
     ↓
stop requested
     ↓
new jobs rejected
     ↓
accepted jobs finish
     ↓
workers exit
```

A `submit()` operation that cannot be accepted reports:

```cpp
errc::rejected
```

rather than suspending forever.

This matters during application shutdown, when new CPU work may race with service teardown.

## Choosing the execution path

A useful decision model is:

```text
Does the operation already have a Vix async API?
        │
        ├── yes -> await that API
        │
        └── no
             ↓
Is the synchronous work expensive or blocking?
        │
        ├── no -> run it directly
        │
        └── yes -> CPU pool
```

Examples:

```text
small calculation
    -> scheduler thread

timer wait
    -> timer service

TCP read
    -> network service

DNS lookup
    -> network service

large compression job
    -> CPU pool

blocking third-party computation
    -> CPU pool
```

The goal is not to move everything away from the scheduler. It is to keep the scheduler available for asynchronous coordination while expensive synchronous work executes where it belongs.

## Next step

Continue with [Networking](./networking) to see how Vix Async handles TCP, UDP, and DNS without consuming CPU worker threads while waiting for I/O.

Then read:

- [TCP](./tcp)
- [UDP](./udp)
- [DNS](./dns)
- [Thread Pool](./thread-pool)
