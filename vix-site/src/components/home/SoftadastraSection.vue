<script setup>
import { softadastra } from "../../data/softadastra";
</script>

<template>
  <section :id="softadastra.id" class="softadastra">
    <div class="container">
      <div class="softadastra__content">
        <div class="softadastra__brand">
          <img
            class="softadastra__logo"
            :src="softadastra.logo"
            :alt="`${softadastra.name} logo`"
          />
          <span>{{ softadastra.name }}</span>
        </div>

        <div class="softadastra__copy">
          <h2>{{ softadastra.title }}</h2>
          <p>{{ softadastra.description }}</p>
          <a
            class="softadastra__action"
            :href="softadastra.action.href"
            target="_blank"
            rel="noreferrer"
          >
            {{ softadastra.action.label }} <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.softadastra {
  padding: clamp(4rem, 7vw, 6rem) 0;
  background: var(--vix-bg-alt);
  border-top: 1px solid var(--vix-border);
}

.softadastra__content {
  display: grid;
  grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.28fr);
  align-items: start;
  gap: clamp(2.5rem, 6vw, 6rem);
  max-width: 940px;
}

.softadastra__brand {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  color: var(--vix-text);
  font-size: clamp(1.45rem, 2.5vw, 2rem);
  font-weight: 670;
  letter-spacing: -0.04em;
}

.softadastra__logo {
  display: block;
  flex: 0 0 auto;
  width: clamp(58px, 6vw, 72px);
  height: auto;
}

.softadastra__copy {
  max-width: 650px;
  padding-left: clamp(1.5rem, 3vw, 2.5rem);
  border-left: 1px solid var(--vix-border);
}

.softadastra__copy h2 {
  margin: 0;
  color: var(--vix-text);
  font-size: clamp(1.45rem, 2.5vw, 2rem);
  font-weight: 640;
  line-height: 1.25;
  letter-spacing: -0.035em;
}

.softadastra__copy p {
  margin-top: 0.9rem;
  color: var(--vix-text-secondary);
  font-size: 0.98rem;
  line-height: 1.72;
}

.softadastra__action {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 1.25rem;
  color: var(--vix-link);
  font-size: 0.85rem;
  font-weight: 620;
  text-decoration: none;
}

.softadastra__action span {
  transition: transform 120ms ease;
}

.softadastra__action:hover {
  color: var(--vix-link-hover);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.softadastra__action:hover span {
  transform: translateX(3px);
}

@media (max-width: 760px) {
  .softadastra__content {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
  .softadastra__copy {
    padding-top: 1.5rem;
    padding-left: 0;
    border-top: 1px solid var(--vix-border);
    border-left: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .softadastra__action span {
    transition: none;
  }
  .softadastra__action:hover span {
    transform: none;
  }
}
</style>
