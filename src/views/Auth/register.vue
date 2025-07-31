<template>
  <div class="text-center auth-header">
    <h2 class="fw-bold">Create Account</h2>
    <p class="text-muted mb-0">
      Enter your details to create an account
    </p>
  </div>
  <div class="box">
    <div class="auth-form">
      <form @submit.prevent="handleRegister" class="d-flex flex-column gap-sm-4 gap-3">
        <div>
          <label for="username" class="form-label">Username</label>
          <input type="text" class="form-control" id="username" v-model="username" placeholder="johndoe" required />
        </div>
        <div>
          <label for="email" class="form-label">Email</label>
          <input type="email" class="form-control" id="email" v-model="email" placeholder="john@company.com" required />
        </div>
        <div>
          <label for="phone" class="form-label">Phone Number</label>
          <input type="tel" class="form-control" id="phone" v-model="phone" placeholder="+1234567890" required />
        </div>
        <div>
          <label for="password" class="form-label">Password</label>
          <input type="password" class="form-control" id="password" v-model="password" placeholder="••••••" />
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

const username = ref("");
const email = ref("");
const phone = ref("");
const password = ref("");
const isLoading = ref(false);

const isFormValid = computed(() => {
  return username.value && email.value && phone.value && password.value;
});

const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

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

  if (!validatePhone(phone.value)) {
    layoutStore.showAlert(
      "Please enter a valid phone number.",
      "alert-danger"
    );
    return;
  }

  isLoading.value = true;
  try {
    const payload = {
      email: email.value,
      password: password.value,
      username: username.value,
      phone: phone.value,
      userType: 'vendor'
    };

    const res = await register(payload);
    if (res.status == 201) {
      // localStorage.setItem('pendingVerificationEmail', email.value);
      layoutStore.showAlert(res.message, "alert-success");
      // router.push({ name: 'verify-otp', query: { email: email.value } });
      router.push({ name: 'login' });
    }
  } finally {
    isLoading.value = false;
  }
};
</script>
