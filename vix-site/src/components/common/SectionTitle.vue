<template>
  <div class="section-title" :class="{ 'section-title--center': center }">
    <p v-if="eyebrow" class="section-title__eyebrow">
      <span class="section-title__tick" aria-hidden="true" />
      {{ eyebrow }}
    </p>
    <h2 class="section-title__heading">{{ title }}</h2>
    <p v-if="description" class="section-title__desc">{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: "" },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  center: { type: Boolean, default: false },
});
</script>

<style scoped>
.section-title {
  max-width: 760px;
}

.section-title--center {
  max-width: 720px;
  margin-inline: auto;
  text-align: center;
}

/* Eyebrow — mono label with leading tick */
.section-title__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 18px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
}

.section-title__tick {
  width: 16px;
  height: 1.5px;
  background: var(--green);
  border-radius: 2px;
}

.section-title--center .section-title__eyebrow {
  justify-content: center;
}

/* Heading */
.section-title__heading {
  font-size: clamp(1.7rem, 3.2vw, 2.6rem);
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.034em;
  color: var(--text);
  max-width: 20ch;
}

.section-title--center .section-title__heading {
  margin-inline: auto;
}

/* Description */
.section-title__desc {
  margin-top: 20px;
  color: var(--text-soft);
  font-size: clamp(1.02rem, 1.4vw, 1.18rem);
  line-height: 1.72;
  max-width: 60ch;
}

.section-title--center .section-title__desc {
  margin-inline: auto;
}

@media (max-width: 640px) {
  .section-title__heading {
    max-width: 100%;
  }
}
</style>
