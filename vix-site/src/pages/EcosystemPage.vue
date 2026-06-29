<template>
  <main class="ecosystem-page">
    <section class="ecosystem-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Ecosystem"
          title="Vix.cpp stays the foundation."
          description="The Vix.cpp ecosystem is organized so the core project does not need to absorb every idea. Some projects sit above it, some validate it, and some extend it into more specialized application layers."
        />

        <div class="ecosystem-hero__actions">
          <BaseButton :href="links.docs" external arrow>
            Read the docs
          </BaseButton>

          <BaseButton :href="links.github" variant="secondary" external arrow>
            View Vix.cpp
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="ecosystem-grid section-tight">
      <div class="ecosystem-grid__inner container">
        <a
          v-for="item in ecosystem"
          :key="item.name"
          class="project-card"
          :href="item.href"
          target="_blank"
          rel="noreferrer"
        >
          <span class="project-card__name">{{ item.name }}</span>
          <p>{{ item.description }}</p>
          <span class="project-card__arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <section class="ecosystem-model section">
      <div class="ecosystem-model__inner container">
        <SectionTitle
          eyebrow="Model"
          title="One foundation, different layers above it."
          description="Vix.cpp should remain focused on the native runtime, CLI workflow, registry integration, SDK profiles, diagnostics, and project foundations. Higher-level libraries and specialized runtimes can grow around it without turning the core into a large opinionated framework."
        />

        <div class="ecosystem-model__panel panel">
          <div class="model-row">
            <span>Vix.cpp</span>
            <p>
              Runtime, CLI, build workflow, registry client, SDK profiles, and
              native C++ foundations.
            </p>
          </div>

          <div class="model-row">
            <span>Rix</span>
            <p>
              Unified userland library layer for application-level C++ packages.
            </p>
          </div>

          <div class="model-row">
            <span>Pico</span>
            <p>
              Real application validation for Vix.cpp modules and runtime
              behavior.
            </p>
          </div>

          <div class="model-row">
            <span>Cnerium</span>
            <p>
              Reliability-first backend layer built above the Vix foundation.
            </p>
          </div>

          <div class="model-row">
            <span>Kordex</span>
            <p>
              JavaScript runtime for reliable local-first applications, built
              with Vix.cpp.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="ecosystem-rule section-tight">
      <div class="container">
        <div class="ecosystem-rule__panel panel-soft">
          <p>
            The rule is simple: primitives belong in Vix, application helpers
            belong in Rix, production reliability layers can grow in Cnerium,
            and specialized runtimes such as Kordex can use Vix.cpp as their
            native foundation.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { links } from "@/data/links";
import { ecosystem } from "@/data/ecosystem";
</script>

<
<style scoped>
.ecosystem-page {
  overflow: hidden;
}

.ecosystem-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.ecosystem-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.ecosystem-grid__inner {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.project-card {
  position: relative;
  min-height: 230px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-xs);
  padding: 24px;
  text-decoration: none;
  transition:
    transform var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease);
}
.project-card:hover {
  transform: translateY(-3px);
  border-color: var(--green-line);
  box-shadow: var(--shadow-md);
}

.project-card__name {
  color: var(--text);
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.project-card p {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.65;
}

.project-card__arrow {
  margin-top: auto;
  padding-top: 16px;
  color: var(--text-faint);
  font-size: 1.2rem;
  transition:
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}
.project-card:hover .project-card__arrow {
  color: var(--green-strong);
  transform: translateX(3px);
}

.ecosystem-model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.ecosystem-model__panel {
  overflow: hidden;
}

.model-row {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  gap: 18px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}
.model-row:last-child {
  border-bottom: 0;
}

.model-row span {
  color: var(--green-strong);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 700;
}

.model-row p {
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.68;
}

.ecosystem-rule__panel {
  padding: clamp(26px, 4vw, 42px);
}

.ecosystem-rule__panel p {
  max-width: 900px;
  color: var(--text-soft);
  font-size: clamp(1.05rem, 1.45vw, 1.2rem);
  line-height: 1.82;
}

@media (max-width: 1040px) {
  .ecosystem-grid__inner {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ecosystem-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .ecosystem-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
  .ecosystem-grid__inner {
    grid-template-columns: 1fr;
  }
  .model-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
