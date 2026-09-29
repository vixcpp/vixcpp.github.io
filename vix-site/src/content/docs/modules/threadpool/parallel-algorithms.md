# Parallel Algorithms

The ThreadPool module provides higher-level algorithms for dividing work into tasks, submitting those tasks to a `ThreadPool`, and waiting for their results.

The main algorithms are:

```text
parallel_for
parallel_for_each
parallel_map
parallel_reduce
parallel_pipeline
```

They build on the same task execution model used by ordinary `submit()` calls.

```text
input work
    ↓
divide into tasks
    ↓
ThreadPool::submit()
    ↓
workers execute tasks
    ↓
wait for Futures
    ↓
return or propagate failure
```

Parallel algorithms do not create a separate execution runtime.

## Choose an algorithm

Use `parallel_for` for an integral index range:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);
```

Use `parallel_for_each` for elements in an iterator range or container:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          value *= 2;
        }
);
```

Use `parallel_map` when every input element produces an output value:

```cpp
auto result = vix::threadpool::parallel_map(
        pool,
        values,
        [](int value){
          return value * 2;
        }
);
```

Use `parallel_reduce` to combine a range into one value:

```cpp
const int result = vix::threadpool::parallel_reduce(
        pool,
        values,
        0,
        [](int current, int value){
          return current + value;
        }
);
```

Use `parallel_pipeline` to run several independent stages concurrently:

```cpp
vix::threadpool::parallel_pipeline(
        pool,
        [](){
          perform_first_stage();
        },
        [](){
          perform_second_stage();
        },
        [](){
          perform_third_stage();
        }
);
```

Each algorithm is covered in detail on its dedicated page.

## Existing pool or temporary pool

Most parallel algorithms provide two execution forms.

You can provide an existing `ThreadPool`:

```cpp
vix::threadpool::ThreadPool pool(4);

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);
```

or use an overload that creates a temporary pool internally:

```cpp
vix::threadpool::parallel_for(
        0,
        100,
        [](int index){
          process(index);
        }
);
```

The temporary-pool form is conceptually:

```text
parallel algorithm
      ↓
construct default ThreadPool
      ↓
divide and submit work
      ↓
wait for all generated tasks
      ↓
destroy temporary pool
      ↓
return
```

Use an existing pool when several operations should share the same worker runtime.

Use the temporary-pool overload for isolated parallel work when managing a pool explicitly is unnecessary.

## Algorithms are synchronous at the call boundary

The algorithms use ThreadPool tasks internally, but the algorithm call itself waits for those generated tasks.

For example:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);

// Generated chunk tasks have finished here.
```

The internal execution is concurrent:

```text
caller
  ↓
parallel_for()
  ↓
submit chunk A ──► worker
submit chunk B ──► worker
submit chunk C ──► worker
submit chunk D ──► worker
  ↓
wait for Futures
  ↓
return
```

The caller does not receive the individual chunk Futures.

The algorithm manages them internally.

## Work is divided into chunks

`parallel_for`, `parallel_for_each`, `parallel_map`, and `parallel_reduce` divide their input into chunks.

One chunk becomes one submitted ThreadPool task.

For example:

```text
input:
0 1 2 3 4 5 6 7

chunk size = 2

chunks:
[0 1]
[2 3]
[4 5]
[6 7]
```

The runtime then submits four tasks:

```text
chunk 1 ──► ThreadPool
chunk 2 ──► ThreadPool
chunk 3 ──► ThreadPool
chunk 4 ──► ThreadPool
```

Each chunk task processes several elements sequentially on one worker.

## Chunking reduces submission overhead

Submitting one task for every element is not always efficient.

For a range containing one million items:

```text
one task per item
      ↓
1,000,000 task submissions
```

Chunking can instead produce:

```text
many items
   ↓
smaller number of chunk tasks
   ↓
each task processes several items
```

The balance is between:

```text
smaller chunks
  more task-level parallelism
  more scheduling overhead

larger chunks
  fewer task submissions
  less scheduling overhead
  less opportunity for parallel distribution
```

The correct chunk size depends on the workload.

## Automatic chunk size

A `chunk_size` of zero selects the chunk size automatically.

This is the default:

```cpp
vix::threadpool::ParallelForOptions options;

options.chunk_size == 0;
```

The shared chunk-size calculation is:

```text
target chunks = worker count × 4

chunk size =
ceil(total items / target chunks)
```

with a minimum result of one.

For example:

```text
total items  = 100
workers      = 4
target chunks = 16

chunk size =
ceil(100 / 16)
= 7
```

The exact number of generated chunks can therefore be larger than the worker count.

Workers process those chunks through the normal scheduler.

## Explicit chunk size

Each chunk-based algorithm provides an options type with `chunk_size`.

For `parallel_for`:

```cpp
vix::threadpool::ParallelForOptions options =
        vix::threadpool::ParallelForOptions::with_chunk_size(8);
```

For `parallel_for_each`:

```cpp
vix::threadpool::ParallelForEachOptions options =
        vix::threadpool::ParallelForEachOptions::with_chunk_size(8);
```

For `parallel_map`:

```cpp
vix::threadpool::ParallelMapOptions options =
        vix::threadpool::ParallelMapOptions::with_chunk_size(8);
```

For `parallel_reduce`:

```cpp
vix::threadpool::ParallelReduceOptions options =
        vix::threadpool::ParallelReduceOptions::with_chunk_size(8);
```

A positive requested chunk size is used directly.

For example:

```text
total items = 10
chunk size  = 4

generated chunks:
4
4
2
```

The final chunk can contain fewer elements than the requested size.

## TaskOptions for chunk tasks

Each chunk-based options type also contains:

```cpp
vix::threadpool::TaskOptions task_options;
```

These options are passed to every generated chunk task.

For example:

```cpp
vix::threadpool::ParallelForOptions options;
options.chunk_size = 8;
options.task_options.set_priority(
        vix::threadpool::TaskPriority::high
);

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        },
        options
);
```

Every generated chunk is submitted with high priority.

The same mechanism can carry:

```text
priority
cancellation
deadline
timeout
worker affinity
```

The normal `TaskOptions` semantics still apply.

See [Tasks and Options](/modules/threadpool/tasks).

## Task options apply per chunk

Task options describe each generated task, not the complete algorithm as one indivisible task.

Suppose:

```text
100 elements
chunk size = 10
```

The algorithm generates approximately:

```text
10 chunk tasks
```

If the options specify:

```cpp
options.task_options.set_priority(
        vix::threadpool::TaskPriority::high
);
```

then all ten tasks receive that priority.

Likewise, if they share one cancellation token:

```text
chunk 1 ──┐
chunk 2 ──┤
chunk 3 ──┼──► same cancellation state
chunk 4 ──┘
```

a cancellation request can be observed by multiple chunks.

## Affinity can reduce parallelism

Task options can also specify worker affinity.

For example:

```cpp
options.task_options.set_affinity(
        vix::threadpool::WorkerId{2}
);
```

Because the same options are used for every generated chunk, all chunks target the same worker.

Conceptually:

```text
chunk A ──┐
chunk B ──┤
chunk C ──┼──► Worker 2
chunk D ──┘
```

One worker executes one task at a time.

Using one affinity value for all chunks can therefore remove much of the parallelism the algorithm was intended to provide.

For ordinary parallel algorithms, leave affinity unset unless worker placement is specifically required.

## The callable can be invoked concurrently

Chunk-based algorithms store one shared callable object and use it from several chunk tasks.

Conceptually:

```text
                 shared callable
                ▲      ▲      ▲
                │      │      │
             chunk A chunk B chunk C
```

Different workers can therefore invoke the same callable object concurrently.

For a stateless lambda:

```cpp
[](int value){
  return value * 2;
}
```

this is normally straightforward.

For a callable with mutable internal state, the caller must ensure concurrent invocation is safe.

For example, avoid relying on unsynchronized mutation inside the function object.

## Captured application state also needs synchronization

Parallel execution does not make shared application state automatically thread-safe.

For example:

```cpp
int counter = 0;

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [&counter](int){
          ++counter;
        }
);
```

can introduce a data race because several workers may modify `counter` concurrently.

Use appropriate synchronization:

```cpp
std::atomic<int> counter{0};

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [&counter](int){
          counter.fetch_add(1, std::memory_order_relaxed);
        }
);
```

or design the operation so different tasks write to independent memory.

The algorithms provide execution parallelism, not automatic synchronization of user data.

## `parallel_for`

`parallel_for` executes an integral half-open range:

```text
[first, last)
```

For example:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        4,
        [](int index){
          process(index);
        }
);
```

invokes the callable for:

```text
0
1
2
3
```

The upper bound is excluded.

The index type must be integral.

## Empty and reversed numeric ranges

When:

```text
last <= first
```

`parallel_for` returns without submitting work.

For example:

```cpp
vix::threadpool::parallel_for(
        pool,
        10,
        10,
        [](int index){
          process(index);
        }
);
```

does nothing.

The same applies to:

```cpp
vix::threadpool::parallel_for(
        pool,
        10,
        5,
        [](int index){
          process(index);
        }
);
```

The algorithm does not interpret this as a descending range.

See [Parallel For](/modules/threadpool/parallel-for).

## `parallel_for_each`

`parallel_for_each` applies a callable to every element in an iterator range or container.

For example:

```cpp
std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          value *= 2;
        }
);
```

After the call:

```text
2
4
6
8
```

The elements can be processed concurrently and the order in which callbacks execute is not a sequential iteration guarantee.

## Iterator support

`parallel_for_each`, `parallel_map`, and `parallel_reduce` support iterator ranges.

Random-access iterators can locate chunk boundaries directly.

For example:

```text
vector
deque
```

Non-random-access iterators are also supported.

For example:

```text
list
```

For those iterators, discovering the range length and chunk boundaries requires traversal.

Conceptually:

```text
random-access range
      ↓
jump directly to chunk positions


non-random-access range
      ↓
advance iterators linearly
to discover chunk positions
```

The algorithm remains valid, but chunk-discovery overhead can be higher.

## Container lifetime

Parallel range algorithms keep iterators or references into the supplied range while chunk tasks execute.

The container must therefore remain alive and structurally valid until the algorithm returns.

Because the algorithm itself waits for its generated tasks, this is naturally satisfied by ordinary usage:

```cpp
std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);

// All generated tasks are finished here.
```

User callbacks should not perform unsynchronized structural modifications that invalidate iterators being used by other chunks.

See [Parallel For Each](/modules/threadpool/parallel-for-each).

## `parallel_map`

`parallel_map` applies a transformation to each input element and returns a `std::vector` of results.

```cpp
std::vector<int> values{1, 2, 3, 4};

auto result = vix::threadpool::parallel_map(
        pool,
        values,
        [](int value){
          return value * value;
        }
);
```

The result is:

```text
1
4
9
16
```

The result type is inferred from the mapping callable.

For example:

```cpp
std::vector<int> values{1, 2, 3};

auto result = vix::threadpool::parallel_map(
        pool,
        values,
        [](int value){
          return std::to_string(value);
        }
);
```

returns a:

```cpp
std::vector<std::string>
```

## Map preserves input order

Chunk tasks can execute in any worker order, but `parallel_map` writes results into positions corresponding to the original input.

Conceptually:

```text
input:
A B C D

execution:
C finishes
A finishes
D finishes
B finishes

output:
map(A) map(B) map(C) map(D)
```

The output order matches the input order.

See [Parallel Map](/modules/threadpool/parallel-map).

## `parallel_reduce`

`parallel_reduce` combines a range into one accumulator value.

For example:

```cpp
std::vector<int> values{1, 2, 3, 4};

const int result = vix::threadpool::parallel_reduce(
        pool,
        values,
        0,
        [](int current, int value){
          return current + value;
        }
);
```

With zero as the additive identity, the result is:

```text
10
```

The algorithm works in two levels:

```text
input range
    ↓
divide into chunks
    ↓
reduce each chunk on workers
    ↓
partial values
    ↓
combine partial values on caller thread
    ↓
final result
```

## Current reduction initial-value semantics

The current implementation starts every chunk reduction from the supplied `initial` value.

It then starts the final partial-value combination from `initial` again.

Conceptually:

```text
chunk A:
initial + elements in A
       ↓
partial A

chunk B:
initial + elements in B
       ↓
partial B

final:
initial + partial A + partial B
```

This means the supplied initial value is applied multiple times when more than one chunk exists.

For the current implementation, use an identity value for the reduction operation.

Examples include:

```text
addition        → 0
multiplication  → 1
string append   → empty string
```

For example:

```cpp
const int result = vix::threadpool::parallel_reduce(
        pool,
        values,
        0,
        [](int current, int value){
          return current + value;
        }
);
```

uses the additive identity.

A non-neutral initial value currently changes the result once per chunk in addition to the final combination.

The exact reduction behavior is covered in [Parallel Reduce](/modules/threadpool/parallel-reduce).

## Reduction ordering

Parallel reduction does not perform one sequential left-to-right fold over the original range.

It performs:

```text
local reductions
      +
partial-result reduction
```

The reduction function should therefore be suitable for grouping work into independent chunks.

Operations whose result changes according to grouping or execution structure require additional care.

## `parallel_pipeline`

`parallel_pipeline` runs independent callable stages concurrently.

```cpp
vix::threadpool::parallel_pipeline(
        pool,
        [](){
          load_data();
        },
        [](){
          refresh_cache();
        },
        [](){
          update_index();
        }
);
```

All stages are submitted before the algorithm begins waiting for them.

Conceptually:

```text
stage A ──► worker
stage B ──► worker
stage C ──► worker
   │
   └──── caller waits for all
```

## Pipeline stages are independent

The current `parallel_pipeline` is not a sequential data pipeline.

It does not mean:

```text
stage A
   ↓
output passed to stage B
   ↓
output passed to stage C
```

Instead, it means:

```text
stage A ──┐
stage B ──┼──► execute independently in parallel
stage C ──┘
```

Stage order is not guaranteed.

Stages have no automatic input-output relationship with each other.

If one operation depends on another, express that dependency explicitly instead of relying on `parallel_pipeline`.

See [Parallel Pipeline](/modules/threadpool/parallel-pipeline).

## Pipeline builder

The module also provides `Pipeline` for assembling independent stages incrementally.

```cpp
vix::threadpool::Pipeline pipeline;

pipeline
  .add([](){
    perform_first_operation();
  })
  .add([](){
    perform_second_operation();
  })
  .add([](){
    perform_third_operation();
  });

pipeline.run(pool);
```

The registered stages remain in the pipeline after execution and can be run again.

The builder also exposes:

```text
add()
clear()
size()
empty()
options()
set_options()
run()
```

Like `parallel_pipeline`, its stages are independent and run concurrently.

## Convenience namespace

The module also provides the `vix::threadpool::parallel` namespace.

It forwards to the same parallel algorithms with shorter operation names.

For example:

```cpp
vix::threadpool::parallel::for_range(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);
```

corresponds to:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);
```

Other convenience functions include:

```text
parallel::for_each()
parallel::map()
parallel::reduce()
parallel::pipeline()
```

They use the same implementations and semantics as the corresponding top-level APIs.

## Exception propagation

The parallel algorithms wait for all generated tasks even when one of them fails.

For chunk-based algorithms, the pattern is:

```text
submit all chunks
      ↓
Future 1 get()
Future 2 get()
Future 3 get()
...
      ↓
remember first encountered exception
      ↓
continue consuming every Future
      ↓
all submitted chunks finished
      ↓
rethrow remembered exception
```

For example:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          if (index == 42)
          {
            throw std::runtime_error("failure");
          }
        }
);
```

can throw `std::runtime_error` to the caller.

The algorithm still waits for the other submitted chunks before propagating the remembered exception.

## Failure does not automatically cancel other chunks

When one chunk fails:

```text
chunk A → failure
chunk B → running
chunk C → queued
chunk D → running
```

the algorithm does not automatically request cancellation of B, C, and D.

It continues waiting for every submitted Future.

This preserves a clear synchronization boundary:

```text
parallel algorithm returns or throws
      ↓
all generated Futures have been consumed
```

Use an explicit shared cancellation token when remaining work should observe a cancellation request.

## "First exception" means consumption order

Generated Futures are stored in chunk-submission order.

The algorithm consumes those Futures in that order and stores the first exception encountered during that traversal.

Therefore, the propagated exception is not necessarily the task that failed first in wall-clock time.

For concurrent execution:

```text
chunk C fails first in time
chunk A fails later

Future consumption order:
A
B
C
```

the exception encountered from A can be retained before C is inspected.

Treat the propagated exception as:

```text
first exception encountered while consuming
the generated Futures
```

not as a global timestamp ordering of failures.

## ThreadPool rejection is also propagated

Parallel algorithms use `ThreadPool::submit()` for their generated tasks.

If one generated submission is rejected, its Future contains a ThreadPool rejection error.

Calling `get()` on that Future throws `std::system_error`.

The parallel algorithm handles it through the same exception collection path:

```text
generated task rejected
      ↓
Future::get() throws
      ↓
exception remembered
      ↓
wait for remaining Futures
      ↓
rethrow
```

This means bounded queues and shutdown state can affect a parallel algorithm in the same way they affect ordinary result-producing submissions.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Parallel algorithms use the existing scheduler

Generated tasks are normal ThreadPool tasks.

For example:

```text
parallel_map
    ↓
chunk tasks
    ↓
ThreadPool::submit()
    ↓
Scheduler
    ↓
worker selection
    ↓
local TaskQueue
    ↓
worker threads
```

This means the normal rules continue to apply:

```text
priority is local to worker queues
affinity controls worker placement
queue capacity can reject work
cancellation is cooperative
deadlines can expire while queued
timeouts observe execution duration
```

Parallel algorithms compose the existing execution model rather than bypassing it.

## Parallel algorithms are not automatically faster

Parallel execution adds overhead:

```text
range analysis
chunk creation
task submission
scheduling
Future synchronization
```

For very small or inexpensive operations, sequential execution can be cheaper.

For example:

```text
10 trivial additions
```

may not benefit from creating several ThreadPool tasks.

Parallel algorithms are most useful when enough independent work exists to justify task scheduling and synchronization.

## Avoid nested blocking parallel work on the same pool

Parallel algorithms block the calling thread while waiting for their generated Futures.

If a worker task calls another parallel algorithm using the same pool, that worker remains occupied while waiting.

For example:

```text
Worker 1
  outer task
      ↓
  parallel_for(same pool)
      ↓
  waits for generated chunks
```

With enough nested waiting tasks and too few available workers, the pool can run out of workers capable of executing the generated inner work.

Design nested parallelism carefully.

When possible, avoid having every worker block while waiting for new tasks submitted back into the same saturated pool.

## Input operations must support concurrent access

The algorithms can access different elements of the same range concurrently.

The caller must ensure this is valid for the container and operation involved.

Typical safe patterns include:

```text
read different elements concurrently

write different existing elements concurrently
when the container permits it

produce independent output slots
```

Unsafe patterns can include unsynchronized structural changes such as:

```text
push_back()
erase()
insert()
container reallocation
```

while other chunk tasks hold iterators or references into the same container.

The ThreadPool does not synchronize container operations automatically.

## Algorithm overview

| Algorithm           | Input                       | Operation                        | Return                |
| ------------------- | --------------------------- | -------------------------------- | --------------------- |
| `parallel_for`      | Integral range              | Invoke callable for each index   | `void`                |
| `parallel_for_each` | Iterator range or container | Invoke callable for each element | `void`                |
| `parallel_map`      | Iterator range or container | Transform each element           | `std::vector<Result>` |
| `parallel_reduce`   | Iterator range or container | Reduce chunks, then partials     | `T`                   |
| `parallel_pipeline` | Independent callables       | Execute stages concurrently      | `void`                |

The common implementation model is:

```text
parallel operation
      ↓
partition work when required
      ↓
submit ordinary ThreadPool tasks
      ↓
workers execute concurrently
      ↓
consume every Future
      ↓
return result or rethrow failure
```

## Choosing the right abstraction

Use `parallel_for` when the problem is naturally indexed:

```text
for i in [first, last)
```

Use `parallel_for_each` when existing elements should be processed in place or for side effects:

```text
for each element
```

Use `parallel_map` when every input produces one corresponding output:

```text
input element
      ↓
transformation
      ↓
output element
```

Use `parallel_reduce` when many values must be combined into one:

```text
many values
    ↓
one accumulated value
```

Use `parallel_pipeline` when several independent operations should run at the same time:

```text
operation A
operation B
operation C
    ↓
wait for all
```

The detailed contracts are covered by:

- [Parallel For](/modules/threadpool/parallel-for)
- [Parallel For Each](/modules/threadpool/parallel-for-each)
- [Parallel Map](/modules/threadpool/parallel-map)
- [Parallel Reduce](/modules/threadpool/parallel-reduce)
- [Parallel Pipeline](/modules/threadpool/parallel-pipeline)
