# Synchronization

The ThreadPool module provides two synchronization primitives for coordinating work across threads:

```text
Latch
Barrier
```

They solve different synchronization problems.

A `Latch` waits for a counter to reach zero once.

A `Barrier` waits for a fixed number of participants and can be reused across multiple synchronization phases.

```text
Latch
  ↓
one-shot completion point


Barrier
  ↓
reusable phase boundary
```

These primitives coordinate threads or tasks. They do not submit work themselves.

## Latch

`Latch` is a one-shot synchronization primitive.

It starts with a counter:

```cpp
vix::threadpool::Latch latch(4);
```

Other threads decrease the counter:

```cpp
latch.count_down();
```

A waiting thread blocks until the counter reaches zero:

```cpp
latch.wait();
```

The basic model is:

```text
initial count = 4

count_down() → 3
count_down() → 2
count_down() → 1
count_down() → 0
                  ↓
              release waiters
```

Once the counter reaches zero, the latch remains open permanently.

## Wait for several ThreadPool tasks

A common use is waiting for several independent tasks to reach a completion point.

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);
  vix::threadpool::Latch latch(4);

  for (int i = 0; i < 4; ++i)
  {
    const bool accepted = pool.post([&latch](){
      latch.count_down();
    });

    if (!accepted)
    {
      return 1;
    }
  }

  latch.wait();

  return 0;
}
```

The main thread waits until all four posted tasks call `count_down()`.

Conceptually:

```text
Task 1 ──► count_down()
Task 2 ──► count_down()
Task 3 ──► count_down()
Task 4 ──► count_down()
               │
               ▼
            count = 0
               │
               ▼
          main thread wakes
```

## Construct a Latch

The constructor receives the initial count:

```cpp
vix::threadpool::Latch latch(8);
```

The current value is available through:

```cpp
const std::size_t count = latch.count();
```

Immediately after construction:

```text
count() = 8
```

## Zero-count Latch

A zero-count latch is already ready:

```cpp
vix::threadpool::Latch latch(0);
```

It reports:

```text
count()  = 0
ready()  = true
```

and:

```cpp
latch.wait();
```

returns immediately.

Unlike `Barrier`, a zero value is not normalized to one for `Latch`.

## Count down by one

Use:

```cpp
latch.count_down();
```

to subtract one from the current counter.

For example:

```text
before: 3
count_down()
after:  2
```

When the operation reaches zero:

```text
before: 1
count_down()
after:  0
         ↓
notify all waiters
```

## Count down by an amount

`Latch` also supports:

```cpp
latch.count_down(3);
```

For example:

```text
before = 5
amount = 3
after  = 2
```

If the amount is greater than or equal to the remaining count, the counter becomes zero:

```text
before = 2
amount = 10
after  = 0
```

The counter never underflows.

Conceptually:

```text
amount >= count
      ↓
count = 0
```

## Count down after zero

Once the latch reaches zero:

```cpp
latch.count_down();
```

has no effect.

The same applies to:

```cpp
latch.count_down(10);
```

The latch stays permanently open:

```text
0
↓
count_down()
↓
0
```

## Wait

Use:

```cpp
latch.wait();
```

to block the calling thread until:

```text
count == 0
```

If the counter is already zero, `wait()` returns immediately.

Internally, waiting uses a condition variable rather than continuously polling the counter.

## Arrive and wait

A participant can decrement the counter and then wait for the remaining participants with:

```cpp
latch.arrive_and_wait();
```

This is equivalent to:

```text
count_down()
    ↓
wait()
```

For example, with three participants:

```text
Participant A
arrive_and_wait()
      ↓
count = 2
      ↓
wait


Participant B
arrive_and_wait()
      ↓
count = 1
      ↓
wait


Participant C
arrive_and_wait()
      ↓
count = 0
      ↓
all participants continue
```

## Check readiness

Use:

```cpp
if (latch.ready())
{
  // Counter reached zero.
}
```

The alias:

```cpp
latch.is_ready();
```

reports the same state.

The relationship is:

```text
count() == 0
      ↓
ready() == true
```

Once readiness becomes true, it remains true for the rest of the latch lifetime.

## Latch is one-shot

A `Latch` cannot be reset.

Its lifecycle is:

```text
initial count
      ↓
count decreases
      ↓
zero
      ↓
permanently ready
```

There is no:

```text
reset()
reuse()
set_count()
```

operation.

Create another `Latch` for another synchronization cycle.

## Barrier

`Barrier` is a reusable synchronization primitive.

It waits until a configured number of participants have arrived.

When the last participant arrives:

```text
all waiting participants are released
        +
the barrier automatically resets
```

For example:

```cpp
vix::threadpool::Barrier barrier(4);
```

requires four arrivals in each generation.

## Barrier with ThreadPool tasks

A barrier is useful when several tasks execute work in phases.

```cpp
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);
  vix::threadpool::Barrier barrier(4);

  std::atomic<int> completed{0};

  for (int i = 0; i < 4; ++i)
  {
    const bool accepted = pool.post([&barrier, &completed](){
      // Phase 1.
      barrier.arrive_and_wait();

      // Phase 2.
      completed.fetch_add(1, std::memory_order_relaxed);
    });

    if (!accepted)
    {
      return 1;
    }
  }

  pool.wait_idle();

  return completed.load(std::memory_order_relaxed) == 4 ? 0 : 1;
}
```

Every task must reach the barrier before any of them can continue into the second phase.

Conceptually:

```text
Task A ──┐
Task B ──┤
Task C ──┼──► Barrier ──► all continue
Task D ──┘
```

## Construct a Barrier

Specify the required participant count:

```cpp
vix::threadpool::Barrier barrier(4);
```

Inspect it with:

```cpp
const std::size_t participants = barrier.participants();
```

The result is:

```text
4
```

The participant count remains fixed for the barrier lifetime.

## Zero participants

A participant count of zero is normalized to one:

```cpp
vix::threadpool::Barrier barrier(0);
```

produces:

```text
participants() = 1
remaining()    = 1
```

Therefore one arrival completes each barrier generation.

## Arrive and wait

The main barrier operation is:

```cpp
barrier.arrive_and_wait();
```

It performs two actions:

```text
arrive
  ↓
decrement remaining participants
  ↓
wait if this was not the final arrival
```

Suppose the barrier has three participants:

```text
remaining = 3
```

The first participant calls:

```cpp
barrier.arrive_and_wait();
```

giving:

```text
remaining = 2
participant waits
```

The second gives:

```text
remaining = 1
participant waits
```

The third gives:

```text
remaining = 0
      ↓
generation completes
      ↓
remaining resets to 3
      ↓
generation increments
      ↓
all waiters wake
```

## The final participant does not block

The participant that reduces the remaining count to zero completes the current generation.

It:

```text
resets the counter
increments the generation
notifies all waiters
returns
```

It does not wait for another notification.

The other participants wake because the generation has changed.

## Barrier generations

A `Barrier` tracks a generation number.

A new barrier begins at:

```text
generation = 0
```

Every completed synchronization cycle increments it:

```text
generation 0
    ↓
all participants arrive
    ↓
generation 1
    ↓
all participants arrive
    ↓
generation 2
    ↓
...
```

Inspect it with:

```cpp
const std::size_t generation = barrier.generation();
```

## Barrier automatically resets

Unlike `Latch`, `Barrier` is reusable.

For example:

```cpp
barrier.arrive_and_wait();

// Perform another phase.

barrier.arrive_and_wait();
```

The same barrier can coordinate both phase boundaries.

For four participants:

```text
Generation 0
remaining: 4 → 3 → 2 → 1 → 0
                            ↓
                     reset to 4
                     generation 1


Generation 1
remaining: 4 → 3 → 2 → 1 → 0
                            ↓
                     reset to 4
                     generation 2
```

No explicit reset operation is needed.

## Multi-phase work

A barrier is useful for work structured into repeated phases:

```cpp
const bool accepted = pool.post([&barrier](){
  perform_phase_one();

  barrier.arrive_and_wait();

  perform_phase_two();

  barrier.arrive_and_wait();

  perform_phase_three();
});
```

Each participant follows the same sequence:

```text
Phase 1
   ↓
Barrier
   ↓
Phase 2
   ↓
Barrier
   ↓
Phase 3
```

No participant can pass a barrier generation until the required number of arrivals has occurred.

## Arrive without waiting

Use:

```cpp
barrier.arrive();
```

when a participant should count toward the current generation but should not wait for the other participants.

Conceptually:

```text
arrive()
   ↓
decrement remaining
   ↓
return immediately
```

If this arrival completes the generation:

```text
remaining becomes 0
        ↓
reset remaining
        ↓
increment generation
        ↓
wake current waiters
```

The caller itself still returns immediately.

## `arrive()` and `arrive_and_wait()`

The difference is:

```text
arrive()
  ↓
count this participant
  ↓
do not wait


arrive_and_wait()
  ↓
count this participant
  ↓
wait unless this is the last arrival
```

Use `arrive_and_wait()` for normal barrier participants.

Use `arrive()` when the participant has finished contributing to the current synchronization phase and does not need to wait.

## Wait without arriving

`Barrier` also provides:

```cpp
barrier.wait();
```

This waits for the current generation to advance.

It does not count as an arrival.

Conceptually:

```text
current generation = N
        ↓
wait()
        ↓
block until generation != N
```

Another set of participants must still perform the required arrivals.

## `wait()` does not reduce remaining

Suppose:

```text
participants = 3
remaining    = 3
```

Calling:

```cpp
barrier.wait();
```

leaves:

```text
remaining = 3
```

The caller is only observing the generation transition.

Three arrivals are still required to release the barrier.

## `wait()` observes the generation at call time

`wait()` captures the current generation when it starts.

For example:

```text
generation = 2
    ↓
wait() begins
    ↓
wait until generation != 2
```

If generation `2` had already completed before `wait()` was called, the call observes the new current generation and waits for the next transition.

It does not remember earlier releases.

This makes `wait()` a wait for a future generation change from the moment it begins.

## Release a Barrier manually

Use:

```cpp
barrier.release();
```

to force the current generation to complete.

The operation:

```text
resets remaining to participant count
increments generation
wakes all current waiters
```

For example:

```text
participants = 4
remaining    = 2
generation   = 3
```

after:

```cpp
barrier.release();
```

the state becomes:

```text
remaining  = 4
generation = 4
```

and waiters from generation `3` are released.

## `release()` does not change participant count

The configured participant count remains fixed.

```cpp
const auto participants = barrier.participants();

barrier.release();
```

does not modify:

```text
participants
```

It only completes the current generation and resets its remaining counter.

## Inspect remaining participants

Use:

```cpp
const std::size_t remaining = barrier.remaining();
```

This reports how many arrivals are still required for the current generation.

For a barrier with four participants:

```text
initial:
remaining = 4

one arrival:
remaining = 3

two arrivals:
remaining = 2
```

When the final arrival occurs, the barrier immediately resets.

Therefore the observable value after generation completion is again:

```text
remaining = 4
```

rather than remaining at zero.

## Barrier never stays at zero

This differs from `Latch`.

A latch reaches:

```text
0
```

and remains there.

A barrier reaching zero immediately performs:

```text
remaining = initial
generation++
```

Therefore its stable states are associated with the next generation.

Conceptually:

```text
Latch:
3 → 2 → 1 → 0 → 0 → 0


Barrier:
3 → 2 → 1 → 0
            ↓
            3 → 2 → 1 → 0
                        ↓
                        3
```

## Latch vs Barrier

The fundamental difference is reuse.

### Latch

Use `Latch` for:

```text
wait until N events happen once
```

For example:

```text
start several tasks
      ↓
each signals completion
      ↓
wait for all once
```

### Barrier

Use `Barrier` for:

```text
wait until N participants reach a checkpoint
then reuse the same checkpoint for another phase
```

For example:

```text
Phase 1
   ↓
all participants meet
   ↓
Phase 2
   ↓
all participants meet
   ↓
Phase 3
```

## Comparison

| Property               | `Latch`             | `Barrier`                        |
| ---------------------- | ------------------- | -------------------------------- |
| Counter                | Decreases to zero   | Decreases to zero per generation |
| Reusable               | No                  | Yes                              |
| Automatically resets   | No                  | Yes                              |
| Wait without arrival   | `wait()`            | `wait()`                         |
| Arrive and wait        | `arrive_and_wait()` | `arrive_and_wait()`              |
| Arrive without waiting | `count_down()`      | `arrive()`                       |
| Force release          | Not needed          | `release()`                      |
| Generation tracking    | No                  | Yes                              |
| Zero constructor value | Already ready       | Normalized to one                |

## Latch and Future solve different problems

A `Future` represents one asynchronous result:

```text
one task
   ↓
Future<T>
```

A `Latch` coordinates a count of events:

```text
event
event
event
event
  ↓
Latch
```

For example, if every task returns a value that must be consumed, use Futures:

```cpp
auto first = pool.submit([](){
  return 20;
});

auto second = pool.submit([](){
  return 22;
});

const int result = first.get() + second.get();
```

If only a collective completion signal is needed, a latch may be more appropriate:

```cpp
vix::threadpool::Latch latch(2);

pool.post([&latch](){
  perform_first_operation();
  latch.count_down();
});

pool.post([&latch](){
  perform_second_operation();
  latch.count_down();
});

latch.wait();
```

The abstractions communicate different information.

## Latch and Scope solve different problems

`Scope` owns and waits for Futures created by its spawned work:

```text
Scope
├── Future
├── Future
└── Future
```

A `Latch` owns only a counter:

```text
Latch
└── remaining count
```

A scope provides a structured lifetime boundary.

A latch provides an explicit synchronization point.

For work that naturally belongs to one C++ lifetime and should always be waited for, prefer `Scope`.

Use a latch when synchronization itself is the required primitive.

## Barrier and Scope solve different problems

A scope answers:

```text
Have all of these tracked tasks finished?
```

A barrier answers:

```text
Have all participants reached this phase boundary?
```

Barrier participants can continue executing after the barrier releases.

For example:

```text
Task A: phase 1 → barrier → phase 2
Task B: phase 1 → barrier → phase 2
Task C: phase 1 → barrier → phase 2
```

The barrier synchronizes tasks while they are still running.

A scope normally waits for their terminal asynchronous completion.

## Blocking worker threads

`Latch::wait()` and the Barrier waiting operations block the calling thread.

When called inside ThreadPool tasks, they therefore occupy worker threads while waiting.

For example:

```cpp
pool.post([&latch](){
  latch.wait();
});
```

uses one worker until the latch reaches zero.

This matters when other tasks on the same pool are required to release that synchronization primitive.

## Avoid exhausting the pool with waiting participants

Consider a pool with two workers:

```cpp
vix::threadpool::ThreadPool pool(2);
```

If two running tasks both wait for a third queued task:

```text
Worker 1
  Task A → waits

Worker 2
  Task B → waits

Queue
  Task C → must release them
```

Task C cannot start because both workers are blocked.

This can deadlock the workflow.

The same risk applies to barriers.

## Barrier participant count and pool capacity

Suppose:

```cpp
vix::threadpool::ThreadPool pool(2);
vix::threadpool::Barrier barrier(3);
```

and three tasks on that same pool all call:

```cpp
barrier.arrive_and_wait();
```

A possible execution is:

```text
Worker 1 → Task A reaches barrier and waits
Worker 2 → Task B reaches barrier and waits

Task C remains queued
```

The third arrival never occurs because no worker is available to execute Task C.

When barrier participants are tasks from one pool, make sure the runtime can actually allow the required arrivals to execute.

## Safe barrier sizing

A simple fixed arrangement is:

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::Barrier barrier(4);
```

with four tasks that each reach the barrier.

All four workers can reach the synchronization point.

This does not mean the barrier participant count must always equal the worker count.

It means the execution design must guarantee that enough participants can reach the barrier without all available execution capacity becoming blocked first.

## Waiting from an external thread

A synchronization primitive can also be waited from a thread outside the pool.

For example:

```cpp
vix::threadpool::ThreadPool pool(4);
vix::threadpool::Latch latch(4);

for (int i = 0; i < 4; ++i)
{
  pool.post([&latch](){
    perform_work();
    latch.count_down();
  });
}

latch.wait();
```

Here:

```text
main thread
   ↓
waits on Latch

worker threads
   ↓
perform work and count down
```

The main-thread wait does not consume one of the ThreadPool workers.

## Count down even when work fails

When a latch represents task completion, every execution path should eventually signal the latch.

For example:

```cpp
pool.post([&latch](){
  try
  {
    perform_work();
  }
  catch (...)
  {
    latch.count_down();
    throw;
  }

  latch.count_down();
});
```

A missing `count_down()` can leave:

```cpp
latch.wait();
```

blocked indefinitely.

In application code, a scope guard or another structured completion mechanism can make this easier to guarantee.

A `Latch` itself does not know whether a participant forgot to signal.

## Barrier arrivals must also match the protocol

A `Barrier` waits for the configured number of arrivals in every generation.

If one required participant never arrives:

```text
participants = 4

arrivals:
A
B
C

D never arrives
```

the waiting participants remain blocked.

The barrier cannot infer that a participant was cancelled, failed, or abandoned.

The application must design each synchronization generation so the required arrival count remains valid.

## Cancellation does not release synchronization primitives

Cancelling a ThreadPool task does not automatically:

```text
count down a Latch
arrive at a Barrier
release a Barrier
```

These are independent mechanisms.

For example:

```text
task cancelled before callable starts
        ↓
callable never calls latch.count_down()
        ↓
Latch can remain blocked
```

When cancellation and synchronization are combined, every cancellation path must preserve the synchronization protocol.

## Barrier release for exceptional control flow

`Barrier::release()` can be used when the current barrier generation must be abandoned explicitly:

```cpp
barrier.release();
```

This wakes the current waiters and starts a new generation.

It can be useful when application-level control decides that waiting for the remaining arrivals is no longer appropriate.

`release()` is explicit. Cancellation does not call it automatically.

## No timed waiting

The current `Latch` and `Barrier` APIs do not provide:

```text
wait_for()
wait_until()
```

operations.

Their blocking waits continue until their synchronization condition is satisfied.

For bounded caller-side waiting, another application-level mechanism is required.

Do not confuse these waits with:

```cpp
future.wait_for(...);
```

which belongs to `Future`.

## Thread safety

Both synchronization primitives protect their internal state with a mutex and use a condition variable for blocking waits.

They are designed for concurrent use from multiple threads.

For `Latch`, synchronized state includes:

```text
count
```

For `Barrier`, synchronized state includes:

```text
participant count
remaining count
generation
```

Inspection operations such as:

```cpp
latch.count();
latch.ready();

barrier.participants();
barrier.remaining();
barrier.generation();
```

also synchronize access to their state.

## Inspection values are snapshots

Because other threads may modify the synchronization state immediately afterward, values such as:

```cpp
const auto remaining = barrier.remaining();
```

are snapshots.

For example:

```text
remaining() returns 2
        ↓
another participant arrives
        ↓
actual remaining becomes 1
```

Do not use a previously read value as a substitute for the synchronization operations themselves.

## Latch cannot be copied or moved

`Latch` disables:

```text
copy construction
copy assignment
move construction
move assignment
```

Create the latch directly in the lifetime shared by its participants:

```cpp
vix::threadpool::Latch latch(4);
```

and pass it by reference when required:

```cpp
pool.post([&latch](){
  latch.count_down();
});
```

## Barrier cannot be copied or moved

`Barrier` also disables:

```text
copy construction
copy assignment
move construction
move assignment
```

Its identity represents one shared synchronization point.

Pass references to participants:

```cpp
pool.post([&barrier](){
  barrier.arrive_and_wait();
});
```

## Choosing a synchronization primitive

Use `Latch` when the requirement is:

```text
Wait until N events have happened once.
```

Use `Barrier` when the requirement is:

```text
Wait until N participants reach the same checkpoint,
then reuse that checkpoint in another phase.
```

Use `Future` when the requirement is:

```text
Wait for the result of one asynchronous operation.
```

Use `Scope` when the requirement is:

```text
Own several spawned operations within one structured lifetime.
```

Use `TaskGroup` when the requirement is:

```text
Manually register work and maintain aggregate completion accounting.
```

The distinction can be summarized as:

```text
Future
  one asynchronous result

Latch
  one-shot counter synchronization

Barrier
  reusable participant synchronization

Scope
  structured task lifetime

TaskGroup
  manual task accounting
```

## Synchronization model summary

`Latch` follows:

```text
initial count
      ↓
count_down()
      ↓
count_down()
      ↓
...
      ↓
count = 0
      ↓
all waiters continue
      ↓
Latch stays ready
```

`Barrier` follows:

```text
generation N
remaining participants
      ↓
arrivals
      ↓
remaining = 0
      ↓
release waiters
      ↓
reset remaining
      ↓
generation N + 1
      ↓
ready for another cycle
```

The important properties are:

- `Latch` is one-shot.
- A zero-count `Latch` is immediately ready.
- `count_down()` never lets the counter underflow.
- `count_down(amount)` can reduce the counter directly to zero.
- `arrive_and_wait()` on a latch decrements once and then waits.
- Once a latch reaches zero, all future waits return immediately.
- `Barrier` is reusable across generations.
- A zero participant count for `Barrier` is normalized to one.
- `arrive_and_wait()` counts the caller as a participant and waits when necessary.
- `arrive()` counts an arrival without waiting.
- `wait()` waits for the current generation to advance without counting as an arrival.
- `release()` explicitly completes the current generation.
- A completed barrier generation immediately resets its remaining count.
- `generation()` increments on every normal or forced release.
- Both primitives block the calling thread while waiting.
- Blocking ThreadPool workers can deadlock a workflow when queued tasks are required to release them.
- Cancellation does not automatically satisfy a latch or barrier.
- The current APIs do not provide timed waiting.
- Both primitives are thread-safe and are neither copyable nor movable.

Continue with [Parallel Algorithms](/modules/threadpool/parallel-algorithms) for higher-level parallel work built on ThreadPool task submission.
