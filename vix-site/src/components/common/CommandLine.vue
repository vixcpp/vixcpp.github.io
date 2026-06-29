<template>
  <div class="cmd" @mouseenter="hover = true" @mouseleave="hover = false">
    <span class="cmd__prompt" aria-hidden="true">$</span>
    <code class="cmd__code" v-html="highlighted" />
    <button
      type="button"
      class="cmd__copy"
      :class="{ 'cmd__copy--visible': hover || copied }"
      @click="copy"
      :title="copied ? 'Copied' : 'Copy'"
      aria-label="Copy command"
    >
      <svg v-if="!copied" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 9h10v10H9V9Z"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linejoin="round"
        />
        <path
          d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M20 7L10 17l-4-4"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  command: { type: String, required: true },
});

const hover = ref(false);
const copied = ref(false);

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* Shell highlighter — first token = command, --flags, urls, paths, strings */
const highlighted = computed(() => {
  const raw = props.command ?? "";
  // Tokenize on spaces while preserving them
  const parts = raw.split(/(\s+)/);
  let firstWordSeen = false;

  return parts
    .map((tok) => {
      if (/^\s+$/.test(tok)) return tok;

      // Operators / separators
      if (tok === "&&" || tok === "||" || tok === "|" || tok === ";") {
        firstWordSeen = false; // next word is a new command
        return `<span class="sh-op">${esc(tok)}</span>`;
      }

      // URLs
      if (/^https?:\/\//.test(tok)) {
        return `<span class="sh-url">${esc(tok)}</span>`;
      }

      // Flags
      if (/^--?[A-Za-z0-9]/.test(tok)) {
        return `<span class="sh-flag">${esc(tok)}</span>`;
      }

      // Paths
      if (/^(\.{0,2}\/|~)/.test(tok) || /\//.test(tok)) {
        return `<span class="sh-path">${esc(tok)}</span>`;
      }

      // Quoted strings
      if (/^["'].*["']$/.test(tok)) {
        return `<span class="sh-str">${esc(tok)}</span>`;
      }

      // First bare word = the command
      if (!firstWordSeen) {
        firstWordSeen = true;
        return `<span class="sh-cmd">${esc(tok)}</span>`;
      }

      // Subsequent args
      return `<span class="sh-arg">${esc(tok)}</span>`;
    })
    .join("");
});

async function copy() {
  try {
    await navigator.clipboard.writeText(props.command);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), {
      value: props.command,
    });
    Object.assign(ta.style, { position: "fixed", opacity: "0" });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
  copied.value = true;
  clearTimeout(copy._t);
  copy._t = setTimeout(() => (copied.value = false), 900);
}
</script>

<style scoped>
.cmd {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-ink);
  background: var(--bg-ink);
  font-family: var(--font-mono);
  font-size: 0.84rem;
  line-height: 1.4;
  overflow-x: auto;
  scrollbar-width: none;
}
.cmd::-webkit-scrollbar {
  display: none;
}

.cmd__prompt {
  flex-shrink: 0;
  color: var(--green-bright);
  font-weight: 700;
  user-select: none;
}

.cmd__code {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  color: var(--text-invert);
}

/* ── Shell tokens ── */
.cmd__code :deep(.sh-cmd) {
  color: #7dd3fc;
  font-weight: 600;
} /* command — sky */
.cmd__code :deep(.sh-flag) {
  color: #fbbf24;
} /* flags — amber */
.cmd__code :deep(.sh-url) {
  color: #86efac;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.cmd__code :deep(.sh-path) {
  color: #c4b5fd;
} /* paths — lavender */
.cmd__code :deep(.sh-str) {
  color: #fcd9a8;
} /* strings — sand */
.cmd__code :deep(.sh-op) {
  color: #94a3b8;
  font-weight: 700;
} /* && | ; — slate */
.cmd__code :deep(.sh-arg) {
  color: var(--text-invert-soft);
} /* args */

/* ── Copy button ── */
.cmd__copy {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  color: var(--text-invert-soft);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--speed),
    background var(--speed),
    border-color var(--speed),
    color var(--speed),
    transform var(--speed);
}
.cmd__copy svg {
  width: 15px;
  height: 15px;
}
.cmd__copy--visible {
  opacity: 1;
  pointer-events: auto;
}
.cmd__copy:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
  transform: translateY(-1px);
}

@media (hover: none), (pointer: coarse) {
  .cmd__copy {
    opacity: 1;
    pointer-events: auto;
  }
}
@media (max-width: 640px) {
  .cmd {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    padding: 0.7rem 3.1rem 0.7rem 0.9rem;
  }

  .cmd__code {
    display: block;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
  }

  .cmd__code::-webkit-scrollbar {
    display: none;
  }

  .cmd__copy {
    position: absolute;
    right: 10px;
    top: 50%;
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%);
  }

  .cmd__copy:hover {
    transform: translateY(-50%);
  }
}
</style>
