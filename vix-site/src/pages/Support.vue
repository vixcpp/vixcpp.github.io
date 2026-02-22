<template>
  <section class="support">
    <div class="container">
      <header class="hero">
        <h1>{{ data.hero.title }}</h1>
        <p class="subtitle">{{ data.hero.subtitle }}</p>
      </header>

      <section class="section">
        <h2>Why Support Matters</h2>
        <ul class="list">
          <li v-for="(item, i) in data.why" :key="i">{{ item }}</li>
        </ul>
      </section>

      <section class="section">
        <h2>International Support</h2>

        <div class="methods">
          <article class="method" v-for="(method, i) in data.international" :key="i">
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
        <h2>Local Support (Africa)</h2>

        <div class="methods local">
          <article class="method" v-for="(method, i) in data.local" :key="i">
            <div class="method-main">
              <h3 class="method-title">{{ method.label }}</h3>
              <p class="mono">{{ method.value }}</p>

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
          <li v-for="(item, i) in data.principles" :key="i">{{ item }}</li>
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
const copied = ref(""); // stores last copied method type (usdt/btc/eth/momo/local)

function setQRRef(type, el) {
  if (el) qrRefs[type] = el;
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
    // Fallback for older browsers / blocked clipboard
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
  data.international.forEach((method) => {
    if (method.qr && qrRefs[method.type]) {
      QRCode.toCanvas(qrRefs[method.type], method.value, {
        width: 140,
        margin: 1,
        color: { dark: "#ffffff", light: "#0a0a0a" },
      });
    }
  });
});
</script>

<style scoped>
.support{
  padding: 60px 16px;
  padding-top: 0 !important;
  max-width: 1100px;
  margin: 0 auto;
}

.container{
  max-width: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.hero{
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

h1{
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.4rem);
  font-weight: 760;
  letter-spacing: -0.4px;
}

.subtitle{
  margin: 0;
  color: var(--muted);
  max-width: 68ch;
  line-height: 1.6;
}

.section{
  display: flex;
  flex-direction: column;
  gap: 14px;
}

h2{
  margin: 0;
  font-size: 1.15rem;
  font-weight: 760;
}

.list{
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list li{
  color: var(--muted);
  line-height: 1.55;
}

/* INTERNATIONAL GRID */
.methods{
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  margin-top: 8px;
}

.method{
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-title{
  margin: 0;
  font-size: 0.95rem;
  font-weight: 640;
}

.mono{
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 0.88rem;
  color: rgba(255,255,255,.92);
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.copy{
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  font-size: 0.88rem;
  opacity: 0.95;
}

.copy:hover{
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.method-qr{
  margin-top: 6px;
}

.method-qr canvas{
  width: 130px;
  height: 130px;
}

/* LOCAL stays column */
.methods.local{
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.footnote{
  font-size: 0.85rem;
  color: var(--muted);
  line-height: 1.55;
}

.footnote p{
  margin: 0;
}

section{
  padding-top: 0 !important;
  padding-bottom: 20px !important;
}

/* Tablet */
@media (max-width: 1000px){
  .methods{
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* Mobile */
@media (max-width: 640px){
  .methods{
    grid-template-columns: 1fr;
  }

  .support{
    padding: 50px 14px;
  }

  .container{
    gap: 28px;
  }
}
</style>
