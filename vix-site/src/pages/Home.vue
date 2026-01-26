<script setup>
import { HOME } from "@/data/home";

// Core sections
import Hero from "@/components/Hero.vue";
import Section from "@/components/Section.vue";
import CardGrid from "@/components/CardGrid.vue";
import CodeBlock from "@/components/CodeBlock.vue";
</script>

<template>
  <!-- HERO -->
  <Hero
    :title="HOME.hero.title"
    :subtitle="HOME.hero.subtitle"
    :ctas="HOME.hero.ctas"
    :badges="HOME.hero.badges"
    :terminal="HOME.hero.terminal"
  />

  <!-- WORKFLOW -->
  <Section
    :title="HOME.workflow.title"
    :subtitle="HOME.workflow.subtitle"
  >
    <CardGrid :items="HOME.workflow.items" />
  </Section>

  <!-- DEMO -->
  <Section
    :title="HOME.demo.title"
    :subtitle="HOME.demo.subtitle"
  >
    <CodeBlock :code="HOME.demo.code" :run="HOME.demo.run" :out="HOME.demo.out" :note="HOME.demo.note" />
  </Section>

  <!-- WHY -->
  <Section
    :title="HOME.why.title"
    :subtitle="HOME.why.subtitle"
    alt
  >
    <CardGrid :items="HOME.why.items" />
  </Section>

  <!-- PROOF -->
  <Section
    :title="HOME.proof.title"
    :subtitle="HOME.proof.subtitle"
  >
    <CardGrid :items="HOME.proof.items" />
  </Section>

  <!-- BATTERIES INCLUDED -->
  <Section
    :title="HOME.batteries.title"
    :subtitle="HOME.batteries.subtitle"
    alt
  >
    <CardGrid :items="HOME.batteries.items" />
  </Section>

  <!-- CLI -->
  <!-- <Section
    :title="HOME.cli.title"
    :subtitle="HOME.cli.subtitle"
  >
    <div class="cli-grid">
      <CodeBlock
        :code="HOME.cli.code"
        note="Tip: use --log-level=debug or --log-format=json-pretty for deep diagnostics."
      />
      <div class="cli-side card reveal">
        <h3>What this unlocks</h3>
        <ul>
          <li><span class="pill">vix new</span> Scaffold a clean project fast</li>
          <li><span class="pill">vix dev</span> Hot-reload while you iterate</li>
          <li><span class="pill">vix run</span> Run a single .cpp like a script</li>
          <li><span class="pill">vix pack</span> Ship reproducible artifacts</li>
          <li><span class="pill">vix verify</span> Verify what you run</li>
          <li><span class="pill">vix publish</span> Share libraries via Registry</li>
        </ul>
        <p class="cli-side-note">
          The goal is simple: less glue code, fewer external tools, and a workflow that stays readable under pressure.
        </p>
      </div>
    </div>
  </Section> -->


  <!-- SHOWCASE -->
  <Section
    :title="HOME.showcase.title"
    :subtitle="HOME.showcase.subtitle"
  >
    <div class="showcase-grid">
      <ul class="showcase-list">
        <li v-for="item in HOME.showcase.bullets" :key="item">
          {{ item }}
        </li>
      </ul>

      <figure
        v-if="HOME.showcase.media?.image"
        class="showcase-media"
      >
        <img
          :src="HOME.showcase.media.image"
          :alt="HOME.showcase.media.alt"
          loading="lazy"
        />
        <figcaption>
          {{ HOME.showcase.media.caption }}
        </figcaption>
      </figure>
    </div>
  </Section>

  <!-- GET STARTED -->
  <Section
    :title="HOME.getStarted.title"
    :subtitle="HOME.getStarted.subtitle"
    alt
  >
    <CodeBlock
      :code="HOME.getStarted.code"
      :note="HOME.getStarted.note"
    />

    <div class="cta-row">
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

<style scoped>
.showcase-grid {
  display: grid;
  gap: 2rem;
}

@media (min-width: 900px) {
  .showcase-grid {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}

.showcase-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.showcase-list li {
  margin-bottom: 0.6rem;
}

.showcase-media img {
  max-width: 100%;
  border-radius: 12px;
}

.showcase-media figcaption {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.cta-row {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.cli-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.cli-grid :deep(.code-card) {
  grid-column: span 7;
  margin: 0; /* important pour coller au grid */
}

.cli-side {
  grid-column: span 5;
  padding: 1.25rem 1.4rem;
}

.cli-side h3 {
  margin: 0 0 0.6rem;
  font-size: 1.05rem;
}

.cli-side ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.55rem;
}

.cli-side li {
  color: var(--muted);
  line-height: 1.55;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.cli-side-note {
  margin-top: 0.9rem;
  color: var(--muted);
  line-height: 1.55;
  font-size: 0.92rem;
  opacity: 0.95;
}

@media (max-width: 900px) {
  .cli-grid {
    grid-template-columns: 1fr;
  }

  .cli-grid :deep(.code-card),
  .cli-side {
    grid-column: auto;
  }
}

</style>
