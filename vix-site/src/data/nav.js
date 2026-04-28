export const NAV = [
  { label: "Install", to: "/install", match: "/install" },

  {
    label: "Docs",
    href: "https://docs.vixcpp.com",
    external: true,
    match: "https://docs.vixcpp.com",
  },

  {
    label: "Registry",
    href: "https://registry.vixcpp.com/",
    external: true,
    match: "https://registry.vixcpp.com",
  },

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

  { label: "Support", to: "/support", match: "/support" },
];
