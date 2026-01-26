export const HOME = {
  hero: {
    title:
      "Build fast backend services in modern C++ — without the usual friction.",
    subtitle:
      "Vix.cpp is a C++ runtime focused on performance, clean DX, and practical server building: HTTP, WebSocket, middleware, and a registry workflow.",
    ctas: [
      { label: "Install", to: "/install", kind: "primary" },
      { label: "See examples", to: "/examples", kind: "secondary" },
    ],
  },

  quickstart: {
    title: "Quickstart (60 seconds)",
    code: `vix new api
cd api
vix dev`,
    note: "You get a runnable server project with a clean structure and sensible defaults.",
  },

  proof: {
    title: "Why Vix.cpp feels different",
    items: [
      {
        title: "Performance-first",
        text: "Designed for high throughput and low overhead. Benchmarks are reproducible and tied to commits.",
      },
      {
        title: "Developer Experience",
        text: "Clear errors, code frames, structured logs, and a runtime that behaves like a tool — not a puzzle.",
      },
      {
        title: "Registry workflow",
        text: "Discover, add, and publish C++ libraries with a simple workflow that matches how developers actually build.",
      },
    ],
  },

  demo: {
    title: "A tiny HTTP route",
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

  next: {
    title: "Next steps",
    bullets: [
      "Copy/paste ready examples (HTTP, WebSocket, middleware, JSON logs).",
      "A clean project layout (no magic, no boilerplate sprawl).",
      "Docs and Registry UI land on subdomains once the VPS is up.",
    ],
  },
};
