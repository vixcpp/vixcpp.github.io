// src/data/home.js

export const HOME = {
  hero: {
    title: "A modern C++ backend runtime.",
    subtitle:
      "Vix.cpp is a modern C++ runtime for HTTP and WebSocket services, focused on performance, clean developer experience, and practical workflows.",
    ctas: [
      { label: "Install", to: "/install", kind: "primary" },
      { label: "See examples", to: "/examples", kind: "secondary" },
    ],
    badges: [
      "Modern C++ runtime",
      "HTTP + WebSocket",
      "Script mode",
      "Dev hot-reload",
    ],
    terminal: {
      title: "vix run (script mode)",
      code: `~$ vix run server.cpp
1:17:34 PM  ● Vix.cpp   READY   v1.16.2 (1 ms)   run

  › HTTP:   http://localhost:8080/
  i Threads:8/8
  i Mode:   run
  i Status: ready
  i Hint:   Ctrl+C to stop the server`,
      note: "Run a single .cpp file like a script. Zero boilerplate, instant server.",
    },
  },

  workflow: {
    title: "A simple, complete workflow",
    subtitle: "Write routes, iterate fast, then package for safe distribution.",
    items: [
      {
        title: "1) Write",
        text: "Define HTTP routes or WebSocket handlers in modern C++ with minimal boilerplate and a predictable structure.",
      },
      {
        title: "2) Run / Dev",
        text: "Use vix run for one-shot execution, or vix dev for hot-reload while you iterate.",
      },
      {
        title: "3) Pack & Verify",
        text: "Package and verify apps with built-in tooling for safe, reproducible distribution.",
      },
    ],
  },

  demo: {
    title: "A tiny HTTP route",
    subtitle: "Minimal code, run, expected output.",
    code: `#include <vix.hpp>
using namespace vix;

int main()
{
  App app;

  app.get("/api/ping", [](Request&, Response& res) {
    res.json({ "ok", true, "message", "pong" });
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
    note: "Core Vix.cpp style: vix.hpp, Request/Response handlers, app.run(port).",
  },

  why: {
    title: "Why Vix.cpp feels different",
    subtitle: "Three reasons developers stick with it after the first run.",
    items: [
      {
        title: "Performance-first",
        text: "Designed for low overhead and predictable behavior under load, tuned for server-side throughput.",
      },
      {
        title: "Developer Experience",
        text: "Clear errors, code frames, structured logs, and a CLI that behaves like a tool, not a puzzle.",
      },
      {
        title: "Practical runtime",
        text: "HTTP, WebSocket, middleware, packaging, and registry workflows in one coherent system.",
      },
    ],
  },

  proof: {
    title: "Trust, not hype",
    subtitle:
      "Built to be verifiable: behavior, performance, and distribution.",
    items: [
      {
        title: "Open-source",
        text: "Developed in the open with a source-first workflow.",
      },
      {
        title: "Reproducible",
        text: "Benchmarks and behavior are tied to commits and can be reproduced.",
      },
      {
        title: "Real usage",
        text: "Built to power real services: APIs, realtime, and tooling workflows.",
      },
    ],
  },

  batteries: {
    title: "Batteries included",
    subtitle: "Everything you need to build, run, and ship backend services.",
    items: [
      {
        title: "Unified CLI",
        text: "One workflow: new, build, run, dev, check, tests, pack, verify.",
      },
      {
        title: "Script mode",
        text: "Run a single .cpp file like a script with vix run file.cpp.",
      },
      {
        title: "WebSocket runtime",
        text: "Typed events, broadcast patterns, realtime-friendly building blocks.",
      },
      {
        title: "Middleware pipeline",
        text: "Composable request handling with predictable control flow.",
      },
      {
        title: "Structured logging",
        text: "JSON-friendly logs and debug/trace levels for production diagnosis.",
      },
      {
        title: "Packaging and verification",
        text: "Package apps and verify artifacts for safer distribution.",
      },
      {
        title: "Registry workflow",
        text: "Discover, add, and publish reusable C++ libraries with a clean CLI flow.",
      },
    ],
  },

  showcase: {
    title: "Real-time systems built with Vix.cpp",
    subtitle:
      "A real WebSocket chat example with rooms, message history, typed events, and shared execution with HTTP routes.",
    bullets: [
      "Rooms and broadcast",
      "Message history",
      "Typed WebSocket events",
      "Shared runtime with HTTP",
    ],
    media: {
      image: "/assets/images/vix-ws-chat.png",
      alt: "Vix.cpp WebSocket chat example (rooms + history)",
      caption:
        "Example chat running on the Vix.cpp WebSocket runtime (rooms + history + typed events).",
    },
  },

  getStarted: {
    title: "Get started in under a minute",
    subtitle: "Create a project, start dev mode, iterate with hot-reload.",
    code: `vix new api
cd api
vix dev`,
    note: "Start in dev mode with hot-reload, then switch to run or package when ready.",
    ctas: [
      { label: "Install Vix.cpp", to: "/install", kind: "primary" },
      {
        label: "View on GitHub",
        href: "https://github.com/vixcpp/vix",
        kind: "secondary",
        external: true,
      },
    ],
  },
  cli: {
    title: "CLI at a glance",
    subtitle:
      "One tool for the full workflow: scaffold, run, hot-reload, packaging, verification, registry.",
    code: `~$ vix -h
Vix.cpp  Modern C++ backend runtime
Version: 1.21.1

Usage:
  vix <command> [options] [args...]
  vix help <command>

Quick start:
  vix new api
  cd api && vix dev
  vix pack --version 1.0.0 && vix verify

Commands:
  Project:
    new <name>               Create a new Vix project in ./<name>
    build [name]             Configure + build (root project or app)
    run   [name] [--args]    Build (if needed) then run
    dev   [name]             Dev mode (watch, rebuild, reload)
    check [path]             Validate a project or compile a single .cpp (no execution)
    tests [path]             Run project tests (alias of check --tests)
    repl                     Start interactive Vix REPL

  Project structure:
    modules <subcommand>     Opt-in module system (init/add/check)

  Registry:
    registry <subcommand>    Sync/search registry index (git-based)
    add <pkg>@<version>      Add a dependency from registry (pins commit)
    search <query>           Search packages in local registry index (offline)
    remove <pkg>             Remove a dependency from vix.lock
    list                     List project dependencies from vix.lock
    store <subcommand>       Manage local store cache (gc/path)
    publish <version>        Publish current repo to registry (JSON + PR)
    deps                     Install deps from vix.lock (generate .vix/vix_deps.cmake)

  Packaging and security:
    pack   [options]         Create dist/<name>@<version> (+ optional .vixpkg)
    verify [options]         Verify dist/<name>@<version> or a .vixpkg artifact
    install [options]        Install dist/<name>@<version> or a .vixpkg into the local store

  Database (ORM):
    orm <subcommand>         Migrations/status/rollback

Info:
  help [command]             Show help for CLI or a specific command
  version                    Show version information

Global options:
  --verbose                  Enable debug logs (equivalent to --log-level debug)
  -q, --quiet                Only show warnings and errors
  --log-level <level>        trace|debug|info|warn|error|critical
  -h, --help                 Show CLI help (or: vix help)
  -v, --version              Show version info

Links:
  GitHub: https://github.com/vixcpp/vix`,
  },
};

export default HOME;
