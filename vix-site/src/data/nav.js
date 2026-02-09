// src/data/nav.js
export const NAV = [
  { label: "Home", to: "/" },
  { label: "Install", to: "/install" },

  {
    label: "Docs",
    kind: "dropdown",
    items: [
      { label: "Quick Start", to: "/docs/quick-start" },
      { label: "Guide", to: "/docs/guide" },
      { label: "Tutorial", to: "/docs/tutorial" },
      { label: "Examples", to: "/docs/examples" },
      { label: "API Reference", to: "/docs/api" },
    ],
  },

  // Registry = page produit interne
  { label: "Registry", to: "/registry" },

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

  // GitHub reste visible mais pas central
  { label: "GitHub", href: "https://github.com/vixcpp/vix", external: true },
];
