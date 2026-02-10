export const NAV = [
  { label: "Install", to: "/install", match: "/install" },

  {
    label: "Docs",
    href: "/docs/",
    external: true,
    match: "/docs",
  },

  { label: "Registry", to: "/registry", match: "/registry" },

  {
    label: "About",
    match: "/about",
    items: [
      { label: "Community Guide", to: "/about/community-guide" },
      { label: "Releases", to: "/about/releases" },
      { label: "Team", to: "/about/team" },
      { label: "FAQ", to: "/about/faq" },
      { label: "The Documentary", to: "/about/documentary" },
    ],
  },
];
