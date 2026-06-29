<template>
  <header class="site-header">
    <div class="site-header__inner">
      <RouterLink class="brand" to="/" aria-label="Vix.cpp home">
        <img class="brand__mark" :src="images.logo" alt="" />
        <span class="brand__name">Vix.cpp</span>
      </RouterLink>

      <nav class="nav" aria-label="Main navigation">
        <a
          v-for="item in site.nav"
          :key="item.label"
          class="nav__link"
          :href="item.href"
          :target="item.external ? '_blank' : undefined"
          :rel="item.external ? 'noreferrer' : undefined"
        >
          {{ item.label }}
        </a>
      </nav>

      <a
        class="github"
        :href="links.github"
        target="_blank"
        rel="noreferrer"
        aria-label="Open Vix.cpp on GitHub"
      >
        GitHub
      </a>
    </div>
  </header>
</template>

<script setup>
import { links } from "@/data/links";
import { images } from "@/data/images";
import { site } from "@/data/site";
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  background: rgba(5, 8, 7, 0.78);
  backdrop-filter: blur(18px);
}

.site-header__inner {
  width: min(100% - 2rem, var(--container-wide));
  min-height: 72px;
  margin-inline: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand:hover {
  color: inherit;
}

.brand__mark {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
}

.brand__name {
  color: var(--text);
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.nav__link {
  color: var(--text-muted);
  font-size: 0.86rem;
  font-weight: 650;
  text-decoration: none;
  transition: color var(--speed) var(--ease);
}

.nav__link:hover {
  color: var(--text);
}

.github {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 0.9rem;
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.07);
  color: var(--green-soft);
  font-size: 0.82rem;
  font-weight: 750;
  text-decoration: none;
  transition:
    background var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    color var(--speed) var(--ease);
}

.github:hover {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

@media (max-width: 780px) {
  .site-header__inner {
    min-height: 64px;
  }

  .nav {
    display: none;
  }

  .brand__mark {
    width: 32px;
    height: 32px;
  }
}
</style>
