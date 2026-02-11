// docs/.vitepress/config.mjs
import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "Vix.cpp",
  description:
    "Modern C++ backend runtime for offline-first, P2P, and high-performance applications.",

  base: "/docs/",

  markdown: {
    html: true,
  },

  head: [
    ["link", { rel: "icon", href: "/assets/pwa/icon-192.png" }],
    ["meta", { name: "theme-color", content: "#0b0e14" }],
    ["meta", { name: "mobile-web-app-capable", content: "yes" }],
  ],

  themeConfig: {
    siteTitle: "Vix.cpp Docs",
    logo: "/assets/pwa/icon-192.png",
    appearance: true,

    nav: [
      { text: "Home", link: "https://vixcpp.com/" },
      { text: "Docs", link: "/docs" },
      { text: "Guides", link: "/docs/guide" },
      { text: "Registry", link: "/registry" },
      { text: "Examples", link: "/docs/examples" },
      { text: "Services", link: "https://vixcpp.com/services" },
    ],

    sidebar: [
      {
        text: "Get started",
        collapsed: false,
        items: [
          { text: "Quick Start", link: "/quick-start" },
          { text: "Installation", link: "/install" },
          { text: "Project Setup", link: "/project-setup" },
        ],
      },

      {
        text: "CLI",
        collapsed: false,
        items: [
          { text: "Overview", link: "/cli/overview" },

          {
            text: "Project",
            collapsed: false,
            items: [
              { text: "vix new", link: "/cli/new" },
              { text: "vix build", link: "/cli/build" },
              { text: "vix run", link: "/cli/run" },
              { text: "vix dev", link: "/cli/dev" },
              { text: "vix tests", link: "/cli/tests" },
              { text: "vix repl", link: "/cli/repl" },
            ],
          },

          {
            text: "Registry",
            collapsed: true,
            items: [
              { text: "vix search", link: "/cli/search" },
              { text: "vix add", link: "/cli/add" },
              { text: "vix remove", link: "/cli/remove" },
              { text: "vix list", link: "/cli/list" },
              { text: "vix publish", link: "/cli/publish" },
              { text: "vix registry", link: "/cli/registry" },
            ],
          },

          {
            text: "Packaging",
            collapsed: true,
            items: [
              { text: "vix pack", link: "/cli/pack" },
              { text: "vix verify", link: "/cli/verify" },
              { text: "vix install", link: "/cli/install" },
            ],
          },

          {
            text: "ORM",
            collapsed: true,
            items: [{ text: "vix orm", link: "/cli/orm" }],
          },

          {
            text: "Network",
            collapsed: true,
            items: [{ text: "vix p2p", link: "/cli/p2p" }],
          },
        ],
      },

      {
        text: "Guides",
        collapsed: false,
        items: [
          { text: "Overview", link: "/guide" },
          { text: "Routing", link: "/guide/routing" },
          { text: "Json", link: "/guide/json" },
          { text: "Requests and Responses", link: "/guide/http" },
          { text: "Middleware", link: "/guide/middleware" },
          { text: "Db", link: "/guide/db" },
          { text: "ORM", link: "/guide/orm" },
          { text: "WebSockets", link: "/guide/websockets" },
          { text: "Async Tasks", link: "/guide/async" },
          { text: "P2P", link: "/guide/p2p" },
          { text: "Console.log", link: "/guide/console" },
          { text: "Conversion", link: "/guide/conversion" },
          { text: "Crypto", link: "/guide/crypto" },
          { text: "Time", link: "/guide/time" },
          { text: "Config and Env", link: "/guide/config" },
          { text: "Repl", link: "/guide/repl" },
          { text: "Deployment", link: "/guide/deploy" },
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
          { text: "Overview", link: "/api" },
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
          { text: "All Examples", link: "/examples" },
          { text: "Hello HTTP", link: "/examples/hello-http" },
          { text: "Auth Middleware", link: "/examples/auth" },
          { text: "WebSocket Chat", link: "/examples/ws-chat" },
          { text: "Async Worker", link: "/examples/async" },
          { text: "P2P Ping", link: "/examples/p2p-ping" },
        ],
      },

      {
        text: "Services",
        collapsed: true,
        items: [
          { text: "Overview", link: "/services" },
          { text: "Support", link: "/services/support" },
          { text: "Consulting", link: "/services/consulting" },
          { text: "Training", link: "/services/training" },
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
