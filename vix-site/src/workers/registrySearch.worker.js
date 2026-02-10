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

// score_entry identique au C++
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

function search(query, limit = 20) {
  if (!DATA || !Array.isArray(DATA.entries)) {
    return {
      ok: false,
      error: "registry_not_loaded",
      hits: [],
      version: VERSION,
    };
  }

  const q = (query || "").trim();
  const qLower = toLower(q);

  if (!q) {
    return { ok: true, hits: [], version: VERSION, total: 0 };
  }

  const hits = [];

  for (const e of DATA.entries) {
    const s = scoreEntry(e, qLower);
    if (s <= 0) continue;
    hits.push(buildHit(e, s));
  }

  hits.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  return {
    ok: true,
    version: VERSION,
    total: hits.length,
    hits: hits.slice(0, Math.max(0, limit)),
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
    const res = search(msg.query, msg.limit);
    self.postMessage({ type: "searchResult", ...res, query: msg.query || "" });
    return;
  }

  self.postMessage({ type: "error", error: "unknown_message_type" });
};
