import { createApp, ref } from "vue";
import App from "./App.vue";
import router from "./router";

import "./assets/styles/codeblock.css";
import "./style.css";

import PwaUpdateToast from "./components/PwaUpdateToast.vue";

// GitHub Pages SPA restore
const redirect = sessionStorage.getItem("redirect");
if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, "", redirect);
}

const app = createApp(App);

const showPwaToast = ref(false);
const pwaMessage = ref("New version available.");
const pwaDetail = ref("Refresh to load the latest build.");

app.component("PwaUpdateToast", PwaUpdateToast);
app.provide("pwaToast", {
  show: showPwaToast,
  message: pwaMessage,
  detail: pwaDetail,
});

// Mount app
app.use(router).mount("#app");

import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showPwaToast.value = true;
  },
  onOfflineReady() {},
});

window.__vix_pwa_refresh__ = () => updateSW(true);
window.__vix_pwa_dismiss__ = () => {
  showPwaToast.value = false;
};
