<template>
  <main class="releases-page">
    <section class="releases-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Releases"
          title="Native releases, SDK profiles, and a clear project direction."
          description="Vix.cpp releases are not only version numbers. Each release should make the CLI, runtime, SDK profiles, registry workflow, diagnostics, documentation, and real application validation easier to trust."
        />

        <div class="releases-hero__actions">
          <BaseButton :href="links.releases" external arrow>
            GitHub releases
          </BaseButton>

          <BaseButton
            :href="`${links.github}/blob/main/CHANGELOG.md`"
            variant="secondary"
            external
            arrow
          >
            Changelog
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="release-install section-tight">
      <div class="release-install__inner container">
        <article class="release-card panel">
          <p class="release-card__label">CLI</p>
          <h2>Upgrade the command line tool.</h2>
          <p>
            The CLI is the bootstrap and main entry point into the Vix.cpp
            workflow.
          </p>
          <CommandLine command="vix upgrade" />
          <CommandLine command="vix upgrade --check" />
        </article>

        <article class="release-card panel">
          <p class="release-card__label">SDK</p>
          <h2>Install the profile your project needs.</h2>
          <p>
            SDK profiles keep release artifacts organized by application domain
            instead of forcing every project to install the full platform.
          </p>
          <CommandLine command="vix upgrade --sdk list" />
          <CommandLine command="vix upgrade --sdk info web" />
        </article>
      </div>
    </section>

    <section class="release-model section">
      <div class="release-model__inner container">
        <SectionTitle
          eyebrow="Release model"
          title="Release quality matters more than release noise."
          description="A release should improve trust in the platform: better installation, clearer diagnostics, stronger tests, cleaner SDK packaging, better documentation, and fewer surprises for real applications."
        />

        <div class="release-model__panel panel">
          <div class="model-row">
            <span>Native binaries</span>
            <p>
              The CLI is released as native platform artifacts for supported
              operating systems and architectures.
            </p>
          </div>

          <div class="model-row">
            <span>SDK archives</span>
            <p>
              SDK profiles are packaged separately so users can install the
              development layer that matches their project.
            </p>
          </div>

          <div class="model-row">
            <span>Verification</span>
            <p>
              Release assets should be accompanied by checksums and signatures
              when available.
            </p>
          </div>

          <div class="model-row">
            <span>Direction</span>
            <p>
              After v2.7, the priority is improving what exists instead of
              expanding the surface area for its own sake.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="release-direction section-tight">
      <div class="container">
        <div class="release-direction__panel panel-soft">
          <h2>Post-v2.7</h2>

          <p>
            Vix.cpp v2.7 marks an important foundation point for the project.
            The next phase is focused on module quality, registry workflow, SDK
            installation, diagnostics, tests, CI coverage, release quality,
            examples, documentation, and real application validation.
          </p>

          <p>
            New features can still happen, but they should earn their place by
            improving the existing workflow or solving a real application
            problem.
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
.releases-page {
  overflow: hidden;
}

.releases-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.releases-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.release-install__inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.release-card {
  display: grid;
  gap: 14px;
  padding: clamp(24px, 4vw, 34px);
}

.release-card__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
}

.release-card h2 {
  font-size: clamp(1.4rem, 2.6vw, 2rem);
  line-height: 1.1;
}

.release-card p:not(.release-card__label) {
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.72;
}

.release-card :deep(.cmd) {
  width: 100%;
}

.release-model__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: start;
}

.release-model__panel {
  overflow: hidden;
}

.model-row {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
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

.release-direction__panel {
  padding: clamp(26px, 4vw, 42px);
}

.release-direction__panel h2 {
  font-size: clamp(1.6rem, 3vw, 2.4rem);
}

.release-direction__panel p {
  max-width: 900px;
  margin-top: 16px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.82;
}

@media (max-width: 940px) {
  .release-install__inner,
  .release-model__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .releases-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
  .model-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
