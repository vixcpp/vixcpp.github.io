<template>
  <div class="code-card" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="code-head">
      <div class="head-left">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>

        <span class="head-title">{{ title || computedTitle }}</span>

        <div v-if="chipsToShow.length" class="chips">
          <span v-for="c in chipsToShow" :key="c" class="chip">{{ c }}</span>
        </div>
      </div>

      <div class="head-right">
        <div class="tabs" v-if="tabs.length > 1">
          <button
            v-for="t in tabs"
            :key="t.key"
            type="button"
            class="tab"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            {{ t.label }}
          </button>
        </div>

        <button
          v-if="activeText"
          type="button"
          class="copy-btn"
          @click="copy(activeText)"
          :title="copied ? 'Copied' : 'Copy'"
          aria-label="Copy"
        >
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
    </div>

    <div class="code-body" :style="{ maxHeight: maxH }" role="region" aria-label="Code block">
      <pre class="code-pre"><code class="code-code" v-html="activeHtml"></code></pre>
    </div>

    <div v-if="note" class="code-foot">
      <p class="code-note">{{ note }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  title: { type: String, default: "" },

  code: { type: String, default: "" },
  run: { type: String, default: "" },
  out: { type: String, default: "" },

  note: { type: String, default: "" },

  // optional: "cpp" | "shell"
  lang: { type: String, default: "" },

  chips: { type: Array, default: () => [] },

  maxHeight: { type: [Number, String], default: 380 },
});

const copied = ref(false);
const activeTab = ref("code");
const hover = ref(false);

const tabs = computed(() => {
  const list = [];
  if (props.code?.trim()) list.push({ key: "code", label: "Code", text: props.code, lang: guessLang("code") });
  if (props.run?.trim()) list.push({ key: "run", label: "Run", text: props.run, lang: "shell" });
  if (props.out?.trim()) list.push({ key: "out", label: "Output", text: props.out, lang: "shell" });
  return list;
});

watch(
  () => tabs.value.map((t) => t.key).join(","),
  () => {
    if (!tabs.value.find((t) => t.key === activeTab.value)) {
      activeTab.value = tabs.value[0]?.key || "code";
    }
  },
  { immediate: true }
);

const active = computed(() => tabs.value.find((t) => t.key === activeTab.value) || tabs.value[0]);
const activeText = computed(() => active.value?.text || "");
const activeLang = computed(() => active.value?.lang || guessLang(activeTab.value));

const computedTitle = computed(() => {
  if (activeTab.value === "run") return "Run";
  if (activeTab.value === "out") return "Output";
  return activeLang.value === "shell" ? "Shell" : "C++";
});

const chipsToShow = computed(() => (props.chips || []).filter(Boolean));

const maxH = computed(() => {
  const v = props.maxHeight;
  if (typeof v === "number") return `${v}px`;
  if (typeof v === "string" && v.trim()) return v;
  return "380px";
});

function guessLang(tabKey) {
  if (props.lang) return props.lang;
  if (tabKey === "run" || tabKey === "out") return "shell";
  const s = (props.code || "").trim();
  if (s.includes("#include") || s.includes("int main") || s.includes("std::")) return "cpp";
  if (s.startsWith("~$") || s.includes(" vix ") || s.includes("$ ")) return "shell";
  return "cpp";
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* Remove markdown quote '>' in run/output */
function normalizeShellText(raw) {
  const s = String(raw ?? "");
  return s
    .split("\n")
    .map((line) => {
      // 1) remove markdown quote at line start
      let out = line.replace(/^\s*>\s?/, "");

      // 2) remove weird " >:8080" prompt chunk (">:" with optional spaces)
      //    turns "http >:8080/api/ping" into "http :8080/api/ping"
      out = out.replace(/\s*>\s*:(\d{2,5})/g, " :$1");

      return out;
    })
    .join("\n");
}

/* VSCode-like C++ highlighting */
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
s = s.replace(/(\s\|\|\s|\s\|\s)/g, `<span class="shell-op">$1</span>`);
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

<style>
/* Uniform width for ALL code blocks (like your old version)
   - same width everywhere
   - responsive with clamp
*/
.code-card{
  width: clamp(520px, 92vw, 980px);
  max-width: 100%;
  min-width: 0;
  margin: 0 auto;

  border: 1px solid rgba(148,163,184,.18);
  background: rgba(2,6,23,.72);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(0,0,0,.55);
}
.code-card{
  width: 100%;
  max-width: 100%;
  margin: 0;
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
}

.chips{
  display:flex;
  align-items:center;
  gap:8px;
  min-width: 0;
  flex-wrap: wrap;
}

.chip{
  display:inline-flex;
  align-items:center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: .72rem;
  color: #cbd5e1;
  border: 1px solid rgba(34,197,154,.22);
  background: rgba(2,44,34,.35);
}

.head-right{
  display:flex;
  align-items:center;
  gap:10px;
  flex-shrink:0;
}

.tabs{
  display:flex;
  align-items:center;
  gap:6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(15,23,42,.55);
  border: 1px solid rgba(148,163,184,.16);
}

.tab{
  border: 0;
  background: transparent;
  color:#cbd5e1;
  font-size:.75rem;
  padding: 6px 10px;
  border-radius: 999px;
  cursor:pointer;
  transition: background .15s ease, color .15s ease;
}
.tab:hover{ background: rgba(148,163,184,.12); color:#e5e7eb; }
.tab.active{ background: rgba(34,197,154,.18); color:#d1fae5; }

/* Copy icon hidden by default */
.copy-btn{
  width: 34px;
  height: 34px;
  border: 1px solid rgba(148,163,184,.18);
  background: rgba(15,23,42,.45);
  color:#e5e7eb;
  border-radius: 10px;
  cursor:pointer;
  transition: transform .12s ease, background .15s ease, border-color .15s ease, opacity .15s ease;

  opacity: 0;
  pointer-events: none;
}
.code-card:hover .copy-btn,
.code-card:focus-within .copy-btn{
  opacity: 1;
  pointer-events: auto;
}
.copy-btn:hover{
  transform: translateY(-1px);
  background: rgba(15,23,42,.65);
  border-color: rgba(34,197,154,.28);
}
.ico{ width: 18px; height: 18px; display:block; margin: 0 auto; }

/* Body: single background */
.code-body{
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #020617;
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

/* Footer */
.code-foot{
  border-top: 1px solid rgba(148,163,184,.12);
  background: rgba(2,6,23,.62);
  padding: 10px 12px;
}
.code-note{
  margin:0;
  color:#94a3b8;
  font-size:.85rem;
  line-height: 1.55;
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
.shell-op { color: rgba(226,232,240,.65); }
.shell-http { color:#dcdcaa; font-weight: 800; }
.shell-hdr { color:#4ec9b0; font-weight: 800; }
.shell-hdrv { color:#e2e8f0; }

@media (max-width: 720px){
  .head-title{
    max-width: 35vw;
    overflow:hidden;
    text-overflow: ellipsis;
  }
  .code-pre{ font-size: .84rem; }
}
</style>
