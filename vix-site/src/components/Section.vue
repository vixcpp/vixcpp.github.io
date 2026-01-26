<template>
  <section class="sec">
    <h2 class="h2">{{ title }}</h2>
    <div class="body"><slot /></div>
  </section>
</template>

<script setup>
defineProps({ title: String });
</script>

<style scoped>
.sec { margin-top: 28px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
.h2 { margin: 0 0 12px 0; font-size: 18px; opacity: 0.95; }
</style>
