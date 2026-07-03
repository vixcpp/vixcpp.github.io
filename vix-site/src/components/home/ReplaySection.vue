<template>
  <section class="replay section-tight">
    <div class="replay__inner container">
      <div class="replay__copy">
        <SectionTitle
          eyebrow="Replay"
          title="Do not guess the failed command. Replay it."
          description="vix replay records the context of a run when the command is executed with --replay, then lets you reproduce the latest run, the latest failed run, or a specific recorded execution by id."
        />

        <div class="replay__text">
          <p>
            Some failures are hard to reproduce because the command, working
            directory, arguments, environment, logs, and exit status disappear
            after the process ends. Replay keeps that execution context under
            <code>.vix/runs/</code> so the run can be inspected or launched
            again later.
          </p>

          <p>
            It fits naturally with Vix diagnostics. Diagnostics help explain
            what failed; replay helps you run the same failure again without
            rebuilding the command from memory.
          </p>
        </div>

        <div class="replay__cards">
          <article v-for="item in items" :key="item.title" class="replay-card">
            <span class="replay-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="replay__link"
          href="https://docs.vixcpp.com/cli/replay"
          target="_blank"
          rel="noreferrer"
        >
          Read replay docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="replay__panel" aria-label="Vix replay workflow preview">
        <div class="replay__panel-head">
          <p class="replay__label">vix replay</p>
          <strong
            >A recorded run can be inspected, listed, and replayed.</strong
          >
        </div>

        <div class="replay__commands">
          <CommandLine command="vix run api --replay" />
          <CommandLine command="vix replay failed" />
          <CommandLine command="vix replay show last" />
          <CommandLine command="vix replay list --failed" />
        </div>

        <div class="replay__record">
          <div class="replay__record-head">
            <span class="replay__status" aria-hidden="true">✖</span>
            <strong>2026-05-05-18-42-11-a91f</strong>
            <em>failed</em>
          </div>

          <div class="replay__summary">
            <p class="replay__summary-label">summary</p>

            <div
              v-for="row in summary"
              :key="row.label"
              class="replay__summary-row"
            >
              <span>{{ row.label }}</span>
              <strong>{{ row.value }}</strong>
            </div>
          </div>

          <div class="replay__logs">
            <p class="replay__summary-label">recorded files</p>

            <div v-for="file in files" :key="file" class="replay__file">
              <span aria-hidden="true" />
              {{ file }}
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

const items = [
  {
    index: "01",
    title: "Recorded runs",
    text: "A run started with --replay stores its command, working directory, arguments, environment, timing, status, and logs.",
  },
  {
    index: "02",
    title: "Failed replay",
    text: "Use vix replay failed to reproduce the latest failed execution without searching through shell history.",
  },
  {
    index: "03",
    title: "Logs and context",
    text: "Inspect run.json, stdout, stderr, combined logs, the recorded error message, and the hint attached to the run.",
  },
];

const summary = [
  {
    label: "command",
    value: "vix run api --replay",
  },
  {
    label: "status",
    value: "failed",
  },
  {
    label: "duration",
    value: "1.42s",
  },
  {
    label: "error",
    value: "runtime-error",
  },
];

const files = [
  ".vix/runs/<id>/run.json",
  ".vix/runs/<id>/stdout.log",
  ".vix/runs/<id>/stderr.log",
  ".vix/runs/<id>/combined.log",
];
</script>

<style scoped>
.replay {
  position: relative;
  overflow: hidden;
  border-block: 1px solid var(--line-soft);
}

.replay::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 78% 18%,
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

.replay__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.16fr) 470px;
  gap: clamp(36px, 5vw, 72px);
  align-items: center;
}

.replay__copy {
  min-width: 0;
}

.replay__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.replay__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.replay__text code {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.replay__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.replay-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.replay-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.replay-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.replay-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.replay-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.replay__link {
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

.replay__link:hover {
  color: var(--green);
}

.replay__panel {
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.replay__panel-head {
  padding: 24px 24px 20px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.replay__label {
  margin: 0 0 8px;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.replay__panel-head strong {
  display: block;
  color: var(--text);
  font-size: 1.15rem;
  line-height: 1.28;
  letter-spacing: -0.03em;
}

.replay__commands {
  display: grid;
  gap: 8px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
}

.replay__record {
  padding: 24px;
  font-family: var(--font-mono);
}

.replay__record-head {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-soft);
}

.replay__status {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.11);
  border: 1px solid rgba(239, 68, 68, 0.24);
  color: var(--red, #ef4444);
  font-size: 0.82rem;
  font-weight: 900;
  flex: 0 0 auto;
}

.replay__record-head strong {
  min-width: 0;
  color: var(--text);
  font-size: 0.82rem;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.replay__record-head em {
  margin-left: auto;
  color: var(--red, #ef4444);
  font-size: 0.72rem;
  font-style: normal;
  font-weight: 850;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.replay__summary {
  display: grid;
  gap: 10px;
  padding-block: 20px;
  border-bottom: 1px solid var(--line-soft);
}

.replay__summary-label {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: 0.7rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.replay__summary-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.replay__summary-row span {
  color: var(--text-faint);
  font-size: 0.74rem;
}

.replay__summary-row strong {
  color: var(--text-soft);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
}

.replay__logs {
  display: grid;
  gap: 10px;
  padding-top: 20px;
}

.replay__file {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: var(--text-soft);
  font-size: 0.76rem;
  line-height: 1.5;
  word-break: break-word;
}

.replay__file span {
  width: 7px;
  height: 7px;
  margin-top: 0.45em;
  border-radius: 999px;
  background: var(--green);
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.08);
  flex: 0 0 auto;
}

@media (max-width: 980px) {
  .replay__inner {
    grid-template-columns: 1fr;
  }

  .replay__panel {
    max-width: 720px;
  }
}

@media (max-width: 760px) {
  .replay__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .replay__panel-head,
  .replay__commands,
  .replay__record {
    padding-inline: 20px;
  }

  .replay__summary-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .replay__record-head {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .replay__record-head em {
    margin-left: 0;
  }
}
</style>
