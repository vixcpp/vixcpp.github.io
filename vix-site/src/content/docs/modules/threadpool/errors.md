# Errors

The ThreadPool module uses several complementary mechanisms to report failure:

```text id="h632gk"
ThreadPoolErrc
std::error_code
std::system_error
user exceptions
TaskStatus
TaskResult
bool submission results
```

The mechanism depends on the API being used.

For result-producing work:

```cpp id="xw16nw"
auto future = pool.submit([](){
  return 42;
});
```

the `Future` exposes:

```cpp id="76ojkk"
future.status();
future.result();
future.error();
```

and:

```cpp id="rf8wg3"
future.get();
```

either returns the value or throws the stored failure.

## Error model

The high-level model is:

```text id="e6y2kg"
task succeeds
    ↓
Future::get()
    ↓
return value


user callable throws
    ↓
Future stores exception
    ↓
Future::get()
    ↓
rethrow original exception


ThreadPool operation error
    ↓
Future stores ThreadPoolErrc
    ↓
Future::get()
    ↓
throw std::system_error
```

These cases should be handled differently when the application needs to distinguish them.

## ThreadPoolErrc

ThreadPool-specific error codes are represented by:

```cpp id="mu8pek"
vix::threadpool::ThreadPoolErrc
```

The available values are:

```cpp id="jjp2gn"
enum class ThreadPoolErrc : std::uint8_t
{
  ok = 0,
  invalid_argument = 1,
  stopped = 2,
  rejected = 3,
  queue_full = 4,
  timeout = 5,
  cancelled = 6,
  not_ready = 7,
  not_supported = 8,
  internal_error = 9
};
```

The numeric values are part of the current public error-code definition.

## Error codes

| Error              | Value | Message                      |
| ------------------ | ----: | ---------------------------- |
| `ok`               |   `0` | `ok`                         |
| `invalid_argument` |   `1` | `invalid argument`           |
| `stopped`          |   `2` | `thread pool stopped`        |
| `rejected`         |   `3` | `task rejected`              |
| `queue_full`       |   `4` | `task queue full`            |
| `timeout`          |   `5` | `operation timed out`        |
| `cancelled`        |   `6` | `operation cancelled`        |
| `not_ready`        |   `7` | `operation not ready`        |
| `not_supported`    |   `8` | `operation not supported`    |
| `internal_error`   |   `9` | `internal thread pool error` |

## `ok`

```cpp id="88c5qn"
vix::threadpool::ThreadPoolErrc::ok
```

means no ThreadPool error is stored.

A successfully completed Future normally reports:

```text id="oahvaq"
status = completed
result = success
error  = ok
```

For example:

```cpp id="rmiur8"
auto future = pool.submit([](){
  return 42;
});

const int value = future.get();
```

after successful completion:

```cpp id="krry6i"
future.error() == vix::threadpool::ThreadPoolErrc::ok;
```

## `invalid_argument`

```cpp id="uw1trt"
vix::threadpool::ThreadPoolErrc::invalid_argument
```

represents an invalid API argument.

When stored in a Future shared state, it maps to:

```text id="5usxrp"
TaskStatus::failed
TaskResult::failure
```

The current high-level `ThreadPool::submit()` and `handle()` paths do not currently publish this code themselves.

It remains part of the public error vocabulary and can also be stored manually through `Promise::set_error()`.

## `stopped`

```cpp id="b2hczk"
vix::threadpool::ThreadPoolErrc::stopped
```

represents an operation associated with a stopped pool or executor.

When stored in a Future, it maps to:

```text id="8v9113"
TaskStatus::rejected
TaskResult::rejected
```

The current high-level `ThreadPool` submission API does not preserve this distinction when submission fails because the pool is stopped.

Instead, `submit()` and `handle()` currently store:

```cpp id="p3l8gy"
vix::threadpool::ThreadPoolErrc::rejected
```

for that path.

## `rejected`

```cpp id="kxvoxp"
vix::threadpool::ThreadPoolErrc::rejected
```

is the main high-level error produced when `submit()` or `handle()` cannot submit work.

For example:

```cpp id="fmm0pi"
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto future = pool.submit([](){
  return 42;
});
```

The Future is immediately ready with:

```text id="gxbix0"
status = rejected
result = rejected
error  = rejected
```

Calling:

```cpp id="jqn6p1"
future.get();
```

throws:

```cpp id="gtsz1o"
std::system_error
```

whose error code is `ThreadPoolErrc::rejected`.

## `queue_full`

```cpp id="al08nq"
vix::threadpool::ThreadPoolErrc::queue_full
```

represents queue-capacity rejection.

When stored in a Future, it maps to:

```text id="ecxaum"
TaskStatus::rejected
TaskResult::rejected
```

The public error code exists, but the current high-level ThreadPool submission path does not preserve queue-full as a distinct Future error.

The current flow is:

```text id="qvtz5q"
worker queue rejects task
        ↓
Scheduler::submit() returns false
        ↓
ThreadPool::submit()
        ↓
Future error = rejected
```

Therefore a Future currently reports:

```cpp id="g1vz10"
ThreadPoolErrc::rejected
```

rather than:

```cpp id="d59awh"
ThreadPoolErrc::queue_full
```

for this path.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## `timeout`

```cpp id="xgmmpy"
vix::threadpool::ThreadPoolErrc::timeout
```

maps to:

```text id="rwdkpm"
TaskStatus::timed_out
TaskResult::timeout
```

A common high-level path is an expired deadline before the submitted callable begins:

```cpp id="97wvzz"
vix::threadpool::TaskOptions options;

options.set_deadline(
  vix::threadpool::Deadline::after(
    std::chrono::milliseconds{0}
  )
);

auto future = pool.submit([](){
  return 42;
}, options);
```

When the deadline is observed as expired before callable execution, the Future receives:

```text id="atna10"
error  = timeout
status = timed_out
result = timeout
```

and `get()` throws `std::system_error`.

## Execution timeout has a current distinction

An execution timeout configured through:

```cpp id="k781wx"
options.set_timeout(
  vix::threadpool::Timeout::milliseconds(1)
);
```

does not forcibly interrupt the callable.

There is also an important current implementation distinction between the Future layer and low-level task classification.

For example:

```cpp id="d35z3w"
auto future = pool.submit([](){
  std::this_thread::sleep_for(
    std::chrono::milliseconds{10}
  );

  return 42;
}, options);
```

can currently produce:

```text id="y6sv7x"
Future:
  status = completed
  result = success
  error  = ok
  value  = 42

low-level worker task:
  result = timeout
```

Therefore runtime timeout metrics can increase while the corresponding Future still reports success.

See [Timeouts](/modules/threadpool/timeouts).

## `cancelled`

```cpp id="n0dhuu"
vix::threadpool::ThreadPoolErrc::cancelled
```

maps to:

```text id="0edr6e"
TaskStatus::cancelled
TaskResult::cancelled
```

For example, a handle cancelled before its callable begins can produce:

```cpp id="cv1ws0"
auto handle = pool.handle([](){
  return 42;
});

handle.cancel();
```

If cancellation is observed before the user callable starts, the Future state becomes cancelled.

Calling:

```cpp id="f444vv"
handle.get();
```

then throws a `std::system_error` whose error code represents `ThreadPoolErrc::cancelled`.

Cancellation remains cooperative.

A cancellation request made after the user callable has already started does not guarantee that the Future will become cancelled.

See [Cancellation](/modules/threadpool/cancellation).

## `not_ready`

```cpp id="2dwzrl"
vix::threadpool::ThreadPoolErrc::not_ready
```

represents an operation that cannot complete yet.

It is also the value returned by:

```cpp id="r9an7y"
future.error();
```

for an invalid Future with no shared state.

For example:

```cpp id="t4h4rf"
vix::threadpool::Future<int> future;

const auto error = future.error();
```

gives:

```text id="q5f3vc"
ThreadPoolErrc::not_ready
```

However, this does not mean the invalid Future contains a stored `not_ready` error.

It has no shared state at all.

## Invalid Future state

A default-constructed Future:

```cpp id="c73x9h"
vix::threadpool::Future<int> future;
```

reports:

```text id="ljqlzf"
valid()  false
ready()  false
status() created
result() none
error()  not_ready
```

Calling:

```cpp id="nks0br"
future.get();
```

does not throw a ThreadPool `std::system_error`.

It throws:

```cpp id="6ca3rq"
std::future_error
```

with:

```text id="9y5pwx"
std::future_errc::no_state
```

The same applies to:

```cpp id="2ayvlz"
future.wait();
future.wait_for(...);
future.wait_until(...);
```

because those operations require a valid shared state.

## `not_supported`

```cpp id="f9f63c"
vix::threadpool::ThreadPoolErrc::not_supported
```

represents an unsupported operation.

When stored in a Future, it maps to:

```text id="otv5b6"
TaskStatus::failed
TaskResult::failure
```

The current high-level ThreadPool task-submission path does not publish this error itself.

It remains part of the public error-code API.

## `internal_error`

```cpp id="t1uvyc"
vix::threadpool::ThreadPoolErrc::internal_error
```

maps to:

```text id="dz3mu9"
TaskStatus::failed
TaskResult::failure
```

It is also the error value stored in a shared state when a user exception is captured.

This does not mean `Future::get()` converts a user exception into `std::system_error`.

The original exception is stored separately and has precedence during `get()`.

## ThreadPool error category

ThreadPool errors use a custom:

```cpp id="0afyd7"
std::error_category
```

available through:

```cpp id="x7nd6l"
vix::threadpool::threadpool_category();
```

Its name is:

```text id="yecx92"
vix.threadpool
```

For example:

```cpp id="ao3qqz"
const auto& category =
  vix::threadpool::threadpool_category();

const char* name = category.name();
```

`name` points to:

```text id="ozr16e"
vix.threadpool
```

## Convert to `std::error_code`

Use:

```cpp id="a08tvs"
std::error_code error =
  vix::threadpool::make_error_code(
    vix::threadpool::ThreadPoolErrc::timeout
  );
```

The result contains:

```text id="7sct5r"
category = vix.threadpool
value    = 5
message  = operation timed out
```

## Implicit `std::error_code` conversion

`ThreadPoolErrc` is registered as:

```cpp id="wm59jp"
std::is_error_code_enum<
  vix::threadpool::ThreadPoolErrc
>
```

so this is also valid:

```cpp id="xqq4cl"
std::error_code error =
  vix::threadpool::ThreadPoolErrc::cancelled;
```

The resulting error code uses the ThreadPool category automatically.

## Inspect an error code

For example:

```cpp id="9rdaoo"
std::error_code error =
  vix::threadpool::ThreadPoolErrc::queue_full;

vix::print("category:", error.category().name());
vix::print("value:", error.value());
vix::print("message:", error.message());
```

The values are:

```text id="4pbvay"
category: vix.threadpool
value: 4
message: task queue full
```

## Helper functions

Use:

```cpp id="a59zau"
vix::threadpool::is_ok(error);
```

to check:

```text id="flf0hc"
error == ThreadPoolErrc::ok
```

For example:

```cpp id="2a3e5d"
if (vix::threadpool::is_ok(future.error()))
{
  // No ThreadPool error is stored.
}
```

Use:

```cpp id="mz9szc"
vix::threadpool::is_error(error);
```

for the opposite check:

```text id="uw9jw7"
error != ThreadPoolErrc::ok
```

These helpers operate on `ThreadPoolErrc`, not directly on `std::error_code`.

## Future state model

A `Future<T>` shares a state that can contain one of three completion forms:

```text id="v69yxq"
value
exception
ThreadPoolErrc
```

Conceptually:

```text id="xy8j97"
SharedState<T>
├── optional value
├── exception_ptr
├── ThreadPoolErrc
├── TaskStatus
├── TaskResult
└── ready flag
```

The first successful attempt to make the state ready wins.

Later completion attempts are ignored.

## Successful value

When a Promise stores:

```cpp id="9o74no"
promise.set_value(42);
```

the shared state becomes:

```text id="9yck20"
ready  = true
error  = ok
status = completed
result = success
value  = 42
```

`future.get()` returns the stored value.

## Successful void completion

For:

```cpp id="ovbv4x"
vix::threadpool::Promise<void> promise;
auto future = promise.get_future();

promise.set_value();
```

the Future becomes:

```text id="wx4ej9"
ready  = true
error  = ok
status = completed
result = success
```

and:

```cpp id="tgeqz6"
future.get();
```

returns normally.

## Stored ThreadPool error

When:

```cpp id="jr10ln"
promise.set_error(
  vix::threadpool::ThreadPoolErrc::cancelled
);
```

the shared state becomes ready with a mapped status and result.

Then:

```cpp id="200o41"
future.get();
```

throws:

```cpp id="ued218"
std::system_error
```

using:

```cpp id="w3jqqg"
make_error_code(ThreadPoolErrc::cancelled)
```

## Error-to-status mapping

When `SharedState::set_error()` is used, the mappings are:

| `ThreadPoolErrc`   | `TaskStatus` | `TaskResult` |
| ------------------ | ------------ | ------------ |
| `ok`               | `completed`  | `success`    |
| `cancelled`        | `cancelled`  | `cancelled`  |
| `timeout`          | `timed_out`  | `timeout`    |
| `rejected`         | `rejected`   | `rejected`   |
| `queue_full`       | `rejected`   | `rejected`   |
| `stopped`          | `rejected`   | `rejected`   |
| `invalid_argument` | `failed`     | `failure`    |
| `not_ready`        | `failed`     | `failure`    |
| `not_supported`    | `failed`     | `failure`    |
| `internal_error`   | `failed`     | `failure`    |

This mapping is shared by value-producing and `void` Futures.

## ThreadPoolErrc and TaskResult are different types

These types answer different questions.

`ThreadPoolErrc` describes the specific error:

```text id="wv97xn"
Why did the asynchronous operation fail?
```

`TaskResult` describes the broader outcome:

```text id="ntrrms"
How did the task finish?
```

For example:

```text id="m0olzf"
ThreadPoolErrc::queue_full
ThreadPoolErrc::stopped
ThreadPoolErrc::rejected
```

all map to:

```cpp id="x95mh7"
TaskResult::rejected
```

The result groups several specific error reasons into one execution outcome.

## ThreadPoolErrc and TaskStatus are also different

`TaskStatus` describes lifecycle state:

```text id="v1suxg"
created
queued
running
completed
failed
cancelled
timed_out
rejected
```

`ThreadPoolErrc` provides an error reason.

For example:

```text id="qjozhm"
error = timeout
      ↓
status = timed_out
```

while:

```text id="s4g5dq"
error = queue_full
      ↓
status = rejected
```

## User exceptions

If a submitted callable throws:

```cpp id="oc6nmy"
auto future = pool.submit([]() -> int {
  throw std::runtime_error{"task failed"};
});
```

the wrapper catches the exception and stores its:

```cpp id="sc65mk"
std::exception_ptr
```

in the shared state.

The state becomes:

```text id="0f580r"
status = failed
result = failure
error  = internal_error
```

but the original exception is retained separately.

## Original user exception is rethrown

Calling:

```cpp id="wbw8ap"
future.get();
```

on that Future rethrows:

```cpp id="qvf0su"
std::runtime_error{"task failed"}
```

It does not throw:

```cpp id="g6hjz9"
std::system_error{
  make_error_code(ThreadPoolErrc::internal_error)
}
```

because `SharedState::get()` checks the stored exception before checking the error code.

The retrieval order is:

```text id="xkbb9a"
ready
  ↓
already retrieved?
  ↓
stored exception?
  ├── yes → rethrow original exception
  │
  └── no
       ↓
ThreadPool error?
  ├── yes → throw std::system_error
  │
  └── no
       ↓
return value
```

## `error()` after a user exception

Even though `get()` rethrows the original user exception:

```cpp id="wgnc5m"
future.error();
```

reports:

```cpp id="i03ahp"
vix::threadpool::ThreadPoolErrc::internal_error
```

because `set_exception()` sets the error field to `internal_error`.

Therefore application code can observe:

```text id="e3cslc"
status = failed
result = failure
error  = internal_error
```

while `get()` still preserves the original exception type.

## Catch user exceptions separately

For example:

```cpp id="091pdz"
try
{
  const int result = future.get();
  use(result);
}
catch (const std::runtime_error& error)
{
  handle_task_failure(error);
}
catch (const std::system_error& error)
{
  handle_threadpool_failure(error);
}
```

This distinguishes:

```text id="m9pxdz"
exception thrown by user callable
```

from:

```text id="13zec7"
ThreadPoolErrc stored by asynchronous infrastructure
```

when those categories matter.

## Inspect `std::system_error`

A ThreadPool infrastructure error can be handled as:

```cpp id="yc2c6n"
try
{
  const int value = future.get();
  use(value);
}
catch (const std::system_error& error)
{
  if (error.code() ==
      vix::threadpool::ThreadPoolErrc::cancelled)
  {
    handle_cancelled();
  }
}
```

Because `ThreadPoolErrc` converts to `std::error_code`, direct comparison is available through the standard error-code machinery.

## Inspect category

When distinguishing ThreadPool errors from another `std::system_error` source:

```cpp id="c7dgkj"
catch (const std::system_error& error)
{
  if (error.code().category() ==
      vix::threadpool::threadpool_category())
  {
    handle_threadpool_error(error.code());
  }
}
```

The category identity is stable within the process through the singleton returned by:

```cpp id="rku1zk"
threadpool_category();
```

## Submission errors from `post()`

`ThreadPool::post()` does not return a Future or error code.

Its error channel is:

```cpp id="j24y9b"
bool
```

For example:

```cpp id="r1u2bq"
const bool accepted = pool.post([](){
  perform_work();
});

if (!accepted)
{
  handle_submission_failure();
}
```

A `false` return means the work was not accepted or handled successfully.

## `post()` does not expose the specific rejection reason

The current `post()` API does not distinguish through its return value between conditions such as:

```text id="o6r2u0"
pool stopped
queue rejected task
invalid empty callable
other scheduler rejection
```

They all appear as:

```text id="8huvxg"
false
```

when the high-level post operation fails.

Use runtime metrics when aggregate rejection counts are useful.

Use `submit()` when a per-operation asynchronous result is required.

## Empty `post()` callable

This:

```cpp id="edbzvc"
vix::threadpool::Executor::Task task;

const bool accepted = pool.post(task);
```

returns:

```text id="bu67vc"
false
```

No `ThreadPoolErrc::invalid_argument` object is returned to the caller.

The current high-level `post()` contract is only boolean.

## Submission errors from `submit()`

`submit()` always returns a valid Future after constructing its Promise.

When the ThreadPool rejects submission:

```text id="pyiwv0"
submit()
   ↓
cannot accept
   ↓
Promise::set_error(rejected)
   ↓
Future immediately ready
```

The caller can inspect:

```cpp id="ec4d7u"
if (future.error() ==
    vix::threadpool::ThreadPoolErrc::rejected)
{
  // Submission was rejected.
}
```

or consume it with `get()`.

## Submission errors from `handle()`

`handle()` follows the same Future error model:

```cpp id="fbz6rr"
auto handle = pool.handle([](){
  return 42;
});
```

Inspect:

```cpp id="ncx8yt"
handle.status();
handle.result();
handle.error();
```

These forward to the underlying Future.

A handle can remain structurally valid even when submission was rejected because it still contains:

```text id="v416yo"
valid task ID
valid Future
CancellationSource
```

Therefore:

```cpp id="bemhwu"
handle.valid()
```

does not mean:

```text id="zp8tt1"
task was accepted by the ThreadPool
```

Inspect its asynchronous result.

## Cancellation before submission

For `submit()`, a task option can already contain a cancelled token:

```cpp id="b6w24b"
vix::threadpool::CancellationSource source;
source.request_cancel();

vix::threadpool::TaskOptions options;
options.set_cancellation(source.token());

auto future = pool.submit([](){
  return 42;
}, options);
```

If the pool itself accepts submissions, the pre-run option check produces:

```text id="c664rg"
error  = cancelled
status = cancelled
result = cancelled
```

without constructing a worker task for execution.

## Cancellation precedence over deadline

The current pre-run mapping is:

```cpp id="r76h9y"
mergedOptions.cancellation.cancelled()
  ? ThreadPoolErrc::cancelled
  : ThreadPoolErrc::timeout
```

Therefore when:

```text id="c482mh"
cancellation already requested
and
deadline already expired
```

the Future receives:

```cpp id="p82ewz"
ThreadPoolErrc::cancelled
```

at that high-level pre-run check.

## Deadline before callable execution

Even after task submission, the `submit()` wrapper checks the observed absolute deadline before invoking the callable.

If expired:

```text id="qfhdcd"
Future error  = timeout
Future status = timed_out
Future result = timeout
```

The callable is not invoked.

## Running cancellation can still produce success

The high-level wrapper checks cancellation before calling the user function.

It does not check that cancellation token again after the function returns.

Therefore:

```text id="723s5i"
callable begins
      ↓
cancellation requested
      ↓
callable ignores cancellation
      ↓
returns 42
      ↓
Future stores value 42
```

can result in:

```text id="qf66ha"
status = completed
result = success
error  = ok
```

even though:

```cpp id="ah6zhx"
handle.cancelled();
```

reports that cancellation was requested.

Cancellation request state and Future result state are different concepts.

## `Future::wait_for()` timeout is not a task timeout

This is an important distinction:

```cpp id="kyk9ic"
const auto status = future.wait_for(
  std::chrono::milliseconds{10}
);
```

can return:

```cpp id="j5wri1"
std::future_status::timeout
```

This means only:

```text id="n4xz5p"
the caller waited 10 ms
and
the Future was not ready yet
```

It does not:

```text id="sm6hd3"
set Future error to ThreadPoolErrc::timeout
cancel the task
change TaskStatus to timed_out
change TaskResult to timeout
```

The Future continues running normally.

## `wait_until()` has the same distinction

Similarly:

```cpp id="se6f59"
const auto status = future.wait_until(deadline);
```

returning:

```cpp id="2o7r5r"
std::future_status::timeout
```

only describes the caller-side wait operation.

It is independent from:

```text id="7n9ega"
TaskOptions timeout
TaskOptions deadline
ThreadPoolErrc::timeout
TaskStatus::timed_out
TaskResult::timeout
```

## Future retrieval errors

`Future::get()` can also throw standard Future errors unrelated to `ThreadPoolErrc`.

The main cases are:

```text id="68g3w3"
invalid Future
      ↓
std::future_error(no_state)


get() already called once
      ↓
std::future_error(future_already_retrieved)
```

These are standard Future object-state errors.

They are not ThreadPool task execution errors.

## `get()` consumes the result

For example:

```cpp id="uhfh57"
auto future = pool.submit([](){
  return 42;
});

const int first = future.get();
```

A second:

```cpp id="06hoao"
future.get();
```

throws:

```cpp id="awbyji"
std::future_error
```

with:

```text id="8m09tv"
std::future_errc::future_already_retrieved
```

The Future object can still report its stored:

```text id="b5wo5i"
status
result
error
```

after retrieval, but the value cannot be retrieved a second time.

## Promise retrieval errors

A Promise can produce its Future only once:

```cpp id="yrqpmc"
vix::threadpool::Promise<int> promise;

auto future = promise.get_future();
```

Calling:

```cpp id="4rrccb"
promise.get_future();
```

again throws:

```cpp id="zw72ef"
std::future_error{
  std::future_errc::future_already_retrieved
}
```

A moved-from Promise with no state also throws:

```cpp id="39yk39"
std::future_error{
  std::future_errc::no_state
}
```

when an operation requiring state is used.

## Promise error completion

A Promise can explicitly complete a Future with a ThreadPool error:

```cpp id="o9yw8w"
vix::threadpool::Promise<int> promise;
auto future = promise.get_future();

promise.set_error(
  vix::threadpool::ThreadPoolErrc::not_supported
);
```

The Future becomes:

```text id="m30ttf"
status = failed
result = failure
error  = not_supported
```

and:

```cpp id="2duigg"
future.get();
```

throws `std::system_error`.

## Promise exception completion

Use:

```cpp id="1fvqip"
promise.set_exception(
  std::make_exception_ptr(
    std::runtime_error{"failure"}
  )
);
```

or inside a catch block:

```cpp id="p08sg3"
promise.set_current_exception();
```

The Future becomes:

```text id="907i8k"
status = failed
result = failure
error  = internal_error
```

while `get()` rethrows the original captured exception.

## First completion wins

SharedState completion methods ignore calls made after the state is already ready.

For example:

```cpp id="oqe22v"
promise.set_value(42);

promise.set_error(
  vix::threadpool::ThreadPoolErrc::cancelled
);
```

the second operation does not replace the successful value.

The result remains:

```text id="npou34"
value  = 42
status = completed
result = success
error  = ok
```

This behavior prevents competing completion paths from overwriting an already published asynchronous result.

## Do not use `set_error(ok)` to provide a value

For `Promise<T>`, successful completion should use:

```cpp id="lsritm"
promise.set_value(value);
```

or:

```cpp id="f8ds35"
promise.emplace_value(...);
```

Do not use:

```cpp id="2zkrrm"
promise.set_error(
  vix::threadpool::ThreadPoolErrc::ok
);
```

as a replacement for `set_value()`.

`set_error(ok)` marks the state ready and maps it to successful status/result, but it does not store a `T` value.

A value-producing Future requires an actual value before successful retrieval.

Treat `ThreadPoolErrc::ok` as the absence of an error, not as the value-completion operation for `Promise<T>`.

## No automatic broken-promise completion

The custom Vix `Promise` destructor does not publish:

```cpp id="98jkew"
std::future_errc::broken_promise
```

when an unresolved producer disappears.

This differs from a behavior developers may expect from `std::promise`.

For example, a queued wrapper removed by:

```cpp id="0zxtql"
pool.clear();
```

can destroy the Promise responsible for a Future without making that Future ready.

The Future can remain unresolved.

## Clear and unresolved Futures

Conceptually:

```text id="uvns29"
submit()
   ↓
Future returned
   ↓
task waiting in queue
   ↓
pool.clear()
   ↓
task wrapper destroyed
   ↓
producer disappears
   ↓
Future still non-ready
```

Calling:

```cpp id="sed8g4"
future.get();
```

can then block indefinitely.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown).

## Non-draining shutdown has the same risk

With:

```cpp id="a0gb4j"
config.drain_on_shutdown = false;
```

a queued result-producing task may never execute before workers stop.

Its Future is not automatically converted into:

```text id="ojg6pe"
rejected
cancelled
broken_promise
```

and can remain non-ready.

When Future completion is required, coordinate work before non-draining shutdown or use the default draining lifecycle.

## High-level rejection reason is currently coarse

The public error vocabulary contains:

```text id="npuahp"
stopped
rejected
queue_full
```

but high-level `ThreadPool::submit()` currently reduces scheduler submission failure to:

```cpp id="6hsp4i"
ThreadPoolErrc::rejected
```

The same is true for `handle()`.

Therefore application code currently cannot use a returned Future to distinguish:

```text id="jz430b"
queue full
from
scheduler rejection
from
completed pool shutdown
```

through separate `ThreadPoolErrc` values.

This distinction may exist in lower-level runtime state or context, but it is not preserved by the high-level Future submission API.

## Error inspection before `get()`

Because status, result, and error are exposed separately, callers can inspect a ready Future before consuming it:

```cpp id="g0pmem"
future.wait();

if (future.error() ==
    vix::threadpool::ThreadPoolErrc::cancelled)
{
  handle_cancelled();
}
else
{
  const auto value = future.get();
  use(value);
}
```

Remember that a user exception reports:

```cpp id="g7gnxk"
ThreadPoolErrc::internal_error
```

through `error()`, while the exact exception type is available only by calling `get()` and catching it.

## Error handling example

```cpp id="75nle1"
#include <iostream>
#include <system_error>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(2);

  auto future = pool.submit([]() -> int {
    throw std::runtime_error{"task failed"};
  });

  try
  {
    const int value = future.get();
    std::cout << value << '\n';
  }
  catch (const std::runtime_error& error)
  {
    std::cout << "task: " << error.what() << '\n';
  }
  catch (const std::system_error& error)
  {
    std::cout << "threadpool: "
              << error.code().message()
              << '\n';
  }

  return 0;
}
```

The `std::runtime_error` thrown by the callable is preserved rather than replaced with a generic ThreadPool exception.

## Rejection example

```cpp id="rkzy48"
#include <iostream>
#include <system_error>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(1);

  pool.shutdown();

  auto future = pool.submit([](){
    return 42;
  });

  if (future.error() !=
      vix::threadpool::ThreadPoolErrc::rejected)
  {
    return 1;
  }

  try
  {
    (void)future.get();
  }
  catch (const std::system_error& error)
  {
    std::cout << error.code().category().name()
              << ": "
              << error.code().message()
              << '\n';

    return 0;
  }

  return 1;
}
```

The error code contains:

```text id="ypr9av"
category = vix.threadpool
value    = 3
message  = task rejected
```

## Error paths by API

| API                                 | Failure reporting                     |
| ----------------------------------- | ------------------------------------- |
| `ThreadPool::post()`                | `false`                               |
| `ThreadPool::submit()`              | `Future`                              |
| `ThreadPool::handle()`              | `TaskHandle` containing `Future`      |
| `Future::get()` user exception      | Rethrows original exception           |
| `Future::get()` ThreadPool error    | Throws `std::system_error`            |
| Invalid Future operation            | Throws `std::future_error`            |
| `Future::wait_for()` caller timeout | Returns `std::future_status::timeout` |
| `Promise::set_error()`              | Stores `ThreadPoolErrc`               |
| `Promise::set_exception()`          | Stores `std::exception_ptr`           |
| Low-level `Task`                    | `TaskStatus` and `TaskResult`         |
| Runtime observation                 | Metrics and statistics                |

## Handling errors by intent

When the operation is fire-and-forget:

```cpp id="u9qs1b"
if (!pool.post(task))
{
  handle_submission_failure();
}
```

When a value is required:

```cpp id="ukslj1"
try
{
  auto value = future.get();
}
catch (const std::system_error& error)
{
  // ThreadPool error.
}
catch (...)
{
  // User callable exception.
}
```

When cancellation matters:

```cpp id="o2y83i"
if (handle.error() ==
    vix::threadpool::ThreadPoolErrc::cancelled)
{
  handle_cancelled();
}
```

When only readiness should be bounded:

```cpp id="98vekc"
if (future.wait_for(
      std::chrono::milliseconds{100}
    ) == std::future_status::timeout)
{
  // Caller stopped waiting after 100 ms.
  // The task itself was not timed out by this operation.
}
```

Choose the error mechanism according to the layer being observed.

## Error model summary

The Future path is:

```text id="b47vom"
ThreadPool::submit()
        ↓
Promise + Future
        ↓
submission accepted?
   ┌────┴────┐
  no        yes
   │          │
rejected      ▼
error      pre-run checks
              ↓
       cancelled/deadline?
          ┌───┴───┐
         yes      no
          │        │
       error       ▼
              user callable
               ┌──┴──┐
             throws  returns
               │       │
          exception   value
               └──┬────┘
                  ↓
             Future ready
                  ↓
               get()
          ┌───────┼────────┐
          ▼       ▼        ▼
       exception error    value
          │       │        │
       rethrow  system   return
               error
```

The important properties are:

- `ThreadPoolErrc` is the module's public error-code enum.
- The current values range from `ok = 0` through `internal_error = 9`.
- ThreadPool error codes use the `vix.threadpool` error category.
- `ThreadPoolErrc` converts to `std::error_code`.
- `make_error_code()` can be used explicitly.
- `is_ok()` and `is_error()` provide simple enum checks.
- `SharedState` maps ThreadPool errors to `TaskStatus` and `TaskResult`.
- `cancelled` maps to cancelled status/result.
- `timeout` maps to timed-out status/result.
- `rejected`, `queue_full`, and `stopped` all map to rejected status/result.
- `invalid_argument`, `not_ready`, `not_supported`, and `internal_error` map to failed/failure.
- `Future::get()` throws `std::system_error` for stored ThreadPool errors.
- User callable exceptions are stored separately and rethrown with their original type.
- A user exception also sets the Future's ThreadPool error field to `internal_error`.
- Exception rethrow has precedence over conversion of `internal_error` into `std::system_error`.
- `post()` exposes only a boolean submission result.
- The high-level `submit()` and `handle()` APIs currently report scheduler submission failures as `ThreadPoolErrc::rejected`.
- They do not currently preserve `queue_full` or `stopped` as separate Future errors.
- An invalid Future reports `not_ready` through `error()`, but operations such as `get()` throw `std::future_error(no_state)`.
- `get()` can be called only once and later retrieval throws `std::future_error(future_already_retrieved)`.
- `wait_for()` and `wait_until()` caller timeouts do not modify the task or Future result.
- An expired task deadline can produce `ThreadPoolErrc::timeout`.
- Execution timeout currently has a known Future versus low-level task-classification distinction.
- Cancellation is cooperative and a cancellation request does not guarantee a cancelled Future after execution has already started.
- Promise completion is first-writer-wins once the shared state becomes ready.
- Use `set_value()` for successful `Promise<T>` completion, not `set_error(ok)`.
- The custom Promise does not currently produce automatic `broken_promise` completion when an unresolved producer disappears.
- `clear()` and non-draining shutdown can therefore leave result-producing Futures non-ready.
- Error handling should distinguish infrastructure errors, user exceptions, object-state errors, and caller-side wait timeouts.

Continue with [CMake](/modules/threadpool/cmake) for linking the ThreadPool module from CMake projects.
