<script setup>
import { useRoute } from "vue-router";

import { site } from "../../data/site";
import { navigation } from "../../data/navigation";

const route = useRoute();

function isActive(item) {
  if (item.external || !item.to) {
    return false;
  }

  return (
    route.path === item.to ||
    (item.to !== "/" && route.path.startsWith(`${item.to}/`))
  );
}
</script>

<template>
  <header class="site-header">
    <!-- ===================================================
         Brand band
    ==================================================== -->

    <div class="brand-band">
      <div class="brand-band__inner">
        <RouterLink
          class="brand"
          to="/"
          aria-label="Vix.cpp home"
          @click="closeMenu"
        >
          <img class="brand__logo" :src="site.logo" alt="" />

          <span class="brand__name"
            ><span>Vix</span><span class="brand__name-suffix">.cpp</span></span
          >
        </RouterLink>
      </div>
    </div>

    <!-- ===================================================
         Accent line
    ==================================================== -->

    <div class="site-header__accent" />

    <!-- ===================================================
         Navigation band
    ==================================================== -->

    <div class="navigation-band">
      <nav class="navigation-band__inner" aria-label="Main navigation">
        <template v-for="item in navigation" :key="item.label">
          <a
            v-if="item.external"
            class="navigation-link"
            :href="item.href"
            target="_blank"
            rel="noreferrer"
            @click="closeMenu"
          >
            {{ item.label }}

            <span class="navigation-link__external" aria-hidden="true">
              ↗
            </span>
          </a>

          <RouterLink
            v-else
            class="navigation-link"
            :class="{
              'navigation-link--active': isActive(item),
            }"
            :to="item.to"
            @click="closeMenu"
          >
            {{ item.label }}
          </RouterLink>
        </template>
      </nav>
    </div>
  </header>
</template>

<style scoped>
/* ==========================================================
   Header
========================================================== */

.site-header {
  position: relative;
  z-index: 100;

  width: 100%;

  background: var(--vix-bg);
}

.site-header,
.site-header * {
  animation: none !important;
  transition: none !important;
}

/* ==========================================================
   Brand band
========================================================== */

.brand-band {
  background: var(--vix-bg);
}

.brand-band__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;

  width: min(calc(100% - 48px), var(--container-width));

  min-height: clamp(116px, 11vw, 150px);

  margin-inline: auto;
}

/* ==========================================================
   Brand
========================================================== */

.brand {
  display: inline-flex;
  align-items: center;

  gap: clamp(1rem, 2vw, 1.45rem);

  color: var(--color-text);

  text-decoration: none;
}

.brand__logo {
  display: block;

  width: clamp(62px, 7vw, 88px);

  height: clamp(62px, 7vw, 88px);

  object-fit: contain;
}

.brand__name {
  font-family: var(--font-sans);

  font-size: clamp(2.55rem, 5vw, 4.35rem);

  font-weight: 760;
  line-height: 0.95;

  letter-spacing: -0.06em;
}

.brand__name > span:first-child {
  color: var(--vix-green-light);
}

.brand__name-suffix {
  margin-left: 0.015em;
  color: #e6e9ed;
}

/* ==========================================================
   Accent
========================================================== */

.site-header__accent {
  width: 100%;
  height: 3px;

  background: var(--color-primary);
}

/* ==========================================================
   Navigation band
========================================================== */

.navigation-band {
  background: var(--vix-bg-alt);
}

.navigation-band__inner {
  display: flex;
  align-items: center;

  gap: clamp(1.15rem, 2vw, 1.8rem);

  width: min(calc(100% - 48px), var(--container-width));

  min-height: 38px;

  margin-inline: auto;
}

/* ==========================================================
   Navigation links
========================================================== */

.navigation-link {
  display: inline-flex;
  align-items: center;

  gap: 0.25rem;

  color: var(--vix-text);

  font-size: 0.86rem;
  font-weight: 450;
  line-height: 1;

  text-decoration: none;

  white-space: nowrap;
}

.navigation-link:hover {
  color: #ffffff;
  text-decoration: underline;
}

.navigation-link--active {
  color: #ffffff;

  font-weight: 620;
}

.navigation-link__external {
  color: rgba(255, 255, 255, 0.5);

  font-size: 0.62rem;

  transform: translateY(-1px);
}

/* ==========================================================
   Mobile menu trigger
========================================================== */

.menu-button {
  display: none;
  align-items: center;

  gap: 0.7rem;

  padding: 0;

  color: #e9f1ec;
  background: transparent;

  border: 0;

  font: inherit;
  font-size: 0.8rem;

  cursor: pointer;
}

.menu-button__icon {
  position: relative;

  display: block;

  width: 19px;
  height: 13px;
}

.menu-button__icon i {
  position: absolute;
  left: 0;

  display: block;

  width: 19px;
  height: 1px;

  background: currentColor;
}

.menu-button__icon i:first-child {
  top: 3px;
}

.menu-button__icon i:last-child {
  top: 10px;
}

.menu-button__icon--open i:first-child {
  top: 6px;

  transform: rotate(45deg);
}

.menu-button__icon--open i:last-child {
  top: 6px;

  transform: rotate(-45deg);
}
</style>
