import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import { createHighlighter } from "shiki";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = join(root, "src", "content", "docs");
const generatedRoot = join(root, "src", "generated");
const contentRoot = join(generatedRoot, "docs-content");
const indexFile = join(generatedRoot, "docs-index.json");
const languages = ["cpp", "c", "bash", "cmake", "json", "yaml", "javascript", "typescript", "html", "css", "markdown", "powershell", "toml", "ini", "sql", "xml", "nginx", "dockerfile", "makefile", "python", "vue", "http"];
const highlighter = await createHighlighter({ themes: ["github-dark"], langs: languages });
const loadedLanguages = new Set(highlighter.getLoadedLanguages());
const aliases = { cc: "cpp", cxx: "cpp", sh: "bash", shell: "bash", console: "bash", js: "javascript", ts: "typescript", yml: "yaml", md: "markdown", text: "text", plaintext: "text", txt: "text", dotenv: "ini", properties: "ini" };

function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : entry.name.endsWith(".md") ? [file] : [];
  });
}

function pathFor(file) {
  const path = relative(docsRoot, file).replaceAll("\\", "/").replace(/\.md$/, "");
  return path === "index" ? "" : path.replace(/\/index$/, "");
}

function titleFor(source, path) {
  return source.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || source.match(/^#\s+(.+)$/m)?.[1]?.replace(/[`*_]/g, "") || path.split("/").at(-1).replace(/[-_]/g, " ") || "Vix.cpp Documentation";
}

function sectionTitle(path) {
  const known = { api: "API", cli: "CLI", sdks: "SDKs", "app-modules": "Application Modules" };
  return known[path] || path.split("/").at(-1).replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function resolveDocPath(href, currentPath, paths) {
  const [target, hash = ""] = href.split("#");
  if (!target || target.startsWith("mailto:") || /^(https?:)?\/\//.test(target)) return href;
  if (target === "/vixcpp-documentation.pdf" || target === "/vixcpp-documentation-fr.pdf") return `/docs${target}`;
  let candidate;
  if (target.startsWith("/")) candidate = target.replace(/^\/+|\/+$/g, "");
  else {
    const base = currentPath.split("/").slice(0, -1);
    candidate = [...base, ...target.split("/")].reduce((parts, part) => {
      if (!part || part === ".") return parts;
      if (part === "..") { parts.pop(); return parts; }
      parts.push(part.replace(/\.md$/, ""));
      return parts;
    }, []).join("/").replace(/\/index$/, "");
  }
  candidate = candidate.replace(/\.md$/, "").replace(/\/index$/, "");
  return paths.has(candidate) ? `/docs${candidate ? `/${candidate}` : ""}${hash ? `#${hash}` : ""}` : href;
}

function normalizeAdmonitions(source) {
  return source.replace(/^:::\s*(warning|tip|danger|info)(?:\s+(.+))?\n([\s\S]*?)^:::\s*$/gm, (_, kind, title, body) =>
    `<aside class="docs-callout docs-callout--${kind}"><strong>${title || kind}</strong>\n\n${body.trim()}</aside>`);
}

const files = walk(docsRoot);
const records = files.map((file) => ({ file, path: pathFor(file), source: readFileSync(file, "utf8") }));
const folders = new Set();
for (const record of records) {
  const parts = record.path.split("/").filter(Boolean);
  for (let length = 1; length < parts.length; length += 1) folders.add(parts.slice(0, length).join("/"));
}
for (const folder of folders) {
  if (!records.some((record) => record.path === folder)) records.push({ path: folder, virtual: true, title: sectionTitle(folder) });
}
const paths = new Set(records.map((record) => record.path));
const renderer = new marked.Renderer();
renderer.code = ({ text, lang = "" }) => {
  const language = aliases[lang.trim().toLowerCase().split(/\s+/)[0]] || lang.trim().toLowerCase().split(/\s+/)[0];
  if (!language || language === "text" || !loadedLanguages.has(language)) return `<pre class="docs-code docs-code--plain"><code>${escapeHtml(text)}</code></pre>`;
  return highlighter.codeToHtml(text, { lang: language, theme: "github-dark" }).replace('<pre class="shiki', '<pre class="docs-code shiki');
};
renderer.link = ({ href, title, text }) => `<a href="${escapeHtml(resolveDocPath(href, renderer.currentPath, paths))}"${title ? ` title="${escapeHtml(title)}"` : ""}>${text}</a>`;
marked.use({ renderer });

rmSync(contentRoot, { recursive: true, force: true });
mkdirSync(contentRoot, { recursive: true });
const pages = records.map((record) => {
  renderer.currentPath = record.path;
  const children = records
    .filter((candidate) => candidate.path && candidate.path.startsWith(record.path ? `${record.path}/` : "") && candidate.path.split("/").length === (record.path ? record.path.split("/").length + 1 : 1))
    .sort((a, b) => a.path.localeCompare(b.path));
  const page = { path: record.path, title: record.path ? (record.title || titleFor(record.source, record.path)) : "Vix.cpp Documentation" };
  const html = record.virtual || !record.path
    ? `<h1>${page.title}</h1><p>Browse the Vix.cpp documentation.</p><ul>${children.map((child) => `<li><a href="/docs/${child.path}">${child.title || titleFor(child.source, child.path)}</a></li>`).join("")}</ul>`
    : marked.parse(normalizeAdmonitions(record.source), { async: false });
  const output = join(contentRoot, `${record.path || "index"}.json`);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify({ html })}\n`);
  return page;
}).sort((a, b) => a.path.localeCompare(b.path));
mkdirSync(generatedRoot, { recursive: true });
writeFileSync(indexFile, `${JSON.stringify(pages, null, 2)}\n`);
console.log(`Generated ${pages.length} documentation pages with build-time syntax highlighting.`);
