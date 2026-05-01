<template>
  <div class="cm-page">

    <!-- Hero -->
    <div class="cm-hero">
      <div class="cm-hero-inner">
        <div class="cm-tag">
          <span class="cm-tag-dot"></span>
          Open source community
        </div>
        <h1 class="cm-h1">{{ d.hero.title }}</h1>
        <p class="cm-sub">{{ d.hero.subtitle }}</p>
        <div class="cm-pills">
          <span v-for="p in d.hero.pills" :key="p" class="cm-pill">{{ p }}</span>
        </div>
      </div>
    </div>

    <div class="cm-body">
      <div class="cm-body-inner">

        <!-- Links + Contribute -->
        <div class="cm-top-grid">

          <!-- Links -->
          <section class="cm-card">
            <div class="cm-card-head">
              <h2 class="cm-h2">{{ d.links.title }}</h2>
              <p class="cm-card-sub">{{ d.links.subtitle }}</p>
            </div>

            <div class="cm-links">
              <a
                v-for="item in d.links.items"
                :key="item.href"
                :href="item.href"
                target="_blank"
                rel="noreferrer"
                class="cm-link-item"
                :class="{ 'cm-link-primary': item.primary }"
              >
                <span class="cm-link-icon" :class="`cm-icon-${item.icon}`">
                  <svg v-if="item.icon === 'github'" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
                  <svg v-else-if="item.icon === 'issue'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <svg v-else-if="item.icon === 'discussion'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <svg v-else-if="item.icon === 'release'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <svg v-else-if="item.icon === 'docs'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </span>
                <span class="cm-link-text">
                  <span class="cm-link-label">{{ item.label }}</span>
                  <span class="cm-link-desc">{{ item.desc }}</span>
                </span>
                <svg class="cm-link-arrow" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>

            <div class="cm-meta">
              <div v-for="m in d.links.meta" :key="m.key" class="cm-meta-item">
                <span class="cm-meta-k">{{ m.key }}</span>
                <span class="cm-meta-v">{{ m.value }}</span>
              </div>
            </div>
          </section>

          <!-- Contribute -->
          <section class="cm-card">
            <div class="cm-card-head">
              <h2 class="cm-h2">{{ d.contribute.title }}</h2>
              <p class="cm-card-sub">{{ d.contribute.subtitle }}</p>
            </div>

            <ol class="cm-steps">
              <li v-for="step in d.contribute.steps" :key="step.n" class="cm-step">
                <span class="cm-step-n">{{ step.n }}</span>
                <div class="cm-step-body">
                  <div class="cm-step-title">{{ step.title }}</div>
                  <div class="cm-step-desc">{{ step.desc }}</div>
                </div>
              </li>
            </ol>

            <div class="cm-contribute-note">
              <svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.75" fill="currentColor"/></svg>
              {{ d.contribute.note }}
            </div>
          </section>

        </div>

        <div class="cm-sep"></div>

        <!-- First contributions -->
        <section class="cm-section">
          <div class="cm-section-head">
            <h2 class="cm-h2">{{ d.firstContributions.title }}</h2>
            <p class="cm-section-sub">{{ d.firstContributions.subtitle }}</p>
          </div>

          <div class="cm-fc-grid">
            <a
              v-for="item in d.firstContributions.items"
              :key="item.title"
              :href="item.href"
              target="_blank"
              rel="noreferrer"
              class="cm-fc-card"
            >
              <div class="cm-fc-top">
                <span class="cm-fc-title">{{ item.title }}</span>
                <span class="cm-fc-tag" :class="`cm-tag-${item.tagKind}`">{{ item.tag }}</span>
              </div>
              <p class="cm-fc-desc">{{ item.desc }}</p>
            </a>
          </div>
        </section>

        <div class="cm-sep"></div>

        <!-- Values -->
        <section class="cm-section">
          <div class="cm-section-head">
            <h2 class="cm-h2">{{ d.values.title }}</h2>
          </div>

          <div class="cm-values-grid">
            <div v-for="v in d.values.items" :key="v.title" class="cm-value-card">
              <div class="cm-value-title">{{ v.title }}</div>
              <p class="cm-value-desc">{{ v.desc }}</p>
            </div>
          </div>
        </section>

        <div class="cm-sep"></div>

        <!-- Code of conduct -->
        <section class="cm-section">
          <div class="cm-section-head">
            <h2 class="cm-h2">{{ d.codeOfConduct.title }}</h2>
          </div>
          <ul class="cm-conduct-list">
            <li v-for="item in d.codeOfConduct.items" :key="item" class="cm-conduct-item">
              <span class="cm-conduct-dot"></span>
              {{ item }}
            </li>
          </ul>
        </section>

      </div>
    </div>

  </div>
</template>

<script setup>
import { COMMUNITY_DATA as d } from "../data/community";
</script>

<style scoped>
/* ===================== PAGE ===================== */
.cm-page {
  min-height: 100vh;
}

/* ===================== HERO ===================== */
.cm-hero {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 56px 0 48px;
}

.cm-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.cm-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.73rem;
  color: #4ade80;
  margin-bottom: 20px;
}

.cm-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.cm-h1 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
}

.cm-sub {
  margin: 0 0 24px;
  font-size: 1rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.7;
  max-width: 64ch;
}

.cm-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cm-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: rgba(167, 243, 208, 0.75);
  border: 1px solid rgba(34, 197, 94, 0.18);
  background: rgba(34, 197, 94, 0.06);
  white-space: nowrap;
}

/* ===================== BODY ===================== */
.cm-body {
  padding: 56px 0 80px;
}

.cm-body-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.cm-sep {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.12), transparent);
  margin: 48px 0;
}

/* ===================== TOP GRID ===================== */
.cm-top-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

/* ===================== CARD ===================== */
.cm-card {
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cm-card-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #e2e8f0;
  line-height: 1.3;
}

.cm-card-sub {
  margin: 0;
  font-size: 0.83rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.65;
}

/* ===================== LINKS ===================== */
.cm-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cm-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1px solid transparent;
  text-decoration: none;
  transition: background 0.13s ease, border-color 0.13s ease;
  background: transparent;
}

.cm-link-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(148, 163, 184, 0.12);
}

.cm-link-primary {
  background: rgba(34, 197, 94, 0.06);
  border-color: rgba(34, 197, 94, 0.16);
}

.cm-link-primary:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.24);
}

.cm-link-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: rgba(148, 163, 184, 0.6);
}

.cm-link-primary .cm-link-icon {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.cm-link-icon svg {
  width: 14px;
  height: 14px;
}

.cm-link-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cm-link-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.3;
}

.cm-link-primary .cm-link-label {
  color: #4ade80;
}

.cm-link-desc {
  font-size: 0.76rem;
  color: rgba(148, 163, 184, 0.5);
  line-height: 1.4;
}

.cm-link-arrow {
  width: 16px;
  height: 16px;
  color: rgba(148, 163, 184, 0.3);
  flex-shrink: 0;
  transition: color 0.13s ease, transform 0.13s ease;
}

.cm-link-item:hover .cm-link-arrow {
  color: rgba(148, 163, 184, 0.6);
  transform: translateX(2px);
}

/* Meta row */
.cm-meta {
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cm-meta-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.cm-meta-k {
  font-size: 0.8rem;
  color: rgba(148, 163, 184, 0.5);
}

.cm-meta-v {
  font-size: 0.8rem;
  font-weight: 600;
  color: #e2e8f0;
  white-space: nowrap;
}

/* ===================== STEPS ===================== */
.cm-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: border-color 0.13s ease;
}

.cm-step:hover {
  border-color: rgba(34, 197, 94, 0.16);
}

.cm-step-n {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  color: #021a10;
  background: #22c55e;
  flex-shrink: 0;
  margin-top: 1px;
}

.cm-step-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cm-step-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.3;
}

.cm-step-desc {
  font-size: 0.8rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.6;
}

.cm-contribute-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.04);
  border: 1px solid rgba(34, 197, 94, 0.1);
  font-size: 0.8rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.6;
}

.cm-contribute-note svg {
  width: 14px;
  height: 14px;
  color: #22c55e;
  flex-shrink: 0;
  margin-top: 2px;
}

/* ===================== SECTIONS ===================== */
.cm-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cm-section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cm-section-sub {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(203, 213, 225, 0.6);
  line-height: 1.65;
  max-width: 66ch;
}

/* ===================== FIRST CONTRIBUTIONS ===================== */
.cm-fc-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cm-fc-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 16px 18px;
  text-decoration: none;
  transition: border-color 0.14s ease, background 0.14s ease;
}

.cm-fc-card:hover {
  border-color: rgba(34, 197, 94, 0.2);
  background: rgba(2, 6, 23, 0.7);
}

.cm-fc-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cm-fc-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: #e2e8f0;
}

.cm-fc-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.cm-tag-green  { background: rgba(34,197,94,0.1);   color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.cm-tag-blue   { background: rgba(56,189,248,0.1);  color: #7dd3fc; border: 1px solid rgba(56,189,248,0.2); }
.cm-tag-amber  { background: rgba(251,191,36,0.1);  color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }
.cm-tag-purple { background: rgba(167,139,250,0.1); color: #c4b5fd; border: 1px solid rgba(167,139,250,0.2); }
.cm-tag-red    { background: rgba(248,113,113,0.1); color: #fca5a5; border: 1px solid rgba(248,113,113,0.2); }

.cm-fc-desc {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.65;
}

/* ===================== VALUES ===================== */
.cm-values-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.cm-value-card {
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.14s ease;
}

.cm-value-card:hover {
  border-color: rgba(34, 197, 94, 0.16);
}

.cm-value-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e2e8f0;
}

.cm-value-desc {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.65;
}

/* ===================== CONDUCT ===================== */
.cm-conduct-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cm-conduct-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.9rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.65;
}

.cm-conduct-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
  margin-top: 0.5em;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 900px) {
  .cm-top-grid {
    grid-template-columns: 1fr;
  }

  .cm-fc-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cm-values-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .cm-hero {
    padding: 40px 0 36px;
  }

  .cm-body {
    padding: 36px 0 56px;
  }

  .cm-fc-grid {
    grid-template-columns: 1fr;
  }

  .cm-sep {
    margin: 32px 0;
  }

  .cm-card {
    padding: 18px;
  }
}
</style>
