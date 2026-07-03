<template>
  <section class="vix-app section-tight">
    <div class="vix-app__inner container">
      <div class="vix-app__copy">
        <SectionTitle
          eyebrow="vix.app"
          title="Describe the application once. Let Vix generate the build input."
          description="vix.app is the readable application manifest for Vix projects that choose the app-first workflow. It keeps the target name, source files, include roots, linked targets, runtime resources, output directory, and internal modules visible from the project root."
        />

        <div class="vix-app__text">
          <p>
            The manifest is not meant to become a large build script. It should
            describe the application shape clearly enough that another developer
            can open the project root and understand what is being built.
          </p>

          <p>
            Existing CMake projects still keep their build behavior. When a root
            <code>CMakeLists.txt</code> exists, Vix uses it first. When the
            project is a pure <code>vix.app</code> application, Vix generates
            the internal build input under <code>.vix/generated/app/</code>.
          </p>
        </div>

        <div class="vix-app__cards">
          <article v-for="item in items" :key="item.title" class="vix-app-card">
            <span class="vix-app-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="vix-app__link"
          href="https://docs.vixcpp.com/guides/vix-app/"
          target="_blank"
          rel="noreferrer"
        >
          Read vix.app docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="vix-app__panel" aria-label="vix.app manifest preview">
        <div class="vix-app__panel-head">
          <p class="vix-app__label">application manifest</p>
          <strong>A small file that describes the real target.</strong>
        </div>

        <div class="vix-app__code">
          <pre><code>{{ manifest }}</code></pre>
        </div>

        <div class="vix-app__commands">
          <CommandLine command="vix build" />
          <CommandLine command="vix run" />
        </div>

        <div class="vix-app__resolution">
          <p class="vix-app__resolution-label">Resolution order</p>

          <div
            v-for="(step, index) in resolution"
            :key="step.name"
            class="vix-app__resolution-row"
          >
            <span>{{ String(index + 1).padStart(2, "0") }}</span>

            <div>
              <strong>{{ step.name }}</strong>
              <p>{{ step.text }}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import CommandLine from "@/components/common/CommandLine.vue";
import SectionTitle from "@/components/common/SectionTitle.vue";

const manifest = `name = "api"
type = "executable"
standard = "c++20"
output_dir = "bin"

sources = [
  "src/main.cpp",
]

include_dirs = [
  "include",
  "src",
]

packages = [
  "vix",
]

links = [
  "vix::vix",
]

resources = [
  ".env=.env",
  "public=public",
]

[module.auth]
enabled = true
path = "modules/auth"
kind = "backend"
depends = []`;

const items = [
  {
    index: "01",
    title: "Application shape",
    text: "The manifest shows the target name, source files, include roots, linked targets, resources, and output directory.",
  },
  {
    index: "02",
    title: "CMake fallback",
    text: "Existing projects keep their root CMakeLists.txt behavior until the migration to vix.app is explicit.",
  },
  {
    index: "03",
    title: "Generated build",
    text: "Vix turns the manifest into internal build files while the project keeps vix.app as the source of truth.",
  },
];

const resolution = [
  {
    name: "CMakeLists.txt",
    text: "Existing CMake project path.",
  },
  {
    name: "vix.app",
    text: "App-first manifest path.",
  },
];
</script>

<style scoped>
.vix-app {
  position: relative;
  overflow: hidden;
  border-block: 1px solid var(--line-soft);
}

.vix-app::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 76% 18%,
      rgba(34, 197, 94, 0.1),
      transparent 26rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.42;
  mask-image: linear-gradient(#000, transparent 88%);
}

.vix-app__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) 440px;
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.vix-app__copy {
  min-width: 0;
}

.vix-app__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.vix-app__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.vix-app__text code {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.vix-app__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.vix-app-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.vix-app-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.vix-app-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.vix-app-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.vix-app-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.vix-app__link {
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

.vix-app__link:hover {
  color: var(--green);
}

.vix-app__panel {
  position: sticky;
  top: 84px;
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.vix-app__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.vix-app__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.vix-app__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.vix-app__code {
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.vix-app__code pre {
  margin: 0;
  overflow: auto;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  padding: 18px;
  color: var(--text-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.62;
}

.vix-app__code code {
  font-family: inherit;
  white-space: pre;
}

.vix-app__commands {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.vix-app__resolution {
  display: grid;
  gap: 12px;
  padding: 22px 24px 24px;
}

.vix-app__resolution-label {
  margin: 0 0 2px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.vix-app__resolution-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.vix-app__resolution-row > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.68rem;
  font-weight: 850;
}

.vix-app__resolution-row strong {
  display: block;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 850;
}

.vix-app__resolution-row p {
  margin-top: 5px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.5;
}

@media (max-width: 980px) {
  .vix-app__inner {
    grid-template-columns: 1fr;
  }

  .vix-app__panel {
    position: relative;
    top: auto;
    max-width: 720px;
  }
}

@media (max-width: 760px) {
  .vix-app__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .vix-app__panel-head,
  .vix-app__code,
  .vix-app__commands,
  .vix-app__resolution {
    padding-inline: 20px;
  }

  .vix-app__code pre {
    font-size: 0.74rem;
  }
}
</style>
