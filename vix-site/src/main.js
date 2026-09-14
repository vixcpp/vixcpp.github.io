import { ViteSSG } from "vite-ssg";

import App from "./App.vue";
import { routes, routerOptions } from "./router";
import { blogPosts } from "./data/blog";

import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/main.css";

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
  ...blogPosts.map((post) => `/blog/${post.path}`),
];
