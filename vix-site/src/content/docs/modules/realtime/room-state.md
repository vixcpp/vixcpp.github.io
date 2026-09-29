# Room State

`vix::realtime::RoomState` defines the authoritative state owned by a room.

Applications implement one `RoomState` type for each kind of room state they need.

```cpp
class CounterState final
    : public vix::realtime::RoomState
{
    // ...
};
```

The state changes only when authoritative room events are applied.

## Basic state

A simple counter state can look like this:

```cpp
class CounterState final
    : public vix::realtime::RoomState
{
public:
    [[nodiscard]] vix::realtime::SchemaVersion
    schema_version() const noexcept override
    {
        return 1;
    }

    void apply(
        const vix::realtime::RoomEvent &event) override
    {
        if (event.type() == "counter.incremented")
        {
            ++value_;
        }
    }

    [[nodiscard]] vix::realtime::JsonObject
    serialize() const override
    {
        vix::realtime::JsonObject state;
        state.set_i64("value", value_);
        return state;
    }

    void restore(
        const vix::realtime::JsonObject &state,
        vix::realtime::SchemaVersion) override
    {
        const auto json =
            vix::json::to_json(state);

        value_ =
            json.at("value")
                .get<std::int64_t>();
    }

    [[nodiscard]] std::unique_ptr<vix::realtime::RoomState>
    clone() const override
    {
        return std::make_unique<CounterState>(*this);
    }

    [[nodiscard]] std::int64_t value() const noexcept
    {
        return value_;
    }

private:
    std::int64_t value_{0};
};
```

A `RoomState` implementation provides five operations:

```text
schema_version()
apply()
serialize()
restore()
clone()
```

## Apply events

`apply()` performs authoritative state transitions.

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

The room runtime calls this method after the event has been persisted.

The normal flow is:

```text
command
   |
   v
event
   |
   v
persist
   |
   v
RoomState::apply()
```

Application commands should not modify `RoomState` directly.

## Use event data

Events can contain application data.

```cpp
void apply(
    const vix::realtime::RoomEvent &event) override
{
    if (event.type() != "counter.incremented")
    {
        return;
    }

    const auto payload =
        vix::json::to_json(event.payload());

    value_ +=
        payload.at("amount")
            .get<std::int64_t>();
}
```

The state interprets the event and updates itself accordingly.

## Event ordering

Events are applied in their authoritative order.

For example:

```text
value = 0

counter.incremented +2
        |
        v
value = 2

counter.incremented +3
        |
        v
value = 5
```

Applying the same ordered event stream to the same initial state must produce the same final state.

## Deterministic behavior

`apply()` must be deterministic.

It should only calculate the new state from:

```text
current state
+
authoritative event
```

It must not perform external side effects such as:

```text
network calls
database writes
broadcasting
external service requests
```

These operations could make replay produce different results from the original execution.

## Schema version

Every state reports its application schema version:

```cpp
[[nodiscard]] vix::realtime::SchemaVersion
schema_version() const noexcept override
{
    return 1;
}
```

The schema version is stored with events and snapshots.

It allows the application to detect stored data that its current state implementation cannot understand.

For example:

```cpp
void restore(
    const vix::realtime::JsonObject &state,
    vix::realtime::SchemaVersion version) override
{
    if (version != 1)
    {
        throw vix::realtime::Error{
            vix::realtime::ErrorCode::CorruptedState,
            "unsupported state schema"};
    }

    // Restore state.
}
```

Schema version `0` should not be used for application state.

## Serialize state

`serialize()` returns the complete state as a `JsonObject`.

```cpp
[[nodiscard]] vix::realtime::JsonObject
serialize() const override
{
    vix::realtime::JsonObject state;
    state.set_i64("value", value_);
    return state;
}
```

The serialized value is used when creating room snapshots.

It should contain everything required to reconstruct the authoritative state.

## Restore state

`restore()` replaces the current state from serialized data.

```cpp
void restore(
    const vix::realtime::JsonObject &state,
    vix::realtime::SchemaVersion version) override
{
    if (version != 1)
    {
        throw vix::realtime::Error{
            vix::realtime::ErrorCode::CorruptedState,
            "unsupported state schema"};
    }

    const auto json =
        vix::json::to_json(state);

    value_ =
        json.at("value")
            .get<std::int64_t>();
}
```

`restore()` should reconstruct the complete state rather than partially merge stored values into the existing object.

## Serialize and restore

A correctly implemented state should support this relationship:

```text
original state
      |
      v
 serialize()
      |
      v
 JsonObject
      |
      v
  restore()
      |
      v
equivalent state
```

For example, if the original counter contains:

```text
value = 42
```

serializing and restoring it should reconstruct:

```text
value = 42
```

## Clone state

`clone()` creates an independent copy:

```cpp
[[nodiscard]] std::unique_ptr<vix::realtime::RoomState>
clone() const override
{
    return std::make_unique<CounterState>(*this);
}
```

The returned object must not share mutable state with the original.

For example:

```text
original
value = 5

clone
value = 5
```

Changing the clone must not change the original.

The runtime can use this independent copy when it needs to preserve the previous state during authoritative operations.

## Unsupported events

An application can reject an event it cannot apply.

```cpp
void apply(
    const vix::realtime::RoomEvent &event) override
{
    if (event.type() == "counter.incremented")
    {
        ++value_;
        return;
    }

    throw vix::realtime::Error{
        vix::realtime::ErrorCode::EventApplyFailure,
        "unsupported counter event"};
}
```

Whether an unknown event should be ignored or treated as an error is an application decision.

For authoritative persisted state, rejecting unexpected events is often useful because it prevents silently reconstructing an incorrect state.

## State and commands

A room handler receives the current state as a const reference:

```cpp
vix::realtime::CommandResult handle_command(
    const vix::realtime::RoomCommand &command,
    const vix::realtime::RoomState &state,
    const vix::realtime::RoomContext &context) override;
```

The handler can inspect the state:

```cpp
const auto &counter =
    dynamic_cast<const CounterState &>(state);
```

but it does not mutate it directly.

The handler produces events, and those events later modify the state through `apply()`.

```text
RoomHandler
     |
     | reads
     v
RoomState

RoomHandler
     |
     | produces
     v
RoomEvent
     |
     v
RoomState::apply()
```

## State and snapshots

Snapshots contain serialized room state.

```text
RoomState
    |
    v
serialize()
    |
    v
RoomSnapshot
```

During recovery:

```text
RoomSnapshot
    |
    v
restore()
    |
    v
RoomState
```

Persisted events after the snapshot can then be applied to reach the latest authoritative state.

## Keep application state inside RoomState

Data that determines authoritative application behavior should normally be represented in `RoomState`.

For example:

```text
game score
document content
counter value
match status
shared settings
```

Temporary participation information such as whether a user is currently connected belongs to presence rather than authoritative room state.

## Main rules

A `RoomState` implementation should follow these rules:

```text
modify state only through apply()

keep apply() deterministic

avoid external side effects in apply()

serialize the complete authoritative state

restore the complete authoritative state

validate incompatible schema versions

return an independent copy from clone()
```

These properties allow rooms to persist, replay, restore, and safely manage authoritative application state.

Continue with [Commands and Results](./commands-and-results) for how application intentions are converted into authoritative events.
