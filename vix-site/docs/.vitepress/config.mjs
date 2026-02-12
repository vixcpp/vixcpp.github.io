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
      { text: "Registry", link: "https://vixcpp.com/registry/" },
    ],

    sidebar: [
      {
        text: "Get started",
        collapsed: false,
        items: [
          { text: "Quick Start", link: "/quick-start" },
          { text: "Installation", link: "/install" },
          { text: "Project Setup", link: "/project-setup" },
          { text: "Guides", link: "/guide" }, // docs/guide.md
        ],
      },

      {
        text: "Modules",
        collapsed: false,
        items: [
          {
            text: "cli",
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

          {
            text: "core",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/core/" },
              { text: "App", link: "/modules/core/app" },
              { text: "HTTP", link: "/modules/core/http" },
              { text: "Router", link: "/modules/core/router" },
              { text: "Server", link: "/modules/core/server" },
              { text: "Session", link: "/modules/core/session" },
              { text: "Middleware", link: "/modules/core/middleware" },
              { text: "ThreadPool", link: "/modules/core/threadpool" },
              { text: "Timers", link: "/modules/core/timers" },
              { text: "Executor", link: "/modules/core/executor" },
              { text: "OpenAPI", link: "/modules/core/openapi" },
              { text: "Config", link: "/modules/core/config" },
              { text: "Console", link: "/modules/core/console" },
              { text: "Examples", link: "/modules/core/example" },
              { text: "Guide", link: "/modules/core/guide" },
            ],
          },

          {
            text: "net",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/net/" }],
          },

          {
            text: "json",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/json/" },
              { text: "Simple", link: "/modules/json/simple" },
              { text: "Build", link: "/modules/json/build" },
              { text: "Convert", link: "/modules/json/convert" },
              { text: "Dumps", link: "/modules/json/dumps" },
              { text: "JPath", link: "/modules/json/jpath" },
              { text: "Loads", link: "/modules/json/loads" },
            ],
          },

          {
            text: "middleware",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/middleware/" }],
          },

          {
            text: "db",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/db/" }],
          },

          {
            text: "orm",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/orm/" }],
          },

          {
            text: "websocket",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/websocket/" }],
          },

          {
            text: "async",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/async/" },
              { text: "Examples", link: "/modules/async/example" },
            ],
          },

          {
            text: "p2p",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/p2p/" }],
          },

          {
            text: "p2p_http",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/p2p_http/" }],
          },

          {
            text: "crypto",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/crypto/" }],
          },

          {
            text: "time",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/time/" }],
          },

          {
            text: "conversion",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/conversion/" }],
          },

          {
            text: "validation",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/validation/" }],
          },

          {
            text: "cache",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/cache/" }],
          },

          {
            text: "sync",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/sync/" }],
          },

          {
            text: "utils",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/utils/" },
              { text: "Logger", link: "/modules/utils/logger" },
              { text: "UUID", link: "/modules/utils/uuid" },
              { text: "String", link: "/modules/utils/string" },
              { text: "Env", link: "/modules/utils/env" },
              { text: "Time", link: "/modules/utils/time" },
              { text: "Result", link: "/modules/utils/result" },
              { text: "Pretty Logs", link: "/modules/utils/prettylogs" },
              { text: "Validation", link: "/modules/utils/validation" },
            ],
          },

          {
            text: "webrpc",
            collapsed: true,
            items: [
              { text: "Overview", link: "/modules/webrpc/" },
              { text: "Examples", link: "/modules/webrpc/examples" },
            ],
          },

          {
            text: "deploy",
            collapsed: true,
            items: [{ text: "Overview", link: "/modules/deploy/" }],
          },
        ],
      },

      {
        text: "Fundamentals",
        collapsed: true,
        items: [
          { text: "Core Concepts", link: "/fundamentals" },
          { text: "App Lifecycle", link: "/fundamentals/lifecycle" },
          { text: "Error Handling", link: "/fundamentals/errors" },
          { text: "Logging", link: "/fundamentals/logging" },
          { text: "Performance", link: "/fundamentals/performance" },
          { text: "Security", link: "/fundamentals/security" },
        ],
      },

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
          { text: "Json", link: "/api/json" },
          { text: "Async", link: "/api/async" },
          { text: "P2P", link: "/api/p2p" },
          { text: "Middleware", link: "/api/middleware" },
          { text: "Config", link: "/api/config" },
        ],
      },

      {
        text: "Examples",
        collapsed: true,
        items: [
          { text: "All Examples", link: "/examples/" },
          { text: "Hello HTTP", link: "/examples/hello-http" },
          { text: "Auth Middleware", link: "/examples/auth" },
          { text: "WebSocket Chat", link: "/examples/ws-chat" },
          { text: "Async Worker", link: "/examples/async" },
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

    socialLinks: [],

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
