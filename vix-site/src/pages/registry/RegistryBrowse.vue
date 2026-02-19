<!-- src/pages/RegistryBrowse.vue -->
<script setup>
import { ref, onMounted, watch, onBeforeUnmount, computed, nextTick } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

const route = useRoute();
const router = useRouter();

const worker = new RegistrySearchWorker();

const q = ref((route.query.q || "").toString());
const hits = ref([]);
const total = ref(0);
const loading = ref(true);
const version = ref("");
const error = ref("");

const searchEl = ref(null);

const isEmptyQuery = computed(() => !q.value || !q.value.trim());
const titleLabel = computed(() => (isEmptyQuery.value ? "Explore packages" : "Search results"));
const subtitleLabel = computed(() => {
  const parts = [];
  if (version.value) parts.push(`Index: ${version.value}`);
  if (!isEmptyQuery.value) parts.push(`Query: "${q.value.trim()}"`);
  return parts.join(" · ");
});

function focusSearch() {
  if (searchEl.value) searchEl.value.focus();
}

function doSearch() {
  const query = (q.value || "").trim();

  worker.postMessage({
    type: "search",
    query: query,
    limit: query ? 30 : 50,
    sort: query ? "score" : "latest",
  });
}

function goSearch(next) {
  const s = (next ?? q.value ?? "").toString().trim();

  if (!s) {
    router.push({ path: "/registry/browse", query: {} }).catch(() => {});
    return;
  }
  router.push({ path: "/registry/browse", query: { q: s } }).catch(() => {});
}

function clearSearch() {
  q.value = "";
  goSearch("");
  nextTick(() => focusSearch());
}

function openPkg(h) {
  if (!h) return;
  router.push({ path: `/registry/pkg/${h.namespace}/${h.name}` }).catch(() => {});
}

const keyHandler = (e) => {
  const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K");
  if (isCtrlK) {
    e.preventDefault();
    focusSearch();
    return;
  }

  const isEsc = e.key === "Escape";
  if (isEsc && document.activeElement === searchEl.value) {
    e.preventDefault();
    clearSearch();
  }
};

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

  window.addEventListener("keydown", keyHandler);

  try {
    const { data } = await loadRegistryIndex();
    worker.postMessage({ type: "load", data });
  } catch {
    loading.value = false;
    error.value = "cannot_load_registry";
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", keyHandler);
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
  <section class="page">
    <!-- Top bar (JSR-like) -->
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/registry">
          <span class="brand-dot" aria-hidden="true"></span>
          <span class="brand-text">Registry</span>
        </RouterLink>

        <form class="search" @submit.prevent="goSearch()">
          <span class="search-ico" aria-hidden="true">⌕</span>
          <input
            ref="searchEl"
            v-model="q"
            class="search-in"
            type="search"
            placeholder="Search packages"
            autocomplete="off"
            spellcheck="false"
            @keydown.enter.prevent="goSearch()"
          />
          <kbd class="kbd" title="Focus search">Ctrl K</kbd>
          <button v-if="q" class="x" type="button" @click="clearSearch" aria-label="Clear">×</button>
        </form>

        <nav class="nav">
          <a class="nav-link" href="/docs/" target="_self" rel="noreferrer">Docs</a>
          <a class="nav-link" href="https://github.com/vixcpp/registry" target="_blank" rel="noreferrer">GitHub</a>
          <RouterLink class="nav-link pill" to="/registry/publish">Publish</RouterLink>
        </nav>
      </div>
    </header>

    <!-- Content -->
    <div class="wrap">
      <div class="head">
        <div class="hblock">
          <div class="h1">{{ titleLabel }}</div>
          <div class="sub" v-if="subtitleLabel">{{ subtitleLabel }}</div>
        </div>

        <div class="meta">
          <div class="count" v-if="!loading && !error">
            {{ total }} result(s)
          </div>
        </div>
      </div>

      <div class="card">
        <div v-if="loading" class="state">
          <span class="spinner" aria-hidden="true"></span>
          Loading registry…
        </div>

        <div v-else-if="error" class="state error">
          Error: {{ error }}
        </div>

        <template v-else>
          <div v-if="!isEmptyQuery && total === 0" class="empty">
            <div class="empty-title">No results</div>
            <div class="empty-sub">Try a different query.</div>
          </div>

          <ul v-else class="list" role="list">
            <li v-for="h in hits" :key="h.id" class="row">
              <button class="row-btn" type="button" @click="openPkg(h)">
                <div class="left">
                  <!-- show id only once -->
                  <div class="pkg-id">
                    <span class="ns">@{{ h.namespace }}</span><span class="slash">/</span><span class="nm">{{ h.name }}</span>
                  </div>
                  <div v-if="h.description" class="desc">{{ h.description }}</div>
                </div>

                <div class="right">
                  <span class="tag" v-if="h.latest">v{{ h.latest }}</span>
                  <a v-if="h.repo" class="repo" :href="h.repo" target="_blank" rel="noreferrer" @click.stop>
                    repo
                  </a>
                </div>
              </button>
            </li>
          </ul>

          <div class="foot" v-if="isEmptyQuery">
            Tip: Ctrl K focuses search. Esc clears when focused.
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page{
  --max: 1160px;
  --pad: 20px;

  --bg: #05080b;
  --panel: rgba(255,255,255,.03);
  --border: rgba(255,255,255,.10);

  --text: rgba(255,255,255,.92);
  --muted: rgba(255,255,255,.66);
  --muted2: rgba(255,255,255,.54);

  --link: rgba(140,200,255,.95);
  --link2: rgba(140,200,255,.80);

  min-height: 100vh;
}

/* =========================
   Topbar
========================= */
.topbar{
  position: sticky;
  top: 0;
  z-index: 30;

  backdrop-filter: blur(10px);
  background: linear-gradient(to bottom, rgba(0,0,0,.55), rgba(0,0,0,.30));
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.topbar-inner{
  max-width: var(--max);
  margin: 0 auto;
  padding: 12px var(--pad);

  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.brand{
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
  font-weight: 950;
  letter-spacing: -0.01em;
}

.brand-dot{
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: rgba(140,200,255,.80);
  box-shadow: 0 0 0 3px rgba(140,200,255,.14);
}

.brand-text{
  font-size: 14px;
  opacity: .95;
}

/* =========================
   Search
========================= */
.search{
  display: flex;
  align-items: center;
  gap: 8px;

  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.10);
  border-radius: 12px;

  padding: 8px 10px;
  min-width: 0;
}

.search-ico{
  color: rgba(255,255,255,.60);
  font-size: 14px;
  flex: 0 0 auto;
}

.search-in{
  width: 100%;
  min-width: 0;

  background: transparent;
  border: 0;
  outline: none;

  color: var(--text);
  font-size: 14px;
  font-weight: 800;
}

.search-in::placeholder{
  color: rgba(255,255,255,.42);
  font-weight: 800;
}

.kbd{
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 900;
  color: rgba(255,255,255,.64);

  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.25);
  border-radius: 8px;
  padding: 3px 7px;
}

.x{
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 10px;

  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);

  color: rgba(255,255,255,.74);
  font-weight: 950;
  cursor: pointer;
}
.x:hover{
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.92);
}

/* =========================
   Nav
========================= */
.nav{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.nav-link{
  text-decoration: none;
  color: rgba(255,255,255,.70);
  font-size: 13px;
  font-weight: 900;
}
.nav-link:hover{ color: rgba(255,255,255,.92); }

.pill{
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
}

/* =========================
   Page head
========================= */
.wrap{
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--pad) 40px;
}

.head{
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 12px 0 12px;
}

.h1{
  font-size: 18px;
  font-weight: 950;
  color: var(--text);
  letter-spacing: -0.01em;
}

.sub{
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255,255,255,.62);
  font-weight: 800;
}

.count{
  font-size: 12px;
  font-weight: 900;
  color: rgba(255,255,255,.62);
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 999px;
  padding: 6px 10px;
}

/* =========================
   Card + list
========================= */
.card{
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(255,255,255,.03);
  border-radius: 14px;
  padding: 0 !important;
  overflow: hidden;
}

.state{
  padding: 16px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255,255,255,.70);
  font-size: 13.5px;
  font-weight: 800;
}
.state.error{ color: rgba(255,140,140,.92); }

.spinner{
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.18);
  border-top-color: rgba(255,255,255,.70);
  animation: spin .9s linear infinite;
}
@keyframes spin{ to{ transform: rotate(360deg); } }

.empty{
  padding: 18px 14px;
}
.empty-title{
  font-size: 14px;
  font-weight: 950;
  color: rgba(255,255,255,.90);
}
.empty-sub{
  margin-top: 6px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,.62);
}

.list{
  list-style: none;
  margin: 0;
  padding: 0;
}

.row{
  border-top: 1px solid rgba(255,255,255,.08);
}
.row:first-child{ border-top: 0; }

.row-btn{
  width: 100%;
  text-align: left;
  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 12px 14px;

  border: 0;
  background: transparent;
}
.row-btn:hover{
  background: rgba(255,255,255,.04);
}

.left{ min-width: 0; }

.pkg-id{
  font-size: 14px;
  font-weight: 950;
  color: rgba(255,255,255,.92);
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: baseline;
  gap: 0;
}

.ns{ color: rgba(255,255,255,.86); }
.slash{ color: rgba(255,255,255,.52); padding: 0 2px; }
.nm{ color: rgba(255,255,255,.92); }

.desc{
  margin-top: 6px;
  font-size: 13px;
  font-weight: 800;
  color: rgba(255,255,255,.62);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 760px;
}

.right{
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.tag{
  font-size: 12px;
  font-weight: 950;
  color: rgba(255,255,255,.82);
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.22);
  border-radius: 999px;
  padding: 6px 10px;
}

.repo{
  font-size: 12px;
  font-weight: 950;
  color: rgba(140,200,255,.95);
  text-decoration: none;
  border: 1px solid rgba(140,200,255,.22);
  background: rgba(140,200,255,.08);
  border-radius: 999px;
  padding: 6px 10px;
}
.repo:hover{
  background: rgba(140,200,255,.12);
}

/* Footer tip */
.foot{
  padding: 12px 14px;
  border-top: 1px solid rgba(255,255,255,.08);
  color: rgba(255,255,255,.60);
  font-size: 12.5px;
  font-weight: 800;
}

/* =========================
   Responsive
========================= */
@media (max-width: 960px){
  .topbar-inner{
    grid-template-columns: 1fr;
  }
  .nav{
    justify-content: flex-start;
  }
}

@media (max-width: 560px){
  .wrap{ padding: 14px 14px 28px; }
  .desc{ max-width: 100%; }
  .kbd{ display: none; }
  .head{ align-items: flex-start; flex-direction: column; }
  .right{ gap: 8px; }
}
</style>
