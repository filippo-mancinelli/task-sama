<script setup lang="ts">
import { onMounted } from 'vue'
import { useWallet } from 'solana-wallets-vue'
import { useSolanaWalletStore } from './stores/useSolanaWalletStore'
import { useBackgroundStore } from './stores/useBackgroundStore'
import SolanaNavbar from './components/SolanaNavbar.vue'
import Popup from './components/widgets/Popup.vue'

const wallet = useWallet()
const walletStore = useSolanaWalletStore()
const backgroundStore = useBackgroundStore()

onMounted(async () => {
  // Auto-reconnect if wallet was previously connected
  if (wallet.connected.value && wallet.wallet.value) {
    await walletStore.connectWallet(wallet.wallet.value)
  }
})
</script>

<template>
  <div id="app" class="z-10 min-h-screen" :class="backgroundStore.backgroundClass">
    <SolanaNavbar />
    <Popup />

    <router-view></router-view>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
