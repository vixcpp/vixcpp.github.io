# API Reference

This page provides a compact reference for the public Vix Async API.

For most application code, include:

```cpp id="g47tmd"
#include <vix/async.hpp>
```

The module is divided into two main public namespaces:

```cpp id="ruaykw"
vix::async::core
vix::async::net
```

Version information lives directly in:

```cpp id="csck5l"
vix::async
```

Types under a `detail` namespace are implementation details and should not be used as application API.

## Core namespace

Most runtime types live in:

```cpp id="ydbrnw"
namespace vix::async::core
```

Common application code can use:

```cpp id="2223a9"
using namespace vix::async::core;
```

The main core API consists of:

```text id="undbm8"
task<T>
scheduler
io_context

cancel_source
cancel_token
cancel_registration

timer
thread_pool
signal_set

spawn_detached()
when_all()
when_any()

errc
```

## `task<T>`

```cpp id="2maenq"
template <typename T>
class task;
```

`task<T>` represents a lazy coroutine computation that eventually produces `T` or throws an exception.

`T` must not be a reference type.

Use a wrapper such as:

```cpp id="pg101o"
std::reference_wrapper<T>
```

when reference semantics are required.

### Construction

```cpp id="tbz72y"
task() noexcept;
```

Tasks returned from coroutine functions are constructed by the coroutine machinery.

Application code normally does not construct a task from a coroutine handle directly.

### Ownership

`task<T>` is move-only:

```cpp id="7ti4io"
task(task&&) noexcept;

task& operator=(task&&) noexcept;

task(const task&) = delete;

task& operator=(const task&) = delete;
```

### State

```cpp id="gkov25"
bool valid() const noexcept;

explicit operator bool() const noexcept;
```

### Awaiting

```cpp id="b2fm5g"
auto operator co_await() & noexcept;

auto operator co_await() && noexcept;
```

The task begins when awaited.

For `task<T>`, `co_await` produces `T`.

For `task<void>`, it produces no value.

Captured exceptions are rethrown at the await boundary.

### Coroutine handle

```cpp id="bj995z"
handle_type handle() const noexcept;

handle_type release() noexcept;
```

These operations expose low-level coroutine ownership.

Most application code does not need them.

### Explicit start

```cpp id="250wkh"
void start(scheduler& sched) && noexcept;
```

`start()`:

- posts the coroutine to the scheduler
- marks the task detached
- releases ownership from the `task` object

Typical root-task use:

```cpp id="o06d4q"
std::move(run(ctx)).start(
  ctx.get_scheduler()
);
```

See [Tasks](./tasks).

## `task<void>`

```cpp id="mbsdxa"
template <>
class task<void>;
```

`task<void>` follows the same ownership, suspension, exception, and start rules as `task<T>`, but has no return value.

Typical form:

```cpp id="vjw3c5"
task<void> work()
{
  co_return;
}
```

## `scheduler`

```cpp id="wlhwgo"
class scheduler;
```

The scheduler executes ready coroutine handles and callbacks on the thread running `run()`.

It is non-copyable.

### Post a callback

```cpp id="dtji3a"
template <typename Fn>
void post(Fn&& fn);
```

Queues an ordinary callable.

### Post a coroutine

```cpp id="knv9n3"
void post(
  std::coroutine_handle<> handle
) noexcept;
```

Explicit fast-path alias:

```cpp id="1fyns7"
void post_handle(
  std::coroutine_handle<> handle
) noexcept;
```

### Schedule the current coroutine

```cpp id="3czu3n"
schedule_awaitable schedule() noexcept;
```

Usage:

```cpp id="nh0qcp"
co_await sched.schedule();
```

The coroutine is posted to the scheduler and later resumes on the scheduler's `run()` thread.

### Run

```cpp id="70z01k"
void run();
```

Runs the scheduler event loop on the calling thread.

Coroutine handles are processed before generic callback work.

### Stop

```cpp id="40jv6v"
void stop() noexcept;
```

Requests stop.

Already queued work is drained before `run()` exits.

### Reset

```cpp id="sc0fdc"
void reset() noexcept;
```

Clears the scheduler stop request.

It must not be used while `run()` is active.

### State

```cpp id="ysu06m"
bool is_running() const noexcept;

bool stop_requested() const noexcept;
```

See [Scheduler](./scheduler).

## `io_context`

```cpp id="nrrfk3"
class io_context;
```

`io_context` owns the core scheduler and lazily creates Async services.

It is non-copyable.

### Scheduler

```cpp id="5u2shf"
scheduler& get_scheduler() noexcept;

const scheduler&
get_scheduler() const noexcept;
```

### Post callbacks

```cpp id="65xu1x"
template <typename Fn>
void post(Fn&& fn);
```

### Post coroutine handles

```cpp id="viztwq"
void post(
  std::coroutine_handle<> handle
) noexcept;

void post_handle(
  std::coroutine_handle<> handle
) noexcept;
```

### Run

```cpp id="uj1bk8"
void run();
```

Equivalent to driving the context scheduler.

### Stop

```cpp id="upui7q"
void stop() noexcept;
```

Requests scheduler stop.

### Running state

```cpp id="fjiy6h"
bool is_running() const noexcept;
```

### CPU service

```cpp id="l44ros"
thread_pool& cpu_pool();
```

Created lazily.

Throws `std::runtime_error` when accessed after context shutdown.

### Timer service

```cpp id="kkp0ut"
timer& timers();
```

Created lazily.

Throws `std::runtime_error` when accessed after context shutdown.

### Signal service

```cpp id="y4jaf1"
signal_set& signals();
```

Created lazily.

Throws `std::runtime_error` when accessed after context shutdown.

### Networking

Public networking objects should normally be created through:

```cpp id="qpyjcs"
net::make_tcp_stream(ctx);
net::make_tcp_listener(ctx);
net::make_udp_socket(ctx);
net::make_dns_resolver(ctx);
```

The context also exposes its backend internally for integration, but application code should not depend on `vix::async::net::detail`.

### Shutdown

```cpp id="28i36p"
void shutdown() noexcept;
```

Shuts down lazily created services while the scheduler can still accept their final completions, then stops the scheduler.

`shutdown()` is idempotent.

The destructor performs shutdown automatically.

See [`io_context`](./io-context) and [Lifecycle and Shutdown](./lifecycle-and-shutdown).

## Cancellation

Cancellation is cooperative.

The primary public types are:

```cpp id="hl5be9"
cancel_source
cancel_token
cancel_registration
```

### `cancel_source`

```cpp id="3g4fq9"
class cancel_source;
```

Create a cancellation state:

```cpp id="rbxq7j"
cancel_source source;
```

Get a token:

```cpp id="8vl00v"
cancel_token token() const noexcept;
```

Request cancellation:

```cpp id="vlhv9o"
void request_cancel() noexcept;
```

Inspect state:

```cpp id="1b3q27"
bool is_cancelled() const noexcept;
```

### `cancel_token`

```cpp id="mq8k99"
class cancel_token;
```

An empty token is valid and represents no cancellation source.

```cpp id="h3o5eq"
cancel_token();
```

Inspect whether cancellation is available:

```cpp id="4y23mi"
bool can_cancel() const noexcept;
```

Inspect cancellation state:

```cpp id="bas3ad"
bool is_cancelled() const noexcept;
```

Register a callback:

```cpp id="elccow"
cancel_registration on_cancel(
  std::function<void()> fn
) const;
```

If cancellation was already requested, the callback runs during `on_cancel()`.

### `cancel_registration`

```cpp id="x2h859"
class cancel_registration;
```

The registration is move-only.

Remove the callback registration:

```cpp id="c8doig"
void reset() noexcept;
```

Inspect its state:

```cpp id="ud94pf"
bool active() const noexcept;
```

Destroying the registration also removes an active callback registration.

### Cancellation error

```cpp id="ca001l"
std::error_code
cancelled_ec() noexcept;
```

Equivalent to:

```cpp id="82t2po"
make_error_code(
  errc::canceled
);
```

See [Cancellation](./cancellation).

## `timer`

```cpp id="13lavh"
class timer;
```

The timer service uses:

```cpp id="j249dj"
using clock =
  std::chrono::steady_clock;

using time_point =
  clock::time_point;

using duration =
  clock::duration;
```

### Delayed callback

```cpp id="ce064p"
template <typename Fn>
void after(
  duration delay,
  Fn&& fn,
  cancel_token token = {}
);
```

Schedules a callback for later execution through the context scheduler.

### Coroutine sleep

```cpp id="pl1hmm"
task<void> sleep_for(
  duration delay,
  cancel_token token = {}
);
```

Suspends the coroutine until:

- the delay expires
- cancellation occurs
- the timer service stops

### Stop

```cpp id="py6173"
void stop() noexcept;
```

### State

```cpp id="zj24iu"
bool stopped() const noexcept;
```

See [Timers](./timers).

## `thread_pool`

```cpp id="m2dspn"
class thread_pool;
```

The pool executes synchronous callables on worker threads.

### Construction

```cpp id="md1qcy"
explicit thread_pool(
  io_context& ctx,
  std::size_t threads =
    std::thread::hardware_concurrency()
);
```

A requested size of zero still produces at least one worker.

Most applications use:

```cpp id="ys2mar"
ctx.cpu_pool();
```

instead of constructing a separate pool.

### Fire-and-forget work

```cpp id="nfxgn2"
bool post(
  std::function<void()> fn
);
```

Returns `true` if accepted.

Returns `false` if the job cannot be accepted.

### Submit and await

```cpp id="ihq4qo"
template <typename Fn>
auto submit(
  Fn&& fn,
  cancel_token token = {}
)
  -> task<
    std::invoke_result_t<
      std::decay_t<Fn>&
    >
  >;
```

The callable runs on a worker.

Its result or exception returns through the awaiting task.

Cancellation is checked before execution begins.

### Stop

```cpp id="gk3mx1"
void stop() noexcept;
```

Rejects new work while accepted work drains.

### Shutdown

```cpp id="ceg19y"
void shutdown() noexcept;
```

Stops the pool and joins its worker threads.

The operation is idempotent.

### State

```cpp id="6o9et3"
bool stopped() const noexcept;

std::size_t size() const noexcept;
```

See [Thread Pool](./thread-pool) and [CPU Offloading](./cpu-offloading).

## `signal_set`

```cpp id="tbty22"
class signal_set;
```

### Add a signal

```cpp id="a29f9m"
void add(int signal);
```

### Remove a signal

```cpp id="41si7p"
void remove(int signal);
```

### Await the next signal

```cpp id="y8mwv4"
task<int> async_wait(
  cancel_token token = {}
);
```

Returns the received signal number.

Only one active waiter is supported at a time.

### Observe signals with a callback

```cpp id="7ln98b"
void on_signal(
  std::function<void(int)> fn
);
```

The callback is posted through the context scheduler.

### Stop

```cpp id="u6g47y"
void stop() noexcept;
```

Stops signal watching and releases an active waiter.

See [Signals](./signals).

## Detached tasks

Use:

```cpp id="chv66z"
void spawn_detached(
  io_context& ctx,
  task<void> task
);
```

to start a `task<void>` without retaining an awaitable result.

Example:

```cpp id="hbnq27"
spawn_detached(
  ctx,
  background(ctx)
);
```

The detached coroutine self-destroys when complete.

Exceptions escaping the detached task are consumed at the detached boundary.

See [Spawn and Detached Tasks](./spawn).

## `when_all`

```cpp id="btmi3m"
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

`when_all`:

- starts all supplied tasks
- waits for every task
- preserves argument order in the result tuple
- maps `task<void>` to `std::monostate`
- accepts zero tasks
- rethrows the first captured exception after all tasks finish

Example:

```cpp id="klw5jo"
auto results = co_await when_all(
  ctx.get_scheduler(),
  first(),
  second()
);
```

See [`when_all` and `when_any`](./when-all-and-when-any).

## `when_any`

The logical public result type is:

```cpp id="eu7zl2"
template <typename... Ts>
task<
  std::pair<
    std::size_t,
    std::tuple<
      std::optional<
        result_or_monostate<Ts>
      >...
    >
  >
>
when_any(
  scheduler& sched,
  task<Ts>... tasks
);
```

The actual implementation uses an internal storage alias for those optional result slots.

For a non-void `T`:

```cpp id="vrptwy"
std::optional<std::decay_t<T>>
```

For `void`:

```cpp id="1j8ibj"
std::optional<std::monostate>
```

`when_any`:

- requires at least one task
- starts every supplied task
- returns the zero-based index of the first completed task
- populates only the winning result slot
- returns on success or exception
- does not automatically cancel losing tasks

Example:

```cpp id="hz6jiv"
auto [index, results] = co_await when_any(
  ctx.get_scheduler(),
  first(),
  second()
);
```

See [`when_all` and `when_any`](./when-all-and-when-any).

## Errors

Async runtime errors use:

```cpp id="k843nd"
enum class errc : std::uint8_t
{
  ok = 0,

  invalid_argument,
  not_ready,
  timeout,
  canceled,
  closed,
  overflow,

  stopped,
  queue_full,

  rejected,

  not_supported
};
```

Create an error code with:

```cpp id="w9ttjq"
std::error_code make_error_code(
  errc error
) noexcept;
```

Access the category with:

```cpp id="2hzobo"
const std::error_category&
category() noexcept;
```

The category name is:

```text id="wh24ih"
async
```

Async operations commonly report runtime conditions through `std::system_error`.

Networking also preserves underlying operating-system and Asio error codes.

See [Errors](./errors).

# Networking

Public network types live in:

```cpp id="7jfe73"
namespace vix::async::net
```

The public abstractions are:

```text id="c7rnpt"
tcp_endpoint
tcp_stream
tcp_listener

udp_endpoint
udp_datagram
udp_socket

resolved_address
dns_resolver
```

Network objects are created through factory functions associated with a core `io_context`.

## `tcp_endpoint`

```cpp id="wfv8bz"
struct tcp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

The port is represented in host byte order.

## `tcp_stream`

```cpp id="1tc3cd"
class tcp_stream;
```

### Connect

```cpp id="dxw4fe"
virtual core::task<void>
async_connect(
  const tcp_endpoint& endpoint,
  core::cancel_token token = {}
) = 0;
```

### Read

```cpp id="esx53x"
virtual core::task<std::size_t>
async_read(
  std::span<std::byte> buffer,
  core::cancel_token token = {}
) = 0;
```

Reads up to `buffer.size()` bytes.

### Write

```cpp id="qau84l"
virtual core::task<std::size_t>
async_write(
  std::span<const std::byte> buffer,
  core::cancel_token token = {}
) = 0;
```

Returns the number of bytes written by that operation.

### Close

```cpp id="88bi7o"
virtual void close() noexcept = 0;
```

### State

```cpp id="7jhr6h"
virtual bool is_open() const noexcept = 0;
```

### Native handle

```cpp id="8pwx8d"
virtual int native_handle();
```

Implementations that do not expose a native socket handle may throw `std::runtime_error`.

### Factory

```cpp id="05127p"
std::unique_ptr<tcp_stream>
make_tcp_stream(
  core::io_context& ctx
);
```

See [TCP](./tcp).

## `tcp_listener`

```cpp id="ji8gds"
class tcp_listener;
```

### Listen

```cpp id="c964ni"
virtual core::task<void>
async_listen(
  const tcp_endpoint& endpoint,
  int backlog = 128
) = 0;
```

### Accept

```cpp id="b5q305"
virtual core::task<
  std::unique_ptr<tcp_stream>
>
async_accept(
  core::cancel_token token = {}
) = 0;
```

### Close

```cpp id="zbypr8"
virtual void close() noexcept = 0;
```

### State

```cpp id="bqsm0n"
virtual bool is_open() const noexcept = 0;
```

### Factory

```cpp id="zk17fi"
std::unique_ptr<tcp_listener>
make_tcp_listener(
  core::io_context& ctx
);
```

See [TCP](./tcp).

## `udp_endpoint`

```cpp id="74gh6s"
struct udp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

## `udp_datagram`

```cpp id="3xqby9"
struct udp_datagram
{
  udp_endpoint from;
  std::size_t bytes{0};
};
```

`from` identifies the sender.

`bytes` is the number of bytes written into the receive buffer.

## `udp_socket`

```cpp id="1f0ndu"
class udp_socket;
```

### Bind

```cpp id="3jf579"
virtual core::task<void>
async_bind(
  const udp_endpoint& endpoint
) = 0;
```

### Send

```cpp id="6pf14v"
virtual core::task<std::size_t>
async_send_to(
  std::span<const std::byte> buffer,
  const udp_endpoint& destination,
  core::cancel_token token = {}
) = 0;
```

### Receive

```cpp id="8oqfjx"
virtual core::task<udp_datagram>
async_recv_from(
  std::span<std::byte> buffer,
  core::cancel_token token = {}
) = 0;
```

### Close

```cpp id="stf291"
virtual void close() noexcept = 0;
```

### State

```cpp id="1uzh6a"
virtual bool is_open() const noexcept = 0;
```

### Factory

```cpp id="vu9oph"
std::unique_ptr<udp_socket>
make_udp_socket(
  core::io_context& ctx
);
```

See [UDP](./udp).

## `resolved_address`

```cpp id="oi6fce"
struct resolved_address
{
  std::string ip;
  std::uint16_t port{0};
};
```

## `dns_resolver`

```cpp id="82vwqq"
class dns_resolver;
```

Resolve a hostname and port:

```cpp id="c4w2gh"
virtual core::task<
  std::vector<resolved_address>
>
async_resolve(
  std::string host,
  std::uint16_t port,
  core::cancel_token token = {}
) = 0;
```

Factory:

```cpp id="bbfvte"
std::unique_ptr<dns_resolver>
make_dns_resolver(
  core::io_context& ctx
);
```

See [DNS](./dns).

# Version

Version constants live in:

```cpp id="krknbp"
namespace vix::async
```

The current module version is:

```text id="3w5m47"
1.2.1
```

Available constants:

```cpp id="elwnvc"
inline constexpr int version_major = 1;
inline constexpr int version_minor = 2;
inline constexpr int version_patch = 1;

inline constexpr const char*
version_prerelease = "";

inline constexpr const char*
version_metadata = "";

inline constexpr const char*
version_string = "1.2.1";

inline constexpr int abi_version = 1;
```

For example:

```cpp id="o33wl1"
#include <vix/async.hpp>
#include <vix/print.hpp>

int main()
{
  vix::print(
    "Vix Async",
    vix::async::version_string
  );

  return 0;
}
```

# Public API map

The complete application-facing model is:

```text id="ewr8kr"
vix::async
│
├── version
│
├── core
│   ├── task<T>
│   ├── scheduler
│   ├── io_context
│   │
│   ├── cancellation
│   │   ├── cancel_source
│   │   ├── cancel_token
│   │   └── cancel_registration
│   │
│   ├── timer
│   ├── thread_pool
│   ├── signal_set
│   │
│   ├── spawn_detached
│   ├── when_all
│   ├── when_any
│   │
│   └── errors
│       └── errc
│
└── net
    ├── TCP
    │   ├── tcp_endpoint
    │   ├── tcp_stream
    │   └── tcp_listener
    │
    ├── UDP
    │   ├── udp_endpoint
    │   ├── udp_datagram
    │   └── udp_socket
    │
    └── DNS
        ├── resolved_address
        └── dns_resolver
```

For behavior, execution rules, lifetime, and examples, use the dedicated pages rather than treating this reference as the complete programming guide.

Start with:

- [Quick Start](./quick-start)
- [Core Concepts](./core-concepts)
- [Execution Model](./execution-model)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
