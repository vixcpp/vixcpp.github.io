# `when_all` and `when_any`

`when_all` and `when_any` coordinate several `task<T>` operations through the same Vix Async scheduler.

Use `when_all` when every task must finish before the caller can continue. Use `when_any` when the first completion is enough.

Both helpers start the supplied tasks through a scheduler. They do not create another runtime or one thread per task.

## Header

Use the public Vix Async header:

```cpp id="wkbf3v"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="6usj48"
#include <vix/print.hpp>
```

The APIs are in:

```cpp id="oxz6pr"
vix::async::core
```

## Wait for all tasks

`when_all` starts every supplied task and resumes when all of them have completed.

```cpp id="u2b7ia"
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;

task<int> first()
{
  co_return 10;
}

task<int> second()
{
  co_return 20;
}

task<void> run(io_context& ctx)
{
  auto results = co_await when_all(
    ctx.get_scheduler(),
    first(),
    second()
  );

  vix::print("first:", std::get<0>(results));
  vix::print("second:", std::get<1>(results));
}
```

The returned tuple keeps the same order as the input tasks.

```text id="wayouu"
first()  -> tuple slot 0
second() -> tuple slot 1
```

Completion order does not change result order.

## Tasks can complete in a different order

Suppose two tasks wait for different timers:

```cpp id="yzuyj9"
#include <chrono>
#include <vix/async.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

task<int> slow(io_context& ctx)
{
  co_await ctx.timers().sleep_for(100ms);
  co_return 10;
}

task<int> fast(io_context& ctx)
{
  co_await ctx.timers().sleep_for(20ms);
  co_return 20;
}
```

They can be composed together:

```cpp id="zt619q"
auto results = co_await when_all(
  ctx.get_scheduler(),
  slow(ctx),
  fast(ctx)
);
```

`fast()` finishes first, but the tuple still contains:

```text id="10pmku"
slot 0 -> 10
slot 1 -> 20
```

`when_all` preserves argument order rather than completion order.

## `when_all` waits after failures

If one task throws, `when_all` does not immediately abandon the other tasks.

All started tasks are allowed to complete. Once every task has finished, the first captured exception is rethrown to the awaiting coroutine.

```cpp id="ctt2gg"
task<int> failing()
{
  throw std::runtime_error("failed");

  co_return 0;
}

task<int> successful()
{
  co_return 42;
}

task<void> run(io_context& ctx)
{
  try
  {
    co_await when_all(
      ctx.get_scheduler(),
      failing(),
      successful()
    );
  }
  catch (const std::exception& error)
  {
    vix::print("error:", error.what());
  }
}
```

The important behavior is:

```text id="dc4jka"
start all tasks
      ↓
one task fails
      ↓
remaining tasks continue
      ↓
all tasks finish
      ↓
first captured exception rethrown
```

`when_all` therefore means all started work reaches completion before the waiting coroutine continues, even when one of those tasks fails.

## `task<void>` results

`when_all` also supports `task<void>`.

Because `void` cannot be stored directly in a tuple, Vix represents a completed `task<void>` with `std::monostate`.

```cpp id="4rq3vt"
task<void> first()
{
  co_return;
}

task<int> second()
{
  co_return 42;
}

task<void> run(io_context& ctx)
{
  auto results = co_await when_all(
    ctx.get_scheduler(),
    first(),
    second()
  );

  std::monostate completed = std::get<0>(results);
  int value = std::get<1>(results);

  vix::print("value:", value);
}
```

For these input types:

```text id="yv43ud"
task<void>
task<int>
```

the result type is equivalent to:

```cpp id="evy2te"
std::tuple<std::monostate, int>
```

## Empty `when_all`

`when_all` accepts zero tasks.

```cpp id="giyaxl"
auto results = co_await when_all(
  ctx.get_scheduler()
);
```

The result is an empty tuple:

```cpp id="gy0c57"
std::tuple<>
```

No child task needs to be started.

This makes generic code that builds a task pack easier to use because the empty case does not need a separate runtime branch.

## Wait for the first completion

`when_any` starts all supplied tasks but resumes as soon as the first one finishes.

```cpp id="jfxzlf"
auto result = co_await when_any(
  ctx.get_scheduler(),
  first(),
  second()
);
```

The result contains two pieces:

```text id="0ogctw"
winning task index
+
tuple of optional result slots
```

The index is zero-based.

## Read the winning result

Consider:

```cpp id="qprhn9"
#include <chrono>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace std::chrono_literals;
using namespace vix::async::core;

task<int> slow(io_context& ctx)
{
  co_await ctx.timers().sleep_for(100ms);
  co_return 10;
}

task<int> fast(io_context& ctx)
{
  co_await ctx.timers().sleep_for(20ms);
  co_return 20;
}

task<void> run(io_context& ctx)
{
  auto [index, results] = co_await when_any(
    ctx.get_scheduler(),
    slow(ctx),
    fast(ctx)
  );

  vix::print("winner:", index);

  if (index == 0)
  {
    vix::print("value:", *std::get<0>(results));
  }
  else
  {
    vix::print("value:", *std::get<1>(results));
  }
}
```

Because `fast()` completes first, the winner index is:

```text id="d333m8"
1
```

Only the winning slot is populated in the returned result tuple.

## `when_any` result type

For tasks:

```cpp id="4oy78k"
task<int>
task<std::string>
```

`when_any` returns a task whose value is equivalent to:

```cpp id="76jul2"
std::pair<
  std::size_t,
  std::tuple<
    std::optional<int>,
    std::optional<std::string>
  >
>
```

The first element is the winning index.

The second element contains one optional slot for each input task.

If task `0` wins:

```text id="ln9q63"
index = 0

slot 0 = Some(value)
slot 1 = None
```

If task `1` wins:

```text id="r57phh"
index = 1

slot 0 = None
slot 1 = Some(value)
```

The losing slots are intentionally empty.

## Why the result uses optionals

`when_any` returns before the losing tasks finish.

At that moment their results may not exist yet.

Returning ordinary values for every slot would incorrectly suggest that all results are available.

The optional representation matches the real state:

```text id="wx3kod"
winner result -> available
loser result  -> not part of returned completion
```

This also prevents the returned object from reading result storage while losing tasks are still completing in the background.

## `task<void>` with `when_any`

For `when_any`, a `task<void>` result becomes:

```cpp id="qim6vx"
std::optional<std::monostate>
```

For example:

```cpp id="1b2xsz"
task<void> wait_for_signal();
task<int> load_value();
```

the returned tuple is equivalent to:

```cpp id="h00s41"
std::tuple<
  std::optional<std::monostate>,
  std::optional<int>
>
```

An engaged `std::optional<std::monostate>` means that the `task<void>` was the winning completed task.

## The winner can fail

`when_any` completes on the first task that finishes, whether that task succeeds or throws.

If the winning task throws, its exception is rethrown instead of returning an index and value tuple.

```text id="azgk3z"
task A throws first
      ↓
task A wins completion race
      ↓
when_any resumes
      ↓
exception rethrown
```

A later successful task does not replace that winner.

`when_any` is therefore based on first completion, not first successful result.

## Losing tasks keep running

This is the most important `when_any` lifetime rule.

When the first task completes, the remaining tasks are not stopped automatically.

```text id="81zue9"
task A ───── complete
             ↓
        when_any returns

task B ───────────────── continues

task C ───────────────────────── continues
```

The losing runners keep their shared internal state alive while they finish.

The scheduler and any external services they use must also remain alive.

For example, this relationship is safe:

```text id="yvdul9"
when_any returns
      ↓
losers still active
      ↓
io_context remains alive
      ↓
losers finish
      ↓
runtime can shut down
```

Destroying a scheduler while a losing task can still post a continuation to it would violate that lifetime requirement.

## `when_any` does not cancel losers

A general `task<T>` does not promise that it can be cancelled.

One task may be waiting on a cancellable timer, another may be running CPU code, and another may be awaiting a different operation.

For that reason, `when_any` does not automatically cancel the tasks that lose the race.

If the application wants cancellation, provide it explicitly to the operations involved.

For example:

```cpp id="9w7dl5"
cancel_source source;

auto token = source.token();
```

Tasks can then use that token in operations that support cancellation.

The application can request cancellation according to its own policy after `when_any` returns.

Task coordination and cancellation remain separate concepts.

## `when_any` requires at least one task

Unlike `when_all`, `when_any` cannot be called with an empty task pack.

The implementation enforces this at compile time.

This is invalid:

```cpp id="h82z2c"
co_await when_any(
  ctx.get_scheduler()
);
```

There can be no first completion when no task exists.

Use `when_all` when generic code needs to support the empty case.

## Scheduler behavior

Both helpers first move their own execution onto the supplied scheduler.

They then start one internal runner for each task through that same scheduler.

Conceptually:

```text id="9cq4m3"
when_all / when_any
        ↓
supplied scheduler
        ↓
runner A
runner B
runner C
        ↓
individual tasks
```

The runners are internal coordination coroutines.

They do not create a separate thread pool.

The actual work performed by each task still depends on what that task awaits.

## Result order and completion order

The two helpers treat order differently.

For `when_all`, argument order determines result position:

```text id="q3b5sh"
input A -> slot 0
input B -> slot 1
input C -> slot 2
```

Completion order does not matter.

For `when_any`, completion order determines the winning index:

```text id="tlh0ll"
A completes second
B completes first
C completes third

winner index = 1
```

The index still refers to the original argument position.

## Choosing between them

Use `when_all` when all results are required:

```text id="rx8jce"
A ─┐
B ─┼── wait for all
C ─┘
```

Use `when_any` when the first completion is enough:

```text id="7tzxje"
A ─┐
B ─┼── first completion returns
C ─┘
```

Use ordinary `co_await` when the operations are sequential:

```text id="0l8ypm"
A
↓
B
↓
C
```

The choice should reflect the dependency between operations rather than simply the number of tasks.

## API overview

`when_all` has the logical form:

```cpp id="3v2icm"
template <typename... Ts>
task<
  std::tuple<
    std::conditional_t<
      std::is_void_v<Ts>,
      std::monostate,
      Ts
    >...
  >
>
when_all(
  scheduler& sched,
  task<Ts>... tasks
);
```

For each input task, the result tuple contains its value. `task<void>` maps to `std::monostate`.

`when_any` has the logical form:

```cpp id="ddjc0t"
template <typename... Ts>
task<
  std::pair<
    std::size_t,
    std::tuple<
      detail::stored_t<Ts>...
    >
  >
>
when_any(
  scheduler& sched,
  task<Ts>... tasks
);
```

Each stored slot is an `std::optional` value. For `void`, the optional contains `std::monostate`.

Application code normally does not need to name `detail::stored_t` directly. Use structured binding and inspect the slot corresponding to the returned winner index.

## Next step

Continue with [Cancellation](./cancellation) to see how supported asynchronous operations can be stopped cooperatively.

Then read:

- [Task Composition](./task-composition)
- [Tasks](./tasks)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
