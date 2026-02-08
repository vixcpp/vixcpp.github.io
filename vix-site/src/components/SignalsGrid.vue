<script setup>
const props = defineProps({
  items: { type: Array, default: () => [] },
  github: { type: Object, default: null },
});

function formatNumber(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return x.toLocaleString();
}
</script>

<template>
  <div class="signals-grid">
    <div v-for="item in items" :key="item.title" class="signal-card">
      <div class="signal-title">{{ item.title }}</div>

      <div class="signal-value">
        <template v-if="item.kind === 'github' && github">
          {{ formatNumber(github[item.field]) }}
        </template>
        <template v-else>
          {{ item.value }}
        </template>
      </div>

      <ul v-if="item.meta?.length" class="signal-meta">
        <li v-for="m in item.meta" :key="m">{{ m }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.signals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.2rem;
}

.signal-card {
  padding: 1.2rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.signal-title {
  font-size: 0.85rem;
  opacity: 0.7;
}

.signal-value {
  margin-top: 0.35rem;
  font-size: 1.2rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.signal-meta {
  margin-top: 0.8rem;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 0.35rem;
  font-size: 0.9rem;
  opacity: 0.85;
}
</style>
