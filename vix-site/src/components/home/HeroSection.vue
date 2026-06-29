<template>
  <section class="hero">
    <div class="hero__glow" aria-hidden="true" />

    <div class="hero__inner container-wide">
      <div class="hero__content">
        <p class="hero__eyebrow">Native C++ application workflow</p>

        <h1>Build real applications with modern C++.</h1>

        <p class="hero__lead">
          Vix.cpp keeps the native C++ model intact while giving projects a more
          direct workflow around the application: create it, run it, build it,
          test it, check it, package it, and prepare it for production.
        </p>

        <div class="hero__actions">
          <BaseButton :href="links.install" arrow> Install Vix </BaseButton>

          <BaseButton :href="links.docs" variant="secondary" external arrow>
            Read the docs
          </BaseButton>

          <BaseButton :href="links.github" variant="ghost" external>
            GitHub
          </BaseButton>
        </div>

        <div class="hero__commands" aria-label="Common Vix commands">
          <CommandLine
            command="curl -fsSL https://vixcpp.com/install.sh | bash"
          />
          <CommandLine command="vix upgrade --sdk info web" />
          <CommandLine command="vix new app && cd app && vix dev" />
        </div>
      </div>

      <aside class="hero__panel" aria-label="Vix.cpp summary">
        <div class="hero__logo-wrap">
          <img :src="images.logo" alt="Vix.cpp" class="hero__logo" />
        </div>

        <div class="hero__panel-body">
          <p class="hero__panel-kicker">Vix.cpp</p>

          <p class="hero__panel-text">
            A runtime, CLI, SDK workflow, registry client, and application
            foundation for native C++ projects.
          </p>

          <div class="hero__facts">
            <span>Native C++</span>
            <span>CMake compatible</span>
            <span>SDK profiles</span>
            <span>Registry workflow</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import BaseButton from "@/components/common/BaseButton.vue";
import CommandLine from "@/components/common/CommandLine.vue";

import { links } from "@/data/links";
import { images } from "@/data/images";
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(84px, 12vw, 150px) 0 clamp(56px, 8vw, 96px);
}

.hero__glow {
  position: absolute;
  inset: -30% -10% auto;
  height: 520px;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 18% 30%,
      rgba(34, 197, 94, 0.18),
      transparent 34rem
    ),
    radial-gradient(
      circle at 72% 18%,
      rgba(74, 222, 128, 0.08),
      transparent 28rem
    );
  filter: blur(4px);
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) 420px;
  gap: clamp(32px, 6vw, 76px);
  align-items: center;
}

.hero__content {
  max-width: 820px;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  margin-bottom: 18px;
  color: var(--green-soft);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

h1 {
  max-width: 850px;
}

.hero__lead {
  max-width: 760px;
  margin-top: 26px;
  color: var(--text-soft);
  font-size: clamp(1.08rem, 1.55vw, 1.28rem);
  line-height: 1.8;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 34px;
}

.hero__commands {
  display: grid;
  gap: 10px;
  margin-top: 34px;
}

.hero__panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.055), transparent),
    rgba(7, 17, 12, 0.72);
  box-shadow: var(--shadow-panel);
}

.hero__panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 50% 0%,
      rgba(34, 197, 94, 0.16),
      transparent 17rem
    ),
    linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.18));
}

.hero__logo-wrap {
  position: relative;
  display: grid;
  place-items: center;
  padding: 54px 32px 28px;
}

.hero__logo {
  width: 132px;
  height: 132px;
  filter: drop-shadow(0 18px 42px rgba(34, 197, 94, 0.2));
}

.hero__panel-body {
  position: relative;
  padding: 0 28px 30px;
}

.hero__panel-kicker {
  color: var(--green-soft);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero__panel-text {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.96rem;
  line-height: 1.75;
}

.hero__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 22px;
}

.hero__facts span {
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.07);
  padding: 0.42rem 0.62rem;
  color: rgba(187, 247, 208, 0.78);
  font-size: 0.72rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .hero__inner {
    grid-template-columns: 1fr;
  }

  .hero__panel {
    max-width: 520px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-top: 64px;
  }

  .hero__actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
