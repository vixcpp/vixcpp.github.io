<template>
  <main class="pico-page">
    <section class="pico-hero section">
      <div class="pico-hero__layout container-wide">
        <div class="pico-hero__copy">
          <SectionTitle
            eyebrow="Pico"
            title="A real application built with Vix.cpp."
            description="Pico exists to keep the runtime honest. It validates Vix.cpp inside a working application, where routing, middleware, persistence, diagnostics, runtime behavior, UI, and developer workflow have to work together."
          />

          <div class="pico-hero__actions">
            <BaseButton :href="links.pico" external arrow>
              Open Pico
            </BaseButton>

            <BaseButton :href="links.docs" variant="secondary" external arrow>
              Read the docs
            </BaseButton>
          </div>

          <div class="pico-hero__facts">
            <span>Runtime validation</span>
            <span>Workflow validation</span>
            <span>Real application shape</span>
          </div>
        </div>

        <aside class="pico-hero__preview" aria-label="Pico application preview">
          <div class="pico-hero__preview-head">
            <span class="pico-hero__dot pico-hero__dot--red" />
            <span class="pico-hero__dot pico-hero__dot--yellow" />
            <span class="pico-hero__dot pico-hero__dot--green" />
            <span>pico.vixcpp.com</span>
          </div>

          <ImagePanel
            class="pico-hero__image"
            :src="images.pico"
            alt="Pico application built with Vix.cpp"
            :href="links.pico"
            link-label="Open Pico"
          />
        </aside>
      </div>
    </section>

    <section class="pico-purpose section">
      <div class="pico-purpose__inner container">
        <SectionTitle
          eyebrow="Why Pico matters"
          title="Examples are useful, but applications reveal the truth."
          description="A runtime can look good in isolated examples and still fail when the pieces are used together. Pico exists to test the shape of Vix.cpp in application reality."
        />

        <div class="pico-purpose__panel">
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
        <article
          v-for="item in validationModel"
          :key="item.title"
          class="model-card"
        >
          <span>{{ item.number }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
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

const validationModel = [
  {
    number: "01",
    title: "Runtime validation",
    text: "Pico verifies that the runtime behaves correctly when the application is not just a small snippet.",
  },
  {
    number: "02",
    title: "Workflow validation",
    text: "It checks the experience around the application: running, testing, inspecting, diagnosing, and iterating.",
  },
  {
    number: "03",
    title: "Design validation",
    text: "It gives feedback on whether Vix.cpp design decisions still make sense when they meet application reality.",
  },
];
</script>

<style scoped>
.pico-page {
  overflow: hidden;
}

.pico-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.pico-hero__layout {
  display: grid;
  grid-template-columns: minmax(0, 0.78fr) minmax(620px, 1.22fr);
  gap: clamp(36px, 5vw, 68px);
  align-items: center;
}

.pico-hero__copy {
  min-width: 0;
}

.pico-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.pico-hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 26px;
}

.pico-hero__facts span {
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 999px;
  padding: 0.42rem 0.66rem;
  color: var(--green-bright);
  background: rgba(34, 197, 94, 0.055);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 750;
}

.pico-hero__preview {
  width: 100%;
  min-width: 0;
  justify-self: end;
  overflow: hidden;
  border: 1px solid var(--line-ink);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.pico-hero__preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 14px;
  border-bottom: 1px solid var(--line-ink);
  background: var(--bg-ink-soft);
  color: var(--text-invert-soft);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 650;
}

.pico-hero__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.pico-hero__dot--red {
  background: #ff5f57;
}

.pico-hero__dot--yellow {
  background: #febc2e;
}

.pico-hero__dot--green {
  background: #28c840;
}

.pico-hero__image {
  display: block;
  width: 100%;
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
  border: 1px solid rgba(34, 197, 94, 0.14);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.pico-purpose__panel p {
  margin: 0;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.82;
}

.pico-model__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.model-card {
  padding: 26px 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: transparent;
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.model-card:hover {
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.model-card span {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 850;
}

.model-card h3 {
  margin: 16px 0 0;
  color: var(--text);
  font-size: 1.08rem;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.model-card p {
  margin: 10px 0 0;
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.68;
}

@media (max-width: 1100px) {
  .pico-hero__layout,
  .pico-purpose__inner {
    grid-template-columns: 1fr;
  }

  .pico-hero__preview {
    max-width: 860px;
    justify-self: start;
  }
}

@media (max-width: 920px) {
  .pico-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pico-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .pico-hero__preview-head {
    height: 38px;
  }

  .pico-hero__preview {
    overflow-x: auto;
  }

  .pico-hero__image {
    min-width: 620px;
  }
}
</style>
