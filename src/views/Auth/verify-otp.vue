<template>
    <div class="text-center auth-header">
        <h2 class="fw-bold">Verify Your Email</h2>
        <p class="text-muted mb-0">
            We've sent a verification code to {{ email }}
        </p>
    </div>
    <div class="box">
        <div class="auth-form">
            <form @submit.prevent="handleVerifyOTP" class="d-flex flex-column gap-sm-4 gap-3">
                <div>
                    <label for="otp" class="form-label">Verification Code</label>
                    <input type="text" class="form-control text-center fs-3" id="otp" v-model="otp" placeholder="000000"
                        maxlength="6" pattern="[0-9]{6}" required />
                </div>

                <div class="d-grid gap-2">
                    <button type="submit" class="btn btn-primary" :disabled="isLoading">
                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"
                            aria-hidden="true"></span>
                        Verify Email
                    </button>

                    <div class="text-center">
                        <p class="text-muted mb-0">
                            Didn't receive the code?
                            <button type="button" class="btn btn-link p-0 text-decoration-none" @click="handleResendOTP"
                                :disabled="resendLoading || resendCountdown > 0">
                                {{ resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend' }}
                            </button>
                        </p>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLayoutStore } from '@/stores/layout';
import { verifyOTP, resendOTP } from '@/api/auth';

const router = useRouter();
const route = useRoute();
const layoutStore = useLayoutStore();

const email = ref('');
const otp = ref('');
const isLoading = ref(false);
const resendLoading = ref(false);
const resendCountdown = ref(0);
let countdownInterval = null;

onMounted(() => {
    email.value = route.query.email || localStorage.getItem('pendingVerificationEmail') || '';
    if (!email.value) {
        router.push('/register');
    }
});

onUnmounted(() => {
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
});

const startResendCountdown = () => {
    resendCountdown.value = 60;
    countdownInterval = setInterval(() => {
        resendCountdown.value--;
        if (resendCountdown.value <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
};

const handleVerifyOTP = async () => {
    if (otp.value.length !== 6) {
        layoutStore.showAlert('Please enter a 6-digit code', 'alert-danger');
        return;
    }

    isLoading.value = true;
    try {
        const res = await verifyOTP({ email: email.value, otp: otp.value });
        if (res.success) {
            localStorage.removeItem('pendingVerificationEmail');
            layoutStore.showAlert('Email verified successfully!', 'alert-success');
            router.push('/login');
        }
    } catch (error) {
        // Error handled by errorHandler
    } finally {
        isLoading.value = false;
    }
};

const handleResendOTP = async () => {
    resendLoading.value = true;
    try {
        const res = await resendOTP(email.value);
        if (res.success) {
            layoutStore.showAlert('Verification code sent!', 'alert-success');
            startResendCountdown();
        }
    } finally {
        resendLoading.value = false;
    }
};
</script>