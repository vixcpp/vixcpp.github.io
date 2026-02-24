<template>
  <div class="wrap">
    <header class="top">
      <h1 class="h1">{{ d.title }}</h1>
      <p class="p">{{ d.subtitle }}</p>

      <div class="links">
        <a v-if="d.external.docsHref" class="btn" :href="d.external.docsHref" target="_blank" rel="noreferrer">
          {{ d.external.docsLabel }}
        </a>
        <a class="btn" :href="d.external.releasesHref" target="_blank" rel="noreferrer">
          {{ d.external.releasesLabel }}
        </a>
        <a class="btn" :href="d.external.sourceHref" target="_blank" rel="noreferrer">
          {{ d.external.sourceLabel }}
        </a>
        <a v-if="d.external.issuesHref" class="btn" :href="d.external.issuesHref" target="_blank" rel="noreferrer">
          {{ d.external.issuesLabel }}
        </a>
      </div>
    </header>

    <section v-for="s in d.sections" :key="s.id" class="sec">
      <h2 class="h2">{{ s.title }}</h2>
      <p class="muted" v-if="s.desc">{{ s.desc }}</p>

      <!-- Bullets block (for trust, etc.) -->
      <ul v-if="s.bullets && s.bullets.length" class="bullets">
        <li v-for="(b, i) in s.bullets" :key="i" class="bullet">
          {{ b }}
        </li>
      </ul>

      <!-- Code block -->
      <CodeBlock v-if="s.code" :code="s.code" />

      <p v-if="s.note" class="note">{{ s.note }}</p>
    </section>
  </div>
</template>

<script setup>
import { INSTALL as d } from "../data/install";
import CodeBlock from "../components/CodeBlock.vue";
</script>

<style scoped>
.wrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.2rem 1.5rem 2.8rem;
}

.top{
  margin-bottom: 1.6rem;
}

.h1{
  margin: 0 0 .55rem 0;
  font-size: clamp(2rem, 2.6vw, 2.5rem);
  line-height: 1.1;
}

.p{
  margin: 0;
  color: var(--muted);
  max-width: 62ch;
  line-height: 1.55;
}

/* buttons row */
.links{
  display: flex;
  flex-wrap: wrap;
  gap: .7rem;
  margin-top: 1rem;
}

.btn{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .6rem 1.05rem;
  border-radius: 999px;
  font-size: .9rem;
  border: 1px solid rgba(45,212,191,.55);
  color: #e5f9f6;
  background: rgba(2,44,34,.90);
  transition: transform .12s ease, background .16s ease, border-color .16s ease;
}

.btn:hover{
  transform: translateY(-1px);
  background: rgba(2,60,47,.95);
  border-color: rgba(45,212,191,.85);
}

/* section */
.sec{
  padding: 1.25rem 0 1.55rem;
  border-top: 1px solid rgba(45, 212, 191, 0.12);
}

.h2{
  margin: 0 0 .25rem 0;
  font-size: 1.25rem;
}

.muted{
  margin: 0 0 .85rem 0;
  color: var(--muted);
  line-height: 1.55;
  max-width: 90ch;
}

.note{
  margin: .75rem 0 0 0;
  color: var(--muted);
  line-height: 1.55;
  max-width: 95ch;
  font-size: .95rem;
}

@media (max-width: 900px){
  .wrap{ padding: 1.8rem 1.2rem 2.4rem; }
}
.bullets{
  margin: .75rem 0 1rem 0;
  padding-left: 1.1rem;
  max-width: 95ch;
  color: #d7efe9;
}

.bullet{
  margin: .35rem 0;
  line-height: 1.55;
  color: var(--muted);
}
</style>
