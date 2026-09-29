# Task Results and Status

The ThreadPool module uses `TaskStatus` and `TaskResult` to describe two different aspects of task execution.

`TaskStatus` answers:

```text
Where is the task in its lifecycle?
```

`TaskResult` answers:

```text
How did the execution finish?
```

For result-producing work, `ThreadPoolErrc` can additionally describe the ThreadPool-specific error associated with the asynchronous result.

```text
TaskStatus
    ↓
lifecycle state

TaskResult
    ↓
execution outcome

ThreadPoolErrc
    ↓
ThreadPool-specific error
```

These types are related, but they are not interchangeable.

## TaskStatus

`TaskStatus` describes the lifecycle state of a task.

The available values are:

```cpp
enum class TaskStatus : std::uint8_t
{
  created,
  queued,
  running,
  completed,
  failed,
  cancelled,
  timed_out,
  rejected
};
```

A low-level task normally progresses through:

```text
created
   ↓
queued
   ↓
running
   ↓
┌───────────┬───────────┬───────────┬───────────┐
▼           ▼           ▼           ▼
completed  failed    cancelled   timed_out
```

A task can also reach:

```text
rejected
```

without executing.

## `created`

A task starts in the `created` state.

```cpp
vix::threadpool::Task task(
  vix::threadpool::TaskId{1},
  vix::threadpool::TaskFunction([](){
    // Work.
  })
);

const auto status = task.status();
```

At this point:

```text
status = created
result = none
```

The task exists but has not entered a worker queue.

A newly created asynchronous `Future` state also starts with:

```text
status = created
result = none
```

## `queued`

A task becomes `queued` after it has been accepted for execution and inserted into a worker queue.

Conceptually:

```text
Task
  ↓
Scheduler
  ↓
Worker
  ↓
TaskQueue
  ↓
queued
```

The task has not started executing yet.

The low-level `Task` object records this transition through:

```cpp
task.mark_queued();
```

Ordinary application code does not need to call `mark_queued()` because the worker runtime manages this transition.

## `running`

A task becomes `running` immediately before its callable is invoked.

```text
queued
   ↓
worker removes task from queue
   ↓
running
   ↓
callable executes
```

For low-level `Task`, this transition happens inside:

```cpp
task.run();
```

A running task has started consuming worker execution time.

## Terminal states

A status is terminal when the task will no longer move to another lifecycle state.

The terminal statuses are:

```text
completed
failed
cancelled
timed_out
rejected
```

Use:

```cpp
if (vix::threadpool::is_terminal(status))
{
  // Final task state.
}
```

`is_terminal()` returns `false` for:

```text
created
queued
running
```

and `true` for every final state.

## Active states

The helper:

```cpp
vix::threadpool::is_active(status);
```

returns `true` only for:

```text
queued
running
```

For example:

```cpp
const auto status = task.status();

if (vix::threadpool::is_active(status))
{
  // The task is queued or executing.
}
```

`created` is not considered active because the task has not entered execution yet.

Terminal states are also not active.

## `completed`

`completed` means that the task finished successfully.

For a low-level task:

```text
status = completed
result = success
```

For a successful Future:

```text
ready  = true
status = completed
result = success
error  = ok
```

For example:

```cpp
auto future = pool.submit([](){
  return 42;
});

const int value = future.get();
```

A successful result-producing submission completes its asynchronous state with `TaskStatus::completed`.

## `failed`

`failed` means that task execution ended because of an execution failure.

For a low-level task whose callable throws:

```text
status = failed
result = failure
```

The exception is captured by the task.

For result-producing work:

```cpp
auto future = pool.submit([]() -> int {
  throw std::runtime_error("failure");
});
```

the Future state becomes:

```text
status = failed
result = failure
error  = internal_error
```

and `get()` rethrows the original C++ exception.

`failed` therefore describes the lifecycle outcome. It does not replace the original exception.

## `cancelled`

`cancelled` means that execution ended through the cancellation path.

The corresponding result is:

```text
status = cancelled
result = cancelled
```

For a Future completed with a cancellation error:

```text
status = cancelled
result = cancelled
error  = cancelled
```

Cancellation is cooperative and has its own timing rules.

See [Cancellation](/modules/threadpool/cancellation).

## `timed_out`

`timed_out` represents a task whose execution timing condition was exceeded.

The matching result is:

```text
status = timed_out
result = timeout
```

For an asynchronous state completed with `ThreadPoolErrc::timeout`:

```text
status = timed_out
result = timeout
error  = timeout
```

Timeout and deadline behavior are described separately because timing can be observed at different stages of execution.

See [Timeouts](/modules/threadpool/timeouts) and [Deadlines](/modules/threadpool/deadlines).

## `rejected`

`rejected` means that work did not enter normal execution.

For a low-level task:

```text
status = rejected
result = rejected
```

For a result-producing submission, several ThreadPool errors map to this state:

```text
rejected
queue_full
stopped
```

For example:

```cpp
vix::threadpool::ThreadPool pool(1);

pool.shutdown();

auto future = pool.submit([](){
  return 42;
});
```

The asynchronous result is:

```text
status = rejected
result = rejected
error  = rejected
```

The callable is not executed.

## TaskResult

`TaskResult` describes how a task execution attempt ended.

The available values are:

```cpp
enum class TaskResult : std::uint8_t
{
  none,
  success,
  failure,
  cancelled,
  timeout,
  rejected
};
```

Unlike `TaskStatus`, `TaskResult` does not describe intermediate lifecycle stages such as `queued` or `running`.

It describes the outcome.

## `none`

`none` means that no terminal execution result has been recorded.

A newly created task starts with:

```text
status = created
result = none
```

A non-ready Future state also reports:

```text
status = created
result = none
```

`none` is not a successful or failed execution result.

## `success`

`success` means that execution completed normally.

```text
status = completed
result = success
```

Use:

```cpp
if (vix::threadpool::is_success(result))
{
  // Successful task result.
}
```

`is_success()` returns `true` only for:

```text
success
```

## Failure results

The helper:

```cpp
vix::threadpool::is_failure(result);
```

returns `true` for:

```text
failure
cancelled
timeout
rejected
```

and returns `false` for:

```text
none
success
```

This is important because `failure` is only one member of the broader set of unsuccessful terminal outcomes.

Conceptually:

```text
TaskResult
├── none
├── success
└── unsuccessful
    ├── failure
    ├── cancelled
    ├── timeout
    └── rejected
```

## `Task::succeeded()`

A low-level `Task` provides:

```cpp
if (task.succeeded())
{
  // result == TaskResult::success
}
```

This is equivalent to checking:

```cpp
task.result() == vix::threadpool::TaskResult::success
```

## `Task::failed()`

A low-level `Task` also provides:

```cpp
if (task.failed())
{
  // Unsuccessful terminal result.
}
```

Despite its name, `Task::failed()` is broader than:

```text
result == failure
```

It uses `is_failure()` and therefore returns `true` for:

```text
failure
cancelled
timeout
rejected
```

It returns `false` for:

```text
none
success
```

When code needs one specific outcome, compare `TaskResult` directly.

For example:

```cpp
if (task.result() == vix::threadpool::TaskResult::cancelled)
{
  // Specifically cancelled.
}
```

## Status and result mappings

The normal relationship between terminal status and result is:

| `TaskStatus` | `TaskResult` |
| ------------ | ------------ |
| `created`    | `none`       |
| `queued`     | `none`       |
| `running`    | `none`       |
| `completed`  | `success`    |
| `failed`     | `failure`    |
| `cancelled`  | `cancelled`  |
| `timed_out`  | `timeout`    |
| `rejected`   | `rejected`   |

The distinction is useful because lifecycle and outcome answer different questions.

For example:

```text
queued
```

is meaningful as a status but there is no equivalent queued `TaskResult`, because execution has not finished.

## Inspect a low-level Task

A low-level `Task` exposes both views:

```cpp
const auto status = task.status();
const auto result = task.result();
```

For example:

```cpp
vix::threadpool::Task task(
  vix::threadpool::TaskId{1},
  vix::threadpool::TaskFunction([](){
    // Work.
  })
);

const auto before_status = task.status();
const auto before_result = task.result();

const auto execution_result = task.run();

const auto after_status = task.status();
const auto after_result = task.result();
```

For successful execution:

```text
before:
  status = created
  result = none

after:
  status = completed
  result = success
```

`Task::run()` itself returns the final `TaskResult`.

## Convenience lifecycle checks

`Task` exposes several convenience operations:

```cpp
task.done();
task.running();
task.queued();
task.succeeded();
task.failed();
```

They correspond to:

```text
done()
  ↓
status is terminal

running()
  ↓
status == running

queued()
  ↓
status == queued

succeeded()
  ↓
result == success

failed()
  ↓
result is failure, cancelled, timeout, or rejected
```

Use the direct `status()` or `result()` values when the exact state matters.

## Readable names

Both enums provide `to_string()` helpers.

For status:

```cpp
const char* name = vix::threadpool::to_string(
  vix::threadpool::TaskStatus::running
);
```

The result is:

```text
running
```

Available status strings are:

```text
created
queued
running
completed
failed
cancelled
timed_out
rejected
```

For results:

```cpp
const char* name = vix::threadpool::to_string(
  vix::threadpool::TaskResult::success
);
```

The result is:

```text
success
```

Available result strings are:

```text
none
success
failure
cancelled
timeout
rejected
```

Unknown enum values return:

```text
unknown
```

## Future status and result

`Future<T>` also exposes:

```cpp
const auto status = future.status();
const auto result = future.result();
```

These values belong to the Future's shared asynchronous state.

For a normal successful submission:

```cpp
auto future = pool.submit([](){
  return 42;
});

future.wait();

const auto status = future.status();
const auto result = future.result();
```

the values are:

```text
status = completed
result = success
```

## Future state is not a live Task state mirror

The low-level `Task` and the `Future` shared state are separate objects.

A low-level task can move through:

```text
created
queued
running
completed
```

while a Future shared state normally remains:

```text
created
```

until a terminal asynchronous result is published.

Conceptually:

```text
low-level Task:
created → queued → running → completed

Future state:
created ───────────────────→ completed
```

Therefore:

```cpp
future.status();
```

should not be used to determine whether its worker task is currently `queued` or `running`.

The current Future model primarily exposes the asynchronous result state.

## Future before completion

Before a Future becomes ready:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

its shared state starts as:

```text
ready  = false
status = created
result = none
error  = ok
```

The result may become ready immediately on another worker, so these values should be treated as snapshots when the pool is running concurrently.

Use:

```cpp
future.ready();
```

to determine whether a terminal asynchronous result has been published.

## Invalid Future

A default-constructed Future has no shared state:

```cpp
vix::threadpool::Future<int> future;
```

Its inspection methods report:

```text
valid()  false
ready()  false
status() created
result() none
error()  not_ready
```

The `created` status here is a fallback value. It does not mean that an actual task exists.

Check:

```cpp
future.valid();
```

when the distinction matters.

## ThreadPoolErrc

`ThreadPoolErrc` describes errors specific to the module.

The values are:

```text
ok
invalid_argument
stopped
rejected
queue_full
timeout
cancelled
not_ready
not_supported
internal_error
```

A Future exposes the stored value through:

```cpp
const auto error = future.error();
```

This provides more information than `TaskResult` when several errors map to the same execution outcome.

## Error to status mapping

When a `Promise` completes a Future using:

```cpp
promise.set_error(error);
```

the error is converted into a `TaskStatus`.

The mapping is:

| `ThreadPoolErrc`   | `TaskStatus` |
| ------------------ | ------------ |
| `ok`               | `completed`  |
| `cancelled`        | `cancelled`  |
| `timeout`          | `timed_out`  |
| `rejected`         | `rejected`   |
| `queue_full`       | `rejected`   |
| `stopped`          | `rejected`   |
| `invalid_argument` | `failed`     |
| `not_ready`        | `failed`     |
| `not_supported`    | `failed`     |
| `internal_error`   | `failed`     |

This means several distinct errors can share one lifecycle status.

For example:

```text
queue_full
    ↓
status = rejected
```

and:

```text
stopped
    ↓
status = rejected
```

The exact reason remains available through `error()`.

## Error to result mapping

The same error is also converted into `TaskResult`.

| `ThreadPoolErrc`   | `TaskResult` |
| ------------------ | ------------ |
| `ok`               | `success`    |
| `cancelled`        | `cancelled`  |
| `timeout`          | `timeout`    |
| `rejected`         | `rejected`   |
| `queue_full`       | `rejected`   |
| `stopped`          | `rejected`   |
| `invalid_argument` | `failure`    |
| `not_ready`        | `failure`    |
| `not_supported`    | `failure`    |
| `internal_error`   | `failure`    |

This gives three levels of detail:

```text
ThreadPoolErrc::queue_full
            ↓
TaskStatus::rejected
            ↓
TaskResult::rejected
```

The error explains why. The status explains the lifecycle outcome. The result categorizes the execution outcome.

## Successful Future

A successful result-producing task normally reports:

```text
ready()  true
status() completed
result() success
error()  ok
```

For example:

```cpp
auto future = pool.submit([](){
  return 42;
});

future.wait();

if (
  future.status() == vix::threadpool::TaskStatus::completed &&
  future.result() == vix::threadpool::TaskResult::success &&
  future.error() == vix::threadpool::ThreadPoolErrc::ok
)
{
  // Successful asynchronous result.
}
```

For ordinary application code, `get()` is usually simpler when the value itself is required.

## Failed Future with an exception

When a submitted callable throws:

```cpp
auto future = pool.submit([]() -> int {
  throw std::runtime_error("failure");
});
```

the Future state becomes:

```text
ready()  true
status() failed
result() failure
error()  internal_error
```

Calling:

```cpp
future.get();
```

rethrows the original exception.

The original C++ exception therefore contains more specific failure information than `ThreadPoolErrc::internal_error`.

## Cancelled Future

A Future completed through the cancellation error path reports:

```text
ready()  true
status() cancelled
result() cancelled
error()  cancelled
```

The callable may not have executed, depending on when cancellation was observed.

See [Cancellation](/modules/threadpool/cancellation).

## Timed-out Future

A Future explicitly completed with:

```cpp
vix::threadpool::ThreadPoolErrc::timeout
```

reports:

```text
ready()  true
status() timed_out
result() timeout
error()  timeout
```

Timing behavior is handled at several execution layers, so use [Timeouts](/modules/threadpool/timeouts) and [Deadlines](/modules/threadpool/deadlines) for the complete contract.

## Rejected Future

A result-producing submission rejected before normal execution reports:

```text
ready()  true
status() rejected
result() rejected
```

The error describes the reason.

For example:

```text
error = rejected
```

or, for a manually produced asynchronous state:

```text
error = queue_full
error = stopped
```

All of these map to the same status and result category.

## Why keep all three?

Consider a queue-capacity failure.

Only looking at `TaskResult` gives:

```text
rejected
```

Looking at `TaskStatus` also gives:

```text
rejected
```

Looking at `ThreadPoolErrc` can identify:

```text
queue_full
```

The three levels serve different purposes:

```text
TaskStatus
    ↓
What lifecycle state was reached?

TaskResult
    ↓
What broad outcome occurred?

ThreadPoolErrc
    ↓
What ThreadPool-specific reason caused it?
```

For generic reporting, status or result may be enough.

For recovery logic, diagnostics, or error handling, inspect the error code.

## Task state and Future state are separate

One submitted operation can involve both:

```text
low-level Task state
        +
Future shared state
```

They serve different runtime layers.

The worker uses the low-level task state for:

```text
queue lifecycle
execution lifecycle
worker statistics
```

The caller uses the Future state for:

```text
asynchronous readiness
value retrieval
exception propagation
ThreadPool error propagation
```

For ordinary successful work, both layers reach equivalent successful outcomes.

They should still not be treated as the same storage location or the same live state machine.

## Use the right view

Use `TaskStatus` when you need lifecycle information:

```cpp
const auto status = task.status();
```

Use `TaskResult` when you need the broad execution outcome:

```cpp
const auto result = task.result();
```

Use `ThreadPoolErrc` when you need the ThreadPool-specific reason associated with a Future:

```cpp
const auto error = future.error();
```

Use `Future::get()` when the caller simply needs the result and wants failures propagated normally:

```cpp
const int value = future.get();
```

The model can be summarized as:

```text
Task lifecycle
      ↓
 TaskStatus

Execution outcome
      ↓
 TaskResult

ThreadPool-specific failure
      ↓
 ThreadPoolErrc

Asynchronous value or exception
      ↓
 Future<T>
```

Continue with [Scheduling Model](/modules/threadpool/scheduling) for how tasks reach workers, or [Errors](/modules/threadpool/errors) for the complete ThreadPool error model.
