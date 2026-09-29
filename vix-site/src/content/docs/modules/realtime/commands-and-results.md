# Commands and Results

Commands describe what a client wants to do in a room.

A `RoomCommand` does not modify room state directly. It is passed to the room handler, which returns a `CommandResult`.

```text
RoomCommand
    |
    v
RoomHandler
    |
    v
CommandResult
```

## Create a command

A command requires:

- a room identifier
- a session identifier
- a command type

For example:

```cpp
vix::realtime::RoomCommand command{
    vix::realtime::RoomId{"room-1"},
    vix::realtime::SessionId{"session-1"},
    "counter.increment"};
```

A payload can also be provided:

```cpp
vix::realtime::JsonObject payload;
payload.set_i64("amount", 1);

vix::realtime::RoomCommand command{
    vix::realtime::RoomId{"room-1"},
    vix::realtime::SessionId{"session-1"},
    "counter.increment",
    std::move(payload)};
```

## Command types

The command type is application-defined.

Examples:

```text
counter.increment
message.send
player.move
```

A command type:

- cannot be empty
- cannot exceed 128 characters
- can contain letters, digits, `.`, `-`, and `_`
- cannot start or end with `.`
- cannot contain consecutive dots

For example:

```text
message.send      valid
message_send      valid
message-send      valid

.message          invalid
message.          invalid
message..send     invalid
message/send      invalid
```

Invalid commands throw `ErrorCode::InvalidCommand` during validation.

## Read command data

A handler can inspect the command:

```cpp
command.room_id();
command.session_id();
command.type();
command.payload();
```

For example:

```cpp
if (command.type() == "counter.increment")
{
    // Handle the command.
}
```

## Request identifier

A command can contain a request identifier:

```cpp
vix::realtime::RoomCommand command{
    roomId,
    sessionId,
    "counter.increment",
    {},
    "request-1"};
```

Read it with:

```cpp
command.request_id();
```

When the handler produces an event without its own request identifier, the room runtime propagates the command request identifier to that event.

## Correlation identifier

A correlation identifier can be attached separately:

```cpp
command.set_correlation_id(
    "operation-42");
```

Read it with:

```cpp
command.correlation_id();
```

The runtime also propagates it to produced events when those events do not already define one.

## Expected room version

A command can require the room to still be at a specific version:

```cpp
command.set_expected_version(
    vix::realtime::RoomVersion{5});
```

If the room is no longer at version `5`, the command is rejected before the handler runs.

The constraint can be removed with:

```cpp
command.clear_expected_version();
```

See [Rooms](./rooms) for room version behavior.

## Handle a command

Application logic implements `RoomHandler::handle_command()`:

```cpp
vix::realtime::CommandResult handle_command(
    const vix::realtime::RoomCommand &command,
    const vix::realtime::RoomState &state,
    const vix::realtime::RoomContext &context) override
{
    if (command.type() == "counter.increment")
    {
        return vix::realtime::CommandResult::accepted();
    }

    return vix::realtime::CommandResult::ignored();
}
```

The handler can inspect the current state, but it should not modify it directly.

To change authoritative state, return events from an accepted result.

## Command result statuses

A `CommandResult` has one of three statuses:

```text
Accepted
Rejected
Ignored
```

Check them with:

```cpp
result.is_accepted();
result.is_rejected();
result.is_ignored();
```

The status is also available directly:

```cpp
auto status = result.status();
```

## Accepted

Use `accepted()` when the command is valid.

An accepted command can produce no events:

```cpp
return vix::realtime::CommandResult::accepted();
```

or one event:

```cpp
vix::realtime::RoomEvent event{
    command.room_id(),
    "counter.incremented"};

return vix::realtime::CommandResult::accepted(
    std::move(event));
```

It can also produce multiple events.

Only events from an accepted result enter the room commit path.

```text
Accepted
   |
   v
events
   |
   v
persist
   |
   v
apply to RoomState
```

An accepted result is also valid with zero events.

## Rejected

Use `rejected()` when an application rule prevents the command from being accepted.

```cpp
return vix::realtime::CommandResult::rejected(
    vix::realtime::ErrorCode::CommandRejected,
    "command is not allowed");
```

A rejected result:

- must contain a non-`None` error code
- cannot contain events
- does not modify authoritative room state

Check the rejection information with:

```cpp
result.error_code();
result.message();
```

A normal application rejection does not by itself put the room into the `Failed` state.

## Ignored

Use `ignored()` when the command requires no action:

```cpp
return vix::realtime::CommandResult::ignored();
```

An optional message can be provided:

```cpp
return vix::realtime::CommandResult::ignored(
    "nothing to update");
```

An ignored result cannot contain events.

It does not modify room state.

## Accepted, rejected, and ignored

The three outcomes have different meanings:

| Status     | Events allowed | State change            |
| ---------- | -------------- | ----------------------- |
| `Accepted` | Yes            | Through produced events |
| `Rejected` | No             | No                      |
| `Ignored`  | No             | No                      |

An accepted command with no events is still accepted, but it produces no authoritative state transition.

## Return an event

A common handler pattern is:

```cpp
vix::realtime::CommandResult handle_command(
    const vix::realtime::RoomCommand &command,
    const vix::realtime::RoomState &,
    const vix::realtime::RoomContext &) override
{
    if (command.type() != "counter.increment")
    {
        return vix::realtime::CommandResult::ignored();
    }

    vix::realtime::RoomEvent event{
        command.room_id(),
        "counter.incremented"};

    return vix::realtime::CommandResult::accepted(
        std::move(event));
}
```

The runtime then handles persistence and state application.

The handler does not need to assign the persistent event identifier or authoritative room version.

## Multiple events

One command may produce several events:

```cpp
std::vector<vix::realtime::RoomEvent> events;

events.emplace_back(
    command.room_id(),
    "message.sent");

events.emplace_back(
    command.room_id(),
    "message.indexed");

return vix::realtime::CommandResult::accepted(
    std::move(events));
```

The events are committed as one batch by the room.

Their order is preserved.

## Result message

Any result can contain a human-readable message.

```cpp
auto result =
    vix::realtime::CommandResult::accepted();

result.set_message("updated");
```

The message is informational. It is not authoritative room state.

## Metadata

Commands and results can carry application-defined metadata.

For a command:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("source", "mobile");

command.set_metadata(
    std::move(metadata));
```

For a result:

```cpp
vix::realtime::JsonObject metadata;
metadata.set_string("kind", "counter");

result.set_metadata(
    std::move(metadata));
```

Metadata can carry contextual or diagnostic information, but it must not be used as an authoritative room state change.

## Runtime checks

When commands are executed through `Server` or `RoomManager`, the runtime also verifies conditions outside the handler.

For example, it verifies that:

- the session exists
- the session is not closed
- the room exists
- the session belongs to the room

These runtime failures are different from a business rule intentionally returned as `CommandResult::rejected()`.

## Execution model

The complete command path is:

```text
client intent
     |
     v
RoomCommand
     |
     v
runtime checks
     |
     v
RoomHandler
     |
     v
CommandResult
     |
     +---- Rejected
     |
     +---- Ignored
     |
     +---- Accepted
              |
              v
          RoomEvent(s)
              |
              v
          persistence
              |
              v
        RoomState::apply()
```

Commands express intent. `CommandResult` expresses the application's decision. Accepted events define the authoritative state transition.

Continue with [Events](./events) for the event model and delivery audiences.
