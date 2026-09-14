import { copyFile, chmod } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const repositoryRoot = resolve(scriptDir, "..", "..");
const publicDir = resolve(scriptDir, "..", "public");

for (const installer of ["install.sh", "install.ps1"]) {
  const source = resolve(publicDir, installer);
  const destination = resolve(repositoryRoot, installer);

  await copyFile(source, destination);

  if (installer.endsWith(".sh")) {
    await chmod(destination, 0o755);
  }
}
