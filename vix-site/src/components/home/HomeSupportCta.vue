<script setup></script>

<template>
  <section class="support-cta">
    <div class="container support-cta-inner">
      <div>
        <h2 class="section-title">Support</h2>
        <p class="section-subtitle">
          Help keep Vix.cpp moving fast. Support the runtime, the tooling, and
          the growing ecosystem.
        </p>
      </div>
      <a class="btn primary" href="/support">Go to Support</a>
    </div>
  </section>
</template>

<style scoped>
.support-cta {
  padding: 48px 0;
}

.support-cta-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  flex-wrap: wrap;
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
  .support-cta-inner {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .support-cta {
    padding: 40px 0;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
