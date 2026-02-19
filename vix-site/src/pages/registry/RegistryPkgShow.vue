<!-- src/pages/RegistryPkgShow.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

import { marked } from "marked";
import DOMPurify from "dompurify";
import { createHighlighter } from "shiki";

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
  // raw base might not exist in enterprise. Prefer raw base when it looks like public github
  const rawBase = GH_RAW_BASE.value;

  // public: https://raw.githubusercontent.com/owner/repo/ref/path
  if (/raw\.githubusercontent\.com$/i.test(rawBase)) {
    const p = (path || "").replace(/^\/+/, "");
    return `${rawBase}/${owner}/${repo}/${ref}/${p}`;
  }

  // enterprise: fallback to web url (GitHub will render, not raw). Better: use API contents download_url when available.
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

  // Heuristique: si on voit "â" ou "Ã", c'est souvent un UTF-8 mal décodé
  const looksMojibake = src.includes("â") || src.includes("Ã");
  if (!looksMojibake) return src;

  try {
    // Reconstituer les bytes 0..255, puis décoder en UTF-8
    const bytes = Uint8Array.from(src, (ch) => ch.charCodeAt(0) & 0xff);
    const fixed = new TextDecoder("utf-8", { fatal: false }).decode(bytes);

    // Garde la version "fixed" seulement si elle réduit clairement le mojibake
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

  // FIX: réparer le texte avant parsing
  source = tryFixMojibakeUtf8(source);

  const hl = await ensureHighlighter();
  const renderer = new marked.Renderer();

  renderer.heading = (...args) => {
    // marked peut appeler:
    // - heading(text, level, raw, slugger)  (ancien)
    // - heading(token)                     (nouveau)
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
    // marked peut appeler renderer.code(codeString, langString)
    // ou renderer.code(tokenObject) selon version/options
    let text = "";
    let info = "";

    if (typeof code === "string") {
      text = code;
      info = typeof infostring === "string" ? infostring : "";
    } else if (code && typeof code === "object") {
      // token shape
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

  // TOC from tokens (light)
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
        <header class="header">
          <div class="header-top">
            <div class="pkg-block">
              <div class="pkg-id">{{ id }}</div>
              <div class="pkg-name">{{ pkgDisplayName }}</div>

              <div class="pkg-desc" v-if="pkg.description">
                {{ pkg.description }}
              </div>

              <div class="meta-row">
                <a
                  v-if="pkgRepoUrl"
                  class="link"
                  :href="pkgRepoUrl"
                  target="_blank"
                  rel="noreferrer"
                >
                  Repo
                </a>

                <span class="muted" v-if="indexVersion">Index: {{ indexVersion }}</span>
                <span class="muted" v-if="selectedCommit">Commit: {{ shortSha(selectedCommit) }}</span>
                <span class="muted" v-if="selectedTag">Tag: {{ selectedTag }}</span>
              </div>

              <div class="notice" v-if="offlineMode">
                Offline mode is enabled. GitHub browsing is limited.
              </div>

              <div class="notice soft" v-else-if="ghNotice">
                {{ ghNotice }}
              </div>
            </div>

            <div class="side">
              <div class="badge-grid">
                <div class="badge" v-for="b in overviewBadges" :key="b.k">
                  <div class="k">{{ b.k }}</div>
                  <div class="v">{{ b.v }}</div>
                </div>
              </div>

              <div class="side-row">
               <div class="token-pill" :class="{ ok: isDev && hasDevToken, warn: isDev && !hasDevToken }">
                {{ tokenPolicyLabel }}
               </div>

                <div class="version-pick" v-if="sortedVersions.length">
                  <span class="muted">Version</span>
                  <select v-model="selectedVersion" aria-label="Select version">
                    <option v-for="v in sortedVersions" :key="v.version" :value="v.version">
                      {{ v.version }}
                    </option>
                  </select>
                </div>
              </div>

              <button class="meta-btn" @click="metaOpen = !metaOpen" :aria-expanded="metaOpen ? 'true' : 'false'">
                Registry metadata
              </button>
            </div>
          </div>

          <div v-if="metaOpen" class="meta-panel">
            <div class="meta-grid">
              <div class="meta-card">
                <div class="meta-title">Manifest</div>
                <div class="meta-kv"><span class="k">License</span><span class="v">{{ (pkg.license || "-") }}</span></div>
                <div class="meta-kv"><span class="k">Type</span><span class="v">{{ (pkg.type || "-") }}</span></div>
                <div class="meta-kv"><span class="k">Keywords</span><span class="v">{{ (pkg.keywords || []).join(", ") || "-" }}</span></div>
              </div>

              <div class="meta-card">
                <div class="meta-title">Exports</div>
                <div class="meta-kv">
                  <span class="k">exports.headers</span>
                  <span class="v">{{ hasRegistryExports ? "present" : "missing" }}</span>
                </div>

                <div class="meta-warn" v-if="!hasRegistryExports">
                  Missing exports.headers will reduce docs quality.
                </div>

                <div class="meta-snippet" v-if="!hasRegistryExports">
                  <div class="label">Add this to your registry entry</div>
                  <pre><code>{{ registryHintExportsJson() }}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <nav class="tabs" aria-label="Package tabs">
            <button class="tab" :class="{ active: activeTab === 'overview' }" @click="setTab('overview')">
              Overview
            </button>
            <button class="tab" :class="{ active: activeTab === 'docs' }" @click="setTab('docs')">
              Docs
            </button>
            <button class="tab" :class="{ active: activeTab === 'files' }" @click="setTab('files')">
              Files
            </button>
            <button class="tab" :class="{ active: activeTab === 'versions' }" @click="setTab('versions')">
              Versions
            </button>
          </nav>
        </header>

        <section class="panel">
          <!-- OVERVIEW -->
          <div v-if="activeTab === 'overview'" class="grid">
            <div class="card">
              <div class="card-title">Use</div>

              <div class="snippet">
                <div class="label">Add</div>
                <div class="row">
                  <pre class="flex"><code>{{ installSnippet }}</code></pre>
                  <button class="mini-btn" @click="safeClipboardCopy(installSnippet)" aria-label="Copy install command">
                    Copy
                  </button>
                </div>
              </div>

              <div class="snippet">
                <div class="label">Include</div>
                <div class="row">
                  <pre class="flex"><code>{{ includeSnippet }}</code></pre>
                  <button class="mini-btn" @click="safeClipboardCopy(includeSnippet)" aria-label="Copy include line">
                    Copy
                  </button>
                </div>
              </div>

              <div class="tags-wrap" v-if="pkg.keywords && pkg.keywords.length">
                <div class="label">Keywords</div>
                <div class="tags">
                  <span class="tag" v-for="k in pkg.keywords" :key="k">{{ k }}</span>
                </div>
              </div>

              <div class="hint">
                <span class="dot"></span>
                Tip: publish tag + commit in each version for stable browsing.
              </div>
            </div>

            <div class="card">
              <div class="card-title">README</div>

              <div class="state" v-if="readmeLoading">
                <span class="spinner"></span>
                Loading README...
              </div>

              <div class="state error" v-else-if="readmeError">
                Error: {{ readmeError }}
              </div>

              <template v-else>
                <div class="readme-top">
                  <div class="readme-actions">
                    <a v-if="readmeMeta.sourceUrl" class="mini-link" :href="readmeMeta.sourceUrl" target="_blank" rel="noreferrer">
                      View source
                    </a>
                    <a v-if="readmeMeta.editUrl" class="mini-link" :href="readmeMeta.editUrl" target="_blank" rel="noreferrer">
                      Edit
                    </a>
                  </div>

                  <div class="warn" v-if="readmeWarn">{{ readmeWarn }}</div>

                  <details class="toc" v-if="readmeToc.length">
                    <summary>Table of contents</summary>
                    <div class="toc-list">
                      <a
                        v-for="h in readmeToc"
                        :key="h.id"
                        class="toc-item"
                        :style="{ paddingLeft: Math.min(24, (h.level - 1) * 10) + 'px' }"
                        :href="'#' + h.id"
                      >
                        {{ h.text }}
                      </a>
                    </div>
                  </details>
                </div>

                <div class="readme" v-html="readmeHtml"></div>
              </template>
            </div>
          </div>

          <!-- DOCS -->
          <div v-else-if="activeTab === 'docs'" class="docs">
            <div class="card">
              <div class="card-title">Header scan</div>

              <div class="state" v-if="docsLoading">
                <span class="spinner"></span>
                Scanning headers...
              </div>

              <div class="state error" v-else-if="docsError">
                <div class="err-title">No docs available</div>

                <div class="err-sub" v-if="docsError === 'no_exported_header_found'">
                  Exports exist, but no header could be fetched for this ref.
                </div>

                <div class="err-sub" v-else-if="docsError === 'no_header_detected'">
                  No header detected. Add exports.headers in the registry entry.
                </div>

                <div class="err-sub" v-else-if="docsError === 'offline_mode'">
                  Offline mode: docs scanning is disabled.
                </div>

                <div class="err-sub" v-else>
                  Error: {{ docsError }}
                </div>

                <div class="hint soft" v-if="!hasRegistryExports">
                  Note: exports.headers is missing. We tried a minimal include scan fallback.
                </div>
              </div>

              <template v-else>
                <div class="docs-top">
                  <div class="docs-meta">
                    <div class="muted">{{ id }}</div>
                    <div class="muted" v-if="docsHeaderPicked">
                      Source:
                      <a
                        class="link"
                        :href="nodeWebUrl({ type: 'file', name: docsHeaderPicked.split('/').pop(), path: docsHeaderPicked })"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {{ docsHeaderPicked }}
                      </a>
                    </div>
                  </div>

                  <div class="docs-stats">
                    <span class="pill2">Namespaces {{ docsCounts.namespaces }}</span>
                    <span class="pill2">Types {{ docsCounts.types }}</span>
                    <span class="pill2">Functions {{ docsCounts.functions }}</span>
                    <span class="pill2">Enums {{ docsCounts.enums }}</span>
                    <span class="pill2">Macros {{ docsCounts.macros }}</span>
                  </div>

                  <div class="docs-controls">
                    <input
                      class="input"
                      v-model="docsJump"
                      placeholder="Filter symbols..."
                      aria-label="Filter symbols"
                    />

                    <div class="seg">
                      <button class="seg-btn" :class="{ active: docsGroupsTab === 'functions' }" @click="docsGroupsTab = 'functions'">Functions</button>
                      <button class="seg-btn" :class="{ active: docsGroupsTab === 'types' }" @click="docsGroupsTab = 'types'">Types</button>
                      <button class="seg-btn" :class="{ active: docsGroupsTab === 'namespaces' }" @click="docsGroupsTab = 'namespaces'">Namespaces</button>
                      <button class="seg-btn" :class="{ active: docsGroupsTab === 'enums' }" @click="docsGroupsTab = 'enums'">Enums</button>
                      <button class="seg-btn" :class="{ active: docsGroupsTab === 'macros' }" @click="docsGroupsTab = 'macros'">Macros</button>
                    </div>
                  </div>
                </div>

                <div class="docs-list">
                  <div class="muted" v-if="!docsActiveList.length">No results</div>
                  <div v-else class="sym-row" v-for="s in docsActiveList" :key="s">
                    <code>{{ s }}</code>
                  </div>
                </div>

                <details class="tried" v-if="docsHeadersTried.length">
                  <summary>Headers tried</summary>
                  <div class="tried-list">
                    <div class="muted" v-for="h in docsHeadersTried" :key="h">{{ h }}</div>
                  </div>
                </details>

                <div class="hint soft">
                  Best-effort parsing for quick browsing.
                </div>
              </template>
            </div>
          </div>

          <!-- FILES -->
          <div v-else-if="activeTab === 'files'" class="files">
            <div class="card">
              <div class="card-title">Files</div>

              <div class="files-top">
                <div class="crumbs">
                  <button class="crumb" @click="goRoot" :class="{ active: !currentPath }">root</button>
                  <template v-for="p in pathStack" :key="p">
                    <span class="sep">/</span>
                    <button class="crumb" @click="goCrumb(p)" :class="{ active: currentPath === p }">
                      {{ p.split('/').pop() }}
                    </button>
                  </template>
                </div>

                <div class="files-actions">
                  <button class="mini-btn" @click="goUp" :disabled="!currentPath" aria-label="Go up">
                    Up
                  </button>
                  <button class="mini-btn" @click="globalSearchOpen = !globalSearchOpen" aria-label="Toggle global search">
                    Search
                  </button>
                </div>
              </div>

              <div v-if="globalSearchOpen" class="search-box">
                <div class="row">
                  <input class="input flex" v-model="globalSearchQuery" placeholder="Code search (repo-wide)..." />
                  <button class="mini-btn" @click="runGlobalSearch" :disabled="globalSearchLoading">Go</button>
                </div>

                <div class="state" v-if="globalSearchLoading">
                  <span class="spinner"></span>
                  Searching...
                </div>
                <div class="state error" v-else-if="globalSearchError">
                  Error: {{ globalSearchError }}
                </div>
                <div v-else-if="globalSearchResults.length" class="search-results">
                  <a
                    class="search-hit"
                    v-for="r in globalSearchResults"
                    :key="r.html_url"
                    :href="r.html_url"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div class="hit-name">{{ r.name }}</div>
                    <div class="hit-path">{{ r.path }}</div>
                  </a>
                </div>
              </div>

              <div class="controls">
                <input class="input flex" v-model="filesFilter" placeholder="Filter in this folder..." aria-label="Filter files" />

                <label class="toggle">
                  <input type="checkbox" v-model="filesShowHidden" />
                  <span>Show hidden</span>
                </label>

                <div class="sort">
                  <button class="mini-btn" @click="toggleSort('type')">Type</button>
                  <button class="mini-btn" @click="toggleSort('name')">Name</button>
                  <button class="mini-btn" @click="toggleSort('size')">Size</button>
                  <span class="muted small">{{ filesSortKey }} {{ filesSortDir }}</span>
                </div>
              </div>

              <div class="state" v-if="filesLoading">
                <span class="spinner"></span>
                Loading folder...
              </div>

              <div class="state error" v-else-if="filesError">
                Error: {{ filesError }}
              </div>

              <template v-else>
                <div class="file-list">
                  <div class="file-row head">
                    <div class="c1">Name</div>
                    <div class="c2">Size</div>
                    <div class="c3"></div>
                  </div>

                  <button v-if="currentPath" class="file-row back" @click="goUp">
                    <div class="c1">
                      <span class="icon dir"></span>
                      <span class="path">..</span>
                    </div>
                    <div class="c2"></div>
                    <div class="c3"><span class="arrow">›</span></div>
                  </button>

                  <button
                    v-for="n in visibleListing"
                    :key="n.path"
                    class="file-row btn"
                    @click="openNode(n)"
                  >
                    <div class="c1">
                      <span class="icon" :class="n.type === 'dir' ? 'dir' : 'file'"></span>
                      <span class="path">{{ n.name }}</span>
                    </div>
                    <div class="c2">
                      <span class="muted">{{ n.type === "dir" ? "" : niceSize(n.size) }}</span>
                    </div>
                    <div class="c3"><span class="arrow">›</span></div>
                  </button>

                  <div class="loadmore" v-if="canLoadMore">
                    <button class="mini-btn" @click="loadMore">Load more</button>
                    <span class="muted small">{{ visibleListing.length }} / {{ filteredSortedListing.length }}</span>
                  </div>

                  <div class="hint soft" v-if="pkgRepoUrl">
                    Open on GitHub:
                    <a class="link" :href="nodeWebUrl({ type: 'dir', name: currentPath || '', path: currentPath || '' }) || pkgRepoUrl" target="_blank" rel="noreferrer">
                      {{ currentPath ? currentPath : "repo root" }}
                    </a>
                  </div>
                </div>
              </template>
            </div>

            <!-- Preview modal -->
            <div class="modal" v-if="previewOpen" role="dialog" aria-modal="true">
              <div class="modal-card">
                <div class="modal-top">
                  <div class="modal-title">
                    <span class="mono">{{ previewNode?.path || "" }}</span>
                  </div>
                  <div class="modal-actions">
                    <button class="mini-btn" @click="copyPreviewPath">Copy path</button>
                    <button class="mini-btn" @click="copyPreviewRawUrl">Copy raw</button>
                    <button class="mini-btn" @click="downloadPreviewFile">Download</button>
                    <a
                      class="mini-link"
                      v-if="previewNode"
                      :href="nodeWebUrl(previewNode)"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open
                    </a>
                    <button class="mini-btn danger" @click="closePreview" aria-label="Close preview">Close</button>
                  </div>
                </div>

                <div class="state" v-if="previewLoading">
                  <span class="spinner"></span>
                  Loading preview...
                </div>

                <div class="state error" v-else-if="previewError">
                  Error: {{ previewError }}
                </div>

                <div v-else class="modal-body">
                  <div v-if="previewLang === 'md'" class="readme" v-html="previewHtml"></div>
                  <pre v-else class="codebox"><code>{{ previewText }}</code></pre>
                </div>
              </div>
              <div class="modal-backdrop" @click="closePreview" aria-hidden="true"></div>
            </div>
          </div>

          <!-- VERSIONS -->
          <div v-else-if="activeTab === 'versions'" class="versions">
            <div class="card">
              <div class="card-title">Versions</div>

              <div class="v-table">
                <div class="v-row head">
                  <div class="c1">Version</div>
                  <div class="c2">Tag</div>
                  <div class="c3">Commit</div>
                  <div class="c4">Notes</div>
                  <div class="c5">Published</div>
                </div>

                <div class="v-row" v-for="v in sortedVersions" :key="v.version">
                  <div class="c1">
                    <button class="pick" @click="selectedVersion = v.version">
                      {{ v.version }}
                    </button>
                    <span class="pill" v-if="v.version === pkgLatest">latest</span>
                  </div>
                  <div class="c2"><code>{{ v.tag || "-" }}</code></div>
                  <div class="c3"><code>{{ shortSha(v.commit || "") || "-" }}</code></div>
                  <div class="c4">{{ v.notes || "" }}</div>
                  <div class="c5">{{ v.publishedAt || "-" }}</div>
                </div>
              </div>

              <div class="hint soft">
                Install command updates when you switch version.
              </div>
            </div>
          </div>
        </section>
      </template>

      <div class="state" v-else>Not found.</div>
    </div>
  </section>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background:
    radial-gradient(900px 500px at 10% 0%, rgba(94, 234, 212, 0.10), transparent 60%),
    radial-gradient(700px 450px at 90% 10%, rgba(59, 130, 246, 0.10), transparent 55%),
    linear-gradient(to bottom, #020617, #031b1a);
  color: rgba(226, 232, 240, 0.92);
}

.container {
  max-width: 1160px;
  margin: 0 auto;
  padding: 18px 14px 56px;
}

.state {
  padding: 14px 0;
  color: rgba(148, 163, 184, 0.95);
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
}

.state.error {
  color: rgba(248, 113, 113, 0.95);
  display: block;
}

.err-title { font-weight: 950; color: rgba(254, 202, 202, 0.95); }
.err-sub { margin-top: 6px; color: rgba(252, 165, 165, 0.95); font-weight: 800; }

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(148, 163, 184, 0.25);
  border-top-color: rgba(94, 234, 212, 0.95);
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.header {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: rgba(2, 6, 23, 0.35);
  padding: 14px;
  backdrop-filter: blur(8px);
}

.header-top {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 14px;
  align-items: start;
}

.pkg-id {
  font-weight: 950;
  color: rgba(94, 234, 212, 0.95);
  letter-spacing: 0.2px;
}

.pkg-name {
  margin-top: 4px;
  font-weight: 950;
  font-size: 1.35rem;
  color: rgba(229, 249, 246, 0.95);
}

.pkg-desc {
  margin-top: 10px;
  color: rgba(226, 232, 240, 0.88);
  max-width: 860px;
  line-height: 1.55;
}

.meta-row {
  margin-top: 10px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.notice {
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.18);
  color: rgba(226, 232, 240, 0.90);
  font-weight: 850;
}
.notice.soft {
  border-color: rgba(148, 163, 184, 0.10);
  color: rgba(148, 163, 184, 0.95);
}

.muted { color: rgba(148, 163, 184, 0.95); font-weight: 750; }
.muted.small { font-size: 0.85rem; }

.link {
  color: rgba(147, 197, 253, 0.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 900;
}

.side { display: grid; gap: 12px; }

.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 10px;
}

.badge {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.25);
  border-radius: 14px;
  padding: 10px 12px;
}

.badge .k { color: rgba(148, 163, 184, 0.95); font-weight: 850; font-size: 0.85rem; }
.badge .v { margin-top: 4px; color: rgba(226, 232, 240, 0.92); font-weight: 950; }

.side-row {
  display: grid;
  gap: 10px;
}

.token-pill {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.18);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 900;
  color: rgba(148, 163, 184, 0.95);
}
.token-pill.ok {
  border-color: rgba(94, 234, 212, 0.35);
  color: rgba(94, 234, 212, 0.95);
}
.token-pill.warn {
  border-color: rgba(251, 191, 36, 0.35);
  color: rgba(251, 191, 36, 0.95);
}

.version-pick {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

select {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(2, 6, 23, 0.55);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 900;
  min-width: 160px;
}

.meta-btn {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.22);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 950;
  cursor: pointer;
}
.meta-btn:hover { border-color: rgba(94, 234, 212, 0.35); }

.meta-panel {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  padding-top: 12px;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.meta-card {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(2, 6, 23, 0.25);
  border-radius: 14px;
  padding: 12px;
}

.meta-title {
  font-weight: 950;
  color: rgba(229, 249, 246, 0.95);
  margin-bottom: 10px;
}

.meta-kv {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}
.meta-kv:first-of-type { border-top: 0; }
.meta-kv .k { color: rgba(148, 163, 184, 0.95); font-weight: 900; }
.meta-kv .v { color: rgba(226, 232, 240, 0.92); font-weight: 900; }

.meta-warn {
  margin-top: 10px;
  color: rgba(251, 191, 36, 0.95);
  font-weight: 900;
}

.meta-snippet { margin-top: 10px; }

.tabs {
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  padding-top: 12px;
}

.tab {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.25);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 950;
  cursor: pointer;
  transition: transform 0.08s ease, border-color 0.12s ease;
}
.tab:hover { transform: translateY(-1px); }
.tab.active {
  border-color: rgba(94, 234, 212, 0.55);
  box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.12);
}

.panel { margin-top: 14px; }

.grid {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 14px;
}

.card {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 6, 23, 0.25);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 14px 40px rgba(0,0,0,0.18);
}

.card-title {
  font-weight: 950;
  color: rgba(229, 249, 246, 0.95);
  margin-bottom: 10px;
}

.snippet { margin-top: 10px; }

.label {
  color: rgba(148, 163, 184, 0.95);
  font-weight: 900;
  font-size: 0.92rem;
  margin-bottom: 6px;
}

.row { display: flex; gap: 10px; align-items: stretch; }
.flex { flex: 1; }

pre {
  margin: 0;
  overflow: auto;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.25);
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.92rem;
}

.mini-btn {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.20);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 950;
  cursor: pointer;
  white-space: nowrap;
}
.mini-btn:hover { border-color: rgba(94, 234, 212, 0.35); }
.mini-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.mini-btn.danger { border-color: rgba(248, 113, 113, 0.35); }

.mini-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(147, 197, 253, 0.95);
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 900;
  padding: 8px 10px;
  border-radius: 10px;
}
.mini-link:hover { background: rgba(15, 23, 42, 0.18); }

.tags-wrap { margin-top: 12px; }

.tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.25);
  color: rgba(226, 232, 240, 0.92);
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.9rem;
}

.hint {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(148, 163, 184, 0.95);
  font-weight: 800;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  padding-top: 12px;
}
.hint.soft { border-top: 0; padding-top: 0; margin-top: 10px; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: rgba(94, 234, 212, 0.9); }

.warn {
  margin-top: 10px;
  color: rgba(251, 191, 36, 0.95);
  font-weight: 900;
}

.readme { color: rgba(226, 232, 240, 0.92); line-height: 1.7; font-size: 0.98rem; }

/* markdown */
.readme :deep(h1),
.readme :deep(h2),
.readme :deep(h3) {
  color: rgba(229, 249, 246, 0.95);
  font-weight: 950;
  margin: 18px 0 10px;
}
.readme :deep(h1) {
  font-size: 1.35rem;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}
.readme :deep(h2) {
  font-size: 1.15rem;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}
.readme :deep(p) { margin: 10px 0; }
.readme :deep(ul),
.readme :deep(ol) { margin: 10px 0; padding-left: 22px; }
.readme :deep(li) { margin: 6px 0; }
.readme :deep(a) { color: rgba(147,197,253,0.95); text-decoration: underline; text-underline-offset: 2px; }
.readme :deep(pre.shiki) {
  margin: 12px 0;
  overflow: auto;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.12);
}

/* README top */
.readme-top {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}
.readme-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* TOC */
.toc {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  padding: 10px 12px;
}
.toc summary {
  cursor: pointer;
  font-weight: 950;
  color: rgba(226, 232, 240, 0.92);
}
.toc-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.toc-item {
  color: rgba(147, 197, 253, 0.95);
  font-weight: 850;
  text-decoration: none;
}
.toc-item:hover { text-decoration: underline; text-underline-offset: 2px; }

/* Docs */
.docs-top { display: grid; gap: 12px; }
.docs-meta { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.docs-stats { display: flex; gap: 8px; flex-wrap: wrap; }
.pill2 {
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.16);
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 950;
  color: rgba(226, 232, 240, 0.92);
}
.docs-controls { display: grid; gap: 10px; }

.seg {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.seg-btn {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.18);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 950;
  cursor: pointer;
}
.seg-btn.active {
  border-color: rgba(94, 234, 212, 0.55);
  box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.10);
}

.docs-list {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  padding-top: 12px;
  display: grid;
  gap: 8px;
}
.sym-row {
  border: 1px solid rgba(148, 163, 184, 0.10);
  background: rgba(15, 23, 42, 0.14);
  border-radius: 12px;
  padding: 10px 10px;
}

.tried {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  padding-top: 10px;
}
.tried summary { cursor: pointer; font-weight: 950; }
.tried-list { margin-top: 10px; display: grid; gap: 6px; }

/* Files */
.files-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}
.files-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.sep { color: rgba(148,163,184,.75); font-weight: 900; }
.crumb {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.18);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 999px;
  padding: 6px 10px;
  font-weight: 900;
  cursor: pointer;
}
.crumb.active {
  border-color: rgba(94, 234, 212, 0.55);
  box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.10);
}

.controls {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.input {
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.55);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  padding: 10px 12px;
  font-weight: 850;
  outline: none;
}
.input:focus { border-color: rgba(94, 234, 212, 0.45); box-shadow: 0 0 0 3px rgba(94, 234, 212, 0.10); }

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(226, 232, 240, 0.92);
  font-weight: 850;
}
.toggle input { width: 16px; height: 16px; }

.sort {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pinned {
  margin-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  padding-top: 12px;
}
.pinned-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.pin {
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.16);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 14px;
  padding: 10px 10px;
  font-weight: 950;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}
.pin:hover { border-color: rgba(94, 234, 212, 0.35); }
.pin-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.file-list { display: flex; flex-direction: column; margin-top: 12px; }

.file-row {
  display: grid;
  grid-template-columns: 1fr 120px 26px;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  text-align: left;
}
.file-row.head {
  border-top: 0;
  color: rgba(148, 163, 184, 0.95);
  font-weight: 900;
  border-radius: 0;
}
.file-row.btn,
.file-row.back {
  background: transparent;
  border: none;
  cursor: pointer;
}
.file-row.btn:hover,
.file-row.back:hover { background: rgba(15, 23, 42, 0.22); }

.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 5px;
  margin-right: 10px;
  vertical-align: middle;
}
.icon.dir { background: rgba(59, 130, 246, 0.65); }
.icon.file { background: rgba(94, 234, 212, 0.65); }

.path { font-weight: 900; }
.arrow { color: rgba(148, 163, 184, 0.95); font-size: 18px; font-weight: 900; }

.loadmore {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Search box */
.search-box {
  margin-top: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  padding: 12px;
}
.search-results {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}
.search-hit {
  border: 1px solid rgba(148, 163, 184, 0.10);
  background: rgba(2, 6, 23, 0.25);
  border-radius: 12px;
  padding: 10px;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.92);
}
.search-hit:hover { border-color: rgba(94, 234, 212, 0.25); }
.hit-name { font-weight: 950; }
.hit-path { margin-top: 4px; color: rgba(148, 163, 184, 0.95); font-weight: 850; font-size: 0.9rem; }

/* Versions */
.v-table { display: flex; flex-direction: column; }
.v-row {
  display: grid;
  grid-template-columns: 140px 140px 120px 1fr 220px;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  border-top: 1px solid rgba(148, 163, 184, 0.10);
}
.v-row.head { border-top: 0; color: rgba(148, 163, 184, 0.95); font-weight: 900; }
.pick {
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.25);
  color: rgba(226, 232, 240, 0.92);
  border-radius: 12px;
  padding: 8px 10px;
  font-weight: 950;
  cursor: pointer;
}
.pick:hover { border-color: rgba(94, 234, 212, 0.55); }
.pill {
  margin-left: 8px;
  border: 1px solid rgba(94, 234, 212, 0.35);
  background: rgba(94, 234, 212, 0.10);
  color: rgba(94, 234, 212, 0.95);
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 950;
  font-size: 0.8rem;
}

/* Modal */
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.60);
}
.modal-card {
  position: relative;
  width: min(980px, 100%);
  max-height: 82vh;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(2, 6, 23, 0.90);
  border-radius: 16px;
  box-shadow: 0 30px 90px rgba(0,0,0,0.45);
  z-index: 1;
  display: grid;
  grid-template-rows: auto 1fr;
}
.modal-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.10);
}
.modal-title { font-weight: 950; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; }
.modal-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.modal-body {
  overflow: auto;
  padding: 12px;
}
.codebox {
  margin: 0;
  white-space: pre;
}

/* Responsive */
@media (max-width: 980px) {
  .header-top { grid-template-columns: 1fr; }
  .badge-grid { grid-template-columns: 1fr; }
  .grid { grid-template-columns: 1fr; }
  .v-row { grid-template-columns: 1fr; }
  .file-row { grid-template-columns: 1fr 90px 26px; }
  .pinned-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 520px) {
  .row { flex-direction: column; }
  .mini-btn { width: 100%; justify-content: center; }
  .pinned-grid { grid-template-columns: 1fr; }
}
</style>
