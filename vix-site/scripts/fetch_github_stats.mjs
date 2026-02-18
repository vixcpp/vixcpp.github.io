/**
 * scripts/fetch_github_stats.mjs
 *
 * Writes repo stats to:
 * - src/data/github_stats.json (for static import)
 * - public/data/github_stats.json (for runtime fetch)
 */

import fs from "node:fs";
import path from "node:path";
import "dotenv/config";

const OUT_SRC = path.resolve("src/data/github_stats.json");
const OUT_PUBLIC = path.resolve("public/data/github_stats.json");

const REPO = "vixcpp/vix";
const API = `https://api.github.com/repos/${REPO}`;

const GH_TOKEN =
  process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN || "";

console.log("[env] cwd:", process.cwd());
console.log(
  "[env] VITE_GITHUB_TOKEN:",
  process.env.VITE_GITHUB_TOKEN ? "set" : "missing",
);
console.log(
  "[env] GITHUB_TOKEN:",
  process.env.GITHUB_TOKEN ? "set" : "missing",
);

function nowISO() {
  return new Date().toISOString();
}

function ghHeaders() {
  const h = {
    Accept: "application/vnd.github+json",
    "User-Agent": "vix-site-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (GH_TOKEN) h.Authorization = `Bearer ${GH_TOKEN}`;
  return h;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: ghHeaders() });
  if (!res.ok) {
    let extra = "";
    try {
      const j = await res.json();
      if (j?.message) extra = ` (${j.message})`;
    } catch {}
    throw new Error(
      `GitHub API failed: ${res.status} ${res.statusText}${extra}`,
    );
  }
  return res.json();
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

async function main() {
  let payload;

  try {
    const repo = await fetchJson(API);

    payload = {
      repo: REPO,
      fetched_at: nowISO(),
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      open_issues: repo.open_issues_count ?? 0,
      watchers: repo.subscribers_count ?? 0,
      rate_limit: GH_TOKEN ? "auth" : "public",
    };
  } catch (err) {
    payload = {
      repo: REPO,
      fetched_at: nowISO(),
      stars: 0,
      forks: 0,
      open_issues: 0,
      watchers: 0,
      fallback: true,
      rate_limit: GH_TOKEN ? "auth" : "public",
      error: String(err?.message || err),
    };

    // si déjà présent, on ne casse pas le site
    if (fs.existsSync(OUT_SRC) || fs.existsSync(OUT_PUBLIC)) {
      console.warn(
        `[github_stats] fetch failed, keeping existing file: ${payload.error}`,
      );
      return;
    }

    console.warn(
      `[github_stats] fetch failed, writing fallback file: ${payload.error}`,
    );
  }

  writeJson(OUT_SRC, payload);
  writeJson(OUT_PUBLIC, payload);

  console.log("[github_stats] wrote", OUT_SRC);
  console.log("[github_stats] wrote", OUT_PUBLIC);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
