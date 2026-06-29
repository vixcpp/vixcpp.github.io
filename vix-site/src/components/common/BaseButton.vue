<template>
  <a
    v-if="external || isExternalHref"
    class="btn"
    :class="[`btn--${variant}`]"
    :href="href"
    target="_blank"
    rel="noreferrer"
  >
    <span><slot /></span>
    <span v-if="arrow" class="btn-arrow" aria-hidden="true">→</span>
  </a>

  <RouterLink v-else class="btn" :class="[`btn--${variant}`]" :to="href">
    <span><slot /></span>
    <span v-if="arrow" class="btn-arrow" aria-hidden="true">→</span>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  href: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: "primary",
    validator: (value) => ["primary", "secondary", "ghost"].includes(value),
  },
  external: {
    type: Boolean,
    default: false,
  },
  arrow: {
    type: Boolean,
    default: false,
  },
});

const isExternalHref = computed(() => {
  return props.href.startsWith("http://") || props.href.startsWith("https://");
});
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 44px;
  padding: 0.72rem 1rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 750;
  line-height: 1;
  text-decoration: none;
  transition:
    transform var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    background var(--speed) var(--ease),
    color var(--speed) var(--ease);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn--primary {
  border: 1px solid rgba(34, 197, 94, 0.55);
  background: linear-gradient(180deg, #35d56d, #16a34a);
  color: #031108;
  box-shadow: 0 12px 36px rgba(34, 197, 94, 0.18);
}

.btn--primary:hover {
  color: #031108;
  border-color: rgba(167, 243, 208, 0.85);
}

.btn--secondary {
  border: 1px solid rgba(34, 197, 94, 0.22);
  background: rgba(34, 197, 94, 0.08);
  color: var(--green-soft);
}

.btn--secondary:hover {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(34, 197, 94, 0.12);
  color: #bbf7d0;
}

.btn--ghost {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.025);
  color: var(--text-soft);
}

.btn--ghost:hover {
  border-color: rgba(148, 163, 184, 0.22);
  background: rgba(255, 255, 255, 0.045);
  color: var(--text);
}

.btn-arrow {
  transform: translateY(-0.5px);
  opacity: 0.85;
}
</style>
