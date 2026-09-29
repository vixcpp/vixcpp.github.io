import docsIndex from "../generated/docs-index.json";

const contentModules = import.meta.glob("../generated/docs-content/**/*.json", { import: "default" });

export const docsPages = docsIndex;

export function normalizeDocsPath(path) {
  return (Array.isArray(path) ? path.join("/") : path || "").replace(/^\/+|\/+$/g, "").replace(/\.md$/, "").replace(/\/index$/, "");
}

export function findDocsPage(path) {
  return docsPages.find((page) => page.path === normalizeDocsPath(path));
}

export async function loadDocsHtml(path) {
  const normalized = normalizeDocsPath(path);
  const loader = contentModules[`../generated/docs-content/${normalized || "index"}.json`];
  return loader ? (await loader()).html || "" : "";
}

export function docsTree() {
  const root = { children: [] };
  for (const page of docsPages) {
    let node = root;
    const parts = page.path.split("/").filter(Boolean);
    for (const part of parts) {
      node.children ||= [];
      node = node.children.find((child) => child.segment === part) || (() => {
        const child = { segment: part, children: [] };
        node.children.push(child);
        return child;
      })();
    }
    node.page = page;
  }
  return root.children;
}
