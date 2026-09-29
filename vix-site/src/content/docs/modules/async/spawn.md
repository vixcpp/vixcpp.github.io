# Spawn and Detached Tasks

Most Vix Async tasks are awaited by another coroutine. Sometimes that is not the relationship you want.

A server may accept a connection and start a task to handle that client while immediately returning to `async_accept()`. A background operation may also need to continue independently of the coroutine that started it.

For this case, Vix Async provides `spawn_detached()`.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

## Start a detached task

`spawn_detached()` accepts an `io_context` and a `task<void>`.

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> background()
{
  vix::print("background task");
  co_return;
}

int main()
{
  io_context ctx;

  spawn_detached(
    ctx,
    background()
  );

  ctx.run();

  return 0;
}
```

The task is scheduled through the context and runs without an awaiting parent.

There is no result or task handle returned to the caller.

## Why detach a task

Consider a server that accepts clients one at a time.

If each connection handler is awaited directly:

```cpp
auto client = co_await listener->async_accept();

co_await handle_client(std::move(client));
```

the accept loop cannot request another client until `handle_client()` finishes.

Detaching the handler changes that relationship:

```cpp
auto client = co_await listener->async_accept();

spawn_detached(
  ctx,
  handle_client(std::move(client))
);
```

The connection handler begins independently, while the server coroutine can continue and accept another connection.

Conceptually:

```text
server
  ↓
accept client A
  ↓
spawn handler A
  ↓
accept client B
  ↓
spawn handler B
  ↓
accept client C
```

The handlers may remain active at the same time because they suspend independently on their own asynchronous operations.

## Detached means no parent waits

With normal task composition:

```cpp
co_await work();
```

the caller has a direct relationship with the child task.

```text
parent task
    ↓
await child
    ↓
child completes
    ↓
parent continues
```

With `spawn_detached()`:

```cpp
spawn_detached(ctx, work());
```

there is no await relationship.

```text
caller
   ↓
spawn task
   ├──────────────→ caller continues
   │
   └──────────────→ detached task continues
```

The caller cannot later retrieve a result from that detached task.

## Detached tasks return `void`

The current `spawn_detached()` API accepts `task<void>`:

```cpp
void spawn_detached(
  io_context& ctx,
  task<void> task
);
```

A detached task therefore represents work whose result does not need to be returned to the caller.

If a result matters, keep the task inside normal coroutine composition and `co_await` it instead.

```cpp
int value = co_await compute();

vix::print("value:", value);
```

Detaching work that produces an important result would remove the normal place where that result can be observed.

## The task still uses normal async execution

Detaching a task does not create a new thread.

For example:

```cpp
task<void> background(io_context& ctx)
{
  vix::print("started");

  co_await ctx.timers().sleep_for(
    std::chrono::milliseconds(100)
  );

  vix::print("finished");
}
```

When spawned:

```cpp
spawn_detached(
  ctx,
  background(ctx)
);
```

the task still follows the normal Vix Async execution model:

```text
spawn_detached
      ↓
context scheduler
      ↓
task starts
      ↓
timer suspends task
      ↓
timer completes
      ↓
scheduler
      ↓
task resumes
```

`spawn_detached()` changes ownership and observation, not the execution model.

## Lifetime is still important

Detached does not mean independent of the runtime.

A detached task can still depend on:

- the `io_context`
- its scheduler
- timers
- networking
- signals
- CPU work
- objects captured or referenced by the coroutine

Those dependencies must remain valid while the task uses them.

For example:

```cpp
io_context ctx;

spawn_detached(
  ctx,
  background(ctx)
);

ctx.run();
```

keeps the context alive while the scheduler drives the detached task.

Destroying objects referenced by a detached coroutine before that coroutine finishes can still create invalid lifetime relationships.

## Exceptions are not propagated

An awaited task can propagate an exception to its parent:

```cpp
try
{
  co_await work();
}
catch (const std::exception& error)
{
  vix::print("error:", error.what());
}
```

A detached task has no parent waiting for it.

For that reason, exceptions that escape a task started with `spawn_detached()` are intentionally swallowed at the detached boundary.

```text
detached task
     ↓
exception escapes
     ↓
detached boundary
     ↓
exception consumed
```

The exception does not propagate through `ctx.run()`.

This keeps an unobserved detached failure from terminating the complete async runtime, but it also means detached work should handle errors itself when the application needs to know about them.

For example:

```cpp
task<void> background()
{
  try
  {
    co_await perform_work();
  }
  catch (const std::exception& error)
  {
    vix::print("background error:", error.what());
  }
}
```

Handling the error inside the task keeps the failure visible even though the task itself is detached.

## Detached tasks clean up after completion

A normal `task<T>` has an owner responsible for its coroutine frame.

A detached task cannot rely on the original caller to keep such an object and later destroy it.

`spawn_detached()` therefore transfers the task into detached execution. The detached coroutine cleans up its own frame when execution finishes.

The caller does not need to keep a `task<void>` object alive after spawning it.

This is valid:

```cpp
spawn_detached(
  ctx,
  background()
);
```

There is no need to store the result of `background()` first.

## Cancellation is separate from detachment

`spawn_detached()` does not automatically create or request cancellation.

If the operations inside a detached task need to be cancellable, pass a cancellation token through the task just as you would for an awaited coroutine.

```cpp
task<void> background(
  io_context& ctx,
  cancel_token token)
{
  co_await ctx.timers().sleep_for(
    std::chrono::seconds(5),
    token
  );
}
```

The task can then be spawned with that token already attached to its workflow.

Detachment answers who waits for the task.

Cancellation answers how supported pending operations are asked to stop.

They are separate concerns.

## Detached work and shutdown

A detached task may still be suspended when runtime shutdown begins.

For example:

```text
detached task
      ↓
waiting for network I/O
      ↓
io_context shutdown
      ↓
network operation cancelled
      ↓
continuation returns to scheduler
      ↓
task leaves operation
      ↓
detached task completes
```

The context shutdown order is designed so services can cancel or finish pending operations while the scheduler is still available to process their continuations.

A detached task does not receive special lifetime immunity during shutdown. It still depends on the services it is using.

## When to use `spawn_detached`

Use detached execution when the caller intentionally does not need to wait for the task or obtain a result from it.

A common example is per-connection server work:

```cpp
while (ctx.is_running())
{
  auto client = co_await listener->async_accept();

  spawn_detached(
    ctx,
    handle_client(std::move(client))
  );
}
```

Each client handler can suspend independently while the listener continues accepting new connections.

Prefer normal `co_await` when completion, a return value, or exception propagation is part of the caller's workflow.

```cpp
auto result = co_await operation();
```

Use `spawn_detached()` only when breaking that parent-child relationship is intentional.

## Current spawn API

The current public spawn helper is:

```cpp
vix::async::core::spawn_detached(
  io_context& ctx,
  task<void> task
);
```

There is currently no separate general `spawn()` API that returns a join handle.

Task results and structured waiting remain part of normal `co_await`, `when_all`, and `when_any` composition.

## Next step

Continue with [Task Composition](./task-composition) to see how tasks can remain observable while several asynchronous operations are coordinated together.

Then read:

- [`when_all` and `when_any`](./when-all-and-when-any)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
