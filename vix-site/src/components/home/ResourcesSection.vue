<template>
  <section class="resources section">
    <div class="resources__inner container">
      <SectionTitle
        eyebrow="Additional resources"
        title="Where to go next."
        description="The homepage gives the project shape. The documentation, registry, engineering notes, and related projects provide the deeper references."
      />

      <div class="resources__list">
        <a
          v-for="resource in resources"
          :key="resource.title"
          class="resource"
          :href="resource.href"
          target="_blank"
          rel="noreferrer"
        >
          <div>
            <h3>{{ resource.title }}</h3>
            <p>{{ resource.description }}</p>
          </div>

          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

import { resources } from "@/data/resources";
</script>

<style scoped>
.resources {
  position: relative;
}

.resources__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: clamp(30px, 5vw, 72px);
  align-items: start;
}

.resources__list {
  display: grid;
  gap: 12px;
}

.resource {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: rgba(7, 17, 12, 0.58);
  padding: 22px;
  text-decoration: none;
  transition:
    transform var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease);
}

.resource:hover {
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.32);
  background: rgba(7, 17, 12, 0.78);
}

.resource h3 {
  color: var(--text);
  font-size: 1rem;
}

.resource p {
  margin-top: 8px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.65;
}

.resource span {
  color: var(--green-soft);
  font-weight: 900;
  flex-shrink: 0;
}

@media (max-width: 920px) {
  .resources__inner {
    grid-template-columns: 1fr;
  }
}
</style>
