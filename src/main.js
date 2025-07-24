import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router/index';

import "../src/assets/bootstrap/custom.scss";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import "../src/assets/scss/style.scss";

const app = createApp(App)
const pinia = createPinia()

app.use(router);
app.use(pinia)
app.mount('#app')
