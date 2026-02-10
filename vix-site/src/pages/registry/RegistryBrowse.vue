<script setup>
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";

import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

const route = useRoute();
const router = useRouter();

const q = ref((route.query.q || "").toString());
const hits = ref([]);
const total = ref(0);
const loading = ref(true);
const version = ref("");
const error = ref("");

const searchEl = ref(null);

const worker = new RegistrySearchWorker();

function doSearch() {
  const isEmpty = !q.value || !q.value.trim();

  worker.postMessage({
    type: "search",
    query: isEmpty ? "" : q.value.trim(),
    limit: isEmpty ? 50 : 30,
    sort: isEmpty ? "latest" : "score"
  });
}
function goSearch(next) {
  const s = (next ?? q.value ?? "").toString().trim();

  if (!s) {
    router.push({ path: "/registry/browse", query: {} });
    return;
  }

  router.push({ path: "/registry/browse", query: { q: s } });
}

function focusSearch() {
  if (searchEl.value) searchEl.value.focus();
}

onMounted(async () => {
  worker.onmessage = (ev) => {
    const msg = ev.data || {};

    if (msg.type === "loaded") {
      version.value = msg.version || "";
      loading.value = false;
      doSearch();
      return;
    }

    if (msg.type === "searchResult") {
      hits.value = msg.hits || [];
      total.value = msg.total || 0;
      version.value = msg.version || version.value;
      return;
    }

    if (msg.type === "error") {
      error.value = msg.error || "worker_error";
      loading.value = false;
    }
  };

  const onKey = (e) => {
    const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K");
    if (!isCtrlK) return;
    e.preventDefault();
    focusSearch();
  };

  window.addEventListener("keydown", onKey);

  try {
    const { data } = await loadRegistryIndex();
    worker.postMessage({ type: "load", data });
  } catch {
    loading.value = false;
    error.value = "cannot_load_registry";
  }

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKey);
  });
});

onBeforeUnmount(() => {
  worker.terminate();
});

watch(
  () => route.query.q,
  (v) => {
    q.value = (v || "").toString();
    if (!loading.value && !error.value) doSearch();
  }
);
</script>

<template>
  <section class="reg-page">
    <!-- Top header like JSR -->
    <header class="reg-top">
      <div class="reg-top-inner">
        <RouterLink class="brand" to="/registry">
          <span class="logo" aria-hidden="true"></span>
          <span class="brand-text">Vix Registry</span>
        </RouterLink>

        <form class="search" @submit.prevent="goSearch()">
          <input
            ref="searchEl"
            v-model.trim="q"
            class="search-in"
            type="search"
            placeholder="Search for packages (Ctrl+K)"
            autocomplete="off"
            @keydown.enter.prevent="goSearch()"
          />
          <button class="search-btn" type="submit" :disabled="loading" aria-label="Search">
            <span aria-hidden="true">⌕</span>
          </button>
        </form>

        <nav class="nav">
          <a class="nav-link" href="/docs/" target="_self" rel="noreferrer">Docs</a>
          <a class="nav-link" href="https://github.com/vixcpp/registry" target="_blank" rel="noreferrer">
            GitHub
          </a>

          <RouterLink class="nav-link" to="/registry/publish">Publish</RouterLink>
        </nav>
      </div>
    </header>

    <!-- Body -->
    <div class="wrap">
      <div class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">
              {{ q ? "Search results" : "Explore packages" }}
            </div>
            <div class="panel-sub">
              <span v-if="version">Index: {{ version }}</span>
              <span v-if="q" class="sep">|</span>
              <span v-if="q">Query: "{{ q }}"</span>
            </div>
          </div>

          <div class="panel-right">
            <span v-if="!loading && !error" class="count">
              {{ total }} result(s)
            </span>

            <button v-if="q" class="clear" type="button" @click="goSearch('')">
              Clear
            </button>
          </div>
        </div>

        <div v-if="loading" class="state muted">Loading registry…</div>
        <div v-else-if="error" class="state muted">Error: {{ error }}</div>

        <div v-else>
          <div v-if="q && total === 0" class="state muted">
            No results for "{{ q }}".
          </div>

          <ul v-else class="list">
            <li v-for="h in hits" :key="h.id" class="item">
              <div class="row">
                <div class="left">
                <RouterLink
                  class="id id-link"
                  :to="`/registry/pkg/${h.namespace}/${h.name}`"
                >
                  {{ h.id }}
                </RouterLink>
                  <div v-if="h.description" class="desc">{{ h.description }}</div>
                </div>

                <div class="right">
                  <div class="ver">{{ h.latest }}</div>
                  <a
                    v-if="h.repo"
                    class="repo"
                    :href="h.repo"
                    target="_blank"
                    rel="noreferrer"
                  >
                    repo
                  </a>
                </div>
              </div>
            </li>
          </ul>

          <div v-if="!q" class="foot muted">
            Tip: use Ctrl+K to focus search
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.reg-page{
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 12%, rgba(34, 211, 238, 0.08), transparent 55%),
    radial-gradient(circle at 50% 60%, rgba(16, 185, 129, 0.06), transparent 60%),
    linear-gradient(to bottom, #031b1a, #020617);
}

/* Top bar */
.reg-top{
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
  background: rgba(2,6,23,.55);
  border-bottom: 1px solid rgba(148,163,184,.12);
}

.reg-top-inner{
  max-width: 1160px;
  margin: 0 auto;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
}

.brand{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.logo{
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background:
    linear-gradient(135deg, rgba(94,234,212,.95), rgba(34,197,94,.95));
  box-shadow: 0 10px 28px rgba(16,185,129,.18);
}

.brand-text{
  font-weight: 950;
  color: rgba(229,249,246,.95);
}

.search{
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(15,23,42,.35);
}

.search-in{
  width: 100%;
  min-width: 180px;
  padding: 10px 12px;
  border: 0;
  outline: none;
  color: rgba(226,232,240,.95);
  background: transparent;
}

.search-in::placeholder{
  color: rgba(148,163,184,.85);
}

.search-btn{
  width: 46px;
  border: 0;
  cursor: pointer;
  background: rgba(20,184,166,.22);
  color: rgba(229,249,246,.95);
  font-weight: 950;
}

.search-btn:hover{
  background: rgba(20,184,166,.30);
}

.search-btn:disabled{
  opacity: .6;
  cursor: not-allowed;
}

.nav{
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.nav-link{
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 800;
  font-size: 0.95rem;
}

.nav-link:hover{
  color: rgba(191,219,254,1);
}

.icon-btn{
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(15,23,42,.35);
  color: rgba(226,232,240,.92);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.icon-btn:hover{
  background: rgba(15,23,42,.55);
}

/* Body */
.wrap{
  max-width: 1160px;
  margin: 0 auto;
  padding: 18px 16px 40px;
}

.panel{
  border: 1px solid rgba(148,163,184,.14);
  border-radius: 14px;
  background: rgba(2,6,23,.35);
  overflow: hidden;
}

.panel-head{
  padding: 14px 14px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  background: rgba(2,6,23,.25);
  border-bottom: 1px solid rgba(148,163,184,.10);
}

.panel-title{
  font-weight: 950;
  color: rgba(229,249,246,.95);
}

.panel-sub{
  margin-top: 4px;
  color: rgba(148,163,184,.95);
  font-size: 0.92rem;
}

.sep{ margin: 0 8px; opacity: .6; }

.panel-right{
  display: inline-flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.count{
  font-weight: 900;
  color: rgba(226,232,240,.92);
  border: 1px solid rgba(148,163,184,.14);
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15,23,42,.25);
}

.clear{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 900;
}

.clear:hover{
  background: rgba(15,23,42,.45);
}

.state{
  padding: 14px;
}

.muted{
  color: rgba(148,163,184,.95);
}

.list{
  list-style: none;
  margin: 0;
  padding: 0;
}

.item{
  padding: 14px;
  border-top: 1px solid rgba(148,163,184,.10);
}

.item:first-child{
  border-top: 0;
}

.row{
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.id{
  font-weight: 950;
  color: rgba(229,249,246,.95);
}

.desc{
  margin-top: 6px;
  color: rgba(226,232,240,.88);
  max-width: 780px;
}

.right{
  display: grid;
  justify-items: end;
  gap: 8px;
  min-width: 120px;
}

.ver{
  font-weight: 950;
  color: rgba(94,234,212,.95);
}

.repo{
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 900;
}

.foot{
  padding: 12px 14px 14px;
  border-top: 1px solid rgba(148,163,184,.10);
}
.id-link{
  color: #1a73e8;
  font-weight: 700;
  text-decoration: none;
}

.id-link:hover{
  text-decoration: underline;
  text-underline-offset: 2px;
}

.id-link:visited{
  color: #1a73e8;
}


/* Mobile */
@media (max-width: 920px){
  .reg-top-inner{
    grid-template-columns: 1fr;
  }
  .nav{
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 520px){
  .row{
    flex-direction: column;
    align-items: stretch;
  }
  .right{
    justify-items: start;
  }
}
</style>
