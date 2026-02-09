<script setup>
const props = defineProps({
  langLabel: { type: String, default: "cpp" },
  codeLang: { type: String, default: "cpp" },
  code: { type: String, required: true },
});
</script>

<template>
  <div class="vix-hero-code">
    <div class="vix-hero-code__top">
      <span class="vix-hero-code__pill">{{ langLabel }}</span>

      <button class="vix-hero-code__copy" type="button" @click="navigator.clipboard?.writeText(code)">
        Copy
      </button>
    </div>

    <div class="vix-hero-code__body vp-doc">
      <pre><code :class="`language-${codeLang}`">{{ code }}</code></pre>
    </div>
  </div>
</template>
