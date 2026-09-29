# Quick Start

This guide builds a small counter room that accepts commands and updates authoritative state through persisted events.

The example uses the Realtime runtime directly. No WebSocket connection is required.

## Link Realtime

With CMake, link the Realtime module:

```cmake
target_link_libraries(my_app
  PRIVATE
    vix::realtime
)
```

Realtime requires C++20:

```cmake
target_compile_features(my_app
  PRIVATE
    cxx_std_20
)
```

Include the public API:

```cpp
#include <vix/json/json.hpp>
#include <vix/realtime.hpp>
```

## Define the room state

A room state applies persisted events and represents the current authoritative state.

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
    if (event.type() != "counter.changed")
    {
      return;
    }

    const auto payload =
        vix::json::to_json(event.payload());

    value_ +=
        payload.at("delta")
            .get<std::int64_t>();
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
      vix::realtime::SchemaVersion schemaVersion) override
  {
    if (schemaVersion != 1)
    {
      throw vix::realtime::Error{
          vix::realtime::ErrorCode::CorruptedState,
          "unsupported counter state schema"};
    }

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

`apply()` is where persisted events modify the room state. Commands do not modify `value_` directly.

## Define the command handler

The handler receives commands and decides which events they produce.

```cpp
class CounterHandler final
    : public vix::realtime::RoomHandler
{
public:
  [[nodiscard]] vix::realtime::CommandResult
  handle_command(
      const vix::realtime::RoomCommand &command,
      const vix::realtime::RoomState &,
      const vix::realtime::RoomContext &) override
  {
    if (command.type() != "counter.increment")
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "unsupported counter command");
    }

    const auto payload =
        vix::json::to_json(command.payload());

    if (!payload.contains("amount") ||
        !payload.at("amount").is_number_integer())
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "counter amount must be an integer");
    }

    const auto amount =
        payload.at("amount")
            .get<std::int64_t>();

    if (amount <= 0)
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "counter amount must be positive");
    }

    vix::realtime::JsonObject eventPayload;
    eventPayload.set_i64("delta", amount);

    vix::realtime::RoomEvent event{
        command.room_id(),
        "counter.changed",
        std::move(eventPayload),
        vix::realtime::EventAudience::Room};

    event.set_source_session(
        command.session_id());

    event.set_request_id(
        command.request_id());

    event.set_correlation_id(
        command.correlation_id());

    return vix::realtime::CommandResult::accepted(
        {std::move(event)});
  }
};
```

An accepted command produces a `counter.changed` event. Realtime persists the event before applying it to `CounterState`.

## Define the room factory

A room factory creates the state and handler for one room type.

```cpp
class CounterFactory final
    : public vix::realtime::RoomFactory
{
public:
  [[nodiscard]] std::string_view
  room_type() const noexcept override
  {
    return "counter";
  }

  [[nodiscard]] vix::realtime::RoomStatePtr
  create_state(
      const vix::realtime::RoomId &) const override
  {
    return std::make_unique<CounterState>();
  }

  [[nodiscard]] vix::realtime::RoomHandlerPtr
  create_handler(
      const vix::realtime::RoomId &) const override
  {
    return std::make_unique<CounterHandler>();
  }
};
```

Every opened `counter` room receives its own state and handler instances.

## Start the runtime

Create a server, register the room type, then start the runtime:

```cpp
vix::realtime::Server server{
    vix::realtime::NodeId{"node-1"}};

server.register_factory(
    std::make_shared<CounterFactory>());

server.start();
```

`Server` manages the Realtime runtime. Starting it does not open a network socket.

## Open a room

Open an instance of the registered room type:

```cpp
const vix::realtime::RoomId roomId{
    "counter/main"};

auto room =
    server.open_room(
        roomId,
        "counter");
```

The room is now open and ready to accept members and commands.

## Create a session and join the room

Create a logical session:

```cpp
const vix::realtime::SessionId sessionId{
    "session-1"};

server.create_session(
    sessionId,
    "user-1");

auto joinResult =
    server.join_room(
        sessionId,
        roomId);

if (joinResult.is_rejected())
{
  return 1;
}
```

A session must belong to the room before it can execute commands in that room.

## Execute a command

Create the command payload:

```cpp
vix::realtime::JsonObject payload;
payload.set_i64("amount", 5);
```

Then execute the command:

```cpp
vix::realtime::RoomCommand command{
    roomId,
    sessionId,
    "counter.increment",
    std::move(payload),
    "request-1"};

auto result =
    server.execute(command);

if (result.is_rejected())
{
  return 1;
}
```

The execution path is:

```text
counter.increment
        |
        v
CounterHandler
        |
        v
counter.changed
        |
        v
EventStore
        |
        v
CounterState::apply()
```

The command itself does not become the state transition. The persisted `counter.changed` event does.

## Read the resulting state

The room now contains the updated authoritative state:

```cpp
const auto &state =
    dynamic_cast<const CounterState &>(
        room->state());

std::cout
    << state.value()
    << '\n';
```

After the command above, the value is `5`.

## Complete example

```cpp
#include <cstdint>
#include <iostream>
#include <memory>
#include <string_view>
#include <utility>

#include <vix/json/json.hpp>
#include <vix/realtime.hpp>

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
    if (event.type() != "counter.changed")
    {
      return;
    }

    const auto payload =
        vix::json::to_json(event.payload());

    value_ +=
        payload.at("delta")
            .get<std::int64_t>();
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
      vix::realtime::SchemaVersion schemaVersion) override
  {
    if (schemaVersion != 1)
    {
      throw vix::realtime::Error{
          vix::realtime::ErrorCode::CorruptedState,
          "unsupported counter state schema"};
    }

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

class CounterHandler final
    : public vix::realtime::RoomHandler
{
public:
  [[nodiscard]] vix::realtime::CommandResult
  handle_command(
      const vix::realtime::RoomCommand &command,
      const vix::realtime::RoomState &,
      const vix::realtime::RoomContext &) override
  {
    if (command.type() != "counter.increment")
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "unsupported counter command");
    }

    const auto payload =
        vix::json::to_json(command.payload());

    if (!payload.contains("amount") ||
        !payload.at("amount").is_number_integer())
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "counter amount must be an integer");
    }

    const auto amount =
        payload.at("amount")
            .get<std::int64_t>();

    if (amount <= 0)
    {
      return vix::realtime::CommandResult::rejected(
          vix::realtime::ErrorCode::InvalidCommand,
          "counter amount must be positive");
    }

    vix::realtime::JsonObject eventPayload;
    eventPayload.set_i64("delta", amount);

    vix::realtime::RoomEvent event{
        command.room_id(),
        "counter.changed",
        std::move(eventPayload),
        vix::realtime::EventAudience::Room};

    event.set_source_session(
        command.session_id());

    event.set_request_id(
        command.request_id());

    event.set_correlation_id(
        command.correlation_id());

    return vix::realtime::CommandResult::accepted(
        {std::move(event)});
  }
};

class CounterFactory final
    : public vix::realtime::RoomFactory
{
public:
  [[nodiscard]] std::string_view
  room_type() const noexcept override
  {
    return "counter";
  }

  [[nodiscard]] vix::realtime::RoomStatePtr
  create_state(
      const vix::realtime::RoomId &) const override
  {
    return std::make_unique<CounterState>();
  }

  [[nodiscard]] vix::realtime::RoomHandlerPtr
  create_handler(
      const vix::realtime::RoomId &) const override
  {
    return std::make_unique<CounterHandler>();
  }
};

int main()
{
  using namespace vix::realtime;

  Server server{
      NodeId{"node-1"}};

  server.register_factory(
      std::make_shared<CounterFactory>());

  server.start();

  const RoomId roomId{
      "counter/main"};

  const SessionId sessionId{
      "session-1"};

  auto room =
      server.open_room(
          roomId,
          "counter");

  server.create_session(
      sessionId,
      "user-1");

  auto joinResult =
      server.join_room(
          sessionId,
          roomId);

  if (joinResult.is_rejected())
  {
    return 1;
  }

  JsonObject payload;
  payload.set_i64("amount", 5);

  RoomCommand command{
      roomId,
      sessionId,
      "counter.increment",
      std::move(payload),
      "request-1"};

  auto result =
      server.execute(command);

  if (result.is_rejected())
  {
    return 1;
  }

  const auto &state =
      dynamic_cast<const CounterState &>(
          room->state());

  std::cout
      << state.value()
      << '\n';

  server.stop();
  return 0;
}
```

## What happened

This example established the basic Realtime workflow:

```text
register room type
        |
        v
start Server
        |
        v
open room
        |
        v
create session
        |
        v
join room
        |
        v
execute command
        |
        v
persist event
        |
        v
update room state
```

The default `Server` dependencies use in-memory event and snapshot stores. They are suitable for learning, tests, and local development, but their contents do not survive a process restart.

For the underlying model, continue with [Core Concepts](./core-concepts).
