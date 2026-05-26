export const HOME = {
  hero: {
    title: "A modern C++ runtime.",
    subtitle:
      "Build fast native applications with a modern developer workflow. Start with a single file, then grow into HTTP services, games, AI agents, WebSocket apps, P2P nodes, databases, and offline-first sync workflows.",
    ctas: [
      { label: "Install", to: "/install", kind: "primary" },
      {
        label: "Get started",
        href: "https://docs.vixcpp.com",
        kind: "secondary",
        external: true,
      },
    ],
    badges: [],
    support: {
      title: "What Vix gives you",
      meta: [
        "Run C++ files directly",
        "Build native applications",
        "Use runtime modules",
        "Ship MIT-licensed apps",
      ],
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

  app.get("/", [](Request &, Response &res) {
    res.send("Hello from Vix");
  });

  app.run(8080);
}`,
      },
      {
        key: "game",
        label: "Game",
        lang: "cpp",
        file: "game.cpp",
        code: `#include <vix/game/game.hpp>

int main()
{
  vix::game::App app;

  app.set_title("Tiny Adventure");
  app.set_target_fps(60);

  app.on_update([](const vix::game::Frame &frame) {
    // update player, world, physics, assets
  });

  app.run();
}`,
      },
      {
        key: "agent",
        label: "Agent",
        lang: "cpp",
        file: "agent.cpp",
        code: `#include <vix/agent.hpp>

int main()
{
  vix::ai::Agent agent;

  agent
    .set_model("local:llama")
    .set_workspace(".")
    .add_tool("filesystem")
    .add_memory(".vix/ai/memory");

  agent.run("Analyze this project.");
}`,
      },
      {
        key: "ws",
        label: "WebSocket",
        lang: "cpp",
        file: "ws.cpp",
        code: `#include <vix/websocket/Runtime.hpp>

int main()
{
  vix::config::Config config{".env"};
  auto executor =
    std::make_shared<vix::executor::RuntimeExecutor>(1u);

  vix::websocket::Server ws{config, executor};

  ws.on_message([](auto &, const std::string &msg) {
    // realtime message
  });

  ws.listen_blocking();
}`,
      },
      {
        key: "p2p",
        label: "P2P",
        lang: "cpp",
        file: "p2p.cpp",
        code: `#include <vix/p2p/all.hpp>

int main()
{
  vix::p2p::NodeConfig cfg;
  cfg.node_id = "node-a";
  cfg.listen_port = 9001;

  auto node = vix::p2p::make_tcp_node(cfg);
  vix::p2p::P2PRuntime p2p(node);

  p2p.start();
  p2p.stop();
}`,
      },
      {
        key: "sync",
        label: "Sync",
        lang: "cpp",
        file: "sync.cpp",
        code: `#include <vix/sync/Sync.hpp>

int main()
{
  using namespace vix::sync;
  using namespace vix::sync::outbox;

  Operation op;
  op.kind = "fs.write.sync";
  op.target = "/sync/file";
  op.payload = R"({"path":"note.txt","content":"hello"})";

  return 0;
}`,
      },
      {
        key: "db",
        label: "Database",
        lang: "cpp",
        file: "db.cpp",
        code: `#include <vix/db/db.hpp>

int main()
{
  auto db = vix::db::Database::sqlite("app.db");

  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
  db.exec("INSERT INTO users (name) VALUES (?)", "Ada");

  auto rows = db.query("SELECT id, name FROM users");

  return 0;
}`,
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // INSTALL — bandeau central, one-liner copy
  // ---------------------------------------------------------------------------
  install: {
    title: "Install Vix.cpp",
    version: "2.6.0",
    note: "Latest stable release • Updated this week",
    commands: {
      unix: "curl -fsSL https://vixcpp.com/install.sh | bash",
      windows: "irm https://vixcpp.com/install.ps1 | iex",
      brew: "brew install vixcpp/tap/vix",
    },
  },

  showcase: {
    heading: "Describe a C++ app in one small file",
    subheading:
      "Use vix.app to start real C++ projects without writing CMake configuration first.",
    visual: {
      fileName: "vix.app",
      code: `<span class="cpp-var">name</span> = <span class="cpp-string">hello</span>
<span class="cpp-var">type</span> = <span class="cpp-string">executable</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">c++20</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">src/main.cpp</span>,
]

<span class="cpp-var">include_dirs</span> = [
  <span class="cpp-string">include</span>,
]`,
      terminal: `<span class="shell-prompt">$</span> <span class="shell-cmd">vix build</span>
✔ Built hello

<span class="shell-prompt">$</span> <span class="shell-cmd">vix run</span>
Hello from Vix`,
    },
    content: {
      title: "Start simple. Grow when needed.",
      badge: "vix.app",
      text: "vix.app lets you describe a C++ application with a small manifest. Vix generates the internal build project and keeps the workflow simple while staying compatible with CMake.",
      cta: {
        label: "More about vix.app",
        to: "https://docs.vixcpp.com/vix-app/",
      },
    },
  },

  registryShowcase: {
    title: "Packages without the friction",
    badge: "Registry",
    text: "Add dependencies, lock versions, install packages, and reuse cached builds with a predictable C++ workflow.",
    cta: {
      label: "Explore Vix Registry",
      to: "https://registry.vixcpp.com",
    },
    cards: {
      top: {
        fileName: "vix.app",
        code: `<span class="cpp-var">name</span> = <span class="cpp-string">api</span>
<span class="cpp-var">type</span> = <span class="cpp-string">executable</span>
<span class="cpp-var">standard</span> = <span class="cpp-string">c++20</span>

<span class="cpp-var">sources</span> = [
  <span class="cpp-string">src/main.cpp</span>,
]

<span class="cpp-var">deps</span> = [
  <span class="cpp-string">@softadastra/json</span>,
]`,
      },
      bottom: {
        fileName: "terminal",
        code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix add</span> @softadastra/json
<span class="shell-success">✔</span> Added package

<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span>
<span class="shell-success">✔</span> Dependencies installed

<span class="shell-path">~$</span> <span class="shell-cmd">vix build</span>
<span class="shell-success">✔</span> Build completed`,
      },
    },
  },

  templateEngine: {
    title: "Built-in template engine",
    subtitle:
      "Render HTML from C++ with variables, conditions, loops, includes, layouts, caching, and streaming.",
    badge: "Template",
    cta: {
      label: "Read template docs",
      to: "https://docs.vixcpp.com/modules/template",
    },
    cards: {
      template: {
        fileName: "views/index.html",
        code: `<span class="tpl-tag">&lt;h1&gt;</span>{{ title }}<span class="tpl-tag">&lt;/h1&gt;</span>

{% if user %}
  <span class="tpl-tag">&lt;p&gt;</span>Hello {{ user.name }}<span class="tpl-tag">&lt;/p&gt;</span>
{% endif %}

{% for item in items %}
  <span class="tpl-tag">&lt;span&gt;</span>{{ item }}<span class="tpl-tag">&lt;/span&gt;</span>
{% endfor %}`,
      },
      cpp: {
        fileName: "main.cpp",
        code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix.hpp&gt;</span>
<span class="cpp-keyword">using namespace</span> vix;

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>(){
  App app;
  app.templates(<span class="cpp-string">"./views"</span>);

  app.get(<span class="cpp-string">"/"</span>, [](Request &, Response &res) {
    tmpl::Context ctx;
    ctx.set(<span class="cpp-string">"title"</span>, <span class="cpp-string">"Vix Templates"</span>);

    res.render(<span class="cpp-string">"index.html"</span>, ctx);
  });

  app.run(<span class="cpp-type">8080</span>);
}`,
      },
    },
  },

  releaseFocus: {
    title: "Vix.cpp 2.6.0 expands the runtime",
    subtitle:
      "This release makes the direction clearer: Vix is not only for web backends. It is becoming a broader runtime for C++ applications.",
    note: "Web is one use case. The runtime is bigger.",
    ctas: [
      {
        label: "Read release notes",
        to: "https://docs.vixcpp.com/releases/v2.6.0",
        kind: "primary",
      },
      {
        label: "Read the blog",
        to: "https://blog.vixcpp.com",
        kind: "secondary",
      },
    ],
    preview: {
      title: "v2.6.0",
      code: `$ vix new mario --template game
$ vix agent analyze .
$ vix build --fast
$ vix check --san --tests
$ vix deploy --dry-run`,
    },
  },

  signals: {
    title: "Open-source project signals",
    subtitle:
      "Vix.cpp is developed in the open. These signals reflect real usage, active maintenance, and a growing C++ ecosystem.",
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
    title: "One runtime for many C++ applications",
    subtitle:
      "Vix is not limited to web backends. It gives C++ a modern foundation for building services, games, AI tools, realtime apps, distributed systems, and production software.",

    items: [
      {
        title: "Backend services",
        text: "Build fast HTTP APIs, WebSocket services, middleware pipelines, template-rendered pages, and database-backed applications.",
        href: "https://docs.vixcpp.com",
        preview: {
          title: "backend",
          lines: ["$ vix new api --template backend", "$ cd api", "$ vix dev"],
        },
      },

      {
        title: "Games",
        text: "Create game projects with a runtime foundation for loops, frames, scenes, assets, jobs, and export workflows.",
        href: "https://docs.vixcpp.com/modules/game",
        preview: {
          title: "game",
          lines: [
            "$ vix new tiny-adventure --template game",
            "$ cd tiny-adventure",
            "$ vix run",
          ],
        },
      },

      {
        title: "AI agents",
        text: "Run local AI workflows that can analyze projects, inspect files, use memory, and work with your C++ codebase.",
        href: "https://docs.vixcpp.com/cli/agent",
        preview: {
          title: "agent",
          lines: [
            '$ vix agent ask "Explain this code"',
            "$ vix agent analyze .",
            "$ vix agent scan .",
          ],
        },
      },

      {
        title: "Realtime systems",
        text: "Build WebSocket and event-driven applications with runtime modules designed for long-running native services.",
        href: "https://docs.vixcpp.com/modules/websocket",
        preview: {
          title: "realtime",
          lines: [
            "$ vix new chat --template backend",
            "$ vix dev",
            "$ vix ws check",
          ],
        },
      },

      {
        title: "P2P applications",
        text: "Use Vix foundations for peer-to-peer nodes, distributed tools, and resilient systems that can operate beyond a single server.",
        href: "https://docs.vixcpp.com/modules/p2p",
        preview: {
          title: "p2p",
          lines: ["$ vix p2p", "$ vix new node", "$ vix run"],
        },
      },

      {
        title: "Production services",
        text: "Move from local development to real deployment with health checks, service management, proxy validation, logs, and deploy workflows.",
        href: "https://docs.vixcpp.com/cli/production",
        preview: {
          title: "production",
          lines: [
            "$ vix health public",
            "$ vix proxy nginx check",
            "$ vix deploy --dry-run",
          ],
        },
      },
    ],
  },

  getStarted: {
    title: "Start building fast and reliable C++ applications",
    subtitle:
      "Create a project, start dev mode, and begin building native backend, realtime, CLI, or systems applications with Vix.",
    code: `vix new api
cd api
vix build
vix dev`,
    note: "Start with dev mode, then move to run, package, registry, and deployment workflows as your project grows.",
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

  stableFoundation: {
    eyebrow: "Stable foundation",
    title: "What Vix.cpp already provides",
    subtitle:
      "Vix.cpp already includes the core pieces needed to build, run, test, package, and document modern C++ applications with less friction.",
    cta: {
      label: "View the roadmap",
      to: "/roadmap",
    },
    items: [
      {
        label: "Developer workflow",
        title: "Project workflow",
        text: "Create projects, install dependencies, run locally, build, test, format, verify, and package C++ applications with a cleaner workflow.",
      },
      {
        label: "Runtime foundation",
        title: "Runtime and modules",
        text: "Use a growing runtime foundation with modules such as async, cache, core, db, fs, json, kv, log, middleware, net, orm, p2p, process, sync, threadpool, validation, websocket, and webrpc.",
      },
      {
        label: "Registry",
        title: "Package and registry workflow",
        text: "Install, publish, cache, verify, and reuse Vix packages through the registry and local package store.",
      },
      {
        label: "Platform",
        title: "Application foundation",
        text: "Build native applications, backend services, local-first systems, offline-first workflows, and production-ready tools on top of Vix.cpp.",
      },
    ],
  },
};

export default HOME;
