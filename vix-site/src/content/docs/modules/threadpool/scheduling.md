# Scheduling Model

Scheduling determines which worker receives a submitted task.

A `ThreadPool` owns several workers, and each worker owns its own task queue. When work is submitted, the scheduler chooses one worker and places the task into that worker's queue.

```text
ThreadPool
    ↓
Scheduler
    ↓
select one worker
    ↓
Worker
    ↓
local TaskQueue
```

The current `ThreadPool` uses affinity when a task provides a worker hint. Otherwise, it selects the worker with the smallest local queue.

## The default scheduling path

Consider a pool with four workers:

```cpp
vix::threadpool::ThreadPool pool(4);

auto future = pool.submit([](){
  return 42;
});
```

Because the task has no worker affinity, the scheduler compares the worker queue sizes and selects the least loaded worker.

Conceptually:

```text
Worker 1 → 3 queued tasks
Worker 2 → 1 queued task
Worker 3 → 2 queued tasks
Worker 4 → 4 queued tasks
              ↑
         selected worker
```

The task is then placed into Worker 2's local queue.

The scheduler makes this decision at submission time.

## SchedulingPolicy

The low-level scheduler supports four worker-selection policies:

```cpp
enum class SchedulingPolicy : std::uint8_t
{
  round_robin,
  least_loaded,
  affinity,
  affinity_then_least_loaded
};
```

They control how a `Scheduler` selects the destination worker.

The default policy is:

```cpp
vix::threadpool::SchedulingPolicy::affinity_then_least_loaded
```

This is also the policy currently used internally by `ThreadPool`.

## ThreadPool uses a fixed scheduling policy

`ThreadPoolConfig` does not currently expose a scheduling-policy field.

When a `ThreadPool` creates its internal scheduler, it uses:

```cpp
vix::threadpool::default_scheduling_policy();
```

which returns:

```cpp
vix::threadpool::SchedulingPolicy::affinity_then_least_loaded
```

Therefore, normal `ThreadPool` users currently get this behavior:

```text
valid affinity hint
      ↓
use affinity worker

no affinity hint
      ↓
use least-loaded worker
```

The other scheduling policies are available through the lower-level `Scheduler` API.

## Round-robin

`round_robin` distributes submissions across workers in sequence.

For four workers:

```text
task 1 → Worker 1
task 2 → Worker 2
task 3 → Worker 3
task 4 → Worker 4
task 5 → Worker 1
task 6 → Worker 2
```

The scheduler maintains an atomic cursor and advances it for each worker selection.

Conceptually:

```text
next worker
    ↓
0 → 1 → 2 → 3 → 0 → 1 ...
```

Round-robin does not inspect queue sizes or task duration.

It provides predictable distribution based only on submission order.

## Least loaded

`least_loaded` chooses the worker with the smallest local queue.

Suppose:

```text
Worker 1 queue size = 5
Worker 2 queue size = 2
Worker 3 queue size = 4
Worker 4 queue size = 3
```

The scheduler selects:

```text
Worker 2
```

because its queue contains the fewest pending tasks.

This comparison uses:

```text
worker queue size
```

It does not measure:

```text
current task execution time
CPU usage
task complexity
predicted task duration
```

A worker executing a long-running task can therefore still appear lightly loaded if its local queue is small.

## Load means queue length

The scheduling model uses local queue length as its load signal.

Conceptually:

```text
load(worker) = worker.size()
```

This means:

```text
Worker 1
active task: expensive
queued: 0

Worker 2
active task: cheap
queued: 2
```

can cause least-loaded selection to prefer Worker 1 because:

```text
Worker 1 queue size = 0
Worker 2 queue size = 2
```

The scheduler does not estimate how much work remains in an active callable.

This makes least-loaded scheduling simple and inexpensive, but queue length should not be interpreted as a complete CPU-load measurement.

## Affinity

The `affinity` policy prefers the worker identified by a task's affinity hint.

A task can provide affinity through `TaskOptions`:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
  vix::threadpool::WorkerId{2}
);

auto future = pool.submit([](){
  return 42;
}, options);
```

The scheduler converts the affinity value into a worker index.

Worker IDs begin at `1`.

For a four-worker scheduler:

```text
WorkerId 1 → worker index 0
WorkerId 2 → worker index 1
WorkerId 3 → worker index 2
WorkerId 4 → worker index 3
```

`WorkerId{0}` represents no affinity because zero is `invalid_worker_id`.

See [Worker Affinity](/modules/threadpool/worker-affinity) for the complete mapping behavior.

## Affinity policy fallback

With:

```cpp
vix::threadpool::SchedulingPolicy::affinity
```

the scheduler first tries task affinity.

If no affinity is present, it falls back to round-robin scheduling.

Conceptually:

```text
task
 ↓
has affinity?
 ┌────┴────┐
yes        no
 │          │
 ▼          ▼
affinity   round-robin
worker
```

This differs from the default `ThreadPool` policy, which falls back to least-loaded selection.

## Affinity then least loaded

`affinity_then_least_loaded` combines worker locality with queue balancing.

Its decision is:

```text
task
 ↓
has affinity?
 ┌────┴────┐
yes        no
 │          │
 ▼          ▼
affinity   least loaded
worker     worker
```

This is the current default scheduling policy.

For ordinary tasks without affinity:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

the least-loaded worker is selected.

For a task with affinity:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
  vix::threadpool::WorkerId{3}
);

auto future = pool.submit([](){
  return 42;
}, options);
```

the affinity mapping takes precedence over queue load.

## Affinity takes precedence over load

With the default policy, affinity is honored even when another worker has a smaller queue.

For example:

```text
task affinity = Worker 3

Worker 1 queue size = 0
Worker 2 queue size = 1
Worker 3 queue size = 8
Worker 4 queue size = 2
```

The scheduler still selects:

```text
Worker 3
```

The affinity hint therefore expresses a stronger placement preference than load balancing.

Do not add affinity merely to spread work evenly. The scheduler already handles ordinary distribution through least-loaded selection.

Use affinity when worker locality itself matters.

## Selection happens before queue insertion

Scheduling chooses the destination worker first:

```text
task
 ↓
Scheduler
 ↓
select worker
 ↓
worker.submit(task)
 ↓
local queue
```

The scheduler does not place the task into a global queue and choose a worker later.

This has several consequences:

```text
worker selection happens once
task enters one local queue
queued task stays associated with that worker
```

The current runtime does not continuously rebalance queued tasks after submission.

## There is no global task queue

The runtime uses one queue per worker:

```text
                  Scheduler
              ┌──────┼──────┐
              ▼      ▼      ▼
          Worker 1 Worker 2 Worker 3
              │      │      │
              ▼      ▼      ▼
           Queue 1 Queue 2 Queue 3
```

This differs from a design where every worker consumes from one shared queue:

```text
            Global Queue
          ┌─────┼─────┐
          ▼     ▼     ▼
       Worker Worker Worker
```

Vix ThreadPool currently uses the first model.

The scheduler attempts to make a good placement decision when work is submitted.

## No work stealing

Workers currently execute work only from their own local queues.

An idle worker does not take a queued task from another worker.

For example:

```text
Worker 1
active: 1
queued: 5

Worker 2
active: 0
queued: 0
```

Worker 2 does not automatically steal one of Worker 1's five queued tasks.

This means task placement remains fixed after scheduling.

The runtime currently relies on submission-time worker selection rather than post-submission work stealing.

## Concurrent submissions

Multiple threads can submit work concurrently.

The scheduling state used by round-robin is atomic, and worker queues provide their own synchronization for task insertion and removal.

For ordinary `ThreadPool` scheduling, concurrent callers can submit work through the same pool:

```text
Thread A ──┐
Thread B ──┼──► ThreadPool ──► Scheduler ──► Workers
Thread C ──┘
```

The exact execution order across those submissions is not globally deterministic.

Concurrency means several workers can begin different tasks independently.

## Scheduling does not guarantee execution order

A scheduling decision determines the destination worker.

It does not establish a total ordering across the pool.

Suppose:

```text
Task A → Worker 1
Task B → Worker 2
```

The runtime does not guarantee whether A or B begins first.

Both worker threads execute independently.

This applies even when the tasks were submitted sequentially:

```cpp
pool.post(task_a);
pool.post(task_b);
```

Submission order alone does not provide a global execution-order guarantee when tasks can reach different workers.

If one operation must happen after another, express that dependency explicitly rather than relying on scheduling order.

## Priority and scheduling solve different problems

Worker selection and task priority happen at different stages.

```text
Scheduler
    ↓
choose worker
    ↓
Worker queue
    ↓
order by priority
```

Scheduling answers:

```text
Which worker receives this task?
```

Priority answers:

```text
Where does this task appear relative to other queued tasks
inside that worker?
```

For example:

```text
Worker 1
  high task

Worker 2
  normal task
```

the normal-priority task can start at the same time as the high-priority task.

Priority therefore does not override the independent execution of another worker.

See [Priorities](/modules/threadpool/priorities).

## FIFO applies only inside one local priority level

Within a worker queue, tasks are ordered by priority first and sequence number second.

For equal priority:

```text
Task A sequence 10
Task B sequence 11
Task C sequence 12
```

the queue preserves:

```text
A
↓
B
↓
C
```

This FIFO relationship is local to that worker queue.

It does not create FIFO ordering between tasks placed on different workers.

## Worker IDs and worker indexes

The scheduler uses both worker IDs and zero-based indexes.

For four workers:

```text
index 0 → WorkerId 1
index 1 → WorkerId 2
index 2 → WorkerId 3
index 3 → WorkerId 4
```

`WorkerId` is the public identity type:

```cpp
using WorkerId = std::uint32_t;
```

and:

```cpp
vix::threadpool::invalid_worker_id
```

has value zero.

This distinction matters when working with affinity or `this_worker`.

## Low-level Scheduler

`Scheduler` is publicly available for code that needs direct control over scheduling configuration.

A scheduler can be configured independently:

```cpp
vix::threadpool::SchedulerConfig config;
config.worker_count = 4;
config.scheduling_policy =
    vix::threadpool::SchedulingPolicy::round_robin;

vix::threadpool::Scheduler scheduler(config);
```

Workers are created during scheduler construction but are not started automatically.

Start them explicitly:

```cpp
if (!scheduler.start())
{
  return 1;
}
```

`ThreadPool` manages this lifecycle automatically, so most application code should prefer `ThreadPool`.

Direct `Scheduler` usage is appropriate only when the lower-level scheduling layer is required.

## SchedulerConfig

The low-level configuration contains:

```text
worker_count
max_queue_size_per_worker
scheduling_policy
rejection_policy
drain_on_stop
worker_name_prefix
```

For example:

```cpp
vix::threadpool::SchedulerConfig config;

config.worker_count = 4;
config.max_queue_size_per_worker = 256;
config.scheduling_policy =
    vix::threadpool::SchedulingPolicy::round_robin;
```

A zero worker count is normalized to one.

An empty worker-name prefix is normalized to:

```text
vix-tp
```

This configuration belongs to direct `Scheduler` use. It is not the same structure as `ThreadPoolConfig`.

## Scheduling policy helpers

The module provides:

```cpp
vix::threadpool::default_scheduling_policy();
```

which returns:

```cpp
vix::threadpool::SchedulingPolicy::affinity_then_least_loaded
```

You can test whether a policy uses affinity:

```cpp
const bool usesAffinity = vix::threadpool::uses_affinity(
  vix::threadpool::SchedulingPolicy::affinity
);
```

The result is `true` for:

```text
affinity
affinity_then_least_loaded
```

You can test whether it uses queue-load balancing:

```cpp
const bool balancesLoad = vix::threadpool::uses_load_balancing(
  vix::threadpool::SchedulingPolicy::least_loaded
);
```

The result is `true` for:

```text
least_loaded
affinity_then_least_loaded
```

## Readable policy names

Use `to_string()` when a readable scheduling-policy name is needed:

```cpp
const char* name = vix::threadpool::to_string(
  vix::threadpool::SchedulingPolicy::least_loaded
);
```

The result is:

```text
least_loaded
```

The available names are:

```text
round_robin
least_loaded
affinity
affinity_then_least_loaded
```

An unknown enum value produces:

```text
unknown
```

## Worker queue capacity affects scheduling outcomes

A scheduler can select a worker whose bounded queue cannot accept another task.

For example:

```text
Worker 1 queue size = 4, capacity = 4
Worker 2 queue size = 5, capacity = 8
```

least-loaded selection sees:

```text
4 < 5
```

and selects Worker 1.

The selected worker can then reject the task because its queue is already full.

The current least-loaded algorithm compares queue sizes. It does not filter workers according to remaining queue capacity before selecting one.

Queue-capacity behavior and rejection are covered in [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Scheduling and active tasks

The least-loaded policy compares:

```cpp
worker->size()
```

which represents queued tasks.

It does not include the worker's currently executing task in the selection value.

Consider:

```text
Worker 1
active = 1
queued = 0

Worker 2
active = 0
queued = 1
```

least-loaded scheduling sees:

```text
Worker 1 size = 0
Worker 2 size = 1
```

and selects Worker 1.

This is the current definition of scheduling load.

Pool metrics expose active work separately from pending work.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Choosing a scheduling strategy

For normal `ThreadPool` use, no scheduling decision is required.

The current policy already provides:

```text
affinity when explicitly requested
        +
least-loaded selection otherwise
```

When using the low-level `Scheduler` directly:

Use `round_robin` when predictable worker rotation is more important than queue-load information.

Use `least_loaded` when submissions should prefer the worker with the shortest current queue.

Use `affinity` when affinity should be honored and non-affinity tasks should use round-robin placement.

Use `affinity_then_least_loaded` when affinity should be honored while ordinary tasks should use queue-based balancing.

## Scheduling model summary

The current `ThreadPool` path is:

```text
submit task
    ↓
has affinity?
 ┌──────┴──────┐
yes            no
 │              │
 ▼              ▼
map affinity   compare
to worker      queue sizes
 │              │
 └──────┬───────┘
        ▼
 selected worker
        ↓
 worker local queue
        ↓
 priority ordering
        ↓
 worker thread executes
```

The important properties are:

- `ThreadPool` currently uses `affinity_then_least_loaded`.
- Worker selection occurs when work is submitted.
- Each worker owns a separate queue.
- Least-loaded scheduling compares queued task counts.
- Active task cost is not part of the load calculation.
- Affinity takes precedence over load balancing.
- There is no global task queue.
- There is currently no work stealing.
- Scheduling does not guarantee global execution order.
- Priority controls ordering inside the selected worker queue, not worker selection.

Continue with [Priorities](/modules/threadpool/priorities) for local queue ordering or [Worker Affinity](/modules/threadpool/worker-affinity) for explicit worker placement.
