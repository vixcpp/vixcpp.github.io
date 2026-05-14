<script setup>
import * as RoadmapData from "@/data/roadmap";

const ROADMAP =
  RoadmapData?.ROADMAP ??
  RoadmapData?.default ??
  RoadmapData?.default?.ROADMAP ??
  null;
</script>

<template>
  <main class="roadmap-page">
    <div v-if="!ROADMAP" class="container roadmap-loading">
      <h2>Loading roadmap…</h2>
      <p>ROADMAP is null. Check export in <code>@/data/roadmap</code>.</p>
    </div>

    <template v-else>
      <!-- HERO -->
      <section class="roadmap-hero">
        <div class="container roadmap-hero-inner">
          <p class="roadmap-eyebrow">{{ ROADMAP.hero.eyebrow }}</p>

          <h1>{{ ROADMAP.hero.title }}</h1>

          <p class="roadmap-hero-text">
            {{ ROADMAP.hero.text }}
          </p>

          <div class="roadmap-badges">
            <span
              v-for="badge in ROADMAP.hero.badges"
              :key="badge"
              class="roadmap-badge"
            >
              {{ badge }}
            </span>
          </div>
        </div>
      </section>

      <div class="roadmap-sep"></div>

      <!-- CURRENT FOCUS -->
      <section class="roadmap-section">
        <div class="container">
          <div class="roadmap-section-head">
            <h2>{{ ROADMAP.currentFocus.title }}</h2>
          </div>

          <div class="roadmap-grid">
            <article
              v-for="item in ROADMAP.currentFocus.items"
              :key="item.title"
              class="roadmap-card"
            >
              <span :class="['roadmap-status', item.statusType]">
                {{ item.status }}
              </span>

              <h3>{{ item.title }}</h3>

              <p v-html="item.text"></p>
            </article>
          </div>
        </div>
      </section>

      <div class="roadmap-sep"></div>

      <!-- PHASES -->
      <section class="roadmap-section">
        <div class="container">
          <div class="roadmap-section-head">
            <h2>{{ ROADMAP.phases.title }}</h2>
          </div>

          <div class="roadmap-timeline">
            <article
              v-for="item in ROADMAP.phases.items"
              :key="item.title"
              class="roadmap-phase"
            >
              <div class="roadmap-phase-marker">
                <span></span>
              </div>

              <div class="roadmap-phase-content">
                <p class="roadmap-phase-label">{{ item.phase }}</p>
                <h3>{{ item.title }}</h3>
                <p>{{ item.text }}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

<div class="roadmap-sep"></div>

<!-- MAIN TRACKS -->
<section v-if="ROADMAP.tracks" class="roadmap-section">
  <div class="container">
    <div class="roadmap-section-head">
      <h2>{{ ROADMAP.tracks.title }}</h2>
    </div>

    <div class="roadmap-grid roadmap-grid-3">
      <article
        v-for="item in ROADMAP.tracks.items"
        :key="item.title"
        class="roadmap-card compact"
      >
        <h3>{{ item.title }}</h3>
        <p>{{ item.text }}</p>
      </article>
    </div>
  </div>
</section>

<div class="roadmap-sep"></div>

<!-- MODULE ECOSYSTEM -->
<section v-if="ROADMAP.modules" class="roadmap-section">
  <div class="container">
    <div class="roadmap-section-head">
      <h2>{{ ROADMAP.modules.title }}</h2>
      <p class="roadmap-section-subtitle">
        {{ ROADMAP.modules.text }}
      </p>
    </div>

    <div class="roadmap-module-grid">
      <article
        v-for="group in ROADMAP.modules.groups"
        :key="group.title"
        class="roadmap-module-card"
      >
        <h3>{{ group.title }}</h3>

        <div class="roadmap-module-tags">
          <span
            v-for="item in group.items"
            :key="item"
            class="roadmap-module-tag"
          >
            {{ item }}
          </span>
        </div>
      </article>
    </div>
  </div>
</section>

<div class="roadmap-sep"></div>

<!-- DOCS ROADMAP -->
<section v-if="ROADMAP.docs" class="roadmap-section">
  <div class="container">
    <div class="roadmap-section-head">
      <h2>{{ ROADMAP.docs.title }}</h2>
    </div>

    <div class="roadmap-grid">
      <article
        v-for="item in ROADMAP.docs.items"
        :key="item.title"
        class="roadmap-card"
      >
        <span :class="['roadmap-status', item.statusType]">
          {{ item.status }}
        </span>

        <h3>{{ item.title }}</h3>

        <p>{{ item.text }}</p>
      </article>
    </div>
  </div>
</section>

      <div class="roadmap-sep"></div>

      <!-- LONG TERM -->
      <section class="roadmap-section">
        <div class="container roadmap-longterm">
          <div>
            <h2>{{ ROADMAP.longTerm.title }}</h2>
            <p>
              The long-term goal is not only to wrap C++ with a CLI, but to
              create a stronger developer foundation for native applications.
            </p>
          </div>

          <ul class="roadmap-list">
            <li v-for="item in ROADMAP.longTerm.items" :key="item">
              {{ item }}
            </li>
          </ul>
        </div>
      </section>

      <div class="roadmap-sep"></div>

      <!-- CTA -->
      <section class="roadmap-cta">
        <div class="container roadmap-cta-inner">
          <div>
            <h2>{{ ROADMAP.cta.title }}</h2>
            <p>{{ ROADMAP.cta.text }}</p>
          </div>

          <div class="roadmap-cta-actions">
            <a
              class="btn primary"
              :href="ROADMAP.cta.primary.href"
              target="_blank"
              rel="noreferrer"
            >
              {{ ROADMAP.cta.primary.label }}
            </a>

            <a
              class="btn secondary"
              :href="ROADMAP.cta.secondary.href"
              target="_blank"
              rel="noreferrer"
            >
              {{ ROADMAP.cta.secondary.label }}
            </a>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.roadmap-page {
  width: 100%;
  padding-top: var(--hdr-h, 72px);
  overflow: hidden;
}

.roadmap-loading {
  padding: 96px 0;
}

.roadmap-loading h2 {
  margin: 0 0 10px;
}

.roadmap-loading p {
  margin: 0;
  color: var(--muted);
}

/* HERO */
.roadmap-hero {
  position: relative;
  padding: 96px 0 72px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.18), transparent 34%),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.12), transparent 38%);
}

.roadmap-hero-inner {
  max-width: 860px;
}

.roadmap-eyebrow {
  margin: 0 0 18px;
  color: var(--accent, #22c55e);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.roadmap-hero h1 {
  max-width: 780px;
  margin: 0;
  font-size: clamp(2.6rem, 7vw, 5.6rem);
  line-height: 0.95;
  letter-spacing: -0.075em;
  color: var(--text, #f1f5f9);
}

.roadmap-hero-text {
  max-width: 720px;
  margin: 28px 0 0;
  color: var(--muted, rgba(203, 213, 225, 0.72));
  font-size: clamp(1rem, 1.5vw, 1.15rem);
  line-height: 1.8;
}

.roadmap-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.roadmap-badge {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.07);
  color: #a7f3d0;
  font-size: 0.78rem;
  font-weight: 700;
}

/* SECTIONS */
.roadmap-section {
  padding: 72px 0;
}

.roadmap-section-head {
  max-width: 720px;
  margin-bottom: 28px;
}

.roadmap-section h2,
.roadmap-longterm h2,
.roadmap-cta h2 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.roadmap-sep {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(148, 163, 184, 0.16),
    transparent
  );
}

/* CARDS */
.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.roadmap-card {
  position: relative;
  min-height: 220px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.015)),
    rgba(2, 13, 10, 0.72);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.24);
  overflow: hidden;
}

.roadmap-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, rgba(34, 197, 94, 0.12), transparent 34%);
  pointer-events: none;
}

.roadmap-card h3 {
  position: relative;
  margin: 18px 0 10px;
  font-size: 1.15rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.roadmap-card p {
  position: relative;
  margin: 0;
  color: var(--muted, rgba(203, 213, 225, 0.72));
  line-height: 1.7;
}

.roadmap-card :deep(code) {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.14);
  border-radius: 7px;
  padding: 2px 6px;
}

.roadmap-status {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.74rem;
  font-weight: 800;
}

.roadmap-status.active {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.18);
}

.roadmap-status.planned {
  color: #fed7aa;
  background: rgba(249, 115, 22, 0.13);
  border: 1px solid rgba(249, 115, 22, 0.18);
}

/* TIMELINE */
.roadmap-timeline {
  display: grid;
  gap: 18px;
  max-width: 900px;
}

.roadmap-phase {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 18px;
}

.roadmap-phase-marker {
  position: relative;
  display: flex;
  justify-content: center;
}

.roadmap-phase-marker::after {
  content: "";
  position: absolute;
  top: 34px;
  bottom: -20px;
  width: 1px;
  background: rgba(34, 197, 94, 0.22);
}

.roadmap-phase:last-child .roadmap-phase-marker::after {
  display: none;
}

.roadmap-phase-marker span {
  width: 16px;
  height: 16px;
  margin-top: 18px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.1);
}

.roadmap-phase-content {
  padding: 22px 24px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.025);
}

.roadmap-phase-label {
  margin: 0 0 8px;
  color: #4ade80;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.roadmap-phase-content h3 {
  margin: 0 0 8px;
  font-size: 1.1rem;
}

.roadmap-phase-content p:last-child {
  margin: 0;
  color: var(--muted, rgba(203, 213, 225, 0.72));
  line-height: 1.7;
}

/* LONG TERM */
.roadmap-longterm {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(320px, 1.15fr);
  gap: 48px;
  align-items: start;
}

.roadmap-longterm p {
  margin: 16px 0 0;
  color: var(--muted, rgba(203, 213, 225, 0.72));
  line-height: 1.75;
}

.roadmap-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.roadmap-list li {
  position: relative;
  padding: 16px 18px 16px 46px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  color: rgba(226, 232, 240, 0.84);
  background: rgba(255, 255, 255, 0.025);
  line-height: 1.6;
}

.roadmap-list li::before {
  content: "";
  position: absolute;
  left: 18px;
  top: 22px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--accent, #22c55e);
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.1);
}

/* CTA */
.roadmap-cta {
  padding: 72px 0 96px;
}

.roadmap-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding-top: 36px;
  padding-bottom: 36px;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: 26px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 36%),
    rgba(255, 255, 255, 0.025);
}

.roadmap-cta p {
  max-width: 680px;
  margin: 14px 0 0;
  color: var(--muted, rgba(203, 213, 225, 0.72));
  line-height: 1.75;
}

.roadmap-cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .roadmap-hero {
    padding: 76px 0 56px;
  }

  .roadmap-section {
    padding: 56px 0;
  }

  .roadmap-grid {
    grid-template-columns: 1fr;
  }

  .roadmap-longterm {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .roadmap-cta-inner {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .roadmap-hero h1 {
    letter-spacing: -0.055em;
  }

  .roadmap-card {
    min-height: auto;
    padding: 20px;
  }

  .roadmap-phase {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 12px;
  }

  .roadmap-phase-content {
    padding: 18px;
  }

  .roadmap-cta {
    padding-bottom: 72px;
  }

  .roadmap-cta-actions {
    width: 100%;
  }

  .roadmap-cta-actions .btn {
    width: 100%;
  }
}
.roadmap-status.stable {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.14);
  border: 1px solid rgba(34, 197, 94, 0.2);
}
</style>
