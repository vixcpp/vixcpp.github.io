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
.resources__inner {
  max-width: 900px;
}

.resources__list {
  margin-top: 40px;
  display: grid;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.resource {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 26px;
  background: var(--bg-panel);
  transition: background var(--speed) var(--ease);
}

.resource:hover {
  background: var(--bg-soft);
}

.resource h3 {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 5px;
}

.resource p {
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

.resource > span {
  flex-shrink: 0;
  font-size: 1.2rem;
  color: var(--text-faint);
  transition:
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.resource:hover > span {
  color: var(--green-strong);
  transform: translateX(3px);
}

@media (max-width: 560px) {
  .resource {
    padding: 20px;
    gap: 16px;
  }
}
</style>
