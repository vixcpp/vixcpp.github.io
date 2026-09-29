# Architecture

`vix::threadpool` separates the public task-submission API from the machinery that distributes and executes work.

At a high level, the runtime follows this path:

```text
ThreadPool
    ↓
Scheduler
    ↓
Worker
    ↓
TaskQueue
    ↓
Task
```

Applications normally interact with `ThreadPool`. The lower layers exist to distribute work, maintain worker threads, order queued tasks, and collect execution information.

## Runtime structure

A pool owns one scheduler, and the scheduler owns a fixed set of workers.

Each worker owns:

```text
Worker
├── worker thread
├── local task queue
├── execution state
└── execution counters
```

For a pool with four workers, the runtime is conceptually:

```text
                         ThreadPool
                             │
                             ▼
                          Scheduler
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
        Worker 1          Worker 2          Worker 3
           │                 │                 │
           ▼                 ▼                 ▼
        Queue 1           Queue 2           Queue 3
```

Each worker executes tasks from its own queue.

There is no single global task queue shared by every worker.

## From submission to execution

Consider a normal submission:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

The important runtime stages are:

```text
callable
   ↓
ThreadPool
   ↓
Task creation
   ↓
Scheduler
   ↓
worker selection
   ↓
selected worker queue
   ↓
worker thread
   ↓
task execution
   ↓
result
```

`ThreadPool` creates the task representation and assigns information such as its identifier, sequence number, and task options.

The scheduler then chooses a worker.

If the selected worker accepts the task, the task is inserted into that worker's local queue and eventually executed by that worker thread.

## Worker selection

The scheduler is responsible for choosing the destination worker for each task.

The scheduling layer supports these strategies:

```text
round_robin
least_loaded
affinity
affinity_then_least_loaded
```

The `ThreadPool` currently uses `affinity_then_least_loaded`.

This means the scheduler first honors a valid worker-affinity hint when the task provides one. Otherwise, it chooses the worker with the smallest local queue.

Conceptually:

```text
task submitted
      ↓
has worker affinity?
   ┌───────┴───────┐
  yes              no
   │                │
   ▼                ▼
affinity         least loaded
worker             worker
```

Worker selection happens when the task is submitted.

See [Scheduling Model](/modules/threadpool/scheduling) for the scheduling policies and [Worker Affinity](/modules/threadpool/worker-affinity) for affinity behavior.

## Local queues

Every worker owns a `TaskQueue`.

A task selected for one worker is inserted into that worker's queue:

```text
Scheduler
    │
    ├──► Worker 1 ──► Queue 1
    ├──► Worker 2 ──► Queue 2
    └──► Worker 3 ──► Queue 3
```

Workers do not consume tasks directly from another worker's queue.

The current runtime does not implement work stealing.

Once a task has been placed into a worker queue, another idle worker does not take that queued task simply because it has no local work.

This makes worker selection at submission time important.

## Queue ordering

A worker queue orders tasks by priority first.

For tasks with the same priority, their submission sequence preserves FIFO ordering.

Conceptually:

```text
critical
high
normal
low
```

and within one priority:

```text
task A
task B
task C
```

execute in queue sequence order.

This ordering belongs to a worker's local queue.

It is not a global execution order across the entire thread pool.

For example, with multiple workers:

```text
Worker 1
Queue:
  high task

Worker 2
Queue:
  normal task
```

both workers may execute their tasks concurrently.

The presence of the high-priority task does not prevent another worker from beginning a lower-priority task already available in its own queue.

Priority therefore influences local queued work. It does not provide global serialization or preemption.

See [Priorities](/modules/threadpool/priorities).

## Worker execution loop

Each worker owns one operating-system thread.

The worker repeatedly follows this cycle:

```text
look for local work
       ↓
task available?
   ┌───────┴───────┐
  yes              no
   │                │
   ▼                ▼
mark active       wait
   │                │
   ▼                └──────┐
run task                  │
   │                       │
   ▼                       │
record result              │
   │                       │
   ▼                       │
become idle ◄──────────────┘
```

When there is no work, the worker enters its waiting strategy instead of continuously executing an empty loop.

When new work arrives, the worker is notified and can resume processing its queue.

## Task execution

Before execution, a queued task becomes active.

The worker then invokes the task and records its terminal execution result.

The task execution layer recognizes results such as:

```text
success
failure
cancelled
timeout
rejected
```

These results contribute to worker and pool observability.

The worker thread also records thread-local context while a task is running, which allows code executing inside the pool to identify the current worker and current task through the `this_worker` API.

Applications that only submit work do not need to understand this internal execution loop.

## Futures do not execute tasks

A `Future` represents a result. It is not responsible for choosing a worker or executing the callable.

For a submission such as:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

the relationship is conceptually:

```text
                      ┌──────────────► Future<int>
                      │
callable ──► task ──► worker
                      │
                      └──────────────► result
```

The task runs on a worker thread. The corresponding asynchronous state is updated when the result becomes available.

`future.get()` waits for that result when necessary.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## Task identity and sequence

The pool generates two different values for submitted work.

### Task ID

Each task receives a `TaskId`.

Task identifiers are used to identify individual tasks and are exposed by APIs such as `TaskHandle`.

### Sequence number

The pool also assigns a monotonically increasing sequence number.

The sequence is used by local priority queues to preserve FIFO ordering between tasks with the same priority.

These values solve different problems:

```text
TaskId
  ↓
task identity

sequence
  ↓
stable queue ordering
```

## Fixed worker ownership

The scheduler creates its workers as part of the pool runtime and owns them for the scheduler lifetime.

The number of workers used by the scheduler comes from the normalized `thread_count` configuration.

For example:

```cpp
vix::threadpool::ThreadPool pool(4);
```

creates a runtime with four workers.

Conceptually:

```text
ThreadPool
    ↓
Scheduler
    ↓
4 Workers
    ↓
4 worker threads
```

The current `ThreadPool` execution path uses this fixed worker set while the pool is running.

See [Configuration](/modules/threadpool/configuration) for the configuration fields that affect the current runtime.

## Queue capacity

The scheduler gives each worker its own queue capacity.

The public `max_queue_size` value is currently passed to each worker queue.

Conceptually, with:

```text
thread_count = 4
max_queue_size = 100
```

the runtime is:

```text
Worker 1 → up to 100 queued tasks
Worker 2 → up to 100 queued tasks
Worker 3 → up to 100 queued tasks
Worker 4 → up to 100 queued tasks
```

The limit is therefore applied per worker queue, not as one global 100-task limit for the entire pool.

A value of zero leaves worker queues unbounded.

Queue limits and submission rejection are covered in [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Lifecycle

Constructing a `ThreadPool` starts its scheduler and workers automatically.

```cpp
vix::threadpool::ThreadPool pool(4);
```

The lifecycle is:

```text
construction
    ↓
scheduler start
    ↓
worker threads start
    ↓
running
    ↓
shutdown requested
    ↓
workers stop
    ↓
worker threads joined
```

Shutdown is cooperative. Threads are not forcefully terminated.

When shutdown drains queued work, workers continue processing their local queues until the queues are empty before leaving their execution loops.

The pool destructor calls `shutdown()`.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) for the full shutdown contract.

## Metrics aggregation

Workers maintain execution information locally.

The scheduler aggregates those worker values into pool-level metrics and statistics:

```text
Worker 1 metrics ──┐
Worker 2 metrics ──┼──► Scheduler ──► ThreadPool metrics
Worker 3 metrics ──┤
Worker 4 metrics ──┘
```

This architecture allows the public `ThreadPool` API to expose one snapshot without requiring callers to inspect individual workers.

For example:

```cpp
const auto metrics = pool.metrics();
const auto stats = pool.stats();
```

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Higher-level features use the same runtime

Parallel algorithms, scopes, task handles, and periodic tasks do not introduce another worker system.

They build work that ultimately reaches the same execution runtime:

```text
submit()
handle()
Scope
parallel_for()
parallel_map()
PeriodicTask
       │
       ▼
   ThreadPool
       │
       ▼
   Scheduler
       │
       ▼
    Workers
```

This keeps the architecture centered on one execution mechanism while allowing higher-level abstractions to compose around it.

## Architecture summary

The important relationships are:

```text
                         ThreadPool
                             │
                             ▼
                          Scheduler
                             │
                 selects one worker
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
        Worker 1          Worker 2          Worker N
           │                 │                 │
           ▼                 ▼                 ▼
       TaskQueue         TaskQueue         TaskQueue
           │                 │                 │
           ▼                 ▼                 ▼
          Task              Task              Task
```

The main architectural properties are:

- `ThreadPool` is the public execution facade.
- The scheduler distributes tasks across a fixed worker set.
- Each worker owns one thread and one local task queue.
- There is no global shared task queue.
- There is currently no work stealing between workers.
- Worker selection occurs during submission.
- Local queues order work by priority and then FIFO sequence.
- Priority does not provide a global execution order across workers.
- Higher-level concurrency features reuse the same execution runtime.

Continue with [Configuration](/modules/threadpool/configuration) to see how the pool is created, or [Execution Model](/modules/threadpool/execution-model) for the detailed lifecycle of a submitted task.
