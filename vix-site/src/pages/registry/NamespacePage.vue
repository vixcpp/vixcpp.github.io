<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { loadRegistryIndex } from "@/lib/loadRegistryIndex";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref("");
const version = ref("");
const allPackages = ref([]);

const namespace = computed(() => (route.params.namespace || "").toString().trim());
const namespaceLower = computed(() => namespace.value.toLowerCase());

const page = ref(Math.max(1, Number(route.query.page || 1)));
const pageSize = ref(30);

function safeParseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

const indexLabel = computed(() => {
  const d = safeParseDate(version.value);
  if (!d) return version.value ? `Index: ${version.value}` : "";

  const txt = d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `Index: ${txt}`;
});

const filtered = computed(() => {
  const ns = namespaceLower.value;

  return (allPackages.value || [])
    .filter((pkg) => (pkg.namespace || "").toString().toLowerCase() === ns)
    .sort((a, b) => {
      const aName = (a.name || "").toString().toLowerCase();
      const bName = (b.name || "").toString().toLowerCase();
      return aName.localeCompare(bName);
    });
});

const total = computed(() => filtered.value.length);

const totalPages = computed(() => {
  const t = Number(total.value || 0);
  const s = Number(pageSize.value || 1);
  return Math.max(1, Math.ceil(t / s));
});

const offset = computed(() => (page.value - 1) * pageSize.value);

const hits = computed(() => {
  return filtered.value.slice(offset.value, offset.value + pageSize.value);
});

const showingFrom = computed(() => (total.value ? offset.value + 1 : 0));
const showingTo = computed(() => Math.min(offset.value + pageSize.value, total.value || 0));

const namespaceTitle = computed(() => `@${namespace.value}`);
const subtitleLabel = computed(() => {
  const parts = [];

  if (indexLabel.value) parts.push(indexLabel.value);
  if (!loading.value && !error.value) {
    parts.push(`Showing ${showingFrom.value} to ${showingTo.value} of ${total.value}`);
  }

  return parts.join(" · ");
});

const pageButtons = computed(() => {
  const cur = page.value;
  const max = totalPages.value;
  const out = [];

  const push = (x) => out.push(x);

  const windowSize = 2;
  const start = Math.max(1, cur - windowSize);
  const end = Math.min(max, cur + windowSize);

  push(1);
  if (start > 2) push("…");

  for (let i = start; i <= end; i++) {
    if (i !== 1 && i !== max) push(i);
  }

  if (end < max - 1) push("…");
  if (max > 1) push(max);

  return out.filter((v, i) => i === 0 || v !== out[i - 1]);
});

const keyHandler = (e) => {
  const isNext = (e.altKey || e.metaKey) && e.key === "ArrowRight";
  const isPrev = (e.altKey || e.metaKey) && e.key === "ArrowLeft";

  if (loading.value || error.value) return;

  if (isNext) {
    e.preventDefault();
    nextPage();
  } else if (isPrev) {
    e.preventDefault();
    prevPage();
  }
};

function openPkg(h) {
  if (!h) return;
  router.push({ path: `/registry/pkg/${h.namespace}/${h.name}` }).catch(() => {});
}

function goBrowse() {
  router.push({ path: "/registry/browse" }).catch(() => {});
}

function setPage(p) {
  const np = Math.max(1, Math.min(Number(p || 1), totalPages.value));

  router
    .push({
      path: `/registry/ns/${namespace.value}`,
      query: np > 1 ? { page: np } : {},
    })
    .catch(() => {});
}

function nextPage() {
  if (page.value < totalPages.value) setPage(page.value + 1);
}

function prevPage() {
  if (page.value > 1) setPage(page.value - 1);
}

async function loadData() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await loadRegistryIndex();

    version.value = data?.meta?.generatedAt || "";
    allPackages.value = Array.isArray(data?.entries) ? data.entries : [];

    if (page.value > totalPages.value) {
      page.value = totalPages.value;
    }
  } catch {
    error.value = "cannot_load_registry";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  window.addEventListener("keydown", keyHandler);
  document.body.classList.add("is-registry");
  await loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", keyHandler);
  document.body.classList.remove("is-registry");
});

watch(
  () => route.query.page,
  (v) => {
    page.value = Math.max(1, Number(v || 1));
  }
);

watch(
  () => route.params.namespace,
  async () => {
    page.value = Math.max(1, Number(route.query.page || 1));
    await loadData();
  }
);

watch(totalPages, (tp) => {
  if (page.value > tp) {
    setPage(tp);
  }
});
</script>

<template>
  <section class="page">
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink class="brand" to="/registry" aria-label="Registry home">
          <span class="brand-text">Vix registry</span>
        </RouterLink>

        <nav class="crumbs" aria-label="Breadcrumb">
          <RouterLink class="crumb" to="/registry">Home</RouterLink>
          <span class="crumb-sep">/</span>
          <RouterLink class="crumb" to="/registry/browse">Browse</RouterLink>
          <span class="crumb-sep">/</span>
          <span class="crumb current">@{{ namespace }}</span>
        </nav>

        <nav class="actions" aria-label="Namespace actions">
          <button class="action-btn ghost" type="button" @click="goBrowse">Browse all</button>
          <RouterLink class="action-btn" to="/registry/publish">Publish</RouterLink>
        </nav>
      </div>
    </header>

    <div class="wrap">
      <div class="hero">
        <div class="hero-left">
          <div class="eyebrow">Namespace</div>
          <h1 class="hero-title">{{ namespaceTitle }}</h1>
          <p class="hero-text">
            Browse all published packages inside this namespace.
          </p>

          <div class="hero-meta" v-if="subtitleLabel">
            {{ subtitleLabel }}
          </div>
        </div>

        <div class="hero-right">
          <div class="stat-card">
            <div class="stat-label">Packages</div>
            <div class="stat-value">{{ total }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div v-if="loading" class="state">
          <span class="spinner" aria-hidden="true"></span>
          Loading namespace…
        </div>

        <div v-else-if="error" class="state error">
          Error: {{ error }}
        </div>

        <template v-else>
          <div v-if="total === 0" class="empty">
            <div class="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="currentColor"
                  d="M4 7.75A2.75 2.75 0 0 1 6.75 5h10.5A2.75 2.75 0 0 1 20 7.75v8.5A2.75 2.75 0 0 1 17.25 19H6.75A2.75 2.75 0 0 1 4 16.25zM6.75 6.5c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25z"
                />
              </svg>
            </div>
            <div class="empty-title">No packages in this namespace</div>
            <div class="empty-sub">
              Publish the first package or check the namespace name.
            </div>
          </div>

          <ul v-else class="list" role="list">
            <li v-for="h in hits" :key="`${h.namespace}/${h.name}`" class="row">
              <button class="row-btn" type="button" @click="openPkg(h)">
                <div class="left">
                  <div class="pkg-id">
                    <RouterLink
                      class="ns-link"
                      :to="`/registry/ns/${h.namespace}`"
                      @click.stop
                    >
                      @{{ h.namespace }}
                    </RouterLink>
                    <span class="slash">/</span>
                    <span class="nm">{{ h.name }}</span>
                  </div>

                  <div v-if="h.description" class="desc">
                    {{ h.description }}
                  </div>
                </div>

                <div class="right">
                  <span class="tag" v-if="h.latest">v{{ h.latest }}</span>

                  <a
                    v-if="h.repo"
                    class="repo"
                    :href="h.repo"
                    target="_blank"
                    rel="noreferrer"
                    @click.stop
                  >
                    repo
                  </a>
                </div>
              </button>
            </li>
          </ul>

          <div class="pager" v-if="total > pageSize">
            <button class="pager-btn" type="button" :disabled="page <= 1" @click="prevPage">
              Prev
            </button>

            <div class="pager-mid">
              <button
                v-for="b in pageButtons"
                :key="String(b)"
                class="pager-pill"
                type="button"
                :disabled="b === '…'"
                :data-active="b === page"
                @click="typeof b === 'number' && setPage(b)"
              >
                {{ b }}
              </button>
            </div>

            <button
              class="pager-btn"
              type="button"
              :disabled="page >= totalPages"
              @click="nextPage"
            >
              Next
            </button>
          </div>

          <div class="foot">
            Tip: Alt Left/Right changes pages.
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

  --bg: var(--vp-c-bg, #14181b);
  --panel: rgba(255,255,255,.03);
  --panel-2: rgba(255,255,255,.045);
  --border: rgba(255,255,255,.10);
  --border-soft: rgba(255,255,255,.08);

  --text: var(--vp-c-text-1, rgba(255,255,255,.92));
  --muted: var(--vp-c-text-2, rgba(255,255,255,.68));
  --muted-2: rgba(255,255,255,.54);

  --brand: #1ee6a3;
  --brand-soft: rgba(30,230,163,.12);
  --brand-border: rgba(30,230,163,.22);

  --link: rgba(140,200,255,.95);
  --link-soft: rgba(140,200,255,.10);
  --link-border: rgba(140,200,255,.22);

  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
}

/* topbar */
.topbar{
  position: sticky;
  top: 0;
  z-index: 40;
  border: 0;
  box-shadow: none;
  background: color-mix(in srgb, var(--bg) 78%, transparent);
  backdrop-filter: blur(10px);
}

.topbar-inner{
  max-width: var(--max);
  margin: 0 auto;
  padding: 10px var(--pad);
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
}

.brand{
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  letter-spacing: -0.02em;
  min-width: max-content;
}

.brand-text{
  font-size: 15px;
  font-weight: 600;
  color: var(--brand);
}

.crumbs{
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.crumb{
  color: var(--muted);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

.crumb:hover{
  color: var(--text);
}

.crumb.current{
  color: var(--text);
  font-weight: 700;
}

.crumb-sep{
  color: var(--muted-2);
  font-size: 12px;
  font-weight: 700;
}

.actions{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.action-btn{
  text-decoration: none;
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.05);
  cursor: pointer;
}

.action-btn:hover{
  background: rgba(255,255,255,.08);
}

.action-btn.ghost{
  background: transparent;
}

/* page */
.wrap{
  max-width: var(--max);
  margin: 0 auto;
  padding: 22px var(--pad) 40px;
}

.hero{
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 18px;
  align-items: stretch;
  margin-bottom: 16px;
}

.hero-left,
.hero-right{
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 18px;
}

.hero-left{
  padding: 22px 22px 20px;
}

.eyebrow{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--brand);
  margin-bottom: 10px;
}

.hero-title{
  margin: 0;
  font-size: clamp(28px, 4.5vw, 42px);
  line-height: 1.02;
  letter-spacing: -0.03em;
  font-weight: 900;
  color: var(--text);
}

.hero-text{
  margin: 12px 0 0;
  max-width: 60ch;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--muted);
}

.hero-meta{
  margin-top: 16px;
  font-size: 12.5px;
  line-height: 1.6;
  font-weight: 600;
  color: var(--muted);
}

.hero-right{
  display: flex;
  align-items: stretch;
}

.stat-card{
  width: 100%;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-label{
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}

.stat-value{
  margin-top: 8px;
  font-size: 38px;
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 900;
  color: var(--text);
}

/* card */
.card{
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 16px;
  overflow: hidden;
}

.state{
  padding: 16px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 13.5px;
  font-weight: 700;
}

.state.error{
  color: rgba(255,140,140,.95);
}

.spinner{
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.18);
  border-top-color: rgba(255,255,255,.76);
  animation: spin .9s linear infinite;
}

@keyframes spin{
  to{ transform: rotate(360deg); }
}

.empty{
  padding: 28px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon{
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--brand);
  background: var(--brand-soft);
  border: 1px solid var(--brand-border);
}

.empty-title{
  margin-top: 14px;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
}

.empty-sub{
  margin-top: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  max-width: 42ch;
}

.list{
  list-style: none;
  margin: 0;
  padding: 0;
}

.row{
  border-top: 1px solid var(--border-soft);
}

.row:first-child{
  border-top: 0;
}

.row-btn{
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border: 0;
  background: transparent;
  transition: background .12s ease;
}

.row-btn:hover{
  background: var(--panel-2);
}

.row-btn:focus-visible{
  outline: 2px solid rgba(140,200,255,.35);
  outline-offset: -2px;
}

.left{
  min-width: 0;
}

.pkg-id{
  font-size: 14px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
}

.ns-link{
  color: var(--link);
  text-decoration: none;
  font-weight: 700;
}

.ns-link:hover{
  text-decoration: underline;
  text-underline-offset: 3px;
}

.slash{
  color: var(--muted-2);
  padding: 0 2px;
  font-weight: 600;
}

.nm{
  color: var(--text);
  font-weight: 800;
}

.row-btn:hover .nm{
  text-decoration: underline;
  text-underline-offset: 3px;
}

.desc{
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  font-weight: 500;
  color: var(--muted);
  max-width: 760px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right{
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.tag{
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  border: 1px solid var(--border);
  background: rgba(0,0,0,.22);
  border-radius: 999px;
  padding: 6px 10px;
}

.repo{
  font-size: 12px;
  font-weight: 700;
  color: var(--link);
  text-decoration: none;
  border: 1px solid var(--link-border);
  background: var(--link-soft);
  border-radius: 999px;
  padding: 6px 10px;
}

.repo:hover{
  background: rgba(140,200,255,.14);
}

/* pager */
.pager{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-top: 1px solid var(--border-soft);
  background: rgba(0,0,0,.14);
}

.pager-mid{
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pager-btn,
.pager-pill{
  border: 1px solid var(--border);
  background: rgba(255,255,255,.05);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.pager-btn:hover:not(:disabled),
.pager-pill:hover:not(:disabled){
  background: rgba(255,255,255,.08);
}

.pager-pill[data-active="true"]{
  background: var(--brand-soft);
  border-color: var(--brand-border);
  color: #c9ffea;
}

.pager-btn:disabled,
.pager-pill:disabled{
  opacity: .45;
  cursor: not-allowed;
}

.foot{
  padding: 12px 14px;
  border-top: 1px solid var(--border-soft);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
}

/* responsive */
@media (max-width: 980px){
  .topbar-inner{
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .actions{
    justify-content: flex-start;
  }

  .hero{
    grid-template-columns: 1fr;
  }

  .hero-right{
    min-height: 120px;
  }
}

@media (max-width: 640px){
  .wrap{
    padding: 16px 14px 28px;
  }

  .hero-left{
    padding: 18px 16px 16px;
  }

  .hero-title{
    font-size: 30px;
  }

  .row-btn{
    padding: 13px 12px;
    align-items: flex-start;
  }

  .right{
    gap: 8px;
  }

  .desc{
    max-width: 100%;
    white-space: normal;
  }

  .pager{
    flex-direction: column;
    align-items: stretch;
  }

  .pager-mid{
    justify-content: flex-start;
  }
}

@media (max-width: 420px){
  .crumbs{
    gap: 6px;
  }

  .actions{
    flex-wrap: wrap;
  }

  .action-btn{
    width: 100%;
    justify-content: center;
    text-align: center;
  }

  .hero-title{
    font-size: 26px;
  }

  .stat-value{
    font-size: 32px;
  }

  .right{
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
