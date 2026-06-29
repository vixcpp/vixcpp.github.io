<template>
  <section class="cli section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="CLI"
        title="One command surface for the application workflow."
        description="The Vix CLI is the main entry point into the Vix.cpp workflow. It brings project creation, build, run, development mode, tests, diagnostics, dependency management, packaging, deployment, SDK upgrades, and local tooling under one command surface."
        center
      />

      <ImagePanel
        class="cli__image"
        :src="images.cli"
        alt="Vix.cpp CLI commands"
      />

      <div class="cli__body">
        <p>
          This does not make Vix.cpp a shell around random scripts. The CLI is
          part of the platform: it understands Vix projects, native C++ files,
          SDK profiles, package state, diagnostics, production workflows, and
          the development lifecycle around real applications.
        </p>

        <div class="cli__commands">
          <CommandLine command="vix --help" />
          <CommandLine command="vix help run" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";
import CommandLine from "@/components/common/CommandLine.vue";

import { images } from "@/data/images";
</script>

<style scoped>
.cli {
  position: relative;
}

.cli__image {
  margin-top: 42px;
}

.cli__body {
  max-width: 880px;
  margin: 34px auto 0;
  display: grid;
  gap: 22px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.8;
  text-align: center;
}

.cli__commands {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 720px) {
  .cli__image {
    margin-top: 30px;
  }

  .cli__body {
    text-align: left;
  }

  .cli__commands {
    justify-content: flex-start;
  }
}
</style>
