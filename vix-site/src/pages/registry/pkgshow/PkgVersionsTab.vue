<!-- src/pages/registry/pkgshow/PkgVersionsTab.vue -->
<script setup>
defineProps({
  sortedVersions: { type: Array, default: () => [] },
  pkgLatest: { type: String, default: "" },
  shortSha: { type: Function, required: true },
  selectedVersion: { type: String, default: "" },
});

const emit = defineEmits(["update:selectedVersion"]);
</script>

<template>
  <div class="versions">
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
            <button class="pick" @click="emit('update:selectedVersion', v.version)">
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
</template>
