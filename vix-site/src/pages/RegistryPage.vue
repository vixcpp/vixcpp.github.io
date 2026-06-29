<template>
  <main class="registry-page">
    <section class="registry-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Registry"
          title="A package workflow that stays simple enough to trust."
          description="The Vix Registry gives Vix.cpp projects a way to discover, add, install, update, and publish reusable C++ packages without requiring a heavy cloud service before the ecosystem needs one."
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

    <section class="registry-flow section-tight">
      <div class="registry-flow__inner container">
        <article class="flow-card panel">
          <p class="flow-card__label">Search</p>
          <h2>Find packages from the local index.</h2>
          <p>
            The registry index can be synced locally, so common package
            discovery does not need to depend on a live backend request for
            every search.
          </p>
          <CommandLine command="vix registry sync" />
          <CommandLine command="vix search csv" />
        </article>

        <article class="flow-card panel">
          <p class="flow-card__label">Install</p>
          <h2>Add packages to a Vix project.</h2>
          <p>
            Dependencies are resolved through the Vix package workflow and
            installed into the local project environment.
          </p>
          <CommandLine command="vix add @rix/csv" />
          <CommandLine command="vix install" />
        </article>

        <article class="flow-card panel">
          <p class="flow-card__label">Maintain</p>
          <h2>Keep package state explicit.</h2>
          <p>
            Vix keeps dependency state visible through lockfiles, update checks,
            local store commands, and package publishing workflows.
          </p>
          <CommandLine command="vix update" />
          <CommandLine command="vix outdated" />
        </article>
      </div>
    </section>

    <section class="registry-design section">
      <div class="registry-design__inner container">
        <SectionTitle
          eyebrow="Design"
          title="Git-based first, cloud later when it earns its place."
          description="The registry is intentionally based on a transparent package index. That keeps the system inexpensive to operate, easy to inspect, easy to mirror, and practical while the project grows."
        />

        <div class="registry-design__panel panel-soft">
          <p>
            Vix.cpp does not need a large custom backend to prove the package
            model. The important part at this stage is that package metadata,
            dependency resolution, installation, updates, and publishing have a
            clear workflow that C++ developers can understand.
          </p>

          <p>
            A cloud service can arrive later if the ecosystem needs accounts,
            analytics, advanced search, private packages, or hosted publishing
            features. Until then, the registry should remain simple, visible,
            and maintainable.
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
.registry-page {
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

.registry-flow__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.flow-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(24px, 4vw, 34px);
}

.flow-card__label {
  color: var(--green-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.flow-card h2 {
  font-size: clamp(1.45rem, 2.6vw, 2.2rem);
  line-height: 1.08;
}

.flow-card p:not(.flow-card__label) {
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.75;
}

.flow-card :deep(.cmd) {
  width: 100%;
}

.registry-design__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.registry-design__panel {
  display: grid;
  gap: 18px;
  padding: clamp(24px, 4vw, 38px);
}

.registry-design__panel p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

@media (max-width: 980px) {
  .registry-flow__inner,
  .registry-design__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .registry-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
