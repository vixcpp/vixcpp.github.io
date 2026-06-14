<script setup>
defineProps({
  registryShowcase: { type: Object, required: true },
});
</script>

<template>
  <section v-if="registryShowcase" class="registry-showcase">
    <div class="container registry-showcase-inner">
      <!-- LEFT -->
      <div class="registry-showcase-content">
        <h2 class="registry-showcase-title">
          {{ registryShowcase.title }}
          <span class="registry-badge">{{ registryShowcase.badge }}</span>
        </h2>

        <p class="registry-showcase-text">
          {{ registryShowcase.text }}
        </p>

        <a :href="registryShowcase.cta.to" class="registry-showcase-btn">
          {{ registryShowcase.cta.label }}
          <span class="registry-showcase-btn-arrow">›</span>
        </a>
      </div>

      <!-- RIGHT -->
      <div class="registry-showcase-visual">
        <!-- TOP CARD -->
        <div class="code-card registry-code-card registry-code-card-top">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ registryShowcase.cards.top.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body">
            <pre class="code-pre">
            <code v-html="registryShowcase.cards.top.code"></code>
          </pre>
          </div>
        </div>

        <!-- BOTTOM CARD -->
        <div class="code-card registry-code-card registry-code-card-bottom">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ registryShowcase.cards.bottom.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body">
            <pre class="code-pre">
            <code v-html="registryShowcase.cards.bottom.code"></code>
          </pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.registry-showcase {
  padding: 0;
  padding-bottom: 40px;
  background: transparent;
  overflow: hidden;
}

.registry-showcase-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.registry-showcase-content {
  max-width: 420px;
}

.registry-showcase-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.7rem, 2.5vw, 2.4rem);
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.registry-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  padding: 0 14px;
  min-width: 102px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
  color: #ecfdf5;
  font-size: 0.5em;
  font-weight: 800;
  vertical-align: middle;
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.2);
}

.registry-showcase-text {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.78);
  font-size: 1.04rem;
  line-height: 1.7;
}

.registry-showcase-btn {
  margin-top: 28px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 22px;
  border-radius: 999px;
  background: #67f0a8;
  color: #052e16;
  text-decoration: none;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(16, 185, 129, 0.18);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.registry-showcase-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.registry-showcase-btn-arrow {
  font-size: 1.15rem;
  line-height: 1;
}

.registry-showcase-visual {
  position: relative;
  width: 100%;
  min-height: 500px;
}

.registry-showcase-visual .registry-code-card {
  position: absolute;
  width: min(442px, 100%);
  max-width: 100%;
}

.registry-showcase-visual .registry-code-card-top {
  top: 0;
  left: 8%;
  z-index: 1;
}

.registry-showcase-visual .registry-code-card-bottom {
  top: 230px;
  left: 16%;
  z-index: 2;
}

.registry-showcase-visual .registry-code-card .code-body {
  padding: 10px 14px 12px !important;
  overflow-x: hidden;
}

.registry-showcase-visual .registry-code-card .code-pre {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  font-size: 0.8rem;
  line-height: 1.5;
}

.registry-showcase-visual .registry-code-card .code-pre code {
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  white-space: inherit;
  overflow-wrap: inherit;
  word-break: inherit;
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

@media (max-width: 1180px) {
  .registry-showcase-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .registry-showcase-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .registry-showcase-visual {
    max-width: 620px;
    min-height: 500px;
    margin: 0 auto;
  }

  .registry-showcase-visual .registry-code-card-top {
    left: 4%;
    width: min(442px, 92%);
  }

  .registry-showcase-visual .registry-code-card-bottom {
    top: 220px;
    left: 12%;
    width: min(442px, 88%);
  }
}

@media (max-width: 820px) {
  .registry-showcase {
    padding: 80px 0;
  }

  .registry-showcase-inner {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .registry-showcase-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .registry-showcase-visual {
    min-height: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    max-width: 100%;
  }

  .registry-showcase-visual .registry-code-card {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    max-width: 100%;
  }

  .registry-showcase-visual .registry-code-card-top,
  .registry-showcase-visual .registry-code-card-bottom {
    width: 100%;
  }
}

@media (max-width: 720px) {
  .registry-showcase {
    padding: 72px 0;
  }

  .registry-showcase-inner {
    gap: 28px;
  }

  .registry-showcase-title {
    font-size: 1.7rem;
  }

  .registry-badge {
    min-width: 84px;
    height: 38px;
    padding: 0 10px;
  }

  .registry-showcase-btn {
    width: 100%;
    justify-content: center;
  }

  .registry-showcase-text {
    font-size: 0.98rem;
  }

  .registry-showcase-visual {
    width: 100%;
  }

  .registry-showcase-visual .registry-code-card .code-body {
    padding: 10px 12px !important;
  }

  .registry-showcase-visual .registry-code-card .code-pre {
    width: 100% !important;
    max-width: 100% !important;
    font-size: 0.76rem;
    line-height: 1.45;
  }

  .registry-showcase-visual .registry-code-card .head-title {
    max-width: 46vw;
  }
}

@media (max-width: 480px) {
  .registry-showcase {
    padding: 64px 0;
  }

  .registry-showcase-title {
    font-size: 1.45rem;
    line-height: 1.2;
  }

  .registry-badge {
    display: inline-flex;
    margin-top: 10px;
    margin-left: 0;
  }

  .registry-showcase-visual .registry-code-card .code-body {
    padding: 9px 10px !important;
  }

  .registry-showcase-visual .registry-code-card .code-pre {
    font-size: 0.72rem;
    line-height: 1.4;
  }
}
</style>
