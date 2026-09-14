import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";

import { dirname, join, relative, resolve } from "node:path";

import { fileURLToPath } from "node:url";

import { marked } from "marked";
import { createHighlighter } from "shiki";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const blogRoot = join(projectRoot, "src", "content", "blog");

const generatedRoot = join(projectRoot, "src", "generated");

const contentRoot = join(generatedRoot, "blog-content");

const indexFile = join(generatedRoot, "blog-index.json");

const languages = [
  "cpp",
  "c",
  "bash",
  "cmake",
  "json",
  "yaml",
  "javascript",
  "typescript",
  "html",
  "css",
  "markdown",
];

const highlighter = await createHighlighter({
  themes: ["github-dark"],
  langs: languages,
});

const aliases = {
  cc: "cpp",
  cxx: "cpp",

  sh: "bash",
  shell: "bash",
  console: "bash",

  js: "javascript",
  jsx: "javascript",

  ts: "typescript",
  tsx: "typescript",

  yml: "yaml",

  md: "markdown",

  txt: "text",
  plaintext: "text",
};

function normalizeLanguage(language = "") {
  const value = language.trim().toLowerCase().split(/\s+/)[0];

  return aliases[value] || value;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  const fields = {};

  if (match) {
    for (const line of match[1].split("\n")) {
      const entry = line.match(/^([\w-]+):\s*["']?(.*?)["']?\s*$/);

      if (entry) {
        fields[entry[1]] = entry[2];
      }
    }
  }

  return {
    fields,

    body: source.slice(match ? match[0].length : 0),
  };
}

function titleFromPath(path) {
  return path
    .split("/")
    .at(-1)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePath(file) {
  const path = relative(blogRoot, file)
    .replaceAll("\\", "/")
    .replace(/\.md$/, "");

  return path === "index" ? "" : path.replace(/\/index$/, "");
}

function normalizeLinks(markdown, path) {
  const base = path.split("/").slice(0, -1);

  return markdown
    .replace(/https?:\/\/blog\.vixcpp\.com\/posts\//g, "/blog/")
    .replace(/https?:\/\/blog\.vixcpp\.com\/?/g, "/blog")
    .replace(/\]\(\/posts\//g, "](/blog/")
    .replace(/\]\((\.\.?\/[^)#]+)\.md(#[^)]+)?\)/g, (_, target, hash = "") => {
      const parts = [...base, ...target.split("/")];

      const resolved = [];

      for (const part of parts) {
        if (!part || part === ".") {
          continue;
        }

        if (part === "..") {
          resolved.pop();
          continue;
        }

        resolved.push(part);
      }

      const destination = resolved.join("/").replace(/\/index$/, "");

      return `](/blog/${destination}${hash})`;
    });
}

function collectMarkdownFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, {
    withFileTypes: true,
  })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(path));

      continue;
    }

    if (entry.name.endsWith(".md")) {
      files.push(path);
    }
  }

  return files;
}

const loadedLanguages = new Set(highlighter.getLoadedLanguages());

const renderer = new marked.Renderer();

renderer.code = ({ text, lang }) => {
  const language = normalizeLanguage(lang);

  if (!language || language === "text" || !loadedLanguages.has(language)) {
    return [
      '<pre class="blog-code blog-code--plain">',
      `<code>${escapeHtml(text)}</code>`,
      "</pre>",
    ].join("");
  }

  const highlighted = highlighter.codeToHtml(text, {
    lang: language,
    theme: "github-dark",
  });

  return highlighted.replace(
    '<pre class="shiki',
    '<pre class="blog-code shiki',
  );
};

marked.use({
  renderer,
});

/*
 * Remove stale generated Blog data first.
 */
rmSync(contentRoot, {
  recursive: true,
  force: true,
});

mkdirSync(contentRoot, {
  recursive: true,
});

const posts = [];

for (const file of collectMarkdownFiles(blogRoot)) {
  const path = normalizePath(file);

  if (!path) {
    continue;
  }

  const source = readFileSync(file, "utf8");

  const { fields, body } = parseFrontmatter(source);

  const heading = body.match(/^#\s+(.+)$/m)?.[1];

  const normalizedBody = normalizeLinks(body, path);

  const html = marked.parse(normalizedBody, {
    async: false,
  });

  posts.push({
    path,

    title: fields.title || heading || titleFromPath(path),

    description: fields.description || "",

    date: fields.date || "",

    author: fields.author || "",
  });

  const outputFile = join(contentRoot, `${path}.json`);

  mkdirSync(dirname(outputFile), {
    recursive: true,
  });

  writeFileSync(outputFile, `${JSON.stringify({ html })}\n`, "utf8");
}

posts.sort(
  (a, b) =>
    (b.date || "").localeCompare(a.date || "") || a.path.localeCompare(b.path),
);

mkdirSync(generatedRoot, {
  recursive: true,
});

writeFileSync(indexFile, `${JSON.stringify(posts, null, 2)}\n`, "utf8");

console.log(
  `Generated ${posts.length} Blog posts with build-time syntax highlighting.`,
);
