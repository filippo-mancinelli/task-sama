import { LAMPORTS_PER_SOL } from './config'

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / LAMPORTS_PER_SOL
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}

/**
 * Format SOL amount for display
 */
export function formatSol(lamports: number | bigint, decimals = 4): string {
  const sol = lamportsToSol(lamports)
  return sol.toFixed(decimals) + ' SOL'
}

/**
 * Format public key for display (truncated)
 */
export function formatPubkey(pubkey: string, chars = 4): string {
  return `${pubkey.slice(0, chars)}...${pubkey.slice(-chars)}`
}

/**
 * Format timestamp to date string
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate net reward after platform fee
 */
export function calculateNetReward(grossReward: number, feePercentage: number): number {
  const fee = Math.floor((grossReward * feePercentage) / 100)
  return grossReward - fee
}

/**
 * Calculate platform fee
 */
export function calculateFee(amount: number, feePercentage: number): number {
  return Math.floor((amount * feePercentage) / 100)
}

/**
 * Shorten wallet address for display
 */
export function shortenAddress(address: string, chars = 4): string {
  return formatPubkey(address, chars)
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(signature: string, cluster: 'devnet' | 'mainnet-beta' | 'localnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`
}

/**
 * Get explorer URL for address
 */
export function getAddressExplorerUrl(address: string, cluster: 'devnet' | 'mainnet-beta' | 'localnet' = 'devnet'): string {
  const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
  return `https://explorer.solana.com/address/${address}${clusterParam}`
}
