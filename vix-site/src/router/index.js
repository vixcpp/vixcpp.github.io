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
