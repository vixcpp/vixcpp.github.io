# Task Groups

`TaskGroup` is a thread-safe coordination object for manually tracking a group of related tasks.

It records:

```text
task IDs
pending task count
completed task count
failed task count
cancelled task count
timed-out task count
rejected task count
first reported exception
shared cancellation state
```

Unlike `Scope`, a `TaskGroup` does not submit work itself.

The application registers tasks and reports their final outcomes explicitly.

## Basic model

The lifecycle is:

```text
create TaskGroup
      ↓
register task IDs
      ↓
work executes elsewhere
      ↓
report each task outcome
      ↓
wait until pending == 0
```

For example:

```cpp
#include <chrono>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::TaskGroup group;

  group.add_task(vix::threadpool::TaskId{1});
  group.add_task(vix::threadpool::TaskId{2});

  std::thread first([&group](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{10}
    );

    group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
    );
  });

  std::thread second([&group](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{20}
    );

    group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
    );
  });

  group.close();
  group.wait();

  first.join();
  second.join();

  return group.completed_tasks() == 2 ? 0 : 1;
}
```

`TaskGroup` coordinates the accounting and waiting. The threads or ThreadPool tasks performing the actual work are managed separately.

## A new group

Create an empty group with:

```cpp
vix::threadpool::TaskGroup group;
```

Its initial state is:

```text
empty             true
done              true
closed            false
cancelled         false
total_tasks       0
pending_tasks     0
completed_tasks   0
failed_tasks      0
cancelled_tasks   0
timed_out_tasks   0
rejected_tasks    0
```

A new group is considered done because there are no pending tasks.

## Register a task

Use:

```cpp
const bool added = group.add_task(
        vix::threadpool::TaskId{1}
);
```

A successful registration increments both:

```text
total_tasks
pending_tasks
```

For example:

```cpp
group.add_task(vix::threadpool::TaskId{1});
group.add_task(vix::threadpool::TaskId{2});
group.add_task(vix::threadpool::TaskId{3});
```

produces:

```text
total_tasks   3
pending_tasks 3
```

and:

```cpp
group.done();
```

returns `false`.

## Invalid task IDs are rejected

`invalid_task_id` cannot be registered:

```cpp
const bool added = group.add_task(
        vix::threadpool::invalid_task_id
);
```

The result is:

```text
false
```

The group counters are not modified.

`invalid_task_id` has value zero.

## Task IDs are tracking information

The group stores every registered ID:

```cpp
const auto ids = group.task_ids();
```

For:

```cpp
group.add_task(vix::threadpool::TaskId{1});
group.add_task(vix::threadpool::TaskId{2});
```

the returned vector contains:

```text
1
2
```

in registration order.

`task_ids()` returns a copy of the stored vector.

Changing the returned vector does not modify the group.

## Task IDs are not required to be unique

`add_task()` validates that an ID is non-zero, but it does not check whether the same ID was already registered.

For example:

```cpp
group.add_task(vix::threadpool::TaskId{1});
group.add_task(vix::threadpool::TaskId{1});
```

registers two entries.

The resulting counters are:

```text
total_tasks   2
pending_tasks 2
```

When task identity is important, the caller is responsible for registering unique IDs.

IDs obtained from:

```cpp
pool.next_task_id();
```

provide the normal ThreadPool task-ID sequence.

## TaskGroup does not submit tasks

This is the central difference from `Scope`.

`TaskGroup` has no:

```text
spawn()
submit()
post()
handle()
```

operation.

This:

```cpp
vix::threadpool::TaskGroup group;

group.add_task(vix::threadpool::TaskId{1});
```

only registers accounting state.

It does not create or execute a ThreadPool task.

Conceptually:

```text
TaskGroup
    ↓
register task identity

execution system
    ↓
runs actual work

application integration
    ↓
finish_task()
```

The application connects those pieces.

## Report task completion

Call `finish_task()` once the registered work reaches its final outcome.

For successful work:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
);
```

This changes:

```text
pending_tasks   -1
completed_tasks +1
```

When the last pending task is finished:

```cpp
group.done();
```

returns `true`.

## Report a failure

Use:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::failed,
        vix::threadpool::TaskResult::failure
);
```

This increments:

```text
failed_tasks
```

and decrements the pending count.

A failure can also include the captured exception:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::failed,
        vix::threadpool::TaskResult::failure,
        std::make_exception_ptr(
                std::runtime_error{"task failed"}
        )
);
```

The first reported exception is retained by the group.

## Report cancellation

Use:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::cancelled,
        vix::threadpool::TaskResult::cancelled
);
```

This increments:

```text
cancelled_tasks
```

and decrements:

```text
pending_tasks
```

Requesting group cancellation itself does not perform this accounting automatically.

The task integration must still report its final outcome.

## Report timeout

Use:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::timed_out,
        vix::threadpool::TaskResult::timeout
);
```

This increments:

```text
timed_out_tasks
```

and decrements the pending count.

## Report rejection

Use:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::rejected,
        vix::threadpool::TaskResult::rejected
);
```

This increments:

```text
rejected_tasks
```

and decrements the pending count.

This is useful when manually integrating the group with an execution system whose submission can fail.

## Use final status and result values

`finish_task()` is designed to receive the final task status and result.

The normal pairs are:

| Status      | Result      |
| ----------- | ----------- |
| `completed` | `success`   |
| `failed`    | `failure`   |
| `cancelled` | `cancelled` |
| `timed_out` | `timeout`   |
| `rejected`  | `rejected`  |

Use consistent terminal pairs when reporting group outcomes.

For example:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
);
```

rather than mixing an unrelated status and result.

## `finish_task()` does not identify the task

Notice that the API is:

```cpp
group.finish_task(
        status,
        result
);
```

not:

```text
finish_task(task_id, status, result)
```

`TaskGroup` therefore does not match completion reports against individual registered IDs.

Its IDs are retained for identification and inspection, while completion accounting is counter-based.

The caller must maintain the relationship between actual tasks and their completion reports.

## Call `finish_task()` exactly once per registered task

Because completion is counter-based, the caller should report exactly one final outcome for every successful `add_task()`.

The intended relationship is:

```text
one add_task()
      ↓
one finish_task()
```

For example:

```text
3 registered tasks
      ↓
3 completion reports
      ↓
pending_tasks == 0
```

If a registered task never calls `finish_task()`, `wait()` can remain blocked indefinitely.

## Extra completion reports are not validated

`finish_task()` decrements `pending_tasks` only when the count is greater than zero.

However, it still updates the outcome counter even when no tasks remain pending.

Therefore an extra call such as:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
);
```

after all registered tasks are already finished can increase `completed_tasks()` beyond `total_tasks()`.

`TaskGroup` does not validate completion reports against individual IDs.

Correct accounting depends on the caller maintaining the one-registration, one-completion rule.

## Wait for all registered tasks

Use:

```cpp
group.wait();
```

The operation blocks until:

```text
pending_tasks == 0
```

Conceptually:

```text
wait()
  ↓
pending == 0?
 ┌─────┴─────┐
yes          no
 │            │
return       block
              ↓
       finish_task()
              ↓
       condition variable
              ↓
        check again
```

`finish_task()` notifies waiting threads after updating the group state.

## `wait()` does not close the group

This differs from `Scope`.

Calling:

```cpp
group.wait();
```

does not prevent future task registration.

For example:

```cpp
vix::threadpool::TaskGroup group;

group.wait();

const bool added = group.add_task(
        vix::threadpool::TaskId{1}
);
```

`added` can still be `true` because the group remains open.

This means a bare `wait()` is only a wait for the current pending count.

## Close before waiting for a stable boundary

When no more tasks should enter the group, use:

```cpp
group.close();
group.wait();
```

The sequence creates a stable completion boundary:

```text
close()
   ↓
reject new registrations
   ↓
wait()
   ↓
pending reaches zero
   ↓
group remains complete
```

This is the normal pattern when the complete group membership is known.

## Close the group

Call:

```cpp
group.close();
```

to prevent future registrations.

Afterward:

```cpp
group.closed();
```

returns:

```text
true
```

and:

```cpp
group.add_task(vix::threadpool::TaskId{4});
```

returns:

```text
false
```

Existing registered tasks remain pending until their outcomes are reported.

## `close()` does not wait

This:

```cpp
group.close();
```

does not wait for registered tasks.

For example:

```text
total_tasks   3
pending_tasks 2
```

can remain true after the group has been closed.

Use:

```cpp
group.close();
group.wait();
```

when both membership finalization and completion are required.

## `close()` does not cancel

Closing and cancellation are independent:

```text
close()
   ↓
prevent new task registration


cancel()
   ↓
request cooperative cancellation
```

A group can be:

```text
closed and not cancelled
```

or:

```text
cancelled and still open
```

until the application explicitly changes the other state.

## Check completion

Use:

```cpp
if (group.done())
{
  // No registered task is pending.
}
```

`done()` is equivalent to:

```text
pending_tasks == 0
```

A new empty group is therefore already done.

A group becomes not done after successful task registration:

```cpp
group.add_task(vix::threadpool::TaskId{1});
```

and becomes done again after its pending count returns to zero.

## `done()` does not mean closed

These are separate states.

A group can be:

```text
done   true
closed false
```

For example, a new group has exactly this state.

It can also be:

```text
done   false
closed true
```

when membership has been finalized but registered work is still outstanding.

The normal final state after:

```cpp
group.close();
group.wait();
```

is:

```text
done   true
closed true
```

## `empty()` means no task was ever registered

Use:

```cpp
group.empty();
```

to check whether:

```text
total_tasks == 0
```

This differs from `done()`.

For example:

```cpp
group.add_task(vix::threadpool::TaskId{1});

group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
);
```

now gives:

```text
empty() false
done()  true
```

The task has finished, but the group is not empty because one task was registered during its lifetime.

## Counters are cumulative

`TaskGroup` does not remove completed registrations or reset its counters after waiting.

For example:

```text
total_tasks       3
pending_tasks     0
completed_tasks   2
cancelled_tasks   1
```

remains available after:

```cpp
group.wait();
```

This makes the group useful for inspecting aggregate outcomes after all work finishes.

There is no public reset operation.

## Inspect total tasks

Use:

```cpp
const auto total = group.total_tasks();
```

This is the number of successful `add_task()` registrations during the group's lifetime.

It does not decrease when tasks finish.

## Inspect pending tasks

Use:

```cpp
const auto pending = group.pending_tasks();
```

This is the number of registered tasks for which completion has not yet been accounted.

Conceptually:

```text
pending_tasks
    ↓
successful registrations
minus
reported completions
```

When it reaches zero:

```cpp
group.done();
```

returns `true`.

## Inspect completed tasks

Use:

```cpp
const auto completed = group.completed_tasks();
```

This counts outcomes reported with:

```cpp
vix::threadpool::TaskStatus::completed
```

or a successful fallback result when a non-terminal status is supplied.

Normal code should report the terminal `completed` status directly.

## Inspect failed tasks

Use:

```cpp
const auto failed = group.failed_tasks();
```

This counts tasks reported as failed.

Check whether at least one failure occurred with:

```cpp
if (group.has_failure())
{
  // At least one failed task was reported.
}
```

`has_failure()` only refers to the failed-task counter.

Cancellation, timeout, and rejection do not make `has_failure()` return true.

## Inspect all non-success outcomes

Use:

```cpp
if (group.has_error())
{
  // At least one non-success outcome was reported.
}
```

`has_error()` returns true when any of these counters is non-zero:

```text
failed_tasks
cancelled_tasks
timed_out_tasks
rejected_tasks
```

Therefore:

```text
has_failure()
   ↓
only failure

has_error()
   ↓
failure
cancellation
timeout
rejection
```

A fully successful group reports:

```text
has_failure() false
has_error()   false
```

## First exception

When a failed task reports an exception:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::failed,
        vix::threadpool::TaskResult::failure,
        std::make_exception_ptr(
                std::runtime_error{"failure"}
        )
);
```

the first non-null exception is stored.

Inspect it with:

```cpp
const auto exception = group.first_exception();
```

When no exception was captured:

```text
nullptr
```

is returned.

## Only the first exception is retained

Suppose several tasks report exceptions:

```text
Task A → exception A
Task B → exception B
Task C → exception C
```

The group retains:

```text
exception A
```

assuming Task A's failure report reached `finish_task()` first.

Later exceptions do not replace it.

This keeps one representative exception for `wait_and_rethrow()`.

## Failure does not require an exception

This is valid:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::failed,
        vix::threadpool::TaskResult::failure
);
```

It increments:

```text
failed_tasks
```

but does not create an exception.

The group can therefore have:

```text
has_failure() == true
first_exception() == nullptr
```

`wait_and_rethrow()` only throws when an actual exception pointer was reported.

## Wait and rethrow

Use:

```cpp
group.wait_and_rethrow();
```

to wait until all registered work has been reported complete and then rethrow the first captured exception.

For example:

```cpp
vix::threadpool::TaskGroup group;

group.add_task(vix::threadpool::TaskId{1});

group.finish_task(
        vix::threadpool::TaskStatus::failed,
        vix::threadpool::TaskResult::failure,
        std::make_exception_ptr(
                std::runtime_error{"task failed"}
        )
);

try
{
  group.wait_and_rethrow();
}
catch (const std::runtime_error&)
{
  // First captured exception.
}
```

The exception is rethrown only after:

```text
pending_tasks == 0
```

## `wait_and_rethrow()` does not close the group

Like `wait()`, it does not modify the group's open or closed state.

For a fixed membership boundary, use:

```cpp
group.close();

try
{
  group.wait_and_rethrow();
}
catch (...)
{
  // Handle the reported task exception.
}
```

The group remains closed afterward because `close()` was called explicitly.

## `wait_and_rethrow()` only rethrows exceptions

Cancellation, timeout, and rejection contribute to:

```cpp
group.has_error();
```

but do not automatically cause:

```cpp
group.wait_and_rethrow();
```

to throw.

For example:

```cpp
group.finish_task(
        vix::threadpool::TaskStatus::timed_out,
        vix::threadpool::TaskResult::timeout
);
```

increments the timeout counter but stores no exception.

After waiting, inspect the counters or `has_error()` when these outcomes matter.

## Shared cancellation

Every `TaskGroup` owns a `CancellationSource`.

Obtain its token with:

```cpp
auto token = group.cancellation_token();
```

Request cancellation with:

```cpp
group.cancel();
```

Afterward:

```cpp
group.cancelled();
```

returns:

```text
true
```

and every token connected to the group source observes the same request.

## Cancellation is not automatic task integration

`TaskGroup` does not automatically attach its token to ThreadPool tasks.

This:

```cpp
vix::threadpool::TaskGroup group;

group.cancel();
```

only changes the group's shared cancellation state.

Actual work must explicitly observe:

```cpp
group.cancellation_token();
```

if it should react to group cancellation.

Conceptually:

```text
TaskGroup
    ↓
CancellationSource
    ↓
CancellationToken

application integration
    ↓
actual task observes token
```

## Cancellation does not finish pending tasks

Calling:

```cpp
group.cancel();
```

does not change:

```text
pending_tasks
completed_tasks
failed_tasks
cancelled_tasks
timed_out_tasks
rejected_tasks
```

For example:

```text
before cancel:
pending_tasks = 3

after cancel:
pending_tasks = 3
```

Each registered task must still eventually be reported through `finish_task()`.

Otherwise:

```cpp
group.wait();
```

can remain blocked.

## Use the cancellation token inside work

A manually coordinated task can observe the group token:

```cpp
auto token = group.cancellation_token();

std::thread worker([&group, token](){
  if (token.stop_requested())
  {
    group.finish_task(
        vix::threadpool::TaskStatus::cancelled,
        vix::threadpool::TaskResult::cancelled
    );

    return;
  }

  perform_work();

  group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
  );
});
```

The application is responsible for reporting whichever final outcome actually occurred.

## Cancellation is cooperative

Group cancellation follows the same model as other ThreadPool cancellation:

```text
group.cancel()
      ↓
shared cancellation state becomes true
      ↓
linked code observes token
      ↓
linked code decides where to stop safely
```

It does not:

```text
terminate threads
interrupt arbitrary C++ instructions
automatically remove queued tasks
automatically update TaskGroup counters
```

See [Cancellation](/modules/threadpool/cancellation).

## Access the cancellation source

The source itself is available through:

```cpp
auto& source = group.cancellation_source();
```

For ordinary cancellation:

```cpp
group.cancel();
```

is simpler.

Direct source access is useful when another API specifically requires a `CancellationSource`.

The source is owned by the group and should not outlive it by reference.

## Be careful when resetting the cancellation source

`CancellationSource::reset()` creates a new cancellation state.

Existing tokens remain attached to the old state.

Therefore:

```cpp
auto token = group.cancellation_token();

group.cancellation_source().reset();

group.cancel();
```

requests cancellation on the new state, not on the state still observed by `token`.

Avoid resetting the group cancellation source while registered work depends on existing tokens.

## Thread safety

`TaskGroupState` protects group accounting with a mutex and uses a condition variable for waiting.

The public operations can therefore be called from multiple threads.

For example:

```text
Thread A
  finish_task()
       │
       │
Thread B│
  finish_task()
       │
       ▼
   TaskGroup
       │
       ▼
Thread C
  wait()
```

Counter updates and state inspection are synchronized internally.

## Waiting and registration can occur concurrently

`add_task()` and `wait()` use the same synchronized state, but `wait()` does not close registrations.

This creates an important semantic distinction.

Suppose:

```text
pending_tasks = 0
```

A thread calling:

```cpp
group.wait();
```

can return immediately.

Another thread can then successfully call:

```cpp
group.add_task(...);
```

if the group has not been closed.

Therefore, when registration may happen concurrently, call:

```cpp
group.close();
group.wait();
```

once membership is complete.

## Closing establishes the registration boundary

`close()` and `add_task()` synchronize through the same mutex.

If `add_task()` obtains the lock first:

```text
task registered
      ↓
close happens afterward
```

the new task belongs to the group.

If `close()` obtains the lock first:

```text
closed = true
      ↓
later add_task()
      ↓
false
```

This provides a clear boundary for concurrent task registration.

## Completion notifications

Every call to:

```cpp
group.finish_task(...);
```

notifies the group's condition variable.

Waiting threads then reevaluate:

```text
pending_tasks == 0
```

`close()` and `cancel()` also notify waiters, although neither operation by itself makes outstanding tasks complete.

The wait predicate remains based only on the pending-task count.

## Destructor does not wait

This is an important difference from `Scope`.

`TaskGroup` has a default destructor:

```text
~TaskGroup()
```

and destruction does not automatically call:

```text
wait()
close()
cancel()
```

Therefore this is unsafe when another thread can still access the group:

```cpp
{
  vix::threadpool::TaskGroup group;

  group.add_task(vix::threadpool::TaskId{1});

  // Work using &group continues elsewhere.
}
```

The caller must ensure all users of the group have finished before destroying it.

## Scope and TaskGroup have different lifetime guarantees

`Scope` provides automatic structured waiting:

```text
Scope destructor
      ↓
wait for tracked Futures
```

`TaskGroup` does not:

```text
TaskGroup destructor
      ↓
destroy state immediately
```

Therefore:

```text
Scope
  automatic task lifetime boundary

TaskGroup
  manual coordination and accounting
```

Use `Scope` when automatic ownership of spawned task completion is the main requirement.

Use `TaskGroup` when manual registration, aggregate counters, task IDs, and explicit completion reporting are required.

## TaskGroup does not own task lifetime

A `TaskGroup` stores:

```text
Task IDs
counters
exception pointer
cancellation source
```

It does not store:

```text
Future objects
TaskHandle objects
Worker objects
ThreadPool
```

Therefore the group itself does not keep an asynchronous operation alive or wait on its Future.

The system integrating with `TaskGroup` remains responsible for the actual execution objects.

## TaskGroup is not tied to ThreadPool

A group can coordinate work from any execution mechanism capable of reporting the required outcomes.

The existing API only requires:

```text
register TaskId
report TaskStatus
report TaskResult
optionally report exception
```

For example, it can coordinate plain `std::thread` work, as shown in the basic example.

This is why the type does not require a `ThreadPool` constructor argument.

## A ThreadPool integration must be explicit

When connecting a `TaskGroup` to ThreadPool work, the integration must handle both sides:

```text
before execution
      ↓
add_task(id)

after every possible outcome
      ↓
finish_task(...)
```

That includes:

```text
success
failure
cancellation
timeout
rejection
```

A missing completion path leaves the group's pending count non-zero.

`TaskGroup` does not automatically observe a `Future` or `TaskHandle`.

## Do not attach the group token without completion accounting

For example, attaching:

```cpp
options.set_cancellation(
        group.cancellation_token()
);
```

to a ThreadPool submission can cause the ThreadPool to skip a callable before that callable begins.

If the application's only `finish_task()` call is inside that callable, it will never run.

The result would be:

```text
registered task
      ↓
cancelled before callable
      ↓
callable skipped
      ↓
finish_task() never called
      ↓
pending_tasks remains non-zero
```

When integrating `TaskGroup` with ThreadPool cancellation, ensure the outer integration observes the terminal asynchronous result and reports it to the group.

## Aggregate outcome example

The module's task-group example coordinates three manually reported outcomes:

```cpp
#include <chrono>
#include <iostream>
#include <thread>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::TaskGroup group;

  group.add_task(vix::threadpool::TaskId{1});
  group.add_task(vix::threadpool::TaskId{2});
  group.add_task(vix::threadpool::TaskId{3});

  std::thread first([&group](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{20}
    );

    group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
    );
  });

  std::thread second([&group](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{40}
    );

    group.finish_task(
        vix::threadpool::TaskStatus::completed,
        vix::threadpool::TaskResult::success
    );
  });

  std::thread third([&group](){
    std::this_thread::sleep_for(
        std::chrono::milliseconds{60}
    );

    group.finish_task(
        vix::threadpool::TaskStatus::cancelled,
        vix::threadpool::TaskResult::cancelled
    );
  });

  group.close();
  group.wait();

  first.join();
  second.join();
  third.join();

  std::cout << "Total tasks: "
            << group.total_tasks()
            << '\n';

  std::cout << "Completed: "
            << group.completed_tasks()
            << '\n';

  std::cout << "Cancelled: "
            << group.cancelled_tasks()
            << '\n';

  std::cout << "Has error: "
            << (group.has_error() ? "yes" : "no")
            << '\n';

  return 0;
}
```

Output:

```text
Total tasks: 3
Completed: 2
Cancelled: 1
Has error: yes
```

The output demonstrates that the group keeps aggregate outcome information after all registered work has finished.

## TaskGroupState

`TaskGroupState` is the underlying public state type used by `TaskGroup`.

It provides the same core operations:

```text
add_task()
finish_task()
close()
cancel()
wait()
wait_and_rethrow()
cancellation_token()
cancellation_source()
done()
closed()
empty()
task counters
task_ids()
first_exception()
```

`TaskGroup` is a user-facing wrapper around one `TaskGroupState`.

Normal application code should prefer:

```cpp
vix::threadpool::TaskGroup
```

unless it specifically needs to work with the lower-level state type.

## No reset operation

A `TaskGroup` accumulates information for its entire lifetime.

After:

```text
total_tasks       10
completed_tasks    8
failed_tasks       2
pending_tasks      0
```

there is no operation that resets these counters to zero.

Create another group for another independent accounting lifetime.

This also keeps task IDs and first-exception state tied to one logical group.

## Not copyable or movable

`TaskGroup` disables:

```text
copy construction
copy assignment
move construction
move assignment
```

Create the group directly in the lifetime where its coordination state belongs.

This also keeps references used by concurrent completion reporters stable.

## Choosing between Scope and TaskGroup

Use `Scope` when you want:

```text
submit related work
track Futures automatically
wait automatically at destruction
shared cancellation
```

Use `TaskGroup` when you want:

```text
manual task registration
explicit task IDs
manual completion reporting
aggregate outcome counters
first-exception storage
shared cancellation state
explicit waiting
```

The distinction is:

```text
Scope
  owns structured tracking of submitted Futures

TaskGroup
  owns coordination state and accounting
```

Neither abstraction replaces the other.

## Recommended TaskGroup lifecycle

For a fixed set of manually coordinated work, the normal pattern is:

```text
create group
     ↓
add_task() for each logical task
     ↓
start work
     ↓
close()
     ↓
each task calls finish_task() exactly once
     ↓
wait() or wait_and_rethrow()
     ↓
inspect counters
     ↓
destroy group after all users are finished
```

In code:

```cpp
vix::threadpool::TaskGroup group;

group.add_task(vix::threadpool::TaskId{1});
group.add_task(vix::threadpool::TaskId{2});

start_work();

group.close();
group.wait();

if (group.has_error())
{
  inspect_group_outcomes();
}
```

The important properties are:

- `TaskGroup` coordinates work but does not submit it.
- Tasks are registered manually with `add_task()`.
- Zero is not a valid task ID.
- Duplicate non-zero IDs are currently accepted.
- Every successful registration should receive exactly one `finish_task()` report.
- `finish_task()` does not identify or validate the task being finished.
- Outcome counters are cumulative.
- `empty()` means no task has ever been registered.
- `done()` means no registered task is currently pending.
- `wait()` waits for `pending_tasks == 0`.
- `wait()` does not close the group.
- `wait_and_rethrow()` also does not close the group.
- Call `close()` before waiting when the registration boundary must be final.
- `close()` prevents new registrations but does not wait or cancel.
- `cancel()` requests shared cooperative cancellation but does not update completion counters.
- The cancellation token is not automatically connected to ThreadPool tasks.
- `has_failure()` reports only failed tasks.
- `has_error()` also includes cancellation, timeout, and rejection.
- Only the first reported non-null exception is retained.
- `wait_and_rethrow()` throws only when an exception was actually reported.
- The destructor does not wait.
- `TaskGroup` does not own Futures, tasks, workers, or a ThreadPool.
- The caller must guarantee that no concurrent code accesses the group after destruction.
- `TaskGroup` is thread-safe for its own state and is neither copyable nor movable.

Continue with [Synchronization](/modules/threadpool/synchronization) for `Latch` and `Barrier`, or [Parallel Algorithms](/modules/threadpool/parallel-algorithms) for higher-level parallel work.
