<script setup>
import { loadBlogPostHtml } from "../../data/blog";

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const html = await loadBlogPostHtml(props.path);
</script>

<template>
  <div class="post-content" v-html="html" />
</template>
