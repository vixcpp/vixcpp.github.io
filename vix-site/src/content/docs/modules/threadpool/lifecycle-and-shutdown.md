# Lifecycle and Shutdown

`ThreadPool` owns the scheduler and worker threads that execute submitted tasks.

Its normal lifecycle is:

```text id="n6f8y3"
construct
   ↓
starts automatically
   ↓
submit work
   ↓
optional wait_idle()
   ↓
shutdown()
   ↓
workers stop and join
```

The destructor calls `shutdown()` automatically.

```cpp id="e8fk63"
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  const int result = future.get();

  pool.shutdown();

  return result == 42 ? 0 : 1;
}
```

Calling `shutdown()` explicitly is optional when normal object destruction already provides the desired lifetime boundary.

## Automatic startup

Every `ThreadPool` constructor starts the pool automatically.

This applies to:

```cpp id="8rsio2"
vix::threadpool::ThreadPool pool;
```

```cpp id="kcz949"
vix::threadpool::ThreadPool pool(4);
```

and:

```cpp id="c8ntsw"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;

vix::threadpool::ThreadPool pool(config);
```

Immediately after successful construction:

```cpp id="h0ck7p"
pool.running();
```

returns:

```text id="3f995y"
true
```

## Construction path

The high-level construction sequence is:

```text id="9yewt2"
ThreadPoolConfig
      ↓
normalize configuration
      ↓
construct Scheduler
      ↓
Scheduler creates Worker objects
      ↓
ThreadPool::start()
      ↓
Scheduler::start()
      ↓
start every worker thread
```

Workers are created before their physical threads start.

## Default worker count

The default pool uses:

```cpp id="1mhuu1"
vix::threadpool::ThreadPoolConfig::default_thread_count();
```

which returns:

```text id="769wh8"
std::thread::hardware_concurrency()
```

or:

```text id="41dz45"
1
```

when hardware concurrency is unavailable.

Configuration normalization always guarantees at least one worker.

## Check whether the pool is running

Use:

```cpp id="1hj8ko"
if (pool.running())
{
  // Pool currently accepts ordinary work.
}
```

`ThreadPool::running()` requires both:

```text id="z1o0o6"
ThreadPool running flag
        +
Scheduler running flag
```

to be true.

Conceptually:

```text id="b3tmho"
pool running
    ↓
ordinary submissions allowed
```

After shutdown completes:

```text id="unwb1h"
pool.running() == false
```

## `start()`

Although construction starts the pool automatically, the lifecycle API also exposes:

```cpp id="f74q62"
const bool started = pool.start();
```

Calling `start()` while the pool is already running returns:

```text id="361gl7"
false
```

because no new running transition occurred.

For example:

```cpp id="rpfv87"
vix::threadpool::ThreadPool pool(4);

const bool started = pool.start();
```

produces:

```text id="j70jbc"
started = false
```

The existing workers continue running normally.

## Successful startup

When transitioning from stopped to running, `start()`:

```text id="bw7q6t"
sets ThreadPool running flag
      ↓
calls Scheduler::start()
      ↓
starts worker threads
```

If scheduler startup fails, the ThreadPool running flag is restored to `false`.

The return value therefore indicates whether a new running worker set was successfully started.

## Pool state and work state are different

A pool can be:

```text id="2enp6t"
running and busy
running and idle
stopped with no pending work
stopped with retained pending work
```

These concepts should not be conflated.

Use:

```cpp id="xuun9x"
pool.running();
```

for lifecycle state.

Use:

```cpp id="roaoz4"
pool.idle();
```

for observed work state.

## Check whether the pool is idle

Use:

```cpp id="yk8ga3"
if (pool.idle())
{
  // No queued or active task is currently observed.
}
```

The check is based on:

```text id="qgwbqp"
pending tasks == 0
        +
active tasks == 0
```

It does not mean:

```text id="wpcwgs"
pool is shut down
```

A normally running ThreadPool often spends most of its lifetime idle between workloads.

## Pending tasks

Use:

```cpp id="rzlrjh"
const std::size_t pending = pool.pending();
```

This returns the sum of tasks currently waiting in all worker-local queues.

For example:

```text id="vqpca6"
Worker 1 queue = 2
Worker 2 queue = 1
Worker 3 queue = 0
Worker 4 queue = 3

pool.pending() = 6
```

Tasks that workers have already removed for execution are no longer counted as pending.

## Active tasks

There is no direct:

```text id="zhdyb5"
pool.active()
```

method.

Use:

```cpp id="p59c3q"
const auto metrics = pool.metrics();
const auto active = metrics.active_tasks;
```

when the active task count is required.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Wait until current work becomes idle

Use:

```cpp id="z7rvuk"
pool.wait_idle();
```

This waits until the pool observes:

```text id="abgp51"
pending_tasks == 0
and
active_tasks == 0
```

For example:

```cpp id="oua1y0"
vix::threadpool::ThreadPool pool(4);

for (int i = 0; i < 8; ++i)
{
  const bool accepted = pool.post([](){
    perform_work();
  });

  if (!accepted)
  {
    return 1;
  }
}

pool.wait_idle();
```

After `wait_idle()` returns, the tasks submitted in that stable workload have finished executing or otherwise reached their runtime terminal path.

## `wait_idle()` does not shut down the pool

This:

```cpp id="r0qg26"
pool.wait_idle();
```

does not stop workers.

The pool remains reusable:

```cpp id="llhv0h"
pool.wait_idle();

auto future = pool.submit([](){
  return 42;
});
```

The lifecycle is:

```text id="t49brq"
running
   ↓
work
   ↓
wait_idle()
   ↓
still running
   ↓
more work
```

Use `shutdown()` when the worker runtime itself should stop.

## How `wait_idle()` observes idle state

The current implementation does not return after only one idle observation.

It requires two consecutive observations:

```text id="q61c9i"
check idle
   ↓
idle?
   │
   ├── no → continue
   │
   └── yes
        ↓
      yield
        ↓
check idle again
        ↓
idle again?
   ┌────┴────┐
  yes       no
   │         │
 return    continue
```

The loop uses:

```cpp id="4hpxw0"
std::this_thread::yield();
```

between observations.

This reduces sensitivity to a transient single idle snapshot.

## `wait_idle()` is not a submission barrier

`wait_idle()` does not close the pool against concurrent producers.

Suppose one thread waits:

```text id="0scxji"
Thread A
  ↓
wait_idle()
```

while another thread can still submit:

```text id="p8ooj1"
Thread B
  ↓
post new task
```

`wait_idle()` only waits for an observed idle condition.

It does not establish:

```text id="y8qosf"
no task can ever be submitted after this point
```

When a final lifecycle boundary is required:

```text id="zk6imv"
stop producers
      ↓
wait for desired work
      ↓
shutdown pool
```

is the application-level pattern.

## `wait_idle()` has no timeout

The current API provides:

```cpp id="2gkp7h"
pool.wait_idle();
```

but not:

```text id="9xpijc"
wait_idle_for()
wait_idle_until()
```

If work never reaches an idle state, `wait_idle()` can continue indefinitely.

This includes tasks that:

```text id="y20a8x"
never return
deadlock
wait forever on external state
continuously create more work
```

The ThreadPool does not impose a timeout on `wait_idle()` itself.

## Shutdown

Use:

```cpp id="l767wr"
pool.shutdown();
```

to stop the ThreadPool.

The operation performs:

```text id="kdj2ql"
ThreadPool running flag = false
        ↓
Scheduler::stop()
        ↓
request every Worker to stop
        ↓
Scheduler::join()
        ↓
join every worker thread
```

When `shutdown()` returns, the worker threads that can be joined through the normal external shutdown path have completed their worker loops and have been joined.

## Shutdown is cooperative

Stopping a worker does not forcibly kill its `std::thread`.

The worker observes its stop state through its loop.

If a callable is already executing:

```text id="k3gzs6"
worker
  ↓
callable running
  ↓
shutdown requested
  ↓
callable continues
  ↓
callable returns
  ↓
worker can stop
```

`shutdown()` therefore waits for currently executing C++ callables to return naturally.

There is no forced thread termination.

## A running task can delay shutdown

For example:

```cpp id="qgqjrn"
vix::threadpool::ThreadPool pool(1);

pool.post([](){
  std::this_thread::sleep_for(
    std::chrono::seconds{5}
  );
});

pool.shutdown();
```

If the worker has already started the callable, shutdown cannot interrupt the sleep.

The shutdown call waits for the worker thread to finish its current execution path.

This is why long-running work should use cooperative cancellation when early termination is required.

See [Cancellation](/modules/threadpool/cancellation).

## Shutdown is idempotent

Calling:

```cpp id="ypx2hu"
pool.shutdown();
pool.shutdown();
pool.shutdown();
```

is safe.

After the first completed shutdown:

```text id="vs7ujj"
running = false
workers already stopped and joined
```

Later calls repeat the stop/join operations safely without creating new workers.

This also makes automatic destructor shutdown safe after explicit shutdown.

## Post after shutdown

Ordinary posted work is rejected after shutdown:

```cpp id="502ju7"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

const bool accepted = pool.post([](){
  perform_work();
});
```

The result is:

```text id="d8qexx"
false
```

The callable does not execute.

## Submit after shutdown

`submit()` still returns a `Future`, but that Future immediately represents rejection:

```cpp id="r3upvm"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto future = pool.submit([](){
  return 42;
});
```

The Future reports:

```text id="rmmrnl"
ready()   true
status()  rejected
result()  rejected
error()   rejected
```

Calling:

```cpp id="5bzfdb"
future.get();
```

throws `std::system_error`.

## Handle after shutdown

`handle()` behaves similarly:

```cpp id="t19g4b"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto handle = pool.handle([](){
  return 42;
});
```

The returned handle still contains its task ID, Future, and cancellation source, but its asynchronous result is already rejected.

The handle is not evidence that the runtime accepted the task.

## Default shutdown drains queued work

The default configuration is:

```cpp id="nwhdgm"
vix::threadpool::ThreadPoolConfig config;

config.drain_on_shutdown == true;
```

This means worker loops continue consuming their existing local queues after stop is requested.

Conceptually:

```text id="djkomp"
shutdown()
    ↓
stop accepting ordinary work
    ↓
workers receive stop request
    ↓
currently running task finishes
    ↓
queued tasks remain?
   ┌────┴────┐
  yes       no
   │         │
execute     exit
   │
repeat
```

With the default configuration, shutdown acts as a draining shutdown.

## Draining example

```cpp id="nzk482"
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPoolConfig config;
  config.thread_count = 1;
  config.drain_on_shutdown = true;

  vix::threadpool::ThreadPool pool(config);

  std::atomic<int> completed{0};

  for (int i = 0; i < 8; ++i)
  {
    const bool accepted = pool.post([&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    });

    if (!accepted)
    {
      return 1;
    }
  }

  pool.shutdown();

  return completed.load(std::memory_order_relaxed) == 8 ? 0 : 1;
}
```

Accepted queued tasks are processed before the worker loop exits.

## `drain_on_shutdown`

Configure shutdown behavior before construction:

```cpp id="nmlkr0"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 4;
config.drain_on_shutdown = false;

vix::threadpool::ThreadPool pool(config);
```

This field is transferred to the scheduler as:

```text id="20gymd"
SchedulerConfig::drain_on_stop
```

and then to every worker.

It cannot currently be changed through the high-level `ThreadPool` after construction.

## Shutdown without draining

With:

```cpp id="15i07x"
config.drain_on_shutdown = false;
```

the worker loop exits after its current active task when stop is observed.

Queued tasks are not executed merely to empty the queue.

Conceptually:

```text id="6x3a5p"
active task
    ↓
shutdown()
    ↓
active task finishes
    ↓
drain_on_shutdown == false
    ↓
worker exits
```

Tasks still in the local queue remain queued in the worker object.

## Non-draining shutdown does not clear queues

This distinction is important.

Non-draining shutdown does not call:

```cpp id="h0ypux"
pool.clear();
```

The current path is:

```text id="mqtl29"
shutdown()
    ↓
stop workers
    ↓
worker exits without draining
    ↓
queued Task objects remain in TaskQueue
```

Therefore after non-draining shutdown:

```cpp id="77s6gb"
pool.pending();
```

can still be greater than zero.

## Verified retained-queue behavior

For example, with one worker:

```text id="9ecm3h"
Task A running
Task B queued
drain_on_shutdown = false
```

after shutdown:

```text id="9m5dta"
running = false
Task A finished
Task B still queued
pending() = 1
```

This is the current implementation behavior.

Non-draining shutdown should therefore be understood as:

```text id="p7ugtw"
stop workers without consuming remaining queues
```

not:

```text id="dgtp9y"
discard and finalize every queued task
```

## Non-draining shutdown and Futures

This has an important consequence for result-producing work.

Suppose:

```text id="q2g360"
Task A running
Task B queued
```

and Task B was created through:

```cpp id="hub47s"
auto future = pool.submit([](){
  return 42;
});
```

If non-draining shutdown stops the worker before Task B executes, the current implementation does not automatically complete that Future as:

```text id="chlh1c"
cancelled
rejected
timeout
broken promise
```

The queued wrapper simply remains in the worker queue.

Therefore:

```cpp id="k22l04"
future.ready();
```

can remain:

```text id="su17de"
false
```

after shutdown.

## Do not wait on abandoned Futures after non-draining shutdown

This pattern can block indefinitely:

```cpp id="79ipsb"
pool.shutdown();

future.get();
```

when the corresponding task remained queued during a non-draining shutdown.

The current runtime does not resolve that Future automatically.

If result-producing work must always reach a terminal Future state, prefer draining shutdown or explicitly coordinate cancellation and completion before stopping the pool.

## Destroying abandoned queued tasks does not create `broken_promise`

When the pool is eventually destroyed, retained queued task wrappers are destroyed with their worker queues.

The current custom `Promise` implementation does not automatically publish a `broken_promise` result when its producer disappears.

A surviving `Future` for such abandoned work can therefore remain non-ready rather than being converted to a terminal error.

This is an important limitation of non-draining shutdown for result-producing submissions.

## Prefer non-draining shutdown for disposable posted work

`drain_on_shutdown = false` is easiest to reason about for work where abandoning queued execution is explicitly acceptable.

For example:

```text id="bi3ay7"
best-effort telemetry
discardable refresh work
non-essential background notifications
```

For work represented by Futures that callers must consume, draining shutdown provides a clearer completion contract with the current implementation.

## `clear()`

Use:

```cpp id="9aijac"
const std::size_t removed = pool.clear();
```

to remove tasks that are still waiting in worker queues.

Conceptually:

```text id="enqbun"
Worker 1 queue ──┐
Worker 2 queue ──┼──► clear()
Worker 3 queue ──┤
Worker 4 queue ──┘
                     ↓
              remove queued tasks
```

The return value is the total number removed.

## `clear()` does not stop workers

Calling:

```cpp id="4wecw3"
pool.clear();
```

does not change:

```cpp id="1z540y"
pool.running();
```

A running pool remains running.

New tasks can still be submitted immediately afterward.

## `clear()` does not affect active tasks

A task already executing has already left its worker queue.

Therefore:

```text id="bbf6ea"
running task
    ↓
clear()
    ↓
running task continues
```

Only queued tasks are removed.

## `clear()` and `post()`

For fire-and-forget work:

```cpp id="pobg9u"
const std::size_t removed = pool.clear();
```

simply means those removed callbacks will not execute through their worker queues.

The pool remains available for other work.

## `clear()` and Future-producing tasks

For `submit()` and `handle()`, the current `clear()` behavior has the same important limitation as abandoned non-draining shutdown.

A queued task wrapper can contain the producer for a Future.

When `clear()` removes that wrapper, the current implementation does not publish a terminal result into the Future.

Conceptually:

```text id="zcoab2"
submit()
   ↓
Future returned
   ↓
task queued
   ↓
clear()
   ↓
queued wrapper destroyed
   ↓
Future can remain non-ready
```

## Do not use `clear()` as result-aware cancellation

For result-producing work, this is not a safe cancellation protocol:

```cpp id="khe75r"
auto future = pool.submit([](){
  return 42;
});

pool.clear();

future.get();
```

If the corresponding task was removed before execution, `future.get()` can block because no terminal value or error was published.

Use explicit cancellation and ensure the asynchronous operation reaches a result path when callers depend on its Future.

See [Cancellation](/modules/threadpool/cancellation).

## `clear()` can race with workers

Workers and `clear()` operate concurrently on the thread-safe local queues.

If a worker removes a task before `clear()` reaches it:

```text id="l0om14"
worker pops task
      ↓
task becomes active
      ↓
clear()
      ↓
task is no longer removable
```

Therefore:

```cpp id="y5qz0c"
const std::size_t removed = pool.clear();
```

can be smaller than the number of tasks that appeared pending immediately before the call.

The return value is the number actually removed.

## `clear()` followed by `wait_idle()`

For posted work, a useful pattern can be:

```cpp id="ml7i82"
const std::size_t removed = pool.clear();

pool.wait_idle();
```

This waits for any tasks that escaped clearing because they were already active or were removed by workers first.

It does not restore or execute the tasks that `clear()` removed.

For Future-producing work, remember the unresolved-Future limitation.

## Shutdown and `clear()` are different

`shutdown()` controls worker lifetime:

```text id="mz5n3i"
stop worker runtime
```

`clear()` controls queued work:

```text id="7epzi9"
remove current queued tasks
```

They can be composed:

```cpp id="1lhqoh"
pool.clear();
pool.shutdown();
```

but the semantics differ from draining shutdown.

With result-producing queued tasks, manually clearing them first can leave their Futures unresolved.

## Default recommended shutdown

For most applications using Futures, the simplest lifecycle is:

```cpp id="4ydpyc"
vix::threadpool::ThreadPool pool(4);

// Submit and use work.

pool.shutdown();
```

with the default:

```text id="t0odmu"
drain_on_shutdown = true
```

The accepted queue is processed before workers exit.

Explicit `wait_idle()` before shutdown is optional when draining shutdown itself provides the desired completion boundary.

## `wait_idle()` before shutdown

This pattern is also valid:

```cpp id="75x4am"
pool.wait_idle();
pool.shutdown();
```

It separates two intentions:

```text id="et313l"
wait_idle()
    ↓
wait until current work finishes
while pool is still running


shutdown()
    ↓
stop and join worker runtime
```

This can make application lifecycle logic easier to read.

## Draining shutdown does not require `wait_idle()` first

With the default configuration:

```cpp id="2ugzf9"
config.drain_on_shutdown = true;
```

this:

```cpp id="7krd3m"
pool.shutdown();
```

already requests worker stop while allowing queued tasks to drain before the threads exit.

Calling `wait_idle()` first is not required merely to make queued tasks execute.

Use it when the application specifically needs an idle point before stopping the runtime.

## Destructor

`ThreadPool::~ThreadPool()` is `noexcept` and calls:

```cpp id="s1la5r"
shutdown();
```

Therefore:

```cpp id="c6t69u"
{
  vix::threadpool::ThreadPool pool(4);

  pool.post([](){
    perform_work();
  });
}
```

performs ThreadPool shutdown at the closing brace.

With the default drain configuration, accepted queued work is drained before destruction completes.

## Destructor can block

Because shutdown joins workers, destruction can block while:

```text id="g1czz4"
active callable finishes
queued work drains
```

For example, a five-second running task can delay destruction by several seconds.

ThreadPool destruction is a lifecycle synchronization point.

## Scope lifetime around the pool

When using `Scope`, create the pool first:

```cpp id="9srgps"
vix::threadpool::ThreadPool pool(4);

{
  vix::threadpool::Scope scope(pool);

  scope.spawn([](){
    perform_work();
  });
}
```

The scope is destroyed and waits for its tracked tasks before the pool itself is destroyed.

Conceptually:

```text id="da7t0h"
ThreadPool lifetime
┌──────────────────────────────┐
│                              │
│   Scope lifetime             │
│   ┌────────────────────┐     │
│   │ scoped tasks       │     │
│   └────────────────────┘     │
│                              │
└──────────────────────────────┘
```

This is the natural ownership order.

## PeriodicTask lifetime around the pool

A `PeriodicTask` stores a non-owning reference to its executor.

Stop and join it before the pool is destroyed:

```cpp id="7krw43"
vix::threadpool::ThreadPool pool(4);

auto periodic = pool.schedule_every(
  [](){
    perform_periodic_work();
  }
);

periodic.start();

// ...

periodic.stop();
periodic.join();

pool.shutdown();
```

Do not leave a periodic scheduler running after the pool it references has been destroyed.

See [Periodic Tasks](/modules/threadpool/periodic-tasks).

## Restart after shutdown

The public lifecycle currently supports starting the same `ThreadPool` again after `shutdown()` has completed.

For example:

```cpp id="i5wkyl"
vix::threadpool::ThreadPool pool(2);

pool.shutdown();

const bool restarted = pool.start();
```

In the current implementation:

```text id="9c880i"
restarted = true
```

when the worker threads can be created again successfully.

The worker objects themselves are retained by the scheduler and receive new `std::thread` instances.

## Restart model

The sequence is:

```text id="ec4c1v"
running
   ↓
shutdown()
   ↓
workers stop
   ↓
workers join
   ↓
stopped
   ↓
start()
   ↓
worker threads start again
   ↓
running
```

Task counters and task ID generators are not reset.

The restarted pool continues the lifetime of the same `ThreadPool` object.

## Retained queues can execute after restart

This is especially important with:

```cpp id="0fqey4"
config.drain_on_shutdown = false;
```

Queued tasks retained during shutdown remain in their worker queues.

If the pool is restarted:

```text id="1vrhhm"
before shutdown:
Task A active
Task B queued

shutdown without drain:
Task A finishes
Task B remains queued

start again:
Worker restarts
      ↓
Task B executes
```

This behavior has been verified against the current implementation.

Therefore non-draining shutdown is not equivalent to permanently discarding queued work while the same pool object remains restartable.

## Clear retained work before restart when required

If non-draining shutdown is used and retained queued work must not execute after restart:

```cpp id="fjhyoz"
pool.shutdown();

const std::size_t removed = pool.clear();

const bool restarted = pool.start();
```

removes the retained queue before workers resume.

For posted disposable work, this can provide the intended reset.

For result-producing queued work, remember that `clear()` can leave associated Futures unresolved.

## Restart is not a state reset

Restarting does not reset:

```text id="qvekm5"
task IDs
queue sequence numbers
metrics counters
statistics counters
retained queued tasks
```

It restarts worker execution.

Conceptually:

```text id="63psu1"
same ThreadPool object
same Scheduler
same Worker objects
same counters
new worker std::threads
```

Create a new `ThreadPool` object when a completely fresh runtime state is required.

## `allow_after_stop`

`TaskOptions` exposes:

```cpp id="0oo76u"
options.set_allow_after_stop(true);
```

This is an advanced lifecycle option.

At the high-level ThreadPool boundary, ordinary submissions are accepted when:

```text id="ju2gib"
ThreadPool running == true
```

If the ThreadPool running flag is already false, `allow_after_stop` can only pass the first acceptance check while the internal scheduler is still running.

This creates a narrow concurrent shutdown window.

## After completed shutdown, `allow_after_stop` does not help

This does not work:

```cpp id="3u5qmm"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

vix::threadpool::TaskOptions options;
options.set_allow_after_stop(true);

const bool accepted = pool.post(
  [](){
    perform_work();
  },
  options
);
```

The result is:

```text id="djkbjy"
false
```

because after `shutdown()` returns:

```text id="22jhnj"
ThreadPool running = false
Scheduler running  = false
```

`allow_after_stop` is therefore not a way to submit work to a fully stopped pool.

## Do not design ordinary work around the shutdown window

The intended high-level lifecycle remains:

```text id="2qf19l"
running
  ↓
accept work

shutdown begins
  ↓
stop accepting ordinary work

shutdown complete
  ↓
stopped
```

`allow_after_stop` exists in the lower-level task model, but normal application work should not rely on racing submissions against shutdown.

Coordinate producers before final pool shutdown instead.

## Shutdown from an owning thread

The clearest lifecycle is for an external owner to perform shutdown:

```text id="bd6x5p"
application owner
      ↓
stop producers
      ↓
stop periodic schedulers
      ↓
wait/cancel structured work
      ↓
ThreadPool::shutdown()
```

This keeps worker lifetime management separate from the tasks the workers execute.

## Lifecycle with `post()`

For fire-and-forget work:

```text id="23o2h1"
post()
  ↓
accepted?
 ┌───┴───┐
 no      yes
 │        │
caller   queued
handles    ↓
failure  worker executes
            ↓
shutdown drains by default
```

The caller should check the `bool` returned by `post()` when losing the work is not acceptable.

## Lifecycle with `submit()`

For result-producing work:

```text id="1d6b36"
submit()
   ↓
Future returned
   ↓
task accepted?
 ┌────┴────┐
 no       yes
 │         │
Future    queued
rejected    ↓
          executes
            ↓
       Future result
```

With normal draining shutdown, accepted queued tasks continue toward execution.

With non-draining shutdown or `clear()`, queued Future-producing wrappers can be left without a terminal result.

## Lifecycle with `handle()`

`handle()` adds cooperative cancellation:

```text id="1r5zz3"
TaskHandle
  ├── TaskId
  ├── Future
  └── CancellationSource
```

Before final shutdown, application code can request cancellation for work it no longer needs:

```cpp id="qxcflm"
handle.cancel();
```

Cancellation remains cooperative and does not forcibly terminate a running callable.

## Recommended ownership order

A typical application lifetime can be organized as:

```text id="9r7kgu"
create ThreadPool
      ↓
create components that reference pool
      ↓
submit work
      ↓
stop new producers
      ↓
stop PeriodicTask schedulers
      ↓
close/wait Scopes or other structured work
      ↓
optional wait_idle()
      ↓
shutdown ThreadPool
      ↓
destroy dependent components
      ↓
destroy ThreadPool
```

The exact application structure can differ, but non-owning executor references should never outlive the pool they reference.

## Lifecycle model summary

The normal default path is:

```text id="bx6isa"
ThreadPool construction
        ↓
automatic start
        ↓
workers running
        ↓
post / submit / handle
        ↓
optional wait_idle()
        ↓
shutdown()
        ↓
running = false
        ↓
Scheduler::stop()
        ↓
Workers receive stop
        ↓
drain_on_shutdown?
    ┌───────┴───────┐
   true             false
    │                 │
finish queued      finish current
tasks              active task
    │                 │
    └────────┬────────┘
             ↓
        worker loops exit
             ↓
       Scheduler::join()
             ↓
          stopped
```

The important properties are:

- Every `ThreadPool` constructor starts the pool automatically.
- `running()` describes lifecycle state, not whether work currently exists.
- `idle()` means no pending or active task is currently observed.
- `pending()` counts tasks waiting in worker-local queues.
- `wait_idle()` waits for two consecutive idle observations and yields between checks.
- `wait_idle()` does not stop the pool.
- `wait_idle()` is not a barrier against concurrent future submissions.
- The current API has no timed `wait_idle()` variant.
- `shutdown()` sets the ThreadPool to stopped, stops the scheduler, and joins workers.
- Shutdown is cooperative and does not forcibly interrupt active C++ callables.
- Shutdown is safe to call repeatedly.
- The destructor calls `shutdown()` automatically.
- Destruction can block while active or draining work finishes.
- The default `drain_on_shutdown` value is `true`.
- Draining shutdown executes accepted queued work before worker exit.
- With `drain_on_shutdown=false`, workers stop after their active task rather than consuming remaining queues.
- Non-draining shutdown currently leaves queued task objects in their worker queues.
- `pending()` can therefore remain non-zero after non-draining shutdown.
- Futures corresponding to retained queued tasks are not automatically completed as cancelled, rejected, or broken promises.
- A surviving Future for abandoned queued work can remain non-ready.
- `clear()` removes queued work without stopping the pool.
- `clear()` does not affect already active tasks.
- Removing queued `submit()` or `handle()` work with `clear()` can also leave the corresponding Future unresolved.
- `clear()` should not be treated as result-aware cancellation.
- `post()` after completed shutdown returns `false`.
- `submit()` after completed shutdown returns an immediately rejected Future.
- `handle()` after completed shutdown returns a handle whose Future is rejected.
- `allow_after_stop` does not allow normal submission after shutdown has fully completed.
- The same ThreadPool object can currently be restarted with `start()` after `shutdown()`.
- Restart creates new worker threads around the existing worker objects and retained runtime state.
- Queued work preserved by non-draining shutdown can execute after restart.
- Restart does not reset IDs, counters, statistics, or queues.
- `Scope` and `PeriodicTask` objects referencing the pool should complete or stop before the pool is destroyed.
- For result-producing work, the default draining shutdown provides the clearest current completion model.

Continue with [Errors](/modules/threadpool/errors) for ThreadPool error codes, Future error propagation, rejection, cancellation, and timeout failures.
