import { createRouter, createWebHistory } from "vue-router";

import HomePage from "../pages/HomePage.vue";
import CommunityPage from "../pages/CommunityPage.vue";
import LearnPage from "../pages/LearnPage.vue";
import NotFoundPage from "../pages/NotFoundPage.vue";

const router = createRouter({
  history: createWebHistory(),

  routes: [
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
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundPage,
    },
  ],

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
});

export default router;
