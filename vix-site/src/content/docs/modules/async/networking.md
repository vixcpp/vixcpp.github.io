# Networking

The Vix Async networking layer provides coroutine-based TCP, UDP, and DNS operations.

Network I/O can take an unpredictable amount of time. A connection may wait for a remote host, a TCP read may wait for bytes, and DNS resolution may depend on external network services. These operations should suspend the coroutine instead of occupying the scheduler thread while they wait.

Vix uses an Asio-backed network service for that work, then returns coroutine continuations to the Vix scheduler.

## Header

Use the public Vix Async header:

```cpp id="pcv0qg"
#include <vix/async.hpp>
```

For examples that print output:

```cpp id="9ykpgi"
#include <vix/print.hpp>
```

Core runtime types live in:

```cpp id="pbzj72"
vix::async::core
```

Networking types live in:

```cpp id="6cct5v"
vix::async::net
```

## The network model

A network operation normally follows this path:

```text id="gv4514"
coroutine
    ↓
TCP / UDP / DNS operation
    ↓
coroutine suspends
    ↓
Asio network backend
    ↓
operation completes
    ↓
continuation posted to Vix scheduler
    ↓
coroutine resumes
```

The scheduler thread does not wait inside the socket operation.

The networking backend has its own execution thread for Asio. That thread handles network completion, while application coroutine continuation returns through the `io_context` scheduler.

## Networking belongs to an `io_context`

Network objects are created for a specific context.

For TCP:

```cpp id="lv7t8d"
using namespace vix::async::core;
using namespace vix::async::net;

io_context ctx;

auto stream = make_tcp_stream(ctx);
auto listener = make_tcp_listener(ctx);
```

For UDP:

```cpp id="57w1xb"
auto socket = make_udp_socket(ctx);
```

For DNS:

```cpp id="6dnc10"
auto resolver = make_dns_resolver(ctx);
```

The context initializes its networking backend when networking is first needed.

Applications normally work with these public network factories rather than accessing the internal Asio service directly.

## TCP

TCP provides two public abstractions:

```text id="atftf0"
tcp_stream
tcp_listener
```

A `tcp_stream` represents a TCP connection.

It supports:

```cpp id="04h7rf"
stream->async_connect(endpoint);
stream->async_read(buffer);
stream->async_write(buffer);
stream->close();
stream->is_open();
```

A `tcp_listener` accepts incoming TCP connections.

It supports:

```cpp id="5b8h4d"
listener->async_listen(endpoint);
listener->async_accept();
listener->close();
listener->is_open();
```

Accepted connections are returned as new `tcp_stream` objects.

The complete server and client workflows are covered in [TCP](./tcp).

## A small TCP client

A TCP endpoint contains a host and port:

```cpp id="zgp59l"
tcp_endpoint endpoint{
  "127.0.0.1",
  8080
};
```

A coroutine can create a stream and connect:

```cpp id="zuv2rk"
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;
using namespace vix::async::net;

task<void> connect(io_context& ctx)
{
  auto stream = make_tcp_stream(ctx);

  co_await stream->async_connect({
    "127.0.0.1",
    8080
  });

  vix::print("connected:", stream->is_open());

  stream->close();
}
```

`async_connect()` suspends while connection establishment is pending.

The coroutine continues after the operation completes or throws if the connection fails.

## UDP

UDP uses a datagram-oriented API.

Create a socket with:

```cpp id="57qxqr"
auto socket = make_udp_socket(ctx);
```

A UDP socket supports:

```cpp id="6boxi9"
socket->async_bind(endpoint);
socket->async_send_to(buffer, endpoint);
socket->async_recv_from(buffer);
socket->close();
socket->is_open();
```

Unlike TCP, UDP does not create a connected stream for each peer.

Each send identifies its destination, and each receive reports where the datagram came from.

```text id="plkkld"
send
 ↓
buffer + destination

receive
 ↓
buffer + sender metadata
```

The complete datagram workflow is covered in [UDP](./udp).

## DNS

DNS resolution is exposed through `dns_resolver`.

```cpp id="u8134b"
auto resolver = make_dns_resolver(ctx);
```

Resolve a host and port with:

```cpp id="5jn7j1"
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443
);
```

The result is:

```cpp id="jh8b5p"
std::vector<resolved_address>
```

Each entry contains:

```cpp id="qfr0ea"
std::string ip;
std::uint16_t port;
```

A hostname may resolve to several IPv4 or IPv6 addresses, so the API returns a collection rather than one address.

DNS is covered in detail in [DNS](./dns).

## Endpoints

TCP and UDP have separate endpoint types.

TCP:

```cpp id="f59iw8"
tcp_endpoint endpoint{
  "example.com",
  443
};
```

UDP:

```cpp id="9bx1xw"
udp_endpoint endpoint{
  "127.0.0.1",
  9000
};
```

Both contain:

```text id="dfg4jx"
host
port
```

The host is a string and can represent a hostname or textual IP address.

Ports are represented as `std::uint16_t` in host byte order.

## Network operations are tasks

Network operations integrate directly with the normal Async task model.

For example:

```cpp id="y6x5on"
co_await stream->async_connect(endpoint);
```

returns a:

```cpp id="zkko1c"
task<void>
```

A TCP read returns:

```cpp id="q1q490"
task<std::size_t>
```

A UDP receive returns:

```cpp id="a6mfbw"
task<udp_datagram>
```

DNS returns:

```cpp id="apn3m5"
task<std::vector<resolved_address>>
```

This means networking composes with ordinary `co_await`, `when_all`, `when_any`, cancellation, and the rest of the Async runtime.

## The network backend is separate from the scheduler

The networking backend owns an independent Asio `io_context`.

Conceptually:

```text id="76vp18"
                 Vix io_context
                      │
                  scheduler
                      ▲
                      │
                 completions
                      │
               network service
                      │
                Asio io_context
                      │
                 network thread
```

Asio performs network event processing on its own thread.

When an awaited operation finishes, Vix posts the coroutine handle back to the core `io_context`.

This keeps the code after `co_await` inside the Vix scheduling model.

## Networking does not use the CPU pool

Waiting for socket readiness is not CPU-intensive computation.

A TCP read should therefore use:

```cpp id="x772oi"
co_await stream->async_read(buffer);
```

not a blocking socket call submitted to:

```cpp id="3b26z0"
ctx.cpu_pool()
```

The network service can keep many operations pending without dedicating one CPU worker to each wait.

The CPU pool remains available for synchronous computation that genuinely needs a worker thread.

## Buffers use `std::span`

TCP and UDP data operations receive spans.

TCP read:

```cpp id="9xq0nr"
std::span<std::byte>
```

TCP write:

```cpp id="7mbr5q"
std::span<const std::byte>
```

UDP send:

```cpp id="6e3gg1"
std::span<const std::byte>
```

UDP receive:

```cpp id="7qry4d"
std::span<std::byte>
```

A span does not own its memory.

The underlying buffer must remain valid until the awaited network operation completes.

For example:

```cpp id="tp3o8o"
task<void> read_data(tcp_stream& stream)
{
  std::array<std::byte, 4096> buffer{};

  std::size_t bytes = co_await stream.async_read(buffer);

  vix::print("bytes:", bytes);
}
```

Because `buffer` is part of the coroutine frame, it remains alive while the coroutine is suspended inside `async_read()`.

## Reads and writes report byte counts

TCP reads return the number of bytes actually read:

```cpp id="p29yg4"
std::size_t bytes = co_await stream->async_read(buffer);
```

A read requests up to the size of the provided buffer. It does not promise to fill the entire buffer.

TCP writes also report a byte count:

```cpp id="zogtma"
std::size_t bytes = co_await stream->async_write(buffer);
```

UDP sends return the number of bytes sent.

UDP receives return a `udp_datagram`, which contains both the byte count and sender endpoint.

Do not assume that the capacity of a buffer is the number of bytes received.

## Errors

Networking failures are reported through `std::system_error`.

For example:

```cpp id="oqpgtn"
task<void> connect(io_context& ctx)
{
  auto stream = make_tcp_stream(ctx);

  try
  {
    co_await stream->async_connect({
      "127.0.0.1",
      8080
    });

    vix::print("connected");
  }
  catch (const std::system_error& error)
  {
    vix::print("network error:", error.what());
  }
}
```

Connection failures, read failures, write failures, resolution failures, cancellation, and runtime shutdown can therefore use normal C++ exception handling around the awaited operation.

Backend networking errors retain their underlying `std::error_code`.

## Cancellation

The pending network operations that support cancellation accept an optional `cancel_token`.

TCP:

```cpp id="1qvt9v"
stream->async_connect(endpoint, token);
stream->async_read(buffer, token);
stream->async_write(buffer, token);
listener->async_accept(token);
```

UDP:

```cpp id="fpwlq6"
socket->async_send_to(buffer, endpoint, token);
socket->async_recv_from(buffer, token);
```

DNS:

```cpp id="hqhkbg"
resolver->async_resolve(
  "example.com",
  443,
  token
);
```

Cancellation is connected to the active Asio operation.

It is not only checked before the network call begins.

## Active cancellation

Consider a coroutine waiting for TCP data:

```text id="2jw4xw"
async_read active
      ↓
coroutine suspended
      ↓
request_cancel()
      ↓
socket operation cancelled
      ↓
Asio completion
      ↓
scheduler
      ↓
coroutine resumes
```

The coroutine observes the Vix cancellation error:

```cpp id="hk4p3s"
errc::canceled
```

through `std::system_error`.

This allows pending network waits to react promptly to application cancellation.

## Operations without cancellation tokens

Not every network operation takes a token.

TCP listening setup:

```cpp id="plryoe"
listener->async_listen(endpoint);
```

and UDP binding:

```cpp id="nrl44r"
socket->async_bind(endpoint);
```

do not accept `cancel_token`.

Their lifetime is controlled by the operation itself, the network object, and runtime shutdown.

Once a listener or socket exists, use `close()` when its socket lifetime should end.

## Closing sockets

TCP streams, TCP listeners, and UDP sockets expose:

```cpp id="cohji7"
close();
```

Closing is idempotent for these network objects.

Calling it more than once is safe.

Use:

```cpp id="217axq"
is_open();
```

to inspect whether the object currently owns an open socket.

For example:

```cpp id="loy61z"
if (stream->is_open())
{
  stream->close();
}
```

The explicit check is optional when the only goal is to close, because `close()` itself is idempotent.

## Cancellation and closing are different

Cancellation targets one pending asynchronous operation through a token.

Closing targets the socket itself.

```text id="6qvj6g"
cancel token
    ↓
cancel pending operation

close()
    ↓
close socket
```

A server may cancel one accept wait as part of application control, while closing the listener means the listening socket itself should no longer be used.

Choose the operation that matches the intended lifetime.

## Network object ownership

The public network factories return `std::unique_ptr`.

For example:

```cpp id="utz4p9"
std::unique_ptr<tcp_stream>
std::unique_ptr<tcp_listener>
std::unique_ptr<udp_socket>
std::unique_ptr<dns_resolver>
```

This gives each public network object a clear owner.

Internally, those objects share ownership of the Asio network backend they were created from.

That prevents the backend storage from disappearing while a socket, listener, or resolver still depends on its executor.

## The `io_context` must still remain valid

Shared ownership of the Asio backend does not make a network object independent from its Vix `io_context`.

Network operations resume through the core context scheduler.

The safe lifetime remains:

```text id="o2xafm"
create io_context
      ↓
create network objects
      ↓
run network operations
      ↓
operations finish or are stopped
      ↓
shutdown context
      ↓
destroy remaining objects
```

Do not begin new asynchronous network operations after the context has been shut down.

Accessing context services after shutdown is rejected.

## Runtime shutdown

Network operations may still be pending when `io_context::shutdown()` begins.

The network service tracks active operations so shutdown can ask them to stop before the scheduler is terminated.

The relationship is:

```text id="oezllv"
network operation pending
        ↓
io_context shutdown
        ↓
network service stops active operation
        ↓
Asio completion
        ↓
coroutine returned to scheduler
        ↓
operation reports stopped
        ↓
scheduler can finish
```

An operation stopped by network-service shutdown reports:

```cpp id="waslzy"
errc::stopped
```

through `std::system_error`.

This is distinct from application cancellation:

```cpp id="rwv1sq"
errc::canceled
```

## Networking and task composition

Network operations are ordinary tasks, so independent operations can participate in task composition.

For example:

```cpp id="cb73ms"
auto results = co_await when_all(
  ctx.get_scheduler(),
  resolver_a->async_resolve("example.com", 443),
  resolver_b->async_resolve("example.org", 443)
);
```

Both DNS operations can remain pending independently while the coroutine waits for all results.

`when_any` can also race network tasks, but its losing tasks are not cancelled automatically.

If losing network operations should stop, provide explicit cancellation.

## Detached connection handlers

Servers commonly detach per-client tasks so the accept loop can continue.

Conceptually:

```cpp id="rq13lg"
while (ctx.is_running())
{
  auto client = co_await listener->async_accept();

  spawn_detached(
    ctx,
    handle_client(std::move(client))
  );
}
```

The listener can return to accepting connections while each client handler waits independently on its own TCP stream.

The lifetime of the listener, client streams, context, and any cancellation state still needs to cover the operations that use them.

## Public networking API

The networking layer is centered on these public types and factories:

| API                      | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `tcp_endpoint`           | Describe a TCP host and port.                     |
| `tcp_stream`             | Connect, read, write, and close a TCP connection. |
| `tcp_listener`           | Listen for and accept TCP connections.            |
| `make_tcp_stream(ctx)`   | Create a TCP stream for a context.                |
| `make_tcp_listener(ctx)` | Create a TCP listener for a context.              |
| `udp_endpoint`           | Describe a UDP host and port.                     |
| `udp_datagram`           | Describe a received UDP datagram and its sender.  |
| `udp_socket`             | Bind, send, receive, and close UDP traffic.       |
| `make_udp_socket(ctx)`   | Create a UDP socket for a context.                |
| `resolved_address`       | Hold one resolved IP address and port.            |
| `dns_resolver`           | Resolve hostnames asynchronously.                 |
| `make_dns_resolver(ctx)` | Create a DNS resolver for a context.              |

Applications should normally use these interfaces rather than the internal Asio networking service.

## Next step

Continue with [TCP](./tcp) for connection establishment, listeners, accepts, reads, writes, cancellation, and connection lifetime.

Then read:

- [UDP](./udp)
- [DNS](./dns)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
