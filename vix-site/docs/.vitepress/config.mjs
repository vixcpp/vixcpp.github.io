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
      { text: "Install", link: "https://vixcpp.com/install" },
      { text: "Registry", link: "https://vixcpp.com/registry" },
      { text: "GitHub", link: "https://github.com/vixcpp/vix" },
    ],

    sidebar: [
      {
        text: "Docs",
        items: [
          { text: "Docs Home", link: "/" },
          { text: "Quick Start", link: "/quick-start" },
          { text: "Guide", link: "/guide" },
          { text: "Tutorial", link: "/tutorial" },
          { text: "API Reference", link: "/api" },
          { text: "Examples", link: "/examples" },
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

    socialLinks: [{ icon: "github", link: "https://github.com/vixcpp/vix" }],

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
      message: "Built for reliability under real network conditions.",
      copyright: "Copyright © 2026 Vix.cpp",
    },
  },
});
