<template>
  <header class="hdr">
    <div class="wrap">
      <router-link class="brand" to="/">
        <span class="logo">Vix.cpp</span>
        <span class="tag">Modern C++ backend runtime</span>
      </router-link>

      <nav class="nav">
        <router-link v-for="item in navItems" :key="item.to" class="link" :to="item.to">
          {{ item.label }}
        </router-link>
        <a class="link ext" :href="external.registry.href" target="_blank" rel="noreferrer">
          {{ external.registry.label }} <small class="pill">{{ external.registry.badge }}</small>
        </a>
        <a class="cta" :href="external.docs.href" target="_blank" rel="noreferrer">
          {{ external.docs.label }} <small class="pill">{{ external.docs.badge }}</small>
        </a>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { NAV, EXTERNAL } from "../data/nav";

const external = EXTERNAL;
const navItems = computed(() => NAV.filter(x => !x.optional)); // active blog later if you want
</script>

<style scoped>
.hdr { position: sticky; top: 0; backdrop-filter: blur(10px); border-bottom: 1px solid rgba(255,255,255,0.08); }
.wrap { max-width: 1100px; margin: 0 auto; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.brand { display: flex; flex-direction: column; gap: 2px; text-decoration: none; }
.logo { font-weight: 800; font-size: 18px; letter-spacing: 0.2px; }
.tag { opacity: 0.7; font-size: 12px; }
.nav { display: flex; align-items: center; gap: 14px; }
.link { opacity: 0.85; text-decoration: none; font-size: 14px; }
.link:hover { opacity: 1; }
.ext { opacity: 0.75; }
.cta { text-decoration: none; font-size: 14px; padding: 8px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.16); }
.pill { margin-left: 6px; padding: 2px 6px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18); opacity: 0.8; font-size: 11px; }
</style>
