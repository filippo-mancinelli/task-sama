# Task-Sama Backend - Solana Version

Modern backend for Task-Sama built with:
- **Koa.js** - Lightweight web framework
- **PostgreSQL** - Relational database with ACID compliance
- **Helius** - Real-time Solana event webhooks
- **Solana Web3.js** - Blockchain interaction

## Quick Start

### Prerequisites
- Node.js >= 16
- PostgreSQL >= 14
- Helius API key (for webhooks)

### Installation

```bash
# Install dependencies
npm install

# Setup database
createdb tasksama
psql tasksama < schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your values

# Start server
npm run dev
```

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `SOLANA_RPC_URL` - Solana RPC endpoint
- `PROGRAM_ID` - Your deployed Solana program ID
- `HELIUS_API_KEY` - Helius API key
- `HELIUS_WEBHOOK_SECRET` - Webhook signature verification secret
- `FILEBASE_API_TOKEN` - IPFS storage token

## Database Schema

Run `psql tasksama < schema.sql` to create:

- **users** - User profiles with Solana addresses
- **task_images** - Task cover images
- **participant_videos** - Video submissions
- **nft_likes** - NFT like counts
- **user_nft_likes** - User-NFT like relationships
- **comments** - Task/video comments
- **comment_upvotes/downvotes** - Vote relationships
- **moderation_reminders** - Video moderation reminders
- **webhook_events** - Solana event log

## API Routes

### Authentication
All protected routes require Solana signature authentication:
```
Authorization: message:signature:publicKey
```

Where:
- `message` = "Sign this message to authenticate. Timestamp: {timestamp}"
- `signature` = Base58 encoded signature
- `publicKey` = Base58 encoded public key

### Endpoints

#### Users
- `GET /getUsers` - List all users
- `GET /getUserData` - Get current user (auth required)
- `GET /getUserDataByUsername?username=...` - Get user by username
- `POST /verifyUser` - Login/register (auth required)
- `POST /editUsername` - Update username (auth required)

#### Likes
- `POST /initLikes` - Get all NFT likes with user's like status
- `POST /like` - Like/unlike an NFT
- `POST /addNewNftLikeDocument` - Create like document for new NFT
- `GET /getLikeCount?tokenId=...` - Get like count for NFT

#### Images
- `POST /uploadImageToDB` - Upload task image (auth required)
- `GET /fetchTasksImages` - Get all task images
- `GET /fetchTaskImage?taskId=...` - Get image for specific task

#### Comments
- `GET /getComments?tokenId=...&category=...` - Get comments
- `POST /postComment` - Post comment (auth required)
- `POST /deleteComment` - Delete comment (auth required)
- `POST /upComment` - Upvote/remove upvote (auth required)
- `POST /downComment` - Downvote/remove downvote (auth required)

#### Webhooks
- `POST /helius-webhook` - Helius event receiver (signature verified)
- `GET /webhook-events?limit=50&offset=0&processed=false` - View webhook log

### Health Check
- `GET /health` - Server health status

## Helius Webhook Setup

1. Go to [Helius Dashboard](https://dashboard.helius.dev)
2. Create new webhook
3. Configure:
   - **Webhook Type**: Enhanced
   - **Account Addresses**: Your program ID
   - **Transaction Types**: All
   - **Webhook URL**: `https://yourdomain.com/helius-webhook`
4. Copy webhook secret to `.env`

## Architecture

### Request Flow
```
Client → Koa Server → Route Handler → PostgreSQL
                    ↑
Helius Webhook -----+
```

### Event Processing
```
Solana Blockchain
    ↓ (tx occurs)
Helius Indexer
    ↓ (webhook)
POST /helius-webhook
    ↓
Store in webhook_events table
    ↓
processEvent() - Parse & handle
    ↓
Update relevant tables
```

### Authentication Flow
```
1. Client generates message with timestamp
2. Client signs with Solana wallet
3. Client sends: message:signature:publicKey
4. Server verifies signature with tweetnacl
5. Server checks timestamp (5min expiry)
6. Server returns user data or creates account
```

## File Structure

```
backend/
├── index-postgres.js      # Main server (PostgreSQL version)
├── db-postgres.js         # Database connection pool
├── schema.sql             # Database schema
├── package.json
├── .env.example
└── routes/
    ├── webhooks.js              # Helius event receiver
    ├── users-postgres.js        # User management
    ├── likes-postgres.js        # NFT likes
    ├── images-postgres.js       # Task images
    ├── comments-postgres.js     # Comments system
    ├── videos-postgres.js       # TODO: Video uploads
    └── tasks-postgres.js        # TODO: Task queries
```

## Development

```bash
# Run with auto-reload
npm run dev

# Run production
npm start

# Database migration
npm run migrate

# View logs
tail -f logs/app.log
```

## Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test webhook (requires signature)
curl -X POST http://localhost:3000/helius-webhook \
  -H "Content-Type: application/json" \
  -H "x-helius-signature: your_signature" \
  -d @test-webhook.json
```

## Production Deployment

1. **Database**: Use managed PostgreSQL (e.g., RDS, Supabase, Render)
2. **Server**: Deploy to VPS, Heroku, or Fly.io
3. **SSL**: Configure certificates or use reverse proxy
4. **Monitoring**: Add logging (Winston, Pino)
5. **Helius**: Update webhook URL to production domain

### Example Render Deploy

```yaml
# render.yaml
services:
  - type: web
    name: tasksama-backend
    env: node
    buildCommand: npm install
    startCommand: node index-postgres.js
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SOLANA_RPC_URL
        value: https://api.mainnet-beta.solana.com
```

## Migration from MongoDB

See [`../docs/BACKEND_MIGRATION.md`](../docs/BACKEND_MIGRATION.md) for details on migrating from the old MongoDB version.

Key changes:
- MongoDB → PostgreSQL
- Ethers.js → @solana/web3.js
- EVM polling → Helius webhooks
- web3-token → tweetnacl signatures

## Troubleshooting

**Database connection error**:
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

**Webhook not receiving events**:
- Check Helius dashboard for delivery status
- Verify webhook URL is publicly accessible
- Check signature verification in logs

**Auth failures**:
- Verify message format includes timestamp
- Check signature is base58 encoded
- Ensure public key matches signer

## License

ISC
