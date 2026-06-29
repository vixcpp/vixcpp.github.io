<template>
  <figure class="image-panel">
    <a
      v-if="href"
      :href="href"
      target="_blank"
      rel="noreferrer"
      class="image-panel__link"
      :aria-label="linkLabel || alt"
    >
      <img :src="src" :alt="alt" loading="lazy" decoding="async" />
      <span v-if="linkLabel" class="image-panel__badge">
        {{ linkLabel }}
        <span aria-hidden="true">→</span>
      </span>
    </a>
    <img v-else :src="src" :alt="alt" loading="lazy" decoding="async" />

    <figcaption v-if="caption" class="image-panel__caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script setup>
defineProps({
  src: { type: String, required: true },
  alt: { type: String, required: true },
  caption: { type: String, default: "" },
  href: { type: String, default: "" },
  linkLabel: { type: String, default: "" },
});
</script>

<style scoped>
.image-panel {
  margin: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-panel);
  box-shadow: var(--shadow-md);
}

.image-panel img {
  display: block;
  width: 100%;
  height: auto;
}

/* Clickable variant */
.image-panel__link {
  position: relative;
  display: block;
}

.image-panel__link img {
  transition:
    transform var(--speed) var(--ease),
    filter var(--speed) var(--ease);
}

.image-panel__link:hover img {
  transform: scale(1.012);
}

/* Floating "Open" badge */
.image-panel__badge {
  position: absolute;
  bottom: 14px;
  right: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 13px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(251, 251, 249, 0.92);
  backdrop-filter: blur(6px);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--green-strong);
  box-shadow: var(--shadow-sm);
  opacity: 0;
  transform: translateY(4px);
  transition:
    opacity var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.image-panel__link:hover .image-panel__badge {
  opacity: 1;
  transform: translateY(0);
}

/* Caption */
.image-panel__caption {
  padding: 12px 18px;
  border-top: 1px solid var(--line-soft);
  background: var(--bg-soft);
  font-size: 0.84rem;
  color: var(--text-muted);
  text-align: center;
}

@media (hover: none), (pointer: coarse) {
  .image-panel__badge {
    opacity: 1;
    transform: none;
  }
}
</style>
