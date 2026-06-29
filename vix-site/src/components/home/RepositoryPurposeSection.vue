<template>
  <section class="purpose section">
    <div class="purpose__inner container">
      <SectionTitle
        eyebrow="Purpose"
        title="What Vix.cpp is useful for."
        description="Vix.cpp is for developers who want to build native C++ applications without rebuilding the same project workflow every time. It gives the work around the code a clearer shape while keeping the C++ toolchain visible and usable."
      />

      <div class="purpose__grid">
        <article class="purpose-card">
          <span class="purpose-card__index">01</span>
          <h3>Start real C++ applications earlier</h3>
          <p>
            Create a project, run it, build it, test it, check it, and move it
            toward production through one consistent workflow.
          </p>
        </article>

        <article class="purpose-card">
          <span class="purpose-card__index">02</span>
          <h3>Keep the native model</h3>
          <p>
            Vix.cpp works with C++ compilers, CMake, native build tools, and
            ordinary executables or libraries instead of replacing them.
          </p>
        </article>

        <article class="purpose-card">
          <span class="purpose-card__index">03</span>
          <h3>Build with a clearer foundation</h3>
          <p>
            The CLI, runtime, SDK profiles, registry workflow, diagnostics,
            documentation, and release process are designed to support the same
            application-first direction.
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";
</script>

<style scoped>
.purpose__inner {
  max-width: 1000px;
}

.purpose__grid {
  margin-top: 44px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.purpose-card {
  padding: 30px 26px;
  background: var(--bg-panel);
  transition: background var(--speed) var(--ease);
}

.purpose-card:hover {
  background: var(--bg-soft);
}

.purpose-card__index {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--green-strong);
  margin-bottom: 16px;
}

.purpose-card h3 {
  font-size: 1.12rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 11px;
  line-height: 1.25;
}

.purpose-card p {
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.65;
}
</style>
