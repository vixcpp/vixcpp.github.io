export const batteries = {
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
};
