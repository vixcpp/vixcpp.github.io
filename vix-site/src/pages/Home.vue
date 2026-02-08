<script setup>
import * as HomeData from "@/data/home";

// Core sections
import Hero from "@/components/Hero.vue";
import Section from "@/components/Section.vue";
import CardGrid from "@/components/CardGrid.vue";
import CodeBlock from "@/components/CodeBlock.vue";

/**
 * Supporte plusieurs formes d’export possibles.
 * On tente plusieurs chemins courants.
 */
const HOME =
  HomeData?.HOME ??
  HomeData?.default ??
  HomeData?.default?.HOME ??
  HomeData?.default?.default ??
  null;

// Debug safe (tu peux enlever après)
const _debugHomeType = HOME ? typeof HOME : "null";
const _debugHomeKeys = HOME && typeof HOME === "object" ? Object.keys(HOME) : [];
</script>

<template>
  <div class="page">
    <!-- DEBUG (temporaire, safe, ne crash pas) -->
    <div v-if="!HOME" class="container loading">
      <h2 style="margin:0 0 8px;">Loading…</h2>
      <p style="margin:0; opacity:.85;">
        HOME is null. Check export in <code>@/data/home</code>.
      </p>
    </div>

    <!-- HERO -->
    <Hero
      v-if="HOME?.hero"
      :title="HOME.hero.title"
      :subtitle="HOME.hero.subtitle"
      :ctas="HOME.hero.ctas"
      :badges="HOME.hero.badges"
      :examples="HOME.hero.examples"
    />

    <!-- WORKFLOW -->
    <Section
      v-if="HOME?.workflow"
      :title="HOME.workflow.title"
      :subtitle="HOME.workflow.subtitle"
    >
      <CardGrid :items="HOME.workflow.items || []" />
    </Section>

    <!-- WHY -->
    <Section
      v-if="HOME?.why"
      :title="HOME.why.title"
      :subtitle="HOME.why.subtitle"
      alt
    >
      <CardGrid :items="HOME.why.items || []" />
    </Section>

    <!-- PROOF -->
    <Section
      v-if="HOME?.proof"
      :title="HOME.proof.title"
      :subtitle="HOME.proof.subtitle"
    >
      <CardGrid :items="HOME.proof.items || []" />
    </Section>

    <!-- BATTERIES -->
    <Section
      v-if="HOME?.batteries"
      :title="HOME.batteries.title"
      :subtitle="HOME.batteries.subtitle"
      alt
    >
      <CardGrid :items="HOME.batteries.items || []" />
    </Section>

    <!-- GET STARTED -->
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
  padding: 48px 0;
  opacity: 0.75;
}

.debug {
  margin-bottom: 10px;
}

.cta-row {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
