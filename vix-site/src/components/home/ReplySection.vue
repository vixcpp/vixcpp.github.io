<template>
  <section class="reply section-tight">
    <div class="reply__inner container">
      <div class="reply__copy">
        <SectionTitle
          eyebrow="Vix Reply"
          title="A REPL for the small checks before the real file."
          description="Vix Reply gives the CLI an interactive shell. You can test expressions, inspect values, validate JSON, read environment values, and jump into real C++ snippets without leaving the Vix workflow."
        />

        <div class="reply__text">
          <p>
            Running <code>vix</code> without a command opens the REPL by
            default. It gives C++ projects a small scratchpad for quick checks,
            simple runtime helpers, and experiments that are too small to start
            as a full source file.
          </p>

          <p>
            When an idea needs real C++, Reply can switch into snippet mode and
            send the code through the normal Vix run pipeline. It is not a fake
            interpreter; the snippet still goes through the compiler and the
            same diagnostics used by the project workflow.
          </p>
        </div>

        <div class="reply__cards">
          <article v-for="item in items" :key="item.title" class="reply-card">
            <span class="reply-card__index">{{ item.index }}</span>
            <h3>{{ item.title }}</h3>
            <p>{{ item.text }}</p>
          </article>
        </div>

        <a
          class="reply__link"
          href="https://docs.vixcpp.com/cli/repl/"
          target="_blank"
          rel="noreferrer"
        >
          Read Vix Reply docs
          <span aria-hidden="true">→</span>
        </a>
      </div>

      <aside class="reply__terminal" aria-label="Vix Reply terminal preview">
        <div class="reply__terminal-bar">
          <span />
          <span />
          <span />
        </div>

        <div class="reply__terminal-head">
          <strong>Vix Reply v2.7.0&nbsp;&nbsp;REPL</strong>
          <p>gcc 13.3&nbsp;&nbsp;linux</p>
          <p>exit: Ctrl+D | clear: Ctrl+L | help</p>
        </div>

        <div class="reply__session">
          <div
            v-for="line in session"
            :key="line.id"
            :class="['reply__line', `reply__line--${line.kind}`]"
          >
            <span v-if="line.prompt" class="reply__prompt">
              {{ line.prompt }}
            </span>
            <span>{{ line.text }}</span>
          </div>
        </div>

        <div class="reply__commands">
          <CommandLine command="vix" />
          <CommandLine command="vix repl" />
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
    title: "Expressions",
    text: "Use the shell for quick math, variables, strings, booleans, value helpers, and small checks.",
  },
  {
    index: "02",
    title: "JSON values",
    text: "Create objects and arrays, access fields, inspect values, and validate strict JSON before it moves into config or APIs.",
  },
  {
    index: "03",
    title: "C++ snippets",
    text: "Switch into C++ mode and run real snippets through the Vix pipeline when an idea needs the compiler.",
  },
];

const session = [
  {
    id: "line-1",
    kind: "input",
    prompt: ">>>",
    text: "x = 42",
  },
  {
    id: "line-2",
    kind: "output",
    prompt: "",
    text: "42",
  },
  {
    id: "line-3",
    kind: "input",
    prompt: ">>>",
    text: "x + 1",
  },
  {
    id: "line-4",
    kind: "output",
    prompt: "",
    text: "43",
  },
  {
    id: "line-5",
    kind: "input",
    prompt: ">>>",
    text: 'user = {"name":"Gaspard","role":"developer"}',
  },
  {
    id: "line-6",
    kind: "output",
    prompt: "",
    text: '{"name":"Gaspard","role":"developer"}',
  },
  {
    id: "line-7",
    kind: "input",
    prompt: ">>>",
    text: "user.role",
  },
  {
    id: "line-8",
    kind: "output",
    prompt: "",
    text: "developer",
  },
  {
    id: "line-9",
    kind: "input",
    prompt: ">>>",
    text: ":cpp",
  },
  {
    id: "line-10",
    kind: "muted",
    prompt: "",
    text: "C++ mode. Type :run to execute or :cancel to exit.",
  },
  {
    id: "line-11",
    kind: "input",
    prompt: "cpp>",
    text: "#include <vix/print.hpp>",
  },
  {
    id: "line-12",
    kind: "input",
    prompt: "...",
    text: 'int main() { vix::print("Hello from C++"); }',
  },
  {
    id: "line-13",
    kind: "output",
    prompt: "",
    text: "Hello from C++",
  },
];
</script>

<style scoped>
.reply {
  position: relative;
  overflow: hidden;
  border-block: 1px solid var(--line-soft);
}

.reply::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 78% 22%,
      rgba(34, 197, 94, 0.12),
      transparent 28rem
    ),
    radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size:
    auto,
    24px 24px;
  opacity: 0.45;
  mask-image: linear-gradient(#000, transparent 88%);
}

.reply__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) 470px;
  gap: clamp(36px, 5vw, 72px);
  align-items: center;
}

.reply__copy {
  min-width: 0;
}

.reply__text {
  margin-top: 28px;
  display: grid;
  gap: 18px;
  max-width: 720px;
}

.reply__text p {
  color: var(--text-soft);
  font-size: clamp(1rem, 1.25vw, 1.08rem);
  line-height: 1.82;
}

.reply__text code {
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.92em;
}

.reply__cards {
  margin-top: 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.reply-card {
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.025);
  transition:
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    transform var(--speed) var(--ease);
}

.reply-card:hover {
  border-color: var(--green-line);
  background: rgba(34, 197, 94, 0.035);
  transform: translateY(-2px);
}

.reply-card__index {
  display: inline-block;
  color: var(--green-bright);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.08em;
}

.reply-card h3 {
  margin-top: 14px;
  color: var(--text);
  font-size: 0.94rem;
  font-weight: 850;
  letter-spacing: -0.02em;
}

.reply-card p {
  margin-top: 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.58;
}

.reply__link {
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

.reply__link:hover {
  color: var(--green);
}

.reply__terminal {
  overflow: hidden;
  border: 1px solid rgba(34, 197, 94, 0.16);
  border-radius: var(--radius-lg);
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.035),
      rgba(255, 255, 255, 0.012)
    ),
    var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

.reply__terminal-bar {
  display: flex;
  gap: 7px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(34, 197, 94, 0.14);
}

.reply__terminal-bar span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
}

.reply__terminal-head {
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--line-soft);
}

.reply__terminal-head strong {
  display: block;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  font-weight: 850;
  letter-spacing: -0.01em;
}

.reply__terminal-head p {
  margin-top: 6px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  line-height: 1.45;
}

.reply__session {
  padding: 22px 24px;
  border-bottom: 1px solid var(--line-soft);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.7;
}

.reply__line {
  display: flex;
  gap: 10px;
  min-width: 0;
  color: var(--text-soft);
  white-space: pre-wrap;
  word-break: break-word;
}

.reply__prompt {
  color: var(--green-bright);
  font-weight: 850;
  flex: 0 0 auto;
}

.reply__line--output {
  padding-left: 34px;
  color: var(--text);
}

.reply__line--muted {
  padding-left: 34px;
  color: var(--text-muted);
}

.reply__line--input {
  color: var(--text-soft);
}

.reply__commands {
  display: grid;
  gap: 8px;
  padding: 22px 24px 24px;
}

@media (max-width: 980px) {
  .reply__inner {
    grid-template-columns: 1fr;
  }

  .reply__terminal {
    max-width: 720px;
  }
}

@media (max-width: 760px) {
  .reply__cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .reply__terminal-head,
  .reply__session,
  .reply__commands {
    padding-inline: 20px;
  }

  .reply__session {
    font-size: 0.72rem;
  }

  .reply__line--output,
  .reply__line--muted {
    padding-left: 0;
  }
}
</style>
