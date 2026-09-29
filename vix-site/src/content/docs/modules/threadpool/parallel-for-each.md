# Parallel For Each

`parallel_for_each` applies a callable to every element of an iterator range or container using a `ThreadPool`.

```cpp
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values{1, 2, 3, 4};

  vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          value *= 2;
        }
  );

  return values[3] == 8 ? 0 : 1;
}
```

The range is divided into chunks. Each chunk becomes one ThreadPool task, and the function waits until every generated task reaches a terminal result.

## Container overload

The most direct form accepts a container:

```cpp
std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          value += 10;
        }
);
```

After the call:

```text
11
12
13
14
```

The algorithm internally uses:

```cpp
std::begin(container)
std::end(container)
```

and forwards to the iterator-range implementation.

## Iterator overload

You can provide an explicit iterator range:

```cpp
std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values.begin(),
        values.end(),
        [](int& value){
          value *= 2;
        }
);
```

The processed range is:

```text
[first, last)
```

The first iterator is included.

The last iterator is excluded.

## The callable receives the element

For every iterator in the range, the generated chunk invokes:

```cpp
fn(*iterator);
```

This means the argument type follows the iterator's dereference type.

For a mutable `std::vector<int>`:

```cpp
[](int& value){
  value *= 2;
}
```

can modify the element directly.

For read-only access:

```cpp
[](const int& value){
  inspect(value);
}
```

the callable can observe the element without modifying it.

## Modify elements in place

`parallel_for_each` is useful when each element can be modified independently.

```cpp
std::vector<int> values{1, 2, 3, 4, 5};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          value *= value;
        }
);
```

After the call:

```text
1
4
9
16
25
```

Each element belongs to one generated chunk and is visited once by the normal algorithm path.

## Read-only iteration

The algorithm can also process a const container.

```cpp
const std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](const int& value){
          inspect(value);
        }
);
```

In this case, `std::begin(container)` produces a const iterator, so the callback receives a const element reference.

The algorithm does not require element mutation.

## Empty range

An empty range performs no work:

```cpp
std::vector<int> values;

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);
```

The implementation first computes:

```cpp
std::distance(first, last);
```

and returns immediately when:

```text
distance <= 0
```

No chunk tasks are submitted.

## Work is divided into chunks

The algorithm groups adjacent elements into chunks.

For:

```text
elements:
A B C D E F G H I J

chunk size:
3
```

the logical chunks are:

```text
[A B C]
[D E F]
[G H I]
[J]
```

Each chunk becomes one submitted task:

```text
chunk 1 ──► ThreadPool
chunk 2 ──► ThreadPool
chunk 3 ──► ThreadPool
chunk 4 ──► ThreadPool
```

Inside one chunk, elements are visited sequentially.

Different chunks can run concurrently.

## Chunk execution

Each generated task follows this basic loop:

```cpp
for (Iterator it = chunkFirst; it != chunkLast; ++it)
{
  fn(*it);
}
```

Therefore:

```text
inside one chunk
A → B → C
```

is sequential.

Across chunks:

```text
chunk 1 ──► Worker
chunk 2 ──► Worker
chunk 3 ──► Worker
```

execution can overlap.

## ParallelForEachOptions

Chunking and task submission are controlled with:

```cpp
vix::threadpool::ParallelForEachOptions options;
```

The structure contains:

```cpp
std::size_t chunk_size;
vix::threadpool::TaskOptions task_options;
```

The defaults are:

```text
chunk_size   0
task_options default TaskOptions
```

A `chunk_size` of zero requests automatic chunk-size selection.

## Set an explicit chunk size

Use:

```cpp
vix::threadpool::ParallelForEachOptions options =
    vix::threadpool::ParallelForEachOptions::with_chunk_size(4);
```

Then pass the options:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        },
        options
);
```

For ten elements and a chunk size of four:

```text
chunk 1 → 4 elements
chunk 2 → 4 elements
chunk 3 → 2 elements
```

The final chunk can contain fewer elements.

## Set the chunk size directly

The field can also be assigned:

```cpp
vix::threadpool::ParallelForEachOptions options;
options.chunk_size = 3;
```

This is equivalent to using:

```cpp
vix::threadpool::ParallelForEachOptions::with_chunk_size(3);
```

when no other options need to be configured during construction.

## Automatic chunking

When:

```cpp
options.chunk_size = 0;
```

the algorithm uses the same chunk-size calculation as `parallel_for`.

The current strategy is:

```text
target chunks = worker count × 4

chunk size =
ceil(total elements / target chunks)
```

with a minimum chunk size of one.

For:

```text
elements = 100
workers  = 4
```

the target is:

```text
16 chunks
```

and the calculated chunk size is:

```text
ceil(100 / 16)
= 7
```

This produces enough independent tasks for workers to continue receiving work as chunks finish.

## Random-access iterators

For random-access iterators, chunk boundaries are calculated directly from offsets.

Examples include iterators from:

```text
std::vector
std::deque
```

Conceptually:

```text
first + offset
      ↓
chunk start

chunk start + count
      ↓
chunk end
```

For a vector, the implementation can therefore locate each chunk without traversing all previous elements.

## Non-random-access iterators

The implementation also supports multi-pass non-random-access iterators.

The test suite covers:

```text
std::list
std::forward_list
```

For example:

```cpp
std::list<int> values{1, 2, 3, 4, 5};

vix::threadpool::parallel_for_each(
        pool,
        values.begin(),
        values.end(),
        [](int& value){
          value += 10;
        },
        vix::threadpool::ParallelForEachOptions::with_chunk_size(2)
);
```

The algorithm discovers chunk boundaries by advancing iterators sequentially.

Conceptually:

```text
chunkFirst
    ↓
advance until chunk size reached
    ↓
chunkLast
```

This makes chunk discovery linear for these iterator categories.

## Range distance is calculated first

Before creating chunks, the implementation calls:

```cpp
std::distance(first, last);
```

This determines the total number of elements used for automatic chunk calculation and Future storage.

For random-access iterators, this is constant-time.

For iterators such as `std::list` and `std::forward_list`, determining the distance requires traversal.

The algorithm then traverses again while discovering chunk boundaries.

## Single-pass iterators

The implementation needs to determine the range distance before processing chunks and then iterate over the range again.

For this reason, the intended non-random-access use is with multi-pass iterator ranges such as:

```text
forward iterators
bidirectional iterators
```

Do not rely on the current algorithm for a single-pass input source whose iterator state cannot safely be traversed this way.

Containers such as `std::vector`, `std::list`, and `std::forward_list` fit the supported model.

## TaskOptions apply to every chunk

`ParallelForEachOptions` contains:

```cpp
options.task_options;
```

These options are copied to every generated ThreadPool submission.

For example:

```cpp
vix::threadpool::ParallelForEachOptions options;
options.chunk_size = 2;

options.task_options.set_priority(
        vix::threadpool::TaskPriority::high
);

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        },
        options
);
```

Every chunk is submitted with high priority.

Conceptually:

```text
ParallelForEachOptions
          │
          └── TaskOptions
                 │
         ┌───────┼───────┐
         ▼       ▼       ▼
      chunk 1 chunk 2 chunk 3
```

## Priority

A priority can be attached with:

```cpp
options.task_options.set_priority(
        vix::threadpool::TaskPriority::high
);
```

The generated chunk tasks then use the normal local queue priority rules.

Priority does not determine element order globally.

It only affects where each accepted chunk appears inside the selected worker's queue.

See [Priorities](/modules/threadpool/priorities).

## Cancellation

A shared cancellation token can be attached to all chunks:

```cpp
vix::threadpool::CancellationSource source;

vix::threadpool::ParallelForEachOptions options;

options.task_options.set_cancellation(
        source.token()
);
```

Every generated task receives the same cancellation state.

A cancellation request can prevent a chunk callable from beginning if the request is observed before execution.

Cancellation does not forcibly stop a chunk that is already executing its element loop.

## Cooperative cancellation while processing elements

When processing must react after a chunk has started, capture the token explicitly:

```cpp
vix::threadpool::CancellationSource source;
auto token = source.token();

vix::threadpool::ParallelForEachOptions options;

options.task_options.set_cancellation(token);

vix::threadpool::parallel_for_each(
        pool,
        values,
        [token](int& value){
          if (token.stop_requested())
          {
            return;
          }

          process(value);
        },
        options
);
```

The callback checks cancellation for each element.

Returning from one callback invocation does not terminate the entire generated chunk loop.

The next element still invokes the callback, where the token can be checked again.

## Deadline

A deadline can be shared by every generated chunk:

```cpp
options.task_options.set_deadline(
        vix::threadpool::Deadline::after(
                std::chrono::seconds{1}
        )
);
```

Because the same options are copied to all chunk tasks, the same absolute deadline is used.

A chunk that remains queued beyond that point can be skipped by the normal result-producing submission path.

See [Deadlines](/modules/threadpool/deadlines).

## Timeout

Set a timeout with:

```cpp
options.task_options.set_timeout(
        vix::threadpool::Timeout::milliseconds(100)
);
```

The timeout applies independently to each generated chunk task.

It does not measure the complete `parallel_for_each` operation as one unit.

Conceptually:

```text
chunk 1 → own execution duration
chunk 2 → own execution duration
chunk 3 → own execution duration
```

See [Timeouts](/modules/threadpool/timeouts) for the current result and metrics semantics.

## Worker affinity

Affinity can also be configured:

```cpp
options.task_options.set_affinity(
        vix::threadpool::WorkerId{2}
);
```

The same affinity is copied to every chunk.

Therefore:

```text
chunk 1 ──┐
chunk 2 ──┤
chunk 3 ──┼──► Worker 2
chunk 4 ──┘
```

can occur.

Since one worker executes one task at a time, applying one affinity value to every chunk can remove most of the available parallelism.

Leave affinity unset for normal parallel iteration unless that placement is intentional.

## The callable object is shared

The implementation creates one shared callable object:

```text
callable
   ↓
shared object
 ┌───┼───┐
 ▼   ▼   ▼
chunk chunk chunk
```

Several workers can invoke that same callable object concurrently.

A stateless lambda is naturally suitable:

```cpp
[](int& value){
  value *= 2;
}
```

A stateful callable that mutates its own internal fields must provide whatever synchronization that mutation requires.

## Shared captured state

The same concurrency rule applies to captured application state.

This is unsafe:

```cpp
int count = 0;

vix::threadpool::parallel_for_each(
        pool,
        values,
        [&count](int& value){
          process(value);
          ++count;
        }
);
```

Several workers can increment `count` concurrently.

Use appropriate synchronization:

```cpp
std::atomic<int> count{0};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [&count](int& value){
          process(value);
          count.fetch_add(1, std::memory_order_relaxed);
        }
);
```

The algorithm parallelizes callback execution. It does not make shared state automatically thread-safe.

## Element order is not a global execution order

Suppose the input is:

```text
A B C D E F
```

and it is divided into:

```text
chunk 1: A B
chunk 2: C D
chunk 3: E F
```

Different workers can execute:

```text
C D
A B
E F
```

or overlap their execution.

The algorithm does not guarantee that callback invocation follows container order globally.

## Order inside one chunk

Within one chunk, iterator traversal is sequential:

```text
A
↓
B
↓
C
```

because the generated task uses:

```cpp
for (Iterator it = chunkFirst; it != chunkLast; ++it)
{
  (*sharedFn)(*it);
}
```

This local ordering does not create a global ordering between different chunks.

## Each element belongs to one chunk

Chunk boundaries are contiguous and non-overlapping.

For:

```text
A B C D E F G

chunk size = 3
```

the partition is:

```text
[A B C]
[D E F]
[G]
```

The normal execution structure assigns each iterator position to exactly one chunk.

## Iterator and container lifetime

Generated chunk tasks store copies of iterator boundaries.

The underlying range must remain valid until all chunk tasks finish.

Normal usage satisfies this naturally:

```cpp
std::vector<int> values{1, 2, 3, 4};

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);

// Generated tasks are finished here.
```

`parallel_for_each` waits for all generated Futures before returning.

The container therefore remains alive throughout the call.

## Avoid iterator invalidation

Callbacks should not perform unsynchronized structural modifications that can invalidate iterators used by other chunks.

For a `std::vector`, operations such as:

```text
push_back
insert
erase
resize
reserve causing reallocation
```

can invalidate iterators.

This is unsafe while other generated tasks still hold iterator boundaries into the same vector.

Modifying existing elements independently is different from modifying the structure of the container.

## Callback return values are ignored

`parallel_for_each` invokes the callable for its effects.

For example:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int value){
          return value * 2;
        }
);
```

can produce a return value from each invocation, but those values are discarded.

Use [Parallel Map](/modules/threadpool/parallel-map) when every input element should produce a collected output value.

## The function waits for all chunks

For every generated chunk, the algorithm stores a:

```cpp
vix::threadpool::Future<void>
```

After all submissions have been created, it consumes those Futures.

Conceptually:

```text
submit chunk 1
submit chunk 2
submit chunk 3
      ↓
Future<void>
Future<void>
Future<void>
      ↓
get() each Future
      ↓
return
```

Therefore:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);

// Generated parallel_for_each work is finished here.
```

An extra `pool.wait_idle()` is not required merely to wait for these generated chunk tasks.

## Existing pool remains available

When an existing pool is supplied:

```cpp
vix::threadpool::ThreadPool pool(4);

vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);
```

the algorithm does not shut it down.

The same pool can immediately be reused:

```cpp
auto future = pool.submit([](){
  return 42;
});
```

## Temporary-pool iterator overload

An iterator range can be processed without explicitly creating a pool:

```cpp
vix::threadpool::parallel_for_each(
        values.begin(),
        values.end(),
        [](int& value){
          value *= 2;
        }
);
```

The overload creates a default `ThreadPool` internally.

Conceptually:

```text
parallel_for_each(first, last, fn)
           ↓
create default ThreadPool
           ↓
parallel_for_each(pool, first, last, fn)
           ↓
wait for chunks
           ↓
temporary pool destroyed
```

## Temporary-pool container overload

The container overload also supports temporary pool creation:

```cpp
std::vector<std::string> values{"a", "b", "c"};

vix::threadpool::parallel_for_each(
        values,
        [](std::string& value){
          value += value;
        }
);
```

After the call:

```text
aa
bb
cc
```

Use an explicit pool when several parallel operations should reuse the same worker runtime.

## Exceptions propagate to the caller

If the callback throws:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          if (value == 42)
          {
            throw std::runtime_error("failure");
          }

          process(value);
        }
);
```

the exception is captured by the corresponding chunk Future.

The algorithm later rethrows an exception to the caller.

## An exception stops the current chunk loop

The callback is invoked inside one sequential chunk loop.

If it throws:

```text
chunk:
A
B
C
D

A processed
B throws
```

control leaves that generated task immediately.

Therefore:

```text
C
D
```

from that same chunk are not processed by that chunk.

This is important.

`parallel_for_each` does not guarantee that every input element is visited when one callback throws.

## Other chunks continue

A failure in one chunk does not automatically cancel the other generated tasks.

For example:

```text
chunk 1 → throws
chunk 2 → running
chunk 3 → queued
chunk 4 → running
```

chunks 2, 3, and 4 continue according to normal ThreadPool behavior.

The algorithm waits for their Futures before propagating the remembered exception.

## All submitted Futures are consumed before rethrow

The exception path is:

```text
Future 1
   ↓
success

Future 2
   ↓
throws
   ↓
remember exception

Future 3
   ↓
wait

Future 4
   ↓
wait

all Futures consumed
   ↓
rethrow remembered exception
```

This ensures that `parallel_for_each` does not return control while its own already submitted chunk Futures are still being left unconsumed.

## First encountered exception

Futures are stored in chunk-submission order and later consumed in that order.

The algorithm stores the first exception encountered during this traversal.

That exception is not necessarily the first one that occurred in wall-clock time.

Concurrent chunks can fail in a different temporal order.

Treat it as:

```text
first exception encountered while consuming
the generated Futures
```

## Rejected chunk submissions

Each chunk is submitted with:

```cpp
pool.submit(...);
```

If a submission is rejected, the returned Future contains the rejection.

When the algorithm calls:

```cpp
future.get();
```

it receives a `std::system_error`.

This enters the same exception collection path as a callback exception.

Bounded queue capacity, shutdown, or other submission failures can therefore cause `parallel_for_each` to throw.

## Bounded queues

Chunk generation can submit several tasks rapidly.

With:

```cpp
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_queue_size = 1;

vix::threadpool::ThreadPool pool(config);
```

a large range can place pressure on the per-worker queues.

The algorithm does not maintain a separate queue outside the ThreadPool.

Every generated chunk remains subject to normal queue capacity and rejection behavior.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Calling from a worker

`parallel_for_each` waits synchronously for the chunk Futures it creates.

If it is called from a task already executing on the same pool:

```text
Worker
  ↓
outer task
  ↓
parallel_for_each(same pool)
  ↓
submit more tasks
  ↓
wait for those tasks
```

the current worker remains occupied while waiting.

With enough nested callers, this can exhaust the worker set.

## Nested parallelism can deadlock

For example, with four workers:

```text
Worker 1 → outer task waiting
Worker 2 → outer task waiting
Worker 3 → outer task waiting
Worker 4 → outer task waiting

inner parallel_for_each chunks
            ↓
          queued
```

there may be no free worker to execute the inner chunks.

Avoid designs where every worker synchronously waits for new work submitted back to the same saturated pool.

## Choosing chunk size

Small chunks provide more scheduling units:

```text
small chunk size
      ↓
more tasks
      ↓
more opportunities for distribution
      ↓
more scheduling overhead
```

Large chunks provide fewer tasks:

```text
large chunk size
      ↓
fewer submissions
      ↓
lower scheduling overhead
      ↓
less opportunity for distribution
```

The default automatic calculation is a useful starting point.

Workload measurements should guide custom values when performance matters.

## Uneven element processing

If some elements are much more expensive than others, very large chunks can create uneven execution.

For example:

```text
chunk 1 → expensive elements
chunk 2 → cheap elements
chunk 3 → cheap elements
chunk 4 → cheap elements
```

Workers processing cheap chunks can finish earlier while the worker assigned the expensive chunk remains busy.

Smaller chunks provide more independent scheduling units.

The current runtime still has no work stealing, so a chunk already assigned to one worker remains associated with that worker.

## Convenience namespace

The same operation is available through:

```cpp
vix::threadpool::parallel::for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);
```

This forwards to:

```cpp
vix::threadpool::parallel_for_each(
        pool,
        values,
        [](int& value){
          process(value);
        }
);
```

Iterator and temporary-pool forms are also available through `parallel::for_each()`.

The execution semantics are identical.

## Complete example

```cpp
#include <atomic>
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values(100, 1);
  std::atomic<int> processed{0};

  vix::threadpool::ParallelForEachOptions options =
      vix::threadpool::ParallelForEachOptions::with_chunk_size(8);

  vix::threadpool::parallel_for_each(
        pool,
        values,
        [&processed](int& value){
          value *= 2;

          processed.fetch_add(
                1,
                std::memory_order_relaxed
          );
        },
        options
  );

  if (processed.load(std::memory_order_relaxed) != 100)
  {
    return 1;
  }

  for (const int value : values)
  {
    if (value != 2)
    {
      return 1;
    }
  }

  return 0;
}
```

The algorithm returns after all generated chunk Futures have been consumed.

## Execution model

The complete path is:

```text
parallel_for_each(pool, first, last, fn)
                    ↓
             calculate distance
                    ↓
             distance <= 0?
                ┌───┴───┐
               yes      no
                │        │
              return     ▼
                  choose chunk size
                         ↓
                  share callable
                         ↓
                 discover chunks
                         ↓
            ┌────────────┼────────────┐
            ▼            ▼            ▼
         chunk 1      chunk 2      chunk N
            │            │            │
            ▼            ▼            ▼
       pool.submit() pool.submit() pool.submit()
            │            │            │
            ▼            ▼            ▼
       Future<void> Future<void> Future<void>
            └────────────┼────────────┘
                         ▼
                 consume all Futures
                         ↓
                exception stored?
                   ┌─────┴─────┐
                  yes          no
                   │            │
                rethrow       return
```

The important properties are:

- `parallel_for_each` processes the iterator range `[first, last)`.
- A container overload forwards through `std::begin()` and `std::end()`.
- The callback receives the dereferenced iterator element.
- Mutable iterators allow callbacks to modify elements in place.
- Const ranges provide const element access.
- Empty ranges submit no work.
- Work is partitioned into contiguous, non-overlapping chunks.
- Each chunk becomes one `ThreadPool::submit()` operation.
- Elements inside one chunk are processed sequentially.
- Different chunks can execute concurrently.
- A zero chunk size selects automatic chunking.
- Automatic chunking targets approximately four chunks per worker.
- Explicit positive chunk sizes are used directly.
- Random-access iterators use direct offset calculation.
- `std::list` and `std::forward_list` style iterators are supported through linear chunk discovery.
- The algorithm determines range distance before processing, so single-pass input sources should not be assumed to fit the current implementation.
- `TaskOptions` are copied to every chunk.
- One affinity value applies to every chunk and can reduce parallelism.
- The callable object can be invoked concurrently.
- Shared mutable state must be synchronized by the caller.
- Global element execution order is not guaranteed.
- Structural container modifications must not invalidate iterators while chunks are running.
- Callback return values are discarded.
- The function waits for every generated Future before returning.
- An exception stops the remainder of the chunk in which it occurs.
- Other already submitted chunks are not automatically cancelled.
- All generated Futures are consumed before the remembered exception is rethrown.
- Rejected chunk submissions propagate through the same Future exception path.
- The overload without a pool creates a temporary default `ThreadPool`.
- Nested blocking parallel operations on the same saturated pool can exhaust available workers.

Continue with [Parallel Map](/modules/threadpool/parallel-map) when every input element should produce an output value.
