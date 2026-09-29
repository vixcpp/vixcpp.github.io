import { ViteSSG } from "vite-ssg";

import App from "./App.vue";
import { routes, routerOptions } from "./router";
import { blogPosts } from "./data/blog";
import { docsPages } from "./data/docs";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/main.css";
import "./styles/docs.css";

export const createApp = ViteSSG(
  App,
  { routes, ...routerOptions, base: "/", format: "directory" },
  ({ router }) => {
    router.options.routes.push(...[]);
  },
);

export const includedRoutes = () => [
  "/",
  "/learn",
  "/community",
  "/blog",
  "/docs",
  ...blogPosts.map((post) => `/blog/${post.path}`),
  ...docsPages.filter((page) => page.path).map((page) => `/docs/${page.path}`),
];
