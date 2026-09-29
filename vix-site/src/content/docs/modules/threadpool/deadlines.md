# Deadlines

A `Deadline` represents an absolute point in time after which work is considered expired.

Create a deadline relative to the current time with `Deadline::after()`:

```cpp id="g2b7qv"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{500})
);

auto future = pool.submit([](){
  return 42;
}, options);
```

For result-producing ThreadPool submissions, a deadline primarily prevents stale work from starting after its allowed time point.

## Deadline vs timeout

A deadline and a timeout describe different timing constraints.

A deadline is an absolute time point:

```text id="pf68k1"
run before this point in time
```

A timeout is an execution duration:

```text id="prcn0s"
execution should not take longer than this duration
```

For example:

```text id="c3xlg4"
deadline
submitted at 10:00:00
deadline     10:00:01
                 ↑
        absolute point


timeout
task starts
    ↓
allowed execution duration = 1 second
```

Queue waiting consumes the available deadline window.

Queue waiting does not consume a task execution timeout.

See [Timeouts](/modules/threadpool/timeouts) for timeout behavior.

## Deadline clock

`Deadline` uses:

```cpp id="71qslw"
std::chrono::steady_clock
```

through:

```cpp id="ud12h2"
vix::threadpool::Deadline::clock
```

The corresponding time-point type is:

```cpp id="1nxbei"
vix::threadpool::Deadline::time_point
```

`std::chrono::steady_clock` is monotonic and is appropriate for execution timing because it is not affected by wall-clock changes.

## Disabled deadline

A default-constructed deadline is disabled:

```cpp id="0np6mk"
vix::threadpool::Deadline deadline;
```

It reports:

```text id="shqtqo"
enabled()         false
disabled_value()  true
expired()         false
remaining()       0
```

A disabled deadline never expires.

You can also create one explicitly:

```cpp id="ehmo63"
auto deadline = vix::threadpool::Deadline::disabled();
```

This is the default deadline stored in `TaskOptions`.

## Create a deadline after a duration

The most common construction method is:

```cpp id="hi417s"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::milliseconds{500}
);
```

The stored time point is calculated when `after()` is called:

```text id="t14lfi"
steady_clock::now()
        +
500 ms
        ↓
absolute deadline
```

The duration can use any `std::chrono::duration` type.

For example:

```cpp id="vh03lp"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::seconds{2}
);
```

or:

```cpp id="9ny69u"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::microseconds{500}
);
```

The duration is converted to the duration type used by `steady_clock`.

## Non-positive durations

`Deadline::after()` does not disable non-positive durations.

For example:

```cpp id="454l5m"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::milliseconds{-1}
);
```

creates an enabled deadline whose time point is already in the past.

It therefore reports:

```text id="0cn49v"
enabled()  true
expired()  true
```

A zero-duration deadline also represents the current time and becomes expired immediately.

This differs from `Timeout`, where a non-positive duration disables timeout observation.

## Construct from an absolute time point

A deadline can be created directly from a `steady_clock` time point:

```cpp id="6cnmbi"
const auto time =
        vix::threadpool::Deadline::clock::now() +
        std::chrono::seconds{1};

vix::threadpool::Deadline deadline(time);
```

This is useful when several tasks should share the same absolute expiration point.

For example:

```cpp id="bd9w59"
const auto time =
        vix::threadpool::Deadline::clock::now() +
        std::chrono::seconds{1};

vix::threadpool::Deadline deadline(time);

vix::threadpool::TaskOptions options =
        vix::threadpool::TaskOptions::with_deadline(deadline);
```

Every task receiving the same `Deadline` observes the same absolute time point.

## Create a deadline from a Timeout

`Deadline::from_timeout()` converts a relative timeout value into an absolute deadline starting at the moment of conversion.

```cpp id="p94qzt"
auto timeout = vix::threadpool::Timeout::milliseconds(500);

auto deadline =
        vix::threadpool::Deadline::from_timeout(timeout);
```

Conceptually:

```text id="j8602k"
Timeout = 500 ms
      ↓
from_timeout()
      ↓
steady_clock::now() + 500 ms
      ↓
Deadline
```

The important distinction is that the result is now absolute.

If the task waits in a queue for 400 ms, only approximately 100 ms remain before that deadline expires.

## Disabled Timeout produces disabled Deadline

A disabled timeout produces a disabled deadline:

```cpp id="ne6wga"
auto deadline = vix::threadpool::Deadline::from_timeout(
        vix::threadpool::Timeout::disabled()
);
```

The result reports:

```text id="f752z3"
enabled()  false
expired()  false
```

This preserves the meaning of a disabled timing constraint.

## Attach a deadline to a task

Use `TaskOptions::with_deadline()`:

```cpp id="an539z"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{500})
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Or use the setter:

```cpp id="qfx1io"
vix::threadpool::TaskOptions options;

options.set_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{500})
);

auto future = pool.submit([](){
  return 42;
}, options);
```

Check whether options contain an enabled deadline with:

```cpp id="fwb2oc"
if (options.has_deadline())
{
  // An absolute deadline is configured.
}
```

## Check whether a deadline is enabled

Use:

```cpp id="w68pm2"
if (deadline.enabled())
{
  // Deadline contains an absolute time point.
}
```

The opposite check is:

```cpp id="36bk4r"
if (deadline.disabled_value())
{
  // Deadline is disabled.
}
```

These methods describe whether the deadline is active.

They do not say whether an enabled deadline has already expired.

## Check expiration

Use:

```cpp id="8q012j"
if (deadline.expired())
{
  // Deadline has been reached.
}
```

An enabled deadline expires when:

```text id="hqmry4"
current time >= deadline time
```

The comparison includes equality.

Conceptually:

```text id="4kpd3r"
now < deadline
      ↓
not expired


now >= deadline
      ↓
expired
```

A disabled deadline always returns `false`.

## Check expiration at a specific time

Use `expired_at()` when the comparison time is already available:

```cpp id="5fceeo"
const auto now = vix::threadpool::Deadline::clock::now();

if (deadline.expired_at(now))
{
  // Expired at this time point.
}
```

This avoids obtaining another clock value and is useful when several timing decisions should use the same observation time.

The rule remains:

```text id="scb4lf"
enabled && now >= deadline.time()
```

## Read the deadline time

Use:

```cpp id="um7ceg"
const auto time = deadline.time();
```

The returned value is meaningful when:

```cpp id="at4l2a"
deadline.enabled()
```

is `true`.

For a disabled deadline, `time()` returns the default `steady_clock::time_point{}` stored internally.

Check `enabled()` before interpreting the value as an active deadline.

## Remaining time

Use:

```cpp id="qdbn4u"
const auto remaining = deadline.remaining();
```

For an active future deadline:

```text id="yt07uf"
remaining = deadline time - current time
```

For an expired deadline:

```text id="ul7lh4"
remaining = 0
```

For a disabled deadline:

```text id="q0izpu"
remaining = 0
```

A zero remaining duration can therefore mean either:

```text id="20s29p"
deadline disabled
        or
deadline expired
```

Use `enabled()` and `expired()` when the distinction matters.

## Remaining milliseconds

For convenience:

```cpp id="w7e5mb"
const auto remaining = deadline.remaining_ms();
```

returns a:

```cpp id="j360a7"
std::chrono::milliseconds
```

value.

For example:

```cpp id="rc6oeb"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::seconds{1}
);

const auto remaining = deadline.remaining_ms();
```

The exact value depends on how much time elapsed between construction and observation.

Do not rely on it being exactly `1000`.

## Deadline before submission

If a `submit()` deadline is already expired when the pool processes the submission:

```cpp id="e4isnf"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{-1})
);

auto future = pool.submit([](){
  return 42;
}, options);
```

the callable is not scheduled for normal execution.

The Future becomes:

```text id="pui1r7"
ready()   true
status()  timed_out
result()  timeout
error()   timeout
```

Calling:

```cpp id="jbacte"
future.get();
```

throws `std::system_error`.

## Deadline while waiting in a queue

A deadline is checked again when a result-producing worker task reaches the user callable.

This means queue delay consumes the deadline window.

Conceptually:

```text id="hptckm"
submit at t0
    ↓
task enters queue
    ↓
deadline = t0 + 100 ms
    ↓
task waits 150 ms
    ↓
worker reaches task
    ↓
deadline expired
    ↓
user callable skipped
```

This is one of the main uses of deadlines.

They can prevent work from starting after that work has become stale.

## Queue waiting example

A single-worker pool can make the behavior visible:

```cpp id="57cuov"
#include <chrono>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(1);

  auto blocker = pool.submit([](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{100}
    );
  });

  vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{10})
  );

  auto future = pool.submit([](){
    return 42;
  }, options);

  blocker.get();

  return future.status() ==
             vix::threadpool::TaskStatus::timed_out
      ? 0
      : 1;
}
```

The second callable waits behind the first task.

Its deadline expires before the worker can begin it, so the result-producing wrapper reports a timeout instead of invoking the callable.

## `submit()` deadline checks

The current `ThreadPool::submit()` path checks the deadline at two points before the user callable starts.

First:

```text id="gzjb02"
submit()
   ↓
deadline already expired?
   │
   ├── yes → Future timeout
   │
   └── no  → continue
```

Then immediately before invoking the user callable:

```text id="76zf5g"
worker reaches task
       ↓
deadline expired?
   ┌───────┴───────┐
  yes              no
   │                │
Future timeout     invoke callable
```

This second check covers time spent waiting in the worker queue.

## `submit()` deadline after execution begins

The current result-producing `submit()` path does not check its deadline again after the user callable starts.

Once execution begins:

```text id="52v1qz"
deadline valid
      ↓
callable starts
      ↓
deadline expires
      ↓
callable continues
      ↓
callable returns value
      ↓
Future can complete successfully
```

The deadline does not forcibly interrupt the callable, and the current `submit()` wrapper does not convert a value returned after the deadline into a timeout result.

For result-producing ThreadPool work, the deadline should therefore be understood primarily as:

```text id="1k59w8"
latest acceptable start time
```

rather than a forced completion boundary.

## TaskHandle deadlines

`handle()` uses the same deadline observation path as `submit()`.

For example:

```cpp id="zjnuap"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{500})
);

auto handle = pool.handle([](){
  return 42;
}, options);
```

The deadline is checked:

```text id="27vnls"
before scheduling
        +
immediately before the callable
```

If it expires before the callable begins:

```text id="n3h7fo"
status = timed_out
result = timeout
error  = timeout
```

If it expires only after the callable starts, the current handle result path can still complete successfully.

## Low-level Task deadlines

The low-level `Task::run()` path observes deadlines differently.

A `Task` checks its deadline before the callable:

```text id="6w0lhq"
deadline expired?
      ↓
yes
      ↓
do not invoke callable
      ↓
timed_out
```

If the deadline has not expired, the callable runs.

After the callable returns, `Task::run()` checks the deadline again:

```text id="l74uc3"
callable returns
      ↓
finish time >= deadline?
      ↓
yes
      ↓
timed_out
```

Therefore, a directly configured low-level `Task` can report a timeout when its callable finishes after the deadline.

## `post()` deadline behavior

`ThreadPool::post()` keeps the deadline attached to the low-level `Task`.

```cpp id="p7ylqp"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{10})
);

const bool accepted = pool.post([](){
  perform_work();
}, options);
```

The low-level task checks the deadline:

```text id="rrx40y"
before callable
      +
after callable
```

If the deadline is already expired when execution reaches the task, the callable is skipped.

If it expires while the callable is running, the callable still runs to completion, then the low-level task is recorded as timed out.

Because `post()` has no Future, this result is observed through runtime metrics, statistics, or application-managed state.

## `post()` acceptance and deadline outcome are different

The boolean returned by:

```cpp id="7jbqf8"
const bool accepted = pool.post([](){
  perform_work();
}, options);
```

answers:

```text id="5ew5ew"
Was the work accepted by the execution runtime?
```

It does not answer:

```text id="t7g9tb"
Did the work complete before its deadline?
```

A posted task can therefore be accepted and later be recorded as timed out.

## InlineExecutor deadlines

`InlineExecutor` checks deadlines before running the callable:

```text id="81h0e4"
post()
  ↓
deadline expired?
  │
  ├── yes → record timed_out, callable skipped
  │
  └── no  → execute callable
```

After the callable returns, it checks the deadline again.

If the deadline expired during execution:

```text id="w3v545"
callable runs to completion
        ↓
deadline expired
        ↓
timed_out metric recorded
```

The callable is never forcibly interrupted.

## Deadlines do not stop running code

A deadline is not a thread-interruption mechanism.

This:

```text id="tk87c4"
deadline reached
      ↓
terminate callable immediately
```

does not happen.

The actual behavior is based on observation points:

```text id="v6cgbf"
check deadline
      ↓
decide whether to start

or

run callable
      ↓
check deadline afterward
      ↓
record timing outcome
```

depending on the execution API being used.

Arbitrary C++ code already executing continues until it returns or throws.

## Long-running work

If running work must react while it is executing, use a mechanism that the callable itself can observe.

For example, cancellation can be checked inside a loop:

```cpp id="sxvyk3"
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

A deadline can also be captured explicitly when application logic needs to stop itself at the absolute time point:

```cpp id="kewbwp"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::seconds{1}
);

auto future = pool.submit([deadline](){
  while (has_more_work())
  {
    if (deadline.expired())
    {
      return false;
    }

    process_next_item();
  }

  return true;
});
```

In this pattern, the callable itself defines the safe interruption points.

## Shared deadline across tasks

Because a deadline stores an absolute time point, the same value can be shared by several submissions.

```cpp id="aab3kx"
auto deadline = vix::threadpool::Deadline::after(
        std::chrono::seconds{1}
);

vix::threadpool::TaskOptions options =
        vix::threadpool::TaskOptions::with_deadline(deadline);

auto first = pool.submit([](){
  return 20;
}, options);

auto second = pool.submit([](){
  return 22;
}, options);
```

Both tasks have the same expiration point.

They do not each receive a new one-second interval when they begin execution.

Conceptually:

```text id="r70ve2"
                 shared deadline
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
     Task A                       Task B
submitted at t0                submitted at t0
        │                           │
        └──── must start before ────┘
                    t0 + 1s
```

This makes deadlines useful for groups of work that become stale together.

## `from_timeout()` and shared deadlines

Creating a new deadline separately for every task:

```cpp id="vbajuy"
auto firstDeadline = vix::threadpool::Deadline::from_timeout(timeout);
auto secondDeadline = vix::threadpool::Deadline::from_timeout(timeout);
```

can produce slightly different absolute time points because each call uses a new:

```cpp id="sr66fx"
Deadline::clock::now()
```

observation.

If several tasks must share exactly the same expiration point, create one deadline and reuse it:

```cpp id="a8zx79"
auto deadline =
        vix::threadpool::Deadline::from_timeout(timeout);

vix::threadpool::TaskOptions options =
        vix::threadpool::TaskOptions::with_deadline(deadline);
```

## Deadline and cancellation

Deadlines and cancellation can be combined:

```cpp id="43zu1n"
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options;

options
  .set_deadline(
        vix::threadpool::Deadline::after(std::chrono::seconds{1})
  )
  .set_cancellation(source.token());
```

Both can prevent the callable from starting.

The difference is:

```text id="a19p4d"
cancellation
    ↓
explicit program request


deadline
    ↓
absolute time condition
```

When `TaskOptions::should_skip_before_run()` is evaluated, cancellation is tested together with deadline expiration.

See [Cancellation](/modules/threadpool/cancellation).

## Cancellation takes precedence in pre-run result mapping

For `submit()` and `handle()`, if both conditions are already true:

```text id="n0zx1m"
cancellation requested
        +
deadline expired
```

the current pre-submission result mapping checks cancellation first.

The Future therefore receives:

```text id="yx5ppx"
ThreadPoolErrc::cancelled
```

rather than:

```text id="pp68q2"
ThreadPoolErrc::timeout
```

This ordering belongs to the current result-producing submission path.

## Deadline and timeout together

A task can have both:

```cpp id="vdu0fq"
vix::threadpool::TaskOptions options;

options
  .set_deadline(
        vix::threadpool::Deadline::after(std::chrono::seconds{1})
  )
  .set_timeout(
        vix::threadpool::Timeout::milliseconds(100)
  );
```

They describe different constraints:

```text id="0ub30f"
deadline
    ↓
absolute expiration point


timeout
    ↓
execution-duration observation
```

For example, a task can wait 800 ms in a queue and then execute for 50 ms:

```text id="wb4s8k"
queue wait       800 ms
execution         50 ms
total             850 ms
```

With:

```text id="8fepx5"
deadline = submission + 1 second
timeout  = 100 ms
```

both conditions remain within their limits.

If queue waiting reaches 1 second before the callable starts, the deadline can prevent execution even though the execution timeout has never started.

## No pool-level default deadline

`ThreadPoolConfig` provides:

```cpp id="fng7ox"
config.default_timeout;
```

but it does not provide a default deadline field.

Deadlines are configured per task:

```cpp id="je5jst"
vix::threadpool::TaskOptions options = vix::threadpool::TaskOptions::with_deadline(
        vix::threadpool::Deadline::after(std::chrono::milliseconds{500})
);
```

This is appropriate because a deadline represents a concrete absolute expiration point usually tied to one operation or group of related operations.

## Equality

Two deadlines can be compared:

```cpp id="39ke7a"
if (first == second)
{
  // Same enabled state and same stored time point.
}
```

Equality requires both:

```text id="sfqsy6"
same enabled state
        +
same time point
```

Inequality is available through:

```cpp id="tc8s2m"
first != second
```

Two separately created calls to `Deadline::after()` should not generally be expected to compare equal because they can capture different current time points.

## Use deadlines for stale work

Deadlines are especially useful when work loses value after a specific time.

Conceptually:

```text id="c5udhg"
request arrives
      ↓
deadline established
      ↓
task enters queue
      ↓
worker becomes available
      ↓
still before deadline?
   ┌───────┴───────┐
  yes              no
   │                │
execute            skip
```

This avoids beginning work that is already too late to be useful.

For result-producing `submit()` and `handle()`, this is the clearest interpretation of the current deadline behavior.

## Deadline model summary

The core type behaves as:

```text id="pk3189"
Deadline
   │
   ├── disabled
   │      ↓
   │   never expires
   │
   └── enabled
          ↓
     absolute steady_clock
          time point
          ↓
     now >= time?
       ┌────┴────┐
      yes        no
       │          │
    expired     valid
```

For `submit()` and `handle()`:

```text id="9kzbfr"
submission
    ↓
deadline expired?
    │
    ├── yes → timeout result
    │
    └── no
         ↓
       queue
         ↓
worker reaches task
         ↓
deadline expired?
    ┌────┴────┐
   yes        no
    │          │
timeout      callable starts
               ↓
          callable runs normally
```

For low-level `Task`, `post()`, and `InlineExecutor`, the deadline can also be observed after callable execution and recorded as a timeout.

The important properties are:

- `Deadline` represents an absolute `std::chrono::steady_clock` time point.
- A default deadline is disabled and never expires.
- `Deadline::after()` creates an absolute time point relative to now.
- Non-positive durations create enabled deadlines that are already expired.
- `Deadline::from_timeout()` converts a timeout into an absolute deadline.
- Queue waiting consumes the available deadline window.
- `remaining()` and `remaining_ms()` return zero for both disabled and expired deadlines.
- `submit()` and `handle()` check deadlines before scheduling and again before the user callable begins.
- The current `submit()` and `handle()` paths do not convert expiration during the callable into a timeout result.
- Low-level `Task`, `post()`, and `InlineExecutor` also check the deadline after callable execution.
- Deadlines never forcibly interrupt arbitrary running C++ code.
- Capture and inspect the deadline inside long-running code when the callable itself must stop at that time point.
- `ThreadPoolConfig` has no pool-level default deadline.

Continue with [Timeouts](/modules/threadpool/timeouts) for execution-duration observation or [Scopes](/modules/threadpool/scopes) for structured groups of work.
