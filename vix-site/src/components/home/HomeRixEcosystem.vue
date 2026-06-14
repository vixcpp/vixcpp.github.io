<script setup>
defineProps({
  rixEcosystem: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="rix-ecosystem">
    <div class="container rix-ecosystem-inner">
      <div class="rix-ecosystem-content">
        <span class="rix-ecosystem-badge">
          {{ rixEcosystem.badge }}
        </span>

        <h2 class="rix-ecosystem-title">
          {{ rixEcosystem.title }}
        </h2>

        <p class="rix-ecosystem-subtitle">
          {{ rixEcosystem.subtitle }}
        </p>

        <a
          v-if="rixEcosystem.cta"
          class="rix-ecosystem-btn"
          :href="rixEcosystem.cta.to || rixEcosystem.cta.href"
          :target="rixEcosystem.cta.external ? '_blank' : null"
          :rel="rixEcosystem.cta.external ? 'noreferrer' : null"
        >
          {{ rixEcosystem.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="rix-ecosystem-visual">
        <div class="code-card rix-card rix-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ rixEcosystem.cards.install.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body rix-code-body">
            <pre
              class="code-pre rix-code-pre"
            ><code v-html="rixEcosystem.cards.install.code"></code></pre>
          </div>
        </div>

        <div class="code-card rix-card rix-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ rixEcosystem.cards.cpp.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body rix-code-body">
            <pre
              class="code-pre rix-code-pre"
            ><code v-html="rixEcosystem.cards.cpp.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.rix-ecosystem {
  padding: 72px 0 120px;
  overflow: hidden;
}

.rix-ecosystem-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.rix-ecosystem-content {
  max-width: 460px;
}

.rix-ecosystem-badge {
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

.rix-ecosystem-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.rix-ecosystem-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.rix-ecosystem-btn {
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

.rix-ecosystem-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.rix-ecosystem-visual {
  position: relative;
  min-height: 620px;
  width: 100%;
}

.rix-card {
  position: absolute;
  width: min(520px, 100%);
  max-width: 100%;
  overflow: hidden;
}

.rix-card-top {
  top: 0;
  left: 0;
  z-index: 1;
}

.rix-card-bottom {
  top: 215px;
  left: 12%;
  z-index: 2;
}

.rix-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.rix-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
}

.rix-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

@media (max-width: 980px) {
  .rix-ecosystem {
    padding-bottom: 120px;
  }

  .rix-ecosystem-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .rix-ecosystem-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .rix-ecosystem-visual {
    max-width: 620px;
    min-height: 620px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .rix-ecosystem {
    padding: 56px 0 72px;
  }

  .rix-ecosystem-inner {
    gap: 36px;
  }

  .rix-ecosystem-content {
    text-align: left;
    max-width: 100%;
  }

  .rix-ecosystem-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .rix-ecosystem-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .rix-ecosystem-btn {
    width: 100%;
    justify-content: center;
  }

  .rix-ecosystem-visual {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
  }

  .rix-card,
  .rix-card-top,
  .rix-card-bottom {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .rix-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .rix-code-pre {
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

  .rix-code-pre code {
    display: inline-block;
    min-width: 100%;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
  }
}
</style>
