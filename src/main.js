import { createApp } from 'vue'
import { createPinia } from 'pinia';
import App from './App.vue'
import router from './router/index';

import "../src/assets/bootstrap/custom.scss";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import "../src/assets/scss/style.scss";

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';

const app = createApp(App)
const pinia = createPinia()

library.add(fas);
app.component('fa', FontAwesomeIcon);
app.use(router);
app.use(pinia)
app.mount('#app')
