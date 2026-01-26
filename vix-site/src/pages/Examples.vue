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

      <CodeBlock
        :title="it.blockTitle"
        :code="it.code"
        :run="it.run"
        :out="it.out"
        :note="it.note"
        :lang="it.lang"
        :maxHeight="it.maxHeight || 420"
      />
    </section>
  </div>
</template>

<script setup>
import { EXAMPLES as d } from "../data/examples";
import CodeBlock from "../components/CodeBlock.vue";
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 1.6rem;
}
.grid > * {
  min-width: 0;
}

.wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 2.2rem 1.5rem 2.8rem;
}

.top {
  margin-bottom: 1.6rem;
}

.h1 {
  margin: 0 0 0.55rem 0;
  font-size: clamp(2rem, 2.6vw, 2.5rem);
  line-height: 1.1;
}

.p {
  margin: 0;
  color: var(--muted);
  max-width: 58ch;
  line-height: 1.55;
}

.ex {
  padding: 1.25rem 0 1.55rem;
  border-top: 1px solid rgba(45, 212, 191, 0.12);
}

.head {
  margin-bottom: 0.85rem;
}

.h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
}

.muted {
  margin: 0;
  color: var(--muted);
  line-height: 1.55;
  max-width: 80ch;
}
</style>
