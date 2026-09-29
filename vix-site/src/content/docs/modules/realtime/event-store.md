# Event Store

`vix::realtime::EventStore` is the persistence interface for authoritative room events.

Each room has its own ordered event stream.

```text
Room A
1  2  3  4

Room B
1  2
```

The room runtime persists accepted events before applying them to `RoomState`.

```text
RoomEvent
    |
    v
EventStore
    |
    v
RoomState::apply()
```

## Default event store

The default Realtime runtime uses:

```cpp
vix::realtime::MemoryEventStore
```

You can access the configured store through the room manager:

```cpp
auto store =
    server.manager()->event_store();
```

Most applications do not need to append events directly. `Room` normally handles persistence after a command is accepted.

## EventStore interface

An event store provides these operations:

```text
append()
append_batch()
load_after()
latest_event_id()
count()
clear_room()
```

The same interface is used by the in-memory and PostgreSQL implementations.

## Append an event

`append()` persists one event:

```cpp
vix::realtime::MemoryEventStore store;

vix::realtime::RoomEvent event{
    vix::realtime::RoomId{"room-1"},
    "counter.incremented"};

event.set_room_version(
    vix::realtime::RoomVersion{1});

auto stored =
    store.append(std::move(event));
```

The store assigns the persistent `EventId`.

The first event in a room receives:

```text
EventId 1
```

The next receives:

```text
EventId 2
```

and so on.

In normal room processing, the runtime prepares the room version before sending the event to the store.

## Event IDs are assigned by the store

An event passed to `append()` must not already contain a persistent event ID.

```text
before append

EventId = 0

after append

EventId = 1
```

Applications should not assign persistent event IDs themselves.

## Room versions must be contiguous

The event store also verifies room-version ordering.

For example, this sequence is valid:

```text
RoomVersion 1
RoomVersion 2
RoomVersion 3
```

This sequence is invalid:

```text
RoomVersion 1
RoomVersion 3
```

The store rejects the second sequence because version `2` is missing.

`RoomVersion` and `EventId` remain separate values:

```text
RoomVersion
    logical state version

EventId
    persisted event position
```

## Append multiple events

Use `append_batch()` to persist several events atomically:

```cpp
std::vector<vix::realtime::RoomEvent> events;

// Add events for the same room.

auto stored =
    store.append_batch(
        std::move(events));
```

Every event in the batch must:

- belong to the same room
- have a contiguous room version
- have no persistent event ID yet

Either the complete batch is persisted or none of it is.

```text
event 1
event 2
event 3
   |
   v
append_batch()
   |
   +---- all stored
   |
   or
   |
   +---- none stored
```

Rooms use this operation when one accepted command produces multiple events.

## Load events

Use `load_after()` to read events from a room stream:

```cpp
auto events =
    store.load_after(
        roomId,
        vix::realtime::EventId{},
        100);
```

An empty `EventId` starts from the beginning of the stream.

The returned events are ordered by ascending event ID.

```text
1
2
3
4
```

## Load after a cursor

Pass an existing event ID to continue after it:

```cpp
auto events =
    store.load_after(
        roomId,
        vix::realtime::EventId{3},
        100);
```

For this stream:

```text
1  2  3  4  5
      ^
      cursor
```

the result contains:

```text
4  5
```

The cursor itself is excluded.

This behavior is used by replay and session recovery.

## Limit results

The final argument limits how many events are returned:

```cpp
auto events =
    store.load_after(
        roomId,
        vix::realtime::EventId{},
        2);
```

If the room contains:

```text
1  2  3  4
```

the result contains at most:

```text
1  2
```

A limit of zero returns no events.

## Latest event ID

Get the latest persisted position with:

```cpp
auto eventId =
    store.latest_event_id(roomId);
```

For:

```text
1  2  3  4
```

the latest event ID is:

```text
4
```

An empty room stream returns an empty `EventId`.

## Count events

Get the number of persisted events with:

```cpp
auto count =
    store.count(roomId);
```

An unknown or empty room stream returns:

```text
0
```

## Independent room streams

Event ordering is maintained independently for each room.

For example:

```text
room-1

EventId 1
EventId 2
EventId 3

room-2

EventId 1
EventId 2
```

Appending an event to one room does not advance the event ID of another room.

## Clear a room stream

Delete all persisted events for one room with:

```cpp
bool removed =
    store.clear_room(roomId);
```

The operation returns `true` when a stream existed and was removed.

It returns `false` when the room had no stored stream.

`clear_room()` is intended for explicit deletion, administrative cleanup, and tests.

Normal room closing or server shutdown does not delete event history.

## MemoryEventStore

`MemoryEventStore` keeps event streams in process memory:

```cpp
vix::realtime::MemoryEventStore store;
```

It is suitable for:

- tests
- examples
- development
- single-process applications that do not require durable event history

Its contents disappear when the process ends.

The implementation is thread-safe and keeps each room stream independently ordered.

It also provides:

```cpp
store.clear();
```

to remove all in-memory room streams.

The number of stored room streams is available with:

```cpp
auto count =
    store.room_count();
```

## Durable persistence

Realtime also provides:

```cpp
vix::realtime::PostgresEventStore
```

for durable PostgreSQL-backed event storage.

It implements the same `EventStore` interface:

```text
EventStore
    |
    +---- MemoryEventStore
    |
    +---- PostgresEventStore
```

Application room logic does not need to change when the event store implementation changes.

PostgreSQL configuration and database behavior are covered in [PostgreSQL](./postgresql).

## Event store failures

Persistence failures are reported as Realtime errors.

A room does not apply an accepted event to its authoritative state if the event batch could not first be persisted.

```text
persist fails
     |
     v
do not apply event
to RoomState
```

This ordering prevents the in-memory authoritative state from advancing ahead of its persisted event history.

## Event store and replay

Persisted events are used to reconstruct room state.

```text
EventStore
    |
    v
load ordered events
    |
    v
RoomState::apply()
    |
    v
restored state
```

A snapshot can provide a later starting point, after which only newer events need to be loaded.

```text
snapshot
   |
   v
load events after snapshot
   |
   v
current state
```

See [Snapshots](./snapshots) and [Replay and Recovery](./replay-and-recovery) for the recovery workflow.

## Main rules

The important event-store guarantees are:

```text
each room has its own ordered stream

EventId is assigned by the store

room versions must remain contiguous

batch appends are atomic

load_after() uses an exclusive cursor

events are persisted before state application

normal shutdown preserves event history
```

The event store provides the durable history from which authoritative room state can be reconstructed.

Continue with [Snapshots](./snapshots) for storing recovery checkpoints.
