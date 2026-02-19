<!-- src/pages/registry/pkgshow/PkgFilesTab.vue -->
<script setup>
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
</script>

<template>
  <div class="files">
    <div class="card">
      <div class="card-title">Files</div>

      <div class="files-top">
        <div class="crumbs">
          <button class="crumb" @click="goRoot" :class="{ active: !currentPath }">root</button>
          <template v-for="p in pathStack" :key="p">
            <span class="sep">/</span>
            <button class="crumb" @click="goCrumb(p)" :class="{ active: currentPath === p }">
              {{ p.split('/').pop() }}
            </button>
          </template>
        </div>

        <div class="files-actions">
          <button class="mini-btn" @click="goUp" :disabled="!currentPath" aria-label="Go up">
            Up
          </button>
          <button
            class="mini-btn"
            @click="emit('update:globalSearchOpen', !globalSearchOpen)"
            aria-label="Toggle global search"
          >
            Search
          </button>
        </div>
      </div>

      <div v-if="globalSearchOpen" class="search-box">
        <div class="row">
          <input
            class="input flex"
            :value="globalSearchQuery"
            @input="emit('update:globalSearchQuery', $event.target.value)"
            placeholder="Code search (repo-wide)..."
          />
          <button class="mini-btn" @click="runGlobalSearch" :disabled="globalSearchLoading">Go</button>
        </div>

        <div class="state" v-if="globalSearchLoading">
          <span class="spinner"></span>
          Searching...
        </div>
        <div class="state error" v-else-if="globalSearchError">
          Error: {{ globalSearchError }}
        </div>
        <div v-else-if="globalSearchResults.length" class="search-results">
          <a
            class="search-hit"
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

      <div class="controls">
        <input
          class="input flex"
          :value="filesFilter"
          @input="emit('update:filesFilter', $event.target.value)"
          placeholder="Filter in this folder..."
          aria-label="Filter files"
        />

        <label class="toggle">
          <input type="checkbox" :checked="filesShowHidden" @change="emit('update:filesShowHidden', $event.target.checked)" />
          <span>Show hidden</span>
        </label>

        <div class="sort">
          <button class="mini-btn" @click="toggleSort('type')">Type</button>
          <button class="mini-btn" @click="toggleSort('name')">Name</button>
          <button class="mini-btn" @click="toggleSort('size')">Size</button>
          <span class="muted small">{{ filesSortKey }} {{ filesSortDir }}</span>
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
        <div class="file-list">
          <div class="file-row head">
            <div class="c1">Name</div>
            <div class="c2">Size</div>
            <div class="c3"></div>
          </div>

          <button v-if="currentPath" class="file-row back" @click="goUp">
            <div class="c1">
              <span class="icon dir"></span>
              <span class="path">..</span>
            </div>
            <div class="c2"></div>
            <div class="c3"><span class="arrow">›</span></div>
          </button>

          <button
            v-for="n in visibleListing"
            :key="n.path"
            class="file-row btn"
            @click="openNode(n)"
          >
            <div class="c1">
              <span class="icon" :class="n.type === 'dir' ? 'dir' : 'file'"></span>
              <span class="path">{{ n.name }}</span>
            </div>
            <div class="c2">
              <span class="muted">{{ n.type === 'dir' ? '' : niceSize(n.size) }}</span>
            </div>
            <div class="c3"><span class="arrow">›</span></div>
          </button>

          <div class="loadmore" v-if="canLoadMore">
            <button class="mini-btn" @click="loadMore">Load more</button>
            <span class="muted small">{{ visibleListing.length }} / {{ filteredSortedListingLen }}</span>
          </div>

          <div class="hint soft" v-if="pkgRepoUrl">
            Open on GitHub:
            <a class="link" :href="nodeWebUrl({ type: 'dir', name: currentPath || '', path: currentPath || '' }) || pkgRepoUrl" target="_blank" rel="noreferrer">
              {{ currentPath ? currentPath : "repo root" }}
            </a>
          </div>
        </div>
      </template>
    </div>

    <PkgPreviewModal
      :previewOpen="previewOpen"
      :previewLoading="previewLoading"
      :previewError="previewError"
      :previewNode="previewNode"
      :previewLang="previewLang"
      :previewHtml="previewHtml"
      :previewText="previewText"
      :nodeWebUrl="nodeWebUrl"
      :copyPreviewPath="copyPreviewPath"
      :copyPreviewRawUrl="copyPreviewRawUrl"
      :downloadPreviewFile="downloadPreviewFile"
      :closePreview="closePreview"
    />
  </div>
</template>
