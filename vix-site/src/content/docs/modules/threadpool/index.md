# ThreadPool

`vix::threadpool` provides task execution and parallel work on a pool of C++ worker threads.

The main entry point is `ThreadPool`. Submit a callable when you need a result, post a callable when no result is required, and build higher-level concurrent work from the same task and executor model.

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

`submit()` schedules the callable for execution and returns a `Future` containing its result.

## What the module provides

The module is organized around a small set of concepts.

### Executors

An executor represents somewhere work can be submitted.

`ThreadPool` is the main concurrent executor. The module also provides executor types for integrations and cases where work should run inline.

### Tasks

A task is a unit of work submitted for execution.

`TaskOptions` can associate execution intent with that work, including priority, cancellation, deadlines, timeouts, and worker affinity.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
        vix::threadpool::TaskPriority::high
);

auto future =pool.submit([](){
  return 42;
},options);
```

These controls describe how a task should be handled. They do not forcibly interrupt arbitrary C++ code that is already running.

### Results

`submit()` connects task execution to a `Future`.

```cpp
auto future = pool.submit([](){
  return 21 * 2;
});

const int value = future.get();
```

`Future` and `Promise` provide the shared result model used by result-producing tasks.

### Structured work

`Scope` and related synchronization primitives help coordinate work that belongs to the same operation.

Higher-level facilities such as parallel algorithms are built on the same execution model instead of introducing a separate runtime.

## Fire-and-forget work

Use `post()` when the caller does not need a result from the task.

```cpp
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::atomic<int> counter{0};

  const bool accepted =pool.post([&counter](){
      counter.fetch_add(1, std::memory_order_relaxed);
  });

  if (!accepted)
  {
    return 1;
  }

  pool.wait_idle();

  return counter.load(std::memory_order_relaxed) == 1 ? 0 : 1;
}
```

`post()` returns whether the work was accepted. `wait_idle()` waits until the pool has no queued or active work.

## Parallel algorithms

Common data-parallel operations are available without requiring applications to implement task partitioning themselves.

The module provides:

- `parallel_for`
- `parallel_for_each`
- `parallel_map`
- `parallel_reduce`
- `parallel_pipeline`

These algorithms use the thread pool and its task execution facilities underneath. They are higher-level operations built from the same core model.

## Task execution controls

Tasks can carry execution options for cases where normal submission is not enough.

The public model includes:

- task priorities
- cooperative cancellation
- deadlines
- timeout observation
- worker affinity

A running C++ callable is not forcefully terminated by the thread pool. Code that depends on cancellation or timing constraints should understand the corresponding execution semantics before relying on them.

See [Cancellation](/modules/threadpool/cancellation), [Deadlines](/modules/threadpool/deadlines), and [Timeouts](/modules/threadpool/timeouts) for the detailed contracts.

## Pool lifecycle

A `ThreadPool` starts when it is constructed.

```cpp
vix::threadpool::ThreadPool pool(4);
```

Applications can wait for current work to finish:

```cpp
pool.wait_idle();
```

and can explicitly stop the pool:

```cpp
pool.shutdown();
```

The pool also shuts down during destruction.

Lifecycle behavior, queued work, and shutdown semantics are covered in [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## Observability

The pool exposes current metrics and cumulative statistics through:

```cpp
const auto metrics = pool.metrics();
const auto stats = pool.stats();
```

These APIs allow applications to inspect properties such as worker activity, queued work, completed tasks, failures, and rejected submissions.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics) for the exact fields and their meaning.

## Where to go next

Start with [Quick Start](/modules/threadpool/quick-start) to create a pool and execute your first tasks.

Read [Core Concepts](/modules/threadpool/core-concepts) for the task, executor, result, and structured-work model that the rest of the module builds on.

For deeper topics:

- [Architecture](/modules/threadpool/architecture)
- [Executors](/modules/threadpool/executors)
- [Tasks and Options](/modules/threadpool/tasks)
- [Scheduling Model](/modules/threadpool/scheduling)
- [Structured Work](/modules/threadpool/scopes)
- [Parallel Algorithms](/modules/threadpool/parallel-algorithms)
- [API Reference](/modules/threadpool/api-reference)
