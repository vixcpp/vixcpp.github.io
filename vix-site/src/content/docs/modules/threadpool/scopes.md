# Scopes

`Scope` provides structured lifetime management for a group of tasks submitted to one `ThreadPool`.

A scope tracks every task spawned through it and waits for those tasks before the scope is destroyed.

```cpp
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::atomic<int> counter{0};

  {
    vix::threadpool::Scope scope(pool);

    scope.spawn([&counter](){
      counter.fetch_add(1, std::memory_order_relaxed);
    });

    scope.spawn([&counter](){
      counter.fetch_add(1, std::memory_order_relaxed);
    });
  }

  return counter.load(std::memory_order_relaxed) == 2 ? 0 : 1;
}
```

Leaving the scope waits for the tracked work before destruction completes.

## Structured lifetime

Without a scope, independently submitted tasks have independent result objects:

```text
submit task A → Future A
submit task B → Future B
submit task C → Future C
```

The caller must manage every lifetime explicitly.

A `Scope` groups those operations:

```text
Scope
├── task A
├── task B
└── task C
     ↓
wait before Scope destruction completes
```

This is useful when several concurrent operations logically belong to one enclosing operation.

## Create a Scope

A scope is bound to an existing `ThreadPool`:

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::Scope scope(pool);
```

A new scope starts:

```text
open
empty
not cancelled
```

Therefore:

```cpp
scope.empty() == true
scope.size() == 0
scope.closed() == false
scope.cancelled() == false
```

The `ThreadPool` remains independently owned by the application.

`Scope` does not own the pool.

## Spawn work

Use `spawn()` to submit work through the bound pool:

```cpp
const bool accepted = scope.spawn([](){
  perform_work();
});
```

The scope converts the callable into a `Future<void>` and stores that future internally.

Conceptually:

```text
callable
   ↓
Scope::spawn()
   ↓
ThreadPool::submit()
   ↓
Future<void>
   ↓
stored by Scope
```

This stored Future allows the scope to wait for the task later.

## Spawn multiple tasks

A scope can track several tasks:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  perform_first_operation();
});

scope.spawn([](){
  perform_second_operation();
});

scope.spawn([](){
  perform_third_operation();
});

scope.wait();
```

The tasks are ordinary ThreadPool submissions and may execute concurrently when workers are available.

The scope coordinates their lifetime. It does not serialize them.

## `spawn()` tracks completion, not return values

`Scope::spawn()` stores work as `Future<void>`.

For example:

```cpp
scope.spawn([](){
  return 42;
});
```

is valid, but the returned `42` is discarded.

Conceptually:

```text
callable returns T
      ↓
Scope wrapper invokes callable
      ↓
return value discarded
      ↓
Future<void> tracks completion
```

Use `ThreadPool::submit()` directly when the result value itself is needed.

`Scope` is intended for tracking completion of related work.

## Callables take no arguments

The callable passed to `spawn()` must be invocable without arguments:

```cpp
scope.spawn([](){
  perform_work();
});
```

Capture required state through the callable:

```cpp
const int value = 42;

scope.spawn([value](){
  consume(value);
});
```

`Scope` does not inject arguments into the callable.

## Track the number of tasks

Use:

```cpp
const std::size_t count = scope.size();
```

to inspect the number of Futures currently stored by the scope.

For example:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  perform_first_operation();
});

scope.spawn([](){
  perform_second_operation();
});

const std::size_t count = scope.size();
```

At this point, before a wait operation removes the tracked Futures:

```text
count = 2
```

`size()` counts tracked Futures.

It does not mean that all of those tasks are still queued or running.

A task may already have completed while its Future remains stored by the scope.

## Check whether the Scope is empty

Use:

```cpp
if (scope.empty())
{
  // No Future is currently tracked.
}
```

A newly created scope is empty.

After spawning work:

```cpp
scope.spawn([](){
  perform_work();
});
```

it is no longer empty until the tracked Futures are taken by a wait operation.

`empty()` therefore describes the scope's tracking container, not worker activity.

## Wait for all tracked work

Use:

```cpp
scope.wait();
```

to wait for every currently tracked task.

Internally, `wait()` obtains the tracked Futures and calls:

```cpp
future.get();
```

for each one.

Conceptually:

```text
tracked Futures
      ↓
take all Futures
      ↓
Future 1 get()
      ↓
Future 2 get()
      ↓
Future 3 get()
      ↓
return
```

When `wait()` returns, every Future that was tracked when waiting began has reached a terminal asynchronous result.

## `wait()` closes the Scope

Calling:

```cpp
scope.wait();
```

also closes the scope against future `spawn()` calls.

The state transition is:

```text
open Scope
    ↓
wait()
    ↓
close Scope
    ↓
take tracked Futures
    ↓
wait for all
    ↓
closed and empty
```

Afterward:

```cpp
scope.closed() == true
scope.empty() == true
scope.size() == 0
```

A later:

```cpp
scope.spawn([](){
  perform_work();
});
```

returns `false`.

`wait()` is therefore a terminal operation for task submission through that `Scope`.

## Waiting cannot reopen a Scope

Once closed, a scope cannot be reopened.

There is no:

```text
open()
reset()
restart()
```

operation.

After:

```cpp
scope.wait();
```

or:

```cpp
scope.close();
```

the scope remains closed for the rest of its lifetime.

Create another `Scope` when another structured group of tasks is needed.

## `wait()` swallows task failures

`wait()` waits for every tracked Future but intentionally ignores exceptions from `Future::get()`.

For example:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  throw std::runtime_error("failure");
});

scope.wait();
```

`wait()` does not propagate the `std::runtime_error`.

Its behavior is conceptually:

```text
Future::get()
    ↓
throws?
 ┌────┴────┐
yes        no
 │          │
ignore    continue
 │
 ▼
continue waiting
```

This applies to any exception produced by `Future::get()`, including task exceptions and ThreadPool errors represented by `std::system_error`.

Use `wait_and_rethrow()` when failures must be observed.

## Wait and propagate failures

Use:

```cpp
scope.wait_and_rethrow();
```

to wait for all tracked tasks and propagate a failure.

For example:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  throw std::runtime_error("failure");
});

try
{
  scope.wait_and_rethrow();
}
catch (const std::runtime_error&)
{
  // Task failure observed.
}
```

Like `wait()`, this operation closes the scope and consumes all tracked Futures.

## All tasks are waited before rethrowing

`wait_and_rethrow()` does not stop at the first Future that throws.

It remembers the first exception encountered and continues waiting for every remaining tracked Future.

Conceptually:

```text
Future A
   ↓
throws
   ↓
remember exception
   ↓
Future B
   ↓
wait
   ↓
Future C
   ↓
wait
   ↓
all tracked Futures consumed
   ↓
rethrow remembered exception
```

This preserves the structured lifetime guarantee even when one task fails.

The exception is rethrown only after all tracked work has reached a terminal result.

## Which exception is rethrown

Futures are stored in `spawn()` order.

`wait_and_rethrow()` calls `get()` on them in that stored order and retains the first exception encountered during that traversal.

Therefore, the rethrown exception should be understood as:

```text
the first exception encountered while consuming
the tracked Futures
```

It is not a guarantee about which task failed first in wall-clock time.

Concurrent tasks can fail in a different temporal order.

## `wait_and_rethrow()` also closes the Scope

Like `wait()`:

```cpp
scope.wait_and_rethrow();
```

first closes the scope and removes its tracked Futures.

Even if it eventually throws:

```text
Scope remains closed
tracked Future container is empty
```

The structured work has already been waited for before the exception reaches the caller.

## Destructor behavior

The destructor calls:

```cpp
wait();
```

automatically.

Therefore:

```cpp
{
  vix::threadpool::Scope scope(pool);

  scope.spawn([](){
    perform_work();
  });
}
```

does not allow destruction of the `Scope` to complete until its tracked task reaches a terminal result.

This is the main structured-lifetime guarantee provided by `Scope`.

## Destructor failures are swallowed

The destructor is `noexcept`.

It catches and ignores any exception while waiting.

Conceptually:

```text
~Scope()
   ↓
wait()
   ↓
exception?
 ┌────┴────┐
yes        no
 │          │
ignore    finish
 │
 ▼
finish
```

If task failures matter to application logic, call:

```cpp
scope.wait_and_rethrow();
```

explicitly before destruction.

Do not rely on the destructor to report them.

## Destructor can block

Because destruction waits for tracked Futures, destroying a Scope can block until its work finishes.

For example:

```cpp
{
  vix::threadpool::Scope scope(pool);

  scope.spawn([](){
    perform_long_operation();
  });
}
```

the closing brace is a synchronization point.

Conceptually:

```text
enter scope
    ↓
spawn concurrent work
    ↓
other code in scope
    ↓
leave scope
    ↓
wait for tracked work
    ↓
Scope destroyed
```

This behavior is intentional.

## Close without waiting

Use:

```cpp
scope.close();
```

to prevent new tasks from being spawned without immediately waiting for existing tasks.

For example:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  perform_work();
});

scope.close();
```

After closing:

```cpp
scope.closed() == true
```

and:

```cpp
scope.spawn([](){
  another_operation();
});
```

returns:

```text
false
```

The already tracked task remains stored by the scope.

## `close()` does not wait

This:

```cpp
scope.close();
```

only changes submission state.

It does not call:

```text
wait()
cancel()
shutdown()
```

Conceptually:

```text
close()
   ↓
reject future spawn()
   ↓
existing tracked Futures remain
   ↓
existing tasks continue
```

Call:

```cpp
scope.wait();
```

or:

```cpp
scope.wait_and_rethrow();
```

when existing tasks must be joined explicitly.

Otherwise, the destructor will eventually wait for them.

## `close()` does not cancel

Closing and cancellation are separate operations.

```cpp
scope.close();
```

means:

```text
do not accept more scoped work
```

while:

```cpp
scope.cancel();
```

means:

```text
request cooperative cancellation
through the shared scope token
```

A scope can be:

```text
closed but not cancelled
```

or:

```text
cancelled but still open
```

until a wait or explicit close occurs.

## Cancel scoped work

Use:

```cpp
scope.cancel();
```

to request cancellation through the scope's shared `CancellationSource`.

For example:

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  perform_work();
});

scope.cancel();
scope.wait();
```

Cancellation is cooperative.

It does not forcibly terminate C++ code already running on a worker.

See [Cancellation](/modules/threadpool/cancellation).

## Check cancellation state

Use:

```cpp
if (scope.cancelled())
{
  // Scope cancellation was requested.
}
```

Before cancellation:

```text
cancelled() = false
```

After:

```cpp
scope.cancel();
```

the result is:

```text
cancelled() = true
```

Cancellation requests are idempotent because they use the underlying `CancellationSource`.

## Access the Scope cancellation token

Use:

```cpp
auto token = scope.cancellation_token();
```

The returned token observes the same cancellation state used for spawned tasks.

For example:

```cpp
vix::threadpool::Scope scope(pool);

auto token = scope.cancellation_token();

scope.cancel();

if (!token.cancelled())
{
  return 1;
}
```

This is useful when task code itself needs cooperative cancellation checkpoints.

## Every spawned task receives the Scope token

Before submitting work, `spawn()` performs:

```text
TaskOptions
    ↓
attach scope CancellationToken
    ↓
ThreadPool::submit()
```

Conceptually:

```text
Scope CancellationSource
          │
          ▼
    shared token
      ┌───┼───┐
      ▼   ▼   ▼
    task task task
```

This gives all scoped tasks one shared cancellation signal.

## Cancelling before `spawn()`

Cancellation does not automatically close the Scope.

Therefore this is allowed:

```cpp
vix::threadpool::Scope scope(pool);

scope.cancel();

const bool accepted = scope.spawn([](){
  perform_work();
});
```

`accepted` is `true` because the Scope is still open and the Future is accepted for tracking.

However, the scope cancellation token is already cancelled.

The result-producing ThreadPool path observes that state and skips the user callable.

Conceptually:

```text
scope.cancel()
     ↓
Scope still open
     ↓
spawn()
     ↓
Future tracked
     ↓
cancellation already requested
     ↓
callable not executed
     ↓
Future becomes cancelled
```

This distinction is important.

## What `spawn()` returning true means

`spawn()` returns `false` when the Scope itself cannot accept another tracked task.

In the current implementation, this means:

```text
Scope is closed
        or
no bound pool
```

A normally constructed `Scope` always begins with a valid pool pointer.

Therefore the ordinary failure case is a closed Scope.

```cpp
scope.close();

const bool accepted = scope.spawn([](){
  perform_work();
});
```

returns:

```text
false
```

## `spawn()` does not report ThreadPool acceptance

`spawn()` uses `ThreadPool::submit()` internally.

`submit()` always returns a `Future`, including when the ThreadPool rejects the actual task submission.

`Scope` stores that Future and returns `true` as long as the Scope itself was open.

For example:

```cpp
vix::threadpool::ThreadPool pool(1);
vix::threadpool::Scope scope(pool);

pool.shutdown();

const bool accepted = scope.spawn([](){
  return 42;
});
```

The current `Scope::spawn()` can return:

```text
true
```

because the rejected Future was successfully added to scope tracking.

That Future itself represents:

```text
status = rejected
result = rejected
error  = rejected
```

Therefore the boolean from `spawn()` means:

```text
accepted for Scope tracking
```

not:

```text
accepted by a worker queue
```

This distinction matters when the pool may already be stopped or otherwise reject submissions.

## `wait()` hides rejected scoped submissions

Because `wait()` catches every exception from `Future::get()`, a rejected scoped submission does not propagate from:

```cpp
scope.wait();
```

Use:

```cpp
scope.wait_and_rethrow();
```

when rejected, cancelled, failed, or otherwise exceptional asynchronous results must reach the caller.

A rejected Future causes `get()` to throw `std::system_error`, which `wait_and_rethrow()` can propagate after all tracked Futures have been processed.

## TaskOptions

`spawn()` accepts `TaskOptions`:

```cpp
vix::threadpool::TaskOptions options;

options.set_priority(
        vix::threadpool::TaskPriority::high
);

const bool accepted = scope.spawn([](){
  perform_work();
}, options);
```

Options such as priority, timeout, deadline, affinity, and other submission properties continue through the normal ThreadPool submission path.

The scope adds its own cancellation behavior.

## Scope cancellation replaces an existing task token

Before submission, `Scope::spawn()` calls:

```cpp
options.set_cancellation(
        scope.cancellation_token()
);
```

Therefore, if the caller already supplied another cancellation token:

```cpp
vix::threadpool::CancellationSource external;

vix::threadpool::TaskOptions options;
options.set_cancellation(external.token());

scope.spawn([](){
  perform_work();
}, options);
```

the external token is replaced by the Scope's cancellation token for that submission.

The effective cancellation relationship becomes:

```text
Scope CancellationSource
        ↓
spawned task
```

rather than:

```text
external CancellationSource
        ↓
spawned task
```

When scoped work needs additional cancellation conditions, combine that logic inside the callable instead of expecting `TaskOptions` to carry two cancellation tokens.

## Cooperative cancellation inside scoped work

The scope token can be captured when running work must react after execution begins:

```cpp
vix::threadpool::Scope scope(pool);

auto token = scope.cancellation_token();

scope.spawn([token](){
  while (has_more_work())
  {
    if (token.stop_requested())
    {
      return;
    }

    process_next_item();
  }
});
```

Later:

```cpp
scope.cancel();
```

makes the request visible inside the callable.

This is necessary when already running C++ code must stop before naturally completing.

The ThreadPool cannot forcibly interrupt the callable.

## Scope with several cancellable tasks

The same token can coordinate all spawned operations:

```cpp
vix::threadpool::Scope scope(pool);

auto token = scope.cancellation_token();

scope.spawn([token](){
  while (!token.stop_requested() && has_first_work())
  {
    process_first_item();
  }
});

scope.spawn([token](){
  while (!token.stop_requested() && has_second_work())
  {
    process_second_item();
  }
});

scope.cancel();
scope.wait();
```

Conceptually:

```text
             Scope
               │
       CancellationSource
               │
          shared state
          ┌────┴────┐
          ▼         ▼
       Task A     Task B
```

The cancellation relationship is shared, while each callable still chooses where it is safe to stop.

## Thread safety of Scope coordination

`Scope` protects:

```text
tracked Futures
closed state
```

with an internal mutex.

Operations such as:

```text
spawn()
close()
wait()
wait_and_rethrow()
empty()
size()
closed()
```

synchronize access to that scope state.

This allows multiple threads to coordinate around one `Scope` object.

## Concurrent `spawn()` and `wait()`

`wait()` closes the Scope while holding the same mutex used by `spawn()`.

Therefore concurrent operations are serialized.

Conceptually:

```text
spawn() and wait()
       ↓
compete for Scope mutex
       ↓
one proceeds first
```

If `spawn()` acquires the lock first:

```text
task becomes tracked
      ↓
wait() later includes it
```

If `wait()` acquires the lock first:

```text
Scope becomes closed
      ↓
tracked Futures are taken
      ↓
later spawn() returns false
```

This ensures no new tracked work can slip into the Scope after its wait boundary has been established.

## Concurrent `close()` and `spawn()`

The same rule applies to `close()`.

If closing happens first:

```text
closed = true
    ↓
later spawn() returns false
```

If spawning happens first:

```text
Future stored
    ↓
close() prevents later submissions
```

The already stored Future remains tracked.

## A Scope cannot be copied or moved

`Scope` disables both copying and moving:

```text
copy construction   disabled
copy assignment     disabled
move construction   disabled
move assignment     disabled
```

A scope represents one fixed structured lifetime bound to one pool and one tracking container.

Create it directly in the lifetime where the concurrent work belongs.

## Pool lifetime

`Scope` stores a non-owning pointer to the `ThreadPool` supplied during construction.

Conceptually:

```text
Scope ─────► ThreadPool
     non-owning
```

The normal lifetime arrangement is:

```cpp
vix::threadpool::ThreadPool pool(4);

{
  vix::threadpool::Scope scope(pool);

  scope.spawn([](){
    perform_work();
  });
}
```

The pool exists before the Scope and remains alive until after the Scope has finished waiting for its work.

This is the natural ownership order for scoped execution.

## Scope vs TaskHandle

`TaskHandle` controls one task:

```text
TaskHandle
├── TaskId
├── Future
└── CancellationSource
```

`Scope` coordinates several tasks:

```text
Scope
├── shared CancellationSource
└── multiple Future<void> objects
```

Use `TaskHandle` when one task needs identity and cancellation control.

Use `Scope` when several concurrent operations belong to one structured lifetime.

## Scope vs TaskGroup

`Scope` actively submits and tracks tasks:

```text
Scope
  ↓
spawn()
  ↓
ThreadPool::submit()
  ↓
Future<void>
  ↓
tracked automatically
```

`TaskGroup` is a lower-level coordination object for manually managed grouped work.

It does not itself provide the same `spawn()` ownership model.

Use `Scope` when the goal is:

```text
start related tasks
      +
guarantee waiting at scope boundary
```

See [Task Groups](/modules/threadpool/task-groups) for manual group coordination.

## Typical Scope workflow

A complete structured workflow is:

```cpp
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::atomic<int> completed{0};

  {
    vix::threadpool::Scope scope(pool);

    for (int i = 0; i < 8; ++i)
    {
      const bool accepted = scope.spawn([&completed](){
        completed.fetch_add(1, std::memory_order_relaxed);
      });

      if (!accepted)
      {
        return 1;
      }
    }

    scope.wait_and_rethrow();
  }

  return completed.load(std::memory_order_relaxed) == 8 ? 0 : 1;
}
```

The lifecycle is:

```text
create Scope
    ↓
spawn related work
    ↓
Futures tracked internally
    ↓
wait_and_rethrow()
    ↓
Scope closes
    ↓
wait for every tracked Future
    ↓
propagate first observed failure if any
    ↓
Scope remains closed and empty
```

## Scope model summary

The core model is:

```text
ThreadPool
    ▲
    │ submit
    │
 Scope
    │
    ├── Future<void>
    ├── Future<void>
    ├── Future<void>
    │
    └── CancellationSource
```

The important properties are:

- A `Scope` is bound to one existing `ThreadPool`.
- `Scope` does not own the pool.
- `spawn()` submits through `ThreadPool::submit()` and stores a `Future<void>`.
- Return values from spawned callables are discarded.
- Spawned callables must be invocable without arguments.
- `size()` counts tracked Futures, not currently active tasks.
- `wait()` closes the Scope, waits for all tracked Futures, and swallows failures.
- `wait_and_rethrow()` closes the Scope, waits for all tracked Futures, then rethrows the first exception encountered while consuming them.
- Both waiting operations leave the Scope closed and empty.
- The destructor calls `wait()` and therefore waits automatically.
- The destructor is `noexcept` and does not propagate task failures.
- `close()` prevents future spawning but does not wait or cancel.
- `cancel()` requests cooperative cancellation but does not close the Scope.
- All spawned tasks receive the Scope cancellation token.
- That token replaces any cancellation token already present in the supplied `TaskOptions`.
- Cancelling a Scope before `spawn()` does not prevent tracking, but the resulting task observes the already cancelled token.
- `spawn()` returning `true` means the Future was accepted for Scope tracking, not necessarily that the ThreadPool accepted the task for worker execution.
- `Scope` synchronizes its tracking state so `spawn()`, `close()`, and waiting establish a consistent boundary.
- `Scope` is neither copyable nor movable.
- The natural lifetime order is to create the pool before the Scope and destroy the Scope before the pool.

Continue with [Task Groups](/modules/threadpool/task-groups) for manual grouped-task coordination or [Synchronization](/modules/threadpool/synchronization) for barriers and latches.
