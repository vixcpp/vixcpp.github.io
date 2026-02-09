<!-- src/pages/Registry.vue -->
<template>
  <main class="page">
    <section class="hero">
      <div class="hero-left">
        <h1 class="title">Vix Registry</h1>
        <p class="subtitle">
          Search and discover Vix packages. Source-first on GitHub, curated and explored here on
          vixcpp.com.
        </p>

        <div class="search">
          <span class="ico" aria-hidden="true">⌕</span>
          <input
            v-model.trim="q"
            class="in"
            type="search"
            placeholder="Search packages (name, description)…"
            autocomplete="off"
            @keydown.enter.prevent="runSearch()"
          />
          <button class="btn" type="button" :disabled="loading" @click="runSearch()">
            {{ loading ? "Searching…" : "Search" }}
          </button>
        </div>

        <div class="hint">
          <span class="pill">Tip</span>
          Try:
          <button class="chip" @click="setQuery('time')">time</button>
          <button class="chip" @click="setQuery('websocket')">websocket</button>
          <button class="chip" @click="setQuery('crypto')">crypto</button>
          <button class="chip" @click="setQuery('sync')">sync</button>
        </div>
      </div>

      <div class="hero-right">
        <div class="card">
          <div class="card-title">How it works</div>
          <ul class="list">
            <li>We search GitHub repositories under the <b>vixcpp</b> org.</li>
            <li>Packages are source-first, but browsing stays on <b>vixcpp.com</b>.</li>
            <li>Click a result to open the repository on GitHub.</li>
          </ul>

          <div class="note">
            Later we can add a local index + metadata file to make this fully offline-first.
          </div>
        </div>
      </div>
    </section>

    <section class="results">
      <div class="bar">
        <div class="bar-left">
          <div class="kicker">Results</div>
          <div class="meta">
            <span v-if="error" class="err">{{ error }}</span>
            <span v-else-if="loading">Searching…</span>
            <span v-else-if="didSearch">Found {{ results.length }} repositories.</span>
            <span v-else>Search to begin.</span>
          </div>
        </div>

        <div class="bar-right" v-if="didSearch && !loading && results.length">
          <button class="tiny" @click="sortMode = 'best'">Best</button>
          <button class="tiny" @click="sortMode = 'stars'">Stars</button>
          <button class="tiny" @click="sortMode = 'updated'">Updated</button>
        </div>
      </div>

      <div v-if="didSearch && !loading && !results.length && !error" class="empty">
        No packages found. Try a different keyword.
      </div>

      <div class="grid">
        <a
          v-for="repo in sortedResults"
          :key="repo.id"
          class="repo"
          :href="repo.html_url"
          target="_blank"
          rel="noreferrer"
        >
          <div class="top">
            <div class="name">{{ repo.full_name }}</div>
            <div class="badges">
              <span class="b">★ {{ repo.stargazers_count }}</span>
              <span class="b">⑂ {{ repo.forks_count }}</span>
            </div>
          </div>

          <div class="desc">
            {{ repo.description || "No description." }}
          </div>

          <div class="bottom">
            <span class="lang" v-if="repo.language">{{ repo.language }}</span>
            <span class="muted">Updated {{ formatDate(repo.updated_at) }}</span>
          </div>
        </a>
      </div>

      <div class="foot" v-if="didSearch && !loading && results.length">
        <button class="more" :disabled="loadingMore || !canLoadMore" @click="loadMore()">
          {{ loadingMore ? "Loading…" : canLoadMore ? "Load more" : "No more results" }}
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from "vue";

const ORG = "vixcpp";

// State
const q = ref("");
const results = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");
const didSearch = ref(false);
const sortMode = ref("best");

// Pagination
const perPage = 20;
const page = ref(1);
const canLoadMore = ref(true);

function setQuery(v) {
  q.value = v;
  runSearch();
}

function resetSearch() {
  results.value = [];
  error.value = "";
  didSearch.value = false;
  page.value = 1;
  canLoadMore.value = true;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * GitHub search:
 * - Uses public GitHub REST API (no auth).
 * - Rate limits apply (OK for now).
 * - Query searches repos within org:vixcpp
 */
async function fetchRepos({ query, pageNum }) {
  const qq = encodeURIComponent(`${query} org:${ORG} in:name,description`);
  const url = `https://api.github.com/search/repositories?q=${qq}&per_page=${perPage}&page=${pageNum}&sort=best-match`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) {
    // Useful message for rate limit
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (res.status === 403 && remaining === "0") {
      throw new Error("GitHub rate limit reached. Please try again in a minute.");
    }
    throw new Error(`GitHub request failed (${res.status}).`);
  }

  const data = await res.json();
  return data?.items || [];
}

async function runSearch() {
  const query = q.value.trim();
  if (!query) {
    resetSearch();
    return;
  }

  loading.value = true;
  loadingMore.value = false;
  error.value = "";
  didSearch.value = true;
  page.value = 1;
  canLoadMore.value = true;

  try {
    const items = await fetchRepos({ query, pageNum: 1 });
    results.value = items;
    // If less than perPage, likely no more pages
    canLoadMore.value = items.length === perPage;
  } catch (e) {
    results.value = [];
    canLoadMore.value = false;
    error.value = e?.message || "Search failed.";
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (!canLoadMore.value || loading.value || loadingMore.value) return;
  const query = q.value.trim();
  if (!query) return;

  loadingMore.value = true;
  error.value = "";

  try {
    const next = page.value + 1;
    const items = await fetchRepos({ query, pageNum: next });
    results.value = results.value.concat(items);
    page.value = next;
    canLoadMore.value = items.length === perPage;
  } catch (e) {
    canLoadMore.value = false;
    error.value = e?.message || "Load more failed.";
  } finally {
    loadingMore.value = false;
  }
}

const sortedResults = computed(() => {
  const arr = [...results.value];

  if (sortMode.value === "stars") {
    arr.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
  } else if (sortMode.value === "updated") {
    arr.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
  } // best => keep as returned

  return arr;
});
</script>

<style scoped>
.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 1.25rem 1.1rem 3rem;
}

/* Hero */
.hero {
  display: grid;
  grid-template-columns: 1.25fr 0.9fr;
  gap: 1.1rem;
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(45, 212, 191, 0.18);
  background: radial-gradient(circle at 30% 0%, rgba(45, 212, 191, 0.12), transparent 55%),
    linear-gradient(to bottom, rgba(1, 24, 22, 0.45), rgba(2, 6, 23, 0.35));
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
}

.title {
  font-size: 2.1rem;
  letter-spacing: -0.5px;
  margin: 0;
  color: #e5f9f6;
}

.subtitle {
  margin: 0.35rem 0 0.95rem;
  color: rgba(203, 213, 225, 0.9);
  line-height: 1.55;
  max-width: 60ch;
}

.search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.28);
}

.ico {
  color: rgba(203, 213, 225, 0.85);
  font-size: 1.05rem;
  padding-left: 0.2rem;
}

.in {
  flex: 1;
  min-width: 120px;
  background: transparent;
  border: 0;
  outline: none;
  color: #e5e7eb;
  font-size: 0.95rem;
  padding: 0.35rem 0.25rem;
}

.in::placeholder {
  color: rgba(203, 213, 225, 0.65);
}

.btn {
  border: 1px solid rgba(45, 212, 191, 0.35);
  background: rgba(2, 60, 47, 0.85);
  color: #e5f9f6;
  padding: 0.38rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.16s ease, border-color 0.16s ease;
}

.btn:hover {
  transform: translateY(-1px);
  background: rgba(2, 75, 59, 0.92);
  border-color: rgba(45, 212, 191, 0.55);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.hint {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
  color: rgba(203, 213, 225, 0.85);
  font-size: 0.9rem;
}

.pill {
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.3);
  background: rgba(2, 44, 34, 0.55);
  color: #e5f9f6;
  font-size: 0.78rem;
}

.chip {
  border: 1px solid rgba(45, 212, 191, 0.25);
  background: rgba(2, 44, 34, 0.25);
  color: #e5f9f6;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.16s ease, background 0.16s ease;
}

.chip:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.5);
  background: rgba(2, 44, 34, 0.35);
}

/* Right card */
.card {
  height: 100%;
  border-radius: 16px;
  border: 1px solid rgba(45, 212, 191, 0.16);
  background: rgba(2, 6, 23, 0.45);
  padding: 0.9rem 0.9rem;
}

.card-title {
  font-weight: 700;
  color: #e5f9f6;
  margin-bottom: 0.55rem;
}

.list {
  margin: 0;
  padding-left: 1.1rem;
  color: rgba(203, 213, 225, 0.9);
  line-height: 1.6;
  font-size: 0.92rem;
}

.note {
  margin-top: 0.75rem;
  color: rgba(203, 213, 225, 0.72);
  font-size: 0.88rem;
}

/* Results */
.results {
  margin-top: 1.25rem;
}

.bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.2rem 0.1rem 0.65rem;
}

.kicker {
  font-weight: 800;
  letter-spacing: -0.2px;
  color: #e5f9f6;
  font-size: 1.05rem;
}

.meta {
  color: rgba(203, 213, 225, 0.85);
  font-size: 0.92rem;
  margin-top: 0.1rem;
}

.err {
  color: #fca5a5;
}

.bar-right {
  display: flex;
  gap: 0.35rem;
}

.tiny {
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.25);
  color: #e5f9f6;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.82rem;
}

.tiny:hover {
  border-color: rgba(45, 212, 191, 0.45);
}

.empty {
  padding: 1.1rem;
  border-radius: 16px;
  border: 1px solid rgba(45, 212, 191, 0.16);
  background: rgba(2, 6, 23, 0.35);
  color: rgba(203, 213, 225, 0.85);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.repo {
  display: block;
  padding: 0.85rem 0.85rem;
  border-radius: 16px;
  border: 1px solid rgba(45, 212, 191, 0.14);
  background: rgba(2, 6, 23, 0.35);
  transition: transform 0.12s ease, border-color 0.16s ease, background 0.16s ease;
}

.repo:hover {
  transform: translateY(-2px);
  border-color: rgba(45, 212, 191, 0.35);
  background: rgba(2, 6, 23, 0.45);
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.name {
  color: #e5f9f6;
  font-weight: 800;
  letter-spacing: -0.2px;
  font-size: 0.95rem;
}

.badges {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.b {
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.35);
  color: rgba(229, 249, 246, 0.95);
  font-size: 0.78rem;
  white-space: nowrap;
}

.desc {
  margin-top: 0.55rem;
  color: rgba(203, 213, 225, 0.9);
  font-size: 0.9rem;
  line-height: 1.55;
  min-height: 3.1em;
}

.bottom {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}

.lang {
  color: rgba(203, 213, 225, 0.95);
  font-size: 0.85rem;
}

.muted {
  color: rgba(203, 213, 225, 0.72);
  font-size: 0.85rem;
}

.foot {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.more {
  border: 1px solid rgba(45, 212, 191, 0.22);
  background: rgba(2, 44, 34, 0.25);
  color: #e5f9f6;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.16s ease, background 0.16s ease;
}

.more:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.45);
  background: rgba(2, 44, 34, 0.35);
}

.more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 980px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .title {
    font-size: 1.75rem;
  }
}
</style>
