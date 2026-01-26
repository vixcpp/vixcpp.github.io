export const EXAMPLES = {
  title: "Examples",
  subtitle:
    "Copy/paste ready examples. Each one shows: code → run → expected output.",

  items: [
    {
      id: "http-ping",
      title: "HTTP: /api/ping",
      desc: "A minimal JSON ping route.",
      code: `#include <vix/app/App.hpp>
using vix::App;

int main() {
  App app;

  app.get("/api/ping", [](auto& req, auto& res) {
    res.json({
      "ok", true,
      "message", "pong"
    });
  });

  return app.listen(8080);
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
      code: `#include <vix/app/App.hpp>
#include <string>
using vix::App;

int main() {
  App app;

  app.get("/search", [](auto& req, auto& res) {
    const std::string q = req.query_value("q", "");
    const std::string pageStr = req.query_value("page", "1");

    res.json({
      "ok", true,
      "q", q,
      "page", pageStr
    });
  });

  return app.listen(8080);
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
      code: `#include <vix/app/App.hpp>
using vix::App;

int main() {
  App app;

  // Pseudo middleware (concept)
  // In your real code, plug your middleware function in the proper pipeline.
  app.use([](auto& req, auto& res, auto next) {
    const auto v = req.header("x-demo");
    if (!v || v->empty()) {
      res.status(401).json({
        "ok", false,
        "error", "unauthorized",
        "hint", "Missing or invalid header",
        "required_header", "x-demo"
      });
      return;
    }
    next();
  });

  app.get("/api/ping", [](auto& req, auto& res) {
    res.json({ "ok", true, "message", "pong" });
  });

  return app.listen(8080);
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
      note: "This matches your 401 output. Keep the error shape stable: ok/error/hint/required_header.",
    },

    {
      id: "json-logs",
      title: "Run with JSON logs",
      desc: "Structured logs, useful for debugging and CI.",
      code: `// Nothing special in code.
// Use the CLI flags to control log format.`,
      run: `vix run server.cpp --log-format=json --log-level=debug

or
vix run server.cpp --log-format=json-pretty --log-level=debug --log-color=always`,
      out: `{"level":"debug","msg":"server listening","port":8080,"ts":"..."}`,
    },

    {
      id: "http-ws-together",
      title: "HTTP + WebSocket in one process",
      desc: "Serve HTTP routes and WebSocket events from a single Vix app.",
      code: `#include <vix/app/App.hpp>
// pseudo: websocket headers depend on your module layout
// #include <vix/ws/WebSocket.hpp>

using vix::App;

int main() {
  App app;

  app.get("/api/ping", [](auto& req, auto& res) {
    res.json({ "ok", true, "message", "pong" });
  });

  // app.ws("/ws", [](auto& ws) {
  //   ws.on_open([](auto& ctx){});
  //   ws.on_message([](auto& ctx, std::string_view msg){
  //     ctx.send(msg); // echo
  //   });
  // });

  return app.listen(8080);
}`,
      run: `vix run server.cpp`,
      out: `http :8080/api/ping
HTTP/1.1 200 OK
{
  "ok": true,
  "message": "pong"
}`,
      note: "Keep the example simple and aligned with your actual ws API names once stabilized.",
    },

    {
      id: "registry-workflow",
      title: "Registry workflow: add & publish",
      desc: "Discover and reuse C++ libraries with a clean CLI workflow.",
      code: `# Add a package (example)
vix add gaspardkirira/tree@0.7.0

# Publish a package (example)
vix publish 0.7.0 --notes "Add tree helper"`,
      run: `vix add <author>/<pkg>@<version>`,
      out: `✔ added: gaspardkirira/tree@0.7.0
✔ configured: include paths + CMake integration`,
      note: "The web UI will move to registry.vixcpp.com on the VPS.",
    },
  ],
};
