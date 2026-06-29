<template>
  <section class="install section-tight">
    <div class="install__inner container">
      <div class="install__content">
        <SectionTitle
          eyebrow="Installation"
          title="Install the CLI first, then choose a SDK profile."
          description="Vix.cpp is installed in two steps. The install script bootstraps the CLI, and the CLI installs the SDK profile that matches the kind of application you are building."
        />

        <div class="install__actions">
          <BaseButton :href="links.install" arrow> Install guide </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read the docs
          </BaseButton>
        </div>
      </div>

      <div class="install__panel panel">
        <div class="install__block">
          <p class="install__label">Linux and macOS</p>
          <CommandLine :command="site.install.linuxMac" />
        </div>

        <div class="install__block">
          <p class="install__label">Windows PowerShell</p>
          <CommandLine :command="site.install.windows" />
        </div>

        <div class="install__block">
          <p class="install__label">SDK profiles</p>
          <CommandLine :command="site.install.sdkList" />
          <CommandLine :command="site.install.sdkInfo" />
          <CommandLine :command="site.install.sdkInstall" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

import { links } from "@/data/links";
import { site } from "@/data/site";
</script>

<style scoped>
.install {
  position: relative;
}

.install__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 64px);
  align-items: center;
}

.install__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.install__panel {
  padding: 24px;
  display: grid;
  gap: 22px;
}

.install__block {
  display: grid;
  gap: 10px;
}

.install__label {
  color: var(--text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

@media (max-width: 920px) {
  .install__inner {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .install__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
