<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },

  // [ label, to, href, kind: "primary"|"secondary", external?: true }]
  ctas: { type: Array, default: () => [] },

  // ["Modern C++ runtime", "HTTP + WebSocket", ...]
  badges: { type: Array, default: () => [] },

  // { title: "vix run (script mode)", code: "...", note?: "..." }
  terminal: {
    type: Object,
    default: () => ({
      title: "",
      code: "",
      note: "",
    }),
  },
});

function isExternal(cta) {
  return Boolean(cta?.external || cta?.href);
}

function ctaHref(cta) {
  return cta?.href || cta?.to || "#";
}

function ctaClass(kind) {
  if (kind === "primary") return "btn primary";
  return "btn secondary";
}
</script>

<template>
  <section class="hero">
    <div class="container hero-inner">
      <!-- Left -->
      <div class="hero-copy">
        <h1 class="hero-title">{{ title }}</h1>
        <p class="hero-subtitle">{{ subtitle }}</p>

        <div v-if="ctas?.length" class="hero-ctas">
          <template v-for="cta in ctas" :key="cta.label">
            <!-- Internal -->
            <RouterLink
              v-if="cta.to && !isExternal(cta)"
              :to="cta.to"
              :class="ctaClass(cta.kind)"
            >
              {{ cta.label }}
            </RouterLink>

            <!-- External -->
            <a
              v-else
              :href="ctaHref(cta)"
              :class="ctaClass(cta.kind)"
              target="_blank"
              rel="noreferrer"
            >
              {{ cta.label }}
            </a>
          </template>
        </div>

        <div v-if="badges?.length" class="hero-badges">
          <span v-for="b in badges" :key="b" class="pill">{{ b }}</span>
        </div>

        <p v-if="terminal?.note" class="hero-note">
          {{ terminal.note }}
        </p>
      </div>

      <!-- Right -->
      <div class="hero-side">
        <div class="terminal">
          <div class="terminal-head">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="terminal-title">{{ terminal?.title }}</span>
          </div>

          <div class="terminal-body">
            <pre><code>{{ terminal?.code }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  padding: 4.5rem 0 3.5rem;
}

.hero-inner {
  display: grid;
  gap: 2.25rem;
  align-items: center;
}

@media (min-width: 980px) {
  .hero-inner {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3rem;
  }
}

.hero-title {
  font-size: clamp(2.1rem, 4vw, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 0.9rem;
}

.hero-subtitle {
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
  max-width: 60ch;
}

.hero-ctas {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin: 0 0 1.2rem;
}

.hero-badges {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}

.pill {
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  opacity: 0.95;
  white-space: nowrap;
}

.hero-note {
  margin-top: 1.05rem;
  font-size: 0.95rem;
  opacity: 0.75;
  max-width: 62ch;
}

.hero-side {
  display: flex;
  justify-content: center;
}

.terminal {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
}

.terminal-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
}

.terminal-title {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.8;
}

.terminal-body {
  padding: 0.95rem 1rem 1.05rem;
}

pre {
  margin: 0;
  white-space: pre;
  overflow: auto;
  font-size: 0.92rem;
  line-height: 1.55;
}

code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
}

.btn:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.09);
}

.btn.primary {
  background: rgba(255, 153, 0, 0.12);
  color: #fff;
}

.btn.primary:hover {
  border-color: rgba(255, 153, 0, 0.8);
  background: rgba(255, 153, 0, 0.16);
}

.btn.secondary {
  opacity: 0.95;
}
</style>
