<template>
  <div class="text-center auth-header">
    <h2 class="fw-bold">Create Account</h2>
    <p class="text-muted mb-0">
      Enter your email and password to create an account
    </p>
  </div>
  <div class="box">
    <div class="auth-form">
      <form @submit.prevent="handleRegister" class="d-flex flex-column gap-sm-4 gap-3">
        <div>
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" v-model="email" placeholder="john@company.com" required />
        </div>
        <div>
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" v-model="password" placeholder="••••••" />
        </div>
        <div>
          <label for="user_type" class="form-label">User Type</label>
          <select type="user_type" class="form-select" id="user_type" v-model="user_type"
            placeholder="Select a your user type">
            <option value="vendor">Vendor</option>
            <option value="store_owner">Store Owner</option>
          </select>
        </div>

        <div class="d-grid gap-2">
          <button type="submit" class="btn btn-primary pad-auth" :disabled="isLoading">
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
              aria-hidden="true"></span>
            Create Account
          </button>
          <div class="text-center">
            <p class="mb-0 forget-link mb-0">
              Already have an account?
              <router-link to="/login" class="forget-link">Sign in</router-link>
            </p>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { register } from "@/api/auth";
import { useLayoutStore } from "@/stores/layout";
import { useRouter } from "vue-router";

const layoutStore = useLayoutStore();
const router = useRouter();

const email = ref("");
const password = ref("");
const user_type = ref('vendor');
const isLoading = ref(false);

const isFormValid = computed(() => {
  return email.value && password.value && user_type.value;
});

const handleRegister = async () => {
  if (!isFormValid.value) {
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
  isLoading.value = true;
  try {
    const payload = {
      email: email.value,
      password: password.value,
      userType: user_type.value
    };

    const res = await register(payload);
    if (res.success) {
      localStorage.setItem('pendingVerificationEmail', email.value);
      layoutStore.showAlert(res.message, "alert-success");
      router.push({ name: 'verify-otp', query: { email: email.value } });
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
