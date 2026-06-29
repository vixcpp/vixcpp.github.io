<template>
  <main class="seo-page">
    <section class="seo-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="What is Vix.cpp?"
          title="Vix.cpp is a modern application workflow for native C++."
          description="Vix.cpp is a runtime and developer toolkit for building real applications with modern C++. It keeps the native C++ model intact while improving the workflow around the application."
        />

        <div class="seo-hero__actions">
          <BaseButton :href="links.install" arrow> Install Vix </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read the docs
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="answer section-tight">
      <div class="answer__inner container">
        <article class="answer__content">
          <h2>Vix.cpp in plain terms</h2>

          <p>
            Vix.cpp gives C++ projects a more direct path from source code to a
            running application. It helps with the work that usually surrounds
            the code: creating a project, running it, building it, testing it,
            checking it, installing SDK profiles, managing dependencies, and
            preparing the result for production.
          </p>

          <p>
            A Vix.cpp project is still an ordinary C++ project. It is compiled
            by a C++ compiler, it can work with CMake and native build tools,
            and it produces native executables or libraries.
          </p>

          <p>
            The purpose of Vix.cpp is not to replace C++. The purpose is to make
            the application workflow around C++ more consistent, repeatable, and
            easier to trust.
          </p>
        </article>

        <aside class="answer__panel panel">
          <p class="answer__label">Short answer</p>

          <p>
            Vix.cpp is the workflow, runtime, CLI, SDK, and registry foundation
            around native C++ applications.
          </p>
        </aside>
      </div>
    </section>

    <section class="model section">
      <div class="model__inner container">
        <SectionTitle
          eyebrow="Model"
          title="C++ remains the center."
          description="Vix.cpp sits around the existing C++ ecosystem. It does not ask developers to leave the native model behind."
        />

        <div class="model__panel panel-soft">
          <div class="model-row">
            <span>C++</span>
            <p>
              The language, compiler model, native binaries, and performance
              foundation.
            </p>
          </div>

          <div class="model-row">
            <span>CMake</span>
            <p>
              The existing build ecosystem for projects that need direct build
              control.
            </p>
          </div>

          <div class="model-row">
            <span>Vix.cpp</span>
            <p>
              The application workflow, CLI, runtime modules, SDK profiles,
              registry workflow, diagnostics, and production path around the
              project.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="next section-tight">
      <div class="container">
        <div class="next__panel panel">
          <h2>Next step</h2>

          <p>
            Install the CLI, choose the SDK profile that matches your project,
            and start with the documentation.
          </p>

          <div class="next__commands">
            <CommandLine
              command="curl -fsSL https://vixcpp.com/install.sh | bash"
            />
            <CommandLine command="vix upgrade --sdk list" />
            <CommandLine command="vix upgrade --sdk info web" />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { links } from "@/data/links";
</script>

<style scoped>
.seo-page {
  overflow: hidden;
}

.seo-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.seo-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.answer__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.answer__content h2 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.answer__content p {
  margin-top: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.answer__panel {
  padding: 28px;
}

.answer__label {
  color: var(--green-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.answer__panel p:not(.answer__label) {
  margin-top: 14px;
  color: var(--text-soft);
  font-size: 1rem;
  line-height: 1.75;
}

.model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.model__panel {
  overflow: hidden;
}

.model-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
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

.next__panel {
  padding: clamp(26px, 4vw, 42px);
}

.next__panel h2 {
  font-size: clamp(1.7rem, 3vw, 2.6rem);
}

.next__panel p {
  max-width: 760px;
  margin-top: 16px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.next__commands {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 920px) {
  .answer__inner,
  .model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .seo-hero__actions,
  .next__commands {
    flex-direction: column;
    align-items: stretch;
  }

  .model-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
