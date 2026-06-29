<template>
  <section class="hero">
    <!-- Subtle dotted grid backdrop -->
    <div class="hero__grid" aria-hidden="true" />

    <div class="hero__inner container-wide">
      <!-- LEFT -->
      <div class="hero__content">
        <p class="hero__eyebrow">
          <span class="hero__eyebrow-tick" />
          Native C++ application workflow
        </p>

        <h1 class="hero__title">Build real applications with modern C++.</h1>

        <p class="hero__lead">
          Vix.cpp keeps the native C++ model intact while giving projects a more
          direct workflow around the application: create it, run it, build it,
          test it, check it, package it, and prepare it for production.
        </p>

        <div class="hero__actions">
          <RouterLink to="/install" class="hero__btn hero__btn--primary">
            Install Vix <span class="hero__arrow" aria-hidden="true">→</span>
          </RouterLink>
          <a
            href="https://docs.vixcpp.com"
            target="_blank"
            rel="noreferrer"
            class="hero__btn hero__btn--secondary"
          >
            Read the docs <span class="hero__arrow" aria-hidden="true">→</span>
          </a>
          <a
            href="https://github.com/vixcpp/vix"
            target="_blank"
            rel="noreferrer"
            class="hero__btn hero__btn--ghost"
          >
            GitHub
          </a>
        </div>

        <div class="hero__commands" aria-label="Common Vix commands">
          <CommandLine
            command="curl -fsSL https://vixcpp.com/install.sh | bash"
          />
          <CommandLine command="vix upgrade --sdk info web" />
          <CommandLine command="vix new app && cd app && vix dev" />
        </div>
      </div>

      <!-- RIGHT — terminal code card -->
      <aside class="hero__side" aria-label="Vix.cpp code examples">
        <div
          class="code-card"
          @mouseenter="cardHover = true"
          @mouseleave="cardHover = false"
        >
          <div class="code-head">
            <div class="head-scroll">
              <div class="head-left">
                <span class="dot dot-red" />
                <span class="dot dot-yellow" />
                <span class="dot dot-green" />
                <span class="head-title">{{
                  activeTab?.file || activeTab?.label
                }}</span>
              </div>

              <div
                v-if="tabs.length > 1"
                class="tabs"
                role="tablist"
                aria-label="Hero examples"
              >
                <button
                  v-for="t in tabs"
                  :key="t.key"
                  type="button"
                  class="tab"
                  :class="{ active: activeKey === t.key }"
                  role="tab"
                  :aria-selected="activeKey === t.key"
                  @click="activeKey = t.key"
                >
                  {{ t.label }}
                </button>
              </div>
            </div>

            <button
              v-if="activeTab"
              type="button"
              class="copy-btn"
              @click="copy(activeTab.code)"
              :title="copied ? 'Copied' : 'Copy'"
              aria-label="Copy"
            >
              <svg
                v-if="!copied"
                class="ico"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
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
              <svg
                v-else
                class="ico"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
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

          <div class="code-body" role="region" aria-label="Hero code example">
            <pre
              class="code-pre"
            ><code class="code-code" v-html="activeHtml" /></pre>
          </div>

          <div class="code-foot">
            <span class="code-foot-mark" aria-hidden="true">
              <svg
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon points="28,24 45,24 60,96 50,96" fill="#4ade80" />
                <polygon points="92,24 75,24 60,96 70,96" fill="#22c55e" />
              </svg>
            </span>
            <span>vix run {{ activeTab?.file }}</span>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import CommandLine from "@/components/common/CommandLine.vue";
import { hero } from "@/data/hero";

/* ── tabs ── */
const tabs = computed(() =>
  (hero.examples || [])
    .filter((x) => x?.key && x?.label && typeof x.code === "string")
    .map((x) => ({
      key: x.key,
      label: x.label,
      lang: x.lang || "cpp",
      file: x.file || "",
      code: x.code,
    })),
);

const activeKey = ref("");
watch(
  () => tabs.value.map((t) => t.key).join(","),
  () => {
    activeKey.value = tabs.value[0]?.key || "";
  },
  { immediate: true },
);
const activeTab = computed(
  () => tabs.value.find((t) => t.key === activeKey.value) || null,
);

/* ── copy ── */
const cardHover = ref(false);
const copied = ref(false);
async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), {
      value: text,
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

/* ── C++ highlighter ── */
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
const KW = new Set([
  "alignas",
  "alignof",
  "and",
  "and_eq",
  "asm",
  "auto",
  "bitand",
  "bitor",
  "bool",
  "break",
  "case",
  "catch",
  "char",
  "char8_t",
  "char16_t",
  "char32_t",
  "class",
  "compl",
  "concept",
  "const",
  "consteval",
  "constexpr",
  "constinit",
  "const_cast",
  "continue",
  "co_await",
  "co_return",
  "co_yield",
  "decltype",
  "default",
  "delete",
  "do",
  "double",
  "dynamic_cast",
  "else",
  "enum",
  "explicit",
  "export",
  "extern",
  "false",
  "float",
  "for",
  "friend",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "mutable",
  "namespace",
  "new",
  "noexcept",
  "not",
  "not_eq",
  "nullptr",
  "operator",
  "or",
  "or_eq",
  "private",
  "protected",
  "public",
  "register",
  "reinterpret_cast",
  "requires",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "static_assert",
  "static_cast",
  "struct",
  "switch",
  "template",
  "this",
  "thread_local",
  "throw",
  "true",
  "try",
  "typedef",
  "typeid",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "wchar_t",
  "while",
  "xor",
  "xor_eq",
]);
const TYPES = new Set([
  "size_t",
  "ssize_t",
  "string",
  "string_view",
  "vector",
  "map",
  "unordered_map",
  "set",
  "unordered_set",
  "optional",
  "variant",
  "expected",
  "unique_ptr",
  "shared_ptr",
  "weak_ptr",
  "App",
  "Request",
  "Response",
  "Context",
  "Config",
  "Frame",
  "Agent",
  "Database",
  "NodeConfig",
  "Operation",
  "Server",
  "RuntimeExecutor",
  "P2PRuntime",
]);
const NAMESPACES = new Set([
  "std",
  "vix",
  "asio",
  "net",
  "http",
  "ws",
  "ai",
  "game",
  "config",
  "executor",
  "websocket",
  "p2p",
  "sync",
  "outbox",
  "db",
]);

function wrap(cls, text) {
  return `<span class="${cls}">${esc(text)}</span>`;
}

function splitLineComment(line) {
  let inStr = false,
    inChar = false;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (!inChar && c === '"' && line[i - 1] !== "\\") inStr = !inStr;
    if (!inStr && c === "'" && line[i - 1] !== "\\") inChar = !inChar;
    if (!inStr && !inChar && line[i] === "/" && line[i + 1] === "/") {
      const before = line.slice(0, i);
      if (before.endsWith("http:") || before.endsWith("https:")) continue;
      return { code: before, comment: line.slice(i) };
    }
  }
  return { code: line, comment: "" };
}

function highlightDirective(line) {
  const m = line.match(
    /^(\s*#\s*(?:include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b)(.*)$/,
  );
  if (!m) return null;
  let out = wrap("t-dir", m[1]);
  const rest = m[2] || "";
  const ang = rest.match(/^(\s*)(<[^>\n]*>)(.*)$/);
  if (ang) {
    out += esc(ang[1]) + wrap("t-inc", ang[2]) + highlightInline(ang[3] || "");
    return out;
  }
  const quo = rest.match(/^(\s*)("([^"\\]|\\.)*")(.*)$/);
  if (quo) {
    out += esc(quo[1]) + wrap("t-inc", quo[2]) + highlightInline(quo[4] || "");
    return out;
  }
  return out + highlightInline(rest);
}

function highlightInline(s) {
  let out = "",
    i = 0;
  const isIdStart = (ch) => /[A-Za-z_]/.test(ch);
  const isId = (ch) => /[A-Za-z0-9_]/.test(ch);
  while (i < s.length) {
    const ch = s[i];
    if (ch === '"') {
      let j = i + 1;
      while (j < s.length && !(s[j] === '"' && s[j - 1] !== "\\")) j++;
      const str = s.slice(i, Math.min(j + 1, s.length));
      out += wrap("t-str", str);
      i += str.length;
      continue;
    }
    if (ch === "'") {
      let j = i + 1;
      while (j < s.length && !(s[j] === "'" && s[j - 1] !== "\\")) j++;
      const lit = s.slice(i, Math.min(j + 1, s.length));
      out += wrap("t-char", lit);
      i += lit.length;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const m = s
        .slice(i)
        .match(/^(0x[0-9A-Fa-f]+|[0-9]+(?:\.[0-9]+)?)([uUlLfF]{0,3})/);
      if (m) {
        out += wrap("t-num", m[0]);
        i += m[0].length;
        continue;
      }
    }
    if (isIdStart(ch)) {
      let j = i + 1;
      while (j < s.length && isId(s[j])) j++;
      const id = s.slice(i, j);
      const prev = (() => {
        for (let k = i - 1; k >= 0; k--)
          if (s[k] !== " " && s[k] !== "\t") return s[k];
        return "";
      })();
      const next = (() => {
        for (let k = j; k < s.length; k++)
          if (s[k] !== " " && s[k] !== "\t") return s[k];
        return "";
      })();
      if (KW.has(id)) out += wrap("t-kw", id);
      else if (TYPES.has(id)) out += wrap("t-type", id);
      else if (NAMESPACES.has(id)) out += wrap("t-ns", id);
      else if (next === "(") out += wrap("t-fn", id);
      else if (prev === "." || prev === ">") out += wrap("t-mem", id);
      else out += wrap("t-id", id);
      i = j;
      continue;
    }
    if (/[\(\)\{\}\[\]\;\,\.\:\=\+\-\*\/\<\>\!\&\|\?]/.test(ch)) {
      if (s.startsWith("::", i)) {
        out += wrap("t-op", "::");
        i += 2;
        continue;
      }
      if (s.startsWith("->", i)) {
        out += wrap("t-op", "->");
        i += 2;
        continue;
      }
      out += wrap("t-op", ch);
      i++;
      continue;
    }
    out += esc(ch);
    i++;
  }
  return out;
}

function highlightCpp(raw) {
  return String(raw ?? "")
    .split("\n")
    .map((line) => {
      const { code, comment } = splitLineComment(line);
      const dir = highlightDirective(code);
      return (
        (dir ?? highlightInline(code)) +
        (comment ? `<span class="t-cmt">${esc(comment)}</span>` : "")
      );
    })
    .join("\n");
}

const activeHtml = computed(() =>
  activeTab.value ? highlightCpp(activeTab.value.code) : "",
);
</script>

<style scoped>
/* ── Section ── */
.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(72px, 11vw, 132px) 0 clamp(56px, 8vw, 96px);
}

/* Faint dotted grid — technical texture, off-white */
.hero__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(var(--line-strong) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: radial-gradient(
    ellipse 80% 60% at 70% 20%,
    #000 0%,
    transparent 70%
  );
  opacity: 0.5;
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) 560px;
  gap: clamp(36px, 6vw, 80px);
  align-items: center;
}

/* ── Left ── */
.hero__content {
  max-width: 820px;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 22px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--green-strong);
}

.hero__eyebrow-tick {
  width: 16px;
  height: 1.5px;
  background: var(--green);
  border-radius: 2px;
}

.hero__title {
  font-size: clamp(2.4rem, 4.4vw, 3.8rem);
  font-weight: 800;
  line-height: 0.98;
  letter-spacing: -0.04em;
  color: var(--text);
  margin: 0 0 24px;
  max-width: 16ch;
}

.hero__lead {
  max-width: 56ch;
  margin: 0 0 32px;
  color: var(--text-soft);
  font-size: clamp(1.04rem, 1.4vw, 1.18rem);
  line-height: 1.72;
}

/* Actions */
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
}

.hero__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0.7rem 1.2rem;
  border-radius: var(--radius-md);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    transform var(--speed) var(--ease),
    background var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    color var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease);
}

.hero__btn--primary {
  background: var(--green);
  color: #fff;
  box-shadow: var(--shadow-green);
}
.hero__btn--primary:hover {
  background: var(--green-strong);
  color: #fff;
  transform: translateY(-1px);
}

.hero__btn--secondary {
  background: var(--bg-panel);
  border-color: var(--line-strong);
  color: var(--text);
}
.hero__btn--secondary:hover {
  border-color: var(--green-line);
  color: var(--green-strong);
  transform: translateY(-1px);
}

.hero__btn--ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--text-soft);
}
.hero__btn--ghost:hover {
  background: var(--bg-sunken);
  color: var(--text);
}

.hero__arrow {
  opacity: 0.7;
}

/* CommandLines */
.hero__commands {
  display: grid;
  gap: 8px;
  max-width: 480px;
}

/* ── Right: terminal card (dark, contrast) ── */
.hero__side {
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.code-card {
  width: 100%;
  min-width: 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--line-ink);
  background: var(--bg-ink);
  box-shadow: var(--shadow-lg);
}

/* Header */
.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 13px;
  border-bottom: 1px solid var(--line-ink);
  background: var(--bg-ink-soft);
}

.head-scroll {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  white-space: nowrap;
}
.head-scroll::-webkit-scrollbar {
  display: none;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}
.dot-red {
  background: #ff5f57;
}
.dot-yellow {
  background: #febc2e;
}
.dot-green {
  background: #28c840;
}

.head-title {
  color: var(--text-invert-soft);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* Tabs */
.tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  flex-shrink: 0;
}

.tab {
  border: 0;
  background: transparent;
  color: var(--text-invert-soft);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 999px;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--speed),
    color var(--speed);
}
.tab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-invert);
}
.tab.active {
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
}

/* Copy */
.copy-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-invert-soft);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity var(--speed),
    transform var(--speed),
    background var(--speed),
    border-color var(--speed),
    color var(--speed);
}
.copy-btn .ico {
  display: block;
  width: 16px;
  height: 16px;
  margin: 0 auto;
}
.copy-btn .ico path {
  stroke: currentColor;
  fill: none;
}
.code-card:hover .copy-btn {
  opacity: 1;
  pointer-events: auto;
}
.copy-btn:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(34, 197, 94, 0.4);
  color: #86efac;
}
@media (hover: none), (pointer: coarse) {
  .copy-btn {
    opacity: 1;
    pointer-events: auto;
  }
}

/* Body */
.code-body {
  height: 340px;
  overflow: auto;
}
.code-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.code-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 999px;
}
.code-body::-webkit-scrollbar-track {
  background: transparent;
}

.code-pre {
  margin: 0;
  padding: 16px 18px;
  white-space: pre;
  line-height: 1.7;
  font-family: var(--font-mono);
  font-size: 0.86rem;
  color: var(--text-invert);
  background: transparent;
}
.code-code {
  display: inline-block;
  min-width: 100%;
}

/* Footer prompt */
.code-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid var(--line-ink);
  background: var(--bg-ink-soft);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  color: var(--text-invert-soft);
}
.code-foot-mark {
  width: 13px;
  height: 13px;
  opacity: 0.9;
}
.code-foot-mark svg {
  width: 100%;
  height: 100%;
}

/* ── Custom C++ syntax palette — unique, harmonised with brand green ──
   Background is ink; keys: green for keywords, mint for types, soft
   warm for strings, muted for ops. Not the VSCode default. */
.t-dir {
  color: #d8b4fe;
} /* preprocessor — soft violet */
.t-inc {
  color: #fca5a5;
} /* include path — soft coral */
.t-kw {
  color: #4ade80;
  font-weight: 600;
} /* keywords — Vix green */
.t-type {
  color: #7dd3a8;
} /* types — desaturated mint */
.t-ns {
  color: #5eead4;
} /* namespaces — teal */
.t-fn {
  color: #fde68a;
} /* functions — warm amber */
.t-mem {
  color: #bfdbfe;
} /* members — pale blue */
.t-id {
  color: #e2e8f0;
} /* identifiers — near white */
.t-str {
  color: #fcd9a8;
} /* strings — soft sand */
.t-char {
  color: #fcd9a8;
}
.t-num {
  color: #c4b5fd;
} /* numbers — lavender */
.t-cmt {
  color: #6b7280;
  font-style: italic;
} /* comments — neutral gray */
.t-op {
  color: #94a3b8;
} /* operators — slate */

/* ── Responsive ── */
@media (max-width: 1080px) {
  .hero__inner {
    grid-template-columns: 1fr;
  }
  .hero__side {
    max-width: 640px;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-top: 56px;
  }
  .hero__actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero__btn {
    justify-content: center;
  }
  .hero__commands {
    max-width: 100%;
  }
  .code-pre {
    font-size: 0.8rem;
  }
  .code-body {
    height: 280px;
  }
}

@media (max-width: 420px) {
  .tab {
    font-size: 0.67rem;
    padding: 4px 7px;
  }
  .head-title {
    max-width: 34vw;
  }
}
</style>
