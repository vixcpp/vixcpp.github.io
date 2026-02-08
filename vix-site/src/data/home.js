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
    support: {
      title: "Production ready",
      meta: ["Native C++ binaries", "MIT licensed"],
    },
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

  signals: {
    title: "Project signals",
    subtitle: "Live GitHub stats with safe fallback.",
    items: [
      {
        title: "Stars",
        kind: "github",
        field: "stars",
        meta: ["Stars on GitHub"],
      },
      {
        title: "Forks",
        kind: "github",
        field: "forks",
        meta: ["Community forks"],
      },
      {
        title: "Open issues",
        kind: "github",
        field: "open_issues",
        meta: ["Active issues"],
      },
    ],
  },

  batteries: {
    title: "What ships with Vix",
    items: [
      { title: "Native runtime", text: "Compiled C++ binaries. No VM. No GC." },
      {
        title: "HTTP + WebSocket",
        text: "One execution model for APIs and realtime.",
      },
      { title: "CLI workflow", text: "build, run, dev, pack, verify." },
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
