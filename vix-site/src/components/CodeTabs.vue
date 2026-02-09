<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  title: { type: String, default: "Examples" },
  subtitle: { type: String, default: "" },
  examples: { type: Array, required: true },
  defaultKey: { type: String, default: "" },
});

const active = ref(props.defaultKey || (props.examples?.[0]?.key ?? ""));

const current = computed(() => {
  return props.examples.find((e) => e.key === active.value) || props.examples[0];
});

function setTab(key) {
  active.value = key;
}
</script>

<template>
  <div class="vix-code-tabs">
    <div class="vix-code-tabs__head">
      <div class="vix-code-tabs__meta">
        <div class="vix-code-tabs__title">{{ title }}</div>
        <div v-if="subtitle" class="vix-code-tabs__subtitle">{{ subtitle }}</div>
      </div>

      <div class="vix-code-tabs__tabs" role="tablist" aria-label="Code examples">
        <button
          v-for="ex in examples"
          :key="ex.key"
          class="vix-code-tabs__tab"
          :class="{ 'is-active': ex.key === active }"
          role="tab"
          :aria-selected="ex.key === active"
          type="button"
          @click="setTab(ex.key)"
        >
          {{ ex.label }}
        </button>
      </div>
    </div>

    <div class="vix-code-tabs__body">
      <div class="vix-code-tabs__file" v-if="current?.file">
        <span class="vix-code-tabs__badge">{{ current.lang }}</span>
        <span class="vix-code-tabs__filename">{{ current.file }}</span>
      </div>

      <div class="vp-doc">
        <pre><code :class="`language-${current?.lang || 'txt'}`">{{ current?.code }}</code></pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vix-code-tabs{
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.vix-code-tabs__head{
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.vix-code-tabs__title{
  font-weight: 700;
  line-height: 1.2;
}

.vix-code-tabs__subtitle{
  margin-top: 2px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.vix-code-tabs__tabs{
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.vix-code-tabs__tab{
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  cursor: pointer;
  transition: transform .08s ease, border-color .12s ease, background .12s ease, color .12s ease;
}

.vix-code-tabs__tab:hover{
  transform: translateY(-1px);
  color: var(--vp-c-text-1);
}

.vix-code-tabs__tab.is-active{
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  border-color: var(--vp-c-divider);
}

.vix-code-tabs__body{
  padding: 12px 14px 14px;
}

.vix-code-tabs__file{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 10px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  background: var(--vp-c-bg);
}

.vix-code-tabs__badge{
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.vix-code-tabs__filename{
  font-family: var(--vp-font-family-mono);
}
</style>
