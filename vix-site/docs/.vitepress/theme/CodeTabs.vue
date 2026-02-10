<script setup>
import { computed, ref, watch } from "vue";
import CodeBlock from "./CodeBlock.vue";

const props = defineProps({
  title: { type: String, default: "Examples" },
  subtitle: { type: String, default: "" },
  examples: { type: Array, required: true },
  defaultKey: { type: String, default: "" },
});

const active = ref(props.defaultKey || (props.examples?.[0]?.key ?? ""));

watch(
  () => [props.defaultKey, props.examples?.map((e) => e.key).join("|")].join("::"),
  () => {
    const wanted = props.defaultKey || active.value;
    const exists = props.examples?.some((e) => e.key === wanted);
    active.value = exists ? wanted : (props.examples?.[0]?.key ?? "");
  },
  { immediate: true }
);

const current = computed(() => {
  return props.examples.find((e) => e.key === active.value) || props.examples[0] || null;
});

function setTab(key) {
  active.value = key;
}

function onTabsKeydown(e) {
  const keys = props.examples?.map((x) => x.key) ?? [];
  if (!keys.length) return;

  const idx = Math.max(0, keys.indexOf(active.value));
  let next = idx;

  if (e.key === "ArrowRight") next = (idx + 1) % keys.length;
  else if (e.key === "ArrowLeft") next = (idx - 1 + keys.length) % keys.length;
  else if (e.key === "Home") next = 0;
  else if (e.key === "End") next = keys.length - 1;
  else return;

  e.preventDefault();
  active.value = keys[next];

  const btn = e.currentTarget?.querySelector?.(`button[data-key="${active.value}"]`);
  btn?.focus?.();
}

const blockTitle = computed(() => {
  const c = current.value;
  if (!c) return "";
  return c.title || c.file || c.label || "";
});

const blockLang = computed(() => current.value?.lang || "");
const blockChips = computed(() => (Array.isArray(current.value?.chips) ? current.value.chips : []));
</script>

<template>
  <div class="vix-code-tabs">
    <div class="vix-code-tabs__head">
      <div class="vix-code-tabs__meta">
        <div class="vix-code-tabs__title">{{ title }}</div>
        <div v-if="subtitle" class="vix-code-tabs__subtitle">{{ subtitle }}</div>
      </div>

      <div
        class="vix-code-tabs__tabs"
        role="tablist"
        aria-label="Code examples"
        @keydown="onTabsKeydown"
      >
        <button
          v-for="ex in examples"
          :key="ex.key"
          class="vix-code-tabs__tab"
          :class="{ 'is-active': ex.key === active }"
          :aria-selected="ex.key === active"
          :tabindex="ex.key === active ? 0 : -1"
          role="tab"
          type="button"
          :data-key="ex.key"
          @click="setTab(ex.key)"
        >
          {{ ex.label }}
        </button>
      </div>
    </div>

    <div class="vix-code-tabs__body">
      <div class="vix-code-tabs__file" v-if="current?.file">
        <span class="vix-code-tabs__badge">{{ current.lang || "txt" }}</span>
        <span class="vix-code-tabs__filename">{{ current.file }}</span>
      </div>

      <CodeBlock
        :title="blockTitle"
        :lang="blockLang"
        :chips="blockChips"
        :code="current?.code || ''"
        :run="current?.run || ''"
        :out="current?.out || ''"
        :note="current?.note || ''"
        :maxHeight="420"
      />
    </div>
  </div>
</template>

<style scoped>
.vix-code-tabs{
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

/* ===== HEAD ===== */
.vix-code-tabs__head{
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.vix-code-tabs__title{
  font-weight: 800;
  line-height: 1.2;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.vix-code-tabs__subtitle{
  margin-top: 1px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

/* ===== TABS ===== */
.vix-code-tabs__tabs{
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.vix-code-tabs__tab{
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);

  padding: 4px 8px;
  border-radius: 999px;

  font-size: 12.5px;
  cursor: pointer;
  outline: none;

  transition: border-color .12s ease, background .12s ease, color .12s ease;
}

.vix-code-tabs__tab:hover{
  color: var(--vp-c-text-1);
}

.vix-code-tabs__tab.is-active{
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border-color: var(--vp-c-divider);
}

.vix-code-tabs__tab:focus-visible{
  border-color: rgba(79,111,255,.55);
  box-shadow: 0 0 0 2px rgba(79,111,255,.30);
}

/* ===== BODY ===== */
.vix-code-tabs__body{
  padding: 8px 10px 10px;
}

/* ===== FILE INFO ===== */
.vix-code-tabs__file{
  display: flex;
  align-items: center;
  gap: 8px;

  padding: 6px 8px;
  margin-bottom: 8px;

  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;

  color: var(--vp-c-text-2);
  font-size: 12.5px;
  background: var(--vp-c-bg);
}

.vix-code-tabs__badge{
  font-weight: 800;
  text-transform: uppercase;
  font-size: 10px;

  padding: 1px 6px;
  border-radius: 999px;

  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.vix-code-tabs__filename{
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 720px){
  .vix-code-tabs__head{
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .vix-code-tabs__tabs{
    justify-content: flex-start;
  }
}
</style>

