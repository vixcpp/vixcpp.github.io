const DB_NAME = "vix_registry_cache";
const DB_VERSION = 1;

const STORE_META = "meta";
const STORE_BLOBS = "blobs";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function txPut(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

export async function getCachedRegistry() {
  const db = await openDb();
  const tx = db.transaction([STORE_META, STORE_BLOBS], "readonly");
  const metaStore = tx.objectStore(STORE_META);
  const blobStore = tx.objectStore(STORE_BLOBS);

  const meta = await txGet(metaStore, "registry_meta");
  const blob = await txGet(blobStore, "registry_all_json");

  db.close();

  if (!meta || !blob || !blob.json) return null;

  return {
    meta: meta.value || null,
    data: blob.json,
  };
}

export async function setCachedRegistry(meta, json) {
  const db = await openDb();
  const tx = db.transaction([STORE_META, STORE_BLOBS], "readwrite");
  const metaStore = tx.objectStore(STORE_META);
  const blobStore = tx.objectStore(STORE_BLOBS);

  await txPut(metaStore, { key: "registry_meta", value: meta });
  await txPut(blobStore, { key: "registry_all_json", json });

  db.close();
  return true;
}
