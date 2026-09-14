<script setup>
import { community } from "../../data/community";
import CommunityIllustration from "../community/CommunityIllustration.vue";
</script>

<template>
  <section :id="community.id" class="community">
    <div class="container">
      <h2 class="community__title">
        {{ community.title }}
      </h2>

      <div class="community__layout">
        <div class="community__visual">
          <CommunityIllustration />
        </div>

        <div class="community__content">
          <h3>
            {{ community.heading }}
          </h3>

          <p>
            {{ community.description }}
          </p>

          <a class="community__action" :href="community.action.href">
            {{ community.action.label }}

            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.community {
  padding: clamp(5rem, 8vw, 7rem) 0;

  border-top: 1px solid var(--color-border);
  background: var(--vix-bg);
}

.community__title {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(2.3rem, 4vw, 3.55rem);

  font-weight: 660;
  line-height: 1.04;

  letter-spacing: -0.052em;

  text-align: center;
}

.community__layout {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    minmax(340px, 0.82fr);

  align-items: center;

  gap: clamp(3rem, 7vw, 7rem);

  margin-top: clamp(3rem, 6vw, 5rem);
}

.community__visual {
  display: flex;
  justify-content: center;
}

.community__content {
  max-width: 520px;
}

.community__content h3 {
  margin: 0;

  color: var(--color-text);

  font-size: clamp(1.65rem, 2.7vw, 2.25rem);

  font-weight: 650;
  line-height: 1.13;

  letter-spacing: -0.04em;
}

.community__content p {
  margin-top: 1rem;

  color: var(--color-text-secondary);

  font-size: 0.98rem;
  line-height: 1.72;
}

.community__action {
  display: inline-flex;
  align-items: center;

  gap: 0.55rem;

  margin-top: 1.4rem;

  color: var(--vix-link);

  font-size: 0.85rem;
  font-weight: 620;

  text-decoration: none;
}

.community__action span {
  color: var(--vix-link);
  transition: transform 120ms ease;
}

.community__action:hover {
  color: var(--vix-link-hover);
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.community__action:hover span {
  transform: translateX(3px);
}

@media (max-width: 820px) {
  .community__layout {
    grid-template-columns: 1fr;
  }

  .community__content {
    max-width: 650px;
  }
}

@media (max-width: 700px) {
  .community {
    padding-block: 4rem;
  }
}
</style>
