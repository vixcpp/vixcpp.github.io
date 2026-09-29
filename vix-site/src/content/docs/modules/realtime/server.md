# Server

`vix::realtime::Server` is the main public facade for running a Realtime runtime.

It manages the runtime lifecycle and provides access to rooms, sessions, commands, connections, and cleanup operations.

```cpp
#include <vix/realtime.hpp>

vix::realtime::Server server{
    vix::realtime::NodeId{"node-1"}};
```

Creating a `Server` does not open a network socket.

## Start the server

A newly created server starts in the `Created` state.

Start it with:

```cpp
server.start();
```

The server then accepts runtime operations such as opening rooms or creating sessions.

```text
Created
   |
   v
Running
```

Calling `start()` while the server is already running returns `false`.

## Server status

The current lifecycle state is available through:

```cpp
auto status = server.status();
```

Possible states are:

```text
Created
Running
Stopping
Stopped
Failed
```

For common checks:

```cpp
if (server.running())
{
    // Runtime operations are available.
}
```

and:

```cpp
if (server.stopped())
{
    // Shutdown completed successfully.
}
```

## Register a room type

Rooms are created through registered `RoomFactory` objects.

```cpp
server.register_factory(factory);
```

A factory can be registered before or after `start()`.

Opening a room requires the server to be running.

## Open a room

After registering its room type:

```cpp
server.start();

auto room = server.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

`open_room()` returns the opened `Room`.

The room type must have a registered factory.

## Find a room

Use `find_room()` when the room may or may not exist:

```cpp
auto room = server.find_room(
    vix::realtime::RoomId{"room-1"});

if (room)
{
    // Room exists.
}
```

A missing room returns a null pointer.

## Close a room

Close a room with:

```cpp
auto result = server.close_room(
    vix::realtime::RoomId{"room-1"});
```

By default, the closed room is also removed from the manager.

To keep the closed room registered:

```cpp
server.close_room(
    vix::realtime::RoomId{"room-1"},
    false);
```

## Create a session

A session represents one logical client.

```cpp
auto session = server.create_session(
    vix::realtime::SessionId{"session-1"},
    "user-1");
```

The session is created without requiring a network connection.

This is useful when the application wants to manage the logical client separately from its transport.

## Find a session

```cpp
auto session = server.find_session(
    vix::realtime::SessionId{"session-1"});

if (session)
{
    // Session exists.
}
```

## Join a room

A session must exist before joining a room.

```cpp
auto result = server.join_room(
    vix::realtime::SessionId{"session-1"},
    vix::realtime::RoomId{"room-1"});
```

The server delegates membership coordination to the underlying `RoomManager`.

## Leave a room

```cpp
auto result = server.leave_room(
    vix::realtime::SessionId{"session-1"},
    vix::realtime::RoomId{"room-1"});
```

Leaving removes the logical session from the room membership.

Presence is also updated when presence support is enabled.

## Execute a command

Commands can be executed synchronously:

```cpp
vix::realtime::JsonObject payload;
payload.set_i64("amount", 1);

vix::realtime::RoomCommand command{
    vix::realtime::RoomId{"room-1"},
    vix::realtime::SessionId{"session-1"},
    "counter.increment",
    std::move(payload)};

auto result = server.execute(command);
```

The session must exist and must satisfy the room's normal command requirements.

The server updates the session activity timestamp before forwarding the command to the room manager.

## Queue a command

Commands can also be queued:

```cpp
auto status = server.enqueue(
    std::move(command));
```

The room processes queued commands separately.

Process the oldest pending command with:

```cpp
auto result = server.process_next(
    vix::realtime::RoomId{"room-1"});
```

When the queue is empty, `process_next()` returns no result.

See [Rooms](./rooms) for command processing in detail.

## Attach a connection

`connect()` creates or reuses a logical session and attaches a transport connection.

```cpp
auto session = server.connect(
    vix::realtime::SessionId{"session-1"},
    connection,
    "user-1");
```

If the session does not exist, it is created.

If it already exists, a non-empty supplied identity must match the session identity.

If another connection is already attached, the new connection replaces it and the previous connection is closed.

## Disconnect a connection

A transport connection can be detached without destroying the logical session:

```cpp
auto connection = server.disconnect(
    vix::realtime::SessionId{"session-1"},
    connectionId);
```

The session and its room memberships remain available for session resumption.

This is different from permanently closing the session.

## Close a session

To permanently close and remove a logical session:

```cpp
server.close_session(
    vix::realtime::SessionId{"session-1"});
```

Closing a session removes it from the runtime rather than leaving it detached for resumption.

See [Sessions](./sessions) for the complete lifecycle.

## Send a protocol envelope

The server can send a protocol envelope to a connected logical session:

```cpp
server.send(
    vix::realtime::SessionId{"session-1"},
    envelope);
```

The session must have an active connection.

The server itself does not decide how the underlying network transports the message. That responsibility belongs to the attached `Connection`.

## Cleanup operations

The server exposes cleanup operations, but it does not run them automatically in a background thread.

### Expired sessions

```cpp
std::size_t removed =
    server.prune_expired_sessions();
```

Connected sessions are preserved.

Detached sessions are preserved while they remain eligible for session resumption.

Once the resume window expires, they can be removed.

### Stale presence

```cpp
std::size_t removed =
    server.prune_stale_presence();
```

This removes presence records that exceed the configured presence timeout.

If no presence store is configured, the method returns `0`.

## Stop the server

Stop the runtime with:

```cpp
server.stop();
```

A normal shutdown:

1. closes all managed sessions
2. closes all managed rooms
3. changes the server state to `Stopped`

```text
Running
   |
   v
Stopping
   |
   v
Stopped
```

Shutdown attempts to continue even if an individual room or session fails to close.

If one or more cleanup operations fail, the final state becomes:

```text
Failed
```

and `stop()` throws a Realtime error after the remaining cleanup operations have been attempted.

## Restarting a stopped server

A successfully stopped server can be started again:

```cpp
server.stop();
server.start();
```

The previous rooms and sessions have already been removed during shutdown.

A server in the `Failed` state cannot be restarted.

## Server and networking

`Server` is transport-independent.

This:

```cpp
server.start();
```

starts the Realtime runtime.

It does not:

```text
open a TCP port
start an HTTP server
start a WebSocket server
accept network connections
```

Networking is connected separately through a transport adapter such as `WebSocketAdapter`.

```text
WebSocket
    |
    v
Connection
    |
    v
Server
    |
    v
RoomManager
    |
    v
Rooms
```

See [WebSocket Integration](./websocket-integration) for that integration.

## Access the underlying runtime

The underlying room manager is available when lower-level operations are required:

```cpp
auto manager = server.manager();
```

The local node identifier is available with:

```cpp
const auto &nodeId = server.node_id();
```

and the active Realtime configuration with:

```cpp
const auto &config = server.config();
```

Most applications should use the `Server` facade for normal runtime operations and work with `RoomManager` directly only when lower-level control is needed.

## Minimal lifecycle

A basic server lifecycle looks like:

```cpp
vix::realtime::Server server{
    vix::realtime::NodeId{"node-1"}};

server.register_factory(factory);

server.start();

auto room = server.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");

auto session = server.create_session(
    vix::realtime::SessionId{"session-1"},
    "user-1");

server.join_room(
    session->id(),
    room->id());

server.stop();
```

The important order is:

```text
create Server
      |
      v
register room types
      |
      v
start
      |
      v
use rooms and sessions
      |
      v
stop
```

Continue with [Rooms](./rooms) for the authoritative room lifecycle and command execution model.
