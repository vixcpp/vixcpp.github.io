# Core Concepts

Vix Async is built around a small number of concepts that work together.

The most important ones are `task<T>`, `scheduler`, and `io_context`. Once those are clear, timers, CPU work, networking, signals, cancellation, and task composition become easier to understand because they all use the same execution model.

## Header

Use the public Vix header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## The basic model

A Vix Async program can be reduced to this:

```text
task<T>
   +
scheduler
   +
io_context
   ↓
asynchronous execution
```

`task<T>` represents work that can suspend.

`scheduler` decides when suspended work can continue.

`io_context` owns the runtime that connects the scheduler to asynchronous services.

The important part is that the module does not create a separate programming model for every asynchronous feature. A timer and a TCP read are different operations, but both suspend a coroutine and eventually make it ready to continue.

## `task<T>`

`task<T>` is the coroutine type used by the module.

```cpp
vix::async::task<int> compute()
{
  co_return 42;
}
```

Calling `compute()` creates a task. It does not immediately execute the body.

This means:

```cpp
auto task = compute();
```

creates suspended work.

The coroutine starts when it is awaited by another coroutine or explicitly started on a scheduler.

```cpp
std::move(task).start(ctx.get_scheduler());
```

Inside another task, the normal form is `co_await`:

```cpp
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

A `task<T>` can return a value, return `void`, suspend on other asynchronous operations, and propagate exceptions to the coroutine that awaits it.

The task type is move-only because it owns a coroutine frame.

## Suspension

The main advantage of a coroutine is that waiting does not have to mean blocking the thread.

Consider a timer:

```cpp
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(250)
);
```

The current coroutine cannot continue until the timer expires, so it suspends.

The scheduler thread does not need to wait inside that coroutine. It can execute other ready work.

Later:

```text
timer expires
     ↓
continuation becomes ready
     ↓
scheduler receives it
     ↓
coroutine resumes
```

The same idea applies to network operations, signal waits, and CPU work submitted through the context.

## `scheduler`

The scheduler is responsible for executing ready work.

It accepts:

- coroutine continuations
- ordinary callbacks

A coroutine that has become ready does not resume itself. Its continuation is submitted to the scheduler.

```text
operation completes
        ↓
scheduler
        ↓
coroutine resumes
```

The scheduler uses FIFO queues and processes ready coroutine handles before queued callbacks.

Calling:

```cpp
ctx.run();
```

runs this scheduler on the thread that called `run()`.

This gives the runtime an important execution boundary. Coroutine continuations managed by the context return through that scheduler instead of continuing directly on arbitrary service threads.

## `io_context`

`io_context` brings the runtime together.

```cpp
vix::async::io_context ctx;
```

It provides access to the scheduler:

```cpp
auto& scheduler = ctx.get_scheduler();
```

and to asynchronous services:

```cpp
auto& timers = ctx.timers();
auto& cpu = ctx.cpu_pool();
auto& signals = ctx.signals();
auto& net = ctx.net();
```

These services are created when needed.

A normal application usually creates one context, starts its root asynchronous work on the context scheduler, then runs the context.

```cpp
vix::async::io_context ctx;

std::move(run(ctx)).start(ctx.get_scheduler());

ctx.run();
```

The context also owns the shutdown relationship between these services and the scheduler.

## Services

A service performs work that cannot be completed immediately.

Examples include:

```text
timer service    waits for time
CPU pool         executes work on worker threads
signal service   waits for operating-system signals
network service  performs TCP, UDP, and DNS operations
```

The service may use another thread internally, but that does not mean the coroutine should continue on that thread.

The normal flow is:

```text
coroutine
    ↓
service operation
    ↓
coroutine suspends
    ↓
service completes work
    ↓
scheduler
    ↓
coroutine continues
```

This keeps coroutine execution separate from the threads used to implement the underlying operation.

## Scheduler thread and service threads

It is useful to distinguish the thread running coroutine continuations from the threads used by services.

For example:

```text
                    io_context
                        │
                     scheduler
                        │
                 coroutine thread
                        │
        ┌───────────────┼────────────────┐
        │               │                │
    timer service    CPU pool      network service
        │               │                │
   timer thread     worker threads     Asio thread
```

A timer thread waits for deadlines.

CPU workers execute submitted functions.

The networking backend performs Asio operations.

When those operations complete, the resulting coroutine continuation is returned to the Vix scheduler.

Application code therefore does not need to treat each service thread as another coroutine runtime.

## Root tasks

A task awaited by another task starts naturally through `co_await`.

The first task in the program has no parent coroutine to await it. It must therefore be started explicitly.

```cpp
vix::async::io_context ctx;

auto root = run(ctx);

std::move(root).start(ctx.get_scheduler());

ctx.run();
```

This task is often called the root task because the rest of the asynchronous workflow can be created from it.

For example:

```cpp
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

Only `run()` needs to be started manually. `load_value()` is started by the `co_await` inside `run()`.

## CPU work is different from coroutine scheduling

The scheduler is not a general CPU worker pool.

Its job is to resume coroutine work and execute callbacks on the runtime loop.

If a callable performs expensive computation or blocks for a long time, running it directly on the scheduler thread prevents other ready coroutine work from progressing.

Use the CPU pool for that work:

```cpp
int result = co_await ctx.cpu_pool().submit([](){
  return perform_expensive_work();
});
```

The relationship is:

```text
scheduler thread
      ↓
submit CPU work
      ↓
coroutine suspends
      ↓
worker thread executes callable
      ↓
result becomes ready
      ↓
scheduler
      ↓
coroutine resumes
```

The thread pool is therefore a service used by Async, not the runtime itself.

## Cancellation

Cancellation in Vix Async is cooperative.

A source owns the cancellation state:

```cpp
vix::async::cancel_source source;
```

A token gives another operation access to that state:

```cpp
auto token = source.token();
```

Cancellation is requested through the source:

```cpp
source.cancel();
```

Supported operations can register for that request and stop their pending work.

Cancellation does not mean that Vix can interrupt any arbitrary C++ instruction. A function that is already running on a CPU worker must cooperate if it wants to stop early.

This distinction matters because asynchronous waiting and executing arbitrary C++ code have different cancellation boundaries.

## Composition

Coroutines can be composed directly with `co_await`.

```cpp
int value = co_await compute();
```

The module also provides coordination helpers for several tasks.

```cpp
auto results = co_await vix::async::when_all(
  ctx.get_scheduler(),
  first(),
  second()
);
```

`when_all` waits for all tasks.

`when_any` waits for the first completion.

These helpers are built on top of tasks and scheduling. They do not introduce another runtime.

One important difference is that `when_any` does not automatically stop the losing tasks. They continue running, so the scheduler and services they use must remain alive until they finish.

## Lifetime

Asynchronous execution makes lifetime more important because work may continue after the line that started it has returned.

The objects used by an operation must remain alive for as long as the operation depends on them.

At the runtime level, this means the `io_context` must remain alive while its tasks and services still need it.

A typical lifetime looks like:

```text
create context
      ↓
create root task
      ↓
start root task
      ↓
run context
      ↓
tasks and services operate
      ↓
shutdown
      ↓
destroy context
```

Network objects also keep the network backend they depend on alive, so their Asio executor does not disappear while the object still exists.

The complete shutdown rules are covered in [Lifecycle and Shutdown](./lifecycle-and-shutdown).

## The model to keep in mind

When reading the rest of the Async documentation, keep this model:

```text
                   task<T>
                      │
                   co_await
                      │
                      ▼
                  scheduler
                      │
                 io_context
                      │
        ┌─────────────┼─────────────┐
        │             │             │
      timers         CPU         networking
        │             │             │
        └──────── completion ────────┘
                      │
                      ▼
                  scheduler
                      │
                      ▼
               coroutine resumes
```

The services differ in what they wait for or execute. The coroutine model remains the same.

## Next step

Continue with [Architecture](./architecture) for the deeper relationship between the context, scheduler, services, and their execution threads.

Then read:

- [`io_context`](./io-context)
- [Scheduler](./scheduler)
- [Execution Model](./execution-model)
- [Tasks](./tasks)
