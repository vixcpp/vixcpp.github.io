<script setup>
import { buildWithVix } from "../../data/buildWithVix";
</script>

<template>
  <section :id="buildWithVix.id" class="build">
    <div class="container">
      <header class="build__header">
        <h2 class="build__title">
          {{ buildWithVix.title }}
        </h2>

        <p class="build__description">
          {{ buildWithVix.description }}
        </p>
      </header>

      <div class="build__domains">
        <article
          v-for="domain in buildWithVix.domains"
          :key="domain.key"
          class="domain"
        >
          <div class="domain__visual">
            <!-- ==========================================
                 Web & Networked Applications
            =========================================== -->

            <svg
              v-if="domain.key === 'web-network'"
              class="domain__svg domain__svg--network"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <!-- outer network shape -->
              <path
                d="M80 26
                   C56 26 38 44 38 66
                   C38 84 49 98 65 103"
                class="svg-line svg-line--muted"
              />

              <path
                d="M95 103
                   C111 98 122 84 122 66
                   C122 44 104 26 80 26"
                class="svg-line svg-line--muted"
              />

              <!-- cloud-ish network top -->
              <path
                d="M48 72
                   C37 72 29 64 29 53
                   C29 43 36 35 46 34
                   C50 22 61 15 74 17
                   C83 18 90 23 94 31
                   C98 29 102 28 107 28
                   C120 28 130 39 130 52
                   C130 64 121 72 109 72"
                class="svg-line"
              />

              <!-- vertical connections -->
              <path d="M55 72V100" class="svg-line" />

              <path d="M80 72V116" class="svg-line" />

              <path d="M105 72V100" class="svg-line" />

              <!-- branch -->
              <path d="M55 88H80" class="svg-line svg-line--muted" />

              <path d="M80 88H105" class="svg-line svg-line--muted" />

              <!-- nodes -->
              <circle cx="55" cy="108" r="8" class="svg-node" />

              <circle
                cx="80"
                cy="124"
                r="8"
                class="svg-node svg-node--primary"
              />

              <circle cx="105" cy="108" r="8" class="svg-node" />

              <!-- small packets -->
              <circle cx="55" cy="88" r="3" class="svg-packet" />

              <circle cx="80" cy="88" r="3" class="svg-packet" />

              <circle cx="105" cy="88" r="3" class="svg-packet" />
            </svg>

            <!-- ==========================================
                 Developer Tools
            =========================================== -->

            <svg
              v-else
              class="domain__svg domain__svg--tools"
              viewBox="0 0 160 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <!-- terminal -->
              <rect
                x="25"
                y="29"
                width="110"
                height="82"
                rx="9"
                class="svg-line"
              />

              <path d="M25 48H135" class="svg-line svg-line--muted" />

              <!-- window dots -->
              <circle cx="38" cy="39" r="3" class="svg-dot" />

              <circle cx="48" cy="39" r="3" class="svg-dot svg-dot--soft" />

              <circle cx="58" cy="39" r="3" class="svg-dot svg-dot--soft" />

              <!-- prompt -->
              <path d="M43 67L53 77L43 87" class="svg-line" />

              <path d="M61 88H86" class="svg-line" />

              <!-- code/tool lines -->
              <path d="M96 67H117" class="svg-line svg-line--muted" />

              <path d="M96 78H124" class="svg-line svg-line--muted" />

              <path d="M96 89H112" class="svg-line svg-line--muted" />

              <!-- tool structure underneath -->
              <path d="M50 111V125" class="svg-line" />

              <path d="M110 111V125" class="svg-line" />

              <path d="M50 125H110" class="svg-line" />

              <!-- central build node -->
              <rect
                x="68"
                y="117"
                width="24"
                height="24"
                rx="5"
                class="svg-node-box"
              />

              <path d="M76 125H84" class="svg-line" />

              <path d="M80 121V129" class="svg-line" />

              <!-- side nodes -->
              <circle cx="50" cy="125" r="5" class="svg-node" />

              <circle cx="110" cy="125" r="5" class="svg-node" />
            </svg>
          </div>

          <div class="domain__content">
            <h3 class="domain__title">
              {{ domain.title }}
            </h3>

            <p class="domain__description">
              {{ domain.description }}
            </p>
          </div>

          <a
            class="domain__action"
            :href="domain.action.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ domain.action.label }}

            <span aria-hidden="true"> → </span>
          </a>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ==========================================================
   Section
========================================================== */

.build {
  position: relative;

  padding: clamp(5rem, 8vw, 7rem) 0;

  border-top: 1px solid var(--color-border);
  background: var(--vix-bg);
}

.build__header {
  max-width: 780px;

  margin-bottom: clamp(2.25rem, 4vw, 3.25rem);
}

.build__title {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(2.3rem, 4vw, 3.55rem);

  font-weight: 660;
  line-height: 1.04;

  letter-spacing: -0.052em;
}

.build__description {
  max-width: 720px;

  margin-top: 1rem;

  color: var(--color-text-secondary);

  font-size: 1.04rem;
  line-height: 1.72;
}

/* ==========================================================
   Domains
========================================================== */

.build__domains {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: clamp(2rem, 4vw, 3.5rem);
}

.domain {
  display: flex;
  flex-direction: column;

  min-width: 0;

  padding-top: 1.5rem;

  border-top: 1px solid rgba(74, 222, 128, 0.16);
}

/* ==========================================================
   SVG
========================================================== */

.domain__visual {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  min-height: 150px;

  margin-bottom: 1.15rem;
}

.domain__svg {
  width: 160px;
  height: 160px;

  overflow: visible;
}

/*
  Real SVG styling
*/

.svg-line {
  stroke: #d4fcd4;
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.svg-line--muted {
  stroke: rgba(212, 252, 212, 0.35);
}

.svg-node {
  fill: var(--vix-bg-soft);

  stroke: #4ade80;
  stroke-width: 3;
}

.svg-node--primary {
  fill: rgba(34, 197, 94, 0.12);

  stroke: #22c55e;
}

.svg-node-box {
  fill: rgba(34, 197, 94, 0.07);

  stroke: #4ade80;
  stroke-width: 3;
}

.svg-packet {
  fill: #22c55e;

  opacity: 0.8;
}

.svg-dot {
  fill: #4ade80;
}

.svg-dot--soft {
  fill: rgba(212, 252, 212, 0.3);
}

/* ==========================================================
   Content
========================================================== */

.domain__content {
  max-width: 510px;
}

.domain__title {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(1.65rem, 2.5vw, 2.2rem);

  font-weight: 650;
  line-height: 1.15;

  letter-spacing: -0.038em;
}

.domain__description {
  margin-top: 0.85rem;

  color: var(--color-text-secondary);

  font-size: 0.95rem;
  line-height: 1.7;
}

/* ==========================================================
   Action
========================================================== */

.domain__action {
  display: inline-flex;
  align-items: center;

  width: fit-content;
  gap: 0.55rem;

  margin-top: 1.1rem;
  padding: 0;

  color: var(--vix-link);
  background: transparent;
  border: 0;

  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 620;

  text-decoration: none;

  transition: color 120ms ease;
}

.domain__action:hover {
  color: var(--vix-link-hover);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.domain__action span {
  color: var(--vix-link);

  font-size: 1rem;

  transition: transform 120ms ease;
}

.domain__action:hover span {
  transform: translateX(3px);
}

/* ==========================================================
   Responsive
========================================================== */

@media (max-width: 760px) {
  .build {
    padding-block: 4rem;
  }

  .build__domains {
    grid-template-columns: 1fr;

    gap: 4rem;
  }

  .domain__visual {
    min-height: 150px;
  }

  .domain__svg {
    width: 140px;
    height: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .domain__action {
    transition: none;
  }

  .domain__action span {
    transition: none;
  }

  .domain__action:hover span {
    transform: none;
  }
}
</style>
