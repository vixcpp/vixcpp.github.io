# Parallel Map

`parallel_map` transforms every element of a range concurrently and returns the mapped values in a `std::vector`.

```cpp id="b8s6fc"
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values{1, 2, 3, 4};

  auto result = vix::threadpool::parallel_map(
    pool,
    values,
    [](int value){
      return value * value;
    }
  );

  return result == std::vector<int>{1, 4, 9, 16} ? 0 : 1;
}
```

The mapping work can execute in any worker order, but the returned vector preserves the order of the input range.

## Basic model

`parallel_map` follows this model:

```text id="88eabe"
input range
    ↓
divide into chunks
    ↓
submit chunks to ThreadPool
    ↓
map elements concurrently
    ↓
write results at input positions
    ↓
wait for all chunk Futures
    ↓
return std::vector<Result>
```

For:

```text id="8f407d"
input:
A B C D
```

the output is:

```text id="404568"
map(A) map(B) map(C) map(D)
```

even if the execution order was:

```text id="161fbc"
C
A
D
B
```

## Container overload

The simplest form accepts a container:

```cpp id="72cef5"
std::vector<int> values{1, 2, 3, 4};

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value * 2;
  }
);
```

The result is:

```text id="f9272d"
2
4
6
8
```

The container overload uses:

```cpp id="f24237"
std::begin(container)
std::end(container)
```

and forwards to the iterator implementation.

## Iterator overload

An explicit iterator range is also supported:

```cpp id="e33993"
std::vector<int> values{10, 20, 30};

auto result = vix::threadpool::parallel_map(
  pool,
  values.begin(),
  values.end(),
  [](int value){
    return value + 1;
  }
);
```

The returned vector contains:

```text id="82226a"
11
21
31
```

The processed range follows the usual C++ convention:

```text id="6523bc"
[first, last)
```

## Result type is inferred

The output element type is inferred from the mapping callable.

Conceptually:

```text id="b2fd52"
Input element
      ↓
callable
      ↓
Result
      ↓
std::vector<Result>
```

For example:

```cpp id="5b5f58"
std::vector<int> values{1, 2, 3};

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return std::to_string(value);
  }
);
```

The return type is:

```cpp id="5cb55e"
std::vector<std::string>
```

and the result is:

```text id="109184"
"1"
"2"
"3"
```

## Exact result type

The implementation derives the output type from:

```cpp id="c851e4"
std::invoke_result_t<
  Function&,
  InputRef
>
```

where:

```text id="e660d0"
Function = decayed mapping callable type
InputRef = result of dereferencing the input iterator
```

This means the callable can accept the actual reference type exposed by the iterator.

For example:

```cpp id="56100e"
[](const std::string& value){
  return value.size();
}
```

maps a string range to:

```cpp id="141761"
std::vector<std::size_t>
```

## Output size matches input size

For a non-empty range containing `N` elements:

```text id="f5ac83"
input size  = N
output size = N
```

For example:

```cpp id="42cd03"
std::vector<int> values{1, 2, 3, 4, 5};

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value * 10;
  }
);
```

produces:

```text id="dd151f"
result.size() == 5
```

Every input position has one corresponding output position.

## Empty range

An empty range returns an empty vector:

```cpp id="4cd9d8"
std::vector<int> values;

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value * 2;
  }
);
```

The result is:

```text id="32b004"
result.empty() == true
```

No chunk tasks are submitted.

The iterator implementation first computes the range distance and returns immediately when:

```text id="f4a7f2"
distance <= 0
```

## Output order is preserved

Order preservation is one of the main properties of `parallel_map`.

Suppose:

```text id="94ca6f"
input:
10 20 30 40
```

and workers complete the elements in this order:

```text id="65f700"
30
10
40
20
```

the returned vector is still:

```text id="dd7c21"
map(10)
map(20)
map(30)
map(40)
```

The algorithm does not append results according to completion order.

Instead, each generated chunk writes to predetermined positions in the output vector.

## How order is preserved

Before submitting any work, the implementation creates:

```cpp id="8d3d76"
std::vector<Result> output(total);
```

Each chunk knows its input offset.

For example:

```text id="5b5a2e"
input:
A B C D E F

chunk size = 2

chunk 1:
input offset 0
writes output[0], output[1]

chunk 2:
input offset 2
writes output[2], output[3]

chunk 3:
input offset 4
writes output[4], output[5]
```

The workers can complete in any order without changing the final position of each result.

## Work is divided into chunks

Like the other range algorithms, `parallel_map` groups adjacent input elements into tasks.

For:

```text id="52a41a"
input:
A B C D E F G

chunk size = 3
```

the chunks are:

```text id="be5fae"
[A B C]
[D E F]
[G]
```

Each chunk becomes one:

```cpp id="a68532"
pool.submit(...);
```

operation.

Conceptually:

```text id="2868ed"
[A B C] ──► worker
[D E F] ──► worker
[G]     ──► worker
```

## Elements inside one chunk are sequential

A generated chunk processes its elements in order.

Conceptually:

```cpp id="56f66d"
for (...)
{
  output[position] = fn(*input);
}
```

For one chunk:

```text id="1584d6"
A
↓
B
↓
C
```

is sequential.

Parallelism occurs between different chunk tasks.

## Chunk execution order is not guaranteed

Suppose the chunks are:

```text id="0f1dfa"
chunk 1: [A B]
chunk 2: [C D]
chunk 3: [E F]
```

they can execute as:

```text id="237916"
chunk 2 starts
chunk 3 starts
chunk 1 starts
```

This does not affect output ordering because each chunk already knows which output positions it owns.

Do not use callback execution order as a synchronization mechanism.

## ParallelMapOptions

Use:

```cpp id="835442"
vix::threadpool::ParallelMapOptions options;
```

to configure chunking and generated task options.

The structure contains:

```cpp id="f9ae98"
std::size_t chunk_size;
vix::threadpool::TaskOptions task_options;
```

The defaults are:

```text id="29f284"
chunk_size   0
task_options default TaskOptions
```

A zero chunk size enables automatic chunk calculation.

## Explicit chunk size

Set the number of elements processed by each generated task:

```cpp id="db3e7b"
vix::threadpool::ParallelMapOptions options;
options.chunk_size = 2;

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value + 100;
  },
  options
);
```

For six elements:

```text id="fcdf84"
chunk 1 → 2 elements
chunk 2 → 2 elements
chunk 3 → 2 elements
```

For seven elements:

```text id="a44c53"
chunk 1 → 2
chunk 2 → 2
chunk 3 → 2
chunk 4 → 1
```

The final chunk can be smaller.

## Chunk-size factory

The convenience factory is:

```cpp id="a41fdd"
vix::threadpool::ParallelMapOptions options =
  vix::threadpool::ParallelMapOptions::with_chunk_size(8);
```

This sets:

```text id="37bb8c"
options.chunk_size = 8
```

while leaving `task_options` at its defaults.

## Automatic chunk size

With:

```cpp id="4103ca"
options.chunk_size = 0;
```

`parallel_map` calls the shared parallel chunk-size helper.

The current calculation is:

```text id="ecf59a"
target chunks = worker count × 4

chunk size =
ceil(total elements / target chunks)
```

with a minimum chunk size of one.

For:

```text id="51546d"
elements = 100
workers  = 4
```

the calculation is:

```text id="1658f4"
target chunks = 16

chunk size =
ceil(100 / 16)
= 7
```

The algorithm therefore creates several scheduling units per worker rather than one large task per worker.

## TaskOptions

Every chunk receives:

```cpp id="106427"
options.task_options
```

through the normal `ThreadPool::submit()` path.

For example:

```cpp id="8dd4ce"
vix::threadpool::ParallelMapOptions options;
options.chunk_size = 4;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return transform(value);
  },
  options
);
```

Every generated chunk receives high priority.

The same mechanism can carry:

```text id="8a22d5"
priority
cancellation
deadline
timeout
worker affinity
```

All normal ThreadPool task semantics remain in effect.

## Priority applies per chunk

When:

```cpp id="0097ed"
options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);
```

every generated mapping chunk becomes a high-priority task.

Priority controls ordering inside the selected worker's local queue.

It does not change output ordering and does not create a global execution order.

See [Priorities](/modules/threadpool/priorities).

## Cancellation

A shared token can be attached to all mapping chunks:

```cpp id="b9856e"
vix::threadpool::CancellationSource source;

vix::threadpool::ParallelMapOptions options;

options.task_options.set_cancellation(
  source.token()
);
```

Every chunk receives the same cancellation state.

Cancellation can prevent a chunk from entering its user callable when the request is observed before execution begins.

It does not forcibly stop a mapping chunk that is already processing elements.

## Cooperative cancellation inside the mapper

If running mapping work must react to cancellation, capture the token explicitly:

```cpp id="3fc264"
vix::threadpool::CancellationSource source;
auto token = source.token();

vix::threadpool::ParallelMapOptions options;

options.task_options.set_cancellation(token);

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [token](int value){
    if (token.stop_requested())
    {
      return 0;
    }

    return transform(value);
  },
  options
);
```

The callback decides what output value should represent the cancelled application-level operation.

Returning from one callback invocation does not terminate the generated chunk loop.

## Cancellation before a chunk starts

Because generated chunks use `ThreadPool::submit()`, cancellation can cause one of their `Future<void>` objects to complete with a cancelled result before the mapper executes.

When `parallel_map` later consumes that Future:

```cpp id="3bf75e"
future.get();
```

a `std::system_error` is thrown.

The algorithm remembers the exception, consumes the remaining Futures, and eventually rethrows.

The partially filled output vector is not returned because the entire `parallel_map` call throws.

## Deadline

A deadline can be attached to all chunks:

```cpp id="148222"
options.task_options.set_deadline(
  vix::threadpool::Deadline::after(
    std::chrono::seconds{1}
  )
);
```

Because the same `TaskOptions` are copied to every chunk, all chunks receive the same absolute deadline.

Chunks that wait in queues until after that time can be skipped.

The resulting Future error propagates through `parallel_map`.

See [Deadlines](/modules/threadpool/deadlines).

## Timeout

A timeout can be configured with:

```cpp id="461128"
options.task_options.set_timeout(
  vix::threadpool::Timeout::milliseconds(100)
);
```

The timeout applies separately to each generated chunk.

It is not one timeout for the entire map operation.

Conceptually:

```text id="119685"
chunk 1 → timeout observation
chunk 2 → timeout observation
chunk 3 → timeout observation
```

The current `submit()` timeout behavior can report a successful Future value while the underlying low-level task is classified as timed out.

See [Timeouts](/modules/threadpool/timeouts) for that distinction.

## Worker affinity

Affinity is also copied to every chunk:

```cpp id="60ecc7"
options.task_options.set_affinity(
  vix::threadpool::WorkerId{2}
);
```

This results in:

```text id="8efead"
chunk 1 ──┐
chunk 2 ──┤
chunk 3 ──┼──► Worker 2
chunk 4 ──┘
```

One worker executes one task at a time.

Applying one worker affinity to every map chunk can therefore remove much of the expected parallel execution.

Leave affinity unset for normal mapping workloads.

## Random-access iterators

For random-access iterators, the implementation calculates each chunk start directly from its offset.

Examples include iterators from:

```text id="9b609d"
std::vector
std::deque
```

Conceptually:

```text id="517c35"
first + offset
      ↓
chunk start
```

Each chunk also receives its output offset:

```text id="8cbf65"
input offset
      ↓
same output offset
```

This direct correspondence is how result order is preserved.

## Non-random-access iterators

`parallel_map` also supports multi-pass non-random-access ranges.

The current tests cover `std::list`.

For example:

```cpp id="64505d"
std::list<int> values{1, 2, 3, 4};

auto result = vix::threadpool::parallel_map(
  pool,
  values.begin(),
  values.end(),
  [](int value){
    return value * 10;
  },
  vix::threadpool::ParallelMapOptions::with_chunk_size(2)
);
```

The result is:

```text id="aeddf8"
10
20
30
40
```

Chunk boundaries are discovered by advancing iterators rather than by direct offset arithmetic.

## Range distance is calculated first

The implementation begins with:

```cpp id="ea40ae"
std::distance(first, last);
```

This determines:

```text id="1e102e"
total number of input elements
output vector size
automatic chunk size
Future capacity
```

For random-access iterators, distance calculation is constant-time.

For iterators such as `std::list`, it requires traversal.

The range is then traversed again while processing chunk boundaries and values.

## Single-pass ranges

Because the implementation first obtains the complete distance and then traverses the range for mapping, it is designed around multi-pass iterator ranges.

Do not assume that a single-pass input source can be safely used with the current implementation.

Typical containers such as:

```text id="127973"
std::vector
std::deque
std::list
std::forward_list
```

provide the multi-pass behavior expected by this algorithm.

## The mapper can receive references

The callable is invoked with:

```cpp id="b2be0a"
fn(*iterator);
```

It does not receive an automatically copied input value.

This means a mutable range can use a mapper such as:

```cpp id="f52b06"
[](int& value){
  const int result = value * 2;
  value = 0;
  return result;
}
```

The mapper can therefore modify the input as well as produce an output.

Such mutation remains subject to normal concurrent-access rules.

Use const references when the source range should remain unchanged:

```cpp id="2159c1"
[](const Value& value){
  return transform(value);
}
```

## Input is not copied automatically

`parallel_map` stores iterators into the original input range.

Conceptually:

```text id="24a4f6"
input container
      ▲
      │ iterators
chunk tasks
```

The complete input is not first copied into an internal container.

This keeps mapping compatible with different iterator ranges but means the original range must remain valid throughout execution.

## Input lifetime

This is naturally satisfied in ordinary synchronous use:

```cpp id="7bc648"
std::vector<int> values{1, 2, 3, 4};

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value * 2;
  }
);

// All generated map chunks are finished here.
```

The function waits for all generated chunk Futures before returning.

Do not invalidate the range while the algorithm is running.

## Avoid structural input modification

Callbacks should not perform unsynchronized operations that invalidate iterators held by other chunks.

For a vector, examples include:

```text id="2bd11b"
push_back()
insert()
erase()
resize()
reallocation
```

A mapping callback can safely be designed around reading existing elements without modifying the container structure.

If input mutation is required, ensure the operation cannot invalidate iterators or race with other chunks.

## The mapping callable is shared

The implementation constructs one shared callable object:

```text id="3b31de"
mapper
  ↓
shared object
 ┌────┼────┐
 ▼    ▼    ▼
chunk chunk chunk
```

Several worker threads can therefore invoke the same callable object concurrently.

Stateless lambdas are naturally suitable:

```cpp id="560ef8"
[](int value){
  return value * value;
}
```

A callable that mutates its own internal state must provide synchronization.

## Move-only mapper objects

The mapper is stored using a shared object constructed from the forwarded callable.

This allows the algorithm to own one callable instance and share access to it among generated chunks.

The callable itself does not need to be copied once for every chunk.

It must still be safe for concurrent invocation by multiple workers.

## Output storage

The output vector is created before chunk submission:

```cpp id="8c6688"
std::vector<Result> output(total);
```

Each chunk then assigns its mapped values:

```cpp id="f67de4"
output[offset + i] = mapper(input);
```

This implementation detail places requirements on `Result`.

## Result must support current storage strategy

Because the output vector is created at its final size before mapping begins, the current implementation requires its result type to support default construction.

Because each slot is later assigned a mapped result, the type must also support assignment from the mapper result.

Conceptually:

```text id="cceece"
create N Result objects
      ↓
later assign each mapped value
```

A type that can only be constructed directly from the mapping expression, but cannot be default-constructed, does not fit the current storage strategy.

For example, this kind of result type would require a different implementation strategy:

```cpp id="0e788f"
struct Result
{
  explicit Result(int value);

  Result() = delete;
};
```

`parallel_map` currently creates output slots before the mapped values exist.

## Move-only result types

A move-only result can fit the implementation when it is:

```text id="3417bb"
default-constructible
move-assignable
```

For example, `std::unique_ptr<T>` has those properties.

The current algorithm does not require every mapped result to be copyable merely because the final return type is a vector.

The exact requirements come from creating the vector slots and assigning each mapper result into them.

## Concurrent output writes

Different chunks write to distinct logical positions in the output vector:

```text id="a75736"
chunk 1 → output[0..3]
chunk 2 → output[4..7]
chunk 3 → output[8..11]
```

The vector structure itself is not resized while tasks are running.

Its size is established before task submission.

Callbacks must not receive or manipulate the output vector directly through `parallel_map`; it remains internal to the algorithm.

## Result ordering does not require locking

The implementation does not use one global lock around output assignment.

Instead, chunk partitioning gives each generated task its own non-overlapping output positions.

Conceptually:

```text id="7f5785"
Worker A → output[0], output[1]
Worker B → output[2], output[3]
Worker C → output[4], output[5]
```

This avoids serializing every mapped result through a shared append operation.

## `std::vector<bool>` consideration

If the mapper returns `bool`, the output type becomes:

```cpp id="07cc31"
std::vector<bool>
```

`std::vector<bool>` uses a packed bit representation rather than ordinary independent `bool` objects.

The current implementation writes output positions concurrently from multiple chunk tasks.

When a boolean mapping is required and strict concurrent memory behavior matters, prefer mapping to a non-packed result type such as an integer or another ordinary value type, then convert afterward if needed.

## The caller blocks until mapping completes

Although chunk execution is concurrent, `parallel_map` itself is synchronous.

```cpp id="195696"
auto result = vix::threadpool::parallel_map(
  pool,
  values,
  mapper
);

// Mapping has completed here.
```

Internally:

```text id="be5bf6"
submit all chunks
      ↓
store Future<void> for each chunk
      ↓
consume every Future
      ↓
return output vector
```

There is no asynchronous `Future<std::vector<Result>>` return from this API.

## Existing pool remains running

When the caller supplies a pool:

```cpp id="ea28ef"
vix::threadpool::ThreadPool pool(4);

auto result = vix::threadpool::parallel_map(
  pool,
  values,
  mapper
);
```

the pool remains available after the mapping operation:

```cpp id="48d87a"
auto future = pool.submit([](){
  return 42;
});
```

`parallel_map` does not shut down an externally supplied `ThreadPool`.

## Temporary-pool iterator overload

You can omit the explicit pool:

```cpp id="d5dd80"
auto result = vix::threadpool::parallel_map(
  values.begin(),
  values.end(),
  [](int value){
    return value * 3;
  }
);
```

The overload creates a default ThreadPool internally.

Conceptually:

```text id="1180ce"
parallel_map(first, last, fn)
          ↓
create default ThreadPool
          ↓
parallel_map(pool, first, last, fn)
          ↓
wait for chunks
          ↓
return vector
          ↓
temporary pool destroyed
```

## Temporary-pool container overload

The container form also supports an internal temporary pool:

```cpp id="bf5be0"
std::vector<std::string> values{"a", "bb", "ccc"};

auto lengths = vix::threadpool::parallel_map(
  values,
  [](const std::string& value){
    return value.size();
  }
);
```

The result is:

```text id="d99c05"
1
2
3
```

For repeated operations, prefer reusing one explicit pool rather than creating and destroying a worker runtime for every call.

## Exceptions propagate

If a mapper throws:

```cpp id="855bb2"
auto result = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    if (value == 3)
    {
      throw std::runtime_error{"mapping failed"};
    }

    return value * 2;
  }
);
```

the exception is transported by the Future for that chunk.

`parallel_map` eventually rethrows an exception to the caller.

No output vector is returned from the failed call.

## A mapper exception stops its current chunk

Suppose one chunk contains:

```text id="1e797b"
A B C D
```

and mapping `B` throws.

The generated task leaves its loop immediately:

```text id="75de99"
A mapped
B throws
C not mapped by this chunk
D not mapped by this chunk
```

The corresponding output positions for C and D remain in their default-constructed state internally.

Because the complete `parallel_map` operation later throws, that partially populated output vector is not returned.

## Other chunks continue

One failing chunk does not automatically cancel the other generated tasks.

For example:

```text id="0da264"
chunk 1 → throws
chunk 2 → running
chunk 3 → queued
chunk 4 → running
```

chunks 2, 3, and 4 continue according to normal ThreadPool behavior.

The algorithm waits for all submitted chunk Futures before propagating the remembered exception.

## Every Future is consumed

The exception path is:

```text id="38dc10"
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
get()

Future 4
   ↓
get()

all Futures consumed
   ↓
rethrow remembered exception
```

This establishes a stable call boundary.

When `parallel_map` returns or throws, the Futures generated by that call have all been consumed.

## First encountered exception

Chunk Futures are stored in submission order and consumed in that same order.

The stored exception is the first one encountered during Future consumption.

It is not necessarily the first failure in wall-clock time.

For example:

```text id="af09dc"
chunk C fails first
chunk A fails later

Future traversal:
A
B
C
```

the exception from A can be encountered before C's exception.

Treat the propagated exception as the first one encountered while consuming generated Futures.

## Rejected chunk submission

Each chunk uses:

```cpp id="83aedf"
pool.submit(...);
```

A rejected submission still returns a Future representing rejection.

Later:

```cpp id="8ba0ca"
future.get();
```

throws `std::system_error`.

That exception enters the same collection path as mapper exceptions.

Therefore queue capacity, shutdown, or another ThreadPool rejection can cause `parallel_map` to throw instead of returning an output vector.

## Bounded queues

`parallel_map` can rapidly submit several chunks.

With a small per-worker queue capacity:

```cpp id="a4d6ec"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_queue_size = 1;

vix::threadpool::ThreadPool pool(config);
```

a sufficiently large map can encounter rejected generated tasks.

The algorithm uses the normal worker queues and does not provide a separate queue for mapping work.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Calling from a worker

`parallel_map` waits synchronously for its generated tasks.

If a worker already belonging to the same pool calls:

```cpp id="c24986"
auto result = vix::threadpool::parallel_map(
  pool,
  values,
  mapper
);
```

that worker remains occupied while waiting.

Conceptually:

```text id="32e03b"
Worker 1
  outer task
      ↓
  parallel_map()
      ↓
  submit map chunks to same pool
      ↓
  wait
```

The generated chunks need other workers to execute.

## Nested parallelism

If every worker becomes an outer task waiting for new `parallel_map` chunks submitted to the same pool:

```text id="360817"
Worker 1 → waiting
Worker 2 → waiting
Worker 3 → waiting
Worker 4 → waiting

map chunks → queued
```

no worker may remain available to process those chunks.

Avoid saturating a pool with synchronous nested operations that submit more work back to the same pool and wait for it.

## Choosing a chunk size

Small chunks create more scheduling units:

```text id="9ab75d"
small chunks
    ↓
more tasks
    ↓
better opportunity for distribution
    ↓
more scheduling and Future overhead
```

Large chunks create fewer scheduling units:

```text id="6d9872"
large chunks
    ↓
fewer tasks
    ↓
less scheduling overhead
    ↓
less opportunity for distribution
```

The default automatic chunk calculation is a reasonable starting point.

Performance-sensitive workloads should measure their own mapping cost and choose chunk sizes accordingly.

## Mapping expensive elements

`parallel_map` is most useful when individual transformations contain enough independent work to justify scheduling.

For example:

```text id="03d148"
decode records
transform images
parse independent objects
perform CPU-heavy calculations
build independent output structures
```

A very small transformation such as:

```cpp id="09bfeb"
return value + 1;
```

can cost less than the task scheduling required to parallelize a small input range.

Parallel execution is not automatically faster.

## Map vs For Each

Use `parallel_for_each` when the operation primarily performs side effects or modifies the existing elements:

```text id="c1168f"
input element
      ↓
modify or process it
```

Use `parallel_map` when each input should produce a collected output:

```text id="d6b3ef"
input element
      ↓
transform
      ↓
output element
```

For example:

```cpp id="02e042"
vix::threadpool::parallel_for_each(
  pool,
  values,
  [](int& value){
    value *= 2;
  }
);
```

modifies `values`.

While:

```cpp id="28e3f6"
auto doubled = vix::threadpool::parallel_map(
  pool,
  values,
  [](int value){
    return value * 2;
  }
);
```

creates a separate output vector.

## Convenience namespace

The same operation is available through:

```cpp id="832c68"
auto result = vix::threadpool::parallel::map(
  pool,
  values,
  [](int value){
    return value * 2;
  }
);
```

This forwards to the same `parallel_map` implementation.

The iterator, container, options, temporary-pool, ordering, and exception semantics remain unchanged.

## Complete type-changing example

```cpp id="d85aec"
#include <string>
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values{1, 2, 3};

  auto result = vix::threadpool::parallel_map(
    pool,
    values,
    [](int value){
      return std::string{"value-"} + std::to_string(value);
    }
  );

  if (result.size() != 3)
  {
    return 1;
  }

  if (result[0] != "value-1")
  {
    return 1;
  }

  if (result[1] != "value-2")
  {
    return 1;
  }

  if (result[2] != "value-3")
  {
    return 1;
  }

  return 0;
}
```

The mapping callable returns `std::string`, so the algorithm returns:

```cpp id="ea1239"
std::vector<std::string>
```

while preserving the original input order.

## Execution model

The complete execution path is:

```text id="55c951"
parallel_map(pool, first, last, mapper)
                   ↓
             calculate distance
                   ↓
              empty range?
               ┌───┴───┐
              yes      no
               │        │
          return {}     ▼
                 calculate chunk size
                         ↓
                 allocate output
                         ↓
                  share mapper
                         ↓
                discover chunks
                         ↓
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       chunk 1         chunk 2         chunk N
          │              │              │
          ▼              ▼              ▼
    pool.submit()   pool.submit()   pool.submit()
          │              │              │
          ▼              ▼              ▼
      map input       map input       map input
          │              │              │
          ▼              ▼              ▼
    output slots     output slots     output slots
          │              │              │
          ▼              ▼              ▼
    Future<void>     Future<void>     Future<void>
          └──────────────┼──────────────┘
                         ▼
                consume all Futures
                         ↓
                exception stored?
                   ┌─────┴─────┐
                  yes          no
                   │            │
                rethrow    return output
```

The important properties are:

- `parallel_map` transforms the iterator range `[first, last)`.
- Container overloads use `std::begin()` and `std::end()`.
- The output type is inferred from the mapper return type.
- The result is always a `std::vector<Result>`.
- Empty input returns an empty vector without submitting work.
- Output size matches input size.
- Output order always matches input order.
- Worker execution order does not affect result ordering.
- Work is partitioned into contiguous chunks.
- Each chunk becomes one `ThreadPool::submit()` operation.
- Elements inside one chunk are mapped sequentially.
- Different chunks can execute concurrently.
- A zero chunk size enables automatic chunking.
- Automatic chunking targets approximately four chunks per worker.
- Explicit positive chunk sizes are used directly.
- `TaskOptions` are copied to every chunk.
- One worker affinity applies to every chunk and can reduce parallelism.
- Random-access iterators use direct offset calculation.
- Multi-pass non-random-access iterators such as `std::list` are supported.
- The implementation determines the range distance before mapping, so single-pass input sources should not be assumed to fit the current algorithm.
- The mapper receives the iterator's dereferenced type and can therefore receive references.
- The original input range is not copied automatically.
- The input range must remain alive and its iterators must remain valid until the operation finishes.
- One shared mapper object can be invoked concurrently by several workers.
- The output vector is allocated at its final size before mapping.
- The current storage strategy requires `Result` to be default-constructible and assignable from the mapper result.
- A mapper exception stops the remainder of its own chunk.
- Other submitted chunks are not automatically cancelled after one failure.
- Every generated Future is consumed before an exception is rethrown.
- Rejected chunk submissions propagate through the same Future exception path.
- The overload without an explicit pool creates a temporary default `ThreadPool`.
- Nested synchronous mapping on a saturated shared pool can exhaust the available workers.

Continue with [Parallel Reduce](/modules/threadpool/parallel-reduce) for combining a range into one result.
