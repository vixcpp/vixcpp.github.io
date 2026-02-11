# WS Chat

This example demonstrates a minimal WebSocket chat in Vix using:

-   `serve_http_and_ws`
-   Typed messages: `{ "type": "...", "payload": {...} }`
-   Broadcast to everyone or to a room
-   Optional long-polling bridge endpoints

Everything is inside `main()`.

------------------------------------------------------------------------

## Chat protocol

Client sends:

``` json
{
  "type": "chat.message",
  "payload": {
    "room": "general",
    "user": "Alice",
    "text": "Hello"
  }
}
```

Server broadcasts the same payload back to the room (or global).

------------------------------------------------------------------------

## Full example

``` cpp
#include <vix.hpp>

#include <vix/websocket/AttachedRuntime.hpp>
#include <vix/websocket/HttpApi.hpp>
#include <vix/websocket/LongPollingBridge.hpp>

#include <chrono>
#include <memory>
#include <string>
#include <variant>

using namespace vix;

// Helpers for Simple JSON token/kvs extraction (string only)
static std::string token_to_string(const vix::json::token& t)
{
  if (auto s = std::get_if<std::string>(&t.v))
    return *s;
  return {};
}

static std::string kvs_get_string(const vix::json::kvs& obj, const std::string& key)
{
  const auto& f = obj.flat;
  for (std::size_t i = 0; i + 1 < f.size(); i += 2)
  {
    const std::string k = token_to_string(f[i]);
    if (k == key)
      return token_to_string(f[i + 1]);
  }
  return {};
}

int main()
{
  vix::serve_http_and_ws([](auto& app, auto& ws)
  {
    // Optional: long polling bridge (fallback transport)
    static vix::websocket::WebSocketMetrics metrics;

    auto bridge = std::make_shared<vix::websocket::LongPollingBridge>(
      &metrics,
      std::chrono::seconds{60},
      256
    );

    ws.attach_long_polling_bridge(bridge);

    // Basic HTTP route
    app.get("/", [](auto&, auto& res)
    {
      res.json({"message", "Hello from Vix.cpp"});
    });

    // Long polling endpoints (optional)
    app.get("/ws/poll", [&ws](auto& req, auto& res)
    {
      vix::websocket::http::handle_ws_poll(req, res, ws);
    });

    app.post("/ws/send", [&ws](auto& req, auto& res)
    {
      vix::websocket::http::handle_ws_send(req, res, ws);
    });

    app.get("/ws/status", [&ws](auto&, auto& res)
    {
      auto b = ws.long_polling_bridge();
      res.json(vix::json::kv({
        {"bridge_attached", static_cast<bool>(b)},
        {"sessions", b ? static_cast<int>(b->session_count()) : 0}
      }));
    });

    // Typed message handler
    ws.on_typed_message([&ws](auto&, const std::string& type, const vix::json::kvs& payload)
    {
      if (type != "chat.message")
        return;

      const std::string room = kvs_get_string(payload, "room");

      if (!room.empty())
        ws.broadcast_room_json(room, "chat.message", payload);
      else
        ws.broadcast_json("chat.message", payload);
    });
  });

  return 0;
}
```

------------------------------------------------------------------------

## Test quickly

Start:

``` bash
vix run examples/ws_chat.cpp
```

Check HTTP:

``` bash
curl -i http://127.0.0.1:8080/
```

Check status:

``` bash
curl -i http://127.0.0.1:8080/ws/status
```

------------------------------------------------------------------------

## Notes

-   The transport can be native WebSocket or long-polling fallback.
-   Use typed messages to keep protocol explicit.
-   For real apps, validate payload fields and enforce limits.

Next example: async-worker.

