let DATA = null;
let VERSION = "";

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

  if (!qLower) return 0;

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
    score: Number(score) || 0,
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

function browse({ limit = 50, offset = 0 } = {}) {
  if (!DATA || !Array.isArray(DATA.entries)) {
    return {
      ok: false,
      error: "registry_not_loaded",
      hits: [],
      version: VERSION,
      total: 0,
    };
  }

  const lim = Math.max(1, Math.min(200, Number(limit) || 50));
  const off = Math.max(0, Number(offset) || 0);

  const hits = [];

  for (const e of DATA.entries) {
    hits.push(buildHit(e, 0));
  }

  sortHits(hits, "latest");

  return {
    ok: true,
    version: VERSION,
    total: hits.length,
    hits: hits.slice(off, off + lim),
  };
}

function findEntryById(id) {
  if (!DATA || !Array.isArray(DATA.entries)) return null;

  const wanted = String(id || "").trim();
  if (!wanted) return null;

  for (const e of DATA.entries) {
    const ns = e?.namespace || "";
    const name = e?.name || "";
    const cur = `${ns}/${name}`;
    if (cur === wanted) return e;
  }
  return null;
}

function buildStats(entry) {
  const versionsObj =
    entry?.versions && typeof entry.versions === "object"
      ? entry.versions
      : null;
  const versions = versionsObj ? Object.keys(versionsObj) : [];

  const latest = latestVersion(entry);
  const versionsCount = versions.length;

  const hasReadme =
    typeof entry?.readme === "string" && entry.readme.trim().length > 0;
  const hasRepo = !!(
    entry?.repo &&
    typeof entry.repo === "object" &&
    entry.repo.url
  );

  // si ton index a des champs time, on les expose, sinon vide
  const createdAt = entry?.createdAt || "";
  const updatedAt = entry?.updatedAt || entry?.lastUpdatedAt || "";

  return {
    latest,
    versionsCount,
    hasReadme,
    hasRepo,
    createdAt,
    updatedAt,
  };
}

function buildPackagePayload(entry) {
  if (!entry) return null;

  const ns = entry?.namespace || "";
  const name = entry?.name || "";
  const id = `${ns}/${name}`;

  const repoUrl =
    entry?.repo && typeof entry.repo === "object" ? entry.repo.url || "" : "";

  return {
    id,
    namespace: ns,
    name,
    displayName: entry?.displayName || name,
    description: entry?.description || "",
    keywords: Array.isArray(entry?.keywords) ? entry.keywords : [],
    repo: repoUrl,
    homepage: entry?.homepage || "",
    license: entry?.license || "",
    latest: latestVersion(entry),
    stats: buildStats(entry),

    // si tu as un champs "readme" dans l'index
    readme: typeof entry?.readme === "string" ? entry.readme : "",
  };
}

function search({ query, limit = 30, offset = 0, sort = "score" } = {}) {
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

  if (!qLower) {
    return browse({ limit, offset });
  }

  const lim = Math.max(1, Math.min(200, Number(limit) || 30));
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

  if (type === "getPackage") {
    if (!DATA) {
      self.postMessage({
        type: "packageResult",
        ok: false,
        error: "registry_not_loaded",
        version: VERSION,
        id: msg.id || "",
        pkg: null,
      });
      return;
    }

    const id = String(msg.id || "").trim();
    const entry = findEntryById(id);

    if (!entry) {
      self.postMessage({
        type: "packageResult",
        ok: false,
        error: "not_found",
        version: VERSION,
        id,
        pkg: null,
      });
      return;
    }

    self.postMessage({
      type: "packageResult",
      ok: true,
      version: VERSION,
      id,
      pkg: buildPackagePayload(entry),
    });
    return;
  }

  if (type === "search") {
    const rawQuery = (msg.query || "").toString();
    const q = rawQuery.trim();
    const isEmpty = !q;

    // JSR defaults
    const limit = isEmpty ? 50 : 30;
    const sort = isEmpty ? "latest" : "score";

    const res = isEmpty
      ? browse({
          limit: msg.limit ?? limit,
          offset: msg.offset,
        })
      : search({
          query: q,
          limit: msg.limit ?? limit,
          offset: msg.offset,
          sort: msg.sort ?? sort,
        });

    self.postMessage({
      type: "searchResult",
      ...res,
      query: q,
      offset: Math.max(0, Number(msg.offset) || 0),
      limit: Math.max(1, Number(msg.limit ?? limit) || limit),
      sort: (msg.sort ?? sort) === "latest" ? "latest" : "score",
      mode: isEmpty ? "browse" : "search",
    });
    return;
  }

  self.postMessage({ type: "error", error: "unknown_message_type" });
};
