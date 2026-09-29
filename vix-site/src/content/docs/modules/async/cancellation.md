# Cancellation

Vix Async uses cooperative cancellation.

A cancellation request does not terminate a coroutine or interrupt arbitrary C++ code. Instead, a `cancel_source` publishes a request that `cancel_token` instances can observe. Operations that support cancellation decide how to stop their pending work and resume the awaiting coroutine.

This keeps cancellation attached to operations that can actually respond to it.

## Header

Use the public Vix Async header:

```cpp id="a51lb2"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="8nd4em"
#include <vix/print.hpp>
```

The cancellation API lives in:

```cpp id="7iqhcb"
vix::async::core
```

## Create a cancellation source

A `cancel_source` owns a shared cancellation state.

```cpp id="nk1zsk"
using namespace vix::async::core;

cancel_source source;
```

Get a token from the source:

```cpp id="5oybsb"
cancel_token token = source.token();
```

The token can be passed to operations that support cancellation.

```text id="ukraca"
cancel_source
      │
      └── shared state
              │
              ├── token A
              ├── token B
              └── token C
```

All tokens created from the same source observe the same cancellation request.

## Request cancellation

Call `request_cancel()` on the source:

```cpp id="g1z6fv"
source.request_cancel();
```

After that:

```cpp id="p7k0b6"
source.is_cancelled();
token.is_cancelled();
```

both report cancellation.

A cancellation request is permanent for that shared state. There is no reset operation.

If a later workflow needs an independent cancellation lifetime, create another `cancel_source`.

## Cancel a timer wait

`sleep_for()` accepts a cancellation token.

```cpp id="jhjg5u"
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

    vix::print("timer completed");
  }
  catch (const std::system_error& error)
  {
    if (error.code() == cancelled_ec())
    {
      vix::print("timer canceled");
      co_return;
    }

    throw;
  }
}
```

If cancellation is requested while the task is sleeping, the timer wait is woken instead of waiting for the original five-second deadline.

The coroutine then resumes through the scheduler and observes `errc::canceled` as a `std::system_error`.

## Cancellation can come from another thread

The cancellation state is designed for concurrent use.

For example, one thread can request cancellation while a coroutine is suspended on the Async runtime:

```cpp id="ev2zlb"
cancel_source source;

auto token = source.token();

source.request_cancel();
```

The operation that registered with the token is notified through the shared cancellation state.

This is useful because the code requesting cancellation does not need to be running on the scheduler thread.

## Check a token

Use `is_cancelled()` when code needs to inspect the state directly:

```cpp id="gqnwnz"
if (token.is_cancelled())
{
  vix::print("cancellation requested");
}
```

Use `can_cancel()` to distinguish a token connected to a cancellation state from an empty token:

```cpp id="3pk0sp"
cancel_token token;

if (!token.can_cancel())
{
  vix::print("token has no cancellation source");
}
```

A default-constructed token is not cancellable:

```cpp id="67cfkl"
cancel_token token;
```

For that token:

```text id="mqvzgw"
can_cancel()   -> false
is_cancelled() -> false
```

This allows APIs to use an empty token as their default argument.

## Register a cancellation callback

A token can also notify code directly through `on_cancel()`.

```cpp id="iv9yrm"
cancel_source source;

auto registration = source.token().on_cancel([](){
  vix::print("cancellation requested");
});

source.request_cancel();
```

The callback is invoked once when cancellation is first requested.

`on_cancel()` returns a `cancel_registration` that controls the lifetime of that callback registration.

## `cancel_registration`

A cancellation callback should not remain attached after the object it refers to has disappeared.

`cancel_registration` provides that lifetime boundary.

```cpp id="1upkdr"
auto registration = token.on_cancel([](){
  handle_cancellation();
});
```

Reset it when the callback should no longer be callable:

```cpp id="sw73bi"
registration.reset();
```

Its destructor performs the same cleanup automatically.

This makes the common pattern RAII-based:

```cpp id="p4ff59"
{
  auto registration = token.on_cancel([](){
    handle_cancellation();
  });

  // registration is active here
}

// callback is no longer registered here
```

The registration is move-only.

Use `active()` when code needs to inspect whether the callback is still eligible to run:

```cpp id="t3q40e"
if (registration.active())
{
  vix::print("callback registered");
}
```

## Registering after cancellation

Cancellation is sticky.

If the source has already been cancelled:

```cpp id="sy73o6"
cancel_source source;
source.request_cancel();
```

and code later registers a callback:

```cpp id="kdkne7"
auto registration = source.token().on_cancel([](){
  vix::print("already canceled");
});
```

the callback is invoked during `on_cancel()`.

This prevents a race where an operation checks the token, begins registering for cancellation, and misses a request that occurred between those steps.

## Cancellation callbacks should be small

`request_cancel()` invokes registered cancellation callbacks as part of processing the cancellation request.

A callback should therefore perform only the work needed to make the pending operation stop or become ready.

For example:

```text id="xs730q"
request cancellation
       ↓
cancellation callback
       ↓
cancel pending operation
       ↓
operation completes
       ↓
scheduler resumes coroutine
```

Long application work does not belong inside the callback itself.

Exceptions escaping a cancellation callback are consumed by the cancellation state and do not propagate from `request_cancel()`.

## Timers

The timer service supports cancellation in two forms.

`sleep_for()` can be interrupted while a coroutine is waiting:

```cpp id="6mvs9v"
co_await ctx.timers().sleep_for(
  5s,
  token
);
```

Callback-style timers also accept a token:

```cpp id="au4zad"
ctx.timers().after(
  5s,
  [](){
    vix::print("timer fired");
  },
  token
);
```

For `after()`, a cancelled entry is skipped before its callback executes.

For `sleep_for()`, cancellation wakes the suspended coroutine and reports `errc::canceled`.

## Signals

`signal_set::async_wait()` also accepts a cancellation token.

```cpp id="s6wonf"
int signal = co_await ctx.signals().async_wait(token);
```

If cancellation wins before a signal is delivered, the suspended coroutine resumes with the cancellation error.

Only the pending wait is cancelled. The cancellation request does not stop the complete `signal_set` service.

Service shutdown and operation cancellation are separate events.

## TCP operations

The cancellable TCP operations include:

```cpp id="57yhbh"
stream->async_connect(endpoint, token);
stream->async_read(buffer, token);
stream->async_write(buffer, token);

listener->async_accept(token);
```

A cancellation request is connected to the active Asio operation rather than only being checked before the call starts.

The general flow is:

```text id="hpjj85"
TCP operation active
       ↓
request_cancel()
       ↓
Asio operation canceled
       ↓
completion returned to Vix
       ↓
scheduler
       ↓
coroutine resumes with canceled
```

`async_listen()` does not take a cancellation token. Closing the listener or shutting down the runtime controls that lifetime instead.

## UDP operations

UDP send and receive operations accept tokens:

```cpp id="1jc9ko"
socket->async_send_to(
  buffer,
  endpoint,
  token
);

socket->async_recv_from(
  buffer,
  token
);
```

Cancellation can interrupt the active Asio operation and return control through the normal coroutine completion path.

`async_bind()` does not take a cancellation token.

## DNS resolution

DNS resolution is cancellable:

```cpp id="o2tsfy"
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443,
  token
);
```

If cancellation is requested while resolution is pending, the resolver cancels the active operation and the coroutine observes cancellation through its asynchronous result.

## Cancellation does not stop CPU code

The Async CPU pool does not accept a `cancel_token` in `submit()`.

This callable:

```cpp id="fj8th2"
co_await ctx.cpu_pool().submit([](){
  perform_expensive_work();
});
```

cannot be forcibly interrupted by a `cancel_source`.

Once arbitrary C++ code is running on a worker thread, Vix cannot safely stop it at an arbitrary instruction.

If CPU work needs cancellation, make the callable cooperate explicitly:

```cpp id="5ktpyt"
cancel_token token = source.token();

co_await ctx.cpu_pool().submit([token](){
  while (!token.is_cancelled())
  {
    if (!perform_next_step())
    {
      break;
    }
  }
});
```

Here the callable decides where it is safe to observe cancellation.

## Cancellation does not cancel a task automatically

`task<T>` itself does not carry an automatic cancellation policy.

Cancellation belongs to the operations used by the task.

For example:

```cpp id="2k2mn0"
task<void> work(
  io_context& ctx,
  cancel_token token)
{
  co_await ctx.timers().sleep_for(
    1s,
    token
  );
}
```

The task can propagate the same token through several cancellable operations, but simply having a `task<void>` does not make every statement inside it interruptible.

## `when_any` does not cancel losing tasks

`when_any` returns when the first task completes:

```text id="w2k0q8"
task A ───── winner

task B ───────────── continues
task C ───────────────── continues
```

It does not automatically issue cancellation to the remaining tasks.

If the application wants that policy, give those tasks a shared token and request cancellation explicitly.

Conceptually:

```text id="sf1tct"
cancel_source
   │
   ├── task A
   ├── task B
   └── task C

when_any returns winner
        ↓
application decides whether to call
request_cancel()
```

This keeps the behavior explicit. `when_any` determines when the caller resumes, while the application determines whether the remaining operations should be cancelled.

## Cancellation and shutdown are different

Cancellation targets an operation or group of operations that share a token.

Runtime shutdown targets the services owned by an `io_context`.

For example:

```cpp id="uijb5o"
source.request_cancel();
```

does not shut down the context.

Likewise:

```cpp id="fymhgv"
ctx.shutdown();
```

does not mean every operation was cancelled through its user-provided token. Services use their own shutdown paths to leave pending work safely.

Keep the two concepts separate:

```text id="8iiq3j"
cancel_source
    ↓
application cancellation policy

io_context::shutdown()
    ↓
runtime lifecycle
```

## Cancellation error

The standard Async cancellation error is:

```cpp id="o9c2b2"
vix::async::core::errc::canceled
```

Use:

```cpp id="7x2aqx"
cancelled_ec()
```

to obtain the corresponding `std::error_code`.

For example:

```cpp id="2sngt7"
catch (const std::system_error& error)
{
  if (error.code() == cancelled_ec())
  {
    vix::print("operation canceled");
  }
}
```

The Async error category reports the message:

```text id="n1z74z"
canceled
```

## API overview

The core cancellation types are:

| API                               | Purpose                                            |
| --------------------------------- | -------------------------------------------------- |
| `cancel_source`                   | Own a cancellation state and request cancellation. |
| `cancel_token`                    | Observe cancellation and register callbacks.       |
| `cancel_registration`             | Control the lifetime of a registered callback.     |
| `cancel_source::token()`          | Create a token sharing the source state.           |
| `cancel_source::request_cancel()` | Request cancellation once for the shared state.    |
| `cancel_source::is_cancelled()`   | Check whether the source has been cancelled.       |
| `cancel_token::can_cancel()`      | Check whether the token has a cancellation state.  |
| `cancel_token::is_cancelled()`    | Check whether cancellation was requested.          |
| `cancel_token::on_cancel(fn)`     | Register a callback for cancellation.              |
| `cancel_registration::reset()`    | Remove the callback registration.                  |
| `cancel_registration::active()`   | Check whether the registration is active.          |
| `cancelled_ec()`                  | Return the Async cancellation error code.          |

## Next step

Continue with [Timers](./timers) to see how timed waits and delayed callbacks integrate with cancellation and the scheduler.

Then read:

- [Networking](./networking)
- [Signals](./signals)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
