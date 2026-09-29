# API Reference

The ThreadPool module public API is available in:

```cpp id="k8sj7q"
#include <vix/threadpool/all.hpp>
```

All public symbols belong to:

```cpp id="z3jl0e"
namespace vix::threadpool
```

The module requires C++20.

This page is a compact reference to the public types, functions, enums, constants, and headers. For behavior, lifecycle rules, and examples, follow the links to the dedicated documentation pages.

## Main entry points

The primary user-facing API consists of:

| API                  | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `ThreadPool`         | Concurrent worker pool                          |
| `Executor`           | Abstract execution interface                    |
| `InlineExecutor`     | Execute work synchronously on the caller thread |
| `ThreadPoolExecutor` | Executor adapter around a `ThreadPool`          |
| `ExecutorRef`        | Non-owning executor reference                   |
| `TaskOptions`        | Per-task execution options                      |
| `Future<T>`          | Observe an asynchronous result                  |
| `Promise<T>`         | Complete a Future manually                      |
| `TaskHandle<T>`      | Future plus task ID and cancellation source     |
| `Scope`              | Structured tracking of spawned work             |
| `TaskGroup`          | Manual task accounting and coordination         |
| `PeriodicTask`       | Periodic callback submission                    |
| `Latch`              | One-shot synchronization counter                |
| `Barrier`            | Reusable participant synchronization            |
| `parallel_for`       | Parallel numeric range                          |
| `parallel_for_each`  | Parallel element iteration                      |
| `parallel_map`       | Parallel transformation                         |
| `parallel_reduce`    | Parallel reduction                              |
| `parallel_pipeline`  | Concurrent independent stages                   |

## ThreadPool

Header:

```cpp id="lbczrl"
#include <vix/threadpool/ThreadPool.hpp>
```

Main type:

```cpp id="m0h44o"
vix::threadpool::ThreadPool
```

Construction:

```cpp id="ax9h1m"
ThreadPool();
explicit ThreadPool(std::size_t threads);
explicit ThreadPool(ThreadPoolConfig config);
```

The pool starts automatically during construction.

Copying and moving are disabled.

### Lifecycle

```cpp id="fznx9l"
bool start();
void shutdown() noexcept;
void wait_idle();

bool running() const noexcept;
bool idle() const;
```

### Fire-and-forget submission

```cpp id="x9vtt1"
bool post(
  Executor::Task task,
  TaskOptions options = {}
);
```

`Executor::Task` is:

```cpp id="yheazk"
using Task = std::function<void()>;
```

### Future-producing submission

```cpp id="j6g765"
template <class Fn>
auto submit(
  Fn&& fn,
  TaskOptions options = {}
) -> Future<Result>;
```

`Result` is inferred from invoking the callable with no arguments.

### Cancellable task handles

```cpp id="o23mbe"
template <class Fn>
auto handle(
  Fn&& fn,
  TaskOptions options = {}
) -> TaskHandle<Result>;
```

A pre-reserved task ID can also be supplied:

```cpp id="ikfz3m"
template <class Fn>
auto handle_with_id(
  TaskId id,
  Fn&& fn,
  TaskOptions options = {}
) -> TaskHandle<Result>;
```

### Periodic work

```cpp id="t5clra"
PeriodicTask schedule_every(
  PeriodicTask::Callback callback,
  PeriodicTaskConfig config = {}
);
```

The returned `PeriodicTask` is not started automatically.

### Runtime information

```cpp id="d7jidw"
ThreadPoolMetrics metrics() const;
ThreadPoolStats stats() const;

const ThreadPoolConfig& config() const noexcept;

std::size_t thread_count() const noexcept;
std::size_t pending() const;
```

### Queue control

```cpp id="tx8fio"
std::size_t clear();
```

`clear()` removes queued tasks that have not started.

See [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown) before using it with Future-producing tasks.

### Task IDs

```cpp id="lo53rz"
TaskId next_task_id() noexcept;
```

This reserves and returns the next pool task ID without submitting work.

See [Thread Pool](/modules/threadpool/thread-pool).

## Executor

Header:

```cpp id="fzx85l"
#include <vix/threadpool/Executor.hpp>
```

Abstract interface:

```cpp id="f51zfm"
class Executor
{
public:
  using Task = std::function<void()>;

  virtual bool post(
    Task task,
    TaskOptions options = {}
  ) = 0;

  virtual void shutdown() noexcept = 0;
  virtual void wait_idle() = 0;

  virtual bool running() const noexcept = 0;
  virtual bool idle() const = 0;

  virtual ThreadPoolMetrics metrics() const = 0;
  virtual ThreadPoolStats stats() const = 0;
};
```

Implementations include:

```text id="eby0ao"
ThreadPool
InlineExecutor
ThreadPoolExecutor
```

See [Executors](/modules/threadpool/executors).

## ExecutorRef

Header:

```cpp id="g6skki"
#include <vix/threadpool/Executor.hpp>
```

`ExecutorRef` is a non-owning reference to an `Executor`.

Construction:

```cpp id="7parls"
ExecutorRef() noexcept;
ExecutorRef(Executor& executor) noexcept;
```

Important operations:

```cpp id="tbhq9f"
bool valid() const noexcept;
explicit operator bool() const noexcept;

Executor& get() const noexcept;

bool post(
  Executor::Task task,
  TaskOptions options = {}
) const;

void shutdown() const noexcept;
void wait_idle() const;

bool running() const noexcept;
bool idle() const;

ThreadPoolMetrics metrics() const;
ThreadPoolStats stats() const;
```

The referenced executor must outlive the `ExecutorRef`.

## InlineExecutor

Header:

```cpp id="8kr220"
#include <vix/threadpool/InlineExecutor.hpp>
```

Type:

```cpp id="mkgknh"
vix::threadpool::InlineExecutor
```

It implements `Executor` by executing posted work synchronously on the calling thread.

Primary operations:

```cpp id="bgj58g"
bool post(
  Executor::Task task,
  TaskOptions options = {}
);

void shutdown() noexcept;
void wait_idle();

bool running() const noexcept;
bool idle() const;

ThreadPoolMetrics metrics() const;
ThreadPoolStats stats() const;
```

See [Executors](/modules/threadpool/executors).

## ThreadPoolExecutor

Header:

```cpp id="w4ml0d"
#include <vix/threadpool/ThreadPoolExecutor.hpp>
```

Adapter around an existing `ThreadPool`.

Construction:

```cpp id="uup0gw"
ThreadPoolExecutor() noexcept;
explicit ThreadPoolExecutor(ThreadPool& pool) noexcept;
```

Important operations:

```cpp id="f626bq"
void reset(ThreadPool& pool) noexcept;
void reset() noexcept;

bool valid() const noexcept;
explicit operator bool() const noexcept;

bool post(
  Executor::Task task,
  TaskOptions options = {}
);

void shutdown() noexcept;
void wait_idle();

bool running() const noexcept;
bool idle() const;

ThreadPoolMetrics metrics() const;
ThreadPoolStats stats() const;

ThreadPool* pool() noexcept;
const ThreadPool* pool() const noexcept;
```

The adapter does not own the referenced pool.

## Executor traits

Header:

```cpp id="k7y26o"
#include <vix/threadpool/ExecutorTraits.hpp>
```

Detection traits:

```cpp id="u06frt"
HasPost<Executor, Fn>
HasSubmit<Executor, Fn>
HasSubmitWithOptions<Executor, Fn>
HasShutdown<Executor>
HasWaitIdle<Executor>
```

Convenience constants:

```cpp id="t51ldq"
has_post_v<Executor, Fn>
has_submit_v<Executor, Fn>
has_submit_with_options_v<Executor, Fn>
has_shutdown_v<Executor>
has_wait_idle_v<Executor>
```

Executor-shape traits:

```cpp id="t5zh68"
IsBasicExecutor<Executor, Fn>
IsFutureExecutor<Executor, Fn>

is_basic_executor_v<Executor, Fn>
is_future_executor_v<Executor, Fn>
```

## ThreadPoolConfig

Header:

```cpp id="k03mng"
#include <vix/threadpool/ThreadPoolConfig.hpp>
```

Fields:

```cpp id="576k0h"
struct ThreadPoolConfig
{
  std::size_t thread_count;
  std::size_t max_thread_count;
  std::size_t max_queue_size;

  TaskPriority default_priority;

  bool allow_dynamic_growth;
  bool drain_on_shutdown;
  bool swallow_task_exceptions;

  std::chrono::microseconds idle_wait;
  std::chrono::milliseconds default_timeout;
};
```

Helpers:

```cpp id="5r5bkw"
ThreadPoolConfig normalized() const noexcept;

static std::size_t default_thread_count() noexcept;
```

Current defaults:

```text id="a1c1qp"
thread_count           hardware concurrency or 1
max_thread_count       hardware concurrency or 1
max_queue_size         0
default_priority       normal
allow_dynamic_growth   false
drain_on_shutdown      true
swallow_task_exceptions true
idle_wait              0 us
default_timeout        0 ms
```

Some configuration fields are currently stored but are not wired into the high-level runtime behavior.

See [Configuration](/modules/threadpool/configuration).

## TaskOptions

Header:

```cpp id="tl0m0a"
#include <vix/threadpool/TaskOptions.hpp>
```

Fields:

```cpp id="wiu7g7"
struct TaskOptions
{
  TaskPriority priority;
  Timeout timeout;
  Deadline deadline;
  CancellationToken cancellation;
  WorkerId affinity;

  bool allow_after_stop;
  bool detached;

  std::uint32_t flags;
};
```

Factories:

```cpp id="itqwnn"
TaskOptions::with_priority(TaskPriority);
TaskOptions::with_timeout(Timeout);
TaskOptions::with_deadline(Deadline);
TaskOptions::with_cancellation(CancellationToken);
TaskOptions::with_affinity(WorkerId);
```

Inspection:

```cpp id="u63xkf"
bool has_affinity() const noexcept;
bool has_timeout() const noexcept;
bool has_deadline() const noexcept;
bool has_cancellation() const noexcept;

bool should_skip_before_run() const noexcept;
```

Setters:

```cpp id="ld7auv"
TaskOptions& set_priority(TaskPriority);
TaskOptions& set_timeout(Timeout);
TaskOptions& set_deadline(Deadline);
TaskOptions& set_cancellation(CancellationToken);
TaskOptions& set_affinity(WorkerId);
TaskOptions& set_detached(bool);
TaskOptions& set_allow_after_stop(bool);
```

See [Tasks and Options](/modules/threadpool/tasks).

## Task identifiers

Header:

```cpp id="2x1a40"
#include <vix/threadpool/TaskId.hpp>
```

Type:

```cpp id="gw2sx3"
using TaskId = std::uint64_t;
```

Invalid value:

```cpp id="36wdkc"
inline constexpr TaskId invalid_task_id = 0;
```

Helper:

```cpp id="7qlot8"
bool is_valid_task_id(TaskId id) noexcept;
```

## Worker identifiers

Header:

```cpp id="7q5ik7"
#include <vix/threadpool/WorkerId.hpp>
```

Type:

```cpp id="hlwpk2"
using WorkerId = std::uint32_t;
```

Invalid value:

```cpp id="gppat0"
inline constexpr WorkerId invalid_worker_id = 0;
```

Helper:

```cpp id="i8gj4z"
bool is_valid_worker_id(WorkerId id) noexcept;
```

See [Worker Affinity](/modules/threadpool/worker-affinity).

## TaskPriority

Header:

```cpp id="91txlj"
#include <vix/threadpool/TaskPriority.hpp>
```

Values:

```cpp id="yey0zt"
enum class TaskPriority : std::int32_t
{
  lowest = -2,
  low = -1,
  normal = 0,
  high = 1,
  highest = 2
};
```

Helpers:

```cpp id="08nkpx"
std::int32_t to_priority_value(
  TaskPriority priority
) noexcept;

bool priority_higher_than(
  TaskPriority lhs,
  TaskPriority rhs
) noexcept;

const char* to_string(
  TaskPriority priority
) noexcept;
```

See [Priorities](/modules/threadpool/priorities).

## TaskStatus

Header:

```cpp id="mxml2m"
#include <vix/threadpool/TaskStatus.hpp>
```

Values:

```cpp id="bueyxl"
enum class TaskStatus : std::uint8_t
{
  created = 0,
  queued = 1,
  running = 2,
  completed = 3,
  failed = 4,
  cancelled = 5,
  timed_out = 6,
  rejected = 7
};
```

Helpers:

```cpp id="12te3e"
bool is_terminal(TaskStatus status) noexcept;
bool is_active(TaskStatus status) noexcept;
const char* to_string(TaskStatus status) noexcept;
```

See [Task Results and Status](/modules/threadpool/task-results-and-status).

## TaskResult

Header:

```cpp id="b1wye1"
#include <vix/threadpool/TaskResult.hpp>
```

Values:

```cpp id="931gur"
enum class TaskResult : std::uint8_t
{
  none = 0,
  success = 1,
  failure = 2,
  cancelled = 3,
  timeout = 4,
  rejected = 5
};
```

Helpers:

```cpp id="pslrz5"
bool is_success(TaskResult result) noexcept;
bool is_failure(TaskResult result) noexcept;
const char* to_string(TaskResult result) noexcept;
```

## `Future<T>`

Header:

```cpp id="dksb77"
#include <vix/threadpool/Future.hpp>
```

Type:

```cpp id="nczi0g"
template <class T>
class Future;
```

Important API:

```cpp id="0n577v"
using value_type = T;

bool valid() const noexcept;
explicit operator bool() const noexcept;

void wait() const;
bool ready() const;

template <class Rep, class Period>
std::future_status wait_for(
  const std::chrono::duration<Rep, Period>& timeout
) const;

template <class Clock, class Duration>
std::future_status wait_until(
  const std::chrono::time_point<Clock, Duration>& timeout
) const;

T get();

TaskStatus status() const;
TaskResult result() const;
ThreadPoolErrc error() const;
```

`Future<void>` is supported through the same template interface with `get()` returning `void`.

Futures are move-only.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## `Promise<T>`

Header:

```cpp id="nd2ji8"
#include <vix/threadpool/Promise.hpp>
```

Type:

```cpp id="jw7pyv"
template <class T>
class Promise;
```

Important API:

```cpp id="thwbbg"
using value_type = T;

bool valid() const noexcept;

Future<T> get_future();

void set_value(T value);

template <class... Args>
void emplace_value(Args&&... args);

void set_exception(std::exception_ptr exception);
void set_current_exception();

void set_error(ThreadPoolErrc error);

std::shared_ptr<SharedState<T>> state() const noexcept;
```

`Promise<void>` provides:

```cpp id="hwvh5s"
Future<void> get_future();

void set_value();
void set_exception(std::exception_ptr exception);
void set_current_exception();
void set_error(ThreadPoolErrc error);
```

Promises are move-only.

See [Futures and Promises](/modules/threadpool/futures-and-promises).

## `SharedState<T>`

Header:

```cpp id="fcn7zn"
#include <vix/threadpool/SharedState.hpp>
```

`SharedState<T>` is the shared synchronization and result storage used internally by `Promise<T>` and `Future<T>`.

It stores:

```text id="6rbpsb"
readiness
value
exception
ThreadPoolErrc
TaskStatus
TaskResult
retrieval state
```

It is publicly available for advanced integrations, but ordinary application code should normally use `Promise<T>` and `Future<T>` rather than manipulating shared state directly.

## `TaskHandle<T>`

Header:

```cpp id="j6jj63"
#include <vix/threadpool/TaskHandle.hpp>
```

Important API:

```cpp id="hb686j"
using value_type = T;

TaskId id() const noexcept;

bool valid() const noexcept;
explicit operator bool() const noexcept;

void cancel() noexcept;
bool cancelled() const noexcept;

bool ready() const;
void wait() const;
T get();

TaskStatus status() const;
TaskResult result() const;
ThreadPoolErrc error() const;

Future<T>& future() noexcept;
const Future<T>& future() const noexcept;

CancellationSource& cancellation_source() noexcept;
const CancellationSource& cancellation_source() const noexcept;
```

`TaskHandle` is move-only.

See [Task Handles](/modules/threadpool/task-handles).

## CancellationToken

Header:

```cpp id="h2qv66"
#include <vix/threadpool/CancellationToken.hpp>
```

Important API:

```cpp id="pddo3z"
CancellationToken() noexcept;

bool can_cancel() const noexcept;

bool cancelled() const noexcept;
bool is_cancelled() const noexcept;
bool stop_requested() const noexcept;

bool can_continue() const noexcept;

void reset() noexcept;
```

A default token is disconnected.

See [Cancellation](/modules/threadpool/cancellation).

## CancellationSource

Header:

```cpp id="2qp7iz"
#include <vix/threadpool/CancellationSource.hpp>
```

Important API:

```cpp id="uhks8h"
CancellationSource();

CancellationToken token() const noexcept;

void request_cancel() noexcept;

bool cancelled() const noexcept;
bool is_cancelled() const noexcept;

bool valid() const noexcept;

void reset();
```

`reset()` creates a new cancellation state. Previously created tokens remain attached to the old state.

## CancellationState

Header:

```cpp id="7crfsj"
#include <vix/threadpool/CancellationToken.hpp>
```

Low-level shared cancellation state:

```cpp id="wfi6cm"
class CancellationState
{
public:
  void request_cancel() noexcept;
  bool cancelled() const noexcept;
};
```

Applications should normally use `CancellationSource` and `CancellationToken`.

## Timeout

Header:

```cpp id="ilv3h2"
#include <vix/threadpool/Timeout.hpp>
```

Type:

```cpp id="zw03wa"
class Timeout
```

Duration type:

```cpp id="y50v1o"
using duration = std::chrono::milliseconds;
```

Construction and factories:

```cpp id="dm93o8"
Timeout() noexcept;
explicit Timeout(duration value) noexcept;

static Timeout disabled() noexcept;
static Timeout milliseconds(long long value) noexcept;
static Timeout seconds(long long value) noexcept;
```

Inspection:

```cpp id="qt71fn"
bool enabled() const noexcept;
bool disabled_value() const noexcept;

duration value() const noexcept;
long long count() const noexcept;
```

Elapsed-time check:

```cpp id="3vjqut"
template <class Rep, class Period>
bool expired(
  const std::chrono::duration<Rep, Period>& elapsed
) const noexcept;
```

Comparison:

```cpp id="dpagnz"
operator==
operator!=
```

See [Timeouts](/modules/threadpool/timeouts).

## Deadline

Header:

```cpp id="p9vs9f"
#include <vix/threadpool/Deadline.hpp>
```

Clock types:

```cpp id="6ehvdr"
using clock = std::chrono::steady_clock;
using time_point = clock::time_point;
```

Construction and factories:

```cpp id="mxmdvp"
Deadline() noexcept;
explicit Deadline(time_point time) noexcept;

static Deadline disabled() noexcept;
static Deadline from_timeout(Timeout timeout) noexcept;

template <class Rep, class Period>
static Deadline after(
  const std::chrono::duration<Rep, Period>& duration
) noexcept;
```

Inspection:

```cpp id="qn045r"
bool enabled() const noexcept;
bool disabled_value() const noexcept;

time_point time() const noexcept;

bool expired() const noexcept;
bool expired_at(time_point now) const noexcept;

clock::duration remaining() const noexcept;
std::chrono::milliseconds remaining_ms() const noexcept;
```

Comparison:

```cpp id="j7pw8e"
operator==
operator!=
```

See [Deadlines](/modules/threadpool/deadlines).

## Scope

Header:

```cpp id="cpctbc"
#include <vix/threadpool/Scope.hpp>
```

Construction:

```cpp id="4e12kv"
explicit Scope(ThreadPool& pool) noexcept;
```

Submission:

```cpp id="nb1o4i"
template <class Fn>
bool spawn(
  Fn&& fn,
  TaskOptions options = {}
);
```

Control:

```cpp id="7vs0ui"
void close();

void cancel() noexcept;
bool cancelled() const noexcept;
CancellationToken cancellation_token() const noexcept;

void wait();
void wait_and_rethrow();
```

Inspection:

```cpp id="em6t32"
bool empty() const;
std::size_t size() const;
bool closed() const;
```

`Scope` is neither copyable nor movable.

Its destructor waits for tracked Futures and swallows exceptions.

See [Scopes](/modules/threadpool/scopes).

## TaskGroup

Header:

```cpp id="16qjgi"
#include <vix/threadpool/TaskGroup.hpp>
```

`TaskGroup` provides manual task accounting.

Core operations:

```cpp id="j8v7lh"
bool add_task(TaskId id);

void finish_task(
  TaskStatus status,
  TaskResult result,
  std::exception_ptr exception = nullptr
);

void close();

void cancel() noexcept;

void wait();
void wait_and_rethrow();
```

Cancellation:

```cpp id="pg9y3s"
CancellationToken cancellation_token() const noexcept;

CancellationSource& cancellation_source() noexcept;
const CancellationSource& cancellation_source() const noexcept;

bool cancelled() const noexcept;
```

State:

```cpp id="owvd9s"
bool done() const;
bool closed() const;
bool empty() const;
```

Counters:

```cpp id="l957h5"
std::uint64_t total_tasks() const;
std::uint64_t pending_tasks() const;

std::uint64_t completed_tasks() const;
std::uint64_t failed_tasks() const;
std::uint64_t cancelled_tasks() const;
std::uint64_t timed_out_tasks() const;
std::uint64_t rejected_tasks() const;
```

Outcome inspection:

```cpp id="6k751l"
bool has_failure() const;
bool has_error() const;

std::exception_ptr first_exception() const;

std::vector<TaskId> task_ids() const;
```

`TaskGroupState` exposes the underlying thread-safe implementation and substantially the same accounting API.

See [Task Groups](/modules/threadpool/task-groups).

## TaskGuard

Header:

```cpp id="rm0bgq"
#include <vix/threadpool/TaskGuard.hpp>
```

Template:

```cpp id="ky49hv"
template <class T>
class TaskGuard;
```

Construction:

```cpp id="62syvc"
explicit TaskGuard(
  std::atomic<T>& counter
) noexcept;
```

Construction increments the counter.

Destruction decrements it once unless already released.

Operations:

```cpp id="t82ai3"
void release() noexcept;
bool active() const noexcept;
```

The type is move-constructible but not copyable.

A deduction guide allows:

```cpp id="g5fr5f"
std::atomic<int> active{0};

vix::threadpool::TaskGuard guard(active);
```

## Latch

Header:

```cpp id="7a6v5u"
#include <vix/threadpool/Latch.hpp>
```

Construction:

```cpp id="drqczx"
explicit Latch(std::size_t count) noexcept;
```

Operations:

```cpp id="ug609v"
void count_down();
void count_down(std::size_t amount);

void arrive_and_wait();
void wait() const;

bool ready() const;
bool is_ready() const;

std::size_t count() const;
```

`Latch` is one-shot and neither copyable nor movable.

See [Synchronization](/modules/threadpool/synchronization).

## Barrier

Header:

```cpp id="y6o80j"
#include <vix/threadpool/Barrier.hpp>
```

Construction:

```cpp id="w4y367"
explicit Barrier(
  std::size_t participants
) noexcept;
```

Operations:

```cpp id="vtwdm0"
void arrive_and_wait();
void arrive();

void wait();

void release();

std::size_t participants() const;
std::size_t remaining() const;
std::size_t generation() const;
```

`Barrier` automatically begins a new generation when all participants arrive.

It is neither copyable nor movable.

See [Synchronization](/modules/threadpool/synchronization).

## PeriodicTaskConfig

Header:

```cpp id="dxncx8"
#include <vix/threadpool/PeriodicTask.hpp>
```

Fields:

```cpp id="6dy1wm"
struct PeriodicTaskConfig
{
  std::chrono::milliseconds interval;
  TaskOptions options;

  bool run_immediately;
  bool stop_on_post_failure;
};
```

Factory:

```cpp id="2t12nk"
static PeriodicTaskConfig every(
  std::chrono::milliseconds interval
) noexcept;
```

Helpers:

```cpp id="95wqpy"
static std::chrono::milliseconds normalize_interval(
  std::chrono::milliseconds value
) noexcept;

PeriodicTaskConfig normalized() const noexcept;
```

Default interval:

```text id="8inqbd"
1000 ms
```

## PeriodicTask

Header:

```cpp id="04gyxn"
#include <vix/threadpool/PeriodicTask.hpp>
```

Callback:

```cpp id="lk2c20"
using Callback = std::function<void()>;
```

Important lifecycle API:

```cpp id="5x88kl"
bool start();

void stop() noexcept;
void join() noexcept;

bool running() const noexcept;
bool joinable() const noexcept;
```

Inspection:

```cpp id="x40nx6"
std::uint64_t submitted_ticks() const noexcept;
std::uint64_t failed_posts() const noexcept;

const PeriodicTaskConfig& config() const noexcept;
```

The task is not started during construction.

See [Periodic Tasks](/modules/threadpool/periodic-tasks).

## ParallelForOptions

Header:

```cpp id="ubh8q8"
#include <vix/threadpool/ParallelFor.hpp>
```

Fields:

```cpp id="r3xdxg"
struct ParallelForOptions
{
  std::size_t chunk_size;
  TaskOptions task_options;
};
```

Factory:

```cpp id="qv8mdm"
static ParallelForOptions with_chunk_size(
  std::size_t value
) noexcept;
```

A zero chunk size enables automatic calculation.

Shared helper:

```cpp id="jxaaih"
std::size_t compute_parallel_chunk_size(
  std::size_t total,
  std::size_t workerCount,
  std::size_t requestedChunkSize
) noexcept;
```

## parallel_for

Header:

```cpp id="pq6xgp"
#include <vix/threadpool/ParallelFor.hpp>
```

Explicit pool:

```cpp id="py3eu8"
template <class Index, class Fn>
void parallel_for(
  ThreadPool& pool,
  Index first,
  Index last,
  Fn&& fn,
  ParallelForOptions options = {}
);
```

Temporary pool:

```cpp id="fb3alr"
template <class Index, class Fn>
void parallel_for(
  Index first,
  Index last,
  Fn&& fn,
  ParallelForOptions options = {}
);
```

`Index` must be integral.

The range is:

```text id="2f8pm5"
[first, last)
```

See [Parallel For](/modules/threadpool/parallel-for).

## ParallelForEachOptions

Header:

```cpp id="voxwh9"
#include <vix/threadpool/ParallelForEach.hpp>
```

Fields:

```cpp id="a46smj"
struct ParallelForEachOptions
{
  std::size_t chunk_size;
  TaskOptions task_options;
};
```

Factory:

```cpp id="3dfxf1"
static ParallelForEachOptions with_chunk_size(
  std::size_t value
) noexcept;
```

## parallel_for_each

Header:

```cpp id="1jh1er"
#include <vix/threadpool/ParallelForEach.hpp>
```

Iterator range:

```cpp id="2dkd0i"
template <class Iterator, class Fn>
void parallel_for_each(
  ThreadPool& pool,
  Iterator first,
  Iterator last,
  Fn&& fn,
  ParallelForEachOptions options = {}
);
```

Container:

```cpp id="wrye6n"
template <class Container, class Fn>
void parallel_for_each(
  ThreadPool& pool,
  Container& container,
  Fn&& fn,
  ParallelForEachOptions options = {}
);
```

Temporary-pool overloads exist for both iterator ranges and containers.

See [Parallel For Each](/modules/threadpool/parallel-for-each).

## ParallelMapOptions

Header:

```cpp id="sp5dpi"
#include <vix/threadpool/ParallelMap.hpp>
```

Fields:

```cpp id="hhdk8c"
struct ParallelMapOptions
{
  std::size_t chunk_size;
  TaskOptions task_options;
};
```

Factory:

```cpp id="n0n8h1"
static ParallelMapOptions with_chunk_size(
  std::size_t value
) noexcept;
```

## parallel_map

Header:

```cpp id="57af1p"
#include <vix/threadpool/ParallelMap.hpp>
```

Iterator range:

```cpp id="xqgrva"
template <class Iterator, class Fn>
auto parallel_map(
  ThreadPool& pool,
  Iterator first,
  Iterator last,
  Fn&& fn,
  ParallelMapOptions options = {}
) -> std::vector<Result>;
```

Container:

```cpp id="pc8o07"
template <class Container, class Fn>
auto parallel_map(
  ThreadPool& pool,
  Container& container,
  Fn&& fn,
  ParallelMapOptions options = {}
);
```

Temporary-pool overloads exist for iterator and container forms.

Output order matches input order.

See [Parallel Map](/modules/threadpool/parallel-map).

## ParallelReduceOptions

Header:

```cpp id="1zh6tb"
#include <vix/threadpool/ParallelReduce.hpp>
```

Fields:

```cpp id="b7286f"
struct ParallelReduceOptions
{
  std::size_t chunk_size;
  TaskOptions task_options;
};
```

Factory:

```cpp id="xl0h92"
static ParallelReduceOptions with_chunk_size(
  std::size_t value
) noexcept;
```

## parallel_reduce

Header:

```cpp id="bbxej4"
#include <vix/threadpool/ParallelReduce.hpp>
```

Iterator range:

```cpp id="q4uz7h"
template <class Iterator, class T, class ReduceFn>
T parallel_reduce(
  ThreadPool& pool,
  Iterator first,
  Iterator last,
  T initial,
  ReduceFn&& reduce,
  ParallelReduceOptions options = {}
);
```

Container:

```cpp id="ys0smk"
template <class Container, class T, class ReduceFn>
T parallel_reduce(
  ThreadPool& pool,
  Container& container,
  T initial,
  ReduceFn&& reduce,
  ParallelReduceOptions options = {}
);
```

Temporary-pool overloads are also available.

Current implementation note:

```text id="b4qeq7"
initial is applied to every chunk
and again to the final partial reduction
```

Use an identity value with the current implementation.

See [Parallel Reduce](/modules/threadpool/parallel-reduce).

## ParallelPipelineOptions

Header:

```cpp id="qd3uw4"
#include <vix/threadpool/ParallelPipeline.hpp>
```

Fields:

```cpp id="d8xhhu"
struct ParallelPipelineOptions
{
  TaskOptions task_options;
};
```

## parallel_pipeline

Header:

```cpp id="9z2tun"
#include <vix/threadpool/ParallelPipeline.hpp>
```

Explicit pool:

```cpp id="dk4v4k"
template <class... Stages>
void parallel_pipeline(
  ThreadPool& pool,
  ParallelPipelineOptions options,
  Stages&&... stages
);
```

Default-options form:

```cpp id="le0q32"
template <class... Stages>
void parallel_pipeline(
  ThreadPool& pool,
  Stages&&... stages
);
```

Temporary-pool forms are also available.

Stages are independent and execute concurrently when worker capacity allows.

Their return values are discarded.

See [Parallel Pipeline](/modules/threadpool/parallel-pipeline).

## Pipeline

Header:

```cpp id="n40jcj"
#include <vix/threadpool/ParallelPipeline.hpp>
```

Reusable pipeline builder:

```cpp id="pmzglh"
class Pipeline
```

Stored stage type:

```cpp id="m90yyu"
using Stage = std::function<void()>;
```

Construction:

```cpp id="4g9ept"
Pipeline();
explicit Pipeline(
  ParallelPipelineOptions options
);
```

Stage registration:

```cpp id="gvden3"
template <class Fn>
Pipeline& add(Fn&& fn);
```

Management:

```cpp id="whi51z"
void clear();

std::size_t size() const noexcept;
bool empty() const noexcept;
```

Options:

```cpp id="0ej0q0"
const ParallelPipelineOptions& options() const noexcept;

void set_options(
  ParallelPipelineOptions options
);
```

Execution:

```cpp id="cy5v7u"
void run(ThreadPool& pool);
void run();
```

`run()` does not clear registered stages.

## Convenience parallel namespace

Header:

```cpp id="098275"
#include <vix/threadpool/Parallel.hpp>
```

Namespace:

```cpp id="70f05d"
vix::threadpool::parallel
```

Convenience functions:

```cpp id="mrt31b"
parallel::for_range(...)
parallel::for_each(...)
parallel::map(...)
parallel::reduce(...)
parallel::pipeline(...)
```

They forward to the corresponding top-level parallel APIs.

## ThreadPoolMetrics

Header:

```cpp id="y39chd"
#include <vix/threadpool/ThreadPoolMetrics.hpp>
```

Fields:

```cpp id="zwmjoy"
struct ThreadPoolMetrics
{
  std::size_t worker_count;
  std::size_t pending_tasks;
  std::uint64_t active_tasks;

  std::size_t idle_workers;
  std::size_t busy_workers;

  std::uint64_t submitted_tasks;
  std::uint64_t completed_tasks;
  std::uint64_t failed_tasks;
  std::uint64_t cancelled_tasks;
  std::uint64_t timed_out_tasks;
  std::uint64_t rejected_tasks;
};
```

Helpers:

```cpp id="iwdggc"
bool idle() const noexcept;

std::uint64_t finished_tasks() const noexcept;
std::uint64_t error_tasks() const noexcept;
```

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## ThreadPoolStats

Header:

```cpp id="s6rt7w"
#include <vix/threadpool/ThreadPoolStats.hpp>
```

Fields:

```cpp id="ccr8g2"
struct ThreadPoolStats
{
  std::uint64_t accepted_tasks;
  std::uint64_t rejected_tasks;

  std::uint64_t completed_tasks;
  std::uint64_t failed_tasks;
  std::uint64_t cancelled_tasks;
  std::uint64_t timed_out_tasks;

  std::uint64_t worker_wakeups;
  std::uint64_t idle_waits;

  std::chrono::nanoseconds total_execution_time;
  std::chrono::nanoseconds max_execution_time;
};
```

Helpers:

```cpp id="w7pcrx"
std::uint64_t submitted_tasks() const noexcept;
std::uint64_t finished_tasks() const noexcept;
std::uint64_t error_tasks() const noexcept;

bool empty() const noexcept;

std::chrono::nanoseconds
average_execution_time() const noexcept;
```

Some timing and wakeup fields are currently exposed but not populated by `ThreadPool`.

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## ThreadPoolErrc

Header:

```cpp id="ysv6d5"
#include <vix/threadpool/ThreadPoolError.hpp>
```

Values:

```cpp id="p0ih99"
enum class ThreadPoolErrc : std::uint8_t
{
  ok = 0,
  invalid_argument = 1,
  stopped = 2,
  rejected = 3,
  queue_full = 4,
  timeout = 5,
  cancelled = 6,
  not_ready = 7,
  not_supported = 8,
  internal_error = 9
};
```

Helpers:

```cpp id="o8ykla"
const std::error_category&
threadpool_category() noexcept;

std::error_code
make_error_code(ThreadPoolErrc error) noexcept;

bool is_ok(ThreadPoolErrc error) noexcept;
bool is_error(ThreadPoolErrc error) noexcept;
```

`ThreadPoolErrc` is registered as a standard error-code enum and can be converted to `std::error_code`.

See [Errors](/modules/threadpool/errors).

## SchedulingPolicy

Header:

```cpp id="36vhnm"
#include <vix/threadpool/SchedulingPolicy.hpp>
```

Values:

```cpp id="g5n74k"
enum class SchedulingPolicy : std::uint8_t
{
  round_robin = 0,
  least_loaded = 1,
  affinity = 2,
  affinity_then_least_loaded = 3
};
```

Default:

```cpp id="q4b9oi"
default_scheduling_policy()
```

returns:

```cpp id="lt8y8l"
SchedulingPolicy::affinity_then_least_loaded
```

Helpers:

```cpp id="i6hsuj"
bool uses_affinity(
  SchedulingPolicy policy
) noexcept;

bool uses_load_balancing(
  SchedulingPolicy policy
) noexcept;

const char* to_string(
  SchedulingPolicy policy
) noexcept;
```

See [Scheduling Model](/modules/threadpool/scheduling).

## RejectionPolicy

Header:

```cpp id="3ggo4h"
#include <vix/threadpool/RejectionPolicy.hpp>
```

Values:

```cpp id="qkh9ak"
enum class RejectionPolicy : std::uint8_t
{
  reject = 0,
  caller_runs = 1,
  discard = 2
};
```

Default:

```cpp id="t3pqpt"
default_rejection_policy()
```

returns:

```cpp id="rmktkx"
RejectionPolicy::reject
```

Helpers:

```cpp id="3w4yr5"
bool runs_on_caller(
  RejectionPolicy policy
) noexcept;

bool discards_task(
  RejectionPolicy policy
) noexcept;

bool reports_rejection(
  RejectionPolicy policy
) noexcept;

const char* to_string(
  RejectionPolicy policy
) noexcept;
```

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## QueuePolicy

Header:

```cpp id="su987k"
#include <vix/threadpool/QueuePolicy.hpp>
```

Values:

```cpp id="34uy9z"
enum class QueuePolicy : std::uint8_t
{
  priority = 0,
  fifo = 1,
  lifo = 2
};
```

Default:

```cpp id="sp1bsb"
default_queue_policy()
```

returns:

```cpp id="b8n1c1"
QueuePolicy::priority
```

Helpers:

```cpp id="lpam0i"
bool uses_priority(
  QueuePolicy policy
) noexcept;

bool is_fifo(
  QueuePolicy policy
) noexcept;

bool is_lifo(
  QueuePolicy policy
) noexcept;

const char* to_string(
  QueuePolicy policy
) noexcept;
```

Current runtime note: the public enum exists, but `TaskQueue` currently always uses priority ordering with FIFO sequence ordering for equal priorities.

See [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection).

## WorkerState

Header:

```cpp id="8x20h1"
#include <vix/threadpool/WorkerState.hpp>
```

Values:

```cpp id="o7cy2i"
enum class WorkerState : std::uint8_t
{
  created = 0,
  idle = 1,
  running = 2,
  stopping = 3,
  stopped = 4,
  failed = 5
};
```

Helpers:

```cpp id="vol0kx"
bool is_terminal(WorkerState state) noexcept;
bool can_execute(WorkerState state) noexcept;
const char* to_string(WorkerState state) noexcept;
```

## this_worker

Header:

```cpp id="jq8vek"
#include <vix/threadpool/this_worker.hpp>
```

Namespace:

```cpp id="b5rktr"
vix::threadpool::this_worker
```

Public inspection:

```cpp id="5hfrbh"
bool inside() noexcept;
WorkerId id() noexcept;
std::size_t index() noexcept;
TaskId task_id() noexcept;
```

These functions expose the worker context associated with the current thread.

The same header also exposes low-level context management functions:

```cpp id="5w20p4"
void set(
  WorkerId workerId,
  std::size_t workerIndex
) noexcept;

void set_task(TaskId taskId) noexcept;
void clear_task() noexcept;
void clear() noexcept;
```

Normal application code usually only needs the inspection functions.

See [Worker Affinity](/modules/threadpool/worker-affinity).

## Task

Header:

```cpp id="zjyeuu"
#include <vix/threadpool/Task.hpp>
```

Callable storage:

```cpp id="q6ww43"
using TaskFunction =
  detail::MoveOnlyFunction<void()>;
```

`Task` is the low-level executable unit used by workers and the scheduler.

Important inspection:

```cpp id="ydo1x9"
TaskId id() const noexcept;

const TaskOptions& options() const noexcept;
TaskOptions& options() noexcept;

TaskPriority priority() const noexcept;
std::uint64_t sequence() const noexcept;

TaskStatus status() const noexcept;
TaskResult result() const noexcept;

std::exception_ptr exception() const noexcept;

bool valid() const noexcept;
bool schedulable() const noexcept;
bool done() const noexcept;

bool running() const noexcept;
bool queued() const noexcept;
bool succeeded() const noexcept;
```

`Task` also exposes lifecycle operations used by the runtime to mark and execute work.

Most application code should use `ThreadPool::post()`, `submit()`, or `handle()` rather than constructing low-level Tasks directly.

See [Tasks and Options](/modules/threadpool/tasks).

## TaskCmp

Header:

```cpp id="h7h80i"
#include <vix/threadpool/TaskCmp.hpp>
```

`TaskCmp` defines the current queue ordering:

```text id="m96e2p"
higher priority first
      ↓
equal priority
      ↓
smaller sequence first
```

It is used by `TaskQueue`.

## TaskQueue

Header:

```cpp id="zqqeok"
#include <vix/threadpool/TaskQueue.hpp>
```

Construction:

```cpp id="ojzpf1"
TaskQueue() noexcept;
explicit TaskQueue(
  std::size_t maxSize
) noexcept;
```

Submission:

```cpp id="zsivyt"
bool push(Task task);

std::size_t push_batch(
  std::vector<Task> tasks
);
```

Retrieval:

```cpp id="ww456c"
std::optional<Task> pop();

std::optional<Task> pop_active(
  std::atomic<std::uint64_t>& activeTasks
);

const Task* peek() const;
```

Queue management:

```cpp id="tj4w5n"
std::size_t clear();

bool empty() const;
bool full() const;

std::size_t size() const;

std::size_t max_size() const noexcept;
bool bounded() const noexcept;

void set_max_size(
  std::size_t value
) noexcept;
```

`TaskQueue` is thread-safe and currently uses `TaskCmp`.

## SchedulerConfig

Header:

```cpp id="5biort"
#include <vix/threadpool/Scheduler.hpp>
```

Fields:

```cpp id="i2ym13"
struct SchedulerConfig
{
  std::size_t worker_count;
  std::size_t max_queue_size_per_worker;

  SchedulingPolicy scheduling_policy;
  RejectionPolicy rejection_policy;

  bool drain_on_stop;

  std::string worker_name_prefix;
};
```

Helper:

```cpp id="9tv968"
SchedulerConfig normalized() const;
```

Defaults:

```text id="11b990"
worker_count               1
max_queue_size_per_worker  0
scheduling_policy          affinity_then_least_loaded
rejection_policy           reject
drain_on_stop              true
worker_name_prefix         vix-tp
```

## Scheduler

Header:

```cpp id="mq3q1z"
#include <vix/threadpool/Scheduler.hpp>
```

`Scheduler` owns and selects workers.

Main lifecycle:

```cpp id="yos01d"
bool start();

void stop() noexcept;
void join() noexcept;
```

Submission:

```cpp id="0hjen5"
bool submit(Task task);
```

Runtime inspection includes:

```text id="p8o4xx"
running state
stopping state
worker count
queue size
idle state
metrics
statistics
configuration
worker access
queue clearing
```

`Scheduler` is a low-level public runtime type.

Ordinary applications normally interact through `ThreadPool`.

See [Architecture](/modules/threadpool/architecture) and [Scheduling Model](/modules/threadpool/scheduling).

## WorkerMetrics

Header:

```cpp id="s4rtn5"
#include <vix/threadpool/Worker.hpp>
```

Fields:

```cpp id="m9mq7y"
struct WorkerMetrics
{
  WorkerId id;
  std::size_t index;
  WorkerState state;

  std::size_t pending_tasks;
  std::uint64_t active_tasks;

  std::uint64_t accepted_tasks;
  std::uint64_t executed_tasks;
  std::uint64_t completed_tasks;
  std::uint64_t failed_tasks;
  std::uint64_t cancelled_tasks;
  std::uint64_t timed_out_tasks;
  std::uint64_t rejected_tasks;
  std::uint64_t idle_cycles;
};
```

See [Metrics and Statistics](/modules/threadpool/metrics-and-statistics).

## Worker

Header:

```cpp id="lij14t"
#include <vix/threadpool/Worker.hpp>
```

`Worker` owns:

```text id="vhq85q"
worker identity
TaskQueue
WorkerThread
task outcome counters
worker lifecycle state
```

Main runtime operations include:

```cpp id="2hbbvi"
bool start();

void stop() noexcept;
void join() noexcept;

bool submit(Task task);
```

It also exposes queue, state, metrics, configuration, and lifecycle inspection methods.

`Worker` is a low-level runtime type. Most applications should use `ThreadPool`.

## WorkerThread

Header:

```cpp id="52j5uk"
#include <vix/threadpool/WorkerThread.hpp>
```

`WorkerThread` owns the physical `std::thread` associated with a Worker.

Run function:

```cpp id="btx599"
using RunFunction = std::function<void()>;
```

Main operations:

```cpp id="g6b8ta"
bool start(RunFunction fn);

void stop() noexcept;
void join() noexcept;
```

It also exposes worker identity, name, thread state, and joinability information.

This is a low-level runtime abstraction.

## Version

Header:

```cpp id="vyfgl5"
#include <vix/threadpool/version.hpp>
```

Constants:

```cpp id="nv26v0"
inline constexpr int version_major;
inline constexpr int version_minor;
inline constexpr int version_patch;

inline constexpr const char* version;
```

When using the umbrella header:

```cpp id="0jhtgn"
#include <vix/threadpool/all.hpp>
```

two convenience functions are also available:

```cpp id="76e13d"
const char* module_version() noexcept;
bool available() noexcept;
```

`available()` currently always returns `true`.

## Public headers

The complete public module header set is:

| Header                   | Main API                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `all.hpp`                | Complete public ThreadPool API                             |
| `Barrier.hpp`            | `Barrier`                                                  |
| `CancellationSource.hpp` | `CancellationSource`                                       |
| `CancellationToken.hpp`  | `CancellationState`, `CancellationToken`                   |
| `Deadline.hpp`           | `Deadline`                                                 |
| `Executor.hpp`           | `Executor`, `ExecutorRef`                                  |
| `ExecutorTraits.hpp`     | Executor detection traits                                  |
| `Future.hpp`             | `Future<T>`                                                |
| `InlineExecutor.hpp`     | `InlineExecutor`                                           |
| `Latch.hpp`              | `Latch`                                                    |
| `Parallel.hpp`           | `parallel::*` convenience namespace                        |
| `ParallelFor.hpp`        | `ParallelForOptions`, `parallel_for`                       |
| `ParallelForEach.hpp`    | `ParallelForEachOptions`, `parallel_for_each`              |
| `ParallelMap.hpp`        | `ParallelMapOptions`, `parallel_map`                       |
| `ParallelPipeline.hpp`   | `ParallelPipelineOptions`, `parallel_pipeline`, `Pipeline` |
| `ParallelReduce.hpp`     | `ParallelReduceOptions`, `parallel_reduce`                 |
| `PeriodicTask.hpp`       | `PeriodicTaskConfig`, `PeriodicTask`                       |
| `Promise.hpp`            | `Promise<T>`                                               |
| `QueuePolicy.hpp`        | `QueuePolicy`                                              |
| `RejectionPolicy.hpp`    | `RejectionPolicy`                                          |
| `Scheduler.hpp`          | `SchedulerConfig`, `Scheduler`                             |
| `SchedulingPolicy.hpp`   | `SchedulingPolicy`                                         |
| `Scope.hpp`              | `Scope`                                                    |
| `SharedState.hpp`        | `SharedState<T>`                                           |
| `Task.hpp`               | `Task`, `TaskFunction`                                     |
| `TaskCmp.hpp`            | `TaskCmp`                                                  |
| `TaskGroup.hpp`          | `TaskGroupState`, `TaskGroup`                              |
| `TaskGuard.hpp`          | `TaskGuard<T>`                                             |
| `TaskHandle.hpp`         | `TaskHandle<T>`                                            |
| `TaskId.hpp`             | `TaskId`, `invalid_task_id`                                |
| `TaskOptions.hpp`        | `TaskOptions`                                              |
| `TaskPriority.hpp`       | `TaskPriority`                                             |
| `TaskQueue.hpp`          | `TaskQueue`                                                |
| `TaskResult.hpp`         | `TaskResult`                                               |
| `TaskStatus.hpp`         | `TaskStatus`                                               |
| `ThreadPool.hpp`         | `ThreadPool`                                               |
| `ThreadPoolConfig.hpp`   | `ThreadPoolConfig`                                         |
| `ThreadPoolError.hpp`    | `ThreadPoolErrc`, error category helpers                   |
| `ThreadPoolExecutor.hpp` | `ThreadPoolExecutor`                                       |
| `ThreadPoolMetrics.hpp`  | `ThreadPoolMetrics`                                        |
| `ThreadPoolStats.hpp`    | `ThreadPoolStats`                                          |
| `Timeout.hpp`            | `Timeout`                                                  |
| `Worker.hpp`             | `WorkerMetrics`, `Worker`                                  |
| `WorkerId.hpp`           | `WorkerId`, `invalid_worker_id`                            |
| `WorkerState.hpp`        | `WorkerState`                                              |
| `WorkerThread.hpp`       | `WorkerThread`                                             |
| `this_worker.hpp`        | Current worker context                                     |
| `version.hpp`            | Module version constants                                   |

## Recommended include

For applications using several ThreadPool features:

```cpp id="prtjdb"
#include <vix/threadpool/all.hpp>
```

For libraries that want narrower header dependencies, include the individual public headers required by the public or implementation interface.

For example:

```cpp id="13n0mc"
#include <vix/threadpool/ThreadPool.hpp>
#include <vix/threadpool/TaskOptions.hpp>
```

## Recommended API level

The public surface contains both application-level and runtime-level abstractions.

For most application code, start with:

```text id="2y264s"
ThreadPool
TaskOptions
Future
TaskHandle
Scope
CancellationSource
Deadline
Timeout
parallel algorithms
PeriodicTask
metrics
```

Use these lower-level types when implementing custom execution infrastructure or advanced integrations:

```text id="k0g8mg"
Task
TaskQueue
TaskCmp
WorkerThread
Worker
Scheduler
SharedState
CancellationState
```

The high-level architecture is:

```text id="qw8ngn"
application
    ↓
ThreadPool
    ↓
Scheduler
    ↓
Worker
    ↓
TaskQueue
    ↓
Task
```

The higher-level composition APIs build on that same execution path:

```text id="sqaa1g"
Scope
parallel algorithms
PeriodicTask
TaskHandle
      ↓
ThreadPool
      ↓
same scheduler and workers
```

## Current implementation notes

Several public types expose functionality that is broader than the behavior currently wired through `ThreadPool`.

The main current distinctions are:

- `TaskPriority` values are `lowest`, `low`, `normal`, `high`, and `highest`.
- `QueuePolicy` is public, but the current `TaskQueue` implementation always uses priority ordering with FIFO sequence ordering for equal priorities.
- `RejectionPolicy` is configurable on the low-level `Scheduler`, but high-level `ThreadPool` currently constructs its Scheduler with the default `reject` policy.
- `caller_runs` is not applied to every worker queue-full rejection path in the current implementation.
- `ThreadPoolConfig::default_timeout` is currently merged into submitted task options when no task timeout is present.
- Several other `ThreadPoolConfig` fields are currently exposed but not fully wired into high-level runtime behavior.
- `parallel_reduce` currently applies its initial value once to every chunk and again during final combination.
- Execution timeouts do not forcibly interrupt running C++ callables.
- A `submit()` Future can currently report success even when the low-level task is later classified as timed out.
- `clear()` can remove a queued result-producing task without completing its associated Future.
- Non-draining shutdown can similarly leave queued result-producing Futures unresolved.
- `ThreadPoolStats` exposes execution timing and worker-wakeup fields that are not currently populated by `ThreadPool`.
- `ThreadPool` can currently be restarted after shutdown, retaining runtime counters and any queued work left by non-draining shutdown.

The dedicated documentation pages describe these behaviors in detail.

## CMake target

For an installed standalone ThreadPool package:

```cmake id="vc0wir"
find_package(vix_threadpool CONFIG REQUIRED)

target_link_libraries(app
  PRIVATE
    vix::threadpool
)
```

See [CMake](/modules/threadpool/cmake).

## Documentation index

For detailed behavior, use:

- [Overview](/modules/threadpool/)
- [Quick Start](/modules/threadpool/quick-start)
- [Core Concepts](/modules/threadpool/core-concepts)
- [Architecture](/modules/threadpool/architecture)
- [Configuration](/modules/threadpool/configuration)
- [Executors](/modules/threadpool/executors)
- [Thread Pool](/modules/threadpool/thread-pool)
- [Execution Model](/modules/threadpool/execution-model)
- [Tasks and Options](/modules/threadpool/tasks)
- [Task Handles](/modules/threadpool/task-handles)
- [Futures and Promises](/modules/threadpool/futures-and-promises)
- [Task Results and Status](/modules/threadpool/task-results-and-status)
- [Scheduling Model](/modules/threadpool/scheduling)
- [Priorities](/modules/threadpool/priorities)
- [Worker Affinity](/modules/threadpool/worker-affinity)
- [Queue and Rejection Policies](/modules/threadpool/queue-and-rejection)
- [Cancellation](/modules/threadpool/cancellation)
- [Deadlines](/modules/threadpool/deadlines)
- [Timeouts](/modules/threadpool/timeouts)
- [Scopes](/modules/threadpool/scopes)
- [Task Groups](/modules/threadpool/task-groups)
- [Synchronization](/modules/threadpool/synchronization)
- [Parallel Algorithms](/modules/threadpool/parallel-algorithms)
- [Parallel For](/modules/threadpool/parallel-for)
- [Parallel For Each](/modules/threadpool/parallel-for-each)
- [Parallel Map](/modules/threadpool/parallel-map)
- [Parallel Reduce](/modules/threadpool/parallel-reduce)
- [Parallel Pipeline](/modules/threadpool/parallel-pipeline)
- [Periodic Tasks](/modules/threadpool/periodic-tasks)
- [Metrics and Statistics](/modules/threadpool/metrics-and-statistics)
- [Lifecycle and Shutdown](/modules/threadpool/lifecycle-and-shutdown)
- [Errors](/modules/threadpool/errors)
- [CMake](/modules/threadpool/cmake)
