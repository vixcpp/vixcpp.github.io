# Room Manager

`vix::realtime::RoomManager` coordinates rooms and logical sessions inside one Realtime process.

It is responsible for operations such as:

```text
register room types
open and close rooms
create sessions
join and leave rooms
route commands
manage presence
clean idle rooms
shutdown the runtime
```

`Server` provides a higher-level facade over `RoomManager`, but the manager can also be used directly.

## Create a manager

The simplest constructor needs a local node identifier:

```cpp
#include <vix/realtime.hpp>

vix::realtime::RoomManager manager{
    vix::realtime::NodeId{"node-1"}};
```

The default manager uses:

- `MemoryEventStore`
- `MemorySnapshotStore`
- `LocalPresenceStore` when presence is enabled
- `RoomDirectory`

These dependencies are process-local except for persistence implementations explicitly supplied by the application.

## Register a room type

Before opening a room, register its factory:

```cpp
manager.register_factory(factory);
```

The factory defines how the state and handler for that room type are created.

For example, a factory whose type is:

```text
counter
```

allows the manager to open rooms of that type.

Registering the same type again returns `false` unless replacement is explicitly allowed.

## Open a room

Open a registered room type with:

```cpp
auto room = manager.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

The manager creates the room, registers local ownership, and opens it.

If the same room is already open with the same type, the existing room is returned.

```cpp
auto sameRoom = manager.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

`room` and `sameRoom` refer to the same managed room.

Opening rooms is limited by:

```cpp
config.maxActiveRooms
```

## Find a room

Use `find_room()` when the room may not exist:

```cpp
auto room = manager.find_room(
    vix::realtime::RoomId{"room-1"});

if (room)
{
    // Room exists.
}
```

Use `require_room()` when absence should be an error:

```cpp
auto room = manager.require_room(
    vix::realtime::RoomId{"room-1"});
```

The number of managed rooms is available with:

```cpp
auto count = manager.room_count();
```

## Create a session

Create a logical session with:

```cpp
auto session = manager.create_session(
    vix::realtime::SessionId{"session-1"},
    "user-1");
```

A newly created session has no active transport connection.

The number of logical sessions is limited by:

```cpp
config.maxSessions
```

## Find a session

Use:

```cpp
auto session = manager.find_session(
    vix::realtime::SessionId{"session-1"});
```

or require an existing session with:

```cpp
auto session = manager.require_session(
    vix::realtime::SessionId{"session-1"});
```

The current number of sessions is available with:

```cpp
auto count = manager.session_count();
```

## Join a room

Use `join_room()` to add a logical session to a room:

```cpp
auto result = manager.join_room(
    session->id(),
    room->id());
```

The manager keeps membership consistent between the two objects:

```text
Session
   |
   | joined
   v
RoomManager
   |
   v
Room
```

If presence is enabled, a presence record is also created or updated.

If the room rejects the join, the manager rolls back the session membership and presence update.

## Membership limits

A session cannot join more than:

```cpp
config.maxRoomsPerSession
```

rooms.

Each room is also limited by:

```cpp
config.maxSessionsPerRoom
```

The manager and room enforce these limits before accepting additional memberships.

## Leave a room

Remove a session from a room with:

```cpp
auto result = manager.leave_room(
    session->id(),
    room->id());
```

The room lifecycle handler runs before the membership is removed.

If the leave is rejected, the session remains in the room.

When the leave succeeds, the manager removes the session membership and updates presence.

## Execute a command

The manager can route a command to its target room:

```cpp
vix::realtime::RoomCommand command{
    room->id(),
    session->id(),
    "counter.increment"};

auto result = manager.execute(command);
```

Before routing the command, the manager verifies that:

- the session exists
- the session is not closed
- the room exists
- the session belongs to the room
- the room also contains the session membership

The room then performs the actual command execution.

```text
RoomCommand
    |
    v
RoomManager
    |
    v
Room
    |
    v
RoomHandler
```

## Queue a command

A command can also be queued:

```cpp
auto status = manager.enqueue(
    std::move(command));
```

Process the next queued command with:

```cpp
auto result = manager.process_next(
    room->id());
```

If the queue is empty, no result is returned.

## Attach a connection

A transport connection can be attached to an existing logical session:

```cpp
auto previous = manager.attach_connection(
    session->id(),
    connection);
```

If another connection was already attached, it is returned.

`RoomManager::attach_connection()` does not close that previous connection automatically.

When presence is enabled, the manager updates the session's room presence to reflect the new connection.

## Detach a connection

Detach a specific connection with:

```cpp
auto connection = manager.detach_connection(
    session->id(),
    connectionId);
```

The connection is detached only if `connectionId` matches the currently attached connection.

The logical session remains registered.

Its room memberships are preserved, and presence is marked detached when presence is enabled.

## Close a session

Permanently remove a session with:

```cpp
manager.close_session(
    session->id());
```

The manager first removes the session from its joined rooms.

If a room rejects the leave operation, the session is not finally removed.

After successful cleanup, the session is closed and removed from the manager.

## Presence

When presence is enabled, the manager coordinates presence with session activity.

Find one presence record with:

```cpp
auto presence = manager.find_presence(
    room->id(),
    session->id());
```

List presence for a room with:

```cpp
auto records =
    manager.room_presence(room->id());
```

Presence is updated during operations such as joining, attaching, detaching, leaving, and command activity.

Presence failures do not replace the authoritative room event model.

See [Presence](./presence) for the complete presence lifecycle.

## Close a room

Close a room with:

```cpp
auto result = manager.close_room(
    room->id());
```

When closing succeeds, the manager:

1. removes session memberships
2. clears room presence
3. releases local ownership
4. removes the room from the manager by default

A rejected room close leaves the room managed.

## Idle room cleanup

The manager can remove empty rooms that have remained idle for the configured timeout:

```cpp
auto removed = manager.cleanup();
```

Only rooms that are:

```text
open
empty
idle long enough
```

are eligible.

The timeout is configured with:

```cpp
config.roomIdleTimeout
```

If the timeout is zero, cleanup is disabled.

`RoomManager` does not start a background cleanup task. The application decides when to call `cleanup()`.

## Shutdown

Close all managed sessions and rooms with:

```cpp
manager.shutdown();
```

Shutdown processes sessions first, then rooms.

Persisted event history is not deleted simply because the manager shuts down.

Calling `shutdown()` again after the runtime has already been cleared is safe.

## Runtime dependencies

The configured dependencies are available through:

```cpp
manager.event_store();
manager.snapshot_store();
manager.presence_store();
manager.room_directory();
```

The local node identifier and configuration are available through:

```cpp
manager.node_id();
manager.config();
```

Most applications do not need to access these dependencies during normal command processing.

## Room ownership

When opening a room, the manager acquires ownership through its `RoomDirectory`.

```text
RoomManager
    |
    v
RoomDirectory
    |
    v
RoomOwner
```

If room creation or opening fails, the manager releases or clears the ownership claim and does not keep the failed room registered.

See [Room Ownership](./room-ownership) for the ownership model.

## Main workflow

A simple direct `RoomManager` workflow is:

```cpp
vix::realtime::RoomManager manager{
    vix::realtime::NodeId{"node-1"}};

manager.register_factory(factory);

auto room = manager.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");

auto session = manager.create_session(
    vix::realtime::SessionId{"session-1"},
    "user-1");

manager.join_room(
    session->id(),
    room->id());

vix::realtime::RoomCommand command{
    room->id(),
    session->id(),
    "counter.increment"};

auto result = manager.execute(command);

manager.shutdown();
```

The manager's role is coordination:

```text
RoomFactory
     |
     v
RoomManager
  /   |    \
 v    v     v
Rooms Sessions Presence
  |
  v
EventStore
```

Application state remains owned by rooms and their registered state and handler implementations.

Continue with [Sessions](./sessions) for the logical client lifecycle.
