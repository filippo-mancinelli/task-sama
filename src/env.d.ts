/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: 'mainnet-beta' | 'devnet' | 'localnet'
  readonly VITE_HELIUS_RPC: string
  readonly VITE_HELIUS_DEVNET_RPC: string
  readonly VITE_PROGRAM_ID: string
  readonly VITE_BACKEND_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
