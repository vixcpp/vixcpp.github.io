<!-- src/components/home/HomeReleaseFocus.vue -->
<script setup>
defineProps({
  releaseFocus: { type: Object, required: true },
});
</script>

<template>
  <section v-if="releaseFocus" class="registry">
    <div class="container registry-layout">
      <div class="registry-left">
        <h2 class="registry-title">{{ releaseFocus.title }}</h2>
        <p class="registry-subtitle">{{ releaseFocus.subtitle }}</p>

        <div class="registry-cta" v-if="releaseFocus.ctas?.length">
          <a
            v-for="cta in releaseFocus.ctas"
            :key="cta.label"
            :href="cta.href || cta.to"
            :class="['btn', cta.kind]"
            :target="cta.external ? '_blank' : null"
            :rel="cta.external ? 'noreferrer' : null"
          >
            {{ cta.label }}
          </a>
        </div>
      </div>

      <div class="registry-right">
        <div class="registry-card">
          <div class="registry-head">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
            <span class="registry-head-title">
              {{ releaseFocus.preview?.title || "v2.6.0" }}
            </span>
          </div>

          <div class="registry-body">
            <pre
              class="registry-pre"
            ><code class="registry-code">{{ releaseFocus.preview?.code || "" }}</code></pre>

            <p v-if="releaseFocus.note" class="registry-note">
              {{ releaseFocus.note }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.registry {
  padding: 4rem 0;
}

.registry-layout {
  display: grid;
  grid-template-columns: minmax(320px, 560px) minmax(260px, 520px);
  gap: 3rem;
  align-items: center;
}

.registry-title {
  margin: 0;
  font-size: 2.2rem;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.registry-subtitle {
  margin: 0.95rem 0 0;
  max-width: 62ch;
  font-size: 1.05rem;
  line-height: 1.7;
  opacity: 0.82;
}

.registry-cta {
  margin-top: 1.35rem;
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

/* Card style aligned with your code card language */
.registry-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: linear-gradient(
    180deg,
    rgba(2, 6, 23, 0.55),
    rgba(2, 6, 23, 0.38)
  );
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.registry-head {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 10px 12px;
  background: linear-gradient(
    to bottom,
    rgba(2, 6, 23, 0.92),
    rgba(2, 6, 23, 0.72)
  );
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
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

.registry-head-title {
  margin-left: 0.35rem;
  font-size: 0.84rem;
  color: rgba(226, 232, 240, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.registry-body {
  padding: 12px 12px 14px;
}

.registry-pre {
  margin: 0;
  white-space: pre;
  overflow: auto;
  max-width: 100%;
}

.registry-code {
  font-family:
    "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 0.86rem;
  line-height: 1.65;
  color: rgba(226, 232, 240, 0.9);
}

.registry-note {
  margin: 10px 0 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(226, 232, 240, 0.78);
}

@media (max-width: 980px) {
  .registry-layout {
    grid-template-columns: 1fr;
    gap: 1.6rem;
  }

  .registry-title {
    font-size: 1.85rem;
  }
}

@media (max-width: 640px) {
  .registry-ctas {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 20px;
  }
}
</style>
