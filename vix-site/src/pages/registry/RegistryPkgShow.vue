<!-- src/pages/RegistryPkgShow.vue -->
<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

import { marked } from "marked";
import DOMPurify from "dompurify";
import { createHighlighter } from "shiki";

const route = useRoute();
const router = useRouter();
const worker = new RegistrySearchWorker();

const loading = ref(true);
const error = ref("");
const indexVersion = ref("");
const pkg = ref(null);

const activeTab = ref((route.query.tab || "overview").toString() || "overview");
const selectedVersion = ref("");

/* Files explorer state */
const filesLoading = ref(false);
const filesError = ref("");
const repoListing = ref([]); // current dir listing [{path,name,type,size}]
const currentPath = ref(""); // "" = root, else "include/vix"
const pathStack = computed(() => {
  const p = (currentPath.value || "").trim();
  if (!p) return [];
  const parts = p.split("/").filter(Boolean);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(0, i + 1).join("/"));
  }
  return out;
});

/* Docs state */
const docsLoading = ref(false);
const docsError = ref("");
const symbols = ref({ namespaces: [], types: [], functions: [] });
const docsHeaderPath = ref("");

/* README state */
const readmeLoading = ref(false);
const readmeError = ref("");
const readmeHtml = ref("");

let highlighter = null;

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
    for (let i = 0; i < 3; i++) {
      if (A[i] !== B[i]) return B[i] - A[i];
    }
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
    langs: [
      "cpp",
      "c",
      "bash",
      "json",
      "yaml",
      "toml",
      "ini",
      "cmake",
      "xml",
      "html",
      "css",
      "js",
      "ts",
      "diff",
      "md",
      "txt",
    ],
  });

  return highlighter;
}

async function renderMarkdown(md) {
  const source = (md || "").toString();
  if (!source) return "";

  const hl = await ensureHighlighter();
  const renderer = new marked.Renderer();

  renderer.code = (code, infostring) => {
    const text =
      typeof code === "string" ? code : code && code.text ? code.text : "";
    const info =
      typeof infostring === "string"
        ? infostring
        : code && code.lang
          ? code.lang
          : "";
    const lang = guessLang(info);

    try {
      return hl.codeToHtml(text, { lang, theme: "github-dark" });
    } catch {
      return hl.codeToHtml(text, { lang: "txt", theme: "github-dark" });
    }
  };

  marked.setOptions({ gfm: true, breaks: false, renderer });

  const rawHtml = marked.parse(source);
  return DOMPurify.sanitize(rawHtml);
}

function parseGitHubRepo(url) {
  const u = (url || "").toString().trim();
  const m = u.match(/github\.com\/([^/]+)\/([^/]+)(?:$|\/)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/i, "") };
}

/* For GitHub Pages: never ship token in prod */
function getClientToken() {
  const dev = !!import.meta.env.DEV;
  if (!dev) return "";
  return (import.meta.env.VITE_GITHUB_TOKEN || "").trim();
}

async function githubFetchJson(url) {
  const headers = { Accept: "application/vnd.github+json" };
  const token = getClientToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`github_http_${res.status}`);
  return await res.json();
}

async function githubFetchText(url) {
  const headers = {};
  const token = getClientToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`github_http_${res.status}`);
  return await res.text();
}

function githubBlobUrl({ repoUrl, ref, path }) {
  const info = parseGitHubRepo(repoUrl);
  if (!info) return "";
  return `https://github.com/${info.owner}/${info.repo}/blob/${ref}/${path}`;
}

function githubTreeUrl({ repoUrl, ref, path }) {
  const info = parseGitHubRepo(repoUrl);
  if (!info) return "";
  return `https://github.com/${info.owner}/${info.repo}/tree/${ref}/${path}`;
}

function githubRawUrl({ repoUrl, ref, path }) {
  const info = parseGitHubRepo(repoUrl);
  if (!info) return "";
  return `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${ref}/${path}`;
}

function shortSha(s) {
  const v = (s || "").toString();
  return v.length > 8 ? v.slice(0, 8) : v;
}

function setTab(tab) {
  const t = (tab || "overview").toString();
  activeTab.value = t;
  router.replace({ query: { ...route.query, tab: t } }).catch(() => {});
}

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

/* =========================
   README
========================= */
async function loadReadme() {
  readmeLoading.value = true;
  readmeError.value = "";
  readmeHtml.value = "";

  try {
    const p = pkg.value || {};
    const fromIndex = (p.readme || "").toString();
    if (fromIndex) {
      readmeHtml.value = await renderMarkdown(fromIndex);
      return;
    }

    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("missing_repo_url");

    const ref = selectedRef.value || "main";

    try {
      const api = `https://api.github.com/repos/${info.owner}/${info.repo}/readme?ref=${encodeURIComponent(ref)}`;
      const data = await githubFetchJson(api);
      const md =
        data && data.content ? atob(String(data.content).replace(/\n/g, "")) : "";
      if (md) {
        readmeHtml.value = await renderMarkdown(md);
        return;
      }
    } catch {}

    const candidates = ["README.md", "readme.md", "README.MD"];
    let md = "";
    for (const c of candidates) {
      try {
        md = await githubFetchText(githubRawUrl({ repoUrl, ref, path: c }));
        if (md) break;
      } catch {}
    }

    if (!md) throw new Error("readme_not_found");
    readmeHtml.value = await renderMarkdown(md);
  } catch (e) {
    readmeError.value = (e && e.message) || "cannot_load_readme";
  } finally {
    readmeLoading.value = false;
  }
}

/* =========================
   FILES explorer (dir stack)
   Uses Contents API on demand.
   1 request per navigation (very low usage).
========================= */
function normalizeContentsItem(x) {
  const t = (x && x.type) || "file"; // file/dir
  return {
    name: (x && x.name) || "",
    path: (x && x.path) || "",
    type: t,
    size: Number(x && x.size) || 0,
    sha: (x && x.sha) || "",
  };
}

function sortListing(items) {
  const a = Array.isArray(items) ? items.slice() : [];
  a.sort((A, B) => {
    const ad = A.type === "dir" ? 0 : 1;
    const bd = B.type === "dir" ? 0 : 1;
    if (ad !== bd) return ad - bd; // dirs first
    return A.name.localeCompare(B.name);
  });
  return a;
}

async function loadDir(pathInRepo = "") {
  filesLoading.value = true;
  filesError.value = "";
  repoListing.value = [];

  try {
    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("not_github_repo");

    const ref = selectedRef.value || "main";

    // root: /contents?ref=...
    // subdir: /contents/<path>?ref=...
    const base = `https://api.github.com/repos/${info.owner}/${info.repo}/contents`;
    const api = pathInRepo
      ? `${base}/${encodeURIComponent(pathInRepo).replace(/%2F/g, "/")}?ref=${encodeURIComponent(ref)}`
      : `${base}?ref=${encodeURIComponent(ref)}`;

    const data = await githubFetchJson(api);

    if (!Array.isArray(data)) throw new Error("unexpected_contents_shape");

    const list = sortListing(data.map(normalizeContentsItem).filter((x) => x.path));
    repoListing.value = list;
    currentPath.value = (pathInRepo || "").trim();
  } catch (e) {
    filesError.value = (e && e.message) || "cannot_load_files";
  } finally {
    filesLoading.value = false;
  }
}

function goRoot() {
  loadDir("");
}

function goCrumb(p) {
  loadDir(p || "");
}

function openNode(n) {
  if (!n) return;
  if (n.type === "dir") {
    loadDir(n.path);
    return;
  }
  // file -> open on GitHub
  const url = openFileLink(n);
  if (url) window.open(url, "_blank", "noreferrer");
}

function openFileLink(node) {
  const repoUrl = pkgRepoUrl.value;
  const ref = selectedRef.value || "main";
  if (!repoUrl) return "";

  if (node.type === "dir") return githubTreeUrl({ repoUrl, ref, path: node.path });
  return githubBlobUrl({ repoUrl, ref, path: node.path });
}

function niceSize(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/* =========================
   DOCS (fix: fallback to include scan)
   Before, you probably had a loose scan that "worked".
   Now we keep exports.headers, BUT if missing we do a lightweight scan:
   - list /contents/include
   - try to find a best candidate header (name.hpp, name/name.hpp, <first .hpp>)
   Only 1 or 2 requests.
========================= */
function extractCppSymbols(text) {
  const src = (text || "").toString();
  const out = { namespaces: [], types: [], functions: [] };

  const nsRe = /^\s*namespace\s+([a-zA-Z_]\w*)\s*\{/gm;
  const typeRe =
    /^\s*(?:template\s*<[^>]*>\s*)?(class|struct|enum(?:\s+class)?)\s+([a-zA-Z_]\w*)/gm;

  const fnRe =
    /^\s*(?:inline\s+)?(?:constexpr\s+)?(?:static\s+)?([a-zA-Z_:\<\>\w\s\*&]+?)\s+([a-zA-Z_]\w*)\s*\(([^\)]*)\)\s*(?:noexcept)?\s*(?:;|\{)/gm;

  for (const m of src.matchAll(nsRe)) out.namespaces.push(m[1]);
  for (const m of src.matchAll(typeRe)) out.types.push(`${m[1]} ${m[2]}`);
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
  out.functions = Array.from(new Set(out.functions)).slice(0, 300);
  return out;
}

function pickHeaderFromIncludeList(list, pkgName) {
  const name = (pkgName || "").toString().trim();
  const files = Array.isArray(list) ? list : [];
  const hpps = files.filter((x) => x.type === "file" && /\.h(pp)?$/i.test(x.name || x.path || ""));
  if (!hpps.length) return "";

  // Prefer include/<name>.hpp
  if (name) {
    const direct = hpps.find((x) => (x.path || "").toLowerCase() === `include/${name.toLowerCase()}.hpp`);
    if (direct) return direct.path;

    const nested = hpps.find((x) => (x.path || "").toLowerCase() === `include/${name.toLowerCase()}/${name.toLowerCase()}.hpp`);
    if (nested) return nested.path;
  }

  // Else prefer include/<name>/... first .hpp
  if (name) {
    const pref = hpps.find((x) => (x.path || "").toLowerCase().startsWith(`include/${name.toLowerCase()}/`));
    if (pref) return pref.path;
  }

  // Else first .hpp
  return hpps[0].path || "";
}

async function loadDocs() {
  docsLoading.value = true;
  docsError.value = "";
  symbols.value = { namespaces: [], types: [], functions: [] };
  docsHeaderPath.value = "";

  try {
    const p = pkg.value || {};
    const repoUrl = pkgRepoUrl.value;
    if (!repoUrl) throw new Error("missing_repo_url");

    const ref = selectedRef.value || "main";

    const exportsHeaders =
      p.exports && Array.isArray(p.exports.headers) ? p.exports.headers : [];

    const name = (p.name || "").toString().trim();
    const candidates = [];

    // 1) registry exports (preferred)
    if (exportsHeaders.length) {
      for (const h of exportsHeaders) {
        const hp = (h || "").toString().trim();
        if (!hp) continue;

        candidates.push(hp);
        candidates.push(`include/${hp}`);
        if (name) candidates.push(`include/${name}/${hp}`);
        candidates.push(`include/${hp.replace(/^\//, "")}`);
      }
    }

    // 2) fallback include scan (this is what "worked" before)
    if (!candidates.length) {
      const info = parseGitHubRepo(repoUrl);
      if (!info) throw new Error("not_github_repo");

      // list include dir (1 request)
      const api = `https://api.github.com/repos/${info.owner}/${info.repo}/contents/include?ref=${encodeURIComponent(ref)}`;
      let includeList = [];
      try {
        const data = await githubFetchJson(api);
        if (Array.isArray(data)) includeList = data.map(normalizeContentsItem);
      } catch {
        includeList = [];
      }

      // If include contains subdirs, we still can pick common files at include root.
      // If include root has only dirs, we try 1 more request for include/<name> when possible.
      let picked = pickHeaderFromIncludeList(includeList, name);

      if (!picked && name) {
        try {
          const api2 = `https://api.github.com/repos/${info.owner}/${info.repo}/contents/include/${encodeURIComponent(name)}?ref=${encodeURIComponent(ref)}`;
          const data2 = await githubFetchJson(api2);
          if (Array.isArray(data2)) {
            const list2 = data2.map(normalizeContentsItem);
            const direct = list2.find((x) => x.type === "file" && (x.name || "").toLowerCase() === `${name.toLowerCase()}.hpp`);
            picked = direct ? direct.path : (list2.find((x) => x.type === "file" && /\.h(pp)?$/i.test(x.name || ""))?.path || "");
          }
        } catch {}
      }

      if (picked) candidates.push(picked);
    }

    // Always add common fallbacks
    if (name) {
      candidates.push(`include/${name}/${name}.hpp`);
      candidates.push(`include/${name}.hpp`);
      candidates.push(`include/${name}/${name}.h`);
      candidates.push(`include/${name}.h`);
    }

    // Try candidates by raw fetch (cheap)
    let headerText = "";
    let picked = "";
    for (const c of candidates) {
      const pathInRepo = (c || "").toString().trim().replace(/^\/+/, "");
      if (!pathInRepo) continue;
      try {
        headerText = await githubFetchText(githubRawUrl({ repoUrl, ref, path: pathInRepo }));
        if (headerText) {
          picked = pathInRepo;
          break;
        }
      } catch {}
    }

    if (!headerText) {
      docsError.value = exportsHeaders.length ? "no_exported_header_found" : "no_header_detected";
      return;
    }

    docsHeaderPath.value = picked;
    symbols.value = extractCppSymbols(headerText);
  } catch (e) {
    docsError.value = (e && e.message) || "cannot_load_docs";
  } finally {
    docsLoading.value = false;
  }
}

/* UI helpers */
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
  const includeLine = h
    ? `#include <${h}>`
    : name
      ? `#include <${name}/${name}.hpp>`
      : "#include <...>";

  return includeLine;
});

const isDocsMissingExports = computed(() => {
  const p = pkg.value || {};
  const headers = p.exports && Array.isArray(p.exports.headers) ? p.exports.headers : [];
  return !headers.length;
});

async function refreshTabData() {
  if (!pkg.value) return;

  await loadReadme();

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
      currentPath.value = ""; // reset explorer
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

    readmeHtml.value = "";
    readmeError.value = "";

    repoListing.value = [];
    currentPath.value = "";
    filesError.value = "";

    symbols.value = { namespaces: [], types: [], functions: [] };
    docsHeaderPath.value = "";
    docsError.value = "";

    askPackage();
  },
);

watch(
  () => activeTab.value,
  async () => {
    if (!pkg.value) return;
    if (activeTab.value === "files") await loadDir(currentPath.value || "");
    if (activeTab.value === "docs") await loadDocs();
    if (activeTab.value === "overview") await loadReadme();
  },
);

watch(
  () => selectedVersion.value,
  async () => {
    if (!pkg.value) return;
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
            </div>

            <div class="side">
              <div class="badge-grid">
                <div class="badge" v-for="b in overviewBadges" :key="b.k">
                  <div class="k">{{ b.k }}</div>
                  <div class="v">{{ b.v }}</div>
                </div>
              </div>

              <div class="version-pick" v-if="sortedVersions.length">
                <span class="muted">Version</span>
                <select v-model="selectedVersion">
                  <option v-for="v in sortedVersions" :key="v.version" :value="v.version">
                    {{ v.version }}
                  </option>
                </select>
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
                <pre><code>{{ installSnippet }}</code></pre>
              </div>

              <div class="snippet">
                <div class="label">Include</div>
                <pre><code>{{ includeSnippet }}</code></pre>
              </div>

              <div class="tags-wrap" v-if="pkg.keywords && pkg.keywords.length">
                <div class="label">Keywords</div>
                <div class="tags">
                  <span class="tag" v-for="k in pkg.keywords" :key="k">{{ k }}</span>
                </div>
              </div>

              <div class="hint">
                <span class="dot"></span>
                Tip: add a tag in your registry metadata for stable browsing.
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
                <div class="hint soft" v-if="pkgRepoUrl">
                  Try opening the repo and check if the README exists for this ref.
                </div>
              </div>
              <div class="readme" v-else v-html="readmeHtml"></div>
            </div>
          </div>

          <!-- DOCS -->
          <div v-else-if="activeTab === 'docs'" class="docs">
            <div class="card">
              <div class="card-title">Header scan</div>

              <div class="state" v-if="docsLoading">
                <span class="spinner"></span>
                Building docs...
              </div>

              <div class="state error" v-else-if="docsError">
                <div class="err-title">No docs available</div>

                <div class="err-sub" v-if="docsError === 'no_exported_header_found'">
                  Registry exports exist, but the header could not be fetched for this ref.
                </div>

                <div class="err-sub" v-else-if="docsError === 'no_header_detected'">
                  No header could be detected automatically.
                  Try adding exports.headers in the registry entry.
                </div>

                <div class="err-sub" v-else>
                  Error: {{ docsError }}
                </div>

                <div class="hint soft" v-if="isDocsMissingExports">
                  Note: this package does not publish exports.headers. We tried an include/ scan fallback.
                </div>
              </div>

              <div v-else class="docs-grid">
                <div class="docs-meta">
                  <div class="muted">{{ id }}</div>
                  <div class="muted" v-if="docsHeaderPath">
                    Source:
                    <a class="link" :href="openFileLink({ type: 'file', path: docsHeaderPath, name: docsHeaderPath, path: docsHeaderPath, type: 'file' })" target="_blank" rel="noreferrer">
                      {{ docsHeaderPath }}
                    </a>
                  </div>
                </div>

                <div class="mini-grid">
                  <div class="mini">
                    <div class="mini-title">Namespaces</div>
                    <div class="muted" v-if="!symbols.namespaces.length">None found</div>
                    <ul v-else class="list">
                      <li v-for="n in symbols.namespaces" :key="n">{{ n }}</li>
                    </ul>
                  </div>

                  <div class="mini">
                    <div class="mini-title">Types</div>
                    <div class="muted" v-if="!symbols.types.length">None found</div>
                    <ul v-else class="list">
                      <li v-for="t in symbols.types" :key="t"><code>{{ t }}</code></li>
                    </ul>
                  </div>

                  <div class="mini">
                    <div class="mini-title">Functions</div>
                    <div class="muted" v-if="!symbols.functions.length">None found</div>
                    <ul v-else class="list">
                      <li v-for="f in symbols.functions" :key="f"><code>{{ f }}</code></li>
                    </ul>
                  </div>
                </div>

                <div class="hint soft">
                  Best-effort parsing for quick browsing.
                </div>
              </div>
            </div>
          </div>

          <!-- FILES (Explorer) -->
          <div v-else-if="activeTab === 'files'" class="files">
            <div class="card">
              <div class="card-title">Files</div>

              <div class="crumbs">
                <button class="crumb" @click="goRoot" :class="{ active: !currentPath }">
                  root
                </button>
                <template v-for="p in pathStack" :key="p">
                  <span class="sep">/</span>
                  <button class="crumb" @click="goCrumb(p)" :class="{ active: currentPath === p }">
                    {{ p.split('/').pop() }}
                  </button>
                </template>
              </div>

              <div class="state" v-if="filesLoading">
                <span class="spinner"></span>
                Loading folder...
              </div>

              <div class="state error" v-else-if="filesError">
                Error: {{ filesError }}
                <div class="hint soft">
                  If you hit GitHub rate limits, refresh later.
                </div>
              </div>

              <div v-else class="file-list">
                <div class="file-row head">
                  <div class="c1">Name</div>
                  <div class="c2">Size</div>
                  <div class="c3"></div>
                </div>

                <button
                  v-if="currentPath"
                  class="file-row back"
                  @click="goCrumb(pathStack.length >= 2 ? pathStack[pathStack.length - 2] : '')"
                >
                  <div class="c1">
                    <span class="icon dir"></span>
                    <span class="path">..</span>
                  </div>
                  <div class="c2"><span class="muted"></span></div>
                  <div class="c3"><span class="arrow">›</span></div>
                </button>

                <button
                  v-for="n in repoListing"
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
                  <div class="c3">
                    <span class="arrow">›</span>
                  </div>
                </button>

                <div class="hint soft" v-if="pkgRepoUrl">
                  Open on GitHub:
                  <a class="link" :href="openFileLink({ type: 'dir', path: currentPath || '' }) || pkgRepoUrl" target="_blank" rel="noreferrer">
                    {{ currentPath ? currentPath : "repo root" }}
                  </a>
                </div>
              </div>
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
                Best practice: publish both tag and commit for each version.
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

.muted { color: rgba(148, 163, 184, 0.95); font-weight: 750; }

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

.version-pick {
  display: flex;
  justify-content: flex-end;
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

/* files explorer */
.crumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin: 8px 0 12px;
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

.file-list { display: flex; flex-direction: column; }
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

/* versions */
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

/* docs */
.docs-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.mini-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.mini {
  border: 1px solid rgba(148, 163, 184, 0.10);
  background: rgba(15, 23, 42, 0.16);
  border-radius: 14px;
  padding: 10px;
}
.mini-title { font-weight: 950; color: rgba(229, 249, 246, 0.95); margin-bottom: 8px; }
.list { margin: 0; padding-left: 18px; }
.list li { margin: 6px 0; }

@media (max-width: 980px) {
  .header-top { grid-template-columns: 1fr; }
  .badge-grid { grid-template-columns: 1fr; }
  .version-pick { justify-content: flex-start; }
  .grid { grid-template-columns: 1fr; }
  .v-row { grid-template-columns: 1fr; }
  .file-row { grid-template-columns: 1fr 90px 26px; }
}
</style>
