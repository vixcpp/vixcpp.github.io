import DefaultTheme from "vitepress/theme";
import "./custom.css";

import DocsHomeHero from "./DocsHomeHero.vue";
import CodeTabs from "./CodeTabs.vue";

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component("DocsHomeHero", DocsHomeHero);
    app.component("CodeTabs", CodeTabs);
  },
};
