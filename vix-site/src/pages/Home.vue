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

    <BatteriesIncluded
      v-if="HOME?.batteries"
      :title="HOME.batteries.title"
      :subtitle="HOME.batteries.subtitle"
      :items="HOME.batteries.items || []"
    />

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
</style>
