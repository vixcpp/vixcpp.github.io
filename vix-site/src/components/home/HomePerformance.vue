<script setup>
defineProps({
  performance: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="performance-section">
    <div class="container performance-inner">
      <div class="performance-content">
        <span class="performance-badge">
          {{ performance.badge }}
        </span>

        <h2 class="performance-title">
          {{ performance.title }}
        </h2>

        <p class="performance-subtitle">
          {{ performance.subtitle }}
        </p>

        <div v-if="performance.metrics?.length" class="performance-metrics">
          <div
            v-for="metric in performance.metrics"
            :key="metric.label"
            class="performance-metric"
          >
            <div class="performance-metric-value">
              {{ metric.value }}
            </div>
            <div class="performance-metric-label">
              {{ metric.label }}
            </div>
          </div>
        </div>

        <p v-if="performance.note" class="performance-note">
          {{ performance.note }}
        </p>

        <a
          v-if="performance.cta"
          class="performance-btn"
          :href="performance.cta.to || performance.cta.href"
          :target="performance.cta.external ? '_blank' : null"
          :rel="performance.cta.external ? 'noreferrer' : null"
        >
          {{ performance.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="performance-visual">
        <div class="code-card performance-card performance-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ performance.cards.benchmark.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body performance-code-body">
            <pre
              class="code-pre performance-code-pre"
            ><code v-html="performance.cards.benchmark.code"></code></pre>
          </div>
        </div>

        <div class="code-card performance-card performance-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ performance.cards.workflow.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body performance-code-body">
            <pre
              class="code-pre performance-code-pre"
            ><code v-html="performance.cards.workflow.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.performance-section {
  padding: 72px 0 120px;
  overflow: hidden;
}

.performance-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.performance-content {
  max-width: 500px;
}

.performance-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.08);
  color: #4ade80;
  font-size: 0.78rem;
  font-weight: 800;
}

.performance-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.performance-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.performance-metric {
  padding: 16px 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.035),
      rgba(255, 255, 255, 0.015)
    ),
    rgba(2, 13, 10, 0.7);
}

.performance-metric-value {
  color: #4ade80;
  font-size: clamp(1.25rem, 2.2vw, 1.8rem);
  line-height: 1;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.performance-metric-label {
  margin-top: 8px;
  color: rgba(203, 213, 225, 0.72);
  font-size: 0.82rem;
  line-height: 1.35;
}

.performance-note {
  margin: 18px 0 0;
  color: rgba(203, 213, 225, 0.64);
  font-size: 0.88rem;
  line-height: 1.6;
}

.performance-btn {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 999px;
  background: #67f0a8;
  color: #052e16;
  text-decoration: none;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.performance-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.performance-visual {
  position: relative;
  min-height: 520px;
  width: 100%;
}

.performance-card {
  position: absolute;
  width: min(520px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.performance-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.performance-card-bottom {
  top: 205px;
  left: 12%;
  z-index: 2;
}

.performance-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.performance-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.performance-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

@media (max-width: 980px) {
  .performance-section {
    padding-bottom: 120px;
  }

  .performance-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .performance-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .performance-visual {
    max-width: 620px;
    min-height: 520px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .performance-section {
    padding: 56px 0 72px;
  }

  .performance-inner {
    gap: 36px;
  }

  .performance-content {
    text-align: left;
    max-width: 100%;
  }

  .performance-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .performance-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .performance-metrics {
    grid-template-columns: 1fr;
  }

  .performance-btn {
    width: 100%;
    justify-content: center;
  }

  .performance-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .performance-card,
  .performance-card-top,
  .performance-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .performance-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .performance-code-pre {
    margin: 0;
    width: max-content;
    min-width: 100%;
    max-width: none;
    padding: 18px 20px;
    font-size: 0.82rem;
    line-height: 1.65;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }

  .performance-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}
</style>
