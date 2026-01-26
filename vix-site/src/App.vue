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
.app {
  --header-h: 64px;
}

.main {
  padding-top: calc(var(--header-h) + 18px);
  min-height: calc(100vh - var(--header-h));
}

@media (max-width: 900px) {
  .app {
    --header-h: 76px;
  }
}
</style>
