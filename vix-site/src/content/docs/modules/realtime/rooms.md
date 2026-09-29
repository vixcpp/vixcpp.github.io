# Rooms

A `Room` is the authoritative runtime for one shared unit of Realtime state.

A room contains application state, processes commands in order, persists accepted events, manages session membership, and can restore its state from persisted history.

Examples of room identifiers include:

```text
chat/general
game/match-42
document/123
```

## Open a room

Rooms are normally opened through `Server`.

First register the room factory:

```cpp
server.register_factory(factory);
server.start();
```

Then open a room:

```cpp
auto room = server.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

The first argument is the room identifier.

The second argument is the registered room type.

## Room identity

Read the room identifier with:

```cpp
const auto &id = room->id();
```

Read its type with:

```cpp
const auto &type = room->type();
```

The room identifier distinguishes one room instance from another.

The room type determines which `RoomFactory` creates its state and handler.

```text
type: counter

room-1
room-2
room-3
```

Each room has independent state and event history.

## Room lifecycle

A room follows this lifecycle:

```text
Created
   |
   v
Opening
   |
   v
Open
   |
   v
Closing
   |
   v
Closed
```

A room may enter `Failed` when an unrecoverable runtime or state error occurs.

Check the current status with:

```cpp
auto status = room->status();
```

For common checks:

```cpp
if (room->is_open())
{
    // The room can process commands.
}
```

```cpp
if (room->failed())
{
    // The room entered a failure state.
}
```

A room accepts normal commands and membership changes only while it is open.

## Authoritative state

The current state is available through:

```cpp
const auto &state = room->state();
```

A serialized copy can be obtained with:

```cpp
auto state = room->serialize_state();
```

Application code should not modify the room state directly.

State changes normally follow this path:

```text
command
   |
   v
RoomHandler
   |
   v
RoomEvent
   |
   v
EventStore
   |
   v
RoomState::apply()
```

This keeps the event history and current state consistent.

## Execute a command

A command can be executed directly:

```cpp
vix::realtime::JsonObject payload;
payload.set_i64("amount", 1);

vix::realtime::RoomCommand command{
    room->id(),
    sessionId,
    "counter.increment",
    std::move(payload)};

auto result = room->execute(command);
```

The command must target the room being executed.

If the handler accepts the command and produces events, the room persists those events before applying them to its state.

## Accepted commands

An accepted command may produce one or more events.

```text
RoomCommand
    |
    v
CommandResult
    |
    +---- event 1
    +---- event 2
```

The room assigns the authoritative room version and persistent event position during commit.

The returned result contains the persisted events.

## Rejected commands

A handler can reject a command:

```cpp
return vix::realtime::CommandResult::rejected(
    vix::realtime::ErrorCode::InvalidCommand,
    "invalid value");
```

A normal rejected command does not change the room state or event stream.

It also does not by itself place the room in `Failed`.

## Expected versions

A command can require a specific room version:

```cpp
command.set_expected_version(
    room->version());
```

The command is accepted for processing only if the room is still at that version.

If another state change has already advanced the room, the command is rejected.

This provides optimistic concurrency control.

## Room version

Read the current logical state version with:

```cpp
auto version = room->version();
```

A persisted event that changes the authoritative state advances the room version.

For example:

```text
initial state       version 0
event 1             version 1
event 2             version 2
event 3             version 3
```

## Event position

Read the latest persisted event identifier with:

```cpp
auto eventId = room->last_event_id();
```

`RoomVersion` and `EventId` are different concepts.

```text
RoomVersion
    current logical state version

EventId
    position in the persisted event stream
```

Applications should not treat them as interchangeable identifiers.

## Queue commands

Commands can also be placed in the room queue:

```cpp
auto status = room->enqueue(
    std::move(command));
```

Process the oldest queued command with:

```cpp
auto result = room->process_next();
```

If the queue is empty, `process_next()` returns no result.

The number of waiting commands is available with:

```cpp
auto count = room->pending_command_count();
```

The queue is bounded by:

```cpp
config.maxPendingCommandsPerRoom
```

## Command ordering

Commands for one room are processed serially.

This means one room does not apply two authoritative command transitions at the same time.

```text
command A
   |
   v
event A
   |
   v
state

command B
   |
   v
event B
   |
   v
state
```

Each command therefore observes the authoritative state produced by earlier completed commands.

Different rooms maintain independent state and execution.

## Join a session

A logical session can join an open room:

```cpp
auto result = room->join(sessionId);
```

For normal application workflows, prefer the server operation:

```cpp
server.join_room(
    sessionId,
    room->id());
```

The server coordinates both sides of the membership relationship and presence when it is enabled.

## Check membership

Check whether a session belongs to the room:

```cpp
if (room->has_session(sessionId))
{
    // Session belongs to this room.
}
```

Get the number of members:

```cpp
auto count = room->session_count();
```

Get all session identifiers:

```cpp
auto sessions = room->sessions();
```

Check whether the room has no members:

```cpp
if (room->empty())
{
    // No sessions are currently members.
}
```

## Leave a room

A session can leave with:

```cpp
auto result = server.leave_room(
    sessionId,
    room->id());
```

The room handler can receive the leave lifecycle operation before the membership is removed.

If that lifecycle operation is rejected, the existing membership is preserved.

## Room capacity

The maximum number of sessions in one room is controlled by:

```cpp
config.maxSessionsPerRoom
```

When the room reaches this limit, another session cannot join until capacity becomes available.

## Snapshots

A snapshot can be created explicitly:

```cpp
auto snapshot = room->snapshot();
```

The snapshot contains a serialized copy of the authoritative state together with its room version and latest event position.

Snapshot storage is optional.

If no `SnapshotStore` is configured, forcing a snapshot fails.

Automatic snapshots are controlled by the Realtime configuration and are covered in [Snapshots](./snapshots).

## Room restoration

When room restoration is enabled, `open()` reconstructs persisted state before the room becomes available.

The normal recovery path is:

```text
snapshot, if available
        |
        v
later persisted events
        |
        v
RoomState
        |
        v
Open
```

If no snapshot is available, recovery can replay the persisted event stream from the beginning.

See [Replay and Recovery](./replay-and-recovery) for details.

## Close a room

Rooms are normally closed through `Server`:

```cpp
auto result = server.close_room(
    room->id());
```

During a normal close, the room:

1. runs the handler's close lifecycle operation
2. commits any accepted lifecycle events
3. creates a final snapshot when configured
4. removes its session memberships
5. closes its command queue
6. enters `Closed`

If the handler rejects the close operation, the room returns to `Open`.

## Room activity

The latest activity timestamp is available with:

```cpp
auto lastActivity = room->last_activity_at();
```

This information is used by idle-room cleanup.

An empty room can become eligible for cleanup after:

```cpp
config.roomIdleTimeout
```

Cleanup is performed explicitly by the runtime. The room does not create its own background cleanup thread.

## Metadata

A room can contain non-authoritative metadata:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("region", "eu");

room->set_metadata(std::move(metadata));
```

Read it with:

```cpp
auto metadata = room->metadata();
```

Room metadata is separate from authoritative `RoomState`.

Values that define application state and must be reconstructed from persisted history should live in the event-driven room state instead.

## Ownership

A room may record the node that currently owns it:

```cpp
auto owner = room->owner_node_id();
```

Ownership is normally coordinated by `RoomManager` and `RoomDirectory`.

Applications should not usually set room ownership directly.

See [Room Ownership](./room-ownership) for the ownership model.

## Important behavior

The main room guarantees are:

```text
commands are processed serially

accepted events are persisted before state application

rejected commands do not mutate authoritative state

room state can be reconstructed from persisted events

snapshots are optional

session membership belongs to the logical room

transport delivery happens after authoritative processing
```

A `Room` is therefore the boundary where application commands become persisted authoritative state changes.

Continue with [Room State](./room-state) for defining the state that a room owns.
