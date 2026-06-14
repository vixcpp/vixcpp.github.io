<script setup>
defineProps({
  productionWorkflow: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="production-workflow">
    <div class="container production-workflow-inner">
      <div class="production-workflow-content">
        <span class="production-workflow-badge">
          {{ productionWorkflow.badge }}
        </span>

        <h2 class="production-workflow-title">
          {{ productionWorkflow.title }}
        </h2>

        <p class="production-workflow-subtitle">
          {{ productionWorkflow.subtitle }}
        </p>

        <a
          v-if="productionWorkflow.cta"
          class="production-workflow-btn"
          :href="productionWorkflow.cta.to || productionWorkflow.cta.href"
          :target="productionWorkflow.cta.external ? '_blank' : null"
          :rel="productionWorkflow.cta.external ? 'noreferrer' : null"
        >
          {{ productionWorkflow.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="production-workflow-visual">
        <div class="code-card production-card production-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ productionWorkflow.cards.deploy.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body production-code-body">
            <pre
              class="code-pre production-code-pre"
            ><code v-html="productionWorkflow.cards.deploy.code"></code></pre>
          </div>
        </div>

        <div class="code-card production-card production-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ productionWorkflow.cards.inspect.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body production-code-body">
            <pre
              class="code-pre production-code-pre"
            ><code v-html="productionWorkflow.cards.inspect.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.production-workflow {
  padding: 72px 0 120px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top right,
      rgba(34, 197, 94, 0.1),
      transparent 34%
    ),
    rgba(34, 197, 94, 0.02);
}

.production-workflow-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.production-workflow-content {
  max-width: 460px;
}

.production-workflow-badge {
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

.production-workflow-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.production-workflow-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.production-workflow-btn {
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

.production-workflow-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.production-workflow-visual {
  position: relative;
  min-height: 620px;
  width: 100%;
}

.production-card {
  position: absolute;
  width: min(520px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.production-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.production-card-bottom {
  top: 245px;
  left: 12%;
  z-index: 2;
}

.production-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.production-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.production-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

@media (max-width: 980px) {
  .production-workflow {
    padding-bottom: 120px;
  }

  .production-workflow-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .production-workflow-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .production-workflow-visual {
    max-width: 620px;
    min-height: 620px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .production-workflow {
    padding: 56px 0 72px;
  }

  .production-workflow-inner {
    gap: 36px;
  }

  .production-workflow-content {
    text-align: left;
    max-width: 100%;
  }

  .production-workflow-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .production-workflow-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .production-workflow-btn {
    width: 100%;
    justify-content: center;
  }

  .production-workflow-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .production-card,
  .production-card-top,
  .production-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .production-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .production-code-pre {
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

  .production-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}
</style>
