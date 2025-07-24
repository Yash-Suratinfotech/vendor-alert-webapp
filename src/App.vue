<template>
  <component :is="layoutComponent">
    <router-view />
  </component>

  <!-- Alert Messages -->
  <svg xmlns="http://www.w3.org/2000/svg" class="d-none">
    <symbol id="check-circle-fill" viewBox="0 0 16 16">
      <path
        d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
    </symbol>
    <symbol id="info-fill" viewBox="0 0 16 16">
      <path
        d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </symbol>
    <symbol id="exclamation-triangle-fill" viewBox="0 0 16 16">
      <path
        d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
    </symbol>
  </svg>

  <div v-if="layoutStore.alert?.show" class="position-fixed alert alert-box" :class="layoutStore.alert?.type"
    role="alert" style="right: 10px;">
    <svg v-if="layoutStore.alert?.type == 'alert-primary'" class="bi" role="img" aria-label="Info:">
      <use xlink:href="#info-fill" />
    </svg>
    <svg v-if="layoutStore.alert?.type == 'alert-success'" class="bi" role="img" aria-label="Success:">
      <use xlink:href="#check-circle-fill" />
    </svg>
    <svg v-if="layoutStore.alert?.type == 'alert-warning'" class="bi" role="img" aria-label="Warning:">
      <use xlink:href="#exclamation-triangle-fill" />
    </svg>
    <svg v-if="layoutStore.alert?.type == 'alert-danger'" class="bi" role="img" aria-label="Danger:">
      <use xlink:href="#exclamation-triangle-fill" />
    </svg>
    <p class="mb-0 me-auto">{{ layoutStore.alert?.message }}</p>
    <!-- <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"
      @click="layoutStore.closeAlert()"></button> -->
  </div>

</template>

<script setup>
import { onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from "vue-router";
import emitter from "@/helpers/eventBus";
import { useLayoutStore } from '@/stores/layout';
import { useAuthStore } from '@/stores/auth';
import authLayout from "@/components/layout/auth.vue";
import defaultLayout from "@/components/layout/default.vue";

const layoutStore = useLayoutStore();
const authStore = useAuthStore();

const route = useRoute();

const layoutComponent = computed(() => {
  const authRoutes = ["login", "register", "verify-otp", "reset-password", "forgot-password"];
  return authRoutes.includes(route.name) ? authLayout : defaultLayout;
});

const handleError = ({ message, type }) => {
  layoutStore.showAlert(message, type);
};

onMounted(() => {
  authStore.initializeAuth();
  emitter.on("error", handleError);

  if (authStore.user != null && authStore.token != null) {
    authStore.getProfile(authStore.token).then((res) => {
console.log('✌️res --->', res);
      if (res.status === 401) {
        if (res.response?.data?.message) {
          layoutStore.showAlert(res.response?.data?.message, 'alert-danger');
          authStore.logout();
        }
      } else if (res.status === 404) {
        layoutStore.showAlert(res.response?.data?.message, 'alert-danger');
        authStore.logout();
      }
    }).catch(() => {
      layoutStore.showAlert("Something went wrong. Please try again.", 'alert-danger');
    });
  }
});

onUnmounted(() => {
  emitter.off("error", handleError);
});
</script>