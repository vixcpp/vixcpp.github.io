<template>
  <div class="app">
    <SiteHeader />
    <main class="main">
      <router-view />
    </main>
    <SiteFooter />
  </div>
</template>

<script setup>
import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";
</script>

<style scoped>
/* hauteur approximative du header (desktop + mobile) */
.app {
  --header-h: 64px;
}

/* ✅ pousse toutes les pages sous le header fixed */
.main {
  padding-top: calc(var(--header-h) + 18px);
  min-height: calc(100vh - var(--header-h));
}

/* mobile: header souvent plus “épais” */
@media (max-width: 900px) {
  .app {
    --header-h: 76px;
  }
}
</style>
