<template>
  <main class="pico-page">
    <section class="pico-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Pico"
          title="A real application built with Vix.cpp."
          description="Pico exists to keep the runtime honest. It validates Vix.cpp inside a working application, where routing, middleware, persistence, diagnostics, runtime behavior, and developer workflow have to work together."
        />

        <div class="pico-hero__actions">
          <BaseButton :href="links.pico" external arrow> Open Pico </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read the docs
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="pico-preview section-tight">
      <div class="container-wide">
        <ImagePanel
          :src="images.pico"
          alt="Pico application built with Vix.cpp"
          :href="links.pico"
          link-label="Open Pico"
        />
      </div>
    </section>

    <section class="pico-purpose section">
      <div class="pico-purpose__inner container">
        <SectionTitle
          eyebrow="Why Pico matters"
          title="Examples are useful, but applications reveal the truth."
          description="A runtime can look good in isolated examples and still fail when the pieces are used together. Pico exists to test the shape of Vix.cpp in application reality."
        />

        <div class="pico-purpose__panel panel-soft">
          <p>
            Pico brings Vix.cpp into a real application shape. It exercises the
            runtime, routing, middleware, persistence, diagnostics, metrics,
            browser UI, and the command workflow around them.
          </p>

          <p>
            This matters because Vix.cpp is not meant to be a collection of
            disconnected modules. The platform has to hold together when used to
            build real software.
          </p>
        </div>
      </div>
    </section>

    <section class="pico-model section-tight">
      <div class="pico-model__inner container">
        <article class="model-card">
          <span>01</span>
          <h3>Runtime validation</h3>
          <p>
            Pico verifies that the runtime behaves correctly when the
            application is not just a small snippet.
          </p>
        </article>

        <article class="model-card">
          <span>02</span>
          <h3>Workflow validation</h3>
          <p>
            It checks the experience around the application: running, testing,
            inspecting, diagnosing, and iterating.
          </p>
        </article>

        <article class="model-card">
          <span>03</span>
          <h3>Design validation</h3>
          <p>
            It gives feedback on whether Vix.cpp design decisions still make
            sense when they meet application reality.
          </p>
        </article>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { images } from "@/data/images";
import { links } from "@/data/links";
</script>

<style scoped>
.pico-page {
  overflow: hidden;
}

.pico-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.pico-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.pico-purpose__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.pico-purpose__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.pico-purpose__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.82;
}

.pico-model__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.model-card {
  padding: 26px 24px;
  background: var(--bg-panel);
  transition: background var(--speed) var(--ease);
}
.model-card:hover {
  background: var(--bg-soft);
}

.model-card span {
  color: var(--green-strong);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
}

.model-card h3 {
  margin-top: 16px;
  font-size: 1.08rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.model-card p {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.68;
}

@media (max-width: 920px) {
  .pico-purpose__inner {
    grid-template-columns: 1fr;
  }
  .pico-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pico-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
