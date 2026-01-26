<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">{{ d.title }}</h1>
      <p class="p">{{ d.subtitle }}</p>
    </header>

    <section v-for="it in d.items" :key="it.id" class="ex">
      <div class="head">
        <h2 class="h2">{{ it.title }}</h2>
        <p class="muted">{{ it.desc }}</p>
      </div>

      <div class="grid">
        <div>
          <p class="label">Code</p>
          <CodeBlock :code="it.code" />
        </div>

        <div>
          <p class="label">Run</p>
          <CodeBlock :code="it.run" />
          <p class="label" style="margin-top:10px;">Expected output</p>
          <CodeBlock :code="it.out" />
        </div>
      </div>

      <p v-if="it.note" class="note">{{ it.note }}</p>
    </section>
  </div>
</template>

<script setup>
import { EXAMPLES as d } from "../data/examples";
import CodeBlock from "../components/CodeBlock.vue";
</script>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 28px 18px 60px; }
.top { padding-bottom: 6px; }
.h1 { margin: 0; font-size: 34px; letter-spacing: -0.02em; }
.p { margin: 10px 0 0; opacity: 0.8; max-width: 900px; }
.ex { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.head { margin-bottom: 12px; }
.h2 { margin: 0 0 6px; font-size: 16px; }
.muted { margin: 0; opacity: 0.75; }
.label { margin: 0 0 8px; opacity: 0.7; font-size: 12px; }
.grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 980px) { .grid { grid-template-columns: 1fr 1fr; } }
.note { margin: 12px 0 0; opacity: 0.7; font-size: 13px; }
</style>
