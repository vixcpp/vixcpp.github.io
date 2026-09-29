# Execution Model

A `ThreadPool` submission passes through several stages before the callable runs.

Understanding this path is useful when reasoning about priorities, cancellation, queue limits, worker affinity, task state, and shutdown.

The normal execution path is:

```text
submission
    ↓
task options
    ↓
acceptance check
    ↓
task creation
    ↓
worker selection
    ↓
local queue
    ↓
worker thread
    ↓
callable execution
    ↓
result and metrics
```

Most application code only needs `post()`, `submit()`, or `handle()`. The remaining stages are managed by the pool.

## 1. Submission

Work enters the pool through one of three main operations.

### `post()`

`post()` submits fire-and-forget work:

```cpp
const bool accepted = pool.post([](){
  // Work.
});
```

The caller receives only the acceptance result.

### `submit()`

`submit()` creates an asynchronous result:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

The returned `Future` represents the callable's result.

### `handle()`

`handle()` adds task identity and cancellation control:

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

All three operations eventually submit a task into the same scheduler.

## 2. Task options are prepared

Each submission can carry `TaskOptions`.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Before the task enters the scheduler, the pool merges task-specific options with pool defaults.

The current pool-level merge applies `default_timeout` when:

```text
task has no timeout
        +
pool default_timeout is enabled
        ↓
use pool default timeout
```

Other task options keep their task-specific values.

See [Configuration](/modules/threadpool/configuration) and [Tasks and Options](/modules/threadpool/tasks).

## 3. The pool checks whether submissions are allowed

Ordinary work is accepted while the pool is running.

Conceptually:

```text
submission
    ↓
pool running?
  ┌─────┴─────┐
 yes          no
  │            │
  ▼            ▼
continue   normally reject
```

`TaskOptions::allow_after_stop` provides an advanced exception during the shutdown window.

It does not allow work to be submitted after the scheduler has completely stopped.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## 4. Cancellation and deadlines can prevent execution

For result-producing submissions, the pool checks cancellation and deadline state before constructing work for the scheduler.

For example:

```cpp
vix::threadpool::CancellationSource source;
source.cancel();

vix::threadpool::TaskOptions options;
options.set_cancellation(source.token());

auto future = pool.submit([](){
  return 42;
}, options);
```

The callable is not executed when cancellation has already been requested.

An already expired deadline is handled similarly.

Conceptually:

```text
accepted submission
       ↓
already cancelled?
   ┌───────┴───────┐
  yes              no
   │                │
cancel result   deadline expired?
                 ┌─────┴─────┐
                yes          no
                 │            │
            timeout result  continue
```

Cancellation and deadline state are also observed again before a `submit()` or `handle()` callable begins executing.

This closes the interval between initial submission and the moment the worker reaches the task.

See [Cancellation](/modules/threadpool/cancellation) and [Deadlines](/modules/threadpool/deadlines).

## 5. A task receives identity and ordering information

Accepted work is represented internally as a task.

The pool assigns:

```text
TaskId
sequence number
TaskOptions
callable
```

`TaskId` identifies the task.

The sequence number preserves ordering between tasks with equal priority inside a worker queue.

For example:

```text
Task A
priority = normal
sequence = 10

Task B
priority = normal
sequence = 11
```

When both are in the same worker queue, Task A has the earlier queue order.

Task identity and queue ordering are separate concepts.

## 6. The scheduler selects a worker

The scheduler receives the task and selects one worker.

The current `ThreadPool` uses the `affinity_then_least_loaded` scheduling policy.

The selection path is:

```text
task
 ↓
valid affinity?
 ┌─────┴─────┐
yes          no
 │            │
 ▼            ▼
affinity   worker with
worker     smallest queue
```

Without affinity, the scheduler compares the local queue sizes of the workers and selects the smallest one.

This decision uses queued work. It is not a measurement of total CPU cost or future task duration.

For example:

```text
Worker 1 queue: 3
Worker 2 queue: 1
Worker 3 queue: 4
```

a task without affinity is directed to Worker 2.

See [Scheduling Model](/modules/threadpool/scheduling).

## 7. Affinity selects a specific worker

A task can provide a worker-affinity hint.

```cpp
vix::threadpool::TaskOptions options;
options.set_affinity(2);

auto future = pool.submit([](){
  return 42;
}, options);
```

With the current scheduling policy, valid affinity is considered before queue load.

Conceptually:

```text
Task affinity = Worker 2
        ↓
Scheduler
        ↓
Worker 2
```

The scheduler maps the affinity value onto the available worker set.

See [Worker Affinity](/modules/threadpool/worker-affinity) for the exact mapping and limitations.

## 8. The selected worker accepts the task

After worker selection, the scheduler asks that worker to accept the task.

A worker can reject work when:

```text
task is not schedulable
worker is stopping
bounded local queue is full
```

If accepted, the worker inserts the task into its local `TaskQueue`.

```text
Scheduler
    ↓
Worker
    ↓
TaskQueue
```

At this point the task is queued and waiting for execution.

## 9. Every worker has its own queue

The runtime does not use one shared global queue.

For three workers:

```text
Worker 1 → Queue 1
Worker 2 → Queue 2
Worker 3 → Queue 3
```

A task is placed into one of these queues during submission.

The current runtime does not move queued tasks between workers through work stealing.

This means the worker chosen during submission remains important throughout the queued lifetime of the task.

## 10. Queue order is priority first

Inside one worker queue, tasks are ordered by `TaskPriority`.

The priority levels are:

```text
critical
high
normal
low
```

For equal priority, sequence order provides FIFO behavior.

Conceptually:

```text
critical, sequence 8
critical, sequence 12
high,     sequence 3
normal,   sequence 1
normal,   sequence 7
low,      sequence 2
```

Priority is local to each worker queue.

It does not establish one global ordering across all workers.

See [Priorities](/modules/threadpool/priorities).

## 11. The worker waits for work

Each worker owns one operating-system thread.

When its queue is empty, the worker enters its waiting strategy.

The normal cycle is:

```text
check queue
    ↓
task available?
 ┌─────┴─────┐
yes          no
 │            │
 ▼            ▼
execute      wait
 │            │
 └──────┬─────┘
        ↓
     repeat
```

Submitting new work notifies the selected worker so that it can resume processing.

The worker does not continuously execute an empty task loop at full speed.

## 12. Moving from queued to active

When a worker takes the next task from its queue, the task is removed and the worker's active-task count is incremented.

Conceptually:

```text
TaskQueue
    ↓
pop next task
    ↓
pending count decreases
    ↓
active count increases
```

The worker then enters the running state and establishes thread-local execution context for the task.

## 13. Worker context

While a callable runs on a pool worker, the module exposes thread-local context through `this_worker`.

For example:

```cpp
auto future = pool.submit([](){
  return vix::threadpool::this_worker::inside();
});
```

Inside a normal thread-pool worker, the result is `true`.

The current worker can also inspect:

```cpp
vix::threadpool::this_worker::id();
vix::threadpool::this_worker::index();
vix::threadpool::this_worker::task_id();
```

The context is established by the worker thread and the current task identifier is set while a task is executing.

Outside the thread pool, `this_worker::inside()` returns `false`.

This API is useful when code genuinely needs execution locality information. Ordinary tasks do not need to query it.

## 14. Low-level task lifecycle

The low-level `Task` type models these lifecycle states:

```text
created
   ↓
queued
   ↓
running
   ↓
┌───────────┬────────┬───────────┬───────────┐
▼           ▼        ▼           ▼
completed  failed  cancelled  timed_out
```

A task can also reach:

```text
rejected
```

without running.

The terminal states are therefore:

```text
completed
failed
cancelled
timed_out
rejected
```

`created`, `queued`, and `running` represent non-terminal lifecycle states.

See [Task Results and Status](/modules/threadpool/task-results-and-status).

## 15. Checks immediately before low-level execution

Before invoking its stored callable, a low-level task checks whether it should still execute.

The task can finish before invocation when:

```text
cancellation already requested
deadline already expired
```

If neither applies, the task becomes `running` and its execution start time is recorded.

This is particularly relevant to `post()`, whose task options remain attached directly to the low-level task.

`submit()` and `handle()` also perform their own result-oriented cancellation and deadline checks around the user callable.

The dedicated cancellation and timing pages explain those observable contracts in detail.

## 16. The callable executes on the worker

Once execution begins, the callable runs normally as C++ code on the selected worker thread.

```cpp
auto future = pool.submit([](){
  return compute_result();
});
```

The thread pool does not interpret the body of `compute_result()`.

It does not automatically divide the callable into smaller units, migrate it to another worker, or forcibly interrupt arbitrary instructions.

The callable runs until it:

```text
returns
throws
blocks
or otherwise finishes according to its own code
```

This is why long-running tasks should be designed with the execution and cancellation model in mind.

## 17. `post()` execution

A posted callable is stored directly as fire-and-forget task work.

```cpp
const bool accepted = pool.post([](){
  do_background_work();
});
```

The worker executes it through the low-level task lifecycle.

After the callable returns, the task evaluates relevant completion conditions such as:

```text
timeout
deadline
cancellation
```

and records its final task result.

Because `post()` has no `Future`, task outcome is primarily visible through pool observability and any state managed by the application itself.

## 18. `submit()` execution

`submit()` adds a result-producing layer around the callable.

```cpp
auto future = pool.submit([](){
  return 42;
});
```

Conceptually:

```text
user callable
     ↓
result wrapper
     ↓
low-level Task
     ↓
worker thread
```

The wrapper owns the connection to a `Promise`.

When the callable returns a value:

```text
callable
   ↓
value
   ↓
Promise
   ↓
Future
```

For `void` callables, the promise records completion instead of storing a value.

This is why the low-level task lifecycle and the `Future` result state are related but distinct layers.

## 19. Exceptions from `submit()`

For result-producing work, the wrapper catches exceptions thrown by the user callable and stores them in the asynchronous result.

```cpp
auto future = pool.submit([]() -> int {
  throw std::runtime_error("failure");
});
```

The exception does not escape the worker thread.

The caller observes it through:

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

The result layer therefore carries the callable's exception back to the consumer.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## 20. `handle()` uses the same result path

`handle()` follows the same result-producing execution model as `submit()`.

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

The difference is the control object returned to the caller.

Conceptually:

```text
submit()
   ↓
Future<T>


handle()
   ↓
TaskHandle<T>
├── TaskId
├── Future<T>
└── CancellationSource
```

The underlying work still reaches the same scheduler, worker queues, and worker threads.

See [Task Handles](/modules/threadpool/task-handles).

## 21. Timeouts observe duration

A timeout does not interrupt the callable when the configured duration is reached.

For low-level task execution, the worker records the start time, lets the callable run, then compares the observed duration with the timeout.

Conceptually:

```text
start task
    ↓
start timer
    ↓
run callable
    ↓
callable returns
    ↓
measure duration
    ↓
timeout exceeded?
```

A timeout is therefore an execution-duration observation, not a mechanism for forcibly terminating C++ code.

This distinction is important for long-running or blocking operations.

See [Timeouts](/modules/threadpool/timeouts) for the exact public behavior.

## 22. Deadlines are absolute limits

A deadline represents an absolute time point.

It can prevent a task from starting when the deadline has already expired.

The deadline can also be observed after low-level task execution.

Conceptually:

```text
before execution
      ↓
deadline expired?
      ↓
skip if expired

otherwise
      ↓
run callable
      ↓
check deadline again
```

A deadline still does not forcibly terminate arbitrary code while that code is executing.

See [Deadlines](/modules/threadpool/deadlines).

## 23. Cancellation is cooperative

Cancellation can prevent work from beginning when a cancellation request is already visible.

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options;
options.set_cancellation(source.token());

auto future = pool.submit([](){
  return 42;
}, options);
```

The token communicates cancellation state. It does not provide unsafe thread termination.

Once arbitrary user code is running, that code must return before the worker can move to another task.

See [Cancellation](/modules/threadpool/cancellation) for the exact differences between cancelling queued work, result-producing work, and already running work.

## 24. Completion updates worker state

After low-level execution finishes, the worker records the task result in its counters.

Possible low-level results are:

```text
success
failure
cancelled
timeout
rejected
```

The active-task count is then decremented.

If the worker is not stopping, its execution state returns to idle before it processes more work.

Conceptually:

```text
running task
    ↓
task finishes
    ↓
record outcome
    ↓
active count decreases
    ↓
worker becomes idle
    ↓
look for next task
```

These worker-level values contribute to the aggregate pool metrics and statistics.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## 25. Future readiness and worker idleness are different

A `Future` belongs to one result-producing submission.

`pool.idle()` describes the entire pool.

These are different synchronization questions.

```cpp
auto future = pool.submit([](){
  return 42;
});

const int result = future.get();
```

asks:

```text
has this result become available?
```

while:

```cpp
pool.wait_idle();
```

asks:

```text
does the pool have any queued or active work left?
```

If an application only depends on one submitted result, waiting on its `Future` is usually the direct synchronization mechanism.

Use `wait_idle()` when the application needs a pool-wide idle boundary.

## 26. Pending and active work

The runtime distinguishes queued work from executing work.

```text
pending
    ↓
still inside worker queues

active
    ↓
removed from a queue and currently being processed
```

`pool.pending()` aggregates the queued task count.

`pool.metrics()` provides both pending and active values.

Because workers run concurrently, these values are snapshots and may change immediately after they are read.

## 27. Waiting for idle

`wait_idle()` repeatedly observes the pool until it reaches a stable idle boundary.

```cpp
pool.wait_idle();
```

The pool is considered idle when:

```text
pending tasks == 0
        +
active tasks == 0
```

The pool remains running afterward.

New work can be submitted:

```cpp
pool.wait_idle();

auto future = pool.submit([](){
  return 42;
});
```

Waiting for idle is therefore synchronization, not shutdown.

## 28. Shutdown changes the execution path

During normal operation:

```text
submit
  ↓
accept
  ↓
queue
  ↓
execute
```

Once shutdown begins, ordinary new submissions are no longer accepted by `ThreadPool`.

Existing worker behavior depends on the configured draining mode.

With draining enabled:

```text
shutdown requested
       ↓
stop ordinary submissions
       ↓
workers continue queued work
       ↓
queues become empty
       ↓
workers exit
       ↓
threads join
```

With draining disabled, workers can stop without completing all queued work.

A worker executing arbitrary C++ code is not forcefully terminated.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## 29. The execution path in one view

A normal result-producing submission can be summarized as:

```text
pool.submit(callable)
        │
        ▼
merge TaskOptions
        │
        ▼
check submission state
        │
        ▼
check cancellation / deadline
        │
        ▼
create result wrapper
        │
        ▼
create Task
        │
        ▼
Scheduler
        │
        ▼
select Worker
        │
        ▼
local TaskQueue
        │
        ▼
queued
        │
        ▼
worker pops task
        │
        ▼
running
        │
        ▼
check cancellation / deadline
        │
        ▼
execute callable
        │
        ├──────────────► Promise
        │                    │
        │                    ▼
        │                 Future
        │
        ▼
finish low-level task
        │
        ▼
update worker counters
        │
        ▼
worker looks for more work
```

The important design property is that higher-level features do not bypass this runtime.

`Scope`, periodic tasks, and parallel algorithms ultimately dispatch work through the same executor and thread-pool mechanisms.

Continue with [Tasks and Options](/modules/threadpool/tasks) for the task model, or [Scheduling Model](/modules/threadpool/scheduling) for worker selection and queue behavior.
