export const HOME = {
  hero: {
    title: "Modern C++ runtime.",
    subtitle:
      "A modern runtime for building and running C++ applications. No setup. No CMake. No friction.",
    ctas: [
      { label: "Install", to: "/install", kind: "primary" },
      {
        label: "Get started",
        href: "/docs/",
        kind: "secondary",
        external: true,
      },
    ],
    badges: [],
    support: {
      title: "Built for serious systems",
      meta: [
        "Native C++ binaries",
        "Offline-first architecture",
        "MIT licensed",
      ],
    },
    examples: [
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
        key: "ws",
        label: "WebSocket",
        lang: "cpp",
        file: "ws.cpp",
        code: `#include <vix/websocket.hpp>

int main()
{
  vix::websocket::Server ws;

  ws.on_text([](auto&, std::string_view msg) {
    // realtime messaging
  });

  ws.listen_blocking(9090);
}`,
      },
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

  app.get("/", [](Request&, Response& res) {
    res.send("Hello");
  });

  app.run(8080);
}`,
      },
      {
        key: "run",
        label: "vix run",
        lang: "shell",
        file: "",
        code: `~$ vix run server.cpp
● Vix.cpp READY

› HTTP:  http://localhost:8080/
i Hint: Ctrl+C to stop`,
      },
    ],
  },

  install: {
    title: "Install Vix.cpp",
    version: "1.47.0",
    note: "Latest release",
    commands: {
      unix: "curl -fsSL https://vixcpp.com/install.sh | bash",
      windows: "irm https://vixcpp.com/install.ps1 | iex",
    },
  },

  showcase: {
    heading: "All your favorite C++ tools, built-in and ready to go",
    subheading:
      "Vix runs modern C++ instantly with zero configuration. No CMake. No setup. No friction.",
    visual: {
      fileName: "main.cpp",
      code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;iostream&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>() {
  std::cout &lt;&lt; <span class="cpp-string">"Hello, Vix!"</span> &lt;&lt; "\\n";
  <span class="cpp-keyword">return</span> 0;
}`,
      terminal: `<span class="vix-terminal-green">$ vix run main.cpp</span>
Hello, Vix!`,
    },
    content: {
      title: "Just run",
      badge: "C++",
      text: "Run C++ instantly with zero setup. No build system. No config. No friction. Just write and run.",
      cta: {
        label: "More about running with Vix",
        to: "/docs/modules/cli/run",
      },
    },
  },

  registryShowcase: {
    title: "Seamless",
    badge: "Registry",
    text: "Install packages from Vix Registry and use them in your C++ projects with a simple workflow.",
    cta: {
      label: "Explore Vix Registry",
      to: "/registry",
    },
    cards: {
      top: {
        fileName: "main.cpp",
        code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;pdf/pdf.hpp&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>() {
  pdf::Document doc;
  <span class="cpp-keyword">auto</span>&amp; page = doc.add_page();
  page.text(50,759,<span class="cpp-string">"Hello, world!"</span>,pdf::Font::Helvetica,
            24);
  doc.save(<span class="cpp-string">"hello.pdf"</span>);
}`,
      },

      bottom: {
        fileName: "terminal",
        code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix add</span> <span class="shell-flag">@gk/pdf</span>
<span class="shell-success">✔ added:</span> gk/pdf@0.1.0

<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span>
<span class="shell-success">✔ Dependencies ready</span>

<span class="shell-path">~$</span> <span class="shell-cmd">vix run</span> main.cpp --auto-deps
<span class="shell-success">✔ hello.pdf generated</span>`,
      },
    },
  },

  mission: {
    title: "Most runtimes assume perfect networks.",
    subtitle:
      "In reality, connections drop, latency spikes, and systems break. Yet most tools are built as if everything is always online and stable.",
    items: [
      {
        title: "The problem",
        text: "A simple network glitch can break requests, lose data, or stop systems entirely.",
      },
      {
        title: "What’s wrong today",
        text: "Most runtimes depend on constant connectivity and push complexity to developers.",
      },
      {
        title: "What Vix changes",
        text: "Vix is designed for unreliable networks. Your system keeps running, even when the network doesn’t.",
      },
    ],
  },

  useCases: {
    title: "What you can build with Vix",
    subtitle:
      "Vix is not limited to web servers. It is designed for systems that need performance, resilience, and control.",
    items: [
      {
        title: "Backend APIs",
        text: "Build fast native APIs and services with a modern C++ runtime.",
      },
      {
        title: "Realtime systems",
        text: "Run websocket, messaging, and event-driven services with low overhead.",
      },
      {
        title: "Peer-to-peer apps",
        text: "Build direct node-to-node systems for local-first and distributed architectures.",
      },
      {
        title: "Edge workloads",
        text: "Run services closer to users where connectivity and latency are unpredictable.",
      },
      {
        title: "Offline-first tools",
        text: "Create systems that continue to work even when the network is unstable.",
      },
      {
        title: "Developer tooling",
        text: "Ship native command line tools, scripts, and runtime-powered workflows.",
      },
    ],
  },

  principles: {
    title: "Built with different assumptions",
    subtitle:
      "Vix is designed around how systems behave in the real world, not in perfect lab conditions.",
    items: [
      {
        title: "Offline-first",
        text: "The network should not be a hard dependency for useful work.",
      },
      {
        title: "Native performance",
        text: "C++ gives direct control over performance, memory, and execution.",
      },
      {
        title: "Incremental adoption",
        text: "Use one tool or adopt more of the stack as your needs grow.",
      },
      {
        title: "Beyond web",
        text: "HTTP is supported, but Vix is designed for more than just web servers.",
      },
    ],
  },

  registry: {
    title: "A registry designed for unstable connectivity",
    subtitle:
      "Sync once, search locally, pin dependencies with vix.lock, and keep working even when your connection is unreliable.",
    note: "The registry supports offline-first development workflows, not just package installation.",
    ctas: [
      { label: "Registry docs", to: "/registry", kind: "primary" },
      {
        label: "Try vix search",
        to: "/registry#search",
        kind: "secondary",
      },
    ],
    preview: {
      title: "registry",
      code: `$ vix registry sync
$ vix search jwt
$ vix add @gk/jwt
$ vix install
$ cat vix.lock`,
    },
  },

  signals: {
    title: "Open-source project signals",
    subtitle:
      "Vix.cpp is developed in the open. These signals reflect real usage, active maintenance, and a growing ecosystem.",
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
        meta: ["Active engineering feedback"],
      },
    ],
  },

  batteries: {
    title: "Runtime, tooling, and workflow included",
    subtitle:
      "Vix ships the core pieces needed to build, run, iterate, package, and verify serious C++ applications.",
    items: [
      {
        title: "Fast project workflow",
        text: "Create projects, run them instantly, and iterate with dev mode.",
        href: "/docs/modules/cli/new",
        preview: {
          title: "workflow",
          lines: [
            "$ vix new api",
            "$ cd api && vix dev",
            "$ vix run server.cpp",
          ],
        },
      },
      {
        title: "Realtime and network modules",
        text: "Use modules for websocket, transport, and peer-to-peer capabilities when your application grows beyond plain HTTP.",
        href: "/docs/modules/cli/modules",
        preview: {
          title: "modules",
          lines: ["$ vix modules init", "$ vix modules add websocket"],
        },
      },
      {
        title: "Offline dependency workflows",
        text: "Sync dependencies once, lock them, and keep building even in unstable environments.",
        href: "/docs/modules/cli/registry",
        preview: {
          title: "registry",
          lines: [
            "$ vix registry sync",
            "$ vix search pdf",
            "$ vix add @gk/pdf",
            "$ vix install",
          ],
        },
      },
      {
        title: "Packaging and verification",
        text: "Package artifacts and verify what you ship with a security-focused workflow.",
        href: "/docs/modules/cli/pack",
        preview: {
          title: "pack + verify",
          lines: ["$ vix pack --version 1.0.0", "$ vix verify"],
        },
      },
    ],
  },

  getStarted: {
    title: "Get started in under a minute",
    subtitle:
      "Create a project, start dev mode, and begin building native backend or realtime services with Vix.",
    code: `vix new api
cd api
vix dev`,
    note: "Start with dev mode, then move to run, package, and deploy as your project grows.",
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
