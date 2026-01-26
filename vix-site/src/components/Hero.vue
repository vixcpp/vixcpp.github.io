<template>
  <section class="hero">
    <h1 class="h1">{{ title }}</h1>
    <p class="p">{{ subtitle }}</p>
    <div class="row">
      <router-link v-for="c in ctas" :key="c.to" :to="c.to" class="btn" :class="c.kind">
        {{ c.label }}
      </router-link>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  ctas: { type: Array, default: () => [] },
});
</script>

<style scoped>
.hero { padding: 18px 0 10px; }
.h1 { font-size: 40px; line-height: 1.05; margin: 0; }
.p { opacity: 0.8; max-width: 900px; margin-top: 10px; font-size: 16px; }
.row { display: flex; gap: 12px; margin-top: 16px; }
.btn { text-decoration: none; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); }
.primary { border-color: rgba(255,255,255,0.28); }
.secondary { opacity: 0.85; }
</style>
