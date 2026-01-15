import { computed, ref } from 'vue'
import { useWallet } from 'solana-wallets-vue'
import { Connection, PublicKey } from '@solana/web3.js'
import { RPC_ENDPOINT, COMMITMENT } from '@/lib/solana/config'

export function useSolanaWallet() {
  const wallet = useWallet()
  const connection = ref(new Connection(RPC_ENDPOINT, COMMITMENT))
  const balance = ref<number | null>(null)
  const isLoading = ref(false)

  // Computed properties
  const isConnected = computed(() => wallet.connected.value)
  const publicKey = computed(() => wallet.publicKey.value)
  const walletAddress = computed(() => publicKey.value?.toBase58() || '')

  // Connect wallet
  const connect = async () => {
    try {
      isLoading.value = true
      await wallet.connect()
      await fetchBalance()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Disconnect wallet
  const disconnect = async () => {
    try {
      await wallet.disconnect()
      balance.value = null
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      throw error
    }
  }

  // Fetch SOL balance
  const fetchBalance = async () => {
    if (!publicKey.value) {
      balance.value = null
      return
    }

    try {
      const balanceLamports = await connection.value.getBalance(publicKey.value)
      balance.value = balanceLamports
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      balance.value = null
    }
  }

  // Request airdrop (devnet/localnet only)
  const requestAirdrop = async (amount: number = 1) => {
    if (!publicKey.value) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await connection.value.requestAirdrop(
        publicKey.value,
        amount * 1_000_000_000 // SOL to lamports
      )

      await connection.value.confirmTransaction(signature)
      await fetchBalance()
      return signature
    } catch (error) {
      console.error('Airdrop failed:', error)
      throw error
    }
  }

  // Sign message
  const signMessage = async (message: string): Promise<Uint8Array> => {
    if (!wallet.signMessage.value) {
      throw new Error('Wallet does not support message signing')
    }

    const encodedMessage = new TextEncoder().encode(message)
    return await wallet.signMessage.value(encodedMessage)
  }

  return {
    // State
    wallet,
    connection,
    balance,
    isLoading,

    // Computed
    isConnected,
    publicKey,
    walletAddress,

    // Methods
    connect,
    disconnect,
    fetchBalance,
    requestAirdrop,
    signMessage,
  }
}
