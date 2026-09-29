# Quick Start

The `async` module lets C++20 coroutines suspend while they wait for timers, network operations, signals, or work running on another thread.

A small Vix Async program normally has three parts: an `io_context`, one or more `task<T>` coroutines, and a call to `run()` that drives the scheduler.

## Header

Use the public Vix header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Create a first async program

Create `main.cpp`:

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

int main()
{
  vix::async::io_context ctx;

  std::move(run(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

The task prints `waiting`, suspends while the timer is active, then resumes and prints `done`.

The important part is that the timer does not block the scheduler thread while the coroutine is suspended.

## Create and start a task

A `task<T>` is lazy. Calling a coroutine function creates the task, but does not immediately run its body.

```cpp
vix::async::task<int> compute()
{
  co_return 42;
}
```

To run a root task, start it on a scheduler:

```cpp
vix::async::io_context ctx;

auto task = compute();

std::move(task).start(ctx.get_scheduler());

ctx.run();
```

Tasks are move-only, so `start()` is normally called on a moved task.

Inside another coroutine, use `co_await` instead:

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

## Wait for a timer

Use the timer service when a coroutine needs to wait for time to pass.

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<void> run(vix::async::io_context& ctx)
{
  vix::print("before");

  co_await ctx.timers().sleep_for(250ms);

  vix::print("after");
}
```

While this task is suspended, the scheduler can continue running other ready work.

## Run several tasks

Tasks can be composed with `when_all`.

```cpp
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;

vix::async::task<int> first(vix::async::io_context& ctx)
{
  co_await ctx.timers().sleep_for(50ms);
  co_return 10;
}

vix::async::task<int> second(vix::async::io_context& ctx)
{
  co_await ctx.timers().sleep_for(100ms);
  co_return 20;
}

vix::async::task<void> run(vix::async::io_context& ctx)
{
  auto results = co_await vix::async::when_all(
    ctx.get_scheduler(),
    first(ctx),
    second(ctx)
  );

  vix::print("first:", std::get<0>(results));
  vix::print("second:", std::get<1>(results));
}
```

`when_all` starts the supplied tasks and resumes when all of them have completed.

Use `when_any` when only the first completion matters. The other tasks continue running after `when_any` returns, so the runtime they use must remain alive until they can finish.

## Move CPU work off the scheduler

CPU-intensive or blocking work should not occupy the scheduler thread for a long time.

Use the context CPU pool:

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

vix::async::task<void> run(vix::async::io_context& ctx)
{
  int result = co_await ctx.cpu_pool().submit([](){
    int total = 0;

    for (int i = 0; i < 100000; ++i)
    {
      total += i;
    }

    return total;
  });

  vix::print("result:", result);
}
```

The callable executes on a worker thread. The coroutine suspends while the work runs, then continues with the returned value.

If no coroutine result is needed, use `post()` instead.

```cpp
bool accepted = ctx.cpu_pool().post([](){
  vix::print("background work");
});

vix::print("accepted:", accepted);
```

## Cancel a supported operation

Cancellation is cooperative.

Create a source and pass its token to an operation that supports cancellation:

```cpp
vix::async::cancel_source source;

auto token = source.token();
```

Cancellation can then be requested from another part of the program:

```cpp
source.cancel();
```

The operation decides how to react at its cancellation boundary. Cancellation does not forcibly interrupt arbitrary C++ code that is already executing.

Timers, signals, and supported network operations participate in this model.

## Use networking

Networking is also exposed through `io_context`.

```cpp
auto& net = ctx.net();
```

The network service provides asynchronous TCP, UDP, and DNS operations.

The normal flow remains the same:

```text
start operation
      ↓
coroutine suspends
      ↓
network work completes
      ↓
continuation returns to scheduler
      ↓
coroutine resumes
```

The focused networking pages cover sockets, acceptors, datagrams, resolution, cancellation, and shutdown behavior.

## Runtime lifetime

The `io_context` should remain alive while tasks and services that depend on it are still active.

A typical program follows this order:

```text
create io_context
        ↓
create root task
        ↓
start task
        ↓
run scheduler
        ↓
finish asynchronous work
        ↓
shutdown
```

`stop()` and `shutdown()` are not the same operation. `stop()` requests scheduler termination. `shutdown()` coordinates the services owned by the context before the runtime finishes.

The full lifecycle is covered in [Lifecycle and Shutdown](./lifecycle-and-shutdown).

## Next step

Continue with [Core Concepts](./core-concepts) to understand how `task<T>`, `scheduler`, and `io_context` fit together.

Then move to the focused pages for:

- [Tasks](./tasks)
- [Timers](./timers)
- [Cancellation](./cancellation)
- [Thread Pool](./thread-pool)
- [Networking](./networking)
