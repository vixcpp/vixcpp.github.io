export const hero = {
  title: "Build real applications with modern C++.",
  subtitle:
    "Vix.cpp is a modern C++ runtime and developer toolkit for building fast, reliable, production-ready applications. Start with a single C++ file, then grow into HTTP services, WebSocket apps, games, AI agents, P2P nodes, databases, package-based projects, and offline-first workflows.",
  ctas: [
    { label: "Install Vix.cpp", to: "/install", kind: "primary" },
    {
      label: "Read the docs",
      href: "https://docs.vixcpp.com",
      kind: "secondary",
      external: true,
    },
  ],
  badges: [],
  support: {
    title: "What Vix.cpp gives you",
    meta: [
      "Run C++ files directly",
      "Build native applications",
      "Use runtime modules",
      "Manage packages with the registry",
      "Ship MIT-licensed software",
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
};
