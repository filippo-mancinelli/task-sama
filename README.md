# TaskSama

A decentralized bounty platform built on Solana. Creators post tasks backed by an on-chain SOL reward; participants submit a video as proof of completion; the creator picks a winner, the escrow pays out automatically, and the completed task is minted as a commemorative NFT with its proof video pinned to IPFS.

The interesting part of this project isn't the idea — it's the boundary between what lives on-chain and what doesn't. Money, ownership, and state transitions are enforced by a Solana program. Heavy media, moderation, and read-optimized queries live off-chain and stay eventually-consistent with the chain through an event pipeline.

> Originally built on Ethereum/Moonbeam (Solidity + Truffle). It was deliberately re-architected for Solana to cut transaction cost by ~4 orders of magnitude and to move from a NoSQL store to a relational model. This README describes the current Solana architecture.

## Architecture

Three tiers, each owning the data it is actually good at storing.

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend — Vue 3 + TypeScript (Vite, Pinia, Tailwind)        │
│  Wallet Adapter (Phantom/Solflare) · Anchor client · IPFS     │
└───────────────┬──────────────────────────────┬───────────────┘
                │ signs & sends tx              │ REST (media, reads)
                ▼                               ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│  Solana Program (Rust/Anchor)│   │  Backend — Koa + Node.js   │
│  Source of truth:            │   │  Off-chain plane:          │
│   · task state & escrow      │   │   · video upload / storage │
│   · participation records    │   │   · moderation workflow    │
│   · winner selection payout  │   │   · IPFS pinning (Filebase)│
│   · commemorative NFT mint   │   │   · read API over Postgres │
└───────────────┬──────────────┘   └─────────────┬─────────────┘
                │  emits events                   │ writes
                │                                 ▼
                │  Helius webhook       ┌───────────────────────┐
                └──────────────────────►│  PostgreSQL            │
                   (indexing pipeline)  │  projected chain state │
                                        │  + comments/likes/etc. │
                                        └───────────────────────┘
```

### On-chain — the source of truth

The Anchor program (`programs/tasksama/src/lib.rs`) owns everything that must be trustless: custody of funds and the task lifecycle. State is modeled as Program Derived Addresses (PDAs), so accounts are deterministically addressable from their seeds rather than tracked in a list.

- **`PlatformConfig`** — singleton PDA (`["platform_config"]`) holding fee policy, minimum reward, and global counters.
- **`Task`** — PDA seeded by the global task counter (`["task", task_id]`). The task account *is* the escrow: `create_task` transfers the full reward into it and records the net reward / fee split.
- **`ParticipantRecord`** — PDA per (task, participant) (`["participant", task, participant]`), carrying participation timestamp, video hash, and moderation status.

The lifecycle is a guarded state machine: `initialize → create_task → participate → mark_video_uploaded → moderate_video → choose_winner → mint_video_nft`, with `cancel_task` as the refund path. Each instruction enforces its own invariants — only the creator can choose a winner, the winner must be a participant with an *approved* video, a task can only be acted on while `Active`, and arithmetic uses checked math. Reward payout, fee transfer, and status change happen atomically inside `choose_winner`. Every meaningful transition emits an event, which is what makes the off-chain plane possible.

### Event indexing — keeping off-chain in sync

The chain is the source of truth, but querying "all active tasks with their like counts" directly from it is slow and expensive. So program events are streamed to the backend via a **Helius webhook** (`backend/routes/webhooks.js`). The handler verifies the HMAC signature, deduplicates on transaction signature (idempotent ingestion), persists the raw event to a `webhook_events` table, and projects derived state into the relational model. This is the standard read-model / CQRS split: writes go to the chain, reads are served from a projection that trails it.

### Off-chain — the relational plane

PostgreSQL (`backend/schema.sql`) stores everything that doesn't belong on a blockchain: large video files' metadata, the moderation queue, social features (threaded comments with up/down votes, likes), and the projected view of on-chain tasks. The schema is fully normalized with foreign keys, junction tables for many-to-many relations (`user_nft_likes`, `comment_upvotes`), partial-friendly indexes on every hot query path, and triggers for `updated_at` bookkeeping — the relational guarantees that the previous MongoDB version couldn't provide.

The Koa backend exposes a small REST surface (`backend/index-postgres.js`) split by resource — tasks, videos, images, comments, likes, users, webhooks — plus a health endpoint and graceful shutdown. Video proof files are uploaded here, run through moderation, and the winner's video is pinned to IPFS so the NFT's media reference outlives the platform.

### Frontend — the client

Vue 3 with the Composition API and TypeScript. Blockchain access is encapsulated in composables: `useSolanaWallet` wraps the Solana Wallet Adapter (Phantom, Solflare), and `useTaskSamaProgram` builds the Anchor `Program` from the generated IDL and exposes one typed method per instruction (`createTask`, `participate`, `chooseWinner`, …), deriving the right PDAs for each call. State is held in Pinia stores with persistence; UI is Tailwind + DaisyUI. The client talks to the chain directly for anything that moves money or state, and to the backend only for media and read queries.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Rust, Anchor, Metaplex Token Metadata (NFT mint) |
| Frontend | Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS + DaisyUI |
| Wallet / chain client | Solana Wallet Adapter, `@solana/web3.js`, `@coral-xyz/anchor` |
| Backend | Node.js, Koa, PostgreSQL (`pg`) |
| Indexing | Helius webhooks |
| Storage | IPFS via Filebase (proof videos), PostgreSQL (metadata & social) |

## Repository Layout

```
programs/tasksama/        Anchor program (Rust) — on-chain source of truth
src/
  composables/            useSolanaWallet, useTaskSamaProgram (chain access)
  lib/solana/             IDL, PDA derivation, RPC config
  stores/                 Pinia state (Solana task/wallet stores)
  components/             Vue UI
backend/
  index-postgres.js       Koa app entry (PostgreSQL stack)
  routes/*-postgres.js    REST resources
  routes/webhooks.js      Helius event ingestion
  schema.sql              PostgreSQL schema
docs/                     Architecture notes & migration history
tests/                    Anchor integration tests
```

## Running Locally

Prerequisites: Rust + Solana CLI + Anchor (0.29), Node.js, and a PostgreSQL instance.

**Program**

```bash
anchor build
anchor test                                   # local validator
anchor deploy --provider.cluster devnet       # devnet
```

**Backend**

```bash
cd backend
cp .env.example .env                          # set DATABASE_URL, SOLANA_RPC_URL, HELIUS_WEBHOOK_SECRET
psql "$DATABASE_URL" -f schema.sql
npm install
npm run dev:postgres
```

**Frontend**

```bash
npm install
npm run dev
```

## Design Decisions Worth Noting

- **On-chain/off-chain split.** Only custody and state transitions are on-chain. Putting video bytes or social data on-chain would be slow and expensive for no trust benefit — those live in Postgres/IPFS and are reconciled through events.
- **Escrow as a PDA.** The task account holds the funds directly, so payout is a lamport transfer guarded by program logic rather than an external custodian.
- **Idempotent event ingestion.** Webhooks can be redelivered; dedup on transaction signature makes reprocessing safe.
- **EVM → Solana migration.** A conscious re-platform: lower fees, faster finality, and a relational backend replacing the original MongoDB store.

## License

MIT
