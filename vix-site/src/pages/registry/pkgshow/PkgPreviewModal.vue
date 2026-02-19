<!-- src/pages/registry/pkgshow/PkgPreviewModal.vue -->
<script setup>
defineProps({
  previewOpen: { type: Boolean, default: false },
  previewLoading: { type: Boolean, default: false },
  previewError: { type: String, default: "" },

  previewNode: { type: Object, default: null },
  previewLang: { type: String, default: "txt" },
  previewHtml: { type: String, default: "" },
  previewText: { type: String, default: "" },

  nodeWebUrl: { type: Function, required: true },

  copyPreviewPath: { type: Function, required: true },
  copyPreviewRawUrl: { type: Function, required: true },
  downloadPreviewFile: { type: Function, required: true },
  closePreview: { type: Function, required: true },
});
</script>

<template>
  <div class="modal" v-if="previewOpen" role="dialog" aria-modal="true">
    <div class="modal-card">
      <div class="modal-top">
        <div class="modal-title">
          <span class="mono">{{ previewNode?.path || "" }}</span>
        </div>
        <div class="modal-actions">
          <button class="mini-btn" @click="copyPreviewPath">Copy path</button>
          <button class="mini-btn" @click="copyPreviewRawUrl">Copy raw</button>
          <button class="mini-btn" @click="downloadPreviewFile">Download</button>
          <a
            class="mini-link"
            v-if="previewNode"
            :href="nodeWebUrl(previewNode)"
            target="_blank"
            rel="noreferrer"
          >
            Open
          </a>
          <button class="mini-btn danger" @click="closePreview" aria-label="Close preview">Close</button>
        </div>
      </div>

      <div class="state" v-if="previewLoading">
        <span class="spinner"></span>
        Loading preview...
      </div>

      <div class="state error" v-else-if="previewError">
        Error: {{ previewError }}
      </div>

      <div v-else class="modal-body">
        <div v-if="previewLang === 'md'" class="readme" v-html="previewHtml"></div>
        <pre v-else class="codebox"><code>{{ previewText }}</code></pre>
      </div>
    </div>

    <div class="modal-backdrop" @click="closePreview" aria-hidden="true"></div>
  </div>
</template>
