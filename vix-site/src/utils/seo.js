const DEFAULTS = {
  siteName: "Vix.cpp",
  title: "Vix.cpp — Modern C++ backend runtime",
  description:
    "Vix.cpp is a modern C++ backend runtime focused on performance, clean DX, HTTP/WebSocket, middleware, and a practical registry workflow.",
  // keep it as a stable root; later you can switch to https://vixcpp.com
  baseUrl: "https://vixcpp.com",
  twitter: "@vix_cpp",
  image: "/og.png", // put an actual og image later
};

function ensureMeta(nameOrProp, value, isProperty) {
  const selector = isProperty
    ? `meta[property="${nameOrProp}"]`
    : `meta[name="${nameOrProp}"]`;

  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (isProperty) tag.setAttribute("property", nameOrProp);
    else tag.setAttribute("name", nameOrProp);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value);
}

function ensureLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

function normalizeUrl(baseUrl, path) {
  if (!path) return baseUrl;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return baseUrl.replace(/\/+$/, "") + path;
  return baseUrl.replace(/\/+$/, "") + "/" + path;
}

function removeJsonLd(id) {
  const el = document.getElementById(id);
  if (el && el.parentNode) el.parentNode.removeChild(el);
}

function ensureJsonLd(id, obj) {
  removeJsonLd(id);
  const tag = document.createElement("script");
  tag.type = "application/ld+json";
  tag.id = id;
  tag.text = JSON.stringify(obj);
  document.head.appendChild(tag);
}

/**
 * Set SEO tags for the current route.
 *
 * @param {Object} opts
 * @param {string} [opts.title] - Page title (without site suffix).
 * @param {string} [opts.description] - Meta description.
 * @param {string} [opts.path] - Route path for canonical (e.g. "/install").
 * @param {string} [opts.canonical] - Full canonical URL override.
 * @param {string} [opts.image] - OG image path or full URL.
 * @param {string} [opts.type] - OG type (default "website").
 * @param {Object|null} [opts.jsonLd] - JSON-LD object; pass null to remove.
 */
export function setSEO(opts = {}) {
  const siteName = DEFAULTS.siteName;

  const pageTitle = (opts.title || DEFAULTS.title).trim();
  const fullTitle = pageTitle.includes(siteName)
    ? pageTitle
    : `${pageTitle} — ${siteName}`;

  const description = (opts.description || DEFAULTS.description).trim();

  const canonical = opts.canonical
    ? opts.canonical
    : normalizeUrl(DEFAULTS.baseUrl, opts.path || window.location.pathname);

  const image = normalizeUrl(DEFAULTS.baseUrl, opts.image || DEFAULTS.image);
  const type = opts.type || "website";

  // <title>
  document.title = fullTitle;

  // basic
  ensureMeta("description", description, false);
  ensureLink("canonical", canonical);

  // Open Graph
  ensureMeta("og:site_name", siteName, true);
  ensureMeta("og:title", fullTitle, true);
  ensureMeta("og:description", description, true);
  ensureMeta("og:url", canonical, true);
  ensureMeta("og:type", type, true);
  ensureMeta("og:image", image, true);

  // Twitter
  ensureMeta("twitter:card", "summary_large_image", false);
  ensureMeta("twitter:title", fullTitle, false);
  ensureMeta("twitter:description", description, false);
  ensureMeta("twitter:image", image, false);

  if (DEFAULTS.twitter) ensureMeta("twitter:site", DEFAULTS.twitter, false);

  // JSON-LD (optional)
  const JSONLD_ID = "vix-jsonld";
  if (opts.jsonLd === null) {
    removeJsonLd(JSONLD_ID);
  } else if (opts.jsonLd && typeof opts.jsonLd === "object") {
    ensureJsonLd(JSONLD_ID, opts.jsonLd);
  }
}

/**
 * Convenience presets for your pages.
 * You can call these inside each page component.
 */
export const SEO_PRESETS = {
  home() {
    setSEO({
      title: "Vix.cpp — Modern C++ backend runtime",
      description: DEFAULTS.description,
      path: "/",
      type: "website",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Vix.cpp",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Linux, macOS, Windows",
        description: DEFAULTS.description,
        url: normalizeUrl(DEFAULTS.baseUrl, "/"),
      },
    });
  },

  install() {
    setSEO({
      title: "Install",
      description:
        "Install Vix.cpp in minutes. Verify, update, and uninstall cleanly.",
      path: "/install",
    });
  },

  examples() {
    setSEO({
      title: "Examples",
      description:
        "Copy/paste ready Vix.cpp examples: HTTP, middleware, JSON logs, WebSocket, registry workflow.",
      path: "/examples",
    });
  },

  community() {
    setSEO({
      title: "Community",
      description:
        "Contribute to Vix.cpp. Issues, PR guidelines, and good first contributions.",
      path: "/community",
    });
  },
};
