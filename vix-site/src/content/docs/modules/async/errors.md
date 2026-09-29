# Errors

Vix Async uses standard C++ error mechanisms.

Operational failures are generally reported through `std::system_error`, carrying either a Vix Async `std::error_code` or an error code produced by the underlying system or networking backend.

Task exceptions continue through normal coroutine exception propagation, while detached execution has no caller available to receive them.

## Header

Use the public Vix Async header:

```cpp id="f4j8ks"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="z30tgr"
#include <vix/print.hpp>
```

The Async error API lives in:

```cpp id="amf46j"
vix::async::core
```

## Async error codes

Vix-specific runtime conditions are represented by:

```cpp id="d595kr"
vix::async::core::errc
```

The current enumeration is:

```cpp id="ys9pwx"
enum class errc : std::uint8_t
{
  ok = 0,

  invalid_argument,
  not_ready,
  timeout,
  canceled,
  closed,
  overflow,

  stopped,
  queue_full,

  rejected,

  not_supported
};
```

These codes provide a common vocabulary for errors originating from the Async runtime itself.

Not every public operation currently emits every value in this enumeration. Some codes define runtime-level error conditions that are available for Async components as the module evolves.

## `std::error_code`

Convert an Async error to `std::error_code` with:

```cpp id="cdlbh1"
auto error = make_error_code(
  errc::canceled
);
```

`errc` is registered as a standard C++ error-code enum, so it integrates with the normal `<system_error>` model.

The Async category is named:

```text id="kvnblm"
async
```

For example:

```cpp id="eg5a6m"
std::error_code error = make_error_code(
  errc::stopped
);

vix::print(
  error.category().name(),
  error.message()
);
```

The category identifies the error as originating from Vix Async rather than an operating-system or networking category.

## Error messages

The Async category currently maps its codes to these messages:

| Error                    | Message            |
| ------------------------ | ------------------ |
| `errc::ok`               | `ok`               |
| `errc::invalid_argument` | `invalid argument` |
| `errc::not_ready`        | `not ready`        |
| `errc::timeout`          | `timeout`          |
| `errc::canceled`         | `canceled`         |
| `errc::closed`           | `closed`           |
| `errc::overflow`         | `overflow`         |
| `errc::stopped`          | `stopped`          |
| `errc::queue_full`       | `queue full`       |
| `errc::rejected`         | `rejected`         |
| `errc::not_supported`    | `not supported`    |

Use the error code rather than comparing message strings.

Prefer:

```cpp id="17rzd5"
if (error.code() == make_error_code(errc::stopped))
{
  // ...
}
```

instead of:

```cpp id="ge2sks"
if (error.what() == std::string{"stopped"})
{
  // ...
}
```

The code expresses the actual error condition.

## `std::system_error`

Async operations that need to report an operational failure generally throw:

```cpp id="v0sim9"
std::system_error
```

through their task result.

For example:

```cpp id="ke6ydh"
task<void> run(io_context& ctx)
{
  try
  {
    co_await ctx.timers().sleep_for(
      std::chrono::seconds(5)
    );
  }
  catch (const std::system_error& error)
  {
    vix::print(
      "error:",
      error.what()
    );
  }
}
```

Because the exception crosses the normal coroutine await boundary, it can be handled with ordinary C++ `try` and `catch`.

## Inspect the error code

Use:

```cpp id="31ob38"
error.code()
```

when the application needs to distinguish one condition from another.

```cpp id="iuhov2"
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::stopped))
  {
    vix::print("runtime stopped");
    co_return;
  }

  throw;
}
```

This is preferable to treating every asynchronous interruption as the same failure.

## Cancellation

Application cancellation uses:

```cpp id="vdh3k0"
errc::canceled
```

The cancellation API also provides:

```cpp id="r177bg"
cancelled_ec()
```

as a convenience helper.

For example:

```cpp id="5lwulz"
catch (const std::system_error& error)
{
  if (error.code() == cancelled_ec())
  {
    vix::print("operation canceled");
    co_return;
  }

  throw;
}
```

Cancellation means that application code requested the operation to stop.

It is different from runtime shutdown.

## Runtime stop

When an Async service is being shut down, a suspended operation can report:

```cpp id="5gbefa"
errc::stopped
```

For example, a timer wait can leave suspension during context shutdown:

```text id="vn832p"
sleep_for pending
      ↓
timer service stops
      ↓
coroutine resumes
      ↓
errc::stopped
```

Code that expects runtime teardown can treat this as a normal lifecycle condition.

```cpp id="9jc1ko"
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::stopped))
  {
    co_return;
  }

  throw;
}
```

## Cancellation and shutdown should remain distinct

These conditions answer different questions.

```text id="f6ij7u"
errc::canceled
    ↓
the application no longer wants this operation

errc::stopped
    ↓
the Async service needed by the operation is stopping
```

Combining both into one generic "operation failed" path can hide useful lifecycle information.

For example:

```cpp id="cvou9i"
catch (const std::system_error& error)
{
  if (error.code() == cancelled_ec())
  {
    vix::print("request canceled");
    co_return;
  }

  if (error.code() == make_error_code(errc::stopped))
  {
    vix::print("runtime shutting down");
    co_return;
  }

  throw;
}
```

## Rejected CPU work

The thread pool reports:

```cpp id="kx805i"
errc::rejected
```

when a `submit()` operation cannot be accepted because the pool has already stopped.

```cpp id="6qjnnc"
ctx.cpu_pool().stop();

try
{
  int value = co_await ctx.cpu_pool().submit([](){
    return 42;
  });
}
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::rejected))
  {
    vix::print("CPU work rejected");
  }
}
```

A rejected coroutine submission completes with an error rather than remaining suspended indefinitely.

`post()` uses a different interface and reports acceptance with `bool`:

```cpp id="5q5nyy"
bool accepted = ctx.cpu_pool().post([](){
  perform_work();
});

if (!accepted)
{
  vix::print("CPU work not accepted");
}
```

## Signal errors

The signal service uses several Async error codes.

A second concurrent waiter reports:

```cpp id="obev95"
errc::not_ready
```

An invalid non-positive signal passed to `add()` reports:

```cpp id="wk4eaq"
errc::invalid_argument
```

A platform without the required signal-wait implementation reports:

```cpp id="82yi06"
errc::not_supported
```

Cancellation and service shutdown use:

```cpp id="yk3p4m"
errc::canceled
errc::stopped
```

For example:

```cpp id="gy0j7h"
try
{
  int signal = co_await ctx.signals().async_wait();

  vix::print("signal:", signal);
}
catch (const std::system_error& error)
{
  if (error.code() == make_error_code(errc::not_ready))
  {
    vix::print("another waiter is active");
    co_return;
  }

  throw;
}
```

## Network errors

TCP, UDP, and DNS operations can fail for reasons that come from the operating system or Asio backend.

Examples include:

- connection refused
- address already in use
- host not found
- connection reset
- socket closed by the peer
- invalid network address
- other system networking failures

These failures retain their underlying `std::error_code`.

They are not converted into an Async `errc` merely to make every error belong to the same category.

This preserves information provided by the networking stack.

## Distinguish Async and system errors

A network operation may therefore produce either:

```text id="vxkefv"
Async error
    ↓
category = "async"

or

system / Asio error
    ↓
platform-specific error category
```

You can inspect the category when necessary:

```cpp id="m2hsz5"
catch (const std::system_error& error)
{
  vix::print(
    "category:",
    error.code().category().name()
  );

  vix::print(
    "message:",
    error.code().message()
  );
}
```

Application logic should generally check specific codes it understands and propagate or report everything else.

## Do not erase useful network errors

Avoid converting every network exception into a generic application failure immediately:

```cpp id="hhc3o3"
catch (...)
{
  throw std::runtime_error("network failed");
}
```

That loses the original error code.

When possible, keep the original `std::system_error` available:

```cpp id="pmhufw"
catch (const std::system_error& error)
{
  vix::print(
    "network error:",
    error.code(),
    error.what()
  );

  throw;
}
```

The caller can then decide how a particular error should affect the application.

## Task exceptions

`task<T>` is not limited to `std::system_error`.

Any exception thrown by task code can propagate to the coroutine that awaits it.

```cpp id="atjoh6"
task<int> compute()
{
  throw std::runtime_error(
    "computation failed"
  );

  co_return 0;
}
```

The parent can handle it normally:

```cpp id="5ntza7"
try
{
  int value = co_await compute();

  vix::print("value:", value);
}
catch (const std::runtime_error& error)
{
  vix::print(
    "computation error:",
    error.what()
  );
}
```

`std::system_error` is therefore the mechanism for many operational Async failures, not a restriction on which exceptions a task can carry.

## Exceptions from CPU submissions

Exceptions thrown by a callable passed to `submit()` are captured on the worker thread and rethrown when the awaiting coroutine resumes.

```cpp id="nhu6ff"
try
{
  int value = co_await ctx.cpu_pool().submit([]() -> int {
    throw std::runtime_error("failed");
  });
}
catch (const std::runtime_error& error)
{
  vix::print(error.what());
}
```

The worker thread does not terminate because the callable threw.

The exception remains part of the observable `submit()` result.

## `when_all` errors

`when_all` starts all supplied tasks and waits for all of them to complete.

If one or more tasks throw:

```text id="71a5xm"
start every task
      ↓
task A throws
task B continues
task C continues
      ↓
all tasks complete
      ↓
first captured exception rethrown
```

This means catching the `when_all` exception does not imply that the other tasks were abandoned when the first error occurred.

```cpp id="tudvfq"
try
{
  auto results = co_await when_all(
    ctx.get_scheduler(),
    first(),
    second()
  );
}
catch (const std::exception& error)
{
  vix::print(
    "composition failed:",
    error.what()
  );
}
```

## `when_any` errors

`when_any` is based on the first task to complete, not the first task to succeed.

If the first completion is an exception:

```text id="p9kthq"
task A throws first
      ↓
A wins completion race
      ↓
when_any resumes
      ↓
A exception rethrown
```

The losing tasks continue running.

A later successful task does not replace the failed winner.

This behavior matters when `when_any` is used for races or fallback strategies.

## Detached task exceptions

A task started with:

```cpp id="m6ynrg"
spawn_detached(
  ctx,
  background()
);
```

has no awaiting parent.

There is therefore no coroutine to receive an exception that escapes `background()`.

The detached boundary consumes that exception.

```text id="h6nmb3"
detached task
      ↓
exception escapes
      ↓
detached boundary
      ↓
exception consumed
```

If a detached failure matters, handle it inside the task:

```cpp id="ptqtqn"
task<void> background()
{
  try
  {
    co_await perform_work();
  }
  catch (const std::exception& error)
  {
    vix::print(
      "background error:",
      error.what()
    );
  }
}
```

Detached execution should only be used when giving up caller-side error propagation is intentional.

## Scheduler callback exceptions

Ordinary callbacks posted to the scheduler also have no result channel.

If one throws:

```cpp id="exmriw"
ctx.post([](){
  throw std::runtime_error("failed");
});
```

the scheduler consumes the exception and continues processing its event loop.

This prevents one fire-and-forget callback from terminating all scheduler execution.

If the caller needs to observe failure, use a task or another result-bearing operation instead.

## Thread-pool `post()` exceptions

The same principle applies to:

```cpp id="tn4m8q"
ctx.cpu_pool().post([](){
  throw std::runtime_error("failed");
});
```

A posted worker callable has no awaiting coroutine.

Its exception is consumed by the worker boundary so the worker thread can continue processing later jobs.

Use `submit()` when exception propagation is required.

## Cancellation callback exceptions

Cancellation callbacks registered with:

```cpp id="08zb3l"
token.on_cancel([](){
  perform_cancellation();
});
```

are also invoked through a no-result callback boundary.

If a cancellation callback throws, the cancellation state consumes that exception.

`request_cancel()` remains `noexcept`.

Cancellation callbacks should therefore perform small, reliable operations needed to stop or wake pending work.

## Accessing services after shutdown

`io_context` service access has a different failure mechanism.

After:

```cpp id="2xnm1d"
ctx.shutdown();
```

attempting to create or access a lazy service such as:

```cpp id="o0xe1u"
ctx.timers();
ctx.cpu_pool();
ctx.signals();
ctx.net();
```

throws:

```cpp id="mkqxxw"
std::runtime_error
```

with the context-shutdown condition.

This is a programming and lifecycle misuse rather than the asynchronous completion of a pending operation.

That distinction is why it does not use `errc::stopped`.

Pending operations interrupted by service shutdown report `errc::stopped`.

Attempting to use the context after shutdown throws `std::runtime_error`.

## Error boundaries

It is useful to recognize where errors remain observable and where execution becomes detached.

| Operation                                     | Failure observation                                                 |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `co_await task<T>`                            | Exception propagates to awaiting coroutine.                         |
| `thread_pool::submit()`                       | Callable exception propagates to awaiting coroutine.                |
| Timer/network/signal await                    | `std::system_error` propagates to awaiting coroutine.               |
| `when_all`                                    | First captured task exception is rethrown after all tasks complete. |
| `when_any`                                    | Winning task exception is rethrown.                                 |
| `spawn_detached()`                            | Escaping task exception is consumed.                                |
| `scheduler::post()` callback                  | Escaping callback exception is consumed.                            |
| `thread_pool::post()`                         | Escaping worker exception is consumed.                              |
| cancellation callback                         | Escaping callback exception is consumed.                            |
| service access after `io_context::shutdown()` | `std::runtime_error` is thrown directly.                            |

This distinction helps determine where application error handling should live.

## Handle expected conditions narrowly

A useful pattern is to handle the conditions that are part of normal control flow and propagate everything else.

```cpp id="nmra15"
try
{
  co_await operation();
}
catch (const std::system_error& error)
{
  if (error.code() == cancelled_ec())
  {
    co_return;
  }

  if (error.code() == make_error_code(errc::stopped))
  {
    co_return;
  }

  throw;
}
```

This keeps unexpected network, operating-system, and application failures visible.

Catching all exceptions and silently continuing can hide real faults.

## Async error reference

The complete current `errc` set is:

| Code                     | Meaning                                            |
| ------------------------ | -------------------------------------------------- |
| `errc::ok`               | No error.                                          |
| `errc::invalid_argument` | An API received an invalid argument.               |
| `errc::not_ready`        | The operation cannot proceed in the current state. |
| `errc::timeout`          | An operation timed out.                            |
| `errc::canceled`         | Application cancellation was requested.            |
| `errc::closed`           | A resource or channel is closed.                   |
| `errc::overflow`         | A capacity or numeric limit was exceeded.          |
| `errc::stopped`          | A runtime or service has stopped.                  |
| `errc::queue_full`       | An internal task queue is full.                    |
| `errc::rejected`         | A submission was rejected.                         |
| `errc::not_supported`    | The operation is unavailable on the platform.      |

Again, the existence of a code in `errc` does not mean every Async API currently emits it.

## API overview

The core error API is:

```cpp id="lhyfzr"
enum class errc : std::uint8_t;
```

Convert an Async code with:

```cpp id="gmfiok"
std::error_code make_error_code(
  errc error
) noexcept;
```

Access the Async error category with:

```cpp id="n25yzf"
const std::error_category&
category() noexcept;
```

The category name is:

```text id="m39flh"
async
```

Cancellation also provides:

```cpp id="rpr1l8"
std::error_code cancelled_ec() noexcept;
```

which is equivalent to:

```cpp id="zq1nz8"
make_error_code(errc::canceled)
```

## Next step

Continue with [CMake](./cmake) for the build and linking requirements of the Async module.

Then read:

- [API Reference](./api-reference)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
- [Networking](./networking)
