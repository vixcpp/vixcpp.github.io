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

      <Section
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
      </Section>

      <div v-if="HOME.principles" class="section-sep"></div>

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
  padding: 72px 0 80px;
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
  gap: 12px;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #fff;
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
</style>
