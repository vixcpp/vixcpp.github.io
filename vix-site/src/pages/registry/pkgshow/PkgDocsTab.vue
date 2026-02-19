<!-- src/pages/registry/pkgshow/PkgDocsTab.vue -->
<script setup>
const props = defineProps({
  id: { type: String, default: "" },

  docsLoading: { type: Boolean, default: false },
  docsError: { type: String, default: "" },

  hasRegistryExports: { type: Boolean, default: false },
  docsHeaderPicked: { type: String, default: "" },
  docsHeadersTried: { type: Array, default: () => [] },

  docsCounts: { type: Object, default: () => ({ namespaces: 0, types: 0, functions: 0, macros: 0, enums: 0 }) },
  docsActiveList: { type: Array, default: () => [] },

  docsJump: { type: String, default: "" },
  docsGroupsTab: { type: String, default: "functions" },

  nodeWebUrl: { type: Function, required: true },
});

const emit = defineEmits(["update:docsJump", "update:docsGroupsTab"]);

function setGroupsTab(v) {
  emit("update:docsGroupsTab", v);
}
</script>

<template>
  <div class="docs">
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
              :value="docsJump"
              @input="emit('update:docsJump', $event.target.value)"
              placeholder="Filter symbols..."
              aria-label="Filter symbols"
            />

            <div class="seg">
              <button class="seg-btn" :class="{ active: docsGroupsTab === 'functions' }" @click="setGroupsTab('functions')">Functions</button>
              <button class="seg-btn" :class="{ active: docsGroupsTab === 'types' }" @click="setGroupsTab('types')">Types</button>
              <button class="seg-btn" :class="{ active: docsGroupsTab === 'namespaces' }" @click="setGroupsTab('namespaces')">Namespaces</button>
              <button class="seg-btn" :class="{ active: docsGroupsTab === 'enums' }" @click="setGroupsTab('enums')">Enums</button>
              <button class="seg-btn" :class="{ active: docsGroupsTab === 'macros' }" @click="setGroupsTab('macros')">Macros</button>
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
</template>
