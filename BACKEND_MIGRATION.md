# Backend Migration: MongoDB → PostgreSQL + Helius Webhooks

## Overview

Migrating Task-Sama backend from:
- **Old**: MongoDB + Ethereum/Moonbeam EVM polling
- **New**: PostgreSQL + Helius webhooks for Solana events

## Database Schema

### PostgreSQL Tables

1. **users**
   - id (SERIAL PRIMARY KEY)
   - wallet_address (VARCHAR(44) UNIQUE) - Solana address
   - username (VARCHAR(25) UNIQUE)
   - seed (INTEGER) - for avatar generation
   - created_at, updated_at (TIMESTAMP)

2. **task_images**
   - id, task_id, name, path, size
   - uploader_address → users(wallet_address)
   - uploaded_at

3. **participant_videos**
   - id, task_id, participant_address, name, path, size
   - moderated ('null', 'true', 'false')
   - uploaded_at
   - UNIQUE(task_id, participant_address)

4. **nft_likes**
   - id, token_id (UNIQUE), like_count
   - created_at, updated_at

5. **user_nft_likes** (junction table)
   - id, token_id → nft_likes, wallet_address → users
   - liked_at
   - UNIQUE(token_id, wallet_address)

6. **comments**
   - id, token_id, category ('task' | 'taskSamaVideo')
   - poster_address → users, comment_body
   - ups, downs, posted_at

7. **comment_upvotes** (junction table)
   - id, comment_id → comments, wallet_address → users
   - voted_at, UNIQUE(comment_id, wallet_address)

8. **comment_downvotes** (junction table)
   - id, comment_id → comments, wallet_address → users
   - voted_at, UNIQUE(comment_id, wallet_address)

9. **moderation_reminders**
   - id, task_id, participant_address → users
   - reminder_count, last_reminded_at
   - UNIQUE(task_id, participant_address)

10. **webhook_events** (NEW!)
    - id, signature (VARCHAR(88) UNIQUE) - Solana tx signature
    - event_type ('TaskCreated', 'ParticipantAdded', 'TaskCompleted', etc.)
    - task_id, from_address, to_address, amount
    - metadata (JSONB) - full event data
    - processed (BOOLEAN), received_at, processed_at

## Migration Benefits

### From MongoDB Arrays to Relational
**Old (MongoDB)**:
```javascript
// likes collection
{
  tokenId: "123",
  likes: 5,
  likeWallets: ["addr1", "addr2", "addr3"]  // Array!
}
```

**New (PostgreSQL)**:
```sql
-- nft_likes table
token_id | like_count
123      | 5

-- user_nft_likes table (junction)
token_id | wallet_address | liked_at
123      | addr1          | 2026-01-15 ...
123      | addr2          | 2026-01-15 ...
123      | addr3          | 2026-01-15 ...
```

**Benefits**:
- ✅ ACID compliance
- ✅ Foreign key constraints
- ✅ Better indexing & query performance
- ✅ No array size limits
- ✅ Easier analytics queries

### Helius Webhooks vs Polling

**Old (EVM Polling)**:
```javascript
// Poll blockchain every N seconds
setInterval(async () => {
  const events = await contract.queryFilter('TaskCreated');
  // Process events...
}, 10000); // Poll every 10 seconds
```

**New (Helius Webhooks)**:
```javascript
// Real-time push notifications from Helius
router.post('/helius-webhook', async (ctx) => {
  const events = ctx.request.body;
  // Process events immediately!
});
```

**Benefits**:
- ✅ Real-time (< 1s latency)
- ✅ No RPC rate limits
- ✅ No polling overhead
- ✅ Automatic retry logic
- ✅ Event deduplication
- ✅ Historical event replay

## Authentication Migration

### From web3-token to Solana Signatures

**Old (EVM)**:
```javascript
const Web3Token = require('web3-token');
const { address } = await Web3Token.verify(authToken);
```

**New (Solana)**:
```javascript
const nacl = require('tweetnacl');
const bs58 = require('bs58');

// Token format: "message:signature:publicKey"
const [message, signature, publicKey] = authToken.split(':');
const isValid = nacl.sign.detached.verify(
  Buffer.from(message),
  bs58.decode(signature),
  bs58.decode(publicKey)
);
```

## Files Created

- `backend/schema.sql` - PostgreSQL schema with all tables
- `backend/db-postgres.js` - PostgreSQL connection pool
- `backend/routes/webhooks.js` - Helius webhook handler
- `backend/routes/users-postgres.js` - Migrated users routes

## Files To Migrate

- [ ] `backend/routes/tasks.js` → Remove ethers.js, add Solana RPC
- [ ] `backend/routes/videos.js` → Update to PostgreSQL
- [ ] `backend/routes/images.js` → Update to PostgreSQL
- [ ] `backend/routes/likes.js` → Update to junction table pattern
- [ ] `backend/routes/comments.js` → Update to junction tables
- [ ] `backend/index.js` → Import new routes
- [ ] `backend/batch.js` → Update for Solana if needed

## Environment Variables

Update `.env`:
```bash
# Old
MONGO_URL=mongodb://...
MONGO_USERNAME=...
MONGO_PASSWORD=...

# New
DATABASE_URL=postgresql://user:pass@host:5432/tasksama

# Solana RPC
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=TaskSama11111111111111111111111111111111111

# Helius Webhook
HELIUS_WEBHOOK_SECRET=your_webhook_secret_here
HELIUS_API_KEY=your_api_key_here
```

## Deployment Steps

1. **Setup PostgreSQL**:
   ```bash
   createdb tasksama
   psql tasksama < backend/schema.sql
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Helius Webhook**:
   - Go to Helius Dashboard
   - Create webhook for your program ID
   - Point to: `https://yourdomain.com/helius-webhook`
   - Set webhook secret in `.env`

4. **Test locally**:
   ```bash
   npm run dev
   ```

5. **Migrate data** (if needed):
   ```bash
   node scripts/migrate-mongo-to-postgres.js
   ```

## Progress

- [x] PostgreSQL schema design (schema.sql)
- [x] Database connection module (db-postgres.js)
- [x] Webhook handler for Solana events (webhooks.js)
- [x] Users routes migrated (users-postgres.js)
- [x] Likes routes migrated (likes-postgres.js)
- [x] Images routes migrated (images-postgres.js)
- [x] Comments routes migrated (comments-postgres.js)
- [x] Environment config (.env.example)
- [x] Server entry point (index-postgres.js)
- [x] Documentation (README.md)
- [ ] Videos routes migrated
- [ ] Tasks routes migrated (minimal - most logic on-chain)
- [ ] Integration testing
- [ ] Production deployment

## Routes Completed

✅ **users-postgres.js** - Full Solana authentication
✅ **likes-postgres.js** - Junction table pattern for NFT likes
✅ **images-postgres.js** - Task image uploads with auth
✅ **comments-postgres.js** - Comments with upvote/downvote junction tables
✅ **webhooks.js** - Helius event processing

## Routes Remaining

🔄 **videos-postgres.js** - Participant video uploads
🔄 **tasks-postgres.js** - On-chain task queries (minimal backend logic)

---

**Date**: 2026-01-15
**Phase**: 4 (Backend Migration)
**Status**: 85% Complete
**Next**: Videos and tasks routes, then testing
