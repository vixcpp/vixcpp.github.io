<template>
  <section class="hero">
    <div class="container hero-inner">
      <!-- Left -->
      <div class="hero-copy">
        <h1 class="hero-title">{{ title }}</h1>
        <p class="hero-subtitle">{{ subtitle }}</p>

        <div v-if="ctas?.length" class="hero-ctas">
          <template v-for="cta in ctas" :key="cta.label">
            <RouterLink
              v-if="cta.to && !isExternal(cta)"
              :to="cta.to"
              :class="ctaClass(cta.kind)"
            >
              {{ cta.label }}
            </RouterLink>

            <a
              v-else
              :href="ctaHref(cta)"
              :class="ctaClass(cta.kind)"
              target="_blank"
              rel="noreferrer"
            >
              {{ cta.label }}
            </a>
          </template>
        </div>

        <div v-if="props.support" class="hero-support">
          <div class="hero-support-title">{{ props.support.title }}</div>

          <div class="hero-support-text">{{ props.support.text }}</div>

          <div v-if="props.support.meta?.length" class="hero-support-meta">
            <span class="meta-dot"></span>

            <template v-for="(m, i) in props.support.meta" :key="i">
              <span>{{ m }}</span>
              <span v-if="i < props.support.meta.length - 1" class="sep">•</span>
            </template>
          </div>
        </div>

        <div v-if="badges?.length" class="hero-badges">
          <span v-for="b in badges" :key="b" class="pill">{{ b }}</span>
        </div>
      </div>

      <!-- Right -->
      <div class="hero-side" v-if="tabs.length">
        <div
          class="code-card"
          @mouseenter="hover = true"
          @mouseleave="hover = false"
        >
          <!-- Header INSIDE the terminal -->
        <div class="code-head">
        <!-- SCROLL ROW -->
          <div class="head-scroll">
            <div class="head-left">
              <span class="dot dot-red"></span>
              <span class="dot dot-yellow"></span>
              <span class="dot dot-green"></span>

              <span class="head-title">{{ headerLabel }}</span>
            </div>

            <div class="tabs" v-if="tabs.length > 1" role="tablist" aria-label="Hero examples">
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

          <!-- COPY FIXED -->
          <button
            v-if="activeText"
            type="button"
            class="copy-btn"
            @click="copy(activeText)"
            :title="copied ? 'Copied' : 'Copy'"
            aria-label="Copy"
          >
            <!-- icons -->
            <svg v-if="!copied" class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 9h10v10H9V9Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />
              <path
                d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg v-else class="ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 7L10 17l-4-4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

          <!-- Body (single background) -->
          <div class="code-body" role="region" aria-label="Hero code example">
            <pre class="code-pre"><code class="code-code" v-html="activeHtml"></code></pre>
          </div>
        </div>
      </div>
      <!-- /Right -->
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },

  ctas: { type: Array, default: () => [] },
  badges: { type: Array, default: () => [] },
  support: {
    type: Object,
    default: null,
  },
  // [{ key, label, lang: "cpp"|"shell", file?, code }]
  examples: { type: Array, default: () => [] },

  defaultTab: { type: String, default: "" },
});

const hover = ref(false);
const copied = ref(false);
const activeKey = ref("");

function isExternal(cta) {
  return Boolean(cta?.external || cta?.href);
}
function ctaHref(cta) {
  return cta?.href || cta?.to || "#";
}
function ctaClass(kind) {
  if (kind === "primary") return "btn cta-main";
  return "btn cta-secondary";
}


const tabs = computed(() => {
  return (props.examples || [])
    .filter((x) => x && x.key && x.label && typeof x.code === "string")
    .map((x) => ({
      key: x.key,
      label: x.label,
      lang: x.lang || "cpp",
      file: x.file || "",
      code: x.code || "",
    }));
});

watch(
  () => tabs.value.map((t) => t.key).join(","),
  () => {
    const first = tabs.value[0]?.key || "";
    const wanted = props.defaultTab || first;
    activeKey.value = tabs.value.some((t) => t.key === wanted) ? wanted : first;
  },
  { immediate: true }
);

const active = computed(() => tabs.value.find((t) => t.key === activeKey.value) || tabs.value[0] || null);
const activeText = computed(() => active.value?.code || "");
const activeLang = computed(() => active.value?.lang || "cpp");

const headerLabel = computed(() => {
  const a = active.value;
  if (!a) return "";
  const file = a.file ? `  ${a.file}` : "";
  return `${a.label}${file}`;
});

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* Remove markdown quote '>' in shell code */
function normalizeShellText(raw) {
  const s = String(raw ?? "");
  return s
    .split("\n")
    .map((line) => line.replace(/^\s*>\s?/, ""))
    .join("\n");
}

/* VSCode-like C++ highlighting (same spirit as CodeBlock) */
function highlightCpp(raw) {
  const src = String(raw ?? "");
  const lines = src.split("\n");

  const KW = new Set([
    "alignas","alignof","and","and_eq","asm","auto","bitand","bitor","bool","break","case","catch","char","char8_t","char16_t","char32_t",
    "class","compl","concept","const","consteval","constexpr","constinit","const_cast","continue","co_await","co_return","co_yield",
    "decltype","default","delete","do","double","dynamic_cast","else","enum","explicit","export","extern","false","float","for","friend",
    "goto","if","inline","int","long","mutable","namespace","new","noexcept","not","not_eq","nullptr","operator","or","or_eq",
    "private","protected","public","register","reinterpret_cast","requires","return","short","signed","sizeof","static","static_assert",
    "static_cast","struct","switch","template","this","thread_local","throw","true","try","typedef","typeid","typename","union","unsigned",
    "using","virtual","void","volatile","wchar_t","while","xor","xor_eq"
  ]);

  const TYPES = new Set([
    "size_t","ssize_t","string","string_view","vector","map","unordered_map","set","unordered_set",
    "optional","variant","expected","unique_ptr","shared_ptr","weak_ptr",
    "App","Request","Response","Context"
  ]);

  const NAMESPACES = new Set(["std","vix","asio","net","http","ws"]);

  function wrap(cls, text) {
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  function splitLineComment(line) {
    let inStr = false;
    let inChar = false;

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
    const m = line.match(/^(\s*#\s*(?:include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b)(.*)$/);
    if (!m) return null;

    const head = m[1];
    const rest = m[2] || "";
    let out = wrap("cpp-directive", head);

    const incAngle = rest.match(/^(\s*)(<[^>\n]*>)(.*)$/);
    if (incAngle) {
      out += esc(incAngle[1]);
      out += wrap("cpp-include", incAngle[2]);
      out += highlightInline(incAngle[3] || "");
      return out;
    }

    const incQuote = rest.match(/^(\s*)("([^"\\]|\\.)*")(.*)$/);
    if (incQuote) {
      out += esc(incQuote[1]);
      out += wrap("cpp-include", incQuote[2]);
      out += highlightInline(incQuote[4] || "");
      return out;
    }

    out += highlightInline(rest);
    return out;
  }

  function highlightInline(s) {
    let out = "";
    let i = 0;

    const isIdStart = (ch) => /[A-Za-z_]/.test(ch);
    const isId = (ch) => /[A-Za-z0-9_]/.test(ch);

    while (i < s.length) {
      const ch = s[i];

      if (ch === '"') {
        let j = i + 1;
        while (j < s.length) {
          if (s[j] === '"' && s[j - 1] !== "\\") break;
          j++;
        }
        const str = s.slice(i, Math.min(j + 1, s.length));
        out += wrap("cpp-string", str);
        i += str.length;
        continue;
      }

      if (ch === "'") {
        let j = i + 1;
        while (j < s.length) {
          if (s[j] === "'" && s[j - 1] !== "\\") break;
          j++;
        }
        const lit = s.slice(i, Math.min(j + 1, s.length));
        out += wrap("cpp-char", lit);
        i += lit.length;
        continue;
      }

      if (/[0-9]/.test(ch)) {
        const m = s.slice(i).match(/^(0x[0-9A-Fa-f]+|[0-9]+(?:\.[0-9]+)?)([uUlLfF]{0,3})/);
        if (m) {
          out += wrap("cpp-number", m[0]);
          i += m[0].length;
          continue;
        }
      }

      if (isIdStart(ch)) {
        let j = i + 1;
        while (j < s.length && isId(s[j])) j++;
        const ident = s.slice(i, j);

        const prevNonSpace = (() => {
          for (let k = i - 1; k >= 0; k--) {
            if (s[k] !== " " && s[k] !== "\t") return s[k];
          }
          return "";
        })();

        const nextNonSpace = (() => {
          for (let k = j; k < s.length; k++) {
            if (s[k] !== " " && s[k] !== "\t") return s[k];
          }
          return "";
        })();

        if (KW.has(ident)) out += wrap("cpp-keyword", ident);
        else if (TYPES.has(ident)) out += wrap("cpp-type", ident);
        else if (NAMESPACES.has(ident)) out += wrap("cpp-namespace", ident);
        else if (nextNonSpace === "(") out += wrap("cpp-fn", ident);
        else if (prevNonSpace === "." || prevNonSpace === ">") out += wrap("cpp-member", ident);
        else out += wrap("cpp-ident", ident);

        i = j;
        continue;
      }

      if (/[\(\)\{\}\[\]\;\,\.\:\=\+\-\*\/\<\>\!\&\|\?]/.test(ch)) {
        if (s.startsWith("::", i)) { out += wrap("cpp-op", "::"); i += 2; continue; }
        if (s.startsWith("->", i)) { out += wrap("cpp-op", "->"); i += 2; continue; }
        out += wrap("cpp-op", ch);
        i++;
        continue;
      }

      out += esc(ch);
      i++;
    }

    out = out.replace(/(https?:\/\/[^\s<]+)/g, `<span class="cpp-url">$1</span>`);
    return out;
  }

  return lines
    .map((line) => {
      const { code, comment } = splitLineComment(line);
      const directive = highlightDirective(code);
      const codeHtml = directive ?? highlightInline(code);
      const comHtml = comment ? `<span class="cpp-comment">${esc(comment)}</span>` : "";
      return codeHtml + comHtml;
    })
    .join("\n");
}

function highlightShell(raw) {
  let s = esc(normalizeShellText(raw));

  s = s.replace(/^(\s*(?:~|\/[^$]*)?\s*\$)/gm, `<span class="shell-prompt">$1</span>`);
  s = s.replace(/(^\s*(?:<span class="shell-prompt">.*?<\/span>\s*)?)([a-zA-Z0-9_.\/-]+)(\s+)/gm, `$1<span class="shell-cmd">$2</span>$3`);
  s = s.replace(/(\s--?[a-zA-Z0-9_-]+(?:=[^\s]+)?)/g, `<span class="shell-flag">$1</span>`);
  s = s.replace(/(https?:\/\/[^\s]+)/g, `<span class="shell-url">$1</span>`);
  s = s.replace(/(\s(?:\.{0,2}\/[^\s]+))/g, `<span class="shell-path">$1</span>`);
  s = s.replace(/(:\d{2,5}\b)/g, `<span class="shell-port">$1</span>`);
  s = s.replace(/^(HTTP\/\d\.\d\s+\d+\s+.*)$/gm, `<span class="shell-http">$1</span>`);
  s = s.replace(/^([A-Za-z-]+:\s*)(.*)$/gm, `<span class="shell-hdr">$1</span><span class="shell-hdrv">$2</span>`);
  return s;
}

const activeHtml = computed(() => {
  const text = activeText.value || "";
  if (activeLang.value === "shell") return highlightShell(text);
  return highlightCpp(text);
});

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    window.clearTimeout(copy._t);
    copy._t = window.setTimeout(() => (copied.value = false), 900);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      copied.value = true;
      window.clearTimeout(copy._t);
      copy._t = window.setTimeout(() => (copied.value = false), 900);
    } finally {
      document.body.removeChild(ta);
    }
  }
}
</script>

<style scoped>
.hero { padding: 0; }

.hero-inner{
  display: grid;
  gap: 2.25rem;
  align-items: flex-start;
}

@media (min-width: 980px){
  .hero-inner{
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3rem;
  }
}

.hero-title{
  font-size: clamp(2.1rem, 4vw, 3.2rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  margin: 0 0 0.9rem;
}

.hero-subtitle{
  margin: 0 0 1.4rem;
  font-size: 1.05rem;
  line-height: 1.6;
  opacity: 0.9;
  max-width: 60ch;
}

.hero-ctas{
  display:flex;
  gap: 0.85rem;
  flex-wrap: wrap;
  margin: 0 0 1.2rem;
}

.hero-badges{
  display:flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
}

.hero-copy{
  max-width: 58ch;
}

.hero-kicker{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: .82rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: rgba(226,232,240,.75);
  margin: 0 0 .65rem;
}

.hero-title{
  font-size: clamp(1.85rem, 2.6vw, 2.55rem);
  line-height: 1.12;
  letter-spacing: -0.02em;
  margin: 0 0 0.95rem;
  font-weight: 800;
  color: rgba(255,255,255,.96);

  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: .45rem;
}

.hero-support{
  margin-top: 0.95rem;
  padding: 0.85rem 0.95rem;
  border-radius: 14px;

  border: 1px solid rgba(148,163,184,.18);
  background: linear-gradient(180deg, rgba(2,6,23,.28), rgba(2,6,23,.14));
  box-shadow: 0 12px 26px rgba(0,0,0,.22);
  max-width: 54ch;
}

.hero-support-title{
  font-size: .86rem;
  font-weight: 800;
  letter-spacing: .01em;
  color: rgba(255,255,255,.92);
  margin: 0 0 .35rem;
}

.hero-support-text{
  font-size: .92rem;
  line-height: 1.55;
  color: rgba(226,232,240,.82);
  margin: 0 0 .55rem;
}

.hero-support-meta{
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: .45rem;
  font-size: .82rem;
  color: rgba(226,232,240,.72);
}

.meta-dot{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(34,197,154,.85);
  box-shadow: 0 0 0 3px rgba(34,197,154,.18);
}

.sep{
  opacity: .5;
}


.dot-sep{
  opacity: .45;
  font-weight: 700;
}

.hero-subtitle{
  margin: 0 0 1.35rem;
  font-size: 1.02rem;
  line-height: 1.65;
  opacity: 0.88;
  max-width: 54ch;
}

@media (max-width: 720px){
  .hero-title{
    font-size: 1.95rem;
    line-height: 1.14;
  }
  .hero-subtitle{
    font-size: .98rem;
  }
}


.pill{
  font-size: 0.85rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  opacity: 0.95;
  white-space: nowrap;
}

/* Buttons */
.btn{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  text-decoration:none;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.06);
  transition: transform 120ms ease, background 120ms ease, border-color 120ms ease;
}
.btn:hover{
  transform: translateY(-1px);
  border-color: rgba(255,255,255,.22);
  background: rgba(255,255,255,.09);
}
.btn.primary{
  background: rgba(255,153,0,.12);
  color:#fff;
}
.btn.primary:hover{
  border-color: rgba(255,153,0,.8);
  background: rgba(255,153,0,.16);
}
.btn.secondary{ opacity: .95; }

.hero-side{
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* Same "uniform width" behavior as CodeBlock */
.code-card{
  width: clamp(480px, 88vw, 620px); /* plus étroit */
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;

  border: 1px solid rgba(148,163,184,.18);
  background: rgba(2,6,23,.72);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(0,0,0,.55);
}

@media (max-width: 720px){
  .code-card{
    width: 100%;
  }
}

/* Header */
.code-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(to bottom, rgba(2,6,23,.92), rgba(2,6,23,.72));
  border-bottom: 1px solid rgba(148,163,184,.14);
}

/* Header layout: scroll row + fixed copy */
.code-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
}

/* This part scrolls horizontally */
.head-scroll{
  display:flex;
  align-items:center;
  gap: 10px;
  min-width: 0;
  flex: 1;

  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  white-space: nowrap;

  scrollbar-width: none; /* Firefox */
}
.head-scroll::-webkit-scrollbar{
  display:none; /* Chrome/Safari */
}

/* Keep everything on one line */
.head-left{
  display:flex;
  align-items:center;
  gap:10px;
  flex: 0 0 auto;
  min-width: max-content;
}
.tabs{
  flex: 0 0 auto;
  min-width: max-content;
  white-space: nowrap;
}

/* Copy stays fixed at right */
.copy-btn{
  flex: 0 0 auto;
}


.head-left{
  display:flex;
  align-items:center;
  gap:10px;
  min-width: 0;
}

.dot{ width:10px; height:10px; border-radius:999px; background:#475569; }
.dot-red{ background:#fb923c; }
.dot-yellow{ background:#facc15; }
.dot-green{ background:#22c55e; }

.head-title{
  color:#e5e7eb;
  font-size:.82rem;
  font-weight:600;
  letter-spacing:.01em;
  white-space:nowrap;
  overflow:hidden;
  text-overflow: ellipsis;
  max-width: 260px;
  min-width: 0;
}

.head-right{
  display:flex;
  align-items:center;
  gap:10px;
  flex-shrink:0;
}

/* CTA principal */
.btn.cta-main{
  background: linear-gradient(180deg, rgba(34,197,154,.22), rgba(34,197,154,.12));
  border-color: rgba(34,197,154,.55);
  color: #ecfeff;
}

.btn.cta-main:hover{
  background: linear-gradient(180deg, rgba(34,197,154,.3), rgba(34,197,154,.18));
  border-color: rgba(34,197,154,.9);
}

/* CTA secondaire (GitHub) */
.btn.cta-secondary{
  background: transparent;
  border-color: rgba(148,163,184,.35);
  color: rgba(226,232,240,.85);
}

.btn.cta-secondary:hover{
  background: rgba(255,255,255,.06);
  border-color: rgba(226,232,240,.65);
  color: #ffffff;
}

.tabs{
  display:flex;
  align-items:center;
  gap:4px;
  padding: 3px;
  border-radius: 999px;
  background: rgba(15,23,42,.55);
  border: 1px solid rgba(148,163,184,.16);
  white-space: nowrap;
}

.tab{
  border: 0;
  background: transparent;
  color:#cbd5e1;
  font-size:.72rem;
  padding: 5px 8px;
  border-radius: 999px;
  cursor:pointer;
  transition: background .15s ease, color .15s ease;
  white-space: nowrap;
}
.tabs{
  gap: 4px;
  padding: 3px;
}

.tab{
  padding: 5px 8px;
  font-size: .72rem;
}


.tab:hover{ background: rgba(148,163,184,.12); color:#e5e7eb; }
.tab.active{ background: rgba(34,197,154,.18); color:#d1fae5; }
@media (max-width: 420px){
  .tab{
    font-size: .68rem;
    padding: 4px 7px;
  }

  .head-title{
    max-width: 34vw;
  }
}

.code-head{
  flex-wrap: nowrap;
}

.code-head{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.head-scroll{
  min-width: 0;
  flex: 1 1 auto;
}

.tabs{
  flex: 0 0 auto;
  max-width: 100%;
}

.head-left,
.head-right{
  flex-shrink: 0;
}

/* Copy icon hidden by default (like CodeBlock) */
.copy-btn{
  width: 34px;
  height: 34px;
  flex: 0 0 auto;

  border: 1px solid rgba(148,163,184,.18);
  background: rgba(15,23,42,.45);
  border-radius: 10px;

  cursor: pointer;
  transition: transform .12s ease, background .15s ease, border-color .15s ease, opacity .15s ease;

  /* desktop behavior by default: hidden until hover */
  opacity: 0;
  pointer-events: none;

  /* force icon color (avoid black inheritance) */
  color: #e5e7eb;
}

.copy-btn svg{
  display:block;
  width: 18px;
  height: 18px;
  margin: 0 auto;
  color: inherit;
}

.copy-btn svg path{
  stroke: currentColor !important;
  fill: none !important;
}

/* desktop: show on hover/focus */
.code-card:hover .copy-btn,
.code-card:focus-within .copy-btn{
  opacity: 1;
  pointer-events: auto;
}

.copy-btn:hover{
  transform: translateY(-1px);
  background: rgba(15,23,42,.65);
  border-color: rgba(34,197,154,.28);
  color: #ffffff;
}

.copy-btn:active{
  color: #22c55e;
}

/* mobile: always visible (no hover) */
@media (hover: none), (pointer: coarse){
  .copy-btn{
    opacity: 1;
    pointer-events: auto;
  }
}


.code-pre{
  margin:0;
  padding: 14px 14px;

  width: 100%;
  max-width: 100%;
  min-width: 0;
  white-space: pre;
  line-height: 1.65;

  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: .88rem;
  color: #e2e8f0;

  background: transparent;
}
.code-pre > code{
  display: inline-block;
  min-width: 100%;
}
.code-body{
  height: 340px;
  overflow: auto;
}

/* Scrollbars */
.code-body::-webkit-scrollbar{ height: 8px; width: 10px; }
.code-body::-webkit-scrollbar-thumb{ background: rgba(34,197,154,.35); border-radius: 999px; }
.code-body::-webkit-scrollbar-track{ background: rgba(2,6,23,.9); }

/* VSCode Dark+ palette */
.cpp-directive { color:#c586c0; }
.cpp-include { color:#ce9178; }
.cpp-keyword { color:#569cd6; }
.cpp-type { color:#4ec9b0; }
.cpp-namespace { color:#4fc1ff; }
.cpp-fn { color:#dcdcaa; }
.cpp-member { color:#9cdcfe; }
.cpp-ident { color:#e2e8f0; }
.cpp-string { color:#ce9178; }
.cpp-char { color:#d7ba7d; }
.cpp-number { color:#b5cea8; }
.cpp-comment { color:#6a9955; font-style: italic; }
.cpp-op { color: rgba(226,232,240,.55); }
.cpp-url { color:#4fc1ff; text-decoration: underline; text-underline-offset: 2px; }

/* Shell */
.shell-prompt { color:#22c55e; font-weight: 800; }
.shell-cmd { color:#38bdf8; font-weight: 800; }
.shell-flag { color:#f97316; font-weight: 800; }
.shell-path { color:#a5b4fc; }
.shell-url { color:#38bdf8; text-decoration: underline; text-underline-offset: 2px; }
.shell-port { color:#b5cea8; }
.shell-http { color:#dcdcaa; font-weight: 800; }
.shell-hdr { color:#4ec9b0; font-weight: 800; }
.shell-hdrv { color:#e2e8f0; }

@media (max-width: 720px){
  .head-title{
    max-width: 42vw;
  }
  .code-pre{ font-size: .84rem; }
}
</style>
