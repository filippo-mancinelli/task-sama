import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import Vue3Lottie from 'vue3-lottie'
import 'vue3-lottie/dist/style.css'
import './style.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(Vue3Lottie)

createApp(App).mount('#app')
