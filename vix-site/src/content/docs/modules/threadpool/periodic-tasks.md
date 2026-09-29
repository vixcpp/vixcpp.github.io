# Periodic Tasks

`PeriodicTask` periodically submits a callback to an `Executor`.

With a `ThreadPool`, the periodic scheduler decides when to submit work while the pool workers execute the callbacks.

```cpp id="m0a8pi"
#include <atomic>
#include <chrono>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(2);
  std::atomic<int> ticks{0};

  vix::threadpool::PeriodicTaskConfig config;
  config.interval = std::chrono::milliseconds{100};
  config.run_immediately = true;

  auto task = pool.schedule_every(
    [&ticks](){
      ticks.fetch_add(1, std::memory_order_relaxed);
    },
    config
  );

  if (!task.start())
  {
    return 1;
  }

  std::this_thread::sleep_for(
    std::chrono::milliseconds{350}
  );

  task.stop();
  task.join();

  pool.wait_idle();

  return ticks.load(std::memory_order_relaxed) > 0 ? 0 : 1;
}
```

A periodic task is not started automatically.

## Execution model

`PeriodicTask` separates scheduling from callback execution.

```text
PeriodicTask scheduler thread
            ↓
          tick
            ↓
      Executor::post()
            ↓
      executor runtime
            ↓
         callback
```

With a `ThreadPool`:

```text
PeriodicTask
scheduler thread
      ↓
ThreadPool::post()
      ↓
Scheduler
      ↓
Worker
      ↓
callback
```

The periodic scheduler thread does not normally execute the callback itself when using `ThreadPool`.

It only submits it.

## One scheduler thread per PeriodicTask

Each running `PeriodicTask` owns one lightweight `std::thread` responsible for timing.

For example:

```text
PeriodicTask A
  └── scheduler thread A

PeriodicTask B
  └── scheduler thread B
```

These scheduler threads are separate from ThreadPool worker threads.

Creating many periodic tasks therefore also creates many scheduler threads.

## Create a PeriodicTask directly

A periodic task can be created from any `Executor`:

```cpp id="x7ognp"
vix::threadpool::PeriodicTask task(
  pool,
  [](){
    perform_work();
  }
);
```

The constructor accepts:

```text
Executor&
Callback
PeriodicTaskConfig
```

The callback type is:

```cpp id="7atct2"
using Callback = std::function<void()>;
```

The task remains stopped until `start()` is called.

## Create one through ThreadPool

`ThreadPool` provides:

```cpp id="ivunx3"
pool.schedule_every(callback, config);
```

For example:

```cpp id="p3oukc"
auto task = pool.schedule_every(
  [](){
    perform_work();
  }
);
```

This creates a `PeriodicTask` bound to the pool.

It does not start it.

You must still call:

```cpp id="4bj4ha"
task.start();
```

## `schedule_every()` does not schedule immediately

Despite its name:

```cpp id="x57smq"
auto task = pool.schedule_every(
  [](){
    perform_work();
  }
);
```

only constructs the periodic scheduling object.

At this point:

```text
task.running() == false
```

No scheduler thread has been started and no callback has been submitted.

Execution begins only after:

```cpp id="11mn0g"
task.start();
```

## PeriodicTaskConfig

Periodic behavior is configured through:

```cpp id="7dxdho"
vix::threadpool::PeriodicTaskConfig
```

The configuration contains:

```cpp id="ik12yh"
std::chrono::milliseconds interval;
vix::threadpool::TaskOptions options;
bool run_immediately;
bool stop_on_post_failure;
```

The defaults are:

```text
interval             1000 ms
run_immediately      false
stop_on_post_failure true
options              default TaskOptions
```

## Configure the interval

Set the interval directly:

```cpp id="h36l0n"
vix::threadpool::PeriodicTaskConfig config;
config.interval = std::chrono::milliseconds{250};
```

or use:

```cpp id="qyvakv"
auto config = vix::threadpool::PeriodicTaskConfig::every(
  std::chrono::milliseconds{250}
);
```

Both represent a 250 millisecond periodic interval.

## Interval normalization

Periodic intervals must be positive.

The helper:

```cpp id="msjwlu"
vix::threadpool::PeriodicTaskConfig::normalize_interval(
  value
);
```

converts non-positive values to:

```text
1 ms
```

For example:

```cpp id="unvhuw"
const auto interval =
  vix::threadpool::PeriodicTaskConfig::normalize_interval(
    std::chrono::milliseconds{0}
  );
```

produces:

```text
1 ms
```

The same applies to negative values.

## `every()` normalizes immediately

This:

```cpp id="n37ta4"
auto config = vix::threadpool::PeriodicTaskConfig::every(
  std::chrono::milliseconds{0}
);
```

produces:

```text
config.interval = 1 ms
```

`every()` never returns a non-positive interval.

## Direct configuration is normalized on task construction

This is also safe:

```cpp id="q4wjf2"
vix::threadpool::PeriodicTaskConfig config;
config.interval = std::chrono::milliseconds{0};

vix::threadpool::PeriodicTask task(
  pool,
  [](){},
  config
);
```

The `PeriodicTask` constructor stores:

```cpp id="9e7ho7"
config.normalized()
```

so the effective interval becomes:

```text
1 ms
```

Inspect the stored normalized configuration with:

```cpp id="oh46wh"
task.config();
```

## First execution

By default:

```cpp id="sgcfsl"
config.run_immediately = false;
```

The scheduler waits one full interval before the first submission.

Conceptually:

```text
start()
  ↓
wait interval
  ↓
submit tick 1
  ↓
wait until next tick
  ↓
submit tick 2
```

For a 500 millisecond interval:

```text
start
  |
  | 500 ms
  v
tick 1
  |
  | 500 ms
  v
tick 2
```

## Run immediately

Set:

```cpp id="ue6l9l"
config.run_immediately = true;
```

to submit one callback as soon as the scheduler thread begins running.

The sequence becomes:

```text
start()
  ↓
submit immediate tick
  ↓
wait interval
  ↓
submit next tick
```

For example:

```cpp id="23uxab"
vix::threadpool::PeriodicTaskConfig config;
config.interval = std::chrono::seconds{1};
config.run_immediately = true;
```

requests one immediate submission followed by periodic submissions.

## Start the task

Use:

```cpp id="9qqqmq"
const bool started = task.start();
```

A successful call:

```text
creates scheduler thread
sets running state
returns true
```

Check it:

```cpp id="8v8vmb"
if (!task.start())
{
  return 1;
}
```

## Conditions required by `start()`

`start()` returns `false` when the periodic task has no valid executor or no callback.

For example, an empty task:

```cpp id="fhgndp"
vix::threadpool::PeriodicTask task;
```

cannot start:

```cpp id="yjfjia"
task.start();
```

returns:

```text
false
```

Its state remains:

```text
running()        false
submitted_ticks() 0
failed_posts()    0
```

## Starting an already running task

Calling `start()` again while the task is already running returns:

```text
false
```

For example:

```cpp id="ttnjkz"
if (!task.start())
{
  return 1;
}

const bool secondStart = task.start();
```

gives:

```text
secondStart = false
```

The existing scheduler thread continues running.

A second thread is not created.

## Check running state

Use:

```cpp id="c65coc"
if (task.running())
{
  // Periodic submission is active.
}
```

`running()` describes the scheduler loop.

It does not mean a callback is currently executing.

For example:

```text
PeriodicTask running = true

scheduler sleeping until next tick
callback count = 0
```

is a valid state.

## Check scheduler-thread ownership

Use:

```cpp id="54d8ny"
task.joinable();
```

to determine whether the internal scheduler thread is currently joinable.

This is different from:

```cpp id="g0okb9"
task.running();
```

A scheduler thread can have finished while its `std::thread` object remains joinable until `join()` is called.

## Stop periodic submission

Use:

```cpp id="01mxtb"
task.stop();
```

`stop()` changes the running flag to false.

It is safe to call repeatedly:

```cpp id="23myka"
task.stop();
task.stop();
task.stop();
```

The operation is idempotent.

## `stop()` does not join

This:

```cpp id="qst161"
task.stop();
```

requests the scheduler loop to finish.

It does not wait for the scheduler thread to terminate.

The normal shutdown sequence is:

```cpp id="kj7xw5"
task.stop();
task.join();
```

Conceptually:

```text
stop()
  ↓
running = false
  ↓
scheduler eventually exits

join()
  ↓
wait for scheduler thread
```

## Stop before start

Calling:

```cpp id="s3331y"
task.stop();
task.join();
```

before `start()` is safe.

No scheduler thread exists, so `join()` simply returns.

## Stopping does not cancel submitted callbacks

This distinction is important.

Suppose:

```text
tick submitted
    ↓
callback queued in ThreadPool
    ↓
task.stop()
```

The callback already accepted by the pool remains ordinary ThreadPool work.

`stop()` prevents future periodic submissions.

It does not remove or cancel callbacks already submitted.

Use the task's `TaskOptions` cancellation mechanisms when submitted callbacks themselves need cancellation semantics.

## Join the scheduler thread

Use:

```cpp id="lrsf6f"
task.join();
```

after stopping.

If the internal thread is not joinable, the operation returns immediately.

The method is `noexcept`.

The ordinary lifecycle is:

```cpp id="aqxwna"
if (!task.start())
{
  return 1;
}

// ...

task.stop();
task.join();
```

## `stop()` does not wake the sleeping scheduler immediately

The current scheduler uses:

```cpp id="wa5f7b"
std::this_thread::sleep_until(next);
```

to wait for each tick.

`stop()` only updates an atomic flag.

It does not interrupt that sleep.

Therefore:

```cpp id="1qd6at"
task.stop();
task.join();
```

can wait until the current `sleep_until()` finishes.

For example, with:

```text
interval = 30 seconds
```

stopping just after the scheduler begins sleeping can cause `join()` to wait close to the remaining interval.

The scheduler checks the running state again after waking and exits without submitting another tick.

## Destructor

`PeriodicTask` automatically performs:

```cpp id="vh8r3b"
stop();
join();
```

in its destructor.

Therefore:

```cpp id="ctg79x"
{
  auto task = pool.schedule_every(
    [](){
      perform_work();
    }
  );

  task.start();
}
```

stops and joins the scheduler thread when the `PeriodicTask` object leaves scope.

The same sleep behavior applies to destruction.

If the scheduler is sleeping for a long interval, destruction can block until that sleep finishes.

## Executor lifetime

`PeriodicTask` stores an `ExecutorRef`.

That reference is non-owning.

Conceptually:

```text
PeriodicTask
    │
    └────► Executor
          non-owning
```

The executor must therefore outlive the periodic task and its scheduler thread.

The natural order is:

```cpp id="kzhh5n"
vix::threadpool::ThreadPool pool(4);

{
  auto task = pool.schedule_every(
    [](){
      perform_work();
    }
  );

  task.start();

  // ...

  task.stop();
  task.join();
}

pool.shutdown();
```

Do not destroy the pool while a periodic scheduler can still dereference it.

## Pool shutdown while periodic scheduling is active

If the pool is shut down while a periodic task is still running:

```text
PeriodicTask
    ↓
next tick
    ↓
ThreadPool::post()
    ↓
pool rejects submission
```

the periodic task observes a post failure.

With the default configuration:

```cpp id="fxsoh6"
config.stop_on_post_failure = true;
```

the periodic scheduler stops itself after that failed submission.

The already accepted callbacks remain governed by the pool's normal shutdown behavior.

## Post failure behavior

Each tick calls:

```cpp id="gyzn1f"
executor.post(
  callback,
  config.options
);
```

If `post()` returns `true`:

```text
submitted_ticks += 1
```

If it returns `false`:

```text
failed_posts += 1
```

Then `stop_on_post_failure` determines whether the periodic scheduler continues.

## Stop on post failure

The default is:

```cpp id="4cwv65"
config.stop_on_post_failure = true;
```

The behavior is:

```text
post tick
   ↓
post() returns false
   ↓
failed_posts += 1
   ↓
running = false
   ↓
scheduler exits
```

This prevents a periodic scheduler from continuing indefinitely when its executor no longer accepts work.

## Continue after post failure

Set:

```cpp id="25qm50"
config.stop_on_post_failure = false;
```

to continue periodic attempts after failed submissions.

Conceptually:

```text
tick
 ↓
post fails
 ↓
failed_posts += 1
 ↓
wait until next tick
 ↓
try again
```

For example, if the executor remains stopped:

```text
failed_posts
1
2
3
4
...
```

continues increasing until the periodic task itself is stopped.

## Invalid executor always stops

If the stored executor reference itself becomes invalid inside `submit_tick()`:

```text
executor invalid
      ↓
failed_posts += 1
      ↓
running = false
```

This path stops regardless of `stop_on_post_failure`.

A normally constructed task keeps its `ExecutorRef`, so the relevant lifetime rule remains that the referenced executor must stay alive.

## Submitted ticks

Inspect successful `post()` calls with:

```cpp id="e8gt7h"
const std::uint64_t ticks = task.submitted_ticks();
```

This counts:

```text
periodic submissions for which Executor::post()
returned true
```

It does not count scheduler wakeups independently.

For example:

```text
5 successful posts
2 failed posts

submitted_ticks() = 5
failed_posts()     = 2
```

## Submitted does not mean completed

A successful periodic submission means the executor accepted or handled the post.

It does not mean the callback later completed successfully.

With `ThreadPool`:

```text
PeriodicTask
    ↓
post() returns true
    ↓
submitted_ticks += 1
    ↓
callback waits in queue
    ↓
callback eventually runs
```

The callback can later:

```text
complete
throw
be classified as cancelled
be classified as timed out
```

without changing the periodic task's `submitted_ticks()` counter.

## Callback failures are not generally post failures

With a `ThreadPool`, `post()` normally returns after the task has been accepted into the runtime.

If the callback later throws:

```text
post() returned true
      ↓
submitted_ticks += 1
      ↓
worker executes callback
      ↓
callback throws
      ↓
ThreadPool records execution failure
```

`PeriodicTask::failed_posts()` does not increase because submission itself succeeded.

Use ThreadPool metrics when callback execution outcomes matter.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## InlineExecutor behaves differently

`PeriodicTask` can also use `InlineExecutor`:

```cpp id="34dmq1"
vix::threadpool::InlineExecutor executor;

vix::threadpool::PeriodicTask task(
  executor,
  [](){
    perform_work();
  }
);
```

`InlineExecutor::post()` executes the callback synchronously on the thread calling `post()`.

For `PeriodicTask`, that is the periodic scheduler thread.

Conceptually:

```text
PeriodicTask scheduler thread
          ↓
InlineExecutor::post()
          ↓
callback executes immediately
on scheduler thread
```

This differs significantly from ThreadPool execution.

## ThreadPool callbacks are asynchronous from the timer thread

With `ThreadPool`:

```text
timer thread
    ↓
post()
    ↓
returns after acceptance
    ↓
timer thread continues scheduling

worker
    ↓
executes callback independently
```

The periodic interval therefore controls submission times, not callback completion times.

## Callbacks can overlap

A periodic task does not wait for one ThreadPool callback to finish before submitting the next tick.

Suppose:

```text
interval = 100 ms
callback duration = 500 ms
```

The scheduler can submit:

```text
t = 0 ms    callback A
t = 100 ms  callback B
t = 200 ms  callback C
t = 300 ms  callback D
...
```

while earlier callbacks are still running or queued.

Depending on the worker count and task options, multiple invocations of the same periodic callback can therefore execute concurrently.

## PeriodicTask is not fixed-delay execution

The ThreadPool behavior is not:

```text
run callback
      ↓
wait for callback completion
      ↓
wait interval
      ↓
run callback again
```

Instead, it is based on periodic submissions:

```text
tick
 ↓
post callback

interval
 ↓
tick
 ↓
post callback
```

Callback completion is independent from the scheduler timer.

If overlapping executions are not acceptable, the application must provide its own serialization or running-state guard.

## Shared callback state must be thread-safe

Because multiple callback instances can overlap:

```cpp id="tv92mr"
int counter = 0;

auto task = pool.schedule_every(
  [&counter](){
    ++counter;
  },
  config
);
```

can contain a data race.

Use appropriate synchronization:

```cpp id="14q71y"
std::atomic<int> counter{0};

auto task = pool.schedule_every(
  [&counter](){
    counter.fetch_add(
      1,
      std::memory_order_relaxed
    );
  },
  config
);
```

Normal C++ concurrent-access rules apply.

## Fixed-rate scheduling after startup

After the first scheduled time is established, the scheduler advances its target time with:

```cpp id="6apvza"
next += config.interval;
```

rather than recalculating:

```text
now + interval
```

after every successful ThreadPool post.

Conceptually:

```text
target 1
   ↓
target 2 = target 1 + interval
   ↓
target 3 = target 2 + interval
```

This gives the scheduler a fixed-rate target sequence.

## Scheduler delay can produce catch-up submissions

Because target times advance by the configured interval, if the scheduler thread itself wakes late:

```text
expected tick 1  100 ms
expected tick 2  200 ms
expected tick 3  300 ms

scheduler resumes at 350 ms
```

then after submitting one tick, the next target can already be in the past.

`std::this_thread::sleep_until()` returns immediately for a past target.

The scheduler can therefore submit several ticks close together while its target sequence catches up.

`PeriodicTask` does not intentionally drop missed ticks.

## `run_immediately` establishes the later schedule afterward

When:

```cpp id="a5dd5k"
config.run_immediately = true;
```

the implementation first calls:

```text
submit immediate tick
```

and then calculates:

```text
next = steady_clock::now() + interval
```

For a ThreadPool, the immediate `post()` usually returns quickly after acceptance.

For a synchronous executor such as `InlineExecutor`, the immediate callback finishes before the next scheduled time is calculated.

## InlineExecutor timing includes callback execution

With `InlineExecutor`, the periodic scheduler itself runs the callback.

Therefore:

```text
scheduler
  ↓
callback begins
  ↓
callback executes
  ↓
callback returns
  ↓
scheduler continues
```

Long callback execution directly delays the scheduling loop.

This is different from ThreadPool, where callback execution occurs independently on workers.

## TaskOptions for every tick

`PeriodicTaskConfig` contains:

```cpp id="3k5azs"
config.options;
```

These options are passed to every callback submission.

For example:

```cpp id="ta92kj"
vix::threadpool::PeriodicTaskConfig config;

config.interval = std::chrono::milliseconds{100};

config.options.set_priority(
  vix::threadpool::TaskPriority::high
);
```

Every periodic callback is posted with high priority.

## Priority

Periodic callbacks can use:

```cpp id="q3z9ay"
config.options.set_priority(
  vix::threadpool::TaskPriority::high
);
```

Each accepted tick becomes an ordinary high-priority task in its selected worker queue.

Priority does not alter the periodic clock.

It only affects normal queue ordering after submission.

## Worker affinity

Affinity can be used:

```cpp id="4l2muc"
config.options.set_affinity(
  vix::threadpool::WorkerId{2}
);
```

Every periodic tick then carries the same worker affinity.

Conceptually:

```text
tick 1 ──┐
tick 2 ──┤
tick 3 ──┼──► Worker 2
tick 4 ──┘
```

This can serialize callback execution on one worker, although callbacks can still accumulate in that worker's queue when they are submitted faster than they complete.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Cancellation

A cancellation token can be attached to every tick:

```cpp id="hhbnz3"
vix::threadpool::CancellationSource source;

vix::threadpool::PeriodicTaskConfig config;

config.options.set_cancellation(
  source.token()
);
```

The token is copied into every post.

Cancelling it does not stop the `PeriodicTask` scheduler itself.

It affects the submitted callback tasks.

Conceptually:

```text
source.request_cancel()
        ↓
future periodic post still happens
        ↓
callback task receives cancelled token
        ↓
ThreadPool can skip callback execution
```

The periodic scheduler continues until:

```cpp id="1jua7u"
task.stop();
```

or a configured post failure stops it.

## Cancellation is different from stopping periodic scheduling

These operations solve different problems.

```cpp id="xk485j"
source.request_cancel();
```

means:

```text
submitted callback work should observe cancellation
```

while:

```cpp id="1kf3ks"
task.stop();
```

means:

```text
do not schedule future periodic submissions
```

Use both when both behaviors are required.

## Deadline reuse

A `Deadline` inside:

```cpp id="3na44v"
config.options
```

is copied to every tick.

A deadline is absolute.

For example:

```cpp id="g5eupx"
config.options.set_deadline(
  vix::threadpool::Deadline::after(
    std::chrono::seconds{5}
  )
);
```

creates one absolute time point when the config is built.

All later periodic submissions receive that same deadline.

After it expires, later callback tasks can be skipped.

The deadline is not automatically renewed for each periodic tick.

## Per-tick deadlines require application logic

If every tick should receive a fresh deadline relative to its own submission time, one static:

```cpp id="ch8a9j"
config.options.deadline
```

cannot express that.

`PeriodicTask` reuses the configured `TaskOptions` for each submission.

It does not regenerate:

```text
Deadline::after(...)
```

at every tick.

Use callback-level logic or a different scheduling composition when a fresh absolute deadline is required for each execution.

## Timeout

A timeout in periodic options:

```cpp id="w1o4w1"
config.options.set_timeout(
  vix::threadpool::Timeout::milliseconds(100)
);
```

is copied to every tick.

Each submitted callback task receives its own execution-duration timeout observation.

The timeout does not control the scheduler interval and does not stop a callback after 100 milliseconds.

See [Timeouts](/modules/threadpool/timeouts).

## Queue pressure

Because periodic submission does not wait for callback completion, slow work can accumulate.

Suppose:

```text
interval          10 ms
callback duration 500 ms
```

The scheduler can submit work much faster than workers complete it.

Conceptually:

```text
scheduler:
tick tick tick tick tick tick ...

workers:
        callback
        callback

queues:
        callback
        callback
        callback
        callback
        ...
```

With unbounded queues, pending work can continue growing according to available memory.

With bounded queues, later periodic posts can fail.

## Bounded queue rejection

Suppose the pool uses:

```cpp id="oxlbjz"
vix::threadpool::ThreadPoolConfig poolConfig;
poolConfig.thread_count = 2;
poolConfig.max_queue_size = 4;

vix::threadpool::ThreadPool pool(poolConfig);
```

If periodic callbacks accumulate until the selected worker queue cannot accept another task:

```text
Executor::post() returns false
```

Then:

```text
failed_posts += 1
```

With the default:

```cpp id="ycz2vr"
config.stop_on_post_failure = true;
```

the periodic scheduler stops.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Observe counters

The periodic scheduler exposes two counters:

```cpp id="15f1a8"
task.submitted_ticks();
task.failed_posts();
```

For example:

```cpp id="rruu46"
const auto submitted = task.submitted_ticks();
const auto failed = task.failed_posts();
```

Both are atomic counters and can be inspected while the scheduler is running.

They describe submission behavior, not full callback execution outcomes.

## Counters are cumulative

Stopping a periodic task does not reset:

```text
submitted_ticks
failed_posts
```

If the same object is started again after a complete stop and join cycle, the counters continue from their previous values.

Conceptually:

```text
first run
submitted_ticks = 5

stop()
join()

second run
2 more successful posts

submitted_ticks = 7
```

There is no public counter reset operation.

## Restarting a PeriodicTask

A stopped task can be started again after its previous scheduler thread has been joined:

```cpp id="x0nm7k"
task.stop();
task.join();

if (!task.start())
{
  return 1;
}
```

The callback, executor reference, configuration, and counters remain stored.

## Join before restarting

Do not restart a periodic task while its previous `std::thread` remains joinable.

Use:

```cpp id="f47d4x"
task.stop();
task.join();
task.start();
```

rather than:

```cpp id="pr1ew5"
task.stop();
task.start();
```

The current implementation assigns a new `std::thread` inside `start()`. The previous thread must therefore have been joined first.

The same rule applies when the scheduler stopped itself after a post failure.

Call `join()` before starting it again.

## Non-copyable

`PeriodicTask` cannot be copied.

```text
copy construction disabled
copy assignment disabled
```

This reflects ownership of its scheduler thread and state.

## Movable

`PeriodicTask` provides move construction and move assignment.

However, the scheduler thread executes a loop tied to the object's internal state.

For safe application use, move periodic task objects while they are stopped and joined.

The normal safe sequence is:

```text
stop
 ↓
join
 ↓
move object
```

Avoid relocating a running periodic task.

## `schedule_every()` return value

This pattern is the natural ThreadPool API:

```cpp id="m9i6f7"
auto task = pool.schedule_every(
  [](){
    perform_work();
  },
  config
);
```

The returned object begins stopped and can be owned directly by the caller without managing the lower-level `ExecutorRef`.

## Complete lifecycle

A complete periodic task lifecycle is:

```text
construct
   ↓
not running
   ↓
start()
   ↓
scheduler thread created
   ↓
periodic post attempts
   ↓
stop()
   ↓
running = false
   ↓
join()
   ↓
scheduler thread reclaimed
   ↓
optional restart
   or
destruction
```

In code:

```cpp id="uixrfl"
auto task = pool.schedule_every(
  [](){
    perform_work();
  },
  vix::threadpool::PeriodicTaskConfig::every(
    std::chrono::milliseconds{250}
  )
);

if (!task.start())
{
  return 1;
}

// Application work.

task.stop();
task.join();
```

## Complete observed-ticks example

```cpp id="t0r3hi"
#include <atomic>
#include <chrono>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(2);
  std::atomic<int> observed{0};

  vix::threadpool::PeriodicTaskConfig config;
  config.interval = std::chrono::milliseconds{50};
  config.run_immediately = true;

  auto task = pool.schedule_every(
    [&observed](){
      observed.fetch_add(
        1,
        std::memory_order_relaxed
      );
    },
    config
  );

  if (!task.start())
  {
    return 1;
  }

  std::this_thread::sleep_for(
    std::chrono::milliseconds{180}
  );

  task.stop();
  task.join();

  pool.wait_idle();

  if (task.failed_posts() != 0)
  {
    return 1;
  }

  return observed.load(std::memory_order_relaxed) > 0 ? 0 : 1;
}
```

`pool.wait_idle()` after `task.join()` waits for callbacks that were already submitted before periodic scheduling stopped.

## PeriodicTask vs manual loop

A manual loop might look like:

```cpp id="rqdfz5"
while (running)
{
  pool.post([](){
    perform_work();
  });

  std::this_thread::sleep_for(
    std::chrono::seconds{1}
  );
}
```

`PeriodicTask` packages the recurring scheduling state into one abstraction:

```text
interval
first-run behavior
task options
post-failure behavior
scheduler thread
submission counters
lifecycle
```

The callback itself remains an ordinary executor task.

## PeriodicTask does not guarantee exact real-time execution

The configured interval is a scheduling target.

Actual callback start time depends on:

```text
operating-system scheduler
PeriodicTask timer-thread wakeup
ThreadPool scheduling
worker availability
queue length
priority
affinity
other tasks
```

Therefore:

```text
interval = 100 ms
```

does not guarantee that user callback code begins exactly every 100 milliseconds.

`PeriodicTask` is a periodic task-submission abstraction, not a hard real-time scheduler.

## Choosing an interval

A shorter interval creates more frequent post attempts.

The useful interval should account for:

```text
callback execution cost
available workers
queue capacity
acceptable overlap
executor load
required scheduling precision
```

If periodic submissions arrive faster than the executor can process them, backlog or rejection can result.

The interval should therefore be part of workload design rather than only timer configuration.

## Periodic model summary

The normal ThreadPool path is:

```text
PeriodicTask::start()
        ↓
scheduler thread
        ↓
run_immediately?
   ┌────┴────┐
  yes       no
   │         │
post tick    │
   └────┬────┘
        ↓
next = now + interval
        ↓
sleep_until(next)
        ↓
still running?
   ┌────┴────┐
   no       yes
   │         │
 exit        ▼
         Executor::post()
              ↓
         accepted?
          ┌───┴───┐
         yes      no
          │        │
 submitted++   failed++
          │        │
          │   stop_on_failure?
          │      ┌─┴─┐
          │     yes no
          │      │   │
          │     stop │
          └──────┴───┘
                 ↓
         next += interval
                 ↓
              repeat
```

The important properties are:

- `PeriodicTask` periodically calls `Executor::post()`.
- Each running periodic task owns one scheduler thread.
- The scheduler thread is separate from ThreadPool workers.
- `ThreadPool::schedule_every()` constructs a periodic task but does not start it.
- `start()` must be called explicitly.
- The default interval is 1000 milliseconds.
- Non-positive intervals normalize to 1 millisecond.
- `run_immediately` defaults to `false`.
- With `run_immediately == false`, the first tick occurs after one interval.
- With `run_immediately == true`, one tick is submitted before the first interval wait.
- `stop()` requests scheduler termination but does not join.
- `join()` should normally follow `stop()`.
- `stop()` does not interrupt the scheduler's current `sleep_until()`, so joining or destruction can wait for the remaining interval.
- The destructor calls `stop()` and `join()`.
- The executor reference is non-owning and must remain alive.
- Stopping periodic scheduling does not cancel callbacks already submitted.
- With ThreadPool, callback execution is asynchronous from the timer thread.
- Periodic callbacks can overlap when execution takes longer than the interval.
- Slow callbacks can create queue backlog.
- Scheduling uses fixed-rate target advancement with `next += interval`.
- Delayed scheduler wakeups can produce closely spaced catch-up submissions.
- `TaskOptions` are reused for every periodic submission.
- Priority, affinity, cancellation, deadline, timeout, queue capacity, and rejection keep their normal executor semantics.
- An absolute deadline stored in the configuration is not renewed for each tick.
- Cancellation of callback tasks does not stop the periodic scheduler.
- `submitted_ticks()` counts successful `Executor::post()` calls.
- `failed_posts()` counts `Executor::post()` calls that returned false.
- Successful submission does not mean successful callback completion.
- The default `stop_on_post_failure` is `true`.
- `stop_on_post_failure == false` allows repeated post attempts after failure.
- Counters remain cumulative across stop and restart cycles.
- Join the previous scheduler thread before restarting.
- `PeriodicTask` is non-copyable.
- For safe use, move it only while stopped and joined.
- The interval is a scheduling target, not a hard real-time execution guarantee.

Continue with [Metrics and Statistics](/modules/threadpool/metrics-and-statistics) for observing executor activity, task outcomes, queue pressure, and timing.
