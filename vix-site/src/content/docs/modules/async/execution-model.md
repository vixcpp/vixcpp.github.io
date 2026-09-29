# Execution Model

Vix Async uses cooperative coroutine execution.

A coroutine runs until it returns or reaches a suspension point. When it suspends, the scheduler is free to execute other ready work. Once the awaited operation completes, the coroutine continuation is placed back on the scheduler and execution continues from the point after `co_await`.

This model is shared by tasks, timers, CPU work, networking, signals, and task composition.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## A task starts suspended

A function returning `task<T>` does not immediately run when it is called.

```cpp
vix::async::task<int> compute()
{
  vix::print("compute");

  co_return 42;
}
```

This:

```cpp
auto task = compute();
```

creates the coroutine and its frame, but `compute` has not printed anything yet.

The task begins when it is awaited by another coroutine or explicitly started on a scheduler.

For a root task:

```cpp
std::move(task).start(ctx.get_scheduler());
```

For a child task:

```cpp
int value = co_await compute();
```

This lazy start is important because task creation and task execution are separate operations.

## Starting a root task

The first task in an asynchronous program has no parent coroutine to await it.

It must be attached to a scheduler explicitly.

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

The sequence is:

```text
create run()
     ↓
task is suspended
     ↓
start on scheduler
     ↓
scheduler receives coroutine handle
     ↓
ctx.run()
     ↓
scheduler resumes coroutine
```

The task does not need its own thread.

It runs when the scheduler resumes it.

## Running until suspension

Once resumed, a coroutine executes like ordinary C++ code.

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  vix::print("A");

  int value = 21 * 2;

  vix::print("value:", value);

  co_await ctx.timers().sleep_for(
    std::chrono::milliseconds(100)
  );

  vix::print("B");
}
```

Everything before `co_await` runs synchronously on the scheduler thread.

The coroutine only gives control back when the awaited operation suspends it.

The execution is therefore:

```text
scheduler resumes run()
        ↓
print A
        ↓
compute value
        ↓
print value
        ↓
sleep_for()
        ↓
coroutine suspends
```

Until that suspension point is reached, no other ready coroutine can execute on the same scheduler thread.

## Suspension does not block the scheduler

When a coroutine suspends, its frame remains alive, but it is no longer executing.

For a timer:

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(100)
);
```

the coroutine waits logically, but the scheduler thread is free.

```text
coroutine A
    ↓
sleep_for()
    ↓
suspended

scheduler
    ↓
coroutine B
callback C
other ready work
```

This is the main difference between asynchronous waiting and blocking the current thread.

A blocking call occupies the thread.

A suspended coroutine does not.

## Resuming after an asynchronous operation

When the awaited operation completes, the coroutine must become ready again.

A timer follows this path:

```text
timer expires
     ↓
timer service
     ↓
continuation posted to scheduler
     ↓
scheduler resumes coroutine
     ↓
execution continues after co_await
```

For networking:

```text
network operation completes
          ↓
Asio backend
          ↓
continuation posted to scheduler
          ↓
coroutine resumes
```

The backend thread is responsible for completing the operation, but normal coroutine continuation returns through the Vix scheduler.

## Child tasks

A task can await another task directly.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<int> load_value()
{
  co_return 42;
}

vix::async::task<void> run()
{
  int value = co_await load_value();

  vix::print("value:", value);
}
```

The parent task suspends while the child runs.

Conceptually:

```text
run()
  ↓
co_await load_value()
  ↓
run() suspends
  ↓
load_value() starts
  ↓
load_value() completes
  ↓
run() continues
```

The returned value becomes the result of the `co_await`.

If the child task throws, the exception is propagated through the await boundary.

## CPU work changes execution threads

A CPU pool submission is different from a normal child task because the callable itself runs on a worker thread.

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  int value = co_await ctx.cpu_pool().submit([](){
    return 21 * 2;
  });

  vix::print("value:", value);
}
```

The execution flow becomes:

```text
scheduler thread
      ↓
run()
      ↓
cpu_pool().submit(...)
      ↓
run() suspends
      ↓
worker thread runs callable
      ↓
callable completes
      ↓
awaiting operation becomes ready
      ↓
coroutine resumes
```

The CPU pool exists because expensive synchronous work should not occupy the scheduler thread.

The coroutine itself still follows the same suspend and resume model.

## Long synchronous work still blocks

Coroutines do not automatically make synchronous code asynchronous.

This code still blocks the scheduler:

```cpp
vix::async::task<void> run()
{
  perform_expensive_work();

  co_return;
}
```

No suspension occurs while `perform_expensive_work()` executes.

The scheduler cannot process another coroutine until the function returns or the current coroutine reaches a suspension point.

For work that should run elsewhere:

```cpp
co_await ctx.cpu_pool().submit([](){
  perform_expensive_work();
});
```

The distinction is important because `co_await` only helps when the awaited operation can actually suspend.

## Ready does not always mean suspended

An awaited operation can sometimes complete without needing a real asynchronous wait.

In that case, the coroutine may continue immediately rather than leaving the scheduler and returning later.

The exact behavior depends on the awaitable.

The important model is:

```text
awaited operation ready now
        ↓
continue

awaited operation not ready
        ↓
suspend
        ↓
resume later
```

Application code normally does not need to inspect that distinction manually.

## Several tasks can be in progress

A single scheduler thread can manage many tasks because most of them may be suspended at any given moment.

For example:

```text
task A -> waiting for timer

task B -> waiting for TCP data

task C -> waiting for DNS

task D -> ready
```

The scheduler only executes work that is currently ready.

It does not dedicate one scheduler thread to each task.

This is why the runtime can coordinate several independent operations even though coroutine continuations normally return to one event-loop thread.

## `when_all`

`when_all` starts several tasks and suspends until all of them have completed.

```cpp
auto results = co_await vix::async::when_all(
  ctx.get_scheduler(),
  first(),
  second()
);
```

The tasks can progress independently:

```text
first  ──────── complete ─────┐
                              │
second ───────────── complete ─┼─ when_all resumes
                              │
                              ┘
```

`when_all` itself does not create extra worker threads.

The tasks use whatever asynchronous services their own operations require.

## `when_any`

`when_any` resumes when the first supplied task completes.

```text
task A ───── complete ── winner
task B ─────────────── continues
task C ─────────────── continues
```

The losing tasks are not automatically cancelled.

They remain active after `when_any` returns.

This means the scheduler and services they depend on must remain alive until those tasks can finish.

The returned result only contains the completed slot for the winning task.

## Cancellation and execution

Cancellation is also cooperative.

A cancellation request does not forcibly stop a coroutine in the middle of arbitrary C++ execution.

For an operation that supports cancellation:

```text
coroutine
    ↓
await operation
    ↓
suspended
    ↓
cancellation requested
    ↓
operation reacts
    ↓
continuation becomes ready
    ↓
scheduler resumes coroutine
```

The coroutine then observes the cancellation through the result or exception defined by that operation.

A CPU callable that is already running must cooperate explicitly if it wants to stop early.

## Exceptions

Exceptions inside an awaited task are stored by the coroutine and rethrown when the awaiting code resumes.

For example:

```cpp
vix::async::task<int> compute()
{
  throw std::runtime_error("failed");

  co_return 0;
}
```

An awaiting coroutine can handle the error normally:

```cpp
vix::async::task<void> run()
{
  try
  {
    int value = co_await compute();

    vix::print("value:", value);
  }
  catch (const std::exception& error)
  {
    vix::print("error:", error.what());
  }
}
```

This keeps asynchronous task errors inside normal C++ exception flow.

Detached tasks are different because there is no awaiting coroutine available to receive their exception. Their behavior is covered in [Spawn and Detached Tasks](./spawn).

## The scheduler is cooperative

The scheduler cannot preempt ordinary C++ code.

If a coroutine executes:

```cpp
while (true)
{
  perform_work();
}
```

without returning or suspending, the scheduler remains inside that coroutine indefinitely.

Other tasks cannot progress on that scheduler thread.

Good Async code therefore keeps scheduler-thread work short and moves long CPU or blocking operations to the appropriate service.

## Shutdown and suspended work

Shutdown must account for coroutines that are still suspended inside services.

For example:

```text
coroutine waits for TCP
        ↓
shutdown begins
        ↓
network service cancels operation
        ↓
completion returned to scheduler
        ↓
coroutine resumes and observes shutdown
        ↓
scheduler can finish
```

This is why `io_context::shutdown()` stops services before completing scheduler shutdown.

Pending continuations still need a valid scheduler while the runtime is leaving those asynchronous operations.

## Execution model summary

A Vix Async task normally moves through these states:

```text
created
   ↓
suspended initially
   ↓
scheduled or awaited
   ↓
running
   ↓
┌─────────────────────┐
│ operation not ready │
└──────────┬──────────┘
           ↓
       suspended
           ↓
 operation completes
           ↓
       scheduled
           ↓
        running
           ↓
 completed or suspends again
```

The model is cooperative. A task runs until it suspends or completes. Services make suspended tasks ready again, and the scheduler decides when ready continuations execute.

## Next step

Continue with [Tasks](./tasks) to look more closely at `task<T>`, task ownership, values, exceptions, and the difference between root and awaited tasks.

Then read:

- [Spawn and Detached Tasks](./spawn)
- [Task Composition](./task-composition)
- [Cancellation](./cancellation)
- [CPU Offloading](./cpu-offloading)
