<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@unhead/vue";

import { findBlogPost } from "../data/blog";

import BlogArticleContent from "../components/blog/BlogArticleContent.vue";

const route = useRoute();

const post = computed(() => findBlogPost(route.params.pathMatch));

const description = computed(
  () => post.value?.description || "Vix.cpp engineering blog.",
);

const canonical = computed(() =>
  post.value
    ? `https://vixcpp.com/blog/${post.value.path}`
    : "https://vixcpp.com/blog",
);

useHead(() => ({
  title: post.value
    ? `${post.value.title} | Vix.cpp`
    : "Article not found | Vix.cpp",

  meta: [
    {
      name: "description",
      content: description.value,
    },
    {
      property: "og:type",
      content: post.value ? "article" : "website",
    },
    {
      property: "og:site_name",
      content: "Vix.cpp",
    },
    {
      property: "og:title",
      content: post.value
        ? `${post.value.title} | Vix.cpp`
        : "Article not found | Vix.cpp",
    },
    {
      property: "og:description",
      content: description.value,
    },
    {
      property: "og:url",
      content: canonical.value,
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "twitter:title",
      content: post.value
        ? `${post.value.title} | Vix.cpp`
        : "Article not found | Vix.cpp",
    },
    {
      name: "twitter:description",
      content: description.value,
    },
  ],

  link: [
    {
      rel: "canonical",
      href: canonical.value,
    },
  ],
}));
</script>

<template>
  <section v-if="post" class="post-page">
    <article>
      <RouterLink class="post-back" to="/blog"> ← Blog </RouterLink>

      <header>
        <h1>
          {{ post.title }}
        </h1>

        <p v-if="post.date || post.author" class="post-meta">
          <span v-if="post.date">
            {{ post.date }}
          </span>

          <span v-if="post.date && post.author"> · </span>

          <span v-if="post.author">
            {{ post.author }}
          </span>
        </p>
      </header>

      <Suspense>
        <BlogArticleContent :key="post.path" :path="post.path" />

        <template #fallback>
          <div class="post-content" />
        </template>
      </Suspense>
    </article>
  </section>

  <section v-else class="post-page post-page--not-found">
    <RouterLink class="post-back" to="/blog"> ← Blog </RouterLink>

    <h1>Article not found</h1>

    <p>The article you are looking for does not exist.</p>
  </section>
</template>

<style scoped>
.post-page {
  padding: clamp(3.5rem, 7vw, 5.5rem) 0;

  background: var(--vix-bg);
}

.post-page article,
.post-page--not-found {
  width: min(100% - 48px, 780px);

  margin-inline: auto;
}

.post-back {
  color: var(--vix-link);

  font-size: 0.9rem;

  text-decoration: none;
}

.post-back:hover {
  color: var(--vix-link-hover);

  text-decoration: underline;
}

.post-page header {
  margin-top: 2rem;

  padding-bottom: 1.5rem;

  border-bottom: 1px solid var(--vix-border);
}

.post-page h1 {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(2.2rem, 4.5vw, 3.7rem);

  line-height: 1.05;

  letter-spacing: -0.05em;
}

.post-meta {
  margin: 0.8rem 0 0;

  color: var(--vix-text-muted);

  font-family: var(--font-mono);

  font-size: 0.78rem;
}

.post-content {
  margin-top: 2rem;

  color: var(--vix-text-secondary);

  font-size: 1rem;

  line-height: 1.78;
}

/* Headings */

.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
  margin: 2.2rem 0 0.8rem;

  color: var(--vix-text);

  line-height: 1.2;
}

.post-content :deep(h2) {
  font-size: 1.65rem;
}

.post-content :deep(h3) {
  font-size: 1.25rem;
}

/* Paragraphs */

.post-content :deep(p) {
  margin: 1rem 0;
}

/* Links */

.post-content :deep(a) {
  color: var(--vix-link);

  text-decoration: none;
}

.post-content :deep(a:hover) {
  color: var(--vix-link-hover);

  text-decoration: underline;
}

/* Lists */

.post-content :deep(ul),
.post-content :deep(ol) {
  margin: 1rem 0;

  padding-left: 1.5rem;
}

.post-content :deep(li + li) {
  margin-top: 0.4rem;
}

/* Shiki code blocks */

.post-content :deep(.blog-code) {
  margin: 1.5rem 0;

  padding: 1rem 1.1rem;

  overflow-x: auto;

  background: var(--vix-bg-soft) !important;

  border: 1px solid var(--vix-border);

  border-radius: 6px;

  font-family: var(--font-mono);

  font-size: 0.88rem;

  line-height: 1.65;
}

.post-content :deep(.blog-code code),
.post-content :deep(.blog-code span) {
  font-family: inherit;
}

.post-content :deep(.blog-code--plain) {
  color: var(--vix-text-secondary);
}

/* Fallback pre blocks */

.post-content :deep(pre) {
  max-width: 100%;

  margin: 1.5rem 0;

  padding: 1rem 1.1rem;

  overflow-x: auto;

  background: var(--vix-bg-soft);

  border: 1px solid var(--vix-border);

  border-radius: 6px;

  font-family: var(--font-mono);

  font-size: 0.88rem;

  line-height: 1.65;
}

.post-content :deep(pre code) {
  padding: 0;

  background: transparent;

  border: 0;

  font-family: var(--font-mono);
}

/* Inline code */

.post-content :deep(code:not(pre code)) {
  padding: 0.15em 0.35em;

  background: rgba(255, 255, 255, 0.04);

  border: 1px solid var(--vix-border);

  border-radius: 4px;

  color: var(--vix-text);

  font-family: var(--font-mono);

  font-size: 0.9em;
}

/* Blockquotes */

.post-content :deep(blockquote) {
  margin: 1.5rem 0;

  padding-left: 1rem;

  color: var(--vix-text-secondary);

  border-left: 2px solid var(--vix-green);
}

/* Images */

.post-content :deep(img) {
  display: block;

  max-width: 100%;

  height: auto;

  margin: 1.5rem 0;
}

/* Tables */

.post-content :deep(table) {
  display: block;

  max-width: 100%;

  margin: 1.5rem 0;

  overflow-x: auto;

  border-collapse: collapse;
}

.post-content :deep(th),
.post-content :deep(td) {
  padding: 0.6rem 0.75rem;

  border: 1px solid var(--vix-border);
}

/* Not found */

.post-page--not-found p {
  color: var(--vix-text-secondary);

  line-height: 1.7;
}

/* Mobile */

@media (max-width: 600px) {
  .post-page article,
  .post-page--not-found {
    width: min(100% - 32px, 780px);
  }
}
</style>
