# Queue and Rejection Policies

Each ThreadPool worker owns a local task queue.

When the scheduler selects a worker, the task is submitted to that worker's queue:

```text id="9mkri4"
ThreadPool
    ↓
Scheduler
    ↓
selected Worker
    ↓
local TaskQueue
```

Queue capacity determines whether additional work can be accepted. Rejection behavior determines what happens when submission cannot proceed.

The current `ThreadPool` uses priority-based local queues and the default rejection behavior.

## One queue per worker

The runtime does not use one global queue.

For a four-worker pool:

```text id="q9rrta"
Worker 1 → TaskQueue 1
Worker 2 → TaskQueue 2
Worker 3 → TaskQueue 3
Worker 4 → TaskQueue 4
```

A submitted task is first assigned to one worker by the scheduler.

It is then inserted into that worker's local queue.

This means queue capacity is also local to each worker.

## Unbounded queues

By default:

```cpp id="vsn183"
vix::threadpool::ThreadPoolConfig config;

config.max_queue_size == 0;
```

A queue size of zero means unbounded.

For example:

```cpp id="9vg9vf"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 0;

vix::threadpool::ThreadPool pool(config);
```

Each worker receives an unbounded local queue.

Conceptually:

```text id="csbp2t"
Worker 1 → unbounded
Worker 2 → unbounded
Worker 3 → unbounded
Worker 4 → unbounded
```

Unbounded does not mean unlimited physical memory. It means the ThreadPool does not impose a configured queue-length limit.

## Bounded queues

Set `max_queue_size` to a positive value to bound each worker queue:

```cpp id="1xjdwm"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.max_queue_size = 128;

vix::threadpool::ThreadPool pool(config);
```

This creates:

```text id="5hsfxe"
Worker 1 → capacity 128
Worker 2 → capacity 128
Worker 3 → capacity 128
Worker 4 → capacity 128
```

The value is applied independently to each worker.

It is not a global 128-task capacity for the entire pool.

## Queue capacity counts pending tasks

The queue capacity applies to tasks waiting in the local queue.

A task that has already been removed by the worker and is executing is no longer part of that queue size.

For example:

```text id="w92u4t"
Worker

active task: 1

queued:
  Task A
  Task B
  Task C
```

the queue size is:

```text id="uc55c4"
3
```

not:

```text id="uc21if"
4
```

This distinction also affects least-loaded worker selection.

See [Scheduling Model](/modules/threadpool/scheduling).

## Full queue

A bounded queue is full when:

```text id="767q8f"
queue size >= max queue size
```

For example:

```text id="mmceuf"
capacity = 2

queued:
  Task A
  Task B
```

the queue is full.

A new push is rejected until space becomes available.

When the worker removes one task:

```text id="gd6by8"
capacity = 2

running:
  Task A

queued:
  Task B
```

the queue size becomes one, so another task can be accepted.

## TaskQueue

`TaskQueue` is the low-level thread-safe queue used by each worker.

Create an unbounded queue with:

```cpp id="39puo9"
vix::threadpool::TaskQueue queue;
```

or specify a capacity:

```cpp id="dp34xb"
vix::threadpool::TaskQueue queue(128);
```

Inspect its configuration with:

```cpp id="qq6e47"
const bool bounded = queue.bounded();
const std::size_t capacity = queue.max_size();
```

For an unbounded queue:

```text id="xpp599"
bounded()  false
max_size() 0
```

For:

```cpp id="89lw1p"
vix::threadpool::TaskQueue queue(128);
```

the values are:

```text id="un4yok"
bounded()  true
max_size() 128
```

Normal application code does not need to construct `TaskQueue` directly. Workers manage their queues automatically.

## Queue admission

`TaskQueue::push()` accepts a task only when:

```text id="3lr4hj"
task is schedulable
        +
queue has capacity
```

A schedulable task must:

```text id="i4gjqn"
have a valid TaskId
have a callable
not already be terminal
```

If accepted, the queue marks the task as:

```text id="btx42z"
queued
```

before inserting it.

Conceptually:

```text id="66hklp"
Task
 ↓
schedulable?
 ┌────┴────┐
no        yes
│          │
reject     ▼
         queue full?
         ┌────┴────┐
        yes        no
         │          │
       reject     mark queued
                    ↓
                  insert
```

## Priority queue ordering

The current `TaskQueue` always uses `TaskCmp`.

The comparator orders tasks by:

```text id="m9b8ob"
1. priority
2. sequence number
```

Higher-priority tasks come first.

For equal priority, smaller sequence numbers come first.

For example:

```text id="rviw0b"
high,   sequence 12
normal, sequence 4
normal, sequence 9
low,    sequence 2
```

the pop order is:

```text id="6pzxu0"
high, sequence 12
       ↓
normal, sequence 4
       ↓
normal, sequence 9
       ↓
low, sequence 2
```

See [Priorities](/modules/threadpool/priorities).

## The queue uses a heap

Internally, `TaskQueue` stores tasks in a `std::vector` managed as a heap.

Conceptually:

```text id="75kwj7"
vector<Task>
     +
TaskCmp
     ↓
priority heap
```

This allows the queue to extract move-only `Task` objects while preserving priority ordering.

The physical order inside the vector should not be interpreted as execution order.

Use:

```cpp id="frq7j5"
queue.pop();
```

to obtain the next task according to the queue comparator.

## Pop the next task

`pop()` removes and returns the next queued task:

```cpp id="wcdj5u"
auto task = queue.pop();
```

When the queue is empty:

```cpp id="u3hjcy"
auto task = queue.pop();

if (!task)
{
  // No queued task.
}
```

the result is `std::nullopt`.

Workers use a related operation that removes a task while incrementing their active-task counter.

Ordinary application code does not need to perform this operation directly.

## Peek at the next task

`peek()` returns a pointer to the next task without removing it:

```cpp id="7ndgv2"
const auto* task = queue.peek();
```

When the queue is empty:

```text id="6ez78i"
nullptr
```

is returned.

The returned pointer is only valid until the queue is modified.

Do not retain it while another thread can push, pop, or clear the queue.

## Clear a queue

`TaskQueue::clear()` removes every queued task:

```cpp id="43kop7"
const std::size_t removed = queue.clear();
```

The returned value is the number of tasks removed.

At the ThreadPool level:

```cpp id="7l623m"
const std::size_t removed = pool.clear();
```

clears the local queues of all workers and returns the total number of queued tasks removed.

Running tasks are not affected.

Conceptually:

```text id="z5c4cc"
Worker 1 queue ──┐
Worker 2 queue ──┼──► clear()
Worker 3 queue ──┘
                     ↓
                queued tasks removed
```

`clear()` does not forcibly interrupt active work.

For result-producing work, removing a queued task also means its callable never reaches normal execution. Application code should not use `clear()` as a substitute for a result-aware cancellation protocol.

See [Cancellation](/modules/threadpool/cancellation).

## Change low-level queue capacity

A direct `TaskQueue` can change capacity:

```cpp id="cmge7y"
queue.set_max_size(64);
```

A value of zero makes it unbounded:

```cpp id="xucija"
queue.set_max_size(0);
```

If the new capacity is smaller than the number of tasks already queued, existing tasks are kept.

For example:

```text id="38ua2l"
current size = 5
new capacity = 2
```

the five existing tasks remain.

New pushes are rejected until the queue size drops below two.

The queue does not remove existing tasks merely because capacity was reduced.

## Worker queue capacity

A `Worker` exposes its local queue state through:

```cpp id="ii1b04"
worker.size();
worker.empty();
worker.full();
worker.max_queue_size();
```

Its capacity can also be changed directly:

```cpp id="yvsjbm"
worker.set_max_queue_size(64);
```

This is part of the lower-level worker API.

For normal `ThreadPool` use, configure queue capacity before construction:

```cpp id="ca940l"
vix::threadpool::ThreadPoolConfig config;
config.max_queue_size = 64;

vix::threadpool::ThreadPool pool(config);
```

## Worker rejection

A worker rejects a task when any of these conditions applies:

```text id="mi7z8u"
task is not schedulable

worker is stopping
and task does not allow after-stop execution

local queue cannot accept the task
```

In the normal queue-full case:

```text id="12o0pu"
Scheduler
    ↓
select Worker
    ↓
Worker::submit()
    ↓
queue full
    ↓
false
```

The worker increments its rejected-task counter.

The scheduler also records the failed submission.

## Scheduler rejection

The scheduler can reject work before it reaches a worker.

Examples include:

```text id="jt9s7o"
task is not schedulable
scheduler is stopped
no worker can be selected
```

The low-level `Scheduler` has a configurable `RejectionPolicy` for these rejection paths.

The policies are:

```cpp id="7aivxp"
enum class RejectionPolicy : std::uint8_t
{
  reject,
  caller_runs,
  discard
};
```

The default is:

```cpp id="84xgpn"
vix::threadpool::RejectionPolicy::reject
```

## `reject`

`reject` reports that the scheduler did not handle the task.

```text id="zcx2wd"
submission cannot proceed
        ↓
RejectionPolicy::reject
        ↓
Scheduler::submit() returns false
```

This is the default behavior.

For ordinary `ThreadPool::post()`:

```cpp id="fdihzp"
const bool accepted = pool.post([](){
  perform_work();
});
```

the boolean reports the failure.

For `submit()` and `handle()`, ThreadPool converts the failed scheduler submission into an asynchronous rejection result.

## Rejected `post()`

`post()` directly exposes acceptance:

```cpp id="fi6qxx"
const bool accepted = pool.post([](){
  perform_work();
});

if (!accepted)
{
  // Work was not accepted.
}
```

This is why the return value should normally be checked when task admission matters.

A rejected posted callable is not executed through the normal worker path.

## Rejected `submit()`

`submit()` still returns a valid `Future` when task submission fails.

```cpp id="dctyta"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto future = pool.submit([](){
  return 42;
});
```

The Future is completed with:

```text id="cb5mh8"
status = rejected
result = rejected
error  = rejected
```

Calling:

```cpp id="zok1id"
future.get();
```

throws `std::system_error`.

The caller therefore receives the rejection through the asynchronous result instead of through a separate boolean.

## Rejected `handle()`

`handle()` behaves similarly:

```cpp id="9zzkxd"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto handle = pool.handle([](){
  return 42;
});
```

The handle remains a valid result/control object, but its Future represents a rejected submission.

```text id="4dhp4j"
handle.valid()  true
handle.ready()  true
status          rejected
result          rejected
error           rejected
```

`valid()` must therefore not be used as an acceptance test.

## `caller_runs`

The low-level rejection policy:

```cpp id="hxfovv"
vix::threadpool::RejectionPolicy::caller_runs
```

runs certain rejected tasks synchronously on the thread calling `Scheduler::submit()`.

Conceptually:

```text id="tmp8iq"
scheduler cannot accept normally
          ↓
caller_runs
          ↓
Task::run()
          ↓
submitting thread executes task
```

This can turn an asynchronous submission point into synchronous work.

It should only be selected when blocking the submitting thread is acceptable.

## `caller_runs` does not use a worker

When `caller_runs` is applied:

```text id="1m9shf"
submitting thread
      ↓
Task::run()
```

The task does not enter a worker queue.

It therefore does not execute as a normal ThreadPool worker task.

Code relying on worker-local context should not assume that:

```cpp id="ag8wq7"
vix::threadpool::this_worker::inside();
```

will be `true` merely because the task originated from a scheduler.

The callable is running on the submitting thread.

## Current `caller_runs` limitation

The current scheduler applies its rejection policy to failures detected directly by the scheduler, such as:

```text id="ycn1ze"
invalid or terminal task
scheduler not running
no worker selected
```

However, if a worker was successfully selected and then rejects the task, `Scheduler::submit()` currently returns `false` directly.

That path includes a full local worker queue.

Conceptually:

```text id="8zf47l"
Scheduler selects Worker
        ↓
Worker::submit()
        ↓
queue full
        ↓
false
        ↓
Scheduler returns false
```

The current implementation does not pass that failure through `handle_rejected_task()`.

Therefore:

```text id="zjo2et"
RejectionPolicy::caller_runs
```

does not currently guarantee caller-thread execution when rejection is caused by a full selected worker queue.

Do not rely on `caller_runs` as queue-overflow handling in the current implementation.

## `discard`

The low-level policy:

```cpp id="gvgn9y"
vix::threadpool::RejectionPolicy::discard
```

treats certain rejected tasks as handled without executing them.

Conceptually:

```text id="m3y2tp"
scheduler cannot accept task
        ↓
discard
        ↓
task destroyed
        ↓
Scheduler::submit() returns true
```

This is suitable only when silent task loss is explicitly acceptable.

It should not be used for work whose completion or result is required for correctness.

## Current `discard` limitation

Like `caller_runs`, `discard` is currently applied only through the scheduler's internal rejection handler.

A failure returned from:

```text id="7b35vl"
Worker::submit()
```

does not pass through that handler.

A queue-full failure therefore returns `false` even if the scheduler was configured with:

```cpp id="eac8n4"
vix::threadpool::RejectionPolicy::discard
```

The current policy implementation should not be interpreted as a universal handler for every possible worker rejection.

## Configure low-level rejection policy

`RejectionPolicy` is configured through `SchedulerConfig`.

For example:

```cpp id="pi7wzv"
vix::threadpool::SchedulerConfig config;
config.worker_count = 4;
config.rejection_policy =
        vix::threadpool::RejectionPolicy::caller_runs;

vix::threadpool::Scheduler scheduler(config);
```

The scheduler must then be started explicitly:

```cpp id="snjo4c"
if (!scheduler.start())
{
  return 1;
}
```

This is a low-level API.

Most applications should use `ThreadPool`.

## ThreadPool rejection policy

`ThreadPoolConfig` does not currently expose a `RejectionPolicy` field.

When `ThreadPool` builds its scheduler configuration, it uses:

```cpp id="wp6709"
vix::threadpool::default_rejection_policy();
```

which is:

```cpp id="4v6l4r"
vix::threadpool::RejectionPolicy::reject
```

Therefore ordinary `ThreadPool` users currently use rejection behavior.

For example:

```cpp id="5hvi83"
vix::threadpool::ThreadPoolConfig config;
config.max_queue_size = 32;

vix::threadpool::ThreadPool pool(config);
```

does not provide a configuration switch to select `caller_runs` or `discard`.

Those policies are currently available only through direct `Scheduler` configuration.

## RejectionPolicy helpers

The module provides helpers for inspecting rejection policies.

Check caller execution:

```cpp id="yb1ji1"
const bool result = vix::threadpool::runs_on_caller(
        vix::threadpool::RejectionPolicy::caller_runs
);
```

The result is:

```text id="4w0y2q"
true
```

Check discard behavior:

```cpp id="jn92t0"
const bool result = vix::threadpool::discards_task(
        vix::threadpool::RejectionPolicy::discard
);
```

Check explicit rejection:

```cpp id="vyui98"
const bool result = vix::threadpool::reports_rejection(
        vix::threadpool::RejectionPolicy::reject
);
```

Each helper identifies the enum value. It does not change the current implementation limitations described above.

## Readable rejection policy names

Use:

```cpp id="n60tpg"
const char* name = vix::threadpool::to_string(
        vix::threadpool::RejectionPolicy::caller_runs
);
```

The available names are:

```text id="q0n7gw"
reject
caller_runs
discard
```

Unknown enum values produce:

```text id="fagw0a"
unknown
```

## QueuePolicy

The public API also defines:

```cpp id="4rnfsa"
enum class QueuePolicy : std::uint8_t
{
  priority,
  fifo,
  lifo
};
```

The intended meanings are:

```text id="qtf9dd"
priority
  priority first, FIFO for equal priority

fifo
  first in, first out

lifo
  last in, first out
```

The default helper returns:

```cpp id="e9ag8t"
vix::threadpool::default_queue_policy();
```

which is:

```cpp id="1qowfk"
vix::threadpool::QueuePolicy::priority
```

## Current QueuePolicy behavior

`QueuePolicy` is currently exposed as a public enum and helper API, but it is not connected to `TaskQueue`, `Worker`, `SchedulerConfig`, or `ThreadPoolConfig`.

The actual `TaskQueue` always uses:

```cpp id="gt8ha9"
vix::threadpool::TaskCmp
```

which provides:

```text id="9690ng"
priority first
        +
FIFO sequence for equal priority
```

Therefore the effective current queue behavior is always:

```text id="yr2jvf"
QueuePolicy::priority
```

even though the `fifo` and `lifo` enum values exist.

Do not currently rely on selecting FIFO-only or LIFO queue behavior through `QueuePolicy`.

## QueuePolicy helpers

The enum has helpers that describe its values:

```cpp id="37vzcc"
vix::threadpool::uses_priority(
        vix::threadpool::QueuePolicy::priority
);

vix::threadpool::is_fifo(
        vix::threadpool::QueuePolicy::fifo
);

vix::threadpool::is_lifo(
        vix::threadpool::QueuePolicy::lifo
);
```

It also provides readable names:

```cpp id="dfzp5u"
const char* name = vix::threadpool::to_string(
        vix::threadpool::QueuePolicy::priority
);
```

which returns:

```text id="h47x1h"
priority
```

These helpers currently describe the enum itself. They do not configure a runtime queue.

## Queue-full behavior and scheduling

With the default least-loaded fallback, the scheduler chooses the worker with the smallest queue.

Suppose:

```text id="zqrspy"
Worker 1
size     = 4
capacity = 4

Worker 2
size     = 5
capacity = 8
```

The scheduler compares:

```text id="2xmz2s"
4 < 5
```

and can select Worker 1.

Worker 1 then rejects the task because its queue is full.

The current selection algorithm does not first exclude workers whose queues have reached capacity.

This means the presence of another worker with available capacity does not guarantee that a submission will be retried there.

## No automatic retry on another worker

Once the scheduler selects a worker:

```text id="nwrurs"
task
 ↓
Worker 1 selected
 ↓
Worker 1 rejects
```

the current scheduler does not automatically continue with:

```text id="sfda2a"
try Worker 2
try Worker 3
...
```

The submission fails at that point.

This is important when using small bounded queues under high submission pressure.

## Affinity and full queues

Affinity makes this behavior even more direct.

Suppose a task targets Worker 2:

```cpp id="6dg0lc"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{2}
);
```

and Worker 2 is full.

The scheduler still selects Worker 2 because affinity takes precedence.

If Worker 2 rejects the task:

```text id="is245j"
submission fails
```

The task is not redirected to another worker.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Priority does not bypass capacity

Suppose a queue is full:

```text id="x9pjgz"
capacity = 2

queued:
  low
  normal
```

and a new task has:

```text id="3ky4ot"
priority = highest
```

The queue does not evict the low-priority task.

The highest-priority task is rejected because admission happens before priority ordering can matter.

```text id="5m2hjp"
admission
   ↓
queue full?
   │
   ├── yes → reject
   │
   └── no
        ↓
priority ordering
```

Priority only controls accepted work.

## Queue rejection metrics

Workers count rejected submission attempts.

The scheduler also maintains aggregate rejection information.

These values are exposed through pool metrics and statistics:

```cpp id="kn8nvv"
const auto metrics = pool.metrics();
const auto stats = pool.stats();
```

This allows an application to observe pressure on bounded queues without inspecting each worker directly.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Choosing a queue capacity

An unbounded queue:

```cpp id="31y4t6"
config.max_queue_size = 0;
```

avoids ThreadPool-level queue-full rejection, but allows pending work to grow according to submission pressure and available memory.

A bounded queue:

```cpp id="7as01z"
config.max_queue_size = 256;
```

limits pending work per worker but requires the application to handle rejected submissions.

The choice depends on the workload.

Conceptually:

```text id="68o9l8"
unbounded
    ↓
submission bursts can accumulate
    ↓
memory is the practical limit


bounded
    ↓
pending work is limited
    ↓
submission can fail under pressure
```

Queue capacity is therefore part of backpressure design.

## Handle `post()` rejection

When using bounded queues, check the return value when the work matters:

```cpp id="f1unf5"
const bool accepted = pool.post([](){
  perform_work();
});

if (!accepted)
{
  handle_rejection();
}
```

Ignoring the boolean means accepting the possibility that the posted callable was never queued.

## Handle `submit()` rejection

For result-producing work, use the Future error path:

```cpp id="qw0fkx"
auto future = pool.submit([](){
  return 42;
});

try
{
  const int value = future.get();
}
catch (const std::system_error&)
{
  // The asynchronous operation can report rejection.
}
```

If the application needs to distinguish rejection from other ThreadPool errors, inspect:

```cpp id="tg011v"
future.error();
```

before consuming the result.

See [Errors](/modules/threadpool/errors).

## Current model summary

Queueing and rejection follow this path:

```text id="vj3lqg"
task submitted
      ↓
Scheduler
      ↓
submission valid?
      │
      ├── no → scheduler rejection policy
      │
      └── yes
            ↓
      scheduler running?
            │
            ├── no → scheduler rejection policy
            │
            └── yes
                  ↓
             select worker
                  │
                  ├── none → scheduler rejection policy
                  │
                  └── worker
                        ↓
                  Worker::submit()
                        ↓
                   queue full?
                    ┌────┴────┐
                   yes        no
                    │          │
                 return      enqueue
                 false         ↓
                           priority order
```

The important properties are:

- Every worker owns a separate local queue.
- `max_queue_size` is applied per worker.
- Zero capacity means unbounded.
- Capacity counts queued tasks, not the currently active task.
- The current queue always uses priority followed by FIFO sequence ordering.
- `QueuePolicy::fifo` and `QueuePolicy::lifo` exist but are not wired into the runtime.
- A full queue rejects new work without evicting lower-priority tasks.
- The scheduler does not automatically retry another worker after worker rejection.
- The default `ThreadPool` rejection policy is `reject`.
- `ThreadPoolConfig` does not currently expose rejection-policy selection.
- `caller_runs` and `discard` are available through direct `Scheduler` configuration.
- In the current implementation, those policies are not applied when rejection occurs inside the selected worker, including queue-full rejection.

Continue with [Cancellation](/modules/threadpool/cancellation) for cooperative task cancellation or [Deadlines](/modules/threadpool/deadlines) for time-based execution limits.
