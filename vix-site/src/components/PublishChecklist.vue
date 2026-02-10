<!-- src/components/PublishChecklist.vue -->
<script setup>
import { computed, reactive } from "vue";

const props = defineProps({
  repoUrl: { type: String, default: "" },
  namespace: { type: String, default: "" },
  name: { type: String, default: "" },
  version: { type: String, default: "" },
  commit: { type: String, default: "" },
  license: { type: String, default: "" },
  type: { type: String, default: "" },
  manifestPath: { type: String, default: "" },
  displayName: { type: String, default: "" },
  description: { type: String, default: "" },
  keywords: { type: String, default: "" },
  homepage: { type: String, default: "" },
  maintainerName: { type: String, default: "" },
  maintainerGithub: { type: String, default: "" },
  existingEntry: { type: Object, default: null },
});

function toLower(s) {
  return (s || "").toLowerCase().trim();
}

const nsLower = computed(() => toLower(props.namespace));
const nameLower = computed(() => toLower(props.name));

const tag = computed(() => {
  const v = (props.version || "").trim();
  return v ? `v${v}` : "";
});

const isNewPackage = computed(() => !props.existingEntry);

function splitKeywords(s) {
  return (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

async function copy(text) {
  const t = (text || "").trim();
  if (!t) return false;

  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = t;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

// schema rules
const reName = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const reNamespace = /^[a-z0-9][a-z0-9-]{0,63}$/;
const reSemverKey = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;
const reCommit = /^[0-9a-f]{7,40}$/i;

function isValidUrl(u) {
  try {
    const x = new URL((u || "").trim());
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

function keywordCountOk() {
  const n = splitKeywords(props.keywords).length;
  return n >= 4 && n <= 8;
}

function oneSentenceOk() {
  const s = (props.description || "").trim();
  if (!s) return false;
  if (s.length < 15) return false;
  if (s.length > 180) return false;
  return true;
}

function maintainerOk() {
  return !!(props.maintainerName.trim() && props.maintainerGithub.trim());
}

function typeOk() {
  return ["header-only", "cmake", "vix-module"].includes(props.type);
}

function manifestOk() {
  return !!props.manifestPath.trim();
}

const rules = computed(() => ({
  namePattern: reName.test(nameLower.value),
  namespacePattern: reNamespace.test(nsLower.value),
  versionSemver: reSemverKey.test((props.version || "").trim()),
  commitHex: reCommit.test((props.commit || "").trim()),
  repoUrlValid: isValidUrl(props.repoUrl),
  homepageValid: !props.homepage.trim() || isValidUrl(props.homepage),
  typeValid: typeOk(),
  manifestValid: manifestOk(),
}));

function sectionSeverity(items) {
  let bad = 0;
  let warn = 0;
  let manual = 0;
  for (const it of items) {
    if (it.status === "bad") bad++;
    else if (it.status === "warn") warn++;
    else if (it.status === "manual") manual++;
  }
  if (bad) return "bad";
  if (warn) return "warn";
  if (manual) return "manual";
  return "ok";
}

function sectionCounts(items) {
  let ok = 0;
  let bad = 0;
  let warn = 0;
  let manual = 0;
  let skip = 0;
  for (const it of items) {
    if (it.status === "ok") ok++;
    else if (it.status === "bad") bad++;
    else if (it.status === "warn") warn++;
    else if (it.status === "manual") manual++;
    else if (it.status === "skip") skip++;
  }
  return { ok, bad, warn, manual, skip };
}

const sections = computed(() => {
  const kw = splitKeywords(props.keywords);

  const sec1Items = [
    {
      text: "vix.json exists and contains at least name and namespace",
      status: "manual",
      tip: 'Check vix.json has { "name": "...", "namespace": "..." }',
    },
    {
      text: "Repo is clean (no uncommitted files)",
      status: "manual",
      tip: "git status --porcelain (should be empty)",
    },
    {
      text: `Version tag exists: ${tag.value || "v<version>"}`,
      status: "manual",
      tip: "git tag -l | grep v<version>",
    },
    {
      text: "Tag points to the correct commit you want to freeze",
      status: "manual",
      tip: "git rev-list -n 1 v<version>",
    },
    {
      text: "Tag is pushed to remote",
      status: "manual",
      tip: "git push --tags",
    },
    {
      text: "Package builds and examples/tests pass",
      status: "manual",
      tip: "Run your build + tests locally",
    },
  ];

  const sec2Items = [
    {
      text: "namespace and name (defines ID and file name)",
      status: rules.value.namespacePattern && rules.value.namePattern ? "ok" : "bad",
      tip: "Must match schema patterns",
    },
    {
      text: "version (SemVer key)",
      status: rules.value.versionSemver ? "ok" : "bad",
      tip: "Format: x.y.z or x.y.z-alpha.1",
    },
    {
      text: `tag (auto): ${tag.value || "v<version>"}`,
      status: rules.value.versionSemver ? "ok" : "bad",
      tip: "Tag is derived from version",
    },
    {
      text: "commit (required, pinning, reproducible installs)",
      status: rules.value.commitHex ? "ok" : "bad",
      tip: "hex 7..40. From: git rev-list -n 1 v<version>",
    },
    {
      text: "repo.url (clonable URL)",
      status: rules.value.repoUrlValid ? "ok" : "bad",
      tip: "Must be a valid https URL",
    },
    {
      text: "license",
      status: props.license.trim() ? "ok" : "bad",
      tip: "Example: MIT, Apache-2.0",
    },
    {
      text: "type and manifestPath",
      status: rules.value.typeValid && rules.value.manifestValid ? "ok" : "bad",
      tip: "type in header-only | cmake | vix-module and manifestPath not empty",
    },
  ];

  const sec3Items = [
    {
      text: "displayName filled if the name is cryptic",
      status: props.displayName.trim() ? "ok" : "warn",
      tip: "Recommended for readable listings",
    },
    {
      text: "description is short and useful (one sentence)",
      status: oneSentenceOk() ? "ok" : "warn",
      tip: "Aim for 1 sentence, 15..180 chars",
    },
    {
      text: "4 to 8 precise keywords",
      status: keywordCountOk() ? "ok" : "warn",
      tip: `Current: ${kw.length}. Recommended: 4..8`,
    },
    {
      text: "homepage set if different from repo",
      status: !props.homepage.trim() || rules.value.homepageValid ? "ok" : "bad",
      tip: "Optional, but must be a valid URL if provided",
    },
    {
      text: "maintainers has at least github + name",
      status: maintainerOk() ? "ok" : "warn",
      tip: "Add maintainer name and GitHub handle",
    },
  ];

  const sec4Items = [
    {
      text: "name matches: [a-z0-9][a-z0-9._-]{0,63}",
      status: rules.value.namePattern ? "ok" : "bad",
      tip: "Allowed: letters, digits, dot, underscore, dash",
    },
    {
      text: "namespace matches: [a-z0-9][a-z0-9-]{0,63}",
      status: rules.value.namespacePattern ? "ok" : "bad",
      tip: "Allowed: letters, digits, dash",
    },
    {
      text: "versions key matches semver: x.y.z with optional suffix",
      status: rules.value.versionSemver ? "ok" : "bad",
      tip: "Examples: 1.2.3, 1.2.3-alpha.1",
    },
    {
      text: "commit is hex 7..40",
      status: rules.value.commitHex ? "ok" : "bad",
      tip: "Example: 18363babf297b4050d2585596238012faee65d52",
    },
    {
      text: "repo.url and homepage are valid URIs",
      status: rules.value.repoUrlValid && rules.value.homepageValid ? "ok" : "bad",
      tip: "Must be http/https",
    },
    {
      text: "type is header-only | cmake | vix-module",
      status: rules.value.typeValid ? "ok" : "bad",
      tip: "Pick one integration type",
    },
  ];

  const sec5Items = [
    {
      text: "New package: Open GitHub new file",
      status: isNewPackage.value ? "ok" : "skip",
      tip: "Creates index/<namespace>.<name>.json",
    },
    {
      text: "Commit on branch: publish-<ns>-<name>-<version>",
      status: "manual",
      tip: "Use that branch naming in GitHub UI or locally",
    },
    {
      text: "Open PR to vixcpp/registry:main",
      status: "manual",
      tip: "PR should target main",
    },
    {
      text: "Existing package: Edit existing entry",
      status: !isNewPackage.value ? "ok" : "skip",
      tip: "Add versions[version] and update latest if needed",
    },
  ];

  const sec6Items = [
    { text: "Wait for registry site refresh or rebuild", status: "manual", tip: "Depends on deployment" },
    { text: "Test: vix registry sync", status: "manual", tip: "Pull latest index locally" },
    { text: "Test: vix search <name>", status: "manual", tip: "Ensure it is discoverable" },
    { text: "Test: vix add <ns>/<name> (or your install flow)", status: "manual", tip: "End-to-end install" },
  ];

  const sec1Cmds = [
    "git status --porcelain",
    "git rev-list -n 1 v<version>",
    "git push --tags",
  ];

  return [
    {
      id: "sec2",
      title: "Checklist 2: Required data",
      defaultOpen: true,
      items: sec2Items,
    },
    {
      id: "sec5",
      title: "Checklist 5: GitHub publish flow",
      defaultOpen: false,
      items: sec5Items,
    },
    {
      id: "sec1",
      title: "Checklist 1: Before publishing",
      defaultOpen: false,
      items: sec1Items,
      commands: sec1Cmds,
    },
    {
      id: "sec3",
      title: "Checklist 3: Search quality",
      defaultOpen: false,
      items: sec3Items,
    },
    {
      id: "sec4",
      title: "Checklist 4: Schema rules",
      defaultOpen: false,
      items: sec4Items,
    },
    {
      id: "sec6",
      title: "Checklist 6: After merge",
      defaultOpen: false,
      items: sec6Items,
    },
  ].map((s) => ({
    ...s,
    severity: sectionSeverity(s.items),
    counts: sectionCounts(s.items),
  }));
});

const expanded = reactive({});

function isOpen(sec) {
  if (expanded[sec.id] === undefined) return !!sec.defaultOpen;
  return !!expanded[sec.id];
}

function toggle(sec) {
  expanded[sec.id] = !isOpen(sec);
}

function countSummary(allSections) {
  let ok = 0;
  let bad = 0;
  let warn = 0;
  let manual = 0;

  for (const s of allSections) {
    ok += s.counts.ok;
    bad += s.counts.bad;
    warn += s.counts.warn;
    manual += s.counts.manual;
  }

  return { ok, bad, warn, manual };
}

const summary = computed(() => countSummary(sections.value));

const copiedHint = reactive({ text: "" });

async function copyCommands(sec) {
  const cmds = Array.isArray(sec.commands) ? sec.commands : [];
  if (!cmds.length) return;
  const ok = await copy(cmds.join("\n") + "\n");
  if (!ok) return;
  copiedHint.text = "Copied commands";
  window.setTimeout(() => {
    copiedHint.text = "";
  }, 1200);
}
</script>

<template>
  <div class="cl">
    <div class="cl-head">
      <div class="cl-title">Publishing checklist</div>
      <div class="cl-summary">
        <span class="chip ok">OK {{ summary.ok }}</span>
        <span class="chip bad">Blockers {{ summary.bad }}</span>
        <span class="chip warn">Warnings {{ summary.warn }}</span>
        <span class="chip manual">Manual {{ summary.manual }}</span>
      </div>
    </div>

    <div v-if="copiedHint.text" class="copied">{{ copiedHint.text }}</div>

    <div v-for="sec in sections" :key="sec.id" class="sec" :class="sec.severity">
      <button class="sec-head" type="button" @click="toggle(sec)">
        <div class="sec-left">
          <span class="chev" :class="{ open: isOpen(sec) }">›</span>
          <span class="sec-title">{{ sec.title }}</span>
        </div>

        <div class="sec-right">
          <span class="mini" v-if="sec.counts.bad">! {{ sec.counts.bad }}</span>
          <span class="mini w" v-if="sec.counts.warn">i {{ sec.counts.warn }}</span>
          <span class="mini m" v-if="sec.counts.manual">• {{ sec.counts.manual }}</span>

          <button
            v-if="sec.commands && sec.commands.length"
            class="copy-btn"
            type="button"
            @click.stop="copyCommands(sec)"
          >
            Copy commands
          </button>
        </div>
      </button>

      <div v-show="isOpen(sec)" class="sec-body">
        <ul class="items">
          <li v-for="it in sec.items" :key="it.text" class="item">
            <span class="mark" :class="it.status">
              <span v-if="it.status === 'ok'">✓</span>
              <span v-else-if="it.status === 'bad'">!</span>
              <span v-else-if="it.status === 'warn'">i</span>
              <span v-else-if="it.status === 'manual'">•</span>
            </span>

            <div class="body">
              <div class="text" :class="{ muted: it.status === 'skip' }">{{ it.text }}</div>
              <div v-if="it.tip" class="tip">{{ it.tip }}</div>
            </div>
          </li>
        </ul>

        <div v-if="sec.commands && sec.commands.length" class="cmds">
          <div class="cmd-title">Commands</div>
          <pre class="pre"><code>{{ sec.commands.join('\n') }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cl{
  border: 1px solid rgba(148,163,184,.18);
  border-radius: 14px;
  background: rgba(2,6,23,.35);
  padding: 14px;
}

.cl-head{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.cl-title{
  font-weight: 950;
  font-size: 1.05rem;
}

.cl-summary{
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip{
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 0.9rem;
  border: 1px solid rgba(148,163,184,.18);
}
.chip.ok{ background: rgba(34,197,94,.12); color: rgba(187,247,208,.95); }
.chip.bad{ background: rgba(248,113,113,.12); color: rgba(254,226,226,.95); }
.chip.warn{ background: rgba(251,191,36,.12); color: rgba(254,243,199,.95); }
.chip.manual{ background: rgba(59,130,246,.12); color: rgba(191,219,254,.95); }

.copied{
  margin: 10px 0 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(34,197,94,.12);
  border: 1px solid rgba(34,197,94,.2);
  color: rgba(187,247,208,.95);
  font-weight: 900;
}

.sec{
  margin-top: 10px;
  border: 1px solid rgba(148,163,184,.14);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(15,23,42,.28);
}

.sec.bad{ border-color: rgba(248,113,113,.22); }
.sec.warn{ border-color: rgba(251,191,36,.20); }

.sec-head{
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: rgba(226,232,240,.95);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
}

.sec-left{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chev{
  display: inline-flex;
  width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  font-weight: 950;
  transform: rotate(0deg);
  transition: transform .12s ease;
  opacity: .9;
}
.chev.open{ transform: rotate(90deg); }

.sec-title{
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sec-right{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mini{
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 950;
  font-size: 0.86rem;
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(2,6,23,.25);
  color: rgba(254,226,226,.95);
}
.mini.w{ color: rgba(254,243,199,.95); }
.mini.m{ color: rgba(191,219,254,.95); }

.copy-btn{
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(2,6,23,.28);
  color: rgba(226,232,240,.95);
  padding: 6px 10px;
  border-radius: 10px;
  font-weight: 950;
  cursor: pointer;
}
.copy-btn:hover{ filter: brightness(1.06); }

.sec-body{
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(148,163,184,.12);
}

.items{
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.item{
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: flex-start;
}

.mark{
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 950;
  border: 1px solid rgba(148,163,184,.18);
  color: rgba(226,232,240,.95);
  background: rgba(15,23,42,.35);
}
.mark.ok{ background: rgba(34,197,94,.12); color: rgba(187,247,208,.95); }
.mark.bad{ background: rgba(248,113,113,.12); color: rgba(254,226,226,.95); }
.mark.warn{ background: rgba(251,191,36,.12); color: rgba(254,243,199,.95); }
.mark.manual{ background: rgba(59,130,246,.12); color: rgba(191,219,254,.95); }
.mark.skip{ opacity: .45; }

.text{
  font-weight: 850;
  color: rgba(226,232,240,.95);
}
.muted{ opacity: .55; }

.tip{
  margin-top: 4px;
  color: rgba(148,163,184,.95);
  font-size: 0.92rem;
}

.cmds{
  margin-top: 12px;
  border-top: 1px solid rgba(148,163,184,.12);
  padding-top: 10px;
}
.cmd-title{
  font-weight: 950;
  margin-bottom: 8px;
  color: rgba(226,232,240,.95);
}
.pre{
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  background: rgba(0,0,0,.28);
  border: 1px solid rgba(148,163,184,.16);
}
</style>
