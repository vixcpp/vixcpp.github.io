<script setup>
import * as HomeData from "@/data/home";
import { ref, onMounted } from "vue";

import Hero from "@/components/Hero.vue";
import Section from "@/components/Section.vue";
import CodeBlock from "@/components/CodeBlock.vue";
import SignalsGrid from "@/components/SignalsGrid.vue";
import BatteriesIncluded from "@/components/BatteriesIncluded.vue";

import { getInitialGithubStats, refreshGithubStats } from "@/lib/githubStats";

const HOME =
  HomeData?.HOME ??
  HomeData?.default ??
  HomeData?.default?.HOME ??
  HomeData?.default?.default ??
  null;

const github = ref(null);
const activePlatform = ref("unix");
const copied = ref(false);

function copyCommand() {
  const cmd = HOME?.install?.commands?.[activePlatform.value];
  if (!cmd) return;

  navigator.clipboard.writeText(cmd);
  copied.value = true;

  setTimeout(() => {
    copied.value = false;
  }, 1500);
}

onMounted(async () => {
  github.value = await getInitialGithubStats();
  const updated = await refreshGithubStats({ timeoutMs: 1200 });
  if (updated) github.value = updated;

  const platform = navigator.platform.toLowerCase();
  activePlatform.value = platform.includes("win") ? "windows" : "unix";
});
</script>

<template>
  <div class="page">
    <div v-if="!HOME" class="container loading">
      <h2 class="loading-title">Loading…</h2>
      <p class="loading-sub">
        HOME is null. Check export in <code>@/data/home</code>.
      </p>
    </div>

    <template v-else>

      <!-- ===================== HERO ===================== -->

      <Hero
        v-if="HOME.hero"
        :title="HOME.hero.title"
        :subtitle="HOME.hero.subtitle"
        :ctas="HOME.hero.ctas"
        :badges="HOME.hero.badges"
        :examples="HOME.hero.examples"
        :support="HOME.hero.support"
      />

      <div class="section-sep hero-sep"></div>

       <!-- ===================== INSTALL ===================== -->
      <section class="install">
        <div class="container install-inner">

          <h2 class="install-title">
            {{ HOME.install.title }}
            <span class="install-version">{{ HOME.install.version }}</span>
          </h2>
          <p class="install-note">{{ HOME.install.note }}</p>

          <div class="install-card code-card">
            <div class="code-head install-head">
              <div class="head-left">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="head-title">install</span>
              </div>
              <button
                type="button"
                class="install-copy-btn"
                @click="copyCommand"
                :aria-label="installCopied ? 'Copied' : 'Copy command'"
              >
                <svg v-if="!installCopied" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </button>
            </div>

            <div class="install-tabs-wrap">
              <div class="install-tabs">
                <button
                  type="button"
                  :class="['install-tab', { active: activePlatform === 'unix' }]"
                  @click="activePlatform = 'unix'"
                >macOS / Linux</button>
                <button
                  type="button"
                  :class="['install-tab', { active: activePlatform === 'windows' }]"
                  @click="activePlatform = 'windows'"
                >Windows</button>
              </div>
            </div>

            <div class="code-body install-code-body">
              <pre class="code-pre install-code-pre"><code>{{ HOME.install.commands?.[activePlatform] || '' }}</code></pre>
            </div>
          </div>

        </div>
      </section>

      <div class="section-sep"></div>

      <!-- ===================== SHOWCASE ===================== -->
      <section v-if="HOME.showcase" class="vix-showcase">
        <div class="container vix-showcase-header">
          <h2 class="vix-showcase-heading">{{ HOME.showcase.heading }}</h2>
          <p class="vix-showcase-subheading">{{ HOME.showcase.subheading }}</p>
        </div>

        <div class="container vix-showcase-inner">
          <div class="vix-showcase-visual">
            <div class="code-card vix-code-editor-card">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">{{ HOME.showcase.visual.fileName }}</span>
                </div>
              </div>

              <div class="code-body">
                <pre class="code-pre"><code v-html="HOME.showcase.visual.code"></code></pre>
              </div>
            </div>

            <div class="vix-terminal-card">
              <div class="vix-terminal-head">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>

              <div class="vix-terminal-body">
                <pre><code v-html="HOME.showcase.visual.terminal"></code></pre>
              </div>
            </div>
          </div>

          <div class="vix-showcase-content">
            <h3 class="vix-showcase-title">
              {{ HOME.showcase.content.title }}
              <span class="vix-badge vix-badge-cpp">{{ HOME.showcase.content.badge }}</span>
            </h3>

            <p class="vix-showcase-text">{{ HOME.showcase.content.text }}</p>

            <a :href="HOME.showcase.content.cta.to" class="vix-showcase-btn">
              {{ HOME.showcase.content.cta.label }}
              <span class="vix-showcase-btn-arrow">›</span>
            </a>
          </div>
        </div>
      </section>

     <div class="section-sep"></div>

     <!-- ===================== REGISTRY ===================== -->

      <section v-if="HOME.registry" class="registry">
        <div class="container registry-layout">
          <div class="registry-left">
            <h2 class="registry-title">{{ HOME.registry.title }}</h2>
            <p class="registry-subtitle">{{ HOME.registry.subtitle }}</p>

            <div class="registry-cta" v-if="HOME.registry.ctas?.length">
              <a
                v-for="cta in HOME.registry.ctas"
                :key="cta.label"
                :href="cta.href || cta.to"
                :class="['btn', cta.kind]"
                :target="cta.external ? '_blank' : null"
                :rel="cta.external ? 'noreferrer' : null"
              >
                {{ cta.label }}
              </a>
            </div>
          </div>

          <div class="registry-right">
            <div class="registry-card">
              <div class="registry-head">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="registry-head-title">
                  {{ HOME.registry.preview?.title || "registry" }}
                </span>
              </div>

              <div class="registry-body">
                <pre class="registry-pre"><code class="registry-code">{{ HOME.registry.preview?.code || "" }}</code></pre>
                <p v-if="HOME.registry.note" class="registry-note">
                  {{ HOME.registry.note }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="section-sep"></div>

      <!-- ===================== REGISTRY SHOWCASE ===================== -->

      <section v-if="HOME.registryShowcase" class="registry-showcase">
        <div class="container registry-showcase-inner">

          <!-- LEFT -->
          <div class="registry-showcase-content">
            <h2 class="registry-showcase-title">
              {{ HOME.registryShowcase.title }}
              <span class="registry-badge">{{ HOME.registryShowcase.badge }}</span>
            </h2>

            <p class="registry-showcase-text">
              {{ HOME.registryShowcase.text }}
            </p>

            <a
              :href="HOME.registryShowcase.cta.to"
              class="registry-showcase-btn"
            >
              {{ HOME.registryShowcase.cta.label }}
              <span class="registry-showcase-btn-arrow">›</span>
            </a>
          </div>

          <!-- RIGHT -->
          <div class="registry-showcase-visual">

            <!-- TOP CARD -->
            <div class="code-card registry-code-card registry-code-card-top">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">
                    {{ HOME.registryShowcase.cards.top.fileName }}
                  </span>
                </div>
              </div>

              <div class="code-body">
                <pre class="code-pre">
                  <code v-html="HOME.registryShowcase.cards.top.code"></code>
                </pre>
              </div>
            </div>

            <!-- BOTTOM CARD -->
            <div class="code-card registry-code-card registry-code-card-bottom">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">
                    {{ HOME.registryShowcase.cards.bottom.fileName }}
                  </span>
                </div>
              </div>

              <div class="code-body">
                <pre class="code-pre">
                  <code v-html="HOME.registryShowcase.cards.bottom.code"></code>
                </pre>
              </div>
            </div>

          </div>
        </div>
      </section>


      <div v-if="HOME.templateEngine" class="section-sep"></div>

      <!-- ===================== TEMPLATE ENGINE ===================== -->
      <section v-if="HOME.templateEngine" class="template-engine">
        <div class="container template-engine-inner">
          <div class="template-engine-content">
            <span class="template-engine-badge">
              {{ HOME.templateEngine.badge }}
            </span>

            <h2 class="template-engine-title">
              {{ HOME.templateEngine.title }}
            </h2>

            <p class="template-engine-subtitle">
              {{ HOME.templateEngine.subtitle }}
            </p>

            <a
              class="template-engine-btn"
              :href="HOME.templateEngine.cta.to"
              target="_blank"
              rel="noreferrer"
            >
              {{ HOME.templateEngine.cta.label }}
              <span>›</span>
            </a>
          </div>

          <div class="template-engine-visual">
            <div class="code-card template-code-card template-card-top">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">
                    {{ HOME.templateEngine.cards.template.fileName }}
                  </span>
                </div>
              </div>

              <div class="code-body template-code-body">
                <pre class="code-pre template-code-pre"><code v-html="HOME.templateEngine.cards.template.code"></code></pre>
              </div>
            </div>

            <div class="code-card template-code-card template-card-bottom">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">
                    {{ HOME.templateEngine.cards.cpp.fileName }}
                  </span>
                </div>
              </div>

              <div class="code-body template-code-body">
                <pre class="code-pre template-code-pre"><code v-html="HOME.templateEngine.cards.cpp.code"></code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="HOME.registry" class="section-sep" style="margin-bottom: 10px;"></div>

       <!-- ===================== SIGNALS ===================== -->
      <section v-if="HOME.signals" class="signals">
        <div class="container signals-inner">
          <div class="signals-left">
            <h2 class="section-title">{{ HOME.signals.title }}</h2>
            <p class="section-subtitle">{{ HOME.signals.subtitle }}</p>
          </div>
          <div class="signals-right">
            <SignalsGrid :items="HOME.signals.items || []" :github="github" />
          </div>
        </div>
      </section>

      <div class="section-sep"></div>

      <!-- ===================== BATTERIES ===================== -->
      <BatteriesIncluded
        v-if="HOME.batteries"
        :title="HOME.batteries.title"
        :subtitle="HOME.batteries.subtitle"
        :items="HOME.batteries.items || []"
      />

      <div class="section-sep"></div>

      <!-- ===================== GET STARTED ===================== -->
      <section v-if="HOME.getStarted" class="get-started">
        <div class="container get-started-inner">
          <div class="get-started-left">
            <h2 class="section-title">{{ HOME.getStarted.title }}</h2>
            <p class="section-subtitle">{{ HOME.getStarted.subtitle }}</p>
            <div class="get-started-ctas" v-if="HOME.getStarted.ctas?.length">
              <a
                v-for="cta in HOME.getStarted.ctas"
                :key="cta.label"
                :href="cta.href || cta.to"
                :class="['btn', cta.kind]"
                :target="cta.external ? '_blank' : null"
                :rel="cta.external ? 'noreferrer' : null"
              >{{ cta.label }}</a>
            </div>
          </div>

          <div class="get-started-right">
            <div class="code-card">
              <div class="code-head">
                <div class="head-left">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                  <span class="head-title">terminal</span>
                </div>
              </div>
              <div class="code-body">
                <pre class="code-pre"><code>{{ HOME.getStarted.code }}</code></pre>
              </div>
              <div v-if="HOME.getStarted.note" class="code-foot">
                <p class="code-note">{{ HOME.getStarted.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="section-sep"></div>

      <!-- ===================== SUPPORT CTA ===================== -->
      <section class="support-cta">
        <div class="container support-cta-inner">
          <div>
            <h2 class="section-title">Support</h2>
            <p class="section-subtitle">
              Help keep Vix.cpp moving fast. Support the runtime, the tooling, and the growing ecosystem.
            </p>
          </div>
          <a class="btn primary" href="/support">Go to Support</a>
        </div>
      </section>

    </template>
  </div>
</template>


<style scoped>
.page {
  width: 100%;
  padding-top: var(--hdr-h);
}

.loading {
  padding: 56px 0;
  opacity: 0.85;
}

.loading-title {
  margin: 0 0 10px;
  font-size: 1.35rem;
  letter-spacing: -0.01em;
}

.loading-sub {
  margin: 0;
  opacity: 0.85;
}

.cta-row {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.signals {
  padding: 3.2rem 0;
}

.signals-layout {
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(260px, 420px);
  gap: 3rem;
  align-items: center;
}

.signals-left {
  padding-top: 0.2rem;
}

.signals-title {
  margin: 0;
  font-size: 2.35rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.signals-subtitle {
  margin: 0.95rem 0 0;
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.82;
}

.signals-right {
  width: 100%;
}

@media (max-width: 980px) {
  .signals-layout {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .signals-title {
    font-size: 1.9rem;
  }
}
.registry{
  padding: 4rem 0;
}

.section-sep{
  width: 100%;
  height: 1px;
  margin: 3.2rem 0;

  background: linear-gradient(
    to right,
    transparent,
    rgba(148,163,184,.18),
    transparent
  );
}

.registry-layout{
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(260px, 520px);
  gap: 3rem;
  align-items: center;
}

.registry-title{
  margin: 0;
  font-size: 2.2rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.registry-subtitle{
  margin: 0.95rem 0 0;
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.82;
}

.registry-cta{
  margin-top: 1.35rem;
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

/* Card style aligned with your code card language */
.registry-card{
  border-radius: 16px;
  border: 1px solid rgba(148,163,184,.16);
  background: linear-gradient(180deg, rgba(2,6,23,.55), rgba(2,6,23,.38));
  box-shadow: 0 18px 46px rgba(0,0,0,.35);
  overflow: hidden;
}

.registry-head{
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 10px 12px;
  background: linear-gradient(to bottom, rgba(2,6,23,.92), rgba(2,6,23,.72));
  border-bottom: 1px solid rgba(148,163,184,.14);
}

.dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.95;
}
.dot-red{ background:#fb923c; }
.dot-yellow{ background:#facc15; }
.dot-green{ background:#22c55e; }

.registry-head-title{
  margin-left: 0.35rem;
  font-size: 0.84rem;
  color: rgba(226,232,240,.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.registry-body{
  padding: 12px 12px 14px;
}

.registry-pre{
  margin: 0;
  white-space: pre;
  overflow: auto;
  max-width: 100%;
}

.registry-code{
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.86rem;
  line-height: 1.65;
  color: rgba(226,232,240,.9);
}

.registry-note{
  margin: 10px 0 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(226,232,240,.78);
}

@media (max-width: 980px){
  .registry-layout{
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .registry-title{
    font-size: 1.85rem;
  }
}

.install {
  padding: 32px 0 40px;
  background:
    radial-gradient(circle at top, rgba(34, 197, 94, 0.10), transparent 42%),
    linear-gradient(180deg, #031f1a 0%, #042a23 100%);
}

.install-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.install-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;

  font-size: clamp(1.4rem, 2.6vw, 2.2rem);

  font-weight: 800;
  letter-spacing: -0.02em;
  color: #ecfdf5;
}

.install-version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 10px;
  background: #22c55e;
  color: #03140f;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
}

.install-note {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.98rem;
  line-height: 1.6;
}

.install-card {
  width: 100%;
  max-width: 820px;
  margin-top: 28px;
  text-align: left;
}

/* Header */
.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.install-head-left {
  min-width: 0;
  flex: 1 1 auto;
}

.install-head .head-left {
  min-width: 0;
}

/* Copy button stays top-right */
.install-copy {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;

  width: 40px;
  height: 40px;
  padding: 0;

  border-radius: 12px;
  white-space: nowrap;
  align-self: center;

  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.install-copy svg {
  width: 16px;
  height: 16px;
}

.install-copy:hover {
  transform: translateY(-1px);
}

/* Tabs below header */
.install-tabs-wrap {
  padding: 12px 12px 0;
}

.install-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.install-tabs .tab {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
  white-space: nowrap;
}

/* Code */
.install-code-body {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.install-code-pre {
  margin: 0;
  padding: 14px;
  width: 100%;
  max-width: 100%;
  min-width: 0 !important;

  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.install-code-pre > code {
  display: block;
  width: 100%;
  min-width: 0;
}

/* Tablet */
@media (max-width: 900px) {
  .install-card {
    max-width: 100%;
  }

  .install-head {
    align-items: center;
    justify-content: space-between;
  }

  .install-copy {
    width: 40px;
    height: 40px;
  }
}

/* Mobile */
@media (max-width: 640px) {
  .install {
    padding: 56px 0 64px;
  }

  .install-title {
    flex-direction: column;
    gap: 10px;
  }

  .install-note {
    font-size: 0.92rem;
    max-width: 32rem;
  }

  .install-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .install-head-left {
    flex: 1 1 auto;
  }

  .install-copy {
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
  }

  .install-tabs {
    flex-direction: row;
    gap: 8px;
  }

  .install-tabs .tab {
    flex: 1 1 0;
    width: auto;
  }

  .install-code-pre {
    font-size: 0.82rem;
    line-height: 1.6;
    padding: 12px;
  }
}

/* Very small screens */
@media (max-width: 420px) {
  .install-tabs {
    flex-direction: column;
  }

  .install-tabs .tab {
    width: 100%;
  }
}

.install-card{
  max-width: 620px;
}

.install-copy{
  width: 40px !important;
  min-width: 40px;
  max-width: 40px;
  height: 40px;
  flex: 0 0 40px !important;
  align-self: center;
}

.install-head{
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.install-head-left{
  flex: 1 1 auto;
  min-width: 0;
}

.install-tabs{
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
}

.install-tabs .tab{
  flex: 1 1 0;
  width: auto !important;
  min-width: 0;
}

@media (max-width: 420px){
  .install-tabs{
    flex-direction: column !important;
  }

  .install-tabs .tab{
    width: 100% !important;
  }
}

.install-code-body{
  padding: 0;
}

.install-code-pre{
  padding: 10px 14px;
  line-height: 4;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

.install-card .code-body{
  min-height: auto;
  height: auto;
}

.install-tabs-wrap{
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 12px;
}

.install-tabs{
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
}

.install-tabs .tab{
  display: inline-flex;
  align-items: center;
  justify-content: center;

  padding: 6px 14px;
  font-size: 0.9rem;

  color: #cbd5e1;
  background: transparent;

  border: 1px solid rgba(148,163,184,.25);
  border-radius: 999px;

  cursor: pointer;
  white-space: nowrap;

  transition:
    background .15s ease,
    color .15s ease,
    border-color .15s ease,
    transform .12s ease;
}

/* hover */
.install-tabs .tab:hover{
  color: #ffffff;
  background: rgba(148,163,184,.08);
  transform: translateY(-1px);
}

/* actif */
.install-tabs .tab.active{
  color: #d1fae5;
  border-color: rgba(34,197,94,.35);
}

/* mobile */
@media (max-width: 640px){
  .install-tabs{
    flex-direction: row;
    justify-content: center;
  }
}

.install-tabs .tab.active{
  color: #22c55e;
  position: relative;
}

.install-tabs .tab.active::after{
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  border-radius: 2px;
}

.vix-showcase {
  padding: 96px 0;
  background: #f5f5f5;
}

.vix-showcase-inner {
  display: grid;
  grid-template-columns: minmax(320px, 1.15fr) minmax(280px, 0.85fr);
  gap: 72px;
  align-items: center;
}

.vix-showcase-visual {
  position: relative;
  min-height: 430px;
  width: 100%;
}

.vix-code-editor-card {
  position: relative;
  width: min(100%, 560px);
  z-index: 1;
}

.vix-code-editor-card .code-body {
  padding-bottom: 120px;
}

/* terminal desktop */
.vix-terminal-card {
  position: absolute;
  left: 48px;
  bottom: 26px;
  width: min(100%, 420px);
  background: #0b0f17;
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 45px rgba(0,0,0,.22);
  z-index: 3;
}

.vix-terminal-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #0f141b;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.vix-terminal-body {
  padding: 16px 18px 18px;
}

.vix-terminal-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.vix-terminal-body code {
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  color: #e6edf3;
  font-size: 0.88rem;
  line-height: 1.8;
}

.vix-terminal-green {
  color: #66e3a4;
}

/* tablette */
@media (max-width: 980px) {
  .vix-showcase {
    padding: 0;
  }

  .vix-showcase-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .vix-showcase-visual {
    min-height: 400px;
  }

  .vix-showcase-content {
    max-width: 100%;
    text-align: center;
  }

  .vix-showcase-text {
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* mobile */
@media (max-width: 720px) {
  .vix-showcase {
    padding: 64px 0;
  }

  .vix-showcase-inner {
    gap: 36px;
  }

  .vix-showcase-visual {
    min-height: auto;
  }

  .vix-code-editor-card {
    width: 100%;
  }

  .vix-code-editor-card .code-body {
    padding-bottom: 0;
  }

  .code-head {
    padding: 10px 10px;
  }

  .head-title {
    max-width: 42vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .code-pre {
    font-size: 0.8rem;
    min-width: 0;           /* important */
    width: max-content;
  }

  .code-body {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .vix-terminal-card {
    position: relative;     /* important */
    left: 0;
    bottom: 0;
    width: 100%;
    margin-top: 14px;
  }

  .vix-showcase-content {
    text-align: center;
    max-width: 100%;
  }

  .vix-showcase-title {
    font-size: 2rem;
  }

  .vix-badge {
    min-width: 54px;
    height: 48px;
    padding: 0 12px;
    border-radius: 9px;
  }

  .vix-showcase-text {
    font-size: 1rem;
  }

  .vix-showcase-btn {
    width: 100%;
    justify-content: center;
  }
}

.vix-showcase-title {
  margin: 0;
  color: #ecfdf5;

  font-size: clamp(1.4rem, 2.6vw, 2.2rem);

  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.vix-badge-cpp {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 96px;
  height: 58px;
  padding: 0 18px;
  margin-left: 8px;
  border-radius: 12px;

  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;

  font-size: 0.56em;
  font-weight: 800;
  letter-spacing: 0.02em;

  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.vix-showcase-btn {
  margin-top: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 16px 24px;
  border-radius: 999px;

  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  color: #022c22;

  font-size: 0.98rem;
  font-weight: 700;
  text-decoration: none;
  border: none;

  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.22);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.vix-showcase-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.32);
  filter: brightness(1.05);
}

.vix-showcase-btn-arrow {
  font-size: 1.15rem;
  font-weight: 800;
}

@media (max-width: 720px) {
  .vix-badge-cpp {
    min-width: 72px;
    height: 46px;
    padding: 0 12px;
    border-radius: 10px;
  }

  .vix-showcase-btn {
    width: 100%;
    padding: 15px 18px;
    font-size: 0.95rem;
  }
}

.vix-showcase-header {
  text-align: center;
  max-width: 860px;
  margin: 0 auto 72px;

  /* léger effet glass */
  backdrop-filter: blur(2px);
}

.vix-showcase-heading {
  margin: 0;
  font-size: clamp(2.4rem, 4.5vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: #ecfdf5;
}

.vix-showcase-subheading {
  margin: 20px 0 0;
  font-size: 1.15rem;
  line-height: 1.7;

  /* gris verdâtre, pas gris pur */
  color: rgba(236, 253, 245, 0.7);
}

@media (max-width: 720px) {
  .vix-showcase-header {
    margin-bottom: 48px;
    padding: 0 10px;
  }

  .vix-showcase-heading {
    font-size: 2rem;
  }

  .vix-showcase-subheading {
    font-size: 1rem;
  }
}

@media (max-width: 720px) {
  .vix-showcase-title {
    font-size: 1.5rem;
    line-height: 1.3;
  }
}

.registry-showcase {
  padding: 0;
  padding-bottom: 40px;
  background: transparent;
  overflow: hidden;
}

.registry-showcase-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.registry-showcase-content {
  max-width: 420px;
}

.registry-showcase-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.7rem, 2.5vw, 2.4rem);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.registry-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 14px;
  min-width: 102px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  color: #ecfdf5;
  font-size: 0.5em;
  font-weight: 800;
  vertical-align: middle;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.20);
}

.registry-showcase-text {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.78);
  font-size: 1.04rem;
  line-height: 1.7;
}

.registry-showcase-btn {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 22px;
  border-radius: 999px;
  background: #67f0a8;
  color: #052e16;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.registry-showcase-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.registry-showcase-btn-arrow {
  font-size: 1.15rem;
  line-height: 1;
}

.registry-showcase-visual {
  position: relative;
  width: 100%;
  min-height: 500px;
}

.registry-showcase-visual .registry-code-card {
  position: absolute;
  width: min(442px, 100%);
  max-width: 100%;
}

.registry-showcase-visual .registry-code-card-top {
  top: 0;
  left: 8%;
  z-index: 1;
}

.registry-showcase-visual .registry-code-card-bottom {
  top: 230px;
  left: 16%;
  z-index: 2;
}

.registry-showcase-visual .registry-code-card .code-body {
  padding: 10px 14px 12px !important;
  overflow-x: hidden;
}

.registry-showcase-visual .registry-code-card .code-pre {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  font-size: 0.8rem;
  line-height: 1.5;
}

.registry-showcase-visual .registry-code-card .code-pre code {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  white-space: inherit;
  overflow-wrap: inherit;
  word-break: inherit;
}

@media (max-width: 1180px) {
  .registry-showcase-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .registry-showcase-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .registry-showcase-visual {
    max-width: 620px;
    min-height: 500px;
    margin: 0 auto;
  }

  .registry-showcase-visual .registry-code-card-top {
    left: 4%;
    width: min(442px, 92%);
  }

  .registry-showcase-visual .registry-code-card-bottom {
    top: 220px;
    left: 12%;
    width: min(442px, 88%);
  }
}

@media (max-width: 820px) {
  .registry-showcase {
    padding: 80px 0;
  }

  .registry-showcase-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .registry-showcase-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .registry-showcase-visual {
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    max-width: 100%;
  }

  .registry-showcase-visual .registry-code-card {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
  }

  .registry-showcase-visual .registry-code-card-top,
  .registry-showcase-visual .registry-code-card-bottom {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .registry-showcase {
    padding: 72px 0;
  }

  .registry-showcase-inner {
    gap: 28px;
  }

  .registry-showcase-title {
    font-size: 1.7rem;
  }

  .registry-badge {
    min-width: 84px;
    height: 38px;
    padding: 0 10px;
  }

  .registry-showcase-btn {
    width: 100%;
    justify-content: center;
  }

  .registry-showcase-text {
    font-size: 0.98rem;
  }

  .registry-showcase-visual {
    width: 100%;
  }

  .registry-showcase-visual .registry-code-card .code-body {
    padding: 10px 12px !important;
  }

  .registry-showcase-visual .registry-code-card .code-pre {
    width: 100% !important;
    max-width: 100% !important;
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .registry-showcase-visual .registry-code-card .head-title {
    max-width: 46vw;
  }
}

@media (max-width: 480px) {
  .registry-showcase {
    padding: 64px 0;
  }

  .registry-showcase-title {
    font-size: 1.45rem;
    line-height: 1.2;
  }

  .registry-badge {
    display: inline-flex;
    margin-top: 10px;
    margin-left: 0;
  }

  .registry-showcase-visual .registry-code-card .code-body {
    padding: 9px 10px !important;
  }

  .registry-showcase-visual .registry-code-card .code-pre {
    font-size: 0.72rem;
    line-height: 1.4;
  }
}

.page {
  width: 100%;
  padding-top: var(--hdr-h);
}

.loading {
  padding: 56px 0;
  opacity: 0.85;
}

.loading-title {
  margin: 0 0 10px;
  font-size: 1.35rem;
}

.loading-sub {
  margin: 0;
  opacity: 0.85;
}

/* ===================== SECTION SEP ===================== */
.section-sep {
  width: 100%;
  height: 1px;
  margin: 0;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.14), transparent);
}

/* ===================== SHARED SECTION TITLES ===================== */
.section-title {
  margin: 0 0 12px;
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #f1f5f9;
}

.section-subtitle {
  margin: 0;
  font-size: 0.98rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.7;
  max-width: 52ch;
}

/* ===================== HERO ===================== */
.hero {
  padding: 48px 0 96px;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  padding-bottom: 20px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: 999px;
  padding: 4px 13px;
  font-size: 0.73rem;
  color: #4ade80;
  margin-bottom: 20px;
}

.hero-tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

.hero-title {
  font-size: clamp(1.9rem, 3.2vw, 2.8rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #f1f5f9;
  margin: 0 0 16px;
}

.hero-subtitle {
  font-size: 0.97rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.65;
  max-width: 44ch;
  margin: 0 0 28px;
}

.hero-ctas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.hero-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: rgba(148, 163, 184, 0.7);
}

.hero-meta-dot {
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: #22c55e;
  flex-shrink: 0;
}

/* Hero editor */
.hero-editor {
  width: 100%;
}

.hero-tabs-row {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.hero-tabs-row::-webkit-scrollbar {
  display: none;
}

.hero-tab {
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 0.73rem;
  color: rgba(203, 213, 225, 0.6);
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  white-space: nowrap;
  transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.hero-tab:hover {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
}

.hero-tab.active {
  color: #4ade80;
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.22);
}

.hero-code-body {
  min-height: 160px;
}

.hero-term {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  overflow: hidden;
}

.hero-term-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(2, 6, 23, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.hero-term-body {
  padding: 10px 14px 12px;
  background: rgba(2, 6, 23, 0.7);
}

.hero-term-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.hero-term-body code {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 0.8rem;
  line-height: 1.7;
  color: #4ade80;
}

/* ===================== INSTALL ===================== */
.install {
  padding: 48px 0;
  background: rgba(34, 197, 94, 0.03);
}

.install-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.install-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #f1f5f9;
}

.install-version {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 12px;
  border-radius: 8px;
  background: #22c55e;
  color: #021a10;
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1;
}

.install-note {
  margin: 10px 0 0;
  color: rgba(203, 213, 225, 0.6);
  font-size: 0.88rem;
}

.install-card {
  width: 100%;
  max-width: 600px;
  margin-top: 28px;
  text-align: left;
}

.install-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.install-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 8px;
  color: #4ade80;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.install-copy-btn svg {
  width: 14px;
  height: 14px;
}

.install-copy-btn:hover {
  transform: translateY(-1px);
  background: rgba(34, 197, 94, 0.18);
}

.install-tabs-wrap {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.install-tabs {
  display: flex;
  gap: 6px;
}

.install-tab {
  font-size: 0.78rem;
  color: rgba(203, 213, 225, 0.55);
  padding: 5px 14px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.install-tab:hover {
  color: #e2e8f0;
}

.install-tab.active {
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.25);
}

.install-code-body {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.install-code-pre {
  margin: 0;
  padding: 14px 16px;
  white-space: nowrap;
  overflow-x: auto;
}

/* ===================== SHOWCASE ===================== */
.showcase {
  padding: 56px 0;
}

.showcase-header {
  text-align: center;
  max-width: 680px;
  margin: 0 auto 48px;
}

.showcase-header .section-subtitle {
  max-width: none;
}

.showcase-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}

.showcase-visual {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.showcase-term .code-body {
  min-height: auto;
}

.showcase-content-title {
  margin: 0 0 14px;
  font-size: clamp(1.4rem, 2.2vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #f1f5f9;
  line-height: 1.15;
}

.showcase-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 12px;
  height: 36px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.9);
  color: #94a3b8;
  font-size: 0.52em;
  font-weight: 700;
  border: 1px solid rgba(148, 163, 184, 0.18);
  vertical-align: middle;
  letter-spacing: 0.03em;
}

.showcase-content-text {
  margin: 0 0 24px;
  font-size: 0.95rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.7;
}

.showcase-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ===================== REGISTRY SHOWCASE ===================== */
.reg-showcase {
  padding: 56px 0;
}

.reg-showcase-inner {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 56px;
  align-items: center;
}

.reg-showcase-content .section-subtitle {
  margin: 12px 0 24px;
}

.reg-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 12px;
  height: 34px;
  border-radius: 8px;
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  font-size: 0.5em;
  font-weight: 800;
  border: 1px solid rgba(34, 197, 94, 0.22);
  vertical-align: middle;
}

.reg-showcase-visual {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reg-code-body {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.reg-code-pre {
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  font-size: 0.82rem;
}

/* ===================== REGISTRY ===================== */
.registry {
  padding: 56px 0;
}

.registry-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.registry-ctas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

/* ===================== SIGNALS ===================== */
.signals {
  padding: 56px 0;
}

.signals-inner {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(240px, 0.8fr);
  gap: 48px;
  align-items: center;
}

/* ===================== GET STARTED ===================== */
.get-started {
  padding: 56px 0;
}

.get-started-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.get-started-ctas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
}

/* ===================== SUPPORT CTA ===================== */
.support-cta {
  padding: 48px 0;
}

.support-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
}

/* ===================== RESPONSIVE ===================== */
@media (max-width: 980px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .hero-subtitle {
    max-width: none;
  }

  .showcase-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .reg-showcase-inner {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .registry-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .signals-inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .get-started-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .support-cta-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 40px 0 36px;
  }

  .install {
    padding: 40px 0;
  }

  .install-card {
    max-width: 100%;
  }

  .showcase,
  .reg-showcase,
  .registry,
  .signals,
  .get-started {
    padding: 40px 0;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .hero-ctas {
    flex-direction: column;
  }

  .hero-ctas .btn {
    width: 100%;
    justify-content: center;
  }

  .reg-showcase-content .btn,
  .get-started-ctas .btn {
    width: 100%;
    justify-content: center;
  }
}

/* ===================== TEMPLATE ENGINE ===================== */
.template-engine {
  padding: 72px 0 140px;
  overflow: hidden;
}

.template-engine-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(360px, 1.15fr);
  gap: 72px;
  align-items: center;
}

.template-engine-content {
  max-width: 430px;
}

.template-engine-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.08);
  color: #4ade80;
  font-size: 0.78rem;
  font-weight: 800;
}

.template-engine-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.template-engine-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.template-engine-btn {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 999px;
  background: #67f0a8;
  color: #052e16;
  text-decoration: none;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.18);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.template-engine-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.template-engine-visual {
  position: relative;
  min-height: 620px;
  width: 100%;
}

.template-code-card {
  position: absolute;
  width: min(480px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.template-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.template-card-bottom {
  top: 185px;
  left: 12%;
  z-index: 2;
}

.template-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.template-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.template-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

.tpl-tag {
  color: #38bdf8;
}

@media (max-width: 980px) {
  .template-engine {
    padding-bottom: 140px;
  }

  .template-engine-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .template-engine-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .template-engine-visual {
    max-width: 620px;
    min-height: 620px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .template-engine {
    padding: 56px 0 72px;
    overflow: hidden;
  }

  .template-engine-inner {
    gap: 36px;
  }

  .template-engine-content {
    text-align: left;
    max-width: 100%;
  }

  .template-engine-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .template-engine-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .template-engine-btn {
    width: 100%;
    justify-content: center;
  }

  .template-engine-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .template-code-card,
  .template-card-top,
  .template-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .template-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .template-code-pre {
    margin: 0;
    width: max-content;
    min-width: 100%;
    max-width: none;
    padding: 18px 20px;
    font-size: 0.82rem;
    line-height: 1.65;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }

  .template-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}

</style>
