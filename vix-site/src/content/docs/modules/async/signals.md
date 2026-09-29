# Signals

Vix Async provides coroutine-based waiting for operating-system signals through `signal_set`.

Signals such as `SIGINT` and `SIGTERM` often represent process-level events that should change application state or begin shutdown. Waiting for them with a blocking call would occupy the scheduler thread, so `signal_set` performs signal waiting separately and returns the result through the Vix scheduler.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

The signal API lives in:

```cpp
vix::async::core
```

## Access the signal service

An `io_context` owns its signal service.

```cpp
using namespace vix::async::core;

io_context ctx;

auto& signals = ctx.signals();
```

The service is created lazily when `signals()` is first requested.

It remains associated with that context and returns signal completions through the context scheduler.

## Register signals

Before waiting, add the signal numbers the application wants to observe.

```cpp
ctx.signals().add(SIGINT);
ctx.signals().add(SIGTERM);
```

For a typical command-line application:

```cpp
#include <csignal>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> run(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);
  signals.add(SIGTERM);

  int signal = co_await signals.async_wait();

  vix::print("signal:", signal);

  ctx.stop();
}
```

`async_wait()` returns the actual signal number that was received.

## Wait for a signal

The main coroutine operation is:

```cpp
int signal = co_await ctx.signals().async_wait();
```

Its result type is:

```cpp
task<int>
```

The coroutine suspends until one of the registered signals is delivered.

Conceptually:

```text
coroutine
    ↓
async_wait()
    ↓
coroutine suspends
    ↓
signal worker waits
    ↓
registered signal received
    ↓
continuation posted to scheduler
    ↓
coroutine resumes with signal number
```

Application code after `co_await` runs through the Vix scheduler, not on the signal-waiting thread.

## Identify the received signal

Because `async_wait()` returns the actual signal number, one wait can handle several registered signals.

```cpp
task<void> run(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);
  signals.add(SIGTERM);

  int signal = co_await signals.async_wait();

  if (signal == SIGINT)
  {
    vix::print("SIGINT received");
  }
  else if (signal == SIGTERM)
  {
    vix::print("SIGTERM received");
  }

  ctx.stop();
}
```

There is no need to create one `signal_set` for each signal.

## Register signals before waiting

The expected workflow is:

```text
get signal_set
      ↓
add signals
      ↓
start async_wait()
```

For example:

```cpp
auto& signals = ctx.signals();

signals.add(SIGINT);
signals.add(SIGTERM);

int signal = co_await signals.async_wait();
```

The signal worker starts lazily when asynchronous waiting begins.

Register the signal set before starting the wait rather than changing the watched set while an active wait is already in progress.

## Duplicate registration

Adding the same signal more than once does not create duplicate entries.

```cpp
signals.add(SIGINT);
signals.add(SIGINT);
```

`SIGINT` is still watched once.

This allows initialization code to register a signal without creating duplicate delivery entries inside the Vix signal set.

## Invalid signal numbers

`add()` rejects non-positive signal numbers.

This is invalid:

```cpp
signals.add(0);
```

and reports:

```cpp
errc::invalid_argument
```

through `std::system_error`.

For example:

```cpp
try
{
  signals.add(0);
}
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::invalid_argument))
  {
    vix::print("invalid signal");
  }
}
```

Platform rules still determine which positive signal numbers can meaningfully be used.

## Remove a signal

Use `remove()` when a signal should no longer belong to the watched set.

```cpp
signals.remove(SIGTERM);
```

Removing a signal that is not currently registered is safe.

A common configuration pattern is therefore:

```cpp
signals.add(SIGINT);
signals.add(SIGTERM);

// later, before another wait
signals.remove(SIGTERM);
```

Signal registration ultimately follows operating-system signal semantics, so applications should configure their watched set before beginning a wait whenever possible.

## Only one active waiter

A `signal_set` supports one active `async_wait()` at a time.

This is valid:

```cpp
int signal = co_await signals.async_wait();
```

Starting another wait on the same `signal_set` while the first wait is still active is rejected.

Conceptually:

```text
signal_set
    ↓
waiter A active
    ↓
waiter B attempts async_wait()
    ↓
errc::not_ready
```

The second coroutine receives:

```cpp
errc::not_ready
```

through `std::system_error`.

This rule makes ownership of the next signal explicit.

## Handle a second-waiter error

For example:

```cpp
try
{
  int signal = co_await ctx.signals().async_wait();

  vix::print("signal:", signal);
}
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::not_ready))
  {
    vix::print("another signal waiter is active");
  }
}
```

If several parts of an application care about process signals, prefer one coroutine that owns `async_wait()` and distributes the resulting application event explicitly.

## Wait for several signals over time

After one wait completes, the coroutine can wait again.

```cpp
task<void> monitor(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);
  signals.add(SIGTERM);

  while (ctx.is_running())
  {
    int signal = co_await signals.async_wait();

    vix::print("signal:", signal);

    if (signal == SIGTERM)
    {
      ctx.stop();
    }
  }
}
```

Only one wait is active at each point in the loop.

The next `async_wait()` starts after the previous one has completed.

## Pending signals

The signal worker can remain active between waits.

If a registered signal is captured while no coroutine is currently waiting, Vix stores that signal in a pending queue.

The next `async_wait()` can consume it immediately.

```text
signal received
      ↓
no active waiter
      ↓
pending queue
      ↓
next async_wait()
      ↓
signal returned
```

This prevents an already captured signal from being lost simply because the next coroutine wait had not yet been installed.

Pending signals are consumed in arrival order.

## Signal callbacks

`signal_set` also supports a callback:

```cpp
signals.on_signal([](int signal){
  vix::print("received:", signal);
});
```

The callback receives the actual signal number.

It is posted through the `io_context`, so application callback code runs on the scheduler thread rather than inside the signal worker.

```text
signal worker
     ↓
signal received
     ↓
callback posted
     ↓
scheduler
     ↓
callback executes
```

This keeps application signal handling outside the low-level waiting thread.

## `on_signal()` complements `async_wait()`

The current signal worker starts when `async_wait()` is first used.

For that reason, `on_signal()` is best understood as an observer attached to the active signal service, not as a replacement for starting asynchronous signal waiting.

For example:

```cpp
task<void> run(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);

  signals.on_signal([](int signal){
    vix::print("observed:", signal);
  });

  int signal = co_await signals.async_wait();

  vix::print("awaited:", signal);

  ctx.stop();
}
```

When the signal arrives, the callback is scheduled and the active waiter is also completed.

## Callback and waiter can both observe a signal

`on_signal()` and `async_wait()` are not competing consumers.

If a callback is installed and a coroutine is waiting, the same received signal can be delivered to both:

```text
signal received
      ↓
      ├── on_signal callback
      │       ↓
      │   scheduler
      │
      └── active async_wait
              ↓
          scheduler
```

This makes the callback useful for observation while `async_wait()` remains the coroutine control-flow mechanism.

If no waiter is active, the signal can be queued for a later `async_wait()` while the callback is still posted.

## Cancel a signal wait

`async_wait()` accepts a `cancel_token`.

```cpp
cancel_source source;

int signal = co_await ctx.signals().async_wait(
  source.token()
);
```

Cancellation can be requested elsewhere:

```cpp
source.request_cancel();
```

If cancellation wins before a signal is delivered, the active waiter is removed and resumed through the scheduler with:

```cpp
errc::canceled
```

as a `std::system_error`.

## Handle cancellation

For example:

```cpp
task<void> wait(
  io_context& ctx,
  cancel_token token)
{
  try
  {
    int signal = co_await ctx.signals().async_wait(
      token
    );

    vix::print("signal:", signal);
  }
  catch (const std::system_error& error)
  {
    if (error.code() == cancelled_ec())
    {
      vix::print("signal wait canceled");
      co_return;
    }

    throw;
  }
}
```

Cancellation affects the pending wait.

It does not stop the complete signal service.

## Cancellation before waiting

If the token is already cancelled:

```cpp
cancel_source source;
source.request_cancel();

int signal = co_await ctx.signals().async_wait(
  source.token()
);
```

the operation reports cancellation immediately.

No active waiter is installed.

This avoids beginning a wait that the application already knows it no longer needs.

## Signal arrival and cancellation race

A signal and a cancellation request can occur close together.

The wait completes once.

Whichever outcome successfully completes the active waiter determines what the coroutine observes:

```text
signal wins
    ↓
async_wait returns signal number

cancellation wins
    ↓
async_wait throws errc::canceled
```

The waiter state is protected so both paths cannot resume the same coroutine independently.

## Stop the signal service

Use:

```cpp
ctx.signals().stop();
```

to stop signal watching.

`stop()` is idempotent.

Calling it again after the service has already stopped has no additional effect.

The stop request also wakes an active waiter.

## Waiting during stop

If a coroutine is inside:

```cpp
co_await ctx.signals().async_wait();
```

when the service stops, it does not remain suspended indefinitely.

The flow is:

```text
async_wait pending
      ↓
signal_set::stop()
      ↓
active waiter completed
      ↓
continuation posted to scheduler
      ↓
coroutine resumes
      ↓
errc::stopped
```

The error is delivered as `std::system_error`.

## Handle signal-service stop

For example:

```cpp
task<void> wait(io_context& ctx)
{
  try
  {
    int signal = co_await ctx.signals().async_wait();

    vix::print("signal:", signal);
  }
  catch (const std::system_error& error)
  {
    if (error.code() == make_error_code(errc::stopped))
    {
      vix::print("signal service stopped");
      co_return;
    }

    throw;
  }
}
```

Stopping the service and cancelling one wait are different events.

## Cancellation and stop are different

Application cancellation reports:

```cpp
errc::canceled
```

Signal-service shutdown reports:

```cpp
errc::stopped
```

The distinction is:

```text
request_cancel()
    ↓
cancel this wait

signal_set::stop()
    ↓
stop the signal service
```

This allows application code to distinguish an operation-level cancellation from runtime teardown.

## Stop is permanent

Once a `signal_set` has been stopped, it does not restart.

A later:

```cpp
co_await ctx.signals().async_wait();
```

reports:

```cpp
errc::stopped
```

rather than creating another worker.

If the complete `io_context` has already been shut down, attempting to access `ctx.signals()` again is rejected by the context itself.

## Runtime shutdown

The signal service participates in `io_context::shutdown()`.

A signal waiter may still be suspended when shutdown begins:

```text
signal wait pending
       ↓
io_context shutdown
       ↓
signal service destroyed
       ↓
signal_set stops
       ↓
waiter receives errc::stopped
       ↓
continuation posted to scheduler
       ↓
scheduler drains remaining work
```

The context shuts down services while the scheduler can still accept their final completion posts.

This prevents an active signal wait from blocking runtime destruction.

## Worker lifetime

The signal worker starts lazily on first asynchronous use.

The `signal_set` owns that thread for the rest of its service lifetime.

When the service is destroyed:

```text
signal_set destruction
       ↓
stop requested
       ↓
blocking signal wait woken
       ↓
worker exits
       ↓
worker joined
```

Application code does not need to manage this worker directly.

The public execution boundary remains the `signal_set` and the Vix scheduler.

## Platform support

The asynchronous signal wait is currently implemented for Unix-like platforms:

```text
Linux
macOS
other supported Unix environments
```

On unsupported platforms, `async_wait()` reports:

```cpp
errc::not_supported
```

through `std::system_error`.

Signal delivery itself also follows the operating system's signal and thread-mask rules.

The Async API does not replace those platform semantics.

## POSIX signal masks matter

On Unix-like systems, `signal_set::add()` blocks the registered signal in the calling thread so the signal worker can wait for it with the POSIX signal mechanism.

Applications that create their own threads or manipulate signal masks directly should keep this interaction in mind.

A simple Async application should register its signals early, before creating unrelated thread-level signal policies.

The public Vix model remains:

```text
register signals
      ↓
async_wait()
      ↓
signal worker receives
      ↓
scheduler resumes coroutine
```

## A typical shutdown pattern

Process signals are commonly used to begin application shutdown.

```cpp
#include <csignal>
#include <system_error>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<void> wait_for_shutdown(io_context& ctx)
{
  auto& signals = ctx.signals();

  signals.add(SIGINT);
  signals.add(SIGTERM);

  try
  {
    int signal = co_await signals.async_wait();

    vix::print("shutdown signal:", signal);

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

int main()
{
  io_context ctx;

  std::move(wait_for_shutdown(ctx)).start(
    ctx.get_scheduler()
  );

  ctx.run();

  return 0;
}
```

This gives one coroutine ownership of process shutdown signals and keeps the resulting control flow inside the Async scheduler.

## API overview

The signal service exposes:

| API                       | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `signal_set(io_context&)` | Create a signal watcher bound to a context.            |
| `add(int)`                | Add a positive signal number to the watched set.       |
| `remove(int)`             | Remove a signal number from the watched set.           |
| `async_wait(token)`       | Await the next registered signal.                      |
| `on_signal(fn)`           | Observe received signals through a scheduler callback. |
| `stop()`                  | Stop signal watching and wake the active waiter.       |

`async_wait()` returns:

```cpp
task<int>
```

and can report:

```text
errc::canceled
errc::stopped
errc::not_ready
errc::not_supported
```

depending on cancellation, service state, concurrent waiters, and platform support.

`add()` can report:

```text
errc::invalid_argument
```

for a non-positive signal number.

## Next step

Continue with [Lifecycle and Shutdown](./lifecycle-and-shutdown) to see how the scheduler, timers, CPU pool, signal service, and networking backend are brought down together.

Then read:

- [Cancellation](./cancellation)
- [Errors](./errors)
- [`io_context`](./io-context)
