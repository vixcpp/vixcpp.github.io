export const HOME = {
  hero: {
    title: "Offline-first. Peer-to-peer. Ultra-fast C++ runtime.",
    subtitle:
      "Vix.cpp is a modern C++ runtime built as a serious alternative to Node.js, Deno, and Bun. It is designed for unreliable networks, offline-first workflows, peer-to-peer systems, and extreme native performance.",
    ctas: [
      { label: "Install", to: "/install", kind: "primary" },
      { label: "See examples", to: "/examples", kind: "secondary" },
    ],
    badges: [
      "Offline-first runtime",
      "Peer-to-peer ready",
      "HTTP and WebSocket",
      "Script mode and dev hot-reload",
    ],
    terminal: {
      title: "Script mode",
      code: `~$ vix run server.cpp
● Vix.cpp  READY  v1.21.1  (1 ms)

› HTTP:    http://localhost:8080/
i Threads: 8/8
i Mode:    run
i Status:  ready
i Hint:    Ctrl+C to stop`,
      note: "Run a single .cpp file like a script. Minimal boilerplate. Instant server.",
    },
  },

  workflow: {
    title: "A simple and complete workflow",
    subtitle:
      "Write routes, iterate fast, then package and verify for safe distribution.",
    items: [
      {
        title: "1) Write",
        text: "Define HTTP routes or WebSocket handlers in modern C++ with a predictable structure and minimal boilerplate.",
      },
      {
        title: "2) Run or Dev",
        text: "Use vix run for one-shot execution or vix dev for hot-reload while you iterate.",
      },
      {
        title: "3) Pack and Verify",
        text: "Package applications and verify artifacts for safe and reproducible distribution.",
      },
    ],
  },

  demo: {
    title: "It really is this simple",
    subtitle: "A tiny HTTP route you can run immediately.",
    code: `#include <vix.hpp>

using namespace vix;

int main() {
  App app;

  app.get("/", [](Request&, Response& res) {
    res.send("Hello, world");
  });

  app.run(8080);
  return 0;
}`,
    run: "vix run server.cpp",
    out: `~$ http :8080
HTTP/1.1 200 OK
Content-Type: text/plain
Server: Vix/master

Hello, world

~$`,
    note: "Core Vix style with vix.hpp, App, Request and Response handlers, and app.run(port).",
  },

  why: {
    title: "Why Vix exists",
    subtitle: "Most runtimes assume stable internet. That is not reality.",
    items: [
      {
        title: "Built for real conditions",
        text: "Designed for unstable networks, offline-first environments, edge deployments, and peer-to-peer systems.",
      },
      {
        title: "Predictable performance",
        text: "Native performance with control and consistency. No garbage collector pauses. No surprise overhead.",
      },
      {
        title: "Developer experience",
        text: "Clear errors, code frames, structured logs, and a CLI that behaves like a real tool.",
      },
    ],
  },

  proof: {
    title: "Trust, not hype",
    subtitle:
      "Built to be verifiable in behavior, performance, and distribution.",
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
        title: "Safe distribution",
        text: "Packaging and verification make delivery deterministic and secure.",
      },
    ],
  },

  batteries: {
    title: "What you get",
    subtitle:
      "Everything needed to build, run, and ship backend services in one system.",
    items: [
      {
        title: "Unified CLI",
        text: "One workflow covering new, build, run, dev, check, tests, pack, verify, and registry.",
      },
      {
        title: "Script mode",
        text: "Run a single C++ file like a script using vix run file.cpp.",
      },
      {
        title: "HTTP and WebSocket runtime",
        text: "Build APIs and realtime systems with a shared execution model.",
      },
      {
        title: "Middleware pipeline",
        text: "Composable request handling with deterministic control flow.",
      },
      {
        title: "Packaging and verification",
        text: "Create distributable artifacts and verify them before installation.",
      },
      {
        title: "Registry workflow",
        text: "Discover, add, and publish reusable C++ libraries with an offline-friendly flow.",
      },
    ],
  },

  showcase: {
    title: "Real-time systems with WebSocket",
    subtitle:
      "A WebSocket chat example with rooms, broadcast, message history, and shared runtime with HTTP routes.",
    bullets: [
      "Rooms and broadcast",
      "Message history",
      "Typed events",
      "HTTP and WebSocket in one runtime",
    ],
    media: {
      image: "/assets/images/vix-ws-chat.png",
      alt: "Vix.cpp WebSocket chat example",
      caption: "Example chat running on the Vix.cpp WebSocket runtime.",
    },
  },

  getStarted: {
    title: "Get started in under a minute",
    subtitle: "Create a project, start dev mode, and iterate with hot-reload.",
    code: `vix new api
cd api
vix dev`,
    note: "Start with dev hot-reload, then switch to run or package when ready.",
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
      "One tool for the full workflow including scaffolding, running, hot-reload, packaging, verification, and registry.",
    code: `~$ vix -h
Vix.cpp Modern C++ backend runtime
Version: 1.21.1

Usage:
  vix <command> [options] [args...]

Quick start:
  vix new api
  cd api && vix dev
  vix pack --version 1.0.0 && vix verify

Commands:
  Project:
    new <name>               Create a new Vix project
    build [name]             Configure and build
    run   [name] [--args]    Build if needed then run
    dev   [name]             Dev mode with hot-reload
    check [path]             Validate a project or compile a single .cpp
    tests [path]             Run tests
    repl                     Start interactive Vix REPL

  Registry:
    registry <subcommand>    Manage registry index
    add <pkg>@<version>      Add dependency
    search <query>           Search packages
    remove <pkg>             Remove dependency
    list                     List dependencies
    publish <version>        Publish to registry

  Packaging:
    pack                     Create a distributable artifact
    verify                   Verify an artifact
    install                  Install an artifact

Global options:
  --verbose                  Enable debug logs
  --log-level <level>        trace debug info warn error critical
  -h, --help                 Show help
  -v, --version              Show version info`,
  },
};

export default HOME;
