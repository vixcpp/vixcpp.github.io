# Realtime

Vix Realtime provides a stateful runtime for applications that need shared, authoritative state updated in real time.

It is designed for systems such as collaborative applications, multiplayer services, chat systems, live dashboards, shared workspaces, and presence-aware applications. Application logic is organized around rooms, commands, events, sessions, and persistent state instead of being tied directly to a network transport.

```cpp
#include <vix/realtime.hpp>
```

The public CMake target is:

```cmake
vix::realtime
```

Vix Realtime requires C++20.

## Core model

A room contains authoritative application state. Clients express intentions through commands, and application-defined room handlers decide how those commands affect the room.

The normal execution flow is:

```text
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
    v
Event persistence
    |
    v
RoomState::apply()
    |
    v
Event delivery
```

A handler does not modify the authoritative room state directly. When a command produces events, the runtime persists those events before applying them to the room state.

This model makes room history replayable and allows state to be reconstructed after a process restart.

## Rooms

A room is an isolated unit of realtime state and command processing.

Applications define:

- the state stored by a room
- how persisted events modify that state
- how commands are validated and converted into events
- optional behavior when sessions join or leave
- optional behavior when the room opens or closes

Each room has its own identifier, logical version, event stream, members, and command execution context.

Room versions can also be used for optimistic concurrency checks when a command expects a specific version of the state.

## Sessions and connections

A session represents a logical client participating in the realtime runtime.

A connection represents the currently attached transport connection.

Keeping these concepts separate allows a session to remain alive when its network connection is temporarily lost. When session resumption is enabled, a detached session can reconnect within the configured resume window and recover missed room updates.

A session can join multiple rooms and maintains its own position in the event stream of each room.

## Persistence and recovery

Room events are stored through the `EventStore` abstraction.

Vix Realtime provides:

- `MemoryEventStore` for in-memory operation
- `PostgresEventStore` for PostgreSQL-backed persistence

Snapshots can reduce the amount of history that must be replayed when restoring a room. Snapshot storage is optional and is available through:

- `MemorySnapshotStore`
- `PostgresSnapshotStore`

Room recovery can combine the latest applicable snapshot with the events that follow it.

The event stream remains the authoritative history of room state.

## Presence

Presence tracks the logical participation of sessions in rooms.

A presence record can represent a session that is:

- present
- temporarily detached
- left

Presence is separate from authoritative room state. It is intended for ephemeral information such as whether a user is currently connected or temporarily disconnected.

The module includes a process-local presence store and defines an interface for distributed presence implementations.

## Transport independence

Realtime application logic is independent from the network transport.

The runtime works with connections and protocol envelopes through a transport abstraction. This allows the same room model to be connected to WebSocket or to another transport without moving application state or command logic into the networking layer.

`Server` coordinates the Realtime runtime, but it does not listen on sockets.

Vix Realtime includes an optional WebSocket adapter for integration with Vix WebSocket.

```text
Application logic
       |
       v
Vix Realtime
       |
       v
Transport
       |
       +---- WebSocket
       |
       +---- Custom transport
```

## Main capabilities

Vix Realtime provides the runtime foundations for:

- authoritative room state
- command processing
- persistent room events
- event audiences and delivery
- room snapshots
- state replay and recovery
- logical sessions
- temporary connection detachment
- session resumption
- room presence
- process-local room ownership
- in-memory persistence
- optional PostgreSQL persistence
- transport-independent protocol envelopes
- optional WebSocket integration
- runtime metrics
- runtime health inspection

## Public API

The complete public API can be included with:

```cpp
#include <vix/realtime.hpp>
```

Individual headers can also be included when only part of the module is needed:

```cpp
#include <vix/realtime/room.hpp>
#include <vix/realtime/server.hpp>
#include <vix/realtime/session.hpp>
```

Headers under `vix/realtime/internal/` are implementation details and are not part of the public API.

## Next steps

Start with [Quick Start](./quick-start) to build a minimal Realtime application.

Continue with:

- [Core Concepts](./core-concepts) for the room, command, event, session, and persistence model
- [Architecture](./architecture) for the relationship between the runtime components
- [Configuration](./configuration) for runtime limits and behavior
- [Rooms](./rooms) for authoritative room execution
- [Sessions](./sessions) for logical client lifecycle
- [Event Store](./event-store) and [Snapshots](./snapshots) for persistence
- [Session Resume](./session-resume) for reconnection and recovery
- [WebSocket Integration](./websocket-integration) for connecting the runtime to Vix WebSocket
- [API Reference](./api-reference) for the complete public surface

## Status

Vix Realtime is currently version `0.1.0`.

The API is under active development. Public headers outside `vix/realtime/internal/` define the intended public module surface.
