# Events

A `RoomEvent` represents an authoritative fact that occurred in a room.

For example:

```text
counter.incremented
message.sent
player.moved
```

Events are produced by room handlers after a command is accepted.

```text
RoomCommand
    |
    v
RoomHandler
    |
    v
RoomEvent
    |
    v
persistence
    |
    v
RoomState::apply()
```

## Create an event

A basic event needs a room identifier and an event type:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "counter.incremented"};
```

The default audience is:

```cpp
vix::realtime::EventAudience::Room
```

which delivers the event to sessions in the room.

## Add a payload

Events can carry application data:

```cpp
vix::realtime::JsonObject payload;
payload.set_i64("amount", 1);

vix::realtime::RoomEvent event{
    roomId,
    "counter.incremented",
    std::move(payload)};
```

`RoomState::apply()` can then use the payload:

```cpp
void apply(
    const vix::realtime::RoomEvent &event) override
{
    if (event.type() == "counter.incremented")
    {
        ++value_;
    }
}
```

## Event types

Event types are application-defined.

Examples:

```text
message.sent
counter.incremented
player-moved
document_updated
```

An event type:

- cannot be empty
- cannot exceed 128 characters
- can contain letters, digits, `.`, `-`, and `_`
- cannot start or end with `.`
- cannot contain consecutive dots

For example:

```text
message.sent       valid
message_sent       valid
message-sent       valid

.message           invalid
message.           invalid
message..sent      invalid
message/sent       invalid
```

## Events are authoritative

Commands describe intent:

```text
counter.increment
```

Events describe accepted facts:

```text
counter.incremented
```

The event becomes part of the room history after persistence.

```text
command
   |
   v
accepted
   |
   v
event
   |
   v
EventStore
   |
   v
RoomState
```

Application code should therefore represent important state changes as events rather than modifying `RoomState` directly.

## Event ID

Each persisted event receives an `EventId`.

```cpp
auto id = event.event_id();
```

Before persistence, the event ID is zero.

The application handler should not assign the persistent event ID. The event store and room runtime manage it.

For one room, persisted event IDs form an ordered stream:

```text
EventId 1
EventId 2
EventId 3
```

## Room version

Each committed event also receives the room version produced by that event:

```cpp
auto version = event.room_version();
```

For example:

```text
initial state        version 0
event A              version 1
event B              version 2
event C              version 3
```

The room runtime assigns these versions when committing events.

## Event schema version

Every event has a schema version:

```cpp
auto version = event.schema_version();
```

The default is:

```text
1
```

When a room commits an event, the runtime sets its schema version from the room state's current schema version.

Schema version `0` is invalid.

## Event audiences

The audience determines which sessions may receive an event.

Realtime provides five audiences:

```text
Room
Sender
Others
Session
Internal
```

### Room

Send the event to the sessions currently in the room:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "message.sent",
    {},
    vix::realtime::EventAudience::Room};
```

This is the default audience.

### Sender

Send the event only to the session that caused it:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "action.confirmed",
    {},
    vix::realtime::EventAudience::Sender};
```

A sender-scoped event requires a source session when delivery occurs.

For command-generated events, the room runtime normally fills the source session from the command context when it is not already present.

### Others

Send the event to room members except the source session:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "player.moved",
    {},
    vix::realtime::EventAudience::Others};
```

This audience also requires a source session for delivery.

### Session

Send the event to one specific session.

Set the target first:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "notification"};

event.set_target_session(targetSession);
event.set_audience(
    vix::realtime::EventAudience::Session);
```

The targeted session must be a current member of the room to receive the event.

Setting a target session does not automatically change the audience.

### Internal

Keep the event inside the server:

```cpp
vix::realtime::RoomEvent event{
    roomId,
    "counter.audit",
    {},
    vix::realtime::EventAudience::Internal};
```

An internal event can still be:

```text
persisted
applied to RoomState
replayed later
```

but it is not delivered to connected clients.

## Audience summary

| Audience   | Recipients                          |
| ---------- | ----------------------------------- |
| `Room`     | All current room sessions           |
| `Sender`   | Source session only                 |
| `Others`   | All room sessions except the source |
| `Session`  | One targeted room session           |
| `Internal` | No client                           |

Audience affects delivery only. It does not determine whether an event is persisted or applied to room state.

## Source session

An event can record which logical session caused it:

```cpp
event.set_source_session(sessionId);
```

Read it with:

```cpp
event.source_session();
```

For events produced while handling a command, the room runtime fills the source session from the command context when the event does not already define one.

## Request ID

An event can preserve the request that caused it:

```cpp
event.set_request_id("request-1");
```

Read it with:

```cpp
event.request_id();
```

When a command has a request ID and the produced event does not, the room copies the command request ID into the event.

## Correlation ID

Related operations can share a correlation identifier:

```cpp
event.set_correlation_id("operation-1");
```

Read it with:

```cpp
event.correlation_id();
```

The room also propagates the command correlation ID when the event does not already contain one.

## Metadata

Events can contain application-defined metadata:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("source", "mobile");

event.set_metadata(
    std::move(metadata));
```

Read it with:

```cpp
event.metadata();
```

Metadata is separate from the authoritative state payload.

## Creation time

Each event records a creation timestamp:

```cpp
auto createdAt = event.created_at();
```

A newly constructed event receives the current system time.

When the room commits handler-generated events, it assigns the timestamp from the current room operation context.

## Persistence order

For an accepted command, events are committed before they are applied:

```text
RoomEvent
    |
    v
EventStore::append_batch()
    |
    v
persisted event
    |
    v
RoomState::apply()
```

If several events are produced by one command, their order is preserved.

```text
event A
event B
event C
```

They are persisted as one batch before state application begins.

## Event delivery

After persistence and successful state application, the runtime resolves the event audience and delivers the event to the selected sessions.

```text
persist
   |
   v
apply
   |
   v
select recipients
   |
   v
deliver
```

A transport delivery failure does not undo the authoritative event that has already been persisted and applied.

Delivery is therefore separate from authoritative state commitment.

## Events and protocol messages

When an event is sent through a transport, Realtime converts it into a protocol event envelope.

The envelope preserves information such as:

```text
event type
payload
room ID
room version
event ID
schema version
source session
request ID
correlation ID
creation time
metadata
```

The event audience itself is used by the server to choose recipients before transport delivery.

## Important rules

When creating application events:

```text
use events for authoritative facts

do not assign EventId manually

let the room assign RoomVersion

keep event types stable

use payload for event data

use audience only for delivery selection

use Internal for events that must not reach clients

keep RoomState::apply() able to replay persisted events
```

Events are the durable link between accepted application decisions and authoritative room state.

Continue with [Room Handlers](./room-handlers) for how commands are validated and converted into events.
