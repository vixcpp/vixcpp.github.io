# Timers

The timer service lets Vix Async wait for time without blocking the scheduler thread.

It supports two workflows. `sleep_for()` suspends a coroutine until a delay completes. `after()` schedules a callback to run later. Both use `std::chrono::steady_clock`, so timer delays are based on monotonic elapsed time rather than wall-clock time.

## Header

Use the public Vix Async header:

```cpp id="v8r2qw"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="es9k1f"
#include <vix/print.hpp>
```

The timer API lives in:

```cpp id="1tspwx"
vix::async::core
```

## Wait inside a coroutine

Use `sleep_for()` when a coroutine needs to continue after a delay.

```cpp id="yd4vrg"
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

task<void> run(io_context& ctx)
{
  vix::print("waiting");

  co_await ctx.timers().sleep_for(100ms);

  vix::print("done");
}

int main()
{
  io_context ctx;

  std::move(run(ctx)).start(ctx.get_scheduler());

  ctx.run();

  return 0;
}
```

The coroutine suspends while the timer is pending. The scheduler thread remains available for other ready work.

When the delay expires, the timer service posts the coroutine continuation back to the context scheduler.

## What happens during `sleep_for()`

The execution flow is:

```text id="tf9x4i"
coroutine
    ↓
sleep_for()
    ↓
coroutine suspends
    ↓
timer thread waits
    ↓
deadline reached
    ↓
continuation posted to scheduler
    ↓
coroutine resumes
```

The timer thread does not execute the code after `co_await`.

Its job is to wait for deadlines and make work ready. Coroutine execution continues through the Vix scheduler.

## Timer durations use `std::chrono`

The timer service exposes:

```cpp id="7g4ckn"
using clock = std::chrono::steady_clock;
using time_point = clock::time_point;
using duration = clock::duration;
```

This means normal chrono durations can be passed directly:

```cpp id="ozvwpl"
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(250)
);
```

Chrono duration literals also work:

```cpp id="hv8a6z"
using namespace std::chrono_literals;

co_await ctx.timers().sleep_for(250ms);
co_await ctx.timers().sleep_for(2s);
```

The timer service uses a steady clock because a delay means elapsed time. A system clock adjustment should not make a five-second timer suddenly expire early or late because the wall clock changed.

## Zero and negative delays

A `sleep_for()` delay less than or equal to zero completes immediately.

```cpp id="ih00nr"
co_await ctx.timers().sleep_for(
  std::chrono::milliseconds(0)
);
```

No timer wait is needed.

The coroutine can continue without waiting for the timer worker.

This is useful for generic code where the delay may be calculated dynamically and can legitimately become zero.

## Schedule a callback

Use `after()` when code needs a callback to execute after a delay instead of suspending a coroutine.

```cpp id="f8g5po"
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

int main()
{
  io_context ctx;

  ctx.timers().after(
    100ms,
    [](){
      vix::print("timer fired");
    }
  );

  ctx.run();

  return 0;
}
```

`after()` returns immediately after registering the timer.

When the deadline arrives, the callback is posted to the context scheduler and executes there.

The timer worker itself does not run the callback.

## `sleep_for()` and `after()` solve different problems

Use `sleep_for()` when the delay is part of coroutine control flow:

```cpp id="0vxsog"
vix::print("before");

co_await ctx.timers().sleep_for(100ms);

vix::print("after");
```

Use `after()` when an independent callback should be scheduled:

```cpp id="gg9id9"
ctx.timers().after(
  100ms,
  [](){
    perform_action();
  }
);
```

The difference is about how the caller observes completion.

```text id="4ckdh1"
sleep_for()
    ↓
suspend current coroutine
    ↓
resume same coroutine later

after()
    ↓
register callback
    ↓
caller continues immediately
    ↓
callback executes later
```

## Several timers

The service can manage several pending deadlines.

```cpp id="odnvll"
ctx.timers().after(
  200ms,
  [](){
    vix::print("second");
  }
);

ctx.timers().after(
  50ms,
  [](){
    vix::print("first");
  }
);
```

Timers are ordered by deadline, not by the order in which they were registered.

The 50 millisecond timer becomes ready before the 200 millisecond timer.

When two entries have the same deadline, the timer service uses their registration sequence to keep a stable order.

## Earlier timers can preempt the current wait

The timer worker may already be waiting for a deadline when another timer is registered.

Suppose a 500 millisecond timer is pending:

```text id="mkmcyi"
now ───────────────────────── 500ms
                              timer A
```

Then another thread registers a timer that should expire much earlier:

```text id="5q0k31"
now ───── 100ms ───────────── 500ms
          timer B              timer A
```

The worker is notified and updates its wait so timer B can fire first.

A newly registered earlier deadline does not have to wait for the previously selected timer.

## Cancel `sleep_for()`

`sleep_for()` accepts a `cancel_token`.

```cpp id="un51vi"
#include <chrono>
#include <system_error>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

task<void> wait(
  io_context& ctx,
  cancel_token token)
{
  try
  {
    co_await ctx.timers().sleep_for(
      5s,
      token
    );

    vix::print("completed");
  }
  catch (const std::system_error& error)
  {
    if (error.code() == cancelled_ec())
    {
      vix::print("canceled");
      co_return;
    }

    throw;
  }
}
```

If cancellation is requested while the coroutine is waiting, it does not need to wait until the five-second deadline.

The cancellation registration makes the wait ready, and the coroutine returns through the scheduler with `errc::canceled`.

## Cancellation before the wait starts

If the token is already cancelled before `sleep_for()` is awaited, the operation completes immediately with the cancellation error.

```cpp id="6ndxja"
cancel_source source;
source.request_cancel();

co_await ctx.timers().sleep_for(
  5s,
  source.token()
);
```

The timer does not need to be registered first and then cancelled.

The coroutine observes:

```cpp id="mgcwuu"
errc::canceled
```

through `std::system_error`.

## Cancel a callback timer

`after()` also accepts a cancellation token:

```cpp id="evsa2u"
cancel_source source;

ctx.timers().after(
  5s,
  [](){
    vix::print("timer fired");
  },
  source.token()
);
```

If cancellation has been observed before the timer entry is dispatched, the callback is skipped.

```cpp id="2iakau"
source.request_cancel();
```

Unlike `sleep_for()`, callback-style cancellation does not resume an awaiting coroutine because there is no coroutine waiting for the callback result.

## Cancellation boundary for `after()`

The cancellation check for `after()` happens before the timer job is posted to the scheduler.

This distinction matters.

```text id="umca4r"
timer still pending
      ↓
cancellation requested
      ↓
callback skipped
```

But once the deadline has already been processed and the callback has been posted to the scheduler, cancelling the token does not remove that already-posted callback from the scheduler queue.

```text id="7w4q88"
deadline reached
      ↓
callback posted to scheduler
      ↓
cancellation requested
      ↓
posted callback still executes
```

If cancellation must remain observable until the actual application operation begins, check the token inside the callback as well.

## Stop the timer service

The timer service can be stopped explicitly:

```cpp id="8fbmm7"
ctx.timers().stop();
```

After stopping, the service no longer executes queued callback timers.

Use:

```cpp id="doymgc"
bool stopped = ctx.timers().stopped();

vix::print("stopped:", stopped);
```

to inspect its state.

Stopping the timer service is permanent for that timer instance.

## `sleep_for()` during timer shutdown

A suspended `sleep_for()` must not remain waiting forever when the timer service stops.

If shutdown occurs before its deadline:

```text id="ptovb3"
coroutine waiting
      ↓
timer service stops
      ↓
pending sleep is completed as stopped
      ↓
continuation posted to scheduler
      ↓
coroutine resumes
```

The coroutine receives:

```cpp id="vib6pq"
errc::stopped
```

as a `std::system_error`.

This lets runtime shutdown release tasks that are still sleeping.

## Starting a sleep after stop

If the timer service is already stopped:

```cpp id="49w02f"
ctx.timers().stop();
```

then:

```cpp id="6s5wqz"
co_await ctx.timers().sleep_for(1s);
```

does not create a timer that can never fire.

It completes with `errc::stopped`.

## `after()` after stop

`after()` has no result channel.

If the timer service is already stopped, a newly scheduled callback is not accepted and will not execute.

```cpp id="epb1ww"
ctx.timers().stop();

ctx.timers().after(
  100ms,
  [](){
    vix::print("will not run");
  }
);
```

Because `after()` returns `void`, there is no rejection value for the caller to inspect.

Code that needs an observable asynchronous completion should use a coroutine operation such as `sleep_for()` instead.

## Timer callbacks and scheduler work

A callback registered with `after()` eventually becomes ordinary scheduler callback work.

This means the callback should remain short.

Avoid:

```cpp id="dcj3ek"
ctx.timers().after(
  100ms,
  [](){
    perform_expensive_cpu_work();
  }
);
```

The expensive function would execute on the scheduler thread and delay other ready coroutine work.

Move CPU-heavy work to the CPU pool when necessary.

```cpp id="2thdo6"
ctx.timers().after(
  100ms,
  [&ctx](){
    ctx.cpu_pool().post([](){
      perform_expensive_cpu_work();
    });
  }
);
```

The timer determines when the work becomes ready. The CPU pool determines where expensive synchronous work executes.

## Timer lifetime

The timer service belongs to its `io_context`.

A coroutine waiting on:

```cpp id="4o64nw"
ctx.timers().sleep_for(...);
```

still depends on the context and its scheduler.

The context must remain alive long enough for the timer to complete, be cancelled, or be stopped during shutdown.

The normal runtime relationship is:

```text id="iyebcn"
io_context alive
      ↓
timer pending
      ↓
completion or cancellation
      ↓
scheduler resumes work
      ↓
runtime can finish
```

`io_context::shutdown()` coordinates this relationship by stopping services while the scheduler is still available for their final continuations.

## API overview

The timer service exposes these main operations:

| API                                 | Purpose                                                     |
| ----------------------------------- | ----------------------------------------------------------- |
| `timer::after(duration, fn, token)` | Schedule a callback after a delay.                          |
| `timer::sleep_for(duration, token)` | Suspend a coroutine until the delay completes.              |
| `timer::stop()`                     | Stop the timer service and discard pending callback timers. |
| `timer::stopped()`                  | Check whether the service has been stopped.                 |
| `timer::clock`                      | `std::chrono::steady_clock`.                                |
| `timer::time_point`                 | Steady-clock deadline type.                                 |
| `timer::duration`                   | Steady-clock duration type.                                 |

`after()` returns `void`.

`sleep_for()` returns:

```cpp id="6i1vqj"
task<void>
```

and reports cancellation or timer-service shutdown through `std::system_error`.

## Next step

Continue with [Thread Pool](./thread-pool) to see how Vix Async moves blocking or CPU-intensive callables away from the scheduler thread.

Then read:

- [CPU Offloading](./cpu-offloading)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
