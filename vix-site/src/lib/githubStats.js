const REPO = "vixcpp/vix";
const API = `https://api.github.com/repos/${REPO}`;

const LS_KEY = `vix_github_stats_${REPO}`;
const TTL_MS = 6 * 60 * 60 * 1000;

function isFresh(ts) {
  if (!ts) return false;
  const t = new Date(ts).getTime();
  return Number.isFinite(t) && Date.now() - t < TTL_MS;
}

function readCache() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!isFresh(data?.fetched_at)) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

async function loadBuildStats() {
  try {
    const url = new URL("../data/github_stats.json", import.meta.url);
    const res = await fetch(url);
    if (!res.ok) throw new Error("stats json missing");
    return await res.json();
  } catch {
    return {
      repo: REPO,
      fetched_at: null,
      stars: 0,
      forks: 0,
      open_issues: 0,
      watchers: 0,
      fallback: true,
    };
  }
}

export async function getInitialGithubStats() {
  return readCache() || (await loadBuildStats());
}

export async function refreshGithubStats({ timeoutMs = 1200 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(API, {
      signal: controller.signal,
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!res.ok) return null;

    const repo = await res.json();

    const data = {
      repo: REPO,
      fetched_at: new Date().toISOString(),
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      open_issues: repo.open_issues_count ?? 0,
      watchers: repo.subscribers_count ?? 0,
    };

    writeCache(data);
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
