<template>
  <section class="support">
    <div class="container">
      <header class="hero">
        <h1>{{ data.hero.title }}</h1>
        <p class="subtitle">{{ data.hero.subtitle }}</p>
      </header>

      <section class="section" v-if="data.impact?.length">
        <h2>What your support helps with</h2>
        <ul class="list impact-list">
          <li v-for="(item, i) in data.impact" :key="`impact-${i}`">{{ item }}</li>
        </ul>
      </section>

      <section class="section">
        <h2>Why support matters</h2>
        <ul class="list">
          <li v-for="(item, i) in data.why" :key="`why-${i}`">{{ item }}</li>
        </ul>
      </section>

      <section class="section" v-if="data.socialProof">
        <h2>{{ data.socialProof.title }}</h2>
        <p class="section-subtitle">{{ data.socialProof.subtitle }}</p>

        <div class="social-proof-card">
          <p class="social-proof-empty">{{ data.socialProof.emptyLabel }}</p>
          <p class="social-proof-note">{{ data.socialProof.emptyNote }}</p>
        </div>
      </section>

      <section class="section">
        <h2>Support from anywhere</h2>

        <div class="methods">
          <article
            class="method"
            v-for="(method, i) in data.international"
            :key="`international-${i}`"
          >
            <div class="method-main">
              <h3 class="method-title">{{ method.label }}</h3>
              <p class="mono">{{ method.value }}</p>

              <button class="copy" @click="copy(method.value, method.type)">
                {{ copied === method.type ? "Copied" : "Copy address" }}
              </button>
            </div>

            <div class="method-qr" v-if="method.qr">
              <canvas :ref="(el) => setQRRef(method.type, el)"></canvas>
            </div>
          </article>
        </div>
      </section>

      <section class="section">
        <h2>Support via Mobile Money</h2>

        <div class="methods local">
          <article
            class="method"
            v-for="(method, i) in data.local"
            :key="`local-${i}`"
          >
            <div class="method-main">
              <h3 class="method-title">{{ method.label }}</h3>
              <p class="mono">{{ method.value }}</p>
              <p v-if="method.note" class="method-note">{{ method.note }}</p>

              <button class="copy" @click="copy(method.value, method.type || 'local')">
                {{ copied === (method.type || "local") ? "Copied" : "Copy number" }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="section">
        <h2>Principles</h2>
        <ul class="list">
          <li v-for="(item, i) in data.principles" :key="`principle-${i}`">{{ item }}</li>
        </ul>
      </section>

      <footer class="footnote">
        <p>{{ data.footnote }}</p>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { reactive, onMounted, ref } from "vue";
import QRCode from "qrcode";
import { SUPPORT_DATA } from "../data/support";

const data = SUPPORT_DATA;
const qrRefs = reactive({});
const copied = ref("");

function setQRRef(type, el) {
  if (el) {
    qrRefs[type] = el;
  }
}

async function copy(value, type) {
  try {
    await navigator.clipboard.writeText(value);

    copied.value = type;
    window.setTimeout(() => {
      if (copied.value === type) copied.value = "";
    }, 1200);

    if (window.gtag) {
      window.gtag("event", "support_copy", {
        method: type,
        page_path: "/support",
      });
    }
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);

      copied.value = type;
      window.setTimeout(() => {
        if (copied.value === type) copied.value = "";
      }, 1200);
    } catch (_) {
      // no-op
    }
  }
}

onMounted(() => {
  if (!Array.isArray(data.international)) return;

  data.international.forEach((method) => {
    if (method.qr && method.type && qrRefs[method.type]) {
      QRCode.toCanvas(qrRefs[method.type], method.value, {
        width: 140,
        margin: 1,
        color: {
          dark: "#ffffff",
          light: "#0a0a0a",
        },
      });
    }
  });
});
</script>

<style scoped>
.support {
  padding: 60px 16px;
  padding-top: 0 !important;
  max-width: 1100px;
  margin: 0 auto;
}

.container {
  max-width: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.hero {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 760;
  letter-spacing: -0.4px;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  max-width: 68ch;
  line-height: 1.6;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 760;
}

.section-subtitle {
  margin: -2px 0 0;
  color: var(--muted);
  line-height: 1.6;
  max-width: 65ch;
}

.list {
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list li {
  color: var(--muted);
  line-height: 1.55;
}

.impact-list li {
  color: rgba(255, 255, 255, 0.92);
}

.methods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 8px;
}

.method {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.02);
}

.method-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 640;
}

.mono {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.92);
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.method-note {
  margin: -2px 0 0;
  color: var(--muted);
  font-size: 0.88rem;
  line-height: 1.5;
}

.copy {
  width: fit-content;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  opacity: 0.95;
}

.copy:hover {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.method-qr {
  margin-top: 6px;
}

.method-qr canvas {
  width: 130px;
  height: 130px;
  display: block;
}

.methods.local {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.social-proof-card {
  padding: 18px;
  border-radius: 16px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}

.social-proof-empty {
  margin: 0 0 6px;
  font-weight: 640;
  color: rgba(255, 255, 255, 0.95);
}

.social-proof-note {
  margin: 0;
  color: var(--muted);
  line-height: 1.6;
}

.footnote {
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.55;
}

.footnote p {
  margin: 0;
}

section {
  padding-top: 0 !important;
  padding-bottom: 20px !important;
}

@media (max-width: 1000px) {
  .methods {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .methods {
    grid-template-columns: 1fr;
  }

  .support {
    padding: 50px 14px;
  }

  .container {
    gap: 28px;
  }

  .method {
    padding: 16px;
  }
}
</style>
