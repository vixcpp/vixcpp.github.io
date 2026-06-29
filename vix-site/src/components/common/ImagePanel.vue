<template>
  <figure class="image-panel">
    <a
      v-if="href"
      :href="href"
      target="_blank"
      rel="noreferrer"
      class="image-panel-link"
      :aria-label="linkLabel || alt"
    >
      <img :src="src" :alt="alt" loading="lazy" decoding="async" />
    </a>

    <img v-else :src="src" :alt="alt" loading="lazy" decoding="async" />

    <figcaption v-if="caption">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<script setup>
defineProps({
  src: {
    type: String,
    required: true,
  },
  alt: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: "",
  },
  href: {
    type: String,
    default: "",
  },
  linkLabel: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
.image-panel {
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-panel);
  box-shadow: var(--shadow-soft);
}

.image-panel img {
  width: 100%;
  height: auto;
}

.image-panel-link {
  display: block;
}

.image-panel-link:hover {
  color: inherit;
}

figcaption {
  border-top: 1px solid var(--line);
  padding: 0.9rem 1rem;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}
</style>
