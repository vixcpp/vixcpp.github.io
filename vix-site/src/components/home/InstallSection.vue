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
.install__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: clamp(36px, 5vw, 72px);
  align-items: center;
}

.install__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 30px;
}

/* Panel — terminal-flavored install steps */
.install__panel {
  padding: 26px 24px;
  display: grid;
  gap: 22px;
}

.install__block {
  display: grid;
  gap: 8px;
}

.install__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

@media (max-width: 860px) {
  .install__inner {
    grid-template-columns: 1fr;
  }
}
</style>
