# Cancellation

The ThreadPool module provides cooperative cancellation through `CancellationSource` and `CancellationToken`.

The model is:

```text
CancellationSource
        │
        │ creates
        ▼
CancellationToken
        │
        │ observes
        ▼
      task
```

The source requests cancellation. Tokens observe that request.

Cancellation does not forcibly terminate a C++ function that is already executing.

## Basic cancellation

Create a `CancellationSource`, obtain its token, and attach the token to `TaskOptions`:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        source.token()
    );

auto future = pool.submit([](){
  return 42;
}, options);
```

Request cancellation with:

```cpp
source.request_cancel();
```

Every token sharing that cancellation state can then observe the request.

## CancellationSource

`CancellationSource` owns the shared cancellation state.

```cpp
vix::threadpool::CancellationSource source;
```

A new source starts in the non-cancelled state:

```cpp
source.cancelled() == false
```

Request cancellation with:

```cpp
source.request_cancel();
```

After the request:

```cpp
source.cancelled() == true
```

The alias:

```cpp
source.is_cancelled();
```

reports the same state.

## Cancellation is idempotent

Calling `request_cancel()` several times is safe:

```cpp
source.request_cancel();
source.request_cancel();
source.request_cancel();
```

The state remains cancelled.

Conceptually:

```text
not cancelled
      ↓
request_cancel()
      ↓
cancelled
      ↓
request_cancel()
      ↓
cancelled
```

There is no transition back to the original non-cancelled state.

## CancellationToken

A `CancellationToken` observes the state owned by a source.

```cpp
vix::threadpool::CancellationSource source;
vix::threadpool::CancellationToken token = source.token();
```

Check whether the token is connected to a cancellation state:

```cpp
const bool connected = token.can_cancel();
```

For a token created by a source:

```text
can_cancel() = true
```

A default-constructed token is disconnected:

```cpp
vix::threadpool::CancellationToken token;
```

and reports:

```text
can_cancel()    false
cancelled()     false
stop_requested() false
can_continue()  true
```

A disconnected token never becomes cancelled.

## Observe cancellation

The primary check is:

```cpp
if (token.cancelled())
{
  // Cancellation was requested.
}
```

The alias:

```cpp
token.is_cancelled();
```

provides the same result.

`stop_requested()` also reports whether cancellation was requested:

```cpp
if (token.stop_requested())
{
  // Stop has been requested.
}
```

`can_continue()` provides the opposite view:

```cpp
if (token.can_continue())
{
  // Cancellation has not been requested.
}
```

The relationships are:

```text
cancelled()       == true
stop_requested()  == true
can_continue()    == false
```

or:

```text
cancelled()       == false
stop_requested()  == false
can_continue()    == true
```

## Source and token share state

The source and its tokens refer to the same `CancellationState`.

```cpp
vix::threadpool::CancellationSource source;
auto token = source.token();

source.request_cancel();

if (!token.cancelled())
{
  return 1;
}
```

Conceptually:

```text
                shared state
               cancelled=true
               ▲          ▲
               │          │
CancellationSource   CancellationToken
```

Cancellation state uses an atomic flag and can be observed safely across threads.

## Multiple tokens

One source can create multiple tokens:

```cpp
vix::threadpool::CancellationSource source;

auto first = source.token();
auto second = source.token();
auto third = source.token();

source.request_cancel();
```

All of them observe the same request:

```text
first.cancelled()   true
second.cancelled()  true
third.cancelled()   true
```

This allows several related operations to share one cancellation signal.

## CancellationSource copies share state

`CancellationSource` can be copied.

Copies continue to refer to the same cancellation state:

```cpp
vix::threadpool::CancellationSource first;
vix::threadpool::CancellationSource second = first;

auto token = first.token();

second.request_cancel();

if (!token.cancelled())
{
  return 1;
}
```

Conceptually:

```text
Source A ──┐
           ├──► CancellationState
Source B ──┘             ▲
                         │
                       Token
```

A cancellation request through either source copy becomes visible through all tokens connected to that state.

## Attach cancellation to a task

Use `TaskOptions::with_cancellation()`:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        source.token()
    );

auto future = pool.submit([](){
  return 42;
}, options);
```

The setter form is:

```cpp
vix::threadpool::TaskOptions options;

options.set_cancellation(
        source.token()
);
```

Check whether options contain a connected token with:

```cpp
if (options.has_cancellation())
{
  // This task has a cancellation channel.
}
```

## Cancellation before submit()

If cancellation has already been requested before `submit()` is called:

```cpp
vix::threadpool::CancellationSource source;
source.request_cancel();

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        source.token()
    );

auto future = pool.submit([](){
  return 42;
}, options);
```

the callable is not submitted for normal execution.

The Future is completed as cancelled:

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

The cancellation request is therefore observable without running the user callable.

## Cancellation while queued

Cancellation can also be requested after submission but before the worker reaches the callable.

Conceptually:

```text
submit task
    ↓
task waits in queue
    ↓
request cancellation
    ↓
worker reaches task
    ↓
cancellation observed
    ↓
callable skipped
```

This is one of the main uses of task cancellation.

For a `submit()` operation, the Future completes with:

```text
status = cancelled
result = cancelled
error  = cancelled
```

## Make queued cancellation observable

A single-worker pool can be used to illustrate the timing:

```cpp
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

  vix::threadpool::CancellationSource source;

  vix::threadpool::TaskOptions options =
      vix::threadpool::TaskOptions::with_cancellation(
        source.token()
      );

  auto future = pool.submit([](){
    return 42;
  }, options);

  source.request_cancel();

  blocker.get();

  return future.status() ==
             vix::threadpool::TaskStatus::cancelled
      ? 0
      : 1;
}
```

The first task keeps the only worker occupied while cancellation is requested for the second task.

When the worker reaches the second submission, the callable is skipped.

## TaskHandle cancellation

`ThreadPool::handle()` creates a cancellation source automatically.

```cpp
auto handle = pool.handle([](){
  return 42;
});
```

Request cancellation with:

```cpp
handle.cancel();
```

Check whether the request has been made with:

```cpp
handle.cancelled();
```

Conceptually:

```text
TaskHandle
    │
    ├── Future
    │
    └── CancellationSource
              │
              ▼
          task wrapper
```

This avoids creating a separate `CancellationSource` when task-level control is required.

See [Task Handles](/modules/threadpool/task-handles).

## Handle cancellation while queued

A task handle is especially useful when work may still be waiting in a queue:

```cpp
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

  auto handle = pool.handle([](){
    return 42;
  });

  handle.cancel();

  blocker.get();

  return handle.cancelled() ? 0 : 1;
}
```

`handle.cancelled()` means that cancellation was requested.

To determine the asynchronous outcome, inspect:

```cpp
handle.status();
handle.result();
handle.error();
```

or consume it with:

```cpp
handle.get();
```

## Cancellation request and cancellation result are different

This distinction is important.

```cpp
handle.cancelled();
```

answers:

```text
Was cancellation requested?
```

while:

```cpp
handle.status() ==
    vix::threadpool::TaskStatus::cancelled
```

answers:

```text
Did the asynchronous operation finish
through the cancellation path?
```

These conditions can differ.

A cancellation request can happen after the callable has already started, in which case the current `handle()` result path may still complete successfully.

## Running C++ code is not forcibly interrupted

Cancellation does not kill a worker thread.

Suppose a task has already started:

```text
worker
  ↓
user callable starts
  ↓
request_cancel()
  ↓
user callable continues
```

The ThreadPool does not inject an exception, terminate the thread, or stop arbitrary machine instructions.

The callable continues until its own code returns or throws.

This avoids unsafe asynchronous termination of C++ code.

## Cooperative cancellation inside a callable

For long-running work, the callable can explicitly observe a token.

```cpp
#include <chrono>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  vix::threadpool::CancellationSource source;
  auto token = source.token();

  vix::threadpool::TaskOptions options =
      vix::threadpool::TaskOptions::with_cancellation(
        token
      );

  auto future = pool.submit([token](){
    for (int i = 0; i < 100; ++i)
    {
      if (token.stop_requested())
      {
        return false;
      }

      std::this_thread::sleep_for(
        std::chrono::milliseconds{1}
      );
    }

    return true;
  }, options);

  source.request_cancel();

  return 0;
}
```

The important part is:

```cpp
if (token.stop_requested())
{
  return false;
}
```

The task body decides where it is safe to stop.

This is cooperative cancellation.

## TaskOptions do not inject the token into the callable

Attaching:

```cpp
options.set_cancellation(source.token());
```

does not automatically add a `CancellationToken` argument to the callable.

This is not valid:

```cpp
pool.submit([](vix::threadpool::CancellationToken token){
  // The pool does not inject this argument.
}, options);
```

When the callable itself needs to observe cancellation, capture the token explicitly:

```cpp
auto token = source.token();

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        token
    );

auto future = pool.submit([token](){
  if (token.stop_requested())
  {
    return 0;
  }

  return perform_work();
}, options);
```

The token used by `TaskOptions` and the captured token observe the same shared state.

## `submit()` cancellation checks

The current `submit()` path observes cancellation at two points before the user callable runs.

First, before the task is sent to the scheduler:

```text
submit()
   ↓
cancellation already requested?
   │
   ├── yes → Future cancelled
   │
   └── no  → continue
```

Then, when the worker invokes the result-producing wrapper:

```text
worker reaches task
       ↓
cancellation requested?
   ┌───────┴───────┐
  yes              no
   │                │
Future cancelled   invoke callable
```

This covers cancellation that occurs while the task is waiting in a queue.

## `submit()` after the callable starts

Once the user callable begins, the current `submit()` wrapper does not perform another cancellation check after the callable returns.

Therefore:

```text
callable starts
      ↓
cancellation requested
      ↓
callable keeps running
      ↓
callable returns value
      ↓
Future can complete successfully
```

unless the callable itself observes the cancellation token and changes its own behavior.

This is an important part of the current contract.

Cancellation of running `submit()` work is cooperative at the callable level.

## TaskHandle after the callable starts

`TaskHandle::cancel()` follows the same principle.

The handle-owned cancellation token is checked immediately before the user callable is invoked.

If cancellation is requested after the callable has started:

```text
handle callable starts
        ↓
handle.cancel()
        ↓
request recorded
        ↓
callable continues
        ↓
callable returns
        ↓
Future can report success
```

For example:

```cpp
handle.cancelled();
```

can be `true` while:

```cpp
handle.result();
```

eventually becomes:

```text
success
```

Do not interpret `handle.cancelled()` as proof that a running callable was stopped.

## Low-level Task cancellation

The low-level `Task::run()` behavior is slightly different because its `TaskOptions` remain attached directly to the `Task`.

Before invoking its callable, `Task::run()` checks:

```text
cancellation requested?
        ↓
yes → cancelled without invocation
```

After the callable returns, it checks cancellation again.

Conceptually:

```text
check cancellation
       ↓
run callable
       ↓
check cancellation again
```

If cancellation was requested during execution, the low-level task can finish with:

```text
status = cancelled
result = cancelled
```

even though the callable itself ran to completion.

## `post()` uses low-level Task cancellation

`ThreadPool::post()` stores the cancellation token directly in the low-level task:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        source.token()
    );

const bool accepted = pool.post([](){
  perform_work();
}, options);
```

The low-level task checks cancellation before and after the callable.

This differs from the Future-producing `submit()` path, which moves cancellation observation into its result wrapper and checks it before invoking the callable.

This difference matters when cancellation is requested while a callable is already running.

## `post()` with an already cancelled token

Unlike `submit()`, `post()` does not complete a Future before queueing because it has no Future.

An already cancelled posted task can still be accepted by the scheduler:

```cpp
vix::threadpool::CancellationSource source;
source.request_cancel();

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        source.token()
    );

const bool accepted = pool.post([](){
  perform_work();
}, options);
```

If accepted into the runtime, `post()` can return:

```text
true
```

while the low-level task later observes cancellation and skips the callable.

The boolean from `post()` means:

```text
the submission was accepted
```

not:

```text
the callable executed successfully
```

## Cancellation result for post()

Posted work has no Future.

Its cancellation outcome is therefore not retrieved with:

```cpp
future.get();
```

The low-level worker records the task as cancelled, which contributes to runtime metrics and statistics.

For application-level completion or cancellation reporting, use `submit()` or `handle()` when a result object is required.

## Reset a CancellationToken

A token can disconnect itself from its current state:

```cpp
vix::threadpool::CancellationSource source;
vix::threadpool::CancellationToken token = source.token();

token.reset();
```

After reset:

```text
token.can_cancel() false
token.cancelled()  false
```

Later cancellation through the original source is no longer visible through that token.

Conceptually:

```text
before reset:

Token ─────► CancellationState


after reset:

Token       CancellationState
  X──────────────►
```

Resetting one token does not affect the source or other tokens.

## Reset a CancellationSource

A source can be reset:

```cpp
source.reset();
```

This creates a new non-cancelled `CancellationState`.

Existing tokens remain connected to the previous state.

For example:

```cpp
vix::threadpool::CancellationSource source;

auto oldToken = source.token();

source.reset();

auto newToken = source.token();

source.request_cancel();
```

The result is:

```text
oldToken.cancelled()  false
newToken.cancelled()  true
```

because the cancellation request affects the source's new state.

Conceptually:

```text
oldToken ─────► old state

source ───────► new state ◄──── newToken
                     │
                     ▼
                 cancelled
```

Reset does not migrate existing tokens to the new state.

## Do not reset a live task's cancellation source

If a token has already been attached to submitted work, resetting the source creates a different cancellation channel.

For example:

```cpp
auto token = source.token();

vix::threadpool::TaskOptions options =
    vix::threadpool::TaskOptions::with_cancellation(
        token
    );

auto future = pool.submit([](){
  return 42;
}, options);

source.reset();
source.request_cancel();
```

the submitted task continues observing the old state.

The cancellation request sent through the reset source affects only the new state.

Keep the original source state alive for the lifetime of the cancellation relationship.

## Scope cancellation

`Scope` owns a shared cancellation source for its spawned work.

```cpp
vix::threadpool::Scope scope(pool);
```

Request cancellation with:

```cpp
scope.cancel();
```

Inspect it with:

```cpp
scope.cancelled();
```

or obtain the shared token:

```cpp
auto token = scope.cancellation_token();
```

Every task spawned through the scope receives the scope cancellation token in its `TaskOptions`.

Conceptually:

```text
Scope
  │
  └── CancellationSource
            │
      ┌─────┼─────┐
      ▼     ▼     ▼
    task  task  task
```

See [Scopes](/modules/threadpool/scopes).

## Scope cancellation before spawn

A cancelled scope can still accept a `spawn()` operation for tracking while the underlying submitted callable is skipped by the cancellation path.

Conceptually:

```text
scope.cancel()
     ↓
scope.spawn(task)
     ↓
scope token already cancelled
     ↓
Future completed as cancelled
     ↓
callable not executed
```

`Scope::spawn()` returning `true` means the operation was accepted for scope tracking.

It does not mean that a cancelled callable actually executed.

## TaskGroup cancellation

`TaskGroup` also owns a shared cancellation source:

```cpp
vix::threadpool::TaskGroup group;

auto token = group.cancellation_token();

group.cancel();
```

After cancellation:

```text
group.cancelled() true
token.cancelled() true
```

Unlike `Scope`, `TaskGroup` is primarily a coordination and accounting object. It does not itself submit a callable to the pool.

Code connecting actual tasks to a `TaskGroup` must use the group's token as part of the task execution design.

See [Task Groups](/modules/threadpool/task-groups).

## Cancellation and deadlines

Cancellation and deadlines can both prevent work from beginning.

`TaskOptions::should_skip_before_run()` returns true when:

```text
cancellation requested
        or
deadline expired
```

For `submit()`:

```text
cancelled
    ↓
ThreadPoolErrc::cancelled

deadline expired
    ↓
ThreadPoolErrc::timeout
```

They remain separate concepts.

Cancellation is an explicit request.

A deadline is a time condition.

See [Deadlines](/modules/threadpool/deadlines).

## Cancellation and timeout

Cancellation is also different from timeout.

```text
Cancellation
    ↓
another part of the program requests stop


Timeout
    ↓
configured execution duration is exceeded
```

Neither mechanism forcibly terminates arbitrary C++ code.

A long-running operation that must react promptly should provide its own cooperative checkpoints.

See [Timeouts](/modules/threadpool/timeouts).

## Design cancellable work around safe checkpoints

A useful cancellable operation usually has natural places where it can stop safely.

For example:

```cpp
auto token = source.token();

auto future = pool.submit([token](){
  for (std::size_t i = 0; i < work_count(); ++i)
  {
    if (token.stop_requested())
    {
      return false;
    }

    process_item(i);
  }

  return true;
}, options);
```

The loop checks cancellation between units of work.

Conceptually:

```text
process one unit
      ↓
check cancellation
      ↓
process next unit
      ↓
check cancellation
      ↓
...
```

This gives the operation control over cleanup, invariants, locks, and resource lifetime.

## Cancellation is not thread termination

Do not design around this assumption:

```text
request_cancel()
      ↓
worker thread immediately stops
```

The actual model is:

```text
request_cancel()
      ↓
shared atomic state becomes cancelled
      ↓
ThreadPool or task code observes the state
      ↓
work stops at an observation point
```

The cancellation request itself does not:

```text
terminate a worker thread
interrupt a system call
unlock application mutexes
roll back side effects
destroy the callable while it is running
```

Those concerns remain part of the callable's own design.

## Choosing a cancellation API

Use an explicit `CancellationSource` and `TaskOptions` when several pieces of work should observe a shared external cancellation signal:

```cpp
vix::threadpool::CancellationSource source;
```

Use `TaskHandle` when one result-producing task needs direct cancellation control:

```cpp
auto handle = pool.handle([](){
  return 42;
});

handle.cancel();
```

Use `Scope::cancel()` when several spawned operations belong to one structured lifetime:

```cpp
vix::threadpool::Scope scope(pool);

scope.cancel();
```

Use `TaskGroup::cancel()` when coordinating a manually managed group around a shared cancellation state.

The underlying mechanism remains the same:

```text
CancellationSource
        ↓
shared CancellationState
        ↓
CancellationToken
        ↓
cooperative observation
```

## Cancellation model summary

The core cancellation path is:

```text
CancellationSource
        │
        ▼
request_cancel()
        │
        ▼
shared atomic state
        │
        ▼
CancellationToken
        │
        ▼
task observes request
```

The important properties are:

- Cancellation is cooperative.
- `CancellationSource` requests cancellation.
- `CancellationToken` observes cancellation.
- A default token is disconnected and never reports cancellation.
- Source copies share the same cancellation state.
- Multiple tokens can observe the same source.
- Cancellation requests are idempotent.
- `submit()` checks cancellation before scheduling and again before invoking the callable.
- Queued `submit()` work can be skipped and its Future completed as cancelled.
- `handle()` provides its own cancellation source.
- `handle.cancel()` does not forcibly stop a callable that has already started.
- Running `submit()` and `handle()` callables must cooperate explicitly if they need to stop early.
- The low-level `Task` checks cancellation before and after its callable.
- `post()` uses that low-level cancellation behavior.
- `post()` acceptance does not mean that an already cancelled callable will execute.
- Resetting a source creates a new state and does not reconnect existing tokens.
- Resetting a token disconnects only that token.
- `Scope` automatically attaches its cancellation token to spawned work.
- `TaskGroup` provides shared cancellation state but does not itself submit tasks.

Continue with [Deadlines](/modules/threadpool/deadlines) for absolute time limits or [Timeouts](/modules/threadpool/timeouts) for execution-duration observation.
