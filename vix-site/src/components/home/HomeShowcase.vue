<script setup>
defineProps({
  showcase: { type: Object, required: true },
});
</script>

<template>
  <section v-if="showcase" class="vix-showcase">
    <div class="container vix-showcase-header">
      <h2 class="vix-showcase-heading">{{ showcase.heading }}</h2>
      <p class="vix-showcase-subheading">
        {{ showcase.subheading }}
      </p>
    </div>

    <div class="container vix-showcase-inner">
      <div class="vix-showcase-visual">
        <div class="code-card vix-code-editor-card">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">{{ showcase.visual.fileName }}</span>
            </div>
          </div>

          <div class="code-body">
            <pre
              class="code-pre"
            ><code v-html="showcase.visual.code"></code></pre>
          </div>
        </div>

        <div class="vix-terminal-card">
          <div class="vix-terminal-head">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>

          <div class="vix-terminal-body">
            <pre><code v-html="showcase.visual.terminal"></code></pre>
          </div>
        </div>
      </div>

      <div class="vix-showcase-content">
        <h3 class="vix-showcase-title">
          {{ showcase.content.title }}
          <span class="vix-badge vix-badge-cpp">{{
            showcase.content.badge
          }}</span>
        </h3>

        <p class="vix-showcase-text">{{ showcase.content.text }}</p>

        <a :href="showcase.content.cta.to" class="vix-showcase-btn">
          {{ showcase.content.cta.label }}
          <span class="vix-showcase-btn-arrow">›</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vix-showcase {
  padding: 96px 0;
  background: #f5f5f5;
}

.vix-showcase-inner {
  display: grid;
  grid-template-columns: minmax(320px, 1.15fr) minmax(280px, 0.85fr);
  gap: 72px;
  align-items: center;
}

.vix-showcase-visual {
  position: relative;
  min-height: 430px;
  width: 100%;
}

.vix-code-editor-card {
  position: relative;
  width: min(100%, 560px);
  z-index: 1;
}

.vix-code-editor-card .code-body {
  padding-bottom: 120px;
}

/* terminal desktop */
.vix-terminal-card {
  position: absolute;
  left: 48px;
  bottom: 26px;
  width: min(100%, 420px);
  background: #0b0f17;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.22);
  z-index: 3;
}

.vix-terminal-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: #0f141b;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.vix-terminal-body {
  padding: 16px 18px 18px;
}

.vix-terminal-body pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.vix-terminal-body code {
  font-family:
    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", monospace;
  color: #e6edf3;
  font-size: 0.88rem;
  line-height: 1.8;
}

.vix-terminal-green {
  color: #66e3a4;
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

/* tablette */
@media (max-width: 980px) {
  .vix-showcase {
    padding: 0;
  }

  .vix-showcase-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .vix-showcase-visual {
    min-height: 400px;
  }

  .vix-showcase-content {
    max-width: 100%;
    text-align: center;
  }

  .vix-showcase-text {
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* mobile */
@media (max-width: 720px) {
  .vix-showcase {
    padding: 64px 0;
  }

  .vix-showcase-inner {
    gap: 36px;
  }

  .vix-showcase-visual {
    min-height: auto;
  }

  .vix-code-editor-card {
    width: 100%;
  }

  .vix-code-editor-card .code-body {
    padding-bottom: 0;
  }

  .code-head {
    padding: 10px 10px;
  }

  .head-title {
    max-width: 42vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .code-pre {
    font-size: 0.8rem;
    min-width: 0; /* important */
    width: max-content;
  }

  .code-body {
    overflow-x: auto;
    overflow-y: hidden;
  }

  .vix-terminal-card {
    position: relative; /* important */
    left: 0;
    bottom: 0;
    width: 100%;
    margin-top: 14px;
  }

  .vix-showcase-content {
    text-align: center;
    max-width: 100%;
  }

  .vix-showcase-title {
    font-size: 2rem;
  }

  .vix-badge {
    min-width: 54px;
    height: 48px;
    padding: 0 12px;
    border-radius: 9px;
  }

  .vix-showcase-text {
    font-size: 1rem;
  }

  .vix-showcase-btn {
    width: 100%;
    justify-content: center;
  }
}

.vix-showcase-title {
  margin: 0;
  color: #ecfdf5;

  font-size: clamp(1.4rem, 2.6vw, 2.2rem);

  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.vix-badge-cpp {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 96px;
  height: 58px;
  padding: 0 18px;
  margin-left: 8px;
  border-radius: 12px;

  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: #e2e8f0;

  font-size: 0.56em;
  font-weight: 800;
  letter-spacing: 0.02em;

  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.vix-showcase-btn {
  margin-top: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 16px 24px;
  border-radius: 999px;

  background: linear-gradient(180deg, #4ade80 0%, #22c55e 100%);
  color: #022c22;

  font-size: 0.98rem;
  font-weight: 700;
  text-decoration: none;
  border: none;

  box-shadow: 0 10px 24px rgba(34, 197, 94, 0.22);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.vix-showcase-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(34, 197, 94, 0.32);
  filter: brightness(1.05);
}

.vix-showcase-btn-arrow {
  font-size: 1.15rem;
  font-weight: 800;
}

@media (max-width: 720px) {
  .vix-badge-cpp {
    min-width: 72px;
    height: 46px;
    padding: 0 12px;
    border-radius: 10px;
  }

  .vix-showcase-btn {
    width: 100%;
    padding: 15px 18px;
    font-size: 0.95rem;
  }
}

.vix-showcase-header {
  text-align: center;
  max-width: 860px;
  margin: 0 auto 72px;

  /* léger effet glass */
  backdrop-filter: blur(2px);
}

.vix-showcase-heading {
  margin: 0;
  font-size: clamp(2.4rem, 4.5vw, 3.6rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  color: #ecfdf5;
}

.vix-showcase-subheading {
  margin: 20px 0 0;
  font-size: 1.15rem;
  line-height: 1.7;

  /* gris verdâtre, pas gris pur */
  color: rgba(236, 253, 245, 0.7);
}

@media (max-width: 720px) {
  .vix-showcase-header {
    margin-bottom: 48px;
    padding: 0 10px;
  }

  .vix-showcase-heading {
    font-size: 2rem;
  }

  .vix-showcase-subheading {
    font-size: 1rem;
  }
}

@media (max-width: 720px) {
  .vix-showcase-title {
    font-size: 1.5rem;
    line-height: 1.3;
  }
}
</style>
