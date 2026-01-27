<template>
  <div class="app">
    <SiteHeader />
    <main class="main">
      <router-view />
    </main>
    <SiteFooter />

    <!-- PWA update toast -->
    <PwaUpdateToast
      :show="showPwaToast"
      :version="appVersion"
      @refresh="refresh"
      @dismiss="dismiss"
    />
  </div>
</template>

<script setup>
import { inject, computed } from "vue";

import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";

const store = inject("pwaToast");
const showPwaToast = computed(() => store?.show?.value === true);

const appVersion = import.meta.env.VITE_APP_VERSION;

function refresh() {
  window.__vix_pwa_refresh__?.();
}

function dismiss() {
  window.__vix_pwa_dismiss__?.();
}
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
