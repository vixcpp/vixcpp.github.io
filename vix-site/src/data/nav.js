// src/data/nav.js
export const NAV = [
  { label: "Home", to: "/" },
  { label: "Install", to: "/install" },

  {
    label: "Docs",
    kind: "dropdown",
    items: [
      { label: "Docs Home", href: "/docs/", external: true },
      { label: "Quick Start", href: "/docs/quick-start", external: true },
      { label: "Guide", href: "/docs/guide", external: true },
      { label: "Tutorial", href: "/docs/tutorial", external: true },
      { label: "API Reference", href: "/docs/api", external: true },
      { label: "Examples", href: "/docs/examples", external: true },
    ],
  },

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

  { label: "GitHub", href: "https://github.com/vixcpp/vix", external: true },
];
