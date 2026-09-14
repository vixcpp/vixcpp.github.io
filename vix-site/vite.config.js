import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    {
      name: "vix-blog-rss",
      generateBundle() {
        const root = fileURLToPath(
          new URL("./src/content/blog/", import.meta.url),
        );
        const files = [];
        const walk = (directory) =>
          readdirSync(directory, { withFileTypes: true }).forEach((entry) =>
            entry.isDirectory()
              ? walk(join(directory, entry.name))
              : entry.name.endsWith(".md") &&
                files.push(join(directory, entry.name)),
          );
        const escape = (value) =>
          value
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        walk(root);
        const posts = files
          .map((file) => {
            const source = readFileSync(file, "utf8");
            const field = (name) =>
              source.match(
                new RegExp(`^${name}:\\s*["']?(.*?)["']?\\s*$`, "m"),
              )?.[1] || "";
            const path = relative(root, file)
              .replace(/\.md$/, "")
              .replace(/\/index$/, "");
            return {
              path,
              title:
                field("title") || source.match(/^#\\s+(.+)$/m)?.[1] || path,
              description: field("description"),
              date: field("date"),
            };
          })
          .filter((post) => post.path && post.date)
          .sort((a, b) => b.date.localeCompare(a.date));
        const allPosts = files
          .map((file) => {
            const source = readFileSync(file, "utf8");
            return {
              path: relative(root, file)
                .replace(/\.md$/, "")
                .replace(/\/index$/, ""),
              date: source.match(/^date:\s*(.+)$/m)?.[1] || "",
            };
          })
          .filter((post) => post.path);
        const items = posts
          .map(
            (post) =>
              `<item><title>${escape(post.title)}</title><link>https://vixcpp.com/blog/${post.path}</link><guid>https://vixcpp.com/blog/${post.path}</guid><description>${escape(post.description)}</description><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate></item>`,
          )
          .join("");
        this.emitFile({
          type: "asset",
          fileName: "blog/rss.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Vix.cpp Blog</title><link>https://vixcpp.com/blog</link><description>News, technical deep dives, release notes, and development updates from the Vix.cpp project.</description><language>en</language>${items}</channel></rss>`,
        });
        const urls = [
          "/",
          "/learn",
          "/community",
          "/blog",
          ...allPosts.map((post) => `/blog/${post.path}`),
        ]
          .map(
            (path) =>
              `<url><loc>https://vixcpp.com${path}</loc>${allPosts.find((post) => `/blog/${post.path}` === path)?.date ? `<lastmod>${allPosts.find((post) => `/blog/${post.path}` === path).date}</lastmod>` : ""}</url>`,
          )
          .join("");
        this.emitFile({
          type: "asset",
          fileName: "sitemap.xml",
          source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
        });
        this.emitFile({
          type: "asset",
          fileName: "robots.txt",
          source:
            "User-agent: *\nAllow: /\n\nSitemap: https://vixcpp.com/sitemap.xml\n",
        });
      },
    },

    // PWA
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "assets/pwa/apple-touch-icon.png",
        "assets/pwa/icon-192.png",
        "assets/pwa/icon-512.png",
        "assets/pwa/icon-512-maskable.png",
      ],
      manifest: {
        id: "/",
        name: "Vix.cpp",
        short_name: "Vix.cpp",
        lang: "en",
        categories: ["developer", "productivity", "utilities"],
        description:
          "Modern C++ backend runtime for offline-first, P2P, and high-performance applications.",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/assets/pwa/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/assets/pwa/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/assets/pwa/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/docs(\/|$)/],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2,json}"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "vix-images",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "vix-static",
            },
          },
        ],
      },
    }),
  ],

  base: "/",

  ssgOptions: {
    dirStyle: "nested",
  },

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
