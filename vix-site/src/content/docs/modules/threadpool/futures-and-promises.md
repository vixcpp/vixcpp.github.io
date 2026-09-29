# Futures and Promises

`Future<T>` and `Promise<T>` represent the consumer and producer sides of an asynchronous result.

When work is submitted through `ThreadPool::submit()`, the pool creates this relationship automatically:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  auto future = pool.submit([](){
    return 42;
  });

  return future.get() == 42 ? 0 : 1;
}
```

Most application code only needs the returned `Future`. `Promise` is useful when lower-level asynchronous code needs to publish a result manually.

## The shared result model

A `Future` and its `Promise` observe the same asynchronous state.

```text
Promise<T>
    │
    │ publishes
    ▼
SharedState<T>
    ▲
    │ observes
    │
Future<T>
```

The shared state can contain one terminal outcome:

```text
value
exception
threadpool error
```

Once an outcome is stored, the state becomes ready and waiting futures can continue.

## Future

`Future<T>` is the consumer side of the result.

It can:

```text
check validity
check readiness
wait
wait for a duration
wait until a time point
retrieve the result
inspect task status
inspect task result
inspect a threadpool error
```

A future does not execute the task itself.

For a normal submission:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

the callable executes through the thread pool. The future only observes the result produced by that execution.

## Future validity

A default-constructed future has no shared state:

```cpp
vix::threadpool::Future<int> future;
```

Check validity with:

```cpp
if (future.valid())
{
  // The Future owns asynchronous state.
}
```

or:

```cpp
if (future)
{
  // Valid Future.
}
```

A future returned by `ThreadPool::submit()` is valid even when the submission later represents cancellation, rejection, or another error.

Validity means:

```text
Future owns shared state
```

It does not mean:

```text
task succeeded
```

## Invalid Future behavior

For an invalid future:

```cpp
vix::threadpool::Future<int> future;
```

the inspection functions return:

```text
valid()   false
ready()   false
status()  TaskStatus::created
result()  TaskResult::none
error()   ThreadPoolErrc::not_ready
```

Operations that require shared state throw `std::future_error`:

```cpp
future.wait();
future.get();
future.wait_for(std::chrono::milliseconds{100});
future.wait_until(std::chrono::steady_clock::now());
```

The error condition is `std::future_errc::no_state`.

## Wait for a result

Use `wait()` when the caller needs completion but does not want to consume the result yet:

```cpp
auto future = pool.submit([](){
  return 42;
});

future.wait();
```

After `wait()` returns, the future is ready.

The value can still be retrieved:

```cpp
future.wait();

const int value = future.get();
```

`wait()` does not consume the result.

## Check readiness

Use:

```cpp
if (future.ready())
{
  // A terminal result is available.
}
```

A ready future may contain:

```text
successful value
successful void completion
exception
cancellation error
timeout error
rejection error
another threadpool error
```

Readiness only means that the asynchronous state has reached a terminal result.

It does not imply success.

## Wait for a duration

`wait_for()` waits until the future becomes ready or a relative duration expires.

```cpp
auto status = future.wait_for(
  std::chrono::milliseconds{100}
);
```

The result is a `std::future_status`.

```cpp
if (status == std::future_status::ready)
{
  // Result is available.
}
```

If the duration expires first:

```text
std::future_status::timeout
```

is returned.

`wait_for()` does not change the task's timeout configuration.

These are two different concepts:

```text
Future::wait_for()
      ↓
limits how long the calling thread waits


TaskOptions timeout
      ↓
describes execution timing for the task
```

A caller can stop waiting while the submitted task continues running.

## Wait until a time point

`wait_until()` uses an absolute time point:

```cpp
const auto deadline =
    std::chrono::steady_clock::now() + std::chrono::seconds{1};

const auto status = future.wait_until(deadline);
```

It returns:

```text
std::future_status::ready
```

when the asynchronous result becomes ready before the supplied time point, otherwise:

```text
std::future_status::timeout
```

This waiting deadline belongs to the caller.

It is not the same as a task `Deadline`.

See [Deadlines](/modules/threadpool/deadlines).

## Retrieve a value

Use `get()` to wait for and consume the result:

```cpp
auto future = pool.submit([](){
  return 42;
});

const int value = future.get();
```

If the result is not ready, `get()` waits.

For a successful result, it returns the stored value.

The stored value is moved out of the asynchronous state.

This allows futures to carry move-only result types.

```cpp
auto future = pool.submit([](){
  return std::make_unique<int>(42);
});

auto value = future.get();

return *value == 42 ? 0 : 1;
```

## `get()` is single-consumer

A result can be retrieved only once.

```cpp
auto future = pool.submit([](){
  return 42;
});

const int value = future.get();
```

Calling `get()` again on the same asynchronous state throws `std::future_error` with:

```text
std::future_errc::future_already_retrieved
```

For example:

```cpp
const int first = future.get();

// Invalid: the result was already consumed.
// const int second = future.get();
```

Use `wait()`, `ready()`, `status()`, `result()`, and `error()` when inspection is needed before consuming the result.

## Void results

`Future<void>` represents completion without a returned value.

```cpp
auto future = pool.submit([](){
  perform_work();
});

future.get();
```

For successful completion, `get()` simply returns after the task result becomes ready.

The same waiting and inspection operations remain available:

```cpp
future.wait();
future.ready();
future.status();
future.result();
future.error();
```

## Successful state

A successful value produces:

```text
ready()   true
status()  completed
result()  success
error()   ok
```

For example:

```cpp
auto future = pool.submit([](){
  return 42;
});

const int value = future.get();
```

The same status and result mapping is used for successful `Future<void>` completion.

## Exceptions

If a callable submitted with `submit()` throws, the pool stores the exception in the asynchronous state.

```cpp
auto future = pool.submit([]() -> int {
  throw std::runtime_error("failure");
});
```

The future becomes ready with:

```text
status()  failed
result()  failure
error()   internal_error
```

Calling `get()` rethrows the original exception:

```cpp
try
{
  const int value = future.get();
}
catch (const std::runtime_error&)
{
  // Original task exception.
}
```

The exception is preserved as an `std::exception_ptr`.

The `internal_error` value describes the threadpool result state. It does not replace the original C++ exception returned by `get()`.

## ThreadPool errors

An asynchronous result can also contain a `ThreadPoolErrc`.

Examples include:

```text
cancelled
timeout
rejected
queue_full
stopped
invalid_argument
not_ready
not_supported
internal_error
```

When a threadpool error is stored, `get()` throws `std::system_error`.

```cpp
try
{
  const int value = future.get();
}
catch (const std::system_error& error)
{
  // ThreadPool-specific failure.
}
```

The exact error can be inspected before consuming the result:

```cpp
const auto error = future.error();
```

See [Errors](/modules/threadpool/errors).

## Status, result, and error are different

A future exposes three related views of its asynchronous outcome:

```cpp
const auto status = future.status();
const auto result = future.result();
const auto error = future.error();
```

They answer different questions.

### Status

`TaskStatus` describes lifecycle outcome:

```text
created
completed
failed
cancelled
timed_out
rejected
```

The Future shared state does not currently expose live `queued` or `running` transitions.

Before it becomes ready, its status remains:

```text
created
```

### Result

`TaskResult` describes the execution result:

```text
none
success
failure
cancelled
timeout
rejected
```

Before completion:

```text
none
```

### Error

`ThreadPoolErrc` identifies a threadpool-specific error:

```text
ok
cancelled
timeout
rejected
...
```

A future can therefore report:

```text
status  completed
result  success
error   ok
```

or:

```text
status  cancelled
result  cancelled
error   cancelled
```

or:

```text
status  failed
result  failure
error   internal_error
```

while also storing an original C++ exception.

See [Task Results and Status](/modules/threadpool/task-results-and-status).

## Future is move-only

`Future<T>` cannot be copied.

```text
copy construction   disabled
copy assignment     disabled
move construction   supported
move assignment     supported
```

Move it when ownership must be transferred:

```cpp
auto first = pool.submit([](){
  return 42;
});

auto second = std::move(first);

const int value = second.get();
```

After the move, `second` owns the asynchronous state.

The moved-from future no longer has usable state.

## Promise

`Promise<T>` is the producer side of the asynchronous result.

A promise creates a shared state when constructed:

```cpp
vix::threadpool::Promise<int> promise;
```

Obtain its future with:

```cpp
auto future = promise.get_future();
```

The two objects now refer to the same asynchronous state:

```text
Promise<int>
     │
     ▼
shared state
     ▲
     │
Future<int>
```

The producer can later publish the result:

```cpp
promise.set_value(42);
```

and the consumer can retrieve it:

```cpp
const int value = future.get();
```

## Basic Promise workflow

A complete manual example is:

```cpp
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::Promise<int> promise;
  auto future = promise.get_future();

  promise.set_value(42);

  return future.get() == 42 ? 0 : 1;
}
```

This does not require a thread pool.

`Promise` and `Future` provide the asynchronous result mechanism itself. A `ThreadPool` is one producer of those results.

## A Promise produces one Future

`get_future()` can be called only once for one Promise instance.

```cpp
vix::threadpool::Promise<int> promise;

auto future = promise.get_future();
```

Calling it again throws `std::future_error` with:

```text
std::future_errc::future_already_retrieved
```

For example:

```cpp
auto first = promise.get_future();

// Invalid:
// auto second = promise.get_future();
```

The single Future can then be moved to another owner.

## Publish a value

Use:

```cpp
promise.set_value(42);
```

For object types, the value is moved into the shared state.

You can also construct the stored result directly with `emplace_value()`:

```cpp
vix::threadpool::Promise<std::string> promise;
auto future = promise.get_future();

promise.emplace_value("Vix.cpp");

const auto value = future.get();
```

`emplace_value()` forwards its arguments to the result type constructor.

## Publish void completion

`Promise<void>` uses:

```cpp
vix::threadpool::Promise<void> promise;
auto future = promise.get_future();

promise.set_value();

future.get();
```

There is no stored value.

`set_value()` only marks the asynchronous operation as successfully completed.

## Publish an exception

A promise can store an exception explicitly:

```cpp
vix::threadpool::Promise<int> promise;
auto future = promise.get_future();

promise.set_exception(
  std::make_exception_ptr(
    std::runtime_error{"failure"}
  )
);
```

The future becomes ready.

Calling:

```cpp
future.get();
```

rethrows the stored exception.

## Publish the current exception

Inside a catch block, use:

```cpp
promise.set_current_exception();
```

For example:

```cpp
vix::threadpool::Promise<int> promise;
auto future = promise.get_future();

try
{
  throw std::runtime_error("failure");
}
catch (...)
{
  promise.set_current_exception();
}
```

The original exception is then rethrown by:

```cpp
future.get();
```

This is the mechanism used by `ThreadPool::submit()` to transport exceptions from worker execution back to the caller.

## Publish a ThreadPool error

Use `set_error()` for a ThreadPool-specific terminal condition:

```cpp
vix::threadpool::Promise<int> promise;
auto future = promise.get_future();

promise.set_error(
  vix::threadpool::ThreadPoolErrc::cancelled
);
```

The resulting state is:

```text
ready()   true
status()  cancelled
result()  cancelled
error()   cancelled
```

Calling:

```cpp
future.get();
```

throws `std::system_error`.

The error-to-result mapping is handled by the shared asynchronous state.

## Error mapping

ThreadPool errors map to Future status and result as follows:

| Error              | Status      | Result      |
| ------------------ | ----------- | ----------- |
| `ok`               | `completed` | `success`   |
| `cancelled`        | `cancelled` | `cancelled` |
| `timeout`          | `timed_out` | `timeout`   |
| `rejected`         | `rejected`  | `rejected`  |
| `queue_full`       | `rejected`  | `rejected`  |
| `stopped`          | `rejected`  | `rejected`  |
| `invalid_argument` | `failed`    | `failure`   |
| `not_ready`        | `failed`    | `failure`   |
| `not_supported`    | `failed`    | `failure`   |
| `internal_error`   | `failed`    | `failure`   |

This mapping describes the asynchronous result state.

The exact error remains available through:

```cpp
future.error();
```

## First terminal result wins

The shared state accepts only its first terminal result.

After it becomes ready, later attempts to store another value, exception, or error are ignored.

Conceptually:

```text
not ready
   ↓
set_value(42)
   ↓
ready with success
   ↓
set_error(cancelled)
   ↓
ignored
```

The same applies in the opposite direction:

```text
set_error(timeout)
   ↓
ready with timeout
   ↓
set_value(42)
   ↓
ignored
```

A producer should therefore publish exactly one terminal result.

## Promise validity

A Promise is valid while it owns shared state:

```cpp
vix::threadpool::Promise<int> promise;

if (promise.valid())
{
  // Shared state exists.
}
```

Promises are move-only.

```text
copy construction   disabled
copy assignment     disabled
move construction   supported
move assignment     supported
```

For example:

```cpp
vix::threadpool::Promise<int> first;
auto future = first.get_future();

auto second = std::move(first);

second.set_value(42);
```

The moved-to Promise owns the producer side of the state.

## Promise lifetime

A producer must publish a terminal result when a consumer may wait on its Future.

The current `Promise` destructor does not automatically store a `broken_promise` error when a valid Promise is destroyed without calling:

```text
set_value()
set_exception()
set_error()
```

For example, do not rely on this pattern:

```cpp
vix::threadpool::Future<int> create_future()
{
  vix::threadpool::Promise<int> promise;
  auto future = promise.get_future();

  return future;
}
```

The returned Future owns the shared state, but no producer will make that state ready.

A later:

```cpp
future.get();
```

can therefore wait indefinitely.

When using `Promise` directly, every execution path that leaves a consumer waiting should publish a value, exception, or error.

`ThreadPool::submit()` normally manages this producer lifecycle internally.

## Access the shared state

`Promise` exposes the underlying shared state:

```cpp
auto state = promise.state();
```

This is primarily useful for lower-level integrations.

Ordinary code should prefer the Promise operations:

```text
set_value()
emplace_value()
set_exception()
set_current_exception()
set_error()
```

because they express the producer contract directly.

## SharedState

`SharedState<T>` is the synchronized storage connecting a Promise and Future.

It stores:

```text
value or void completion
exception
ThreadPoolErrc
TaskStatus
TaskResult
ready state
retrieved state
```

Access is protected internally so producer and consumer threads can safely interact with the same state.

Most application code should not construct or manipulate `SharedState` directly.

Use:

```text
Promise<T>
Future<T>
```

as the public producer and consumer abstractions.

## How submit() uses Promise and Future

A normal result-producing submission follows this model:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

Conceptually:

```text
ThreadPool::submit()
        ↓
create Promise<T>
        ↓
get Future<T>
        ↓
move Promise into task execution state
        ↓
schedule task
        ↓
worker invokes callable
        ↓
┌─────────────────────┐
│ returns value       │ → Promise::set_value()
│ throws exception    │ → Promise::set_exception()
│ cancelled           │ → Promise::set_error()
│ rejected            │ → Promise::set_error()
└─────────────────────┘
        ↓
Future becomes ready
```

The application does not need to create the Promise manually for ordinary `submit()` usage.

## Submission rejection

`submit()` always returns a `Future` for the attempted result-producing submission.

If the pool cannot accept the task, the Future is completed with a rejection error.

```cpp
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto future = pool.submit([](){
  return 42;
});
```

The Future can then report:

```text
ready()   true
status()  rejected
result()  rejected
error()   rejected
```

Calling:

```cpp
future.get();
```

throws `std::system_error`.

This differs from `post()`, which reports acceptance directly through its boolean return value.

## Pre-execution cancellation

A result-producing submission that observes cancellation before the callable starts completes its Future through:

```text
ThreadPoolErrc::cancelled
```

The result becomes:

```text
status  cancelled
result  cancelled
error   cancelled
```

The user callable is not invoked in that path.

See [Cancellation](/modules/threadpool/cancellation).

## Pre-execution deadline expiration

If the result-producing submission observes an expired deadline before the callable starts, the Future receives:

```text
ThreadPoolErrc::timeout
```

which maps to:

```text
status  timed_out
result  timeout
error   timeout
```

See [Deadlines](/modules/threadpool/deadlines).

## Future result and low-level Task result

A Future tracks the result-producing wrapper used by `submit()` or `handle()`.

The worker also tracks the low-level `Task` that carries that wrapper.

These are related but separate states:

```text
Future state
    ↓
result observed by caller


low-level Task state
    ↓
result observed by worker runtime
```

For ordinary successful execution, they agree.

Some timing behavior is evaluated by the low-level task after the result-producing wrapper has already published its Future result. The dedicated [Timeouts](/modules/threadpool/timeouts) page describes the current timeout semantics.

Do not use pool metrics as a substitute for inspecting the Future belonging to a specific result-producing submission.

## Choosing the right operation

Use `Future<T>` when consuming an asynchronous result:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

Use `Promise<T>` when implementing a producer manually:

```cpp
vix::threadpool::Promise<int> promise;
auto future = promise.get_future();
```

Use `TaskHandle<T>` when result consumption must also include task identity or cancellation control:

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

The relationship is:

```text
Need an asynchronous result?
        │
        ├── ThreadPool produces it
        │       ↓
        │    submit()
        │       ↓
        │    Future<T>
        │
        ├── custom code produces it
        │       ↓
        │    Promise<T>
        │       +
        │    Future<T>
        │
        └── need task control too
                ↓
             handle()
                ↓
          TaskHandle<T>
```

Continue with [Task Results and Status](/modules/threadpool/task-results-and-status) for the status model, or [Cancellation](/modules/threadpool/cancellation) for cancellation outcomes.
