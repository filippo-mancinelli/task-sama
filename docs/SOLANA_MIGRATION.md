# TaskSama - Solana Migration Plan

## 🚀 Executive Summary

TaskSama è stato completamente **re-architected per Solana**, abbandonando Ethereum/EVM (Moonbeam/GLMR) in favore dell'ecosistema Solana più veloce, economico e scalabile.

### Perché Solana?

- ⚡ **Performance**: 65,000 TPS vs ~15 TPS di Ethereum
- 💰 **Costi**: $0.00025 per transazione vs ~$5-50 su Ethereum
- 🎨 **NFT Ecosystem**: Metaplex è lo standard de-facto per NFT
- 🛠️ **Developer Experience**: Anchor framework semplifica lo sviluppo
- 🌐 **Community**: Ecosistema in forte crescita

---

## 1. SMART CONTRACT → SOLANA PROGRAM

### 1.1 Architettura Solana

**File**: `programs/tasksama/src/lib.rs`

**Language**: Rust (invece di Solidity)

**Framework**: Anchor 0.29.0

**Token Standard**: SPL Token + Metaplex per NFT

### 1.2 Differenze Chiave EVM → Solana

| Aspetto | EVM (Ethereum/Moonbeam) | Solana |
|---------|-------------------------|--------|
| **Language** | Solidity | Rust |
| **Storage** | Contract storage (mappings, structs) | Account-based model (PDAs) |
| **Calls** | Contract calls | Cross-Program Invocations (CPI) |
| **Token** | ERC20/ERC721 | SPL Token / Metaplex |
| **Currency** | GLMR (wrapped ETH) | SOL (native) |
| **Gas** | Gas fees | Rent + transaction fees |
| **Speed** | ~15 TPS | ~65,000 TPS |
| **Finality** | ~15 sec | ~0.4 sec |

### 1.3 Program Structure

```rust
// Programs (Smart Contracts)
programs/
└── tasksama/
    ├── Cargo.toml          // Rust dependencies
    ├── Xargo.toml          // Build config
    └── src/
        └── lib.rs          // Main program code

// Tests
tests/
└── tasksama.ts            // Anchor/TypeScript tests

// Config
Anchor.toml                 // Anchor workspace config
```

### 1.4 Core Instructions (Solidity Functions → Rust Instructions)

#### Old EVM Flow:
```solidity
Tasks.createTask(title, desc) payable → mints ERC721
Tasks.participate(taskId)
Tasks.chooseWinner(taskId, winner, ipfs) → transfers ETH + calls TaskSama.mintVideoNFT()
TaskSama.mintVideoNFT(...) → mints ERC721 NFT
```

#### New Solana Flow:
```rust
tasksama::initialize(fee%, min_reward) → init platform config
tasksama::create_task(title, desc, amount) → create Task PDA + escrow SOL
tasksama::participate() → create ParticipantRecord PDA
tasksama::mark_video_uploaded(hash) → update participant record
tasksama::moderate_video(approved) → approve/reject video
tasksama::choose_winner(ipfs) → transfer SOL + update task status
tasksama::mint_video_nft(name, uri) → mint Metaplex NFT
tasksama::cancel_task() → refund SOL to creator
```

---

## 2. ACCOUNT STRUCTURES (PDAs)

Solana usa **Program Derived Addresses (PDAs)** invece di storage contracts.

### 2.1 PlatformConfig Account

```rust
#[account]
pub struct PlatformConfig {
    pub authority: Pubkey,           // Admin wallet
    pub fee_recipient: Pubkey,       // Where fees go
    pub fee_percentage: u16,         // 5 = 5%
    pub minimum_reward: u64,         // Min reward in lamports
    pub total_tasks_created: u64,    // Global counter
    pub total_tasks_completed: u64,  // Global counter
    pub bump: u8,                    // PDA bump seed
}

// PDA Seeds: [b"platform_config"]
```

### 2.2 Task Account

```rust
#[account]
pub struct Task {
    pub task_id: u64,                     // Unique ID
    pub creator: Pubkey,                  // Creator wallet
    pub title: String,                    // Max 200 chars
    pub description: String,              // Max 1000 chars
    pub reward_amount: u64,               // Net reward (lamports)
    pub fee_amount: u64,                  // Platform fee (lamports)
    pub status: TaskStatus,               // Active/Completed/Cancelled
    pub created_at: i64,                  // Unix timestamp
    pub completed_at: Option<i64>,
    pub participant_count: u32,
    pub winner: Option<Pubkey>,
    pub ipfs_metadata_url: Option<String>,
    pub ipfs_video_url: Option<String>,
    pub bump: u8,
}

// PDA Seeds: [b"task", task_id.to_le_bytes()]
```

### 2.3 ParticipantRecord Account

```rust
#[account]
pub struct ParticipantRecord {
    pub task_id: u64,
    pub participant: Pubkey,
    pub participated_at: i64,
    pub video_uploaded: bool,
    pub video_hash: Option<String>,        // IPFS hash
    pub video_moderated: ModerationStatus, // Pending/Approved/Rejected
    pub bump: u8,
}

// PDA Seeds: [b"participant", task_pubkey, participant_pubkey]
```

---

## 3. EVENTO SYSTEM

Solana emette eventi che possono essere indexed off-chain.

```rust
#[event]
pub struct TaskCreatedEvent {
    pub task_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub reward_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct TaskCompletedEvent {
    pub task_id: u64,
    pub winner: Pubkey,
    pub reward_amount: u64,
    pub ipfs_metadata_url: String,
    pub ipfs_video_url: String,
    pub timestamp: i64,
}

// ... altri eventi
```

**Indexing**: Usare **Helius** o **Triton** per indexare eventi in tempo reale.

---

## 4. NFT MINTING (Metaplex)

### 4.1 Metaplex Token Metadata Standard

Invece di implementare ERC721 da zero, usiamo **Metaplex Token Metadata Program**:

```rust
use mpl_token_metadata::instructions::{
    CreateV1CpiBuilder, CreateV1InstructionArgs,
};

// Mint NFT with Metaplex
CreateV1CpiBuilder::new(&token_metadata_program)
    .metadata(&metadata)
    .master_edition(Some(&master_edition))
    .mint(&mint, true)
    .authority(&creator)
    .name("TaskSama Completion #123")
    .symbol("TSK")
    .uri("ipfs://QmVideoMetadata...")
    .seller_fee_basis_points(0)
    .token_standard(TokenStandard::NonFungible)
    .creators(vec![Creator {
        address: creator.key(),
        verified: true,
        share: 100,
    }])
    .is_mutable(false)
    .invoke()?;
```

### 4.2 NFT Metadata Standard

```json
{
  "name": "TaskSama Completion #123",
  "symbol": "TSK",
  "description": "Proof of completion for task: Build a dApp",
  "image": "ipfs://QmVideoHash...",
  "animation_url": "ipfs://QmVideoHash...",
  "external_url": "https://tasksama.app/video/123",
  "attributes": [
    { "trait_type": "Task ID", "value": "123" },
    { "trait_type": "Creator", "value": "8x7Y..." },
    { "trait_type": "Winner", "value": "9z8X..." },
    { "trait_type": "Reward", "value": "5 SOL" },
    { "trait_type": "Completion Date", "value": "2026-01-14" }
  ],
  "properties": {
    "category": "video",
    "files": [
      {
        "uri": "ipfs://QmVideoHash...",
        "type": "video/mp4"
      }
    ]
  }
}
```

---

## 5. FRONTEND MIGRATION

### 5.1 Tech Stack Changes

| Component | Old (EVM) | New (Solana) |
|-----------|-----------|--------------|
| **Wallet** | MetaMask | Phantom / Solflare / Backpack |
| **Library** | Ethers.js v5 | @solana/web3.js + @coral-xyz/anchor |
| **Framework** | Wagmi (EVM) | @solana/wallet-adapter-react |
| **RPC** | Moonbeam RPC | Helius / Quicknode / Triton |

### 5.2 New Dependencies

```json
{
  "dependencies": {
    "@solana/web3.js": "^1.87.0",
    "@coral-xyz/anchor": "^0.29.0",
    "@solana/wallet-adapter-react": "^0.15.0",
    "@solana/wallet-adapter-react-ui": "^0.9.0",
    "@solana/wallet-adapter-wallets": "^0.19.0",
    "@metaplex-foundation/js": "^0.20.0",
    "@metaplex-foundation/mpl-token-metadata": "^3.2.0"
  }
}
```

### 5.3 Wallet Connection Example

```typescript
// Old: Ethers + MetaMask
import { ethers } from 'ethers'
const provider = new ethers.providers.Web3Provider(window.ethereum)
await provider.send("eth_requestAccounts", [])
const signer = provider.getSigner()

// New: Solana Wallet Adapter
import { useWallet } from '@solana/wallet-adapter-react'
const { publicKey, signTransaction, connect } = useWallet()
await connect()
```

### 5.4 Program Interaction Example

```typescript
// Old: Ethers Contract Call
const contract = new ethers.Contract(address, abi, signer)
const tx = await contract.createTask("Build dApp", "Description", {
  value: ethers.utils.parseEther("10")
})
await tx.wait()

// New: Anchor Program Call
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'

const program = new Program(idl, programId, provider)
const [taskPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("task"), taskId.toArrayLike(Buffer, "le", 8)],
  program.programId
)

await program.methods
  .createTask("Build dApp", "Description", new anchor.BN(5 * LAMPORTS_PER_SOL))
  .accounts({
    platformConfig: platformConfigPda,
    task: taskPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

## 6. BACKEND MIGRATION

### 6.1 Blockchain Interaction Changes

```typescript
// Old: Ethers Provider
import { ethers } from 'ethers'
const provider = new ethers.providers.JsonRpcProvider(MOONBEAM_RPC)
const contract = new ethers.Contract(address, abi, provider)
const tasks = await contract._getTasks()

// New: Solana Connection
import { Connection, PublicKey } from '@solana/web3.js'
import { Program, AnchorProvider } from '@coral-xyz/anchor'

const connection = new Connection(HELIUS_RPC, 'confirmed')
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
const program = new Program(idl, programId, provider)

// Fetch all tasks
const tasks = await program.account.task.all()
```

### 6.2 Event Listening (Indexer)

```typescript
// Old: Ethers Event Listener
contract.on("TaskCreated", async (taskId, owner, title, reward) => {
  await db.task.create({ taskId, owner, title, reward })
})

// New: Solana Event Listener (via Helius Webhooks or WebSocket)
import { Connection } from '@solana/web3.js'

const connection = new Connection(HELIUS_RPC)

// Option 1: Poll for account changes
const taskAccounts = await connection.getProgramAccounts(programId, {
  filters: [{ dataSize: TASK_SIZE }]
})

// Option 2: WebSocket subscription
connection.onProgramAccountChange(
  programId,
  async (accountInfo) => {
    const task = program.coder.accounts.decode('Task', accountInfo.accountInfo.data)
    await db.task.upsert(task)
  }
)

// Option 3: Helius Webhooks (recommended for production)
// Configure webhook at https://dev.helius.xyz/webhooks
// Receives POST requests for every transaction involving your program
```

### 6.3 Transaction Signing (Backend Wallet)

```typescript
// Old: Ethers Wallet
import { ethers } from 'ethers'
const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

// New: Solana Keypair
import { Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

const keypair = Keypair.fromSecretKey(
  bs58.decode(process.env.SOLANA_PRIVATE_KEY)
)
```

---

## 7. DATABASE SCHEMA UPDATES

### 7.1 Address Format Changes

```typescript
// Old: Ethereum address (42 chars with 0x prefix)
wallet_address VARCHAR(42) // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2"

// New: Solana pubkey (44 chars base58)
wallet_address VARCHAR(44) // "8x7YZzv6B8...32 char base58..."
```

### 7.2 Updated Schema

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Changed from 42 to 44
  username VARCHAR(50),
  bio TEXT,
  avatar_seed INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id BIGINT PRIMARY KEY, -- task_id from Solana program
  pda VARCHAR(44) NOT NULL UNIQUE, -- Task PDA address
  creator_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  reward_amount BIGINT NOT NULL, -- lamports (1 SOL = 1e9 lamports)
  fee_amount BIGINT NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active/completed/cancelled
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  winner_address VARCHAR(44) REFERENCES users(wallet_address),
  tx_signature VARCHAR(88) NOT NULL, -- Solana transaction signature
  ipfs_metadata_url TEXT,
  ipfs_video_url TEXT
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  pda VARCHAR(44) NOT NULL UNIQUE, -- ParticipantRecord PDA
  participant_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
  participated_at TIMESTAMP DEFAULT NOW(),
  video_uploaded BOOLEAN DEFAULT FALSE,
  video_hash TEXT,
  moderation_status VARCHAR(20) DEFAULT 'pending', -- pending/approved/rejected
  UNIQUE(task_id, participant_address)
);

CREATE TABLE video_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mint_address VARCHAR(44) UNIQUE NOT NULL, -- NFT mint address
  task_id BIGINT NOT NULL REFERENCES tasks(id),
  creator_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
  winner_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
  metadata_uri TEXT NOT NULL,
  minted_at TIMESTAMP NOT NULL,
  tx_signature VARCHAR(88) NOT NULL
);
```

---

## 8. DEPLOYMENT STRATEGY

### 8.1 Build & Deploy Program

```bash
# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Build program
anchor build

# Get program ID
solana address -k target/deploy/tasksama-keypair.json

# Update Anchor.toml and lib.rs with program ID

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet-beta
anchor deploy --provider.cluster mainnet-beta
```

### 8.2 Initialize Platform

```bash
# Run initialization script
anchor run initialize
```

```typescript
// scripts/initialize.ts
import * as anchor from '@coral-xyz/anchor'

const feePercentage = 5 // 5%
const minimumReward = 1 * LAMPORTS_PER_SOL // 1 SOL minimum

await program.methods
  .initialize(feePercentage, new anchor.BN(minimumReward))
  .accounts({
    platformConfig: platformConfigPda,
    authority: provider.wallet.publicKey,
    feeRecipient: FEE_RECIPIENT_PUBKEY,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### 8.3 Verify Deployment

```bash
# Verify program is deployed
solana program show <PROGRAM_ID>

# Get platform config account
solana account <PLATFORM_CONFIG_PDA>
```

---

## 9. TESTING

### 9.1 Local Testing

```bash
# Start local validator (Solana localnet)
solana-test-validator

# Run tests
anchor test
```

### 9.2 Devnet Testing

```bash
# Set cluster to devnet
solana config set --url devnet

# Airdrop SOL for testing
solana airdrop 5

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests against devnet
anchor test --provider.cluster devnet
```

---

## 10. RPC PROVIDERS & INDEXERS

### 10.1 RPC Providers

**Free Tier:**
- Solana Public RPC: `https://api.mainnet-beta.solana.com` (rate limited)
- Solana Devnet: `https://api.devnet.solana.com`

**Paid/Better:**
- **Helius** (Recommended): 100M free credits/month, enhanced API
  - `https://mainnet.helius-rpc.com/?api-key=<KEY>`
- **QuickNode**: $49/month for 20M credits
- **Triton**: $29/month for developers
- **Alchemy**: Recently added Solana support

### 10.2 Indexers & APIs

**Helius Enhanced APIs:**
- `getAssetsByOwner` - Get all NFTs owned by wallet
- `searchAssets` - Search NFTs by metadata
- `getTransaction` - Enhanced transaction details
- Webhooks for real-time events

**The Graph (Solana Subgraphs):**
- Custom GraphQL API for your program
- Real-time indexing
- Complex queries

**Metaplex DAS API:**
- Digital Asset Standard API
- Query NFT metadata efficiently

---

## 11. COST COMPARISON

### 11.1 Transaction Costs

| Operation | Moonbeam (GLMR) | Solana (SOL) | Savings |
|-----------|-----------------|--------------|---------|
| Create Task | ~$5 | $0.00025 | 99.995% |
| Participate | ~$2 | $0.00025 | 99.988% |
| Choose Winner | ~$8 | $0.00025 | 99.997% |
| Mint NFT | ~$10 | $0.00025 | 99.998% |
| **Total** | **~$25** | **~$0.001** | **99.996%** |

### 11.2 Rent (Account Storage)

Solana accounts must maintain rent-exempt balance:
- PlatformConfig: ~0.002 SOL (~$0.20)
- Task Account: ~0.01 SOL (~$1)
- ParticipantRecord: ~0.005 SOL (~$0.50)

**Total one-time cost per task: ~$1.50**

Still 94% cheaper than single Ethereum transaction!

---

## 12. SECURITY CONSIDERATIONS

### 12.1 Program Security

✅ **Implemented:**
- PDA validation (seeds + bump checks)
- Ownership checks (only creator can choose winner)
- Status checks (task must be active)
- Arithmetic overflow protection (Rust's built-in)

❌ **TODO:**
- Formal audit by OtterSec or Neodyme
- Fuzz testing with Trdelnik
- Time-lock for cancellations
- Emergency pause mechanism

### 12.2 Rent Exemption

All accounts are **rent-exempt** (store enough SOL to avoid being deleted).

### 12.3 Upgrade Authority

```bash
# Remove upgrade authority after audit (makes program immutable)
solana program set-upgrade-authority <PROGRAM_ID> --final
```

---

## 13. MONITORING & ANALYTICS

### 13.1 On-Chain Metrics

- Total tasks created: `platform_config.total_tasks_created`
- Total tasks completed: `platform_config.total_tasks_completed`
- Total SOL locked: Sum of all active task balances
- Total fees collected: Tracked via events

### 13.2 Helius Webhooks

```typescript
// Webhook payload for TaskCreatedEvent
{
  "type": "TRANSACTION",
  "signature": "5j7s8...",
  "timestamp": 1705243200,
  "events": {
    "tasksama": [
      {
        "name": "TaskCreatedEvent",
        "data": {
          "taskId": 123,
          "creator": "8x7Y...",
          "title": "Build a dApp",
          "rewardAmount": 5000000000,
          "timestamp": 1705243200
        }
      }
    ]
  }
}
```

### 13.3 Analytics Dashboard

Use **Dune Analytics** (supports Solana) to create dashboards:
- Tasks created over time
- Average reward amount
- Completion rate
- Top creators/winners

---

## 14. MIGRATION TIMELINE

### Phase 1: Program Development (DONE ✅)
- ✅ Write Rust program with Anchor
- ✅ Implement all instructions
- ✅ Write comprehensive tests
- ✅ Local testing on solana-test-validator

### Phase 2: Frontend Migration (Week 1-2)
- [ ] Install Solana wallet adapters
- [ ] Replace Ethers.js with @solana/web3.js
- [ ] Update all contract interactions
- [ ] Add Phantom/Solflare wallet support
- [ ] Update UI for SOL instead of GLMR
- [ ] Test on devnet

### Phase 3: Backend Migration (Week 2-3)
- [ ] Update database schema (42→44 char addresses)
- [ ] Migrate MongoDB to PostgreSQL
- [ ] Replace Ethers with Solana web3.js
- [ ] Implement Helius webhook listener
- [ ] Update video upload flow
- [ ] Test event indexing

### Phase 4: Devnet Deployment (Week 3)
- [ ] Deploy program to devnet
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Full integration testing
- [ ] Bug fixes

### Phase 5: Security Audit (Week 4)
- [ ] Contract audit by OtterSec/Neodyme
- [ ] Fix vulnerabilities
- [ ] Penetration testing
- [ ] Final review

### Phase 6: Mainnet Launch (Week 5)
- [ ] Deploy program to mainnet-beta
- [ ] Initialize platform config
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Monitor first transactions
- [ ] Marketing & announcement

---

## 15. RESOURCES

### Official Documentation
- Solana Docs: https://docs.solana.com
- Anchor Book: https://book.anchor-lang.com
- Metaplex Docs: https://docs.metaplex.com

### Tools
- Solana Explorer: https://explorer.solana.com
- Solscan: https://solscan.io
- Helius: https://helius.dev
- Anchor: https://www.anchor-lang.com

### Learning Resources
- Solana Cookbook: https://solanacookbook.com
- Buildspace Solana: https://buildspace.so/solana
- Solana Stack Exchange: https://solana.stackexchange.com

---

## 16. CONCLUSIONI

### ✅ Vantaggi della Migrazione

1. **99.996% riduzione costi transazioni** ($25 → $0.001)
2. **400x più veloce** (15 TPS → 65,000 TPS)
3. **Finality istantanea** (15s → 0.4s)
4. **Migliore UX**: Transazioni quasi gratuite = più sperimentazione
5. **NFT Ecosystem**: Metaplex è lo standard, integrazione con Magic Eden, Tensor, ecc.
6. **Scalabilità**: Può gestire milioni di utenti
7. **Community**: Ecosistema in rapida crescita

### 🎯 Prossimi Step

1. ✅ **Completare Frontend Migration** (Wallet Adapter + Anchor)
2. ✅ **Completare Backend Migration** (PostgreSQL + Helius)
3. ✅ **Deploy su Devnet** per testing pubblico
4. ✅ **Security Audit**
5. ✅ **Mainnet Launch**

---

**TaskSama su Solana: Il futuro dei bounty decentralizzati! 🚀**

**Document Version**: 2.0 - Solana Edition
**Date**: 2026-01-14
**Chain**: Solana (Mainnet-Beta)
