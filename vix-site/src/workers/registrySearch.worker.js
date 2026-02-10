let DATA = null;
let VERSION = "";

/* ----------------------------
   helpers (match C++ behavior)
---------------------------- */

function toLower(s) {
  return (s || "").toLowerCase();
}

function containsIcase(hay, needleLower) {
  if (!needleLower) return true;
  return toLower(hay).includes(needleLower);
}

function joinKeywords(entry) {
  const kw = entry?.keywords;
  if (!Array.isArray(kw)) return "";
  return kw.filter((x) => typeof x === "string").join(", ");
}

function latestVersion(entry) {
  if (typeof entry?.latest === "string" && entry.latest) return entry.latest;

  const versions = entry?.versions;
  if (!versions || typeof versions !== "object") return "";

  let best = "";
  for (const v of Object.keys(versions)) {
    if (!best || v > best) best = v;
  }
  return best;
}

function scoreEntry(e, qLower) {
  const ns = e?.namespace || "";
  const name = e?.name || "";
  const id = `${ns}/${name}`;

  let s = 0;

  if (containsIcase(id, qLower)) s += 100;
  if (containsIcase(name, qLower)) s += 60;
  if (containsIcase(ns, qLower)) s += 40;
  if (containsIcase(e?.displayName || "", qLower)) s += 25;
  if (containsIcase(e?.description || "", qLower)) s += 20;

  const kw = joinKeywords(e);
  if (containsIcase(kw, qLower)) s += 15;

  return s;
}

function buildHit(e, score) {
  const ns = e?.namespace || "";
  const name = e?.name || "";
  const id = `${ns}/${name}`;

  const repoUrl = e?.repo && typeof e.repo === "object" ? e.repo.url || "" : "";

  return {
    id,
    namespace: ns,
    name,
    displayName: e?.displayName || name,
    description: e?.description || "",
    repo: repoUrl,
    latest: latestVersion(e),
    score,
  };
}

function compareSemverDesc(a, b) {
  const pa = String(a || "")
    .split("-")[0]
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const pb = String(b || "")
    .split("-")[0]
    .split(".")
    .map((x) => parseInt(x, 10) || 0);

  for (let i = 0; i < 3; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return db - da;
  }

  return String(b || "").localeCompare(String(a || ""));
}

function sortHits(hits, sortMode) {
  if (sortMode === "latest") {
    hits.sort((a, b) => {
      const v = compareSemverDesc(a.latest, b.latest);
      if (v !== 0) return v;
      return a.id.localeCompare(b.id);
    });
    return;
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });
}

function search({ query, limit = 20, offset = 0, sort = "score" } = {}) {
  if (!DATA || !Array.isArray(DATA.entries)) {
    return {
      ok: false,
      error: "registry_not_loaded",
      hits: [],
      version: VERSION,
      total: 0,
    };
  }

  const q = (query || "").trim();
  const qLower = toLower(q);

  const lim = Math.max(1, Math.min(200, Number(limit) || 20));
  const off = Math.max(0, Number(offset) || 0);
  const sortMode = sort === "latest" ? "latest" : "score";

  const hits = [];

  for (const e of DATA.entries) {
    const s = scoreEntry(e, qLower);

    if (s <= 0) continue;

    hits.push(buildHit(e, s));
  }

  sortHits(hits, sortMode);

  return {
    ok: true,
    version: VERSION,
    total: hits.length,
    hits: hits.slice(off, off + lim),
  };
}

self.onmessage = (ev) => {
  const msg = ev.data || {};
  const type = msg.type;

  if (type === "load") {
    DATA = msg.data || null;
    VERSION = DATA?.meta?.generatedAt || "";
    self.postMessage({ type: "loaded", ok: !!DATA, version: VERSION });
    return;
  }

  if (type === "search") {
    const res = search({
      query: msg.query,
      limit: msg.limit,
      offset: msg.offset,
      sort: msg.sort,
    });

    self.postMessage({
      type: "searchResult",
      ...res,
      query: msg.query || "",
      offset: Math.max(0, Number(msg.offset) || 0),
      limit: Math.max(1, Number(msg.limit) || 20),
      sort: msg.sort === "latest" ? "latest" : "score",
    });
    return;
  }

  self.postMessage({ type: "error", error: "unknown_message_type" });
};
