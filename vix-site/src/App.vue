<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
import { findBlogPost } from "./data/blog";

const route = useRoute();
const meta = computed(() => {
  const post =
    route.path.startsWith("/blog/") && findBlogPost(route.params.pathMatch);
  const pages = {
    "/": [
      "Vix.cpp | A runtime for C++ applications",
      "Vix.cpp is a runtime for C++ applications. It provides a coherent way to build, run, and operate C++ software throughout its lifecycle.",
    ],
    "/learn": [
      "Learn Vix.cpp",
      "Learn how Vix.cpp supports C++ application development.",
    ],
    "/community": [
      "Community | Vix.cpp",
      "Connect with the Vix.cpp community.",
    ],
    "/blog": [
      "Blog | Vix.cpp",
      "News, release notes, technical deep dives, and development updates from Vix.cpp.",
    ],
  };
  const [title, description] = post
    ? [`${post.title} | Vix.cpp`, post.description]
    : pages[route.path] || ["Vix.cpp", ""];
  const path = post ? `/blog/${post.path}` : route.path;
  const url = `https://vixcpp.com${path === "/" ? "/" : path}`;
  return {
    title,
    meta: [
      { name: "description", content: description },
      { property: "og:type", content: post ? "article" : "website" },
      { property: "og:site_name", content: "Vix.cpp" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    link: [{ rel: "canonical", href: url }],
  };
});
useHead(meta);
</script>

<template>
  <div class="app-shell">
    <SiteHeader />

    <main class="app-main">
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;

  min-height: 100vh;
}

.app-main {
  flex: 1;
}
</style>
