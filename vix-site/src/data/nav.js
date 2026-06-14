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
    href: "https://registry.vixcpp.com",
    external: true,
    match: "https://registry.vixcpp.com",
  },

  {
    label: "Rix",
    href: "https://rix.vixcpp.com",
    external: true,
    match: "https://rix.vixcpp.com",
  },

  {
    label: "Blog",
    href: "https://blog.vixcpp.com/posts/",
    external: true,
    match: "https://blog.vixcpp.com",
  },

  {
    label: "Ecosystem",
    match: "/ecosystem",
    items: [
      {
        label: "Vix.cpp on GitHub",
        href: "https://github.com/vixcpp/vix",
        external: true,
      },
      {
        label: "Rix",
        href: "https://rix.vixcpp.com",
        external: true,
      },
      {
        label: "Registry",
        href: "https://registry.vixcpp.com",
        external: true,
      },
      {
        label: "Cnerium",
        href: "https://github.com/softadastra/cnerium",
        external: true,
      },
      {
        label: "Kordex",
        href: "https://github.com/softadastra/kordex",
        external: true,
      },
    ],
  },

  {
    label: "Project",
    match: "/project",
    items: [
      { label: "Roadmap", to: "/roadmap" },
      { label: "Community", to: "/about/community" },
      { label: "FAQ", to: "/about/faq" },
      { label: "Support", to: "/support" },
    ],
  },
];
