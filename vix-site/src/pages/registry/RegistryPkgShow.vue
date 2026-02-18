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
const filesLoading = ref(false);
const filesError = ref("");
const repoTree = ref([]); // github tree nodes

const docsLoading = ref(false);
const docsError = ref("");
const symbols = ref({ namespaces: [], types: [], functions: [] });
const docsHeaderPath = ref("");

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
  // Prefer tag for stable browsing, else commit
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

async function githubFetchJson(url) {
  const headers = { Accept: "application/vnd.github+json" };
  const token = (import.meta.env.VITE_GITHUB_TOKEN || "").trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`github_http_${res.status}`);
  return await res.json();
}

async function githubFetchText(url) {
  const headers = {};
  const token = (import.meta.env.VITE_GITHUB_TOKEN || "").trim();
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

async function loadReadme() {
  readmeLoading.value = true;
  readmeError.value = "";
  readmeHtml.value = "";

  try {
    const p = pkg.value || {};
    const fromIndex = (p.readme || "").toString();
    if (fromIndex) {
      readmeHtml.value = await renderMarkdown(fromIndex);
      readmeLoading.value = false;
      return;
    }

    const repoUrl = pkgRepoUrl.value;
    if (!repoUrl) throw new Error("missing_repo_url");

    const ref = selectedRef.value || "main";

    // common paths
    const candidates = ["README.md", "readme.md", "README.MD"];
    let md = "";
    for (const c of candidates) {
      try {
        md = await githubFetchText(githubRawUrl({ repoUrl, ref, path: c }));
        if (md) break;
      } catch {
        // try next
      }
    }

    if (!md) throw new Error("readme_not_found");
    readmeHtml.value = await renderMarkdown(md);
  } catch (e) {
    readmeError.value = (e && e.message) || "cannot_load_readme";
  } finally {
    readmeLoading.value = false;
  }
}

async function loadFiles() {
  filesLoading.value = true;
  filesError.value = "";
  repoTree.value = [];

  try {
    const repoUrl = pkgRepoUrl.value;
    const info = parseGitHubRepo(repoUrl);
    if (!info) throw new Error("not_github_repo");

    const commit = selectedCommit.value;
    if (!commit) throw new Error("missing_commit_for_version");

    const api = `https://api.github.com/repos/${info.owner}/${info.repo}/git/trees/${commit}?recursive=1`;
    const data = await githubFetchJson(api);

    const tree = Array.isArray(data.tree) ? data.tree : [];
    repoTree.value = tree;
  } catch (e) {
    filesError.value = (e && e.message) || "cannot_load_files";
  } finally {
    filesLoading.value = false;
  }
}

function extractCppSymbols(text) {
  const src = (text || "").toString();
  const out = { namespaces: [], types: [], functions: [] };

  const nsRe = /^\s*namespace\s+([a-zA-Z_]\w*)\s*\{/gm;
  const typeRe =
    /^\s*(?:template\s*<[^>]*>\s*)?(class|struct|enum(?:\s+class)?)\s+([a-zA-Z_]\w*)/gm;

  // best effort functions (not perfect)
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

    // If registry says "binary_search.hpp", try a few likely locations
    for (const h of exportsHeaders) {
      const hp = (h || "").toString().trim();
      if (!hp) continue;
      candidates.push(hp);
      candidates.push(`include/${hp}`);
      if (name) candidates.push(`include/${name}/${hp}`);
      candidates.push(`include/${name}/${hp.replace(/^\//, "")}`);
    }

    // fallback common
    if (name) {
      candidates.push(`include/${name}/${name}.hpp`);
      candidates.push(`include/${name}/${name}.h`);
      candidates.push(`include/${name}.hpp`);
    }

    let headerText = "";
    let picked = "";
    for (const c of candidates) {
      try {
        headerText = await githubFetchText(
          githubRawUrl({ repoUrl, ref, path: c })
        );
        if (headerText) {
          picked = c;
          break;
        }
      } catch {
        // try next
      }
    }

    if (!headerText) {
      throw new Error("no_exported_header_found");
    }

    docsHeaderPath.value = picked;
    symbols.value = extractCppSymbols(headerText);
  } catch (e) {
    docsError.value = (e && e.message) || "cannot_load_docs";
  } finally {
    docsLoading.value = false;
  }
}

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
  // prefer the header name if provided
  const includeLine = h
    ? `#include <${h}>`
    : name
      ? `#include <${name}/${name}.hpp>`
      : "#include <...>";

  return includeLine;
});

const packageRootList = computed(() => {
  // JSR-like: show a compact list of important roots
  const tree = repoTree.value || [];
  const want = new Set([
    "README.md",
    "readme.md",
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

  // Map dirs that exist
  const hasDir = (dir) =>
    tree.some((n) => n && n.type === "tree" && n.path === dir);

  const out = [];

  for (const n of tree) {
    if (!n || !n.path) continue;

    const p = n.path;

    // file at root
    if (!p.includes("/") && want.has(p)) {
      out.push(n);
      continue;
    }
  }

  // dirs (include, src, tests, examples, docs)
  for (const d of ["include", "src", "tests", "examples", "docs"]) {
    if (hasDir(d)) out.push({ path: d, type: "tree" });
  }

  // keep stable ordering like JSR
  const order = [
    "README.md",
    "readme.md",
    "LICENSE",
    "LICENSE.md",
    "vix.json",
    "deno.json",
    "package.json",
    "CMakeLists.txt",
    "CMakePresets.json",
    "include",
    "src",
    "tests",
    "examples",
    "docs",
  ];

  out.sort((a, b) => {
    const ia = order.indexOf(a.path);
    const ib = order.indexOf(b.path);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.path.localeCompare(b.path);
  });

  // unique by path
  const seen = new Set();
  return out.filter((x) => {
    if (seen.has(x.path)) return false;
    seen.add(x.path);
    return true;
  });
});

function openFileLink(node) {
  const repoUrl = pkgRepoUrl.value;
  const ref = selectedRef.value || "main";
  if (!repoUrl) return "";

  if (node.type === "tree") return githubTreeUrl({ repoUrl, ref, path: node.path });
  return githubBlobUrl({ repoUrl, ref, path: node.path });
}

function niceSize(bytes) {
  const n = Number(bytes || 0);
  if (!n || n <= 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ensureSelectedVersion() {
  const v = pkgLatest.value || "";
  if (!selectedVersion.value) selectedVersion.value = v;
  if (!selectedVersion.value) {
    // fallback: pick latest from sorted list
    const first = sortedVersions.value[0];
    if (first && first.version) selectedVersion.value = first.version;
  }
}

async function refreshTabData() {
  if (!pkg.value) return;

  // Always keep overview ready
  await loadReadme();

  if (activeTab.value === "files") await loadFiles();
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
    repoTree.value = [];
    symbols.value = { namespaces: [], types: [], functions: [] };
    askPackage();
  }
);

watch(
  () => activeTab.value,
  async () => {
    if (!pkg.value) return;
    // load only what tab needs
    if (activeTab.value === "files" && !repoTree.value.length) await loadFiles();
    if (activeTab.value === "docs" && !symbols.value.functions.length && !symbols.value.types.length) await loadDocs();
  }
);

watch(
  () => selectedVersion.value,
  async () => {
    if (!pkg.value) return;
    // Version changes impacts overview (readme ref), files and docs
    await loadReadme();
    if (activeTab.value === "files") await loadFiles();
    if (activeTab.value === "docs") await loadDocs();
  }
);

watch(
  () => route.query.tab,
  (t) => {
    const v = (t || "overview").toString();
    if (v && v !== activeTab.value) activeTab.value = v;
  }
);
</script>

<template>
  <section class="page">
    <div class="container">
      <div class="state" v-if="loading">Loading package...</div>
      <div class="state error" v-else-if="error">Error: {{ error }}</div>

      <template v-else-if="pkg">
        <header class="header">
          <div class="title-row">
            <div class="pkg-title">
              <div class="pkg-id">{{ id }}</div>
              <div class="pkg-name">{{ pkgDisplayName }}</div>
            </div>

            <div class="right">
              <div class="badge" v-for="b in overviewBadges" :key="b.k">
                <div class="k">{{ b.k }}</div>
                <div class="v">{{ b.v }}</div>
              </div>
            </div>
          </div>

          <div class="desc" v-if="pkg.description">{{ pkg.description }}</div>

          <div class="meta-row">
            <div class="left-meta">
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

            <div class="version-pick" v-if="sortedVersions.length">
              <span class="muted">Version</span>
              <select v-model="selectedVersion">
                <option
                  v-for="v in sortedVersions"
                  :key="v.version"
                  :value="v.version"
                >
                  {{ v.version }}
                </option>
              </select>
            </div>
          </div>

          <nav class="tabs">
            <button
              class="tab"
              :class="{ active: activeTab === 'overview' }"
              @click="setTab('overview')"
            >
              Overview
            </button>
            <button
              class="tab"
              :class="{ active: activeTab === 'docs' }"
              @click="setTab('docs')"
            >
              Docs
            </button>
            <button
              class="tab"
              :class="{ active: activeTab === 'files' }"
              @click="setTab('files')"
            >
              Files
            </button>
            <button
              class="tab"
              :class="{ active: activeTab === 'versions' }"
              @click="setTab('versions')"
            >
              Versions
            </button>
          </nav>
        </header>

        <!-- OVERVIEW -->
        <section v-if="activeTab === 'overview'" class="panel">
          <div class="grid">
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

              <div class="muted" v-if="pkg.keywords && pkg.keywords.length">
                <div class="label">Keywords</div>
                <div class="tags">
                  <span class="tag" v-for="k in pkg.keywords" :key="k">{{ k }}</span>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-title">README</div>
              <div class="state" v-if="readmeLoading">Loading README...</div>
              <div class="state error" v-else-if="readmeError">Error: {{ readmeError }}</div>
              <div class="readme" v-else v-html="readmeHtml"></div>
            </div>
          </div>
        </section>

        <!-- DOCS -->
        <section v-else-if="activeTab === 'docs'" class="panel">
          <div class="docs-head">
            <div class="muted">
              {{ id }}
            </div>
            <div class="muted" v-if="docsHeaderPath">
              Source: <a class="link" :href="openFileLink({ type: 'blob', path: docsHeaderPath })" target="_blank" rel="noreferrer">{{ docsHeaderPath }}</a>
            </div>
          </div>

          <div class="state" v-if="docsLoading">Building docs...</div>
          <div class="state error" v-else-if="docsError">Error: {{ docsError }}</div>

          <template v-else>
            <div class="docs-grid">
              <div class="card">
                <div class="card-title">Namespaces</div>
                <div class="muted" v-if="!symbols.namespaces.length">No documentation available</div>
                <ul v-else class="list">
                  <li v-for="n in symbols.namespaces" :key="n">{{ n }}</li>
                </ul>
              </div>

              <div class="card">
                <div class="card-title">Types</div>
                <div class="muted" v-if="!symbols.types.length">No documentation available</div>
                <ul v-else class="list">
                  <li v-for="t in symbols.types" :key="t"><code>{{ t }}</code></li>
                </ul>
              </div>

              <div class="card">
                <div class="card-title">Functions</div>
                <div class="muted" v-if="!symbols.functions.length">No documentation available</div>
                <ul v-else class="list">
                  <li v-for="f in symbols.functions" :key="f"><code>{{ f }}</code></li>
                </ul>
              </div>
            </div>
          </template>
        </section>

        <!-- FILES -->
        <section v-else-if="activeTab === 'files'" class="panel">
          <div class="card">
            <div class="card-title">Package root</div>

            <div class="state" v-if="filesLoading">Loading files...</div>
            <div class="state error" v-else-if="filesError">Error: {{ filesError }}</div>

            <div v-else class="files">
              <div class="file-row head">
                <div class="c1">Path</div>
                <div class="c2">Size</div>
                <div class="c3"></div>
              </div>

              <a
                v-for="n in packageRootList"
                :key="n.path"
                class="file-row"
                :href="openFileLink(n.type === 'tree' ? { type: 'tree', path: n.path } : { type: 'blob', path: n.path })"
                target="_blank"
                rel="noreferrer"
              >
                <div class="c1">
                  <span class="icon" :class="n.type === 'tree' ? 'dir' : 'file'"></span>
                  <span class="path">{{ n.path }}</span>
                </div>
                <div class="c2">
                  <span class="muted">{{ niceSize(n.size) }}</span>
                </div>
                <div class="c3">
                  <span class="arrow">›</span>
                </div>
              </a>

              <div class="muted tip" v-if="pkgRepoUrl">
                Full tree available on GitHub: <a class="link" :href="pkgRepoUrl" target="_blank" rel="noreferrer">open repo</a>
              </div>
            </div>
          </div>
        </section>

        <!-- VERSIONS -->
        <section v-else-if="activeTab === 'versions'" class="panel">
          <div class="card">
            <div class="card-title">Versions</div>

            <div class="versions">
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
          </div>
        </section>
      </template>

      <div class="state" v-else>Not found.</div>
    </div>
  </section>
</template>

<style scoped>
.page{
  min-height: 100vh;
  background: linear-gradient(to bottom, #020617, #031b1a);
  color: rgba(226,232,240,.92);
}

.container{
  max-width: 1160px;
  margin: 0 auto;
  padding: 18px 16px 44px;
}

.state{
  padding: 14px 0;
  color: rgba(148,163,184,.95);
  font-weight: 700;
}
.state.error{
  color: rgba(248,113,113,.95);
}

.header{
  border: 1px solid rgba(148,163,184,.14);
  border-radius: 14px;
  background: rgba(2,6,23,.35);
  padding: 14px;
}

.title-row{
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.pkg-id{
  font-weight: 950;
  color: rgba(94,234,212,.95);
  letter-spacing: .2px;
}
.pkg-name{
  margin-top: 4px;
  font-weight: 950;
  font-size: 1.25rem;
  color: rgba(229,249,246,.95);
}

.right{
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 10px;
}

.badge{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.25);
  border-radius: 12px;
  padding: 10px 12px;
}
.badge .k{
  color: rgba(148,163,184,.95);
  font-weight: 800;
  font-size: .85rem;
}
.badge .v{
  margin-top: 4px;
  color: rgba(226,232,240,.92);
  font-weight: 950;
}

.desc{
  margin-top: 10px;
  color: rgba(226,232,240,.88);
  max-width: 860px;
}

.meta-row{
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.left-meta{
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.muted{ color: rgba(148,163,184,.95); font-weight: 700; }

.link{
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 900;
}

.version-pick{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
select{
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(2,6,23,.55);
  color: rgba(226,232,240,.92);
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 900;
}

.tabs{
  margin-top: 14px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(148,163,184,.12);
  padding-top: 12px;
}
.tab{
  border: 1px solid rgba(148,163,184,.16);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 950;
  cursor: pointer;
}
.tab.active{
  border-color: rgba(94,234,212,.55);
  box-shadow: 0 0 0 3px rgba(94,234,212,.12);
}

.panel{
  margin-top: 14px;
}

.grid{
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
}

.docs-grid{
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.card{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(2,6,23,.25);
  border-radius: 14px;
  padding: 12px;
}

.card-title{
  font-weight: 950;
  color: rgba(229,249,246,.95);
  margin-bottom: 10px;
}

.snippet{
  margin-top: 10px;
}
.label{
  color: rgba(148,163,184,.95);
  font-weight: 900;
  font-size: .9rem;
  margin-bottom: 6px;
}
pre{
  margin: 0;
  overflow: auto;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(148,163,184,.12);
  background: rgba(15,23,42,.25);
}
code{
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
  font-size: .92rem;
}

.tags{
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: .9rem;
}

.readme{
  color: rgba(226,232,240,.92);
  line-height: 1.7;
  font-size: .98rem;
}

/* markdown */
.readme :deep(h1),
.readme :deep(h2),
.readme :deep(h3){
  color: rgba(229,249,246,.95);
  font-weight: 950;
  margin: 18px 0 10px;
}
.readme :deep(h1){
  font-size: 1.35rem;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(148,163,184,.14);
}
.readme :deep(h2){
  font-size: 1.15rem;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(148,163,184,.12);
}
.readme :deep(p){ margin: 10px 0; }
.readme :deep(ul),
.readme :deep(ol){ margin: 10px 0; padding-left: 22px; }
.readme :deep(li){ margin: 6px 0; }
.readme :deep(a){ color: #1a73e8; text-decoration: none; }
.readme :deep(a:hover){ text-decoration: underline; text-underline-offset: 2px; }
.readme :deep(pre.shiki){
  margin: 12px 0;
  overflow: auto;
  border-radius: 12px;
  border: 1px solid rgba(148,163,184,.12);
}

/* files */
.files{ display: flex; flex-direction: column; }
.file-row{
  display: grid;
  grid-template-columns: 1fr 120px 26px;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  border-top: 1px solid rgba(148,163,184,.10);
  text-decoration: none;
  color: rgba(226,232,240,.92);
}
.file-row.head{
  border-top: 0;
  color: rgba(148,163,184,.95);
  font-weight: 900;
}
.file-row:hover{
  background: rgba(15,23,42,.20);
}
.icon{
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  margin-right: 10px;
  vertical-align: middle;
}
.icon.dir{ background: rgba(59,130,246,.65); }
.icon.file{ background: rgba(94,234,212,.65); }
.path{ font-weight: 900; }
.arrow{
  color: rgba(148,163,184,.95);
  font-size: 18px;
  font-weight: 900;
}
.tip{ margin-top: 10px; }

/* versions */
.versions{ display: flex; flex-direction: column; }
.v-row{
  display: grid;
  grid-template-columns: 140px 140px 120px 1fr 220px;
  gap: 12px;
  align-items: center;
  padding: 10px 8px;
  border-top: 1px solid rgba(148,163,184,.10);
}
.v-row.head{
  border-top: 0;
  color: rgba(148,163,184,.95);
  font-weight: 900;
}
.pick{
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  border-radius: 10px;
  padding: 6px 10px;
  font-weight: 950;
  cursor: pointer;
}
.pick:hover{
  border-color: rgba(94,234,212,.55);
}
.pill{
  margin-left: 8px;
  border: 1px solid rgba(94,234,212,.35);
  background: rgba(94,234,212,.10);
  color: rgba(94,234,212,.95);
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 950;
  font-size: .8rem;
}

/* docs */
.docs-head{
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.list{
  margin: 0;
  padding-left: 18px;
}
.list li{
  margin: 6px 0;
}

@media (max-width: 980px){
  .right{ grid-template-columns: 1fr; }
  .grid{ grid-template-columns: 1fr; }
  .v-row{ grid-template-columns: 1fr; }
  .file-row{ grid-template-columns: 1fr 90px 26px; }
}
</style>
