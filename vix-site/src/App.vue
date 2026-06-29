<template>
  <div class="app-shell">
    <SiteHeader />

    <RouterView />

    <SiteFooter />
  </div>
</template>

<script setup>
import { onMounted } from "vue";

import SiteHeader from "@/components/layout/SiteHeader.vue";
import SiteFooter from "@/components/layout/SiteFooter.vue";

import { softwareApplicationSchema } from "@/seo/softwareApplication";
import { organizationSchema } from "@/seo/organization";

function injectJsonLd(id, schema) {
  const existing = document.getElementById(id);

  if (existing) {
    existing.textContent = JSON.stringify(schema);
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);

  document.head.appendChild(script);
}

onMounted(() => {
  injectJsonLd("vix-software-application-schema", softwareApplicationSchema);
  injectJsonLd("vix-organization-schema", organizationSchema);
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-shell :deep(main) {
  flex: 1;
}
</style>
