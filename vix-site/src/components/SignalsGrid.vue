<script setup>
defineProps({
  items: { type: Array, default: () => [] },
  github: { type: Object, default: null },
});

function formatNumber(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "";
  return x.toLocaleString();
}

function getValue(item, github) {
  if (item?.kind === "github" && github && item?.field) {
    return formatNumber(github[item.field]);
  }
  return item?.value ?? "";
}

function getSub(item) {
  if (Array.isArray(item?.meta) && item.meta.length) return item.meta[0];
  return "";
}
</script>

<template>
  <div class="signals">
    <div
      v-for="(item, idx) in (Array.isArray(items) ? items : [])"
      :key="item.field || item.title || idx"
      class="signal"
    >
      <span class="pill">{{ item.title }}</span>
      <div class="value">{{ getValue(item, github) }}</div>
      <div v-if="getSub(item)" class="sub">{{ getSub(item) }}</div>
    </div>
  </div>
</template>

<style scoped>
.signals {
  display: grid;
  gap: 1.35rem;
  padding-top: 0.35rem;
}

.signal {
  position: relative;
  padding: 0.2rem 0 1.25rem;
}

.signal:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.pill {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;

  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: -0.01em;

  color: rgba(0, 0, 0, 0.88);
  background: rgba(120, 255, 190, 0.95);
}

.value {
  margin-top: 0.7rem;
  font-size: 2.3rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.sub {
  margin-top: 0.4rem;
  font-size: 0.95rem;
  opacity: 0.75;
  line-height: 1.4;
}

@media (max-width: 520px) {
  .signals {
    gap: 1.05rem;
  }

  .value {
    font-size: 2.05rem;
  }
}
</style>
