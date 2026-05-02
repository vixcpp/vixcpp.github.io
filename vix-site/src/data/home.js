export const HOME = {
  hero: {
    title: "A modern C++ runtime.",
    subtitle:
      "Build fast, reliable, and offline-first C++ applications. Start with a single file, then grow into HTTP services, databases, realtime systems, P2P nodes, and durable sync workflows.",
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
        "Build native services",
        "Sync data offline",
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

  app.get("/", [](Request&, Response& res) {
    res.send("Hello from Vix");
  });

  app.run(8080);
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

  // Local writes stay durable.
  // Network sync can happen later.
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
      {
        key: "ws",
        label: "WebSocket",
        lang: "cpp",
        file: "ws.cpp",
        code: `#include <vix/websocket/Runtime.hpp>

int main()
{
  vix::config::Config config{".env"};
  auto executor = std::make_shared<vix::executor::RuntimeExecutor>(1u);
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
    ],
  },

  install: {
    title: "Install Vix.cpp",
    version: "2.5.2",
    note: "Latest stable release",
    commands: {
      unix: "curl -fsSL https://vixcpp.com/install.sh | bash",
      windows: "irm https://vixcpp.com/install.ps1 | iex",
    },
  },

  showcase: {
    heading: "Run C++ like a modern runtime",
    subheading:
      "Write a C++ file, run it directly, and move from prototype to real application without fighting the build system first.",
    visual: {
      fileName: "main.cpp",
      code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix/print.hpp&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
  std::vector&lt;<span class="cpp-keyword">int</span>&gt; ports{8080, 9090, 3000};
  vix::print(<span class="cpp-string">"Vix is ready"</span>);

  vix::print(<span class="cpp-string">"ports:"</span>, ports);
}`,
      terminal: `<span class="shell-prompt">$</span> <span class="shell-cmd">vix run</span> main.cpp
Vix is ready
ports: [8080, 9090, 3000]`,
    },
    content: {
      title: "Write. Run. Ship.",
      badge: "C++ runtime",
      text: "Vix removes the early friction from C++ development. Start with a single file, run it directly, then grow into projects, packages, servers, realtime systems, and production binaries.",
      cta: {
        label: "More about vix run",
        to: "https://docs.vixcpp.com/modules/cli/run",
      },
    },
  },

  registryShowcase: {
    title: "Packages without the friction",
    badge: "Registry",
    text: "Install packages from Vix Registry and use them in your C++ projects with a simple, predictable workflow.",
    cta: {
      label: "Explore Vix Registry",
      to: "https://registry.vixcpp.com",
    },
    cards: {
      top: {
        fileName: "main.cpp",
        code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;cnerium/app/app.hpp&gt;</span>

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
{
  cnerium::app::App app;
  app.listen(<span class="cpp-string">"127.0.0.1"</span>, <span class="cpp-type">8080</span>);
}`,
      },
      bottom: {
        fileName: "terminal",
        code: `<span class="shell-path">~$</span> <span class="shell-cmd">vix install</span> <span class="shell-flag">-g</span> cnerium/app
<span class="shell-success">✔</span> Installed cnerium/app

<span class="shell-path">~$</span> <span class="shell-cmd">vix run</span> main.cpp
<span class="shell-success">✔</span> Running on 127.0.0.1:8080`,
      },
    },
  },

  templateEngine: {
    title: "Built-in template engine",
    subtitle:
      "Render dynamic HTML from C++ with variables, loops, conditions, includes, layouts, caching, and streaming.",
    badge: "Template",
    cta: {
      label: "Read template docs",
      to: "https://docs.vixcpp.com/modules/template",
    },
    cards: {
      template: {
        fileName: "index.html",
        code: `<span class="tpl-tag">&lt;h1&gt;</span>{{ title }}<span class="tpl-tag">&lt;/h1&gt;</span>

<span class="tpl-tag">&lt;ul&gt;</span>
  {% for feature in features %}
    <span class="tpl-tag">&lt;li&gt;</span>{{ feature }}<span class="tpl-tag">&lt;/li&gt;</span>
  {% endfor %}
<span class="tpl-tag">&lt;/ul&gt;</span>`,
      },
      cpp: {
        fileName: "main.cpp",
        code: `<span class="cpp-directive">#include</span> <span class="cpp-include">&lt;vix.hpp&gt;</span>
<span class="cpp-keyword">using namespace</span> vix;

<span class="cpp-keyword">int</span> <span class="cpp-fn">main</span>()
{
  App app;
  app.templates(<span class="cpp-string">"./views"</span>);

  app.get(<span class="cpp-string">"/"</span>, [](Request &, Response &res) {
    vix::template_::Context ctx;
    ctx.set(<span class="cpp-string">"title"</span>, <span class="cpp-string">"Template Features"</span>);
    vix::template_::Array features;
    features.emplace_back(<span class="cpp-string">"Built-in template engine"</span>);
    ctx.set(<span class="cpp-string">"features"</span>, features);
    res.render(<span class="cpp-string">"index.html"</span>, ctx);
  });

  app.run(<span class="cpp-type">8080</span>);
}`,
      },
    },
  },

  registry: {
    title: "A registry designed for real development",
    subtitle:
      "Sync packages, lock dependencies with vix.lock, search locally, and keep your C++ workflow predictable even when connectivity is unreliable.",
    note: "The registry supports offline-first development workflows, not just package installation.",
    ctas: [
      {
        label: "Registry docs",
        to: "https://registry.vixcpp.com",
        kind: "primary",
      },
      {
        label: "Try vix search",
        to: "https://registry.vixcpp.com#search",
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
    title: "Everything you need to build real C++ apps",
    subtitle:
      "Vix gives C++ a complete application workflow: create projects, run files, generate code, check reliability, manage packages, and build networked systems.",

    items: [
      {
        title: "Start a project in seconds",
        text: "Create a Vix project, install dependencies, and start the development server with a workflow designed for fast iteration.",
        href: "https://docs.vixcpp.com/getting-started/create-project",
        preview: {
          title: "start",
          lines: ["$ vix new api", "$ cd api", "$ vix install", "$ vix dev"],
        },
      },

      {
        title: "Run C++ like a script",
        text: "Execute a single C++ file directly with vix run. Perfect for examples, experiments, small tools, and quick backend prototypes.",
        href: "https://docs.vixcpp.com/cli/run",
        preview: {
          title: "run",
          lines: ["$ vix run main.cpp", "$ vix run server.cpp"],
        },
      },

      {
        title: "Generate C++ scaffolding",
        text: "Use vix make to generate classes, structs, functions, tests, exceptions, concepts, and runtime config files from your terminal.",
        href: "https://docs.vixcpp.com/cli/make",
        preview: {
          title: "make",
          lines: [
            "$ vix make class User",
            "$ vix make function parse_token --in src/auth",
            "$ vix make test AuthService",
          ],
        },
      },

      {
        title: "Check before you ship",
        text: "Validate projects and single files with builds, tests, runtime checks, and sanitizers using one command.",
        href: "https://docs.vixcpp.com/cli/check",
        preview: {
          title: "check",
          lines: [
            "$ vix check",
            "$ vix check --tests --run",
            "$ vix check main.cpp --san",
          ],
        },
      },

      {
        title: "Manage C++ dependencies",
        text: "Add, install, update, list, and remove packages with a reproducible workflow built around Vix projects and the registry.",
        href: "https://docs.vixcpp.com/cli/add",
        preview: {
          title: "deps",
          lines: [
            "$ vix add @org/package",
            "$ vix install",
            "$ vix update",
            "$ vix list",
          ],
        },
      },

      {
        title: "Package and verify releases",
        text: "Create distributable packages and verify package integrity before sharing or publishing your application.",
        href: "https://docs.vixcpp.com/cli/pack",
        preview: {
          title: "ship",
          lines: ["$ vix pack", "$ vix verify", "$ vix cache"],
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
};

export default HOME;
