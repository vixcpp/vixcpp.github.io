import { onMounted, onBeforeUnmount } from "vue";

export function useBodyClass(className) {
  onMounted(() => document.body.classList.add(className));
  onBeforeUnmount(() => document.body.classList.remove(className));
}
