import { clusterApiUrl, PublicKey } from '@solana/web3.js'

export const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'

export const RPC_ENDPOINT =
  SOLANA_NETWORK === 'mainnet-beta'
    ? import.meta.env.VITE_HELIUS_RPC || clusterApiUrl('mainnet-beta')
    : SOLANA_NETWORK === 'devnet'
    ? import.meta.env.VITE_HELIUS_DEVNET_RPC || clusterApiUrl('devnet')
    : 'http://localhost:8899' // localnet

export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || 'TaskSama11111111111111111111111111111111111'
)

export const COMMITMENT = 'confirmed' as const

// Platform config PDA
export const PLATFORM_CONFIG_SEED = 'platform_config'

// Task PDA seeds
export const TASK_SEED = 'task'

// Participant PDA seeds
export const PARTICIPANT_SEED = 'participant'

// Fee percentage (matches program)
export const FEE_PERCENTAGE = 5 // 5%

// Minimum reward (1 SOL in lamports)
export const MINIMUM_REWARD = 1_000_000_000 // 1 SOL

// Lamports per SOL
export const LAMPORTS_PER_SOL = 1_000_000_000

// Wallet options
export const WALLET_OPTIONS = {
  autoConnect: false,
}
