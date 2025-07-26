<template>
    <div class="text-center auth-header">
        <h2 class="fw-bold">Verify Your Token</h2>
        <p class="text-muted mb-0">
            Checking...
        </p>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
    const token = route.query.token;

    if (token) {
        localStorage.removeItem("user");

        const res = await authStore.getVerifyUser({ token });
        if (res?.user) {
            router.push('/chat');
        }
    }
});
</script>