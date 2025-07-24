<template>
    <div class="text-center auth-header">
        <h2 class="fw-bold">Forgot Password?</h2>
        <p class="text-muted mb-0">Enter your email to reset your password</p>
    </div>
    <div class="box">
        <div class="auth-form">
            <form @submit.prevent="handleForgotPassword" class="d-flex flex-column gap-sm-4 gap-3">
                <div>
                    <label for="email" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="email" v-model="email"
                        placeholder="Enter your email address" required />
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary" :disabled="isLoading">
                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                            aria-hidden="true"></span>
                        Send Reset Link
                    </button>

                    <div class="text-center">
                        <router-link to="/login" class="text-decoration-none forget-link">
                            Back to Login
                        </router-link>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLayoutStore } from '@/stores/layout';
import { forgotPassword } from '@/api/auth';

const router = useRouter();
const layoutStore = useLayoutStore();

const email = ref('');
const isLoading = ref(false);

const handleForgotPassword = async () => {
    if (!email.value) {
        layoutStore.showAlert('Please enter your email address', 'alert-danger');
        return;
    }

    isLoading.value = true;
    try {
        const res = await forgotPassword(email.value);
        if (res.success) {
            layoutStore.showAlert(
                'If the email exists, a password reset link has been sent.',
                'alert-success'
            );
            router.push('/login');
        }
    } finally {
        isLoading.value = false;
    }
};
</script>