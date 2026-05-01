<template>
  <div class="faq-page">

    <!-- Hero -->
    <div class="faq-hero">
      <div class="faq-hero-inner">
        <div class="faq-tag">
          <span class="faq-tag-dot"></span>
          Frequently asked questions
        </div>
        <h1 class="faq-h1">{{ d.hero.title }}</h1>
        <p class="faq-sub">{{ d.hero.subtitle }}</p>
      </div>
    </div>

    <div class="faq-body">
      <div class="faq-body-inner">

        <!-- Category nav -->
        <aside class="faq-sidebar">
          <nav class="faq-nav">
            <span class="faq-nav-label">Categories</span>
            <a
              v-for="cat in d.categories"
              :key="cat.id"
              :href="`#${cat.id}`"
              class="faq-nav-link"
              :class="{ active: activeCategory === cat.id }"
              @click.prevent="scrollTo(cat.id)"
            >
              {{ cat.label }}
              <span class="faq-nav-count">{{ cat.questions.length }}</span>
            </a>
          </nav>
        </aside>

        <!-- Questions -->
        <main class="faq-content">
          <div
            v-for="cat in d.categories"
            :key="cat.id"
            :id="cat.id"
            class="faq-category"
          >
            <div class="faq-category-head">
              <h2 class="faq-h2">{{ cat.label }}</h2>
              <span class="faq-category-count">{{ cat.questions.length }} questions</span>
            </div>

            <div class="faq-questions">
              <details
                v-for="item in cat.questions"
                :key="item.q"
                class="faq-item"
                @toggle="onToggle($event, cat.id + item.q)"
              >
                <summary class="faq-q">
                  <span class="faq-q-text">{{ item.q }}</span>
                  <span class="faq-q-icon" aria-hidden="true"></span>
                </summary>

                <div class="faq-a-wrap">
                  <p class="faq-a">{{ item.a }}</p>

                  <div v-if="item.code" class="faq-code code-card">
                    <div class="code-head">
                      <div class="head-left">
                        <span class="dot dot-red"></span>
                        <span class="dot dot-yellow"></span>
                        <span class="dot dot-green"></span>
                      </div>
                      <button
                        type="button"
                        class="faq-copy"
                        @click.stop="copy(cat.id + item.q, item.code)"
                        :aria-label="copiedKey === cat.id + item.q ? 'Copied' : 'Copy'"
                      >
                        <svg v-if="copiedKey !== cat.id + item.q" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="code-body faq-code-body">
                      <pre class="code-pre faq-code-pre"><code>{{ item.code }}</code></pre>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          <!-- Footer CTA -->
          <div class="faq-footer-cta">
            <div class="faq-footer-cta-left">
              <div class="faq-footer-cta-title">Still have questions?</div>
              <p class="faq-footer-cta-desc">Open an issue or start a discussion on GitHub. The community and maintainers are active.</p>
            </div>
            <div class="faq-footer-cta-actions">
              <a href="https://github.com/vixcpp/vix/discussions" target="_blank" rel="noreferrer" class="faq-cta-link">
                GitHub Discussions
                <svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </a>
              <a href="https://github.com/vixcpp/vix/issues" target="_blank" rel="noreferrer" class="faq-cta-link faq-cta-secondary">
                Open an issue
              </a>
            </div>
          </div>

        </main>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { FAQ_DATA as d } from "../../data/faq";

const copiedKey = ref(null);
const activeCategory = ref(d.categories[0]?.id || "");

async function copy(key, code) {
  try { await navigator.clipboard.writeText(code); } catch {}
  copiedKey.value = key;
  setTimeout(() => { copiedKey.value = null; }, 1400);
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: "smooth" });
}

function onToggle(e, key) {
  // no-op — details handles itself
}

let observer = null;
onMounted(() => {
  const targets = d.categories
    .map(c => document.getElementById(c.id))
    .filter(Boolean);

  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          activeCategory.value = e.target.id;
          break;
        }
      }
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
  );

  targets.forEach(el => observer.observe(el));
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.faq-page { min-height: 100vh; }

/* ===================== HERO ===================== */
.faq-hero {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 56px 0 48px;
}

.faq-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.faq-tag {
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

.faq-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.faq-h1 {
  margin: 0 0 14px;
  font-size: clamp(2rem, 3.5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
}

.faq-sub {
  margin: 0;
  font-size: 1rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.7;
  max-width: 58ch;
}

/* ===================== BODY ===================== */
.faq-body { padding: 48px 0 80px; }

.faq-body-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 56px;
  align-items: start;
}

/* ===================== SIDEBAR ===================== */
.faq-sidebar {
  position: sticky;
  top: calc(var(--hdr-h, 60px) + 24px);
}

.faq-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.faq-nav-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.4);
  padding: 0 8px;
  margin-bottom: 6px;
}

.faq-nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  font-size: 0.83rem;
  color: rgba(203, 213, 225, 0.55);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 0.13s ease, background 0.13s ease, border-color 0.13s ease;
  cursor: pointer;
}

.faq-nav-link:hover {
  color: rgba(203, 213, 225, 0.85);
  background: rgba(255, 255, 255, 0.03);
}

.faq-nav-link.active {
  color: #4ade80;
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.faq-nav-count {
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.35);
  background: rgba(148, 163, 184, 0.07);
  padding: 1px 6px;
  border-radius: 999px;
  flex-shrink: 0;
}

.faq-nav-link.active .faq-nav-count {
  color: rgba(34, 197, 94, 0.6);
  background: rgba(34, 197, 94, 0.08);
}

/* ===================== CONTENT ===================== */
.faq-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

/* ===================== CATEGORY ===================== */
.faq-category { display: flex; flex-direction: column; gap: 6px; }

.faq-category-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.faq-h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #e2e8f0;
}

.faq-category-count {
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.4);
}

/* ===================== QUESTIONS ===================== */
.faq-questions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.faq-item {
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 10px;
  background: rgba(2, 6, 23, 0.4);
  overflow: hidden;
  transition: border-color 0.14s ease;
}

.faq-item[open] {
  border-color: rgba(34, 197, 94, 0.18);
  background: rgba(2, 6, 23, 0.55);
}

.faq-q {
  list-style: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s ease;
}

.faq-q::-webkit-details-marker { display: none; }

.faq-q:hover {
  background: rgba(255, 255, 255, 0.02);
}

.faq-q-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e2e8f0;
  line-height: 1.4;
  flex: 1;
}

.faq-item[open] .faq-q-text {
  color: #f1f5f9;
}

.faq-q-icon {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.07);
  border: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  transition: background 0.13s ease, border-color 0.13s ease;
}

.faq-q-icon::before,
.faq-q-icon::after {
  content: "";
  position: absolute;
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
  transition: transform 0.18s ease, opacity 0.18s ease, background 0.13s ease;
}

/* horizontal bar */
.faq-q-icon::before {
  width: 8px;
  height: 1.5px;
}

/* vertical bar */
.faq-q-icon::after {
  width: 1.5px;
  height: 8px;
}

.faq-item[open] .faq-q-icon {
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.2);
}

.faq-item[open] .faq-q-icon::before,
.faq-item[open] .faq-q-icon::after {
  background: #22c55e;
}

.faq-item[open] .faq-q-icon::after {
  transform: rotate(90deg);
  opacity: 0;
}

/* ===================== ANSWER ===================== */
.faq-a-wrap {
  padding: 0 16px 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.07);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.faq-a {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(203, 213, 225, 0.65);
  line-height: 1.75;
}

/* ===================== CODE IN FAQ ===================== */
.faq-code {
  /* inherits code-card from global */
}

.faq-code-body {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.faq-code-pre {
  margin: 0;
  padding: 12px 16px;
  white-space: pre;
  font-size: 0.8rem;
  line-height: 1.65;
  width: max-content;
  min-width: 100%;
}

.faq-copy {
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

.faq-copy svg { width: 12px; height: 12px; }
.faq-copy:hover { background: rgba(34, 197, 94, 0.16); transform: translateY(-1px); }

/* ===================== FOOTER CTA ===================== */
.faq-footer-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 28px;
  border-radius: 12px;
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.1);
  flex-wrap: wrap;
}

.faq-footer-cta-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 4px;
}

.faq-footer-cta-desc {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.55);
  line-height: 1.6;
  max-width: 48ch;
}

.faq-footer-cta-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.faq-cta-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.83rem;
  font-weight: 600;
  text-decoration: none;
  background: #22c55e;
  color: #021a10;
  transition: background 0.13s ease;
}

.faq-cta-link svg { width: 14px; height: 14px; transition: transform 0.13s ease; }
.faq-cta-link:hover { background: #4ade80; }
.faq-cta-link:hover svg { transform: translateX(2px); }

.faq-cta-secondary {
  background: transparent;
  color: rgba(203, 213, 225, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.faq-cta-secondary:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #e2e8f0;
  border-color: rgba(148, 163, 184, 0.28);
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 860px) {
  .faq-body-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .faq-sidebar {
    position: static;
  }

  .faq-nav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .faq-nav-label {
    width: 100%;
    margin-bottom: 2px;
  }

  .faq-nav-link {
    border-left: none;
    border-bottom: 2px solid transparent;
    border-radius: 7px;
    padding: 5px 10px;
    font-size: 0.78rem;
  }

  .faq-nav-link.active {
    border-left-color: transparent;
    border-bottom-color: #22c55e;
  }
}

@media (max-width: 600px) {
  .faq-hero { padding: 40px 0 36px; }
  .faq-body { padding: 32px 0 56px; }

  .faq-footer-cta {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px;
  }

  .faq-footer-cta-actions {
    width: 100%;
  }

  .faq-cta-link {
    flex: 1;
    justify-content: center;
  }
}
</style>
