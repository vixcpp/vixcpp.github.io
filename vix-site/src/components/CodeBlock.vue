<template>
  <pre class="pre"><code>{{ code }}</code></pre>
</template>

<script setup>
defineProps({ code: { type: String, default: "" } });
</script>

<style scoped>
.pre {
  margin: 0;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.03);
  overflow: auto;
  font-size: 13px;
  line-height: 1.45;
}
</style>
