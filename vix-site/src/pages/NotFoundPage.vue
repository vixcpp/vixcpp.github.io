<template>
  <main class="not-found-page">
    <section class="not-found section">
      <div class="not-found__inner container">
        <div class="not-found__mark">404</div>

        <SectionTitle
          eyebrow="Page not found"
          title="This page does not exist."
          description="The page you are looking for may have moved, or the address may be incorrect. Start from the homepage, documentation, registry, or GitHub repository."
          center
        />

        <div class="not-found__actions">
          <BaseButton href="/" arrow> Go home </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Documentation
          </BaseButton>

          <BaseButton :href="links.github" variant="ghost" external>
            GitHub
          </BaseButton>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { links } from "@/data/links";
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  overflow: hidden;
}

.not-found {
  min-height: calc(100vh - 72px);
  display: grid;
  place-items: center;
  padding-top: clamp(72px, 10vw, 128px);
}

.not-found__inner {
  display: grid;
  justify-items: center;
  text-align: center;
}

.not-found__mark {
  margin-bottom: 22px;
  color: rgba(34, 197, 94, 0.2);
  font-family: var(--font-mono);
  font-size: clamp(4rem, 14vw, 11rem);
  font-weight: 900;
  line-height: 0.9;
  letter-spacing: -0.08em;
  text-shadow: 0 0 80px rgba(34, 197, 94, 0.12);
}

.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 34px;
}

@media (max-width: 640px) {
  .not-found__actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
