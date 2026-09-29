# Room Handlers

`vix::realtime::RoomHandler` contains the application logic for a room.

A handler receives commands, inspects the current room state, and returns a `CommandResult`.

```text
RoomCommand
    |
    v
RoomHandler
    |
    v
CommandResult
```

The handler decides what should happen. The room runtime remains responsible for persistence, state application, and event delivery.

## Create a handler

A simple handler can look like this:

```cpp
class CounterHandler final
    : public vix::realtime::RoomHandler
{
public:
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
};
```

This handler accepts one command type and converts it into one event.

## Handle a command

The main entry point is:

```cpp
handle_command(
    const RoomCommand &command,
    const RoomState &state,
    const RoomContext &context)
```

The handler receives:

```text
command
current state
room context
```

and returns:

```text
Accepted
Rejected
Ignored
```

## Inspect the command

The handler can inspect the command type:

```cpp
if (command.type() == "counter.increment")
{
    // Handle the command.
}
```

It can also read the payload:

```cpp
const auto &payload = command.payload();
```

and identifiers such as:

```cpp
command.room_id();
command.session_id();
command.request_id();
command.correlation_id();
```

## Inspect the current state

The current room state is passed as a const reference.

For example:

```cpp
const auto &counter =
    dynamic_cast<const CounterState &>(state);
```

The handler can use the current state to make decisions:

```cpp
if (counter.value() >= 100)
{
    return vix::realtime::CommandResult::rejected(
        vix::realtime::ErrorCode::CommandRejected,
        "counter limit reached");
}
```

The handler should not modify the state directly.

## Produce events

To change authoritative state, the handler returns events.

```cpp
vix::realtime::RoomEvent event{
    command.room_id(),
    "counter.incremented"};

return vix::realtime::CommandResult::accepted(
    std::move(event));
```

The runtime then:

```text
persists event
      |
      v
applies event to RoomState
      |
      v
delivers event
```

The handler does not perform those steps itself.

## Reject a command

Use a rejected result when an application rule prevents the command:

```cpp
return vix::realtime::CommandResult::rejected(
    vix::realtime::ErrorCode::CommandRejected,
    "operation not allowed");
```

A rejected command does not change the authoritative room state.

## Ignore a command

Use `ignored()` when no action is required:

```cpp
return vix::realtime::CommandResult::ignored();
```

Ignored commands do not produce events.

## Use the room context

`RoomContext` provides information about the current room operation.

For example:

```cpp
const auto &roomId = context.room_id();
```

The context is provided by the runtime for the current handler call.

Application logic should use it only for information that belongs to the current room operation.

## Join lifecycle

A handler can receive a callback when a session joins the room.

```cpp
vix::realtime::CommandResult on_join(
    const vix::realtime::SessionId &sessionId,
    const vix::realtime::RoomState &,
    const vix::realtime::RoomContext &) override
{
    return vix::realtime::CommandResult::accepted();
}
```

The join operation can:

```text
Accepted
Rejected
Ignored
```

If the handler rejects the join, the session is not added to the room.

## Leave lifecycle

A handler can also receive a callback before a session leaves:

```cpp
vix::realtime::CommandResult on_leave(
    const vix::realtime::SessionId &sessionId,
    const vix::realtime::RoomState &,
    const vix::realtime::RoomContext &) override
{
    return vix::realtime::CommandResult::accepted();
}
```

If the leave operation is rejected, the current membership is preserved.

## Open lifecycle

A handler can participate when the room opens:

```cpp
vix::realtime::CommandResult on_open(
    const vix::realtime::RoomState &,
    const vix::realtime::RoomContext &) override
{
    return vix::realtime::CommandResult::accepted();
}
```

The room reaches `Open` only after the open lifecycle completes successfully.

## Close lifecycle

A handler can participate when the room closes:

```cpp
vix::realtime::CommandResult on_close(
    const vix::realtime::RoomState &,
    const vix::realtime::RoomContext &) override
{
    return vix::realtime::CommandResult::accepted();
}
```

If the handler rejects the close operation, the room returns to `Open`.

## Lifecycle events

Lifecycle callbacks can also return events.

For example, a join callback can produce an event:

```cpp
vix::realtime::RoomEvent event{
    context.room_id(),
    "member.joined"};

return vix::realtime::CommandResult::accepted(
    std::move(event));
```

Accepted lifecycle events follow the same authoritative path as normal command events:

```text
handler
   |
   v
event
   |
   v
persistence
   |
   v
RoomState::apply()
```

## Keep handlers focused

A handler should normally be responsible for:

```text
validating commands
reading current state
applying application rules
producing events
```

It should not directly manage:

```text
event persistence
snapshot storage
WebSocket connections
session transport
event broadcasting
room version assignment
event ID assignment
```

Those responsibilities belong to the Realtime runtime.

## Simple example

A small counter handler can be written as:

```cpp
class CounterHandler final
    : public vix::realtime::RoomHandler
{
public:
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
};
```

The important separation is:

```text
RoomHandler
    decides what should happen

Room
    makes it authoritative
```

Continue with [Room Manager](./room-manager) for how rooms, sessions, membership, and runtime dependencies are coordinated.
