# Parallel For

`parallel_for` executes an integral index range concurrently using a `ThreadPool`.

The callable is invoked once for every index in the half-open range:

```text
[first, last]
```

For example:

```cpp
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values(100, 0);

  vix::threadpool::parallel_for(
        pool,
        std::size_t{0},
        values.size(),
        [&values](std::size_t index){
          values[index] = static_cast<int>(index + 1);
        }
  );

  return values[41] == 42 ? 0 : 1;
}
```

`parallel_for` divides the range into chunks, submits those chunks as ordinary ThreadPool tasks, waits for all of them, and returns only after the generated work has finished.

## Half-open range

The range follows the normal C++ half-open convention:

```text
[first, last)
```

The first index is included.

The last index is excluded.

For:

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

the callable receives:

```text
0
1
2
3
```

It does not receive `4`.

## Integral index types

The index type must be an integral type.

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
```

is valid.

So is:

```cpp
vix::threadpool::parallel_for(
        pool,
        std::size_t{0},
        values.size(),
        [&values](std::size_t index){
          process(values[index]);
        }
);
```

The implementation requires:

```cpp
std::is_integral_v<Index>
```

at compile time.

`parallel_for` is therefore intended for numeric index ranges.

Use [Parallel For Each](/modules/threadpool/parallel-for-each) when iterating directly over container elements or iterator ranges.

## Empty ranges

If:

```text
last <= first
```

`parallel_for` returns immediately.

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

executes nothing.

The same applies to a reversed range:

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

`parallel_for` does not interpret this as descending iteration.

Conceptually:

```text
last <= first
      ↓
return
      ↓
no tasks submitted
```

## Work is divided into chunks

`parallel_for` does not normally submit one ThreadPool task for every index.

It divides the range into chunks.

For example:

```text
range:
[0, 10)

chunk size:
3
```

produces:

```text
chunk 1: [0, 3)
chunk 2: [3, 6)
chunk 3: [6, 9)
chunk 4: [9, 10)
```

Each chunk becomes one submitted task:

```text
[0, 3)  ──► ThreadPool task
[3, 6)  ──► ThreadPool task
[6, 9)  ──► ThreadPool task
[9, 10) ──► ThreadPool task
```

Inside each task, indices belonging to that chunk are processed sequentially.

Different chunks can execute concurrently on different workers.

## Chunk execution

Conceptually, each generated task performs:

```cpp
for (Index i = chunkFirst; i < chunkLast; ++i)
{
  fn(i);
}
```

This means parallelism happens between chunks.

Within one chunk:

```text
index A
  ↓
index B
  ↓
index C
```

are processed sequentially by the worker running that chunk.

## ParallelForOptions

`ParallelForOptions` controls chunking and the `TaskOptions` used by generated tasks.

```cpp
vix::threadpool::ParallelForOptions options;
```

Its fields are:

```cpp
std::size_t chunk_size;
vix::threadpool::TaskOptions task_options;
```

The defaults are:

```text
chunk_size   0
task_options default TaskOptions
```

A zero chunk size means automatic chunk-size selection.

## Explicit chunk size

Set a fixed number of indices per submitted task:

```cpp
vix::threadpool::ParallelForOptions options;
options.chunk_size = 8;

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

The convenience factory is:

```cpp
vix::threadpool::ParallelForOptions options =
    vix::threadpool::ParallelForOptions::with_chunk_size(8);
```

For:

```text
total = 20
chunk size = 8
```

the generated ranges are:

```text
[0, 8)
[8, 16)
[16, 20)
```

The final chunk is shortened when fewer than `chunk_size` indices remain.

## Automatic chunk size

The default:

```cpp
vix::threadpool::ParallelForOptions options;

options.chunk_size == 0;
```

requests automatic chunk-size selection.

The current calculation is:

```text
target chunks = worker count × 4

chunk size =
ceil(total indices / target chunks)
```

with a minimum chunk size of one.

For example:

```text
total indices = 100
workers       = 4

target chunks = 4 × 4
              = 16

chunk size =
ceil(100 / 16)
= 7
```

The resulting tasks cover approximately seven indices each.

## Why target more chunks than workers

The automatic strategy targets four chunks per worker rather than one.

For four workers:

```text
workers       = 4
target chunks = 16
```

This gives the scheduler several independent tasks to distribute.

Conceptually:

```text
Worker 1 ──► chunk
Worker 2 ──► chunk
Worker 3 ──► chunk
Worker 4 ──► chunk

workers finish
      ↓
take more queued chunks
```

This can provide better distribution when individual chunks do not take exactly the same amount of time.

## Automatic chunk size never returns zero

The helper:

```cpp
vix::threadpool::compute_parallel_chunk_size(
        total,
        workerCount,
        requested
);
```

always returns at least:

```text
1
```

For an empty range:

```cpp
const std::size_t chunk =
    vix::threadpool::compute_parallel_chunk_size(
        0,
        0,
        0
    );
```

the result is:

```text
1
```

The main `parallel_for` function returns before chunk calculation when the range itself is empty.

## Requested chunk size takes precedence

When a positive chunk size is supplied:

```cpp
const std::size_t chunk =
    vix::threadpool::compute_parallel_chunk_size(
        100,
        4,
        7
    );
```

the result is:

```text
7
```

The worker count is not used to override an explicit positive request.

Conceptually:

```text
requested > 0?
     │
     ├── yes → use requested
     │
     └── no  → calculate automatically
```

## Worker count fallback

The chunk-size helper also handles a worker count of zero.

If:

```text
workerCount = 0
```

it internally uses:

```text
workerCount = 1
```

before calculating automatic chunk size.

A normal running `ThreadPool` already has at least one worker, so this fallback mainly makes the helper itself safe.

## TaskOptions for generated chunks

`ParallelForOptions` contains:

```cpp
options.task_options;
```

These options are passed to every generated chunk submission.

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

Every generated chunk receives high priority.

Conceptually:

```text
ParallelForOptions
      │
      └── TaskOptions
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   chunk 1 chunk 2 chunk 3
```

Normal ThreadPool task semantics still apply.

## Priority

For example:

```cpp
options.task_options.set_priority(
        vix::threadpool::TaskPriority::high
);
```

makes every chunk high priority inside the worker queue to which it is assigned.

Priority remains local to each worker queue.

It does not guarantee one global ordering across all parallel-for chunks.

See [Priorities](/modules/threadpool/priorities).

## Cancellation

A shared cancellation token can be attached to all generated chunks:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::ParallelForOptions options;

options.task_options.set_cancellation(
        source.token()
);
```

Every chunk receives the same cancellation state.

Conceptually:

```text
CancellationSource
        │
        ▼
shared token
   ┌────┼────┐
   ▼    ▼    ▼
chunk chunk chunk
```

Cancellation can prevent chunks that have not begun their user callable from executing.

It does not forcibly interrupt arbitrary callback code already running inside a chunk.

If the callback itself must stop while processing indices, capture the token and inspect it explicitly.

## Cooperative cancellation inside the loop body

For example:

```cpp
vix::threadpool::CancellationSource source;
auto token = source.token();

vix::threadpool::ParallelForOptions options;

options.task_options.set_cancellation(token);

vix::threadpool::parallel_for(
        pool,
        0,
        1000,
        [token](int index){
          if (token.stop_requested())
          {
            return;
          }

          process(index);
        },
        options
);
```

Each invocation can decide whether further application work is still useful.

Note that returning from one invocation only returns from that invocation of the callback.

The enclosing generated chunk continues to the next index and invokes the callback again unless its own code establishes another condition.

When cancellation must stop all useful work quickly, the callback should keep checking the shared token.

## Deadline

A deadline can be applied to every chunk:

```cpp
options.task_options.set_deadline(
        vix::threadpool::Deadline::after(
              std::chrono::seconds{1}
        )
);
```

Because the same `TaskOptions` are copied to every generated task, all chunks receive the same `Deadline` value.

This means they share one absolute expiration point.

Chunks that remain queued until after the deadline can be skipped by the result-producing submission path.

See [Deadlines](/modules/threadpool/deadlines).

## Timeout

A timeout can also be applied:

```cpp
options.task_options.set_timeout(
        vix::threadpool::Timeout::milliseconds(100)
);
```

The timeout applies independently to each generated chunk task.

It does not apply once to the complete `parallel_for` operation.

Conceptually:

```text
chunk 1 → own execution-duration observation
chunk 2 → own execution-duration observation
chunk 3 → own execution-duration observation
```

The current timeout semantics for result-producing submissions have an important distinction between Future result and low-level task metrics.

See [Timeouts](/modules/threadpool/timeouts) before using chunk timeouts for correctness decisions.

## Worker affinity

You can attach affinity:

```cpp
options.task_options.set_affinity(
        vix::threadpool::WorkerId{2}
);
```

but the same affinity is then used for every chunk.

Conceptually:

```text
chunk 1 ──┐
chunk 2 ──┤
chunk 3 ──┼──► Worker 2
chunk 4 ──┘
```

This can serialize most of the generated work onto one worker and defeat the purpose of `parallel_for`.

Leave affinity unset for ordinary parallel loops.

Use it only when forcing all generated chunks to one worker is intentional.

## The callback is shared between chunks

The implementation creates one shared callable:

```text
user callable
     ↓
shared object
  ┌──┼──┐
  ▼  ▼  ▼
chunk tasks
```

Several worker threads can therefore invoke the same callable object concurrently.

For a stateless lambda:

```cpp
[](int index){
  process(index);
}
```

this is normally straightforward.

For mutable function objects or lambdas containing shared mutable state, concurrent invocation must be safe.

## Writing independent output positions

A common pattern is writing one output element per index:

```cpp
std::vector<int> values(100, 0);

vix::threadpool::parallel_for(
        pool,
        std::size_t{0},
        values.size(),
        [&values](std::size_t index){
          values[index] = static_cast<int>(index * index);
        }
);
```

Each callback writes a different existing element.

The index partitioning guarantees that each index in the range is processed once by the generated loop structure.

The caller remains responsible for ensuring the container and operation are safe for concurrent access to distinct elements.

## Avoid unsynchronized shared mutation

This pattern is unsafe:

```cpp
int total = 0;

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [&total](int index){
          total += index;
        }
);
```

Several workers can modify `total` concurrently.

Use synchronization:

```cpp
std::atomic<int> total{0};

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [&total](int index){
          total.fetch_add(index, std::memory_order_relaxed);
        }
);
```

or use [Parallel Reduce](/modules/threadpool/parallel-reduce) when the operation is naturally a reduction.

## Each index is assigned to one chunk

Chunk boundaries do not overlap.

For:

```text
first = 0
last = 10
chunk size = 3
```

the ranges are:

```text
[0, 3)
[3, 6)
[6, 9)
[9, 10)
```

Therefore:

```text
0 1 2 3 4 5 6 7 8 9
```

are each part of exactly one generated chunk.

The implementation does not intentionally duplicate indices between chunk tasks.

## Chunk execution order is not guaranteed

Suppose:

```text
chunk A = [0, 10)
chunk B = [10, 20)
chunk C = [20, 30)
```

The scheduler may execute them in an order such as:

```text
B starts
C starts
A starts
```

or several may begin concurrently.

Do not rely on:

```text
lower index chunk executes first
```

Even within separate chunks, callback invocations can interleave in wall-clock time.

## Order inside one chunk

Inside a generated chunk, indices are processed in ascending order.

For:

```text
chunk = [8, 12)
```

one worker invokes:

```text
8
9
10
11
```

sequentially.

This local ordering does not produce a global ascending execution order because several chunks can execute concurrently.

## The call waits for generated chunks

`parallel_for` stores a `Future<void>` for every generated chunk.

After submitting all chunks, it waits for them by calling `get()`.

Conceptually:

```text
submit chunk 1
submit chunk 2
submit chunk 3
submit chunk 4
      ↓
Future 1
Future 2
Future 3
Future 4
      ↓
consume all Futures
      ↓
parallel_for returns
```

Therefore:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          process(index);
        }
);

// Generated chunks are finished here.
```

An additional:

```cpp
pool.wait_idle();
```

is not required merely to wait for the chunks generated by this `parallel_for` call.

The algorithm already waits for its own Futures.

## The pool remains running

When an existing pool is supplied:

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

the pool remains running after the algorithm returns.

It can be reused:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

`parallel_for` does not shut down an externally supplied pool.

## Temporary-pool overload

You can omit the pool:

```cpp
vix::threadpool::parallel_for(
        0,
        100,
        [](int index){
          process(index);
        }
);
```

The overload internally creates:

```cpp
vix::threadpool::ThreadPool pool;
```

then forwards to the normal implementation.

Conceptually:

```text
parallel_for(first, last, fn)
        ↓
create default ThreadPool
        ↓
parallel_for(pool, first, last, fn)
        ↓
wait for generated chunks
        ↓
temporary pool destroyed
```

The default pool uses the normal default worker count.

## Reuse an existing pool for repeated operations

This:

```cpp
vix::threadpool::ThreadPool pool(4);

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        first_operation
);

vix::threadpool::parallel_for(
        pool,
        0,
        100,
        second_operation
);
```

reuses the same workers.

Using temporary pools:

```cpp
vix::threadpool::parallel_for(
        0,
        100,
        first_operation
);

vix::threadpool::parallel_for(
        0,
        100,
        second_operation
);
```

creates and destroys a pool for each call.

For repeated parallel work, an existing pool avoids repeated worker-runtime construction.

## Exceptions are propagated

If an index callback throws:

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

          process(index);
        }
);
```

the exception is transported through the generated chunk's Future.

`parallel_for` eventually rethrows an exception to the caller.

## All generated Futures are consumed before rethrow

The implementation does not immediately leave when the first `Future::get()` throws.

It continues through all generated Futures.

Conceptually:

```text
Future 1 → success
Future 2 → throws
             ↓
         remember exception

Future 3 → wait
Future 4 → wait
      ↓
all Futures consumed
      ↓
rethrow remembered exception
```

This gives `parallel_for` a stable synchronization boundary.

When it returns or throws, all Futures generated by that call have been consumed.

## Other chunks are not automatically cancelled after failure

Suppose one chunk throws:

```text
chunk A → throws
chunk B → running
chunk C → queued
chunk D → running
```

`parallel_for` does not automatically cancel B, C, and D.

They continue according to normal ThreadPool behavior.

The algorithm waits for their Futures before rethrowing the remembered exception.

If remaining chunks should stop useful work after one failure, that policy must be built explicitly, typically with a shared cancellation mechanism.

## First propagated exception

Futures are stored in chunk-submission order and consumed in that order.

The remembered exception is therefore the first one encountered while traversing those Futures.

This is not necessarily the first chunk that failed in wall-clock time.

For concurrent execution:

```text
chunk C fails at t1
chunk A fails at t2

Future consumption:
A
B
C
```

the exception from A can be encountered first.

Do not interpret the propagated exception as a timestamp ordering of concurrent failures.

## Rejected chunk submissions

Each chunk is submitted through:

```cpp
pool.submit(...);
```

If the pool rejects a generated submission, its Future is completed as rejected.

When `parallel_for` later calls:

```cpp
future.get();
```

that Future throws `std::system_error`.

The algorithm treats this like any other exception:

```text
chunk submission rejected
        ↓
Future contains rejection
        ↓
get() throws
        ↓
remember exception
        ↓
consume remaining Futures
        ↓
rethrow
```

Bounded queues or pool shutdown can therefore cause `parallel_for` to throw.

## Bounded queues

A `parallel_for` can generate several chunk submissions in a tight loop.

With a small queue capacity:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_queue_size = 1;

vix::threadpool::ThreadPool pool(config);
```

a sufficiently large parallel range can produce submission pressure.

Generated chunks are still subject to the normal per-worker queue capacity.

`parallel_for` does not maintain a separate unlimited internal queue.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Calling `parallel_for` from a worker

`parallel_for` is synchronous at its call boundary.

If a ThreadPool worker calls:

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

using the same pool, that worker remains occupied while waiting for the generated Futures.

Conceptually:

```text
Worker 1
  outer task
      ↓
  parallel_for()
      ↓
  submit inner chunks
      ↓
  wait for inner Futures
```

The inner chunks need available workers to execute.

## Nested parallelism can exhaust workers

Suppose every worker enters an outer task that then calls `parallel_for` on the same pool.

```text
Worker 1 → waiting for inner chunks
Worker 2 → waiting for inner chunks
Worker 3 → waiting for inner chunks
Worker 4 → waiting for inner chunks

inner chunks
    ↓
queued
    ↓
no free worker
```

This can deadlock because the workers required to process the inner chunks are all blocked waiting for those chunks.

Avoid saturating a pool with tasks that synchronously wait for additional work submitted back to the same pool.

## Choosing a chunk size

A smaller chunk size creates more tasks:

```text
chunk size = 1

100 indices
      ↓
100 generated tasks
```

This increases opportunities for distribution but also increases:

```text
task creation
submission
queue operations
Future storage
Future synchronization
```

A larger chunk size creates fewer tasks:

```text
chunk size = 25

100 indices
      ↓
4 generated tasks
```

which reduces scheduling overhead but gives the scheduler less work to redistribute.

## Small uniform operations

For cheap operations:

```cpp
values[index] += 1;
```

large enough chunks usually avoid excessive task overhead.

The automatic chunking strategy is a reasonable default when no workload-specific measurement is available.

## Uneven operations

Suppose some indices take much longer than others.

Very large chunks can create imbalance:

```text
chunk A → expensive indices
chunk B → cheap indices
chunk C → cheap indices
chunk D → cheap indices
```

Workers processing the cheap chunks can finish while another worker remains occupied with the expensive chunk.

Smaller chunks give the scheduler more independent units of work, although the current runtime does not move an already queued chunk between workers through work stealing.

Chunk size is therefore a workload-level tradeoff.

## `parallel_for` does not guarantee a speedup

Parallel execution has overhead.

The algorithm performs:

```text
chunk calculation
shared callable creation
Future vector allocation
task submission
scheduler selection
worker queue operations
Future waiting
```

For tiny ranges or trivial callbacks, sequential code can be faster:

```cpp
for (int i = 0; i < 10; ++i)
{
  process(i);
}
```

Use `parallel_for` when the range contains enough independent work to justify parallel scheduling.

## The callback return value is ignored

The callback is used for its work, not for its return value.

For example:

```cpp
vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [](int index){
          return index * 2;
        }
);
```

can compile, but those returned values are discarded.

Use [Parallel Map](/modules/threadpool/parallel-map) when every index or element should produce an output value.

## Side effects should be deliberate

`parallel_for` is naturally useful for operations such as:

```text
fill independent array positions
update independent objects
perform independent calculations
dispatch independent side effects
```

Whenever callbacks share state, normal C++ synchronization rules apply.

The ThreadPool does not automatically protect captures from concurrent access.

## Complete custom-chunk example

```cpp
#include <atomic>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::atomic<int> counter{0};

  vix::threadpool::ParallelForOptions options =
      vix::threadpool::ParallelForOptions::with_chunk_size(8);

  vix::threadpool::parallel_for(
        pool,
        0,
        100,
        [&counter](int){
          counter.fetch_add(1, std::memory_order_relaxed);
        },
        options
  );

  return counter.load(std::memory_order_relaxed) == 100 ? 0 : 1;
}
```

The algorithm guarantees that every index in:

```text
[0, 100)
```

belongs to one generated chunk and that all generated Futures are consumed before the function returns.

## Execution model

The complete path is:

```text
parallel_for(pool, first, last, fn)
             ↓
      last <= first?
         ┌───┴───┐
        yes      no
         │        │
       return     ▼
              calculate total
                  ↓
             choose chunk size
                  ↓
             share callable
                  ↓
          create chunk ranges
                  ↓
      ┌───────────┼───────────┐
      ▼           ▼           ▼
   chunk 1     chunk 2     chunk N
      │           │           │
      ▼           ▼           ▼
 pool.submit() pool.submit() pool.submit()
      │           │           │
      ▼           ▼           ▼
   Future      Future      Future
      └───────────┼───────────┘
                  ▼
           consume all Futures
                  ↓
          exception encountered?
             ┌────┴────┐
            yes        no
             │          │
          rethrow      return
```

The important properties are:

- `parallel_for` accepts integral index types.
- The range is half-open: `[first, last)`.
- `last <= first` performs no work.
- Reversed ranges are not treated as descending loops.
- Work is divided into non-overlapping chunks.
- One chunk becomes one `ThreadPool::submit()` operation.
- Indices inside one chunk execute sequentially.
- Different chunks can execute concurrently.
- A zero `chunk_size` enables automatic chunking.
- Automatic chunking targets approximately four chunks per worker.
- Explicit positive chunk sizes are used directly.
- The final chunk can be smaller than the configured size.
- `task_options` are copied to every generated chunk.
- Priority, cancellation, deadlines, timeouts, affinity, queue limits, and rejection retain their normal ThreadPool semantics.
- One affinity value applies to every chunk and can greatly reduce parallelism.
- The callable object can be invoked concurrently by several workers.
- Shared mutable application state must be synchronized by the caller.
- Chunk execution order is not globally guaranteed.
- The function waits for every generated Future before returning.
- An external pool remains running after the call.
- The overload without a pool creates a temporary default ThreadPool.
- Exceptions are remembered while all generated Futures continue to be consumed.
- Other chunks are not automatically cancelled after one chunk fails.
- Rejected generated submissions propagate through the same exception path.
- Nested synchronous `parallel_for` calls on a saturated shared pool can exhaust the available workers.
- Callback return values are ignored. Use `parallel_map` when outputs are required.

Continue with [Parallel For Each](/modules/threadpool/parallel-for-each) for element ranges or [Parallel Map](/modules/threadpool/parallel-map) for value-producing transformations.
