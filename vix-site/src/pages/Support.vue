<template>
  <div class="support-page">

    <!-- Hero -->
    <div class="sp-hero">
      <div class="sp-hero-inner">
        <div class="sp-tag">
          <span class="sp-tag-dot"></span>
          Independent & open source
        </div>
        <h1 class="sp-h1">{{ data.hero.title }}</h1>
        <p class="sp-sub">{{ data.hero.subtitle }}</p>
        <p class="sp-note">{{ data.hero.note }}</p>

        <!-- Stats row -->
        <div class="sp-stats">
          <div v-for="s in data.stats" :key="s.label" class="sp-stat">
            <span class="sp-stat-val">{{ s.value }}</span>
            <span class="sp-stat-label">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sp-body">
      <div class="sp-body-inner">

        <!-- Impact tiers -->
        <section class="sp-section">
          <h2 class="sp-h2">What your support makes possible</h2>
          <p class="sp-section-sub">Every amount has a direct, concrete impact on what Vix can do.</p>
          <div class="sp-impact-grid">
            <div v-for="item in data.impact" :key="item.amount" class="sp-impact-card">
              <div class="sp-impact-amount">{{ item.amount }}</div>
              <div class="sp-impact-label">{{ item.label }}</div>
              <div class="sp-impact-desc">{{ item.desc }}</div>
            </div>
          </div>
        </section>

        <div class="sp-sep"></div>

        <!-- Why it matters -->
        <section class="sp-section">
          <h2 class="sp-h2">Why support matters</h2>
          <p class="sp-section-sub">Vix has no corporate backing, no investors, and no ad revenue. Everything depends on the community.</p>
          <ul class="sp-why-list">
            <li v-for="item in data.why" :key="item" class="sp-why-item">
              <span class="sp-why-dot"></span>
              {{ item }}
            </li>
          </ul>
        </section>

        <div class="sp-sep"></div>

        <!-- Real usage -->
        <section class="sp-section" v-if="data.realUsage">
          <h2 class="sp-h2">{{ data.realUsage.title }}</h2>
          <p class="sp-section-sub">{{ data.realUsage.subtitle }}</p>
          <div class="sp-projects">
            <div v-for="p in data.realUsage.projects" :key="p.name" class="sp-project-card">
              <div class="sp-project-top">
                <span class="sp-project-name">{{ p.name }}</span>
                <span class="sp-project-tag">{{ p.tag }}</span>
              </div>
              <p class="sp-project-desc">{{ p.desc }}</p>
            </div>
          </div>
        </section>

        <div class="sp-sep"></div>

        <!-- International (crypto) -->
        <section class="sp-section">
          <h2 class="sp-h2">Support from anywhere</h2>
          <p class="sp-section-sub">Crypto contributions work globally, instantly, and with no fees or intermediaries.</p>

          <div class="sp-methods">
            <article v-for="method in data.international" :key="method.type" class="sp-method">
              <div class="sp-method-top">
                <div>
                  <div class="sp-method-label">{{ method.label }}</div>
                  <div class="sp-method-network">{{ method.network }}</div>
                </div>
                <span class="sp-method-badge">Crypto</span>
              </div>

              <div class="sp-method-address">
                <code class="sp-method-value">{{ method.value }}</code>
                <button
                  type="button"
                  class="sp-copy-btn"
                  @click="copy(method.value, method.type)"
                >
                  <svg v-if="copied !== method.type" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </button>
              </div>

              <div v-if="method.qr" class="sp-method-qr">
                <canvas :ref="(el) => setQRRef(method.type, el)"></canvas>
                <span class="sp-qr-label">Scan to send</span>
              </div>
            </article>
          </div>
        </section>

        <div class="sp-sep"></div>

        <!-- Mobile Money -->
        <section class="sp-section">
          <h2 class="sp-h2">Support via Mobile Money</h2>
          <p class="sp-section-sub">East Africa and nearby regions — send directly via mobile payment.</p>

          <div class="sp-local-methods">
            <article v-for="method in data.local" :key="method.type" class="sp-method sp-method-local">
              <div class="sp-method-top">
                <div>
                  <div class="sp-method-label">{{ method.label }}</div>
                  <div v-if="method.note" class="sp-method-network">{{ method.note }}</div>
                </div>
                <span class="sp-method-badge sp-method-badge-local">Mobile</span>
              </div>

              <div class="sp-method-address">
                <code class="sp-method-value">{{ method.value }}</code>
                <button
                  type="button"
                  class="sp-copy-btn"
                  @click="copy(method.value, method.type || 'local')"
                >
                  <svg v-if="copied !== (method.type || 'local')" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </button>
              </div>
            </article>
          </div>
        </section>

        <div class="sp-sep"></div>

        <!-- Social proof -->
        <section class="sp-section" v-if="data.socialProof">
          <h2 class="sp-h2">{{ data.socialProof.title }}</h2>
          <p class="sp-section-sub">{{ data.socialProof.subtitle }}</p>
          <div class="sp-empty-card">
            <div class="sp-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <p class="sp-empty-label">{{ data.socialProof.emptyLabel }}</p>
            <p class="sp-empty-note">{{ data.socialProof.emptyNote }}</p>
          </div>
        </section>

        <div class="sp-sep"></div>

        <!-- Principles -->
        <section class="sp-section">
          <h2 class="sp-h2">Principles</h2>
          <p class="sp-section-sub">What support does — and does not — change about Vix.</p>
          <ul class="sp-principles">
            <li v-for="item in data.principles" :key="item" class="sp-principle">
              <span class="sp-principle-check">✓</span>
              {{ item }}
            </li>
          </ul>
        </section>

        <div class="sp-sep"></div>

        <!-- FAQ -->
        <section class="sp-section" v-if="data.faq?.length">
          <h2 class="sp-h2">Common questions</h2>
          <div class="sp-faq">
            <details
              v-for="item in data.faq"
              :key="item.q"
              class="sp-faq-item"
            >
              <summary class="sp-faq-q">{{ item.q }}</summary>
              <p class="sp-faq-a">{{ item.a }}</p>
            </details>
          </div>
        </section>

        <!-- Footnote -->
        <footer class="sp-footnote">
          <p>{{ data.footnote }}</p>
        </footer>

      </div>
    </div>

  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
import QRCode from "qrcode";
import { SUPPORT_DATA } from "@/data/support";

const data = SUPPORT_DATA;
const qrRefs = reactive({});
const copied = ref("");

function setQRRef(type, el) {
  if (el) qrRefs[type] = el;
}

async function copy(value, type) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
  }
  copied.value = type;
  setTimeout(() => { if (copied.value === type) copied.value = ""; }, 1400);
}

onMounted(() => {
  if (!Array.isArray(data.international)) return;
  data.international.forEach((method) => {
    if (method.qr && method.type && qrRefs[method.type]) {
      QRCode.toCanvas(qrRefs[method.type], method.value, {
        width: 128,
        margin: 1,
        color: { dark: "#ffffff", light: "#020d0a" },
      });
    }
  });
});
</script>

<style scoped>
/* ===================== PAGE ===================== */
.support-page {
  min-height: 100vh;
}

/* ===================== HERO ===================== */
.sp-hero {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 56px 0 48px;
}

.sp-hero-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 1.5rem;
  text-align: center;
}

.sp-tag {
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

.sp-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.sp-h1 {
  margin: 0 0 16px;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
}

.sp-sub {
  margin: 0 0 10px;
  font-size: 1.05rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.7;
  max-width: 58ch;
  margin-left: auto;
  margin-right: auto;
}

.sp-note {
  margin: 0 0 36px;
  font-size: 0.8rem;
  color: rgba(34, 197, 94, 0.7);
  font-weight: 600;
  letter-spacing: 0.03em;
}

/* Stats */
.sp-stats {
  display: flex;
  gap: 0;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.4);
}

.sp-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  gap: 4px;
}

.sp-stat:last-child {
  border-right: none;
}

.sp-stat-val {
  font-size: 1.2rem;
  font-weight: 800;
  color: #22c55e;
  letter-spacing: -0.02em;
  line-height: 1;
}

.sp-stat-label {
  font-size: 0.72rem;
  color: rgba(148, 163, 184, 0.55);
  text-align: center;
  line-height: 1.3;
}

/* ===================== BODY ===================== */
.sp-body {
  padding: 56px 0 80px;
}

.sp-body-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.sp-sep {
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.12), transparent);
  margin: 48px 0;
}

/* ===================== SECTIONS ===================== */
.sp-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sp-h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #e2e8f0;
  line-height: 1.25;
}

.sp-section-sub {
  margin: -4px 0 0;
  font-size: 0.9rem;
  color: rgba(203, 213, 225, 0.6);
  line-height: 1.65;
  max-width: 65ch;
}

/* ===================== IMPACT ===================== */
.sp-impact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.sp-impact-card {
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s ease;
}

.sp-impact-card:hover {
  border-color: rgba(34, 197, 94, 0.2);
}

.sp-impact-amount {
  font-size: 1.5rem;
  font-weight: 800;
  color: #22c55e;
  letter-spacing: -0.03em;
  line-height: 1;
}

.sp-impact-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.4;
}

.sp-impact-desc {
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.6;
}

/* ===================== WHY ===================== */
.sp-why-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-why-item {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.9rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.6;
}

.sp-why-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
  margin-top: 0.5em;
}

/* ===================== REAL USAGE ===================== */
.sp-projects {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-project-card {
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-project-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sp-project-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
}

.sp-project-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.2);
  white-space: nowrap;
}

.sp-project-desc {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.6);
  line-height: 1.65;
}

/* ===================== METHODS (CRYPTO) ===================== */
.sp-methods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.sp-method {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sp-method-top {
  display: flex;
  min-width: 0;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.sp-method-top > div {
  min-width: 0;
}

.sp-method-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #e2e8f0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-method-network {
  font-size: 0.72rem;
  color: rgba(148, 163, 184, 0.5);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-method-badge {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.2);
  white-space: nowrap;
  flex-shrink: 0;
}

.sp-method-badge-local {
  background: rgba(245, 158, 11, 0.1);
  color: #fbbf24;
  border-color: rgba(245, 158, 11, 0.2);
}

.sp-method-address {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  padding: 8px 10px;
}

.sp-method-value {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.72rem;
  color: rgba(203, 213, 225, 0.8);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sp-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: 6px;
  color: #4ade80;
  cursor: pointer;
  transition: background 0.13s ease, transform 0.12s ease;
}

.sp-copy-btn svg {
  width: 12px;
  height: 12px;
}

.sp-copy-btn:hover {
  background: rgba(34, 197, 94, 0.16);
  transform: translateY(-1px);
}

.sp-method-qr {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sp-method-qr canvas {
  width: min(128px, 100%);
  height: auto;
  display: block;
  border-radius: 8px;
}

.sp-qr-label {
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.45);
}
/* ===================== LOCAL ===================== */
.sp-local-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sp-method-local {
  max-width: 480px;
}

/* ===================== SOCIAL PROOF ===================== */
.sp-empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 36px 24px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.3);
  gap: 10px;
}

.sp-empty-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(148, 163, 184, 0.06);
  border: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(148, 163, 184, 0.4);
}

.sp-empty-icon svg {
  width: 18px;
  height: 18px;
}

.sp-empty-label {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(203, 213, 225, 0.6);
}

.sp-empty-note {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(148, 163, 184, 0.45);
  line-height: 1.6;
  max-width: 44ch;
}

/* ===================== PRINCIPLES ===================== */
.sp-principles {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp-principle {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.88rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.6;
}

.sp-principle-check {
  color: #22c55e;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* ===================== FAQ ===================== */
.sp-faq {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sp-faq-item {
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(2, 6, 23, 0.4);
  transition: border-color 0.14s ease;
}

.sp-faq-item[open] {
  border-color: rgba(34, 197, 94, 0.18);
}

.sp-faq-q {
  list-style: none;
  padding: 14px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  user-select: none;
  transition: color 0.14s ease;
}

.sp-faq-q::-webkit-details-marker {
  display: none;
}

.sp-faq-q::after {
  content: "+";
  font-size: 1.1rem;
  color: #22c55e;
  flex-shrink: 0;
  font-weight: 300;
  line-height: 1;
  transition: transform 0.18s ease;
}

.sp-faq-item[open] .sp-faq-q::after {
  transform: rotate(45deg);
}

.sp-faq-q:hover {
  color: #f1f5f9;
}

.sp-faq-a {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 0.85rem;
  color: rgba(203, 213, 225, 0.62);
  line-height: 1.7;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
  padding-top: 12px;
}

/* ===================== FOOTNOTE ===================== */
.sp-footnote {
  margin-top: 48px;
  padding: 20px 24px;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.04);
  border: 1px solid rgba(34, 197, 94, 0.1);
}

.sp-footnote p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.7;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 900px) {
  .sp-methods {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .sp-hero {
    padding: 40px 0 36px;
  }

  .sp-body {
    padding: 36px 0 56px;
  }

  .sp-body-inner,
  .sp-hero-inner {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .sp-impact-grid {
    grid-template-columns: 1fr;
  }

  .sp-methods {
    grid-template-columns: 1fr;
  }

  .sp-stats {
    flex-wrap: wrap;
  }

  .sp-stat {
    flex: 1 1 40%;
  }

  .sp-stat:nth-child(2) {
    border-right: none;
  }

  .sp-stat:nth-child(3) {
    border-top: 1px solid rgba(148, 163, 184, 0.1);
  }

  .sp-stat:nth-child(4) {
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    border-right: none;
  }

  .sp-sep {
    margin: 32px 0;
  }

  .sp-method-local {
    max-width: none;
  }
  .sp-footnote {
    margin-top: 32px;
  }
}

@media (max-width: 480px) {
  .sp-impact-card {
    padding: 14px 16px;
  }

  .sp-method {
    padding: 14px;
  }

  .sp-method-top {
    gap: 10px;
  }

  .sp-method-label {
    font-size: 0.86rem;
  }

  .sp-method-address {
    padding: 7px 8px;
  }

  .sp-method-value {
    font-size: 0.68rem;
  }
}
</style>
