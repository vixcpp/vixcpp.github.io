<template>
  <div class="rl-page">

    <!-- Hero -->
    <div class="rl-hero">
      <div class="rl-hero-inner">
        <div class="rl-tag">
          <span class="rl-tag-dot"></span>
          Semantic versioning
        </div>
        <h1 class="rl-h1">{{ d.hero.title }}</h1>
        <p class="rl-sub">{{ d.hero.subtitle }}</p>

        <div class="rl-current">
          <div class="rl-current-left">
            <span class="rl-current-version">v{{ d.hero.current.version }}</span>
            <span class="rl-current-label">{{ d.hero.current.label }}</span>
          </div>
          <a :href="d.hero.current.href" target="_blank" rel="noreferrer" class="rl-current-link">
            View on GitHub
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    </div>

    <div class="rl-body">
      <div class="rl-body-inner">

        <!-- Versioning tiers -->
        <section class="rl-section">
          <div class="rl-section-head">
            <h2 class="rl-h2">{{ d.versioning.title }}</h2>
            <p class="rl-section-sub">{{ d.versioning.subtitle }}</p>
          </div>

          <div class="rl-tiers">
            <div
              v-for="tier in d.versioning.tiers"
              :key="tier.type"
              class="rl-tier"
              :class="`rl-tier-${tier.color}`"
            >
              <div class="rl-tier-head">
                <div class="rl-tier-left">
                  <span class="rl-tier-type">{{ tier.type }}</span>
                  <span class="rl-tier-example">{{ tier.example }}</span>
                </div>
                <span class="rl-tier-safe" :class="tier.safe ? 'rl-safe-yes' : 'rl-safe-no'">
                  {{ tier.safe ? 'Safe to upgrade' : 'Read migration notes' }}
                </span>
              </div>
              <p class="rl-tier-desc">{{ tier.desc }}</p>
              <ul class="rl-tier-items">
                <li v-for="item in tier.items" :key="item" class="rl-tier-item">
                  <span class="rl-tier-dot"></span>{{ item }}
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div class="rl-sep"></div>

        <!-- Stability rules -->
        <section class="rl-section">
          <div class="rl-section-head">
            <h2 class="rl-h2">{{ d.stability.title }}</h2>
            <p class="rl-section-sub">{{ d.stability.subtitle }}</p>
          </div>

          <div class="rl-rules">
            <div v-for="rule in d.stability.rules" :key="rule.title" class="rl-rule">
              <div class="rl-rule-icon">
                <svg viewBox="0 0 16 16" fill="none"><path d="M13 4L6.5 11 3 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div class="rl-rule-body">
                <div class="rl-rule-title">{{ rule.title }}</div>
                <p class="rl-rule-desc">{{ rule.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <div class="rl-sep"></div>

        <!-- Cadence -->
        <section class="rl-section">
          <div class="rl-section-head">
            <h2 class="rl-h2">{{ d.cadence.title }}</h2>
            <p class="rl-section-sub">{{ d.cadence.subtitle }}</p>
          </div>

          <div class="rl-cadence">
            <div v-for="item in d.cadence.items" :key="item.label" class="rl-cadence-item">
              <div class="rl-cadence-label">{{ item.label }}</div>
              <div class="rl-cadence-value">{{ item.value }}</div>
              <p class="rl-cadence-desc">{{ item.desc }}</p>
            </div>
          </div>
        </section>

        <div class="rl-sep"></div>

        <!-- Changelog -->
        <section class="rl-section">
          <div class="rl-section-head">
            <h2 class="rl-h2">{{ d.changelog.title }}</h2>
            <p class="rl-section-sub">{{ d.changelog.subtitle }}</p>
          </div>

          <div class="rl-changelog">
            <div
              v-for="entry in d.changelog.entries"
              :key="entry.version"
              class="rl-entry"
            >
              <div class="rl-entry-head">
                <div class="rl-entry-meta">
                  <span class="rl-entry-version">v{{ entry.version }}</span>
                  <span class="rl-entry-date">{{ entry.date }}</span>
                </div>
                <span class="rl-entry-kind" :class="`rl-kind-${entry.kind}`">{{ entry.kind }}</span>
              </div>
              <ul class="rl-entry-items">
                <li v-for="h in entry.highlights" :key="h" class="rl-entry-item">
                  <span class="rl-entry-dot"></span>{{ h }}
                </li>
              </ul>
            </div>
          </div>

          <a :href="d.changelog.cta.href" target="_blank" rel="noreferrer" class="rl-changelog-cta">
            {{ d.changelog.cta.label }}
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </section>

        <div class="rl-sep"></div>

        <!-- Upgrade -->
        <section class="rl-section">
          <div class="rl-section-head">
            <h2 class="rl-h2">{{ d.upgrade.title }}</h2>
            <p class="rl-section-sub">{{ d.upgrade.subtitle }}</p>
          </div>

          <div class="rl-upgrade-steps">
            <div v-for="step in d.upgrade.steps" :key="step.label" class="rl-upgrade-step">
              <div class="rl-upgrade-label">{{ step.label }}</div>
              <div class="rl-upgrade-code code-card">
                <div class="code-head">
                  <div class="head-left">
                    <span class="dot dot-red"></span>
                    <span class="dot dot-yellow"></span>
                    <span class="dot dot-green"></span>
                  </div>
                  <button
                    type="button"
                    class="rl-copy"
                    @click="copy(step.label, step.code)"
                  >
                    <svg v-if="copiedKey !== step.label" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </button>
                </div>
                <div class="code-body rl-code-body">
                  <pre class="code-pre rl-code-pre"><code>{{ step.code }}</code></pre>
                </div>
              </div>
            </div>
          </div>

          <div class="rl-upgrade-note">
            <svg viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM8 5v3.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="11" r="0.75" fill="currentColor"/></svg>
            {{ d.upgrade.note }}
          </div>
        </section>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from "vue";
import { RELEASES_DATA as d } from "../../data/releases";

const copiedKey = ref(null);

async function copy(key, code) {
  try {
    await navigator.clipboard.writeText(code);
  } catch {}

  copiedKey.value = key;

  setTimeout(() => {
    copiedKey.value = null;
  }, 1400);
}
</script>

<style scoped>
.rl-page { min-height: 100vh; }

/* ===================== HERO ===================== */
.rl-hero {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 56px 0 48px;
}

.rl-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.rl-tag {
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

.rl-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.rl-h1 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
}

.rl-sub {
  margin: 0 0 28px;
  font-size: 1rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.7;
  max-width: 60ch;
}

.rl-current {
  display: inline-flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.rl-current-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rl-current-version {
  font-size: 1.1rem;
  font-weight: 800;
  color: #22c55e;
  letter-spacing: -0.02em;
  font-family: "JetBrains Mono", ui-monospace, monospace;
}

.rl-current-label {
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.5);
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.16);
  color: rgba(167, 243, 208, 0.6);
}

.rl-current-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.6);
  text-decoration: none;
  border-left: 1px solid rgba(148, 163, 184, 0.14);
  padding-left: 16px;
  transition: color 0.14s ease;
}

.rl-current-link svg {
  width: 14px;
  height: 14px;
  transition: transform 0.13s ease;
}

.rl-current-link:hover {
  color: #e2e8f0;
}

.rl-current-link:hover svg {
  transform: translateX(2px);
}

/* ===================== BODY ===================== */
.rl-body { padding: 56px 0 80px; }

.rl-body-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.rl-sep {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.12), transparent);
  margin: 48px 0;
}

.rl-section { display: flex; flex-direction: column; gap: 24px; }

.rl-section-head { display: flex; flex-direction: column; gap: 6px; }

.rl-h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #e2e8f0;
}

.rl-section-sub {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(203, 213, 225, 0.6);
  line-height: 1.65;
  max-width: 66ch;
}

/* ===================== TIERS ===================== */
.rl-tiers {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.rl-tier {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(2, 6, 23, 0.5);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rl-tier-green { border-color: rgba(34, 197, 94, 0.18); }
.rl-tier-blue  { border-color: rgba(56, 189, 248, 0.16); }
.rl-tier-amber { border-color: rgba(251, 191, 36, 0.16); }

.rl-tier-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.rl-tier-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.rl-tier-type {
  font-size: 1rem;
  font-weight: 800;
  color: #e2e8f0;
  letter-spacing: -0.01em;
}

.rl-tier-green .rl-tier-type { color: #4ade80; }
.rl-tier-blue  .rl-tier-type { color: #7dd3fc; }
.rl-tier-amber .rl-tier-type { color: #fbbf24; }

.rl-tier-example {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.72rem;
  color: rgba(148, 163, 184, 0.45);
}

.rl-tier-safe {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}

.rl-safe-yes {
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.rl-safe-no {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.rl-tier-desc {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.6);
  line-height: 1.65;
}

.rl-tier-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  padding-top: 12px;
}

.rl-tier-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.5;
}

.rl-tier-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.4);
  flex-shrink: 0;
  margin-top: 0.45em;
}

/* ===================== RULES ===================== */
.rl-rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rl-rule {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.08);
  transition: border-color 0.14s ease;
}

.rl-rule:hover {
  border-color: rgba(34, 197, 94, 0.16);
}

.rl-rule-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #22c55e;
  margin-top: 1px;
}

.rl-rule-icon svg { width: 13px; height: 13px; }

.rl-rule-body { display: flex; flex-direction: column; gap: 4px; }

.rl-rule-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.3;
}

.rl-rule-desc {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.65;
}

/* ===================== CADENCE ===================== */
.rl-cadence {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.rl-cadence-item {
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rl-cadence-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.45);
}

.rl-cadence-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #22c55e;
  line-height: 1.2;
}

.rl-cadence-desc {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.52);
  line-height: 1.6;
}

/* ===================== CHANGELOG ===================== */
.rl-changelog {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.45);
}

.rl-entry {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.07);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rl-entry:last-child { border-bottom: none; }

.rl-entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.rl-entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rl-entry-version {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
}

.rl-entry-date {
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.4);
}

.rl-entry-kind {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 9px;
  border-radius: 999px;
}

.rl-kind-minor { background: rgba(56,189,248,0.1); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.2); }
.rl-kind-patch { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.rl-kind-major { background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.2); }

.rl-entry-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rl-entry-item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 0.83rem;
  color: rgba(203, 213, 225, 0.62);
  line-height: 1.6;
}

.rl-entry-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.5);
  flex-shrink: 0;
  margin-top: 0.5em;
}

.rl-changelog-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #22c55e;
  text-decoration: none;
  margin-top: 4px;
  transition: color 0.13s ease;
}

.rl-changelog-cta svg { width: 14px; height: 14px; transition: transform 0.13s ease; }
.rl-changelog-cta:hover { color: #4ade80; }
.rl-changelog-cta:hover svg { transform: translateX(2px); }

/* ===================== UPGRADE ===================== */
.rl-upgrade-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rl-upgrade-step {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rl-upgrade-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(203, 213, 225, 0.55);
  padding-left: 2px;
}

.rl-code-body { overflow-x: auto; -webkit-overflow-scrolling: touch; }

.rl-code-pre {
  margin: 0;
  padding: 12px 16px;
  white-space: nowrap;
  font-size: 0.85rem;
  line-height: 1.6;
  width: max-content;
  min-width: 100%;
}

.rl-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: 6px;
  color: #4ade80;
  cursor: pointer;
  transition: background 0.13s ease, transform 0.12s ease;
}

.rl-copy svg { width: 12px; height: 12px; }
.rl-copy:hover { background: rgba(34, 197, 94, 0.16); transform: translateY(-1px); }

.rl-upgrade-note {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.04);
  border: 1px solid rgba(34, 197, 94, 0.1);
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.58);
  line-height: 1.6;
  margin-top: 4px;
}

.rl-upgrade-note svg { width: 14px; height: 14px; color: #22c55e; flex-shrink: 0; margin-top: 2px; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 900px) {
  .rl-tiers { grid-template-columns: 1fr; }
  .rl-cadence { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .rl-hero { padding: 40px 0 36px; }
  .rl-body { padding: 36px 0 56px; }
  .rl-sep { margin: 32px 0; }
  .rl-current { flex-direction: column; align-items: flex-start; gap: 12px; }
  .rl-current-link { border-left: none; padding-left: 0; border-top: 1px solid rgba(148, 163, 184, 0.14); padding-top: 12px; width: 100%; }
  .rl-cadence { grid-template-columns: 1fr; }
  .rl-entry { padding: 16px; }
}
</style>
