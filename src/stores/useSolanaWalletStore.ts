import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { RPC_ENDPOINT, COMMITMENT, SOLANA_NETWORK } from '@/lib/solana/config'
import { formatPubkey, lamportsToSol } from '@/lib/solana/utils'
import bs58 from 'bs58'

export const useSolanaWalletStore = defineStore('solanaWallet', () => {
  // State
  const connection = ref(new Connection(RPC_ENDPOINT, COMMITMENT))
  const walletPublicKey = ref<PublicKey | null>(null)
  const balance = ref<number>(0)
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const walletName = ref<string>('')

  // Computed
  const walletAddress = computed(() => walletPublicKey.value?.toBase58() || '')
  const shortAddress = computed(() =>
    walletAddress.value ? formatPubkey(walletAddress.value, 4) : ''
  )
  const balanceInSol = computed(() => lamportsToSol(balance.value))
  const network = computed(() => SOLANA_NETWORK)

  // Methods
  async function connectWallet(wallet: any) {
    try {
      isConnecting.value = true

      await wallet.connect()

      if (wallet.publicKey) {
        walletPublicKey.value = wallet.publicKey
        walletName.value = wallet.adapter?.name || 'Unknown'
        isConnected.value = true

        await fetchBalance()

        // Save connection preference
        localStorage.setItem('solana_wallet_connected', 'true')
        localStorage.setItem('solana_wallet_name', walletName.value)
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      isConnecting.value = false
    }
  }

  async function disconnectWallet() {
    walletPublicKey.value = null
    balance.value = 0
    isConnected.value = false
    walletName.value = ''

    localStorage.removeItem('solana_wallet_connected')
    localStorage.removeItem('solana_wallet_name')
  }

  async function fetchBalance() {
    if (!walletPublicKey.value) {
      balance.value = 0
      return
    }

    try {
      const balanceLamports = await connection.value.getBalance(walletPublicKey.value)
      balance.value = balanceLamports
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      balance.value = 0
    }
  }

  async function requestAirdrop(amountSol: number = 1) {
    if (!walletPublicKey.value) {
      throw new Error('Wallet not connected')
    }

    if (SOLANA_NETWORK === 'mainnet-beta') {
      throw new Error('Airdrop not available on mainnet')
    }

    try {
      const signature = await connection.value.requestAirdrop(
        walletPublicKey.value,
        amountSol * LAMPORTS_PER_SOL
      )

      // Wait for confirmation
      await connection.value.confirmTransaction(signature, COMMITMENT)

      // Refresh balance
      await fetchBalance()

      return signature
    } catch (error) {
      console.error('Airdrop failed:', error)
      throw error
    }
  }

  async function signMessage(message: string, signMessageFn: any): Promise<string> {
    if (!walletPublicKey.value || !signMessageFn) {
      throw new Error('Wallet not connected or does not support message signing')
    }

    const encodedMessage = new TextEncoder().encode(message)
    const signature = await signMessageFn(encodedMessage)

    return bs58.encode(signature)
  }

  // Get transaction signature URL for explorer
  function getExplorerUrl(signature: string): string {
    const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`
    return `https://explorer.solana.com/tx/${signature}${cluster}`
  }

  // Get address URL for explorer
  function getAddressExplorerUrl(address?: string): string {
    const addr = address || walletAddress.value
    const cluster = SOLANA_NETWORK === 'mainnet-beta' ? '' : `?cluster=${SOLANA_NETWORK}`
    return `https://explorer.solana.com/address/${addr}${cluster}`
  }

  // Watch for wallet changes and update balance
  watch(walletPublicKey, (newKey) => {
    if (newKey) {
      fetchBalance()

      // Set up balance refresh interval (every 30 seconds)
      const interval = setInterval(() => {
        if (walletPublicKey.value) {
          fetchBalance()
        } else {
          clearInterval(interval)
        }
      }, 30000)
    }
  })

  return {
    // State
    connection,
    walletPublicKey,
    balance,
    isConnected,
    isConnecting,
    walletName,

    // Computed
    walletAddress,
    shortAddress,
    balanceInSol,
    network,

    // Methods
    connectWallet,
    disconnectWallet,
    fetchBalance,
    requestAirdrop,
    signMessage,
    getExplorerUrl,
    getAddressExplorerUrl,
  }
})
