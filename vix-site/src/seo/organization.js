import { links } from "../data/links";
import { images } from "../data/images";

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",

  name: "Softadastra",
  url: links.softadastra,
  logo: images.logo,

  description: "Softadastra builds tools that simplify modern C++ development.",

  sameAs: [links.github, links.docs, links.registry, links.blog],
};
