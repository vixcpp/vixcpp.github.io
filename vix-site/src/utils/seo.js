const DEFAULTS = {
  siteName: "Vix.cpp",
  title: "Vix.cpp | Modern C++ Runtime for Fast and Reliable Applications",
  titleTemplate: "%s | Vix.cpp",
  description:
    "Vix.cpp is a modern C++ runtime for building fast, reliable, and offline-first applications. Build HTTP services, WebSocket apps, P2P systems, database-backed software, and native C++ tools with less friction.",
  baseUrl: "https://vixcpp.com",
  docsUrl: "https://docs.vixcpp.com",
  registryUrl: "https://registry.vixcpp.com",
  githubUrl: "https://github.com/vixcpp/vix",
  twitter: "@vix_cpp",
  locale: "en_US",
  language: "en-US",
  themeColor: "#020d0a",
  image:
    "https://res.cloudinary.com/dwjbed2xb/image/upload/v1769499528/vix_banniere_zljwdt.png",
  keywords: [
    "Vix.cpp",
    "Vix",
    "C++ runtime",
    "modern C++ runtime",
    "C++ backend",
    "C++ web framework",
    "C++ HTTP server",
    "C++ WebSocket",
    "C++ P2P",
    "offline-first C++",
    "native C++ applications",
    "C++ developer tools",
    "C++ package registry",
    "Vix registry",
    "fast C++ applications",
    "reliable C++ applications",
  ],
};

const JSONLD_IDS = {
  page: "vix-jsonld-page",
  website: "vix-jsonld-website",
  organization: "vix-jsonld-organization",
  software: "vix-jsonld-software",
  breadcrumbs: "vix-jsonld-breadcrumbs",
};

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function cleanText(value, fallback = "") {
  return String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value, max) {
  const text = cleanText(value);

  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max - 1).trim()}…`;
}

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl || DEFAULTS.baseUrl).replace(/\/+$/, "");
}

function normalizePath(path) {
  if (!path) {
    return "/";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      return new URL(path).pathname || "/";
    } catch {
      return "/";
    }
  }

  const clean = path.split("?")[0].split("#")[0];

  if (!clean) {
    return "/";
  }

  return clean.startsWith("/") ? clean : `/${clean}`;
}

function normalizeUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);

  if (!path) {
    return base;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = normalizePath(path);

  if (normalizedPath === "/") {
    return `${base}/`;
  }

  return `${base}${normalizedPath}`;
}

function normalizeImage(image) {
  return normalizeUrl(DEFAULTS.baseUrl, image || DEFAULTS.image);
}

function formatTitle(title) {
  const rawTitle = cleanText(title, DEFAULTS.title);

  if (!rawTitle) {
    return DEFAULTS.title;
  }

  if (rawTitle === DEFAULTS.title) {
    return rawTitle;
  }

  if (rawTitle.includes("Vix.cpp")) {
    return rawTitle;
  }

  return DEFAULTS.titleTemplate.replace("%s", rawTitle);
}

function getCurrentPath() {
  if (!isBrowser()) {
    return "/";
  }

  return window.location.pathname || "/";
}

function ensureMeta(nameOrProp, value, isProperty = false) {
  if (!isBrowser()) {
    return;
  }

  const attr = isProperty ? "property" : "name";
  const selector = `meta[${attr}="${nameOrProp}"]`;

  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, nameOrProp);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", cleanText(value));
}

function ensureLink(rel, href, extraAttrs = {}) {
  if (!isBrowser()) {
    return;
  }

  let tag = document.head.querySelector(`link[rel="${rel}"]`);

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", href);

  Object.entries(extraAttrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      tag.removeAttribute(key);
      return;
    }

    tag.setAttribute(key, String(value));
  });
}

function ensureRobots(value) {
  ensureMeta("robots", value, false);
  ensureMeta("googlebot", value, false);
}

function removeJsonLd(id) {
  if (!isBrowser()) {
    return;
  }

  const el = document.getElementById(id);

  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

function ensureJsonLd(id, obj) {
  if (!isBrowser() || !obj || typeof obj !== "object") {
    return;
  }

  removeJsonLd(id);

  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.id = id;
  tag.text = JSON.stringify(obj);

  document.head.appendChild(tag);
}

function clearPageJsonLd() {
  removeJsonLd(JSONLD_IDS.page);
  removeJsonLd(JSONLD_IDS.breadcrumbs);
}

function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULTS.siteName,
    url: normalizeUrl(DEFAULTS.baseUrl, "/"),
    description: DEFAULTS.description,
    inLanguage: DEFAULTS.language,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DEFAULTS.docsUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vix.cpp",
    url: normalizeUrl(DEFAULTS.baseUrl, "/"),
    logo: normalizeImage(DEFAULTS.image),
    sameAs: [DEFAULTS.githubUrl, DEFAULTS.docsUrl, DEFAULTS.registryUrl],
  };
}

function buildSoftwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Vix.cpp",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Linux, macOS, Windows",
    programmingLanguage: "C++",
    softwareVersion: "2.5.2",
    license: "https://opensource.org/licenses/MIT",
    url: normalizeUrl(DEFAULTS.baseUrl, "/"),
    downloadUrl: DEFAULTS.githubUrl,
    codeRepository: DEFAULTS.githubUrl,
    description: DEFAULTS.description,
    image: normalizeImage(DEFAULTS.image),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

function buildBreadcrumbs(path, title) {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === "/") {
    return null;
  }

  const parts = normalizedPath.split("/").filter(Boolean);

  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: normalizeUrl(DEFAULTS.baseUrl, "/"),
    },
  ];

  let current = "";

  parts.forEach((part, index) => {
    current += `/${part}`;

    const isLast = index === parts.length - 1;
    const label = isLast
      ? cleanText(title).replace(/\s*\|\s*Vix\.cpp\s*$/i, "")
      : part
          .split("-")
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join(" ");

    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: label,
      item: normalizeUrl(DEFAULTS.baseUrl, current),
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

function setBaseHeadTags() {
  ensureMeta("viewport", "width=device-width, initial-scale=1", false);
  ensureMeta("theme-color", DEFAULTS.themeColor, false);
  ensureMeta("application-name", DEFAULTS.siteName, false);
  ensureMeta("apple-mobile-web-app-title", DEFAULTS.siteName, false);
  ensureMeta("apple-mobile-web-app-capable", "yes", false);
  ensureMeta("mobile-web-app-capable", "yes", false);

  ensureLink("home", normalizeUrl(DEFAULTS.baseUrl, "/"));
  ensureLink("preconnect", "https://res.cloudinary.com");
}

function setStructuredBaseData() {
  ensureJsonLd(JSONLD_IDS.website, buildWebsiteJsonLd());
  ensureJsonLd(JSONLD_IDS.organization, buildOrganizationJsonLd());
  ensureJsonLd(JSONLD_IDS.software, buildSoftwareJsonLd());
}

/**
 * Set SEO tags for the current route.
 *
 * @param {Object} opts
 * @param {string} [opts.title]
 * @param {string} [opts.description]
 * @param {string} [opts.path]
 * @param {string} [opts.canonical]
 * @param {string} [opts.image]
 * @param {string} [opts.type]
 * @param {string[]} [opts.keywords]
 * @param {boolean} [opts.noindex]
 * @param {Object|null} [opts.jsonLd]
 */
export function setSEO(opts = {}) {
  if (!isBrowser()) {
    return;
  }

  const path = normalizePath(opts.path || getCurrentPath());

  const fullTitle = formatTitle(opts.title);
  const description = truncate(opts.description || DEFAULTS.description, 170);

  const canonical = opts.canonical
    ? normalizeUrl(DEFAULTS.baseUrl, opts.canonical)
    : normalizeUrl(DEFAULTS.baseUrl, path);

  const image = normalizeImage(opts.image || DEFAULTS.image);
  const type = opts.type || "website";
  const keywords = Array.from(
    new Set([...(DEFAULTS.keywords || []), ...(opts.keywords || [])]),
  ).join(", ");

  document.documentElement.setAttribute("lang", DEFAULTS.language);
  document.title = fullTitle;

  setBaseHeadTags();

  ensureMeta("description", description, false);
  ensureMeta("keywords", keywords, false);
  ensureMeta("author", "Vix.cpp", false);
  ensureMeta("generator", "Vite + Vue", false);

  ensureRobots(
    opts.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large",
  );

  ensureLink("canonical", canonical);

  ensureMeta("og:site_name", DEFAULTS.siteName, true);
  ensureMeta("og:locale", DEFAULTS.locale, true);
  ensureMeta("og:title", fullTitle, true);
  ensureMeta("og:description", description, true);
  ensureMeta("og:url", canonical, true);
  ensureMeta("og:type", type, true);
  ensureMeta("og:image", image, true);
  ensureMeta("og:image:secure_url", image, true);
  ensureMeta("og:image:alt", fullTitle, true);

  ensureMeta("twitter:card", "summary_large_image", false);
  ensureMeta("twitter:title", fullTitle, false);
  ensureMeta("twitter:description", description, false);
  ensureMeta("twitter:image", image, false);
  ensureMeta("twitter:image:alt", fullTitle, false);

  if (DEFAULTS.twitter) {
    ensureMeta("twitter:site", DEFAULTS.twitter, false);
    ensureMeta("twitter:creator", DEFAULTS.twitter, false);
  }

  setStructuredBaseData();
  clearPageJsonLd();

  const breadcrumbs = buildBreadcrumbs(path, fullTitle);

  if (breadcrumbs) {
    ensureJsonLd(JSONLD_IDS.breadcrumbs, breadcrumbs);
  }

  if (opts.jsonLd === null) {
    removeJsonLd(JSONLD_IDS.page);
  } else if (opts.jsonLd && typeof opts.jsonLd === "object") {
    ensureJsonLd(JSONLD_IDS.page, opts.jsonLd);
  }
}

export const SEO_PRESETS = {
  home() {
    setSEO({
      title: "Vix.cpp | Modern C++ Runtime for Fast and Reliable Applications",
      description:
        "Vix.cpp is a modern C++ runtime for building fast, reliable, and offline-first applications. Build HTTP services, WebSocket apps, P2P systems, database-backed software, and native C++ tools with less friction.",
      path: "/",
      type: "website",
      keywords: [
        "C++ runtime",
        "modern C++ runtime",
        "offline-first C++",
        "C++ HTTP server",
        "C++ WebSocket",
        "C++ P2P",
      ],
      jsonLd: buildSoftwareJsonLd(),
    });
  },

  install() {
    setSEO({
      title: "Install Vix.cpp",
      description:
        "Install Vix.cpp and start building native C++ applications. Create projects, run C++ files, install dependencies, and use the Vix CLI workflow.",
      path: "/install",
      keywords: [
        "install Vix.cpp",
        "Vix CLI",
        "C++ runtime install",
        "C++ developer tools",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: "Install Vix.cpp",
        description:
          "Install Vix.cpp and start building native C++ applications with the Vix CLI.",
        url: normalizeUrl(DEFAULTS.baseUrl, "/install"),
        inLanguage: DEFAULTS.language,
        about: buildSoftwareJsonLd(),
      },
    });
  },

  community() {
    setSEO({
      title: "Vix.cpp Community",
      description:
        "Join the Vix.cpp community. Follow the project, report issues, contribute examples, improve documentation, and help build modern C++ tooling.",
      path: "/about/community",
      keywords: [
        "Vix.cpp community",
        "C++ open source",
        "Vix GitHub",
        "C++ contributions",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Vix.cpp Community",
        description:
          "Official community links and contribution guidance for Vix.cpp.",
        url: normalizeUrl(DEFAULTS.baseUrl, "/about/community"),
      },
    });
  },

  releases() {
    setSEO({
      title: "Vix.cpp Releases",
      description:
        "Read Vix.cpp release notes, version updates, CLI improvements, runtime changes, and stability information.",
      path: "/about/releases",
      keywords: [
        "Vix.cpp releases",
        "Vix changelog",
        "Vix version",
        "C++ runtime releases",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Vix.cpp Releases",
        description: "Release notes and version updates for Vix.cpp.",
        url: normalizeUrl(DEFAULTS.baseUrl, "/about/releases"),
      },
    });
  },

  faq() {
    setSEO({
      title: "Vix.cpp FAQ",
      description:
        "Answers to common questions about Vix.cpp, the C++ runtime, the CLI, the registry, offline-first workflows, WebSocket, P2P, and production usage.",
      path: "/about/faq",
      keywords: [
        "Vix.cpp FAQ",
        "C++ runtime questions",
        "Vix registry",
        "offline-first C++",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [],
      },
    });
  },

  blog() {
    setSEO({
      title: "Vix.cpp Blog",
      description:
        "Read updates about Vix.cpp, including runtime work, CLI improvements, registry workflow, performance notes, examples, and release progress.",
      path: "/blog",
      type: "website",
      keywords: [
        "Vix.cpp blog",
        "C++ runtime blog",
        "C++ backend runtime",
        "Vix CLI",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Vix.cpp Blog",
        description:
          "Updates about Vix.cpp runtime, CLI, registry, performance, and releases.",
        url: normalizeUrl(DEFAULTS.baseUrl, "/blog"),
      },
    });
  },

  support() {
    setSEO({
      title: "Support Vix.cpp",
      description:
        "Support the independent development of Vix.cpp, including the runtime, documentation, registry, examples, CLI workflow, and long-term C++ tooling.",
      path: "/support",
      keywords: [
        "support Vix.cpp",
        "fund open source C++",
        "C++ runtime sponsorship",
        "Vix open source",
      ],
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "DonateAction",
        name: "Support Vix.cpp",
        description:
          "Voluntary support for the independent development of Vix.cpp.",
        recipient: {
          "@type": "SoftwareApplication",
          name: "Vix.cpp",
          url: normalizeUrl(DEFAULTS.baseUrl, "/"),
        },
      },
    });
  },

  notFound() {
    setSEO({
      title: "404",
      description: "The page you are looking for does not exist on Vix.cpp.",
      path: "/404",
      noindex: true,
      jsonLd: null,
    });
  },
};
