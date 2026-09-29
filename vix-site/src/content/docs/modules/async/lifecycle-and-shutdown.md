# Lifecycle and Shutdown

An Async runtime can have work in several places at the same time.

A coroutine may be ready on the scheduler, another may be sleeping in the timer service, a CPU callable may be running on a worker, a signal wait may be pending, and a TCP operation may still be active in the networking backend.

Shutting down the runtime therefore requires more than stopping the scheduler. `io_context` coordinates these components so pending operations can leave their suspended state before the execution loop disappears.

## Header

Use the public Vix Async header:

```cpp id="msf0av"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="el6ci0"
#include <vix/print.hpp>
```

The runtime types live in:

```cpp id="oqmhpm"
vix::async::core
```

## The runtime lifetime

A typical Async program follows this lifetime:

```text id="7a2wrq"
create io_context
        ↓
create root task
        ↓
start root task
        ↓
run scheduler
        ↓
tasks and services operate
        ↓
stop or shutdown
        ↓
runtime finishes
        ↓
destroy io_context
```

The important part is that the context stays alive while tasks still depend on its scheduler or services.

## `run()` drives execution

A root task is normally started before calling `run()`:

```cpp id="14wl3b"
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> app()
{
  vix::print("running");
  co_return;
}

int main()
{
  io_context ctx;

  std::move(app()).start(
    ctx.get_scheduler()
  );

  ctx.run();

  return 0;
}
```

`run()` executes the scheduler on the calling thread.

It remains the place where ready coroutine continuations and callbacks are processed.

## Suspended work still has runtime dependencies

A suspended coroutine is not executing, but it is still alive.

For example:

```cpp id="0cmg0h"
co_await ctx.timers().sleep_for(
  std::chrono::seconds(30)
);
```

creates this relationship:

```text id="5znfik"
coroutine frame
      ↓
timer operation
      ↓
timer service
      ↓
io_context scheduler
```

The coroutine still needs the timer service to complete its wait and the scheduler to resume it afterward.

The same applies to:

- network operations
- signal waits
- submitted CPU work
- task composition
- detached tasks

Suspension does not remove lifetime requirements.

## `stop()` and `shutdown()` are different

The context exposes two different lifecycle operations:

```cpp id="cpv8a6"
ctx.stop();
```

and:

```cpp id="pt1ucm"
ctx.shutdown();
```

They solve different problems.

`stop()` requests that the scheduler stop running.

`shutdown()` coordinates the complete Async runtime, including services that may still have pending work.

This distinction matters whenever timers, CPU workers, signals, or networking are active.

## `stop()`

Use `stop()` when the scheduler should finish its execution loop.

```cpp id="gbla9p"
ctx.stop();
```

For example, a root task may finish its application work and request scheduler termination:

```cpp id="1zx16n"
task<void> app(io_context& ctx)
{
  vix::print("finished");

  ctx.stop();

  co_return;
}
```

The scheduler stop request affects the execution loop.

It does not independently mean:

```text id="8h8gxa"
cancel every timer
stop every CPU worker
stop signal waiting
cancel every network operation
```

Those components have their own service lifetimes.

## Why stopping the scheduler first can be wrong

Consider a coroutine waiting for TCP data:

```text id="bgjnbw"
coroutine
    ↓
async_read()
    ↓
network operation pending
```

If the scheduler disappeared while the network operation was still active:

```text id="82o43c"
scheduler stops
      ↓
network operation completes later
      ↓
continuation needs scheduler
      ↓
no normal execution path remains
```

The service must therefore be given a chance to finish or cancel its pending operation while the scheduler can still receive the resulting continuation.

This is the reason full runtime teardown uses `shutdown()`.

## `shutdown()`

Use:

```cpp id="kugbfk"
ctx.shutdown();
```

when the complete runtime should be brought down.

The context coordinates the services it owns before finishing scheduler shutdown.

The high-level sequence is:

```text id="lr8dnh"
shutdown begins
      ↓
stop owned services
      ↓
pending operations complete or are released
      ↓
continuations return to scheduler
      ↓
scheduler processes remaining ready work
      ↓
scheduler stops
```

The exact service behavior differs because each service owns a different kind of work.

## Timer shutdown

A coroutine may be sleeping when shutdown begins:

```cpp id="ugixkv"
co_await ctx.timers().sleep_for(
  std::chrono::seconds(30)
);
```

The runtime cannot wait thirty seconds just because the original timer deadline has not arrived.

The timer service is stopped:

```text id="ick89g"
sleep_for pending
      ↓
timer service stops
      ↓
sleep completed as stopped
      ↓
continuation posted to scheduler
      ↓
coroutine resumes
```

The waiting coroutine observes:

```cpp id="h0k5ek"
errc::stopped
```

through `std::system_error`.

Callback timers that have not been dispatched are not executed after the timer service stops.

## CPU pool shutdown

The thread pool has a different lifecycle.

Jobs already accepted into the pool are allowed to drain.

```text id="q7x139"
job A accepted
job B accepted
job C accepted
      ↓
pool stop
      ↓
new jobs rejected
      ↓
A / B / C finish
      ↓
workers exit
```

A new `submit()` that cannot be accepted reports:

```cpp id="oyhgqa"
errc::rejected
```

The pool joins its worker threads during shutdown.

This ensures the context does not destroy the service while its workers are still executing accepted callables.

## Signal shutdown

A signal waiter may otherwise remain suspended indefinitely.

```cpp id="ekrxdr"
co_await ctx.signals().async_wait();
```

When the signal service stops:

```text id="42rw1v"
async_wait pending
      ↓
signal service stops
      ↓
waiter released
      ↓
continuation posted to scheduler
      ↓
coroutine resumes
```

The coroutine receives:

```cpp id="523h6s"
errc::stopped
```

through `std::system_error`.

The signal worker is then stopped and joined as part of service destruction.

## Network shutdown

Network operations may also have no natural completion deadline.

Examples include:

```text id="84v28g"
TCP accept
TCP read
UDP receive
DNS resolution
```

During shutdown, the networking service stops its active operations.

```text id="uxwfnr"
network operation pending
        ↓
network service stops
        ↓
Asio operation completes
        ↓
continuation posted to Vix scheduler
        ↓
coroutine resumes
        ↓
errc::stopped
```

This releases suspended network coroutines before scheduler shutdown finishes.

## Cancellation and shutdown are different

Application cancellation and runtime shutdown can both release a pending operation, but they mean different things.

Application cancellation:

```cpp id="cyrhas"
source.request_cancel();
```

typically reports:

```cpp id="c511hy"
errc::canceled
```

Runtime service shutdown reports:

```cpp id="o7bxtu"
errc::stopped
```

Keep the distinction clear:

```text id="jj1fej"
errc::canceled
    ↓
application no longer wants this operation

errc::stopped
    ↓
runtime service is being stopped
```

This lets application code decide whether an interrupted operation was part of normal cancellation policy or runtime teardown.

## Handle shutdown inside a coroutine

A coroutine that can legitimately still be waiting during shutdown can handle `errc::stopped`.

```cpp id="t44fmc"
task<void> worker(io_context& ctx)
{
  try
  {
    co_await ctx.timers().sleep_for(
      std::chrono::seconds(30)
    );

    vix::print("timer completed");
  }
  catch (const std::system_error& error)
  {
    if (error.code() == make_error_code(errc::stopped))
    {
      vix::print("runtime stopped");
      co_return;
    }

    throw;
  }
}
```

This treats runtime teardown as an expected control-flow boundary rather than an unexpected application failure.

## Root task completion does not automatically end every service

A root coroutine can reach its end while other asynchronous work still exists.

For example:

```cpp id="17bd0v"
task<void> app(io_context& ctx)
{
  spawn_detached(
    ctx,
    background(ctx)
  );

  co_return;
}
```

The root task has completed, but `background()` may still be active.

The runtime therefore cannot infer that all application work has finished simply because one root coroutine returned.

The application must still define when the scheduler or complete context should stop.

## Detached tasks

Detached tasks make lifetime especially important.

```cpp id="73u4w3"
spawn_detached(
  ctx,
  handle_client(std::move(client))
);
```

The caller no longer owns a task object representing that work.

The detached coroutine may continue waiting on:

```text id="48ukab"
TCP
timers
CPU work
signals
other tasks
```

The context and referenced application objects must remain alive while those dependencies are still used.

Detached changes task ownership. It does not remove runtime lifetime requirements.

## `when_any` and remaining tasks

`when_any` has a similar lifetime consequence.

Suppose:

```text id="7j0veg"
task A ───── winner
task B ───────────── continues
task C ───────────────── continues
```

The awaiting coroutine resumes when A finishes, but B and C remain active.

They may still need:

- the scheduler
- timers
- networking
- CPU workers
- cancellation state
- objects referenced by their coroutine frames

Do not shut down those dependencies merely because `when_any` returned.

If the losing operations should stop, cancellation must be part of the application policy.

## Object lifetime across suspension

Consider:

```cpp id="eik3yw"
task<void> send(
  tcp_stream& stream,
  std::span<const std::byte> data)
{
  co_await stream.async_write(data);
}
```

Both referenced objects must remain valid while the coroutine is suspended:

```text id="xs0e9g"
tcp_stream
buffer memory
```

The same C++ rule applies to references captured by worker callables and detached tasks.

Asynchronous execution changes when code runs. It does not relax ownership rules.

## Prefer ownership that crosses the asynchronous boundary clearly

For example, an accepted TCP client is returned as:

```cpp id="p2wztt"
std::unique_ptr<tcp_stream>
```

A detached handler can take ownership explicitly:

```cpp id="v0xewm"
spawn_detached(
  ctx,
  handle_client(std::move(client))
);
```

Now the connection lifetime is tied to the handler coroutine instead of depending on a reference to a local variable in the accept loop.

The same principle applies to data sent to CPU workers:

```cpp id="w1wofq"
co_await ctx.cpu_pool().submit(
  [data = std::move(data)](){
    return process(data);
  }
);
```

Clear ownership makes asynchronous lifetime easier to reason about.

## A signal-driven shutdown

A common server lifetime is:

```text id="g37ayf"
start application
      ↓
run services
      ↓
wait for SIGINT / SIGTERM
      ↓
begin shutdown
      ↓
release active operations
      ↓
finish runtime
```

For example:

```cpp id="bc9nt9"
#include <csignal>
#include <system_error>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> wait_for_signal(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);
  signals.add(SIGTERM);

  try
  {
    int signal = co_await signals.async_wait();

    vix::print("signal:", signal);

    ctx.stop();
  }
  catch (const std::system_error& error)
  {
    if (error.code() == make_error_code(errc::stopped))
    {
      co_return;
    }

    throw;
  }
}
```

This example requests scheduler stop after the application receives its process signal.

For an application that still has active timers, CPU work, signal waits, or network operations requiring coordinated teardown, use the complete context shutdown path for final runtime cleanup.

## Application shutdown policy

The runtime provides mechanisms, but the application still defines policy.

For example, a server may decide to:

```text id="2fvnje"
stop accepting new clients
        ↓
cancel idle client operations
        ↓
allow active requests to finish
        ↓
flush application state
        ↓
shutdown Async runtime
```

Another application may choose immediate cancellation.

Vix Async does not decide which application work is important enough to finish. It provides the primitives needed to make that policy explicit.

## Service stop methods

Individual services also expose their own lifecycle operations.

Timer service:

```cpp id="16ji4y"
ctx.timers().stop();
```

CPU pool:

```cpp id="nquw76"
ctx.cpu_pool().stop();
ctx.cpu_pool().shutdown();
```

Signal service:

```cpp id="dvwgli"
ctx.signals().stop();
```

Networking is normally coordinated through the context and network object lifetime.

These service-level operations are useful when one subsystem should stop before the complete Async runtime.

For full context teardown, prefer `io_context::shutdown()` so ordering remains coordinated.

## Do not destroy the scheduler before its producers

A useful lifetime rule is:

```text id="41wc01"
anything that can post to scheduler
        ↓
must finish before scheduler disappears
```

Possible producers include:

```text id="myk4hp"
timer service
CPU submissions
signal service
network backend
other threads posting callbacks
```

The scheduler is the destination for their continuations.

This dependency explains the shutdown order more clearly than thinking of shutdown as simply destroying objects in reverse construction order.

## Shutdown ordering

The central relationship is:

```text id="nnxvcy"
services
   ↓
produce final completions
   ↓
scheduler
   ↓
run final continuations
```

Therefore:

```text id="vhmqwd"
1. begin service shutdown
2. release pending waits
3. return their continuations
4. process remaining scheduler work
5. stop scheduler
6. finish runtime destruction
```

This ordering preserves the normal coroutine completion path even while the runtime is being torn down.

## Avoid starting new work during teardown

Once shutdown begins, application code should not treat the runtime as available for a new workload.

For example, a continuation released because the network service is stopping should normally clean up and return:

```cpp id="07gdh3"
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::stopped))
  {
    co_return;
  }

  throw;
}
```

It should not respond to runtime shutdown by starting another long-lived network operation.

Shutdown works best as a directional transition:

```text id="bscffm"
running
   ↓
stopping
   ↓
stopped
```

not as a state from which the application attempts to recreate active runtime work.

## A practical context lifetime

A normal top-level program can keep the context in `main()`:

```cpp id="yequ26"
int main()
{
  io_context ctx;

  std::move(app(ctx)).start(
    ctx.get_scheduler()
  );

  ctx.run();

  ctx.shutdown();

  return 0;
}
```

This gives the context a lifetime that clearly encloses the asynchronous application.

The exact point at which `stop()` or `shutdown()` is requested depends on the application's control flow, but the context itself remains alive until runtime work has been brought to a safe end.

## Lifecycle model

The complete model can be summarized as:

```text id="oiehj6"
                    io_context
                        │
                    scheduler
                        │
                     tasks
                        │
        ┌───────────────┼────────────────┐
        │               │                │
      timers           CPU           networking
        │               │                │
        └─────── pending work ───────────┘
                        │
                 shutdown begins
                        │
              services stop safely
                        │
              continuations return
                        │
                scheduler drains
                        │
                 runtime finishes
```

The scheduler is not the whole runtime.

Services may still own asynchronous work, so complete shutdown must account for both sides of the relationship.

## API overview

The main lifecycle operations are:

| API                               | Purpose                                                          |
| --------------------------------- | ---------------------------------------------------------------- |
| `io_context::run()`               | Run the scheduler on the calling thread.                         |
| `io_context::stop()`              | Request scheduler stop.                                          |
| `io_context::shutdown()`          | Coordinate shutdown of owned services and the scheduler.         |
| `io_context::is_running()`        | Inspect whether the context remains in its running state.        |
| `timer::stop()`                   | Stop timer processing and release pending sleeps.                |
| `thread_pool::stop()`             | Reject new worker jobs while accepted work drains.               |
| `thread_pool::shutdown()`         | Stop and join worker threads.                                    |
| `signal_set::stop()`              | Stop signal waiting and release the active waiter.               |
| network `close()`                 | End the lifetime of a TCP or UDP socket object.                  |
| `cancel_source::request_cancel()` | Request application-level cancellation for supported operations. |

Keep `stop`, `shutdown`, cancellation, and object closing separate. They operate at different levels of the runtime.

## Next step

Continue with [Errors](./errors) to see how Vix Async distinguishes cancellation, shutdown, rejection, invalid operations, and underlying system errors.

Then read:

- [`io_context`](./io-context)
- [Cancellation](./cancellation)
- [Scheduler](./scheduler)
- [Networking](./networking)
