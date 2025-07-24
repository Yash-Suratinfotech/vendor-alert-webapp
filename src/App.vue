<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AuthLayout from "@/components/layout/auth.vue";
import DefaultLayout from "@/components/layout/default.vue";

const authStore = useAuthStore();
const route = useRoute();

const layoutComponent = computed(() => {
  const authRoutes = ["login", "register", "forgot-password"];
  return authRoutes.includes(route.name) ? AuthLayout : DefaultLayout;
});

onMounted(() => {
  authStore.initializeAuth();
});
</script>
