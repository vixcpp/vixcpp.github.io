<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  id: { type: String, default: "" },
  pkgDisplayName: { type: String, default: "" },
  pkg: { type: Object, default: null },

  indexVersion: { type: String, default: "" },
  selectedCommit: { type: String, default: "" },
  selectedTag: { type: String, default: "" },
  shortSha: { type: Function, required: true },

  offlineMode: { type: Boolean, default: false },
  ghNotice: { type: String, default: "" },

  sortedVersions: { type: Array, default: () => [] },
  selectedVersion: { type: String, default: "" },

  activeTab: { type: String, default: "overview" },
});

const emit = defineEmits(["setTab", "reloadTab"]);

// optional: small UI feedback on reload
const tabReloadKey = ref(0);

function relativeTime(iso) {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;

  const now = Date.now();
  const diff = Math.floor((now - t) / 1000);

  const minutes = Math.floor(diff / 60);
  const hours = Math.floor(diff / 3600);
  const days = Math.floor(diff / 86400);

  if (diff < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const latest = computed(() => {
  const v = props.pkg?.latestVersion || props.selectedVersion;
  if (v) return v;

  const versions = props.pkg?.versions ? Object.keys(props.pkg.versions) : [];
  return versions.length ? versions.sort().slice(-1)[0] : "";
});

const published = computed(() => {
  const iso = props.pkg?.versions?.[latest.value]?.publishedAt;
  const rel = relativeTime(iso);

  if (rel && latest.value) {
    return { rel, version: latest.value };
  }

  const rel2 = relativeTime(props.indexVersion);
  if (rel2) {
    return { rel: rel2, version: latest.value || "" };
  }

  return null;
});

function clickTab(t) {
  if (props.activeTab === t) {
    tabReloadKey.value++;
    emit("reloadTab", t);
    return;
  }
  emit("setTab", t);
}
</script>

<template>
  <header class="header">
    <div class="header-top single">
      <div class="pkg-block">

        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <RouterLink to="/registry/browse" class="crumb-link">
            Registry
          </RouterLink>

          <span class="crumb-sep">/</span>

          <span class="crumb-current">
            @{{ id }}
          </span>
        </div>

        <!-- Package name row -->
        <div class="pkg-name-row">
          <div class="pkg-name">
            {{ pkgDisplayName || id.split('/').pop() }}
          </div>

          <div class="chips">
            <span class="chip latest" v-if="latest">
              Latest {{ latest }}
            </span>
            <span class="chip offline" v-if="offlineMode">
              Offline
            </span>
          </div>
        </div>

        <div class="pkg-desc" v-if="pkg?.description">
          {{ pkg.description }}
        </div>

        <div class="meta-line" v-if="published">
          <span>
            Published {{ published.rel }}
            <span class="mono" v-if="published.version">
              ({{ published.version }})
            </span>
          </span>

          <span v-if="pkg?.license">• {{ pkg.license }}</span>
          <span v-if="pkg?.type">• {{ pkg.type }}</span>
        </div>

        <div class="notice" v-if="offlineMode">
          Offline mode is enabled. Browsing remote sources may be limited.
        </div>

        <div class="notice soft" v-else-if="ghNotice">
          {{ ghNotice }}
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <nav class="tabs" aria-label="Package tabs">
      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'overview' }"
        @click="clickTab('overview')"
      >
        Overview
      </button>

      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'docs' }"
        @click="clickTab('docs')"
      >
        Docs
      </button>

      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'files' }"
        @click="clickTab('files')"
      >
        Files
      </button>

      <button
        type="button"
        class="tab"
        :class="{ active: activeTab === 'versions' }"
        @click="clickTab('versions')"
      >
        Versions
      </button>
    </nav>
  </header>
</template>

<style scoped>
/* PkgShowHeader.vue (scoped)
   Goal: simple, flat header on large screens
   - no card border, no radius, no shadow
   - centered content with max width (does not touch edges)
   - tabs are flat with underline only
*/

.header{
  /* tokens */
  --page-max: 1180px;
  --pad-x: 24px;

  --bg: transparent;
  --line: rgba(255,255,255,.10);

  --text: rgba(255,255,255,.92);
  --muted: rgba(255,255,255,.62);
  --muted2: rgba(255,255,255,.50);

  --accent: #3aa6ff;
  --yellow: #ffd000;

  /* flat, no "card" */
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: var(--bg);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: visible;
  position: relative;
}

/* remove decorative glow */
.header::before{
  content: none;
}

/* keep everything centered like a page section */
.header-top{
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 18px var(--pad-x) 12px;
}

.header-top.single{
  display: block;
}

.pkg-block{
  min-width: 0;
}

/* top line is subtle, not a pill */
.pkg-topline{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pkg-id{
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;

  color: rgba(255,255,255,.78);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .02em;
}

/* title row */
.pkg-name-row{
  margin-top: 10px;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pkg-name{
  font-size: 30px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--text);
  word-break: break-word;
}

/* chips: keep only latest/offline, compact */
.chips{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.chip{
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.86);
  font-size: 12px;
  font-weight: 900;
}

.chip.latest{
  border-color: rgba(255,208,0,.35);
  background: rgba(255,208,0,.14);
  color: rgba(255,255,255,.95);
}

.chip.offline{
  border-color: rgba(255,255,255,.14);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.84);
}

/* description */
.pkg-desc{
  margin-top: 8px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  max-width: 80ch;
}

/* meta pills: lighter, flatter */
.meta-pills{
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.pill{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  font-size: 12.5px;
}

.pill .k{
  color: rgba(255,255,255,.55);
  font-weight: 900;
}

.pill .v{
  color: rgba(255,255,255,.82);
  font-weight: 900;
}

/* notices are simple lines, not boxes */
.notice{
  margin-top: 10px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,.70);
  font-size: 13px;
  line-height: 1.45;
}

.notice.soft{
  color: rgba(255,255,255,.70);
}

/* tabs: centered row with bottom border line */
.tabs{
  width: 100%;
  max-width: var(--page-max);
  margin: 10px auto 0;
  padding: 0 var(--pad-x);

  display: flex;
  gap: 18px;
  align-items: flex-end;

  border-top: 0;
  border-bottom: 1px solid rgba(255,255,255,.10);
  background: transparent;

  overflow-x: auto;
}

.tab{
  position: relative;
  padding: 12px 2px 12px;

  border: 0;
  border-radius: 0;
  background: transparent !important;
  box-shadow: none !important;

  color: rgba(255,255,255,.72);
  font-weight: 900;
  font-size: 13.5px;
  cursor: pointer;

  transition: color .14s ease;
}

.tab:hover{
  color: rgba(255,255,255,.92);
}

.tab::after{
  content:"";
  position:absolute;
  left: 0;
  right: 0;
  bottom: -1px;          /* sits on the bottom border line */
  height: 2px;
  background: transparent;
  border-radius: 999px;
}

.tab.active{
  color: rgba(255,255,255,.95) !important;
  background: transparent !important;
}

.tab.active::after{
  background: var(--accent);
}

/* Make sure no global style sneaks in */
.header .tabs .tab.active{
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* responsive */
@media (max-width: 900px){
  .header-top{ padding: 16px 16px 12px; }
  .tabs{ padding: 0 16px; gap: 14px; }
  .pkg-name{ font-size: 26px; }
}

@media (max-width: 520px){
  .header-top{ padding: 14px 14px 10px; }
  .tabs{ padding: 0 14px; }
  .pkg-name{ font-size: 22px; }
}
/* ---------------------------
   Tabs: flat nav (JSR-like)
---------------------------- */

/* nav container: no box, just a bottom hairline */
.tabs{
  width: 100%;
  max-width: var(--page-max, 1180px);
  margin: 10px auto 0;
  padding: 0 var(--pad-x, 24px);

  display: flex;
  align-items: flex-end;
  gap: 18px;

  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;

  /* single baseline */
  border-bottom: 1px solid rgba(255,255,255,.10) !important;

  /* allow horizontal scroll without visible scrollbar */
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;          /* Firefox */
  -ms-overflow-style: none;       /* IE/Edge legacy */
}
.tabs::-webkit-scrollbar{         /* Chrome/Safari */
  width: 0;
  height: 0;
}

/* tab button: text only */
.tab{
  appearance: none;
  -webkit-appearance: none;

  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;

  padding: 12px 2px 12px;
  margin: 0;

  color: rgba(255,255,255,.72);
  font-weight: 800;
  font-size: 13.5px;
  cursor: pointer;

  position: relative;
  line-height: 1;
}

.tab:hover{
  color: rgba(255,255,255,.92);
}

/* underline indicator */
.tab::after{
  content:"";
  position:absolute;
  left: 0;
  right: 0;
  bottom: -1px;                 /* sits on the baseline */
  height: 2px;
  background: transparent;
  border-radius: 999px;
}

.tab.active{
  color: rgba(255,255,255,.95) !important;
  background: transparent !important;
}

/* active underline only */
.tab.active::after{
  background: var(--accent, #3aa6ff) !important;
}

/* hard override if a global style adds borders/background on buttons */
.header .tabs .tab,
.header .tabs .tab.active{
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* responsive padding */
@media (max-width: 900px){
  .tabs{
    padding: 0 16px;
    gap: 14px;
  }
}
@media (max-width: 520px){
  .tabs{
    padding: 0 14px;
    gap: 12px;
  }
}
.meta-line{
  margin-top: 10px;
  font-size: 13.5px;
  color: rgba(255,255,255,.65);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-line .mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12.5px;
  color: rgba(255,255,255,.75);
}
/* Breadcrumb */
.breadcrumb{
  margin-bottom: 10px;
}

.back-link{
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,.60);
  text-decoration: none;
  transition: color .15s ease;
}

.back-link:hover{
  color: rgba(255,255,255,.95);
}
/* ---------------------------
   Breadcrumb (JSR style)
---------------------------- */

.breadcrumb{
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.crumb-link{
  color: rgba(140,200,255,.95);
  text-decoration: none;
  transition: color .15s ease;
}

.crumb-link:hover{
  color: rgba(255,255,255,.95);
}

.crumb-sep{
  color: rgba(255,255,255,.35);
}

.crumb-current{
  color: rgba(255,255,255,.90);
}

</style>
