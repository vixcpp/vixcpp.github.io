export const HOME = {
  hero: {
    title: "Offline-first C++ runtime.",
    subtitle:
      "A modern C++ runtime and serious alternative to Node.js, Deno, and Bun, designed for unreliable networks and native performance.",
    ctas: [
      { label: "Get Vix.cpp", to: "/install", kind: "primary" },
      {
        label: "View on GitHub",
        href: "https://github.com/vixcpp/vix",
        kind: "secondary",
        external: true,
      },
    ],
    badges: [],
    examples: [
      {
        key: "http",
        label: "HTTP",
        lang: "cpp",
        file: "server.cpp",
        code: `#include <vix.hpp>
using namespace vix;

int main()
{
  App app;

  app.get("/", [](Request&, Response& res){
    res.send("Hello");
  });

  app.run(8080);
}`,
      },

      {
        key: "ws",
        label: "WebSocket",
        lang: "cpp",
        file: "ws.cpp",
        code: `#include <vix/websocket.hpp>

int main()
{
  vix::websocket::Server ws;

  ws.on_text([](auto&, std::string_view msg){
    // echo
  });

  ws.listen_blocking(9090);
}`,
      },

      {
        key: "p2p",
        label: "P2P",
        lang: "cpp",
        file: "p2p.cpp",
        code: `#include <vix/p2p/P2P.hpp>

int main()
{
  vix::p2p::P2PRuntime p2p;
  p2p.listen(9001);

  p2p.start();
  p2p.wait();
}`,
      },

      {
        key: "async",
        label: "Async",
        lang: "cpp",
        file: "async.cpp",
        code: `#include <vix/async.hpp>
using namespace vix;

task<void> main_task()
{
  co_await sleep_for(50ms);
  co_return;
}

int main()
{
  async::run(main_task());
}`,
      },

      {
        key: "run",
        label: "vix run",
        lang: "shell",
        file: "",
        code: `~$ vix run server.cpp
● Vix.cpp  READY  v1.21.1

› HTTP:  http://localhost:8080/
i Hint:  Ctrl+C to stop`,
      },
    ],
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
};

export default HOME;
