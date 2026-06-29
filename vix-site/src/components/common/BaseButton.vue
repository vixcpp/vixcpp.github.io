<template>
  <a
    v-if="external || isExternalHref"
    class="btn"
    :class="[`btn--${variant}`]"
    :href="href"
    target="_blank"
    rel="noreferrer"
  >
    <span class="btn__label"><slot /></span>
    <span v-if="arrow" class="btn__arrow" aria-hidden="true">→</span>
  </a>
  <RouterLink v-else class="btn" :class="[`btn--${variant}`]" :to="href">
    <span class="btn__label"><slot /></span>
    <span v-if="arrow" class="btn__arrow" aria-hidden="true">→</span>
  </RouterLink>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  href: { type: String, required: true },
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "secondary", "ghost"].includes(v),
  },
  external: { type: Boolean, default: false },
  arrow: { type: Boolean, default: false },
});

const isExternalHref = computed(
  () => props.href.startsWith("http://") || props.href.startsWith("https://"),
);
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.2rem;
  border-radius: var(--radius-md);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    background var(--speed) var(--ease),
    border-color var(--speed) var(--ease),
    color var(--speed) var(--ease),
    transform var(--speed) var(--ease),
    box-shadow var(--speed) var(--ease);
}

/* Primary — solid green */
.btn--primary {
  background: var(--green);
  color: #fff;
  box-shadow: var(--shadow-green);
}
.btn--primary:hover {
  background: var(--green-strong);
  color: #fff;
  transform: translateY(-1px);
}

/* Secondary — outlined */
.btn--secondary {
  background: var(--bg-panel);
  border-color: var(--line-strong);
  color: var(--text);
}
.btn--secondary:hover {
  border-color: var(--green-line);
  color: var(--green-strong);
  transform: translateY(-1px);
}

/* Ghost — bare */
.btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-soft);
}
.btn--ghost:hover {
  background: var(--bg-sunken);
  color: var(--text);
}

.btn__arrow {
  opacity: 0.75;
  transition: transform var(--speed) var(--ease);
}
.btn:hover .btn__arrow {
  transform: translateX(2px);
}
</style>
