# Snapshots

Snapshots store a complete serialized copy of a room's authoritative state at a known event position.

They allow recovery to begin from a recent state instead of replaying the complete event stream.

```text
events

1  2  3  4  5
         |
         v
      snapshot
```

The event stream remains authoritative. A snapshot is a recovery checkpoint.

## Create a snapshot

A room can create a snapshot explicitly:

```cpp
auto snapshot = room->snapshot();
```

By default, this forces snapshot creation.

The room must have a configured `SnapshotStore`.

## Snapshot contents

A `RoomSnapshot` contains:

- room ID
- room version
- last event ID
- serialized room state
- schema version
- creation time
- optional checksum
- metadata

For example:

```cpp
auto snapshot = room->snapshot();

if (snapshot)
{
    auto version =
        snapshot->room_version();

    auto eventId =
        snapshot->last_event_id();
}
```

The snapshot state is available with:

```cpp
snapshot->state();
```

## Room version and event position

A snapshot records both:

```text
RoomVersion
    logical state version

EventId
    last persisted event included in the snapshot
```

For example:

```text
RoomVersion = 5
EventId     = 5
```

These positions tell recovery where the serialized state ends and where event replay should continue.

## Schema version

A snapshot also records the room state's schema version:

```cpp
auto schema =
    snapshot->schema_version();
```

The runtime obtains this value from:

```cpp
state.schema_version();
```

Schema version `0` is invalid.

The schema version allows `RoomState::restore()` to determine whether it can understand the stored state.

## Automatic snapshots

Realtime can create snapshots automatically as the room processes events.

The interval is configured with:

```cpp
config.snapshotEveryEvents = 100;
```

With this configuration, a snapshot becomes eligible after 100 new persisted events since the previous snapshot.

For example:

```text
snapshot at event 100
        |
        +---- 100 new events
        |
snapshot at event 200
```

## Disable periodic snapshots

Set the interval to zero:

```cpp
config.snapshotEveryEvents = 0;
```

This disables periodic snapshot creation.

Explicit snapshots and snapshots created during room closing can still be used.

## Snapshot on room close

By default:

```cpp
config.snapshotOnRoomClose = true;
```

When a room closes successfully, Realtime can save a final snapshot if the authoritative state has advanced since the latest snapshot.

Disable this behavior with:

```cpp
config.snapshotOnRoomClose = false;
```

## Snapshot retention

The number of recent snapshots retained for each room is configured with:

```cpp
config.snapshotsToKeep = 3;
```

After a room saves a snapshot, older snapshots are pruned according to this value.

For example:

```text
stored snapshots

version 10
version 20
version 30
version 40
```

With:

```cpp
config.snapshotsToKeep = 3;
```

the oldest snapshot is removed:

```text
version 20
version 30
version 40
```

`snapshotsToKeep` must be greater than zero.

## Create a snapshot only when needed

`Room::snapshot()` also accepts a `force` argument.

```cpp
auto snapshot =
    room->snapshot(false);
```

When `force` is `false`, the normal snapshot policy decides whether a new snapshot is needed.

If no snapshot is required, the method returns no value.

The default call:

```cpp
room->snapshot();
```

uses `force = true`.

## Snapshot store

Snapshots are persisted through the `SnapshotStore` interface.

```text
SnapshotStore
    |
    +---- MemorySnapshotStore
    |
    +---- PostgresSnapshotStore
```

The configured store is available through:

```cpp
auto store =
    server.manager()->snapshot_store();
```

A snapshot store is optional.

If no snapshot store is configured, normal room operation and event persistence can still work.

Calling a forced snapshot without a configured store fails with `ErrorCode::MissingDependency`.

## MemorySnapshotStore

The default runtime uses:

```cpp
vix::realtime::MemorySnapshotStore
```

It stores snapshots in process memory.

It is suitable for:

- tests
- examples
- development
- applications that do not require snapshots to survive process restart

For durable snapshots, Realtime also provides `PostgresSnapshotStore`.

See [PostgreSQL](./postgresql) for PostgreSQL persistence.

## Save a snapshot directly

A snapshot store can be used directly:

```cpp
vix::realtime::MemorySnapshotStore store;

vix::realtime::RoomSnapshot snapshot{
    roomId,
    roomVersion,
    eventId,
    state,
    1};

store.save(std::move(snapshot));
```

Normal applications usually let `Room` create and save snapshots so the room position and serialized state remain coordinated.

## Load the latest snapshot

Use:

```cpp
auto snapshot =
    store.load_latest(roomId);
```

If no snapshot exists:

```cpp
snapshot.has_value(); // false
```

The latest snapshot is normally the starting point for room restoration.

## Load a historical snapshot

Load the newest snapshot at or before a specific room version:

```cpp
auto snapshot =
    store.load_at_or_before(
        roomId,
        vix::realtime::RoomVersion{20});
```

For these stored snapshots:

```text
version 10
version 20
version 30
```

requesting version `25` returns:

```text
version 20
```

This operation is useful when recovery must not move beyond a specific room position.

## Load recent snapshots

Use:

```cpp
auto snapshots =
    store.load_recent(
        roomId,
        3);
```

Snapshots are returned from newest to oldest.

```text
version 30
version 20
version 10
```

A limit of zero returns an empty list.

## Count snapshots

Get the number of snapshots stored for a room:

```cpp
auto count =
    store.count(roomId);
```

An unknown room returns `0`.

## Prune snapshots

Keep only the newest snapshots with:

```cpp
auto removed =
    store.prune(
        roomId,
        3);
```

A keep count of zero removes every snapshot for that room:

```cpp
store.prune(
    roomId,
    0);
```

The normal room snapshot workflow performs retention automatically using `config.snapshotsToKeep`.

## Clear snapshots

Remove all snapshots belonging to one room:

```cpp
store.clear_room(roomId);
```

This is an explicit deletion operation.

Normal room closing and server shutdown do not automatically delete stored snapshots.

## Room recovery

When restoration is enabled, a room first attempts to load a usable snapshot.

```text
open room
    |
    v
load snapshot
    |
    v
RoomState::restore()
    |
    v
load later events
    |
    v
RoomState::apply()
    |
    v
current state
```

Suppose the event stream contains:

```text
1  2  3  4  5  6
```

and the snapshot contains state through event `4`.

Recovery only needs:

```text
snapshot at 4
     |
     +---- event 5
     +---- event 6
```

instead of replaying all six events.

## Snapshots do not replace events

A snapshot is not a replacement for the event stream.

The relationship is:

```text
EventStore
    authoritative history

SnapshotStore
    recovery checkpoint
```

After restoring a snapshot, Realtime still loads and applies events that occurred after its `last_event_id()`.

## Automatic snapshot failures

Periodic snapshots are attempted after authoritative event processing.

If an automatic snapshot fails after the event has already been persisted and applied, the committed command remains successful.

```text
event persisted
      |
      v
state applied
      |
      v
automatic snapshot fails
      |
      v
event remains authoritative
```

The runtime does not undo an already committed state transition because an automatic snapshot could not be saved.

## Close snapshot failures

A snapshot created as part of room closing is different.

If the configured close snapshot operation fails, closing fails and the room enters its failure path.

This makes failures during an explicit room lifecycle operation visible instead of silently reporting a successful close.

## Snapshot consistency

A valid snapshot must describe a consistent room position.

For example, an initial room state cannot reference a persisted event:

```text
RoomVersion = 0
EventId     = 5

invalid
```

Likewise, a versioned snapshot must reference an event position:

```text
RoomVersion = 5
EventId     = 0

invalid
```

The snapshot store also prevents newer snapshots from moving backward relative to already stored snapshots.

## Main model

The snapshot workflow is:

```text
RoomState
    |
    v
serialize()
    |
    v
RoomSnapshot
    |
    v
SnapshotStore
```

Recovery reverses that process:

```text
SnapshotStore
    |
    v
RoomSnapshot
    |
    v
RoomState::restore()
    |
    v
later events
    |
    v
current RoomState
```

Snapshots reduce recovery work while the persisted event stream remains the authoritative history.

Continue with [Replay and Recovery](./replay-and-recovery) for how snapshots and events are combined to reconstruct room state.
