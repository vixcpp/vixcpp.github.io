<template>
  <section class="cli section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="CLI"
        title="One command surface for the application workflow."
        description="The Vix CLI is the main entry point into the Vix.cpp workflow. It brings project creation, build, run, development mode, tests, diagnostics, dependency management, packaging, deployment, SDK upgrades, and local tooling under one command surface."
        center
      />

      <div class="cli__frame-outer">
        <span class="cli__corner cli__corner--tl" aria-hidden="true" />
        <span class="cli__corner cli__corner--tr" aria-hidden="true" />
        <span class="cli__corner cli__corner--bl" aria-hidden="true" />
        <span class="cli__corner cli__corner--br" aria-hidden="true" />

        <div class="cli__badge" aria-hidden="true">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="60" cy="60" r="58" fill="#0c0e0d" />
            <circle
              cx="60"
              cy="60"
              r="57"
              stroke="#22c55e"
              stroke-opacity="0.35"
              stroke-width="2"
            />
            <defs>
              <linearGradient
                id="cli-left"
                x1="28"
                y1="24"
                x2="58"
                y2="96"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stop-color="#d4fcd4" />
                <stop offset="55%" stop-color="#4ade80" />
                <stop offset="100%" stop-color="#22c55e" />
              </linearGradient>
              <linearGradient
                id="cli-right"
                x1="92"
                y1="24"
                x2="62"
                y2="96"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stop-color="#22c55e" />
                <stop offset="100%" stop-color="#15803d" />
              </linearGradient>
            </defs>
            <polygon points="28,24 45,24 60,96 50,96" fill="url(#cli-left)" />
            <polygon points="92,24 75,24 60,96 70,96" fill="url(#cli-right)" />
            <line
              x1="38"
              y1="50"
              x2="51"
              y2="96"
              stroke="#bbf7d0"
              stroke-width="3"
              stroke-linecap="round"
              opacity="0.65"
            />
          </svg>
        </div>

        <div class="cli__label" aria-hidden="true">
          <span class="cli__label-dot" />
          vix --help
        </div>

        <div class="cli__frame-inner">
          <ImagePanel
            class="cli__image"
            :src="images.cli"
            alt="Vix.cpp CLI commands"
          />
        </div>
      </div>

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

/* ── Floating frame ── */
.cli__frame-outer {
  position: relative;
  width: 76%;
  margin: 52px auto 0;
}

/* Corner brackets */
.cli__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  z-index: 3;
  pointer-events: none;
}
.cli__corner--tl {
  top: -6px;
  left: -6px;
  border-top: 2px solid var(--green);
  border-left: 2px solid var(--green);
}
.cli__corner--tr {
  top: -6px;
  right: -6px;
  border-top: 2px solid var(--green);
  border-right: 2px solid var(--green);
}
.cli__corner--bl {
  bottom: -6px;
  left: -6px;
  border-bottom: 2px solid var(--green);
  border-left: 2px solid var(--green);
}
.cli__corner--br {
  bottom: -6px;
  right: -6px;
  border-bottom: 2px solid var(--green);
  border-right: 2px solid var(--green);
}

/* Logo badge — top-left (varie de Architecture) */
.cli__badge {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 44px;
  height: 44px;
  z-index: 4;
  border-radius: 50%;
  box-shadow: var(--shadow-md);
}

/* Mono label — bottom-right */
.cli__label {
  position: absolute;
  bottom: -13px;
  right: 22px;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--bg-panel);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.03em;
}
.cli__label-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--green);
  flex-shrink: 0;
}

/* Inner frame */
.cli__frame-inner {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-panel);
  box-shadow: var(--shadow-md);
}

.cli__image {
  display: block;
  width: 100%;
}

/* Body */
.cli__body {
  max-width: 820px;
  margin: 48px auto 0;
  display: grid;
  gap: 22px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.78;
  text-align: center;
}

.cli__commands {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 1024px) {
  .cli__frame-outer {
    width: 90%;
  }
}

@media (max-width: 720px) {
  .cli__frame-outer {
    width: 100%;
    margin-top: 32px;
  }
  .cli__badge {
    width: 36px;
    height: 36px;
    top: -14px;
    left: -12px;
  }
  .cli__label {
    font-size: 0.65rem;
    bottom: -12px;
    right: 14px;
  }
  .cli__body {
    text-align: left;
    margin-top: 36px;
  }
  .cli__commands {
    justify-content: flex-start;
  }
}
</style>
