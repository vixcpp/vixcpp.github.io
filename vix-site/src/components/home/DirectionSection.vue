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
.direction {
  position: relative;
}

.direction__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: clamp(30px, 5vw, 72px);
  align-items: start;
}

.direction__text {
  max-width: 760px;
  margin-top: 24px;
  display: grid;
  gap: 18px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.direction__panel {
  position: sticky;
  top: 104px;
  padding: 28px;
}

.direction__label {
  color: var(--green-soft);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

ul {
  margin: 20px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 13px;
}

li {
  position: relative;
  padding-left: 22px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.55;
}

li::before {
  content: "";
  position: absolute;
  top: 0.62em;
  left: 0;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.45);
}

@media (max-width: 920px) {
  .direction__inner {
    grid-template-columns: 1fr;
  }

  .direction__panel {
    position: relative;
    top: auto;
  }
}
</style>
