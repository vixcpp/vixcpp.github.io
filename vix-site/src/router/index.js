import { createRouter, createWebHistory } from "vue-router";

import HomePage from "@/pages/HomePage.vue";
import InstallPage from "@/pages/InstallPage.vue";
import SdksPage from "@/pages/SdksPage.vue";
import RegistryPage from "@/pages/RegistryPage.vue";
import EcosystemPage from "@/pages/EcosystemPage.vue";
import PicoPage from "@/pages/PicoPage.vue";
import AboutPage from "@/pages/AboutPage.vue";
import SecurityPage from "@/pages/SecurityPage.vue";
import ReleasesPage from "@/pages/ReleasesPage.vue";

import WhatIsVixPage from "@/pages/seo/WhatIsVixPage.vue";
import WhyVixPage from "@/pages/seo/WhyVixPage.vue";
import VixAndCmakePage from "@/pages/seo/VixAndCmakePage.vue";
import SdkProfilesPage from "@/pages/seo/SdkProfilesPage.vue";
import VixRegistryPage from "@/pages/seo/VixRegistryPage.vue";

import NotFoundPage from "@/pages/NotFoundPage.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
    meta: {
      title: "Vix.cpp — A modern application workflow for native C++",
      description:
        "Vix.cpp is a modern C++ runtime and developer toolkit for building, running, testing, packaging, and shipping real native C++ applications.",
    },
  },

  {
    path: "/install",
    name: "install",
    component: InstallPage,
    meta: {
      title: "Install Vix.cpp",
      description:
        "Install the Vix.cpp CLI and SDK profiles for native C++ application development on Linux, macOS, and Windows.",
    },
  },
  {
    path: "/sdks",
    name: "sdks",
    component: SdksPage,
    meta: {
      title: "Vix.cpp SDK Profiles",
      description:
        "Vix.cpp SDK profiles let native C++ projects install the runtime layer they need by application domain.",
    },
  },
  {
    path: "/registry",
    name: "registry",
    component: RegistryPage,
    meta: {
      title: "Vix Registry — C++ packages for Vix.cpp projects",
      description:
        "Discover and use reusable C++ packages for Vix.cpp projects through the Vix registry workflow.",
    },
  },
  {
    path: "/ecosystem",
    name: "ecosystem",
    component: EcosystemPage,
    meta: {
      title: "Vix.cpp Ecosystem",
      description:
        "Explore Rix, Pico, Cnerium, Kordex, and the projects built around the Vix.cpp native C++ foundation.",
    },
  },
  {
    path: "/pico",
    name: "pico",
    component: PicoPage,
    meta: {
      title: "Pico — Real application validation for Vix.cpp",
      description:
        "Pico is a real application built with Vix.cpp to validate the runtime, workflow, diagnostics, and application foundations.",
    },
  },
  {
    path: "/about",
    name: "about",
    component: AboutPage,
    meta: {
      title: "About Vix.cpp",
      description:
        "Vix.cpp is maintained by Softadastra as part of its mission to build tools for modern C++ development.",
    },
  },
  {
    path: "/security",
    name: "security",
    component: SecurityPage,
    meta: {
      title: "Vix.cpp Security",
      description:
        "Security, release integrity, checksums, signatures, and responsible reporting for Vix.cpp.",
    },
  },
  {
    path: "/releases",
    name: "releases",
    component: ReleasesPage,
    meta: {
      title: "Vix.cpp Releases",
      description:
        "Native CLI releases, SDK profiles, changelog, and release direction for Vix.cpp.",
    },
  },

  {
    path: "/what-is-vix",
    name: "what-is-vix",
    component: WhatIsVixPage,
    meta: {
      title: "What is Vix.cpp?",
      description:
        "Vix.cpp is a modern application workflow, runtime, CLI, SDK, and registry foundation for native C++ projects.",
    },
  },
  {
    path: "/why-vix",
    name: "why-vix",
    component: WhyVixPage,
    meta: {
      title: "Why Vix.cpp?",
      description:
        "Vix.cpp exists because C++ applications need more than compilation: workflow, diagnostics, tests, packaging, registry, and release discipline.",
    },
  },
  {
    path: "/vix-and-cmake",
    name: "vix-and-cmake",
    component: VixAndCmakePage,
    meta: {
      title: "Vix.cpp and CMake",
      description:
        "Vix.cpp works with CMake and native C++ build tools instead of replacing them.",
    },
  },
  {
    path: "/sdk-profiles",
    name: "sdk-profiles",
    component: SdkProfilesPage,
    meta: {
      title: "What are Vix SDK profiles?",
      description:
        "Vix SDK profiles install the native development layer needed for specific C++ application workflows.",
    },
  },
  {
    path: "/vix-registry",
    name: "vix-registry",
    component: VixRegistryPage,
    meta: {
      title: "What is the Vix Registry?",
      description:
        "The Vix Registry is the package workflow for discovering, adding, installing, updating, and publishing reusable C++ packages.",
    },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
    meta: {
      title: "Page not found — Vix.cpp",
      description: "The requested Vix.cpp page could not be found.",
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 88,
        behavior: "smooth",
      };
    }

    return {
      top: 0,
      behavior: "smooth",
    };
  },
});

router.afterEach((to) => {
  const title = to.meta?.title || "Vix.cpp";
  const description =
    to.meta?.description ||
    "Vix.cpp is a modern application workflow for native C++.";

  document.title = title;

  let metaDescription = document.querySelector('meta[name="description"]');

  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    document.head.appendChild(metaDescription);
  }

  metaDescription.setAttribute("content", description);
});

export default router;
