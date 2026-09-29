# Executors

An executor is the common interface used to submit fire-and-forget work.

The ThreadPool module provides three executor forms:

```text
Executor
├── ThreadPool
├── InlineExecutor
└── ThreadPoolExecutor
```

`ThreadPool` and `InlineExecutor` implement `Executor` directly. `ThreadPoolExecutor` is a non-owning adapter around an existing `ThreadPool`.

The executor abstraction is useful when code needs somewhere to run a callback without depending on the concrete execution mechanism.

## The Executor interface

`Executor` defines the common operations available to executor implementations.

Its main operation is `post()`:

```cpp
bool accepted = executor.post([](){
  // Work to execute.
});
```

The complete interface covers:

```text
post()
shutdown()
wait_idle()
running()
idle()
metrics()
stats()
```

`Executor` is intentionally limited to fire-and-forget work.

It does not expose templated operations such as `submit()`, because templated member functions cannot be virtual in C++.

Result-producing operations therefore remain on concrete types such as `ThreadPool`.

## Use an Executor reference

A `ThreadPool` can be used directly through the `Executor` interface.

```cpp
#include <vix/threadpool/all.hpp>

void run(vix::threadpool::Executor& executor)
{
  const bool accepted = executor.post([](){
    // Work to execute.
  });

  if (!accepted)
  {
    return;
  }

  executor.wait_idle();
}

int main()
{
  vix::threadpool::ThreadPool pool(4);

  run(pool);

  return 0;
}
```

The function does not need to know whether the executor uses worker threads or another execution strategy.

This is useful for components that only need to dispatch callbacks.

## ThreadPool as an executor

`ThreadPool` derives directly from `Executor`.

```cpp
vix::threadpool::ThreadPool pool(4);

vix::threadpool::Executor& executor = pool;

const bool accepted = executor.post([](){
  // Runs on the thread pool.
});
```

Work posted through the `Executor` reference follows the same scheduling path as work posted directly through `ThreadPool`.

Conceptually:

```text
Executor::post()
      ↓
ThreadPool
      ↓
Scheduler
      ↓
Worker
      ↓
Task
```

The abstraction changes the interface visible to the caller. It does not create another runtime.

## Executor and submit()

Code using only an `Executor&` cannot call `submit()`:

```cpp
vix::threadpool::Executor& executor = pool;
```

The interface exposes `post()`, but not:

```text
submit()
handle()
schedule_every()
```

Use the concrete `ThreadPool` when the caller needs a result:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

Use `Executor` when fire-and-forget submission is sufficient.

This distinction keeps the common interface small while allowing `ThreadPool` to provide richer templated APIs.

## InlineExecutor

`InlineExecutor` executes work immediately on the thread that calls `post()`.

It creates no worker threads and maintains no task queue.

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::InlineExecutor executor;

  int value = 0;

  const bool accepted = executor.post([&value](){
    value = 42;
  });

  if (!accepted)
  {
    return 1;
  }

  return value == 42 ? 0 : 1;
}
```

When `post()` returns, the callable has already finished.

The execution path is:

```text
caller thread
     ↓
post()
     ↓
callable executes
     ↓
post() returns
```

There is no scheduling step through worker threads.

## Inline execution is synchronous

Consider:

```cpp
int value = 0;

executor.post([&value](){
  value = 42;
});

const int result = value;
```

With `InlineExecutor`, `result` is `42` because the task completes inside `post()`.

The same assumption should not be made for a normal `ThreadPool`:

```cpp
vix::threadpool::ThreadPool pool(4);

int value = 0;

pool.post([&value](){
  value = 42;
});
```

The task is scheduled for asynchronous execution. Code that depends on its completion must synchronize appropriately.

For example:

```cpp
pool.wait_idle();
```

The difference is fundamental:

```text
InlineExecutor
post()
  ↓
execute now
  ↓
return


ThreadPool
post()
  ↓
queue work
  ↓
return
  ↓
worker executes
```

## InlineExecutor lifecycle

`InlineExecutor` starts in the running state:

```cpp
vix::threadpool::InlineExecutor executor;

const bool running = executor.running();
```

Calling:

```cpp
executor.shutdown();
```

marks it as stopped.

Ordinary work is rejected after shutdown:

```cpp
executor.shutdown();

const bool accepted = executor.post([](){
  // Not executed.
});
```

`accepted` is `false`.

Shutdown is idempotent.

## Work allowed after shutdown

`TaskOptions::allow_after_stop` can permit an inline task to execute even after the executor has been stopped.

```cpp
vix::threadpool::InlineExecutor executor;

executor.shutdown();

vix::threadpool::TaskOptions options;
options.set_allow_after_stop(true);

const bool accepted = executor.post([](){
  // Executes inline.
}, options);
```

This is an explicit exception to the normal stopped-state behavior.

The same option participates in the submission rules of the thread pool.

Lifecycle behavior is covered in [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## InlineExecutor and task options

`InlineExecutor` does not ignore `TaskOptions`.

Before running the callable, it checks cancellation and deadline state.

After execution, it observes:

```text
timeout
deadline
cancellation
```

For example, an already cancelled task is handled without invoking the callable.

```cpp
vix::threadpool::CancellationSource source;
source.cancel();

vix::threadpool::TaskOptions options;
options.set_cancellation(source.token());

const bool accepted = executor.post([](){
  // Not executed.
}, options);
```

The operation is considered handled, so `post()` returns `true`, while the cancellation is recorded in executor metrics.

Cancellation and timing behavior are explained in their dedicated pages.

## Exceptions with InlineExecutor

Exceptions thrown by a posted callback do not escape `post()`.

```cpp
const bool accepted = executor.post([](){
  throw std::runtime_error("failure");
});
```

The exception is caught by `InlineExecutor`, the task is recorded as failed, and `post()` returns `false`.

This differs from result-producing `ThreadPool::submit()`, where task failures are associated with the corresponding asynchronous result.

See [Errors](/modules/threadpool/errors) and [Futures and Promises](/modules/threadpool/futures-and-promises).

## InlineExecutor idle state

`InlineExecutor` has no queue and no worker threads.

Its `idle()` function therefore always returns `true`:

```cpp
const bool idle = executor.idle();
```

`wait_idle()` is a no-op because there can be no queued work remaining after `post()` returns.

Its metrics report zero workers:

```cpp
const auto metrics = executor.metrics();
```

while still tracking task outcomes such as submitted, completed, failed, cancelled, timed out, and rejected work.

## ThreadPoolExecutor

`ThreadPoolExecutor` is a non-owning adapter around an existing `ThreadPool`.

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::ThreadPoolExecutor executor(pool);

const bool accepted = executor.post([](){
  // Runs on the referenced pool.
});
```

The adapter forwards executor operations to the referenced pool:

```text
ThreadPoolExecutor::post()
        ↓
ThreadPool::post()

ThreadPoolExecutor::wait_idle()
        ↓
ThreadPool::wait_idle()

ThreadPoolExecutor::shutdown()
        ↓
ThreadPool::shutdown()
```

It also forwards `running()`, `idle()`, `metrics()`, and `stats()`.

## ThreadPoolExecutor does not own the pool

The adapter stores a reference to an existing pool.

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::ThreadPoolExecutor executor(pool);
```

The pool must remain alive while the adapter refers to it.

Destroying the adapter does not destroy the pool.

Calling:

```cpp
executor.shutdown();
```

does forward shutdown to the referenced pool.

This distinction is important:

```text
lifetime ownership
ThreadPoolExecutor ──X──► ThreadPool

operation forwarding
ThreadPoolExecutor ─────► ThreadPool
```

## Binding and unbinding ThreadPoolExecutor

A `ThreadPoolExecutor` can be created without a pool:

```cpp
vix::threadpool::ThreadPoolExecutor executor;
```

In this state:

```cpp
executor.valid() == false
executor.running() == false
executor.idle() == true
```

and:

```cpp
executor.post([](){
  // Not executed.
});
```

returns `false`.

The adapter can later be bound to a pool:

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::ThreadPoolExecutor executor;

executor.reset(pool);
```

and unbound again:

```cpp
executor.reset();
```

This makes `ThreadPoolExecutor` useful when an executor adapter needs to exist independently of when its backing pool is selected.

A direct `Executor&` is simpler when rebinding or an empty state is not needed.

## ExecutorRef

`ExecutorRef` is a lightweight non-owning reference to any `Executor`.

```cpp
vix::threadpool::InlineExecutor executor;
vix::threadpool::ExecutorRef ref(executor);

const bool accepted = ref.post([](){
  // Executes through the referenced executor.
});
```

It can reference:

```text
ThreadPool
InlineExecutor
ThreadPoolExecutor
another Executor implementation
```

without taking ownership.

`ExecutorRef` is useful when an object needs to store an executor reference instead of receiving one only for a single function call.

## Empty ExecutorRef

An `ExecutorRef` can be empty:

```cpp
vix::threadpool::ExecutorRef ref;
```

An empty reference behaves safely for its forwarding operations:

```text
valid()     → false
running()   → false
idle()      → true
post()      → false
metrics()   → empty snapshot
stats()     → empty snapshot
```

For example:

```cpp
vix::threadpool::ExecutorRef ref;

const bool accepted = ref.post([](){
  // Not executed.
});
```

`accepted` is `false`.

## ExecutorRef does not own the executor

Like `ThreadPoolExecutor`, `ExecutorRef` is non-owning.

```cpp
vix::threadpool::InlineExecutor executor;
vix::threadpool::ExecutorRef ref(executor);
```

The referenced executor must outlive the reference.

Conceptually:

```text
ExecutorRef
    │
    └────► Executor
           non-owning
```

`ExecutorRef` does not allocate an executor and does not extend its lifetime.

## Why the abstraction matters

Some higher-level facilities only need the ability to post work.

`PeriodicTask`, for example, accepts an `Executor` rather than requiring a `ThreadPool`.

This allows the same higher-level component to submit callbacks to different execution strategies:

```text
                ┌──► ThreadPool
PeriodicTask ───┤
                └──► InlineExecutor
```

The higher-level feature depends on the capability it needs, not on the complete thread pool API.

This is the main role of `Executor`.

## Executor capabilities

There are two useful levels of executor capability in the module.

A basic executor can post work:

```text
post()
```

A richer concrete executor such as `ThreadPool` can also produce asynchronous results:

```text
post()
submit()
handle()
```

The module exposes compile-time traits in `ExecutorTraits.hpp` for detecting executor-like capabilities.

Examples include:

```cpp
vix::threadpool::has_post_v<ExecutorType, Function>
vix::threadpool::has_submit_v<ExecutorType, Function>
vix::threadpool::has_submit_with_options_v<ExecutorType, Function>
vix::threadpool::has_shutdown_v<ExecutorType>
vix::threadpool::has_wait_idle_v<ExecutorType>
```

It also provides:

```cpp
vix::threadpool::is_basic_executor_v<ExecutorType, Function>
vix::threadpool::is_future_executor_v<ExecutorType, Function>
```

These traits are primarily useful for generic C++ code that accepts executor-like types.

Ordinary application code does not need them simply to use `ThreadPool`.

## Choosing an executor

Use `ThreadPool` for normal concurrent execution:

```cpp
vix::threadpool::ThreadPool pool(4);
```

Use `Executor&` when a component only needs fire-and-forget execution and should not depend on the concrete implementation:

```cpp
void dispatch(vix::threadpool::Executor& executor);
```

Use `InlineExecutor` when execution should happen immediately on the caller thread:

```cpp
vix::threadpool::InlineExecutor executor;
```

Use `ExecutorRef` when a non-owning executor reference needs to be stored:

```cpp
vix::threadpool::ExecutorRef ref(executor);
```

Use `ThreadPoolExecutor` when a concrete, non-owning adapter to a `ThreadPool` needs an empty or rebindable state:

```cpp
vix::threadpool::ThreadPoolExecutor executor;
executor.reset(pool);
```

The executor abstraction is deliberately small. It provides the common capability required to dispatch work while leaving result-producing and thread-pool-specific operations on the concrete execution types.

Continue with [Thread Pool](/modules/threadpool/thread-pool) for the concrete pool API or [Execution Model](/modules/threadpool/execution-model) for the lifecycle of work after submission.
