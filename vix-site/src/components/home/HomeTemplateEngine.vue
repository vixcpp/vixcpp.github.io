<script setup>
defineProps({
  templateEngine: { type: Object, required: true },
});
</script>

<template>
  <section v-if="templateEngine" class="template-engine">
    <div class="container template-engine-inner">
      <div class="template-engine-content">
        <span class="template-engine-badge">
          {{ templateEngine.badge }}
        </span>

        <h2 class="template-engine-title">
          {{ templateEngine.title }}
        </h2>

        <p class="template-engine-subtitle">
          {{ templateEngine.subtitle }}
        </p>

        <a
          class="template-engine-btn"
          :href="templateEngine.cta.to"
          target="_blank"
          rel="noreferrer"
        >
          {{ templateEngine.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="template-engine-visual">
        <div class="code-card template-code-card template-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ templateEngine.cards.template.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body template-code-body">
            <pre
              class="code-pre template-code-pre"
            ><code v-html="templateEngine.cards.template.code"></code></pre>
          </div>
        </div>

        <div class="code-card template-code-card template-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ templateEngine.cards.cpp.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body template-code-body">
            <pre
              class="code-pre template-code-pre"
            ><code v-html="templateEngine.cards.cpp.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.template-engine {
  padding: 72px 0 140px;
  overflow: hidden;
}

.template-engine-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(360px, 1.15fr);
  gap: 72px;
  align-items: center;
}

.template-engine-content {
  max-width: 430px;
}

.template-engine-badge {
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

.template-engine-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.template-engine-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.template-engine-btn {
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

.template-engine-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.template-engine-visual {
  position: relative;
  min-height: 620px;
  width: 100%;
}

.template-code-card {
  position: absolute;
  width: min(480px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.template-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.template-card-bottom {
  top: 185px;
  left: 12%;
  z-index: 2;
}

.template-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.template-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.template-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

.tpl-tag {
  color: #38bdf8;
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
  .template-engine {
    padding-bottom: 140px;
  }

  .template-engine-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .template-engine-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .template-engine-visual {
    max-width: 620px;
    min-height: 620px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .template-engine {
    padding: 56px 0 72px;
    overflow: hidden;
  }

  .template-engine-inner {
    gap: 36px;
  }

  .template-engine-content {
    text-align: left;
    max-width: 100%;
  }

  .template-engine-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .template-engine-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .template-engine-btn {
    width: 100%;
    justify-content: center;
  }

  .template-engine-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .template-code-card,
  .template-card-top,
  .template-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .template-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .template-code-pre {
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

  .template-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}
</style>
