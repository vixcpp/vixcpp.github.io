<template>
  <div class="wrap">
    <Hero :title="d.hero.title" :subtitle="d.hero.subtitle" :ctas="d.hero.ctas" />

    <Section :title="d.quickstart.title">
      <CodeBlock :code="d.quickstart.code" />
      <p class="muted">{{ d.quickstart.note }}</p>
    </Section>

    <Section :title="d.proof.title">
      <CardGrid :items="d.proof.items" />
    </Section>

    <Section :title="d.demo.title">
      <div class="grid2">
        <div>
          <CodeBlock :code="d.demo.code" />
          <p class="muted">Run:</p>
          <CodeBlock :code="d.demo.run" />
        </div>
        <div>
          <p class="muted">Output:</p>
          <CodeBlock :code="d.demo.out" />
        </div>
      </div>
    </Section>

    <Section :title="d.next.title">
      <ul class="list">
        <li v-for="b in d.next.bullets" :key="b">{{ b }}</li>
      </ul>

      <div class="ctaRow">
        <router-link class="btn primary" to="/install">Install</router-link>
        <router-link class="btn" to="/examples">Examples</router-link>
      </div>
    </Section>
  </div>
</template>

<script setup>
import { HOME as d } from "../data/home";
import Hero from "../components/Hero.vue";
import Section from "../components/Section.vue";
import CodeBlock from "../components/CodeBlock.vue";
import CardGrid from "../components/CardGrid.vue";
</script>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
.grid2 { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 980px) { .grid2 { grid-template-columns: 1.1fr 0.9fr; } }
.muted { opacity: 0.75; margin-top: 10px; }
.list { padding-left: 18px; opacity: 0.9; }
.ctaRow { display: flex; gap: 12px; margin-top: 14px; }
.btn { display: inline-flex; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); text-decoration: none; }
.primary { border-color: rgba(255,255,255,0.28); }
</style>
