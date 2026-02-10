import fs from "node:fs";
import path from "node:path";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function listJsonFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function main() {
  const root = process.cwd();

  // repo "registry" cloné à côté, exemple:
  // vixcpp.github.io/registry (ou vixcpp/registry)
  // on tente plusieurs chemins
  const candidates = [
    path.join(root, "..", "..", "registry"), // vix-site -> vixcpp.github.io -> registry
    path.join(root, "..", "registry"), // vix-site -> registry
    path.join(root, "registry"), // vix-site -> registry (si copié)
  ];

  let registryRoot = "";
  for (const c of candidates) {
    if (
      fs.existsSync(path.join(c, "registry.json")) &&
      fs.existsSync(path.join(c, "index"))
    ) {
      registryRoot = c;
      break;
    }
  }

  if (!registryRoot) {
    console.error("build_registry_index: registry repo not found.");
    console.error(
      "Expected a folder containing registry.json and index/ near vix-site.",
    );
    process.exit(1);
  }

  const registryMetaPath = path.join(registryRoot, "registry.json");
  const indexDir = path.join(registryRoot, "index");

  const registryMeta = readJson(registryMetaPath);
  const files = listJsonFiles(indexDir);

  const entries = [];
  for (const file of files) {
    try {
      const e = readJson(file);
      entries.push(e);
    } catch {
      // ignore broken entries
    }
  }

  const out = {
    meta: {
      registryId: registryMeta.id || "vixcpp-registry",
      specVersion: registryMeta.specVersion || "1.0.0",
      generatedAt: new Date().toISOString(),
      sourceRepo: registryMeta.homepage || "",
      indexFormat: registryMeta.index?.format || "json-per-package",
      entryCount: entries.length,
    },
    entries,
  };

  const outDir = path.join(root, "public", "registry", "index");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "all.min.json");
  fs.writeFileSync(outPath, JSON.stringify(out), "utf8");

  console.log("registry index built:", outPath, "entries:", entries.length);
}

main();
