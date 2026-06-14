<script setup>
import SignalsGrid from "@/components/home/SignalsGrid.vue";

defineProps({
  signals: { type: Object, required: true },
  github: { type: Object, default: null },
});
</script>

<template>
  <section v-if="signals" class="signals">
    <div class="container signals-inner">
      <div class="signals-left">
        <h2 class="section-title">{{ signals.title }}</h2>
        <p class="section-subtitle">{{ signals.subtitle }}</p>
      </div>
      <div class="signals-right">
        <SignalsGrid :items="signals.items || []" :github="github" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.signals {
  padding: 56px 0;
}

.signals-inner {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(240px, 0.8fr);
  gap: 48px;
  align-items: center;
}

.section-title {
  margin: 0 0 12px;
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #f1f5f9;
}

.section-subtitle {
  margin: 0;
  font-size: 0.98rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.7;
  max-width: 52ch;
}

.signals-layout {
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(260px, 420px);
  gap: 3rem;
  align-items: center;
}

.signals-left {
  padding-top: 0.2rem;
}

.signals-title {
  margin: 0;
  font-size: 2.35rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.signals-subtitle {
  margin: 0.95rem 0 0;
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.82;
}

.signals-right {
  width: 100%;
}

@media (max-width: 980px) {
  .signals-layout {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .signals-title {
    font-size: 1.9rem;
  }

  .signals-inner {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

@media (max-width: 640px) {
  .signals {
    padding: 40px 0;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
