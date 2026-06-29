<template>
  <main class="why-page">
    <section class="why-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Why Vix.cpp?"
          title="Because C++ applications need more than compilation."
          description="C++ already has mature compilers, strong performance, native binaries, and decades of production use. Vix.cpp focuses on the workflow around the application."
        />

        <div class="why-hero__actions">
          <BaseButton :href="links.docs" external arrow>
            Read the docs
          </BaseButton>

          <BaseButton :href="links.github" variant="secondary" external arrow>
            View on GitHub
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="problem section-tight">
      <div class="problem__inner container">
        <SectionTitle
          eyebrow="The problem"
          title="The first feature is rarely the first problem."
          description="Before a C++ project feels like an application, developers often have to make repeated decisions about structure, build configuration, tests, dependencies, diagnostics, packaging, and local development workflow."
        />

        <div class="problem__panel panel-soft">
          <p>
            Experienced C++ developers know how to wire these pieces together,
            but the work is still repetitive. Newer developers often lose time
            before they reach the application logic.
          </p>

          <p>
            Vix.cpp exists to make those repeated decisions part of a standard
            workflow, while still keeping the native C++ toolchain visible and
            usable.
          </p>
        </div>
      </div>
    </section>

    <section class="reasons section">
      <div class="reasons__inner container">
        <article class="reason-card">
          <span>01</span>
          <h3>Workflow consistency</h3>
          <p>
            A project can be created, run, built, tested, checked, packaged, and
            upgraded through one command surface.
          </p>
        </article>

        <article class="reason-card">
          <span>02</span>
          <h3>Native compatibility</h3>
          <p>
            Vix.cpp works with native C++, CMake, compilers, linkers, and normal
            executable or library outputs.
          </p>
        </article>

        <article class="reason-card">
          <span>03</span>
          <h3>Long-term trust</h3>
          <p>
            Diagnostics, SDK profiles, registry workflow, CI, tests, releases,
            and documentation are treated as part of the platform.
          </p>
        </article>
      </div>
    </section>

    <section class="direction section-tight">
      <div class="direction__inner container">
        <SectionTitle
          eyebrow="Direction"
          title="The goal is not to make Vix.cpp larger for its own sake."
          description="The project direction is to make the existing platform more coherent, better tested, easier to install, easier to validate, and more predictable for real C++ projects."
        />

        <div class="direction__panel panel">
          <p>
            After v2.7, the focus is less surface area and more depth: better
            existing modules, stronger registry workflow, better SDK
            installation, clearer diagnostics, broader tests, stronger CI,
            better documentation, and more real application validation.
          </p>

          <p>
            New features can still happen, but they should earn their place by
            improving the existing workflow or solving a practical problem that
            matters for real C++ applications.
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
</script>

<style scoped>
.why-page {
  overflow: hidden;
}

.why-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.why-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.problem__inner,
.direction__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.problem__panel,
.direction__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.problem__panel p,
.direction__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.reasons__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.reason-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 24px;
}

.reason-card span {
  color: var(--green-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 850;
}

.reason-card h3 {
  margin-top: 18px;
}

.reason-card p {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.7;
}

@media (max-width: 920px) {
  .problem__inner,
  .direction__inner,
  .reasons__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .why-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
