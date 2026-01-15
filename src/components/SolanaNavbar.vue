<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWallet } from 'solana-wallets-vue'
import { useSolanaWalletStore } from '@/stores/useSolanaWalletStore'
import { formatSol } from '@/lib/solana/utils'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import {
  WalletIcon,
  ArrowRightOnRectangleIcon,
  ArrowPathIcon,
  LinkIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const wallet = useWallet()
const walletStore = useSolanaWalletStore()

const showWalletModal = ref(false)
const isRefreshing = ref(false)

const isConnected = computed(() => walletStore.isConnected)
const shortAddress = computed(() => walletStore.shortAddress)
const balanceSol = computed(() => walletStore.balanceInSol)
const network = computed(() => walletStore.network)

async function connect() {
  try {
    if (!wallet.wallet.value) {
      showWalletModal.value = true
      return
    }

    await walletStore.connectWallet(wallet.wallet.value)
  } catch (error: any) {
    console.error('Connection failed:', error)
    alert('Failed to connect wallet: ' + error.message)
  }
}

async function disconnect() {
  try {
    await wallet.disconnect()
    await walletStore.disconnectWallet()
  } catch (error) {
    console.error('Disconnect failed:', error)
  }
}

async function refreshBalance() {
  isRefreshing.value = true
  try {
    await walletStore.fetchBalance()
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
    }, 500)
  }
}

async function requestAirdrop() {
  if (network.value === 'mainnet-beta') {
    alert('Airdrop not available on mainnet')
    return
  }

  try {
    const signature = await walletStore.requestAirdrop(1)
    alert(`Airdropped 1 SOL! Signature: ${signature}`)
  } catch (error: any) {
    alert('Airdrop failed: ' + error.message)
  }
}

function viewInExplorer() {
  const url = walletStore.getAddressExplorerUrl()
  window.open(url, '_blank')
}

function goToProfile() {
  router.push('/profile')
}

onMounted(async () => {
  // Auto-reconnect if previously connected
  const wasConnected = localStorage.getItem('solana_wallet_connected') === 'true'
  if (wasConnected && wallet.wallet.value) {
    try {
      await connect()
    } catch (error) {
      console.error('Auto-reconnect failed:', error)
    }
  }
})
</script>

<template>
  <nav class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <router-link to="/" class="btn btn-ghost text-xl">
        <span class="font-bold text-primary">TaskSama</span>
        <span class="text-xs ml-2 badge badge-secondary">Solana</span>
      </router-link>
    </div>

    <div class="navbar-center hidden lg:flex">
      <ul class="menu menu-horizontal px-1">
        <li><router-link to="/">Tasks</router-link></li>
        <li><router-link to="/profile">Profile</router-link></li>
      </ul>

      <!-- Network indicator -->
      <div class="ml-4">
        <div class="badge" :class="{
          'badge-success': network === 'mainnet-beta',
          'badge-warning': network === 'devnet',
          'badge-info': network === 'localnet'
        }">
          {{ network }}
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <!-- Not connected state -->
      <template v-if="!isConnected">
        <button @click="showWalletModal = true" class="btn btn-primary">
          <WalletIcon class="w-5 h-5 mr-2" />
          Connect Wallet
        </button>
      </template>

      <!-- Connected state -->
      <template v-else>
        <div class="flex items-center gap-2">
          <!-- Balance display -->
          <div class="hidden md:flex items-center gap-2 bg-base-200 px-4 py-2 rounded-lg">
            <span class="text-sm font-semibold">{{ formatSol(walletStore.balance, 2) }}</span>
            <button
              @click="refreshBalance"
              :disabled="isRefreshing"
              class="btn btn-ghost btn-xs"
              :class="{ 'loading': isRefreshing }"
            >
              <ArrowPathIcon class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
            </button>
          </div>

          <!-- Wallet menu -->
          <Menu as="div" class="relative">
            <MenuButton class="btn btn-outline">
              <WalletIcon class="w-5 h-5 mr-2" />
              {{ shortAddress }}
            </MenuButton>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-base-100 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div class="px-4 py-3">
                  <p class="text-sm font-semibold">My Wallet</p>
                  <p class="text-xs text-gray-500 truncate">{{ walletStore.walletAddress }}</p>
                  <p class="text-sm mt-2">{{ formatSol(walletStore.balance, 4) }}</p>
                </div>

                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="goToProfile"
                      :class="[active ? 'bg-base-200' : '', 'group flex w-full items-center px-4 py-2 text-sm']"
                    >
                      <WalletIcon class="mr-3 h-5 w-5" />
                      My Profile
                    </button>
                  </MenuItem>

                  <MenuItem v-slot="{ active }">
                    <button
                      @click="viewInExplorer"
                      :class="[active ? 'bg-base-200' : '', 'group flex w-full items-center px-4 py-2 text-sm']"
                    >
                      <LinkIcon class="mr-3 h-5 w-5" />
                      View in Explorer
                    </button>
                  </MenuItem>

                  <MenuItem v-if="network !== 'mainnet-beta'" v-slot="{ active }">
                    <button
                      @click="requestAirdrop"
                      :class="[active ? 'bg-base-200' : '', 'group flex w-full items-center px-4 py-2 text-sm']"
                    >
                      <ArrowPathIcon class="mr-3 h-5 w-5" />
                      Request Airdrop (1 SOL)
                    </button>
                  </MenuItem>
                </div>

                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="disconnect"
                      :class="[active ? 'bg-base-200' : '', 'group flex w-full items-center px-4 py-2 text-sm text-error']"
                    >
                      <ArrowRightOnRectangleIcon class="mr-3 h-5 w-5" />
                      Disconnect
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </template>
    </div>

    <!-- Wallet selection modal -->
    <dialog :open="showWalletModal" class="modal" @click.self="showWalletModal = false">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Connect Wallet</h3>

        <div class="space-y-3">
          <button
            v-for="w in wallet.wallets.value"
            :key="w.adapter.name"
            @click="wallet.select(w.adapter.name); connect(); showWalletModal = false"
            class="btn btn-outline w-full justify-start"
          >
            <img v-if="w.adapter.icon" :src="w.adapter.icon" :alt="w.adapter.name" class="w-6 h-6 mr-3" />
            <span>{{ w.adapter.name }}</span>
          </button>
        </div>

        <div class="modal-action">
          <button @click="showWalletModal = false" class="btn">Cancel</button>
        </div>
      </div>
    </dialog>
  </nav>
</template>

<style scoped>
.navbar {
  padding: 0.5rem 1rem;
}
</style>
