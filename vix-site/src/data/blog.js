import blogIndex from "../generated/blog-index.json";

const contentModules = import.meta.glob("../generated/blog-content/**/*.json", {
  import: "default",
});

export const blogPosts = blogIndex;

function normalizePostPath(path) {
  return (Array.isArray(path) ? path.join("/") : path || "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.md$/, "")
    .replace(/\/index$/, "");
}

export function findBlogPost(path) {
  const normalized = normalizePostPath(path);

  return blogPosts.find((post) => post.path === normalized);
}

export async function loadBlogPostHtml(path) {
  const normalized = normalizePostPath(path);

  if (!normalized) {
    return "";
  }

  const key = `../generated/blog-content/${normalized}.json`;

  const loader = contentModules[key];

  if (!loader) {
    return "";
  }

  const content = await loader();

  return content?.html || "";
}
