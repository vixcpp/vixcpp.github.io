# Configuration

`ThreadPoolConfig` controls the pool settings that apply when a `ThreadPool` is created.

For most applications, the default configuration is enough:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool;

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

Use an explicit configuration when the application needs control over worker count, queue capacity, shutdown behavior, or the default task timeout.

## Create a configured pool

Create a `ThreadPoolConfig`, modify the required fields, then pass it to `ThreadPool`:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPoolConfig config;
  config.thread_count = 4;
  config.max_queue_size = 256;
  config.drain_on_shutdown = true;

  vix::threadpool::ThreadPool pool(config);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

The configuration is normalized when the pool is constructed. The resulting configuration remains available through `config()`.

```cpp
const auto& config = pool.config();
```

## Configuration fields

`ThreadPoolConfig` currently exposes these fields:

| Field                     | Default                          | Current `ThreadPool` behavior                                                             |
| ------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `thread_count`            | hardware concurrency, or `1`     | Controls the number of workers created                                                    |
| `max_thread_count`        | same as the default worker count | Normalized and stored, but does not currently cause dynamic worker creation               |
| `max_queue_size`          | `0`                              | Sets the maximum queued task count for each worker                                        |
| `default_priority`        | `TaskPriority::normal`           | Stored in the configuration, but not currently applied as the default submission priority |
| `allow_dynamic_growth`    | `false`                          | Stored, but the current pool uses a fixed worker set                                      |
| `drain_on_shutdown`       | `true`                           | Controls whether queued work is drained during shutdown                                   |
| `swallow_task_exceptions` | `true`                           | Stored, but does not currently change `ThreadPool` task exception handling                |
| `idle_wait`               | `0us`                            | Stored, but does not currently configure the worker wait strategy                         |
| `default_timeout`         | `0ms`                            | Applied to submitted tasks that do not provide their own timeout                          |

The fields that currently affect the `ThreadPool` runtime are therefore:

```text
thread_count
max_queue_size
drain_on_shutdown
default_timeout
```

The remaining fields are part of the public configuration structure but should not currently be relied on to change runtime behavior.

## Worker count

`thread_count` controls how many workers are created.

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;

vix::threadpool::ThreadPool pool(config);
```

This creates four workers and four worker threads.

The same configuration can be expressed with the worker-count constructor:

```cpp
vix::threadpool::ThreadPool pool(4);
```

### Default worker count

The default configuration uses:

```cpp
vix::threadpool::ThreadPoolConfig::default_thread_count();
```

This returns `std::thread::hardware_concurrency()` when it reports a non-zero value. If the platform cannot provide a hardware concurrency value, the result is `1`.

The following therefore creates a pool using the default worker count:

```cpp
vix::threadpool::ThreadPool pool;
```

### Zero worker count

A configured `thread_count` of zero requests the default worker count.

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 0;

vix::threadpool::ThreadPool pool(config);
```

Normalization guarantees that the final worker count is never zero.

You can inspect the actual worker count through:

```cpp
const std::size_t workers = pool.thread_count();
```

## Queue capacity

`max_queue_size` controls the maximum number of queued tasks for each worker.

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 128;

vix::threadpool::ThreadPool pool(config);
```

The limit is applied independently to every worker queue.

With this configuration:

```text
thread_count = 4
max_queue_size = 128
```

the runtime is conceptually:

```text
Worker 1 → queue capacity 128
Worker 2 → queue capacity 128
Worker 3 → queue capacity 128
Worker 4 → queue capacity 128
```

`max_queue_size` is therefore not a global limit across the entire pool.

A value of zero means that worker queues are unbounded:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.max_queue_size = 0;
```

When a bounded worker queue cannot accept additional work, submission can be rejected.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Shutdown draining

`drain_on_shutdown` controls what workers do with queued work when shutdown begins.

The default is:

```cpp
config.drain_on_shutdown = true;
```

With draining enabled, workers continue processing work already present in their queues before stopping.

```text
shutdown
   ↓
stop accepting ordinary work
   ↓
finish queued work
   ↓
workers exit
   ↓
threads join
```

To request a faster stop without draining all queued work:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.drain_on_shutdown = false;

vix::threadpool::ThreadPool pool(config);
```

This setting affects work that has not started yet. A worker thread is not forcefully terminated while arbitrary C++ code is executing.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) for the complete lifecycle behavior.

## Default timeout

`default_timeout` provides a timeout for tasks that do not explicitly specify one.

By default, it is disabled:

```cpp
config.default_timeout = std::chrono::milliseconds{0};
```

A positive duration enables the pool default:

```cpp
#include <chrono>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPoolConfig config;
  config.default_timeout = std::chrono::milliseconds{500};

  vix::threadpool::ThreadPool pool(config);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

If a task already has its own timeout, that task-specific timeout is kept instead of the pool default.

Conceptually:

```text
task has timeout?
   │
   ├── yes → use task timeout
   │
   └── no
        ↓
pool default timeout enabled?
   │
   ├── yes → use pool default
   │
   └── no  → timeout disabled
```

Timeouts observe task execution duration. They do not forcibly terminate arbitrary C++ code.

See [Timeouts](/modules/threadpool/timeouts) for the exact timeout contract.

## Configuration normalization

`ThreadPoolConfig::normalized()` returns a corrected copy of a configuration.

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_thread_count = 2;

const auto normalized = config.normalized();
```

The normalization rules are:

```text
thread_count == 0
    ↓
use default_thread_count()

thread_count still == 0
    ↓
use 1

max_thread_count == 0
    ↓
use thread_count

max_thread_count < thread_count
    ↓
raise it to thread_count
```

The pool constructor normalizes automatically:

```cpp
vix::threadpool::ThreadPool pool(config);
```

Applications normally do not need to call `normalized()` themselves.

## Maximum thread count and dynamic growth

`ThreadPoolConfig` exposes:

```cpp
config.max_thread_count;
config.allow_dynamic_growth;
```

These fields are normalized and retained in `pool.config()`.

For example:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_thread_count = 8;
config.allow_dynamic_growth = true;

vix::threadpool::ThreadPool pool(config);
```

The current `ThreadPool` runtime still creates only the configured `thread_count` workers.

It does not currently grow from two workers to eight workers when the queue becomes busy.

Code should therefore use `thread_count` as the effective worker count for the current implementation.

## Default priority

`ThreadPoolConfig` contains:

```cpp
config.default_priority;
```

Its default value is:

```cpp
vix::threadpool::TaskPriority::normal
```

The current submission path does not merge this field into `TaskOptions`.

Default-constructed task options already use normal priority:

```cpp
vix::threadpool::TaskOptions options;
```

To select another priority, configure the task explicitly:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Do not currently rely on `config.default_priority` to change the priority of ordinary submissions.

See [Priorities](/modules/threadpool/priorities).

## Exception configuration

`ThreadPoolConfig` also exposes:

```cpp
config.swallow_task_exceptions;
```

The current `ThreadPool` implementation captures exceptions from submitted work independently of this field.

For result-producing submissions, exceptions are associated with the asynchronous result and can be observed through the corresponding `Future`.

For fire-and-forget work, exceptions do not escape the worker thread.

Changing `swallow_task_exceptions` currently does not change those behaviors.

See [Futures and Promises](/modules/threadpool/futures-and-promises) and [Errors](/modules/threadpool/errors).

## Idle wait

The configuration contains:

```cpp
config.idle_wait;
```

but the current `ThreadPool` does not pass this value to its worker waiting mechanism.

Changing `idle_wait` should therefore not currently be used as a worker scheduling or performance control.

Worker waiting behavior is explained in [Execution Model](/modules/threadpool/execution-model).

## Read the effective configuration

The normalized configuration used to construct the pool can be inspected with:

```cpp
const auto& config = pool.config();
```

For example:

```cpp
#include <iostream>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPoolConfig config;
  config.thread_count = 4;
  config.max_queue_size = 128;

  vix::threadpool::ThreadPool pool(config);

  std::cout << "workers: " << pool.config().thread_count << '\n';
  std::cout << "queue limit: " << pool.config().max_queue_size << '\n';

  return 0;
}
```

`config()` returns the normalized configuration stored by the pool. It does not mean that every field in the structure currently drives runtime behavior.

## Pool configuration vs task configuration

Pool configuration and task configuration solve different problems.

`ThreadPoolConfig` describes the runtime:

```text
worker count
queue capacity
shutdown draining
default timeout
```

`TaskOptions` describes one submitted task:

```text
priority
timeout
deadline
cancellation
worker affinity
```

For example:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 256;

vix::threadpool::ThreadPool pool(config);

vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

The first configuration creates the execution environment. The second describes how one task should be handled inside that environment.

Continue with [Executors](/modules/threadpool/executors) to begin the execution model, or [Tasks and Options](/modules/threadpool/tasks) for task-specific configuration.
