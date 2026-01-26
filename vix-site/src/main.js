import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

const redirect = sessionStorage.getItem("redirect");
if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, "", redirect);
}

createApp(App).use(router).mount("#app");
