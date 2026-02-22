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

onMounted(async () => {
  github.value = await getInitialGithubStats();
  const updated = await refreshGithubStats({ timeoutMs: 1200 });
  if (updated) github.value = updated;
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

    <Hero
      v-if="HOME?.hero"
      :title="HOME.hero.title"
      :subtitle="HOME.hero.subtitle"
      :ctas="HOME.hero.ctas"
      :badges="HOME.hero.badges"
      :examples="HOME.hero.examples"
      :support="HOME.hero.support"
    />

    <div class="section-sep hero-sep"></div>

    <section class="support-cta">
      <div class="container support-cta-inner">
        <div class="support-cta-left">
          <h2 class="support-cta-title">Support</h2>
          <p class="support-cta-subtitle">
            Help keep Vix.cpp moving fast. Crypto and local options available.
          </p>
        </div>

        <div class="support-cta-right">
          <a class="btn primary" href="/support">Go to Support</a>
          <a class="btn secondary" href="/docs" v-if="false">Docs</a>
        </div>
      </div>
    </section>

    <div class="section-sep"></div>

    <section v-if="HOME?.registry" class="registry">
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

    <section v-if="HOME?.signals" class="signals">
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

    <div class="section-sep"></div>

    <BatteriesIncluded
      v-if="HOME?.batteries"
      :title="HOME.batteries.title"
      :subtitle="HOME.batteries.subtitle"
      :items="HOME.batteries.items || []"
    />

    <div class="section-sep"></div>

    <Section
      v-if="HOME?.getStarted"
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



</style>
