# Priorities

Task priorities influence the order in which queued tasks are selected inside a worker's local queue.

Set a priority through `TaskOptions`:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Priority affects queued work. It does not create a global execution order across the entire thread pool.

## TaskPriority

The module defines five priority levels:

```cpp
enum class TaskPriority : std::int32_t
{
  lowest = -2,
  low = -1,
  normal = 0,
  high = 1,
  highest = 2
};
```

Their order is:

```text
highest
   ↓
high
   ↓
normal
   ↓
low
   ↓
lowest
```

A larger numeric value represents a higher priority.

## Default priority

A default-constructed `TaskOptions` uses normal priority:

```cpp
vix::threadpool::TaskOptions options;
```

which gives:

```text
priority = normal
```

Ordinary submissions therefore use normal priority:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

unless the task options specify another value.

## Set a priority

The convenience constructor is:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);
```

The setter form is:

```cpp
vix::threadpool::TaskOptions options;

options.set_priority(
  vix::threadpool::TaskPriority::high
);
```

Both can be passed to the normal submission APIs.

With `submit()`:

```cpp
auto future = pool.submit([](){
  return 42;
}, options);
```

With `post()`:

```cpp
const bool accepted = pool.post([](){
  perform_work();
}, options);
```

With `handle()`:

```cpp
auto handle = pool.handle([](){
  return 42;
}, options);
```

The same priority model applies to all of them.

## Queue ordering

Each worker owns a local `TaskQueue`.

The queue orders tasks using two values:

```text
1. TaskPriority
2. sequence number
```

Higher priority is considered first.

When two tasks have the same priority, the smaller sequence number comes first.

Conceptually:

```text
highest, sequence 8
highest, sequence 12
high,    sequence 4
normal,  sequence 2
normal,  sequence 7
low,     sequence 1
lowest,  sequence 3
```

The next task selected from this queue is:

```text
highest, sequence 8
```

## Higher priority runs first inside one queue

Suppose three tasks are waiting in the same worker queue:

```text
Task A → low
Task B → highest
Task C → normal
```

Their execution order from that queue is:

```text
Task B
   ↓
Task C
   ↓
Task A
```

The queue comparator first compares priority values:

```text
highest = 2
normal  = 0
low     = -1
```

so the highest-priority queued task is selected first.

## Equal priorities preserve FIFO order

Every task receives a monotonically increasing sequence number when submitted through `ThreadPool`.

For three normal-priority tasks:

```text
Task A → sequence 10
Task B → sequence 11
Task C → sequence 12
```

their queue order is:

```text
Task A
   ↓
Task B
   ↓
Task C
```

Priority therefore does not destroy submission order when tasks have the same priority and are placed in the same worker queue.

The queue comparator is conceptually:

```text
different priority?
    │
    ├── yes → higher priority first
    │
    └── no  → smaller sequence first
```

## Priority is local to a worker

ThreadPool workers do not share one global task queue.

For example:

```text
Worker 1
└── high task

Worker 2
└── normal task
```

both workers can execute simultaneously.

The normal-priority task on Worker 2 does not wait for the high-priority task on Worker 1 merely because its priority is lower.

Priority therefore answers:

```text
Which queued task should this worker take next?
```

It does not answer:

```text
Which task across the entire pool must execute next?
```

## Priority does not select the worker

Scheduling and priority happen at different stages.

```text
task submitted
      ↓
Scheduler chooses worker
      ↓
task enters worker queue
      ↓
priority orders local queue
      ↓
worker executes task
```

Worker selection is handled by the scheduler.

Priority is evaluated after the destination worker has been selected.

For example:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::highest
);

auto future = pool.submit([](){
  return 42;
}, options);
```

does not mean:

```text
select the least busy worker because priority is highest
```

The normal scheduling policy still selects the worker according to affinity or queue load.

The priority then determines the task's position inside that worker's queue.

See [Scheduling Model](/modules/threadpool/scheduling).

## Priority does not preempt a running task

Priority affects queued tasks.

It does not interrupt work that is already executing.

Consider one worker:

```text
Worker
│
├── currently running: normal task
│
└── queue:
    highest task
```

The highest-priority task cannot interrupt the normal task.

The worker first finishes the currently executing callable.

Then it selects the highest-priority queued task.

Conceptually:

```text
normal task already running
          ↓
highest task arrives
          ↓
normal task continues
          ↓
normal task finishes
          ↓
highest task starts
```

This is non-preemptive task execution.

## Priority does not guarantee immediate execution

A highest-priority task can still wait.

For example:

```text
Worker 1
running: long task
queue:
  highest task
```

The highest-priority task remains queued until the worker finishes its current task.

Priority only changes its position relative to other queued work.

It cannot make an unavailable worker immediately available.

## Priority and multiple workers

Consider a two-worker pool.

```text
Worker 1
running: normal A
queue:
  highest B

Worker 2
running: low C
queue:
  normal D
```

Tasks A and C are already running.

Neither B nor D can preempt them.

After Worker 1 finishes A, it selects B.

After Worker 2 finishes C, it selects D.

The global execution sequence can therefore look like:

```text
A and C running concurrently

Worker 2 finishes C
        ↓
D starts

Worker 1 finishes A
        ↓
B starts
```

Even though B has the highest priority, D can begin earlier because it belongs to another worker queue.

This is why priority must not be treated as a global ordering guarantee.

## Priority and worker affinity

Affinity determines where a task is placed.

Priority determines where it appears inside that selected worker's queue.

For example:

```cpp
vix::threadpool::TaskOptions options;

options
  .set_affinity(vix::threadpool::WorkerId{2})
  .set_priority(vix::threadpool::TaskPriority::highest);

auto future = pool.submit([](){
  return 42;
}, options);
```

Conceptually:

```text
affinity
   ↓
select Worker 2
   ↓
priority
   ↓
place task according to
Worker 2 queue ordering
```

The two controls are complementary.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Priority and queue capacity

Priority does not bypass queue capacity.

If a bounded worker queue is full, a highest-priority task does not automatically remove a lower-priority task.

For example:

```text
Worker queue capacity = 2

queue:
  low
  normal

new task:
  highest
```

If the queue is already full, the new task can be rejected.

The queue does not evict:

```text
low
```

to make room for:

```text
highest
```

Priority controls ordering among accepted queued tasks.

Queue admission is a separate operation.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Priority values

The numeric priority values are stable:

| Priority  | Value |
| --------- | ----: |
| `lowest`  |  `-2` |
| `low`     |  `-1` |
| `normal`  |   `0` |
| `high`    |   `1` |
| `highest` |   `2` |

Convert a priority to its numeric value with:

```cpp
const std::int32_t value = vix::threadpool::to_priority_value(
  vix::threadpool::TaskPriority::high
);
```

The result is:

```text
1
```

These values are primarily useful for comparison and diagnostics.

Application code should normally use the named enum values.

## Compare priorities

The module provides:

```cpp
vix::threadpool::priority_higher_than(
  lhs,
  rhs
);
```

For example:

```cpp
const bool result = vix::threadpool::priority_higher_than(
  vix::threadpool::TaskPriority::high,
  vix::threadpool::TaskPriority::normal
);
```

The result is:

```text
true
```

The comparison is equivalent to comparing the numeric priority values.

For example:

```text
high    = 1
normal  = 0

1 > 0
  ↓
true
```

Equal priorities are not considered higher than each other.

```cpp
const bool result = vix::threadpool::priority_higher_than(
  vix::threadpool::TaskPriority::normal,
  vix::threadpool::TaskPriority::normal
);
```

returns:

```text
false
```

## Readable priority names

Use `to_string()` when a readable priority name is needed:

```cpp
const char* name = vix::threadpool::to_string(
  vix::threadpool::TaskPriority::highest
);
```

The result is:

```text
highest
```

The available names are:

```text
lowest
low
normal
high
highest
```

An unknown enum value returns:

```text
unknown
```

## Default priority in ThreadPoolConfig

`ThreadPoolConfig` exposes:

```cpp
config.default_priority;
```

and its default value is:

```cpp
vix::threadpool::TaskPriority::normal
```

However, the current `ThreadPool` submission path does not merge `config.default_priority` into submitted `TaskOptions`.

For example:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.default_priority = vix::threadpool::TaskPriority::high;

vix::threadpool::ThreadPool pool(config);
```

should not currently be used to make ordinary submissions high priority.

Set the priority explicitly on the task:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_priority(
  vix::threadpool::TaskPriority::high
);

auto future = pool.submit([](){
  return 42;
}, options);
```

See [Configuration](/modules/threadpool/configuration).

## Priorities in higher-level operations

Higher-level parallel operations can propagate task options to the work they submit.

For example, their configuration can carry a high task priority so that the generated worker tasks enter local queues with that priority.

The underlying behavior remains the same:

```text
parallel operation
       ↓
create several tasks
       ↓
TaskOptions contain priority
       ↓
tasks reach worker queues
       ↓
normal priority ordering applies
```

Parallel algorithms do not create a separate priority system.

See [Parallel Algorithms](/modules/threadpool/parallel-algorithms).

## When to use priority

Priority is useful when queued work has different urgency but can still share the same worker runtime.

For example:

```text
highest
  urgent work that should lead a local queue

high
  work that should usually precede ordinary queued work

normal
  regular application work

low
  work that can wait behind normal work

lowest
  least urgent queued work
```

These categories express relative queue preference.

They should not be interpreted as real-time scheduling guarantees.

## Do not use priority for dependencies

Suppose Task B requires Task A to finish first.

This is not sufficient:

```text
Task A → high
Task B → low
```

The scheduler may place them on different workers, so B can execute concurrently with or before A.

Priority is not a dependency mechanism.

When work has an actual dependency, express it through synchronization, results, scopes, or explicit control flow.

For example:

```cpp
auto first = pool.submit([](){
  return produce_value();
});

const auto value = first.get();

auto second = pool.submit([value](){
  return consume_value(value);
});
```

The dependency is explicit and does not rely on scheduler timing.

## Do not use priority as a timing guarantee

A priority level does not mean:

```text
highest → execute immediately
high    → execute within N milliseconds
low     → execute after all global work
```

The actual start time depends on:

```text
selected worker
currently running work
local queue contents
queue capacity
other concurrent activity
```

Priority provides relative local queue ordering only.

## Priority model summary

The complete priority path is:

```text
TaskOptions
    ↓
TaskPriority
    ↓
task submitted
    ↓
Scheduler selects worker
    ↓
task enters local TaskQueue
    ↓
higher priority first
    ↓
equal priority?
    ↓
smaller sequence first
    ↓
worker executes task
```

The important properties are:

- The levels are `lowest`, `low`, `normal`, `high`, and `highest`.
- `normal` is the default task priority.
- Higher numeric values represent higher priority.
- Priority is evaluated inside each worker's local queue.
- Equal-priority tasks use their sequence number for FIFO ordering.
- Priority does not select the worker.
- Priority does not create a global ordering across workers.
- Priority does not preempt a running task.
- Priority does not bypass queue capacity.
- Priority does not express dependencies.
- `ThreadPoolConfig::default_priority` is not currently applied to ordinary submissions.

Continue with [Worker Affinity](/modules/threadpool/worker-affinity) for worker placement or [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection) for queue admission behavior.
