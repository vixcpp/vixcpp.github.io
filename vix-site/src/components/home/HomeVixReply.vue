<script setup>
defineProps({
  vixReply: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <section class="vix-reply">
    <div class="container vix-reply-inner">
      <div class="vix-reply-content">
        <span class="vix-reply-badge">
          {{ vixReply.badge }}
        </span>

        <h2 class="vix-reply-title">
          {{ vixReply.title }}
        </h2>

        <p class="vix-reply-subtitle">
          {{ vixReply.subtitle }}
        </p>

        <a
          v-if="vixReply.cta"
          class="vix-reply-btn"
          :href="vixReply.cta.to || vixReply.cta.href"
          :target="vixReply.cta.external ? '_blank' : null"
          :rel="vixReply.cta.external ? 'noreferrer' : null"
        >
          {{ vixReply.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="vix-reply-visual">
        <div class="code-card vix-reply-terminal">
          <div class="code-head">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>
              <span class="head-title">
                {{ vixReply.terminal.fileName }}
              </span>
            </div>
          </div>

          <div class="code-body vix-reply-code-body">
            <pre
              class="code-pre vix-reply-code-pre"
            ><code v-html="vixReply.terminal.code"></code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vix-reply {
  padding: 72px 0;
  overflow: hidden;
}

.vix-reply-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
  gap: 72px;
  align-items: center;
}

.vix-reply-content {
  max-width: 460px;
}

.vix-reply-badge {
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

.vix-reply-title {
  margin: 0;
  color: #ecfdf5;
  font-size: clamp(1.8rem, 2.7vw, 2.5rem);
  line-height: 1.1;
  font-weight: 850;
  letter-spacing: -0.035em;
}

.vix-reply-subtitle {
  margin: 18px 0 0;
  color: rgba(236, 253, 245, 0.76);
  font-size: 1.02rem;
  line-height: 1.7;
}

.vix-reply-btn {
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

.vix-reply-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(16, 185, 129, 0.24);
}

.vix-reply-visual {
  width: 100%;
}

.vix-reply-terminal {
  width: 100%;
  max-width: 680px;
  margin-left: auto;
  overflow: hidden;
  box-shadow:
    0 24px 70px rgba(0, 0, 0, 0.42),
    0 0 0 1px rgba(34, 197, 94, 0.08);
}

.vix-reply-code-body {
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
}

.vix-reply-code-pre {
  margin: 0;
  width: max-content;
  min-width: 100%;
  max-width: none;
  padding: 22px 24px;
  white-space: pre;
  word-break: normal;
  overflow-wrap: normal;
  line-height: 1.75;
}

.vix-reply-code-pre code {
  display: inline-block;
  min-width: 100%;
  white-space: pre;
}

@media (max-width: 980px) {
  .vix-reply-inner {
    grid-template-columns: 1fr;
    gap: 44px;
  }

  .vix-reply-content {
    max-width: 100%;
    text-align: center;
    margin: 0 auto;
  }

  .vix-reply-terminal {
    max-width: 720px;
    margin: 0 auto;
  }
}

@media (max-width: 720px) {
  .vix-reply {
    padding: 56px 0 72px;
  }

  .vix-reply-inner {
    gap: 36px;
  }

  .vix-reply-content {
    text-align: left;
    max-width: 100%;
  }

  .vix-reply-title {
    font-size: clamp(1.75rem, 8vw, 2.35rem);
    line-height: 1.08;
  }

  .vix-reply-subtitle {
    font-size: 1rem;
    line-height: 1.65;
  }

  .vix-reply-btn {
    width: 100%;
    justify-content: center;
  }

  .vix-reply-terminal {
    width: 100%;
    max-width: 100%;
  }

  .vix-reply-code-body {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .vix-reply-code-pre {
    margin: 0;
    width: max-content;
    min-width: 100%;
    max-width: none;
    padding: 18px 20px;
    font-size: 0.82rem;
    line-height: 1.65;
  }
}
</style>
