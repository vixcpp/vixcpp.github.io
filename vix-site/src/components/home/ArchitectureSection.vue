<template>
  <section class="architecture section-tight">
    <div class="container-wide">
      <SectionTitle
        eyebrow="Architecture"
        title="Native C++ stays at the center."
        description="Vix.cpp sits around the normal C++ toolchain. It gives the application workflow a consistent shape without taking away the compiler, CMake, native build outputs, or the tools experienced C++ developers already use."
        center
      />

      <div class="architecture__frame-outer">
        <span
          class="architecture__corner architecture__corner--tl"
          aria-hidden="true"
        />
        <span
          class="architecture__corner architecture__corner--tr"
          aria-hidden="true"
        />
        <span
          class="architecture__corner architecture__corner--bl"
          aria-hidden="true"
        />
        <span
          class="architecture__corner architecture__corner--br"
          aria-hidden="true"
        />

        <div class="architecture__badge" aria-hidden="true">
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
                id="arch-left"
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
                id="arch-right"
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
            <polygon points="28,24 45,24 60,96 50,96" fill="url(#arch-left)" />
            <polygon points="92,24 75,24 60,96 70,96" fill="url(#arch-right)" />
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

        <div class="architecture__label" aria-hidden="true">
          <span class="architecture__label-dot" />
          system overview
        </div>

        <div class="architecture__frame-inner">
          <ImagePanel
            class="architecture__image"
            :src="images.architecture"
            alt="Vix.cpp architecture"
          />
        </div>
      </div>

      <div class="architecture__text">
        <p>
          Vix.cpp is not a separate universe for C++ projects. It is a workflow
          layer, a runtime layer, and a set of platform foundations that work
          with the existing ecosystem instead of replacing it.
        </p>
        <p>
          The detailed command reference, module guides, SDK profiles, examples,
          and internals live in the documentation. The purpose of this page is
          to show the shape of the project and the direction behind it.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
import ImagePanel from "@/components/common/ImagePanel.vue";
import { images } from "@/data/images";
</script>

<style scoped>
.architecture {
  position: relative;
  background: var(--bg);
  border-block: 1px solid var(--line-soft);
}

/* ── Floating frame ── */
.architecture__frame-outer {
  position: relative;
  width: 76%;
  margin: 52px auto 0;
}

/* Corner brackets — green */
.architecture__corner {
  position: absolute;
  width: 14px;
  height: 14px;
  z-index: 3;
  pointer-events: none;
}
.architecture__corner--tl {
  top: -6px;
  left: -6px;
  border-top: 2px solid var(--green);
  border-left: 2px solid var(--green);
}
.architecture__corner--tr {
  top: -6px;
  right: -6px;
  border-top: 2px solid var(--green);
  border-right: 2px solid var(--green);
}
.architecture__corner--bl {
  bottom: -6px;
  left: -6px;
  border-bottom: 2px solid var(--green);
  border-left: 2px solid var(--green);
}
.architecture__corner--br {
  bottom: -6px;
  right: -6px;
  border-bottom: 2px solid var(--green);
  border-right: 2px solid var(--green);
}

/* Logo badge — top-right */
.architecture__badge {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 44px;
  height: 44px;
  z-index: 4;
  border-radius: 50%;
  box-shadow: var(--shadow-md);
}

/* Mono label — bottom-left */
.architecture__label {
  position: absolute;
  bottom: -13px;
  left: 22px;
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
.architecture__label-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--green);
  flex-shrink: 0;
}

/* Inner frame — light, clean */
.architecture__frame-inner {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-panel);
  box-shadow: var(--shadow-md);
}

.architecture__image {
  display: block;
  width: 100%;
}

/* Text block */
.architecture__text {
  max-width: 820px;
  margin: 44px auto 0;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.3vw, 1.1rem);
  line-height: 1.78;
  text-align: center;
}

/* Divider */
.architecture__divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 52px;
}
.architecture__divider-line {
  flex: 1;
  height: 1px;
  background: var(--line);
}
.architecture__divider-mark {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@media (max-width: 1024px) {
  .architecture__frame-outer {
    width: 90%;
  }
}

@media (max-width: 720px) {
  .architecture__frame-outer {
    width: 100%;
    margin-top: 32px;
  }
  .architecture__badge {
    width: 36px;
    height: 36px;
    top: -14px;
    right: -12px;
  }
  .architecture__label {
    font-size: 0.65rem;
    bottom: -12px;
    left: 14px;
  }
  .architecture__text {
    text-align: left;
  }
  .architecture__divider {
    margin-top: 36px;
  }
}
</style>
