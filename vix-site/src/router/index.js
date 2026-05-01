import { createRouter, createWebHistory } from "vue-router";

import Home from "../pages/Home.vue";
import Install from "../pages/Install.vue";
import Community from "../pages/Community.vue";
import Support from "../pages/Support.vue";
import NotFound from "../pages/NotFound.vue";

import Releases from "../pages/about/Releases.vue";
import FAQ from "../pages/about/FAQ.vue";

import { setSEO } from "../utils/seo";

const DEFAULT_SEO = {
  title: "Vix.cpp",
  description:
    "Vix.cpp is a modern C++ runtime for building fast and reliable applications.",
  path: "/",
  type: "website",
};

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: {
      seo: {
        title: "Vix.cpp",
        description:
          "A modern C++ runtime for building fast and reliable applications.",
        path: "/",
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Vix.cpp",
          applicationCategory: "DeveloperApplication",
          operatingSystem: "Linux, macOS, Windows",
          description:
            "A modern C++ runtime for building fast and reliable applications.",
          url: "https://vixcpp.com/",
          license: "https://opensource.org/licenses/MIT",
          programmingLanguage: "C++",
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
        title: "Install Vix.cpp",
        description:
          "Install Vix.cpp, create your first project, and start building native C++ applications.",
        path: "/install",
        type: "website",
      },
    },
  },

  {
    path: "/about/community",
    name: "community",
    component: Community,
    meta: {
      seo: {
        title: "Community",
        description:
          "Join the Vix.cpp community. Find official links, contribution guidance, good first issues, and project values.",
        path: "/about/community",
        type: "website",
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
          "Read Vix.cpp release notes, version updates, and stability information.",
        path: "/about/releases",
        type: "website",
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
          "Frequently asked questions about Vix.cpp, the runtime, the CLI, the registry, and supported workflows.",
        path: "/about/faq",
        type: "website",
      },
    },
  },

  {
    path: "/support",
    name: "support",
    component: Support,
    meta: {
      seo: {
        title: "Support Vix.cpp",
        description:
          "Support the independent development of Vix.cpp, its registry, documentation, tooling, and long-term runtime work.",
        path: "/support",
        type: "website",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "DonateAction",
          name: "Support Vix.cpp",
          description:
            "Voluntary support for the independent development of Vix.cpp.",
          recipient: {
            "@type": "SoftwareApplication",
            name: "Vix.cpp",
            url: "https://vixcpp.com",
          },
        },
      },
    },
  },

  {
    path: "/community",
    redirect: "/about/community",
  },

  {
    path: "/about/community-guide",
    redirect: "/about/community",
  },

  {
    path: "/about/team",
    redirect: "/about/community",
  },

  {
    path: "/about/documentary",
    redirect: "/about/community",
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
        type: "website",
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
  const seo = to.meta?.seo || DEFAULT_SEO;

  setSEO(seo);

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", "page_view", {
      page_path: to.fullPath,
      page_title: document.title,
    });
  }
});

export default router;
