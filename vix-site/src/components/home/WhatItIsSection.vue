<template>
  <section class="is section">
    <div class="is__inner container">
      <div class="is__copy">
        <SectionTitle
          eyebrow="What it is"
          title="A way to make C++ projects behave like applications earlier."
          description="A project can be created, run, built, tested, checked, packaged, and upgraded through one command surface, while still being grounded in native C++."
        />

        <p>
          Vix.cpp also provides runtime building blocks for applications, but
          the site is not the place to list every module or every API. The
          detailed command reference, module guides, examples, SDK profiles,
          internals, and design notes belong in the documentation and
          engineering blog.
        </p>
      </div>

      <div class="is__cards">
        <article class="is-card">
          <h3>Workflow</h3>
          <p>
            The repeated work around an application gets a clear command
            surface.
          </p>
        </article>

        <article class="is-card">
          <h3>Runtime</h3>
          <p>
            Application foundations live beside the normal native C++ model.
          </p>
        </article>

        <article class="is-card">
          <h3>Trust</h3>
          <p>
            Diagnostics, tests, registry workflow, SDKs, and releases are part
            of the platform.
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
.is {
  position: relative;
}

.is__inner {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
  gap: clamp(30px, 5vw, 72px);
  align-items: start;
}

.is__copy p {
  max-width: 720px;
  margin-top: 22px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.35vw, 1.12rem);
  line-height: 1.85;
}

.is__cards {
  display: grid;
  gap: 16px;
}

.is-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    rgba(7, 17, 12, 0.62);
  padding: 24px;
}

.is-card h3 {
  color: var(--text);
}

.is-card p {
  margin-top: 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.7;
}

@media (max-width: 900px) {
  .is__inner {
    grid-template-columns: 1fr;
  }
}
</style>
