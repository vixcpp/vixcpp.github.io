<template>
  <div class="cmd">
    <span class="cmd-prompt" aria-hidden="true">$</span>
    <code>{{ command }}</code>
  </div>
</template>

<script setup>
defineProps({
  command: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.cmd {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: fit-content;
  max-width: 100%;
  border: 1px solid rgba(34, 197, 94, 0.18);
  border-radius: 999px;
  background:
    linear-gradient(180deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.035)),
    rgba(3, 7, 5, 0.72);
  padding: 0.68rem 0.9rem;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.22);
}

.cmd-prompt {
  color: var(--green-soft);
  font-family: var(--font-mono);
  font-size: 0.86rem;
  opacity: 0.9;
}

code {
  overflow: hidden;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .cmd {
    width: 100%;
    border-radius: var(--radius-md);
  }

  code {
    white-space: normal;
    word-break: break-word;
  }
}
</style>
