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
.purpose {
  position: relative;
}

.purpose__inner {
  display: grid;
  gap: 36px;
}

.purpose__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.purpose-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 24px;
}

.purpose-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(34, 197, 94, 0.45),
    transparent
  );
}

.purpose-card__index {
  color: var(--green-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 800;
}

.purpose-card h3 {
  margin-top: 18px;
}

.purpose-card p {
  margin-top: 12px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.75;
}

@media (max-width: 900px) {
  .purpose__grid {
    grid-template-columns: 1fr;
  }
}
</style>
