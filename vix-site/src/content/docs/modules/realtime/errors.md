# Errors

Vix Realtime reports runtime failures with:

```cpp
vix::realtime::Error
```

Each error contains:

- a deterministic `ErrorCode`
- a human-readable message

For example:

```cpp
try
{
    server.open_room(
        vix::realtime::RoomId{"room-1"},
        "unknown");
}
catch (const vix::realtime::Error &error)
{
    auto code = error.code();
    auto message = error.what();
}
```

Use the error code for program logic. Use the message for diagnostics.

## Error codes

Realtime error codes are defined by:

```cpp
vix::realtime::ErrorCode
```

For example:

```cpp
if (error.code() ==
    vix::realtime::ErrorCode::RoomNotFound)
{
    // The requested room does not exist.
}
```

The codes are independent from the transport used by the application.

The same error model can therefore be used with WebSocket, tests, direct C++ calls, or another transport integration.

## Error messages

`Error` derives from `std::runtime_error`.

Read the diagnostic message with:

```cpp
error.what();
```

For example:

```cpp
catch (const vix::realtime::Error &error)
{
    std::cerr << error.what() << '\n';
}
```

Messages provide context for developers and logs.

Applications should not depend on exact message text when deciding how to handle an error.

Use:

```cpp
error.code();
```

for that purpose.

## Stable error names

Convert an error code to its stable textual representation with:

```cpp
auto name =
    vix::realtime::to_string(
        error.code());
```

For example:

```cpp
vix::realtime::to_string(
    vix::realtime::ErrorCode::RoomNotFound);
```

returns:

```text
room_not_found
```

These names are suitable for logs and protocol error responses.

## Configuration errors

### `InvalidConfiguration`

```text
invalid_configuration
```

The supplied Realtime configuration is invalid.

Examples include invalid limits or invalid adapter options.

### `MissingDependency`

```text
missing_dependency
```

A required runtime dependency is unavailable.

Examples can include a missing event store or using PostgreSQL support when it was not compiled into the module.

## Room errors

### `RoomNotFound`

```text
room_not_found
```

The requested room does not exist.

For example:

```cpp
auto room =
    manager.require_room(
        vix::realtime::RoomId{"missing"});
```

### `RoomAlreadyExists`

```text
room_already_exists
```

A room conflicts with an existing room registration.

### `RoomFull`

```text
room_full
```

The room has reached its configured session capacity.

The limit is controlled by:

```cpp
config.maxSessionsPerRoom
```

### `RoomLimitReached`

```text
room_limit_reached
```

The runtime has reached its configured active-room limit.

The limit is controlled by:

```cpp
config.maxActiveRooms
```

### `RoomNotReady`

```text
room_not_ready
```

The room cannot currently perform the requested operation.

This can occur while a room is opening or restoring its state.

### `RoomClosed`

```text
room_closed
```

The requested operation targets a room that is closing or already closed.

## Command errors

### `CommandQueueFull`

```text
command_queue_full
```

The room cannot accept another queued command because its queue reached:

```cpp
config.maxPendingCommandsPerRoom
```

### `InvalidCommand`

```text
invalid_command
```

The command is malformed or cannot be processed as a valid room command.

### `CommandRejected`

```text
command_rejected
```

The room handler rejected the operation.

For application rules, handlers can return:

```cpp
return vix::realtime::CommandResult::rejected(
    vix::realtime::ErrorCode::CommandRejected,
    "operation not allowed");
```

A normal command rejection does not by itself mean that the room failed.

### `CommandTimeout`

```text
command_timeout
```

Represents a command that exceeded its allowed execution duration.

### `Unauthorized`

```text
unauthorized
```

The caller is not authorized to perform the requested operation.

## Session errors

### `SessionNotFound`

```text
session_not_found
```

The requested logical session does not exist.

### `SessionExpired`

```text
session_expired
```

The logical session can no longer be resumed or used for the requested recovery operation.

### `InvalidResumeToken`

```text
invalid_resume_token
```

The supplied resume token does not match the session.

### `SessionAlreadyConnected`

```text
session_already_connected
```

A resume operation was attempted while the session already had an active connection.

### `SessionNotDetached`

```text
session_not_detached
```

The session has not entered the detached state required for resumption.

### `ConnectionNotAttached`

```text
connection_not_attached
```

The requested operation requires an attached connection, but no valid connection is available.

## Membership errors

### `MembershipNotFound`

```text
membership_not_found
```

A required room membership does not exist.

For example, executing a room command through `RoomManager` requires the session to belong to that room.

### `AlreadyJoined`

```text
already_joined
```

The session has already joined the room.

## Protocol errors

### `InvalidProtocolMessage`

```text
invalid_protocol_message
```

The protocol message is malformed or violates the Realtime protocol requirements.

Examples include:

```text
missing required fields
invalid message kind
invalid identifiers
invalid field types
```

### `UnsupportedProtocolVersion`

```text
unsupported_protocol_version
```

The received protocol version is not compatible with the current Realtime protocol.

### `PayloadTooLarge`

```text
payload_too_large
```

An incoming payload exceeds a configured transport limit.

For example, `WebSocketAdapter` can report this when an incoming message exceeds `maxMessageSize`.

## Persistence errors

### `EventStoreFailure`

```text
event_store_failure
```

An authoritative event could not be persisted or loaded correctly by the event store.

When persistence of a new command fails, the room does not advance its authoritative state with those events.

### `SnapshotStoreFailure`

```text
snapshot_store_failure
```

A snapshot operation failed.

This can occur while saving, loading, pruning, or otherwise accessing snapshot persistence.

## State errors

### `CorruptedState`

```text
corrupted_state
```

Persisted room data is inconsistent or invalid.

Examples can include:

```text
invalid event ordering
invalid room versions
invalid snapshot positions
unsupported stored state
```

Recovery stops rather than silently accepting inconsistent authoritative history.

### `EventApplyFailure`

```text
event_apply_failure
```

A persisted event could not be applied to `RoomState`.

For example, `RoomState::apply()` may reject an event that cannot be interpreted safely.

## Replay errors

### `ReplayUnavailable`

```text
replay_unavailable
```

Realtime could not obtain the complete event history required for recovery.

The runtime does not advance a recovery cursor using incomplete history.

### `ReplayLimitExceeded`

```text
replay_limit_exceeded
```

Recovery exceeded one of its configured limits.

Relevant limits include:

```cpp
config.maxReplayEvents;
config.maxReplayBytes;
config.replayTimeout;
config.maxResumeRooms;
```

See [Replay and Recovery](./replay-and-recovery) for replay behavior.

## Transport errors

### `TransportFailure`

```text
transport_failure
```

The transport failed while sending, receiving, or managing a connection.

For example, a WebSocket failure can be reported with this code.

A transport failure after an event has already been persisted and applied does not undo that authoritative event.

## Operation errors

### `Cancelled`

```text
cancelled
```

The operation was cancelled.

It is also the default error code passed to:

```cpp
connection->close();
```

when no explicit close code is supplied.

### `Timeout`

```text
timeout
```

An operation exceeded its allowed duration.

Replay processing can use this error when its configured timeout expires.

## Internal errors

### `InternalError`

```text
internal_error
```

An internal Realtime invariant was violated or an operation reached a state that should not occur during normal use.

This error usually indicates a runtime or integration problem rather than a normal application decision.

## `None`

`ErrorCode::None` represents the absence of an error.

Its stable name is:

```text
none
```

It is not intended to describe a failure.

For example, successful command results may internally use `None` where no rejection error exists.

## Error code reference

| Error code                   | Stable name                    | Meaning                             |
| ---------------------------- | ------------------------------ | ----------------------------------- |
| `None`                       | `none`                         | No error                            |
| `InvalidConfiguration`       | `invalid_configuration`        | Invalid configuration               |
| `MissingDependency`          | `missing_dependency`           | Required dependency missing         |
| `RoomNotFound`               | `room_not_found`               | Room does not exist                 |
| `RoomAlreadyExists`          | `room_already_exists`          | Room already exists                 |
| `RoomFull`                   | `room_full`                    | Room session capacity reached       |
| `RoomLimitReached`           | `room_limit_reached`           | Runtime room limit reached          |
| `RoomNotReady`               | `room_not_ready`               | Room is not ready                   |
| `RoomClosed`                 | `room_closed`                  | Room is closing or closed           |
| `CommandQueueFull`           | `command_queue_full`           | Command queue capacity reached      |
| `InvalidCommand`             | `invalid_command`              | Invalid command                     |
| `CommandRejected`            | `command_rejected`             | Handler rejected command            |
| `CommandTimeout`             | `command_timeout`              | Command exceeded its timeout        |
| `Unauthorized`               | `unauthorized`                 | Operation is not authorized         |
| `SessionNotFound`            | `session_not_found`            | Session does not exist              |
| `SessionExpired`             | `session_expired`              | Session expired                     |
| `InvalidResumeToken`         | `invalid_resume_token`         | Invalid resume token                |
| `ConnectionNotAttached`      | `connection_not_attached`      | Required connection is not attached |
| `MembershipNotFound`         | `membership_not_found`         | Room membership does not exist      |
| `AlreadyJoined`              | `already_joined`               | Session already joined room         |
| `InvalidProtocolMessage`     | `invalid_protocol_message`     | Malformed protocol message          |
| `UnsupportedProtocolVersion` | `unsupported_protocol_version` | Unsupported protocol version        |
| `PayloadTooLarge`            | `payload_too_large`            | Payload exceeds configured limit    |
| `EventStoreFailure`          | `event_store_failure`          | Event persistence failure           |
| `SnapshotStoreFailure`       | `snapshot_store_failure`       | Snapshot persistence failure        |
| `CorruptedState`             | `corrupted_state`              | Persisted state is inconsistent     |
| `EventApplyFailure`          | `event_apply_failure`          | Event could not be applied          |
| `ReplayUnavailable`          | `replay_unavailable`           | Required replay is unavailable      |
| `ReplayLimitExceeded`        | `replay_limit_exceeded`        | Replay exceeded configured limits   |
| `TransportFailure`           | `transport_failure`            | Transport operation failed          |
| `Cancelled`                  | `cancelled`                    | Operation cancelled                 |
| `Timeout`                    | `timeout`                      | Operation exceeded allowed duration |
| `InternalError`              | `internal_error`               | Internal invariant failure          |
| `SessionAlreadyConnected`    | `session_already_connected`    | Session already has a connection    |
| `SessionNotDetached`         | `session_not_detached`         | Session was not detached            |

## Protocol error responses

Realtime protocol errors can carry the same deterministic error codes.

For example:

```cpp
auto envelope =
    vix::realtime::protocol::make_error(
        vix::realtime::ErrorCode::RoomNotFound,
        "room does not exist",
        "request-1");
```

The client can then use the stable error code instead of depending on the diagnostic message.

```text
room_not_found
```

This keeps error handling consistent between C++ runtime operations and transport-facing protocol responses.

## Handle errors by code

A simple application can handle expected errors explicitly:

```cpp
try
{
    auto room =
        manager.require_room(roomId);
}
catch (const vix::realtime::Error &error)
{
    if (error.code() ==
        vix::realtime::ErrorCode::RoomNotFound)
    {
        // Handle missing room.
    }
}
```

For logging:

```cpp
std::cerr
    << vix::realtime::to_string(error.code())
    << ": "
    << error.what()
    << '\n';
```

The main rule is:

```text
ErrorCode
    stable programmatic meaning

error.what()
    human-readable diagnostic context
```

Continue with [CMake](./cmake) for building and linking the Realtime module.
