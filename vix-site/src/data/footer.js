import { site } from "./site";

export const footer = {
  brand: {
    name: site.name,
    description: site.description,
  },

  links: [
    {
      label: "Documentation",
      href: site.links.docs,
      external: true,
    },
    {
      label: "GitHub",
      href: site.links.github,
      external: true,
    },
    {
      label: "Security",
      href: `${site.links.github}/security`,
      external: true,
    },
    {
      label: "Releases",
      href: `${site.links.github}/releases`,
      external: true,
    },
  ],

  copyright: `© ${new Date().getFullYear()} Vix.cpp`,
};
