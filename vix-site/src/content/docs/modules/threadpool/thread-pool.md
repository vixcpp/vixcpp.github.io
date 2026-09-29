# Thread Pool

`ThreadPool` is the main public execution type in `vix::threadpool`.

It owns the worker runtime, accepts tasks, returns asynchronous results, exposes task handles, and provides lifecycle and observability operations.

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

The pool starts automatically when it is constructed.

## Create a pool

The simplest form uses the default worker count:

```cpp
vix::threadpool::ThreadPool pool;
```

You can provide an explicit worker count:

```cpp
vix::threadpool::ThreadPool pool(4);
```

or a complete configuration:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 256;

vix::threadpool::ThreadPool pool(config);
```

The configuration is normalized before the runtime is created.

See [Configuration](/modules/threadpool/configuration) for the fields that currently affect the pool.

## Automatic startup

Construction starts the pool immediately:

```cpp
vix::threadpool::ThreadPool pool(4);

if (!pool.running())
{
  return 1;
}
```

Applications normally do not need to call `start()` themselves.

`start()` returns `true` only when the pool transitions from the stopped state to the running state:

```cpp
const bool started = pool.start();
```

Calling `start()` while the pool is already running returns `false`.

For ordinary application code, construction is the normal startup path.

## Submit fire-and-forget work

Use `post()` when the caller does not need a result.

```cpp
vix::threadpool::ThreadPool pool(4);

const bool accepted = pool.post([](){
  // Background work.
});
```

`post()` returns whether the task was accepted by the execution runtime.

A false result means the work was not accepted.

Typical reasons include:

```text
invalid callable
pool no longer accepting ordinary work
selected worker cannot accept the task
bounded worker queue is full
```

When later code depends on the posted work, synchronize explicitly:

```cpp
vix::threadpool::ThreadPool pool(4);

const bool accepted = pool.post([](){
  // Background work.
});

if (!accepted)
{
  return 1;
}

pool.wait_idle();
```

`post()` is intended for work whose result does not need to be returned to the caller.

## Submit work with a result

Use `submit()` when the callable produces a result.

```cpp
vix::threadpool::ThreadPool pool(4);

auto future = pool.submit([](){
  return 21 * 2;
});

const int result = future.get();
```

The return type is determined from the callable.

For example:

```cpp
auto integer = pool.submit([](){
  return 42;
});

auto text = pool.submit([](){
  return std::string{"Vix.cpp"};
});
```

Each submission receives its own asynchronous result.

The callable itself executes on a worker thread when the task reaches execution.

## Submit void work with a Future

`submit()` also supports callables that return `void`.

```cpp
vix::threadpool::ThreadPool pool(4);

auto future = pool.submit([](){
  // Work with no return value.
});

future.get();
```

In this case, the `Future<void>` represents completion rather than a value.

This is useful when the caller needs to know whether the operation completed or failed even though the callable does not return data.

If no completion result is needed, `post()` is simpler.

## Passing task options

`post()`, `submit()`, and `handle()` accept `TaskOptions`.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Task options can describe:

```text
priority
cancellation
deadline
timeout
worker affinity
after-stop submission
```

Pool configuration describes the runtime. `TaskOptions` describes one unit of submitted work.

See [Tasks and Options](/modules/threadpool/tasks).

## Submit move-only work

Submitted callables can own move-only state.

```cpp
#include <memory>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto value = std::make_unique<int>(42);

  auto future = pool.submit([value = std::move(value)](){
    return *value;
  });

  return future.get() == 42 ? 0 : 1;
}
```

The callable is moved into the task representation and later executed by the selected worker.

This allows tasks to own resources directly instead of requiring all captured state to be copyable.

## Exceptions from submit()

Exceptions thrown by a callable submitted with `submit()` are captured into the corresponding asynchronous result.

```cpp
vix::threadpool::ThreadPool pool(4);

auto future = pool.submit([]() -> int {
  throw std::runtime_error("failure");
});
```

The exception does not escape the worker thread.

It becomes observable when the caller interacts with the `Future`.

```cpp
try
{
  future.get();
}
catch (const std::runtime_error&)
{
  // Handle failure.
}
```

See [Futures and Promises](/modules/threadpool/futures-and-promises) and [Errors](/modules/threadpool/errors).

## Task handles

Use `handle()` when the caller needs both the asynchronous result and task-level control.

```cpp
vix::threadpool::ThreadPool pool(4);

auto handle = pool.handle([](){
  return 42;
});

const auto id = handle.id();
const int result = handle.get();
```

A `TaskHandle` contains:

```text
TaskId
Future
CancellationSource
```

It can request cancellation:

```cpp
handle.cancel();
```

Cancellation is cooperative and does not forcibly interrupt arbitrary C++ code already running on a worker.

See [Task Handles](/modules/threadpool/task-handles).

## Task identifiers

Each ordinary submission receives a task identifier generated by the pool.

When using `handle()`, the identifier is available directly:

```cpp
auto handle = pool.handle([](){
  return 42;
});

const auto id = handle.id();
```

The pool also exposes:

```cpp
const auto id = pool.next_task_id();
```

This reserves the next task identifier without submitting work.

It is mainly useful when a higher-level system needs to know the identifier before constructing the callable that will be submitted.

## Submit with a reserved task ID

A pre-reserved identifier can be used with `handle_with_id()`:

```cpp
vix::threadpool::ThreadPool pool(4);

const auto id = pool.next_task_id();

auto handle = pool.handle_with_id(id, [id](){
  return id;
});
```

The returned handle uses the identifier supplied by the caller.

This is useful for systems that need to establish task identity before submission, for example when external state is keyed by the task ID.

Most application code can use `handle()` directly.

## Submission path

A normal `submit()` follows this conceptual path:

```text
callable
   ↓
ThreadPool::submit()
   ↓
Task
   ↓
Scheduler
   ↓
selected worker
   ↓
worker queue
   ↓
worker thread
   ↓
callable execution
   ↓
Future result
```

`ThreadPool` is the public facade over this runtime.

Applications do not need to interact directly with the scheduler or workers for normal task execution.

See [Architecture](/modules/threadpool/architecture) and [Execution Model](/modules/threadpool/execution-model).

## Worker count

The current number of workers is available through:

```cpp
const std::size_t workers = pool.thread_count();
```

For example:

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::cout << "workers: " << pool.thread_count() << '\n';

  return 0;
}
```

For a fixed explicit configuration:

```text
workers: 4
```

The current runtime creates a fixed worker set from the normalized `thread_count`.

## Pending work

`pending()` returns the total number of tasks currently queued across all workers.

```cpp
const std::size_t queued = pool.pending();
```

It does not include tasks that have already been removed from their queues and are currently executing.

Conceptually:

```text
pending()
    ↓
Queue 1 size
+
Queue 2 size
+
...
+
Queue N size
```

Because tasks can begin execution concurrently, the value is a runtime snapshot and may change immediately after it is read.

## Check whether the pool is running

Use:

```cpp
const bool running = pool.running();
```

`running()` reports whether the pool is currently in its running state and its scheduler is running.

A newly constructed pool normally reports:

```text
true
```

After shutdown completes:

```cpp
pool.shutdown();

const bool running = pool.running();
```

the result is `false`.

`running()` describes lifecycle state. It does not mean that tasks are currently executing.

## Check whether the pool is idle

Use:

```cpp
const bool idle = pool.idle();
```

The pool is idle when it has no pending work and no active worker execution.

Conceptually:

```text
pending tasks == 0
        +
active tasks == 0
        ↓
      idle
```

A pool can therefore be:

```text
running and idle
```

at the same time.

For example, immediately after all current work has completed, the worker threads remain alive and ready for new submissions.

## Wait until the pool is idle

Use `wait_idle()` when the caller needs all currently queued and active work to finish.

```cpp
vix::threadpool::ThreadPool pool(4);

pool.post([](){
  // First task.
});

pool.post([](){
  // Second task.
});

pool.wait_idle();
```

After `wait_idle()` returns, the pool has no pending or active work at the observed idle boundary.

The pool remains running and can accept more work:

```cpp
pool.wait_idle();

auto future = pool.submit([](){
  return 42;
});
```

`wait_idle()` does not shut down the worker threads.

## Waiting and shutting down are different

These operations solve different problems.

```cpp
pool.wait_idle();
```

means:

```text
wait until current work is finished
keep the pool running
allow future submissions
```

while:

```cpp
pool.shutdown();
```

means:

```text
request runtime shutdown
stop accepting ordinary work
stop and join worker threads
```

Do not use shutdown when the goal is only to establish a synchronization point.

## Shutdown

Shutdown can be requested explicitly:

```cpp
pool.shutdown();
```

The operation is idempotent.

Calling it more than once is safe:

```cpp
pool.shutdown();
pool.shutdown();
```

The destructor also calls `shutdown()` automatically.

For simple scoped usage:

```cpp
int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

an explicit final shutdown call is not required.

## Shutdown and queued work

The treatment of queued work depends on `drain_on_shutdown`.

With the default configuration:

```cpp
config.drain_on_shutdown = true;
```

workers process queued work before stopping.

With:

```cpp
config.drain_on_shutdown = false;
```

queued work does not have the same draining guarantee.

Shutdown does not forcibly kill a worker thread while arbitrary C++ code is already executing.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) for the full contract.

## Submissions after shutdown

Ordinary work is accepted only while the pool is running.

For example:

```cpp
vix::threadpool::ThreadPool pool(4);

pool.shutdown();

const bool accepted = pool.post([](){
  // Ordinary submission.
});
```

`accepted` is `false`.

For `submit()` and `handle()`, rejected submission is represented through their asynchronous result rather than by returning a separate boolean.

Task options also contain an advanced `allow_after_stop` control used during the shutdown window.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) before relying on after-stop submission.

## Clear queued tasks

`clear()` removes tasks that are still queued and have not started execution.

```cpp
const std::size_t removed = pool.clear();
```

Running tasks are not interrupted.

Conceptually:

```text
queued tasks
    ↓
 clear()
    ↓
removed

active tasks
    ↓
continue running
```

The returned value is the number of tasks removed from worker queues.

`clear()` should not be treated as a general replacement for task cancellation. For result-producing work, use the cancellation model when the caller needs an observable cancellation lifecycle.

See [Cancellation](/modules/threadpool/cancellation).

## Periodic tasks

`ThreadPool` can create a `PeriodicTask` bound to itself:

```cpp
auto periodic = pool.schedule_every([](){
  // Periodic work.
});
```

Creating the object does not start periodic execution automatically.

The returned `PeriodicTask` owns the scheduling lifecycle while individual callbacks are dispatched through the pool.

Periodic work is covered separately in [Periodic Tasks](/modules/threadpool/periodic-tasks).

## Metrics

`metrics()` returns a current snapshot of pool activity.

```cpp
const auto metrics = pool.metrics();
```

It includes runtime values such as worker activity and task counts.

For example:

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  future.get();
  pool.wait_idle();

  const auto metrics = pool.metrics();

  std::cout << "workers: " << metrics.worker_count << '\n';
  std::cout << "pending: " << metrics.pending_tasks << '\n';
  std::cout << "active: " << metrics.active_tasks << '\n';

  return 0;
}
```

Metrics are snapshots. They can change while the pool continues running.

## Statistics

`stats()` returns cumulative execution statistics:

```cpp
const auto stats = pool.stats();
```

Statistics summarize task outcomes accumulated by the runtime.

Use metrics when you need the current state of the pool.

Use statistics when you need accumulated execution information.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Read the configuration

The normalized configuration stored by the pool is available through:

```cpp
const auto& config = pool.config();
```

For example:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 256;

vix::threadpool::ThreadPool pool(config);

const auto& effective = pool.config();
```

The returned reference remains owned by the pool.

See [Configuration](/modules/threadpool/configuration) for which configuration fields currently affect execution.

## ThreadPool is not copyable or movable

A `ThreadPool` owns a scheduler and worker threads.

Copy and move operations are disabled:

```text
copy construction     disabled
copy assignment       disabled
move construction     disabled
move assignment       disabled
```

Create the pool in the location that owns its runtime lifetime.

When another component only needs access to execution, pass a reference or use the executor abstractions described in [Executors](/modules/threadpool/executors).

## ThreadPool as an Executor

`ThreadPool` implements `Executor`.

This means it can be passed to code that only needs fire-and-forget execution:

```cpp
void dispatch(vix::threadpool::Executor& executor)
{
  executor.post([](){
    // Work to execute.
  });
}

int main()
{
  vix::threadpool::ThreadPool pool(4);

  dispatch(pool);
  pool.wait_idle();

  return 0;
}
```

Using the base interface does not create another pool.

The same underlying workers execute the posted work.

## Choosing the submission API

The three main submission forms serve different needs.

### Use `post()`

When the caller only needs to know whether the work was accepted:

```cpp
const bool accepted = pool.post([](){
  // Work.
});
```

### Use `submit()`

When the caller needs the eventual result:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

### Use `handle()`

When the caller needs the result together with task identity and cancellation control:

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

The choice can be summarized as:

```text
Need result?
   │
   ├── no  → post()
   │
   └── yes
        │
        ├── result only            → submit()
        │
        └── result + task control  → handle()
```

These operations use the same underlying pool runtime.

## Typical lifecycle

A common `ThreadPool` workflow is:

```cpp
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

  pool.wait_idle();

  return result == 42 ? 0 : 1;
}
```

Conceptually:

```text
construct pool
     ↓
workers start
     ↓
submit work
     ↓
workers execute tasks
     ↓
consume results
     ↓
wait if required
     ↓
pool leaves scope
     ↓
shutdown and join
```

For most applications, this is the complete lifecycle needed to begin using the module.

Continue with [Execution Model](/modules/threadpool/execution-model) for the detailed path a task follows from submission to completion.
