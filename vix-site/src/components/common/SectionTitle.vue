<template>
  <div class="section-title" :class="{ 'section-title--center': center }">
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>

    <h2>{{ title }}</h2>

    <p v-if="description" class="section-title-desc">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  center: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.section-title {
  max-width: 760px;
}

.section-title--center {
  margin-inline: auto;
  text-align: center;
}

.section-title h2 {
  margin-top: 0.75rem;
}

.section-title-desc {
  margin-top: 1rem;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.45vw, 1.16rem);
  line-height: 1.75;
}

.section-title--center .eyebrow {
  justify-content: center;
}
</style>
