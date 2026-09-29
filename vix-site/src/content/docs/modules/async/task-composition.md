# Task Composition

A single asynchronous task is useful, but real programs often need several operations to work together.

One operation may depend on another. Several independent operations may need to finish before execution can continue. Sometimes only the first completed operation matters.

Vix Async keeps these cases inside the normal task model. Tasks can be composed directly with `co_await`, or coordinated with `when_all` and `when_any`.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Compose tasks with `co_await`

The simplest composition is one task waiting for another.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<int> load_value()
{
  co_return 42;
}

task<void> run()
{
  int value = co_await load_value();

  vix::print("value:", value);
}
```

`run()` cannot continue until `load_value()` finishes, so the relationship is sequential:

```text
run
 ↓
load_value
 ↓
result
 ↓
run continues
```

This is the right model when the second step depends on the result of the first.

## Sequential composition

Several `co_await` expressions written one after another execute according to those dependencies.

```cpp
task<void> run()
{
  int first = co_await load_first();
  int second = co_await load_second(first);

  vix::print("result:", second);
}
```

`load_second()` starts only after `load_first()` has completed.

Conceptually:

```text
load_first
    ↓
 complete
    ↓
load_second
    ↓
 complete
```

This is often exactly what the program needs. Concurrency should not be introduced when the operations are genuinely dependent.

## Independent work

Some tasks do not depend on each other.

Consider two operations:

```cpp
task<int> load_left();
task<int> load_right();
```

Awaiting them separately creates a sequential relationship:

```cpp
int left = co_await load_left();
int right = co_await load_right();
```

The second task does not begin through that expression until the first task has completed.

When both operations can progress independently, Vix Async provides composition helpers that start them together.

## Wait for all tasks

Use `when_all` when every result is required.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<int> first()
{
  co_return 10;
}

task<int> second()
{
  co_return 20;
}

task<void> run(io_context& ctx)
{
  auto results = co_await when_all(
    ctx.get_scheduler(),
    first(),
    second()
  );

  vix::print("first:", std::get<0>(results));
  vix::print("second:", std::get<1>(results));
}
```

The tasks are started through the supplied scheduler and can make progress independently.

```text
first  ───────── complete ───┐
                             ├── when_all resumes
second ───────── complete ───┘
```

The waiting coroutine continues only after every supplied task has completed.

## Composition does not create new threads

`when_all` does not turn each task into an operating-system thread.

Each task still follows its own asynchronous operations.

For example:

```text
task A
  ↓
timer

task B
  ↓
TCP read

task C
  ↓
CPU pool
```

The timer service, networking backend, and CPU workers may use different execution resources, but task coordination still returns through the same Vix scheduler.

`when_all` coordinates tasks. It does not provide another runtime.

## `task<void>` can participate

Composition is not limited to tasks that return values.

For example:

```cpp
task<void> save_user();
task<void> write_audit();

task<void> run(io_context& ctx)
{
  co_await when_all(
    ctx.get_scheduler(),
    save_user(),
    write_audit()
  );

  vix::print("both operations completed");
}
```

The caller only needs to know that both operations finished.

This is useful when the work matters but no individual result needs to be collected.

## Wait for the first task

Use `when_any` when the program can continue as soon as one of several operations completes.

```cpp
auto result = co_await when_any(
  ctx.get_scheduler(),
  first(),
  second()
);
```

Conceptually:

```text
first  ───── complete ─── winner
second ──────────────── continues
```

The important difference from `when_all` is that `when_any` does not wait for every task before returning.

It reports the first completed task.

## Losing tasks continue

`when_any` does not automatically cancel the tasks that did not finish first.

Suppose:

```text
task A completes after 50 ms
task B completes after 500 ms
```

`when_any` can return after task A completes, but task B remains active.

```text
A ───── winner
          │
          └── when_any returns

B ───────────────── continues
```

This behavior matters for lifetime.

The scheduler and any services used by the remaining tasks must stay alive until those tasks can finish.

## Why losers are not cancelled automatically

A general `task<T>` does not necessarily have a cancellation mechanism.

One task may be waiting on a cancellable timer. Another may be executing ordinary C++ code. Another may be using an operation with its own cancellation policy.

`when_any` therefore does not invent cancellation semantics for arbitrary tasks.

If the application needs a race where losing operations are cancelled, cancellation must be part of those operations explicitly.

This keeps task coordination separate from cancellation policy.

## Composition and cancellation

Cancellation can be passed into the tasks being composed.

For example:

```cpp
task<void> operation(
  io_context& ctx,
  cancel_token token)
{
  co_await ctx.timers().sleep_for(
    std::chrono::seconds(5),
    token
  );
}
```

Several such tasks can then share a cancellation source if the application wants to control them together.

```text
cancel_source
      │
      ├── task A
      ├── task B
      └── task C
```

Task composition decides when the caller resumes.

Cancellation decides whether supported operations should stop.

Those are separate decisions.

## Errors remain observable

Composition does not remove normal task error propagation.

If an awaited task fails, its exception remains part of the asynchronous result and can reach the coroutine waiting on the composition helper.

For example:

```cpp
task<void> run(io_context& ctx)
{
  try
  {
    co_await when_all(
      ctx.get_scheduler(),
      first(),
      second()
    );

    vix::print("completed");
  }
  catch (const std::exception& error)
  {
    vix::print("error:", error.what());
  }
}
```

The exact result and error behavior of `when_all` and `when_any` is covered on their dedicated page.

## Choose composition from the dependency

The important question is not how many tasks exist. It is what relationship exists between them.

If one operation needs the result of another:

```text
A
↓
B
```

use normal `co_await`.

If several independent operations must all finish:

```text
A ─┐
B ─┼─ all required
C ─┘
```

use `when_all`.

If execution can continue after the first completion:

```text
A ─┐
B ─┼─ first completion matters
C ─┘
```

use `when_any`.

This keeps the code aligned with the real dependency instead of introducing concurrency everywhere by default.

## Keep lifetime visible

Concurrent tasks can remain active while the coroutine that created them is suspended or has already moved on.

Objects referenced by those tasks must therefore remain valid for as long as the tasks use them.

This is especially important with:

- references captured by coroutines
- `io_context`
- scheduler lifetime
- network objects
- cancellation state
- tasks that lose a `when_any` race

Asynchronous composition changes execution order, but it does not remove normal C++ lifetime rules.

## The composition model

The Async task model can be summarized like this:

```text
single dependency
      ↓
   co_await

independent tasks, all required
      ↓
   when_all

independent tasks, first required
      ↓
   when_any
```

All three forms continue to use `task<T>`, the same scheduler, and the same asynchronous services.

There is no separate task graph runtime hidden behind composition.

## Next step

Continue with [`when_all` and `when_any`](./when-all-and-when-any) for their exact result types, empty-input behavior, error propagation, winner representation, and lifetime rules.

Then read:

- [Cancellation](./cancellation)
- [Tasks](./tasks)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
