// scripts/deploy.js
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");

// SPA build output
const spaDist = path.resolve(process.cwd(), "dist");

// VitePress build output
const docsDist = path.resolve(process.cwd(), "docs/.vitepress/dist");

function rmIfExists(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Clean SPA root outputs (keep repo other folders)
rmIfExists(path.join(root, "assets"));
rmIfExists(path.join(root, "index.html"));
rmIfExists(path.join(root, "404.html"));

// Clean docs output folder
rmIfExists(path.join(root, "docs"));

// Copy SPA
copyDir(spaDist, root);

// Copy Docs (VitePress) into /docs
copyDir(docsDist, path.join(root, "docs"));

console.log("✅ Deployed:");
console.log(" - SPA dist/  ->", root);
console.log(" - Docs dist/ ->", path.join(root, "docs"));
