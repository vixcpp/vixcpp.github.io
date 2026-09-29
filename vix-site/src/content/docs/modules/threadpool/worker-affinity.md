# Worker Affinity

Worker affinity lets a task express a preference for a specific worker.

Set affinity through `TaskOptions`:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{2}
);

auto future = pool.submit([](){
  return 42;
}, options);
```

With the default `ThreadPool` scheduling policy, a valid affinity value is considered before normal load balancing.

## WorkerId

Workers are identified with:

```cpp
vix::threadpool::WorkerId
```

which is defined as:

```cpp
using WorkerId = std::uint32_t;
```

The value:

```cpp
vix::threadpool::invalid_worker_id
```

is reserved to represent the absence of a worker.

Its numeric value is:

```text
0
```

Worker IDs created by the scheduler begin at `1`.

For a four-worker pool:

```text
worker index 0 → WorkerId 1
worker index 1 → WorkerId 2
worker index 2 → WorkerId 3
worker index 3 → WorkerId 4
```

Worker indexes are zero-based.

Worker IDs are one-based.

## Check a WorkerId

Use:

```cpp
vix::threadpool::is_valid_worker_id(id);
```

For example:

```cpp
const bool valid = vix::threadpool::is_valid_worker_id(
        vix::threadpool::WorkerId{2}
);
```

The result is:

```text
true
```

For:

```cpp
const bool valid = vix::threadpool::is_valid_worker_id(
        vix::threadpool::invalid_worker_id
);
```

the result is:

```text
false
```

`is_valid_worker_id()` only checks whether the value is different from zero.

It does not check whether the current pool actually contains a worker with that numeric ID.

## Default task affinity

A default `TaskOptions` has no worker affinity:

```cpp
vix::threadpool::TaskOptions options;
```

Its affinity is:

```cpp
options.affinity == vix::threadpool::invalid_worker_id
```

and:

```cpp
options.has_affinity();
```

returns:

```text
false
```

Without affinity, the normal `ThreadPool` scheduler chooses a worker using its least-loaded policy.

## Set affinity

Use the convenience constructor:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{2}
);
```

or modify an existing options object:

```cpp
vix::threadpool::TaskOptions options;

options.set_affinity(
        vix::threadpool::WorkerId{2}
);
```

The same options can be used with `post()`, `submit()`, and `handle()`.

```cpp
auto future = pool.submit([](){
  return 42;
}, options);
```

## Verify the executing worker

Code running inside a worker can inspect its current worker ID through `this_worker`.

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{2}
  );

  auto future = pool.submit([](){
    return vix::threadpool::this_worker::id();
  }, options);

  return future.get() == vix::threadpool::WorkerId{2} ? 0 : 1;
}
```

With four workers, `WorkerId{2}` maps to the second worker.

The callable therefore observes:

```text
2
```

as its worker ID.

## Default ThreadPool behavior

The current `ThreadPool` uses:

```cpp
vix::threadpool::SchedulingPolicy::affinity_then_least_loaded
```

The scheduling decision is:

```text
task submitted
      ↓
has affinity?
  ┌───────┴───────┐
 yes              no
  │                │
  ▼                ▼
map affinity    choose worker
to worker       with smallest queue
```

Affinity therefore takes precedence over ordinary load balancing.

See [Scheduling Model](/modules/threadpool/scheduling).

## Affinity mapping

The scheduler converts a task affinity into a worker index using:

```text
(affinity - 1) % worker_count
```

For four workers:

```text
WorkerId 1
(1 - 1) % 4 = 0
              ↓
worker index 0


WorkerId 2
(2 - 1) % 4 = 1
              ↓
worker index 1


WorkerId 3
(3 - 1) % 4 = 2
              ↓
worker index 2


WorkerId 4
(4 - 1) % 4 = 3
              ↓
worker index 3
```

This gives the natural one-based WorkerId mapping for IDs inside the worker count.

## Affinity values wrap around

Affinity is not rejected merely because its numeric value is larger than the worker count.

The modulo mapping wraps it into the available worker set.

For a four-worker pool:

```text
WorkerId 1 → Worker 1
WorkerId 2 → Worker 2
WorkerId 3 → Worker 3
WorkerId 4 → Worker 4
WorkerId 5 → Worker 1
WorkerId 6 → Worker 2
WorkerId 7 → Worker 3
WorkerId 8 → Worker 4
```

For example:

```text
WorkerId 5

(5 - 1) % 4
    ↓
4 % 4
    ↓
0
    ↓
Worker 1
```

Therefore, a non-zero `WorkerId` is a valid affinity input even when its numeric value does not directly name one of the current workers.

When code intends to target a specific worker directly, use IDs in the range:

```text
1 .. pool.thread_count()
```

## Affinity zero means no preference

`WorkerId{0}` is special.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{0}
);
```

Because zero is `invalid_worker_id`:

```cpp
options.has_affinity();
```

returns:

```text
false
```

The scheduler therefore ignores the affinity path and uses its normal fallback strategy.

For the default `ThreadPool`, that fallback is least-loaded worker selection.

## Affinity is applied during submission

Worker affinity is evaluated when the scheduler receives the task.

```text
TaskOptions
    ↓
affinity
    ↓
Scheduler
    ↓
select worker
    ↓
worker local queue
```

Once the task has entered that worker's queue, the scheduler does not later move it to another worker because load conditions change.

The current runtime has no work stealing.

Affinity therefore controls initial placement, and that placement remains stable while the task is queued.

## Affinity does not reserve a worker

Affinity determines where a task is submitted.

It does not reserve that worker exclusively for the task.

For example:

```text
Worker 2 queue

normal task A
affinity task B
high task C
```

all three tasks can belong to the same worker queue.

The affinity task does not receive exclusive ownership of Worker 2.

Normal queue ordering still applies.

## Affinity does not bypass the queue

An affinity task is still inserted into the selected worker's queue.

For example:

```text
task affinity = Worker 2
        ↓
Scheduler
        ↓
Worker 2
        ↓
TaskQueue
        ↓
wait for execution
```

Affinity does not mean:

```text
execute immediately
```

If Worker 2 is already busy, the affinity task waits.

## Affinity does not preempt running work

Suppose Worker 2 is already executing another callable:

```text
Worker 2
running:
  Task A

queue:
  empty
```

Then a new task arrives with affinity to Worker 2:

```text
Task B
affinity = Worker 2
```

The result is:

```text
Worker 2
running:
  Task A

queue:
  Task B
```

Task B does not interrupt Task A.

Worker execution remains non-preemptive.

## Affinity and priority

Affinity and priority solve different problems.

Affinity controls:

```text
which worker?
```

Priority controls:

```text
where inside that worker's queue?
```

They can be combined:

```cpp
vix::threadpool::TaskOptions options;

options
  .set_affinity(vix::threadpool::WorkerId{2})
  .set_priority(vix::threadpool::TaskPriority::high);

auto future = pool.submit([](){
  return 42;
}, options);
```

The execution path becomes:

```text
affinity = Worker 2
        ↓
select Worker 2
        ↓
priority = high
        ↓
insert according to
Worker 2 queue ordering
```

The scheduler does not compare the task's priority when selecting its worker.

See [Priorities](/modules/threadpool/priorities).

## Affinity overrides least-loaded selection

With the default scheduling policy, affinity takes precedence even when the selected worker has more queued work.

Suppose:

```text
Worker 1 queue size = 0
Worker 2 queue size = 8
Worker 3 queue size = 1
Worker 4 queue size = 2
```

A task without affinity would select:

```text
Worker 1
```

A task with:

```text
affinity = WorkerId 2
```

selects:

```text
Worker 2
```

even though Worker 2 currently has the largest queue.

This is intentional.

Affinity expresses locality preference rather than load preference.

## Affinity can create imbalance

Because affinity overrides least-loaded selection, repeatedly targeting one worker can create an uneven queue distribution.

For example:

```text
Worker 1 queue = 0
Worker 2 queue = 20
Worker 3 queue = 0
Worker 4 queue = 0
```

can occur when many tasks explicitly target Worker 2.

The scheduler does not move those affinity tasks to idle workers.

Use affinity only when worker placement provides a real benefit.

For ordinary work, allowing the scheduler to choose the least-loaded worker usually produces better distribution.

## Queue capacity still applies

Affinity does not bypass the selected worker's queue capacity.

Suppose:

```text
Worker 2 queue capacity = 4
Worker 2 queued tasks   = 4
```

A new task with:

```text
affinity = WorkerId 2
```

still targets Worker 2.

If the local queue cannot accept another task, submission can fail.

The scheduler does not automatically retry the task on another worker merely because the affinity worker's queue is full.

Affinity therefore has a direct interaction with bounded queues.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Affinity and worker lifetime

Workers are created when the scheduler is constructed.

The current `ThreadPool` runtime uses a fixed worker set while it is running.

For:

```cpp
vix::threadpool::ThreadPool pool(4);
```

the scheduler owns:

```text
WorkerId 1
WorkerId 2
WorkerId 3
WorkerId 4
```

for that runtime lifetime.

This makes affinity stable within the lifetime of the pool.

A `WorkerId` should not be treated as a process-wide identity shared between unrelated `ThreadPool` instances.

For example, two different pools can both contain:

```text
WorkerId 1
```

The ID identifies a worker within its owning scheduler.

## Worker ID and worker index

Worker ID and worker index are related but different.

For a scheduler-created worker:

```text
WorkerId = index + 1
```

For example:

```text
WorkerId 1 → index 0
WorkerId 2 → index 1
WorkerId 3 → index 2
WorkerId 4 → index 3
```

Code running on a worker can inspect both:

```cpp
const auto id = vix::threadpool::this_worker::id();
const auto index = vix::threadpool::this_worker::index();
```

For the second worker:

```text
id    = 2
index = 1
```

Use `WorkerId` for affinity.

The worker index is primarily useful for runtime-local indexing and diagnostics.

## `this_worker`

The `this_worker` namespace exposes thread-local information about the current ThreadPool worker.

Inside a worker task:

```cpp
auto future = pool.submit([](){
  return vix::threadpool::this_worker::id();
});
```

available operations include:

```cpp
vix::threadpool::this_worker::inside();
vix::threadpool::this_worker::id();
vix::threadpool::this_worker::index();
vix::threadpool::this_worker::task_id();
```

They provide:

```text
inside()
  ↓
whether this thread is a ThreadPool worker

id()
  ↓
current WorkerId

index()
  ↓
current zero-based worker index

task_id()
  ↓
currently executing TaskId
```

## Outside a worker

Outside the ThreadPool worker context:

```cpp
const bool inside = vix::threadpool::this_worker::inside();
const auto id = vix::threadpool::this_worker::id();
```

the values are:

```text
inside = false
id     = invalid_worker_id
```

`this_worker::index()` returns `0` outside worker context, so the index alone cannot be used to determine whether the current thread is a worker.

Use:

```cpp
vix::threadpool::this_worker::inside();
```

when that distinction matters.

## Inspect affinity during execution

Affinity can be verified from the executing task itself:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{3}
  );

  auto future = pool.submit([](){
    if (!vix::threadpool::this_worker::inside())
    {
      return vix::threadpool::invalid_worker_id;
    }

    return vix::threadpool::this_worker::id();
  }, options);

  return future.get() == vix::threadpool::WorkerId{3} ? 0 : 1;
}
```

This observes actual worker execution rather than inferring placement from submission alone.

## Affinity scheduling policy

The low-level `Scheduler` also supports:

```cpp
vix::threadpool::SchedulingPolicy::affinity
```

Under this policy:

```text
task has affinity
      ↓
use affinity worker

task has no affinity
      ↓
round-robin
```

This differs from the default:

```cpp
vix::threadpool::SchedulingPolicy::affinity_then_least_loaded
```

where the fallback is:

```text
least loaded
```

Normal `ThreadPool` construction does not currently expose a way to change its internal scheduling policy.

Direct `Scheduler` users can configure it through `SchedulerConfig`.

See [Scheduling Model](/modules/threadpool/scheduling).

## Affinity is a placement mechanism

Worker affinity should be understood as placement, not synchronization.

It can be useful when work benefits from repeatedly reaching the same worker.

Conceptually:

```text
related task A ──┐
related task B ──┼──► Worker 2
related task C ──┘
```

However, this does not automatically provide:

```text
shared state safety
mutual exclusion
task dependency ordering
exclusive worker ownership
```

Those concerns must still be handled explicitly by the application or other ThreadPool abstractions.

## Affinity does not serialize tasks globally

Two tasks with the same affinity target the same worker:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_affinity(
        vix::threadpool::WorkerId{2}
);

auto first = pool.submit([](){
  return 20;
}, options);

auto second = pool.submit([](){
  return 22;
}, options);
```

Both are placed into Worker 2's local queue.

Since one worker executes one task at a time, they cannot execute simultaneously on that worker.

However, their relative queue order can also be affected by priority.

With the same priority, sequence ordering preserves FIFO order in that local queue.

This can provide worker-local serialization, but affinity should still not be treated as a general synchronization primitive.

Other tasks can also be placed on the same worker.

## Do not use affinity as a dependency mechanism

Suppose Task B requires Task A's result.

Giving both tasks the same worker affinity is not the clearest way to express that dependency.

Prefer:

```cpp
auto first = pool.submit([](){
  return 21;
});

const int value = first.get();

auto second = pool.submit([value](){
  return value * 2;
});
```

The dependency is explicit.

Affinity should describe execution placement, not logical data dependencies.

## Do not use affinity for ordinary balancing

This:

```cpp
vix::threadpool::TaskOptions first;
first.set_affinity(vix::threadpool::WorkerId{1});

vix::threadpool::TaskOptions second;
second.set_affinity(vix::threadpool::WorkerId{2});

vix::threadpool::TaskOptions third;
third.set_affinity(vix::threadpool::WorkerId{3});
```

is usually unnecessary when the only goal is distributing work.

Without affinity:

```cpp
pool.submit([](){
  perform_work();
});
```

the default scheduler already uses local queue sizes to choose a worker.

Use affinity when the worker identity matters.

Let the scheduler balance ordinary independent tasks.

## Affinity model summary

Worker affinity follows this path:

```text
TaskOptions
    ↓
WorkerId affinity
    ↓
affinity == 0?
 ┌──────┴──────┐
yes            no
 │              │
 ▼              ▼
no affinity    map with
fallback       (id - 1) % worker_count
 │              │
 └──────┬───────┘
        ▼
 selected worker
        ↓
 local TaskQueue
        ↓
 normal priority ordering
        ↓
 worker thread
```

The important properties are:

- `WorkerId` is a `std::uint32_t`.
- `0` is `invalid_worker_id` and means no affinity.
- Scheduler-created Worker IDs start at `1`.
- Worker indexes start at `0`.
- The default `ThreadPool` honors affinity before least-loaded scheduling.
- Affinity is mapped with `(id - 1) % worker_count`.
- Values larger than the worker count wrap into the available worker set.
- Affinity is applied at submission time.
- Queued tasks are not later migrated to another worker.
- The current runtime has no work stealing.
- Affinity does not reserve a worker.
- Affinity does not preempt running work.
- Affinity does not bypass queue capacity.
- Affinity can create load imbalance when overused.
- `this_worker` can inspect the actual worker executing a task.

Continue with [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection) for task admission and bounded queues, or [Cancellation](/modules/threadpool/cancellation) for cooperative task cancellation.
