import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/Home.vue";
import Install from "../pages/Install.vue";
import Examples from "../pages/Examples.vue";
import Community from "../pages/Community.vue";
import Blog from "../pages/Blog.vue";
import Post from "../pages/Post.vue";
import NotFound from "../pages/NotFound.vue";

import CommunityGuide from "../pages/about/CommunityGuide.vue";
import Releases from "../pages/about/Releases.vue";
import Team from "../pages/about/Team.vue";
import FAQ from "../pages/about/FAQ.vue";
import Documentary from "../pages/about/Documentary.vue";

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
    path: "/docs/examples",
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
    path: "/about/community-guide",
    name: "community_guide",
    component: CommunityGuide,
    meta: {
      seo: {
        title: "Community Guide",
        description:
          "How to contribute to Vix.cpp: rules, PR structure, examples, and review expectations.",
        path: "/about/community-guide",
      },
    },
  },
  {
    path: "/about/releases",
    name: "releases",
    component: Releases,
    meta: {
      seo: {
        title: "Releases",
        description:
          "Release policy and versioning notes for Vix.cpp (CLI, modules, stability guarantees).",
        path: "/about/releases",
      },
    },
  },
  {
    path: "/about/team",
    name: "team",
    component: Team,
    meta: {
      seo: {
        title: "Team",
        description:
          "People behind Vix.cpp and how to get in touch for collaboration.",
        path: "/about/team",
      },
    },
  },
  {
    path: "/about/faq",
    name: "faq",
    component: FAQ,
    meta: {
      seo: {
        title: "FAQ",
        description:
          "Frequently asked questions about Vix.cpp: scope, use cases, registry, and platform support.",
        path: "/about/faq",
      },
    },
  },
  {
    path: "/about/documentary",
    name: "documentary",
    component: Documentary,
    meta: {
      seo: {
        title: "The Documentary",
        description:
          "The story behind Vix.cpp: why it exists, what it solves, and what’s next.",
        path: "/about/documentary",
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

router.afterEach((to) => {
  const seo = to.meta?.seo;

  if (!seo) {
    setSEO({ title: "Vix.cpp", description: "Modern C++ backend runtime." });
    return;
  }

  setSEO(seo);
});

export default router;
