<template>
  <div class="grid">
    <article v-for="it in items" :key="it.title" class="card">
      <h3 class="h3">{{ it.title }}</h3>
      <p class="p">{{ it.text }}</p>
    </article>
  </div>
</template>

<script setup>
defineProps({ items: { type: Array, default: () => [] } });
</script>

<style scoped>
.grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 860px) { .grid { grid-template-columns: repeat(3, 1fr); } }
.card { padding: 14px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.02); }
.h3 { margin: 0 0 6px 0; font-size: 14px; }
.p { margin: 0; opacity: 0.8; font-size: 13px; line-height: 1.5; }
</style>
