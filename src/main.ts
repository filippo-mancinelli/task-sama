import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createRouter, createWebHashHistory } from 'vue-router'
import SolanaWallets from 'solana-wallets-vue'
import 'solana-wallets-vue/styles.css'

// Wallet adapters — imported from their dedicated packages to avoid pulling the
// umbrella @solana/wallet-adapter-wallets index (which references a React-only adapter).
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'

import App from './App.vue'
import Home from './components/Home.vue'
import Profile from './components/Profile.vue'
import User from './components/User.vue'
import WatchVideo from './components/WatchVideo.vue'
import WatchTask from './components/WatchTask.vue'
import ChooseWinner from './components/ChooseWinner.vue'

import Vue3Lottie from 'vue3-lottie'
import './style.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

// Solana wallet configuration
const walletOptions = {
  wallets: [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ],
  autoConnect: false,
}

// Routes
const routes = [
  { path: '/', component: Home },
  { path: '/home', name: 'Home', redirect: '/' },
  { path: '/profile', component: Profile },
  { path: '/users/:username', component: User },
  { path: '/video/:tokenId', component: WatchVideo },
  { path: '/task/:tokenId', component: WatchTask },
  { path: '/chooseWinner/:tokenId', component: ChooseWinner },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Navigation guard for wallet-protected routes
router.beforeEach((to, from, next) => {
  const isWalletConnected = localStorage.getItem('solana_wallet_connected') === 'true'

  // Profile page requires wallet connection
  if (to.path === '/profile' && !isWalletConnected) {
    next({ path: '/' })
  } else {
    next()
  }
})

app.use(router)
app.use(pinia)
app.use(SolanaWallets, walletOptions)
app.use(Vue3Lottie)

app.mount('#app')
