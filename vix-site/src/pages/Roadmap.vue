<template>
  <main class="roadmap-page">
    <section class="roadmap-hero">
      <p class="eyebrow">Roadmap</p>

      <h1>Vix.cpp Roadmap</h1>

      <p class="hero-text">
        Vix.cpp is evolving into a modern C++ runtime and developer platform
        focused on fast builds, clean tooling, reliable modules, and a better
        native application workflow.
      </p>
    </section>

    <section class="roadmap-section">
      <h2>Current focus</h2>

      <div class="roadmap-grid">
        <article class="roadmap-card">
          <span class="status active">In progress</span>
          <h3>CLI developer experience</h3>
          <p>
            Improve <code>vix build</code>, <code>vix run</code>,
            <code>vix dev</code>, diagnostics, replay, and project workflows.
          </p>
        </article>

        <article class="roadmap-card">
          <span class="status active">In progress</span>
          <h3>Core runtime stability</h3>
          <p>
            Continue stabilizing the core runtime, modules, APIs, build graph,
            and long-term architecture.
          </p>
        </article>

        <article class="roadmap-card">
          <span class="status planned">Planned</span>
          <h3>Documentation and examples</h3>
          <p>
            Expand guides, API references, module documentation, tutorials,
            and real-world examples.
          </p>
        </article>
      </div>
    </section>

    <section class="roadmap-section">
      <h2>Long-term direction</h2>

      <ul class="roadmap-list">
        <li>Make C++ project creation, building, running, and testing simpler.</li>
        <li>Provide reliable modules for web, async, storage, sync, and tooling.</li>
        <li>Improve diagnostics so C++ errors become easier to understand.</li>
        <li>Support offline-first and local-first application foundations.</li>
        <li>Grow Vix.cpp into a serious foundation for native applications.</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.roadmap-page {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 96px 0;
}

.roadmap-hero {
  max-width: 760px;
  margin-bottom: 72px;
}

.eyebrow {
  margin: 0 0 16px;
  color: var(--color-primary, #34d399);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.roadmap-hero h1 {
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 5rem);
  line-height: 1;
  letter-spacing: -0.06em;
}

.hero-text {
  margin: 24px 0 0;
  color: var(--color-muted, #9ca3af);
  font-size: 1.15rem;
  line-height: 1.8;
}

.roadmap-section {
  margin-top: 64px;
}

.roadmap-section h2 {
  margin: 0 0 24px;
  font-size: 1.8rem;
  letter-spacing: -0.03em;
}

.roadmap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.roadmap-card {
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.45);
}

.roadmap-card h3 {
  margin: 14px 0 10px;
  font-size: 1.2rem;
}

.roadmap-card p {
  margin: 0;
  color: var(--color-muted, #9ca3af);
  line-height: 1.7;
}

.status {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.status.active {
  color: #bbf7d0;
  background: rgba(34, 197, 94, 0.16);
}

.status.planned {
  color: #fed7aa;
  background: rgba(249, 115, 22, 0.16);
}

.roadmap-list {
  margin: 0;
  padding-left: 20px;
  color: var(--color-muted, #9ca3af);
  line-height: 1.9;
}

@media (max-width: 760px) {
  .roadmap-page {
    padding: 72px 0;
  }

  .roadmap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
