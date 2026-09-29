# Quick Start

This page covers the basic `vix::threadpool` workflow: create a pool, submit work, retrieve results, and wait for fire-and-forget tasks.

Use the module umbrella header:

```cpp
#include <vix/threadpool/all.hpp>
```

## Submit work and get a result

Create a `ThreadPool`, submit a callable, and retrieve its result from the returned `Future`.

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future =pool.submit([](){
      return 21 * 2;
  });

  std::cout << "result: " << future.get() << '\n';

  return 0;
}
```

Output:

```text
result: 42
```

`ThreadPool pool(4)` creates a pool with four worker threads and starts it immediately.

`submit()` schedules the callable for execution and returns a `Future` for its result. `future.get()` waits until the result is ready and then returns it.

## Run work without a result

Use `post()` when the caller does not need a result from the task.

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  const bool accepted = pool.post([](){
    std::cout << "background task\n";
  });

  if (!accepted)
  {
    return 1;
  }

  pool.wait_idle();

  return 0;
}
```

Output:

```text
background task
```

`post()` returns `true` when the task is accepted. Because there is no `Future` to wait on, this example calls `wait_idle()` before leaving the workflow that depends on the posted work.

`wait_idle()` returns when the pool has no queued or active work.

## Use the default worker count

You do not have to choose a worker count explicitly.

```cpp
vix::threadpool::ThreadPool pool;
```

The default configuration uses `std::thread::hardware_concurrency()` when available and falls back to one worker when the value cannot be determined.

Use an explicit count when the application has a reason to control the number of workers:

```cpp
vix::threadpool::ThreadPool pool(4);
```

For more control over pool creation, see [Configuration](/modules/threadpool/configuration).

## Submit multiple tasks

Each call to `submit()` returns its own `Future`.

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto first = pool.submit([](){
      return 20;
  });

  auto second = pool.submit([](){
    return 22;
  });

  const int result = first.get() + second.get();

  std::cout << "result: " << result << '\n';

  return 0;
}
```

Output:

```text
result: 42
```

The tasks may execute concurrently when workers are available. Their `Future` objects let the caller wait for and retrieve each result independently.

## Configure a task

Task-specific behavior is passed through `TaskOptions`.

For example, a task can be submitted with a priority:

```cpp
vix::threadpool::TaskOptions options;
options.set_priority(vix::threadpool::TaskPriority::high);

auto future = pool.submit([](){
    return 42;
}, options);
```

Priority affects scheduling of queued work. It does not guarantee a global execution order across all workers.

`TaskOptions` also provides controls for cancellation, deadlines, timeouts, and worker affinity. These behaviors have specific execution semantics and are covered in their dedicated pages.

See [Tasks and Options](/modules/threadpool/tasks) and [Scheduling Model](/modules/threadpool/scheduling).

## Pool lifetime

A `ThreadPool` owns its worker threads and shuts down when the pool is destroyed, so an explicit shutdown is not required at the end of a simple scope.

You can stop it earlier when the application lifecycle requires it:

```cpp
pool.shutdown();
```

After shutdown, ordinary task submissions are no longer accepted.

Shutdown behavior and queued work are covered in [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## Next steps

Read [Core Concepts](/modules/threadpool/core-concepts) to understand the small set of abstractions used throughout the module.

Then continue with:

- [Executors](/modules/threadpool/executors)
- [Tasks and Options](/modules/threadpool/tasks)
- [Futures and Promises](/modules/threadpool/futures-and-promises)
- [Scheduling Model](/modules/threadpool/scheduling)
- [Parallel Algorithms](/modules/threadpool/parallel-algorithms)
