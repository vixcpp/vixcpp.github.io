<!-- src/pages/registry/pkgshow/PkgOverviewTab.vue -->
<script setup>
defineProps({
  pkg: { type: Object, default: null },

  installSnippet: { type: String, default: "" },
  includeSnippet: { type: String, default: "" },
  safeClipboardCopy: { type: Function, required: true },

  readmeLoading: { type: Boolean, default: false },
  readmeError: { type: String, default: "" },
  readmeHtml: { type: String, default: "" },
  readmeToc: { type: Array, default: () => [] },
  readmeMeta: { type: Object, default: () => ({ path: "", sourceUrl: "", editUrl: "" }) },
  readmeWarn: { type: String, default: "" },
});
</script>

<template>
  <div class="grid">
    <div class="card">
      <div class="card-title">Use</div>

      <div class="snippet">
        <div class="label">Add</div>
        <div class="row">
          <pre class="flex"><code>{{ installSnippet }}</code></pre>
          <button class="mini-btn" @click="safeClipboardCopy(installSnippet)" aria-label="Copy install command">
            Copy
          </button>
        </div>
      </div>

      <div class="snippet">
        <div class="label">Include</div>
        <div class="row">
          <pre class="flex"><code>{{ includeSnippet }}</code></pre>
          <button class="mini-btn" @click="safeClipboardCopy(includeSnippet)" aria-label="Copy include line">
            Copy
          </button>
        </div>
      </div>

      <div class="tags-wrap" v-if="pkg?.keywords && pkg.keywords.length">
        <div class="label">Keywords</div>
        <div class="tags">
          <span class="tag" v-for="k in pkg.keywords" :key="k">{{ k }}</span>
        </div>
      </div>

      <div class="hint">
        <span class="dot"></span>
        Tip: publish tag + commit in each version for stable browsing.
      </div>
    </div>

    <div class="card">
      <div class="card-title">README</div>

      <div class="state" v-if="readmeLoading">
        <span class="spinner"></span>
        Loading README...
      </div>

      <div class="state error" v-else-if="readmeError">
        Error: {{ readmeError }}
      </div>

      <template v-else>
        <div class="readme-top">
          <div class="readme-actions">
            <a v-if="readmeMeta.sourceUrl" class="mini-link" :href="readmeMeta.sourceUrl" target="_blank" rel="noreferrer">
              View source
            </a>
            <a v-if="readmeMeta.editUrl" class="mini-link" :href="readmeMeta.editUrl" target="_blank" rel="noreferrer">
              Edit
            </a>
          </div>

          <div class="warn" v-if="readmeWarn">{{ readmeWarn }}</div>

          <details class="toc" v-if="readmeToc.length">
            <summary>Table of contents</summary>
            <div class="toc-list">
              <a
                v-for="h in readmeToc"
                :key="h.id"
                class="toc-item"
                :style="{ paddingLeft: Math.min(24, (h.level - 1) * 10) + 'px' }"
                :href="'#' + h.id"
              >
                {{ h.text }}
              </a>
            </div>
          </details>
        </div>

        <div class="readme" v-html="readmeHtml"></div>
      </template>
    </div>
  </div>
</template>
