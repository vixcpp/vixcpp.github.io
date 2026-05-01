<template>
  <div class="install-page">

    <!-- Hero -->
    <div class="install-hero">
      <div class="install-hero-inner">
        <div class="install-tag">
          <span class="install-tag-dot"></span>
          Vix.cpp — Installation
        </div>
        <h1 class="install-h1">{{ d.title }}</h1>
        <p class="install-sub">{{ d.subtitle }}</p>
        <div class="install-hero-links">
          <a
            v-for="(item, key) in externalLinks"
            :key="key"
            class="install-hero-link"
            :href="item.href"
            target="_blank"
            rel="noreferrer"
          >{{ item.label }}</a>
        </div>
      </div>
    </div>

    <!-- Body: sidebar + sections -->
    <div class="install-body">
      <div class="install-body-inner">

        <!-- Sidebar nav -->
        <aside class="install-sidebar">
          <nav class="install-sidenav">
            <span class="install-sidenav-label">On this page</span>
            <a
              v-for="s in d.sections"
              :key="s.id"
              :href="`#${s.id}`"
              class="install-sidenav-link"
              :class="{ active: activeId === s.id }"
            >{{ s.title }}</a>
          </nav>
        </aside>

        <!-- Sections -->
        <main class="install-content">
          <section
            v-for="s in d.sections"
            :key="s.id"
            :id="s.id"
            class="install-section"
          >
            <h2 class="install-h2">{{ s.title }}</h2>
            <p v-if="s.desc" class="install-desc">{{ s.desc }}</p>

            <ul v-if="s.bullets?.length" class="install-bullets">
              <li v-for="(b, i) in s.bullets" :key="i" class="install-bullet">
                {{ b }}
              </li>
            </ul>

            <div v-if="s.code" class="install-code-wrap code-card">
              <div class="code-head install-code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">{{ codeLabel(s) }}</span>
                </div>
                <button
                  type="button"
                  class="install-copy"
                  @click="copyCode(s.id, s.code)"
                  :aria-label="copiedId === s.id ? 'Copied' : 'Copy'"
                >
                  <svg v-if="copiedId !== s.id" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                </button>
              </div>
              <div class="code-body install-code-body">
                <pre class="code-pre install-code-pre"><code>{{ s.code }}</code></pre>
              </div>
            </div>

            <p v-if="s.note" class="install-note">
              <span class="install-note-icon">i</span>
              {{ s.note }}
            </p>
          </section>
        </main>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { INSTALL as d } from "@/data/install";

const copiedId = ref(null);

async function copyCode(id, code) {
  try {
    await navigator.clipboard.writeText(code);
    copiedId.value = id;
    setTimeout(() => { copiedId.value = null; }, 1500);
  } catch {}
}

function codeLabel(s) {
  if (s.id === "linux_mac") return "bash";
  if (s.id === "windows") return "powershell";
  if (s.id === "cli_only") return "bash";
  if (s.id === "verify") return "bash";
  if (s.id === "path_fix") return "bash";
  if (s.id === "build_from_source") return "bash";
  if (s.id === "quickstart") return "bash";
  if (s.id === "more_help") return "url";
  if (s.id === "common_issue") return "error";
  return "terminal";
}

const externalLinks = computed(() => {
  const e = d.external;
  return [
    e.docsHref    && { label: e.docsLabel,     href: e.docsHref },
    e.releasesHref && { label: e.releasesLabel, href: e.releasesHref },
    e.sourceHref  && { label: e.sourceLabel,    href: e.sourceHref },
    e.issuesHref  && { label: e.issuesLabel,    href: e.issuesHref },
  ].filter(Boolean);
});

/* Active section tracking */
const activeId = ref(d.sections[0]?.id || "");

let observer = null;
onMounted(() => {
  const ids = d.sections.map(s => s.id);
  const targets = ids.map(id => document.getElementById(id)).filter(Boolean);

  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          activeId.value = e.target.id;
          break;
        }
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
  );

  targets.forEach(el => observer.observe(el));
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<style scoped>
.main {
    padding-top: 56px !important;
}
/* ===================== PAGE ===================== */
.install-page {
  min-height: 100vh;
}

/* ===================== HERO ===================== */
.install-hero {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  padding: 56px 0 48px;
}

.install-hero-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.install-tag {
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

.install-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.install-h1 {
  margin: 0 0 14px;
  font-size: clamp(1.9rem, 3vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
}

.install-sub {
  margin: 0 0 24px;
  font-size: 1rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.65;
  max-width: 58ch;
}

.install-hero-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.install-hero-link {
  display: inline-flex;
  align-items: center;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(203, 213, 225, 0.75);
  text-decoration: none;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.03);
  transition: color 0.14s ease, background 0.14s ease, border-color 0.14s ease;
}

.install-hero-link:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(148, 163, 184, 0.28);
}

/* ===================== BODY ===================== */
.install-body {
  padding: 48px 0 80px;
}

.install-body-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 56px;
  align-items: start;
}

/* ===================== SIDEBAR ===================== */
.install-sidebar {
  position: sticky;
  top: calc(var(--hdr-h, 60px) + 24px);
}

.install-sidenav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.install-sidenav-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.4);
  padding: 0 8px;
  margin-bottom: 6px;
}

.install-sidenav-link {
  display: block;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.55);
  text-decoration: none;
  border-left: 2px solid transparent;
  transition: color 0.14s ease, border-color 0.14s ease, background 0.14s ease;
  line-height: 1.4;
}

.install-sidenav-link:hover {
  color: rgba(203, 213, 225, 0.85);
  background: rgba(255, 255, 255, 0.03);
}

.install-sidenav-link.active {
  color: #4ade80;
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

/* ===================== CONTENT ===================== */
.install-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.install-section {
  padding: 32px 0 36px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.install-section:first-child {
  padding-top: 0;
}

.install-section:last-child {
  border-bottom: none;
}

.install-h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #e2e8f0;
  line-height: 1.3;
}

.install-desc {
  margin: 0 0 16px;
  font-size: 0.92rem;
  color: rgba(203, 213, 225, 0.65);
  line-height: 1.65;
  max-width: 72ch;
}

/* ===================== BULLETS ===================== */
.install-bullets {
  margin: 0 0 16px;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.install-bullet {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 0.88rem;
  color: rgba(203, 213, 225, 0.7);
  line-height: 1.6;
}

.install-bullet::before {
  content: "";
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
  margin-top: 0.5em;
}

/* ===================== CODE BLOCK ===================== */
.install-code-wrap {
  margin: 0 0 0;
}

.install-code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.install-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: 7px;
  color: #4ade80;
  cursor: pointer;
  transition: background 0.14s ease, transform 0.12s ease;
}

.install-copy svg {
  width: 13px;
  height: 13px;
}

.install-copy:hover {
  background: rgba(34, 197, 94, 0.16);
  transform: translateY(-1px);
}

.install-code-body {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.install-code-pre {
  margin: 0;
  padding: 16px 18px;
  white-space: pre;
  width: max-content;
  min-width: 100%;
  font-size: 0.85rem;
  line-height: 1.7;
}

/* ===================== NOTE ===================== */
.install-note {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.04);
  border: 1px solid rgba(34, 197, 94, 0.12);
  font-size: 0.82rem;
  color: rgba(203, 213, 225, 0.62);
  line-height: 1.6;
}

.install-note-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #4ade80;
  font-size: 0.65rem;
  font-weight: 800;
  font-style: italic;
  flex-shrink: 0;
  margin-top: 1px;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 860px) {
  .install-body-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .install-sidebar {
    position: static;
    /* sidebar devient une nav horizontale scrollable */
  }

  .install-sidenav {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .install-sidenav-label {
    width: 100%;
    margin-bottom: 2px;
  }

  .install-sidenav-link {
    border-left: none;
    border-bottom: 2px solid transparent;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 0.78rem;
    white-space: nowrap;
  }

  .install-sidenav-link.active {
    border-left-color: transparent;
    border-bottom-color: #22c55e;
  }
}

@media (max-width: 600px) {
  .install-hero {
    padding: 40px 0 36px;
  }

  .install-body {
    padding: 32px 0 56px;
  }

  .install-h1 {
    font-size: 1.8rem;
  }

  .install-section {
    padding: 24px 0 28px;
  }
}

</style>
