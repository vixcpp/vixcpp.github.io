# Protocol

Vix Realtime uses a versioned JSON protocol to exchange messages independently from the transport.

A protocol message is represented by:

```cpp
vix::realtime::protocol::Envelope
```

The same envelope can be carried through WebSocket or another transport.

```text
Realtime
   |
   v
Envelope
   |
   v
Transport
```

## Protocol version

The current protocol version is:

```text
1.0
```

In C++:

```cpp
using namespace vix::realtime::protocol;

Version version{
    version_major,
    version_minor};
```

The current constants are:

```cpp
version_major == 1
version_minor == 0
```

## Version compatibility

A received protocol version is supported when:

- its major version matches the current major version
- its minor version is not newer than the current minor version

For the current `1.0` protocol:

```text
1.0    supported
1.1    unsupported
2.0    unsupported
```

Check a version with:

```cpp
bool supported =
    vix::realtime::protocol::is_supported(
        {1, 0});
```

Unsupported versions produce:

```text
UnsupportedProtocolVersion
```

## Message kinds

Realtime defines six wire message kinds:

| Kind       | Purpose                      |
| ---------- | ---------------------------- |
| `Request`  | Client request               |
| `Response` | Server response              |
| `Event`    | Authoritative room event     |
| `Error`    | Error response               |
| `Snapshot` | Serialized room snapshot     |
| `Control`  | Lifecycle or control message |

Their JSON names are:

```text
request
response
event
error
snapshot
control
```

`MessageKind::Command` exists as a C++ compatibility alias for `MessageKind::Request`.

On the wire, commands use:

```json
"kind": "request"
```

The JSON parser does not use `"command"` as a separate message kind.

## Create an envelope

A simple control envelope can be created with:

```cpp
using namespace vix::realtime::protocol;

Envelope envelope{
    MessageKind::Control,
    "session.ready"};
```

The constructor takes:

```text
message kind
message type
optional payload
```

## Message type

Every envelope requires a type.

Examples include:

```text
message.send
message.sent
room.snapshot
session.ready
```

Types may contain:

```text
letters
digits
.
-
_
```

A type cannot:

- be empty
- exceed 128 characters
- begin with `.`
- end with `.`
- contain consecutive dots

For example:

```text
message.send       valid
session_ready      valid
player-moved       valid

.message           invalid
message.           invalid
message..send      invalid
message/send       invalid
```

## Payload

An envelope can contain a structured JSON payload:

```cpp
vix::realtime::JsonObject payload;
payload.set_string("message", "Hello");

Envelope envelope{
    MessageKind::Request,
    "message.send",
    std::move(payload)};
```

The payload is always represented as a JSON object on the wire.

## Common envelope fields

An envelope can carry:

```text
protocol version
kind
type
payload
message ID
request ID
correlation ID
room ID
session ID
room version
event ID
schema version
creation time
metadata
```

Not every message kind requires every field.

## Request messages

A request represents a client operation targeting a room.

A valid request requires:

```text
room_id
session_id
```

For example:

```cpp
Envelope request{
    MessageKind::Request,
    "counter.increment"};

request
    .set_room_id(
        vix::realtime::RoomId{"room-1"})
    .set_session_id(
        vix::realtime::SessionId{"session-1"});
```

The envelope can then be validated:

```cpp
request.validate();
```

## Convert a command to a request

A `RoomCommand` can be converted directly:

```cpp
auto envelope =
    vix::realtime::protocol::from_command(
        command);
```

The resulting envelope has:

```text
kind = request
type = command type
room_id = command room
session_id = command session
payload = command payload
```

Request and correlation identifiers are also preserved.

If the command contains an expected room version, it is carried in:

```text
room_version
```

## Event messages

An event envelope represents an authoritative room event.

Create one from a persisted `RoomEvent`:

```cpp
auto envelope =
    vix::realtime::protocol::from_event(
        event);
```

A valid event envelope requires:

```text
room_id
room_version
event_id
schema_version
```

The event ID must be non-zero.

These fields identify the exact authoritative position of the event.

## Event source session

When a `RoomEvent` has a source session, `from_event()` places it in:

```text
session_id
```

Request and correlation identifiers are also copied when present.

The event audience is not serialized into the envelope. Audience resolution happens before delivery.

## Snapshot messages

A room snapshot can be converted with:

```cpp
auto envelope =
    vix::realtime::protocol::from_snapshot(
        snapshot);
```

The resulting message has:

```text
kind = snapshot
type = room.snapshot
```

A valid snapshot envelope requires:

```text
room_id
room_version
event_id
schema_version
```

The snapshot's serialized state becomes the envelope payload.

Its `event_id` is the snapshot's last included event ID.

## Error messages

Create a protocol error with:

```cpp
auto envelope =
    vix::realtime::protocol::make_error(
        vix::realtime::ErrorCode::InvalidCommand,
        "command is invalid");
```

The resulting envelope has:

```text
kind = error
type = error
```

Its payload contains:

```text
code
message
```

A related request ID can also be included:

```cpp
auto envelope =
    vix::realtime::protocol::make_error(
        vix::realtime::ErrorCode::InvalidCommand,
        "command is invalid",
        "request-1");
```

This allows the client to associate an error with its original request.

## Request ID

The request identifier connects messages to a client request.

Set it with:

```cpp
envelope.set_request_id(
    "request-1");
```

Read it with:

```cpp
envelope.request_id();
```

For example:

```text
request
request_id = request-1
        |
        v
response or error
request_id = request-1
```

## Correlation ID

A correlation identifier can connect several messages belonging to one larger operation:

```cpp
envelope.set_correlation_id(
    "operation-1");
```

Read it with:

```cpp
envelope.correlation_id();
```

## Message ID

A transport-level message identifier can be attached with:

```cpp
envelope.set_message_id(
    "message-1");
```

Read it with:

```cpp
envelope.message_id();
```

This field is optional.

It is separate from `EventId`, which identifies a persisted authoritative event.

## Metadata

Protocol metadata can be attached without changing the application payload:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("transport", "websocket");

envelope.set_metadata(
    std::move(metadata));
```

Metadata is non-authoritative.

## Serialize an envelope

Convert an envelope to compact JSON with:

```cpp
std::string json =
    vix::realtime::protocol::serialize(
        envelope);
```

`serialize()` validates the envelope first.

An invalid envelope is not serialized.

## JSON structure

A serialized request follows this shape:

```json
{
  "protocol": {
    "major": 1,
    "minor": 0
  },
  "kind": "request",
  "type": "counter.increment",
  "payload": {},
  "created_at": 0,
  "room_id": "room-1",
  "session_id": "session-1"
}
```

`created_at` is encoded as Unix time in milliseconds.

Optional fields appear only when they have values.

## Parse JSON

Parse a serialized envelope with:

```cpp
auto envelope =
    vix::realtime::protocol::parse(
        json);
```

`parse()` performs both parsing and protocol validation.

It rejects malformed JSON, unsupported versions, invalid message kinds, invalid types, invalid field types, and missing fields required by the message kind.

## Required wire fields

Every parsed message requires:

```text
protocol.major
protocol.minor
kind
type
```

The payload is optional when parsing.

If absent or `null`, it becomes an empty `JsonObject`.

When present, the payload must be a JSON object.

## Kind-specific requirements

### Request

Requires:

```text
room_id
session_id
```

### Event

Requires:

```text
room_id
room_version
event_id
schema_version
```

### Snapshot

Requires:

```text
room_id
room_version
event_id
schema_version
```

### Response, Error, and Control

These message kinds do not add mandatory routing fields beyond the common envelope requirements.

Applications may add the appropriate identifiers for their own workflow.

## Schema version

Set a schema version with:

```cpp
envelope.set_schema_version(1);
```

Schema version `0` is invalid.

Event and snapshot envelopes require a schema version.

## Validate an envelope

Check without throwing:

```cpp
if (envelope.is_valid())
{
    // Envelope is valid.
}
```

Or validate and receive an error on failure:

```cpp
envelope.validate();
```

Protocol structure errors use:

```text
InvalidProtocolMessage
```

Unsupported versions use:

```text
UnsupportedProtocolVersion
```

## Protocol and transport

The protocol does not perform network I/O.

Its responsibility is:

```text
application data
      |
      v
Envelope
      |
      v
serialize / parse
```

The transport is responsible for carrying that serialized message between client and server.

```text
Envelope
   |
   v
Transport
   |
   v
network
```

For WebSocket, `WebSocketAdapter` parses incoming text into `Envelope` objects and serializes outgoing envelopes back to text.

See [Transport](./transport) for the transport boundary.
