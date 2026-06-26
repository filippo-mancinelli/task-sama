-- Task-Sama PostgreSQL Schema
-- Migration from MongoDB to PostgreSQL for Solana version

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) UNIQUE NOT NULL, -- Solana address (base58, 32-44 chars)
    username VARCHAR(25) UNIQUE NOT NULL,
    seed INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_username ON users(username);

-- Task images table
CREATE TABLE task_images (
    id SERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    uploader_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_images_task_id ON task_images(task_id);
CREATE INDEX idx_task_images_uploader ON task_images(uploader_address);

-- Participant videos table
CREATE TABLE participant_videos (
    id SERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    participant_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    moderated VARCHAR(10) DEFAULT 'null', -- 'null', 'true', 'false'
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, participant_address)
);

CREATE INDEX idx_videos_task_id ON participant_videos(task_id);
CREATE INDEX idx_videos_participant ON participant_videos(participant_address);
CREATE INDEX idx_videos_moderated ON participant_videos(moderated);

-- Video NFTs table (equivalent to IPFSvideos in Mongo)
CREATE TABLE video_nfts (
    id SERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    participant_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
    winner_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address),
    name VARCHAR(255) NOT NULL,
    ipfs_metadata_url TEXT,
    ipfs_video_url TEXT,
    nft_mint_address VARCHAR(44), -- populated after minting
    minted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_nfts_task ON video_nfts(task_id);
CREATE INDEX idx_video_nfts_winner ON video_nfts(winner_address);


-- NFT likes table
CREATE TABLE nft_likes (
    id SERIAL PRIMARY KEY,
    token_id BIGINT UNIQUE NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nft_likes_token_id ON nft_likes(token_id);

-- User likes junction table
CREATE TABLE user_nft_likes (
    id SERIAL PRIMARY KEY,
    token_id BIGINT NOT NULL REFERENCES nft_likes(token_id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_id, wallet_address)
);

CREATE INDEX idx_user_likes_token ON user_nft_likes(token_id);
CREATE INDEX idx_user_likes_wallet ON user_nft_likes(wallet_address);

-- Comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    token_id BIGINT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'task' or 'taskSamaVideo'
    poster_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    comment_body TEXT NOT NULL,
    ups INTEGER DEFAULT 0,
    downs INTEGER DEFAULT 0,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (LENGTH(comment_body) <= 1000)
);

CREATE INDEX idx_comments_token_category ON comments(token_id, category);
CREATE INDEX idx_comments_poster ON comments(poster_address);

-- Comment upvotes junction table
CREATE TABLE comment_upvotes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, wallet_address)
);

CREATE INDEX idx_upvotes_comment ON comment_upvotes(comment_id);

-- Comment downvotes junction table
CREATE TABLE comment_downvotes (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(comment_id, wallet_address)
);

CREATE INDEX idx_downvotes_comment ON comment_downvotes(comment_id);

-- Moderation reminders table
CREATE TABLE moderation_reminders (
    id SERIAL PRIMARY KEY,
    task_id BIGINT NOT NULL,
    participant_address VARCHAR(44) NOT NULL REFERENCES users(wallet_address) ON DELETE CASCADE,
    reminder_count INTEGER DEFAULT 1,
    last_reminded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id, participant_address)
);

CREATE INDEX idx_reminders_task ON moderation_reminders(task_id);

-- Helius webhook events table (for Solana event tracking)
CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    signature VARCHAR(88) UNIQUE NOT NULL, -- Solana transaction signature
    event_type VARCHAR(50) NOT NULL, -- 'TaskCreated', 'ParticipantAdded', 'TaskCompleted', etc.
    task_id BIGINT,
    from_address VARCHAR(44),
    to_address VARCHAR(44),
    amount BIGINT,
    metadata JSONB, -- Store full event data
    processed BOOLEAN DEFAULT false,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_webhook_events_signature ON webhook_events(signature);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_task_id ON webhook_events(task_id);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_likes_updated_at BEFORE UPDATE ON nft_likes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
