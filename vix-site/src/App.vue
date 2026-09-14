<script setup>
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
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
