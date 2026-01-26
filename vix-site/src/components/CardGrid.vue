<script setup>
const props = defineProps({
  // items: [{ title: string, text: string, ...optional fields }]
  items: { type: Array, default: () => [] },

  columns: { type: Number, default: 3 },
  dense: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="grid"
    :class="{ dense }"
    :style="{ '--cols': String(columns) }"
  >
    <article
      v-for="(item, idx) in items"
      :key="item?.title || idx"
      class="card"
    >
      <h3 class="card-title">{{ item.title }}</h3>
      <p v-if="item.text" class="card-text">{{ item.text }}</p>

      <slot
        name="card"
        :item="item"
        :index="idx"
      />
    </article>
  </div>
</template>

<style scoped>
.grid {
  --cols: 3;
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 720px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.15rem;
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    gap: 1.25rem;
  }
}

.grid.dense {
  gap: 0.85rem;
}

.card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  padding: 1.05rem 1.05rem 1.1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.card-title {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.card-text {
  margin: 0.6rem 0 0;
  line-height: 1.6;
  opacity: 0.85;
  font-size: 0.98rem;
}
</style>
