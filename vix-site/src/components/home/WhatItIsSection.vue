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
.is__inner {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.is__copy > p {
  margin-top: 24px;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.78;
  max-width: 56ch;
}

.is__cards {
  display: grid;
  gap: 14px;
}

.is-card {
  padding: 22px 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--bg-panel);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease);
}

.is-card:hover {
  border-color: var(--green-line);
  box-shadow: var(--shadow-sm);
}

.is-card h3 {
  position: relative;
  padding-left: 18px;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-bottom: 9px;
}

.is-card h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.15em;
  width: 4px;
  height: 1em;
  border-radius: 2px;
  background: var(--green);
}

.is-card p {
  color: var(--text-soft);
  font-size: 0.93rem;
  line-height: 1.6;
}

@media (max-width: 860px) {
  .is__inner {
    grid-template-columns: 1fr;
  }
}
</style>
