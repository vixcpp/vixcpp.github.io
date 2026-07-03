<template>
  <section class="diagnostics section">
    <div class="diagnostics__inner container">
      <div class="diagnostics__copy">
        <SectionTitle
          eyebrow="Diagnostics"
          title="When C++ fails, Vix tries to show the line that matters."
          description="Vix diagnostics are built for the moments where compiler output, template traces, CMake logs, linker failures, or runtime crashes become hard to read. The CLI keeps the real error visible, then adds the useful context around it."
        />

        <div class="diagnostics__text">
          <p>
            C++ errors can be technically correct and still difficult to act on.
            Vix parses compiler output, looks for the user file first, prints a
            focused code frame, and adds a hint that points to the next thing to
            check.
          </p>

          <p>
            The same diagnostic layer also helps with build and runtime
            failures: missing headers, stale CMake caches, linker errors,
            sanitizer output, invalid frees, use-after-free reports, assertions,
            and ports already in use.
          </p>
        </div>

        <div class="diagnostics__cards">
          <article
            v-for="item in items"
            :key="item.title"
            class="diagnostics-card"
          >
            <span class="diagnostics-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="diagnostics__link"
          href="https://docs.vixcpp.com/cli/diagnostics"
          target="_blank"
          rel="noreferrer"
        >
          Read diagnostics docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="diagnostics__panel" aria-label="Vix diagnostic preview">
        <div class="diagnostics__panel-head">
          <p class="diagnostics__label">vix diagnostics</p>
          <strong>Less compiler noise. More useful context.</strong>
        </div>

        <div class="diagnostics__frame">
          <p class="diagnostics__error">error: missing semicolon</p>

          <div class="diagnostics__location">
            <span>--&gt;</span>
            <strong>src/main.cpp:7:24</strong>
          </div>

          <p class="diagnostics__code-label">code:</p>

          <pre><code><span class="diagnostics__muted">  5 |</span> int main()
<span class="diagnostics__muted">  6 |</span> {
<span class="diagnostics__muted">  7 |</span>   vix::print("hello")
<span class="diagnostics__caret">                         ^</span></code></pre>

          <p class="diagnostics__hint">
            <span>hint:</span>
            add the missing semicolon, often on the previous line
          </p>
        </div>

        <div class="diagnostics__signals">
          <p class="diagnostics__signals-label">Handled signals</p>

          <div
            v-for="signal in signals"
            :key="signal"
            class="diagnostics__signal"
          >
            <span aria-hidden="true" />
            {{ signal }}
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import SectionTitle from "@/components/common/SectionTitle.vue";

const items = [
  {
    index: "01",
    title: "Compiler errors",
    text: "Vix parses Clang and GCC output, finds the useful user location, and prints a focused code frame.",
  },
  {
    index: "02",
    title: "Template noise",
    text: "Template, concept, overload, ownership, coroutine, and conversion errors are handled through specific rules.",
  },
  {
    index: "03",
    title: "Runtime failures",
    text: "Sanitizers, invalid frees, assertions, out-of-memory failures, and port conflicts can become readable diagnostics.",
  },
];

const signals = [
  "missing headers and symbols",
  "template and concept failures",
  "stale or corrupted CMake cache",
  "linker and package errors",
  "sanitizer and runtime crashes",
];
</script>

<style scoped>
.diagnostics {
  position: relative;
  overflow: hidden;
  border-block: 1px solid var(--line-soft);
}

.diagnostics::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 76% 18%,
      rgba(34, 197, 94, 0.11),
      transparent 28rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.42;
  mask-image: linear-gradient(#000, transparent 88%);
}

.diagnostics__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) 470px;
  gap: clamp(36px, 5vw, 72px);
  align-items: center;
}

.diagnostics__copy {
  min-width: 0;
}

.diagnostics__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.diagnostics__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.diagnostics__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.diagnostics-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.diagnostics-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.diagnostics-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.diagnostics-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.diagnostics-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.diagnostics__link {
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

.diagnostics__link:hover {
  color: var(--green);
}

.diagnostics__panel {
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.diagnostics__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.diagnostics__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.diagnostics__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.diagnostics__frame {
  padding: 24px;
  border-bottom: 1px solid var(--line-soft);
  font-family: var(--font-mono);
}

.diagnostics__error {
  margin: 0;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 850;
}

.diagnostics__location {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.diagnostics__location span {
  color: var(--text-faint);
}

.diagnostics__location strong {
  color: var(--text-soft);
  font-weight: 700;
}

.diagnostics__code-label {
  margin: 18px 0 8px;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.diagnostics__frame pre {
  margin: 0;
  overflow: auto;
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  color: var(--text-soft);
  font-size: 0.78rem;
  line-height: 1.68;
}

.diagnostics__frame code {
  font-family: inherit;
  white-space: pre;
}

.diagnostics__muted {
  color: var(--text-faint);
}

.diagnostics__caret {
  color: var(--red, #ef4444);
  font-weight: 900;
}

.diagnostics__hint {
  margin: 16px 0 0;
  color: var(--text-soft);
  font-size: 0.78rem;
  line-height: 1.55;
}

.diagnostics__hint span {
  color: var(--yellow, #facc15);
  font-weight: 850;
}

.diagnostics__signals {
  display: grid;
  gap: 10px;
  padding: 22px 24px 24px;
}

.diagnostics__signals-label {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.diagnostics__signal {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--text-soft);
  font-size: 0.84rem;
  line-height: 1.5;
}

.diagnostics__signal span {
  width: 7px;
  height: 7px;
  margin-top: 0.45em;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .diagnostics__inner {
    grid-template-columns: 1fr;
  }

  .diagnostics__panel {
    max-width: 720px;
  }
}

@media (max-width: 760px) {
  .diagnostics__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .diagnostics__panel-head,
  .diagnostics__frame,
  .diagnostics__signals {
    padding-inline: 20px;
  }

  .diagnostics__frame pre {
    font-size: 0.72rem;
  }
}
</style>
