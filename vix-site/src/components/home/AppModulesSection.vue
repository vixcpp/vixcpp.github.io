<template>
  <section class="app-modules section">
    <div class="app-modules__inner container">
      <div class="app-modules__copy">
        <SectionTitle
          eyebrow="Application modules"
          title="One backend. Clear internal modules."
          description="Vix App Modules give growing C++ applications a visible internal structure. A backend can stay one application while features such as auth, projects, builds, packages, or billing grow inside their own module boundaries."
        />

        <div class="app-modules__text">
          <p>
            A module is not a separate service by default, and it is not a
            package by default. It is a feature boundary inside the application:
            public headers, private implementation, tests, metadata, optional
            migrations, and its own build target.
          </p>

          <p>
            The application keeps the startup flow stable. Modules own
            feature-specific routes and implementation, while the active module
            graph remains visible from <code>vix.app</code>.
          </p>
        </div>

        <div class="app-modules__features">
          <article
            v-for="feature in features"
            :key="feature.title"
            class="app-modules__feature"
          >
            <span>{{ feature.index }}</span>
            <strong>{{ feature.title }}</strong>
            <p>{{ feature.text }}</p>
          </article>
        </div>

        <a
          class="app-modules__link"
          href="https://docs.vixcpp.com/app-modules/"
          target="_blank"
          rel="noreferrer"
        >
          Read App Modules docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="app-modules__panel" aria-label="Vix modules workflow">
        <div class="app-modules__panel-head">
          <p class="app-modules__label">vix modules</p>
          <strong>Feature structure that can be checked.</strong>
        </div>

        <div class="app-modules__commands">
          <CommandLine command="vix modules init" />
          <CommandLine command="vix modules add auth" />
          <CommandLine command="vix modules add projects" />
          <CommandLine command="vix modules list" />
          <CommandLine command="vix modules check" />
        </div>

        <div class="app-modules__graph">
          <p class="app-modules__graph-label">Example module graph</p>

          <div
            v-for="item in graph"
            :key="item.name"
            class="app-modules__graph-row"
          >
            <span>{{ item.name }}</span>
            <strong>{{ item.depends }}</strong>
          </div>
        </div>

        <div class="app-modules__checks">
          <div v-for="check in checks" :key="check" class="app-modules__check">
            <span aria-hidden="true" />
            {{ check }}
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const features = [
  {
    index: "01",
    title: "Feature ownership",
    text: "Routes, controllers, services, tests, metadata, and migrations can live with the feature they belong to.",
  },
  {
    index: "02",
    title: "Manifest graph",
    text: "Enabled state, module paths, kinds, and dependencies are declared from the root vix.app file.",
  },
  {
    index: "03",
    title: "Checked boundaries",
    text: "The CLI can detect missing modules, dependency cycles, duplicate route prefixes, and unsafe private includes.",
  },
];

const graph = [
  {
    name: "auth",
    depends: "root module",
  },
  {
    name: "projects",
    depends: "depends on auth",
  },
  {
    name: "builds",
    depends: "depends on projects",
  },
  {
    name: "packages",
    depends: "depends on projects",
  },
];

const checks = [
  "enabled modules exist on disk",
  "dependencies are declared",
  "route prefixes stay unique",
  "public headers avoid private src paths",
];
</script>

<style scoped>
.app-modules {
  position: relative;
  overflow: hidden;
  border-block: 1px solid var(--line-soft);
}

.app-modules::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 80% 20%,
      rgba(34, 197, 94, 0.11),
      transparent 28rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.42;
  mask-image: linear-gradient(#000, transparent 88%);
}

.app-modules__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) 430px;
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.app-modules__copy {
  min-width: 0;
}

.app-modules__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.app-modules__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.app-modules__text code {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.app-modules__features {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.app-modules__feature {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.app-modules__feature:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.app-modules__feature span {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.app-modules__feature strong {
  display: block;
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.app-modules__feature p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.app-modules__link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 30px;
  color: var(--green-strong);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 650;
  text-decoration: none;
}

.app-modules__link:hover {
  color: var(--green);
}

.app-modules__panel {
  position: sticky;
  top: 84px;
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.app-modules__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.app-modules__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.app-modules__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.app-modules__commands {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.app-modules__graph {
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.app-modules__graph-label {
  margin: 0 0 14px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.app-modules__graph-row {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid var(--line-soft);
}

.app-modules__graph-row:last-child {
  border-bottom: 0;
}

.app-modules__graph-row span {
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.86rem;
  font-weight: 850;
}

.app-modules__graph-row strong {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 650;
  line-height: 1.45;
}

.app-modules__checks {
  display: grid;
  gap: 10px;
  padding: 22px 24px 24px;
}

.app-modules__check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-soft);
  font-size: 0.84rem;
  line-height: 1.5;
}

.app-modules__check span {
  width: 7px;
  height: 7px;
  margin-top: 0.45em;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .app-modules__inner {
    grid-template-columns: 1fr;
  }

  .app-modules__panel {
    position: relative;
    top: auto;
    max-width: 680px;
  }
}

@media (max-width: 760px) {
  .app-modules__features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .app-modules__panel-head,
  .app-modules__commands,
  .app-modules__graph,
  .app-modules__checks {
    padding-inline: 20px;
  }

  .app-modules__graph-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
