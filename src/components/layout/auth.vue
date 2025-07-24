<template>
    <div class="auth-layout">
        <div class="d-flex align-items-center justify-content-center mx-auto flex-column min-vh-100 p-3">
            <router-link to="/" v-if="!['page-not-found'].includes($route.name)">
                <img src="@/assets/image/logo.png" alt="Creativity"
                    class="img-fluid position-fixed start-0 top-0 ps-3 pt-3" style="max-width: 50px;" />
            </router-link>
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AuthLayout',
    data() {
        return {
            // Define any data properties needed for the auth layout
        };
    },
    methods: {
        // Define any methods needed for the auth layout
    }
}; 
</script>