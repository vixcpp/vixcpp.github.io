import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.cwd(), "..");
const dist = path.resolve(process.cwd(), "dist");

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

rmIfExists(path.join(root, "assets"));
rmIfExists(path.join(root, "index.html"));
rmIfExists(path.join(root, "404.html"));

copyDir(dist, root);

console.log("✅ Deployed dist/ to repo root:", root);
