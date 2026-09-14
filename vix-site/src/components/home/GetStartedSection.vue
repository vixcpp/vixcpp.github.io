<script setup>
import { getStarted } from "../../data/getStarted";
</script>

<template>
  <section :id="getStarted.id" class="get-started">
    <div class="container">
      <div class="get-started__content">
        <h2 class="get-started__title">
          {{ getStarted.title }}
        </h2>

        <p class="get-started__description">
          {{ getStarted.description }}
        </p>

        <div class="get-started__actions">
          <RouterLink
            class="get-started__action get-started__action--primary"
            :to="getStarted.primaryAction.to"
          >
            {{ getStarted.primaryAction.label }}

            <span aria-hidden="true"> → </span>
          </RouterLink>

          <a
            class="get-started__action"
            :href="getStarted.secondaryAction.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ getStarted.secondaryAction.label }}

            <span aria-hidden="true"> ↗ </span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.get-started {
  position: relative;

  padding: clamp(4.5rem, 7vw, 6rem) 0;

  background: var(--vix-bg-alt);

  border-top: 1px solid var(--color-border);
}

.get-started__content {
  max-width: 720px;

  margin-inline: auto;

  text-align: center;
}

.get-started__title {
  margin: 0;

  color: var(--vix-text);

  font-size: clamp(2.2rem, 4vw, 3.6rem);

  font-weight: 680;
  line-height: 1.02;

  letter-spacing: -0.045em;
}

.get-started__description {
  max-width: 650px;

  margin: 0.9rem auto 0;

  color: var(--color-text-secondary);

  font-size: clamp(1rem, 1.4vw, 1.1rem);

  line-height: 1.72;
}

.get-started__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  gap: 0.9rem;

  margin-top: 1.5rem;
}

.get-started__action {
  display: inline-flex;
  align-items: center;

  gap: 0.65rem;

  padding: 0.85rem 1.1rem;

  color: var(--vix-link);

  border: 1px solid rgba(255, 255, 255, 0.1);

  border-radius: 6px;

  font-size: 0.88rem;
  font-weight: 620;

  text-decoration: none;

  transition:
    color 160ms ease,
    background 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.get-started__action:hover {
  color: var(--vix-link-hover);
  background: rgba(255, 255, 255, 0.025);

  border-color: var(--vix-link-hover);

  transform: translateY(-1px);
}

.get-started__action--primary {
  color: #041008;

  background: var(--vix-green-light);

  border-color: var(--vix-green-light);

  font-weight: 700;
}

.get-started__action--primary:hover {
  color: #041008;

  background: #86efac;

  border-color: #86efac;
}

.get-started__action span {
  font-size: 0.95rem;
}

@media (max-width: 560px) {
  .get-started {
    padding-block: 4.5rem;
  }

  .get-started__actions {
    align-items: stretch;
    flex-direction: column;

    max-width: 320px;

    margin-inline: auto;
    margin-top: 1.5rem;
  }

  .get-started__action {
    justify-content: space-between;
  }
}

@media (prefers-reduced-motion: reduce) {
  .get-started__action {
    transition: none;
  }
}
</style>
