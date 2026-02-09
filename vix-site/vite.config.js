import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),

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
        theme_color: "#0b0e14",
        background_color: "#0b0e14",
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
