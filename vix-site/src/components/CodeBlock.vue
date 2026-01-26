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
      <pre class="code-pre"><code v-html="activeHtml"></code></pre>
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

function replaceOutsideTags(html, regex, replacer) {
  return html
    .split(/(<[^>]*>)/g) // garde les tags
    .map((part) => (part.startsWith("<") ? part : part.replace(regex, replacer)))
    .join("");
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
    "int","long","short","float","double","char","size_t","string",
    "vector","map","unordered_map"
  ]);

  const TOKEN_RE =
    /"([^"\\]|\\.)*"|^\s*#\s*(include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b|<[^>\n]*>|[A-Za-z_]\w*/gm;

  function wrap(cls, text) {
    return `<span class="${cls}">${esc(text)}</span>`;
  }

  function splitLineComment(line) {
    let inStr = false;
    for (let i = 0; i < line.length - 1; i++) {
      const c = line[i];
      if (c === '"' && line[i - 1] !== "\\") inStr = !inStr;

      if (!inStr && line[i] === "/" && line[i + 1] === "/") {
        return { code: line.slice(0, i), comment: line.slice(i) };
      }
    }
    return { code: line, comment: "" };
  }

  function highlightCode(code) {
    let out = "";
    let last = 0;

    const re = new RegExp(TOKEN_RE.source, TOKEN_RE.flags);

    for (const m of code.matchAll(re)) {
      const idx = m.index ?? 0;

      if (idx > last) out += esc(code.slice(last, idx));

      const tok = m[0];

      if (tok.startsWith('"')) {
        out += wrap("cpp-string", tok);
      }
      else if (/^\s*#\s*/.test(tok)) {
        out += wrap("cpp-directive", tok);
      }
      else if (tok.startsWith("<") && tok.endsWith(">")) {
        out += wrap("cpp-include", tok);
      }
      else {
        if (KW.has(tok)) out += wrap("cpp-keyword", tok);
        else if (TYPES.has(tok)) out += wrap("cpp-type", tok);
        else out += esc(tok);
      }

      last = idx + tok.length;
    }

    if (last < code.length) out += esc(code.slice(last));
    return out;
  }

 function highlightLine(codeLine) {
  const isDirectiveLine =
    /^\s*#\s*(include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b/.test(codeLine);

  if (!isDirectiveLine) {
    let out = "";
    let last = 0;
    const re = /"([^"\\]|\\.)*"|[A-Za-z_]\w*/g;

    for (const m of codeLine.matchAll(re)) {
      const idx = m.index ?? 0;
      if (idx > last) out += esc(codeLine.slice(last, idx));

      const tok = m[0];
      if (tok.startsWith('"')) out += wrap("cpp-string", tok);
      else {
        if (KW.has(tok)) out += wrap("cpp-keyword", tok);
        else if (TYPES.has(tok)) out += wrap("cpp-type", tok);
        else out += esc(tok);
      }

      last = idx + tok.length;
    }

    if (last < codeLine.length) out += esc(codeLine.slice(last));
    return out;
  }

  const m = codeLine.match(
    /^(\s*#\s*(?:include|define|pragma|if|ifdef|ifndef|endif|elif|else)\b)(.*)$/
  );
  if (!m) return highlightCode(codeLine);

  const head = m[1];
  const rest = m[2] || "";

  let out = wrap("cpp-directive", head);

  const angle = rest.match(/^(\s*)(<[^>\n]*>)(.*)$/);
  if (angle) {
    const ws = angle[1];
    const target = angle[2];
    const tail = angle[3];

    out += esc(ws);
    out += wrap("cpp-include", target);
    out += highlightLine(tail);
    return out;
  }

  const quote = rest.match(/^(\s*)("([^"\\]|\\.)*")(.*)$/);
  if (quote) {
    const ws = quote[1];
    const target = quote[2];
    const tail = quote[4];

    out += esc(ws);
    out += wrap("cpp-include", target);
    out += highlightLine(tail);
    return out;
  }

  out += highlightLine(rest);
  return out;
}


  return lines
    .map((line) => {
      const { code, comment } = splitLineComment(line);
      const codeHtml = highlightLine(code);
      const comHtml = comment ? `<span class="cpp-comment">${esc(comment)}</span>` : "";
      return codeHtml + comHtml;
    })
    .join("\n");
}


function highlightShell(raw) {
  let s = esc(raw);

  s = s.replace(
    /^(\s*(?:\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)\s*)?(?:~|\/[^$]*)?\s*\$)/gm,
    `<span class="shell-prompt">$1</span>`
  );

  s = s.replace(
    /(^\s*(?:<span class="shell-prompt">.*?<\/span>\s*)?)([a-zA-Z0-9_.\/-]+)(\s+)/gm,
    `$1<span class="shell-cmd">$2</span>$3`
  );

  s = s.replace(/(\s--?[a-zA-Z0-9_-]+(?:=[^\s]+)?)/g, `<span class="shell-flag">$1</span>`);
  s = s.replace(/(https?:\/\/[^\s]+)/g, `<span class="shell-path">$1</span>`);

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
