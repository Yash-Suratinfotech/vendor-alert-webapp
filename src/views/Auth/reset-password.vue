<template>
    <div class="text-center auth-header">
        <h2 class="fw-bold">Reset Password</h2>
        <p class="text-muted mb-0">Enter your new password</p>
    </div>
    <div class="box">
        <div class="auth-form">
            <form @submit.prevent="handleResetPassword" class="d-flex flex-column gap-sm-4 gap-3">
                <div>
                    <label for="password" class="form-label">New Password</label>
                    <input type="password" class="form-control" id="password" v-model="password" placeholder="••••••"
                        required />
                </div>

                <div>
                    <label for="confirmPassword" class="form-label">Confirm Password</label>
                    <input type="password" class="form-control" id="confirmPassword" v-model="confirmPassword"
                        placeholder="••••••" required />
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary" :disabled="isLoading">
                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                            aria-hidden="true"></span>
                        Reset Password
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
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLayoutStore } from '@/stores/layout';
import { resetPassword } from '@/api/auth';

const router = useRouter();
const route = useRoute();
const layoutStore = useLayoutStore();

const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const token = ref('');

onMounted(() => {
    token.value = route.query.token || '';
    if (!token.value) {
        layoutStore.showAlert('Invalid reset link', 'alert-danger');
        router.push('/forgot-password');
    }
});

const handleResetPassword = async () => {
    if (password.value.length < 6) {
        layoutStore.showAlert('Password must be at least 6 characters long', 'alert-danger');
        return;
    }

    if (password.value !== confirmPassword.value) {
        layoutStore.showAlert('Passwords do not match', 'alert-danger');
        return;
    }

    isLoading.value = true;
    try {
        const res = await resetPassword({
            token: token.value,
            newPassword: password.value
        });

        if (res.success) {
            layoutStore.showAlert('Password reset successful! Please login.', 'alert-success');
            router.push('/login');
        }
    } finally {
        isLoading.value = false;
    }
};
</script>