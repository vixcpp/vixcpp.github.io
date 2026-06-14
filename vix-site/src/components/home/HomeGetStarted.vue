<!-- src/components/home/HomeGetStarted.vue -->
<script setup>
defineProps({
  getStarted: { type: Object, required: true },
});
</script>

<template>
  <section v-if="getStarted" class="get-started">
    <div class="container get-started-inner">
      <div class="get-started-left">
        <h2 class="section-title">{{ getStarted.title }}</h2>
        <p class="section-subtitle">{{ getStarted.subtitle }}</p>
        <div class="get-started-ctas" v-if="getStarted.ctas?.length">
          <a
            v-for="cta in getStarted.ctas"
            :key="cta.label"
            :href="cta.href || cta.to"
            :class="['btn', cta.kind]"
            :target="cta.external ? '_blank' : null"
            :rel="cta.external ? 'noreferrer' : null"
            >{{ cta.label }}</a
          >
        </div>
      </div>

      <div class="get-started-right">
        <div class="code-card">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">terminal</span>
            </div>
          </div>
          <div class="code-body">
            <pre class="code-pre"><code>{{ getStarted.code }}</code></pre>
          </div>
          <div v-if="getStarted.note" class="code-foot">
            <p class="code-note">{{ getStarted.note }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.get-started {
  padding: 56px 0;
}

.get-started-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
}

.get-started-ctas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
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

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.95;
}
.dot-red {
  background: #fb923c;
}
.dot-yellow {
  background: #facc15;
}
.dot-green {
  background: #22c55e;
}

@media (max-width: 980px) {
  .get-started-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 640px) {
  .get-started {
    padding: 40px 0;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .get-started-ctas .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
