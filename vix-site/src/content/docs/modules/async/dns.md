# DNS

Vix Async provides asynchronous hostname resolution through `dns_resolver`.

Applications often know a service by name:

```text
example.com
```

while TCP and UDP ultimately communicate with IP addresses.

DNS resolution converts that hostname and port into one or more concrete network addresses without blocking the Vix scheduler thread while the resolver waits.

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

DNS types live in:

```cpp
vix::async::net
```

## Create a resolver

Create a resolver for an `io_context`:

```cpp
using namespace vix::async::core;
using namespace vix::async::net;

io_context ctx;

auto resolver = make_dns_resolver(ctx);
```

The factory returns:

```cpp
std::unique_ptr<dns_resolver>
```

The resolver uses the network backend associated with that context.

## Resolve a hostname

Use `async_resolve()`:

```cpp
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443
);
```

The operation returns:

```cpp
task<std::vector<resolved_address>>
```

The coroutine suspends while resolution is pending.

When Asio completes the lookup, the result returns through the Vix scheduler.

## Resolution flow

The execution model is:

```text
coroutine
    ↓
async_resolve()
    ↓
coroutine suspends
    ↓
Asio resolver
    ↓
DNS resolution completes
    ↓
continuation posted to Vix scheduler
    ↓
coroutine resumes
```

DNS does not use the Async CPU pool.

The network service handles the operation through its Asio backend.

## Resolved addresses

Each result is represented by:

```cpp
resolved_address
```

with the logical shape:

```cpp
struct resolved_address
{
  std::string ip;
  std::uint16_t port{0};
};
```

For example:

```cpp
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443
);

for (const auto& address : addresses)
{
  vix::print(
    "address:",
    address.ip,
    address.port
  );
}
```

The IP address is returned as text.

The port is represented as `std::uint16_t` in host byte order.

## Why resolution returns several addresses

A hostname is not necessarily associated with one IP address.

DNS may return:

```text
hostname
   ↓
IPv4 address A
IPv4 address B
IPv6 address C
```

For this reason, `async_resolve()` returns:

```cpp
std::vector<resolved_address>
```

rather than one `resolved_address`.

The application can choose the address that matches its connection strategy.

## IPv4 and IPv6

The resolver can return both IPv4 and IPv6 results when the system resolver provides them.

For example, the same hostname may produce entries such as:

```text
93.184.216.34
2606:2800:220:1:248:1893:25c8:1946
```

Application code should not assume that every resolved address is IPv4.

The textual `ip` field preserves the address returned by the resolver.

## Ports participate in resolution

`async_resolve()` receives both the hostname and the port:

```cpp
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443
);
```

The returned entries contain that resolved endpoint information:

```text
IP address
+
port
```

This allows the result to be used directly when constructing a TCP or UDP endpoint.

## Use a result with TCP

A resolved address can be converted into a `tcp_endpoint`.

```cpp
auto addresses = co_await resolver->async_resolve(
  "example.com",
  443
);

if (addresses.empty())
{
  co_return;
}

tcp_endpoint endpoint{
  addresses.front().ip,
  addresses.front().port
};
```

A TCP stream can then connect:

```cpp
auto stream = make_tcp_stream(ctx);

co_await stream->async_connect(endpoint);
```

This explicit form is useful when the application wants to inspect or choose the resolved addresses itself.

## TCP can also resolve hostnames

A TCP connection does not always require a separate resolver object.

The current TCP backend can resolve the hostname passed directly to:

```cpp
co_await stream->async_connect({
  "example.com",
  443
});
```

Use `dns_resolver` explicitly when the application needs access to the resolution results themselves.

Examples include:

- inspecting available addresses
- choosing IPv4 or IPv6 explicitly
- caching resolution results
- trying addresses according to application policy
- resolving before constructing a UDP destination

## UDP and DNS

The current UDP `async_send_to()` API expects a numeric IP address.

This means a hostname should be resolved first.

```cpp
auto resolver = make_dns_resolver(ctx);

auto addresses = co_await resolver->async_resolve(
  "example.com",
  9000
);
```

Then use a returned address:

```cpp
if (!addresses.empty())
{
  udp_endpoint destination{
    addresses.front().ip,
    addresses.front().port
  };

  co_await socket->async_send_to(
    message,
    destination
  );
}
```

This keeps hostname resolution and UDP datagram transmission as separate operations.

## Handle an empty result

Do not assume that a successful resolution necessarily gives a usable entry.

Application code can check:

```cpp
if (addresses.empty())
{
  vix::print("no addresses");
  co_return;
}
```

An empty result and an exception represent different situations.

The resolver returns the addresses provided by the backend. The application decides whether an empty set is acceptable.

## Choose an address deliberately

Using:

```cpp
addresses.front()
```

is convenient for simple examples, but more advanced applications may want an explicit selection policy.

For example:

```cpp
for (const auto& address : addresses)
{
  vix::print(
    "candidate:",
    address.ip,
    address.port
  );
}
```

The application could then prefer:

- IPv6
- IPv4
- a known local network range
- the first address that successfully connects

DNS resolution tells the application which addresses are available. It does not define the complete connection policy.

## Cancellation

`async_resolve()` accepts a `cancel_token`.

```cpp
cancel_source source;

auto addresses = co_await resolver->async_resolve(
  "example.com",
  443,
  source.token()
);
```

Cancellation can be requested elsewhere:

```cpp
source.request_cancel();
```

The pending resolver operation is connected to Asio cancellation.

If cancellation wins, the coroutine resumes through the Vix scheduler with:

```cpp
errc::canceled
```

as a `std::system_error`.

## Handle cancellation

For example:

```cpp
task<void> resolve(
  io_context& ctx,
  cancel_token token)
{
  auto resolver = make_dns_resolver(ctx);

  try
  {
    auto addresses = co_await resolver->async_resolve(
      "example.com",
      443,
      token
    );

    vix::print("addresses:", addresses.size());
  }
  catch (const std::system_error& error)
  {
    if (error.code() == cancelled_ec())
    {
      vix::print("resolution canceled");
      co_return;
    }

    throw;
  }
}
```

Cancellation stops the pending resolution operation.

It does not shut down the complete networking service.

## Cancellation before resolution starts

If the token is already cancelled:

```cpp
cancel_source source;
source.request_cancel();

auto addresses = co_await resolver->async_resolve(
  "example.com",
  443,
  source.token()
);
```

the operation reports cancellation instead of beginning a normal resolution workflow.

This prevents work that the application already knows it no longer needs.

## Errors

DNS failures are reported through `std::system_error`.

For example:

```cpp
task<void> resolve(io_context& ctx)
{
  auto resolver = make_dns_resolver(ctx);

  try
  {
    auto addresses = co_await resolver->async_resolve(
      "example.com",
      443
    );

    for (const auto& address : addresses)
    {
      vix::print(
        address.ip,
        address.port
      );
    }
  }
  catch (const std::system_error& error)
  {
    vix::print("DNS error:", error.what());
  }
}
```

Underlying resolver errors preserve the backend `std::error_code`.

Possible failures include:

- invalid resolver input
- host not found
- temporary resolver failure
- network failure
- application cancellation
- network service shutdown

The application can inspect the error code when it needs behavior more specific than a general failure message.

## Cancellation and shutdown are different

Application cancellation reports:

```cpp
errc::canceled
```

Runtime shutdown reports:

```cpp
errc::stopped
```

They represent different causes:

```text
errc::canceled
    ↓
application requested cancellation

errc::stopped
    ↓
Async networking runtime is stopping
```

Both arrive through `std::system_error`.

This distinction allows an application to treat user cancellation differently from runtime teardown.

## Runtime shutdown

A DNS operation can still be pending when the context begins shutting down.

The network service tracks active operations so they can leave their suspended state before the scheduler disappears.

```text
DNS resolution pending
        ↓
io_context shutdown
        ↓
network service stops resolver operation
        ↓
Asio completion
        ↓
Vix scheduler
        ↓
coroutine resumes
        ↓
errc::stopped
```

This is part of the same lifecycle used by TCP and UDP operations.

## Resolver lifetime

A resolver object must remain alive while an operation on it is active.

This is naturally satisfied when the resolver belongs to the coroutine frame:

```cpp
task<void> resolve(io_context& ctx)
{
  auto resolver = make_dns_resolver(ctx);

  auto addresses = co_await resolver->async_resolve(
    "example.com",
    443
  );

  vix::print("addresses:", addresses.size());
}
```

The coroutine frame remains alive while suspended, so the local `resolver` remains alive too.

The surrounding `io_context` and scheduler must also remain valid while the network operation can still complete.

## Resolver ownership

`make_dns_resolver()` returns:

```cpp
std::unique_ptr<dns_resolver>
```

The caller owns that public resolver object.

Internally, the resolver shares ownership of the network backend it uses.

This protects the Asio executor lifetime, but it does not make the resolver independent from the Vix scheduler.

The normal relationship remains:

```text
io_context
    ↓
network service
    ↓
dns_resolver
    ↓
async resolution
    ↓
scheduler continuation
```

## Several DNS lookups

Independent DNS operations can run together with `when_all`.

```cpp
auto first = make_dns_resolver(ctx);
auto second = make_dns_resolver(ctx);

auto results = co_await when_all(
  ctx.get_scheduler(),
  first->async_resolve(
    "example.com",
    443
  ),
  second->async_resolve(
    "example.org",
    443
  )
);
```

The caller resumes after both lookups complete.

Each result keeps its original argument position.

## Race several resolutions

`when_any` can also coordinate independent DNS lookups:

```cpp
auto result = co_await when_any(
  ctx.get_scheduler(),
  first->async_resolve(
    "example.com",
    443
  ),
  second->async_resolve(
    "example.org",
    443
  )
);
```

Remember that the losing operation continues.

`when_any` does not automatically cancel the resolver that did not finish first.

If the losing lookup should stop, provide an explicit cancellation policy.

## DNS is not connection establishment

Resolution only produces addresses.

```text
hostname
   ↓
DNS
   ↓
IP addresses
```

It does not establish a TCP connection:

```text
resolved address
      ↓
TCP connect
```

and it does not send a UDP datagram:

```text
resolved address
      ↓
UDP send
```

Keeping these operations separate makes errors and policy clearer.

A DNS success does not mean the remote service is reachable.

## Avoid blocking resolver calls

Do not replace Async DNS with a synchronous resolver call on the scheduler thread.

The Async API already provides:

```cpp
co_await resolver->async_resolve(
  "example.com",
  443
);
```

The coroutine can suspend while the resolver backend waits.

There is normally no reason to move DNS resolution to:

```cpp
ctx.cpu_pool().submit(...)
```

when the networking service already has a native asynchronous operation.

## A complete resolution example

```cpp
#include <vix/async.hpp>
#include <vix/print.hpp>

using namespace vix::async::core;
using namespace vix::async::net;

task<void> run(io_context& ctx)
{
  auto resolver = make_dns_resolver(ctx);

  try
  {
    auto addresses = co_await resolver->async_resolve(
      "example.com",
      443
    );

    vix::print(
      "resolved addresses:",
      addresses.size()
    );

    for (const auto& address : addresses)
    {
      vix::print(
        address.ip,
        address.port
      );
    }
  }
  catch (const std::system_error& error)
  {
    vix::print(
      "resolution failed:",
      error.what()
    );
  }

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

The resolver performs its network work through the Async networking backend, while the coroutine resumes through the Vix scheduler.

## API overview

### `resolved_address`

```cpp
struct resolved_address
{
  std::string ip;
  std::uint16_t port{0};
};
```

### `dns_resolver`

The main operation is:

```cpp
task<std::vector<resolved_address>>
async_resolve(
  std::string host,
  std::uint16_t port,
  cancel_token token = {}
);
```

Factory:

```cpp
std::unique_ptr<dns_resolver>
make_dns_resolver(io_context& ctx);
```

`async_resolve()` can complete with:

- a vector of resolved addresses
- `errc::canceled`
- `errc::stopped`
- an underlying resolver error

## Next step

Continue with [Signals](./signals) to see how Vix Async waits for operating-system signals through the same coroutine and scheduler model.

Then read:

- [TCP](./tcp)
- [UDP](./udp)
- [Cancellation](./cancellation)
- [Lifecycle and Shutdown](./lifecycle-and-shutdown)
