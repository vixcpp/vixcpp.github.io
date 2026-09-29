# Transport

`vix::realtime::Transport` is the interface between Realtime and a network transport.

It converts transport-specific activity into Realtime concepts:

```text
network transport
      |
      v
Connection
protocol::Envelope
      |
      v
Realtime application
```

The transport layer does not define room behavior or application commands.

## Transport interface

A transport implements:

```text
set_handlers()
handlers()
attach()
detach()
attached()
connection_count()
```

Applications normally use a concrete adapter such as `WebSocketAdapter`.

## Transport handlers

Realtime receives transport activity through `TransportHandlers`.

```cpp
vix::realtime::TransportHandlers handlers;
```

Four callbacks are available:

```text
onOpen
onEnvelope
onClose
onError
```

## Connection opened

`onOpen` is called when a transport connection becomes available.

```cpp
handlers.onOpen =
    [](vix::realtime::ConnectionPtr connection)
{
    // A client connection is available.
};
```

The callback receives a Realtime `Connection`, not the transport-specific connection type.

This keeps the application independent from the underlying network implementation.

## Envelope received

`onEnvelope` is called when a complete Realtime protocol envelope has been received.

```cpp
handlers.onEnvelope =
    [](
        vix::realtime::ConnectionPtr connection,
        const vix::realtime::protocol::Envelope &envelope)
{
    auto type = envelope.type();
};
```

A concrete transport is responsible for converting its raw input into a valid `protocol::Envelope` before invoking this callback.

For example, a text-based transport may follow:

```text
network message
      |
      v
parse protocol
      |
      v
Envelope
      |
      v
onEnvelope
```

## Connection closed

`onClose` is called when a tracked transport connection closes.

```cpp
handlers.onClose =
    [](vix::realtime::ConnectionPtr connection)
{
    // Handle disconnection.
};
```

The application can use this notification to detach the corresponding logical session.

The `Session` may remain alive for later resumption.

## Transport errors

`onError` reports transport or protocol failures.

```cpp
handlers.onError =
    [](
        vix::realtime::ConnectionPtr connection,
        vix::realtime::ErrorCode code,
        std::string_view message)
{
    // Handle the failure.
};
```

The connection may be null when the error cannot be associated with one active client.

For example:

```cpp
if (connection)
{
    // Error belongs to this connection.
}
```

## Install handlers

Replace the current callback collection with:

```cpp
transport.set_handlers(
    std::move(handlers));
```

`set_handlers()` replaces all currently configured transport callbacks.

Read the current callbacks with:

```cpp
auto handlers =
    transport.handlers();
```

`handlers()` returns a copy of the callback collection.

## Check for handlers

A handler collection can be checked with:

```cpp
if (handlers.empty())
{
    // No callbacks configured.
}
```

`empty()` returns `true` only when all four callbacks are absent.

## Attach a transport

After configuring the callbacks:

```cpp
transport.attach();
```

`attach()` connects the adapter to its underlying transport so that new transport activity can be forwarded to Realtime callbacks.

Check the state with:

```cpp
if (transport.attached())
{
    // Transport callbacks are active.
}
```

Calling `attach()` returns `true` when the adapter transitions from detached to attached.

## Attach does not start the network server

`attach()` installs or activates the adapter integration.

It does not necessarily start the underlying listener or event loop.

The lifecycle remains separated:

```text
network server lifecycle
        |
        +---- start listener
        +---- stop listener

Realtime transport adapter
        |
        +---- attach
        +---- detach
```

For example, the WebSocket adapter attaches to an existing WebSocket server rather than starting that server itself.

## Detach a transport

Stop forwarding new transport activity with:

```cpp
transport.detach();
```

After detachment:

```cpp
transport.attached(); // false
```

`detach()` returns `true` when the transport transitions from attached to detached.

A transport implementation is not required to stop its underlying network listener when detached.

## Track connections

The number of connections currently tracked by the transport is available with:

```cpp
auto count =
    transport.connection_count();
```

The meaning is transport-level connection tracking.

It is different from the number of logical Realtime sessions.

```text
Transport
    tracks connections

RoomManager
    tracks sessions
```

A session may exist while no transport connection is currently attached.

## Transport does not execute commands

Receiving a request envelope does not automatically execute a room command.

The transport only reports the parsed envelope:

```text
incoming message
      |
      v
Transport
      |
      v
protocol::Envelope
      |
      v
onEnvelope
```

The application integration decides what the envelope means and which Realtime operation should be called.

For example:

```cpp
handlers.onEnvelope =
    [&server](
        vix::realtime::ConnectionPtr,
        const vix::realtime::protocol::Envelope &envelope)
{
    if (envelope.kind() ==
        vix::realtime::protocol::MessageKind::Request)
    {
        // Application decides how this request
        // maps to Realtime operations.
    }
};
```

This separation keeps transport parsing independent from application behavior.

## Transport does not own Server

A `Transport` and a Realtime `Server` have separate responsibilities.

```text
Transport
    network integration

Server
    Realtime runtime
```

The transport does not start, stop, or own the Realtime server.

The application connects the two through callbacks.

```text
Transport
    |
    v
TransportHandlers
    |
    v
Application integration
    |
    v
Server
```

## Connection abstraction

A transport exposes clients through:

```cpp
vix::realtime::ConnectionPtr
```

The connection interface provides:

```text
id()
is_open()
send()
close()
metadata()
```

This allows sessions and Realtime delivery code to work without depending on the original transport implementation.

See [Connections](./connections) for the full interface.

## Outgoing messages

Outgoing Realtime messages travel in the opposite direction:

```text
Realtime
   |
   v
protocol::Envelope
   |
   v
Connection::send()
   |
   v
transport-specific output
   |
   v
client
```

The `Connection` implementation decides how the envelope is encoded and sent through its underlying transport.

For example, a WebSocket connection serializes the envelope and sends it as a WebSocket text message.

## Protocol errors

Protocol parsing belongs at the transport boundary.

A concrete transport can report invalid protocol input through:

```cpp
handlers.onError(
    connection,
    errorCode,
    message);
```

The transport decides how invalid network input affects the underlying connection.

Transport-specific behavior, such as closing a WebSocket after malformed protocol input, belongs to the concrete adapter configuration rather than the generic `Transport` interface.

## Implementing another transport

A custom transport adapter must implement:

```cpp
class MyTransport
    : public vix::realtime::Transport
{
    // ...
};
```

Its main responsibility is to bridge its networking system to Realtime.

Conceptually:

```text
transport connection
      |
      v
Realtime Connection wrapper

raw message
      |
      v
protocol::Envelope

transport lifecycle
      |
      v
TransportHandlers
```

The adapter should not move room or command logic into the networking layer.

## Main boundary

The transport architecture can be summarized as:

```text
Network
   |
   v
Transport
   |
   +---- onOpen
   +---- onEnvelope
   +---- onClose
   +---- onError
   |
   v
Application integration
   |
   v
Realtime Server
```

`Transport` handles network adaptation. `Connection` represents one active client transport. `protocol::Envelope` carries Realtime messages. The application decides how those messages interact with rooms and sessions.

Continue with [WebSocket Integration](./websocket-integration) for the built-in Vix WebSocket adapter.
