<template>
  <div class="wrap">
    <h1 class="h1">404</h1>
    <p class="p">This page doesn’t exist.</p>
    <div class="row">
      <router-link class="btn" to="/">Go home</router-link>
      <router-link class="btn" to="/examples">Examples</router-link>
      <router-link class="btn" to="/install">Install</router-link>
    </div>
  </div>
</template>

<style scoped>
.wrap { max-width: 1100px; margin: 0 auto; padding: 60px 18px 80px; text-align: center; }
.h1 { margin: 0; font-size: 46px; letter-spacing: -0.02em; }
.p { margin: 10px 0 0; opacity: 0.8; }
.row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
.btn { text-decoration: none; padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.16); }
</style>
