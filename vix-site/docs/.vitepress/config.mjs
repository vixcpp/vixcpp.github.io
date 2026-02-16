import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "Vix.cpp",
  description:
    "Modern C++ backend runtime for offline-first, P2P, and high-performance applications.",

  // Published at https://vixcpp.com/docs/
  base: "/docs/",

  markdown: {
    html: true,
  },

  head: [
    ["link", { rel: "icon", href: "/assets/pwa/icon-192.png" }],
    ["meta", { name: "theme-color", content: "#0b0e14" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
  ],

  vite: {
    optimizeDeps: {
      include: ["mark.js", "minisearch"],
    },
    ssr: {
      noExternal: ["mark.js"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("minisearch")) return "minisearch";
            if (id.includes("mark.js")) return "markjs";
            return "vendor";
          },
        },
      },
    },
  },

  themeConfig: {
    siteTitle: "Vix.cpp",
    logo: "/assets/pwa/icon-192.png",
    appearance: true,

    nav: [
      { text: "Home", link: "https://vixcpp.com/" },
      { text: "Docs", link: "/quick-start" },
      { text: "Registry", link: "https://vixcpp.com/registry/" },
      { text: "GitHub", link: "https://github.com/vixcpp/vix" },
    ],

    sidebar: [
      // 1) Start here
      {
        text: "Get started",
        collapsed: false,
        items: [
          { text: "Quick Start", link: "/quick-start" },
          { text: "Installation", link: "/install" },
          { text: "Project Setup", link: "/project-setup" },
          { text: "Guides", link: "/guide" },
        ],
      },

      // 2) Concepts before deep dives
      {
        text: "Fundamentals",
        collapsed: false,
        items: [
          { text: "Core Concepts", link: "/fundamentals" },
          { text: "App Lifecycle", link: "/fundamentals/lifecycle" },
          { text: "Error Handling", link: "/fundamentals/errors" },
          { text: "Logging", link: "/fundamentals/logging" },
          { text: "Performance", link: "/fundamentals/performance" },
          { text: "Security", link: "/fundamentals/security" },
        ],
      },

      // 3) People want to see working stuff early
      {
        text: "Examples",
        collapsed: false,
        items: [
          { text: "All Examples", link: "/examples/" },
          { text: "Hello HTTP", link: "/examples/hello-http" },
          { text: "Auth Middleware", link: "/examples/auth" },
          { text: "WebSocket Chat", link: "/examples/ws-chat" },
          { text: "Async Worker", link: "/examples/async" },
        ],
      },

      // 4) CLI is usually next after examples
      {
        text: "CLI",
        collapsed: true,
        items: [
          { text: "Overview", link: "/modules/cli/index" },

          { text: "vix repl", link: "/modules/cli/repl" },
          { text: "vix modules", link: "/modules/cli/modules" },

          {
            text: "Project",
            collapsed: true,
            items: [
              { text: "vix new", link: "/modules/cli/new" },
              { text: "vix build", link: "/modules/cli/build" },
              { text: "vix run", link: "/modules/cli/run" },
              { text: "vix dev", link: "/modules/cli/dev" },
              { text: "vix tests", link: "/modules/cli/tests" },
            ],
          },

          {
            text: "Registry",
            collapsed: true,
            items: [
              { text: "vix search", link: "/modules/cli/search" },
              { text: "vix add", link: "/modules/cli/add" },
              { text: "vix remove", link: "/modules/cli/remove" },
              { text: "vix list", link: "/modules/cli/list" },
              { text: "vix publish", link: "/modules/cli/publish" },
              { text: "vix registry", link: "/modules/cli/registry" },
              { text: "vix deps", link: "/modules/cli/deps" },
            ],
          },

          {
            text: "Packaging",
            collapsed: true,
            items: [
              { text: "vix pack", link: "/modules/cli/pack" },
              { text: "vix verify", link: "/modules/cli/verify" },
              { text: "vix install", link: "/modules/cli/install" },
            ],
          },

          {
            text: "Database",
            collapsed: true,
            items: [{ text: "vix orm", link: "/modules/cli/orm" }],
          },

          {
            text: "Network",
            collapsed: true,
            items: [{ text: "vix p2p", link: "/modules/cli/p2p" }],
          },
        ],
      },

      // 5) Modules, ordered by how users typically learn and build
      {
        text: "Modules",
        collapsed: false,
        items: [
          {
            text: "Core",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/core/" },

              { text: "App", link: "/modules/core/app" },
              { text: "Configuration", link: "/modules/core/config" },
              { text: "Console", link: "/modules/core/console" },

              { text: "HTTP", link: "/modules/core/http" },
              { text: "Router", link: "/modules/core/router" },
              { text: "Middleware", link: "/modules/core/middleware" },
              { text: "Session", link: "/modules/core/session" },
              { text: "OpenAPI", link: "/modules/core/openapi" },

              { text: "Server", link: "/modules/core/server" },
              { text: "Executor", link: "/modules/core/executor" },
              { text: "Thread Pool", link: "/modules/core/threadpool" },
              { text: "Timers", link: "/modules/core/timers" },

              { text: "Guide", link: "/modules/core/guide" },
              { text: "Examples", link: "/modules/core/example" },
            ],
          },

          {
            text: "Middleware",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/middleware/" }],
          },

          {
            text: "Async",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/async/" },

              { text: "Task", link: "/modules/async/task" },
              { text: "Scheduler", link: "/modules/async/scheduler" },
              { text: "IO Context", link: "/modules/async/io" },

              { text: "Thread Pool", link: "/modules/async/threadpool" },
              { text: "Spawn", link: "/modules/async/spawn" },
              { text: "When", link: "/modules/async/when" },

              { text: "Timer", link: "/modules/async/timer" },
              { text: "Signal Handling", link: "/modules/async/signal" },

              { text: "Cancellation", link: "/modules/async/cancel" },
              { text: "Async Errors", link: "/modules/async/error" },

              { text: "TCP", link: "/modules/async/tcp" },
              { text: "UDP", link: "/modules/async/udp" },
              { text: "DNS Resolver", link: "/modules/async/dns" },
              { text: "Asio Network Service", link: "/modules/async/asio" },

              { text: "Examples", link: "/modules/async/example" },
            ],
          },

          {
            text: "Net",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/net/" }],
          },

          {
            text: "WebSocket",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/websocket/" }],
          },

          {
            text: "JSON",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/json/" },
              { text: "Quick Start", link: "/modules/json/simple" },
              { text: "Building JSON", link: "/modules/json/build" },
              { text: "Parsing JSON", link: "/modules/json/loads" },
              { text: "Serialization", link: "/modules/json/dumps" },
              { text: "Type Conversion", link: "/modules/json/convert" },
              { text: "JPath", link: "/modules/json/jpath" },
            ],
          },

          {
            text: "Conversion",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/conversion/" },
              { text: "Parsing API", link: "/modules/conversion/parse" },
              { text: "to_bool", link: "/modules/conversion/to_bool" },
              { text: "to_int", link: "/modules/conversion/to_int" },
              { text: "to_float", link: "/modules/conversion/to_float" },
              { text: "to_string", link: "/modules/conversion/to_string" },
              { text: "to_enum", link: "/modules/conversion/to_enum" },
              { text: "Expected<T>", link: "/modules/conversion/expected" },
              { text: "ConversionError", link: "/modules/conversion/error" },
            ],
          },

          {
            text: "Validation",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/validation/" }],
          },

          {
            text: "Utils",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/utils/" },
              { text: "Logger", link: "/modules/utils/logger" },
              { text: "Pretty Logs", link: "/modules/utils/prettylogs" },
              { text: "Result", link: "/modules/utils/result" },
              { text: "Validation", link: "/modules/utils/validation" },
              { text: "Environment", link: "/modules/utils/env" },
              { text: "Time", link: "/modules/utils/time" },
              { text: "String", link: "/modules/utils/string" },
              { text: "UUID", link: "/modules/utils/uuid" },
            ],
          },

          {
            text: "DB",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/db/" }],
          },

          {
            text: "ORM",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/orm/" },
              { text: "Examples", link: "/modules/orm/examples" },
            ],
          },

          {
            text: "Cache",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/cache/" }],
          },

          {
            text: "Sync",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/sync/" },
              { text: "Engine", link: "/modules/sync/engine" },
              { text: "Outbox", link: "/modules/sync/outbox" },
              { text: "WAL", link: "/modules/sync/wal" },
              { text: "Retry Policy", link: "/modules/sync/retry_policy" },
              { text: "Operation Model", link: "/modules/sync/operation" },
              { text: "Examples", link: "/modules/sync/examples" },
            ],
          },

          {
            text: "P2P",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/p2p/" }],
          },

          {
            text: "P2P HTTP",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/p2p_http/" }],
          },

          {
            text: "Crypto",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/crypto/" }],
          },

          {
            text: "Time",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/time/" }],
          },

          {
            text: "WebRPC",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/webrpc/" },
              { text: "Examples", link: "/modules/webrpc/examples" },
            ],
          },

          {
            text: "Deploy",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/deploy/" }],
          },
        ],
      },

      // 6) Higher level / optional areas
      {
        text: "Inference",
        collapsed: true,
        items: [
          { text: "Overview", link: "/inference" },
          { text: "Providers", link: "/inference/providers" },
          { text: "Routing and Policies", link: "/inference/routing" },
          { text: "Streaming", link: "/inference/streaming" },
          { text: "Reliability", link: "/inference/reliability" },
        ],
      },

      {
        text: "API Reference",
        collapsed: true,
        items: [
          { text: "Overview", link: "/api/" },
          { text: "HTTP", link: "/api/http" },
          { text: "WebSocket", link: "/api/websocket" },
          { text: "JSON", link: "/api/json" },
          { text: "Async", link: "/api/async" },
          { text: "P2P", link: "/api/p2p" },
          { text: "Middleware", link: "/api/middleware" },
          { text: "Config", link: "/api/config" },
        ],
      },
    ],

    search: {
      provider: "local",
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
          },
        },
      },
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/vixcpp/vix" },
      { icon: "x", link: "https://x.com/" },
    ],

    outline: "deep",
    returnToTopLabel: "Back to top",

    lastUpdated: {
      text: "Last updated",
    },

    editLink: {
      pattern:
        "https://github.com/vixcpp/vixcpp.github.io/edit/dev/vix-site/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "",
      copyright: "",
    },
  },
});
