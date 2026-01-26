<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">{{ d.title }}</h1>
      <p class="p">{{ d.subtitle }}</p>

      <div class="links">
        <a class="btn" :href="d.external.releasesHref" target="_blank" rel="noreferrer">
          {{ d.external.releasesLabel }}
        </a>
        <a class="btn" :href="d.external.sourceHref" target="_blank" rel="noreferrer">
          {{ d.external.sourceLabel }}
        </a>
      </div>
    </header>

    <section v-for="s in d.sections" :key="s.id" class="sec">
      <h2 class="h2">{{ s.title }}</h2>
      <p class="muted">{{ s.desc }}</p>
      <CodeBlock :code="s.code" />
      <p class="note">{{ s.note }}</p>
    </section>
  </div>
</template>

<script setup>
import { INSTALL as d } from "../data/install";
import CodeBlock from "../components/CodeBlock.vue";
</script>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
.top { padding-bottom: 10px; }
.h1 { margin: 0; font-size: 34px; letter-spacing: -0.02em; }
.p { margin: 10px 0 0; opacity: 0.8; max-width: 880px; }
.links { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
.btn { text-decoration: none; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); }
.sec { margin-top: 22px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
.h2 { margin: 0 0 10px; font-size: 16px; }
.muted { margin: 0 0 10px; opacity: 0.75; max-width: 900px; }
.note { margin: 10px 0 0; opacity: 0.7; font-size: 13px; }
</style>
