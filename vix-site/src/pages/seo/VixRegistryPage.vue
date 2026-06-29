<template>
  <main class="vix-registry-page">
    <section class="registry-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="What is the Vix Registry?"
          title="The Vix Registry is the package workflow for Vix.cpp projects."
          description="The Vix Registry helps Vix.cpp projects discover, add, install, update, and publish reusable C++ packages through a workflow that stays transparent and simple enough to reason about."
        />

        <div class="registry-hero__actions">
          <BaseButton :href="links.registry" external arrow>
            Open registry
          </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read registry docs
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="registry-answer section-tight">
      <div class="registry-answer__inner container">
        <article class="registry-answer__content">
          <h2>A registry for reusable C++ packages.</h2>

          <p>
            Vix.cpp uses the registry to make dependency discovery and
            installation part of the normal project workflow. A package can be
            searched, added to a project, installed, updated, checked, and
            published through the Vix CLI.
          </p>

          <p>
            The registry is intentionally simple at this stage. Package metadata
            can stay visible, inspectable, and easy to mirror while the
            ecosystem grows.
          </p>

          <p>
            The goal is not to hide how packages work. The goal is to give C++
            projects a practical package workflow that fits the rest of the
            Vix.cpp application model.
          </p>
        </article>

        <aside class="registry-answer__panel panel">
          <p class="registry-answer__label">Common flow</p>

          <CommandLine command="vix registry sync" />
          <CommandLine command="vix search csv" />
          <CommandLine command="vix add @rix/csv" />
          <CommandLine command="vix install" />
        </aside>
      </div>
    </section>

    <section class="registry-model section">
      <div class="registry-model__inner container">
        <SectionTitle
          eyebrow="Model"
          title="Package metadata, project state, and local installation stay explicit."
          description="The registry is part of a larger workflow: package discovery, dependency resolution, lockfiles, local store management, updates, publishing, and verification."
        />

        <div class="registry-model__panel panel-soft">
          <div class="model-row">
            <span>Registry</span>
            <p>
              Stores package metadata and version information for reusable Vix
              packages.
            </p>
          </div>

          <div class="model-row">
            <span>CLI</span>
            <p>
              Handles search, add, install, update, outdated checks, publishing,
              and local package state.
            </p>
          </div>

          <div class="model-row">
            <span>Project</span>
            <p>
              Keeps dependency state visible through project metadata and
              lockfiles.
            </p>
          </div>

          <div class="model-row">
            <span>Packages</span>
            <p>
              Provide reusable C++ libraries that can be installed into Vix.cpp
              projects.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="registry-principle section-tight">
      <div class="container">
        <div class="registry-principle__panel panel">
          <h2>Simple first.</h2>

          <p>
            Vix.cpp does not need a large custom cloud backend to prove the
            registry model. A transparent registry workflow keeps the ecosystem
            inexpensive to operate, easier to inspect, and easier to maintain.
          </p>

          <p>
            A cloud service can come later if the ecosystem needs accounts,
            analytics, advanced search, private packages, or hosted publishing.
            Until then, the registry should remain visible, practical, and
            reliable.
          </p>
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
.vix-registry-page {
  overflow: hidden;
}

.registry-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.registry-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.registry-answer__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.registry-answer__content h2 {
  font-size: clamp(1.8rem, 3vw, 2.8rem);
}

.registry-answer__content p {
  margin-top: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.registry-answer__panel {
  display: grid;
  gap: 12px;
  padding: 28px;
}

.registry-answer__label {
  margin-bottom: 6px;
  color: var(--green-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.registry-model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.registry-model__panel {
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

.registry-principle__panel {
  padding: clamp(26px, 4vw, 42px);
}

.registry-principle__panel h2 {
  font-size: clamp(1.7rem, 3vw, 2.6rem);
}

.registry-principle__panel p {
  max-width: 900px;
  margin-top: 16px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

@media (max-width: 920px) {
  .registry-answer__inner,
  .registry-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .registry-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }

  .model-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
