<template>
  <section class="direction section">
    <div class="direction__inner container">
      <div class="direction__copy">
        <SectionTitle
          eyebrow="Post-v2.7 direction"
          title="Less surface area. More depth."
          description="Vix.cpp v2.7 marks an important foundation point for the project. After this release, the priority is not to keep adding new modules or expanding the surface area of the platform."
        />

        <div class="direction__text">
          <p>
            The next phase is focused on improving what already exists: module
            quality, registry workflow, SDK installation, diagnostics, tests, CI
            coverage, release quality, examples, documentation, and real
            application validation.
          </p>

          <p>
            This is not because Vix.cpp is waiting to become stable. Vix.cpp is
            already usable, and it is already being validated through real
            applications. The next phase is about maturity: fewer unnecessary
            additions, more depth, better maintenance, and stronger confidence
            in the platform.
          </p>

          <p>
            New features can still happen, but they should earn their place. A
            feature belongs in Vix.cpp when it improves the existing workflow,
            strengthens an existing module, or solves a practical problem that
            matters for real C++ applications.
          </p>
        </div>
      </div>

      <aside class="direction__panel panel">
        <p class="direction__label">Focus after v2.7</p>

        <ul>
          <li>Improve existing modules</li>
          <li>Strengthen the registry workflow</li>
          <li>Improve SDK installation</li>
          <li>Expand tests and CI coverage</li>
          <li>Refine diagnostics and documentation</li>
          <li>Keep validating real applications</li>
        </ul>
      </aside>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
</script>

<style scoped>
.direction__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.direction__text {
  margin-top: 28px;
  display: grid;
  gap: 20px;
}

.direction__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.78;
}

/* Panel — sticky focus list */
.direction__panel {
  position: sticky;
  top: 84px;
  padding: 28px 26px;
}

.direction__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
  margin-bottom: 18px;
}

.direction__panel ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 13px;
}

.direction__panel li {
  position: relative;
  padding-left: 24px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 500;
  line-height: 1.5;
}

.direction__panel li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.5em;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--green);
}

@media (max-width: 860px) {
  .direction__inner {
    grid-template-columns: 1fr;
  }
  .direction__panel {
    position: static;
  }
}
</style>
