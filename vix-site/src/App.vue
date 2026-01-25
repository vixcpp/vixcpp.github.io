<template>
  <header style="display:flex;gap:12px;padding:16px;border-bottom:1px solid #eee;">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/docs">Docs</RouterLink>
    <RouterLink to="/blog">Blog</RouterLink>
  </header>

  <main style="padding:16px;">
    <RouterView />
  </main>
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
</script>
