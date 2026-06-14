<script setup>
defineProps({
  cneriumReliability: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="cnerium-reliability">
    <div class="container cnerium-reliability-inner">
      <div class="cnerium-reliability-content">
        <span class="cnerium-reliability-badge">
          {{ cneriumReliability.badge }}
        </span>

        <h2 class="cnerium-reliability-title">
          {{ cneriumReliability.title }}
        </h2>

        <p class="cnerium-reliability-subtitle">
          {{ cneriumReliability.subtitle }}
        </p>

        <a
          v-if="cneriumReliability.cta"
          class="cnerium-reliability-btn"
          :href="cneriumReliability.cta.to || cneriumReliability.cta.href"
          :target="cneriumReliability.cta.external ? '_blank' : null"
          :rel="cneriumReliability.cta.external ? 'noreferrer' : null"
        >
          {{ cneriumReliability.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="cnerium-reliability-visual">
        <div class="code-card cnerium-card cnerium-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ cneriumReliability.cards.attach.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body cnerium-code-body">
            <pre
              class="code-pre cnerium-code-pre"
            ><code v-html="cneriumReliability.cards.attach.code"></code></pre>
          </div>
        </div>

        <div class="code-card cnerium-card cnerium-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ cneriumReliability.cards.retry.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body cnerium-code-body">
            <pre
              class="code-pre cnerium-code-pre"
            ><code v-html="cneriumReliability.cards.retry.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cnerium-reliability {
  padding: 72px 0 120px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top left,
      rgba(34, 197, 94, 0.1),
      transparent 34%
    ),
    rgba(34, 197, 94, 0.02);
}

.cnerium-reliability-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.cnerium-reliability-content {
  max-width: 460px;
}

.cnerium-reliability-badge {
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

.cnerium-reliability-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.cnerium-reliability-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.cnerium-reliability-btn {
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

.cnerium-reliability-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.cnerium-reliability-visual {
  position: relative;
  min-height: 620px;
  width: 100%;
}

.cnerium-card {
  position: absolute;
  width: min(540px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.cnerium-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.cnerium-card-bottom {
  top: 310px;
  left: 12%;
  z-index: 2;
}

.cnerium-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.cnerium-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.cnerium-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

@media (max-width: 980px) {
  .cnerium-reliability {
    padding-bottom: 120px;
  }

  .cnerium-reliability-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .cnerium-reliability-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .cnerium-reliability-visual {
    max-width: 620px;
    min-height: 640px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .cnerium-reliability {
    padding: 56px 0 72px;
  }

  .cnerium-reliability-inner {
    gap: 36px;
  }

  .cnerium-reliability-content {
    text-align: left;
    max-width: 100%;
  }

  .cnerium-reliability-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .cnerium-reliability-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .cnerium-reliability-btn {
    width: 100%;
    justify-content: center;
  }

  .cnerium-reliability-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .cnerium-card,
  .cnerium-card-top,
  .cnerium-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .cnerium-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .cnerium-code-pre {
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

  .cnerium-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}
</style>
