<script setup>
import { useHead } from "@unhead/vue";

import { blogPosts } from "../data/blog";

const description =
  "News, release notes, technical deep dives, and development updates from Vix.cpp.";

const featuredPost = blogPosts[0];
const latestPosts = blogPosts.slice(1);

useHead({
  title: "Blog | Vix.cpp",

  meta: [
    {
      name: "description",
      content: description,
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Vix.cpp",
    },
    {
      property: "og:title",
      content: "Blog | Vix.cpp",
    },
    {
      property: "og:description",
      content: description,
    },
    {
      property: "og:url",
      content: "https://vixcpp.com/blog",
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "twitter:title",
      content: "Blog | Vix.cpp",
    },
    {
      name: "twitter:description",
      content: description,
    },
  ],

  link: [
    {
      rel: "canonical",
      href: "https://vixcpp.com/blog",
    },
  ],
});
</script>

<template>
  <main class="blog-page">
    <div class="blog-container">
      <header class="blog-header">
        <p class="blog-eyebrow">Vix.cpp</p>

        <h1>Blog</h1>

        <p class="blog-intro">
          News, technical deep dives, release notes, and development updates
          from the Vix.cpp project.
        </p>
      </header>

      <section v-if="featuredPost" class="blog-feature" aria-labelledby="featured-post">
        <p class="section-label">Latest release</p>

        <article class="featured-post">
          <div class="featured-post__content">
            <p class="featured-post__meta">
              <span>Release notes</span>

              <time v-if="featuredPost.date" :datetime="featuredPost.date">
                {{ featuredPost.date }}
              </time>
            </p>

            <h2 id="featured-post">{{ featuredPost.title }}</h2>

            <p class="featured-post__theme">A release about ownership.</p>

            <p class="featured-post__summary">
              Vix.cpp v2.9.0 clarifies responsibility across the build system,
              networking, SDK packaging, and mobile platform support.
            </p>

            <RouterLink
              :to="`/blog/${featuredPost.path}`"
              class="featured-post__link"
            >
              Read release notes <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </article>
      </section>

      <section class="blog-posts" aria-labelledby="latest-posts">
        <div class="blog-posts__header">
          <h2 id="latest-posts">Latest</h2>

          <span class="blog-posts__count">
            {{ latestPosts.length }}
            {{ latestPosts.length === 1 ? "post" : "posts" }}
          </span>
        </div>

        <div v-if="latestPosts.length" class="blog-list">
          <article
            v-for="post in latestPosts"
            :key="post.path"
            class="blog-entry"
          >
            <RouterLink :to="`/blog/${post.path}`" class="blog-entry__link">
              <div class="blog-entry__content">
                <h3>
                  {{ post.title }}
                </h3>

                <p v-if="post.description">
                  {{ post.description }}
                </p>
              </div>

              <div class="blog-entry__meta">
                <time v-if="post.date" :datetime="post.date">
                  {{ post.date }}
                </time>

                <span class="blog-entry__arrow" aria-hidden="true"> → </span>
              </div>
            </RouterLink>
          </article>
        </div>

        <p v-else class="blog-empty">No other posts have been published yet.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.blog-page {
  min-height: 70vh;

  padding: clamp(3.5rem, 7vw, 5.5rem) 0 clamp(6rem, 10vw, 8rem);

  background: var(--vix-bg);
}

.blog-container {
  width: min(100% - 48px, 860px);

  margin-inline: auto;
}

/* ==========================================================
   Header
========================================================== */

.blog-header {
  max-width: 720px;
}

.blog-eyebrow {
  margin: 0 0 0.9rem;

  color: var(--vix-green);

  font-family: var(--font-mono);

  font-size: 0.72rem;

  font-weight: 600;

  letter-spacing: 0.08em;

  text-transform: uppercase;
}

.blog-header h1 {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(2.7rem, 6vw, 4.25rem);

  font-weight: 680;

  line-height: 0.98;

  letter-spacing: -0.055em;
}

.blog-intro {
  max-width: 650px;

  margin: 1.25rem 0 0;

  color: var(--vix-text-secondary);

  font-size: clamp(1rem, 1.4vw, 1.08rem);

  line-height: 1.65;
}

/* ==========================================================
   Featured post
========================================================== */

.blog-feature {
  margin-top: clamp(3rem, 6vw, 4.5rem);
}

.section-label {
  margin: 0 0 0.9rem;

  color: var(--vix-green);

  font-family: var(--font-mono);

  font-size: 0.7rem;

  letter-spacing: 0.08em;

  text-transform: uppercase;
}

.featured-post {
  border-top: 1px solid var(--vix-border);
  border-bottom: 1px solid var(--vix-border);
  border-left: 3px solid var(--vix-green);
}

.featured-post__content {
  max-width: 720px;

  padding: clamp(1.5rem, 4vw, 2.5rem) clamp(1.25rem, 4vw, 2.75rem);
}

.featured-post__meta {
  display: flex;

  flex-wrap: wrap;

  gap: 0.8rem 1.25rem;

  margin: 0;

  color: var(--vix-text-muted);

  font-family: var(--font-mono);

  font-size: 0.7rem;

  letter-spacing: 0.03em;

  text-transform: uppercase;
}

.featured-post__meta span {
  color: var(--vix-green);
}

.featured-post h2 {
  margin: 1.15rem 0 0;

  color: var(--vix-text);

  font-size: clamp(1.9rem, 4vw, 3rem);

  font-weight: 650;

  line-height: 1.05;

  letter-spacing: -0.045em;
}

.featured-post__theme {
  margin: 0.8rem 0 0;

  color: var(--vix-text);

  font-size: clamp(1.1rem, 2vw, 1.35rem);

  line-height: 1.4;
}

.featured-post__summary {
  max-width: 630px;

  margin: 1rem 0 0;

  color: var(--vix-text-secondary);

  font-size: 0.98rem;

  line-height: 1.7;
}

.featured-post__link {
  display: inline-flex;

  align-items: center;

  gap: 0.45rem;

  margin-top: 1.45rem;

  color: var(--vix-link);

  font-size: 0.92rem;

  text-decoration: none;

  transition: color 120ms ease;
}

.featured-post__link span {
  transition: transform 120ms ease;
}

.featured-post__link:hover,
.featured-post__link:focus-visible {
  color: var(--vix-link-hover);
}

.featured-post__link:hover span {
  transform: translateX(3px);
}

.featured-post__link:focus-visible {
  outline: 2px solid var(--vix-link);

  outline-offset: 5px;
}

/* ==========================================================
   Posts
========================================================== */

.blog-posts {
  margin-top: clamp(3.75rem, 8vw, 5.75rem);
}

.blog-posts__header {
  display: flex;

  align-items: baseline;

  justify-content: space-between;

  gap: 1rem;

  padding-bottom: 1.1rem;
}

.blog-posts__header h2 {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(1.35rem, 2.5vw, 1.7rem);

  font-weight: 650;

  line-height: 1.2;

  letter-spacing: -0.035em;
}

.blog-posts__count {
  color: var(--vix-text-muted);

  font-family: var(--font-mono);

  font-size: 0.7rem;
}

/* ==========================================================
   List
========================================================== */

.blog-list {
  border-top: 1px solid var(--vix-border);
}

.blog-entry {
  border-bottom: 1px solid var(--vix-border);
}

.blog-entry__link {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    auto;

  align-items: start;

  gap: clamp(1.5rem, 4vw, 3rem);

  padding: 1.5rem 0;

  color: inherit;

  text-decoration: none;
}

.blog-entry__content {
  min-width: 0;
}

.blog-entry h3 {
  margin: 0;

  color: var(--vix-link);

  font-size: clamp(1.08rem, 2vw, 1.25rem);

  font-weight: 600;

  line-height: 1.35;

  letter-spacing: -0.025em;

  transition: color 120ms ease;
}

.blog-entry p {
  max-width: 640px;

  margin: 0.55rem 0 0;

  color: var(--vix-text-secondary);

  font-size: 0.93rem;

  line-height: 1.7;
}

/* ==========================================================
   Metadata
========================================================== */

.blog-entry__meta {
  display: flex;

  align-items: center;

  gap: 0.8rem;

  padding-top: 0.18rem;
}

.blog-entry time {
  color: var(--vix-text-muted);

  font-family: var(--font-mono);

  font-size: 0.72rem;

  white-space: nowrap;
}

.blog-entry__arrow {
  color: var(--vix-link);

  font-size: 0.9rem;

  transition:
    transform 120ms ease,
    color 120ms ease;
}

/* ==========================================================
   Interaction
========================================================== */

.blog-entry__link:hover h3 {
  color: var(--vix-link-hover);

  text-decoration: underline;

  text-decoration-thickness: 1px;

  text-underline-offset: 0.2em;
}

.blog-entry__link:hover {
  border-color: var(--vix-text-muted);
}

.blog-entry__link:hover .blog-entry__arrow {
  color: var(--vix-link-hover);

  transform: translateX(3px);
}

.blog-entry__link:focus-visible {
  outline: 2px solid var(--vix-link);

  outline-offset: 6px;
}

/* ==========================================================
   Empty state
========================================================== */

.blog-empty {
  margin: 0;

  padding: 1.5rem 0;

  color: var(--vix-text-secondary);

  border-top: 1px solid var(--vix-border);

  border-bottom: 1px solid var(--vix-border);

  font-size: 0.95rem;

  line-height: 1.7;
}

/* ==========================================================
   Responsive
========================================================== */

@media (max-width: 700px) {
  .blog-page {
    padding-top: 3.5rem;
  }

  .blog-container {
    width: min(100% - 32px, 860px);
  }

  .blog-entry__link {
    grid-template-columns: 1fr;

    gap: 0.85rem;

    padding: 1.45rem 0;
  }

  .blog-entry__meta {
    justify-content: space-between;

    padding-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .featured-post__link,
  .featured-post__link span,
  .blog-entry h3,
  .blog-entry__arrow {
    transition: none;
  }
}
</style>
