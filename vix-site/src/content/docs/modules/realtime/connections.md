# Connections

`vix::realtime::Connection` represents one active transport connection attached to a logical session.

A connection can represent a WebSocket connection or another transport implementation.

```text
Session
   |
   v
Connection
   |
   v
Transport
```

A connection is temporary. The logical `Session` may continue to exist after the connection disappears.

## Connection and session

A session and a connection have different roles.

```text
Session
    logical client
    room memberships
    resume state

Connection
    current transport
    send messages
    report open state
    close transport
```

This separation allows a session to reconnect using another connection.

```text
Session
   |
Connection A
   |
disconnect
   |
Session
   |
Connection B
```

See [Sessions](./sessions) for the logical session lifecycle.

## Connection interface

`Connection` is an abstract interface:

```cpp
class Connection
{
public:
    virtual ~Connection() = default;

    virtual const ConnectionId &
    id() const noexcept = 0;

    virtual bool
    is_open() const noexcept = 0;

    virtual void
    send(const protocol::Envelope &envelope) = 0;

    virtual void
    close(
        ErrorCode code = ErrorCode::Cancelled,
        std::string_view reason = {}) = 0;
};
```

Most applications receive connection objects from a transport adapter instead of creating them directly.

## Connection ID

Every connection has a stable identifier:

```cpp
const auto &id = connection->id();
```

The identifier must remain valid for the lifetime of the connection.

An open connection attached to a session must have a non-empty identifier.

## Check whether a connection is open

Use:

```cpp
if (connection->is_open())
{
    // Connection can still send messages.
}
```

A closed connection cannot be attached to a session.

## Send a message

Connections send Realtime protocol envelopes:

```cpp
connection->send(envelope);
```

The transport implementation is responsible for delivering the envelope to the client.

For one connection, messages must preserve the order in which `send()` is called.

```text
send A
send B
send C

   |
   v

A
B
C
```

If delivery fails, the connection implementation should report `ErrorCode::TransportFailure`.

## Send through a session

Application code will often send through the logical session instead:

```cpp
session->send(envelope);
```

The session verifies that an active open connection exists and then forwards the envelope to it.

```text
Session
   |
   v
Connection::send()
   |
   v
Transport
```

## Close a connection

Close the underlying transport with:

```cpp
connection->close();
```

The default close code is:

```cpp
vix::realtime::ErrorCode::Cancelled
```

A reason can also be supplied:

```cpp
connection->close(
    vix::realtime::ErrorCode::TransportFailure,
    "connection lost");
```

Calling `close()` on an already closed connection should be harmless.

## Attach a connection

A connection can be attached to a session:

```cpp
session->attach(connection);
```

The connection must:

- exist
- have a non-empty identifier
- be open

If another connection was already attached, `attach()` returns the previous connection:

```cpp
auto previous =
    session->attach(newConnection);
```

The caller can then decide whether to close the previous transport.

For normal runtime coordination, use `RoomManager`:

```cpp
manager.attach_connection(
    sessionId,
    connection);
```

This also updates presence when presence is enabled.

## Detach a connection

Detach the active connection with:

```cpp
auto connection =
    session->detach();
```

The logical session remains alive.

```text
Connected Session
       |
       v
detach connection
       |
       v
Detached Session
```

Room memberships and resume state can therefore survive temporary network loss.

## Detach by ID

A specific connection can be detached using its identifier:

```cpp
session->detach(connectionId);
```

The connection is detached only if the identifier matches the currently attached connection.

This protects a newer connection from an old transport callback.

For example:

```text
Connection A disconnects
        |
Connection B is already attached
        |
old callback for A arrives
        |
        v
Connection B remains attached
```

`RoomManager` provides the coordinated form:

```cpp
manager.detach_connection(
    sessionId,
    connectionId);
```

Presence is marked detached when presence is enabled.

## Replace a connection

A logical session can move from one connection to another:

```cpp
auto previous =
    session->attach(newConnection);
```

This is used during reconnection and session resumption.

Replacing the connection does not replace the logical session.

```text
same SessionId
same identity
same room memberships

connection changes
```

See [Session Resume](./session-resume) for the complete recovery workflow.

## Metadata

A connection can expose transport-specific metadata:

```cpp
auto metadata =
    connection->metadata();
```

Metadata may contain information such as:

```text
remote address
transport name
user agent
tracing information
```

The default implementation returns an empty object.

Connection metadata must not contain authoritative room state.

## Connection ownership

Realtime uses shared pointers for active connections:

```cpp
vix::realtime::ConnectionPtr
```

which is equivalent to:

```cpp
std::shared_ptr<vix::realtime::Connection>
```

A weak alias is also available:

```cpp
vix::realtime::WeakConnectionPtr
```

## Transport independence

`Connection` does not depend on WebSocket.

A transport adapter implements the interface required to send and close its underlying connection.

```text
              Connection
                  |
          +-------+-------+
          |               |
          v               v
      WebSocket       other transport
```

This allows the Realtime runtime to work with different networking mechanisms while keeping rooms and sessions independent from transport-specific code.

Continue with [Session Resume](./session-resume) for reconnecting a detached logical session through a new connection.
