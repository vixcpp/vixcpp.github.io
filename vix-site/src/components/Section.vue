<script setup>
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },

  alt: { type: Boolean, default: false },
  id: { type: String, default: "" },
  tight: { type: Boolean, default: false },
});
</script>

<template>
  <section
    class="section"
    :class="{ alt, tight }"
    :id="id || null"
  >
    <div class="container">
      <header class="section-head">
        <h2 class="section-title">{{ title }}</h2>
        <p v-if="subtitle" class="section-subtitle">
          {{ subtitle }}
        </p>
      </header>

      <div class="section-body">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.section {
  padding: 3.6rem 0;
}

.section.tight {
  padding: 2.6rem 0;
}

.section.alt {
  background: rgba(255, 255, 255, 0.03);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.section-head {
  margin-bottom: 1.65rem;
}

.section-title {
  margin: 0;
  font-size: 1.55rem;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.section-subtitle {
  margin: 0.65rem 0 0;
  max-width: 75ch;
  opacity: 0.85;
  line-height: 1.6;
}

.section-body {
  margin-top: 1.1rem;
}
</style>
