<!-- src/components/home/HomeStableFoundation.vue -->
<script setup>
defineProps({
  stableFoundation: { type: Object, required: true },
});
</script>

<template>
  <section v-if="stableFoundation" class="home-roadmap">
    <div class="container home-roadmap-inner">
      <div class="home-roadmap-head">
        <p class="home-roadmap-eyebrow">
          {{ stableFoundation.eyebrow }}
        </p>

        <h2 class="section-title">
          {{ stableFoundation.title }}
        </h2>

        <p class="section-subtitle">
          {{ stableFoundation.subtitle }}
        </p>

        <a
          v-if="stableFoundation.cta"
          class="btn secondary home-roadmap-btn"
          :href="stableFoundation.cta.to"
        >
          {{ stableFoundation.cta.label }}
          <span>›</span>
        </a>
      </div>

      <div class="home-roadmap-timeline">
        <article
          v-for="item in stableFoundation.items"
          :key="item.title"
          class="home-roadmap-phase"
        >
          <div class="home-roadmap-marker">
            <span></span>
          </div>

          <div class="home-roadmap-card">
            <p class="home-roadmap-phase-label">
              {{ item.label }}
            </p>

            <h3>{{ item.title }}</h3>

            <p>{{ item.text }}</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-roadmap {
  padding: 72px 0;
  background:
    radial-gradient(
      circle at top left,
      rgba(34, 197, 94, 0.1),
      transparent 34%
    ),
    rgba(34, 197, 94, 0.02);
}

.home-roadmap-inner {
  display: grid;
  grid-template-columns: minmax(280px, 0.85fr) minmax(320px, 1.15fr);
  gap: 56px;
  align-items: start;
}

.home-roadmap-head {
  position: sticky;
  top: calc(var(--hdr-h, 72px) + 24px);
}

.home-roadmap-eyebrow {
  margin: 0 0 12px;
  color: #4ade80;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.home-roadmap-btn {
  margin-top: 24px;
}

.home-roadmap-btn span {
  font-size: 1.1rem;
  line-height: 1;
}

.home-roadmap-timeline {
  display: grid;
  gap: 16px;
}

.home-roadmap-phase {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 16px;
}

.home-roadmap-marker {
  position: relative;
  display: flex;
  justify-content: center;
}

.home-roadmap-marker::after {
  content: "";
  position: absolute;
  top: 32px;
  bottom: -18px;
  width: 1px;
  background: rgba(34, 197, 94, 0.22);
}

.home-roadmap-phase:last-child .home-roadmap-marker::after {
  display: none;
}

.home-roadmap-marker span {
  width: 14px;
  height: 14px;
  margin-top: 18px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 7px rgba(34, 197, 94, 0.1);
}

.home-roadmap-card {
  padding: 20px 22px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.035),
      rgba(255, 255, 255, 0.015)
    ),
    rgba(2, 13, 10, 0.7);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.18);
}

.home-roadmap-phase-label {
  margin: 0 0 8px;
  color: #4ade80;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-roadmap-card h3 {
  margin: 0 0 8px;
  color: #f1f5f9;
  font-size: 1.05rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.home-roadmap-card p:last-child {
  margin: 0;
  color: rgba(203, 213, 225, 0.72);
  font-size: 0.9rem;
  line-height: 1.7;
}

.section-title {
  margin: 0 0 12px;
  font-size: clamp(1.5rem, 2.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #f1f5f9;
}

.section-subtitle {
  margin: 0;
  font-size: 0.98rem;
  color: rgba(203, 213, 225, 0.72);
  line-height: 1.7;
  max-width: 52ch;
}

@media (max-width: 980px) {
  .home-roadmap-inner {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .home-roadmap-head {
    position: static;
  }
}

@media (max-width: 640px) {
  .home-roadmap {
    padding: 48px 0;
  }

  .home-roadmap-phase {
    grid-template-columns: 22px minmax(0, 1fr);
    gap: 12px;
  }

  .home-roadmap-card {
    padding: 18px;
  }

  .home-roadmap-btn {
    width: 100%;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
