<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  rootMargin: {
    type: String,
    default: "260px",
  },
});

const el = ref(null);
const visible = ref(false);

let observer = null;

onMounted(() => {
  if (!el.value) return;

  if (!("IntersectionObserver" in window)) {
    visible.value = true;
    return;
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;

      visible.value = true;

      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },
    {
      root: null,
      rootMargin: props.rootMargin,
      threshold: 0.01,
    },
  );

  observer.observe(el.value);
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<template>
  <div ref="el" class="lazy-section">
    <slot v-if="visible" />
  </div>
</template>

<style scoped>
.lazy-section {
  min-height: 1px;
}
</style>
