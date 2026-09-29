# Tasks

`task<T>` is the coroutine type used by Vix Async.

A task represents work that may suspend before producing a value. Unlike a normal function call, creating a task does not immediately execute its body. The coroutine starts later, either because another coroutine awaits it or because the task is explicitly started on a scheduler.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a task

A coroutine that returns `task<T>` can return a value with `co_return`.

```cpp
#include <vix/async.hpp>

vix::async::task<int> compute()
{
  co_return 42;
}
```

Calling the function creates the task:

```cpp
auto task = compute();
```

The coroutine body has not executed yet.

This lazy behavior lets the caller decide how the task enters the asynchronous workflow.

## Tasks start suspended

Consider this task:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<int> compute()
{
  vix::print("computing");

  co_return 42;
}
```

Creating it is not enough to print anything:

```cpp
auto task = compute();
```

The task starts only when it is awaited or explicitly scheduled.

This distinction is useful because creating asynchronous work and executing asynchronous work remain separate operations.

## Await a task

Inside another coroutine, use `co_await` to run a task and wait for its result.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<int> compute()
{
  co_return 42;
}

vix::async::task<void> run()
{
  int value = co_await compute();

  vix::print("value:", value);
}
```

`run()` suspends while `compute()` executes.

When `compute()` finishes, its value becomes the result of the `co_await`, and `run()` continues.

The relationship is:

```text
run()
  ↓
co_await compute()
  ↓
run() suspends
  ↓
compute() executes
  ↓
compute() returns 42
  ↓
run() resumes
```

A child task does not need to be started manually when another task awaits it.

## Start a root task

The first task in an application has no parent coroutine to await it.

It must be started explicitly on a scheduler.

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

`start()` transfers the task into scheduler-driven execution.

The scheduler then resumes the coroutine when `ctx.run()` processes it.

## Returning values

A `task<T>` can return a value of type `T`.

```cpp
vix::async::task<int> answer()
{
  co_return 42;
}
```

The awaiting coroutine receives that value:

```cpp
vix::async::task<void> run()
{
  int value = co_await answer();

  vix::print("answer:", value);
}
```

Tasks can return application types as well as primitive values.

```cpp
#include <string>
#include <vix/async.hpp>

vix::async::task<std::string> load_name()
{
  co_return std::string{"Vix"};
}
```

The result belongs to the task and is transferred through the await boundary when the task completes.

## `task<void>`

Use `task<void>` when the asynchronous operation does not need to produce a value.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> save()
{
  vix::print("saved");

  co_return;
}
```

A `task<void>` can still be awaited:

```cpp
vix::async::task<void> run()
{
  co_await save();

  vix::print("finished");
}
```

The parent resumes when the child task completes.

## Tasks can suspend several times

A task is not limited to one suspension point.

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> run(vix::async::io_context& ctx)
{
  vix::print("first");

  co_await ctx.timers().sleep_for(50ms);

  vix::print("second");

  co_await ctx.timers().sleep_for(50ms);

  vix::print("third");
}
```

Each `co_await` may suspend the coroutine.

Its frame remains alive between resumptions, so local variables and execution state can survive across asynchronous waits.

Conceptually:

```text
running
   ↓
suspend
   ↓
resume
   ↓
suspend
   ↓
resume
   ↓
complete
```

## Local state survives suspension

Because the coroutine frame remains alive while the task is suspended, local variables can be used after an asynchronous operation completes.

```cpp
#include <chrono>
#include <string>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> run(vix::async::io_context& ctx)
{
  std::string name = "Vix";

  co_await ctx.timers().sleep_for(100ms);

  vix::print("name:", name);
}
```

The local `name` remains part of the coroutine state while the timer is pending.

This is one of the reasons coroutine code can keep normal sequential control flow even when execution is suspended between operations.

## Exceptions

Exceptions thrown by a task are propagated through the await boundary.

```cpp
#include <stdexcept>
#include <vix/async.hpp>

vix::async::task<int> compute()
{
  throw std::runtime_error("computation failed");

  co_return 0;
}
```

The awaiting coroutine can handle the exception with normal C++ error handling:

```cpp
#include <exception>
#include <vix/print.hpp>

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

The exception is not lost simply because the work crossed a coroutine boundary.

Detached tasks are different because no parent coroutine is waiting for their result or exception. That behavior is covered in [Spawn and Detached Tasks](./spawn).

## Tasks are move-only

A task owns a coroutine frame.

That ownership cannot be copied safely, so `task<T>` is move-only.

A task can be moved:

```cpp
auto first = compute();
auto second = std::move(first);
```

but it should not be treated as an ordinary copyable value.

The same rule explains the common root-task pattern:

```cpp
std::move(run(ctx)).start(ctx.get_scheduler());
```

Starting the task transfers its execution ownership into the asynchronous workflow.

## Root tasks and child tasks

There are two common ways a task enters execution.

A root task is started explicitly:

```cpp
std::move(run(ctx)).start(ctx.get_scheduler());
```

A child task is awaited:

```cpp
int value = co_await compute();
```

The distinction is mostly about ownership and who is responsible for continuing the workflow.

```text
root task
   ↓
start(scheduler)

child task
   ↓
co_await
```

Most application logic can then grow naturally from one root task by awaiting more tasks from inside it.

## Tasks do not create threads

Creating a task does not create an operating-system thread.

```cpp
auto task = compute();
```

creates a coroutine frame.

Execution happens through the scheduler and through whatever asynchronous services the task chooses to await.

For example:

```cpp
co_await ctx.timers().sleep_for(...);
```

uses the timer service.

```cpp
co_await ctx.cpu_pool().submit(...);
```

uses CPU worker threads.

```cpp
co_await socket.async_read(...);
```

uses the networking backend.

`task<T>` itself is the coroutine abstraction, not a thread abstraction.

## Synchronous code inside a task is still synchronous

Code inside a task runs normally until it reaches a suspension point.

```cpp
vix::async::task<void> run()
{
  perform_expensive_work();

  co_return;
}
```

`perform_expensive_work()` still executes synchronously on the thread currently running the coroutine.

Returning `task<void>` does not automatically move that work to another thread.

When the operation should run away from the scheduler thread, use the CPU pool:

```cpp
vix::async::task<void> run(vix::async::io_context& ctx)
{
  co_await ctx.cpu_pool().submit([](){
    perform_expensive_work();
  });
}
```

This distinction is important when deciding whether a coroutine will keep the event loop responsive.

## Task lifetime

A task can remain suspended while another service continues its operation.

For example:

```text
task
 ↓
await timer
 ↓
task suspended
 ↓
timer active
 ↓
timer completes
 ↓
task resumes
```

The coroutine frame must remain valid for that entire period.

The task implementation manages its own frame ownership, but surrounding runtime objects also need appropriate lifetimes.

A task waiting on a context service still depends on that context and its scheduler.

This is especially important for work started concurrently or through `when_any`, where some tasks may remain active after another result has already been returned.

## Tasks and cancellation

Cancellation is not built into every task automatically.

Instead, asynchronous operations can receive a `cancel_token` when they support cancellation.

A task can therefore compose cancellable operations:

```cpp
vix::async::task<void> run(
  vix::async::io_context& ctx,
  vix::async::cancel_token token)
{
  co_await ctx.timers().sleep_for(
    std::chrono::seconds(5),
    token
  );
}
```

The task itself remains a coroutine. The timer operation defines how the cancellation request is observed.

This lets cancellation remain attached to the operation that can actually respond to it.

## Compose tasks

Tasks can be composed directly:

```cpp
auto value = co_await compute();
```

or coordinated in groups:

```cpp
auto results = co_await vix::async::when_all(
  ctx.get_scheduler(),
  first(),
  second()
);
```

`when_all` and `when_any` operate on the same `task<T>` abstraction.

They do not create another task system.

The details of coordinating several tasks are covered in [Task Composition](./task-composition).

## Keep the model simple

The main task lifecycle is:

```text
create
  ↓
initially suspended
  ↓
start or co_await
  ↓
running
  ↓
suspend if needed
  ↓
resume
  ↓
return value / void
  ↓
complete
```

A task represents coroutine work and owns the state needed for that work to survive suspension.

The scheduler decides when ready work executes, while services provide the operations that can make a task suspend and become ready again.

## Next step

Continue with [Spawn and Detached Tasks](./spawn) to see how work can be started without an awaiting parent.

Then read:

- [Task Composition](./task-composition)
- [`when_all` and `when_any`](./when-all-and-when-any)
- [Cancellation](./cancellation)
- [Execution Model](./execution-model)
