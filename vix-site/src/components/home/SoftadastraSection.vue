<template>
  <section class="softadastra section-tight">
    <div class="softadastra__inner container">
      <div class="softadastra__panel">
        <div class="softadastra__content">
          <p class="softadastra__eyebrow">Maintained by Softadastra</p>

          <h2>Softadastra is the C++ tooling company behind Vix.cpp.</h2>

          <p>
            Vix.cpp is maintained by Softadastra, a company focused on making
            modern C++ development more direct, coherent, and practical for real
            applications.
          </p>

          <a
            class="softadastra__link"
            :href="links.softadastra"
            target="_blank"
            rel="noreferrer"
          >
            Visit Softadastra <span aria-hidden="true">→</span>
          </a>
        </div>

        <aside class="softadastra__side" aria-label="Softadastra focus">
          <div class="softadastra__mark" aria-hidden="true">S</div>

          <div class="softadastra__focus">
            <p>Company focus</p>
            <strong>The C++ Tooling Company</strong>
            <span>
              Building tools, runtimes, workflows, and developer infrastructure
              around native C++ projects.
            </span>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup>
import { links } from "@/data/links";
</script>

<style scoped>
.softadastra {
  position: relative;
}

.softadastra__inner {
  max-width: 980px;
}

.softadastra__panel {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 320px;
  gap: clamp(28px, 5vw, 56px);
  align-items: center;
  padding: clamp(32px, 5vw, 56px);
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-xl);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.softadastra__content {
  min-width: 0;
}

.softadastra__eyebrow {
  margin: 0 0 16px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--green-bright);
}

.softadastra__panel h2 {
  max-width: 18ch;
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.08;
  letter-spacing: -0.045em;
}

.softadastra__panel p {
  max-width: 58ch;
  margin: 22px 0 0;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.78;
}

.softadastra__link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 28px;
  padding: 0.72rem 1rem;
  border: 1px solid rgba(34, 197, 94, 0.24);
  border-radius: var(--radius-md);
  background: rgba(34, 197, 94, 0.07);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.86rem;
  font-weight: 750;
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.softadastra__link:hover {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(34, 197, 94, 0.1);
  transform: translateY(-1px);
}

.softadastra__side {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 22px;
  border: 1px solid var(--line-ink);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.025);
}

.softadastra__mark {
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-weight: 900;
}

.softadastra__focus p {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.softadastra__focus strong {
  display: block;
  color: var(--text);
  font-size: 1.02rem;
  font-weight: 850;
  line-height: 1.3;
  letter-spacing: -0.03em;
}

.softadastra__focus span {
  display: block;
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 0.84rem;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .softadastra__panel {
    grid-template-columns: 1fr;
  }

  .softadastra__panel h2 {
    max-width: 15ch;
  }

  .softadastra__side {
    max-width: 520px;
  }
}

@media (max-width: 520px) {
  .softadastra__panel {
    padding: 28px 22px;
  }

  .softadastra__panel h2 {
    font-size: clamp(2rem, 12vw, 2.65rem);
  }

  .softadastra__side {
    padding: 18px;
  }
}
</style>
