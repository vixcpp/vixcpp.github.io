# Tasks and Options

A task is one unit of work submitted to the ThreadPool runtime.

In normal application code, you usually provide a callable and let `ThreadPool` create the task:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

The module associates that callable with task identity, execution options, queue ordering, lifecycle state, and execution result.

`TaskOptions` lets the caller describe how that work should be handled.

## Callables become tasks

The most common way to create work is through:

```text
post()
submit()
handle()
```

For example:

```cpp
pool.post([](){
  do_background_work();
});
```

or:

```cpp
auto future = pool.submit([](){
  return compute_result();
});
```

The application supplies the work. `ThreadPool` creates the task representation required by the scheduler and workers.

Conceptually:

```text
callable
   +
TaskOptions
   ↓
 Task
   ↓
ThreadPool runtime
```

Most applications do not need to construct `Task` directly.

## TaskOptions

`TaskOptions` describes properties of one submission.

Default options can be created with:

```cpp
vix::threadpool::TaskOptions options;
```

The defaults are:

```text
priority          normal
timeout           disabled
deadline          disabled
cancellation      disconnected
affinity          none
allow_after_stop  false
detached          false
flags             0
```

The primary execution controls are:

```text
priority
timeout
deadline
cancellation
worker affinity
```

There are also advanced fields for submission lifecycle and higher-level integrations.

## Default submission

No options are required for ordinary work:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

This is equivalent to providing default task options:

```cpp
vix::threadpool::TaskOptions options;

auto future = pool.submit([](){
  return 42;
}, options);
```

Use explicit options only when the task needs behavior different from the normal submission path.

## Priority

Priority influences the ordering of queued work inside a worker queue.

The available values are:

```text
lowest
low
normal
high
highest
```

The default is:

```cpp
vix::threadpool::TaskPriority::normal
```

Use `with_priority()` for a single setting:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Or modify an existing options object:

```cpp
vix::threadpool::TaskOptions options;
options.set_priority(vix::threadpool::TaskPriority::high);
```

Priority does not create a global ordering across every worker in the pool.

See [Priorities](/modules/threadpool/priorities).

## Timeout

A timeout observes how long task execution takes.

Create timeout options directly:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
  vix::threadpool::Timeout::milliseconds(500)
);
```

or modify existing options:

```cpp
vix::threadpool::TaskOptions options;
options.set_timeout(
  vix::threadpool::Timeout::milliseconds(500)
);
```

Check whether timeout observation is enabled with:

```cpp
if (options.has_timeout())
{
  // A timeout is configured.
}
```

A timeout does not forcibly terminate arbitrary C++ code.

See [Timeouts](/modules/threadpool/timeouts).

## Deadline

A deadline represents an absolute execution limit.

For example:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
  vix::threadpool::Deadline::after(std::chrono::seconds{2})
);
```

The setter form is:

```cpp
vix::threadpool::TaskOptions options;

options.set_deadline(
  vix::threadpool::Deadline::after(std::chrono::seconds{2})
);
```

Check whether a deadline exists with:

```cpp
if (options.has_deadline())
{
  // A deadline is configured.
}
```

If the deadline has already expired before execution begins, the task can be skipped.

See [Deadlines](/modules/threadpool/deadlines).

## Cancellation

A task can observe cancellation through a `CancellationToken`.

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_cancellation(
  source.token()
);

auto future = pool.submit([](){
  return 42;
}, options);
```

The setter form is:

```cpp
vix::threadpool::TaskOptions options;
options.set_cancellation(source.token());
```

Check whether the options contain a connected cancellation token:

```cpp
if (options.has_cancellation())
{
  // Cancellation can be requested.
}
```

Cancellation is cooperative. It does not provide unsafe thread termination.

See [Cancellation](/modules/threadpool/cancellation).

## Worker affinity

Worker affinity expresses a preference for a particular worker.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
  vix::threadpool::WorkerId{2}
);

auto future = pool.submit([](){
  return 42;
}, options);
```

The setter form is:

```cpp
vix::threadpool::TaskOptions options;
options.set_affinity(vix::threadpool::WorkerId{2});
```

Check whether affinity is configured with:

```cpp
if (options.has_affinity())
{
  // A worker affinity hint exists.
}
```

The default affinity value is `invalid_worker_id`, which means no worker preference.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Combine multiple options

`TaskOptions` setters return the same options object, so settings can be chained.

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options;

options
  .set_priority(vix::threadpool::TaskPriority::high)
  .set_timeout(vix::threadpool::Timeout::milliseconds(500))
  .set_cancellation(source.token())
  .set_affinity(vix::threadpool::WorkerId{1});

auto future = pool.submit([](){
  return 42;
}, options);
```

The options describe one logical submission.

They do not modify the configuration of the entire pool.

## Pool configuration and task options

`ThreadPoolConfig` and `TaskOptions` operate at different levels.

Pool configuration describes the execution environment:

```text
ThreadPoolConfig
├── worker count
├── worker queue capacity
├── shutdown draining
└── default timeout
```

Task options describe one task:

```text
TaskOptions
├── priority
├── timeout
├── deadline
├── cancellation
├── affinity
└── submission flags
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

The first object configures the pool. The second configures one submission.

## Default timeout merging

The pool can provide a default task timeout through `ThreadPoolConfig`.

```cpp
vix::threadpool::ThreadPoolConfig config;
config.default_timeout = std::chrono::milliseconds{500};

vix::threadpool::ThreadPool pool(config);
```

When a task has no explicit timeout, the pool applies its configured default.

```text
TaskOptions timeout disabled
          +
pool default_timeout enabled
          ↓
pool default is applied
```

An explicit task timeout takes precedence:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
  vix::threadpool::Timeout::milliseconds(100)
);

auto future = pool.submit([](){
  return 42;
}, options);
```

In this case, the task keeps its 100 ms timeout instead of receiving the pool default.

## Skip before execution

`TaskOptions` exposes:

```cpp
options.should_skip_before_run();
```

It returns `true` when either:

```text
cancellation has already been requested
                or
deadline has already expired
```

Conceptually:

```text
TaskOptions
    ↓
cancelled?
   ┌─┴─┐
  yes  no
   │    │
 skip   ▼
      deadline expired?
         ┌─┴─┐
        yes  no
         │    │
       skip  continue
```

This check does not include timeout because timeout observation depends on execution duration.

## `allow_after_stop`

Normal submissions are rejected once the pool stops accepting ordinary work.

`TaskOptions` contains an advanced exception:

```cpp
vix::threadpool::TaskOptions options;
options.set_allow_after_stop(true);
```

This allows submission during the limited shutdown interval where the `ThreadPool` has stopped accepting ordinary work but its scheduler is still running.

It is not a way to restart a stopped pool, and it does not allow submission after the scheduler has completely stopped.

Most application tasks should keep the default:

```text
allow_after_stop = false
```

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## Detached tasks

`TaskOptions` contains a `detached` flag.

```cpp
vix::threadpool::TaskOptions options;
options.set_detached(true);
```

Normal application code usually does not need to set it manually.

`ThreadPool::post()` marks posted work as detached automatically:

```cpp
pool.post([](){
  do_background_work();
});
```

The current runtime stores this property with the task options, but it does not otherwise select a different execution path based on the flag.

Use `post()` when fire-and-forget behavior is intended instead of manually setting `detached` on another submission API.

## User-defined flags

`TaskOptions` also exposes:

```cpp
std::uint32_t flags;
```

The default value is:

```text
0
```

These bits are reserved for higher-level integrations.

The current ThreadPool runtime does not interpret them when scheduling or executing tasks.

Code that uses `flags` must therefore define its own higher-level meaning rather than expecting built-in ThreadPool behavior.

## Static TaskOptions helpers

The module provides convenience constructors for the main task controls:

```cpp
vix::threadpool::TaskOptions::with_priority(...)
vix::threadpool::TaskOptions::with_timeout(...)
vix::threadpool::TaskOptions::with_deadline(...)
vix::threadpool::TaskOptions::with_cancellation(...)
vix::threadpool::TaskOptions::with_affinity(...)
```

Each helper starts from default options and changes one property.

For example:

```cpp
auto options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::highest
);
```

is conceptually equivalent to:

```cpp
vix::threadpool::TaskOptions options;
options.priority = vix::threadpool::TaskPriority::highest;
```

The helper form makes the primary intent visible at the point of construction.

## Task

`Task` is the low-level public representation of executable work.

It contains:

```text
Task
├── TaskId
├── callable
├── TaskOptions
├── TaskStatus
├── TaskResult
├── sequence number
├── captured exception
├── creation time
├── start time
└── finish time
```

Ordinary users should normally submit callables through `ThreadPool` instead of manually constructing `Task`.

Direct `Task` construction is useful for lower-level integrations and code working directly with workers or queues.

## Construct a Task directly

A task can be created from an ID, callable, options, and sequence number:

```cpp
vix::threadpool::TaskOptions options;

vix::threadpool::Task task(
  vix::threadpool::TaskId{1},
  vix::threadpool::TaskFunction([](){
    // Work.
  }),
  options,
  1
);
```

The initial state is:

```text
status  created
result  none
```

The task is not automatically submitted anywhere simply because a `Task` object exists.

The ThreadPool runtime normally handles task construction and queue insertion for the application.

## Empty Task

A default-constructed task is invalid:

```cpp
vix::threadpool::Task task;
```

Its identifier is:

```cpp
vix::threadpool::invalid_task_id
```

and it does not contain executable work.

Check validity with:

```cpp
if (task.valid())
{
  // Task has a valid ID and callable.
}
```

An invalid task is not schedulable.

## TaskFunction is move-only

The callable stored by `Task` uses:

```cpp
vix::threadpool::TaskFunction
```

This function wrapper is move-only.

As a result, tasks can own non-copyable state.

For normal submissions:

```cpp
auto value = std::make_unique<int>(42);

auto future = pool.submit([value = std::move(value)](){
  return *value;
});
```

The task can own the `std::unique_ptr` directly.

This avoids requiring submitted callables to be copyable.

## Task is move-only

`Task` itself is also move-only.

```text
copy construction   disabled
copy assignment     disabled
move construction   supported
move assignment     supported
```

This matches its role as the owner of a move-only callable and task execution state.

Queues and scheduler components transfer tasks by moving them rather than copying them.

## Task identity

Each task has a `TaskId`.

```cpp
const auto id = task.id();
```

`TaskId` is:

```cpp
std::uint64_t
```

and:

```cpp
vix::threadpool::invalid_task_id
```

is defined as zero.

Check an identifier with:

```cpp
if (vix::threadpool::is_valid_task_id(id))
{
  // Valid task ID.
}
```

Normal pool submissions receive IDs from `ThreadPool`.

Applications usually encounter them through `TaskHandle`.

See [Task Handles](/modules/threadpool/task-handles).

## Task sequence

A task also carries a sequence number:

```cpp
const std::uint64_t sequence = task.sequence();
```

The sequence is different from the task ID.

```text
TaskId
  ↓
identity

sequence
  ↓
stable queue ordering
```

The pool assigns monotonically increasing sequence numbers to submissions.

When tasks have equal priority inside the same worker queue, this sequence preserves FIFO ordering.

## Task status

The current lifecycle state is available through:

```cpp
const auto status = task.status();
```

The lifecycle includes:

```text
created
queued
running
completed
failed
cancelled
timed_out
rejected
```

Convenience checks include:

```cpp
task.done();
task.running();
task.queued();
```

The detailed status model is covered in [Task Results and Status](/modules/threadpool/task-results-and-status).

## Task result

The execution result is available through:

```cpp
const auto result = task.result();
```

Possible values are:

```text
none
success
failure
cancelled
timeout
rejected
```

Convenience checks include:

```cpp
task.succeeded();
task.failed();
```

Status describes where the task is in its lifecycle. Result describes how an execution attempt ended.

See [Task Results and Status](/modules/threadpool/task-results-and-status).

## Task timing

`Task` records three time points:

```cpp
task.created_at();
task.started_at();
task.finished_at();
```

It also exposes observed execution duration:

```cpp
const auto duration = task.execution_duration();
```

Before execution starts, the duration is zero.

While the task is running, duration is measured from its start time to the current time.

After the task finishes, duration is measured between its recorded start and finish times.

These values use `std::chrono::steady_clock`, which is suitable for measuring elapsed execution time.

## Captured exception

If low-level task execution throws, `Task::run()` catches the exception and stores it as an `std::exception_ptr`.

```cpp
const std::exception_ptr error = task.exception();
```

The exception does not escape the worker thread through the low-level task execution path.

For normal result-producing submissions, applications should use the returned `Future` instead of accessing a low-level `Task` exception directly.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## Low-level execution

`Task::run()` executes the stored callable and returns a `TaskResult`.

```cpp
const auto result = task.run();
```

Before execution it checks:

```text
task validity
cancellation
deadline
```

After the callable finishes it observes:

```text
timeout
deadline
cancellation
```

and records the final status and result.

Direct calls to `Task::run()` are primarily useful for lower-level integration and testing. Normal application code should allow pool workers to run submitted tasks.

## Tasks should remain small units of scheduling

A task is the unit that the ThreadPool scheduler can place into a worker queue.

Once the callable starts, the worker executes that callable as ordinary C++ code until it returns or throws.

A single task is therefore not automatically parallelized internally.

For example:

```cpp
auto future = pool.submit([](){
  perform_large_operation();
});
```

creates one scheduled task, regardless of how much work `perform_large_operation()` performs.

When a problem can be divided into independent pieces, submit multiple tasks or use one of the higher-level [Parallel Algorithms](/modules/threadpool/parallel-algorithms).

## Summary

The task model can be reduced to:

```text
callable
   +
TaskOptions
   ↓
 Task
   ├── identity
   ├── ordering
   ├── lifecycle
   └── result
   ↓
scheduler
   ↓
worker
```

For normal application code:

```text
provide a callable
      ↓
optionally configure TaskOptions
      ↓
post(), submit(), or handle()
      ↓
let ThreadPool manage Task
```

Use direct `Task` construction only when lower-level control is genuinely required.

Continue with [Task Handles](/modules/threadpool/task-handles) for task identity and cancellation control, or [Futures and Promises](/modules/threadpool/futures-and-promises) for result-producing work.
