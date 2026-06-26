# TaskSama - Project Analysis & Modernization Plan

## Executive Summary

**TaskSama** è una piattaforma decentralizzata di bounty/task che permette a creator di postare task con reward in cryptocurrency (GLMR - Moonbeam), agli utenti di partecipare con proof of completion (video), e al creator di scegliere il vincitore che riceve la reward. Ogni task completato viene immortalato come NFT (ERC721) con metadata permanenti su IPFS.

**L'idea core è eccellente e validissima**: combina elementi di gig economy decentralizzata, proof of work tramite video, gamification tramite NFT, e trasparenza blockchain.

---

## 1. SMART CONTRACTS - Analisi Dettagliata (FONDAMENTALI)

### 1.1 Tasks.sol - Il Contratto Principale

**Location**: `truffle/contracts/Tasks.sol`

**Solidity Version**: `^0.8.1`

**Dependencies**:
- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/access/Ownable.sol`
- `@openzeppelin/contracts/utils/Counters.sol`

#### Struttura Dati Core

```solidity
struct Task {
    uint256 tokenId;
    address owner;
    string title;
    string description;
    uint256 reward;
    address[] participants;
    uint256 timestamp;
}

mapping(uint256 => Task) public tasks;
```

#### Funzionalità Principali

**1. createTask(string memory _title, string memory _description) payable**
- Il creator paga una reward (minimo 10 GLMR)
- Viene presa una fee del 5% che va al `feeRecipient`
- Il task viene mintato come NFT ERC721 al creator
- La net reward (95% del totale) viene conservata nel contratto
- Emette evento `TaskCreated`

**2. participate(uint256 _taskId)**
- Un utente si registra come partecipante a un task
- Non può partecipare al proprio task
- Non può partecipare due volte
- Aggiunge l'address all'array `participants`

**3. chooseWinner(uint256 _taskId, address payable _winner, string memory ipfsMetadataUrl, string memory ipfsVideoUrl)**
- Solo il task owner può chiamare questa funzione
- Il winner deve essere un partecipante valido
- Trasferisce la reward al vincitore
- **Chiama il contratto TaskSama per mintare un NFT commemorativo**
- Elimina il task dalla mapping (task completato)
- Emette evento `TaskCompleted`

**4. Utility Functions**
- `_getTasks()`: ritorna tutti i task attivi
- `_getTask(uint256 _taskId)`: ritorna un task specifico
- `_getParticipantsOf(uint256 _taskId)`: ritorna i partecipanti
- `_taskExists(uint256 _taskId)`: verifica esistenza task
- `updateFeeRecipientAndPercentage()`: aggiorna fee (solo owner)

#### Parametri Configurabili

```solidity
uint256 public minimumReward = 10 ether; // 10 GLMR
uint256 public feePercentage = 5; // 5%
address payable public feeRecipient;
```

#### Interface per TaskSama

```solidity
interface ITasksSamaContract {
    function mintVideoNFT(
        address winner,
        address creator,
        string calldata title,
        string calldata description,
        string calldata ipfsMetadataUrl,
        string calldata ipfsVideoUrl,
        uint256 rewardEarned,
        address[] calldata participants
    ) external returns (uint256);
}
```

---

### 1.2 TaskSama.sol - Il Contratto NFT

**Location**: `truffle/contracts/TaskSama.sol`

**Solidity Version**: `^0.8.1`

**Dependencies**:
- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol`
- `@openzeppelin/contracts/access/Ownable.sol`
- `@openzeppelin/contracts/utils/Counters.sol`

#### Struttura Dati Core

```solidity
struct Video {
    uint256 tokenId;
    string title;
    string description;
    string ipfsVideoUrl;
    uint256 rewardEarned;
    address creator;
    address winner;
    address[] participants;
    uint256 timestamp;
}

Video[] public tasksama;
```

#### Funzionalità Principali

**1. mintVideoNFT(...) returns (uint256)**
- Minta un NFT ERC721 al creator (non al winner!)
- Salva metadata IPFS nell'NFT tramite `_setTokenURI`
- Aggiunge il Video struct all'array `tasksama`
- Ritorna il nuovo tokenId

**2. Query Functions**
- `getVideos()`: ritorna tutti i video NFT mintati
- `getVideo(uint256 tokenId)`: ritorna un video specifico
- `getWinnerOf(uint256 _taskId)`: ritorna il vincitore

#### Caratteristiche NFT

- **Token Name**: "TaskSama"
- **Token Symbol**: "TSK"
- **Base URI**: "https://ipfs.io/"
- **Standard**: ERC721 + ERC721URIStorage

---

### 1.3 Smart Contract Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER FLOW                               │
└─────────────────────────────────────────────────────────────────┘

1. CREATOR CREATES TASK
   └─> Tasks.createTask("Build a website", "...")
       [pays 10 GLMR]
       ├─> 5% fee → feeRecipient (0.5 GLMR)
       ├─> 95% reward → contract (9.5 GLMR)
       └─> Task NFT minted to creator

2. USERS PARTICIPATE
   └─> Tasks.participate(taskId)
       └─> address added to participants[]

3. USERS UPLOAD VIDEO PROOF
   └─> [OFF-CHAIN] Upload to backend
       └─> Video stored temporarily in MongoDB + filesystem

4. CREATOR CHOOSES WINNER
   └─> Tasks.chooseWinner(taskId, winnerAddress, ipfsMetadataUrl, ipfsVideoUrl)
       ├─> Transfer 9.5 GLMR to winner
       ├─> Call TaskSama.mintVideoNFT(...)
       │   └─> Mint Video NFT to creator with IPFS metadata
       └─> Delete task from mapping

5. PERMANENT RECORD
   └─> Video NFT lives forever on-chain
       └─> IPFS video accessible forever
```

---

### 1.4 Smart Contract Issues & Considerations

#### 🔴 Critical Issues

1. **Line 86 in Tasks.sol**: `_winner.transfer(task.reward * 1 wei);`
   - Il `* 1 wei` è ridondante e potenzialmente confusionario
   - Dovrebbe essere semplicemente `_winner.transfer(task.reward);`

2. **NFT Ownership Design**
   - L'NFT viene mintato al **creator** invece che al **winner**
   - Questo potrebbe essere intenzionale ma è controintuitivo
   - Considerare di mintare al winner o fare dual-minting

3. **No Refund Mechanism**
   - Se nessuno partecipa o i video sono tutti inaccettabili, il creator non può recuperare i fondi
   - Serve una funzione `cancelTask()` con refund mechanism

4. **Video Moderation Off-Chain**
   - La moderazione dei video è completamente off-chain (MongoDB)
   - Nessuna garanzia on-chain che il video sia stato approvato
   - Potenziale per dispute

5. **Fixed Fee Percentage**
   - La fee può essere cambiata solo dall'owner
   - Considerare un sistema più dinamico o governance-based

6. **Reentrancy Risk**
   - `chooseWinner()` trasferisce ETH prima di chiamare external contract
   - Dovrebbe usare ReentrancyGuard di OpenZeppelin

#### 🟡 Medium Issues

1. **Gas Costs**
   - Storing arrays on-chain (participants) può diventare costoso
   - Considerare off-chain storage con Merkle proofs

2. **Counters Library Deprecated**
   - OpenZeppelin sta deprecando `Counters`
   - Usare semplice `uint256` counter invece

3. **Array Resizing in Assembly**
   - Line 128-130 in Tasks.sol usa assembly per resize
   - Considerare approcci più safe

4. **No Maximum Participants**
   - Array `participants` può crescere indefinitamente
   - Potenziale out-of-gas error

---

## 2. FRONTEND - Architettura Attuale

### 2.1 Tech Stack

- **Framework**: Vue 3 (Composition API con `<script setup>`)
- **Build Tool**: Vite 4.1.0
- **State Management**: Pinia 2.0.33
- **Routing**: Vue Router 4.2.4 (Hash mode)
- **Styling**: Tailwind CSS 3.2.7 + DaisyUI 3.5.1
- **Blockchain**: Ethers.js 5.7.2
- **Authentication**: Web3Token 1.0.6 (JWT with wallet signature)
- **Animations**: Vue3-Lottie 2.7.0
- **Icons**: Heroicons + MetaMask Jazzicon

### 2.2 Stores (Pinia)

1. **useConnectionStore** (`src/stores/useConnectionStore.js`)
   - Gestisce connessione MetaMask
   - Provider/Signer setup (Ganache/Infura fallback)
   - Contract instances (Tasks + TaskSama)
   - Wallet address management
   - Auth token (Web3Token)
   - Avatar generation (Jazzicon)

2. **useTaskStore** (`src/stores/useTaskStore.js`)
   - Fetch tasks metadata da blockchain
   - Fetch task images da backend
   - Upload video/immagini al backend
   - Upload video a IPFS
   - Reminder system

3. **useUsersStore**
   - User profile data
   - User verification

4. **useVideoStore**
   - Video management

5. **useCommentsStore**
   - Comments on tasks

6. **Other Stores**: useArgStore, useBackgroundStore, usePopupStore

### 2.3 Routes

```javascript
{ path: '/', component: Home },
{ path: '/profile', component: Profile },
{ path: '/users/:username', component: User },
{ path: '/video/:tokenId', component: WatchVideo },
{ path: '/task/:tokenId', component: WatchTask },
{ path: '/chooseWinner/:tokenId', component: ChooseWinner },
```

### 2.4 Key Components

- **Home.vue**: Lista dei task attivi
- **Profile.vue**: Profilo utente con task creati/vinti
- **WatchVideo.vue**: Visualizza video NFT completato
- **WatchTask.vue**: Dettagli task attivo + video partecipanti
- **ChooseWinner.vue**: Interface per creator per scegliere vincitore
- **TaskTable.vue**: Tabella task
- **CardTable.vue**: Card grid task
- **CommentSection.vue**: Sistema commenti

---

## 3. BACKEND - Architettura Attuale

### 3.1 Tech Stack

- **Framework**: Koa.js 2.14.2
- **Database**: MongoDB 5.4.0
- **File Upload**: @koa/multer 3.0.2
- **IPFS**: ipfs-http-client 60.0.1 + @filebase/client 0.0.5
- **Authentication**: web3-token 1.0.6 + jsonwebtoken 9.0.2
- **Scheduler**: node-cron 3.0.2
- **Blockchain**: ethers 6.9.0

### 3.2 Routes & Endpoints

#### Videos (`backend/routes/videos.js`)

1. **POST `/uploadVideoToDB`**
   - Upload video al server (max 15MB, mp4/webm)
   - Richiede auth token Web3Token
   - Salva in `uploads/videos/{taskId}/{walletAddress}/`
   - Inserisce doc in MongoDB collection `videos`
   - Status: `moderated: 'null'` (in attesa)

2. **POST `/uploadVideoToIpfs`**
   - Upload video vincitore a IPFS (Filebase)
   - Retrieve metadata da IPFS gateway
   - Salva in collection `IPFSvideos`

3. **GET `/getVideoFromIPFS?ipfsUrl=...`**
   - Proxy per fetch video da IPFS gateway
   - Tenta Cloudflare IPFS, fallback ipfs.io
   - Ritorna video stream

4. **GET `/getParticipantVideo?participantAddress=...&tokenId=...`**
   - Ritorna video solo se `moderated == 'true'`
   - Ritorna 202 se `moderated == 'null'` (unmoderated)
   - Ritorna 204 se `moderated == 'false'` (rejected)

5. **GET `/getParticipantVideoADMIN`**
   - Come sopra ma senza check moderazione (per admin)

6. **GET `/getUnmoderatedParticipants?taskId=...`**
   - Lista partecipanti con video non moderati

7. **POST `/moderateVideo`**
   - Setta flag `moderated` a `true`/`false`

8. **POST `/confirmNFTId`**
   - Aggiorna collection `IPFSVideos` con NFT tokenId dopo mint

#### Tasks (`backend/routes/tasks.js`)

1. **GET `/getTasks`**
   - Fetch tutti i task attivi da smart contract
   - Formatta dati (BigNumber → number/string)

2. **GET `/getTask?taskId=...`**
   - Fetch singolo task da smart contract

3. **GET `/getTasksToModerate`**
   - Task attivi con video non moderati
   - JOIN tra blockchain data e MongoDB

4. **POST `/reminder`**
   - Sistema per reminder ai partecipanti
   - Counter-based tracking in collection `reminders`

#### Images (`backend/routes/images.js`)
- Upload/fetch immagini associate ai task (thumbnails)

#### Likes (`backend/routes/likes.js`)
- Sistema di likes per task

#### Comments (`backend/routes/comments.js`)
- Sistema commenti per task

#### Users (`backend/routes/users.js`)
- User profiles e verificazione

### 3.3 Batch Job (`backend/batch.js`)

**Schedule**: Ogni 20 minuti (`*/20 * * * *`)

**Funzione**: Pulizia automatica
1. Fetch task attivi da smart contract
2. Fetch tutti i video/immagini da MongoDB
3. Per ogni video/immagine:
   - Se il task non esiste più on-chain → task completato
   - Elimina directory locale `uploads/videos/{taskId}/`
   - Elimina documenti da collections: `videos`, `reminders`, `images`

**Logica**: Quando un task è completato, viene eliminato dalla mapping on-chain, quindi il batch job rileva che non esiste più e pulisce tutto.

### 3.4 MongoDB Collections

```javascript
videos: {
  name: string,
  path: string,
  uploadDate: string,
  size: number,
  taskId: string,
  senderAddress: string,
  moderated: 'null' | 'true' | 'false'
}

IPFSvideos: {
  name: string,
  IPFSMetadataUrl: string,
  IPFSVideoUrl: string,
  winnerAddress: string,
  uploadDate: string,
  nftId: string | 'to be minted'
}

reminders: {
  taskId: string,
  participantAddress: string,
  counter: number
}

images: {
  taskId: string,
  path: string,
  // ... similar to videos
}

// + collections for: comments, likes, users
```

---

## 4. WORKFLOW COMPLETO

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE USER JOURNEY                        │
└─────────────────────────────────────────────────────────────────┘

1. CREATOR POSTS TASK
   Frontend → Metamask → Tasks.createTask(title, desc) [10 GLMR]
   ├─> Smart Contract: Task created, NFT minted to creator
   └─> Frontend: Upload optional task image to backend

2. USERS DISCOVER TASK
   Frontend → Smart Contract: _getTasks()
   Frontend → Backend: fetchTasksImages()
   Frontend: Display TaskTable/CardTable

3. USER PARTICIPATES
   Frontend → Metamask → Tasks.participate(taskId)
   Smart Contract: Add address to participants[]

4. USER UPLOADS VIDEO PROOF
   Frontend → Backend: POST /uploadVideoToDB
   Backend: Save to uploads/videos/{taskId}/{address}/
   Backend: Insert to MongoDB.videos {moderated: 'null'}

5. MODERATOR REVIEWS (optional step)
   Admin Frontend → Backend: GET /getParticipantVideoADMIN
   Admin Frontend → Backend: POST /moderateVideo {moderated: 'true'/'false'}

6. CREATOR VIEWS SUBMISSIONS
   Frontend → Backend: GET /getParticipantVideo
   Backend: Only return if moderated == 'true'
   Frontend: Display video player for each approved participant

7. CREATOR CHOOSES WINNER
   Frontend → Backend: POST /uploadVideoToIpfs {winnerAddress}
   Backend: Upload video to IPFS (Filebase)
   Backend: Get ipfsMetadataUrl + ipfsVideoUrl
   Frontend → Metamask → Tasks.chooseWinner(taskId, winner, ipfsMetadataUrl, ipfsVideoUrl)
   Smart Contract:
     ├─> Transfer 9.5 GLMR to winner
     ├─> Call TaskSama.mintVideoNFT(...)
     │   └─> Mint Video NFT to creator
     └─> Delete task from mapping
   Frontend → Backend: POST /confirmNFTId {tokenId}

8. BATCH CLEANUP (every 20 min)
   Batch Job: Detect task deleted on-chain
   Batch Job: Delete local videos (except winner's, already on IPFS)
   Batch Job: Delete MongoDB documents

9. PERMANENT RECORD
   Smart Contract: Video NFT exists forever
   IPFS: Video accessible forever
   Frontend: Display in /video/{tokenId}
```

---

## 5. CURRENT TECH DEBT & ISSUES

### 5.1 Smart Contracts
- ✅ Solidity 0.8.1 (relativamente recente, ma potrebbe usare 0.8.20+)
- ❌ OpenZeppelin Counters deprecated
- ❌ No ReentrancyGuard
- ❌ No cancellation/refund mechanism
- ❌ Gas optimization needed (storage arrays)

### 5.2 Frontend
- ✅ Vue 3 è moderno
- ✅ Composition API è best practice
- ❌ Ethers v5 (v6 è disponibile)
- ❌ Vite 4.1.0 (v5 disponibile)
- ❌ Hash routing invece di history mode
- ❌ No TypeScript
- ❌ No proper error boundaries
- ❌ No loading states standardizzati
- ❌ No tests

### 5.3 Backend
- ✅ Koa è moderno
- ❌ Ethers v6 nel backend ma v5 nel frontend (inconsistency)
- ❌ No TypeScript
- ❌ No input validation layer (Joi, Zod, etc.)
- ❌ No rate limiting
- ❌ No proper logging (Winston, Pino)
- ❌ No tests
- ❌ MongoDB è NoSQL (passaggio a PostgreSQL necessario)
- ❌ File storage locale invece di S3/cloud storage
- ❌ No Docker compose per dev environment

### 5.4 Database
- ❌ MongoDB non adatto per relazioni complesse
- ❌ No migrations system
- ❌ No backup strategy
- ❌ Schema-less porta a inconsistenze

### 5.5 Infrastructure
- ❌ Ganache local invece di testnet
- ❌ No CI/CD
- ❌ No monitoring/alerting
- ❌ No load balancing
- ❌ HTTPS solo in production (conditional)

---

## 6. MODERNIZATION PLAN

### 6.1 Smart Contracts - Priority 1 (MANTIENI L'IDEA)

#### 6.1.1 Upgrade & Security

```solidity
// Upgrades needed:
1. Solidity 0.8.24+
2. OpenZeppelin 5.x (latest)
3. Add ReentrancyGuard
4. Replace Counters with simple uint256
5. Add cancellation mechanism
6. Add dispute resolution mechanism
7. Consider EIP-2535 (Diamond pattern) for upgradeability
8. Add comprehensive events for better indexing
```

#### 6.1.2 New Features to Consider

```solidity
// TasksV2.sol additions:
- Multi-winner support (split rewards)
- Milestone-based tasks (partial payments)
- Staking mechanism for participants (anti-spam)
- Time-based auto-refund if no winner chosen
- On-chain dispute resolution with arbitrators
- Task categories/tags
- Reputation system
- Dynamic fee based on task size
```

#### 6.1.3 Gas Optimization

```solidity
// Optimizations:
- Use events instead of storage where possible
- Pack structs efficiently (uint256 → uint96 for timestamps)
- Use mappings instead of arrays for large datasets
- Implement pagination for large arrays
- Use IPFS for large data (store only hashes on-chain)
```

### 6.2 Database Migration: MongoDB → PostgreSQL

#### 6.2.1 New Schema

```sql
-- PostgreSQL Schema

CREATE TYPE moderation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE task_status AS ENUM ('active', 'completed', 'cancelled');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(50),
  bio TEXT,
  avatar_seed INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id BIGINT PRIMARY KEY, -- tokenId from smart contract
  owner_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  reward_amount DECIMAL(20, 8) NOT NULL, -- GLMR amount
  status task_status DEFAULT 'active',
  created_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  winner_address VARCHAR(42) REFERENCES users(wallet_address),
  tx_hash VARCHAR(66) NOT NULL, -- transaction hash
  CONSTRAINT tasks_owner_fk FOREIGN KEY (owner_address) REFERENCES users(wallet_address)
);

CREATE TABLE task_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- S3 URL
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  participated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_address)
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploader_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  file_path TEXT NOT NULL, -- S3 URL
  file_size BIGINT NOT NULL,
  duration INTEGER, -- seconds
  mime_type VARCHAR(50) NOT NULL,
  moderation_status moderation_status DEFAULT 'pending',
  moderated_by VARCHAR(42) REFERENCES users(wallet_address),
  moderated_at TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, uploader_address)
);

CREATE TABLE video_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_token_id BIGINT UNIQUE NOT NULL,
  task_id BIGINT NOT NULL REFERENCES tasks(id),
  winner_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  creator_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  ipfs_metadata_url TEXT NOT NULL,
  ipfs_video_url TEXT NOT NULL,
  reward_amount DECIMAL(20, 8) NOT NULL,
  minted_at TIMESTAMP NOT NULL,
  tx_hash VARCHAR(66) NOT NULL
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, user_address)
);

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  participant_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
  reminder_count INTEGER DEFAULT 0,
  last_reminded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, participant_address)
);

-- Indexes for performance
CREATE INDEX idx_tasks_owner ON tasks(owner_address);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created ON tasks(created_at DESC);
CREATE INDEX idx_participants_task ON participants(task_id);
CREATE INDEX idx_participants_user ON participants(user_address);
CREATE INDEX idx_videos_task ON videos(task_id);
CREATE INDEX idx_videos_uploader ON videos(uploader_address);
CREATE INDEX idx_videos_moderation ON videos(moderation_status);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_likes_task ON likes(task_id);
```

#### 6.2.2 Migration Strategy

```typescript
// Use Prisma ORM for type-safety
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String    @id @default(uuid())
  walletAddress String    @unique @map("wallet_address") @db.VarChar(42)
  username      String?   @db.VarChar(50)
  bio           String?
  avatarSeed    Int?      @map("avatar_seed")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  tasksCreated  Task[]    @relation("TaskOwner")
  tasksWon      Task[]    @relation("TaskWinner")
  participants  Participant[]
  videos        Video[]
  comments      Comment[]
  likes         Like[]
  reminders     Reminder[]

  @@map("users")
}

// ... rest of models
```

### 6.3 Frontend Modernization

#### 6.3.1 Tech Stack Upgrade

```json
{
  "core": {
    "vue": "^3.4.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0"
  },
  "routing": {
    "vue-router": "^4.2.0"
  },
  "state": {
    "pinia": "^2.1.0",
    "pinia-plugin-persistedstate": "^3.2.0"
  },
  "blockchain": {
    "viem": "^2.0.0", // Modern alternative to ethers
    "wagmi": "^2.0.0", // React hooks style for Vue
    "@wagmi/core": "^2.0.0"
  },
  "ui": {
    "tailwindcss": "^3.4.0",
    "shadcn-vue": "^0.10.0", // Modern component library
    "radix-vue": "^1.4.0"   // Accessible primitives
  },
  "forms": {
    "vee-validate": "^4.12.0",
    "zod": "^3.22.0"
  },
  "utils": {
    "tanstack-query": "^5.0.0", // Data fetching & caching
    "date-fns": "^3.0.0",
    "nuqs": "^1.0.0" // URL state management
  },
  "testing": {
    "vitest": "^1.0.0",
    "@vue/test-utils": "^2.4.0",
    "playwright": "^1.40.0"
  }
}
```

#### 6.3.2 Project Structure

```
src/
├── assets/          # Static assets
├── components/      # Vue components
│   ├── ui/          # Shadcn/Radix components
│   ├── features/    # Feature-specific components
│   │   ├── tasks/
│   │   ├── videos/
│   │   └── profile/
│   └── layout/      # Layout components
├── composables/     # Vue composables
│   ├── useWallet.ts
│   ├── useContracts.ts
│   └── useVideoUpload.ts
├── stores/          # Pinia stores
│   ├── wallet.ts
│   ├── tasks.ts
│   └── user.ts
├── lib/             # Utilities
│   ├── contracts/   # Contract ABIs & addresses
│   ├── utils/
│   └── api.ts       # Backend API client
├── types/           # TypeScript types
├── views/           # Route views
└── router/          # Vue Router config
```

#### 6.3.3 Replace Ethers with Viem/Wagmi

```typescript
// composables/useContracts.ts
import { useContractRead, useContractWrite } from '@wagmi/vue'
import { TasksABI } from '@/lib/contracts/TasksABI'

export function useTasks() {
  const { data: tasks, refetch } = useContractRead({
    address: TASKS_ADDRESS,
    abi: TasksABI,
    functionName: '_getTasks'
  })

  const { write: createTask, isLoading } = useContractWrite({
    address: TASKS_ADDRESS,
    abi: TasksABI,
    functionName: 'createTask'
  })

  return { tasks, createTask, isLoading, refetch }
}
```

### 6.4 Backend Modernization

#### 6.4.1 Tech Stack Upgrade

```json
{
  "framework": "fastify" // or "hono" (faster than koa)
  "orm": "prisma",
  "validation": "zod",
  "auth": "siwe" // Sign-In with Ethereum standard
  "storage": "aws-sdk" // S3 for videos
  "blockchain": "viem",
  "queue": "bullmq", // Redis-based job queue
  "logging": "pino",
  "monitoring": "sentry"
}
```

#### 6.4.2 Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── tasks.ts
│   │   ├── videos.ts
│   │   ├── users.ts
│   │   └── health.ts
│   ├── services/
│   │   ├── blockchain.service.ts
│   │   ├── storage.service.ts // S3 uploads
│   │   ├── ipfs.service.ts
│   │   └── moderation.service.ts
│   ├── jobs/
│   │   ├── cleanup.job.ts
│   │   └── indexer.job.ts // Index blockchain events
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── ratelimit.middleware.ts
│   ├── lib/
│   │   ├── db.ts // Prisma client
│   │   ├── queue.ts // BullMQ
│   │   └── logger.ts // Pino
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
└── package.json
```

#### 6.4.3 Replace Koa with Fastify

```typescript
// src/index.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { tasksRoutes } from './routes/tasks'
import { videosRoutes } from './routes/videos'

const server = Fastify({ logger: true })

await server.register(cors, { origin: '*' })
await server.register(multipart, { limits: { fileSize: 15 * 1024 * 1024 } })

await server.register(tasksRoutes, { prefix: '/api/tasks' })
await server.register(videosRoutes, { prefix: '/api/videos' })

server.listen({ port: 3000, host: '0.0.0.0' })
```

#### 6.4.4 Blockchain Indexer

```typescript
// src/jobs/indexer.job.ts
import { createPublicClient, http } from 'viem'
import { TasksABI } from '../lib/contracts/TasksABI'

export async function indexBlockchainEvents() {
  const client = createPublicClient({
    transport: http(MOONBEAM_RPC_URL)
  })

  // Listen to TaskCreated events
  client.watchContractEvent({
    address: TASKS_ADDRESS,
    abi: TasksABI,
    eventName: 'TaskCreated',
    onLogs: async (logs) => {
      for (const log of logs) {
        await prisma.task.create({
          data: {
            id: log.args.taskId,
            ownerAddress: log.args.owner,
            title: log.args.title,
            description: log.args.description,
            rewardAmount: log.args.reward,
            txHash: log.transactionHash
          }
        })
      }
    }
  })

  // Listen to TaskCompleted events
  client.watchContractEvent({
    address: TASKS_ADDRESS,
    abi: TasksABI,
    eventName: 'TaskCompleted',
    onLogs: async (logs) => {
      for (const log of logs) {
        await prisma.task.update({
          where: { id: log.args.taskId },
          data: {
            status: 'completed',
            winnerAddress: log.args.winner,
            completedAt: new Date()
          }
        })
      }
    }
  })
}
```

### 6.5 Infrastructure Improvements

#### 6.5.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tasksama
      POSTGRES_USER: tasksama
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://tasksama:${DB_PASSWORD}@postgres:5432/tasksama
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: .
    ports:
      - "5173:5173"
    volumes:
      - .:/app
      - /app/node_modules

  ganache:
    image: trufflesuite/ganache:latest
    ports:
      - "8545:8545"
    command: >
      --wallet.totalAccounts=10
      --wallet.defaultBalance=1000
      --miner.blockGasLimit=12000000

volumes:
  postgres_data:
```

#### 6.5.2 Storage: S3 invece di Filesystem

```typescript
// src/services/storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({ region: 'eu-central-1' })

export async function uploadVideo(
  file: Buffer,
  taskId: string,
  walletAddress: string
): Promise<string> {
  const key = `videos/${taskId}/${walletAddress}/${Date.now()}.mp4`

  await s3.send(new PutObjectCommand({
    Bucket: 'tasksama-videos',
    Key: key,
    Body: file,
    ContentType: 'video/mp4'
  }))

  return `https://tasksama-videos.s3.eu-central-1.amazonaws.com/${key}`
}
```

---

## 7. DEPLOYMENT STRATEGY

### 7.1 Smart Contracts

```bash
# 1. Test on local Ganache
npm run ganache
truffle migrate --network development

# 2. Deploy to testnet (Moonbase Alpha)
truffle migrate --network moonbase

# 3. Verify contracts
truffle run verify TaskSama --network moonbase
truffle run verify Tasks --network moonbase

# 4. Deploy to mainnet (Moonbeam)
truffle migrate --network moonbeam
```

### 7.2 Backend

```bash
# 1. Build Docker image
docker build -t tasksama-backend:latest ./backend

# 2. Push to registry
docker push tasksama-backend:latest

# 3. Deploy to cloud (AWS ECS, GCP Cloud Run, etc.)
# ... infrastructure as code (Terraform/Pulumi)
```

### 7.3 Frontend

```bash
# 1. Build for production
npm run build

# 2. Deploy to Vercel/Netlify/Cloudflare Pages
vercel deploy --prod
```

---

## 8. TIMELINE & PRIORITY

### Phase 1: Foundation (Week 1-2)
- ✅ Setup PostgreSQL + Prisma
- ✅ Migrate MongoDB schema to PostgreSQL
- ✅ Setup Docker Compose dev environment
- ✅ Implement S3 storage
- ✅ Setup CI/CD pipeline

### Phase 2: Smart Contracts (Week 3-4)
- ✅ Audit current contracts
- ✅ Implement security fixes (ReentrancyGuard, etc.)
- ✅ Add cancellation mechanism
- ✅ Optimize gas costs
- ✅ Write comprehensive tests
- ✅ Deploy to testnet

### Phase 3: Backend Modernization (Week 5-6)
- ✅ Migrate Koa → Fastify
- ✅ Implement Prisma ORM
- ✅ Add proper validation (Zod)
- ✅ Implement blockchain indexer
- ✅ Add rate limiting & auth middleware
- ✅ Setup BullMQ job queue
- ✅ Implement monitoring & logging

### Phase 4: Frontend Modernization (Week 7-8)
- ✅ Setup TypeScript
- ✅ Migrate Ethers → Viem/Wagmi
- ✅ Implement Shadcn UI components
- ✅ Add proper error handling
- ✅ Implement loading states
- ✅ Add TanStack Query for data fetching
- ✅ Write tests (Vitest + Playwright)

### Phase 5: Testing & QA (Week 9)
- ✅ Integration testing
- ✅ E2E testing
- ✅ Security audit
- ✅ Performance testing
- ✅ User acceptance testing

### Phase 6: Deployment (Week 10)
- ✅ Deploy to testnet
- ✅ Beta testing
- ✅ Fix bugs
- ✅ Deploy to mainnet
- ✅ Monitoring & alerts setup

---

## 9. BUDGET CONSIDERATIONS

### Smart Contract Deployment
- Moonbeam Testnet: Free
- Moonbeam Mainnet: ~$50-100 in GLMR for deployment

### Infrastructure (Monthly)
- PostgreSQL (Neon/Supabase): $25-50
- S3 Storage: $20-100 (depending on video volume)
- Backend Hosting (Cloud Run/ECS): $50-200
- Frontend Hosting (Vercel): $0-20 (free tier available)
- IPFS Pinning (Filebase/Pinata): $20-50
- Monitoring (Sentry): $0-50
- **Total: ~$115-420/month**

---

## 10. RISKS & MITIGATION

### Technical Risks
1. **Smart Contract Bugs**: Comprehensive testing + audit
2. **IPFS Gateway Failures**: Multiple gateway fallbacks
3. **Video Storage Costs**: Implement compression + CDN
4. **Blockchain Congestion**: Gas price oracle + retry logic

### Business Risks
1. **Low Adoption**: Marketing + partnerships
2. **Spam Tasks**: Minimum reward + reputation system
3. **Low Quality Videos**: Better moderation tools + AI assistance
4. **Legal Issues**: Terms of Service + content policy

---

## 11. FUTURE ENHANCEMENTS

### 11.1 Advanced Features
- Multi-chain support (Polygon, Arbitrum, Base)
- DAO governance for platform parameters
- Task templates marketplace
- AI-powered video quality assessment
- Live streaming tasks
- Team-based tasks
- Skill-based matching algorithm
- Escrow service for large tasks

### 11.2 Monetization
- Premium task slots (featured tasks)
- Verified creator badges (subscription)
- Advanced analytics for creators
- API access for third-party integrations

---

## 12. CONCLUSION

TaskSama è un progetto con **un'idea eccellente e validissima**. La combinazione di:
- Decentralizzazione (blockchain)
- Proof of work (video)
- Gamification (NFT)
- Trasparenza (on-chain records)

...crea una piattaforma unica nel panorama Web3.

### Punti di Forza
✅ Smart contracts ben strutturati e funzionali
✅ Flow utente chiaro e logico
✅ Integrazione IPFS per permanenza
✅ Sistema di moderazione
✅ NFT commemorativi

### Aree di Miglioramento
❌ Tech stack datato (Vue 3 ok, ma tutto il resto)
❌ MongoDB non adatto (PostgreSQL necessario)
❌ Mancanza di TypeScript
❌ Mancanza di tests
❌ Sicurezza smart contracts migliorabile
❌ Nessun sistema di indexing blockchain
❌ Storage locale invece di cloud

### Raccomandazione Finale

**PROCEDERE CON IL REFACTORING COMPLETO**

La base è solida, l'idea è eccellente. Con un refactoring moderno e professionale, TaskSama può diventare una piattaforma leader nel settore dei bounty decentralizzati.

**Next Steps:**
1. Review questo documento con te
2. Decidere le priorità (suggerirei: Smart Contracts → Backend → Frontend)
3. Iniziare con Phase 1 (Foundation)

---

**Document Version**: 1.0
**Date**: 2026-01-14
**Author**: Claude AI Code Assistant
**Project**: TaskSama Modernization
