<!-- src/pages/registry/RegistryPublish.vue -->
<script setup>
import { computed, onMounted, ref } from "vue";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import PublishChecklist from "@/components/PublishChecklist.vue";

const loading = ref(true);
const loadError = ref("");

const registry = ref(null);
const entriesById = ref(new Map());

// form
const repoUrl = ref("");
const namespace = ref("");
const name = ref("");
const version = ref("");
const notes = ref("");

const license = ref("MIT");
const type = ref("header-only");
const manifestPath = ref("vix.json");
const defaultBranch = ref("main");
const homepage = ref("");
const description = ref("");
const keywords = ref("");
const displayName = ref("");

const maintainerName = ref("");
const maintainerGithub = ref("");

const commit = ref("");

const copiedHint = ref("");

function toLower(s) {
  return (s || "").toLowerCase().trim();
}

const nsLower = computed(() => toLower(namespace.value));
const nameLower = computed(() => toLower(name.value));

const tag = computed(() => {
  const v = (version.value || "").trim();
  return v ? `v${v}` : "";
});

const pkgId = computed(() => {
  if (!nsLower.value || !nameLower.value) return "";
  return `${nsLower.value}/${nameLower.value}`;
});

const fileName = computed(() => {
  if (!nsLower.value || !nameLower.value) return "";
  return `${nsLower.value}.${nameLower.value}.json`;
});

const filePath = computed(() => {
  const f = fileName.value;
  return f ? `index/${f}` : "";
});

const existingEntry = computed(() => {
  const id = pkgId.value;
  if (!id) return null;
  return entriesById.value.get(id) || null;
});

const versionAlreadyExists = computed(() => {
  const e = existingEntry.value;
  const v = version.value.trim();
  if (!e || !v) return false;
  return !!(e.versions && typeof e.versions === "object" && e.versions[v]);
});

function parseVersionNums(s) {
  const out = [];
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch >= "0" && ch <= "9") {
      cur += ch;
      continue;
    }
    if (ch === ".") {
      if (cur) {
        out.push(parseInt(cur, 10));
        cur = "";
      }
      continue;
    }
    break;
  }
  if (cur) out.push(parseInt(cur, 10));
  while (out.length < 3) out.push(0);
  return out;
}

function compareVersions(a, b) {
  const va = parseVersionNums(a);
  const vb = parseVersionNums(b);
  const n = Math.max(va.length, vb.length);
  for (let i = 0; i < n; i++) {
    const ia = i < va.length ? va[i] : 0;
    const ib = i < vb.length ? vb[i] : 0;
    if (ia < ib) return -1;
    if (ia > ib) return 1;
  }
  return 0;
}

function splitKeywords(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function nowIso() {
  return new Date().toISOString();
}

const githubBase = "https://github.com/vixcpp/registry";

const githubOpenExistingUrl = computed(() => {
  if (!existingEntry.value) return "";
  return `${githubBase}/blob/main/${filePath.value}`;
});

const githubEditExistingUrl = computed(() => {
  if (!existingEntry.value) return "";
  return `${githubBase}/edit/main/${filePath.value}`;
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

async function flashCopied(msg) {
  copiedHint.value = msg;
  window.setTimeout(() => {
    if (copiedHint.value === msg) copiedHint.value = "";
  }, 1400);
}

function buildVersionBlock() {
  const v = version.value.trim();
  if (!v) return null;

  return {
    tag: tag.value,
    commit: commit.value.trim(),
    ...(notes.value.trim() ? { notes: notes.value.trim() } : {}),
    publishedAt: nowIso(),
  };
}

const versionBlockJson = computed(() => {
  const blk = buildVersionBlock();
  if (!blk) return "";
  return JSON.stringify(blk, null, 2) + "\n";
});

function buildEntryJson() {
  const ns = nsLower.value;
  const nm = nameLower.value;
  const v = version.value.trim();

  const base = existingEntry.value
    ? JSON.parse(JSON.stringify(existingEntry.value))
    : {
        name: nm,
        namespace: ns,
        displayName: nm,
        description: "",
        keywords: [],
        license: "MIT",
        repo: { url: repoUrl.value.trim(), defaultBranch: defaultBranch.value.trim() || "main" },
        type: "header-only",
        manifestPath: "vix.json",
        homepage: repoUrl.value.trim(),
        maintainers: [{ name: "", github: "" }],
        versions: {},
      };

  base.name = nm;
  base.namespace = ns;

  base.displayName = (displayName.value.trim() || base.displayName || nm).toString();
  base.description = (description.value.trim() || base.description || "").toString();

  const kw = splitKeywords(keywords.value);
  if (kw.length) base.keywords = kw;

  base.license = (license.value.trim() || base.license || "MIT").toString();
  base.type = type.value;
  base.manifestPath = (manifestPath.value.trim() || base.manifestPath || "vix.json").toString();

  const rurl = repoUrl.value.trim() || (base.repo && base.repo.url) || "";
  base.repo = {
    url: rurl,
    defaultBranch: (defaultBranch.value.trim() || (base.repo && base.repo.defaultBranch) || "main").toString(),
  };

  base.homepage = (homepage.value.trim() || rurl).toString();

  const mName = maintainerName.value.trim();
  const mGh = maintainerGithub.value.trim();
  if (mName || mGh) {
    base.maintainers = [{ name: mName || "", github: mGh || "" }];
  }

  if (!base.versions || typeof base.versions !== "object") base.versions = {};

  if (v) {
    base.versions[v] = buildVersionBlock();
    const curLatest = typeof base.latest === "string" ? base.latest : "";
    if (!curLatest || compareVersions(v, curLatest) > 0) base.latest = v;
  }

  return base;
}

const previewJson = computed(() => {
  if (!nsLower.value || !nameLower.value || !version.value.trim()) return "";
  return JSON.stringify(buildEntryJson(), null, 2) + "\n";
});

const requiredMissing = computed(() => {
  const missing = [];
  if (!repoUrl.value.trim()) missing.push("repoUrl");
  if (!nsLower.value) missing.push("namespace");
  if (!nameLower.value) missing.push("name");
  if (!version.value.trim()) missing.push("version");
  if (!commit.value.trim()) missing.push("commit");
  return missing;
});

const canPublish = computed(() => {
  if (!previewJson.value) return false;
  if (requiredMissing.value.length) return false;
  if (versionAlreadyExists.value) return false;
  return true;
});

const isNewPackage = computed(() => !existingEntry.value);

const githubNewFileUrl = computed(() => {
  if (!canPublish.value) return "";
  const content = encodeURIComponent(previewJson.value);
  return `${githubBase}/new/main/${filePath.value}?value=${content}`;
});

async function copyJson() {
  if (!previewJson.value) return;
  await copy(previewJson.value);
  await flashCopied("Copied entry JSON");
}

async function copyPath() {
  if (!filePath.value) return;
  await copy(filePath.value);
  await flashCopied("Copied file path");
}

async function copyVersionBlock() {
  if (!versionBlockJson.value) return;
  await copy(versionBlockJson.value);
  await flashCopied("Copied versions[version] block");
}

onMounted(async () => {
  try {
    const { data } = await loadRegistryIndex();
    registry.value = data;

    const map = new Map();
    const entries = Array.isArray(data?.entries) ? data.entries : [];
    for (const e of entries) {
      const ns = e?.namespace || "";
      const nm = e?.name || "";
      if (!ns || !nm) continue;
      map.set(`${ns}/${nm}`, e);
    }
    entriesById.value = map;
  } catch {
    loadError.value = "cannot_load_registry";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="pub">
    <header class="top">
      <h1 class="title">Publish a package</h1>
      <p class="muted">
        With Vix CLI, publishing is simple and offline-first.
        You create your library, tag a version, then publish.
      </p>

      <pre class="cmd">
    vix new tree --lib
    vix publish 0.2.0 --notes "Add count_leaves helper"
      </pre>

      <a
        class="cli-link"
        href="/docs/registry/publish"
      >
        Prefer the CLI? Read vix publish documentation →
      </a>
    </header>

    <div v-if="loading" class="muted">Loading registry…</div>
    <div v-else-if="loadError" class="muted">Error: {{ loadError }}</div>

    <div v-else class="layout">
      <aside class="side">
        <PublishChecklist
          :repo-url="repoUrl"
          :namespace="namespace"
          :name="name"
          :version="version"
          :commit="commit"
          :license="license"
          :type="type"
          :manifest-path="manifestPath"
          :display-name="displayName"
          :description="description"
          :keywords="keywords"
          :homepage="homepage"
          :maintainer-name="maintainerName"
          :maintainer-github="maintainerGithub"
          :existing-entry="existingEntry"
        />
      </aside>

      <main class="main">
        <div class="card">
          <h2 class="h2">Package info</h2>

          <div class="row2">
            <label class="field">
              <span class="label">Repo URL (https)</span>
              <input v-model.trim="repoUrl" class="in" placeholder="https://github.com/user/repo" />
            </label>

            <label class="field">
              <span class="label">Default branch</span>
              <input v-model.trim="defaultBranch" class="in" placeholder="main" />
            </label>
          </div>

          <div class="row2">
            <label class="field">
              <span class="label">Namespace</span>
              <input v-model.trim="namespace" class="in" placeholder="gaspardkirira" />
            </label>

            <label class="field">
              <span class="label">Name</span>
              <input v-model.trim="name" class="in" placeholder="tree" />
            </label>
          </div>

          <div class="row2">
            <label class="field">
              <span class="label">Version</span>
              <input v-model.trim="version" class="in" placeholder="0.7.0" />
            </label>

            <label class="field">
              <span class="label">Tag</span>
              <input :value="tag" class="in" disabled />
            </label>
          </div>

          <div class="row2">
            <label class="field">
              <span class="label">Commit (required)</span>
              <input v-model.trim="commit" class="in" placeholder="18363babf297b4050d2585596238012faee65d52" />
            </label>

            <label class="field">
              <span class="label">License</span>
              <input v-model.trim="license" class="in" placeholder="MIT" />
            </label>
          </div>

          <div class="row2">
            <label class="field">
              <span class="label">Type</span>
              <select v-model="type" class="in">
                <option value="header-only">header-only</option>
                <option value="cmake">cmake</option>
                <option value="vix-module">vix-module</option>
              </select>
            </label>

            <label class="field">
              <span class="label">manifestPath</span>
              <input v-model.trim="manifestPath" class="in" placeholder="vix.json" />
            </label>
          </div>

          <label class="field">
            <span class="label">Display name (optional)</span>
            <input v-model.trim="displayName" class="in" placeholder="tree" />
          </label>

          <label class="field">
            <span class="label">Description (optional)</span>
            <textarea v-model.trim="description" class="in ta" placeholder="One sentence description"></textarea>
          </label>

          <label class="field">
            <span class="label">Keywords (comma separated)</span>
            <input v-model.trim="keywords" class="in" placeholder="c++, header-only, demo, registry" />
          </label>

          <label class="field">
            <span class="label">Homepage (optional)</span>
            <input v-model.trim="homepage" class="in" placeholder="https://example.com" />
          </label>

          <div class="row2">
            <label class="field">
              <span class="label">Maintainer name (optional)</span>
              <input v-model.trim="maintainerName" class="in" placeholder="Gaspard Kirira" />
            </label>

            <label class="field">
              <span class="label">Maintainer GitHub (optional)</span>
              <input v-model.trim="maintainerGithub" class="in" placeholder="GaspardKirira" />
            </label>
          </div>

          <label class="field">
            <span class="label">Release notes (optional)</span>
            <textarea v-model.trim="notes" class="in ta" placeholder="Add count_leaves helper"></textarea>
          </label>

          <div class="status">
            <div class="pill" :class="isNewPackage ? 'pill-new' : 'pill-exists'">
              {{ isNewPackage ? "New package" : "Existing package" }}
            </div>

            <div v-if="existingEntry?.latest" class="muted">
              Latest: {{ existingEntry.latest }}
            </div>
          </div>

          <div v-if="requiredMissing.length" class="err">
            Missing: {{ requiredMissing.join(', ') }}
          </div>

          <div v-if="versionAlreadyExists" class="err">
            This version already exists in the registry entry.
          </div>

          <div v-if="existingEntry" class="hint">
            <div class="hint-row">
              <a class="link" :href="githubOpenExistingUrl" target="_blank" rel="noreferrer">
                Open existing entry on GitHub
              </a>
              <a class="link" :href="githubEditExistingUrl" target="_blank" rel="noreferrer">
                Edit existing entry on GitHub
              </a>
              <button class="btn" :disabled="!versionBlockJson" @click="copyVersionBlock">
                Copy versions[{{ version || "version" }}] block
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <h2 class="h2">Dry run preview</h2>
          <pre v-if="previewJson" class="pre"><code>{{ previewJson }}</code></pre>
          <div v-else class="muted">Fill namespace, name, and version to preview.</div>

          <div class="actions">
            <button class="btn" :disabled="!previewJson" @click="copyJson">Copy entry JSON</button>
            <button class="btn" :disabled="!filePath" @click="copyPath">Copy file path</button>

            <a
              v-if="isNewPackage"
              class="btn primary"
              :class="{ disabled: !canPublish }"
              :href="canPublish ? githubNewFileUrl : null"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub new file
            </a>

            <a
              v-else
              class="btn primary"
              :class="{ disabled: !canPublish }"
              :href="canPublish ? githubEditExistingUrl : null"
              target="_blank"
              rel="noreferrer"
            >
              Open GitHub edit file
            </a>
          </div>

          <div v-if="copiedHint" class="copied">{{ copiedHint }}</div>

          <p class="muted small">
            Tip: for existing packages, open edit page and paste the copied versions block.
          </p>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.pub{
  padding: 26px 18px;
  max-width: 1180px;
  margin: 0 auto;
  color: #e5f9f6;
}
.top{ margin-bottom: 14px; }
.title{ margin: 0; font-size: 1.75rem; font-weight: 950; }
.muted{ color: rgba(148,163,184,.95); margin: 8px 0 0; }
.small{ font-size: 0.92rem; }

.layout{
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
@media (min-width: 980px){
  .layout{ grid-template-columns: 420px 1fr; align-items: start; }
  .side{ position: sticky; top: 14px; }
}

.card{
  border: 1px solid rgba(148,163,184,.18);
  border-radius: 14px;
  padding: 14px;
  background: rgba(2,6,23,.35);
}
.h2{ margin: 0 0 10px; font-size: 1.05rem; font-weight: 900; }

.row2{
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 740px){
  .row2{ grid-template-columns: 1fr 1fr; }
}

.field{ display: grid; gap: 6px; margin-top: 10px; }
.label{ font-size: 0.92rem; color: rgba(226,232,240,.9); font-weight: 700; }

.in{
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148,163,184,.22);
  background: rgba(255,255,255,.95);
  color: #020617;
  padding: 11px 12px;
  outline: none;
}
.ta{ min-height: 88px; resize: vertical; }

.status{
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.pill{
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.9rem;
  border: 1px solid rgba(148,163,184,.18);
}
.pill-new{
  background: rgba(34,197,94,.14);
  color: rgba(187,247,208,.95);
}
.pill-exists{
  background: rgba(59,130,246,.14);
  color: rgba(191,219,254,.95);
}

.hint{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15,23,42,.45);
  border: 1px solid rgba(148,163,184,.18);
}
.hint-row{
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.link{
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 800;
}

.err{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(127,29,29,.25);
  border: 1px solid rgba(248,113,113,.25);
  color: rgba(254,226,226,.95);
}

.pre{
  margin: 10px 0 0;
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  background: rgba(0,0,0,.35);
  border: 1px solid rgba(148,163,184,.18);
  max-height: 520px;
}

.actions{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
}

.btn{
  border: 1px solid rgba(148,163,184,.22);
  background: rgba(2,6,23,.35);
  color: rgba(226,232,240,.95);
  padding: 10px 12px;
  border-radius: 12px;
  font-weight: 900;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:hover{ filter: brightness(1.05); }

.primary{
  background: #facc15;
  color: #111827;
  border-color: rgba(15,23,42,.22);
}

.disabled{
  pointer-events: none;
  opacity: 0.55;
}

.copied{
  margin-top: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(34,197,94,.12);
  border: 1px solid rgba(34,197,94,.2);
  color: rgba(187,247,208,.95);
  font-weight: 900;
}

.cmd{
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15,23,42,.45);
  border: 1px solid rgba(148,163,184,.18);
  color: rgba(226,232,240,.95);
  font-size: 0.9rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.cli-link{
  display: inline-block;
  margin-top: 8px;
  font-size: 0.9rem;
  color: rgba(148,163,184,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.cli-link:hover{
  color: rgba(226,232,240,.95);
}

</style>
