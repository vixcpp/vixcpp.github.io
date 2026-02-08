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
  if (Array.isArray(item?.preview?.lines)) return item.preview.lines;
  const code = item?.preview?.code;
  if (typeof code === "string" && code.trim()) return code.split("\n");
  return [];
}

function previewText(item) {
  const lines = previewLines(item);
  return (Array.isArray(lines) ? lines.join("\n") : "").replaceAll("\r", "");
}

</script>

<template>
  <section class="batteries">
    <div class="container">
      <header class="head">
        <h2 class="title">{{ title }}</h2>
        <p v-if="subtitle" class="subtitle">{{ subtitle }}</p>
      </header>

      <div class="grid">
        <article
          v-for="(item, idx) in (Array.isArray(items) ? items : [])"
          :key="item.title || idx"
          class="card"
        >
          <div class="card-top">
            <h3 class="card-title">{{ item.title }}</h3>
            <p v-if="item.text" class="card-text">{{ item.text }}</p>

            <a
              v-if="getHref(item)"
              class="learn"
              :href="getHref(item)"
              :target="item.external ? '_blank' : null"
              :rel="item.external ? 'noreferrer' : null"
            >
              Learn more <span class="arrow">›</span>
            </a>
          </div>

          <div v-if="hasPreview(item)" class="preview">
            <div class="preview-head">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>

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
/* Dark section like your site */
.batteries{
  padding: 3.6rem 0;
}

/* Important: do NOT redefine global .container behavior, just mimic it safely */
.container{
  width: min(1120px, calc(100% - 48px));
  margin: 0 auto;
}

.head{
  text-align: center;
  margin-bottom: 2.3rem;
}

.title{
  margin: 0;
  font-size: 2.45rem;
  line-height: 1.08;
  letter-spacing: -0.03em;
  font-weight: 850;
  color: rgba(255,255,255,.96);
}

.subtitle{
  margin: 0.95rem auto 0;
  max-width: 76ch;
  font-size: 1.05rem;
  line-height: 1.75;
  opacity: 0.82;
  color: rgba(226,232,240,.86);
}

.grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.6rem;
}

@media (max-width: 980px){
  .grid{
    grid-template-columns: 1fr;
  }
}

/* Card = same language as hero code card */
.card{
  border-radius: 16px;
  border: 1px solid rgba(148,163,184,.16);
  background: linear-gradient(180deg, rgba(2,6,23,.55), rgba(2,6,23,.38));
  box-shadow: 0 18px 46px rgba(0,0,0,.35);
  padding: 1.2rem 1.2rem 1.1rem;

  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 290px;
}

.card-title{
  margin: 0;
  font-size: 1.08rem;
  letter-spacing: -0.01em;
  font-weight: 850;
  color: rgba(255,255,255,.95);
}

.card-text{
  margin: 0.55rem 0 0;
  line-height: 1.65;
  color: rgba(226,232,240,.82);
}

.learn{
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.75rem;
  font-weight: 750;
  text-decoration: none;
  color: rgba(34,197,154,.92);
}
.learn:hover{
  color: rgba(34,197,154,1);
  text-decoration: underline;
}

.arrow{
  font-size: 1.05em;
  transform: translateY(-0.02em);
}

/* Preview terminal */
.preview{
  border-radius: 14px;
  border: 1px solid rgba(148,163,184,.14);
  background: rgba(2,6,23,.72);
  overflow: hidden;
}

.preview-head{
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 10px 12px;
  background: linear-gradient(to bottom, rgba(2,6,23,.92), rgba(2,6,23,.72));
  border-bottom: 1px solid rgba(148,163,184,.14);
}

.dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  opacity: 0.95;
}
.dot-red{ background:#fb923c; }
.dot-yellow{ background:#facc15; }
.dot-green{ background:#22c55e; }

.preview-title{
  margin-left: 0.35rem;
  font-size: 0.84rem;
  color: rgba(226,232,240,.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-body{
  padding: 12px 12px;
}

.preview-pre{
  margin: 0;
  white-space: pre;
  overflow: auto;
  max-width: 100%;
}

.preview-code{
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.86rem;
  line-height: 1.65;
  color: rgba(226,232,240,.9);
}

/* Mobile */
@media (max-width: 980px){
  .grid{
    grid-template-columns: 1fr;
  }

  .title{
    font-size: 2.05rem;
  }

  .card{
    min-height: 0;
  }
}
</style>
