import { links } from "../data/links";
import { images } from "../data/images";

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",

  name: "Vix.cpp",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Linux, macOS, Windows",

  description:
    "Vix.cpp is a runtime and developer toolkit for building real applications with modern C++.",

  url: links.website,
  image: images.logo,
  codeRepository: links.github,
  programmingLanguage: "C++",

  license: `${links.github}/blob/main/LICENSE`,

  publisher: {
    "@type": "Organization",
    name: "Softadastra",
    url: links.softadastra,
  },

  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
