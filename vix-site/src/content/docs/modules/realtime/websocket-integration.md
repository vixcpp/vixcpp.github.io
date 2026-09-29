# WebSocket Integration

Vix Realtime provides `WebSocketAdapter` for using Realtime with the Vix WebSocket module.

The adapter connects an existing WebSocket server to the Realtime transport interface.

```text
Vix WebSocket
      |
      v
WebSocketAdapter
      |
      v
Connection
protocol::Envelope
      |
      v
Realtime application
```

The adapter handles WebSocket transport. It does not define room or command behavior.

## Enable WebSocket support

WebSocket support is enabled by default:

```text
VIX_REALTIME_WITH_WEBSOCKET=ON
```

It can be enabled explicitly with:

```bash
cmake -S . -B build \
  -DVIX_REALTIME_WITH_WEBSOCKET=ON
```

When enabled, Realtime links with the Vix WebSocket module and exposes `WebSocketAdapter` through the Realtime umbrella header.

## Create an adapter

Given an existing Vix WebSocket server:

```cpp
vix::realtime::WebSocketAdapter adapter{
    websocketServer};
```

The adapter starts detached.

```cpp
adapter.attached(); // false
```

## Configure handlers

Use `TransportHandlers` to receive WebSocket activity as Realtime objects.

```cpp
vix::realtime::TransportHandlers handlers;

handlers.onEnvelope =
    [](
        vix::realtime::ConnectionPtr connection,
        const vix::realtime::protocol::Envelope &envelope)
{
    // Handle the Realtime message.
};

adapter.set_handlers(
    std::move(handlers));
```

The same transport callbacks described in [Transport](./transport) are available:

```text
onOpen
onEnvelope
onClose
onError
```

## Attach the adapter

Install the adapter on the WebSocket server with:

```cpp
adapter.attach();
```

After attachment:

```cpp
adapter.attached(); // true
```

The adapter installs handlers for WebSocket:

```text
open
message
close
error
```

Installing these handlers replaces the corresponding callbacks already configured on the WebSocket server.

## The WebSocket server remains separate

`attach()` does not start the WebSocket server.

The application remains responsible for the WebSocket server lifecycle.

```text
WebSocket server
    manages network lifecycle

WebSocketAdapter
    connects WebSocket activity to Realtime
```

Likewise, `WebSocketAdapter` does not start or stop the Realtime `Server`.

## Opening a WebSocket connection

When a WebSocket session opens, the adapter creates a Realtime `Connection` wrapper.

```text
WebSocket session
      |
      v
WebSocketAdapter
      |
      v
Realtime Connection
```

The adapter then invokes:

```cpp
handlers.onOpen
```

when that callback is configured.

For example:

```cpp
handlers.onOpen =
    [](vix::realtime::ConnectionPtr connection)
{
    auto id = connection->id();
};
```

## Connection IDs

WebSocket connections receive generated Realtime connection IDs.

By default they look like:

```text
ws-1
ws-2
ws-3
```

The prefix is configurable.

```cpp
vix::realtime::WebSocketAdapterOptions options;

options.connectionIdPrefix = "client";

vix::realtime::WebSocketAdapter adapter{
    websocketServer,
    options};
```

Generated identifiers then use:

```text
client-1
client-2
```

The prefix must:

- not be empty
- contain at most 32 characters
- contain only letters, digits, `.`, `-`, or `_`

## Incoming messages

Incoming WebSocket text messages are parsed as Realtime protocol envelopes.

```text
WebSocket text
      |
      v
protocol::parse()
      |
      v
protocol::Envelope
      |
      v
onEnvelope
```

For example, a valid protocol request is delivered to:

```cpp
handlers.onEnvelope =
    [](
        vix::realtime::ConnectionPtr,
        const vix::realtime::protocol::Envelope &envelope)
{
    if (envelope.kind() ==
        vix::realtime::protocol::MessageKind::Request)
    {
        // Handle the request.
    }
};
```

The adapter validates the protocol before invoking the callback.

## Application commands are not automatic

Receiving a request envelope does not automatically call:

```cpp
server.execute(command);
```

The adapter only parses and forwards the protocol message.

```text
WebSocket message
      |
      v
WebSocketAdapter
      |
      v
Envelope
      |
      v
application integration
      |
      v
Realtime Server
```

The application decides how a request maps to rooms, sessions, commands, authentication, or other operations.

This keeps WebSocket transport separate from application behavior.

## Outgoing messages

A WebSocket-backed Realtime connection sends protocol envelopes as WebSocket text messages.

```cpp
connection->send(envelope);
```

The adapter performs:

```text
Envelope
   |
   v
protocol::serialize()
   |
   v
WebSocket send_text()
```

Outgoing envelopes are validated before they are serialized.

## Message size limit

The adapter limits incoming WebSocket message size.

The default is:

```text
64 KiB
```

Configure it with:

```cpp
vix::realtime::WebSocketAdapterOptions options;

options.maxMessageSize =
    128 * 1024;
```

Messages larger than the configured limit produce:

```text
PayloadTooLarge
```

Set the limit to zero to disable the adapter-level size check:

```cpp
options.maxMessageSize = 0;
```

This setting controls only the Realtime adapter. The underlying WebSocket server may have its own limits.

## Protocol errors

By default:

```cpp
options.closeOnProtocolError = true;
```

If an incoming message cannot be parsed or validated, the adapter:

1. reports the error through `onError`, when configured
2. closes the connection

For example, malformed protocol input can produce:

```text
InvalidProtocolMessage
```

An unsupported protocol version can produce:

```text
UnsupportedProtocolVersion
```

## Keep the connection open after protocol errors

Automatic closing can be disabled:

```cpp
vix::realtime::WebSocketAdapterOptions options;

options.closeOnProtocolError = false;
```

The adapter still reports the error through `onError`, but does not automatically close the WebSocket connection.

## WebSocket errors

Errors reported by the underlying WebSocket server are forwarded through:

```cpp
handlers.onError
```

using:

```text
TransportFailure
```

when they represent WebSocket transport failures.

## Connection close

When the underlying WebSocket session closes, the adapter:

1. removes the tracked Realtime connection
2. marks its connection wrapper closed
3. invokes `onClose`, when configured

For example:

```cpp
handlers.onClose =
    [](vix::realtime::ConnectionPtr connection)
{
    // The WebSocket connection closed.
};
```

The application can use this callback to detach the corresponding logical Realtime session.

A closed WebSocket connection does not have to mean that the logical session is permanently closed.

See [Session Resume](./session-resume) for temporary disconnection recovery.

## Find a connection

Find a tracked connection by its generated ID:

```cpp
auto connection =
    adapter.find_connection(
        vix::realtime::ConnectionId{"ws-1"});
```

A missing connection returns a null pointer.

## List connections

Get all currently tracked connections with:

```cpp
auto connections =
    adapter.connections();
```

The returned connections are sorted by connection ID.

Get only the count with:

```cpp
auto count =
    adapter.connection_count();
```

These are transport connections, not logical Realtime sessions.

## Connection metadata

A WebSocket-backed connection exposes metadata containing:

```text
transport
connection_id
```

For example:

```cpp
auto metadata =
    connection->metadata();
```

The transport value is:

```text
websocket
```

## Detach the adapter

Detach the integration with:

```cpp
adapter.detach();
```

After detachment:

```cpp
adapter.attached(); // false
```

The adapter removes its tracked Realtime connection wrappers and marks them closed.

Existing underlying WebSocket sessions are not closed by `detach()`.

```text
adapter.detach()
      |
      +---- stop forwarding activity
      +---- clear tracked wrappers
      +---- mark wrappers closed
      |
      +---- WebSocket sessions remain open
```

Detaching also does not stop the WebSocket server.

## Attach again

The adapter can be attached again after detachment:

```cpp
adapter.detach();
adapter.attach();
```

Both `attach()` and `detach()` are safe to call repeatedly. They report whether the adapter actually changed state.

## Adapter options

The complete adapter configuration is:

| Option                 | Default  | Purpose                                        |
| ---------------------- | -------- | ---------------------------------------------- |
| `maxMessageSize`       | `64 KiB` | Maximum incoming WebSocket message size        |
| `closeOnProtocolError` | `true`   | Close connections after invalid protocol input |
| `connectionIdPrefix`   | `"ws"`   | Prefix for generated Realtime connection IDs   |

Read the current options with:

```cpp
const auto &options =
    adapter.options();
```

## Main integration model

The complete boundary is:

```text
WebSocket client
      |
      v
Vix WebSocket Server
      |
      v
WebSocketAdapter
      |
      +---- Connection
      |
      +---- protocol::Envelope
      |
      v
Application integration
      |
      v
Realtime Server
      |
      v
Rooms and Sessions
```

`WebSocketAdapter` provides the network bridge. Realtime continues to own rooms, sessions, authoritative events, persistence, and recovery independently from the WebSocket transport.

Continue with [Room Ownership](./room-ownership) for how Realtime represents ownership of rooms across runtime nodes.
