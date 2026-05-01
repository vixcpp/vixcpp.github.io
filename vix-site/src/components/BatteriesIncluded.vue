<script setup>
defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  items: { type: Array, default: () => [] },
});

function getHref(item) {
  return item?.href || item?.to || "";
}

function hasPreview(item) {
  return Boolean(item?.preview?.code || item?.preview?.lines?.length);
}

function previewLines(item) {
  if (Array.isArray(item?.preview?.lines)) {
    return item.preview.lines;
  }

  const code = item?.preview?.code;

  if (typeof code === "string" && code.trim()) {
    return code.split("\n");
  }

  return [];
}

function previewText(item) {
  const lines = previewLines(item);
  return (Array.isArray(lines) ? lines.join("\n") : "").replaceAll("\r", "");
}
</script>

<template>
  <section class="batteries" aria-labelledby="batteries-title">
    <div class="batteries-shell">
      <header class="batteries-head">
        <span class="eyebrow">Included workflow</span>

        <h2 id="batteries-title" class="title">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="subtitle">
          {{ subtitle }}
        </p>
      </header>

      <div class="grid">
        <article
          v-for="(item, idx) in (Array.isArray(items) ? items : [])"
          :key="item.title || idx"
          class="card"
        >
          <div class="card-glow"></div>

          <div class="card-content">
            <div class="card-index">
              {{ String(idx + 1).padStart(2, "0") }}
            </div>

            <div class="card-main">
              <h3 class="card-title">
                {{ item.title }}
              </h3>

              <p v-if="item.text" class="card-text">
                {{ item.text }}
              </p>

              <a
                v-if="getHref(item)"
                class="learn"
                :href="getHref(item)"
                :target="item.external ? '_blank' : null"
                :rel="item.external ? 'noreferrer' : null"
              >
                Learn more
                <span class="arrow" aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          <div v-if="hasPreview(item)" class="preview">
            <div class="preview-head">
              <div class="window-dots" aria-hidden="true">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>

              <span v-if="item.preview?.title" class="preview-title">
                {{ item.preview.title }}
              </span>
            </div>

            <div class="preview-body">
              <pre class="preview-pre"><code class="preview-code">{{ previewText(item) }}</code></pre>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.batteries {
  position: relative;
  padding: 5rem 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 0%, var(--accent-soft), transparent 34%),
    radial-gradient(circle at 85% 8%, rgba(34, 197, 94, 0.07), transparent 32%),
    linear-gradient(180deg, var(--bg), var(--bg-alt));
}

.batteries::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(255, 255, 255, 0.025), transparent 18%),
    radial-gradient(circle at 50% 100%, rgba(34, 197, 94, 0.08), transparent 34%);
}

.batteries-shell {
  position: relative;
  z-index: 1;
  width: min(1160px, calc(100% - 48px));
  margin: 0 auto;
}

.batteries-head {
  max-width: 820px;
  margin: 0 auto 3rem;
  text-align: center;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.95rem;
  padding: 0.38rem 0.75rem;
  border: 1px solid rgba(34, 197, 94, 0.24);
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-light);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.title {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1.04;
  letter-spacing: -0.045em;
  font-weight: 900;
}

.subtitle {
  max-width: 76ch;
  margin: 1rem auto 0;
  color: var(--muted);
  font-size: 1.06rem;
  line-height: 1.8;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.card {
  position: relative;
  isolation: isolate;
  display: flex;
  min-height: 330px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.15rem;
  overflow: hidden;
  padding: 1.1rem;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius-lg) + 6px);
  background:
    linear-gradient(180deg, rgba(3, 26, 18, 0.92), rgba(2, 18, 8, 0.72)),
    var(--bg-elevated);
  box-shadow:
    var(--shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.045);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.card:hover {
  transform: translateY(-4px);
  border-color: rgba(34, 197, 94, 0.32);
  background:
    linear-gradient(180deg, rgba(3, 26, 18, 0.98), rgba(2, 18, 8, 0.82)),
    var(--bg-elevated);
  box-shadow:
    0 30px 90px rgba(0, 0, 0, 0.58),
    0 0 0 1px rgba(34, 197, 94, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.055);
}

.card-glow {
  position: absolute;
  inset: auto -30% -45% -30%;
  z-index: -1;
  height: 180px;
  opacity: 0;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.2), transparent 68%);
  transition: opacity 180ms ease;
}

.card:hover .card-glow {
  opacity: 1;
}

.card-content {
  display: flex;
  gap: 0.95rem;
}

.card-index {
  display: inline-flex;
  width: 2.25rem;
  height: 2.25rem;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-md);
  background: rgba(2, 13, 10, 0.72);
  color: rgba(74, 222, 128, 0.78);
  font-size: 0.78rem;
  font-weight: 900;
}

.card-main {
  min-width: 0;
}

.card-title {
  margin: 0;
  color: var(--text);
  font-size: 1.04rem;
  line-height: 1.25;
  letter-spacing: -0.018em;
  font-weight: 900;
}

.card-text {
  margin: 0.62rem 0 0;
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.68;
}

.learn {
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  margin-top: 0.85rem;
  color: var(--accent-light);
  font-size: 0.92rem;
  font-weight: 850;
  text-decoration: none;
}

.learn:hover {
  color: var(--accent);
}

.arrow {
  transform: translateX(0);
  transition: transform 160ms ease;
}

.learn:hover .arrow {
  transform: translateX(3px);
}

.preview {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: var(--radius-lg);
  background: rgba(2, 6, 23, 0.72);
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.38);
}

.preview-head {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(
    to bottom,
    rgba(2, 6, 23, 0.92),
    rgba(2, 6, 23, 0.72)
  );
}

.window-dots {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.96;
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

.preview-title {
  min-width: 0;
  overflow: hidden;
  color: #e5e7eb;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-body {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  background: #020617;
  -webkit-overflow-scrolling: touch;
}

.preview-pre {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 14px 14px;
  overflow: visible;
  white-space: pre;
  line-height: 1.65;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 197, 154, 0.48) rgba(2, 6, 23, 0.9);
}

.preview-code {
  display: inline-block;
  min-width: 100%;
  color: #e2e8f0;
  font-family:
    "JetBrains Mono",
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    monospace;
  font-size: 0.88rem;
  line-height: 1.65;
}

.preview-body::-webkit-scrollbar {
  height: 8px;
  width: 10px;
}

.preview-body::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(34, 197, 154, 0.35);
}

.preview-body::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 154, 0.55);
}

.preview-body::-webkit-scrollbar-track {
  background: rgba(2, 6, 23, 0.9);
}

@media (max-width: 1080px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .card {
    min-height: 310px;
  }
}

@media (max-width: 720px) {
  .batteries {
    padding: 3.8rem 0;
  }

  .batteries-shell {
    width: min(100% - 28px, 1160px);
  }

  .batteries-head {
    margin-bottom: 2rem;
    text-align: left;
  }

  .eyebrow {
    margin-bottom: 0.85rem;
  }

  .subtitle {
    margin-left: 0;
    margin-right: 0;
    font-size: 1rem;
    line-height: 1.7;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }

  .card {
    min-height: 0;
    border-radius: var(--radius-lg);
    padding: 1rem;
  }

  .card-content {
    gap: 0.8rem;
  }

  .card-index {
    width: 2rem;
    height: 2rem;
    border-radius: 10px;
    font-size: 0.72rem;
  }

  .card-title {
    font-size: 1rem;
  }

  .card-text {
    font-size: 0.93rem;
  }

  .preview-body {
    padding: 0.75rem 0.75rem 0.9rem;
  }

  .preview-pre::-webkit-scrollbar {
    height: 6px;
  }

  .preview-code {
    font-size: 0.78rem;
  }
}

@media (max-width: 720px) {
  .preview-title {
    max-width: 42vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-pre {
    padding: 12px 12px;
  }

  .preview-code {
    min-width: 640px;
    font-size: 0.84rem;
  }

  .preview-body::-webkit-scrollbar {
    height: 8px;
  }
}
</style>
