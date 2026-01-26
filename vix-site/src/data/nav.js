// src/data/nav.js
export const NAV = [
  { label: "Home", to: "/" },
  { label: "Install", to: "/install" },

  // API page (internal)
  { label: "API", to: "/api" },

  // Dropdown: Docs
  {
    label: "Docs",
    kind: "dropdown",
    items: [
      { label: "Quick Start", to: "/docs/quick-start" },
      { label: "Guide", to: "/docs/guide" },
      { label: "Tutorial", to: "/docs/tutorial" },
      { label: "Examples", to: "/docs/examples" },
    ],
  },

  // Dropdown: About
  {
    label: "About",
    kind: "dropdown",
    items: [
      { label: "Community Guide", to: "/about/community-guide" },
      { label: "Releases", to: "/about/releases" },
      { label: "Team", to: "/about/team" },
      { label: "FAQ", to: "/about/faq" },
      { label: "The Documentary", to: "/about/documentary" },
    ],
  },
];

export const EXTERNAL = {
  registry: {
    label: "Registry",
    href: "https://github.com/vixcpp/registry",
    badge: "Git",
    note: "Git-based package index",
  },
  github: {
    label: "GitHub",
    href: "https://github.com/vixcpp/vix",
    badge: "Source",
    note: "Source-first docs",
  },
};
