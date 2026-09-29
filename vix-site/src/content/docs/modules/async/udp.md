# UDP

Vix Async provides coroutine-based UDP communication through `udp_socket`.

UDP is datagram-oriented. Each send produces one datagram addressed to a destination, and each receive reports the sender of the datagram that arrived. There is no TCP-style connection or byte stream between peers.

Network waiting happens through the Async networking backend, so a coroutine can suspend on a UDP operation without blocking the Vix scheduler thread.

## Header

Use the public Vix Async header:

```cpp id="jjfkq5"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="0kttg5"
#include <vix/print.hpp>
```

Core runtime types live in:

```cpp id="20ucl7"
vix::async::core
```

UDP types live in:

```cpp id="aknc2u"
vix::async::net
```

## UDP endpoints

A UDP endpoint contains a host and port:

```cpp id="bpdewh"
using namespace vix::async::net;

udp_endpoint endpoint{
  "127.0.0.1",
  9000
};
```

The type is:

```cpp id="6dpdat"
struct udp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

The port is stored in host byte order.

The current Asio backend expects a numeric IP address when binding or sending:

```text id="adn2rf"
127.0.0.1
0.0.0.0
::1
```

It does not resolve a hostname passed to `async_bind()` or `async_send_to()`.

When a hostname must be resolved first, use the Async DNS resolver and then send to one of the returned IP addresses.

## Create a socket

Create a UDP socket for an `io_context`:

```cpp id="ouwe0x"
using namespace vix::async::core;
using namespace vix::async::net;

io_context ctx;

auto socket = make_udp_socket(ctx);
```

The factory returns:

```cpp id="nc25f6"
std::unique_ptr<udp_socket>
```

The socket uses the networking backend owned by the context.

A newly created socket is not yet bound to a local endpoint.

## Bind a socket

Before receiving datagrams, bind the socket:

```cpp id="um1b6r"
co_await socket->async_bind({
  "127.0.0.1",
  9000
});
```

`async_bind()` returns:

```cpp id="jhu66v"
task<void>
```

The current implementation opens the native UDP socket and binds it when the task executes.

If opening or binding fails, the operation throws `std::system_error`.

## Bind to any local interface

Use:

```cpp id="kjo91h"
co_await socket->async_bind({
  "0.0.0.0",
  9000
});
```

to bind an IPv4 UDP socket to all local IPv4 interfaces.

Use a specific address such as:

```cpp id="m90dcy"
{"127.0.0.1", 9000}
```

when the socket should only listen on that interface.

## Let the operating system choose the local port

A sender can bind to port `0` when it does not need a predetermined local port:

```cpp id="c9n6o4"
co_await socket->async_bind({
  "127.0.0.1",
  0
});
```

The operating system selects an available ephemeral port.

This is useful for UDP clients that only need a valid local socket before sending.

The Async UDP interface currently does not expose a method for reading that automatically selected local endpoint.

## Send a datagram

Use `async_send_to()` with a buffer and destination endpoint:

```cpp id="0i7ffo"
const std::array<std::byte, 4> message{
  std::byte{'p'},
  std::byte{'i'},
  std::byte{'n'},
  std::byte{'g'}
};

std::size_t sent = co_await socket->async_send_to(
  message,
  {"127.0.0.1", 9000}
);
```

The operation returns:

```cpp id="82yd39"
task<std::size_t>
```

The returned value is the number of bytes sent by the operation.

## A datagram is one unit

Unlike TCP, UDP preserves datagram boundaries.

If the sender performs:

```cpp id="k8pxrb"
co_await socket->async_send_to(
  first_message,
  destination
);

co_await socket->async_send_to(
  second_message,
  destination
);
```

those are two separate UDP datagrams.

The receiver does not see one continuous byte stream that must be reconstructed into application messages.

Conceptually:

```text id="z9x185"
sender

datagram A ─────────────→ receiver
datagram B ─────────────→ receiver
```

Each successful `async_recv_from()` receives one datagram and returns metadata for that datagram.

## Receive a datagram

Use `async_recv_from()` with writable memory:

```cpp id="eg3uj1"
std::array<std::byte, 1024> buffer{};

udp_datagram datagram = co_await socket->async_recv_from(
  buffer
);
```

The operation returns:

```cpp id="mz4xgl"
task<udp_datagram>
```

`udp_datagram` contains:

```cpp id="v7rq6u"
struct udp_datagram
{
  udp_endpoint from;
  std::size_t bytes{0};
};
```

The result tells the application:

- how many bytes were written into the buffer
- which endpoint sent the datagram

## Inspect the sender

After receiving:

```cpp id="w3js7x"
auto datagram = co_await socket->async_recv_from(
  buffer
);
```

the sender is available through:

```cpp id="f8lnci"
datagram.from.host
datagram.from.port
```

and the payload size through:

```cpp id="l63lxj"
datagram.bytes
```

For example:

```cpp id="y6625x"
vix::print(
  "received:",
  datagram.bytes,
  "from:",
  datagram.from.host,
  datagram.from.port
);
```

The returned sender host is the textual IP address reported by the network backend.

## Use only the received bytes

The receive buffer may be larger than the datagram.

For example:

```cpp id="ajov85"
std::array<std::byte, 4096> buffer{};

auto datagram = co_await socket->async_recv_from(
  buffer
);
```

If:

```cpp id="k3xi5f"
datagram.bytes == 120
```

only the first 120 bytes contain the received payload.

Create a span over that range when passing the data elsewhere:

```cpp id="1g5e9c"
auto payload = std::span<const std::byte>(
  buffer.data(),
  datagram.bytes
);
```

Do not treat the complete capacity of the receive buffer as network data.

## Choose a sufficient receive buffer

`async_recv_from()` writes into the memory provided by the caller.

The application should choose a buffer large enough for the datagrams defined by its protocol.

For example:

```cpp id="6lcujh"
std::array<std::byte, 2048> buffer{};
```

may be appropriate for a protocol that deliberately limits its datagrams to that size.

The UDP API does not allocate an arbitrary payload buffer automatically because the application controls its expected message size and memory policy.

## Buffer lifetime

UDP send and receive operations use `std::span`.

A span does not own its memory.

This means the referenced storage must remain valid until the awaited operation completes.

This is safe:

```cpp id="ip2fr1"
task<void> receive(udp_socket& socket)
{
  std::array<std::byte, 1024> buffer{};

  auto datagram = co_await socket.async_recv_from(
    buffer
  );

  vix::print("bytes:", datagram.bytes);
}
```

The buffer belongs to the coroutine frame, so it remains alive while the coroutine is suspended.

The same lifetime rule applies to buffers passed to `async_send_to()`.

## One sender and one receiver

A typical local UDP exchange uses two sockets:

```cpp id="f74q1a"
auto receiver = make_udp_socket(ctx);
auto sender = make_udp_socket(ctx);

co_await receiver->async_bind({
  "127.0.0.1",
  9000
});

co_await sender->async_bind({
  "127.0.0.1",
  0
});
```

The receiver uses a known port.

The sender lets the operating system choose its local port.

## Receive and send concurrently

A receive operation suspends until a datagram arrives.

This means the following code has a dependency problem if the same coroutine is also responsible for sending the datagram:

```cpp id="in7v2r"
auto datagram = co_await receiver->async_recv_from(
  buffer
);

co_await sender->async_send_to(
  message,
  {"127.0.0.1", 9000}
);
```

The send line cannot be reached until the receive completes, but the receive is waiting for the send.

For independent operations, start them together:

```cpp id="25wu44"
auto values = co_await when_all(
  ctx.get_scheduler(),
  receiver->async_recv_from(buffer),
  sender->async_send_to(
    message,
    {"127.0.0.1", 9000}
  )
);
```

Now both operations can progress independently.

## Read the composed results

For:

```cpp id="g56dvm"
auto values = co_await when_all(
  ctx.get_scheduler(),
  receiver->async_recv_from(buffer),
  sender->async_send_to(
    message,
    {"127.0.0.1", 9000}
  )
);
```

the first result is the received datagram:

```cpp id="mi9ki8"
const auto& datagram = std::get<0>(values);
```

and the second is the number of bytes sent:

```cpp id="1b2k59"
std::size_t sent = std::get<1>(values);
```

The result positions follow the argument positions passed to `when_all`.

## Complete loopback example

This follows the same UDP workflow exercised by the Async network smoke test.

```cpp id="qcqa3q"
#include <algorithm>
#include <array>
#include <cstddef>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;
using namespace vix::async::net;

task<void> run(io_context& ctx)
{
  auto receiver = make_udp_socket(ctx);
  auto sender = make_udp_socket(ctx);

  co_await receiver->async_bind({
    "127.0.0.1",
    9000
  });

  co_await sender->async_bind({
    "127.0.0.1",
    0
  });

  std::array<std::byte, 16> buffer{};

  const std::array<std::byte, 4> message{
    std::byte{'p'},
    std::byte{'o'},
    std::byte{'n'},
    std::byte{'g'}
  };

  auto values = co_await when_all(
    ctx.get_scheduler(),
    receiver->async_recv_from(buffer),
    sender->async_send_to(
      message,
      {"127.0.0.1", 9000}
    )
  );

  const auto& datagram = std::get<0>(values);
  const auto sent = std::get<1>(values);

  vix::print("sent:", sent);
  vix::print("received:", datagram.bytes);
  vix::print(
    "from:",
    datagram.from.host,
    datagram.from.port
  );

  receiver->close();
  sender->close();

  ctx.stop();
}

int main()
{
  io_context ctx;

  std::move(run(ctx)).start(
    ctx.get_scheduler()
  );

  ctx.run();

  return 0;
}
```

The receive and send are coordinated through the same scheduler, while the actual network waits run through the Asio backend.

## UDP has no connection handshake

TCP establishes a connection before exchanging bytes.

UDP does not.

There is no equivalent of:

```cpp id="frj17w"
async_connect()
```

on `udp_socket`.

The model is instead:

```text id="2d8gz7"
bind local socket
      ↓
send datagram to endpoint

or

bind local socket
      ↓
receive datagram from any sender
```

Each outgoing datagram identifies its destination explicitly.

Each incoming datagram reports its source explicitly.

## UDP does not provide delivery guarantees

A successful `async_send_to()` means the local socket operation completed.

It does not mean the remote application received or processed the datagram.

UDP itself does not guarantee:

- delivery
- retransmission
- ordering
- duplicate suppression

If an application needs those properties, its protocol must provide them or use a transport such as TCP whose semantics better match the requirement.

This is a property of UDP itself, not a behavior added by Vix Async.

## Cancel a receive

`async_recv_from()` accepts a `cancel_token`.

```cpp id="lv1zv6"
cancel_source source;

std::array<std::byte, 1024> buffer{};

auto datagram = co_await socket->async_recv_from(
  buffer,
  source.token()
);
```

Another part of the application can request cancellation:

```cpp id="p6uth0"
source.request_cancel();
```

If cancellation wins while the receive is pending, the active Asio socket operation is cancelled.

The coroutine resumes through the Vix scheduler and receives:

```cpp id="p476i0"
errc::canceled
```

as a `std::system_error`.

## Handle receive cancellation

For example:

```cpp id="vaens5"
task<void> receive(
  udp_socket& socket,
  cancel_token token)
{
  std::array<std::byte, 1024> buffer{};

  try
  {
    auto datagram = co_await socket.async_recv_from(
      buffer,
      token
    );

    vix::print("bytes:", datagram.bytes);
  }
  catch (const std::system_error& error)
  {
    if (error.code() == cancelled_ec())
    {
      vix::print("receive canceled");
      co_return;
    }

    throw;
  }
}
```

Cancellation stops the pending operation. It does not destroy the `udp_socket` object.

## Cancel a send

`async_send_to()` accepts the same optional token:

```cpp id="dl6kc6"
std::size_t sent = co_await socket->async_send_to(
  message,
  destination,
  token
);
```

If cancellation is requested while the send is active, the networking backend asks Asio to cancel the socket operation.

The awaiting coroutine then observes cancellation through the normal Async error path.

## Binding is not cancellable

`async_bind()` does not accept a `cancel_token`.

```cpp id="jvcml3"
co_await socket->async_bind({
  "127.0.0.1",
  9000
});
```

The current backend performs socket opening and binding synchronously when that coroutine executes.

There is no long-running network wait to cancel in the same way as an active send or receive.

## Cancellation affects the active socket operation

UDP send and receive cancellation currently use socket-level Asio cancellation.

Conceptually:

```text id="oqz68l"
operation pending
      ↓
request_cancel()
      ↓
socket cancel
      ↓
Asio completion
      ↓
Vix scheduler
      ↓
coroutine resumes
```

Because cancellation acts on the socket's active asynchronous operations, applications should avoid designing unrelated concurrent operations on the same socket that require completely independent cancellation policies.

Use separate sockets when the operations need independent socket-level lifetimes.

## Close a socket

Use:

```cpp id="d9vuqk"
socket->close();
```

to stop socket activity and close the native UDP socket.

The operation first cancels outstanding socket work, then closes the socket.

`close()` is idempotent.

Calling it more than once is safe.

## Check whether a socket is open

Use:

```cpp id="t5lc2j"
bool open = socket->is_open();
```

For example:

```cpp id="h9o7gd"
if (socket->is_open())
{
  socket->close();
}
```

The explicit check is not required when the only goal is to close the socket because `close()` already handles the closed state safely.

## Closing and cancellation are different

A cancellation token targets pending asynchronous work:

```text id="662z9n"
cancel token
    ↓
cancel active send / receive
```

`close()` ends the socket lifetime:

```text id="5wcw50"
close()
   ↓
cancel socket activity
   ↓
close native socket
```

Use cancellation when the socket should remain available after one operation stops.

Use `close()` when the socket itself is finished.

## Errors

UDP operational failures are reported with `std::system_error`.

For example:

```cpp id="vpxkmb"
task<void> receive(io_context& ctx)
{
  auto socket = make_udp_socket(ctx);

  try
  {
    co_await socket->async_bind({
      "127.0.0.1",
      9000
    });

    std::array<std::byte, 1024> buffer{};

    auto datagram = co_await socket->async_recv_from(
      buffer
    );

    vix::print("bytes:", datagram.bytes);
  }
  catch (const std::system_error& error)
  {
    vix::print("UDP error:", error.what());
  }

  socket->close();
}
```

Errors can come from:

- opening the socket
- parsing the numeric address
- binding
- sending
- receiving
- application cancellation
- networking service shutdown

Underlying Asio errors retain their `std::error_code`.

## Invalid addresses

The current implementation uses Asio's numeric address parser for `async_bind()` and `async_send_to()`.

For example:

```cpp id="wzdr7e"
{"127.0.0.1", 9000}
```

is valid.

A hostname such as:

```cpp id="0lm83k"
{"example.com", 9000}
```

is not resolved by these UDP operations.

Resolve the hostname first:

```cpp id="bgi55o"
auto resolver = make_dns_resolver(ctx);

auto addresses = co_await resolver->async_resolve(
  "example.com",
  9000
);
```

then construct the UDP endpoint from an appropriate resolved address.

The DNS workflow is covered in [DNS](./dns).

## Cancellation and shutdown errors

Application cancellation reports:

```cpp id="62jfcp"
errc::canceled
```

Networking service shutdown reports:

```cpp id="hy0k4d"
errc::stopped
```

The difference is meaningful:

```text id="n9ebqm"
errc::canceled
    ↓
application cancellation requested

errc::stopped
    ↓
network runtime is shutting down
```

Both arrive through `std::system_error`.

## Runtime shutdown

A receive can remain suspended indefinitely if no datagram arrives.

The Async runtime must therefore be able to release it during shutdown.

```text id="q9r7oj"
async_recv_from pending
        ↓
io_context shutdown
        ↓
network service cancels operation
        ↓
Asio completion
        ↓
scheduler
        ↓
coroutine resumes
        ↓
errc::stopped
```

The scheduler remains available while the network service releases its pending operations.

This is part of the coordinated `io_context::shutdown()` lifecycle.

## Socket ownership

`make_udp_socket()` returns a `std::unique_ptr`.

```cpp id="0cttpu"
auto socket = make_udp_socket(ctx);
```

The caller owns the public socket object.

Internally, the socket shares ownership of the Asio networking backend it uses. This keeps its executor storage valid while the UDP object exists.

The socket still depends on the Vix `io_context` for coroutine continuation.

Do not treat the UDP object as an independent runtime.

## UDP and task composition

Independent UDP operations can be composed with normal Async helpers.

The loopback pattern:

```cpp id="3gi5ml"
co_await when_all(
  ctx.get_scheduler(),
  receiver->async_recv_from(buffer),
  sender->async_send_to(
    message,
    destination
  )
);
```

is one example.

Several independent receives on different sockets can also participate in composition.

With `when_any`, remember that losing tasks continue running. They are not automatically cancelled.

If the losing UDP operations should stop, provide explicit cancellation.

## UDP and the CPU pool

UDP waiting should not be moved to the CPU pool.

Avoid building a blocking UDP receive and wrapping it in:

```cpp id="6zx2ka"
ctx.cpu_pool().submit(...)
```

when the Async networking API already provides:

```cpp id="qxef8d"
co_await socket->async_recv_from(buffer);
```

The network backend can wait for datagrams without occupying a CPU worker.

Use the CPU pool for synchronous computation on the received payload when that computation is expensive.

For example:

```cpp id="77cgvc"
auto datagram = co_await socket->async_recv_from(
  buffer
);

auto result = co_await ctx.cpu_pool().submit(
  [payload = std::vector<std::byte>(
    buffer.begin(),
    buffer.begin() + datagram.bytes
  )](){
    return expensive_processing(payload);
  }
);
```

Network waiting and CPU processing remain separate responsibilities.

## API overview

### `udp_endpoint`

```cpp id="2z1cer"
struct udp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

### `udp_datagram`

```cpp id="t2bl7c"
struct udp_datagram
{
  udp_endpoint from;
  std::size_t bytes{0};
};
```

### `udp_socket`

| API                                      | Purpose                                       |
| ---------------------------------------- | --------------------------------------------- |
| `async_bind(endpoint)`                   | Open and bind the socket to a local endpoint. |
| `async_send_to(buffer, endpoint, token)` | Send one datagram to a destination.           |
| `async_recv_from(buffer, token)`         | Receive one datagram and its sender metadata. |
| `close()`                                | Cancel socket activity and close the socket.  |
| `is_open()`                              | Check whether the native socket is open.      |

Factory:

```cpp id="bapmob"
std::unique_ptr<udp_socket>
make_udp_socket(io_context& ctx);
```

The main operation result types are:

```cpp id="u0xtco"
task<void> async_bind(...);

task<std::size_t> async_send_to(...);

task<udp_datagram> async_recv_from(...);
```

## Next step

Continue with [DNS](./dns) to see how hostnames are resolved into IP addresses that can be used by networking code.

Then read:

- [TCP](./tcp)
- [Cancellation](./cancellation)
- [Task Composition](./task-composition)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
