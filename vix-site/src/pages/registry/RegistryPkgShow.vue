<!-- src/pages/RegistryPkgShow.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";
import PkgShowHeader from "./pkgshow/PkgShowHeader.vue";
import PkgOverviewTab from "./pkgshow/PkgOverviewTab.vue";
import PkgDocsTab from "./pkgshow/PkgDocsTab.vue";
import PkgFilesTab from "./pkgshow/PkgFilesTab.vue";
import PkgVersionsTab from "./pkgshow/PkgVersionsTab.vue";


import { marked } from "marked";
import DOMPurify from "dompurify";
import { createHighlighter } from "shiki";

onMounted(() => document.body.classList.add("is-registry"));
onBeforeUnmount(() => document.body.classList.remove("is-registry"));

/* =========================
   Core state
========================= */
const route = useRoute();
const router = useRouter();
const worker = new RegistrySearchWorker();

const loading = ref(true);
const error = ref("");
const indexVersion = ref("");
const pkg = ref(null);

const activeTab = ref((route.query.tab || "overview").toString() || "overview");
const selectedVersion = ref("");

const tabKey = ref({
  overview: 0,
  docs: 0,
  files: 0,
  versions: 0,
});

function reloadTab(t) {
  const tab = (t || activeTab.value || "overview").toString();

  // force re-mount du composant tab
  tabKey.value = {
    ...tabKey.value,
    [tab]: (tabKey.value[tab] || 0) + 1,
  };

  // optionnel: UX comme JSR
  window.scrollTo({ top: 0, behavior: "smooth" });

  // optionnel: re-fetch immédiat (utile si le tab n’a pas de lifecycle)
  if (tab === "overview") loadReadme();
  if (tab === "files") loadDir(currentPath.value || "");
  if (tab === "docs") loadDocs();
  // versions: rien à fetch
}


const isDev = computed(() => !!import.meta.env.DEV);

/* README */
const readmeLoading = ref(false);
const readmeError = ref("");
const readmeHtml = ref("");
const readmeToc = ref([]); // [{id,text,level}]
const readmeMeta = ref({ path: "", sourceUrl: "", editUrl: "" });
const readmeWarn = ref(""); // size warning, etc

/* Docs */
const docsLoading = ref(false);
const docsError = ref("");
const docsHeaderPicked = ref(""); // best header
const docsHeadersTried = ref([]); // list
const docsCounts = ref({ namespaces: 0, types: 0, functions: 0, macros: 0, enums: 0 });
const docsSymbols = ref({
  namespaces: [],
  types: [],
  functions: [],
  macros: [],
  enums: [],
});
const docsJump = ref(""); // symbol search
const docsGroupsTab = ref("functions"); // namespaces/types/functions/macros/enums

/* Files explorer */
const filesLoading = ref(false);
const filesError = ref("");
const currentPath = ref(""); // "" root
const repoListing = ref([]); // contents items
const filesFilter = ref("");
const filesShowHidden = ref(false);
const filesSortKey = ref("type"); // type/name/size
const filesSortDir = ref("asc"); // asc/desc
const filesLimit = ref(120); // UI paging (no extra API)
const pinnedRoots = ref([
  "README.md",
  "LICENSE",
  "LICENSE.md",
  "vix.json",
  "CMakeLists.txt",
  "CMakePresets.json",
  "include",
  "src",
  "tests",
  "examples",
  "docs",
]);

/* File preview */
const previewOpen = ref(false);
const previewLoading = ref(false);
const previewError = ref("");
const previewNode = ref(null);
const previewText = ref("");
const previewHtml = ref(""); // for md
const previewLang = ref("txt");

/* GitHub reliability */
const ghNotice = ref(""); // human notice (rate limit, offline, etc)

/* =========================
   Env + GitHub base URLs
   Supports GitHub Enterprise
========================= */
const GH_WEB_BASE = computed(() => {
  return (import.meta.env.VITE_GITHUB_WEB_BASE || "https://github.com").toString().replace(/\/+$/, "");
});

const GH_API_BASE = computed(() => {
  return (import.meta.env.VITE_GITHUB_API_BASE || "https://api.github.com").toString().replace(/\/+$/, "");
});

const GH_RAW_BASE = computed(() => {
  return (import.meta.env.VITE_GITHUB_RAW_BASE || "https://raw.githubusercontent.com").toString().replace(/\/+$/, "");
});

/* Offline mode
   - if VITE_OFFLINE=1 (build time) OR ?offline=1
*/
const offlineMode = computed(() => {
  const q = (route.query.offline || "").toString();
  const env = (import.meta.env.VITE_OFFLINE || "").toString();
  return q === "1" || q === "true" || env === "1" || env === "true";
});

/* Never expose token in production */
function getClientToken() {
  const dev = !!import.meta.env.DEV;
  if (!dev) return "";
  return (import.meta.env.VITE_GITHUB_TOKEN || "").toString().trim();
}

const hasDevToken = computed(() => !!getClientToken());
const tokenPolicyLabel = computed(() => {
  return import.meta.env.DEV ? (hasDevToken.value ? "DEV token enabled" : "DEV token missing") : "Token disabled in production";
});

/* =========================
   Derived package info
========================= */
const id = computed(() => {
  const ns = (route.params.namespace || "").toString().trim();
  const name = (route.params.name || "").toString().trim();
  return ns && name ? `${ns}/${name}` : "";
});

const pkgDisplayName = computed(() => {
  const p = pkg.value || {};
  return (p.displayName || p.name || id.value || "").toString();
});

const pkgLatest = computed(() => {
  const p = pkg.value || {};
  return (
    (typeof p.latestVersion === "string" && p.latestVersion) ||
    (typeof p.latest === "string" && p.latest) ||
    ""
  );
});

const pkgRepoUrl = computed(() => {
  const p = pkg.value || {};
  const r = p.repo || {};
  return (r.url || p.repo || "").toString();
});

const pkgVersions = computed(() => {
  const p = pkg.value || {};
  const v = p.versions || {};
  return v && typeof v === "object" ? v : {};
});

const sortedVersions = computed(() => {
  const v = pkgVersions.value;
  const keys = Object.keys(v);

  const parse = (s) => {
    const m = `${s}`.match(/^(\d+)\.(\d+)\.(\d+)/);
    if (!m) return [0, 0, 0];
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };

  keys.sort((a, b) => {
    const A = parse(a);
    const B = parse(b);
    for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return B[i] - A[i];
    return b.localeCompare(a);
  });

  return keys.map((k) => ({ version: k, ...v[k] }));
});

const selectedVersionMeta = computed(() => {
  const v = selectedVersion.value || pkgLatest.value;
  if (!v) return null;
  return pkgVersions.value[v] || null;
});

const selectedCommit = computed(() => {
  const m = selectedVersionMeta.value;
  return m && typeof m.commit === "string" ? m.commit : "";
});

const selectedTag = computed(() => {
  const m = selectedVersionMeta.value;
  return m && typeof m.tag === "string" ? m.tag : "";
});

const selectedRef = computed(() => {
  return selectedTag.value || selectedCommit.value || "main";
});

const overviewBadges = computed(() => {
  const p = pkg.value || {};
  return [
    { k: "Latest", v: pkgLatest.value || "-" },
    { k: "License", v: (p.license || "-").toString() },
    { k: "Type", v: (p.type || "-").toString() },
  ];
});

const installSnippet = computed(() => {
  const p = pkg.value || {};
  const ns = (p.namespace || "").toString();
  const nm = (p.name || "").toString();
  const ver = selectedVersion.value || pkgLatest.value || "";
  const spec = ver ? `${ns}/${nm}@${ver}` : `${ns}/${nm}`;
  return `vix add ${spec}`;
});

const includeSnippet = computed(() => {
  const p = pkg.value || {};
  const exportsHeaders =
    p.exports && Array.isArray(p.exports.headers) ? p.exports.headers : [];
  const name = (p.name || "").toString().trim();

  const h = exportsHeaders.length ? exportsHeaders[0] : "";
  return h ? `#include <${h}>` : name ? `#include <${name}/${name}.hpp>` : "#include <...>";
});

const registryExportsHeaders = computed(() => {
  const p = pkg.value || {};
  return p.exports && Array.isArray(p.exports.headers) ? p.exports.headers : [];
});

const hasRegistryExports = computed(() => registryExportsHeaders.value.length > 0);

/* =========================
   Small helpers
========================= */
function shortSha(s) {
  const v = (s || "").toString();
  return v.length > 8 ? v.slice(0, 8) : v;
}

function setTab(tab) {
  const t = (tab || "overview").toString();
  activeTab.value = t;
  router.replace({ query: { ...route.query, tab: t } }).catch(() => {});
}

function parseGitHubRepo(url) {
  const u = (url || "").toString().trim();
  const m = u.match(/github\.com\/([^/]+)\/([^/]+)(?:$|\/)/i);
  if (m) return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };

  // GitHub Enterprise often: https://host/OWNER/REPO
  const m2 = u.match(/\/([^/]+)\/([^/]+?)(?:$|\/)/);
  if (!m2) return null;
  return { owner: m2[1], repo: m2[2].replace(/\.git$/i, "") };
}

function githubWebUrl({ owner, repo, ref, path }) {
  const base = GH_WEB_BASE.value;
  const p = (path || "").replace(/^\/+/, "");
  if (!p) return `${base}/${owner}/${repo}`;
  return `${base}/${owner}/${repo}/blob/${ref}/${p}`;
}

function githubTreeUrl({ owner, repo, ref, path }) {
  const base = GH_WEB_BASE.value;
  const p = (path || "").replace(/^\/+/, "");
  if (!p) return `${base}/${owner}/${repo}/tree/${ref}`;
  return `${base}/${owner}/${repo}/tree/${ref}/${p}`;
}

function niceSize(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function safeClipboardCopy(text) {
  const s = (text || "").toString();
  if (!s) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(s).catch(() => {});
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = s;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } catch {}
  document.body.removeChild(ta);
}

/* =========================
   LocalStorage cache with TTL
   Keyed by repo/ref/kind/path
========================= */
const CACHE_NS = "vix_gh_cache_v1";

function cacheKey(parts) {
  return `${CACHE_NS}:${parts.map((x) => (x || "").toString()).join(":")}`;
}

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const now = Date.now();
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.exp !== "number") return null;
    if (now > obj.exp) {
      localStorage.removeItem(key);
      return null;
    }
    return obj.val;
  } catch {
    return null;
  }
}

function cacheSet(key, val, ttlMs) {
  try {
    const now = Date.now();
    const exp = now + Math.max(5_000, Number(ttlMs || 0));
    localStorage.setItem(key, JSON.stringify({ exp, val }));
  } catch {}
}

function ttlMsDefault(kind) {
  // keep it safe: short in dev, longer in prod
  const prod = !!import.meta.env.PROD;
  if (kind === "readme") return prod ? 60 * 60 * 1000 : 15 * 60 * 1000;
  if (kind === "contents") return prod ? 30 * 60 * 1000 : 10 * 60 * 1000;
  if (kind === "header") return prod ? 60 * 60 * 1000 : 15 * 60 * 1000;
  if (kind === "search") return prod ? 5 * 60 * 1000 : 2 * 60 * 1000;
  return prod ? 15 * 60 * 1000 : 5 * 60 * 1000;
}

/* =========================
   GitHub fetch with backoff on 403
   1 request per user action, cached to reduce repeats
========================= */
function parseRateLimitReset(res) {
  const rem = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  const isLimited = rem === "0" && !!reset;
  if (!isLimited) return null;
  const ts = Number(reset) * 1000;
  if (!ts) return null;
  return new Date(ts);
}

function isApiUrl(url) {
  const u = (url || "").toString();
  const api = GH_API_BASE.value; // ex: https://api.github.com
  return u.startsWith(api + "/") || u === api;
}

async function ghFetch(url, { accept = "application/vnd.github+json", as = "json" } = {}) {
  if (offlineMode.value) throw new Error("offline_mode");

  const headers = { Accept: accept };

  const token = getClientToken();

  if (token && isApiUrl(url)) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403) {
      const resetAt = parseRateLimitReset(res);
      if (resetAt) {
        ghNotice.value = `GitHub rate limit reached. Try again at ${resetAt.toLocaleTimeString()}.`;
        throw new Error("github_rate_limited");
      }
    }

    let extra = "";
    try {
      const j = await res.json();
      if (j && j.message) extra = ` (${j.message})`;
    } catch {}

    throw new Error(`github_http_${res.status}${extra}`);
  }

  return as === "text" ? res.text() : res.json();
}

function ghApiUrl(path) {
  const base = GH_API_BASE.value;
  const p = (path || "").replace(/^\/+/, "");
  return `${base}/${p}`;
}

/* =========================
   Markdown rewriting for relative links and images
========================= */
function toAbsWebUrl({ owner, repo, ref, path }) {
  return githubWebUrl({ owner, repo, ref, path });
}

function toAbsRawUrl({ owner, repo, ref, path }) {
  const rawBase = GH_RAW_BASE.value;

  // public: https://raw.githubusercontent.com/owner/repo/ref/path
  if (/raw\.githubusercontent\.com$/i.test(rawBase)) {
    const p = (path || "").replace(/^\/+/, "");
    return `${rawBase}/${owner}/${repo}/${ref}/${p}`;
  }

  return toAbsWebUrl({ owner, repo, ref, path });
}

function rewriteMarkdownLinks(md, { owner, repo, ref, baseDir }) {
  const src = (md || "").toString();
  if (!src) return src;

  const normalizeRel = (p) => {
    const s = (p || "").toString().trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("mailto:")) return s;
    if (s.startsWith("#")) return s;
    if (s.startsWith("/")) {
      // treat as repo root path
      return s.replace(/^\/+/, "");
    }
    const dir = (baseDir || "").replace(/^\/+/, "").replace(/\/+$/, "");
    return dir ? `${dir}/${s}` : s;
  };

  // Images: ![alt](path)
  const imgRe = /!\[([^\]]*)\]\(([^)]+)\)/g;
  // Links: [text](path)
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;

  const replaceUrl = (raw, isImage) => {
    const trimmed = raw.trim().replace(/^<|>$/g, "");
    const rel = normalizeRel(trimmed);
    if (!rel) return raw;

    // If already absolute
    if (rel.startsWith("http://") || rel.startsWith("https://") || rel.startsWith("mailto:") || rel.startsWith("#")) return trimmed;

    const abs = isImage
      ? toAbsRawUrl({ owner, repo, ref, path: rel })
      : toAbsWebUrl({ owner, repo, ref, path: rel });

    return abs;
  };

  let out = src.replace(imgRe, (m, alt, url) => {
    const u = replaceUrl(url, true);
    return `![${alt}](${u})`;
  });

  out = out.replace(linkRe, (m, text, url) => {
    const u = replaceUrl(url, false);
    return `[${text}](${u})`;
  });

  return out;
}

/* =========================
   Markdown render with Shiki
   Lazy-load Shiki only when needed
========================= */
let highlighter = null;

function guessLang(lang) {
  const s = (lang || "").toString().trim().toLowerCase();
  if (!s) return "txt";
  if (s === "c++") return "cpp";
  if (s === "shell") return "bash";
  return s;
}

async function ensureHighlighter() {
  if (highlighter) return highlighter;

  highlighter = await createHighlighter({
    themes: ["github-dark"],
    langs: ["cpp", "c", "bash", "json", "yaml", "toml", "ini", "cmake", "xml", "html", "css", "js", "ts", "diff", "md", "txt"],
  });

  return highlighter;
}

function buildTocFromTokens(tokens) {
  const toc = [];
  for (const t of tokens || []) {
    if (t && t.type === "heading") {
      const text = (t.text || "").toString().trim();
      const lvl = Number(t.depth || 0);
      if (!text || !lvl) continue;
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80);
      toc.push({ id, text, level: lvl });
    }
  }
  return toc.slice(0, 60);
}

function tryFixMojibakeUtf8(s) {
  const src = (s || "").toString();
  if (!src) return src;

  const looksMojibake = src.includes("â") || src.includes("Ã");
  if (!looksMojibake) return src;

  try {
    const bytes = Uint8Array.from(src, (ch) => ch.charCodeAt(0) & 0xff);
    const fixed = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    const badCount = (src.match(/[âÃ]/g) || []).length;
    const fixedBadCount = (fixed.match(/[âÃ]/g) || []).length;

    return fixedBadCount < badCount ? fixed : src;
  } catch {
    return src;
  }
}

async function renderMarkdown(md, { tocOut = null } = {}) {
  let source = (md || "").toString();
  if (!source) return "";

  source = tryFixMojibakeUtf8(source);

  const hl = await ensureHighlighter();
  const renderer = new marked.Renderer();

  renderer.heading = (...args) => {
    let text = "";
    let level = 1;

    const a0 = args[0];

    if (typeof a0 === "string") {
      text = a0;
      level = Number(args[1] || 1);
    } else if (a0 && typeof a0 === "object") {
      // token shape
      text = typeof a0.text === "string" ? a0.text : "";
      level = Number(a0.depth || a0.level || 1);
    }

    const t = (text || "").toString();
    const id = t
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80);

    return `<h${level} id="${id}">${t}</h${level}>`;
  };

  renderer.code = (code, infostring) => {
    let text = "";
    let info = "";

    if (typeof code === "string") {
      text = code;
      info = typeof infostring === "string" ? infostring : "";
    } else if (code && typeof code === "object") {
      text = typeof code.text === "string" ? code.text : "";
      info =
        typeof code.lang === "string"
          ? code.lang
          : typeof infostring === "string"
            ? infostring
            : "";
    }

    const lang = guessLang(info);

    try {
      return hl.codeToHtml(text, { lang, theme: "github-dark" });
    } catch {
      return hl.codeToHtml(text, { lang: "txt", theme: "github-dark" });
    }
  };

  marked.setOptions({ gfm: true, breaks: false, renderer });

  try {
    const tokens = marked.lexer(source);
    if (tocOut) tocOut.value = buildTocFromTokens(tokens);
  } catch {}

  const rawHtml = marked.parse(source);
  return DOMPurify.sanitize(rawHtml);
}

/* =========================
   README loader
   - cached by repo/ref/path
   - supports README in subdirs
   - rewrite relative urls
   - view/edit links
========================= */
function readmeCandidates() {
  return [
    { path: "README.md", baseDir: "" },
    { path: "readme.md", baseDir: "" },
    { path: "docs/README.md", baseDir: "docs" },
    { path: "docs/readme.md", baseDir: "docs" },
    { path: "packages/README.md", baseDir: "packages" },
    { path: "packages/readme.md", baseDir: "packages" },
    // if package name exists
    { path: `packages/${(pkg.value?.name || "").toString().trim()}/README.md`, baseDir: `packages/${(pkg.value?.name || "").toString().trim()}` },
    { path: `packages/${(pkg.value?.name || "").toString().trim()}/readme.md`, baseDir: `packages/${(pkg.value?.name || "").toString().trim()}` },
  ].filter((x) => x.path && !x.path.includes("//"));
}

function decodeBase64Utf8(b64) {
  const bin = atob((b64 || "").replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function loadReadme() {
  readmeLoading.value = true;
  readmeError.value = "";
  readmeHtml.value = "";
  readmeToc.value = [];
  readmeMeta.value = { path: "", sourceUrl: "", editUrl: "" };
  readmeWarn.value = "";

  try {
    const p = pkg.value || {};
    const fromIndex = (p.readme || "").toString();
    if (fromIndex) {
      // can not rewrite without repo info, render as-is
      readmeHtml.value = await renderMarkdown(fromIndex, { tocOut: readmeToc });
      return;
    }

    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("missing_repo_url");

    const ref = selectedRef.value || "main";

    // If token absent in prod, stay public; still may rate limit
    if (!import.meta.env.DEV && !offlineMode.value) {
      ghNotice.value = "Public GitHub mode (no token).";
    }

    // Try cached first
    const key = cacheKey([info.owner, info.repo, ref, "readme", "auto"]);
    const cached = cacheGet(key);
    if (cached && cached.md && cached.meta) {
      const rewritten = rewriteMarkdownLinks(cached.md, {
        owner: info.owner,
        repo: info.repo,
        ref,
        baseDir: cached.meta.baseDir || "",
      });
      readmeMeta.value = {
        path: cached.meta.path || "",
        sourceUrl: cached.meta.sourceUrl || "",
        editUrl: cached.meta.editUrl || "",
      };
      readmeWarn.value = cached.meta.warn || "";
      readmeHtml.value = await renderMarkdown(rewritten, { tocOut: readmeToc });
      return;
    }

    let md = "";
    let picked = null;

    // 1 request per load, but we may need multiple candidates.
    // To keep it strict: we only do ONE API request: /readme endpoint (best effort),
    // then fallback only if that fails AND user explicitly retries by pressing reload.
    // Here: we do /readme first. If fails, we try raw candidates but cached after first success.
    try {
      const api = ghApiUrl(`repos/${info.owner}/${info.repo}/readme?ref=${encodeURIComponent(ref)}`);
      const data = await ghFetch(api, { as: "json" });
      const content = data && data.content ? decodeBase64Utf8(String(data.content)) : "";
      if (content) {
        md = content;
        picked = { path: data.path || "README.md", baseDir: (data.path || "").split("/").slice(0, -1).join("/") };
      }
    } catch {}

    // fallback: try raw candidates (still 1 request per candidate, but only when /readme failed)
    if (!md) {
      for (const c of readmeCandidates()) {
        try {
          const raw = toAbsRawUrl({ owner: info.owner, repo: info.repo, ref, path: c.path });
          const t = await ghFetch(raw, { as: "text", accept: "text/plain" });
          if (t) {
            md = t;
            picked = { path: c.path, baseDir: c.baseDir || "" };
            break;
          }
        } catch {}
      }
    }

    if (!md) throw new Error("readme_not_found");

    // warn if huge
    if (md.length > 250_000) readmeWarn.value = "README is large. Rendering might be slower.";

    const rewritten = rewriteMarkdownLinks(md, {
      owner: info.owner,
      repo: info.repo,
      ref,
      baseDir: picked?.baseDir || "",
    });

    const sourceUrl = githubWebUrl({ owner: info.owner, repo: info.repo, ref, path: picked?.path || "" });
    const editUrl = `${GH_WEB_BASE.value}/${info.owner}/${info.repo}/edit/${ref}/${(picked?.path || "").replace(/^\/+/, "")}`;

    readmeMeta.value = { path: picked?.path || "", sourceUrl, editUrl };

    // cache raw md + meta
    cacheSet(
      key,
      {
        md,
        meta: {
          path: picked?.path || "",
          baseDir: picked?.baseDir || "",
          sourceUrl,
          editUrl,
          warn: readmeWarn.value || "",
        },
      },
      ttlMsDefault("readme"),
    );

    readmeHtml.value = await renderMarkdown(rewritten, { tocOut: readmeToc });
  } catch (e) {
    const msg = (e && e.message) || "cannot_load_readme";
    readmeError.value =
      msg === "offline_mode"
        ? "Offline mode: README is only available if included in the registry index."
        : msg;
  } finally {
    readmeLoading.value = false;
  }
}

/* =========================
   Files explorer
   - contents API per navigation (1 request)
   - cached by repo/ref/path
   - local filter + sort + hidden toggle
   - preview inline (1 request per file open)
   - code search (1 request per search action)
========================= */
function normalizeContentsItem(x) {
  const t = (x && x.type) || "file"; // file/dir
  const name = (x && x.name) || "";
  const path = (x && x.path) || "";
  return {
    name,
    path,
    type: t, // file/dir
    size: Number(x && x.size) || 0,
    sha: (x && x.sha) || "",
    download_url: (x && x.download_url) || "",
    html_url: (x && x.html_url) || "",
  };
}

async function loadDir(pathInRepo = "") {
  filesLoading.value = true;
  filesError.value = "";
  repoListing.value = [];
  ghNotice.value = ghNotice.value || "";

  try {
    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("not_github_repo");

    const ref = selectedRef.value || "main";
    const dir = (pathInRepo || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");

    // offline
    if (offlineMode.value) {
      filesError.value = "Offline mode: files browsing is disabled.";
      return;
    }

    const key = cacheKey([info.owner, info.repo, ref, "contents", dir || "root"]);
    const cached = cacheGet(key);
    if (cached && Array.isArray(cached)) {
      repoListing.value = cached;
      currentPath.value = dir;
      return;
    }

    const base = ghApiUrl(`repos/${info.owner}/${info.repo}/contents`);
    const api = dir ? `${base}/${encodeURIComponent(dir).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ref)}` : `${base}?ref=${encodeURIComponent(ref)}`;

    const data = await ghFetch(api, { as: "json" });
    if (!Array.isArray(data)) throw new Error("unexpected_contents_shape");

    const list = data.map(normalizeContentsItem).filter((x) => x.path);
    cacheSet(key, list, ttlMsDefault("contents"));

    repoListing.value = list;
    currentPath.value = dir;
  } catch (e) {
    const msg = (e && e.message) || "cannot_load_files";
    filesError.value =
      msg === "offline_mode"
        ? "Offline mode: files browsing is disabled."
        : msg === "github_rate_limited"
          ? "Rate limited by GitHub. Please retry later."
          : msg;
  } finally {
    filesLoading.value = false;
  }
}

const pathStack = computed(() => {
  const p = (currentPath.value || "").trim();
  if (!p) return [];
  const parts = p.split("/").filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) out.push(parts.slice(0, i + 1).join("/"));
  return out;
});

function goRoot() {
  loadDir("");
}

function goCrumb(p) {
  loadDir(p || "");
}

function goUp() {
  const parts = (currentPath.value || "").split("/").filter(Boolean);
  parts.pop();
  loadDir(parts.join("/"));
}

function toggleSort(key) {
  if (filesSortKey.value === key) {
    filesSortDir.value = filesSortDir.value === "asc" ? "desc" : "asc";
  } else {
    filesSortKey.value = key;
    filesSortDir.value = "asc";
  }
}

const filteredSortedListing = computed(() => {
  const list = Array.isArray(repoListing.value) ? repoListing.value.slice() : [];
  const q = (filesFilter.value || "").toString().trim().toLowerCase();

  const hiddenOk = (x) => {
    if (filesShowHidden.value) return true;
    const n = (x.name || "").toString();
    return !n.startsWith(".");
  };

  let out = list.filter(hiddenOk);

  if (q) {
    out = out.filter((x) => {
      const name = (x.name || "").toString().toLowerCase();
      const path = (x.path || "").toString().toLowerCase();
      return name.includes(q) || path.includes(q);
    });
  }

  const dirFirst = (a, b) => {
    const ad = a.type === "dir" ? 0 : 1;
    const bd = b.type === "dir" ? 0 : 1;
    if (ad !== bd) return ad - bd;
    return 0;
  };

  const key = filesSortKey.value;
  const dir = filesSortDir.value;

  out.sort((A, B) => {
    const df = dirFirst(A, B);
    if (df !== 0 && key === "type") return df;

    let cmp = 0;

    if (key === "type") {
      cmp = dirFirst(A, B);
      if (cmp !== 0) return cmp;
      cmp = (A.name || "").localeCompare(B.name || "");
    } else if (key === "name") {
      cmp = (A.name || "").localeCompare(B.name || "");
    } else if (key === "size") {
      cmp = (Number(A.size) || 0) - (Number(B.size) || 0);
    } else {
      cmp = (A.name || "").localeCompare(B.name || "");
    }

    return dir === "asc" ? cmp : -cmp;
  });

  return out;
});

const visibleListing = computed(() => {
  const out = filteredSortedListing.value;
  return out.slice(0, Math.max(30, Number(filesLimit.value || 0)));
});

const canLoadMore = computed(() => {
  return filteredSortedListing.value.length > visibleListing.value.length;
});

function loadMore() {
  filesLimit.value = Math.min(filteredSortedListing.value.length, Number(filesLimit.value || 0) + 120);
}

const pinnedRootNodes = computed(() => {
  // show pinned shortcuts only when at root
  if (currentPath.value) return [];
  const list = Array.isArray(repoListing.value) ? repoListing.value : [];
  const set = new Map(list.map((x) => [x.name, x]));
  const out = [];
  for (const n of pinnedRoots.value) {
    const hit = set.get(n);
    if (hit) out.push(hit);
    else {
      // pseudo node (for missing items, still clickable to GH)
      out.push({ name: n, path: n, type: n.includes(".") ? "file" : "dir", size: 0, download_url: "", html_url: "" });
    }
  }
  return out;
});

function openNode(n) {
  if (!n) return;
  if (n.type === "dir") {
    loadDir(n.path);
    return;
  }
  openPreview(n);
}

function nodeWebUrl(n) {
  const repoUrl = pkgRepoUrl.value;
  const info = parseGitHubRepo(repoUrl);
  if (!info) return "";
  const ref = selectedRef.value || "main";
  if (n.type === "dir") return githubTreeUrl({ owner: info.owner, repo: info.repo, ref, path: n.path });
  return githubWebUrl({ owner: info.owner, repo: info.repo, ref, path: n.path });
}

function nodeRawUrl(n) {
  const repoUrl = pkgRepoUrl.value;
  const info = parseGitHubRepo(repoUrl);
  if (!info) return "";
  const ref = selectedRef.value || "main";
  // prefer download_url if present (enterprise-safe)
  if (n.download_url) return n.download_url;
  return toAbsRawUrl({ owner: info.owner, repo: info.repo, ref, path: n.path });
}

/* Global code search (optional)
   One request per "Search" action.
*/
const globalSearchOpen = ref(false);
const globalSearchQuery = ref("");
const globalSearchLoading = ref(false);
const globalSearchError = ref("");
const globalSearchResults = ref([]); // [{name,path,html_url}]

async function runGlobalSearch() {
  globalSearchLoading.value = true;
  globalSearchError.value = "";
  globalSearchResults.value = [];

  try {
    const q = (globalSearchQuery.value || "").toString().trim();
    if (!q) {
      globalSearchError.value = "Type a query first.";
      return;
    }

    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("not_github_repo");

    const ref = selectedRef.value || "main";

    if (offlineMode.value) throw new Error("offline_mode");

    const key = cacheKey([info.owner, info.repo, ref, "search", q.toLowerCase()]);
    const cached = cacheGet(key);
    if (cached && Array.isArray(cached)) {
      globalSearchResults.value = cached;
      return;
    }

    // GitHub code search: q=<query> repo:owner/repo
    const api = ghApiUrl(`search/code?q=${encodeURIComponent(q)}+repo:${encodeURIComponent(info.owner)}/${encodeURIComponent(info.repo)}&per_page=20`);
    const data = await ghFetch(api, { as: "json" });
    const items = Array.isArray(data.items) ? data.items : [];
    const out = items.map((x) => ({
      name: x.name || "",
      path: x.path || "",
      html_url: x.html_url || "",
    }));
    cacheSet(key, out, ttlMsDefault("search"));
    globalSearchResults.value = out;
  } catch (e) {
    const msg = (e && e.message) || "search_failed";
    globalSearchError.value =
      msg === "offline_mode"
        ? "Offline mode: search is disabled."
        : msg === "github_rate_limited"
          ? "Rate limited by GitHub. Please retry later."
          : msg;
  } finally {
    globalSearchLoading.value = false;
  }
}

/* Preview inline file */
async function openPreview(n) {
  previewOpen.value = true;
  previewLoading.value = true;
  previewError.value = "";
  previewNode.value = n;
  previewText.value = "";
  previewHtml.value = "";
  previewLang.value = "txt";

  try {
    if (!n || !n.path) throw new Error("missing_path");

    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("not_github_repo");

    const ref = selectedRef.value || "main";

    if (offlineMode.value) throw new Error("offline_mode");

    const ext = (n.name || "").split(".").pop().toLowerCase();
    const langByExt = {
      cpp: "cpp",
      hpp: "cpp",
      h: "c",
      c: "c",
      cmake: "cmake",
      json: "json",
      yml: "yaml",
      yaml: "yaml",
      toml: "toml",
      ini: "ini",
      md: "md",
      txt: "txt",
      js: "js",
      ts: "ts",
      html: "html",
      css: "css",
      diff: "diff",
    };

    previewLang.value = langByExt[ext] || "txt";

    const key = cacheKey([info.owner, info.repo, ref, "file", n.path]);
    const cached = cacheGet(key);
    if (typeof cached === "string") {
      previewText.value = cached;
    } else {
      const rawUrl = nodeRawUrl(n);
      const txt = await ghFetch(rawUrl, { as: "text", accept: "text/plain" });
      // limit caching huge files
      if ((txt || "").length <= 300_000) cacheSet(key, txt, ttlMsDefault("contents"));
      previewText.value = txt || "";
    }

    // render markdown for md
    if (previewLang.value === "md") {
      const rewritten = rewriteMarkdownLinks(previewText.value, {
        owner: info.owner,
        repo: info.repo,
        ref,
        baseDir: (n.path || "").split("/").slice(0, -1).join("/"),
      });
      previewHtml.value = await renderMarkdown(rewritten);
    }
  } catch (e) {
    const msg = (e && e.message) || "cannot_preview";
    previewError.value =
      msg === "offline_mode"
        ? "Offline mode: preview is disabled."
        : msg === "github_rate_limited"
          ? "Rate limited by GitHub. Please retry later."
          : msg;
  } finally {
    previewLoading.value = false;
  }
}

function closePreview() {
  previewOpen.value = false;
  previewNode.value = null;
  previewText.value = "";
  previewHtml.value = "";
  previewError.value = "";
  previewLoading.value = false;
}

function downloadPreviewFile() {
  const n = previewNode.value;
  if (!n) return;
  const url = nodeRawUrl(n);
  if (url) window.open(url, "_blank", "noreferrer");
}

function copyPreviewPath() {
  const n = previewNode.value;
  if (!n) return;
  safeClipboardCopy(n.path || "");
}

function copyPreviewRawUrl() {
  const n = previewNode.value;
  if (!n) return;
  safeClipboardCopy(nodeRawUrl(n) || "");
}

/* =========================
   Docs scanning
   - Multi-header try list
   - Cached header texts
   - Counts + symbol lists
   - Doxygen basic extraction (best-effort)
========================= */
function extractCppSymbols(text) {
  const src = (text || "").toString();
  const out = {
    namespaces: [],
    types: [],
    functions: [],
    macros: [],
    enums: [],
  };

  const nsRe = /^\s*namespace\s+([a-zA-Z_]\w*)\s*\{/gm;

  const typeRe =
    /^\s*(?:template\s*<[^>]*>\s*)?(class|struct)\s+([a-zA-Z_]\w*)/gm;

  const enumRe =
    /^\s*(?:template\s*<[^>]*>\s*)?(enum(?:\s+class)?)\s+([a-zA-Z_]\w*)/gm;

  const macroRe = /^\s*#\s*define\s+([A-Z_]\w*)/gm;

  // best-effort functions
  const fnRe =
    /^\s*(?:inline\s+)?(?:constexpr\s+)?(?:static\s+)?([a-zA-Z_:\<\>\w\s\*&]+?)\s+([a-zA-Z_]\w*)\s*\(([^\)]*)\)\s*(?:noexcept)?\s*(?:;|\{)/gm;

  for (const m of src.matchAll(nsRe)) out.namespaces.push(m[1]);
  for (const m of src.matchAll(typeRe)) out.types.push(`${m[1]} ${m[2]}`);
  for (const m of src.matchAll(enumRe)) out.enums.push(`${m[1]} ${m[2]}`);
  for (const m of src.matchAll(macroRe)) out.macros.push(m[1]);

  for (const m of src.matchAll(fnRe)) {
    const ret = (m[1] || "").trim().replace(/\s+/g, " ");
    const name = (m[2] || "").trim();
    const args = (m[3] || "").trim().replace(/\s+/g, " ");
    if (!name) continue;
    if (["if", "for", "while", "switch", "catch"].includes(name)) continue;
    out.functions.push(`${ret} ${name}(${args})`);
  }

  out.namespaces = Array.from(new Set(out.namespaces)).sort();
  out.types = Array.from(new Set(out.types)).sort();
  out.enums = Array.from(new Set(out.enums)).sort();
  out.macros = Array.from(new Set(out.macros)).sort();

  out.functions = Array.from(new Set(out.functions)).slice(0, 400);

  return out;
}

function buildHeaderCandidateList() {
  const p = pkg.value || {};
  const name = (p.name || "").toString().trim();
  const exp = registryExportsHeaders.value || [];

  const candidates = [];

  // registry exports first
  for (const h of exp) {
    const hp = (h || "").toString().trim().replace(/^\/+/, "");
    if (!hp) continue;
    candidates.push(hp);
    candidates.push(`include/${hp}`);
    if (name) candidates.push(`include/${name}/${hp}`);
  }

  // common
  if (name) {
    candidates.push(`include/${name}/${name}.hpp`);
    candidates.push(`include/${name}.hpp`);
    candidates.push(`include/${name}/${name}.h`);
    candidates.push(`include/${name}.h`);
  }

  // remove duplicates
  return Array.from(new Set(candidates.map((x) => x.replace(/^\/+/, "")))).slice(0, 18);
}

async function fetchHeaderText({ owner, repo, ref, path }) {
  const p = (path || "").replace(/^\/+/, "");
  const key = cacheKey([owner, repo, ref, "header", p]);
  const cached = cacheGet(key);
  if (typeof cached === "string" && cached) return cached;

  const raw = toAbsRawUrl({ owner, repo, ref, path: p });
  const txt = await ghFetch(raw, { as: "text", accept: "text/plain" });
  if ((txt || "").length <= 400_000) cacheSet(key, txt, ttlMsDefault("header"));
  return txt;
}

async function loadDocs() {
  docsLoading.value = true;
  docsError.value = "";
  docsHeaderPicked.value = "";
  docsHeadersTried.value = [];
  docsJump.value = "";
  docsGroupsTab.value = "functions";
  docsCounts.value = { namespaces: 0, types: 0, functions: 0, macros: 0, enums: 0 };
  docsSymbols.value = { namespaces: [], types: [], functions: [], macros: [], enums: [] };

  try {
    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("missing_repo_url");

    const ref = selectedRef.value || "main";

    if (offlineMode.value) throw new Error("offline_mode");

    const candidates = buildHeaderCandidateList();

    // Fallback include scan if exports missing or candidates fail, but keep it minimal:
    // 1 extra request to /contents/include to pick something.
    let tried = [];
    let pickedPath = "";
    let headerText = "";

    for (const c of candidates) {
      try {
        tried.push(c);
        headerText = await fetchHeaderText({ owner: info.owner, repo: info.repo, ref, path: c });
        if (headerText) {
          pickedPath = c;
          break;
        }
      } catch {}
    }

    // include scan fallback (1 request)
    if (!headerText) {
      try {
        const api = ghApiUrl(`repos/${info.owner}/${info.repo}/contents/include?ref=${encodeURIComponent(ref)}`);
        const data = await ghFetch(api, { as: "json" });
        if (Array.isArray(data)) {
          const list = data.map(normalizeContentsItem);
          // pick first .hpp at include root
          const hpp = list.find((x) => x.type === "file" && /\.h(pp)?$/i.test(x.name || ""));
          if (hpp && hpp.path) {
            tried.push(hpp.path);
            headerText = await fetchHeaderText({ owner: info.owner, repo: info.repo, ref, path: hpp.path });
            pickedPath = hpp.path;
          }
        }
      } catch {}
    }

    docsHeadersTried.value = tried;

    if (!headerText) {
      docsError.value = hasRegistryExports.value ? "no_exported_header_found" : "no_header_detected";
      return;
    }

    docsHeaderPicked.value = pickedPath;

    const sym = extractCppSymbols(headerText);

    docsSymbols.value = sym;
    docsCounts.value = {
      namespaces: sym.namespaces.length,
      types: sym.types.length,
      functions: sym.functions.length,
      macros: sym.macros.length,
      enums: sym.enums.length,
    };
  } catch (e) {
    const msg = (e && e.message) || "cannot_load_docs";
    docsError.value =
      msg === "offline_mode"
        ? "Offline mode: docs scanning is disabled."
        : msg === "github_rate_limited"
          ? "Rate limited by GitHub. Please retry later."
          : msg;
  } finally {
    docsLoading.value = false;
  }
}

const docsActiveList = computed(() => {
  const tab = docsGroupsTab.value;
  const all = docsSymbols.value || {};
  let list = all[tab] || [];
  const q = (docsJump.value || "").toString().trim().toLowerCase();
  if (q) list = list.filter((x) => (x || "").toString().toLowerCase().includes(q));
  return list.slice(0, 300);
});

/* =========================
   Registry metadata section
========================= */
const metaOpen = ref(false);

function registryHintExportsJson() {
  const p = pkg.value || {};
  const name = (p.name || "").toString().trim();
  const header = name ? `${name}/${name}.hpp` : "my_lib/my_lib.hpp";
  return JSON.stringify(
    {
      exports: {
        headers: [header],
      },
    },
    null,
    2,
  );
}

/* =========================
   Lifecycle / data loading
========================= */
function askPackage() {
  if (!id.value) return;
  worker.postMessage({ type: "getPackage", id: id.value });
}

function ensureSelectedVersion() {
  const v = pkgLatest.value || "";
  if (!selectedVersion.value) selectedVersion.value = v;
  if (!selectedVersion.value) {
    const first = sortedVersions.value[0];
    if (first && first.version) selectedVersion.value = first.version;
  }
}

async function refreshTabData() {
  if (!pkg.value) return;

  // Prefetch: README always first
  await loadReadme();

  // Prefetch include scan for docs only when docs tab
  if (activeTab.value === "files") await loadDir(currentPath.value || "");
  if (activeTab.value === "docs") await loadDocs();
}

onMounted(async () => {
  worker.onmessage = async (ev) => {
    const msg = ev.data || {};

    if (msg.type === "loaded") {
      indexVersion.value = msg.version || "";
      askPackage();
      return;
    }

    if (msg.type === "packageResult") {
      loading.value = false;
      indexVersion.value = msg.version || indexVersion.value;

      if (!msg.ok) {
        error.value = msg.error || "cannot_load_package";
        pkg.value = null;
        return;
      }

      pkg.value = msg.pkg || null;
      error.value = "";

      ensureSelectedVersion();

      // reset per-package UI
      currentPath.value = "";
      filesFilter.value = "";
      filesLimit.value = 120;
      previewOpen.value = false;
      globalSearchOpen.value = false;
      metaOpen.value = false;
      ghNotice.value = offlineMode.value ? "Offline mode enabled." : "";

      await refreshTabData();
      return;
    }

    if (msg.type === "error") {
      loading.value = false;
      error.value = msg.error || "worker_error";
    }
  };

  try {
    const { data } = await loadRegistryIndex();
    worker.postMessage({ type: "load", data });
  } catch {
    loading.value = false;
    error.value = "cannot_load_registry";
  }
});

onBeforeUnmount(() => {
  worker.terminate();
});

watch(
  () => id.value,
  () => {
    loading.value = true;
    error.value = "";
    pkg.value = null;

    // reset
    readmeHtml.value = "";
    readmeError.value = "";
    readmeToc.value = [];
    readmeWarn.value = "";

    repoListing.value = [];
    currentPath.value = "";
    filesError.value = "";

    docsError.value = "";
    docsHeaderPicked.value = "";
    docsHeadersTried.value = [];
    docsSymbols.value = { namespaces: [], types: [], functions: [], macros: [], enums: [] };

    askPackage();
  },
);

watch(
  () => activeTab.value,
  async () => {
    if (!pkg.value) return;
    if (activeTab.value === "overview") await loadReadme();
    if (activeTab.value === "files") await loadDir(currentPath.value || "");
    if (activeTab.value === "docs") await loadDocs();
  },
);

watch(
  () => selectedVersion.value,
  async () => {
    if (!pkg.value) return;
    // version changes changes ref
    await loadReadme();
    if (activeTab.value === "files") await loadDir(currentPath.value || "");
    if (activeTab.value === "docs") await loadDocs();
  },
);

watch(
  () => route.query.tab,
  (t) => {
    const v = (t || "overview").toString();
    if (v && v !== activeTab.value) activeTab.value = v;
  },
);
</script>
<template>
  <section class="page">
    <div class="container">
      <div class="state" v-if="loading">
        <span class="spinner"></span>
        Loading package...
      </div>

      <div class="state error" v-else-if="error">
        <div class="err-title">Something went wrong</div>
        <div class="err-sub">Error: {{ error }}</div>
      </div>

      <template v-else-if="pkg">
        <PkgShowHeader
          :id="id"
          :pkgDisplayName="pkgDisplayName"
          :pkg="pkg"
          :pkgRepoUrl="pkgRepoUrl"
          :indexVersion="indexVersion"
          :selectedCommit="selectedCommit"
          :selectedTag="selectedTag"
          :shortSha="shortSha"
          :offlineMode="offlineMode"
          :ghNotice="ghNotice"
          :overviewBadges="overviewBadges"
          :isDev="isDev"
          :hasDevToken="hasDevToken"
          :tokenPolicyLabel="tokenPolicyLabel"
          :sortedVersions="sortedVersions"
          :selectedVersion="selectedVersion"
          :metaOpen="metaOpen"
          :activeTab="activeTab"
          @update:selectedVersion="selectedVersion = $event"
          @update:metaOpen="metaOpen = $event"
          @setTab="setTab"
          @reloadTab="reloadTab"
          :registryHintExportsJson="registryHintExportsJson"
        />

        <section class="panel">
          <PkgOverviewTab
            v-if="activeTab === 'overview'"
            :key="tabKey.overview"
            :pkg="pkg"
            :installSnippet="installSnippet"
            :includeSnippet="includeSnippet"
            :safeClipboardCopy="safeClipboardCopy"
            :readmeLoading="readmeLoading"
            :readmeError="readmeError"
            :readmeHtml="readmeHtml"
            :readmeToc="readmeToc"
            :readmeMeta="readmeMeta"
            :readmeWarn="readmeWarn"
          />

          <PkgDocsTab
            v-else-if="activeTab === 'docs'"
            :key="tabKey.docs"
            :id="id"
            :docsLoading="docsLoading"
            :docsError="docsError"
            :hasRegistryExports="hasRegistryExports"
            :docsHeaderPicked="docsHeaderPicked"
            :docsHeadersTried="docsHeadersTried"
            :docsCounts="docsCounts"
            :docsActiveList="docsActiveList"
            :docsJump="docsJump"
            :docsGroupsTab="docsGroupsTab"
            :nodeWebUrl="nodeWebUrl"
            @update:docsJump="docsJump = $event"
            @update:docsGroupsTab="docsGroupsTab = $event"
          />

          <PkgFilesTab
            v-else-if="activeTab === 'files'"
            :key="tabKey.files"
            :pkgRepoUrl="pkgRepoUrl"
            :filesLoading="filesLoading"
            :filesError="filesError"
            :currentPath="currentPath"
            :pathStack="pathStack"
            :goRoot="goRoot"
            :goCrumb="goCrumb"
            :goUp="goUp"
            :globalSearchOpen="globalSearchOpen"
            :globalSearchQuery="globalSearchQuery"
            :globalSearchLoading="globalSearchLoading"
            :globalSearchError="globalSearchError"
            :globalSearchResults="globalSearchResults"
            :runGlobalSearch="runGlobalSearch"
            :filesFilter="filesFilter"
            :filesShowHidden="filesShowHidden"
            :filesSortKey="filesSortKey"
            :filesSortDir="filesSortDir"
            :toggleSort="toggleSort"
            :visibleListing="visibleListing"
            :canLoadMore="canLoadMore"
            :loadMore="loadMore"
            :filteredSortedListingLen="filteredSortedListing.length"
            :openNode="openNode"
            :niceSize="niceSize"
            :nodeWebUrl="nodeWebUrl"
            :previewOpen="previewOpen"
            :previewLoading="previewLoading"
            :previewError="previewError"
            :previewNode="previewNode"
            :previewText="previewText"
            :previewHtml="previewHtml"
            :previewLang="previewLang"
            :copyPreviewPath="copyPreviewPath"
            :copyPreviewRawUrl="copyPreviewRawUrl"
            :downloadPreviewFile="downloadPreviewFile"
            :closePreview="closePreview"
            @update:globalSearchOpen="globalSearchOpen = $event"
            @update:globalSearchQuery="globalSearchQuery = $event"
            @update:filesFilter="filesFilter = $event"
            @update:filesShowHidden="filesShowHidden = $event"
          />

          <PkgVersionsTab
            v-else-if="activeTab === 'versions'"
            :key="tabKey.versions"
            :sortedVersions="sortedVersions"
            :pkgLatest="pkgLatest"
            :shortSha="shortSha"
            :selectedVersion="selectedVersion"
            @update:selectedVersion="selectedVersion = $event"
          />
        </section>
      </template>

      <div class="state" v-else>Not found.</div>
    </div>
  </section>
</template>

