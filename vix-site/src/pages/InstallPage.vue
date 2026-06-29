<template>
  <main class="install-page">
    <section class="install-hero section">
      <div class="container">
        <SectionTitle
          eyebrow="Install"
          title="Install the CLI first. Add the SDK profile when you need it."
          description="The Vix.cpp installer bootstraps the command line tool. SDK profiles are installed from the CLI so the local environment can stay small until a project needs a specific runtime layer."
        />

        <div class="install-hero__actions">
          <BaseButton :href="links.docs" external arrow>
            Read installation docs
          </BaseButton>

          <BaseButton :href="links.github" variant="secondary" external arrow>
            View releases
          </BaseButton>
        </div>
      </div>
    </section>

    <section class="install-commands section-tight">
      <div class="install-commands__inner container">
        <article class="install-card panel">
          <p class="install-card__label">Linux and macOS</p>
          <h2>Shell installer</h2>
          <p>
            Use the shell installer to download and install the native Vix CLI
            binary for your platform.
          </p>
          <CommandLine :command="site.install.linuxMac" />
        </article>

        <article class="install-card panel">
          <p class="install-card__label">Windows</p>
          <h2>PowerShell installer</h2>
          <p>
            Use the PowerShell installer to install the native Vix CLI on
            Windows.
          </p>
          <CommandLine :command="site.install.windows" />
        </article>
      </div>
    </section>

    <section class="sdk-flow section">
      <div class="sdk-flow__inner container">
        <div class="sdk-flow__copy">
          <SectionTitle
            eyebrow="SDK profiles"
            title="Choose the profile that matches the project."
            description="A Vix SDK profile contains the native headers, libraries, CMake package files, and module set for a specific kind of application workflow."
          />
        </div>

        <div class="sdk-flow__panel panel">
          <CommandLine :command="site.install.sdkList" />
          <CommandLine :command="site.install.sdkInfo" />
          <CommandLine :command="site.install.sdkInstall" />

          <p>
            Start by listing the available SDK profiles, inspect the one you
            need, then install it. This keeps the CLI bootstrap simple while
            letting the project grow into the SDK it actually uses.
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
import { site } from "@/data/site";
</script>

<style scoped>
.install-page {
  overflow: hidden;
}

.install-hero {
  padding-top: clamp(72px, 10vw, 128px);
}

.install-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.install-commands__inner {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.install-card {
  padding: clamp(24px, 4vw, 36px);
}

.install-card__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
}

.install-card h2 {
  margin-top: 12px;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

.install-card p:not(.install-card__label) {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.98rem;
  line-height: 1.72;
}

.install-card :deep(.cmd) {
  margin-top: 20px;
}

.sdk-flow__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
}

.sdk-flow__panel {
  display: grid;
  gap: 10px;
  padding: clamp(24px, 4vw, 36px);
}

.sdk-flow__panel p {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.96rem;
  line-height: 1.72;
}

@media (max-width: 900px) {
  .install-commands__inner,
  .sdk-flow__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .install-hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
