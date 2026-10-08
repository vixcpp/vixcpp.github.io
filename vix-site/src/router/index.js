import HomePage from "../pages/HomePage.vue";
import CommunityPage from "../pages/CommunityPage.vue";
import LearnPage from "../pages/LearnPage.vue";
import BlogPage from "../pages/BlogPage.vue";
import BlogPostPage from "../pages/BlogPostPage.vue";
import NotFoundPage from "../pages/NotFoundPage.vue";

export const routes = [
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/learn",
    name: "learn",
    component: LearnPage,
  },
  {
    path: "/community",
    name: "community",
    component: CommunityPage,
  },
  {
    path: "/blog",
    name: "blog",
    component: BlogPage,
  },
  {
    path: "/blog/:pathMatch(.*)*",
    name: "blog-post",
    component: BlogPostPage,
  },

  {
    path: "/docs/:pathMatch(.*)*",
    name: "docs",
    beforeEnter: (to) => {
      const path = to.params.pathMatch;
      const suffix = Array.isArray(path) ? path.join("/") : path || "";
      const target = new URL(
        suffix ? `/${suffix}` : "/",
        "https://docs.vixcpp.com",
      );
      const queryStart = to.fullPath.indexOf("?");
      const hashStart = to.fullPath.indexOf("#");
      target.search =
        queryStart === -1
          ? ""
          : to.fullPath.slice(queryStart, hashStart === -1 ? undefined : hashStart);
      target.hash = to.hash;
      window.location.replace(target);

      return false;
    },
  },

  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
];

export const routerOptions = {
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
      };
    }

    return {
      top: 0,
    };
  },
};
