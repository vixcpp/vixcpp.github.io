# Parallel Pipeline

`parallel_pipeline` runs several independent stages concurrently through a `ThreadPool`.

```cpp id="9y21el"
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  vix::threadpool::parallel_pipeline(
    pool,
    [](){
      load_config();
    },
    [](){
      warm_cache();
    },
    [](){
      prepare_metrics();
    }
  );

  return 0;
}
```

All stages are submitted before the function begins waiting for their results.

The call returns only after every submitted stage has reached a terminal asynchronous result.

## Independent stages

The most important property of `parallel_pipeline` is that its stages are independent.

This:

```cpp id="kva75i"
vix::threadpool::parallel_pipeline(
  pool,
  first_stage,
  second_stage,
  third_stage
);
```

means:

```text id="dkn7ae"
first_stage  ──► ThreadPool
second_stage ──► ThreadPool
third_stage  ──► ThreadPool
       │
       └──── caller waits for all
```

It does not mean:

```text id="54pnbe"
first_stage
    ↓
second_stage
    ↓
third_stage
```

There is no automatic data flow or dependency between stages.

## Not a sequential data pipeline

The word `pipeline` here describes a group of independent stages launched together.

It does not provide automatic stage-to-stage value passing.

For example:

```cpp id="70s8q4"
vix::threadpool::parallel_pipeline(
  pool,
  [](){
    return 42;
  },
  [](){
    consume_result();
  }
);
```

does not pass `42` from the first callable to the second callable.

Return values are discarded.

If one operation requires another operation's result, express that dependency explicitly.

## Stage order is not guaranteed

Stages are submitted in argument order.

For:

```cpp id="ue852n"
vix::threadpool::parallel_pipeline(
  pool,
  stageA,
  stageB,
  stageC
);
```

submission occurs as:

```text id="o9jf18"
stage A
stage B
stage C
```

but execution can occur in any order allowed by the scheduler.

For example:

```text id="qdfcpa"
stage B starts
stage A starts
stage C starts
```

or several stages can execute simultaneously.

Submission order must not be interpreted as dependency order.

## Basic execution model

The direct API follows this path:

```text id="bnj5u2"
stages
  ↓
submit stage 1
submit stage 2
submit stage 3
  ↓
Future<void>
Future<void>
Future<void>
  ↓
consume every Future
  ↓
exception?
 ┌────┴────┐
yes        no
 │          │
rethrow    return
```

Every stage is submitted through `ThreadPool::submit()`.

The stages therefore use the normal ThreadPool scheduling and worker model.

## Stage signature

Stages are intended to be callable without arguments:

```cpp id="q5zznp"
[](){
  perform_work();
}
```

Required state can be captured:

```cpp id="68gj0s"
const int value = 42;

vix::threadpool::parallel_pipeline(
  pool,
  [value](){
    consume(value);
  }
);
```

The pipeline does not inject arguments into stage callables.

## Return values are discarded

A stage can technically return a value:

```cpp id="an6gcz"
vix::threadpool::parallel_pipeline(
  pool,
  [](){
    return 42;
  }
);
```

but the pipeline wrapper calls the stage only for its execution:

```cpp id="p2mhj9"
stage();
```

The return value is not stored.

The generated asynchronous result is:

```cpp id="b7xcw6"
vix::threadpool::Future<void>
```

Use ordinary `ThreadPool::submit()` or another result-producing abstraction when stage values must be collected.

## No stages

Calling the direct algorithm with no stage is a no-op:

```cpp id="u62rdi"
vix::threadpool::parallel_pipeline(pool);
```

The function returns immediately.

Conceptually:

```text id="kkb1cq"
number of stages = 0
        ↓
return
```

No task is submitted.

## All stages are submitted before waiting

For several stages, the implementation first builds the complete Future collection.

Conceptually:

```text id="sqygsd"
submit A
submit B
submit C
submit D
   ↓
only then
   ↓
get Future A
get Future B
get Future C
get Future D
```

The function does not:

```text id="bsntlx"
submit A
wait A
submit B
wait B
```

This allows independent stages to overlap in execution.

## ParallelPipelineOptions

Stage submission can be configured with:

```cpp id="l67xxv"
vix::threadpool::ParallelPipelineOptions options;
```

The type currently contains one field:

```cpp id="fc4xth"
vix::threadpool::TaskOptions task_options;
```

A default options object therefore uses default `TaskOptions`:

```cpp id="ddg1iw"
vix::threadpool::ParallelPipelineOptions options;
```

The same `task_options` value is used for every stage.

## Pass explicit options

The overload with options places them immediately after the pool:

```cpp id="vllkpp"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

vix::threadpool::parallel_pipeline(
  pool,
  options,
  [](){
    perform_first_operation();
  },
  [](){
    perform_second_operation();
  }
);
```

Both stages are submitted with high priority.

## TaskOptions are shared by configuration

Every generated stage submission receives:

```cpp id="yzwlum"
options.task_options
```

Conceptually:

```text id="a4us7u"
ParallelPipelineOptions
          │
          ▼
      TaskOptions
      ┌───┼───┐
      ▼   ▼   ▼
   stage stage stage
```

The same configuration can therefore apply:

```text id="dxnr7g"
priority
worker affinity
cancellation
deadline
timeout
```

to every stage.

Normal ThreadPool task semantics still apply.

## Priority

Set a stage priority with:

```cpp id="dc2hny"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);
```

Every stage receives the same priority.

Priority controls ordering inside each selected worker's local queue.

It does not establish ordering between pipeline stages.

For example:

```text id="y23ttj"
stage A = high
stage B = high
stage C = high
```

does not mean A must execute before B.

See [Priorities](/modules/threadpool/priorities).

## Worker affinity

Affinity can be applied to all stages:

```cpp id="a2l8gi"
options.task_options.set_affinity(
  vix::threadpool::WorkerId{2}
);
```

Because the same `TaskOptions` are used for every submission:

```text id="ibtxc6"
stage A ──┐
stage B ──┼──► Worker 2
stage C ──┘
```

One worker executes one task at a time.

Applying one affinity to every stage can therefore serialize the stages and remove the concurrency that `parallel_pipeline` normally provides.

Leave affinity unset unless same-worker placement is intentional.

## Cancellation

A shared cancellation token can be attached:

```cpp id="x16a15"
vix::threadpool::CancellationSource source;

vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_cancellation(
  source.token()
);
```

Every stage then observes the same cancellation state through the normal result-producing submission path.

Conceptually:

```text id="2ihai5"
CancellationSource
       │
       ▼
shared cancellation state
    ┌────┼────┐
    ▼    ▼    ▼
 stage stage stage
```

A cancellation request can prevent stages that have not started from invoking their user callable.

## Cancellation after a stage starts

Cancellation does not forcibly terminate a stage already running.

For long-running stage code, capture the token explicitly:

```cpp id="nzv46c"
vix::threadpool::CancellationSource source;
auto token = source.token();

vix::threadpool::ParallelPipelineOptions options;
options.task_options.set_cancellation(token);

vix::threadpool::parallel_pipeline(
  pool,
  options,
  [token](){
    while (has_more_work())
    {
      if (token.stop_requested())
      {
        return;
      }

      process_next_item();
    }
  },
  [token](){
    while (has_more_background_work())
    {
      if (token.stop_requested())
      {
        return;
      }

      process_background_item();
    }
  }
);
```

The stage itself chooses where it is safe to stop.

See [Cancellation](/modules/threadpool/cancellation).

## Deadline

A common deadline can be applied to every stage:

```cpp id="7d93jo"
options.task_options.set_deadline(
  vix::threadpool::Deadline::after(
    std::chrono::seconds{1}
  )
);
```

All stages receive the same absolute deadline value.

A stage that remains queued until after that deadline can be skipped by `ThreadPool::submit()`.

Its Future then contains a timeout error.

The complete pipeline eventually throws after consuming all stage Futures.

See [Deadlines](/modules/threadpool/deadlines).

## Timeout

A timeout can also be configured:

```cpp id="e47nkq"
options.task_options.set_timeout(
  vix::threadpool::Timeout::milliseconds(100)
);
```

Each stage receives its own low-level execution-duration observation.

Conceptually:

```text id="np4d5m"
stage A → timeout observation
stage B → timeout observation
stage C → timeout observation
```

This is not one global timeout for the complete pipeline.

The current `submit()` timeout semantics can also produce a successful Future while the low-level task is recorded as timed out.

See [Timeouts](/modules/threadpool/timeouts).

## Stage callables are individually owned

The direct variadic `parallel_pipeline` overload decays and captures each stage separately into its generated task.

Conceptually:

```text id="8zqbx9"
stage A object
    ↓
move or copy into stage A task

stage B object
    ↓
move or copy into stage B task
```

The direct API does not create one shared callable object for all stages.

Each stage is its own callable.

This differs from chunk algorithms such as `parallel_for`, where one callable can be shared across generated chunks.

## Move-only stages

Because each direct stage is captured from the forwarded callable into its task wrapper, the direct `parallel_pipeline` API can work with move-only stage objects when they otherwise satisfy the submission requirements.

For example, a lambda can own move-only state:

```cpp id="mgdoq5"
auto value = std::make_unique<int>(42);

vix::threadpool::parallel_pipeline(
  pool,
  [value = std::move(value)](){
    consume(*value);
  }
);
```

The stage is moved into the pipeline submission path.

The reusable `Pipeline` builder has different storage requirements because it stores stages as `std::function<void()>`.

## Exception propagation

If a stage throws:

```cpp id="yq3m6o"
vix::threadpool::parallel_pipeline(
  pool,
  [](){
    perform_first_operation();
  },
  [](){
    throw std::runtime_error{"stage failed"};
  },
  [](){
    perform_third_operation();
  }
);
```

the exception is stored in that stage's Future.

The pipeline later rethrows an exception to the caller.

## One failure does not stop Future consumption

The implementation catches exceptions from individual `Future::get()` calls.

For example:

```text id="k9th2u"
Future A
   ↓
success

Future B
   ↓
throws
   ↓
remember exception

Future C
   ↓
get()

Future D
   ↓
get()

all Futures consumed
   ↓
rethrow remembered exception
```

The pipeline waits for all already submitted stages before propagating the remembered failure.

## Other stages are not automatically cancelled

Suppose:

```text id="b0efcf"
stage A → throws
stage B → running
stage C → queued
stage D → running
```

the failure of A does not automatically cancel B, C, and D.

They continue according to normal ThreadPool behavior.

The pipeline consumes all their Futures before returning or throwing.

Use an explicit shared cancellation state if stages should cooperate on stopping after an application-level failure.

## First encountered exception

Stage Futures are stored in submission order.

They are consumed in that same order.

The retained exception is therefore the first one encountered while traversing those Futures.

It is not necessarily the first stage that failed in wall-clock time.

For example:

```text id="lwbgz9"
stage C fails first in time
stage A fails later

Future consumption:
A
B
C
```

the exception from stage A can be encountered first.

Treat the propagated exception as:

```text id="xrisqy"
first exception encountered
during Future consumption
```

not as a temporal ordering of failures.

## Rejected stage submission

Stages are submitted through:

```cpp id="04o84g"
pool.submit(...);
```

If the pool rejects one stage, its returned `Future<void>` contains a rejection result.

Later:

```cpp id="2wggrr"
future.get();
```

throws `std::system_error`.

That error enters the same exception collection path:

```text id="7tjj3x"
stage rejected
      ↓
Future error
      ↓
get() throws
      ↓
remember exception
      ↓
consume remaining Futures
      ↓
rethrow
```

Queue limits and pool lifecycle therefore apply normally.

## Bounded queues

A pipeline submits all stages before waiting.

With many stages and a small per-worker queue capacity:

```cpp id="eb95vc"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_queue_size = 1;

vix::threadpool::ThreadPool pool(config);
```

some stage submissions can be rejected under sufficient pressure.

`parallel_pipeline` does not provide its own admission queue.

Every stage uses the normal ThreadPool scheduler and local worker queues.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Existing pool remains running

When an existing pool is supplied:

```cpp id="h22ec7"
vix::threadpool::ThreadPool pool(4);

vix::threadpool::parallel_pipeline(
  pool,
  first_stage,
  second_stage
);
```

the pool remains running after the pipeline returns.

It can immediately be reused:

```cpp id="gezl8n"
auto future = pool.submit([](){
  return 42;
});
```

The pipeline never shuts down an externally supplied pool.

## Temporary-pool overload

An explicit pool is optional:

```cpp id="p8c06v"
vix::threadpool::parallel_pipeline(
  [](){
    perform_first_operation();
  },
  [](){
    perform_second_operation();
  }
);
```

This creates a default `ThreadPool` internally.

Conceptually:

```text id="9jyzeg"
parallel_pipeline(stages...)
          ↓
create default ThreadPool
          ↓
submit stages
          ↓
consume all Futures
          ↓
return or rethrow
          ↓
temporary pool destroyed
```

## Temporary pool with options

Options can also be used without an explicit pool:

```cpp id="yttfx5"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

vix::threadpool::parallel_pipeline(
  options,
  [](){
    perform_first_operation();
  },
  [](){
    perform_second_operation();
  }
);
```

A temporary default ThreadPool is created and all stages receive the supplied task options.

## Reuse an existing pool

For repeated concurrent stage groups:

```cpp id="hoh3mc"
vix::threadpool::ThreadPool pool(4);

vix::threadpool::parallel_pipeline(
  pool,
  first_a,
  first_b
);

vix::threadpool::parallel_pipeline(
  pool,
  second_a,
  second_b
);
```

reuses the same worker runtime.

Using temporary-pool overloads creates a new pool for each call.

## Pipeline builder

For stages assembled progressively, the module provides:

```cpp id="089nm9"
vix::threadpool::Pipeline
```

For example:

```cpp id="xbtkxc"
vix::threadpool::Pipeline pipeline;

pipeline
  .add([](){
    load_config();
  })
  .add([](){
    warm_cache();
  })
  .add([](){
    prepare_metrics();
  });

pipeline.run(pool);
```

`Pipeline` stores the stages and can execute them later.

## Pipeline stores `std::function<void()>`

The stage type is:

```cpp id="k7dfja"
using Stage = std::function<void()>;
```

The builder therefore stores a vector of:

```cpp id="tgxzro"
std::function<void()>
```

objects.

This is different from the direct variadic API, where each callable type is preserved while being forwarded into its task wrapper.

## Builder stage requirements

Because `Pipeline` stores stages in `std::function<void()>`, a stage added to the builder must satisfy the storage requirements of `std::function`.

In normal C++20 use, this means the stored callable must be copy-constructible.

A move-only lambda such as one owning a `std::unique_ptr` does not fit the reusable builder's current `std::function<void()>` storage model.

Use direct `parallel_pipeline()` when preserving a move-only stage is required.

## Add a stage

Use:

```cpp id="gid41t"
pipeline.add([](){
  perform_work();
});
```

`add()` returns:

```cpp id="i2z9yl"
Pipeline&
```

which allows chaining:

```cpp id="jypfjh"
pipeline
  .add(first_stage)
  .add(second_stage)
  .add(third_stage);
```

Stages are stored in registration order.

## Inspect stage count

Use:

```cpp id="3t4r6x"
const std::size_t count = pipeline.size();
```

For:

```cpp id="42yn08"
vix::threadpool::Pipeline pipeline;

pipeline.add(first_stage);
pipeline.add(second_stage);
```

the count is:

```text id="51yzvr"
2
```

## Check whether the Pipeline is empty

Use:

```cpp id="4gm068"
if (pipeline.empty())
{
  // No stages are registered.
}
```

A new builder is empty:

```text id="7vykdt"
size()  0
empty() true
```

After one `add()`:

```text id="i3km0k"
size()  1
empty() false
```

## Clear registered stages

Use:

```cpp id="ppc8h5"
pipeline.clear();
```

Afterward:

```text id="bnl9gy"
size()  0
empty() true
```

`clear()` removes the stored stages.

It does not affect tasks from an earlier `run()` that have already completed or are executing in another thread.

Ordinary `run()` itself waits for all tasks before returning.

## Configure the builder

Construct a pipeline with options:

```cpp id="j56iiw"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

vix::threadpool::Pipeline pipeline(options);
```

Every stage executed by that builder uses those options.

## Read builder options

Use:

```cpp id="af5p60"
const auto& options = pipeline.options();
```

The returned value is a const reference to the builder's stored:

```cpp id="jii4m7"
vix::threadpool::ParallelPipelineOptions
```

Inspect the nested task options through that object.

## Replace builder options

Use:

```cpp id="o8y3zh"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::highest
);

pipeline.set_options(options);
```

Future calls to:

```cpp id="fsp11r"
pipeline.run(...);
```

use the new configuration.

Existing stages remain registered.

## `set_options()` does not modify stages

This:

```cpp id="nb2qgk"
pipeline.set_options(options);
```

changes only:

```text id="otg17a"
pipeline execution options
```

It does not:

```text id="33avoo"
add stages
remove stages
execute stages
```

The same stored stage set can therefore be run under new task options.

## Run the builder

Execute stored stages with:

```cpp id="tmz05j"
pipeline.run(pool);
```

The builder follows the same execution shape as the direct function:

```text id="dc5d23"
registered stages
      ↓
submit each stage
      ↓
store Future<void>
      ↓
consume every Future
      ↓
rethrow first encountered exception if any
```

The call is synchronous at the boundary.

When `run(pool)` returns, its generated Futures have all been consumed.

## Empty builder execution

Running an empty builder:

```cpp id="3goovt"
vix::threadpool::Pipeline pipeline;

pipeline.run(pool);
```

is a no-op.

No tasks are submitted.

No special empty check is required because the internal stage loop simply has no entries.

## Builder stages remain registered after `run()`

`run()` does not clear the pipeline.

For example:

```cpp id="jdd33m"
vix::threadpool::Pipeline pipeline;

pipeline.add([](){
  perform_work();
});

pipeline.run(pool);
pipeline.run(pool);
```

executes the registered stage twice, once during each call to `run()`.

Conceptually:

```text id="42ylj1"
stored stages
    ↓
run #1
    ↓
stages remain
    ↓
run #2
```

Call:

```cpp id="hda2j7"
pipeline.clear();
```

when the stored stage set should be removed.

## Builder stages are copied for each run

During `Pipeline::run()`, each stored `std::function<void()>` stage is copied into the submitted task wrapper:

```text id="qhrpp1"
stored Stage
     ↓
copy into task wrapper
     ↓
ThreadPool::submit()
```

The stored stage object therefore remains in the pipeline for future executions.

This is part of what makes `Pipeline` reusable.

## Repeated execution and captured state

Because stages remain registered, captures also remain part of those stored callables.

For example:

```cpp id="fda28c"
int count = 0;

vix::threadpool::Pipeline pipeline;

pipeline.add([&count](){
  ++count;
});

pipeline.run(pool);
pipeline.run(pool);
```

the same captured reference is used during both runs.

The caller is responsible for ensuring captured references remain valid for every execution.

## Builder temporary-pool execution

A `Pipeline` can execute without an explicit pool:

```cpp id="jhs6pv"
vix::threadpool::Pipeline pipeline;

pipeline
  .add(first_stage)
  .add(second_stage);

pipeline.run();
```

`run()` creates a default temporary `ThreadPool` and forwards to:

```cpp id="dhbp7h"
pipeline.run(pool);
```

The temporary pool is destroyed after all stage Futures have been consumed.

## Builder exceptions

`Pipeline::run()` uses the same exception strategy as `parallel_pipeline()`.

If multiple stages fail:

```text id="alxx1c"
stage A → exception A
stage B → exception B
stage C → success
```

the builder still consumes every Future.

It then rethrows the first exception encountered in stage-submission order.

The pipeline's registered stages remain stored even after `run()` throws.

A later call to `run()` can execute them again.

## Builder rejection

Because `Pipeline::run()` also uses:

```cpp id="ik09h4"
pool.submit(...)
```

a rejected stage produces a rejected Future.

That error is captured during:

```cpp id="nt7fs2"
future.get();
```

and enters the same first-exception path.

A failed `run()` does not automatically remove the rejected stage from the reusable builder.

## Direct API vs Pipeline builder

Use direct `parallel_pipeline()` when stages are known at the call site:

```cpp id="f0b1z4"
vix::threadpool::parallel_pipeline(
  pool,
  first_stage,
  second_stage,
  third_stage
);
```

Use `Pipeline` when stages are assembled incrementally or should be executed repeatedly:

```cpp id="5dm6q4"
vix::threadpool::Pipeline pipeline;

pipeline.add(first_stage);

if (condition)
{
  pipeline.add(optional_stage);
}

pipeline.add(last_stage);

pipeline.run(pool);
```

The conceptual distinction is:

```text id="4lzdq5"
parallel_pipeline()
  stage set belongs to one call


Pipeline
  stage set stored as reusable object
```

## Pipeline is not a dependency graph

Neither API models dependencies such as:

```text id="ynv2lh"
A must finish before B
B must produce data for C
C can start after A and B
```

All registered stages are independent from the execution abstraction's perspective.

If dependencies exist, represent them explicitly with:

```text id="dkl742"
Future values
separate submit() operations
Scopes
application synchronization
another dependency-aware abstraction
```

Do not depend on pipeline stage registration order.

## Pipeline is not streaming

The current pipeline does not process a stream through repeated transformations such as:

```text id="g1wk73"
item
 ↓
stage 1
 ↓
stage 2
 ↓
stage 3
```

It is closer to:

```text id="s7bbwv"
independent operation 1
independent operation 2
independent operation 3
        ↓
execute concurrently
        ↓
join
```

This distinction is important when choosing the abstraction.

## Shared mutable state

Independent stages can still access shared application state.

For example:

```cpp id="0vqqh9"
int value = 0;

vix::threadpool::parallel_pipeline(
  pool,
  [&value](){
    ++value;
  },
  [&value](){
    ++value;
  }
);
```

can contain a data race because both stages can execute concurrently.

Use appropriate synchronization:

```cpp id="o70hov"
std::atomic<int> value{0};

vix::threadpool::parallel_pipeline(
  pool,
  [&value](){
    value.fetch_add(1, std::memory_order_relaxed);
  },
  [&value](){
    value.fetch_add(1, std::memory_order_relaxed);
  }
);
```

The pipeline coordinates task execution, not application memory access.

## Stage concurrency depends on the pool

A pipeline with four stages does not guarantee that four stages execute simultaneously.

For example:

```cpp id="jzo2hz"
vix::threadpool::ThreadPool pool(2);
```

with:

```text id="efwr93"
4 stages
2 workers
```

can execute approximately as:

```text id="aoyq38"
Worker 1 → stage A
Worker 2 → stage B

then

Worker 1 → stage C
Worker 2 → stage D
```

Actual scheduling depends on queue state, task options, and other work already present in the pool.

`parallel_pipeline` provides concurrency opportunities, not a fixed degree of simultaneous execution.

## Other pool work can interleave

Generated stages are ordinary ThreadPool tasks.

If the pool already contains unrelated tasks:

```text id="0c69fj"
existing task
pipeline stage A
pipeline stage B
existing task
pipeline stage C
```

the scheduler and local queue priorities determine execution.

Pipeline stages do not receive an isolated worker group.

They participate in the same runtime as other submitted work.

## Calling from a worker

`parallel_pipeline` waits synchronously for all stage Futures.

If a task running on a pool calls the pipeline using that same pool:

```text id="w1b0kd"
Worker
  ↓
outer task
  ↓
parallel_pipeline(same pool)
  ↓
submit stages
  ↓
wait for stages
```

the outer worker remains occupied while waiting.

The stages require other available workers to execute.

## Nested pipeline deadlock

If every worker becomes blocked waiting for stages submitted back to the same pool:

```text id="755kpw"
Worker 1 → outer task waiting
Worker 2 → outer task waiting
Worker 3 → outer task waiting
Worker 4 → outer task waiting

pipeline stages
      ↓
queued
```

no worker remains available to run the pipeline stages.

Avoid saturating a pool with tasks that synchronously submit and wait for additional work on the same pool.

## Convenience namespace

The direct explicit-pool API is also available as:

```cpp id="bijvli"
vix::threadpool::parallel::pipeline(
  pool,
  first_stage,
  second_stage,
  third_stage
);
```

This forwards to:

```cpp id="om7s7z"
vix::threadpool::parallel_pipeline(
  pool,
  first_stage,
  second_stage,
  third_stage
);
```

## Convenience namespace with options

Explicit options are also supported:

```cpp id="lemrt9"
vix::threadpool::ParallelPipelineOptions options;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

vix::threadpool::parallel::pipeline(
  pool,
  options,
  first_stage,
  second_stage
);
```

The current `parallel::pipeline()` convenience namespace provides explicit-pool forms.

Use top-level:

```cpp id="kch20r"
vix::threadpool::parallel_pipeline(...)
```

when a temporary-pool overload is required.

## Complete example

```cpp id="o4poh2"
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::atomic<int> completed{0};

  vix::threadpool::parallel_pipeline(
    pool,
    [&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    },
    [&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    },
    [&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    },
    [&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    }
  );

  return completed.load(std::memory_order_relaxed) == 4 ? 0 : 1;
}
```

The pipeline returns only after all four stage Futures have been consumed.

## Builder example

```cpp id="7kl5e4"
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);
  std::atomic<int> completed{0};

  vix::threadpool::Pipeline pipeline;

  pipeline
    .add([&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    })
    .add([&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    })
    .add([&completed](){
      completed.fetch_add(1, std::memory_order_relaxed);
    });

  pipeline.run(pool);

  if (pipeline.size() != 3)
  {
    return 1;
  }

  return completed.load(std::memory_order_relaxed) == 3 ? 0 : 1;
}
```

`run()` does not remove the registered stages.

## Direct execution model

The direct algorithm is:

```text id="c0hs8d"
parallel_pipeline(pool, options, stages...)
                   ↓
               no stages?
                ┌───┴───┐
               yes      no
                │        │
              return     ▼
                  submit stage 1
                  submit stage 2
                  submit stage N
                         ↓
                    Future<void>
                    Future<void>
                    Future<void>
                         ↓
                 consume all Futures
                         ↓
                exception captured?
                   ┌─────┴─────┐
                  yes          no
                   │            │
                rethrow       return
```

## Builder execution model

`Pipeline` adds reusable storage:

```text id="s2h417"
Pipeline
  │
  ├── Stage 1
  ├── Stage 2
  ├── Stage N
  │
  └── ParallelPipelineOptions
             ↓
          run(pool)
             ↓
      copy stages into tasks
             ↓
        submit all stages
             ↓
       consume all Futures
             ↓
      return or rethrow
             ↓
    stages remain registered
```

The important properties are:

- `parallel_pipeline` runs independent stages concurrently.
- It is not a sequential data-processing pipeline.
- There is no automatic value passing between stages.
- Stage return values are discarded.
- Stages are submitted in argument order, but execution order is not guaranteed.
- All stages are submitted before Future consumption begins.
- Each stage becomes an ordinary `ThreadPool::submit()` operation.
- A call with no stages performs no work.
- `ParallelPipelineOptions` currently contains shared `TaskOptions`.
- The same task options are applied to every stage.
- One shared affinity can route all stages to one worker and serialize them.
- Cancellation, deadlines, timeouts, priorities, queue limits, and rejection use normal ThreadPool semantics.
- A stage failure does not automatically cancel other stages.
- Every submitted Future is consumed before the first encountered exception is rethrown.
- A rejected stage submission propagates through the same Future exception path.
- The top-level API provides temporary-pool overloads.
- The direct variadic API can preserve move-only stage callables through forwarding and capture.
- `Pipeline` provides reusable stage storage.
- `Pipeline::Stage` is `std::function<void()>`, so the builder uses copyable callable storage.
- `Pipeline::add()` returns `Pipeline&` for chaining.
- `Pipeline::run()` does not clear registered stages.
- The same builder can be executed repeatedly.
- `Pipeline::clear()` explicitly removes all stored stages.
- Builder options can be read with `options()` and replaced with `set_options()`.
- `Pipeline::run()` can use an existing pool or a temporary default pool.
- Pipeline stages share the same ThreadPool with unrelated runtime work.
- Shared mutable application state must still be synchronized.
- Calling a blocking pipeline from every worker of the same saturated pool can exhaust the workers and deadlock nested work.
- `parallel::pipeline()` provides convenience forwarding for explicit-pool forms.

Continue with [Periodic Tasks](/modules/threadpool/periodic-tasks) for work that is resubmitted repeatedly over time.
