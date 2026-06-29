<template>
  <main class="cmake-page">
    <section class="cmake-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Vix.cpp and CMake"
          title="Vix.cpp works with CMake instead of pretending it does not exist."
          description="CMake is already part of the native C++ ecosystem. Vix.cpp does not replace it; it gives projects a higher-level application workflow while keeping CMake available when direct build control matters."
        />

        <div class="cmake-hero__actions">
          <BaseButton :href="links.docs" external arrow>
            Read the docs
          </BaseButton>

          <BaseButton :href="links.github" variant="secondary" external arrow>
            View source
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="cmake-model section-tight">
      <div class="cmake-model__inner container">
        <SectionTitle
          eyebrow="Build model"
          title="Two paths, same native result."
          description="A Vix project can use an existing CMakeLists.txt when the project needs custom build control, or it can start with a simpler Vix application manifest when the application does not need that complexity yet."
        />

        <div class="cmake-model__panel panel">
          <div class="model-row">
            <span>CMakeLists.txt</span>
            <p>
              Vix.cpp uses the existing CMake project directly. This is the
              right path for advanced builds, custom targets, installed
              packages, external dependencies, and projects that already have a
              CMake structure.
            </p>
          </div>

          <div class="model-row">
            <span>vix.app</span>
            <p>
              Vix.cpp can use a smaller application manifest for projects that
              want a clearer starting point. The manifest still leads to a
              native C++ build underneath.
            </p>
          </div>

          <div class="model-row">
            <span>Native output</span>
            <p>
              Both paths end in ordinary native executables or libraries built
              through the C++ toolchain.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="cmake-why section">
      <div class="cmake-why__inner container">
        <article class="why-card">
          <span>01</span>
          <h3>Keep advanced projects in control</h3>
          <p>
            Vix.cpp does not take away the build system from projects that need
            the full power of CMake.
          </p>
        </article>

        <article class="why-card">
          <span>02</span>
          <h3>Make simple projects easier to start</h3>
          <p>
            A smaller manifest can be enough for early applications, examples,
            tools, and projects that do not need custom CMake logic yet.
          </p>
        </article>

        <article class="why-card">
          <span>03</span>
          <h3>Keep the workflow consistent</h3>
          <p>
            The developer can still use one Vix command surface for build, run,
            tests, checks, diagnostics, and packaging.
          </p>
        </article>
      </div>
    </section>

    <section class="cmake-summary section-tight">
      <div class="container">
        <div class="cmake-summary__panel panel-soft">
          <p>
            The goal is not to hide CMake from C++ developers. The goal is to
            reduce repeated application wiring while preserving the native build
            ecosystem that serious C++ projects already depend on.
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
.cmake-page {
  overflow: hidden;
}

.cmake-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.cmake-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.cmake-model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.cmake-model__panel {
  overflow: hidden;
}

.model-row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 18px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
}

.model-row:last-child {
  border-bottom: 0;
}

.model-row span {
  color: var(--green-soft);
  font-size: 0.85rem;
  font-weight: 850;
}

.model-row p {
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.7;
}

.cmake-why__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.why-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 24px;
}

.why-card span {
  color: var(--green-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 850;
}

.why-card h3 {
  margin-top: 18px;
}

.why-card p {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.7;
}

.cmake-summary__panel {
  padding: clamp(26px, 4vw, 42px);
}

.cmake-summary__panel p {
  max-width: 900px;
  color: var(--text-soft);
  font-size: clamp(1.05rem, 1.45vw, 1.2rem);
  line-height: 1.85;
}

@media (max-width: 920px) {
  .cmake-model__inner,
  .cmake-why__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cmake-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .model-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
