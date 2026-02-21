<template>
  <div class="app" :class="{ 'app--registry': isRegistry }">
    <SiteHeader v-if="!isRegistry" />

    <main class="main">
      <router-view />
    </main>

    <SiteFooter v-if="!isRegistry" />

    <PwaInstallToast
      :show="showInstallToast"
      :canInstall="canInstall"
      message="Install Vix.cpp?"
      detail="Pin it like an app. Offline support, faster launch."
      @install="triggerInstall"
      @dismiss="dismissInstall"
    />

    <PwaUpdateToast
      :show="showPwaToast"
      :version="appVersion"
      @refresh="refresh"
      @dismiss="dismiss"
    />
  </div>
</template>

<script setup>
import { inject, computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";

import SiteHeader from "./components/SiteHeader.vue";
import SiteFooter from "./components/SiteFooter.vue";
import PwaUpdateToast from "./components/PwaUpdateToast.vue";
import PwaInstallToast from "./components/PwaInstallToast.vue";

const route = useRoute();

const isRegistry = computed(
  () => route.path === "/registry" || route.path.startsWith("/registry/")
);

// Ajoute/retire une classe globale pour override le CSS global
watch(
  isRegistry,
  (v) => {
    document.documentElement.classList.toggle("is-registry", v);
    document.body.classList.toggle("is-registry", v);
  },
  { immediate: true }
);

// ---------------------------
// PWA Update Toast (existing)
// ---------------------------
const store = inject("pwaToast");
const showPwaToast = computed(() => store?.show?.value === true);

const appVersion = import.meta.env.VITE_APP_VERSION;

function refresh() {
  window.__vix_pwa_refresh__?.();
}
function dismiss() {
  window.__vix_pwa_dismiss__?.();
}

// ---------------------------
// PWA Install Toast (existing)
// ---------------------------
const showInstallToast = ref(false);
const canInstall = ref(false);

let deferredPrompt = null;

const INSTALL_DISMISS_KEY = "vix_pwa_install_dismiss_until";

function nowMs() {
  return Date.now();
}
function shouldShowInstallToast() {
  const until = Number(localStorage.getItem(INSTALL_DISMISS_KEY) || "0");
  return nowMs() > until;
}
function setDismissCooldown(days = 7) {
  const until = nowMs() + days * 24 * 60 * 60 * 1000;
  localStorage.setItem(INSTALL_DISMISS_KEY, String(until));
}
function dismissInstall() {
  setDismissCooldown(7);
  showInstallToast.value = false;
}

async function triggerInstall() {
  if (!deferredPrompt) return;

  try {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    deferredPrompt = null;
    canInstall.value = false;
    showInstallToast.value = false;

    if (choice?.outcome !== "accepted") setDismissCooldown(7);
  } catch {
    deferredPrompt = null;
    canInstall.value = false;
    showInstallToast.value = false;
    setDismissCooldown(7);
  }
}

function onBeforeInstallPrompt(e) {
  e.preventDefault();
  deferredPrompt = e;
  canInstall.value = true;

  if (!shouldShowInstallToast()) return;

  setTimeout(() => {
    if (deferredPrompt && canInstall.value) showInstallToast.value = true;
  }, 900);
}

function onAppInstalled() {
  deferredPrompt = null;
  canInstall.value = false;
  showInstallToast.value = false;
  setDismissCooldown(365);
}

onMounted(() => {
  window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  window.addEventListener("appinstalled", onAppInstalled);
});

</script>

<style scoped>
.app {
  --header-h: 64px;
}

.main {
  padding-top: calc(var(--header-h) + 18px);
  min-height: calc(100vh - var(--header-h));
}

.app--registry .main {
  padding-top: 0;
  min-height: 100vh;
}

@media (max-width: 900px) {
  .app {
    --header-h: 76px;
  }
}
</style>
