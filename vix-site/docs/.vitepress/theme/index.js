import DefaultTheme from "vitepress/theme";
import "./custom.css";

import DocsHomeHero from "./DocsHomeHero.vue";

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component("DocsHomeHero", DocsHomeHero);
  },
};
