import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // Main Route
  {
    path: "/",
    redirect: "/chat",
  },

  // auth Route
  {
    path: "/login",
    name: "login",
    component: () => import("../views/Auth/login.vue"),
    meta: {
      authRequired: false,
    },
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/Auth/register.vue"),
    meta: {
      authRequired: false,
    },
  },
  // chat Route
  {
    path: "/chat",
    name: "chat",
    component: () => import("../views/chat.vue"),
    meta: {
      authRequired: true,
    },
  },

  // whatsapp chat Route
  {
    path: "/wp-chat",
    name: "wp chat",
    component: () => import("../views/whatsappChat.vue"),
    meta: {
      authRequired: true,
    },
  },
  {
    path: "/chats",
    name: "chats",
    component: () => import("../views/chats.vue"),
    meta: {
      authRequired: true,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((routeTo, routeFrom, next) => {
  const authRequired =
    routeTo.meta.authRequired ??
    routeTo.matched.some((route) => route.meta.authRequired);
  const user = JSON.parse(localStorage.getItem("user"));
  if (authRequired && !user) {
    next("/login");
  } else {
    next();
  }
});

router.afterEach((routeTo) => {
  document.title = routeTo.meta.title || "Software";
});

export default router;
