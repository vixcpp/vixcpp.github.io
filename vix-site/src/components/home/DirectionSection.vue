<template>
  <section class="direction section">
    <div class="direction__inner container">
      <div class="direction__copy">
        <SectionTitle
          eyebrow="Post-v2.7 direction"
          title="Depth over surface area."
          description="Vix.cpp v2.7 is a foundation release. The next phase is not about adding more and more modules. It is about making the existing workflow deeper, clearer, better tested, easier to install, and stronger for real applications."
        />

        <div class="direction__statement">
          <span class="direction__statement-mark" aria-hidden="true">V</span>
          <p>
            The direction after v2.7 is simple:
            <strong>less unnecessary expansion, more engineering depth.</strong>
          </p>
        </div>

        <div class="direction__text">
          <p>
            The focus now moves to the parts that make a platform trustworthy:
            module quality, registry behavior, SDK installation, diagnostics,
            CI, tests, release checks, documentation, examples, and real project
            validation.
          </p>

          <p>
            Vix.cpp is already usable. This phase is not about waiting for the
            project to become real. It is about making the existing foundation
            more reliable, more coherent, and easier to maintain as the platform
            grows.
          </p>

          <p>
            New features still belong in Vix.cpp when they strengthen the
            current workflow. A feature should improve an existing module,
            reduce friction, clarify the developer loop, or solve a real C++
            application problem.
          </p>
        </div>

        <div class="direction__principles">
          <article
            v-for="principle in principles"
            :key="principle.title"
            class="direction__principle"
          >
            <strong>{{ principle.title }}</strong>
            <span>{{ principle.text }}</span>
          </article>
        </div>
      </div>

      <aside class="direction__panel">
        <div class="direction__panel-head">
          <p class="direction__label">Focus after v2.7</p>
          <strong>Improve what already exists.</strong>
        </div>

        <div class="direction__roadmap">
          <div
            v-for="(item, index) in focusItems"
            :key="item.title"
            class="direction__roadmap-item"
          >
            <span class="direction__index">
              {{ String(index + 1).padStart(2, "0") }}
            </span>

            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ item.text }}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

const principles = [
  {
    title: "Fewer random additions",
    text: "New surface area should earn its place.",
  },
  {
    title: "Better existing modules",
    text: "The current modules should become clearer, stronger, and easier to trust.",
  },
  {
    title: "Real application validation",
    text: "The platform should be tested against practical C++ projects, not only examples.",
  },
];

const focusItems = [
  {
    title: "Modules",
    text: "Improve APIs, examples, edge cases, and module consistency.",
  },
  {
    title: "Registry",
    text: "Make packages easier to publish, install, inspect, and reuse.",
  },
  {
    title: "SDKs",
    text: "Make SDK installation, checks, and project integration more reliable.",
  },
  {
    title: "CI and tests",
    text: "Expand automated coverage and catch regressions before release.",
  },
  {
    title: "Diagnostics",
    text: "Improve errors, command feedback, doctor checks, and developer visibility.",
  },
  {
    title: "Documentation",
    text: "Keep docs, examples, release notes, and real workflows aligned.",
  },
];
</script>

<style scoped>
.direction {
  position: relative;
  overflow: hidden;
}

.direction::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.55;
}
.direction__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) 420px;
  gap: clamp(36px, 5vw, 72px);
  align-items: start;
}

.direction__statement {
  margin-top: 30px;
  display: flex;
  gap: 18px;
  align-items: flex-start;
  padding: 22px 24px;
  border: 1px solid rgba(34, 197, 94, 0.22);
  border-radius: var(--radius-lg);
}
.direction__statement-mark {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(34, 197, 94, 0.28);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-weight: 900;
}

.direction__statement p {
  margin: 0;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.1rem);
  line-height: 1.75;
}

.direction__statement strong {
  color: var(--text);
}

.direction__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
}

.direction__text p {
  margin: 0;
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.direction__principles {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.direction__principle {
  padding: 18px;
  border: 1px solid rgba(34, 197, 94, 0.14);
  border-radius: var(--radius-md);
}

.direction__principle strong {
  display: block;
  color: var(--text);
  font-size: 0.92rem;
  font-weight: 850;
}

.direction__principle span {
  display: block;
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.direction__panel {
  position: sticky;
  top: 84px;
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.direction__panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.direction__panel-head,
.direction__roadmap {
  position: relative;
}

.direction__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.direction__label {
  margin: 0 0 8px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--green-bright);
}

.direction__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.direction__roadmap {
  display: grid;
}

.direction__roadmap-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.direction__roadmap-item:last-child {
  border-bottom: 0;
}

.direction__index {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
}

.direction__roadmap-item strong {
  display: block;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
}

.direction__roadmap-item p {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.55;
}

@media (max-width: 980px) {
  .direction__inner {
    grid-template-columns: 1fr;
  }

  .direction__panel {
    position: relative;
    top: auto;
  }
}

@media (max-width: 720px) {
  .direction__principles {
    grid-template-columns: 1fr;
  }

  .direction__statement {
    padding: 20px;
  }

  .direction__roadmap-item {
    padding: 17px 20px;
  }
}
</style>
