<script setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from "vue";
import { createHighlighter } from "shiki";
import { marked } from "marked";
import PkgPreviewModal from "./PkgPreviewModal.vue";

const props = defineProps({
  pkgRepoUrl: { type: String, default: "" },

  filesLoading: { type: Boolean, default: false },
  filesError: { type: String, default: "" },

  currentPath: { type: String, default: "" },
  pathStack: { type: Array, default: () => [] },

  goRoot: { type: Function, required: true },
  goCrumb: { type: Function, required: true },
  goUp: { type: Function, required: true },

  globalSearchOpen: { type: Boolean, default: false },
  globalSearchQuery: { type: String, default: "" },
  globalSearchLoading: { type: Boolean, default: false },
  globalSearchError: { type: String, default: "" },
  globalSearchResults: { type: Array, default: () => [] },

  runGlobalSearch: { type: Function, required: true },

  filesFilter: { type: String, default: "" },
  filesShowHidden: { type: Boolean, default: false },
  filesSortKey: { type: String, default: "type" },
  filesSortDir: { type: String, default: "asc" },

  toggleSort: { type: Function, required: true },

  visibleListing: { type: Array, default: () => [] },
  canLoadMore: { type: Boolean, default: false },
  loadMore: { type: Function, required: true },
  filteredSortedListingLen: { type: Number, default: 0 },

  openNode: { type: Function, required: true },
  niceSize: { type: Function, required: true },

  nodeWebUrl: { type: Function, required: true },

  previewOpen: { type: Boolean, default: false },
  previewLoading: { type: Boolean, default: false },
  previewError: { type: String, default: "" },
  previewNode: { type: Object, default: null },
  previewText: { type: String, default: "" },
  previewHtml: { type: String, default: "" },
  previewLang: { type: String, default: "txt" },

  copyPreviewPath: { type: Function, required: true },
  copyPreviewRawUrl: { type: Function, required: true },
  downloadPreviewFile: { type: Function, required: true },
  closePreview: { type: Function, required: true },
});

const emit = defineEmits([
  "update:globalSearchOpen",
  "update:globalSearchQuery",
  "update:filesFilter",
  "update:filesShowHidden",
]);

function toggleSearch() {
  emit("update:globalSearchOpen", !props.globalSearchOpen);
}

function onSearchInput(e) {
  emit("update:globalSearchQuery", e?.target?.value ?? "");
}

function onFilterInput(e) {
  emit("update:filesFilter", e?.target?.value ?? "");
}

function onHiddenToggle(e) {
  emit("update:filesShowHidden", !!e?.target?.checked);
}

function currentDirWebUrl() {
  if (props.currentPath) {
    return props.nodeWebUrl({ type: "dir", name: props.currentPath, path: props.currentPath });
  }
  return props.pkgRepoUrl || "";
}

function navRoot() {
  if (props.previewOpen) props.closePreview();
  props.goRoot();
}

function navUp() {
  if (props.previewOpen) props.closePreview();
  props.goUp();
}

function navCrumb(p) {
  if (props.previewOpen) props.closePreview();
  props.goCrumb(p);
}

const inPreview = computed(() => !!props.previewOpen);
const showListingBody = computed(() => !inPreview.value);
const showSearchPanel = computed(() => !inPreview.value && props.globalSearchOpen);

function previewPathLabel() {
  const p = props.previewNode?.path || props.previewNode?.name || "";
  return p ? `Package root / ${p}` : "Package root";
}

/* -------------------------
   Single renderer
-------------------------- */
let shiki = null;
let seq = 0;
const highlightedHtml = ref("");

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeLang(lang) {
  const l = String(lang || "txt").toLowerCase();
  if (l === "hpp" || l === "h" || l === "hh" || l === "hxx" || l === "cxx") return "cpp";
  if (l === "cc") return "cpp";
  if (l === "sh") return "bash";
  if (l === "yml") return "yaml";
  return l || "txt";
}

function isMarkdown(pathOrName) {
  const s = String(pathOrName || "").toLowerCase();
  return s.endsWith(".md") || s.endsWith(".markdown");
}

async function ensureShiki() {
  if (shiki) return shiki;
  shiki = await createHighlighter({
    themes: ["github-dark"],
    langs: ["cpp", "c", "bash", "js", "ts", "json", "md", "yaml", "txt", "html", "css", "toml", "ini", "sql"],
  });
  return shiki;
}

async function highlightPreview() {
  const my = ++seq;

  // reset (avoid stale output)
  highlightedHtml.value = "";

  if (!props.previewOpen) return;

  const txt = String(props.previewText || "");
  if (!txt) return;

  const node = props.previewNode;
  const pathOrName = node?.path || node?.name || "";

  // 1) Markdown: render via marked (single render)
  if (isMarkdown(pathOrName)) {
    highlightedHtml.value = `<article class="md github-dark">${marked.parse(txt)}</article>`;
    return;
  }

  // 2) If parent gave HTML, use it
  if (props.previewHtml) {
    highlightedHtml.value = props.previewHtml;
    return;
  }

  // 3) Shiki code highlighting
  try {
    const h = await ensureShiki();
    if (my !== seq) return;

    const lang = normalizeLang(props.previewLang);
    highlightedHtml.value = h.codeToHtml(txt, { lang, theme: "github-dark" });
  } catch {
    if (my !== seq) return;
    highlightedHtml.value = `<pre class="code-pre"><code>${escapeHtml(txt)}</code></pre>`;
  }
}

watch(
  () => [
    props.previewOpen,
    props.previewText,
    props.previewLang,
    props.previewHtml,
    props.previewNode?.path,
    props.previewNode?.name,
  ],
  async () => {
    await nextTick();
    await highlightPreview();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  shiki = null;
});
</script>
<template>
  <div class="files">
    <!-- Always keep a top header like JSR (history + actions) -->
    <div class="topbar">
      <div class="top-left">
        <div class="top-title">Package root</div>

        <div class="crumbs" aria-label="Breadcrumb">
          <button class="crumb" type="button" @click="navRoot" :class="{ active: !currentPath }">
            root
          </button>

          <template v-for="p in pathStack" :key="p">
            <span class="sep">/</span>
            <button class="crumb" type="button" @click="navCrumb(p)"  :class="{ active: currentPath === p }">
              {{ p.split("/").pop() }}
            </button>
          </template>

          <template v-if="inPreview && previewNode?.path">
            <span class="sep">/</span>
            <span class="crumb ghost" aria-current="page">
              {{ previewNode.path.split("/").pop() }}
            </span>
          </template>
        </div>
      </div>

      <div class="top-right">
        <!-- Up stays visible even in preview (for quick exit like JSR history) -->
        <button class="icon-btn" type="button" @click="navUp" :disabled="!currentPath" title="Up">
          <span class="i up"></span>
        </button>

        <!-- In preview: "Back to files" -->
        <button v-if="inPreview" class="icon-btn" type="button" @click="closePreview" title="Back to files">
          <span class="i back"></span>
        </button>

        <!-- Search toggle only in listing mode -->
        <button
          v-else
          class="icon-btn"
          type="button"
          @click="toggleSearch"
          :class="{ on: globalSearchOpen }"
          title="Search"
        >
          <span class="i search"></span>
        </button>

        <a
          v-if="pkgRepoUrl"
          class="icon-btn link-btn"
          :href="inPreview && previewNode?.path
            ? nodeWebUrl({ type: 'file', name: previewNode.name || '', path: previewNode.path })
            : currentDirWebUrl()"
          target="_blank"
          rel="noreferrer"
          :title="inPreview ? 'Open file on GitHub' : 'Open folder on GitHub'"
        >
          <span class="i ext"></span>
        </a>
      </div>
    </div>

    <!-- SEARCH PANEL (only when listing) -->
    <div v-if="showSearchPanel" class="search">
      <div class="search-row">
        <input
          class="input"
          :value="globalSearchQuery"
          @input="onSearchInput"
          placeholder="Code search (repo-wide)..."
          aria-label="Code search"
        />
        <button class="btn" type="button" @click="runGlobalSearch" :disabled="globalSearchLoading">
          Search
        </button>
      </div>

      <div class="state" v-if="globalSearchLoading">
        <span class="spinner"></span>
        Searching...
      </div>

      <div class="state error" v-else-if="globalSearchError">
        Error: {{ globalSearchError }}
      </div>

      <div v-else-if="globalSearchResults.length" class="hits">
        <a
          class="hit"
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

    <!-- LISTING BODY (hidden during preview, but topbar stays) -->
    <div v-if="showListingBody" class="panel">
      <div class="controls">
        <input
          class="input"
          :value="filesFilter"
          @input="onFilterInput"
          placeholder="Filter in this folder..."
          aria-label="Filter in folder"
        />

        <label class="check">
          <input type="checkbox" :checked="filesShowHidden" @change="onHiddenToggle" />
          <span>Show hidden</span>
        </label>

        <div class="sort">
          <button class="chip" type="button" @click="toggleSort('type')" :class="{ on: filesSortKey === 'type' }">Type</button>
          <button class="chip" type="button" @click="toggleSort('name')" :class="{ on: filesSortKey === 'name' }">Name</button>
          <button class="chip" type="button" @click="toggleSort('size')" :class="{ on: filesSortKey === 'size' }">Size</button>
          <span class="muted">{{ filesSortKey }} {{ filesSortDir }}</span>
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
        <div class="table" role="table" aria-label="Files">
          <div class="row head" role="row">
            <div class="cell name" role="columnheader">Name</div>
            <div class="cell size" role="columnheader">Size</div>
            <div class="cell go" role="columnheader"></div>
          </div>

          <button v-if="currentPath" class="row btn back" type="button" role="row" @click="goUp">
            <div class="cell name" role="cell">
              <span class="ico dir"></span>
              <span class="fname">..</span>
            </div>
            <div class="cell size" role="cell"></div>
            <div class="cell go" role="cell"><span class="chev"></span></div>
          </button>

          <button
            v-for="n in visibleListing"
            :key="n.path"
            class="row btn"
            type="button"
            role="row"
            @click="openNode(n)"
          >
            <div class="cell name" role="cell">
              <span class="ico">
                <svg v-if="n.type === 'dir'" viewBox="0 0 24 24" class="svg dir">
                  <path d="M3 6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2H3V6z" fill="#f4c542"/>
                  <path d="M3 10h18l-2 8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l-2-8z" fill="#ffd866"/>
                </svg>

             <svg v-else viewBox="0 0 16 16" class="svg file" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M2 1.75A.75.75 0 0 1 2.75 1h6.19c.2 0 .39.08.53.22l3.31 3.31c.14.14.22.33.22.53v8.19a.75.75 0 0 1-.75.75H2.75A.75.75 0 0 1 2 13.25V1.75Z"
                />
              </svg>
              </span>
              <span class="fname">{{ n.name }}</span>
            </div>

            <div class="cell size" role="cell">
              <span class="muted">{{ n.type === "dir" ? "" : niceSize(n.size) }}</span>
            </div>

            <div class="cell go" role="cell"><span class="chev"></span></div>
          </button>
        </div>

        <div class="footer">
          <div v-if="canLoadMore" class="more">
            <button class="btn" type="button" @click="loadMore">Load more</button>
            <span class="muted">{{ visibleListing.length }} / {{ filteredSortedListingLen }}</span>
          </div>

          <div v-if="pkgRepoUrl" class="open">
            <span class="muted">Open on GitHub:</span>
            <a class="link" :href="currentDirWebUrl()" target="_blank" rel="noreferrer">
              {{ currentPath ? currentPath : "repo root" }}
            </a>
          </div>
        </div>
      </template>
    </div>

    <!-- PREVIEW (single code render, shiki) -->
    <div v-else class="codewrap" aria-label="File preview">
      <div class="code-head">
        <div class="code-path">
          <span class="dot"></span>
          <span class="p">{{ previewPathLabel() }}</span>
        </div>

        <div class="code-actions">
          <button class="mini" type="button" @click="copyPreviewPath" :disabled="!previewNode">Copy path</button>
          <button class="mini" type="button" @click="copyPreviewRawUrl" :disabled="!previewNode">Copy raw</button>
          <button class="mini" type="button" @click="downloadPreviewFile" :disabled="!previewNode">Download</button>
          <button class="mini close" type="button" @click="closePreview">Close</button>
        </div>
      </div>

      <div class="code-body">
        <div v-if="previewLoading" class="state">
          <span class="spinner"></span>
          Loading file...
        </div>

        <div v-else-if="previewError" class="state error">
          Error: {{ previewError }}
        </div>

        <div v-else class="code">
          <!-- IMPORTANT: only one renderer -->
          <div class="code-html" v-html="highlightedHtml"></div>

          <div v-if="!highlightedHtml" class="empty-preview">
            No preview available
          </div>
        </div>
      </div>

      <div class="code-foot" v-if="pkgRepoUrl && previewNode?.path">
        <span class="muted">Open on GitHub:</span>
        <a
          class="link"
          :href="nodeWebUrl({ type: 'file', name: previewNode.name || '', path: previewNode.path })"
          target="_blank"
          rel="noreferrer"
        >
          {{ previewNode.path }}
        </a>
      </div>
    </div>

    <!-- Keep modal if other parts rely on it; it won't double render because preview HTML is not shown twice -->
    <PkgPreviewModal
      :previewOpen="false"
      :previewLoading="previewLoading"
      :previewError="previewError"
      :previewNode="previewNode"
      :previewLang="previewLang"
      :previewHtml="highlightedHtml"
      :previewText="previewText"
      :nodeWebUrl="nodeWebUrl"
      :copyPreviewPath="copyPreviewPath"
      :copyPreviewRawUrl="copyPreviewRawUrl"
      :downloadPreviewFile="downloadPreviewFile"
      :closePreview="closePreview"
    />
  </div>
</template>

<style scoped>
.files{
  --max: 1180px;
  --pad: 24px;
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--pad) 40px;
}

/* Top header always visible (JSR-like history) */
.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 14px;
  padding: 12px 12px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
}

.top-left{
  display:flex;
  align-items:center;
  gap: 12px;
  min-width: 0;
}
.top-title{
  font-size: 13.5px;
  font-weight: 950;
  color: rgba(255,255,255,.92);
  white-space: nowrap;
}

.crumbs{
  display:flex;
  align-items:center;
  gap: 6px;
  flex-wrap: wrap;
  min-width: 0;
}
.crumb{
  border: 1px solid transparent;
  background: transparent;
  color: rgba(170,220,255,.92);
  font-weight: 900;
  font-size: 12.5px;
  padding: 6px 8px;
  border-radius: 10px;
  cursor: pointer;
  max-width: 380px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.crumb:hover{ background: rgba(255,255,255,.05); }
.crumb.active{
  color: rgba(255,255,255,.95);
  border-color: rgba(140,200,255,.28);
  background: rgba(140,200,255,.08);
}
.crumb.ghost{
  cursor: default;
  color: rgba(255,255,255,.70);
  border-color: rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
}
.sep{
  color: rgba(255,255,255,.35);
  font-weight: 900;
}

.top-right{
  display:flex;
  align-items:center;
  gap: 8px;
}

/* icons */
.icon-btn{
  width: 36px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  display:grid;
  place-items:center;
  cursor:pointer;
}
.icon-btn:hover{ background: rgba(255,255,255,.07); }
.icon-btn:disabled{ opacity: .45; cursor:not-allowed; }
.icon-btn.on{ border-color: rgba(140,200,255,.38); background: rgba(140,200,255,.10); }
.link-btn{ text-decoration:none; }

.i{
  width: 16px;
  height: 16px;
  display:block;
  opacity: .92;
}
.i.search{
  background: radial-gradient(circle at 45% 45%, rgba(140,200,255,.95) 0 45%, transparent 46%),
              linear-gradient(rgba(140,200,255,.95), rgba(140,200,255,.95));
  background-size: 12px 12px, 8px 2px;
  background-position: 0 0, 11px 13px;
  background-repeat: no-repeat;
  border-radius: 50%;
}
.i.up{
  background: linear-gradient(rgba(255,255,255,.85), rgba(255,255,255,.85));
  width: 12px;
  height: 2px;
  position: relative;
}
.i.up::before{
  content:"";
  position:absolute;
  left: 4px;
  top: -5px;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid rgba(255,255,255,.85);
}
.i.back{
  width: 14px;
  height: 14px;
  position: relative;
}
.i.back::before{
  content:"";
  position:absolute;
  left: 2px;
  top: 6px;
  width: 10px;
  height: 2px;
  background: rgba(255,255,255,.85);
}
.i.back::after{
  content:"";
  position:absolute;
  left: 2px;
  top: 4px;
  width: 0;
  height: 0;
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  border-right: 6px solid rgba(255,255,255,.85);
}
.i.ext{
  background: linear-gradient(rgba(255,255,255,.85), rgba(255,255,255,.85));
  width: 12px;
  height: 12px;
  border-radius: 3px;
  position: relative;
}
.i.ext::before{
  content:"";
  position:absolute;
  right: -1px;
  top: -1px;
  width: 8px;
  height: 8px;
  border: 2px solid rgba(255,255,255,.85);
  border-left: 0;
  border-bottom: 0;
  border-radius: 2px;
}

/* Search panel */
.search{
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  overflow:hidden;
}
.search-row{
  padding: 12px 12px;
  display:flex;
  gap: 10px;
  align-items:center;
}
.hits{
  padding: 0 12px 12px;
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.hit{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.04);
  border-radius: 12px;
  padding: 10px 10px;
  text-decoration:none;
}
.hit:hover{ background: rgba(255,255,255,.06); }
.hit-name{ color: rgba(255,255,255,.92); font-weight: 950; font-size: 13px; }
.hit-path{
  margin-top: 3px;
  color: rgba(255,255,255,.60);
  font-weight: 800;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* List panel (body) */
.panel{
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  overflow:hidden;
}

.controls{
  display:flex;
  align-items:center;
  gap: 12px;
  padding: 12px 12px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.input{
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.18);
  color: rgba(255,255,255,.90);
  outline: none;
  font-weight: 800;
  font-size: 13px;
}
.input:focus{
  border-color: rgba(140,200,255,.35);
  box-shadow: 0 0 0 3px rgba(140,200,255,.10);
}

.check{
  display:flex;
  align-items:center;
  gap: 8px;
  color: rgba(255,255,255,.72);
  font-weight: 850;
  font-size: 12.5px;
  white-space: nowrap;
}
.check input{ transform: translateY(1px); }

.sort{
  margin-left:auto;
  display:flex;
  align-items:center;
  gap: 8px;
  flex-wrap:wrap;
}
.chip{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.78);
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.chip:hover{ background: rgba(255,255,255,.07); }
.chip.on{
  color: rgba(255,255,255,.96);
  border-color: rgba(140,200,255,.38);
  background: rgba(140,200,255,.10);
}

.btn{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.88);
  font-weight: 950;
  font-size: 12.5px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
}
.btn:hover{ background: rgba(255,255,255,.09); }
.btn:disabled{ opacity:.55; cursor:not-allowed; }

.muted{
  color: rgba(255,255,255,.58);
  font-weight: 850;
  font-size: 12px;
}

/* States */
.state{
  padding: 12px 12px;
  color: rgba(255,255,255,.72);
  font-size: 13px;
  display:flex;
  align-items:center;
  gap: 10px;
}
.state.error{ color: rgba(255,220,220,.88); }

.spinner{
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.20);
  border-top-color: rgba(255,255,255,.70);
  animation: spin .9s linear infinite;
}
@keyframes spin{ to{ transform: rotate(360deg); } }

/* Listing table */
.table{ width: 100%; }
.row{
  display:grid;
  grid-template-columns: 1fr 120px 34px;
  align-items:center;
  gap: 10px;
  padding: 12px 12px;
  border-top: 1px solid rgba(255,255,255,.06);
}
.row.head{
  border-top: 0;
  background: rgba(255,255,255,.02);
  color: rgba(255,255,255,.62);
  font-weight: 950;
  font-size: 12px;
}
.row.btn{
  width:100%;
  text-align:left;
  border:0;
  background:transparent;
  cursor:pointer;
}
.row.btn:hover{ background: rgba(255,255,255,.04); }

.cell{ min-width:0; }
.cell.name{
  display:flex;
  align-items:center;
  gap: 10px;
  min-width:0;
}
.cell.size{ text-align:right; }
.cell.go{ display:flex; justify-content:flex-end; }
.ico{
  width:20px;
  height:20px;
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
}

.svg{
  width:18px;
  height:18px;
  display:block;
}

.row.btn:hover .svg.dir{
  filter: brightness(1.1);
}


.fname{
  color: rgba(255,255,255,.90);
  font-weight: 900;
  font-size: 13.5px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.chev{
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(255,255,255,.55);
  border-top: 2px solid rgba(255,255,255,.55);
  transform: rotate(45deg);
  opacity: .9;
}

/* footer */
.footer{
  padding: 12px 12px;
  border-top: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.10);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.more{ display:flex; align-items:center; gap: 10px; }
.open{ display:flex; align-items:center; gap: 8px; flex-wrap: wrap; }
.link{
  color: rgba(140,200,255,.95);
  font-weight: 950;
  text-decoration: none;
}
.link:hover{ text-decoration: underline; }

/* preview */
.codewrap{
  margin-top: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  overflow:hidden;
}

.code-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255,255,255,.03);
  background: #161616 !important;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.code-path{
  display:flex;
  align-items:center;
  gap: 10px;
  min-width:0;
}
.code-path .dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(140,200,255,.85);
  box-shadow: 0 0 0 3px rgba(140,200,255,.10);
}
.code-path .p{
  color: rgba(255,255,255,.90);
  font-weight: 950;
  font-size: 12.5px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.code-actions{
  display:flex;
  align-items:center;
  gap: 8px;
  flex-wrap: wrap;
}
.mini{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.88);
  font-weight: 950;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.mini:hover{ background: rgba(255,255,255,.09); }
.mini:disabled{ opacity:.55; cursor:not-allowed; }
.mini.close{
  border-color: rgba(255,120,120,.25);
  background: rgba(255,120,120,.08);
}

.code-html :deep(pre){
  margin: 0;
  padding: 14px 14px;
  overflow: auto;
}

/* IMPORTANT: hide shiki title spacing issues, keep it clean */
.code-html :deep(code){
  font-size: 13px;
  line-height: 1.65;
}

/* empty preview */
.empty-preview{
  padding: 12px 12px;
  color: rgba(255,255,255,.62);
  font-weight: 850;
  font-size: 13px;
}

/* File icon — GitHub style */
.svg.file{
  width: 16px;
  height: 16px;
  color: #8b949e; /* GitHub dark file color */
  opacity: .95;
  transition: color .15s ease;
}
.svg.dir{
  color: #d29922; /* GitHub folder color */
}
/* Hover like GitHub */
.row.btn:hover .svg.file{
  color: #c9d1d9;
}
@media (max-width: 980px){
  .controls{ flex-direction: column; align-items: stretch; }
  .sort{ margin-left: 0; justify-content:flex-start; }
  .row{ grid-template-columns: 1fr 90px 28px; }
}
@media (max-width: 520px){
  .files{ padding: 14px 14px 34px; }
  .topbar{ flex-direction: column; align-items: stretch; }
  .top-right{ justify-content:flex-end; }
  .row{ grid-template-columns: 1fr 0 28px; }
  .cell.size{ display:none; }
}

/* ==========================================
   REGISTRY FILE PREVIEW
   Adapted to pure dark palette
========================================== */

.codewrap{
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.12);
  background: #111111;
  overflow: hidden;
}

/* HEADER */
.code-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding: 8px 12px;

  background: #161616;
  border-bottom: 1px solid rgba(255,255,255,.12);
}

/* path */
.code-path{
  display:flex;
  align-items:center;
  gap: 8px;
}

.code-path .dot{
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,.35);
}

.code-path .p{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(255,255,255,.92);
}

.mini{
  border: 1px solid rgba(255,255,255,.15);
  background: #111111;
  color: rgba(255,255,255,.85);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.mini:hover{
  background: #161616;
}

.mini.close{
  border-color: rgba(255,100,100,.35);
}

/* CODE BODY */
.code-body{
  background: #111111;
}

/* kill Shiki theme background */
.code-html :deep(.shiki){
  background: #111111 !important;
}

.code-html :deep(pre){
  margin: 0;
  padding: 16px;
  overflow: auto;
  background: #111111 !important;
}

/* Code text tone */
.code-html :deep(code){
  font-size: 13px;
  line-height: 1.6;
}

/* FOOTER */
.code-foot{
  padding: 8px 12px;
  background: #161616 !important;
  border-top: 1px solid rgba(255,255,255,.12);
  font-size: 12px;
  display:flex;
  gap: 6px;
}

.code-foot .muted{
  color: rgba(255,255,255,.65);
}

.code-foot .link{
  color: #58a6ff;
  font-weight: 600;
  text-decoration: none;
}

.code-foot .link:hover{
  text-decoration: underline;
}
/* README rendered inside preview */
.code-html :deep(.md){
  padding: 18px 18px 22px;
}

/* petit espace en haut comme GitHub */
.code-html :deep(.md > :first-child){
  margin-top: 0;
}
/* Markdown surface (matches pure dark override) */
.code-html :deep(.github-dark){
  background: #0a0a0a;
  color: rgba(255,255,255,.92);
}

/* headings */
.code-html :deep(.github-dark h1),
.code-html :deep(.github-dark h2),
.code-html :deep(.github-dark h3){
  color: rgba(255,255,255,.96);
  border-bottom: 1px solid rgba(255,255,255,.10);
  padding-bottom: 6px;
  margin: 22px 0 12px;
}

/* paragraphs + lists */
.code-html :deep(.github-dark p){
  margin: 10px 0;
  line-height: 1.75;
}
.code-html :deep(.github-dark ul),
.code-html :deep(.github-dark ol){
  padding-left: 20px;
  margin: 10px 0;
}

/* inline code */
.code-html :deep(.github-dark code){
  background: #161616;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* code blocks inside README */
.code-html :deep(.github-dark pre){
  background: #111111;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 12px;
  padding: 12px 12px;
  overflow: auto;
}

/* links */
.code-html :deep(.github-dark a){
  color: rgba(140,200,255,.95);
  text-decoration: none;
}
.code-html :deep(.github-dark a:hover){
  text-decoration: underline;
}
/* Inline code uniquement (pas dans les blocs <pre>) */
.code-html :deep(.github-dark :not(pre) > code){
  background: #161616;
  padding: 2px 6px;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

/* Code block: le <pre> gère le fond, le <code> reste neutre */
.code-html :deep(.github-dark pre){
  background: #111111;
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 12px;
  padding: 12px 12px;
  overflow: auto;
}

.code-html :deep(.github-dark pre code){
  background: transparent;
  padding: 0;
  border-radius: 0;
}
.code-html :deep(.shiki code){
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0 !important;
}
/* Force dark background during loading */
.codewrap.loading{
  background: #161616 !important;
}

/* Ensure body area keeps same tone */
.codewrap.loading .code-body{
  background: #161616 !important;
}
</style>
