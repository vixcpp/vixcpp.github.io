<script setup>
import * as HomeData from "@/data/home";
import { ref, onMounted } from "vue";

import Hero from "@/components/Hero.vue";
import Section from "@/components/Section.vue";
import CardGrid from "@/components/CardGrid.vue";
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

      <section v-if="HOME?.install" class="install">
        <div class="container install-inner">
          <h2 class="install-title">
            <span>{{ HOME.install.title }}</span>
            <span class="install-version">{{ HOME.install.version }}</span>
          </h2>

          <p class="install-note">{{ HOME.install.note }}</p>

          <div class="install-card code-card">
            <!-- HEADER -->
            <div class="code-head install-head">
              <div class="head-left install-head-left">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
                <span class="head-title">install</span>
              </div>

              <!-- COPY ICON -->
              <button
                type="button"
                class="copy install-copy"
                @click="copyCommand"
                :aria-label="copied ? 'Copied' : 'Copy command'"
                :title="copied ? 'Copied' : 'Copy'"
              >
                <!-- COPY ICON -->
                <svg
                  v-if="!copied"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>

                <!-- CHECK ICON -->
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
              </button>
            </div>

            <!-- TABS -->
            <div class="install-tabs-wrap">
              <div class="tabs install-tabs">
                <button
                  type="button"
                  :class="['tab', { active: activePlatform === 'unix' }]"
                  @click="activePlatform = 'unix'"
                >
                  MacOS / Linux
                </button>

                <button
                  type="button"
                  :class="['tab', { active: activePlatform === 'windows' }]"
                  @click="activePlatform = 'windows'"
                >
                  Windows
                </button>
              </div>
            </div>

            <!-- COMMAND -->
            <div class="code-body install-code-body">
              <pre class="code-pre install-code-pre">
      <code>{{ HOME.install.commands?.[activePlatform] || "" }}</code>
              </pre>
            </div>

          </div>
        </div>
      </section>

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

      <!-- <Section
        v-if="HOME.mission"
        :title="HOME.mission.title"
        :subtitle="HOME.mission.subtitle"
      >
        <CardGrid :items="HOME.mission.items || []" />
      </Section>

      <div v-if="HOME.mission" class="section-sep"></div>

      <Section
        v-if="HOME.useCases"
        :title="HOME.useCases.title"
        :subtitle="HOME.useCases.subtitle"
        alt
      >
        <CardGrid :items="HOME.useCases.items || []" />
      </Section>

      <div v-if="HOME.useCases" class="section-sep"></div>

      <Section
        v-if="HOME.principles"
        :title="HOME.principles.title"
        :subtitle="HOME.principles.subtitle"
      >
        <CardGrid :items="HOME.principles.items || []" />
      </Section> -->


      <div class="section-sep"></div>

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

      <div v-if="HOME.registry" class="section-sep"></div>

      <section v-if="HOME.signals" class="signals">
        <div class="container signals-layout">
          <div class="signals-left">
            <h2 class="signals-title">{{ HOME.signals.title }}</h2>
            <p class="signals-subtitle">{{ HOME.signals.subtitle }}</p>
          </div>

          <div class="signals-right">
            <SignalsGrid :items="HOME.signals.items || []" :github="github" />
          </div>
        </div>
      </section>

      <div v-if="HOME.signals" class="section-sep"></div>

      <BatteriesIncluded
        v-if="HOME.batteries"
        :title="HOME.batteries.title"
        :subtitle="HOME.batteries.subtitle"
        :items="HOME.batteries.items || []"
      />

      <div v-if="HOME.batteries" class="section-sep"></div>


      <section class="support-cta">
        <div class="container support-cta-inner">
          <div class="support-cta-left">
            <h2 class="support-cta-title">Support</h2>
            <p class="support-cta-subtitle">
              Help keep Vix.cpp moving fast. Support the runtime, the tooling,
              and the growing ecosystem.
            </p>
          </div>

          <div class="support-cta-right">
            <a class="btn primary" href="/support">Go to Support</a>
          </div>
        </div>
      </section>

      <div class="section-sep"></div>

      <Section
        v-if="HOME.getStarted"
        :title="HOME.getStarted.title"
        :subtitle="HOME.getStarted.subtitle"
        alt
      >
        <CodeBlock
          :code="HOME.getStarted.code || ''"
          :note="HOME.getStarted.note || ''"
        />

        <div v-if="HOME.getStarted.ctas?.length" class="cta-row">
          <a
            v-for="cta in HOME.getStarted.ctas"
            :key="cta.label"
            :href="cta.href || cta.to"
            :class="['btn', cta.kind]"
            :target="cta.external ? '_blank' : null"
            :rel="cta.external ? 'noreferrer' : null"
          >
            {{ cta.label }}
          </a>
        </div>
      </Section>
    </template>
  </div>
</template>


<style scoped>
.page {
  width: 100%;
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
  gap: 10px;
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
  border-color: rgba(34,197,94,.35);
  transform: translateY(-1px);
}

/* actif */
.install-tabs .tab.active{
  color: #d1fae5;
  background: rgba(34,197,94,.15);
  border-color: rgba(34,197,94,.55);
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
  background: #22c55e;
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
  white-space: pre-wrap !important;
  word-break: break-word;
  overflow-wrap: anywhere;
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
</style>
