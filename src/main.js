import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'; 
import { useConnectionStore } from './stores/useConnectionStore';
import App from './App.vue'
import Home from './components/Home.vue'
import Profile from './components/Profile.vue'
import WatchVideo from './components/WatchVideo.vue'
import WatchTask from './components/WatchTask.vue'
import ChooseWinner from './components/ChooseWinner.vue'
import Vue3Lottie from 'vue3-lottie'
import 'vue3-lottie/dist/style.css'
import './style.css'

const pinia = createPinia()
const app = createApp(App)

const routes = [
    { path: '/', component: Home },
    { path: '/home', name: 'Home', redirect: '/' },
    { path: '/profile', component: Profile },
    { path: '/video/:tokenId', component: WatchVideo },
    { path: '/task/:tokenId', component: WatchTask },
    { path: '/chooseWinner/:tokenId', component: ChooseWinner },
];

export const router = createRouter({ 
    history: createWebHashHistory(), 
    routes,
})

router.beforeEach((to, from, next) => {
    // non-connected users cannot access the profile page
    if ((from.path === '/profile' || from.path === '#/profile') && !useConnectionStore().isConnected && to.path !== '/') {
      next({ name: '/home' }); 
    } else {
      next();
    }
  });
  

app.use(router)
app.use(pinia)
app.use(Vue3Lottie)

app.mount('#app')
