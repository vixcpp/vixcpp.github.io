<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";
import RegistrySearchWorker from "@/workers/registrySearch.worker.js?worker";

const route = useRoute();

const worker = new RegistrySearchWorker();

const loading = ref(true);
const error = ref("");
const version = ref("");
const pkg = ref(null);

const id = computed(() => {
  const ns = (route.params.namespace || "").toString().trim();
  const name = (route.params.name || "").toString().trim();
  return ns && name ? `${ns}/${name}` : "";
});

function askPackage() {
  if (!id.value) return;
  worker.postMessage({ type: "getPackage", id: id.value });
}

onMounted(async () => {
  worker.onmessage = (ev) => {
    const msg = ev.data || {};

    if (msg.type === "loaded") {
      version.value = msg.version || "";
      askPackage();
      return;
    }

    if (msg.type === "packageResult") {
      loading.value = false;
      version.value = msg.version || version.value;

      if (!msg.ok) {
        error.value = msg.error || "cannot_load_package";
        pkg.value = null;
        return;
      }

      pkg.value = msg.pkg || null;
      error.value = "";
      return;
    }

    if (msg.type === "error") {
      loading.value = false;
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

const statsRows = computed(() => {
  const s = pkg.value?.stats || {};
  return [
    { k: "Latest", v: pkg.value?.latest || "-" },
    { k: "Versions", v: String(s.versionsCount ?? "-") },
    { k: "Repo", v: s.hasRepo ? "yes" : "no" },
    { k: "Readme", v: s.hasReadme ? "yes" : "no" },
    { k: "Created", v: s.createdAt || "-" },
    { k: "Updated", v: s.updatedAt || "-" },
  ];
});
</script>

<template>
  <section class="show-page">
    <header class="top">
      <div class="top-inner">
        <div class="brand">
          <div class="logo" aria-hidden="true"></div>
          <div class="brand-text">Vix Registry</div>
        </div>

        <div class="meta">
          <div class="id">{{ id }}</div>
          <div class="sub" v-if="version">Index: {{ version }}</div>
        </div>
      </div>
    </header>

    <div class="wrap">
      <div class="panel">
        <div v-if="loading" class="state muted">Loading package…</div>
        <div v-else-if="error" class="state muted">Error: {{ error }}</div>

        <div v-else-if="pkg" class="content">
          <div class="head">
            <div class="left">
              <div class="title">{{ pkg.id }}</div>
              <div v-if="pkg.description" class="desc">{{ pkg.description }}</div>

              <div v-if="pkg.keywords && pkg.keywords.length" class="tags">
                <span v-for="t in pkg.keywords" :key="t" class="tag">{{ t }}</span>
              </div>

              <div class="links">
                <a v-if="pkg.repo" class="link" :href="pkg.repo" target="_blank" rel="noreferrer">Repository</a>
              </div>
            </div>

            <div class="right">
              <div class="badge">
                <div class="badge-k">Latest</div>
                <div class="badge-v">{{ pkg.latest || "-" }}</div>
              </div>
              <div class="badge">
                <div class="badge-k">License</div>
                <div class="badge-v">{{ pkg.license || "-" }}</div>
              </div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-title">Stats</div>
              <ul class="stats">
                <li v-for="r in statsRows" :key="r.k" class="stat">
                  <span class="k">{{ r.k }}</span>
                  <span class="v">{{ r.v }}</span>
                </li>
              </ul>
            </div>

            <div class="card" v-if="pkg.readme">
              <div class="card-title">Readme</div>
              <pre class="readme"><code>{{ pkg.readme }}</code></pre>
            </div>

            <div class="card" v-else>
              <div class="card-title">Readme</div>
              <div class="muted">No readme in index.</div>
            </div>
          </div>
        </div>

        <div v-else class="state muted">Not found.</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.show-page{
  min-height: 100vh;
  background:
    radial-gradient(circle at 50% 12%, rgba(34, 211, 238, 0.08), transparent 55%),
    radial-gradient(circle at 50% 60%, rgba(16, 185, 129, 0.06), transparent 60%),
    linear-gradient(to bottom, #031b1a, #020617);
}

.top{
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(10px);
  background: rgba(2,6,23,.55);
  border-bottom: 1px solid rgba(148,163,184,.12);
}

.top-inner{
  max-width: 1160px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  gap: 14px;
  align-items: center;
}

.brand{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.logo{
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, rgba(94,234,212,.95), rgba(34,197,94,.95));
  box-shadow: 0 10px 28px rgba(16,185,129,.18);
}

.brand-text{
  font-weight: 950;
  color: rgba(229,249,246,.95);
}

.meta{ margin-left: auto; text-align: right; }
.id{ color: rgba(226,232,240,.95); font-weight: 950; }
.sub{ margin-top: 2px; color: rgba(148,163,184,.95); font-size: .92rem; }

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

.state{ padding: 14px; }
.muted{ color: rgba(148,163,184,.95); }

.content{ padding: 14px; }

.head{
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(148,163,184,.10);
}

.title{
  font-weight: 950;
  color: rgba(229,249,246,.95);
  font-size: 1.15rem;
}

.desc{
  margin-top: 6px;
  color: rgba(226,232,240,.88);
  max-width: 780px;
}

.tags{
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: .9rem;
}

.links{
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.link{
  color: rgba(147,197,253,.95);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 900;
}

.right{
  display: grid;
  gap: 10px;
  min-width: 180px;
}

.badge{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(15,23,42,.25);
  border-radius: 12px;
  padding: 10px 12px;
}

.badge-k{
  color: rgba(148,163,184,.95);
  font-weight: 900;
  font-size: .88rem;
}

.badge-v{
  margin-top: 4px;
  color: rgba(94,234,212,.95);
  font-weight: 950;
}

.grid{
  margin-top: 14px;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 14px;
}

.card{
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(2,6,23,.25);
  border-radius: 14px;
  padding: 12px;
}

.card-title{
  font-weight: 950;
  color: rgba(229,249,246,.95);
  margin-bottom: 10px;
}

.stats{
  list-style: none;
  margin: 0;
  padding: 0;
}

.stat{
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-top: 1px solid rgba(148,163,184,.10);
}

.stat:first-child{ border-top: 0; }

.k{ color: rgba(148,163,184,.95); font-weight: 900; }
.v{ color: rgba(226,232,240,.92); font-weight: 950; }

.readme{
  margin: 0;
  overflow: auto;
  border-radius: 12px;
  padding: 12px;
  border: 1px solid rgba(148,163,184,.12);
  background: rgba(15,23,42,.25);
  color: rgba(226,232,240,.92);
  font-size: .92rem;
  line-height: 1.5;
}

@media (max-width: 920px){
  .head{ flex-direction: column; }
  .right{ min-width: 0; width: 100%; grid-template-columns: 1fr 1fr; }
  .grid{ grid-template-columns: 1fr; }
}
</style>
