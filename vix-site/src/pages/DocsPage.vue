<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import DocsSidebarNode from "../components/docs/DocsSidebarNode.vue";
import { docsPages, docsTree, findDocsPage, loadDocsHtml, normalizeDocsPath } from "../data/docs";

const route = useRoute();
const router = useRouter();
const content = ref("");
const path = computed(() => normalizeDocsPath(route.params.pathMatch));
const page = computed(() => findDocsPage(path.value));
const tree = docsTree();
const index = computed(() => docsPages.findIndex((item) => item.path === path.value));
const previous = computed(() => docsPages[index.value - 1]);
const next = computed(() => docsPages[index.value + 1]);
const docsUrl = (item) => `/docs${item.path ? `/${item.path}` : ""}`;

watch(path, async (value) => {
  content.value = page.value ? await loadDocsHtml(value) : "";
  await nextTick();
}, { immediate: true });

function followLink(event) {
  const anchor = event.target.closest("a[href]");
  if (!anchor || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target) return;
  const href = anchor.getAttribute("href");
  if (href?.startsWith("/docs")) { event.preventDefault(); router.push(href); }
}

useHead(() => ({ title: page.value ? `${page.value.title} | Vix.cpp` : "Documentation not found | Vix.cpp", meta: [{ name: "description", content: page.value ? `Vix.cpp documentation: ${page.value.title}.` : "Vix.cpp documentation." }], link: [{ rel: "canonical", href: `https://vixcpp.com${route.path}` }] }));
</script>

<template>
  <section class="docs-page">
    <aside class="docs-sidebar" aria-label="Documentation navigation"><RouterLink class="docs-sidebar__home" to="/docs">Vix.cpp Documentation</RouterLink><nav><ul><DocsSidebarNode v-for="node in tree" :key="node.segment" :node="node" /></ul></nav></aside>
    <article v-if="page" class="docs-content" @click="followLink"><div v-html="content" /><nav class="docs-pagination" aria-label="Documentation pages"><RouterLink v-if="previous" :to="docsUrl(previous)">← {{ previous.title }}</RouterLink><RouterLink v-if="next" :to="docsUrl(next)">{{ next.title }} →</RouterLink></nav></article>
    <article v-else class="docs-content"><h1>Documentation page not found</h1><p>Return to the <RouterLink to="/docs">documentation home</RouterLink>.</p></article>
  </section>
</template>
