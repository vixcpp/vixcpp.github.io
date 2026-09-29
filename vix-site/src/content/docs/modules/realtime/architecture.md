# Architecture

Vix Realtime separates application state, runtime coordination, persistence, sessions, and network transport into distinct layers.

The main architecture is:

```text
Application
    |
    v
RoomFactory
    |
    +---- RoomState
    |
    +---- RoomHandler
             |
             v
            Room
             |
             v
        RoomManager
        /    |     \
       /     |      \
      v      v       v
 Sessions  Stores  Presence
      |
      v
 Connection
      |
      v
  Transport
```

This separation allows room logic to remain independent from WebSocket, PostgreSQL, or any other transport or persistence implementation.

## Runtime layers

The public runtime can be understood as five layers:

```text
1. Application model
   RoomState
   RoomHandler
   RoomFactory
   RoomCommand
   RoomEvent

2. Authoritative runtime
   Room

3. Coordination
   RoomManager
   Server

4. Persistence and recovery
   EventStore
   SnapshotStore
   PresenceStore
   SessionResume

5. Networking
   Connection
   protocol::Envelope
   Transport
   WebSocketAdapter
```

Each layer has a specific responsibility.

## Application model

Application-defined behavior begins with `RoomFactory`.

A factory creates two components for each room:

```text
RoomFactory
    |
    +---- RoomState
    |
    +---- RoomHandler
```

`RoomState` contains the authoritative state.

`RoomHandler` processes commands and lifecycle operations.

For example:

```text
Room type: counter
        |
        v
CounterFactory
    |
    +---- CounterState
    |
    +---- CounterHandler
```

A new room receives fresh state and handler instances. Rooms of the same type therefore share behavior without sharing their authoritative state.

## Room

`Room` is the authoritative runtime for one logical room.

It coordinates:

- room lifecycle
- authoritative state
- command execution
- room membership
- event persistence
- event application
- snapshots
- event delivery
- command queueing

A room uses an `EventStore` for authoritative history and may use a `SnapshotStore` for faster restoration.

The normal command path is:

```text
RoomCommand
    |
    v
Room
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
    v
EventStore
    |
    v
RoomState
    |
    v
recipient sessions
```

The room is the boundary that preserves the ordering between persistence, state mutation, and delivery.

## Command execution

When a command is executed, the room first verifies that it can process the command.

This includes checks such as:

- the command targets the correct room
- the room is open
- the room has capacity for the command
- an expected room version matches, when provided

The handler then receives:

```text
command
current state
room context
```

and returns a `CommandResult`.

For accepted results containing events, the runtime prepares the authoritative event versions and persists the complete batch.

```text
handler result
     |
     v
prepare events
     |
     v
append_batch()
     |
     v
persisted events
```

Only after persistence succeeds are those events applied to `RoomState`.

```text
persisted event 1
        |
        v
RoomState::apply()

persisted event 2
        |
        v
RoomState::apply()
```

Event delivery occurs after the state transition succeeds.

## Failure boundary

The room protects its in-memory authoritative state when event application fails.

Before applying a committed event batch, the runtime keeps an independent copy of the previous state and its current positions.

Conceptually:

```text
current state
current RoomVersion
current EventId
       |
       v
save rollback point
       |
       v
apply persisted events
```

If state application fails:

```text
restore previous state
restore previous RoomVersion
restore previous EventId
mark room failed
```

Events that were successfully committed to the event store remain persisted. The runtime does not silently remove durable history after an application failure.

This distinction is important when diagnosing a failed room.

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

A room can enter:

```text
Failed
```

when an unrecoverable runtime or state failure occurs.

During opening, the room may restore existing state before becoming available for commands.

During closing, it runs its application close behavior and may create a final snapshot according to configuration.

## RoomManager

`RoomManager` is the central process-local orchestrator.

It coordinates:

- room factory registration
- room creation and lookup
- room shutdown
- logical sessions
- connection attachment
- room membership
- presence
- room ownership
- command routing
- authoritative event delivery
- cleanup operations

Its main relationship is:

```text
                 RoomManager
                /     |      \
               /      |       \
              v       v        v
           Rooms   Sessions   Stores
              \       |
               \      v
                \  Presence
                 \
                  v
             RoomDirectory
```

`RoomManager` does not define application state. It obtains application components from registered room factories.

## Opening a room

When a room is opened through the manager, the process is conceptually:

```text
open_room()
    |
    v
validate room identifier and type
    |
    v
find registered RoomFactory
    |
    v
acquire local room ownership
    |
    v
create RoomState + RoomHandler
    |
    v
construct Room
    |
    v
register room locally
    |
    v
Room::open()
```

If room creation or opening fails, the manager removes the incomplete local room and releases its ownership claim.

## Server

`Server` is the public lifecycle facade over `RoomManager`.

```text
Application
    |
    v
Server
    |
    v
RoomManager
```

`Server` exposes common runtime operations such as:

- starting and stopping the runtime
- registering room factories
- opening and closing rooms
- creating sessions
- joining and leaving rooms
- attaching and detaching connections
- executing commands
- delivering protocol envelopes
- cleaning stale sessions and presence

`Server` does not listen on a network socket.

Starting a Realtime server means enabling runtime operations:

```text
Created
   |
   v
Running
```

It does not mean starting a WebSocket or HTTP listener.

## Default runtime dependencies

Constructing a `RoomManager` or `Server` with the default dependencies creates a process-local runtime using:

```text
MemoryEventStore
MemorySnapshotStore
LocalPresenceStore
RoomDirectory
```

`LocalPresenceStore` is created when presence is enabled.

This default architecture is useful for local execution, tests, and applications that do not require durable persistence across process restarts.

For durable event and snapshot storage, the memory stores can be replaced by PostgreSQL-backed implementations.

## Sessions

A `Session` represents a logical client independently from its current transport connection.

```text
Session
    |
    +---- identity
    +---- room memberships
    +---- room cursors
    +---- resume token
    +---- metadata
    |
    +---- active Connection, when attached
```

This separation is important because network connections are temporary while logical application sessions may need to survive disconnections.

A session can be:

```text
Connected
Detached
Closed
```

## Connections

A `Connection` represents the active transport path for a session.

The relationship is:

```text
logical client
     |
     v
  Session
     |
     v
 Connection
     |
     v
 Transport
```

When a network connection disappears, the connection can be detached while the logical session remains registered.

A resumed session may later attach a different connection:

```text
Session
   |
Connection A
   |
 disconnect
   v
Detached Session
   |
 resume
   v
Connection B
```

The room memberships belong to the session, not to the temporary connection.

## Membership coordination

A session and a room both need a consistent view of membership.

`RoomManager` coordinates this relationship.

```text
Session
   |
   | membership
   v
RoomManager
   |
   v
Room
```

Joining a room updates the logical relationship between the session and room and, when enabled, creates or updates presence information.

Leaving removes that relationship and updates presence accordingly.

Applications should normally use the manager or server membership operations instead of independently modifying room and session membership.

## Event delivery

After committed events are successfully applied, Realtime determines their recipients from the event audience.

```text
RoomEvent
    |
    v
audience resolution
    |
    +---- Room
    +---- Sender
    +---- Others
    +---- Session
    +---- Internal
```

Selected events are converted into protocol envelopes and delivered to logical sessions.

```text
RoomEvent
    |
    v
protocol envelope
    |
    v
Session
    |
    v
Connection
```

A session sends the envelope through its currently active connection.

An `Internal` event remains part of authoritative processing but is not delivered to clients.

## EventStore

`EventStore` stores the authoritative event stream of every room.

Each room has an independently ordered stream:

```text
Room A
EventId 1
EventId 2
EventId 3

Room B
EventId 1
EventId 2
```

The store assigns persistent event identifiers.

It also supports:

- atomic event batches
- loading events after a cursor
- retrieving the latest event position
- counting events
- explicit room history deletion

Normal room shutdown does not delete event history.

## SnapshotStore

`SnapshotStore` stores complete serialized room state at known event and room-version positions.

```text
events
1 2 3 4 5
        |
        v
     snapshot
        |
        +---- RoomVersion
        +---- last EventId
        +---- serialized state
```

Snapshots are optional.

They reduce the amount of event history required during recovery but do not replace the authoritative event stream.

## Room restoration

When automatic restoration is enabled, opening a room can reconstruct its state from persistence.

Conceptually:

```text
latest compatible snapshot
          |
          v
restore serialized state
          |
          v
load events after snapshot
          |
          v
apply events in order
          |
          v
current room state
```

Without a usable snapshot, replay begins from the event stream.

State restoration therefore depends on deterministic `RoomState::apply()` behavior.

## Presence architecture

Presence is maintained separately from authoritative room state.

```text
RoomState
    |
    +---- durable application facts

PresenceStore
    |
    +---- logical participation
    +---- connected state
    +---- detached state
    +---- activity timestamps
```

The default implementation is `LocalPresenceStore`.

Presence can be updated when:

- a session joins
- a connection attaches
- a connection detaches
- activity occurs
- a session leaves

Presence failures do not redefine the authoritative event history of a room.

## Session resumption

`SessionResume` operates over the existing `RoomManager`.

```text
SessionResume
     |
     v
RoomManager
     |
     +---- Session
     +---- joined Rooms
     +---- EventStore
     +---- SnapshotStore
     +---- PresenceStore
```

A successful resumption may need to restore missed information before the replacement connection becomes the authoritative connection of the session.

Conceptually:

```text
detached session
      |
      v
validate resume token and window
      |
      v
recover missing room data
      |
      v
attach replacement connection
      |
      v
restore presence
      |
      v
connected session
```

Detailed limits and recovery behavior are covered in [Session Resume](./session-resume).

## Room ownership

Each process has a `NodeId`.

`RoomDirectory` tracks which runtime node owns a logical room.

```text
RoomId
   |
   v
RoomDirectory
   |
   v
RoomOwner
   |
   v
NodeId
```

Ownership claims include a monotonic generation and may optionally use a lease.

The directory supports operations such as acquisition, renewal, transfer, release, and ownership validation.

The `RoomDirectory` provided by the default runtime is process-local. It establishes the ownership model and coordination contract but is not by itself a shared cluster coordinator.

## Persistence implementations

The persistence layer is interface-based:

```text
EventStore
    |
    +---- MemoryEventStore
    |
    +---- PostgresEventStore

SnapshotStore
    |
    +---- MemorySnapshotStore
    |
    +---- PostgresSnapshotStore
```

Application room logic does not need to change when persistence implementations are replaced.

The same room model can therefore use memory during development and PostgreSQL when durable storage is required.

## Protocol layer

Realtime uses transport-independent protocol envelopes.

The protocol represents message categories such as:

```text
Request
Response
Event
Error
Snapshot
Control
```

The protocol layer carries identifiers and application payloads between Realtime and a transport.

It does not define application room behavior.

```text
Room logic
    |
    v
Realtime event or response
    |
    v
protocol::Envelope
    |
    v
Transport
```

## Transport layer

`Transport` is the boundary between Realtime and network-specific I/O.

A transport provides callbacks for:

```text
connection opened
protocol envelope received
connection closed
transport or protocol error
```

It converts transport-specific connections into Realtime `Connection` objects and forwards parsed protocol envelopes.

A transport does not own `Server` and does not interpret application commands.

The application or integration layer decides how received protocol requests map to server operations.

## WebSocket integration

`WebSocketAdapter` implements the Realtime transport contract for Vix WebSocket.

```text
Vix WebSocket
      |
      v
WebSocketAdapter
      |
      v
Connection + protocol::Envelope
      |
      v
Realtime integration
```

Incoming text messages are parsed as Realtime protocol envelopes.

Outgoing Realtime envelopes are serialized and sent through the underlying WebSocket session.

The adapter does not start or stop the WebSocket server.

This keeps the transport lifecycle independent from the Realtime runtime lifecycle.

## Observability

Realtime provides two separate observability components:

```text
Metrics
   |
   +---- counters
   +---- gauges
   +---- durations

HealthMonitor
   |
   +---- server lifecycle
   +---- room state
   +---- session state
   +---- queue depth
   +---- configured stores
   +---- presence
   +---- optional metrics snapshot
```

`Metrics` is an explicit collector. Runtime components do not automatically route every operation into one global metrics object.

`HealthMonitor` inspects a running Realtime server and can optionally include a supplied metrics collector in its report.

## Process-local architecture

With default dependencies, one process looks like:

```text
                    Application
                         |
                         v
                       Server
                         |
                         v
                    RoomManager
          _______________|_______________
         |               |               |
         v               v               v
       Rooms          Sessions       RoomDirectory
         |               |
         |               v
         |            Connections
         |
    _____|____________________
   |          |               |
   v          v               v
EventStore SnapshotStore PresenceStore
   |          |               |
   v          v               v
 Memory     Memory            Local
```

A WebSocket adapter or another transport can be connected independently:

```text
WebSocket Server
       |
       v
WebSocketAdapter
       |
       v
Connections / Envelopes
       |
       v
Realtime integration
```

## Architectural boundaries

The main boundaries to preserve when designing an application are:

```text
RoomCommand
    = client intention

RoomEvent
    = authoritative fact

RoomState
    = state derived from authoritative events

Session
    = logical client

Connection
    = temporary transport attachment

Presence
    = ephemeral participation information

EventStore
    = authoritative event history

SnapshotStore
    = recovery optimization

Transport
    = network I/O boundary

Server
    = runtime lifecycle facade

RoomManager
    = process-local coordinator
```

Keeping these responsibilities separate is what allows the same application model to support persistence, reconnection, alternative transports, and future coordination layers without moving business logic into networking or storage code.

Continue with [Configuration](./configuration) for the runtime limits and lifecycle policies that control this architecture.
