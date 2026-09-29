# Replay and Recovery

Replay reconstructs Realtime state from persisted events.

Recovery is used in two main situations:

```text
room opens
    |
    v
restore authoritative RoomState
```

and:

```text
session reconnects
    |
    v
recover events missed while detached
```

Both use the room's persisted event stream, but they recover different things.

## Room recovery

When a room opens, Realtime can restore its authoritative state from persistence.

By default:

```cpp
config.restoreRoomsOnOpen = true;
```

The normal recovery path is:

```text
latest snapshot
      |
      v
restore RoomState
      |
      v
load later events
      |
      v
apply events in order
      |
      v
current RoomState
```

If no snapshot exists, replay starts from the room's initial state.

```text
initial state
     |
     v
event 1
     |
     v
event 2
     |
     v
event 3
     |
     v
current state
```

## Open a restored room

Room recovery happens as part of normal room opening:

```cpp
auto room = server.open_room(
    vix::realtime::RoomId{"room-1"},
    "counter");
```

Application code does not need to replay events manually.

If persisted history exists and restoration is enabled, the room reconstructs its state before reaching `Open`.

## Disable room restoration

Automatic restoration can be disabled:

```cpp
config.restoreRoomsOnOpen = false;
```

The room then opens from its newly created initial state without replaying stored history.

This does not delete existing events or snapshots.

## Recovery from a snapshot

Suppose a room contains five persisted events:

```text
1  2  3  4  5
```

and a snapshot represents the state through event `3`.

Recovery becomes:

```text
snapshot at 3
      |
      +---- event 4
      |
      +---- event 5
      |
      v
current state
```

Events already represented by the snapshot are not applied again.

## Recovery without a snapshot

If no snapshot store is configured, or no snapshot exists, Realtime can rebuild the room entirely from events.

```text
initial RoomState
      |
      +---- event 1
      +---- event 2
      +---- event 3
      |
      v
restored RoomState
```

This is why `RoomState::apply()` must remain deterministic.

See [Room State](./room-state) for the state requirements.

## Replay ordering

Persisted events must be applied in event order.

For example:

```text
EventId 1
RoomVersion 1

EventId 2
RoomVersion 2

EventId 3
RoomVersion 3
```

During replay, Realtime verifies that event identifiers and room versions remain contiguous.

A broken sequence is treated as corrupted persisted state.

```text
EventId 1
EventId 3

invalid
```

and:

```text
RoomVersion 1
RoomVersion 3

invalid
```

## Transactional room restoration

Room restoration does not leave a partially reconstructed state behind when replay fails.

Conceptually:

```text
current state
     |
     v
preserve previous state
     |
     v
attempt restoration
     |
     +---- success
     |       |
     |       v
     |   use restored state
     |
     +---- failure
             |
             v
       restore previous state
```

The room only keeps the reconstructed state after recovery completes successfully.

## Replay limits

Replay work is bounded by:

```cpp
config.maxReplayEvents;
config.maxReplayBytes;
config.replayTimeout;
```

The defaults are:

```text
maxReplayEvents = 1000
maxReplayBytes  = 4 MiB
replayTimeout   = 5000 ms
```

These limits prevent one recovery operation from processing an unbounded amount of persisted history.

## Event limit

The maximum number of events processed by one replay is configured with:

```cpp
config.maxReplayEvents = 1000;
```

If recovery requires more events than this limit, the operation cannot continue normally.

For room restoration, a recent snapshot can reduce the number of events that need replay.

For session resumption, Realtime can also attempt snapshot fallback when direct replay exceeds this event limit.

## Byte limit

The amount of serialized event data processed during replay is bounded by:

```cpp
config.maxReplayBytes =
    4 * 1024 * 1024;
```

If replay exceeds this limit, Realtime reports:

```text
ReplayLimitExceeded
```

The byte limit applies even when the event count remains below `maxReplayEvents`.

## Replay timeout

Replay duration is bounded by:

```cpp
config.replayTimeout =
    std::chrono::milliseconds{5000};
```

Replay requires a positive timeout.

If recovery cannot complete within the configured duration, it fails instead of continuing indefinitely.

## Session recovery

Session recovery has a different purpose from room restoration.

The room may already contain current authoritative state, while a detached client has missed some events.

For example:

```text
room events

1  2  3  4  5
      ^
      |
session last event
```

The session needs:

```text
4  5
```

when it reconnects.

This happens automatically during session resumption.

## Resume from a cursor

The session stores its latest known `EventId` for each joined room.

```cpp
auto cursor =
    session->last_event_id(roomId);
```

During resume, Realtime loads events after this cursor.

```text
cursor = 3

1  2  3  4  5
      ^
      |
      +---- replay 4
      +---- replay 5
```

The cursor itself is not replayed.

## Current cursor

If the client's cursor already matches the latest event:

```text
1  2  3
      ^
      |
    cursor
```

there are no missing events to send.

The session can continue without receiving replay events for that room.

## Snapshot fallback during resume

A detached session may be too far behind for direct event replay.

For example:

```text
session cursor
     |
     v
1  2  3  4  5  6  7  8
```

If the number of required events exceeds `maxReplayEvents`, Realtime can use the latest usable snapshot.

```text
session cursor
     |
     v
old history

          snapshot at 6
                |
                +---- event 7
                +---- event 8
```

The client receives:

```text
snapshot
   |
   v
events after snapshot
```

This fallback requires a configured snapshot store and a snapshot newer than the session cursor.

## Snapshot must reduce replay work

A snapshot is useful for session recovery only when it moves the client forward.

For example:

```text
cursor   = event 2
snapshot = event 6

usable
```

but:

```text
cursor   = event 6
snapshot = event 4

not usable
```

A snapshot at or before the existing cursor does not reduce the required recovery.

## Replay after snapshot fallback

The events after the selected snapshot must still satisfy the configured replay limits.

For example:

```text
snapshot at 100
      |
      +---- 101
      +---- 102
      +---- 103
```

If the remaining replay still exceeds `maxReplayEvents`, recovery fails with:

```text
ReplayLimitExceeded
```

## Complete session recovery

Session resumption requires the replay to reach the event-store position observed for the room.

If the store does not provide the complete required stream, recovery fails with:

```text
ReplayUnavailable
```

The session is not advanced to an incomplete cursor.

## Multiple joined rooms

A session may belong to several rooms:

```text
Session
   |
   +---- Room A
   +---- Room B
   +---- Room C
```

Each room is recovered separately.

The number of rooms involved in one resume operation is bounded by:

```cpp
config.maxResumeRooms;
```

Recovery must succeed for every joined room before the session resume is committed.

## Resume recovery is committed last

During session resumption, Realtime first performs the required replay work.

```text
validate session
      |
      v
recover Room A
      |
      v
recover Room B
      |
      v
attach connection
      |
      v
update cursors
```

The new connection and room cursors are committed only after recovery succeeds.

If a later room fails:

```text
Room A recovered
      |
Room B fails
      |
      v
resume fails
```

the logical session remains detached and its stored cursors remain unchanged.

Its previous resume token also remains valid.

Recovery data that was already written to the candidate transport cannot be physically retracted, but the server-side session state is not committed.

## Cursor update

After successful recovery, the session cursor advances to the latest recovered event:

```text
before

cursor = 3

replay 4
replay 5

after

cursor = 5
```

This prevents the same events from being replayed again during the next successful resume.

## Recovery failures

Replay can fail for several reasons.

### Replay limit exceeded

```text
ReplayLimitExceeded
```

can indicate that:

- too many events are required
- serialized replay data is too large
- snapshot fallback still requires too many events
- a session belongs to too many rooms

### Replay unavailable

```text
ReplayUnavailable
```

means the required complete replay stream could not be obtained.

### Corrupted state

```text
CorruptedState
```

can indicate inconsistent persisted data such as:

- an event belonging to another room
- a non-contiguous event identifier
- a non-contiguous room version
- an invalid snapshot

### Event application failure

```text
EventApplyFailure
```

means an authoritative event could not be applied while reconstructing `RoomState`.

## Recovery and persistence

Replay reads persisted history. It does not create new authoritative events.

```text
EventStore
    |
    v
read events
    |
    v
apply existing events
```

Opening and restoring a room therefore does not duplicate the events already stored.

## Recovery and event delivery

Room restoration and session recovery also differ in whether events are sent to a client.

### Room restoration

```text
persisted events
      |
      v
RoomState::apply()
```

The purpose is to reconstruct server-side authoritative state.

### Session recovery

```text
persisted events
      |
      v
Connection::send()
```

The purpose is to bring a reconnected client up to date.

The persisted events themselves are not appended again in either case.

## Main model

Room recovery:

```text
snapshot, if available
        |
        v
later events
        |
        v
RoomState
```

Session recovery:

```text
session cursor
      |
      v
missing events
      |
      +---- direct replay
      |
      or
      |
      +---- snapshot + later events
      |
      v
replacement connection
```

The event store remains the authoritative history, while snapshots reduce the amount of history that must be processed during recovery.

Continue with [PostgreSQL](./postgresql) for durable event and snapshot storage.
