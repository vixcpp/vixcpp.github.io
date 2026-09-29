# Parallel Reduce

`parallel_reduce` combines a range of values into one result using several ThreadPool tasks.

```cpp id="hw7l3a"
#include <numeric>
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values{1, 2, 3, 4};

  const int sum = vix::threadpool::parallel_reduce(
    pool,
    values,
    0,
    [](int current, int value){
      return current + value;
    }
  );

  return sum == 10 ? 0 : 1;
}
```

The algorithm divides the input into chunks, reduces each chunk concurrently, then combines the partial results on the calling thread.

## Basic model

The execution model is:

```text id="ro1xdi"
input range
    ↓
divide into chunks
    ↓
reduce each chunk in ThreadPool
    ↓
partial results
    ↓
combine partials on caller thread
    ↓
final result
```

For example:

```text id="2o79gr"
input:
1 2 3 4 5 6

chunks:
[1 2]
[3 4]
[5 6]

parallel reduction:
partial A
partial B
partial C

caller thread:
combine A, B, C
```

`parallel_reduce` is synchronous at its call boundary. It returns only after all generated chunk Futures have been consumed.

## Container overload

A container can be reduced directly:

```cpp id="r6ysv0"
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

The result is:

```text id="axtdkf"
10
```

The container overload forwards through:

```cpp id="7qn5fw"
std::begin(container)
std::end(container)
```

to the iterator implementation.

## Iterator overload

An explicit iterator range can also be used:

```cpp id="mhb6is"
std::vector<int> values{1, 2, 3, 4, 5};

const int result = vix::threadpool::parallel_reduce(
  pool,
  values.begin(),
  values.end(),
  0,
  [](int current, int value){
    return current + value;
  }
);
```

The processed range is:

```text id="f3yh9d"
[first, last)
```

## Initial accumulator

The third reduction argument is the accumulator's initial value:

```cpp id="1gdqf7"
const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  reduce
);
```

Here:

```text id="u6r33l"
T = int
initial = 0
```

The same type `T` is used for:

```text id="0qbuwh"
chunk accumulators
partial results
final accumulator
function return value
```

## Empty range

An empty range returns the initial value immediately:

```cpp id="ip4y91"
std::vector<int> values;

const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  42,
  [](int current, int value){
    return current + value;
  }
);
```

The result is:

```text id="0qd504"
42
```

No tasks are submitted.

Conceptually:

```text id="b6wph8"
distance <= 0
      ↓
return initial
```

The reduction callable is not invoked.

## Reduction happens in two levels

For a non-empty range, reduction happens in two stages.

First, every chunk performs a local reduction:

```text id="os638v"
chunk
  ↓
start from initial
  ↓
reduce elements
  ↓
partial result
```

Then the calling thread combines the partial results:

```text id="ouvmhq"
start from initial
      ↓
combine partial 1
      ↓
combine partial 2
      ↓
combine partial N
      ↓
return result
```

This two-level structure is central to the current `parallel_reduce` behavior.

## Chunk reduction

Suppose:

```text id="pya4ja"
values:
1 2 3 4 5 6

chunk size:
2
```

The chunks are:

```text id="rsxgt5"
[1 2]
[3 4]
[5 6]
```

Each chunk becomes one `ThreadPool::submit()` call.

With addition and an initial value of zero:

```text id="7nm3k0"
chunk 1:
0 + 1 + 2 = 3

chunk 2:
0 + 3 + 4 = 7

chunk 3:
0 + 5 + 6 = 11
```

The partial results are:

```text id="wcgjts"
3
7
11
```

## Final reduction

After every Future has been consumed, the caller combines the partial values:

```text id="lvb9p4"
result = 0

0 + 3  = 3
3 + 7  = 10
10 + 11 = 21
```

The final result is:

```text id="fk35bn"
21
```

This final reduction happens on the thread that called `parallel_reduce`, not on a ThreadPool worker.

## Current initial-value behavior

The current implementation applies `initial` to every chunk and then applies `initial` again during final partial-result reduction.

For `N` chunks:

```text id="y70m9c"
chunk 1 starts from initial
chunk 2 starts from initial
...
chunk N starts from initial

final reduction also starts from initial
```

Therefore the initial value participates:

```text id="wz601a"
N + 1 times
```

in a non-empty reduction.

This is an important property of the current implementation.

## Use an identity value

With the current implementation, `initial` should normally be an identity element for the reduction operation.

Examples:

```text id="gzrvkj"
addition
identity = 0

multiplication
identity = 1

string concatenation
identity = ""

bitwise OR
identity = 0
```

For addition:

```cpp id="ecfa8j"
const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  [](int current, int value){
    return current + value;
  }
);
```

zero does not change any chunk result or the final result.

## Non-neutral initial values

A non-neutral initial value currently produces different semantics from a conventional sequential reduction.

Consider:

```cpp id="hp2f5g"
std::vector<int> values{1, 2};

vix::threadpool::ParallelReduceOptions options =
  vix::threadpool::ParallelReduceOptions::with_chunk_size(1);

const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  10,
  [](int current, int value){
    return current + value;
  },
  options
);
```

The chunks produce:

```text id="8hs3z6"
chunk 1:
10 + 1 = 11

chunk 2:
10 + 2 = 12
```

The final combination begins from `10` again:

```text id="3hci7o"
10 + 11 + 12 = 33
```

The result is therefore:

```text id="ag1n8n"
33
```

not:

```text id="gvfyzv"
13
```

which a sequential fold starting once from `10` would produce.

Do not use a non-neutral initial value when conventional single-application initial-value semantics are required.

## Even one chunk applies the initial value twice

The behavior is not limited to multi-chunk reductions.

Suppose the complete input fits into one chunk:

```text id="cmwe4q"
values = [1 2]
initial = 10
```

The chunk produces:

```text id="3k3os5"
10 + 1 + 2 = 13
```

The final reduction then performs:

```text id="mn937f"
10 + 13 = 23
```

The initial value is therefore still applied twice.

For non-empty input, use an identity value with the current implementation.

## ParallelReduceOptions

Use:

```cpp id="03cegw"
vix::threadpool::ParallelReduceOptions options;
```

to configure chunking and task submission.

The type contains:

```cpp id="ksf1qf"
std::size_t chunk_size;
vix::threadpool::TaskOptions task_options;
```

The defaults are:

```text id="v3k5qe"
chunk_size   0
task_options default TaskOptions
```

A zero chunk size enables automatic chunk-size selection.

## Explicit chunk size

Set a fixed number of input elements per generated task:

```cpp id="7f23s5"
vix::threadpool::ParallelReduceOptions options;
options.chunk_size = 2;

const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  [](int current, int value){
    return current + value;
  },
  options
);
```

For:

```text id="31w58i"
6 elements
chunk size = 2
```

the algorithm creates:

```text id="8d01ok"
3 chunk tasks
```

## Chunk-size factory

The convenience factory is:

```cpp id="qbhuzy"
vix::threadpool::ParallelReduceOptions options =
  vix::threadpool::ParallelReduceOptions::with_chunk_size(8);
```

This sets:

```text id="p19qqe"
options.chunk_size = 8
```

and leaves `task_options` at its default value.

## Automatic chunk size

When:

```cpp id="gz0sl7"
options.chunk_size = 0;
```

the shared parallel chunk-size helper is used.

The current strategy is:

```text id="sivmax"
target chunks = worker count × 4

chunk size =
ceil(total elements / target chunks)
```

with a minimum chunk size of one.

For:

```text id="mlrv05"
100 elements
4 workers
```

the calculation is:

```text id="fj8wod"
target chunks = 16

chunk size =
ceil(100 / 16)
= 7
```

Each resulting chunk performs an independent local reduction.

## Changing chunk size can change the result

Because `parallel_reduce` groups elements into chunks, the reduction structure depends on `chunk_size`.

For an operation that is not associative:

```text id="7tl6rk"
(a op b) op c
```

can differ from:

```text id="awtzbe"
a op (b op c)
```

Changing the chunk boundaries can therefore change the final value.

Even mathematically associative operations such as floating-point addition can produce different numeric results because floating-point arithmetic is not exactly associative.

Do not assume that `parallel_reduce` reproduces a sequential left-to-right fold for arbitrary reduction functions.

## Input order between chunks is preserved

Chunks are submitted in input order.

Their Futures are stored in the same order.

Partial results are then appended while consuming those Futures in submission order.

The final caller-side reduction therefore combines partials in chunk order:

```text id="f160pv"
chunk 1 partial
      ↓
chunk 2 partial
      ↓
chunk 3 partial
```

Worker completion order does not reorder the partial values.

For example:

```text id="v5bg5q"
worker completion:
chunk 3
chunk 1
chunk 2

final partial order:
chunk 1
chunk 2
chunk 3
```

## Order inside each chunk is preserved

Each chunk traverses its local iterator range sequentially:

```cpp id="hl7t0l"
for (Iterator it = chunkFirst; it != chunkLast; ++it)
{
  local = reduce(std::move(local), *it);
}
```

Therefore the local element order follows the original iterator order.

The change from sequential reduction comes from grouping into partial reductions, not from deliberately reordering elements within chunks.

## String concatenation

An associative, order-sensitive operation can preserve input order when its identity value is used.

For example:

```cpp id="029p7p"
std::vector<std::string> values{"a", "b", "c"};

const std::string result = vix::threadpool::parallel_reduce(
  pool,
  values,
  std::string{},
  [](std::string current, const std::string& value){
    return current + value;
  },
  vix::threadpool::ParallelReduceOptions::with_chunk_size(1)
);
```

The empty string is the concatenation identity.

The chunk partials are combined in input chunk order, producing:

```text id="u6l3ci"
abc
```

The actual worker completion order does not determine the string order.

## Reduction callable

The reducer is conceptually called as:

```cpp id="l5c6qc"
reduce(accumulator, value)
```

For example:

```cpp id="n0hpy3"
[](int current, int value){
  return current + value;
}
```

During local reduction:

```text id="hf36as"
first argument  = T accumulator
second argument = input element
```

During final reduction:

```text id="67up0j"
first argument  = T accumulator
second argument = T partial result
```

This distinction matters when the input element type differs from `T`.

## Reducer must also combine partial results

Suppose the input contains `Value` objects while the accumulator is `Result`.

The reducer must support both:

```text id="mnk4ji"
Result + Value
```

during local reduction and:

```text id="7auub7"
Result + Result
```

during final partial combination.

A generic callable is often appropriate:

```cpp id="rq1tdh"
auto reduce = [](auto current, const auto& value){
  return combine(std::move(current), value);
};
```

If the callable only accepts the exact input element type as its second parameter, compilation can fail when the algorithm later passes a partial result of type `T`.

## One reducer object is shared

The algorithm creates one shared reducer object:

```text id="b1374a"
reducer
  ↓
shared object
 ┌────┼────┐
 ▼    ▼    ▼
chunk chunk chunk
```

Several ThreadPool workers can invoke this same object concurrently.

The final caller-side reduction uses the same reducer after all chunk Futures have finished.

Therefore a reducer with mutable internal state must be safe for concurrent invocation during the chunk phase.

A stateless lambda is the simplest model:

```cpp id="jnxvfr"
[](int current, int value){
  return current + value;
}
```

## Initial value is copied into chunk tasks

Each generated chunk captures the current `initial` value by value.

Conceptually:

```text id="yldh8m"
initial
 ├── copy → chunk 1
 ├── copy → chunk 2
 ├── copy → chunk 3
 └── retained for final reduction
```

For a non-empty reduction, the current implementation therefore requires `T` to support the copying needed to initialize multiple chunks.

A purely move-only accumulator does not fit this current chunk initialization strategy.

## TaskOptions

Every chunk receives:

```cpp id="1xxqba"
options.task_options
```

through `ThreadPool::submit()`.

For example:

```cpp id="t5u566"
vix::threadpool::ParallelReduceOptions options;
options.chunk_size = 8;

options.task_options.set_priority(
  vix::threadpool::TaskPriority::high
);

const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  [](int current, int value){
    return current + value;
  },
  options
);
```

Every local reduction chunk receives high priority.

The final partial-value reduction does not become a ThreadPool task. It runs directly on the caller thread.

## Priority applies only to chunk tasks

Priority influences:

```text id="jss5ml"
chunk submission
      ↓
worker local queue ordering
```

It does not influence the final reduction because that phase is synchronous caller-side work.

See [Priorities](/modules/threadpool/priorities).

## Cancellation

A cancellation token can be shared across all generated chunks:

```cpp id="9rrg22"
vix::threadpool::CancellationSource source;

vix::threadpool::ParallelReduceOptions options;

options.task_options.set_cancellation(
  source.token()
);
```

Cancellation can prevent a chunk from beginning its local reduction if observed before its callable starts.

A cancelled generated Future later causes:

```cpp id="kn37qk"
future.get();
```

to throw.

`parallel_reduce` then follows its normal exception propagation path.

## Cooperative cancellation during reduction

Cancellation does not forcibly interrupt a chunk already executing its local element loop.

If the reducer itself needs to react while running, capture or otherwise access the cancellation state explicitly.

For example:

```cpp id="gcsrtl"
vix::threadpool::CancellationSource source;
auto token = source.token();

vix::threadpool::ParallelReduceOptions options;
options.task_options.set_cancellation(token);

const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  [token](int current, int value){
    if (token.stop_requested())
    {
      return current;
    }

    return current + value;
  },
  options
);
```

Here the application decides how cancellation affects the accumulated value.

If a chunk Future itself completes as cancelled, however, the complete `parallel_reduce` operation throws instead of returning a partial reduction.

## Deadline

A deadline can be applied to every generated chunk:

```cpp id="x2lvym"
options.task_options.set_deadline(
  vix::threadpool::Deadline::after(
    std::chrono::seconds{1}
  )
);
```

The same absolute deadline value is copied to all chunk submissions.

A chunk that remains queued beyond that deadline can be skipped by the normal result-producing task path.

Its Future then reports a timeout error, which causes the reduction operation to throw after all generated Futures have been consumed.

See [Deadlines](/modules/threadpool/deadlines).

## Timeout

A timeout can be configured per chunk:

```cpp id="u9f23w"
options.task_options.set_timeout(
  vix::threadpool::Timeout::milliseconds(100)
);
```

The timeout applies independently to each local reduction task.

It is not a timeout for:

```text id="obw4tr"
the complete parallel_reduce call
```

and does not measure the final caller-side partial reduction.

The current result-producing timeout semantics can also allow the Future and low-level task timeout classification to differ.

See [Timeouts](/modules/threadpool/timeouts).

## Worker affinity

Affinity is copied to every generated chunk:

```cpp id="1k0b9j"
options.task_options.set_affinity(
  vix::threadpool::WorkerId{2}
);
```

This can route all local reduction tasks to one worker:

```text id="bzn9p1"
chunk 1 ──┐
chunk 2 ──┤
chunk 3 ──┼──► Worker 2
chunk 4 ──┘
```

That can eliminate most parallel execution.

For ordinary reductions, leave worker affinity unset unless one-worker placement is specifically required.

## Random-access iterators

For random-access iterators, chunk starts are calculated directly from offsets.

Typical examples include:

```text id="h0tbv0"
std::vector
std::deque
```

Conceptually:

```text id="30cdu5"
first + offset
      ↓
chunk start
```

The generated task then processes a known number of elements.

## Non-random-access iterators

Multi-pass non-random-access iterators are also supported.

The test suite explicitly covers `std::list`:

```cpp id="ywka32"
std::list<int> values{1, 2, 3, 4, 5};

const int result = vix::threadpool::parallel_reduce(
  pool,
  values.begin(),
  values.end(),
  0,
  [](int current, int value){
    return current + value;
  },
  vix::threadpool::ParallelReduceOptions::with_chunk_size(2)
);
```

The result is:

```text id="47cb4r"
15
```

Chunk boundaries are discovered by advancing iterators.

## Range distance is determined first

The implementation starts with:

```cpp id="qp6n8z"
std::distance(first, last);
```

This provides:

```text id="3h5390"
total element count
automatic chunk-size input
Future reservation size
```

For random-access iterators, this is constant-time.

For a `std::list`, it requires linear traversal.

The algorithm later traverses the range again while establishing and executing chunks.

## Single-pass input sources

Because the range is measured before chunk processing, the current algorithm is designed around multi-pass iterator ranges.

Do not rely on `parallel_reduce` with a single-pass input source that cannot safely be traversed again.

Ordinary standard containers such as:

```text id="zkwhds"
std::vector
std::deque
std::list
std::forward_list
```

fit the multi-pass model.

## Input range is not copied

The generated tasks retain iterators into the original range.

Conceptually:

```text id="cslmji"
original range
      ▲
      │ iterators
chunk tasks
```

The input range must therefore remain alive and valid until the algorithm finishes.

Normal synchronous use satisfies this naturally because `parallel_reduce` waits for all generated Futures before returning.

## Avoid iterator invalidation

The reducer should not perform unsynchronized structural changes that invalidate iterators used by other chunks.

For example, modifying a `std::vector` with operations such as:

```text id="94jkz5"
push_back()
insert()
erase()
resize()
reallocation
```

while reduction chunks still hold iterators into that vector is unsafe.

A reduction should normally observe its input rather than structurally modifying the source range.

## Generated Futures contain partial results

Unlike `parallel_for` and `parallel_map`, each chunk Future contains a `T` value:

```cpp id="7kfdzm"
vix::threadpool::Future<T>
```

Conceptually:

```text id="0be7pf"
chunk 1 → Future<T> → partial 1
chunk 2 → Future<T> → partial 2
chunk 3 → Future<T> → partial 3
```

The caller-side phase retrieves each partial with:

```cpp id="x87f6h"
future.get();
```

and stores the successful results before final combination.

## All Futures are consumed

If a chunk fails, `parallel_reduce` does not stop consuming the remaining Futures.

The current path is:

```text id="cai9q6"
Future 1
   ↓
partial result

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
exception present?
   ↓
rethrow
```

The final partial reduction is not performed when an exception was captured.

## Exception propagation

A reducer exception is transported through the Future of the chunk where it occurred.

For example:

```cpp id="j9xjcf"
const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  [](int current, int value){
    if (value == 4)
    {
      throw std::runtime_error{"reduction failed"};
    }

    return current + value;
  }
);
```

causes `parallel_reduce` to throw `std::runtime_error`.

No final result is returned.

## Failure stops the current chunk

If the reducer throws while processing one chunk:

```text id="n6zmlm"
chunk:
1 2 3 4

1 processed
2 throws
```

the rest of that chunk is not reduced.

The Future becomes exceptional.

Other chunks already submitted continue normally.

## Failure does not automatically cancel other chunks

Suppose:

```text id="pbt2t1"
chunk 1 → throws
chunk 2 → running
chunk 3 → queued
chunk 4 → running
```

the algorithm does not automatically cancel chunks 2, 3, and 4.

It continues consuming their Futures.

Only after every generated Future has been processed does it rethrow the remembered exception.

## Partial results are discarded after any failure

Successful chunks may already have produced partial values:

```text id="1m5bb1"
chunk 1 → partial
chunk 2 → failure
chunk 3 → partial
```

Those successful partials are not combined into a return value when any Future failed.

Instead:

```text id="04rlnc"
exception exists
      ↓
rethrow exception
```

The final reduction phase is skipped.

## First encountered exception

Futures are stored in chunk-submission order and consumed in that order.

The algorithm retains the first exception encountered during that traversal.

This is not necessarily the first failure in wall-clock time.

For example:

```text id="jpah0z"
chunk 3 fails first in time
chunk 1 fails later

Future traversal:
chunk 1
chunk 2
chunk 3
```

the exception from chunk 1 can be retained before chunk 3 is inspected.

## Rejected chunk submission

Every local reduction task is created through:

```cpp id="dvt51q"
pool.submit(...);
```

If the ThreadPool rejects one submission, the returned `Future<T>` contains the rejection.

Later:

```cpp id="cqfc73"
future.get();
```

throws `std::system_error`.

The reduction then:

```text id="fljnq5"
remembers rejection exception
      ↓
continues consuming other Futures
      ↓
rethrows
```

Bounded queues and pool shutdown therefore affect `parallel_reduce` like other result-producing parallel algorithms.

## Bounded queues

A large reduction can submit many chunks in a tight loop.

With:

```cpp id="77kemt"
vix::threadpool::ThreadPoolConfig config;
config.thread_count = 2;
config.max_queue_size = 1;

vix::threadpool::ThreadPool pool(config);
```

generated chunks remain subject to each worker's local queue capacity.

`parallel_reduce` does not provide a separate queue or retry system.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## Temporary-pool iterator overload

An explicit pool is optional:

```cpp id="cmyaax"
const int result = vix::threadpool::parallel_reduce(
  values.begin(),
  values.end(),
  0,
  [](int current, int value){
    return current + value;
  }
);
```

This overload creates a default `ThreadPool` internally.

Conceptually:

```text id="r95t24"
parallel_reduce(first, last, ...)
          ↓
create default ThreadPool
          ↓
parallel_reduce(pool, first, last, ...)
          ↓
wait for chunk Futures
          ↓
combine partials
          ↓
return result
          ↓
temporary pool destroyed
```

## Temporary-pool container overload

A container can also use the temporary-pool form:

```cpp id="1j0gjb"
std::vector<int> values{2, 3, 4};

const int product = vix::threadpool::parallel_reduce(
  values,
  1,
  [](int current, int value){
    return current * value;
  }
);
```

The result is:

```text id="1jnc4m"
24
```

The initial value `1` is the multiplicative identity, so repeated application of it does not alter the result.

## Reuse an existing pool

For repeated operations, prefer:

```cpp id="6qwtco"
vix::threadpool::ThreadPool pool(4);

const int first = vix::threadpool::parallel_reduce(
  pool,
  valuesA,
  0,
  reduce
);

const int second = vix::threadpool::parallel_reduce(
  pool,
  valuesB,
  0,
  reduce
);
```

This reuses the same worker runtime.

The overloads without a pool construct and destroy a temporary pool for each call.

## Existing pool remains running

An externally supplied pool is not shut down by `parallel_reduce`.

After:

```cpp id="bo5fog"
const int result = vix::threadpool::parallel_reduce(
  pool,
  values,
  0,
  reduce
);
```

the pool can immediately execute additional work:

```cpp id="6kpxh4"
auto future = pool.submit([](){
  return 42;
});
```

## Calling from a worker

`parallel_reduce` waits synchronously for all chunk Futures.

If a task already executing in a pool calls `parallel_reduce` using that same pool:

```text id="tejyep"
Worker 1
  outer task
      ↓
  parallel_reduce()
      ↓
  submit chunks to same pool
      ↓
  wait for Futures
```

Worker 1 remains occupied while waiting.

The generated chunk tasks need available workers to make progress.

## Nested parallelism can exhaust the pool

If every worker blocks inside an outer task waiting for new reduction chunks submitted to the same pool:

```text id="i9zk48"
Worker 1 → waiting
Worker 2 → waiting
Worker 3 → waiting
Worker 4 → waiting

reduce chunks
      ↓
queued
```

no worker may remain available to execute those chunks.

Avoid saturating a pool with synchronous nested parallel operations that submit work back into the same worker set.

## Choosing a chunk size

A smaller chunk size produces more independent reductions:

```text id="s4ea11"
small chunks
      ↓
more tasks
      ↓
more scheduling opportunities
      ↓
more submission and Future overhead
```

A larger chunk size produces fewer tasks:

```text id="o9rw1x"
large chunks
      ↓
fewer tasks
      ↓
less scheduling overhead
      ↓
less opportunity for parallel distribution
```

Chunk size also changes the grouping of the reduction operation.

For `parallel_reduce`, it therefore affects both performance and, for some reducers, numerical or semantic results.

## Parallel reduction is best for associative operations

A parallel reduction works most naturally when the reduction operation can be grouped without changing its intended meaning.

Examples include operations such as:

```text id="0jsi95"
integer addition
integer multiplication
minimum
maximum
string concatenation with empty identity
associative application-defined combinations
```

The operation does not need to be commutative because chunk order is preserved during final combination.

It should, however, tolerate the grouping introduced by chunk-local partial reductions.

## Non-associative example

Subtraction is a simple example where grouping matters.

Sequentially:

```text id="ujib2s"
0 - 1 - 2 - 3 - 4
```

has one grouping.

Parallel chunk reduction might form:

```text id="5bvyp8"
chunk 1:
0 - 1 - 2

chunk 2:
0 - 3 - 4

final:
0 - partial1 - partial2
```

These expressions do not represent the same reduction.

Do not use `parallel_reduce` as a drop-in replacement for an arbitrary sequential left fold.

## Floating-point reduction

Floating-point addition is mathematically associative but not exactly associative in finite-precision arithmetic.

Therefore:

```cpp id="46u8ek"
parallel_reduce(
  pool,
  values,
  0.0,
  [](double current, double value){
    return current + value;
  }
);
```

can produce a slightly different result from a sequential loop because intermediate values are grouped differently.

Changing `chunk_size` can also change rounding behavior.

This is normal for parallel floating-point reduction.

## Convenience namespace

The explicit-pool form is also available through:

```cpp id="z7omcm"
const int result = vix::threadpool::parallel::reduce(
  pool,
  values,
  0,
  [](int current, int value){
    return current + value;
  }
);
```

This forwards to the same `parallel_reduce` implementation.

The `parallel::reduce` convenience namespace currently provides explicit-pool iterator and container forms.

The top-level `parallel_reduce` API additionally provides temporary-pool overloads.

## Complete example

```cpp id="pbhd6f"
#include <numeric>
#include <vector>
#include <vix/threadpool/all.hpp>

int main()
{
  vix::threadpool::ThreadPool pool(4);

  std::vector<int> values(100);
  std::iota(values.begin(), values.end(), 1);

  vix::threadpool::ParallelReduceOptions options =
    vix::threadpool::ParallelReduceOptions::with_chunk_size(25);

  const int result = vix::threadpool::parallel_reduce(
    pool,
    values,
    0,
    [](int current, int value){
      return current + value;
    },
    options
  );

  return result == 5050 ? 0 : 1;
}
```

The additive identity `0` makes the current per-chunk initial-value behavior neutral.

## Execution model

The complete path is:

```text id="2x7t8u"
parallel_reduce(pool, first, last, initial, reduce)
                      ↓
               calculate distance
                      ↓
                 empty range?
                  ┌───┴───┐
                 yes      no
                  │        │
          return initial   ▼
                    choose chunk size
                           ↓
                     share reducer
                           ↓
                    discover chunks
                           ↓
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
        chunk 1         chunk 2         chunk N
           │               │               │
           ▼               ▼               ▼
    local = initial  local = initial  local = initial
           │               │               │
           ▼               ▼               ▼
     reduce values     reduce values     reduce values
           │               │               │
           ▼               ▼               ▼
       Future<T>       Future<T>       Future<T>
           └───────────────┼───────────────┘
                           ▼
                   consume all Futures
                           ↓
                   exception captured?
                     ┌─────┴─────┐
                    yes          no
                     │            │
                  rethrow         ▼
                           result = initial
                                  ↓
                           combine partials
                                  ↓
                              return T
```

The important properties are:

- `parallel_reduce` supports iterator ranges and containers.
- Empty input returns `initial` immediately.
- Non-empty input is divided into chunks.
- Every chunk becomes one `ThreadPool::submit()` operation returning `Future<T>`.
- Each chunk begins its local accumulation from `initial`.
- The final caller-side reduction also begins from `initial`.
- Therefore a non-empty reduction applies the initial value once per chunk and once again during final combination.
- With the current implementation, use an identity value for the reduction operation.
- A non-neutral initial value does not have conventional single-application sequential-fold semantics.
- Chunk size can affect the result for non-associative operations and floating-point calculations.
- Elements remain ordered inside each chunk.
- Partial results are combined in chunk-submission order, not worker-completion order.
- The operation does not need to be commutative merely because it runs in parallel, but it should tolerate chunk grouping.
- The reducer must support both accumulator-plus-input-element calls and accumulator-plus-partial-result calls.
- One reducer object is shared by concurrent chunk tasks.
- The accumulator type `T` is copied into each generated chunk in the current implementation.
- `TaskOptions` are copied to every chunk task.
- Priority, cancellation, deadline, timeout, affinity, queue capacity, and rejection keep their normal ThreadPool semantics.
- The final partial reduction runs on the caller thread.
- A failing chunk stops its own local reduction.
- Other submitted chunks are not automatically cancelled.
- All generated Futures are consumed before the first encountered exception is rethrown.
- No partial final result is returned after a chunk failure.
- Multi-pass random-access and non-random-access ranges are supported.
- The implementation measures the range before reducing it, so single-pass input sources should not be assumed to fit the current design.
- Temporary-pool iterator and container overloads are available.
- `parallel::reduce()` provides convenience forwarding for explicit-pool forms.
- Nested synchronous reductions on a saturated shared pool can exhaust the available workers.

Continue with [Parallel Pipeline](/modules/threadpool/parallel-pipeline) for running independent stages concurrently.
