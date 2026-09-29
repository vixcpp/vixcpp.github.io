# Metrics and Statistics

The ThreadPool module exposes runtime observability through two main snapshot types:

```text
ThreadPoolMetrics
ThreadPoolStats
```

Use:

```cpp
const auto metrics = pool.metrics();
const auto stats = pool.stats();
```

`ThreadPoolMetrics` combines current pool state with cumulative task outcome counters.

`ThreadPoolStats` focuses on cumulative historical counters and exposes additional statistics fields.

```text
ThreadPool
    ↓
workers
    ↓
worker-local counters
    ↓
aggregate snapshot
    ↓
metrics() / stats()
```

## Basic example

```cpp
#include <vix/print.hpp>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  for (int i = 0; i < 8; ++i)
  {
    const bool accepted = pool.post([](){});

    if (!accepted)
    {
      return 1;
    }
  }

  pool.wait_idle();

  const auto metrics = pool.metrics();

  vix::print("workers:", metrics.worker_count);
  vix::print("pending:", metrics.pending_tasks);
  vix::print("active:", metrics.active_tasks);
  vix::print("completed:", metrics.completed_tasks);
  vix::print("failed:", metrics.failed_tasks);
  vix::print("rejected:", metrics.rejected_tasks);
  vix::print("idle:", metrics.idle() ? "yes" : "no");

  return 0;
}
```

After `wait_idle()`, the pool has no pending or active work.

## Metrics vs statistics

The two types overlap intentionally.

`ThreadPoolMetrics` is useful when inspecting the current runtime:

```text
worker count
pending tasks
active tasks
idle workers
busy workers
```

It also includes cumulative task counters:

```text
submitted
completed
failed
cancelled
timed out
rejected
```

`ThreadPoolStats` contains historical counters:

```text
accepted
rejected
completed
failed
cancelled
timed out
idle waits
```

and fields intended for execution timing:

```text
worker wakeups
total execution time
maximum execution time
average execution time
```

Some of these statistics fields are not currently populated by `ThreadPool`. Their exact current behavior is documented below.

## ThreadPoolMetrics

The type is:

```cpp
vix::threadpool::ThreadPoolMetrics
```

Its fields are:

```cpp
std::size_t worker_count;
std::size_t pending_tasks;
std::uint64_t active_tasks;
std::size_t idle_workers;
std::size_t busy_workers;

std::uint64_t submitted_tasks;
std::uint64_t completed_tasks;
std::uint64_t failed_tasks;
std::uint64_t cancelled_tasks;
std::uint64_t timed_out_tasks;
std::uint64_t rejected_tasks;
```

A default-constructed snapshot contains zeros:

```cpp
vix::threadpool::ThreadPoolMetrics metrics;
```

and:

```text
worker_count      0
pending_tasks     0
active_tasks      0
idle_workers      0
busy_workers      0
submitted_tasks   0
completed_tasks   0
failed_tasks      0
cancelled_tasks   0
timed_out_tasks   0
rejected_tasks    0
```

## Worker count

`worker_count` is the number of workers owned by the scheduler:

```cpp
const auto metrics = pool.metrics();

vix::print("workers:", metrics.worker_count);
```

For:

```cpp
vix::threadpool::ThreadPool pool(4);
```

the snapshot normally reports:

```text
worker_count = 4
```

This is the configured worker set, not the number of workers currently executing tasks.

## Pending tasks

`pending_tasks` is the total number of tasks currently waiting in worker queues.

Conceptually:

```text
Worker 1 queue: 3
Worker 2 queue: 1
Worker 3 queue: 0
Worker 4 queue: 2

pending_tasks = 6
```

The value does not include tasks that workers have already removed from their queues for execution.

## Active tasks

`active_tasks` is the number of tasks currently being executed across all workers.

For example:

```text
Worker 1 active: 1
Worker 2 active: 1
Worker 3 active: 0
Worker 4 active: 1

active_tasks = 3
```

A worker increments its active count when it removes a task from its queue for execution and decrements it when execution finishes.

## Pending and active are different

A task moves conceptually through:

```text
queued
  ↓
pending_tasks
  ↓
worker removes task
  ↓
active_tasks
  ↓
terminal result
```

Therefore a task normally stops contributing to `pending_tasks` before it begins contributing to execution progress.

## Busy workers

A worker contributes to:

```cpp
metrics.busy_workers
```

when its worker-local:

```text
active_tasks > 0
```

For the current worker model, one worker normally executes at most one task at a time.

For example:

```text
4 workers
2 currently executing tasks

busy_workers = 2
```

## Idle workers

A worker contributes to:

```cpp
metrics.idle_workers
```

when:

```text
active_tasks == 0
and
WorkerState == idle
```

For example:

```text
Worker 1 running
Worker 2 idle
Worker 3 idle
Worker 4 idle
```

produces approximately:

```text
busy_workers = 1
idle_workers = 3
```

depending on the exact moment the snapshot is taken.

## Idle and busy do not always sum to worker count

Do not assume:

```text
idle_workers + busy_workers == worker_count
```

at every lifecycle point.

Workers can also be in states such as:

```text
created
stopping
stopped
failed
```

A worker in one of those states can belong to `worker_count` without being counted as idle or busy.

## Check whether the pool is idle

`ThreadPoolMetrics` provides:

```cpp
metrics.idle();
```

It returns true when:

```text
pending_tasks == 0
and
active_tasks == 0
```

The implementation does not use `idle_workers` to determine this result.

Conceptually:

```text
pending == 0
     +
active == 0
     ↓
idle() == true
```

## `ThreadPool::idle()`

`ThreadPool::idle()` uses the same metrics rule:

```cpp
if (pool.idle())
{
  // No queued or active tasks are currently observed.
}
```

Internally:

```text
ThreadPool::idle()
      ↓
metrics()
      ↓
ThreadPoolMetrics::idle()
```

This checks observed work, not whether the pool has been shut down.

A running pool can be idle.

A stopped pool with no remaining work can also be idle.

## Submitted tasks

`metrics.submitted_tasks` counts submission attempts received by the scheduler.

The scheduler increments the counter before validating whether the task can be accepted.

Conceptually:

```text
submit attempt
      ↓
submitted_tasks += 1
      ↓
validate
      ↓
accept or reject
```

Therefore:

```text
submitted_tasks
```

includes rejected attempts.

## Rejected tasks

`metrics.rejected_tasks` counts scheduler submission attempts that were rejected.

Examples include:

```text
invalid task
scheduler stopped
no worker available
selected worker rejects task
queue full
```

The exact rejection behavior is described in [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Submitted relationship

With the normal `ThreadPool` rejection behavior:

```text
submitted attempts
      ↓
accepted or rejected
```

so the conceptual relationship is:

```text
submitted_tasks
=
accepted attempts
+
rejected attempts
```

`ThreadPoolMetrics` does not expose a direct `accepted_tasks` field.

Use `ThreadPoolStats` when that counter is required.

## Completed tasks

`metrics.completed_tasks` is aggregated from worker-local successful execution counters.

A worker increments this value when low-level `Task::run()` returns:

```cpp
vix::threadpool::TaskResult::success
```

Conceptually:

```text
Task::run()
    ↓
success
    ↓
worker.completed_tasks += 1
```

The pool sums the counters from all workers.

## Failed tasks

`metrics.failed_tasks` counts low-level task executions classified as:

```cpp
vix::threadpool::TaskResult::failure
```

This includes task execution paths that fail through an exception or another low-level execution failure.

For result-producing submissions, remember that the low-level task and its `Future` are separate observation layers.

See [Task Results and Status](/modules/threadpool/task-results-and-status).

## Cancelled tasks

`metrics.cancelled_tasks` counts worker tasks whose low-level result became:

```cpp
vix::threadpool::TaskResult::cancelled
```

For example, a cancellation token observed by `Task::run()` can produce this outcome.

Cancellation requests do not automatically increment this counter merely because:

```cpp
source.request_cancel();
```

was called.

The low-level task must reach the cancellation outcome.

See [Cancellation](/modules/threadpool/cancellation).

## Timed-out tasks

`metrics.timed_out_tasks` counts low-level worker tasks whose result became:

```cpp
vix::threadpool::TaskResult::timeout
```

For example:

```text
task execution starts
      ↓
callable takes longer than timeout
      ↓
Task::run() observes elapsed duration
      ↓
timed_out_tasks += 1
```

The callback itself is not forcibly interrupted.

## Future timeout state can differ from metrics

The current `submit()` architecture can publish a successful Future result before the low-level task checks execution timeout.

For example:

```cpp
vix::threadpool::TaskOptions options =
  vix::threadpool::TaskOptions::with_timeout(
    vix::threadpool::Timeout::milliseconds(1)
  );

auto future = pool.submit([](){
  std::this_thread::sleep_for(
    std::chrono::milliseconds{10}
  );

  return 42;
}, options);
```

can currently result in:

```text
Future:
  status = completed
  result = success
  value  = 42

ThreadPool metrics:
  timed_out_tasks += 1
```

This is because the Future and low-level `Task` observe different layers of the execution path.

See [Timeouts](/modules/threadpool/timeouts).

## Finished tasks

`ThreadPoolMetrics` provides:

```cpp
const auto finished = metrics.finished_tasks();
```

The calculation is:

```text
completed_tasks
+
failed_tasks
+
cancelled_tasks
+
timed_out_tasks
```

Rejected tasks are intentionally excluded.

Conceptually:

```text
finished
  accepted task reached execution outcome


rejected
  submission did not enter normal execution
```

## Error tasks

Use:

```cpp
const auto errors = metrics.error_tasks();
```

The calculation is:

```text
failed_tasks
+
cancelled_tasks
+
timed_out_tasks
+
rejected_tasks
```

Successful completed tasks are excluded.

For example:

```text
failed      2
cancelled   3
timed out   4
rejected    5

error_tasks() = 14
```

## Metrics snapshot example

```cpp
const auto metrics = pool.metrics();

vix::print("workers:", metrics.worker_count);
vix::print("pending:", metrics.pending_tasks);
vix::print("active:", metrics.active_tasks);
vix::print("idle workers:", metrics.idle_workers);
vix::print("busy workers:", metrics.busy_workers);

vix::print("submitted:", metrics.submitted_tasks);
vix::print("completed:", metrics.completed_tasks);
vix::print("failed:", metrics.failed_tasks);
vix::print("cancelled:", metrics.cancelled_tasks);
vix::print("timed out:", metrics.timed_out_tasks);
vix::print("rejected:", metrics.rejected_tasks);

vix::print("finished:", metrics.finished_tasks());
vix::print("errors:", metrics.error_tasks());
vix::print("idle:", metrics.idle() ? "yes" : "no");
```

## Metrics are snapshots

Calling:

```cpp
const auto metrics = pool.metrics();
```

creates a value snapshot.

The returned object does not remain connected to the pool.

For example:

```cpp
const auto before = pool.metrics();

pool.post([](){
  perform_work();
});

const auto after = pool.metrics();
```

`before` remains unchanged.

Use another call to `metrics()` when fresh values are required.

## Snapshot fields can change while being collected

A ThreadPool metrics snapshot is assembled while workers continue executing concurrently.

The scheduler:

```text
reads scheduler counters
      ↓
reads Worker 1 metrics
      ↓
reads Worker 2 metrics
      ↓
reads Worker 3 metrics
      ↓
...
```

These reads do not stop the pool.

A task can move from queued to active or complete while the snapshot is being constructed.

Therefore the snapshot should be interpreted as runtime observability data, not as one globally atomic transaction over every worker and counter.

## Do not derive strict concurrent invariants

For a busy pool, avoid assuming that one snapshot must satisfy exact relationships such as:

```text
submitted
=
pending
+
active
+
finished
+
rejected
```

at every instant.

Counters and queue state are observed from different concurrent components.

After a stable synchronization point such as:

```cpp
pool.wait_idle();
```

historical outcome comparisons become easier to interpret.

## Metrics remain readable after shutdown

Metrics can still be inspected after:

```cpp
pool.shutdown();
```

For example:

```cpp
pool.wait_idle();
pool.shutdown();

const auto metrics = pool.metrics();
```

The worker objects and their accumulated counters remain owned by the scheduler.

Historical outcome counters remain available.

The worker lifecycle state can affect `idle_workers` and `busy_workers`, but completed task totals remain readable.

## ThreadPoolStats

The second aggregate type is:

```cpp
vix::threadpool::ThreadPoolStats
```

Its fields are:

```cpp
std::uint64_t accepted_tasks;
std::uint64_t rejected_tasks;
std::uint64_t completed_tasks;
std::uint64_t failed_tasks;
std::uint64_t cancelled_tasks;
std::uint64_t timed_out_tasks;

std::uint64_t worker_wakeups;
std::uint64_t idle_waits;

std::chrono::nanoseconds total_execution_time;
std::chrono::nanoseconds max_execution_time;
```

A default snapshot initializes every field to zero.

## Accepted tasks

For `ThreadPool`, `stats.accepted_tasks` comes from the scheduler's accepted counter.

It is incremented after:

```text
scheduler selects worker
      ↓
Worker::submit()
      ↓
worker accepts queue insertion
      ↓
accepted_tasks += 1
```

Therefore it represents tasks accepted through the normal worker submission path.

## Rejected tasks in stats

`stats.rejected_tasks` uses the scheduler rejection counter.

This is the same scheduler-level cumulative rejection count exposed as:

```cpp
metrics.rejected_tasks
```

For a normal ThreadPool snapshot taken at the same stable point:

```text
stats.rejected_tasks
```

and:

```text
metrics.rejected_tasks
```

represent the same scheduler-level counter.

## Stats submitted tasks

`ThreadPoolStats` does not store `submitted_tasks` as a separate field.

Instead it provides:

```cpp
const auto submitted = stats.submitted_tasks();
```

which returns:

```text
accepted_tasks + rejected_tasks
```

This represents total scheduler submission attempts under the current accounting model.

## Stats finished tasks

Use:

```cpp
stats.finished_tasks();
```

The calculation is:

```text
completed_tasks
+
failed_tasks
+
cancelled_tasks
+
timed_out_tasks
```

Like the metrics helper, it excludes rejected tasks.

## Stats error tasks

Use:

```cpp
stats.error_tasks();
```

The result is:

```text
failed_tasks
+
cancelled_tasks
+
timed_out_tasks
+
rejected_tasks
```

This matches the corresponding `ThreadPoolMetrics` helper.

## Check whether stats are empty

Use:

```cpp
if (stats.empty())
{
  // No accepted or rejected task has been recorded.
}
```

The check is:

```text
submitted_tasks() == 0
```

A pool that has accepted no tasks and rejected no submissions is statistically empty.

## Idle waits

For the current `ThreadPool` implementation:

```cpp
stats.idle_waits
```

is the sum of each worker's:

```cpp
WorkerMetrics::idle_cycles
```

Every time a worker loop finds no task:

```text
queue empty
    ↓
worker enters idle path
    ↓
idle_cycles += 1
```

The scheduler aggregates those worker counters into:

```text
stats.idle_waits
```

## `idle_waits` is cumulative

The value is not:

```text
number of workers currently idle
```

That information belongs to:

```cpp
metrics.idle_workers
```

Instead:

```text
stats.idle_waits
```

is historical.

A worker can enter the idle loop many times during its lifetime, so this value can become much larger than the number of worker threads.

## Worker wakeups

`ThreadPoolStats` exposes:

```cpp
stats.worker_wakeups
```

but the current `ThreadPool` scheduler does not populate this field.

Therefore, for current `ThreadPool::stats()` snapshots:

```text
worker_wakeups = 0
```

even though workers have obviously been notified and awakened during normal execution.

Do not currently use this field to measure real worker wakeups.

## Execution timing fields

`ThreadPoolStats` also exposes:

```cpp
stats.total_execution_time;
stats.max_execution_time;
```

and:

```cpp
stats.average_execution_time();
```

These fields are part of the public statistics API.

However, the current `ThreadPool` worker aggregation does not collect execution-duration counters.

Therefore:

```text
ThreadPool::stats().total_execution_time = 0 ns
ThreadPool::stats().max_execution_time   = 0 ns
```

in the current implementation.

## Average execution time

The helper is:

```cpp
stats.average_execution_time();
```

Its calculation is:

```text
if completed_tasks == 0
  return 0

otherwise
  total_execution_time / completed_tasks
```

Because `ThreadPool::stats()` currently leaves:

```text
total_execution_time = 0
```

the current ThreadPool average is also:

```text
0 ns
```

even after successful task execution.

Do not currently use the ThreadPool timing fields for performance measurement.

## Current ThreadPoolStats wiring

For `ThreadPool::stats()`, the fields currently behave as:

| Field                  | Current ThreadPool source         |
| ---------------------- | --------------------------------- |
| `accepted_tasks`       | Scheduler accepted counter        |
| `rejected_tasks`       | Scheduler rejected counter        |
| `completed_tasks`      | Sum of worker completed counters  |
| `failed_tasks`         | Sum of worker failed counters     |
| `cancelled_tasks`      | Sum of worker cancelled counters  |
| `timed_out_tasks`      | Sum of worker timed-out counters  |
| `idle_waits`           | Sum of worker idle-cycle counters |
| `worker_wakeups`       | Currently not populated           |
| `total_execution_time` | Currently not populated           |
| `max_execution_time`   | Currently not populated           |

This distinction is important when building monitoring around the current runtime.

## Do not infer timing from zero

For example:

```cpp
const auto stats = pool.stats();

vix::print(
  "total execution ns:",
  stats.total_execution_time.count()
);
```

currently printing:

```text
0
```

does not mean the tasks consumed zero execution time.

It means ThreadPool timing aggregation is not currently wired into those fields.

## Metrics and stats after work

A useful current workflow is:

```cpp
pool.wait_idle();

const auto metrics = pool.metrics();
const auto stats = pool.stats();

vix::print("completed:", metrics.completed_tasks);
vix::print("errors:", metrics.error_tasks());

vix::print("accepted:", stats.accepted_tasks);
vix::print("rejected:", stats.rejected_tasks);
vix::print("finished:", stats.finished_tasks());
```

These task and queue counters are currently backed by the runtime.

Avoid relying on the ThreadPool execution timing fields until that instrumentation is connected.

## WorkerMetrics

The lower-level `Worker` API provides:

```cpp
vix::threadpool::WorkerMetrics
```

for one worker.

Its fields are:

```cpp
WorkerId id;
std::size_t index;
WorkerState state;

std::size_t pending_tasks;
std::uint64_t active_tasks;

std::uint64_t accepted_tasks;
std::uint64_t executed_tasks;
std::uint64_t completed_tasks;
std::uint64_t failed_tasks;
std::uint64_t cancelled_tasks;
std::uint64_t timed_out_tasks;
std::uint64_t rejected_tasks;
std::uint64_t idle_cycles;
```

Obtain a snapshot from a direct worker with:

```cpp
const auto metrics = worker.metrics();
```

This lower-level type exposes more worker-local detail than `ThreadPoolMetrics`.

## Worker identity

A worker snapshot includes:

```cpp
metrics.id;
metrics.index;
metrics.state;
```

For example:

```text
id    = 3
index = 2
state = idle
```

Worker IDs are one-based scheduler identities while worker indexes are zero-based.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Worker pending tasks

`WorkerMetrics::pending_tasks` is the size of that worker's local queue.

Pool-level:

```cpp
ThreadPoolMetrics::pending_tasks
```

is the sum of queue sizes across workers.

Conceptually:

```text
Worker 1 pending
+
Worker 2 pending
+
Worker 3 pending
+
Worker 4 pending
=
pool pending_tasks
```

subject to concurrent changes while the snapshot is being assembled.

## Worker accepted tasks

`WorkerMetrics::accepted_tasks` increments when the worker successfully inserts a task into its local queue.

This is worker-local admission accounting.

At scheduler level, `ThreadPoolStats::accepted_tasks` is maintained separately by the scheduler after `Worker::submit()` succeeds.

## Worker executed tasks

`WorkerMetrics::executed_tasks` counts how many tasks that worker actually entered through `execute_task()`.

This field is not currently exposed as a corresponding aggregate field in either:

```text
ThreadPoolMetrics
ThreadPoolStats
```

It remains available through the lower-level worker metrics API.

## Worker rejected tasks

A worker can increment its own `rejected_tasks` when:

```text
task is unschedulable
worker is stopping
local queue rejects insertion
```

The scheduler also maintains its own rejection counter.

`ThreadPool::metrics()` exposes the scheduler-level rejection counter rather than summing:

```cpp
WorkerMetrics::rejected_tasks
```

across workers.

This avoids reporting the same worker submission failure twice through the pool-level rejection field.

## Idle cycles

Every iteration in which the worker finds no available task increments:

```cpp
metrics.idle_cycles
```

The worker can then wait using its configured internal wait strategy.

At pool level:

```cpp
stats.idle_waits
```

is currently calculated as the sum of these idle-cycle counters.

## WorkerMetrics is a snapshot

Like pool metrics:

```cpp
const auto workerMetrics = worker.metrics();
```

copies current atomics and queue state into a new value.

It does not create a live view.

The worker can continue changing immediately after the snapshot is returned.

## InlineExecutor metrics

The common `Executor` interface also exposes:

```cpp
metrics();
stats();
```

`InlineExecutor` implements these APIs even though it has no worker threads or task queue.

Its metrics always report:

```text
worker_count  = 0
pending_tasks = 0
active_tasks  = 0
idle_workers  = 0
busy_workers  = 0
```

while cumulative task counters are still maintained.

## InlineExecutor submitted tasks

`InlineExecutor` increments:

```cpp
metrics.submitted_tasks
```

for every `post()` attempt.

This includes attempts later rejected because:

```text
task is empty
executor is stopped
```

The model therefore matches the general meaning:

```text
submitted = attempted submissions
```

## InlineExecutor task outcomes

Because work executes synchronously inside `post()`, `InlineExecutor` can immediately classify the operation as:

```text
completed
failed
cancelled
timed out
rejected
```

These counters are returned through `metrics()` and `stats()`.

## InlineExecutor execution timing is wired

Unlike the current ThreadPool aggregation, `InlineExecutor` does record execution duration.

For a callable that actually begins execution:

```text
start = steady_clock::now()
      ↓
callable
      ↓
end = steady_clock::now()
      ↓
record elapsed duration
```

Its stats populate:

```cpp
stats.total_execution_time;
stats.max_execution_time;
```

Therefore execution timing fields can contain real measurements for `InlineExecutor`.

## InlineExecutor timing includes executed failure paths

`InlineExecutor` records elapsed execution time before classifying a callable that:

```text
completes successfully
throws
finishes after timeout
finishes after deadline
finishes after cancellation request
```

Pre-run cancellation or an already expired deadline does not execute the callable and therefore does not record callable execution time.

## InlineExecutor average execution time caveat

`ThreadPoolStats::average_execution_time()` divides:

```text
total_execution_time
```

by:

```text
completed_tasks
```

only.

For `InlineExecutor`, however, total execution time can include callables that executed and were later classified as:

```text
failed
timed out
cancelled
```

while those outcomes are not included in the divisor.

Therefore the helper should not currently be interpreted as the average duration of every executed InlineExecutor callable when non-success outcomes are present.

## ExecutorRef metrics

`ExecutorRef` forwards observability to its bound executor:

```cpp
vix::threadpool::ExecutorRef ref(pool);

const auto metrics = ref.metrics();
const auto stats = ref.stats();
```

An empty `ExecutorRef` safely returns default empty snapshots:

```text
all metrics fields = 0
all stats fields   = 0
```

This allows code using an optional executor reference to inspect it without dereferencing a null pointer.

## ThreadPoolExecutor metrics

`ThreadPoolExecutor` forwards:

```cpp
executor.metrics();
executor.stats();
```

to its bound `ThreadPool`.

Therefore a bound adapter observes the same values as:

```cpp
pool.metrics();
pool.stats();
```

An unbound `ThreadPoolExecutor` returns default empty snapshots.

## Observability hierarchy

The current API can be viewed as:

```text
Executor
├── metrics()
└── stats()

ThreadPool
    ↓
Scheduler
    ↓
aggregate WorkerMetrics

InlineExecutor
    ↓
own synchronous counters

ThreadPoolExecutor
    ↓
forward to ThreadPool

ExecutorRef
    ↓
forward to bound Executor
```

This lets higher-level code observe executors through the common interface.

## Metrics do not reset

ThreadPool task counters are cumulative for the lifetime of the runtime.

For example:

```text
after workload 1:
completed = 100

after workload 2:
completed = 150
```

The second snapshot does not report only the 50 tasks from workload 2.

There is no public:

```text
reset_metrics()
reset_stats()
```

operation.

## Calculate deltas

To measure one application interval, take two snapshots:

```cpp
const auto before = pool.metrics();

perform_workload();

pool.wait_idle();

const auto after = pool.metrics();

const auto completed =
  after.completed_tasks - before.completed_tasks;
```

This produces a workload-local delta from cumulative counters.

The same technique can be used for:

```text
submitted
failed
cancelled
timed out
rejected
```

when counter wraparound is not a practical concern.

## Observe queue pressure

Current-state metrics can help detect backlog:

```cpp
const auto metrics = pool.metrics();

if (metrics.pending_tasks > 1000)
{
  report_backlog();
}
```

Useful fields include:

```text
pending_tasks
active_tasks
busy_workers
idle_workers
rejected_tasks
```

For bounded queues, an increasing rejection counter can also indicate admission pressure.

## Observe utilization carefully

A simple instantaneous worker view is:

```text
busy_workers / worker_count
```

For example:

```text
busy_workers = 3
worker_count = 4
```

suggests three workers were observed executing work during that snapshot.

This is not a long-term CPU utilization percentage.

It is one runtime snapshot.

For meaningful utilization analysis, collect samples over time or add dedicated duration instrumentation.

## `active_tasks` is more direct than worker state for work count

For deciding whether work is currently executing:

```cpp
metrics.active_tasks
```

is the direct aggregate task count.

For deciding how many workers are currently classified as executing:

```cpp
metrics.busy_workers
```

is useful.

With the current one-task-per-worker execution model, the values are closely related, but they represent different concepts.

## Do not use idle cycles as CPU idle time

`stats.idle_waits` counts worker idle-loop cycles.

It does not measure:

```text
nanoseconds idle
percentage CPU idle
percentage worker utilization
```

A larger value can result from:

```text
long runtime duration
many transitions into idle state
internal wait-strategy behavior
```

Treat it as an internal historical activity counter.

## Task result layering matters

Metrics and stats are primarily based on low-level worker task outcomes.

For APIs such as:

```text
submit()
handle()
```

there is also a higher-level Future result.

Conceptually:

```text
user callable
    ↓
Promise / Future result
    ↓
wrapper returns
    ↓
low-level Task final classification
    ↓
worker metrics
```

These layers normally align, but current timeout behavior demonstrates that they can diverge.

When monitoring application-visible outcomes, consider both the asynchronous result API and runtime-level observability.

## Snapshot after `wait_idle()`

A common pattern is:

```cpp
pool.wait_idle();

const auto metrics = pool.metrics();
```

At this point, the current work-state fields should report:

```text
pending_tasks = 0
active_tasks  = 0
idle()        = true
```

The historical counters remain cumulative.

This is often the easiest point for tests and command-line diagnostics.

## Example diagnostic summary

```cpp
#include <vix/print.hpp>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  for (int i = 0; i < 8; ++i)
  {
    const bool accepted = pool.post([](){});

    if (!accepted)
    {
      return 1;
    }
  }

  pool.wait_idle();

  const auto metrics = pool.metrics();
  const auto stats = pool.stats();

  vix::print("workers:", metrics.worker_count);
  vix::print("pending:", metrics.pending_tasks);
  vix::print("active:", metrics.active_tasks);
  vix::print("completed:", metrics.completed_tasks);
  vix::print("failed:", metrics.failed_tasks);
  vix::print("rejected:", metrics.rejected_tasks);
  vix::print("idle:", metrics.idle() ? "yes" : "no");

  vix::print("accepted:", stats.accepted_tasks);
  vix::print("finished:", stats.finished_tasks());
  vix::print("errors:", stats.error_tasks());

  return 0;
}
```

The important distinction is that the task counters are currently useful ThreadPool observability, while the ThreadPool execution timing fields are not yet populated.

## Current implementation summary

The ThreadPool observability path is:

```text
task submission
      ↓
Scheduler
      ├── submitted counter
      ├── accepted counter
      └── rejected counter
      ↓
Worker
      ├── pending queue
      ├── active counter
      ├── executed counter
      ├── completed counter
      ├── failed counter
      ├── cancelled counter
      ├── timed-out counter
      ├── rejected counter
      └── idle cycles
      ↓
Scheduler::metrics()
Scheduler::stats()
      ↓
ThreadPool::metrics()
ThreadPool::stats()
```

The important properties are:

- `ThreadPoolMetrics` combines current runtime state with cumulative task counters.
- `ThreadPoolStats` contains cumulative historical counters and timing-related fields.
- `metrics()` and `stats()` return value snapshots, not live views.
- Snapshots do not stop worker execution and are not globally atomic across every field.
- `worker_count` reports the scheduler's worker set.
- `pending_tasks` is the sum of queued work across local worker queues.
- `active_tasks` is the number of tasks currently executing.
- `busy_workers` counts workers with active work.
- `idle_workers` counts workers observed with no active task and `WorkerState::idle`.
- Idle and busy worker counts do not necessarily sum to worker count during every lifecycle state.
- `metrics.idle()` checks only whether pending and active task counts are both zero.
- `submitted_tasks` counts scheduler submission attempts, including rejected attempts.
- `completed`, `failed`, `cancelled`, and `timed_out` are aggregated from worker low-level task outcomes.
- `metrics.finished_tasks()` excludes rejected submissions.
- `metrics.error_tasks()` includes rejected submissions.
- `stats.accepted_tasks` counts scheduler submissions accepted by a worker.
- `stats.submitted_tasks()` is `accepted_tasks + rejected_tasks`.
- `stats.idle_waits` currently aggregates worker idle-loop cycles.
- `ThreadPoolStats::worker_wakeups` is currently exposed but not populated by `ThreadPool`.
- `ThreadPoolStats::total_execution_time` is currently exposed but not populated by `ThreadPool`.
- `ThreadPoolStats::max_execution_time` is currently exposed but not populated by `ThreadPool`.
- Consequently, `ThreadPool::stats().average_execution_time()` currently returns zero even after successful task execution.
- `WorkerMetrics` exposes additional worker-local counters such as accepted tasks, executed tasks, rejected tasks, and idle cycles.
- Pool-level rejection uses the scheduler rejection counter rather than summing worker rejection counters.
- `InlineExecutor` implements the same metrics and stats interface and does populate execution timing fields.
- `InlineExecutor` timing can include executed non-success outcomes while `average_execution_time()` divides only by successful completions.
- `ExecutorRef` and `ThreadPoolExecutor` forward observability to their bound executors.
- Metrics and stats counters are cumulative and currently have no public reset operation.
- Use snapshot differences when workload-local deltas are required.
- Runtime timeout metrics describe low-level task classification and can currently differ from a successful `Future` outcome.

Continue with [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) for pool startup, idle waiting, queue draining, and shutdown behavior.
