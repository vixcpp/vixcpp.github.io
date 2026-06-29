<template>
  <main class="about-page">
    <section class="about-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="About"
          title="Vix.cpp is maintained by Softadastra."
          description="Softadastra builds tools that simplify modern C++ development. Vix.cpp is part of that direction: a native C++ application workflow built around clarity, reliability, documentation, and long-term trust."
        />

        <div class="about-hero__actions">
          <BaseButton :href="links.softadastra" external arrow>
            Visit Softadastra
          </BaseButton>

          <BaseButton :href="links.github" variant="secondary" external arrow>
            View Vix.cpp
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="mission section-tight">
      <div class="mission__inner container">
        <div class="mission__copy">
          <SectionTitle
            eyebrow="Mission"
            title="A company behind the C++ tooling work."
            description="Softadastra maintains Vix.cpp so the project can have a clear direction, a long-term home, and a place for the larger ecosystem to grow."
          />
        </div>

        <div class="mission__panel panel">
          <p>
            Vix.cpp is not only a repository of C++ code. It is a platform with
            a CLI, runtime modules, SDK profiles, registry workflow, release
            infrastructure, documentation, and real application validation.
          </p>

          <p>
            Softadastra exists behind that work so the project can stay focused:
            simplify the application workflow around native C++ without turning
            the core into a place where every idea becomes a new feature.
          </p>
        </div>
      </div>
    </section>

    <section class="principles section">
      <div class="principles__inner container">
        <SectionTitle
          eyebrow="Principles"
          title="Professional C++ tooling has to earn trust."
          description="The project direction is shaped by the expectations of experienced C++ developers: clear boundaries, native outputs, readable diagnostics, test coverage, documented behavior, and careful releases."
        />

        <div class="principles__grid">
          <article class="principle-card">
            <h3>Native first</h3>
            <p>
              Vix.cpp keeps C++ native and works with the tools developers
              already use.
            </p>
          </article>

          <article class="principle-card">
            <h3>Quality over surface area</h3>
            <p>
              The next phase is about improving what exists, not adding features
              only to make the project look larger.
            </p>
          </article>

          <article class="principle-card">
            <h3>Ecosystem without confusion</h3>
            <p>
              Vix.cpp stays the foundation while Rix, Pico, Cnerium, and Kordex
              grow around it.
            </p>
          </article>
        </div>
      </div>
    </section>

    <section class="about-links section-tight">
      <div class="container">
        <div class="about-links__panel panel-soft">
          <p>
            Learn more through the documentation, engineering notes, registry,
            and related projects.
          </p>

          <div class="about-links__items">
            <a :href="links.docs" target="_blank" rel="noreferrer">Docs</a>
            <a :href="links.blog" target="_blank" rel="noreferrer">
              Engineering Notes
            </a>
            <a :href="links.registry" target="_blank" rel="noreferrer">
              Registry
            </a>
            <a :href="links.softadastra" target="_blank" rel="noreferrer">
              Softadastra
            </a>
          </div>
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
.about-page {
  overflow: hidden;
}

.about-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.about-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.mission__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.mission__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.mission__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.principles__inner {
  display: grid;
  gap: 36px;
}

.principles__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.principle-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 24px;
}

.principle-card p {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.7;
}

.about-links__panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: clamp(24px, 4vw, 36px);
}

.about-links__panel p {
  max-width: 560px;
  color: var(--text-soft);
  font-size: 1rem;
  line-height: 1.75;
}

.about-links__items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.about-links__items a {
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.07);
  padding: 0.55rem 0.78rem;
  color: var(--green-soft);
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
}

.about-links__items a:hover {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

@media (max-width: 920px) {
  .mission__inner,
  .principles__grid {
    grid-template-columns: 1fr;
  }

  .about-links__panel {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .about-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
