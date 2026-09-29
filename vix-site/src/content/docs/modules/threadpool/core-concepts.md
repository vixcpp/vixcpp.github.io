# Core Concepts

The ThreadPool module is built around a small set of concepts that compose into higher-level concurrency features.

The normal flow is:

```text
work
  ↓
ThreadPool
  ↓
task execution
  ↓
Future or TaskHandle
```

Features such as priorities, cancellation, deadlines, scopes, periodic tasks, and parallel algorithms build on this same execution model.

## Executor

An `Executor` represents a place where work can be submitted for execution.

Its core operation is `post()`:

```cpp
bool accepted = executor.post([](){
  // Work to execute.
});
```

`Executor` is intentionally focused on fire-and-forget work. It also exposes the common lifecycle and observability operations used by executor implementations:

```text
post()
shutdown()
wait_idle()
running()
idle()
metrics()
stats()
```

Code that only needs to dispatch callbacks can depend on `Executor` without depending directly on a concrete thread pool.

`ThreadPool` is an implementation of this executor interface.

See [Executors](/modules/threadpool/executors) for the complete executor model.

## ThreadPool

`ThreadPool` is the main public entry point for concurrent task execution.

Creating a pool also starts it:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

The pool owns the worker threads used to execute submitted work.

The most important submission operations are:

```text
post()
submit()
handle()
```

They all submit work, but they expose different levels of control.

### `post()`

Use `post()` for work that does not produce a result for the caller.

```cpp
const bool accepted = pool.post([](){
  // Background work.
});
```

The return value tells the caller whether the work was accepted.

### `submit()`

Use `submit()` when the caller needs the result of the computation.

```cpp
auto future = pool.submit([](){
  return 42;
});
```

The returned `Future` represents the eventual result.

### `handle()`

Use `handle()` when the caller needs a result together with task identity and cancellation control.

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

A `TaskHandle` combines the task identifier, its `Future`, and a cancellation source.

The differences between these operations are covered in [Thread Pool](/modules/threadpool/thread-pool).

## Tasks

A task is one unit of work executed by the pool.

Most applications do not construct `Task` objects directly. They provide C++ callables to `post()`, `submit()`, `handle()`, or one of the higher-level APIs.

For example:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

The callable is the work the application wants to perform. The thread pool associates that work with the information required to schedule and track its execution.

Tasks can own move-only state, which allows submitted work to contain resources such as unique pointers and other non-copyable values.

## Task options

`TaskOptions` describes execution properties associated with a task.

The default options represent ordinary work:

```cpp
vix::threadpool::TaskOptions options;
```

Options can describe:

```text
priority
timeout
deadline
cancellation
worker affinity
```

For example, priority can be attached to a submission:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

`TaskOptions` describes how the task should be handled. It does not turn arbitrary C++ code into code that can be forcibly interrupted.

Cancellation and timing controls therefore have specific execution semantics that should be understood before they are used for correctness.

See [Tasks and Options](/modules/threadpool/tasks), [Cancellation](/modules/threadpool/cancellation), [Deadlines](/modules/threadpool/deadlines), and [Timeouts](/modules/threadpool/timeouts).

## Future and Promise

A result-producing task needs a way to connect the code producing a value with the code waiting for that value.

The module uses `Promise` and `Future` for this relationship:

```text
Promise<T>
    │
    │ shared state
    ▼
Future<T>
```

A `Promise` is the producer side of an asynchronous result.

A `Future` is the consumer side.

When using `ThreadPool::submit()`, this relationship is created automatically:

```cpp
auto future = pool.submit([](){
  return 21 * 2;
});

const int result = future.get();
```

The application normally interacts only with the returned `Future`.

A `Future` can be used to:

```text
check whether a result is ready
wait for completion
wait for a limited duration
retrieve the result
inspect task status
inspect task result information
inspect thread pool errors
```

`Future` is move-only, and `get()` consumes its result.

`Promise` is useful when lower-level or custom asynchronous code needs to publish a value, exception, or thread pool error explicitly.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## TaskHandle

A `Future` answers the question:

> What result will this task produce?

A `TaskHandle` adds task-level control:

```text
TaskHandle<T>
├── TaskId
├── Future<T>
└── CancellationSource
```

For example:

```cpp
auto handle = pool.handle([](){
  return 42;
});

const auto id = handle.id();
const int result = handle.get();
```

The handle can also request cancellation:

```cpp
handle.cancel();
```

Cancellation is cooperative. Requesting cancellation does not forcibly terminate arbitrary C++ instructions that are already executing.

Use a `Future` when the result is sufficient. Use a `TaskHandle` when the calling code also needs task identity or cancellation control.

See [Task Handles](/modules/threadpool/task-handles).

## Structured work

Concurrent work often belongs to a larger operation.

For example, a function may start several tasks and must ensure that all of them have finished before the function completes.

`Scope` provides this relationship.

```cpp
vix::threadpool::Scope scope(pool);

scope.spawn([](){
  // First operation.
});

scope.spawn([](){
  // Second operation.
});

scope.wait();
```

A scope tracks the work spawned through it and provides a common lifetime boundary.

Its main operations are:

```text
spawn()
wait()
wait_and_rethrow()
cancel()
close()
```

A scope waits for its tracked work during destruction. `wait_and_rethrow()` can be used when task exceptions must be observed by the caller.

This gives related concurrent operations an explicit lifetime instead of leaving each task independent.

See [Scopes](/modules/threadpool/scopes).

## Scheduling properties are attached to work

Priority, affinity, deadlines, and similar controls do not represent separate execution systems.

They modify how work submitted to the same pool is handled.

Conceptually:

```text
callable
   +
TaskOptions
   ↓
task
   ↓
ThreadPool
```

This distinction is important because a priority does not create a different pool, and a deadline does not create a different task type.

The same task model is used with different execution properties.

## Higher-level operations build on the same model

The module also provides operations such as:

```text
parallel_for
parallel_for_each
parallel_map
parallel_reduce
parallel_pipeline
periodic tasks
```

These are higher-level ways of creating and coordinating work.

They do not require a second concurrency runtime. They build on the same thread pool and task execution model used by ordinary submissions.

For example, conceptually:

```text
parallel operation
      ↓
divide the work
      ↓
submit tasks
      ↓
execute on the ThreadPool
      ↓
collect or wait for results
```

This allows applications to move from a single submitted task to larger parallel operations without changing the underlying execution model.

See [Parallel Algorithms](/modules/threadpool/parallel-algorithms) and [Periodic Tasks](/modules/threadpool/periodic-tasks).

## The model in one view

The main concepts fit together as follows:

```text
                         TaskOptions
                             │
                             ▼
callable ────────────────► task
                             │
                             ▼
                         ThreadPool
                             │
              ┌──────────────┼──────────────┐
              │              │              │
            post()         submit()       handle()
              │              │              │
              ▼              ▼              ▼
         acceptance       Future<T>    TaskHandle<T>


ThreadPool + related tasks
            │
            ▼
          Scope


ThreadPool + work partitioning
            │
            ▼
     Parallel Algorithms
```

The rest of the module extends these relationships rather than introducing a different execution model for every feature.

Continue with [Architecture](/modules/threadpool/architecture) to see how these public concepts map onto the runtime, or [Configuration](/modules/threadpool/configuration) to configure a pool.
