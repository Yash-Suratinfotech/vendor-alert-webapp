<template>
  <div class="text-center auth-header">
    <h2 class="fw-bold">Sign in</h2>
    <p class="text-muted mb-0">Welcome back! Please sign in to continue</p>
  </div>
  <div class="box">
    <div class="auth-form">
      <form
        @submit.prevent="handleSignIn"
        class="d-flex flex-column gap-sm-4 gap-3"
      >
        <div>
          <label for="email" class="form-label">Email address</label>
          <input
            type="email"
            class="form-control"
            id="email"
            v-model="email"
            placeholder="Enter your email address"
            required
          />
        </div>

        <div>
          <label for="password" class="form-label">Password</label>
          <input
            type="password"
            class="form-control"
            id="password"
            v-model="password"
            placeholder="••••••"
          />
        </div>

        <div class="d-grid gap-2">
          <div class="text-end">
            <router-link
              to="/forgot-password"
              class="text-decoration-none forget-link"
              >Forgot password?</router-link
            >
          </div>
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="authStore.loading"
          >
            <span
              v-if="authStore.loading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            Sign in
          </button>
          <div class="text-center">
            <p class="text-decoration-none forget-link mb-0">
              Don't have an account?
              <router-link to="/register" class="forget-link">
                Sign Up
              </router-link>
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const layoutStore = useLayoutStore();
const authStore = useAuthStore();

const email = ref("");
const password = ref("");

const handleSignIn = async () => {
  if (email.value === "" || password.value === "") {
    layoutStore.showAlert("Please fill in all fields.", "alert-danger");
    return;
  }
  if (password.value.length < 6) {
    layoutStore.showAlert(
      "Password must be at least 6 characters long.",
      "alert-danger"
    );
    return;
  }

  const payload = {
    email: email.value,
    password: password.value,
  };

  try {
    const res = await authStore.login(payload);
    if (res.status === 200) {
      router.push({ name: "chat" });
    }
  } catch (error) {
    if (error.response?.data?.requiresVerification) {
      // localStorage.setItem('pendingVerificationEmail', email.value);
      // router.push({ name: 'verify-otp', query: { email: email.value } });
    }
  }
};

onMounted(async () => {
  if (authStore.user !== null && authStore.user !== undefined) {
    router.push("/chat");
  }
});
</script>
