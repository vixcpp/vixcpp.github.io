import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function listJsonFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.join(dir, f));
}

function sh(cmd, cwd) {
  return execSync(cmd, { cwd, stdio: "pipe" }).toString("utf8").trim();
}

function ensureRegistryRepo({ root }) {
  const candidates = [
    path.join(root, "..", "..", "registry"),
    path.join(root, "..", "registry"),
    path.join(root, "registry"),
  ];

  for (const c of candidates) {
    if (
      fs.existsSync(path.join(c, "registry.json")) &&
      fs.existsSync(path.join(c, "index")) &&
      fs.existsSync(path.join(c, ".git"))
    ) {
      try {
        sh("git fetch origin --prune", c);
        sh("git checkout main", c);
        sh("git pull --rebase origin main", c);
      } catch {}
      return c;
    }
  }

  const vixClone = path.join(
    process.env.HOME || "",
    ".vix",
    "registry",
    "index",
  );

  if (
    vixClone &&
    fs.existsSync(path.join(vixClone, "registry.json")) &&
    fs.existsSync(path.join(vixClone, "index"))
  ) {
    return vixClone;
  }

  const cacheDir = path.join(root, "tools", ".cache");
  const cloneDir = path.join(cacheDir, "registry");

  fs.mkdirSync(cacheDir, { recursive: true });

  if (!fs.existsSync(path.join(cloneDir, ".git"))) {
    sh(
      "git clone --depth=1 https://github.com/vixcpp/registry.git registry",
      cacheDir,
    );
  } else {
    try {
      sh("git fetch origin --prune", cloneDir);
      sh("git checkout main", cloneDir);
      sh("git pull --rebase origin main", cloneDir);
    } catch {
      // ignore
    }
  }

  if (
    fs.existsSync(path.join(cloneDir, "registry.json")) &&
    fs.existsSync(path.join(cloneDir, "index"))
  ) {
    return cloneDir;
  }

  return "";
}

function main() {
  const root = process.cwd();

  const registryRoot = ensureRegistryRepo({ root });

  if (!registryRoot) {
    console.error("build_registry_index: registry repo not found.");
    console.error(
      "Looked for ../registry, ../../registry, ./registry, ~/.vix/registry/index, or a cached clone.",
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
    } catch {}
  }

  const out = {
    meta: {
      registryId: registryMeta.id || "vixcpp-registry",
      specVersion: registryMeta.specVersion || "1.0.0",
      generatedAt: new Date().toISOString(),
      sourceRepo: registryMeta.homepage || "https://github.com/vixcpp/registry",
      indexFormat: registryMeta.index?.format || "json-per-package",
      entryCount: entries.length,
    },
    entries,
  };

  const outDir = path.join(root, "public", "registry", "index");
  fs.mkdirSync(outDir, { recursive: true });

  const outPath = path.join(outDir, "all.min.json");
  fs.writeFileSync(outPath, JSON.stringify(out), "utf8");

  const has071 = JSON.stringify(out).includes('"0.7.1"');
  console.log(
    "registry index built:",
    outPath,
    "entries:",
    entries.length,
    "has_0.7.1:",
    has071,
  );
  console.log("registry source:", registryRoot);
}

main();
