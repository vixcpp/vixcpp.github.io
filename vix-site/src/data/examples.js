export const EXAMPLES = {
  title: "Examples",
  subtitle:
    "Copy/paste ready examples. Each one shows: code → run → expected output.",

  items: [
    {
      id: "http-ping",
      title: "HTTP: /api/ping",
      desc: "A minimal JSON ping route.",
      code: `#include <vix.hpp>

using namespace vix;

int main()
{
  App app;

  app.get("/api/ping", [](Request &, Response &res)
          {
    res.json({
      "ok", true,
      "message", "pong"
    });
  });

  app.run(8080);
  return 0;
}`,
      run: `vix run server.cpp`,
      out: `http :8080/api/ping
HTTP/1.1 200 OK
{
  "ok": true,
  "message": "pong"
}`,
    },

    {
      id: "query-params",
      title: "HTTP: query params",
      desc: "Read query values with defaults.",
      code: `#include <vix.hpp>
#include <string>

using namespace vix;

int main()
{
  App app;

  app.get("/search", [](Request &req, Response &res)
          {
    const std::string q = req.query_value("q", "");
    const std::string page = req.query_value("page", "1");

    res.json({
      "ok", true,
      "q", q,
      "page", page
    });
  });

  app.run(8080);
  return 0;
}`,
      run: `vix run server.cpp`,
      out: `http ":8080/search?q=vix&page=2"
HTTP/1.1 200 OK
{
  "ok": true,
  "q": "vix",
  "page": "2"
}`,
    },

    {
      id: "middleware-required-header",
      title: "Middleware: require header (401 demo)",
      desc: "Reject requests unless a required header is present.",
      code: `#include <vix.hpp>
#include <vix/middleware/app/adapter.hpp>

using namespace vix;

int main()
{
  App app;

  // ------------------------------------------------------------
  // Middleware inline: require header x-demo: 1
  // ------------------------------------------------------------
  auto require_demo_header =
      middleware::HttpMiddleware([](Request &req,
                                    Response &res,
                                    middleware::Next next)
                                 {
    const std::string value = req.header("x-demo");

    if (value.empty() || value != "1")
    {
      res.status(401).json({
        "error", "unauthorized",
        "hint", "Missing or invalid header",
        "ok", false,
        "required_header", "x-demo"
      });
      return; // block request
    }

    next(); });

  // Attach middleware ONLY to /api/ping
  middleware::app::install_exact(
      app,
      "/api/ping",
      middleware::app::adapt(require_demo_header));

  // ------------------------------------------------------------
  // Route
  // ------------------------------------------------------------
  app.get("/api/ping", [](Request &, Response &res)
          { res.json({"ok", true, "message", "pong"}); });

  app.run(8080);
  return 0;
}`,
      run: `vix run server.cpp`,
      out: `http :8080/api/ping
HTTP/1.1 401 Unauthorized
{
  "error": "unauthorized",
  "hint": "Missing or invalid header",
  "ok": false,
  "required_header": "x-demo"
}

http :8080/api/ping x-demo:1
HTTP/1.1 200 OK
{
  "ok": true,
  "message": "pong"
}`,
      note: "Keep the error shape stable: ok/error/hint/required_header. This matches your 401 output.",
    },

    {
      id: "json-logs",
      title: "Run with JSON logs",
      desc: "Structured logs, useful for debugging and CI.",
      code: `// Nothing special in code.
// Use the CLI flags to control log format.`,
      run: `vix run server.cpp --log-format=json --log-level=debug`,
      out: `{"level":"debug","msg":"server listening","port":8080,"ts":"..."}`,
      note: `Alternative (pretty + colored):
vix run server.cpp --log-format=json-pretty --log-level=debug --log-color=always`,
    },

    {
      id: "http-ws-together",
      title: "HTTP + WebSocket in one process",
      desc: "Serve HTTP routes and typed WebSocket events from a single runtime.",
      code: `#include <vix.hpp>
#include <vix/websocket/AttachedRuntime.hpp>

using namespace vix;

int main()
{
  // Default config path "config/config.json" and port 8080
  vix::serve_http_and_ws([](auto &app, auto &ws)
                         {
    // Minimal HTTP route
    app.get("/api/ping", [](auto&, auto& res) {
      res.json({
        "ok", true,
        "message", "pong"
      });
    });

    // Minimal WebSocket handler: echo/broadcast chat.message
    ws.on_typed_message(
      [&ws](auto& session,
            const std::string& type,
            const vix::json::kvs& payload)
      {
        (void)session;

        if (type == "chat.message") {
          ws.broadcast_json("chat.message", payload);
        }
      });
  });

  return 0;
}`,
      run: `vix run server.cpp`,
      out: `http :8080/api/ping
HTTP/1.1 200 OK
{
  "ok": true,
  "message": "pong"
}`,
      note: "Keep this aligned with the stable ws API names (typed messages + broadcast_json).",
    },
    {
      id: "registry-workflow",
      title: "Registry workflow: add & publish",
      desc: "Discover and reuse C++ libraries with a clean CLI workflow.",
      lang: "shell",
      blockTitle: "Shell",
      code: `# Add a package (example)
vix add gaspardkirira/tree@0.7.0

# Publish a package (example)
vix publish 0.7.0 --notes "Add tree helper"`,
      run: `vix add <author>/<pkg>@<version>`,
      out: `✔ added: gaspardkirira/tree@0.7.0
✔ configured: include paths + CMake integration`,
      note: "Keep outputs short and stable; avoid promising features not shipped yet.",
    },
  ],
};
