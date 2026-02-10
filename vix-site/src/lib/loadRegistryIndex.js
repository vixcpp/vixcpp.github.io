import { getCachedRegistry, setCachedRegistry } from "@/lib/registryCache";

const REGISTRY_URL = "/registry/index/all.min.json";

async function safeFetchJson(url, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      cache: "no-cache",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`http_${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function loadRegistryIndex() {
  // 1) instant: cache d'abord
  const cached = await getCachedRegistry();
  if (cached?.data) {
    // on tente un refresh en parallèle (mais sans bloquer l'UI)
    refreshInBackground(cached.meta?.generatedAt || "");
    return { source: "cache", data: cached.data };
  }

  // 2) sinon: réseau
  const data = await safeFetchJson(REGISTRY_URL, 6000);
  await setCachedRegistry(data.meta || null, data);
  return { source: "network", data };
}

async function refreshInBackground(currentVersion) {
  try {
    const data = await safeFetchJson(REGISTRY_URL, 2500);
    const v = data?.meta?.generatedAt || "";
    if (v && v !== currentVersion) {
      await setCachedRegistry(data.meta || null, data);
    }
  } catch {
    // ignore: réseau instable
  }
}
