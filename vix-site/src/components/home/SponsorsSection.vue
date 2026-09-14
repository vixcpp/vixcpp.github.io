<script setup>
import { sponsors } from "../../data/sponsors";
</script>

<template>
  <section :id="sponsors.id" class="sponsors">
    <div class="container">
      <!-- ===================================================
           Introduction
      ==================================================== -->

      <header class="sponsors__header">
        <h2 class="sponsors__title">
          {{ sponsors.title }}
        </h2>

        <div class="sponsors__intro">
          <div class="sponsors__copy">
            <h3 class="sponsors__heading">
              {{ sponsors.heading }}
            </h3>

            <p class="sponsors__description">
              {{ sponsors.description }}
            </p>
          </div>

          <div class="sponsors__support">
            <a class="sponsors__action" :href="sponsors.action.href">
              {{ sponsors.action.label }}

              <span aria-hidden="true">→</span>
            </a>

            <p class="sponsors__note">
              {{ sponsors.note }}
            </p>
          </div>
        </div>
      </header>

      <!-- ===================================================
           Founding sponsor
      ==================================================== -->

      <div class="sponsors__group">
        <div class="sponsors__group-heading">
          <span>
            {{ sponsors.foundingSponsor.label }}
          </span>

          <div class="sponsors__group-line" />
        </div>

        <a
          class="founding-sponsor"
          :href="sponsors.foundingSponsor.href"
          target="_blank"
          rel="noreferrer"
        >
          <div class="founding-sponsor__brand">
            <img
              :src="sponsors.foundingSponsor.logo"
              :alt="`${sponsors.foundingSponsor.name} logo`"
            />
          </div>

          <div class="founding-sponsor__content">
            <span class="founding-sponsor__label"> Founding Sponsor </span>

            <strong>
              {{ sponsors.foundingSponsor.name }}
            </strong>

            <p>
              {{ sponsors.foundingSponsor.description }}
            </p>
          </div>

          <span class="founding-sponsor__external" aria-hidden="true"> ↗ </span>
        </a>
      </div>

      <!-- ===================================================
           Future sponsors
      ==================================================== -->

      <div
        v-if="sponsors.sponsors.length"
        class="sponsors__group sponsors__group--regular"
      >
        <div class="sponsors__group-heading">
          <span>Sponsors</span>

          <div class="sponsors__group-line" />
        </div>

        <div class="sponsors__grid">
          <a
            v-for="sponsor in sponsors.sponsors"
            :key="sponsor.name"
            class="sponsor-card"
            :href="sponsor.href"
            target="_blank"
            rel="noreferrer"
          >
            <img :src="sponsor.logo" :alt="`${sponsor.name} logo`" />

            <span>
              {{ sponsor.name }}
            </span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ==========================================================
   Section
========================================================== */

.sponsors {
  position: relative;

  overflow: hidden;

  padding: clamp(6rem, 11vw, 10rem) 0;

  background: var(--vix-bg);

  border-top: 1px solid rgba(74, 222, 128, 0.14);

  border-bottom: 1px solid rgba(74, 222, 128, 0.1);
}

/* ==========================================================
   Header
========================================================== */

.sponsors__header {
  max-width: 1100px;
}

.sponsors__title {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(3.7rem, 8vw, 7rem);

  font-weight: 690;
  line-height: 0.9;

  letter-spacing: -0.075em;
}

.sponsors__intro {
  display: grid;

  grid-template-columns:
    minmax(0, 1.25fr)
    minmax(260px, 0.75fr);

  align-items: end;

  gap: clamp(3rem, 8vw, 7rem);

  margin-top: clamp(2.2rem, 4vw, 3.2rem);
}

.sponsors__copy {
  max-width: 680px;
}

.sponsors__heading {
  margin: 0;

  color: #e2ebe5;

  font-size: clamp(1.55rem, 3vw, 2.35rem);

  font-weight: 620;
  line-height: 1.25;

  letter-spacing: -0.04em;
}

.sponsors__description {
  margin: 1rem 0 0;

  color: var(--color-text-secondary);

  font-size: 1rem;
  line-height: 1.75;
}

/* ==========================================================
   Support CTA
========================================================== */

.sponsors__support {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  gap: 1rem;
}

.sponsors__action {
  display: inline-flex;
  align-items: center;

  gap: 0.85rem;

  padding: 0.95rem 1.3rem;

  color: #031008;

  background: var(--vix-green-light);

  border: 1px solid var(--vix-green-light);

  border-radius: 6px;

  font-size: 0.92rem;
  font-weight: 720;

  text-decoration: none;

  transition:
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.sponsors__action:hover {
  background: #86efac;
  border-color: #86efac;

  transform: translateY(-2px);
}

.sponsors__note {
  max-width: 310px;

  margin: 0;

  color: var(--color-text-muted);

  font-size: 0.75rem;
  line-height: 1.6;
}

/* ==========================================================
   Groups
========================================================== */

.sponsors__group {
  max-width: 1100px;

  margin-top: clamp(5rem, 9vw, 8rem);
}

.sponsors__group--regular {
  margin-top: clamp(4rem, 7vw, 6rem);
}

.sponsors__group-heading {
  display: grid;
  grid-template-columns:
    auto
    minmax(0, 1fr);

  align-items: center;

  gap: 1.3rem;

  margin-bottom: 1.4rem;
}

.sponsors__group-heading > span {
  color: #829087;

  font-size: 0.72rem;
  font-weight: 650;

  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.sponsors__group-line {
  height: 1px;

  background: rgba(255, 255, 255, 0.07);
}

/* ==========================================================
   Founding sponsor
========================================================== */

.founding-sponsor {
  position: relative;

  display: grid;

  grid-template-columns:
    minmax(300px, 1.15fr)
    minmax(280px, 0.85fr);

  min-height: 360px;

  overflow: hidden;

  color: inherit;

  background: var(--vix-bg-soft);

  border: 1px solid rgba(74, 222, 128, 0.15);

  border-radius: 8px;

  text-decoration: none;

  transition:
    border-color 180ms ease,
    transform 180ms ease;
}

.founding-sponsor:hover {
  border-color: rgba(74, 222, 128, 0.36);

  transform: translateY(-2px);
}

/* ==========================================================
   Founding sponsor brand
========================================================== */

.founding-sponsor__brand {
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: clamp(3rem, 7vw, 6rem);

  background: var(--vix-bg-soft);

  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.founding-sponsor__brand::before {
  position: absolute;

  inset: 24px;

  content: "";

  border: 1px solid rgba(74, 222, 128, 0.05);

  pointer-events: none;
}

.founding-sponsor__brand img {
  position: relative;

  display: block;

  width: min(100%, 360px);
  max-height: 115px;

  object-fit: contain;
}

/* ==========================================================
   Founding sponsor copy
========================================================== */

.founding-sponsor__content {
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: clamp(2.4rem, 5vw, 4.5rem);
}

.founding-sponsor__label {
  margin-bottom: 0.75rem;

  color: var(--color-primary);

  font-size: 0.65rem;
  font-weight: 650;

  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.founding-sponsor__content strong {
  color: var(--color-text);

  font-size: clamp(2.1rem, 4vw, 3.3rem);

  font-weight: 660;
  line-height: 1;

  letter-spacing: -0.055em;
}

.founding-sponsor__content p {
  max-width: 410px;

  margin: 1rem 0 0;

  color: var(--color-text-secondary);

  font-size: 0.96rem;
  line-height: 1.72;
}

.founding-sponsor__external {
  position: absolute;

  top: 1.5rem;
  right: 1.5rem;

  color: var(--color-primary);

  font-size: 1.15rem;
}

/* ==========================================================
   Sponsor grid
========================================================== */

.sponsors__grid {
  display: grid;

  grid-template-columns: repeat(3, minmax(0, 1fr));

  gap: 1px;

  overflow: hidden;

  background: rgba(255, 255, 255, 0.06);

  border: 1px solid rgba(255, 255, 255, 0.06);

  border-radius: 8px;
}

.sponsor-card {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  gap: 1rem;

  min-height: 180px;

  padding: 2rem;

  color: var(--color-text-secondary);

  background: var(--vix-bg-soft);

  text-decoration: none;

  transition: background 160ms ease;
}

.sponsor-card:hover {
  background: var(--vix-bg-soft);
}

.sponsor-card img {
  display: block;

  width: auto;
  max-width: 72%;
  height: auto;
  max-height: 72px;

  object-fit: contain;
}

.sponsor-card span {
  font-size: 0.74rem;
}

/* ==========================================================
   Responsive
========================================================== */

@media (max-width: 850px) {
  .sponsors__intro {
    grid-template-columns: 1fr;
  }

  .founding-sponsor {
    grid-template-columns: 1fr;
  }

  .founding-sponsor__brand {
    min-height: 260px;

    border-right: 0;

    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .founding-sponsor__content {
    min-height: 210px;
  }

  .sponsors__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .sponsors {
    padding-block: 5rem;
  }

  .sponsors__title {
    font-size: clamp(3.4rem, 17vw, 5rem);
  }

  .founding-sponsor__brand {
    min-height: 220px;

    padding: 3rem 2rem;
  }

  .founding-sponsor__brand img {
    max-width: 260px;
  }

  .sponsors__grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sponsors__action,
  .founding-sponsor,
  .sponsor-card {
    transition: none;
  }
}
</style>
