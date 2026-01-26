import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/Home.vue";
import Install from "../pages/Install.vue";
import Examples from "../pages/Examples.vue";
import Community from "../pages/Community.vue";
import Blog from "../pages/Blog.vue";
import Post from "../pages/Post.vue";
import NotFound from "../pages/NotFound.vue";

import { setSEO } from "../utils/seo";

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: {
      seo: {
        title: "Vix.cpp — Modern C++ backend runtime",
        description:
          "Vix.cpp is a modern C++ backend runtime focused on performance, clean DX, HTTP/WebSocket, middleware, and a practical registry workflow.",
        path: "/",
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Vix.cpp",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Linux, macOS, Windows",
          description:
            "Vix.cpp is a modern C++ backend runtime focused on performance, clean DX, HTTP/WebSocket, middleware, and a practical registry workflow.",
          url: "https://vixcpp.com/",
        },
      },
    },
  },

  {
    path: "/install",
    name: "install",
    component: Install,
    meta: {
      seo: {
        title: "Install",
        description:
          "Install Vix.cpp in minutes. Verify, update, and uninstall cleanly.",
        path: "/install",
      },
    },
  },

  {
    path: "/examples",
    name: "examples",
    component: Examples,
    meta: {
      seo: {
        title: "Examples",
        description:
          "Copy/paste ready Vix.cpp examples: HTTP, middleware, JSON logs, WebSocket, registry workflow.",
        path: "/examples",
      },
    },
  },

  {
    path: "/community",
    name: "community",
    component: Community,
    meta: {
      seo: {
        title: "Community",
        description:
          "Contribute to Vix.cpp. Issues, PR guidelines, and good first contributions.",
        path: "/community",
      },
    },
  },

  // Optional blog
  {
    path: "/blog",
    name: "blog",
    component: Blog,
    meta: {
      seo: {
        title: "Blog",
        description:
          "Short, concrete updates about Vix.cpp: performance, DX, middleware, and the registry workflow.",
        path: "/blog",
      },
    },
  },

  // Post: SEO dynamique (slug)
  {
    path: "/blog/:slug",
    name: "post",
    component: Post,
    props: true,
    meta: {
      seo: {
        title: "Post",
        description: "Vix.cpp blog post.",
        path: "/blog",
      },
    },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "notfound",
    component: NotFound,
    meta: {
      seo: {
        title: "404",
        description: "Page not found.",
        path: "/404",
      },
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});

// ✅ Global SEO hook (single source of truth)
router.afterEach((to) => {
  const seo = to.meta?.seo;

  // Fallback minimal
  if (!seo) {
    setSEO({ title: "Vix.cpp", description: "Modern C++ backend runtime." });
    return;
  }

  // If you want dynamic SEO for posts later, you can override here.
  // For now we keep a safe default.
  setSEO(seo);
});

export default router;
