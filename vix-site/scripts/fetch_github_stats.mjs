import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("src/data/github_stats.json");
const REPO = "vixcpp/vix";
const API = `https://api.github.com/repos/${REPO}`;

function nowISO() {
  return new Date().toISOString();
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok)
    throw new Error(`GitHub API failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  const token = process.env.GITHUB_TOKEN || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "vix-site-build",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  let payload;
  try {
    const repo = await fetchJson(API, headers);

    payload = {
      repo: REPO,
      fetched_at: nowISO(),
      stars: repo.stargazers_count ?? 0,
      forks: repo.forks_count ?? 0,
      open_issues: repo.open_issues_count ?? 0,
      watchers: repo.subscribers_count ?? 0,
    };
  } catch (err) {
    // Fallback: si le build n'a pas accès au net, on conserve l'ancien fichier si présent
    if (fs.existsSync(OUT)) {
      console.warn(
        `[github_stats] fetch failed, keeping existing file: ${err.message}`,
      );
      return;
    }

    // Dernier recours: fichier minimal
    console.warn(
      `[github_stats] fetch failed, writing fallback file: ${err.message}`,
    );
    payload = {
      repo: REPO,
      fetched_at: nowISO(),
      stars: 0,
      forks: 0,
      open_issues: 0,
      watchers: 0,
      fallback: true,
    };
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log(`[github_stats] wrote ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
