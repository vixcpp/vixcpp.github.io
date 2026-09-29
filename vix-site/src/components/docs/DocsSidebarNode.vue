<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const props = defineProps({ node: { type: Object, required: true } });
const route = useRoute();
const path = computed(() => props.node.page?.path || "");
const href = computed(() => `/docs${path.value ? `/${path.value}` : ""}`);
const label = computed(() => props.node.page?.title || props.node.segment.replace(/[-_]/g, " "));
const open = computed(() => route.path.startsWith(href.value));
</script>

<template>
  <li class="docs-sidebar-node">
    <RouterLink v-if="!node.children?.length" :to="href" :class="{ 'is-active': route.path === href }">{{ label }}</RouterLink>
    <details v-else :open="open">
      <summary>{{ label }}</summary>
      <ul>
        <li class="docs-sidebar-node"><RouterLink :to="href" :class="{ 'is-active': route.path === href }">Overview</RouterLink></li>
        <DocsSidebarNode v-for="child in node.children" :key="child.segment" :node="child" />
      </ul>
    </details>
  </li>
</template>
