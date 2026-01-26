export const NAV = [
  { label: "Home", to: "/" },
  { label: "Install", to: "/install" },
  { label: "Examples", to: "/examples" },
  { label: "Community", to: "/community" },
  { label: "Blog", to: "/blog", optional: true },
];

// External (switch to subdomains later)
export const EXTERNAL = {
  docs: {
    label: "Docs",
    href: "https://github.com/vixcpp/vix", // later: https://docs.vixcpp.com
    badge: "coming soon",
  },
  registry: {
    label: "Registry",
    href: "https://github.com/vixcpp/registry", // later: https://registry.vixcpp.com
    badge: "coming soon",
  },
  rix: {
    label: "Rix",
    href: "https://github.com/vixcpp/rix", // later: https://rix.vixcpp.com
    badge: "coming soon",
  },
};
