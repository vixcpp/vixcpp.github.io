<template>
  <section class="ecosystem section">
    <div class="ecosystem__inner container">
      <div class="ecosystem__copy">
        <SectionTitle
          eyebrow="Ecosystem"
          title="Vix.cpp is the foundation."
          description="Some projects sit above it, some validate it, and some extend it into more specialized application layers."
        />

        <p>
          Vix.cpp should remain the native foundation, while higher-level
          libraries and runtimes can grow around it without making the core
          project lose focus.
        </p>
      </div>

      <div class="ecosystem__grid">
        <a
          v-for="item in ecosystem"
          :key="item.name"
          class="eco-card"
          :href="item.href"
          target="_blank"
          rel="noreferrer"
        >
          <span class="eco-card__name">{{ item.name }}</span>
          <p>{{ item.description }}</p>
          <span class="eco-card__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

import { ecosystem } from "@/data/ecosystem";
</script>

<style scoped>
.ecosystem {
  position: relative;
}

.ecosystem__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: clamp(30px, 5vw, 72px);
  align-items: start;
}

.ecosystem__copy p {
  max-width: 680px;
  margin-top: 22px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.ecosystem__grid {
  display: grid;
  gap: 14px;
}

.eco-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 22px 48px 22px 22px;
  text-decoration: none;
  transition:
    transform var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease);
}

.eco-card:hover {
  transform: translateY(-2px);
  border-color: rgba(34, 197, 94, 0.32);
  background:
    linear-gradient(180deg, rgba(34, 197, 94, 0.06), transparent),
    rgba(7, 17, 12, 0.78);
}

.eco-card__name {
  color: var(--text);
  font-size: 1.02rem;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.eco-card p {
  margin-top: 8px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.65;
}

.eco-card__arrow {
  position: absolute;
  top: 22px;
  right: 22px;
  color: var(--green-soft);
  font-weight: 900;
  opacity: 0.8;
}

@media (max-width: 920px) {
  .ecosystem__inner {
    grid-template-columns: 1fr;
  }
}
</style>
