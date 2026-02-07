<template>
  <div class="code-card">
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
          class="copy"
          @click="copy(activeText)"
          :title="copied ? 'Copied' : 'Copy'"
        >
          {{ copied ? "Copied" : "Copy" }}
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

  // optional: top chips (labels)
  chips: { type: Array, default: () => [] },

  maxHeight: { type: [Number, String], default: 380 },
});

const copied = ref(false);
const activeTab = ref("code");

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
  if (activeTab.value === "run") return "Command";
  if (activeTab.value === "out") return "Output";
  return activeLang.value === "shell" ? "Snippet" : "C++";
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

function highlightCpp(raw) {
  const src = String(raw ?? "");
  const lines = src.split("\n");

  const KW = new Set([
    "auto","bool","break","case","catch","class","const","constexpr","continue",
    "default","delete","do","else","enum","explicit","export","false","for","friend",
    "if","inline","namespace","new","nullptr","private","protected","public","return",
    "sizeof","static","struct","switch","template","this","throw","true","try","typename",
    "using","virtual","void","while"
  ]);

  const TYPES = new Set([
    "int","long","short","float","double","char","size_t","string","string_view",
    "vector","map","unordered_map","optional","variant","expected"
  ]);

  function wrap(cls, text) {
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  // Important: do NOT treat "https://..." as a C++ comment.
  // We only split on // when it's NOT inside a string, and also NOT part of http(s)://
  function splitLineComment(line) {
    let inStr = false;

    for (let i = 0; i < line.length - 1; i++) {
      const c = line[i];

      if (c === '"' && line[i - 1] !== "\\") inStr = !inStr;

      if (!inStr && line[i] === "/" && line[i + 1] === "/") {
        const before = line.slice(0, i);
        // If the two slashes are part of http:// or https://, do not split
        if (before.endsWith("http:") || before.endsWith("https:")) continue;
        return { code: before, comment: line.slice(i) };
      }
    }

    return { code: line, comment: "" };
  }

  function highlightLine(codeLine) {
    // directives: #include, #define...
    const m = codeLine.match(/^(\s*#\s*(?:include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b)(.*)$/);
    if (m) {
      const head = m[1];
      const rest = m[2] || "";
      let out = wrap("cpp-directive", head);

      // include target: <...> or "..."
      const incAngle = rest.match(/^(\s*)(<[^>\n]*>)(.*)$/);
      if (incAngle) {
        out += esc(incAngle[1]);
        out += wrap("cpp-include", incAngle[2]);
        out += highlightLine(incAngle[3] || "");
        return out;
      }

      const incQuote = rest.match(/^(\s*)("([^"\\]|\\.)*")(.*)$/);
      if (incQuote) {
        out += esc(incQuote[1]);
        out += wrap("cpp-include", incQuote[2]);
        out += highlightLine(incQuote[4] || "");
        return out;
      }

      out += highlightNonDirective(rest);
      return out;
    }

    return highlightNonDirective(codeLine);
  }

  function highlightNonDirective(s) {
    let out = "";
    let last = 0;

    // strings, identifiers
    const re = /"([^"\\]|\\.)*"|[A-Za-z_]\w*/g;

    for (const mm of s.matchAll(re)) {
      const idx = mm.index ?? 0;
      if (idx > last) out += esc(s.slice(last, idx));

      const tok = mm[0];

      if (tok.startsWith('"')) out += wrap("cpp-string", tok);
      else {
        if (KW.has(tok)) out += wrap("cpp-keyword", tok);
        else if (TYPES.has(tok)) out += wrap("cpp-type", tok);
        else out += esc(tok);
      }

      last = idx + tok.length;
    }

    if (last < s.length) out += esc(s.slice(last));
    return out;
  }

  return lines
    .map((line) => {
      const { code, comment } = splitLineComment(line);
      const codeHtml = highlightLine(code);

      // highlight URLs even in C++ blocks, so they never look "dead"
      const urlified = codeHtml.replace(
        /(https?:\/\/[^\s<]+)/g,
        `<span class="cpp-url">$1</span>`
      );

      const comHtml = comment ? `<span class="cpp-comment">${esc(comment)}</span>` : "";
      return urlified + comHtml;
    })
    .join("\n");
}

function highlightShell(raw) {
  // escape first
  let s = esc(raw);

  // prompt
  s = s.replace(
    /^(\s*(?:\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)\s*)?(?:~|\/[^$]*)?\s*\$)/gm,
    `<span class="shell-prompt">$1</span>`
  );

  // command name (first token)
  s = s.replace(
    /(^\s*(?:<span class="shell-prompt">.*?<\/span>\s*)?)([a-zA-Z0-9_.\/-]+)(\s+)/gm,
    `$1<span class="shell-cmd">$2</span>$3`
  );

  // flags
  s = s.replace(/(\s--?[a-zA-Z0-9_-]+(?:=[^\s]+)?)/g, `<span class="shell-flag">$1</span>`);

  // urls and paths
  s = s.replace(/(https?:\/\/[^\s]+)/g, `<span class="shell-url">$1</span>`);
  s = s.replace(/(\s(?:\.{0,2}\/[^\s]+))/g, `<span class="shell-path">$1</span>`);

  // pipes and redirects
  s = s.replace(/(\s\|\s|\s\|\|\s|>\s*[^\s]+)/g, `<span class="shell-op">$1</span>`);

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
/* Width fix: never exceed parent container */
.code-card {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 10, 18, 0.85);
}

/* Header */
.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.head-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

.chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chip {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
}

.head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tabs {
  display: flex;
  gap: 6px;
}

.tab {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: rgba(255, 255, 255, 0.75);
  cursor: pointer;
}
.tab.active {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.copy {
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
}

/* Body sizing + proper code scroll */
.code-body {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: auto; /* vertical */
}

.code-pre {
  margin: 0;
  padding: 12px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto; /* horizontal */
  overflow-y: visible;
  white-space: pre;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.9);
}

/* Make sure <code> behaves like a real codeblock */
.code-code {
  display: block;
  min-width: max-content; /* keeps columns aligned, scroll in pre */
}

/* Footer */
.code-foot {
  padding: 10px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.02);
}
.code-note {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

/* Syntax colors: your spans were there but no styles, so everything looked plain */
.cpp-keyword { color: #7aa2f7; font-weight: 600; }
.cpp-type { color: #2ac3de; }
.cpp-string { color: #9ece6a; }
.cpp-comment { color: rgba(255, 255, 255, 0.42); font-style: italic; }
.cpp-directive { color: #bb9af7; font-weight: 600; }
.cpp-include { color: #e0af68; }
.cpp-url { color: #7dcfff; text-decoration: underline; text-underline-offset: 2px; }

.shell-prompt { color: rgba(255, 255, 255, 0.55); }
.shell-cmd { color: #7aa2f7; font-weight: 600; }
.shell-flag { color: #e0af68; }
.shell-url { color: #7dcfff; text-decoration: underline; text-underline-offset: 2px; }
.shell-path { color: #9ece6a; }
.shell-op { color: #bb9af7; }

/* Mobile tweaks */
@media (max-width: 640px) {
  .code-pre { font-size: 12px; padding: 10px; }
  .head-title { max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
}
</style>
