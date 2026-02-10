<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";

import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

const route = useRoute();

const q = ref((route.query.q || "").toString());
const hits = ref([]);
const total = ref(0);
const loading = ref(true);
const version = ref("");
const error = ref("");

const worker = new RegistrySearchWorker();

function doSearch() {
  worker.postMessage({
    type: "search",
    query: q.value || "",
    limit: 20
  });
}

onMounted(async () => {
  worker.onmessage = (ev) => {
    const msg = ev.data || {};
    if (msg.type === "loaded") {
      version.value = msg.version || "";
      loading.value = false;
      doSearch();
    }
    if (msg.type === "searchResult") {
      hits.value = msg.hits || [];
      total.value = msg.total || 0;
      version.value = msg.version || version.value;
    }
    if (msg.type === "error") {
      error.value = msg.error || "worker_error";
    }
  };

  try {
    const { data } = await loadRegistryIndex();
    worker.postMessage({ type: "load", data });
  } catch {
    loading.value = false;
    error.value = "cannot_load_registry";
  }
});

onBeforeUnmount(() => {
  worker.terminate();
});

watch(
  () => route.query.q,
  (v) => {
    q.value = (v || "").toString();
    doSearch();
  }
);
</script>

<template>
  <section class="reg-browse">
    <header class="top">
      <div>
        <h1 class="title">Browse packages</h1>
        <p v-if="version" class="muted">Index: {{ version }}</p>
      </div>

      <div v-if="q" class="muted">Query: "{{ q }}"</div>
    </header>

    <div v-if="loading" class="muted">Loading registry…</div>
    <div v-else-if="error" class="muted">Error: {{ error }}</div>

    <div v-else>
      <div v-if="!q" class="muted">Type a query to search.</div>

      <div v-else-if="total === 0" class="muted">
        No results for "{{ q }}".
      </div>

      <div v-else class="muted">Found {{ total }} result(s).</div>

      <ul class="list">
        <li v-for="h in hits" :key="h.id" class="item">
          <div class="row">
            <div class="id">{{ h.id }}</div>
            <div class="ver">{{ h.latest }}</div>
          </div>

          <div v-if="h.description" class="desc">{{ h.description }}</div>

          <a
            v-if="h.repo"
            class="repo"
            :href="h.repo"
            target="_blank"
            rel="noreferrer"
          >
            {{ h.repo }}
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.reg-browse{
  padding: 26px 18px;
  max-width: 980px;
  margin: 0 auto;
}

.top{
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.title{
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
  color: #e5f9f6;
}

.muted{
  color: rgba(148,163,184,.95);
}

.list{
  list-style: none;
  padding: 0;
  margin: 18px 0 0;
  display: grid;
  gap: 14px;
}

.item{
  border: 1px solid rgba(148,163,184,.18);
  border-radius: 12px;
  padding: 14px;
  background: rgba(2,6,23,.35);
}

.row{
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}

.id{
  font-weight: 900;
  color: #e5f9f6;
}

.ver{
  font-weight: 800;
  color: rgba(94,234,212,.95);
}

.desc{
  margin-top: 6px;
  color: rgba(226,232,240,.92);
}

.repo{
  display: inline-block;
  margin-top: 8px;
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
