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
.ecosystem__inner {
  display: grid;
  gap: 44px;
}

.ecosystem__copy {
  max-width: 720px;
}

.ecosystem__copy > p {
  margin-top: 22px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.78;
  max-width: 60ch;
}

.ecosystem__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.eco-card {
  position: relative;
  display: block;
  padding: 24px 22px 48px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.eco-card:hover {
  border-color: var(--green-line);
  box-shadow: var(--shadow-md);
  transform: translateY(-3px);
}

.eco-card__name {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 9px;
}

.eco-card p {
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.eco-card__arrow {
  position: absolute;
  left: 22px;
  bottom: 20px;
  font-size: 1.05rem;
  color: var(--text-faint);
  transition:
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.eco-card:hover .eco-card__arrow {
  color: var(--green-strong);
  transform: translateX(3px);
}
</style>
