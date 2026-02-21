<!-- src/pages/registry/pkgshow/PkgDocsTab.vue -->
<script setup>
import { computed, ref, watch, onBeforeUnmount, nextTick } from "vue";
import { createHighlighter } from "shiki";

const props = defineProps({
  id: { type: String, default: "" },

  docsLoading: { type: Boolean, default: false },
  docsError: { type: String, default: "" },

  hasRegistryExports: { type: Boolean, default: false },
  docsHeaderPicked: { type: String, default: "" },
  docsHeadersTried: { type: Array, default: () => [] },

  docsCounts: { type: Object, default: () => ({ namespaces: 0, types: 0, functions: 0, macros: 0, enums: 0 }) },

  // IMPORTANT:
  // Supporte:
  // 1) string[] (ancien)   ex: ["run", "print"]
  // 2) DocItem[] (nouveau) ex: [{ kind:"function", name:"run", signature:"...", brief:"...", doxygen:"...", params:[...], returns:"..." }]
  docsActiveList: { type: Array, default: () => [] },

  docsJump: { type: String, default: "" },
  docsGroupsTab: { type: String, default: "functions" },

  nodeWebUrl: { type: Function, required: true },
});

const emit = defineEmits(["update:docsJump", "update:docsGroupsTab"]);

function setGroupsTab(v) {
  emit("update:docsGroupsTab", v);
}

function onJump(e) {
  emit("update:docsJump", e?.target?.value ?? "");
}

/* -------------------------
   Header link (top meta)
-------------------------- */
const headerFileName = computed(() => {
  if (!props.docsHeaderPicked) return "";
  const parts = String(props.docsHeaderPicked).split("/");
  return parts[parts.length - 1] || props.docsHeaderPicked;
});

const headerUrl = computed(() => {
  if (!props.docsHeaderPicked) return "";
  return props.nodeWebUrl({
    type: "file",
    name: headerFileName.value,
    path: props.docsHeaderPicked,
  });
});

/* -------------------------
   Error helpers
-------------------------- */
const errorTitle = computed(() => {
  if (!props.docsError) return "";
  if (props.docsError === "no_exported_header_found") return "No docs available";
  if (props.docsError === "no_header_detected") return "No header detected";
  if (props.docsError === "offline_mode") return "Offline mode";
  return "Docs error";
});

const errorBody = computed(() => {
  if (!props.docsError) return "";
  if (props.docsError === "no_exported_header_found") {
    return "Exports exist, but no header could be fetched for this ref.";
  }
  if (props.docsError === "no_header_detected") {
    return "No header detected. Add exports.headers in the registry entry.";
  }
  if (props.docsError === "offline_mode") {
    return "Docs scanning is disabled in offline mode.";
  }
  return String(props.docsError);
});

const groups = [
  ["functions", "Functions"],
  ["types", "Types"],
  ["namespaces", "Namespaces"],
  ["enums", "Enums"],
  ["macros", "Macros"],
];

/* -------------------------
   Normalize docsActiveList
-------------------------- */
function isObj(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function normalizeItem(x) {
  // Ancien format: string
  if (typeof x === "string") {
    return {
      kind: props.docsGroupsTab || "symbol",
      name: x,
      signature: "",
      brief: "",
      doxygen: "",
      params: [],
      returns: "",
      notes: "",
      deprecated: "",
      since: "",
      source: null,
    };
  }

  // Nouveau format: objet
  if (isObj(x)) {
    return {
      kind: x.kind || props.docsGroupsTab || "symbol",
      name: x.name || x.id || "unknown",
      signature: x.signature || x.decl || "",
      brief: x.brief || "",
      doxygen: x.doxygen || x.doc || "",
      params: Array.isArray(x.params) ? x.params : [],
      returns: x.returns || "",
      notes: x.notes || "",
      deprecated: x.deprecated || "",
      since: x.since || "",
      source: x.source || null, // { path, line, url? }
    };
  }

  return {
    kind: props.docsGroupsTab || "symbol",
    name: "unknown",
    signature: "",
    brief: "",
    doxygen: "",
    params: [],
    returns: "",
    notes: "",
    deprecated: "",
    since: "",
    source: null,
  };
}

const items = computed(() => {
  const list = Array.isArray(props.docsActiveList) ? props.docsActiveList : [];
  return list.map(normalizeItem);
});

/* -------------------------
   Doxygen plain text formatting
-------------------------- */
function cleanDoc(s) {
  return String(s || "").trim();
}

function sourceHref(it) {
  if (it?.source?.url) return it.source.url;

  if (it?.source?.path) {
    const p = it.source.path;
    const name = p.split("/").pop() || p;
    return props.nodeWebUrl({ type: "file", name, path: p });
  }
  return "";
}

/* -------------------------
   Shiki: highlight declarations/signatures
   Goal: colorize C++ signatures like JSR
-------------------------- */
const highlightedSig = ref(new Map()); // key -> html
let shiki = null;
let seq = 0;

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function ensureShiki() {
  if (shiki) return shiki;

  shiki = await createHighlighter({
    themes: ["github-dark"],
    langs: ["cpp"],
  });

  return shiki;
}

function itemKey(it, idx) {
  const src = it?.source?.path ? `${it.source.path}:${it.source.line || ""}` : "";
  return `${it.kind}:${it.name}:${src}:${idx}`;
}

function signatureText(it) {
  // Prefer explicit signature; fallback to "name" (still highlighted but simple)
  const sig = String(it?.signature || "").trim();
  if (sig) return sig;
  const n = String(it?.name || "").trim();
  return n ? `${n}()` : "";
}

async function highlightAll() {
  const my = ++seq;
  const list = items.value;

  if (!list.length) {
    highlightedSig.value = new Map();
    return;
  }

  try {
    const h = await ensureShiki();
    if (my !== seq) return;

    const map = new Map();
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const key = itemKey(it, i);
      const code = signatureText(it);

      // Shiki expects code; if empty, fallback
      const html = code
        ? h.codeToHtml(code, { lang: "cpp", theme: "github-dark" })
        : `<pre><code>${escapeHtml(code)}</code></pre>`;

      map.set(key, html);
    }

    highlightedSig.value = map;
  } catch {
    if (my !== seq) return;

    const map = new Map();
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      const key = itemKey(it, i);
      const code = signatureText(it);
      map.set(key, `<pre><code>${escapeHtml(code)}</code></pre>`);
    }
    highlightedSig.value = map;
  }
}

watch(
  () => [props.docsActiveList, props.docsGroupsTab],
  async () => {
    await nextTick();
    highlightAll();
  },
  { immediate: true, deep: false }
);

onBeforeUnmount(() => {
  shiki = null;
});
</script>


<template>
  <div class="docs">
    <div class="head">
      <div class="title">Docs</div>

      <div class="meta">
        <a
          v-if="docsHeaderPicked"
          class="src"
          :href="headerUrl"
          target="_blank"
          rel="noreferrer"
          title="Open source header"
        >
          {{ docsHeaderPicked }}
        </a>
      </div>
    </div>

    <div class="state" v-if="docsLoading">
      <span class="spinner"></span>
      Scanning headers...
    </div>

    <div class="state error" v-else-if="docsError">
      <div class="err-title">{{ errorTitle }}</div>
      <div class="err-sub">{{ errorBody }}</div>

      <div class="hint soft" v-if="!hasRegistryExports">
        Note: exports.headers is missing. We tried a minimal include scan fallback.
      </div>

      <details class="tried" v-if="docsHeadersTried.length">
        <summary>Headers tried</summary>
        <div class="tried-list">
          <div class="muted" v-for="h in docsHeadersTried" :key="h">{{ h }}</div>
        </div>
      </details>
    </div>

    <template v-else>
      <div class="toolbar">
        <input
          class="input"
          :value="docsJump"
          @input="onJump"
          placeholder="Search for symbols (Ctrl+F)"
          aria-label="Search for symbols"
        />

        <div class="seg" role="tablist" aria-label="Docs groups">
          <button
            v-for="[key,label] in groups"
            :key="key"
            class="seg-btn"
            type="button"
            role="tab"
            :aria-selected="docsGroupsTab === key"
            :class="{ active: docsGroupsTab === key }"
            @click="setGroupsTab(key)"
          >
            {{ label }}
          </button>
        </div>
      </div>

      <div class="counts">
        <span class="pill">Namespaces {{ docsCounts.namespaces }}</span>
        <span class="pill">Types {{ docsCounts.types }}</span>
        <span class="pill">Functions {{ docsCounts.functions }}</span>
        <span class="pill">Enums {{ docsCounts.enums }}</span>
        <span class="pill">Macros {{ docsCounts.macros }}</span>
      </div>

      <div class="list">
        <div class="empty" v-if="!items.length">No results</div>

        <section v-else class="item" v-for="(it, idx) in items" :key="it.kind + ':' + it.name + ':' + idx" :id="it.name">
          <div class="sig">
            <!-- Signature colorisée (Shiki) -->
            <div
              class="sig-code"
              v-html="highlightedSig.get(itemKey(it, idx)) || ''"
            ></div>

            <a
              v-if="sourceHref(it)"
              class="src2"
              :href="sourceHref(it)"
              target="_blank"
              rel="noreferrer"
              title="Open definition"
            >
              Source
              <span v-if="it.source && it.source.line">:{{ it.source.line }}</span>
            </a>
          </div>

          <div v-if="it.brief" class="brief">{{ it.brief }}</div>

          <!-- Doxygen -->
          <div v-if="it.doxygen" class="doc">
            <div class="doc-title">Documentation</div>
            <pre class="doc-pre"><code>{{ cleanDoc(it.doxygen) }}</code></pre>
          </div>

          <!-- Params -->
          <div v-if="it.params && it.params.length" class="block">
            <div class="block-title">Parameters</div>
            <div class="params">
              <div class="param" v-for="p in it.params" :key="p.name || p.id">
                <code class="pname">{{ p.name }}</code>
                <div class="pdesc">{{ p.desc || p.description || "" }}</div>
              </div>
            </div>
          </div>

          <!-- Returns -->
          <div v-if="it.returns" class="block">
            <div class="block-title">Returns</div>
            <div class="ret">{{ it.returns }}</div>
          </div>

          <div v-if="it.deprecated" class="warn">
            Deprecated: {{ it.deprecated }}
          </div>

          <div v-if="it.notes" class="note">
            {{ it.notes }}
          </div>
        </section>
      </div>

      <div class="hint soft">
        Best effort parsing for quick browsing.
      </div>
    </template>
  </div>
</template>

<style scoped>
.docs{
  --max: 1180px;
  --pad: 24px;

  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--pad) 40px;
}

.head{
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap: 14px;
  margin-bottom: 10px;
}
.title{
  font-size: 18px;
  font-weight: 900;
  color: rgba(255,255,255,.92);
}
.meta{
  display:flex;
  align-items:baseline;
  gap: 12px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.pkg{
  font-size: 12px;
  font-weight: 900;
  color: rgba(255,255,255,.62);
}
.src{
  font-size: 12.5px;
  font-weight: 900;
  color: rgba(140,200,255,.95);
  text-decoration: none;
  max-width: 520px;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.src:hover{ text-decoration: underline; }

.state{
  margin-top: 14px;
  color: rgba(255,255,255,.72);
  font-size: 13.5px;
  display:flex;
  align-items:center;
  gap: 10px;
}
.state.error{ align-items:flex-start; flex-direction:column; gap: 8px; }
.err-title{ font-weight: 950; color: rgba(255,255,255,.92); }
.err-sub{ color: rgba(255,255,255,.70); }

.spinner{
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.20);
  border-top-color: rgba(255,255,255,.70);
  animation: spin .9s linear infinite;
}
@keyframes spin{ to{ transform: rotate(360deg); } }

.toolbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 14px;
  margin: 10px 0 10px;
}
.input{
  flex:1;
  min-width:0;
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

.seg{
  display:flex;
  gap: 6px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.seg-btn{
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.78);
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}
.seg-btn:hover{ background: rgba(255,255,255,.07); }
.seg-btn.active{
  color: rgba(255,255,255,.96);
  border-color: rgba(140,200,255,.38);
  background: rgba(140,200,255,.10);
}

.counts{
  display:flex;
  gap: 8px;
  flex-wrap:wrap;
  margin: 6px 0 14px;
}
.pill{
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.10);
  color: rgba(255,255,255,.78);
  font-weight: 900;
  font-size: 12px;
}

.list{
  border-top: 1px solid rgba(255,255,255,.08);
  padding-top: 12px;
}

.empty{
  color: rgba(255,255,255,.62);
  font-weight: 800;
  font-size: 13px;
}

.item{
  padding: 14px 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.sig{
  display:flex;
  align-items:center;
  gap: 10px;
  flex-wrap:wrap;
}

.k{
  font-size: 11px;
  font-weight: 950;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(255,255,255,.55);
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
}

.name{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 950;
  color: rgba(255,255,255,.92);
}

.signature{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: rgba(210,235,255,.90);
  background: rgba(0,0,0,.20);
  border: 1px solid rgba(255,255,255,.10);
  padding: 6px 8px;
  border-radius: 10px;
  overflow:auto;
  max-width: 100%;
}

.src2{
  margin-left:auto;
  font-size: 12px;
  font-weight: 900;
  color: rgba(140,200,255,.95);
  text-decoration:none;
}
.src2:hover{ text-decoration: underline; }

.brief{
  margin-top: 8px;
  color: rgba(255,255,255,.78);
  line-height: 1.6;
  font-size: 13.5px;
  font-weight: 700;
}

.doc{
  margin-top: 12px;
}
.doc-title{
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.70);
  margin-bottom: 8px;
  letter-spacing: .02em;
}
.doc-pre{
  margin: 0;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.30);
  overflow: auto;
}
.doc-pre code{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.8px;
  color: rgba(255,255,255,.86);
  line-height: 1.6;
  display:block;
  white-space: pre-wrap;
}

.block{
  margin-top: 12px;
}
.block-title{
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.70);
  margin-bottom: 8px;
}

.params{
  display:flex;
  flex-direction:column;
  gap: 8px;
}
.param{
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}
.pname{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 950;
  color: rgba(210,235,255,.92);
}
.pdesc{
  margin-top: 6px;
  color: rgba(255,255,255,.74);
  line-height: 1.55;
  font-size: 13px;
  font-weight: 700;
}

.ret{
  color: rgba(255,255,255,.74);
  line-height: 1.55;
  font-size: 13px;
  font-weight: 700;
  padding: 10px 10px;
  border-radius: 12px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
}

.warn{
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(255,208,0,.22);
  background: rgba(255,208,0,.08);
  border-radius: 12px;
  color: rgba(255,255,255,.86);
  font-size: 13px;
  font-weight: 800;
}

.note{
  margin-top: 10px;
  color: rgba(255,255,255,.62);
  font-size: 12.5px;
  font-weight: 800;
}

.hint.soft{
  margin-top: 10px;
  color: rgba(255,255,255,.56);
  font-size: 12.5px;
  font-weight: 800;
}
.sig-code :deep(pre) {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,.35);
  border: 1px solid rgba(255,255,255,.10);
  overflow: auto;
}

.sig-code :deep(code) {
  font-size: 13px;
  line-height: 1.6;
}
/* ===============================
   Signature Shiki: NEVER overflow
   =============================== */

/* 1) flex child must be allowed to shrink */
.sig{
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sig-code{
  flex: 1 1 520px;      /* grow + shrink */
  min-width: 0;         /* CRITICAL in flex to allow overflow scroll */
  max-width: 100%;
}

/* 2) harden Shiki output */
.sig-code :deep(pre),
.sig-code :deep(pre.shiki){
  margin: 0 !important;
  max-width: 100% !important;

  padding: 10px 12px !important;
  border-radius: 12px !important;

  border: 1px solid rgba(255,255,255,.10) !important;
  background: rgba(0,0,0,.35) !important;

  overflow-x: auto !important;     /* horizontal scroll */
  overflow-y: hidden !important;
  -webkit-overflow-scrolling: touch;
}

/* 3) ensure code does not wrap (so it scrolls instead of breaking layout) */
.sig-code :deep(code){
  display: block;
  white-space: pre !important;     /* no wrapping */
  word-break: normal !important;
  overflow-wrap: normal !important;

  font-size: 13px;
  line-height: 1.6;

  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: rgba(255,255,255,.90);
}

/* 4) if Shiki injects inline background via style="", this keeps our background */
.sig-code :deep(.shiki){
  background: transparent !important;
}

/* 5) nice scrollbar */
.sig-code :deep(pre::-webkit-scrollbar){
  height: 8px;
}
.sig-code :deep(pre::-webkit-scrollbar-thumb){
  background: rgba(255,255,255,.18);
  border-radius: 999px;
}
.sig-code :deep(pre::-webkit-scrollbar-track){
  background: rgba(0,0,0,.18);
  border-radius: 999px;
}

/* 6) keep "Source" link aligned without forcing overflow */
.src2{
  flex: 0 0 auto;
  margin-left: auto;
}
@media (max-width: 980px){
  .src2{ margin-left: 0; }
}
/* Add breathing room at the end of long signatures */
.sig-code :deep(pre),
.sig-code :deep(pre.shiki){
  padding-right: 50px !important;   /* espace visuel à droite */
}

/* sécurité supplémentaire */
.sig-code :deep(code){
  padding-right: 8px;
}
/* responsive */
@media (max-width: 980px){
  .toolbar{ flex-direction: column; align-items: stretch; }
  .seg{ justify-content: flex-start; }
  .src{ max-width: 100%; }
  .src2{ margin-left: 0; }
}
@media (max-width: 520px){
  .docs{ padding: 14px 14px 34px; }
  .signature{ width: 100%; }
}
</style>
