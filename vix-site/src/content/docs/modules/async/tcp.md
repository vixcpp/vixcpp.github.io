# TCP

Vix Async provides coroutine-based TCP clients and servers through `tcp_stream` and `tcp_listener`.

A TCP operation may wait for connection establishment, incoming data, available write capacity, or a new client. Instead of blocking the scheduler thread during those waits, the coroutine suspends and resumes when the network operation completes.

## Header

Use the public Vix Async header:

```cpp
#include <vix/async.hpp>
```

For examples that print output:

```cpp
#include <vix/print.hpp>
```

Core runtime types live in:

```cpp
vix::async::core
```

TCP types live in:

```cpp
vix::async::net
```

## TCP endpoints

A TCP endpoint contains a host and a port:

```cpp
using namespace vix::async::net;

tcp_endpoint endpoint{
  "127.0.0.1",
  8080
};
```

The type is:

```cpp
struct tcp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

For outgoing connections, `host` may be a hostname or textual IP address:

```cpp
tcp_endpoint first{
  "example.com",
  443
};

tcp_endpoint second{
  "127.0.0.1",
  8080
};
```

For listening sockets, the current backend expects a numeric local address such as:

```text
0.0.0.0
127.0.0.1
::1
```

Use `0.0.0.0` when the listener should bind to all IPv4 interfaces.

## Create a TCP stream

A TCP client starts with:

```cpp
auto stream = make_tcp_stream(ctx);
```

The factory returns:

```cpp
std::unique_ptr<tcp_stream>
```

The stream belongs to the supplied `io_context` and uses its networking service and scheduler.

## Connect to a server

Use `async_connect()`:

```cpp
co_await stream->async_connect({
  "127.0.0.1",
  8080
});
```

The operation returns:

```cpp
task<void>
```

For a hostname:

```cpp
co_await stream->async_connect({
  "example.com",
  443
});
```

the current backend first resolves the hostname, then attempts the TCP connection.

The complete flow is:

```text
coroutine
    ↓
async_connect()
    ↓
resolve host when needed
    ↓
establish TCP connection
    ↓
scheduler
    ↓
coroutine resumes
```

If resolution or connection establishment fails, the task throws `std::system_error`.

## Check connection state

Use:

```cpp
bool open = stream->is_open();
```

For example:

```cpp
co_await stream->async_connect({
  "127.0.0.1",
  8080
});

vix::print("open:", stream->is_open());
```

`is_open()` reports whether the underlying socket is currently open.

It is not an application-level health check for the remote peer. A peer can disconnect after the check, so network errors still need to be handled by subsequent reads and writes.

## Read data

Use `async_read()` with writable memory:

```cpp
std::array<std::byte, 4096> buffer{};

std::size_t bytes = co_await stream->async_read(
  buffer
);
```

The operation returns:

```cpp
task<std::size_t>
```

The returned value is the number of bytes actually read.

`async_read()` reads up to the size of the supplied buffer.

It does not promise to fill the complete buffer.

```text
buffer size = 4096

one read may return:
1 byte
300 bytes
2048 bytes
4096 bytes
```

TCP is a byte stream. Message boundaries are not preserved by the protocol.

## TCP does not preserve messages

Suppose one peer writes:

```text
hello
```

and then:

```text
world
```

The receiving side must not assume that two reads will return exactly those two pieces.

It may observe:

```text
helloworld
```

in one read, or:

```text
hel
low
orld
```

across several reads.

The application protocol determines how bytes become complete messages.

Common strategies include:

- fixed-size messages
- length-prefixed messages
- delimiters
- protocol-specific framing

`tcp_stream` provides the byte transport. It does not impose application framing.

## Read a required amount

If the application needs a fixed number of bytes, keep reading until that amount has arrived.

```cpp
std::array<std::byte, 4> response{};

std::size_t received = 0;

while (received < response.size())
{
  auto buffer = std::span<std::byte>(
    response.data() + received,
    response.size() - received
  );

  std::size_t n = co_await stream->async_read(buffer);

  if (n == 0)
  {
    break;
  }

  received += n;
}
```

The loop belongs to the application because only the application knows how many bytes form a complete unit of data.

## Write data

Use `async_write()` with read-only memory:

```cpp
const std::array<std::byte, 4> message{
  std::byte{'p'},
  std::byte{'i'},
  std::byte{'n'},
  std::byte{'g'}
};

std::size_t bytes = co_await stream->async_write(
  message
);
```

The operation returns:

```cpp
task<std::size_t>
```

The returned value is the number of bytes written by that operation.

## Writes can be partial

`async_write()` does not promise to consume the complete supplied buffer in one call.

For reliable transmission of the full buffer, continue until every byte has been written.

```cpp
using namespace vix::async::core;
using namespace vix::async::net;

task<void> write_all(
  tcp_stream& stream,
  std::span<const std::byte> data)
{
  std::size_t written = 0;

  while (written < data.size())
  {
    std::size_t n = co_await stream.async_write(
      data.subspan(written)
    );

    if (n == 0)
    {
      throw std::runtime_error(
        "TCP write made no progress"
      );
    }

    written += n;
  }
}
```

This distinction matters because TCP exposes a stream, not an atomic message-send operation.

## Buffer lifetime

TCP read and write operations receive `std::span`.

A span does not own its memory.

The memory referenced by the span must therefore remain valid until the asynchronous operation completes.

This is safe:

```cpp
task<void> read_once(tcp_stream& stream)
{
  std::array<std::byte, 4096> buffer{};

  std::size_t bytes = co_await stream.async_read(
    buffer
  );

  vix::print("bytes:", bytes);
}
```

`buffer` lives in the coroutine frame and remains valid while the coroutine is suspended.

The same rule applies to write buffers.

## Create a listener

A TCP server starts with:

```cpp
auto listener = make_tcp_listener(ctx);
```

The factory returns:

```cpp
std::unique_ptr<tcp_listener>
```

The listener owns the listening socket associated with the context networking backend.

## Start listening

Use `async_listen()`:

```cpp
co_await listener->async_listen({
  "0.0.0.0",
  9090
});
```

The default backlog is:

```text
128
```

A different backlog can be supplied explicitly:

```cpp
co_await listener->async_listen(
  {"0.0.0.0", 9090},
  256
);
```

The operation returns only after the socket has been opened, bound, and placed into listening state.

Although the API returns `task<void>` so it composes naturally with coroutine code, the current bind and listen setup itself is performed synchronously when that task executes.

There is no pending network wait once `async_listen()` returns.

## Accept a connection

Use:

```cpp
auto client = co_await listener->async_accept();
```

The result is:

```cpp
std::unique_ptr<tcp_stream>
```

The coroutine suspends until a client connection is available.

```text
listener
   ↓
async_accept()
   ↓
coroutine suspended
   ↓
client connects
   ↓
accepted tcp_stream
   ↓
scheduler
   ↓
coroutine resumes
```

The accepted stream can then use the same read and write operations as an outgoing TCP stream.

## Handle one client

A connection handler can own the accepted stream:

```cpp
task<void> handle_client(
  std::unique_ptr<tcp_stream> client)
{
  std::array<std::byte, 4096> buffer{};

  try
  {
    std::size_t bytes = co_await client->async_read(
      buffer
    );

    if (bytes > 0)
    {
      co_await write_all(
        *client,
        std::span<const std::byte>(
          buffer.data(),
          bytes
        )
      );
    }
  }
  catch (const std::system_error& error)
  {
    vix::print("TCP error:", error.what());
  }

  client->close();
}
```

Moving the `std::unique_ptr` into the coroutine gives the handler ownership of that connection.

## Accept several clients

A server often needs to return to `async_accept()` while previous clients are still active.

Awaiting the handler directly would serialize connections:

```cpp
auto client = co_await listener->async_accept();

co_await handle_client(
  std::move(client)
);
```

The listener cannot accept the next client until the current handler finishes.

Detach the handler when the connections should progress independently:

```cpp
auto client = co_await listener->async_accept();

spawn_detached(
  ctx,
  handle_client(std::move(client))
);
```

A server loop can therefore have this shape:

```cpp
while (ctx.is_running())
{
  auto client = co_await listener->async_accept();

  spawn_detached(
    ctx,
    handle_client(std::move(client))
  );
}
```

Each connection still uses the same Vix scheduler and networking backend.

`spawn_detached()` does not create one thread per client.

## Complete loopback example

The following program starts one local TCP listener, exchanges four bytes with one client, then stops the context.

```cpp
#include <array>
#include <cstddef>
#include <span>
#include <stdexcept>
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;
using namespace vix::async::net;

task<void> write_all(
  tcp_stream& stream,
  std::span<const std::byte> data)
{
  std::size_t written = 0;

  while (written < data.size())
  {
    std::size_t n = co_await stream.async_write(
      data.subspan(written)
    );

    if (n == 0)
    {
      throw std::runtime_error(
        "TCP write made no progress"
      );
    }

    written += n;
  }
}

task<void> server(tcp_listener& listener)
{
  auto client = co_await listener.async_accept();

  std::array<std::byte, 4> buffer{};
  std::size_t received = 0;

  while (received < buffer.size())
  {
    std::size_t n = co_await client->async_read(
      std::span<std::byte>(
        buffer.data() + received,
        buffer.size() - received
      )
    );

    if (n == 0)
    {
      break;
    }

    received += n;
  }

  co_await write_all(
    *client,
    std::span<const std::byte>(
      buffer.data(),
      received
    )
  );

  client->close();
}

task<void> client(io_context& ctx)
{
  auto stream = make_tcp_stream(ctx);

  co_await stream->async_connect({
    "127.0.0.1",
    9090
  });

  const std::array<std::byte, 4> message{
    std::byte{'p'},
    std::byte{'i'},
    std::byte{'n'},
    std::byte{'g'}
  };

  co_await write_all(
    *stream,
    message
  );

  std::array<std::byte, 4> response{};
  std::size_t received = 0;

  while (received < response.size())
  {
    std::size_t n = co_await stream->async_read(
      std::span<std::byte>(
        response.data() + received,
        response.size() - received
      )
    );

    if (n == 0)
    {
      break;
    }

    received += n;
  }

  vix::print("received:", received);

  stream->close();
}

task<void> run(io_context& ctx)
{
  auto listener = make_tcp_listener(ctx);

  co_await listener->async_listen({
    "127.0.0.1",
    9090
  });

  co_await when_all(
    ctx.get_scheduler(),
    server(*listener),
    client(ctx)
  );

  listener->close();
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

The server and client are coordinated with the same scheduler, while the actual TCP waits are handled by the networking backend.

## Cancel a connection attempt

`async_connect()` accepts a `cancel_token`:

```cpp
cancel_source source;

co_await stream->async_connect(
  {"example.com", 443},
  source.token()
);
```

The same cancellation request covers the pending resolution and connection process used by the current backend.

If cancellation wins, the coroutine resumes with:

```cpp
errc::canceled
```

through `std::system_error`.

## Cancel a read

A pending read can be cancelled:

```cpp
std::array<std::byte, 4096> buffer{};

co_await stream->async_read(
  buffer,
  token
);
```

The flow is:

```text
async_read pending
       ↓
request_cancel()
       ↓
socket operation cancelled
       ↓
network completion
       ↓
scheduler
       ↓
coroutine resumes
       ↓
errc::canceled
```

Cancellation does not make the buffer invalid. Its normal C++ lifetime must still cover the operation until the coroutine resumes.

## Cancel a write

Writes support the same token model:

```cpp
co_await stream->async_write(
  data,
  token
);
```

If cancellation is requested while the operation is active, the network backend asks Asio to cancel the socket operation.

The awaiting coroutine then observes cancellation through its task result.

## Cancel an accept

`async_accept()` accepts an optional token:

```cpp
auto client = co_await listener->async_accept(
  token
);
```

This is useful when a server needs to stop waiting for another client without waiting for an incoming connection.

For example:

```cpp
cancel_source source;

try
{
  auto client = co_await listener->async_accept(
    source.token()
  );
}
catch (const std::system_error& error)
{
  if (error.code() == cancelled_ec())
  {
    vix::print("accept canceled");
  }
}
```

`async_listen()` itself does not take a cancellation token.

## Cancellation and closing

Cancellation and `close()` have different roles.

A cancellation token belongs to an asynchronous operation:

```text
cancel token
    ↓
stop pending connect / read / write / accept
```

`close()` belongs to the socket lifetime:

```text
close()
   ↓
socket no longer usable
```

For a stream:

```cpp
stream->close();
```

cancels outstanding socket activity, shuts down both directions, and closes the underlying socket.

The operation is idempotent.

## Close a listener

Use:

```cpp
listener->close();
```

when the server should stop accepting new connections and release the listening socket.

After calling `close()`:

```cpp
listener->is_open()
```

reports `false`.

Closing the listener does not close TCP streams that were already accepted. Those streams have their own ownership and lifetime.

```text
listener
   ├── accepted stream A
   ├── accepted stream B
   └── accepted stream C

close listener
   ↓
no new accepts

A / B / C remain separate stream objects
```

## Errors

TCP operations use `std::system_error` for operational failures.

A client can handle them normally:

```cpp
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
    vix::print("TCP error:", error.what());
  }
}
```

Possible failure sources include:

- hostname resolution
- connection establishment
- bind or listen setup
- accept
- read
- write
- application cancellation
- Async runtime shutdown

Underlying network failures preserve the backend `std::error_code`.

## Cancellation and shutdown errors

Application cancellation reports:

```cpp
errc::canceled
```

Runtime service shutdown reports:

```cpp
errc::stopped
```

These represent different causes:

```text
errc::canceled
    ↓
application requested cancellation

errc::stopped
    ↓
Async networking service is shutting down
```

Code can distinguish them through the `std::system_error` error code.

## End of stream

A remote peer can close its side of the connection while a read is pending.

The underlying network backend reports that condition as a network error through `std::system_error`.

Applications that treat peer disconnect as a normal part of their protocol can handle that condition at the connection boundary and finish the client handler cleanly.

A server should not assume that every connection ends only after a complete application message has arrived.

## Runtime shutdown

A TCP operation may still be pending when `io_context::shutdown()` starts.

For example:

```text
async_accept pending
       ↓
context shutdown
       ↓
network service stops operation
       ↓
Asio completion
       ↓
scheduler
       ↓
coroutine resumes
       ↓
errc::stopped
```

The scheduler remains available long enough for pending network operations to leave their suspension points.

This is why network lifetime and scheduler lifetime are coordinated by `io_context`.

## Native socket handle

`tcp_stream` also exposes:

```cpp
int native_handle();
```

This is intended for transport adapters that need access to the underlying platform socket, such as a TLS integration.

The base interface does not require every possible implementation to expose a native handle. An implementation that cannot provide one may throw `std::runtime_error`.

Normal TCP application code should prefer the portable stream API.

## API overview

### `tcp_endpoint`

```cpp
struct tcp_endpoint
{
  std::string host;
  std::uint16_t port{0};
};
```

### `tcp_stream`

| API                              | Purpose                                           |
| -------------------------------- | ------------------------------------------------- |
| `async_connect(endpoint, token)` | Resolve and connect to a remote TCP endpoint.     |
| `async_read(buffer, token)`      | Read up to the supplied buffer size.              |
| `async_write(buffer, token)`     | Write some bytes from the supplied buffer.        |
| `close()`                        | Cancel activity, shut down, and close the stream. |
| `is_open()`                      | Check whether the socket is open.                 |
| `native_handle()`                | Access the platform socket handle when supported. |

### `tcp_listener`

| API                               | Purpose                                        |
| --------------------------------- | ---------------------------------------------- |
| `async_listen(endpoint, backlog)` | Bind and start listening.                      |
| `async_accept(token)`             | Wait for and return one accepted `tcp_stream`. |
| `close()`                         | Stop accepting and close the listening socket. |
| `is_open()`                       | Check whether the listener is open.            |

Factories:

```cpp
std::unique_ptr<tcp_stream>
make_tcp_stream(io_context& ctx);

std::unique_ptr<tcp_listener>
make_tcp_listener(io_context& ctx);
```

## Next step

Continue with [UDP](./udp) to see how datagram-oriented communication differs from TCP streams.

Then read:

- [DNS](./dns)
- [Cancellation](./cancellation)
- [Spawn and Detached Tasks](./spawn)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
