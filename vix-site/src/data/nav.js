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
      { label: "Community", to: "/about/community" },
      { label: "Releases", to: "/about/releases" },
      { label: "FAQ", to: "/about/faq" },
    ],
  },

  { label: "Support", to: "/support", match: "/support" },
];
