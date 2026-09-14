<script setup>
import { production } from "../../data/production";
</script>

<template>
  <section :id="production.id" class="production">
    <div class="container">
      <div class="production__content">
        <h2 class="production__title">
          {{ production.title }}
        </h2>

        <p class="production__description">
          {{ production.description }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.production {
  position: relative;

  padding: clamp(5rem, 8vw, 7rem) 0;

  border-top: 1px solid var(--color-border);
  background: var(--vix-bg-alt);
}

.production__content {
  max-width: 900px;
}

.production__title {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(2.3rem, 4vw, 3.55rem);

  font-weight: 660;
  line-height: 1.04;

  letter-spacing: -0.052em;
}

.production__description {
  max-width: 820px;

  margin-top: 1.15rem;

  color: var(--color-text-secondary);

  font-size: clamp(1.05rem, 1.6vw, 1.22rem);

  line-height: 1.72;
}

@media (max-width: 700px) {
  .production {
    padding-block: 4rem;
  }
}
</style>
