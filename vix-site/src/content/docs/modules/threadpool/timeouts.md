# Timeouts

A `Timeout` describes how long a task is allowed to execute before the ThreadPool records that execution as timed out.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(500)
);

auto future = pool.submit([](){
  return 42;
}, options);
```

A timeout observes execution duration.

It does not forcibly interrupt C++ code when the configured duration is reached.

## Timeout vs deadline

Timeouts and deadlines measure different things.

A timeout measures execution duration:

```text
task starts
    ↓
execution timer starts
    ↓
callable runs
    ↓
execution timer stops
```

A deadline represents an absolute point in time:

```text
submission
    ↓
queue waiting
    ↓
absolute deadline
```

The important difference is:

```text
Timeout
  queue waiting does not consume it

Deadline
  queue waiting does consume it
```

See [Deadlines](/modules/threadpool/deadlines) for absolute time limits.

## Timeout

`Timeout` is a lightweight wrapper around:

```cpp
std::chrono::milliseconds
```

Its duration type is:

```cpp
vix::threadpool::Timeout::duration
```

which is equivalent to:

```cpp
std::chrono::milliseconds
```

## Disabled timeout

A default timeout is disabled:

```cpp
vix::threadpool::Timeout timeout;
```

It reports:

```text
enabled()         false
disabled_value()  true
count()           0
```

A disabled timeout never expires:

```cpp
timeout.expired(
        std::chrono::seconds{10}
);
```

returns:

```text
false
```

You can also create a disabled timeout explicitly:

```cpp
auto timeout = vix::threadpool::Timeout::disabled();
```

## Create a timeout in milliseconds

Use:

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(500);
```

The stored value is:

```text
500 ms
```

and:

```cpp
timeout.count();
```

returns:

```text
500
```

## Create a timeout in seconds

Use:

```cpp
auto timeout = vix::threadpool::Timeout::seconds(2);
```

The value is converted to milliseconds.

```cpp
timeout.count();
```

returns:

```text
2000
```

## Construct from milliseconds

A timeout can also be constructed directly:

```cpp
vix::threadpool::Timeout timeout(
        std::chrono::milliseconds{500}
);
```

This is equivalent to:

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(500);
```

## Negative durations are disabled

Negative timeout values are normalized to zero.

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(-10);
```

The result is:

```text
enabled()  false
count()    0
```

Conceptually:

```text
negative duration
      ↓
normalize()
      ↓
0 ms
      ↓
timeout disabled
```

This differs from `Deadline::after()`, where a negative duration creates an already expired absolute deadline.

## Zero disables timeout observation

A zero timeout is also disabled:

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(0);
```

It reports:

```text
enabled()  false
```

Therefore:

```text
timeout <= 0
    ↓
disabled
```

for timeout values constructed through the public `Timeout` API.

## Check whether timeout is enabled

Use:

```cpp
if (timeout.enabled())
{
  // Timeout observation is active.
}
```

The opposite check is:

```cpp
if (timeout.disabled_value())
{
  // Timeout observation is disabled.
}
```

## Read the duration

Use:

```cpp
const auto duration = timeout.value();
```

The returned type is:

```cpp
std::chrono::milliseconds
```

For example:

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(250);

const auto duration = timeout.value();
```

The value is:

```text
250 ms
```

Use:

```cpp
timeout.count();
```

when only the numeric millisecond count is needed.

## Check an elapsed duration

`Timeout::expired()` compares an elapsed duration with the configured timeout.

```cpp
auto timeout = vix::threadpool::Timeout::milliseconds(50);

const bool expired = timeout.expired(
        std::chrono::milliseconds{51}
);
```

The result is:

```text
true
```

The comparison is strictly greater than the configured timeout.

Therefore:

```cpp
timeout.expired(
        std::chrono::milliseconds{50}
);
```

returns:

```text
false
```

while:

```cpp
timeout.expired(
        std::chrono::milliseconds{51}
);
```

returns:

```text
true
```

Conceptually:

```text
elapsed <= timeout
      ↓
not expired

elapsed > timeout
      ↓
expired
```

## Timeout precision

`Timeout` stores milliseconds.

`expired()` converts the supplied elapsed duration to milliseconds before comparing it.

Conceptually:

```text
elapsed duration
      ↓
duration_cast<milliseconds>
      ↓
compare with timeout
```

The comparison therefore uses millisecond resolution.

## Attach a timeout to a task

Use `TaskOptions::with_timeout()`:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(100)
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Or use the setter:

```cpp
vix::threadpool::TaskOptions options;

options.set_timeout(
        vix::threadpool::Timeout::milliseconds(100)
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Check whether task options contain an active timeout with:

```cpp
if (options.has_timeout())
{
  // Timeout observation is enabled.
}
```

## Timeout starts when execution starts

A timeout does not measure how long the task has existed.

It measures execution duration.

Conceptually:

```text
task created
    ↓
task waits in queue
    ↓
worker takes task
    ↓
execution starts
    ↓
timeout measurement starts
    ↓
callable runs
    ↓
execution ends
    ↓
timeout evaluated
```

Time spent waiting in the worker queue does not count toward the timeout.

## Queue waiting does not consume the timeout

Suppose a task has:

```text
timeout = 100 ms
```

and waits:

```text
500 ms
```

in a worker queue before executing.

If its callable then runs for:

```text
20 ms
```

the timeout observes:

```text
20 ms
```

not:

```text
520 ms
```

A timeout therefore cannot be used to say:

```text
this task must finish within 100 ms of submission
```

Use a [Deadline](/modules/threadpool/deadlines) when queue waiting must count toward the time limit.

## Low-level Task timeout behavior

`Task::run()` records the execution start time immediately before invoking the callable:

```text
status = running
      ↓
started_at = now
      ↓
callable executes
      ↓
finished_at = now
```

It then checks:

```text
finished_at - started_at
```

against the configured timeout.

If execution exceeded the timeout:

```text
status = timed_out
result = timeout
```

## Low-level timeout example

A low-level task can observe an execution timeout directly:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(1)
);

vix::threadpool::Task task(
        vix::threadpool::TaskId{1},
        vix::threadpool::TaskFunction([](){
          std::this_thread::sleep_for(
                std::chrono::milliseconds{5}
          );
        }),
        options,
        1
);

const auto result = task.run();
```

After execution:

```text
status = timed_out
result = timeout
```

The callable still ran for its complete duration.

## Timeout does not prevent execution from starting

Unlike cancellation and deadlines, timeout is not part of:

```cpp
options.should_skip_before_run();
```

That function checks only:

```text
cancellation requested
        or
deadline expired
```

A timeout cannot already be considered exceeded before execution because its timer begins when execution starts.

## Timeout does not interrupt the callable

Suppose:

```text
timeout = 10 ms
```

and the callable runs for:

```text
5 seconds
```

The runtime does not stop it after 10 ms.

The execution is:

```text
callable starts
      ↓
10 ms passes
      ↓
callable continues
      ↓
5 seconds passes
      ↓
callable returns
      ↓
runtime observes timeout
```

Timeout is therefore observational.

It is not preemptive execution control.

## `post()` timeout behavior

`ThreadPool::post()` keeps the timeout attached to the low-level task.

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(10)
);

const bool accepted = pool.post([](){
  perform_work();
}, options);
```

If the callable exceeds the timeout:

```text
callable executes completely
        ↓
Task::run() measures duration
        ↓
timeout exceeded
        ↓
TaskStatus::timed_out
TaskResult::timeout
```

The boolean returned by `post()` only describes task acceptance.

It does not describe the final execution outcome.

## Accepted does not mean completed within timeout

This:

```cpp
const bool accepted = pool.post([](){
  perform_work();
}, options);
```

can return:

```text
true
```

even if the task later exceeds its timeout.

The two questions are different:

```text
post() return value
      ↓
Was the task accepted?


timeout result
      ↓
Did execution exceed its configured duration?
```

Because `post()` has no `Future`, timeout outcomes are primarily visible through runtime metrics and statistics.

## InlineExecutor timeout behavior

`InlineExecutor` also observes execution duration.

```cpp
vix::threadpool::InlineExecutor executor;

vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(10)
);

const bool accepted = executor.post([](){
  perform_work();
}, options);
```

The callable executes synchronously.

After it returns, `InlineExecutor` compares the elapsed duration with the timeout.

If the timeout was exceeded:

```text
timed_out_tasks increases
```

and `post()` still returns:

```text
true
```

because the callable was executed and the timing outcome was handled.

## `submit()` adds a Future layer

`ThreadPool::submit()` is different because the user callable is wrapped in asynchronous result handling.

```cpp
auto future = pool.submit([](){
  return 42;
}, options);
```

Conceptually:

```text
low-level Task
      ↓
result wrapper
      ↓
user callable
      ↓
Promise
      ↓
Future
```

The low-level `Task` still measures timeout around the wrapper.

However, the wrapper publishes the `Future` result before control returns to the low-level `Task` timeout check.

This creates an important distinction in the current implementation.

## Current `submit()` timeout behavior

Consider:

```cpp
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(1)
);

auto future = pool.submit([](){
  std::this_thread::sleep_for(
        std::chrono::milliseconds{10}
  );

  return 42;
}, options);
```

The execution path is currently:

```text
Task::run()
    ↓
start execution timer
    ↓
submit wrapper runs
    ↓
user callable runs for 10 ms
    ↓
Promise::set_value(42)
    ↓
Future becomes completed
    ↓
wrapper returns
    ↓
Task::run() measures duration
    ↓
timeout exceeded
    ↓
low-level Task becomes timed_out
```

The Future result and low-level Task result can therefore differ.

## Verified current result

With:

```text
timeout = 1 ms
callable duration ≈ 10 ms
return value = 42
```

the current implementation produces:

```text
value: 42
future status: completed
future result: success
completed: 0
timed out: 1
```

The `Future` reports successful completion because its Promise received the value before the low-level timeout check.

The worker metrics report the task as timed out because `Task::run()` observed that execution exceeded the timeout afterward.

## Future and Task timeout state are separate

For the current `submit()` implementation:

```text
Future
  ↓
result published by submit wrapper


low-level Task
  ↓
execution duration observed after wrapper returns
```

These states can diverge.

For an over-time `submit()` operation:

```text
Future:
  status = completed
  result = success
  value  = available

low-level Task:
  status = timed_out
  result = timeout

worker metrics:
  timed_out += 1
```

Application code should therefore not currently use the `Future` alone to determine whether a completed `submit()` exceeded its configured execution timeout.

Likewise, pool timeout metrics should not be interpreted as meaning that every corresponding `Future` contains a timeout error.

## `handle()` has the same timeout layering

`ThreadPool::handle()` uses the same result-producing wrapper model as `submit()`.

```cpp
auto handle = pool.handle([](){
  return 42;
}, options);
```

The handle's `Future` can receive the callable result before the low-level `Task` evaluates execution timeout.

Conceptually:

```text
TaskHandle
    ↓
Future
    ↓
result wrapper
    ↓
value published
    ↓
low-level timeout evaluated afterward
```

The same distinction between asynchronous result state and worker-level timeout state applies.

## Timeout does not currently become a Future error after execution

A timeout error in a Future is represented as:

```text
status = timed_out
result = timeout
error  = timeout
```

and:

```cpp
future.get();
```

throws `std::system_error`.

However, the current `submit()` execution-time timeout path does not publish:

```cpp
ThreadPoolErrc::timeout
```

after a callable has already produced its value.

The Future can therefore remain successful even though the low-level task is classified as timed out.

This is the current runtime behavior and should be considered when using task timeouts for result-producing work.

## Deadline timeout and execution timeout are different

A Future can receive `ThreadPoolErrc::timeout` when a deadline prevents execution from starting.

For example:

```text
deadline expires while queued
        ↓
submit wrapper checks deadline
        ↓
Promise::set_error(timeout)
        ↓
Future:
  status = timed_out
  result = timeout
  error  = timeout
```

This is different from an execution-duration timeout:

```text
callable runs too long
        ↓
Promise may already contain value
        ↓
low-level Task records timeout
```

Both use timing concepts, but the current observable Future behavior is different.

## Default timeout

`ThreadPoolConfig` provides:

```cpp
config.default_timeout;
```

The default value is:

```cpp
std::chrono::milliseconds{0}
```

which means no default timeout.

Configure one with:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.default_timeout = std::chrono::milliseconds{500};

vix::threadpool::ThreadPool pool(config);
```

Tasks without their own timeout receive this value.

## Default timeout merging

When a task is submitted, the pool performs:

```text
task timeout enabled?
    │
    ├── yes → keep task timeout
    │
    └── no
         ↓
pool default_timeout > 0?
    │
    ├── yes → apply pool default
    │
    └── no  → timeout remains disabled
```

For example:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.default_timeout = std::chrono::milliseconds{500};

vix::threadpool::ThreadPool pool(config);

auto future = pool.submit([](){
  return 42;
});
```

The task receives:

```text
500 ms
```

as its effective execution timeout.

## Task timeout overrides pool default

An explicit task timeout takes precedence:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.default_timeout = std::chrono::milliseconds{500};

vix::threadpool::ThreadPool pool(config);

vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_timeout(
        vix::threadpool::Timeout::milliseconds(100)
);

auto future = pool.submit([](){
  return 42;
}, options);
```

The effective timeout is:

```text
100 ms
```

not:

```text
500 ms
```

The pool only supplies its default when the task timeout is disabled.

## Disable a configured pool default for one task

The current merge behavior applies the pool default whenever:

```cpp
options.has_timeout()
```

is `false`.

Since zero means disabled:

```cpp
options.set_timeout(
        vix::threadpool::Timeout::disabled()
);
```

still allows the pool's `default_timeout` to be merged.

Therefore, when a positive pool default timeout is configured, the current `TaskOptions` API does not provide a separate state meaning:

```text
explicitly disable the pool default for this task
```

The states are currently:

```text
task timeout enabled
      ↓
override default

task timeout disabled
      ↓
pool default may be applied
```

## Exceptions and timeout

If a low-level task callable throws before timeout evaluation completes:

```text
callable throws
      ↓
Task catches exception
      ↓
status = failed
result = failure
```

The low-level `Task::run()` catch path does not then replace that result with timeout.

For `submit()`, the wrapper itself catches the user exception and publishes it to the Future.

Because that wrapper returns normally to the low-level task, a sufficiently long failing `submit()` operation can still be classified as timed out by the worker layer while its Future stores the original exception.

This follows from the same separation between Future state and low-level Task state.

## Timeout and cancellation

A task can have both timeout and cancellation:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options;

options
  .set_timeout(
        vix::threadpool::Timeout::milliseconds(500)
  )
  .set_cancellation(
        source.token()
  );
```

They describe different conditions.

```text
cancellation
    ↓
explicit stop request


timeout
    ↓
observed execution duration exceeded
```

For low-level `Task::run()`, post-execution checks currently evaluate timeout and deadline before cancellation.

Conceptually:

```text
callable finishes
      ↓
timeout or deadline exceeded?
    ┌───────┴───────┐
   yes              no
    │                │
 timeout         cancelled?
                   │
                   ├── yes → cancelled
                   └── no  → success
```

See [Cancellation](/modules/threadpool/cancellation).

## Timeout and deadline together

A task can also use both timing mechanisms:

```cpp
vix::threadpool::TaskOptions options;

options
  .set_timeout(
        vix::threadpool::Timeout::milliseconds(100)
  )
  .set_deadline(
        vix::threadpool::Deadline::after(std::chrono::seconds{1})
  );
```

Suppose the task experiences:

```text
queue waiting = 800 ms
execution     = 50 ms
```

Then:

```text
deadline window = 1 second
timeout         = 100 ms
```

both conditions remain within their limits.

If queue waiting exceeds one second:

```text
deadline can prevent execution
```

If execution takes 150 ms:

```text
timeout can be recorded after execution
```

These controls therefore complement each other.

## `Future::wait_for()` is not a task timeout

This:

```cpp
const auto status = future.wait_for(
        std::chrono::milliseconds{100}
);
```

does not configure or modify the task timeout.

It only limits how long the calling thread waits.

The difference is:

```text
Future::wait_for(100 ms)
      ↓
caller waits at most 100 ms


TaskOptions timeout = 100 ms
      ↓
runtime observes task execution duration
```

If `wait_for()` returns:

```text
std::future_status::timeout
```

the task can still be queued or running.

Nothing is cancelled automatically.

## Use `wait_for()` for caller-side waiting

For example:

```cpp
auto future = pool.submit([](){
  return perform_work();
});

const auto status = future.wait_for(
        std::chrono::milliseconds{100}
);

if (status == std::future_status::timeout)
{
  // The result was not ready within 100 ms.
}
```

This says nothing about whether the task violated a `TaskOptions` timeout.

It only describes result readiness from the caller's perspective.

## Use cancellation for cooperative early stop

If a long-running callable must stop while it is still executing, timeout observation alone is insufficient.

Use cooperative cancellation:

```cpp
auto token = source.token();

auto future = pool.submit([token](){
  while (has_more_work())
  {
    if (token.stop_requested())
    {
      return false;
    }

    process_next_item();
  }

  return true;
}, options);
```

The callable determines where it is safe to stop.

Timeout itself never performs this interruption.

## Check elapsed time inside the callable

Application code can also implement its own execution boundary when it needs to react during execution.

```cpp
const auto start = std::chrono::steady_clock::now();

auto future = pool.submit([start](){
  while (has_more_work())
  {
    const auto elapsed =
        std::chrono::steady_clock::now() - start;

    if (elapsed > std::chrono::milliseconds{500})
    {
      return false;
    }

    process_next_item();
  }

  return true;
});
```

This is application-controlled cooperative timing.

It is different from the ThreadPool's observational timeout classification.

## Equality

Timeout values can be compared directly:

```cpp
auto first = vix::threadpool::Timeout::milliseconds(500);
auto second = vix::threadpool::Timeout::milliseconds(500);

if (first == second)
{
  // Same stored duration.
}
```

Inequality is also supported:

```cpp
if (first != second)
{
  // Different stored durations.
}
```

Equality compares the normalized millisecond values.

For example:

```cpp
vix::threadpool::Timeout::milliseconds(-1) ==
vix::threadpool::Timeout::milliseconds(0)
```

is `true` because both normalize to a disabled zero-duration timeout.

## Choosing between timing mechanisms

Use a timeout when you need to observe:

```text
How long did execution itself take?
```

Use a deadline when you need to express:

```text
Do not begin this work after this absolute time.
```

Use `Future::wait_for()` when you need:

```text
How long should this caller wait for the result?
```

Use cancellation when running code must cooperatively react to:

```text
This work is no longer needed.
```

The four concepts are intentionally separate:

```text
Timeout
  execution duration

Deadline
  absolute expiration

Future::wait_for()
  caller waiting duration

Cancellation
  cooperative stop request
```

## Timeout model summary

The core `Timeout` type behaves as:

```text
duration <= 0
      ↓
disabled

duration > 0
      ↓
enabled
      ↓
task execution starts
      ↓
measure elapsed time
      ↓
elapsed > timeout?
  ┌───────┴───────┐
 yes              no
  │                │
timed out        success
```

For low-level `Task`, `post()`, and `InlineExecutor`, timeout classification happens after the callable returns.

For `submit()` and `handle()`, the current architecture adds another result layer:

```text
Task starts
    ↓
wrapper starts
    ↓
user callable runs
    ↓
Promise publishes result
    ↓
Future becomes ready
    ↓
wrapper returns
    ↓
Task checks timeout
```

The important properties are:

- `Timeout` stores milliseconds.
- A zero timeout is disabled.
- Negative values normalize to zero.
- `milliseconds()` and `seconds()` are provided as factories.
- `expired()` uses a strictly greater-than comparison.
- Queue waiting does not count toward timeout duration.
- Timeout measurement begins when low-level task execution starts.
- Timeout does not prevent a callable from starting.
- Timeout does not forcibly interrupt running C++ code.
- `post()` can be accepted and later recorded as timed out.
- `InlineExecutor` executes the callable completely before recording timeout.
- `ThreadPoolConfig::default_timeout` is applied when a task has no enabled timeout.
- An explicit enabled task timeout overrides the pool default.
- A disabled task timeout does not currently suppress a positive pool default.
- In the current `submit()` and `handle()` implementation, the Future result can be published before the low-level timeout is evaluated.
- Because of that layering, a Future can report success while worker metrics report the task as timed out.
- `Future::wait_for()` is caller-side waiting and is not a task timeout.
- Use cooperative cancellation or explicit checks inside long-running code when execution must stop before the callable naturally returns.

Continue with [Scopes](/modules/threadpool/scopes) for structured concurrent work or [Task Groups](/modules/threadpool/task-groups) for manual task-group coordination.
