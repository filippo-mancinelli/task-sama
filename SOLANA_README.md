# TaskSama - Solana Edition 🚀

Decentralized bounty platform on Solana. Post tasks with SOL rewards, participants submit video proofs, creators choose winners, and completed tasks become permanent NFTs.

## 🌟 Features

- ⚡ **Lightning Fast**: ~0.4s transaction finality
- 💰 **Ultra Cheap**: $0.00025 per transaction (99.996% cheaper than Ethereum)
- 🎥 **Video Proof**: Participants submit videos as proof of completion
- 🏆 **NFT Rewards**: Completed tasks minted as commemorative Metaplex NFTs
- 🔒 **Escrow System**: SOL held safely in program until winner is chosen
- 👥 **Fair System**: Video moderation before winner selection
- 📜 **Permanent Record**: All data on-chain + IPFS

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Solana Program (Rust)                     │
│  programs/tasksama/src/lib.rs                              │
│  - create_task, participate, choose_winner, mint_nft       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Frontend (Vue 3 + TypeScript)                  │
│  - Phantom/Solflare wallet integration                      │
│  - @solana/web3.js + @coral-xyz/anchor                     │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│            Backend (Node.js + PostgreSQL)                   │
│  - Video storage (S3 + IPFS)                               │
│  - Event indexing (Helius webhooks)                        │
│  - Video moderation                                         │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0

# Install Node.js dependencies
npm install
```

### Build & Test

```bash
# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 📖 Program Instructions

### 1. Initialize Platform

```rust
initialize(
    fee_percentage: u16,      // 5 = 5%
    minimum_reward: u64       // e.g., 1 * LAMPORTS_PER_SOL
)
```

### 2. Create Task

```rust
create_task(
    title: String,            // max 200 chars
    description: String,      // max 1000 chars
    reward_amount: u64        // in lamports (1 SOL = 1e9 lamports)
)
```

### 3. Participate in Task

```rust
participate()
```

### 4. Mark Video Uploaded

```rust
mark_video_uploaded(
    video_hash: String        // IPFS hash
)
```

### 5. Moderate Video (Admin Only)

```rust
moderate_video(
    approved: bool            // true = approved, false = rejected
)
```

### 6. Choose Winner

```rust
choose_winner(
    ipfs_metadata_url: String,
    ipfs_video_url: String
)
```

### 7. Mint Commemorative NFT

```rust
mint_video_nft(
    name: String,             // e.g., "TaskSama Completion #123"
    symbol: String,           // e.g., "TSK"
    uri: String               // Metaplex metadata URI
)
```

### 8. Cancel Task (Refund)

```rust
cancel_task()
```

## 🧪 Testing

```bash
# Local testing
solana-test-validator  # In terminal 1
anchor test            # In terminal 2

# Devnet testing
anchor test --provider.cluster devnet
```

## 📦 Program Accounts (PDAs)

### PlatformConfig
- **Seeds**: `[b"platform_config"]`
- **Purpose**: Global platform settings and stats

### Task
- **Seeds**: `[b"task", task_id.to_le_bytes()]`
- **Purpose**: Individual task data + escrow for rewards

### ParticipantRecord
- **Seeds**: `[b"participant", task_pubkey, participant_pubkey]`
- **Purpose**: Participant submission data + video moderation status

## 🔐 Security Features

✅ PDA validation with bump seeds
✅ Ownership checks (creator-only actions)
✅ Status validation (active/completed checks)
✅ Overflow protection (Rust's built-in)
✅ Rent-exempt accounts
✅ No upgradeable after audit (set `--final`)

## 💡 Example Usage (TypeScript)

```typescript
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'

// Connect to program
const connection = new Connection('https://api.devnet.solana.com')
const wallet = new anchor.Wallet(Keypair.generate())
const provider = new anchor.AnchorProvider(connection, wallet, {})
const program = new Program(IDL, PROGRAM_ID, provider)

// Create a task
const [platformConfigPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('platform_config')],
  program.programId
)

const platformConfig = await program.account.platformConfig.fetch(platformConfigPda)
const taskId = platformConfig.totalTasksCreated

const [taskPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('task'), taskId.toArrayLike(Buffer, 'le', 8)],
  program.programId
)

await program.methods
  .createTask(
    'Build a dApp',
    'Create a decentralized app on Solana',
    new anchor.BN(5 * anchor.web3.LAMPORTS_PER_SOL)
  )
  .accounts({
    platformConfig: platformConfigPda,
    task: taskPda,
    creator: wallet.publicKey,
    systemProgram: anchor.web3.SystemProgram.programId,
  })
  .rpc()

console.log('Task created:', taskPda.toString())
```

## 🌐 RPC Providers

**Recommended for Production:**
- [Helius](https://helius.dev) - 100M free credits/month + webhooks
- [QuickNode](https://quicknode.com) - $49/month
- [Triton](https://triton.one) - $29/month

**Free (Rate Limited):**
- Devnet: `https://api.devnet.solana.com`
- Mainnet: `https://api.mainnet-beta.solana.com`

## 📊 Cost Comparison

| Operation | Ethereum/Moonbeam | Solana | Savings |
|-----------|-------------------|--------|---------|
| Create Task | ~$5 | $0.00025 | 99.995% |
| Participate | ~$2 | $0.00025 | 99.988% |
| Choose Winner | ~$8 | $0.00025 | 99.997% |
| Mint NFT | ~$10 | $0.00025 | 99.998% |

## 🛣️ Roadmap

- [x] Solana program development (Rust + Anchor)
- [x] Comprehensive test suite
- [ ] Frontend migration (Vue 3 + Wallet Adapter)
- [ ] Backend migration (PostgreSQL + Helius)
- [ ] Devnet deployment & public testing
- [ ] Security audit (OtterSec/Neodyme)
- [ ] Mainnet deployment
- [ ] Mobile app (React Native)
- [ ] DAO governance

## 📚 Resources

- [Solana Documentation](https://docs.solana.com)
- [Anchor Book](https://book.anchor-lang.com)
- [Metaplex Docs](https://docs.metaplex.com)
- [Solana Cookbook](https://solanacookbook.com)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Links

- **Website**: https://tasksama.app (coming soon)
- **Twitter**: @TaskSama
- **Discord**: discord.gg/tasksama

---

**Built with ❤️ on Solana**
