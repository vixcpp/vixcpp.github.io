export const batteries = {
  title: "One C++ runtime for many kinds of applications",
  subtitle:
    "Vix.cpp is not limited to web backends. It gives modern C++ a practical foundation for backend services, games, AI tools, realtime apps, P2P systems, local-first software, and production deployments.",

  items: [
    {
      title: "Backend services",
      text: "Build native C++ HTTP APIs, WebSocket services, middleware pipelines, template-rendered pages, and database-backed applications with the Vix.cpp runtime.",
      href: "https://docs.vixcpp.com/guides/build-rest-api",
      preview: {
        title: "backend",
        lines: ["$ vix new api --template backend", "$ cd api", "$ vix dev"],
      },
    },

    {
      title: "Games",
      text: "Create C++ game projects with a runtime foundation for loops, frames, scenes, assets, jobs, and native application workflows.",
      href: "https://docs.vixcpp.com/templates/game",
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
      text: "Run local AI workflows that can analyze projects, inspect files, use memory, and work directly with your C++ codebase.",
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
      text: "Build WebSocket and event-driven C++ applications with runtime modules designed for long-running native services.",
      href: "https://docs.vixcpp.com/modules/websocket/",
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
      text: "Use Vix.cpp foundations for peer-to-peer nodes, distributed tools, and resilient systems that can operate beyond a single server.",
      href: "https://docs.vixcpp.com/modules/p2p/",
      preview: {
        title: "p2p",
        lines: ["$ vix p2p", "$ vix new node", "$ vix run"],
      },
    },

    {
      title: "Production services",
      text: "Move from local development to real deployment with builds, services, health checks, proxy validation, logs, diagnostics, and deploy workflows.",
      href: "https://docs.vixcpp.com/cli/deploy",
      preview: {
        title: "production",
        lines: [
          "$ vix build",
          "$ vix deploy --dry-run",
          "$ vix doctor production",
        ],
      },
    },
  ],
};
