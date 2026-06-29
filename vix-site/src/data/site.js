import { links } from "./links";
import { images } from "./images";

export const site = {
  name: "Vix.cpp",
  tagline: "A modern application workflow for native C++.",

  description:
    "Vix.cpp is a runtime and developer toolkit for building real applications with modern C++. It keeps the native C++ model intact, while giving projects a more direct workflow for the work that usually surrounds the code.",

  repository: links.github,
  website: links.website,
  logo: images.logo,

  maintainer: {
    name: "Softadastra",
    url: links.softadastra,
  },

  install: {
    linuxMac: "curl -fsSL https://vixcpp.com/install.sh | bash",
    windows: "irm https://vixcpp.com/install.ps1 | iex",
    sdkList: "vix upgrade --sdk list",
    sdkInfo: "vix upgrade --sdk info web",
    sdkInstall: "vix upgrade --sdk web",
  },

  nav: [
    {
      label: "Install",
      href: links.install,
      external: false,
    },
    {
      label: "SDKs",
      href: links.sdks,
      external: false,
    },
    {
      label: "Registry",
      href: links.registry,
      external: false,
    },
    {
      label: "Ecosystem",
      href: links.ecosystem,
      external: false,
    },
    {
      label: "Pico",
      href: links.picoPage,
      external: false,
    },
    {
      label: "Docs",
      href: links.docs,
      external: true,
    },
  ],
};
