import DefaultTheme from "vitepress/theme";
import "./custom.css";

import Layout from "./Layout.vue";
import DocsHomeHero from "./DocsHomeHero.vue";
import CodeTabs from "./CodeTabs.vue";

export default {
  ...DefaultTheme,
  Layout, // IMPORTANT: active ton Layout.vue
  enhanceApp({ app }) {
    app.component("DocsHomeHero", DocsHomeHero);
    app.component("CodeTabs", CodeTabs);
  },
};
