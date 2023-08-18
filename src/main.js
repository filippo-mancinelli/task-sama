import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'; 
import App from './App.vue'
import Vue3Lottie from 'vue3-lottie'
import 'vue3-lottie/dist/style.css'
import './style.css'

const pinia = createPinia()
const app = createApp(App)

const routes = [
    { path: '/', component: App },
    { path: '/profile', component: Profile },
];

export const router = createRouter({ 
    history: createWebHashHistory(), 
    routes,
})

app.use(router)
app.use(pinia)
app.use(Vue3Lottie)

createApp(App).mount('#app')
