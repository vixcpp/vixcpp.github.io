<!-- src/pages/registry/pkgshow/PkgShowHeader.vue -->
<script setup>
const props = defineProps({
  id: { type: String, default: "" },
  pkgDisplayName: { type: String, default: "" },
  pkg: { type: Object, default: null },
  pkgRepoUrl: { type: String, default: "" },

  indexVersion: { type: String, default: "" },
  selectedCommit: { type: String, default: "" },
  selectedTag: { type: String, default: "" },
  shortSha: { type: Function, required: true },

  offlineMode: { type: Boolean, default: false },
  ghNotice: { type: String, default: "" },

  overviewBadges: { type: Array, default: () => [] },

  isDev: { type: Boolean, default: false },
  hasDevToken: { type: Boolean, default: false },
  tokenPolicyLabel: { type: String, default: "" },

  sortedVersions: { type: Array, default: () => [] },

  selectedVersion: { type: String, default: "" },
  metaOpen: { type: Boolean, default: false },

  activeTab: { type: String, default: "overview" },
});

const emit = defineEmits([
  "update:selectedVersion",
  "update:metaOpen",
  "setTab",
]);

function onSelectVersion(e) {
  emit("update:selectedVersion", e.target.value);
}
</script>

<template>
  <header class="header">
    <div class="header-top">
      <div class="pkg-block">
        <div class="pkg-id">{{ id }}</div>
        <div class="pkg-name">{{ pkgDisplayName }}</div>

        <div class="pkg-desc" v-if="pkg && pkg.description">
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
            <select :value="selectedVersion" @change="onSelectVersion" aria-label="Select version">
              <option v-for="v in sortedVersions" :key="v.version" :value="v.version">
                {{ v.version }}
              </option>
            </select>
          </div>
        </div>

        <button
          class="meta-btn"
          @click="emit('update:metaOpen', !metaOpen)"
          :aria-expanded="metaOpen ? 'true' : 'false'"
        >
          Registry metadata
        </button>
      </div>
    </div>

    <div v-if="metaOpen" class="meta-panel">
      <div class="meta-grid">
        <div class="meta-card">
          <div class="meta-title">Manifest</div>
          <div class="meta-kv"><span class="k">License</span><span class="v">{{ (pkg?.license || "-") }}</span></div>
          <div class="meta-kv"><span class="k">Type</span><span class="v">{{ (pkg?.type || "-") }}</span></div>
          <div class="meta-kv"><span class="k">Keywords</span><span class="v">{{ (pkg?.keywords || []).join(", ") || "-" }}</span></div>
        </div>

        <div class="meta-card">
          <div class="meta-title">Exports</div>
          <div class="meta-kv">
            <span class="k">exports.headers</span>
            <span class="v">{{ (pkg?.exports?.headers && pkg.exports.headers.length) ? "present" : "missing" }}</span>
          </div>

          <div class="meta-warn" v-if="!(pkg?.exports?.headers && pkg.exports.headers.length)">
            Missing exports.headers will reduce docs quality.
          </div>

          <div class="meta-snippet" v-if="!(pkg?.exports?.headers && pkg.exports.headers.length)">
            <div class="label">Add this to your registry entry</div>
            <pre><code>{{ $attrs.registryHintExportsJson ? $attrs.registryHintExportsJson() : "" }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <nav class="tabs" aria-label="Package tabs">
      <button class="tab" :class="{ active: activeTab === 'overview' }" @click="emit('setTab', 'overview')">
        Overview
      </button>
      <button class="tab" :class="{ active: activeTab === 'docs' }" @click="emit('setTab', 'docs')">
        Docs
      </button>
      <button class="tab" :class="{ active: activeTab === 'files' }" @click="emit('setTab', 'files')">
        Files
      </button>
      <button class="tab" :class="{ active: activeTab === 'versions' }" @click="emit('setTab', 'versions')">
        Versions
      </button>
    </nav>
  </header>
</template>
