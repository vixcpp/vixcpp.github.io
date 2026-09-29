# Core Concepts

Vix Realtime is built around a small set of concepts: rooms, commands, events, authoritative state, sessions, persistence, and transport.

The central rule is:

```text
command
   |
   v
handler
   |
   v
event
   |
   v
persistence
   |
   v
state
```

Clients express intent through commands. Commands do not modify room state directly. A room handler decides whether a command is accepted and which authoritative events it produces. Those events are persisted before they are applied to the room state.

## Rooms

A room is an isolated unit of authoritative state and command processing.

Examples of rooms could include:

```text
game/match-42
document/891
chat/general
dashboard/team-a
```

Each room has its own:

- `RoomId`
- room type
- `RoomState`
- `RoomHandler`
- event stream
- room version
- members
- command queue

Rooms of the same type can share the same application logic while maintaining independent state.

```text
Room type: game
        |
        +---- game/match-1
        |
        +---- game/match-2
        |
        +---- game/match-3
```

Each room owns its own state and event history.

## Authoritative state

`RoomState` represents the authoritative application state of a room.

Applications implement the interface:

```cpp
class MyState : public vix::realtime::RoomState
{
  // ...
};
```

A state implementation defines four important operations:

```cpp
schema_version()
apply(...)
serialize()
restore(...)
```

and provides an independent copy through:

```cpp
clone()
```

The most important operation is `apply()`:

```cpp
void apply(
    const vix::realtime::RoomEvent &event) override;
```

Only authoritative room events should mutate the state.

A command handler must not directly change the state.

## Deterministic state transitions

`RoomState::apply()` must be deterministic.

Given the same initial state and the same ordered event stream:

```text
initial state
    +
event 1
    +
event 2
    +
event 3
```

the application must always produce the same final state.

`apply()` should therefore not perform operations such as:

- network requests
- database writes
- broadcasting
- external service calls
- other side effects

This property allows the runtime to reconstruct room state by replaying persisted events.

## Commands

A `RoomCommand` represents a client intention.

For example:

```text
message.send
player.move
document.rename
counter.increment
```

A command identifies:

- the target room
- the submitting session
- an application-defined command type
- an optional payload
- an optional request identifier
- an optional correlation identifier
- an optional expected room version
- metadata

For example:

```cpp
vix::realtime::RoomCommand command{
    roomId,
    sessionId,
    "counter.increment",
    payload,
    "request-1"};
```

The command describes what the client wants to happen. It does not describe an authoritative state change.

## Expected room version

A command may include an expected room version:

```cpp
command.set_expected_version(
    vix::realtime::RoomVersion{12});
```

This allows the caller to express:

```text
execute this command only if
the room is still at version 12
```

If the current room version differs, the runtime can reject the command instead of executing it against unexpected state.

This provides optimistic concurrency control for workflows that depend on a known state version.

## Room handlers

`RoomHandler` contains application command logic.

Conceptually:

```text
command + current state + room context
                  |
                  v
             RoomHandler
                  |
                  v
            CommandResult
```

A handler can:

- validate a command
- inspect current state
- reject invalid operations
- ignore an operation
- produce one or more authoritative events

The handler decides what should happen. The runtime remains responsible for persistence, event application, and delivery.

## Command results

A handler returns a `CommandResult`.

There are three possible statuses:

```text
Accepted
Rejected
Ignored
```

### Accepted

An accepted command may produce zero or more events:

```cpp
return vix::realtime::CommandResult::accepted(event);
```

or:

```cpp
return vix::realtime::CommandResult::accepted(events);
```

Only events from an accepted result are persisted and applied by the room runtime.

### Rejected

A rejected command represents a deterministic application rejection:

```cpp
return vix::realtime::CommandResult::rejected(
    vix::realtime::ErrorCode::InvalidCommand,
    "amount must be positive");
```

A normal application rejection does not represent a room runtime failure.

### Ignored

A command can also be intentionally ignored:

```cpp
return vix::realtime::CommandResult::ignored();
```

Ignored commands produce no events and do not modify room state.

## Events

A `RoomEvent` represents an authoritative fact that occurred in a room.

Commands usually use intention-oriented names:

```text
message.send
player.move
counter.increment
```

Events usually describe completed facts:

```text
message.sent
player.moved
counter.changed
```

The distinction is important:

```text
Command
"move the player"

        |
        v

application decision

        |
        v

Event
"the player moved"
```

Once accepted and persisted, the event becomes part of the room's authoritative history.

## Event persistence and state application

For an accepted command that produces events, the normal order is:

```text
1. handle command
2. prepare events
3. persist events
4. apply events to RoomState
5. deliver events
```

Persistence happens before state application.

This means the runtime does not first modify the authoritative state and then attempt to record what happened afterward.

## Event IDs and room versions

Persisted room events have two different positions.

### Event ID

`EventId` identifies the ordered position of an event in the room's persisted event stream.

Conceptually:

```text
EventId 1
EventId 2
EventId 3
EventId 4
```

### Room version

`RoomVersion` represents the logical version of the authoritative room state.

An event records the room version produced after that event is applied.

These concepts are related but have different responsibilities:

```text
EventId
    |
    +---- position in persisted history

RoomVersion
    |
    +---- logical version of room state
```

Applications should not treat them as interchangeable identifiers.

## Event audiences

An event also defines which sessions may receive it.

Realtime supports five audiences:

| Audience   | Delivery                                       |
| ---------- | ---------------------------------------------- |
| `Room`     | All authorized sessions in the room            |
| `Sender`   | Only the session that submitted the command    |
| `Others`   | All authorized room sessions except the sender |
| `Session`  | One explicitly targeted session                |
| `Internal` | No connected client                            |

For example:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "message.sent",
    payload,
    vix::realtime::EventAudience::Room};
```

An internal event may still be persisted and applied to room state:

```text
EventAudience::Internal
          |
          +---- persisted
          |
          +---- applied to state
          |
          +---- not delivered to clients
```

Audience controls delivery, not whether the event is authoritative.

## Sessions

A `Session` represents one logical client.

It contains information such as:

- `SessionId`
- application identity
- room memberships
- resume information
- per-room event positions
- metadata
- the currently attached connection

A session has three lifecycle states:

```text
Connected
Detached
Closed
```

A connected session owns an active connection.

A detached session has no active connection but may still be resumable.

A closed session is permanently closed.

## Connections

A `Connection` represents an active transport connection.

A session and a connection are deliberately separate concepts:

```text
Session
   |
   +---- Connection A

network disconnects

Session
   |
   +---- no connection

client resumes

Session
   |
   +---- Connection B
```

The logical session can therefore survive the replacement of its network connection.

This separation is the basis of session resumption.

## Room membership

A session may join one or more rooms.

```text
Session A
   |
   +---- Room 1
   +---- Room 2
   +---- Room 3
```

Membership determines which rooms the logical session participates in.

The runtime coordinates membership between the session and the room so the two sides remain consistent.

A connection itself is not the room member. The logical session is.

## Presence

Presence describes the current participation of a logical session inside a room.

Presence has three states:

```text
Present
Detached
Left
```

`Present` means the logical session is currently present.

`Detached` means the session remains logically present but has lost its active connection.

`Left` means the session permanently left the room.

This allows temporary network loss to be represented without immediately treating the user as having left the application state.

## Presence is not authoritative room state

Presence and `RoomState` serve different purposes.

```text
RoomState
    |
    +---- authoritative application state
    +---- reconstructed from persisted events

Presence
    |
    +---- ephemeral participation state
    +---- connection and activity information
```

Presence metadata must not be used as authoritative room state.

If a value must survive recovery and determine application behavior, it normally belongs in the room's event-driven state model instead.

## Event stores

`EventStore` persists authoritative room events.

The room's event stream allows the runtime to reconstruct state:

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

Vix Realtime provides in-memory and PostgreSQL-backed event stores.

The event store is the durable history when persistent storage is used.

## Snapshots

Replaying an entire event stream can become expensive as a room accumulates history.

A snapshot stores a serialized representation of the room state at a known point:

```text
event 1
event 2
event 3
event 4
event 5
   |
   +---- snapshot
             |
             +---- state at this position

event 6
event 7
```

Recovery can then begin from the snapshot and replay only the later events:

```text
snapshot
   +
event 6
   +
event 7
   |
   v
current state
```

Snapshots are optional.

They improve recovery efficiency but do not replace the event-driven state model.

## Replay

Replay applies an ordered sequence of persisted events to reconstruct state or recover missed updates.

For room restoration:

```text
stored snapshot, if available
           |
           v
events after snapshot
           |
           v
restored RoomState
```

For a resumed session, replay can also be used to recover room updates the session did not observe while disconnected.

Replay depends on ordered, valid event history and deterministic state application.

## Session resumption

Because sessions are independent from connections, a detached session can potentially resume using a new connection.

Conceptually:

```text
Connected
    |
connection lost
    |
    v
Detached
    |
resume
    |
    v
recover missed room data
    |
    v
attach new connection
    |
    v
Connected
```

The session keeps its logical identity and room memberships across the temporary disconnect.

Detailed resume rules, limits, tokens, replay behavior, and snapshot fallback are covered in [Session Resume](./session-resume).

## Transport and protocol

Realtime does not require application room logic to depend on a particular network transport.

The relationship is:

```text
Application logic
       |
       v
Realtime runtime
       |
       v
Protocol envelope
       |
       v
Transport
```

A transport is responsible for moving protocol messages.

Room handlers remain concerned with application commands and events rather than socket management.

Vix provides optional WebSocket integration, but WebSocket is not the authoritative Realtime state model itself.

## The complete mental model

The main concepts fit together as follows:

```text
Client
  |
  v
Connection
  |
  v
Session
  |
  v
Room membership
  |
  v
RoomCommand
  |
  v
RoomHandler
  |
  v
CommandResult
  |
  v
RoomEvent
  |
  +---- EventStore
  |
  v
RoomState
  |
  +---- optional Snapshot
  |
  v
Event delivery
  |
  v
Session
  |
  v
Connection
  |
  v
Client
```

The key invariant is simple:

> Commands express intent. Persisted events define authoritative changes. Room state is derived by applying those events in order.

Continue with [Architecture](./architecture) for how the runtime components implement this model.
