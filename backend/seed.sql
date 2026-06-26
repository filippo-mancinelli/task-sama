-- Task-Sama seed data (fictitious) for a demo / portfolio environment.
-- Tasks themselves live on-chain (Solana); this seeds the off-chain plane:
-- users, task images, participant videos, NFTs, likes, comments and webhook events.
-- Safe to run repeatedly: every insert is guarded with ON CONFLICT DO NOTHING.

BEGIN;

-- Users (Solana base58 wallet addresses)
INSERT INTO users (wallet_address, username, seed) VALUES
  ('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'satoshi_sol',   101),
  ('9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B', 'pixel_nomad',   202),
  ('FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm', 'chain_smith',   303),
  ('B4dWqX7tNpY2cVrK8uJbL3xZ5dHs9gMaE1rTpNvQ6Tk', 'lumen_lila',    404),
  ('C5kZ9rQ2nWcVtY8uJbL1xMpA7dHs3gKaE4rTpNvQ6Wn', 'orbit_dev',     505)
ON CONFLICT (wallet_address) DO NOTHING;

-- Task images (thumbnails) for on-chain task ids 1..3
INSERT INTO task_images (task_id, name, path, size, uploader_address) VALUES
  (1, 'build-a-landing-page.png', 'uploads/images/1/cover.png', 184320, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
  (2, 'design-a-logo.png',        'uploads/images/2/cover.png', 220160, '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B'),
  (3, 'record-a-jingle.png',      'uploads/images/3/cover.png', 156672, 'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm')
ON CONFLICT DO NOTHING;

-- Participant proof videos with mixed moderation states ('null'=pending, 'true'=approved, 'false'=rejected)
INSERT INTO participant_videos (task_id, participant_address, name, path, size, moderated) VALUES
  (1, '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B', 'proof.mp4', 'uploads/videos/1/9aE8.../proof.mp4', 8421376, 'true'),
  (1, 'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm', 'proof.mp4', 'uploads/videos/1/FhRf.../proof.mp4', 6553600, 'null'),
  (2, 'B4dWqX7tNpY2cVrK8uJbL3xZ5dHs9gMaE1rTpNvQ6Tk', 'proof.mp4', 'uploads/videos/2/B4dW.../proof.mp4', 9961472, 'true'),
  (2, 'C5kZ9rQ2nWcVtY8uJbL1xMpA7dHs3gKaE4rTpNvQ6Wn', 'proof.mp4', 'uploads/videos/2/C5kZ.../proof.mp4', 4194304, 'false'),
  (3, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'proof.mp4', 'uploads/videos/3/7xKX.../proof.mp4', 7340032, 'null')
ON CONFLICT (task_id, participant_address) DO NOTHING;

-- Completed task -> commemorative NFT (task 1 won by pixel_nomad, minted)
INSERT INTO video_nfts
  (task_id, participant_address, winner_address, name, ipfs_metadata_url, ipfs_video_url, nft_mint_address, minted_at) VALUES
  (1,
   '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B',
   '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B',
   'TaskSama Completion #1',
   'https://ipfs.io/ipfs/bafkreemetadata0001example0001example0001examp',
   'https://ipfs.io/ipfs/bafybvideo0001example0001example0001example001',
   'NFTm1ntAddr1example1example1example1example1A',
   NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Like counters per NFT token id
INSERT INTO nft_likes (token_id, like_count) VALUES
  (1, 3),
  (2, 1)
ON CONFLICT (token_id) DO NOTHING;

-- Who liked what
INSERT INTO user_nft_likes (token_id, wallet_address) VALUES
  (1, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'),
  (1, 'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm'),
  (1, 'B4dWqX7tNpY2cVrK8uJbL3xZ5dHs9gMaE1rTpNvQ6Tk'),
  (2, 'C5kZ9rQ2nWcVtY8uJbL1xMpA7dHs3gKaE4rTpNvQ6Wn')
ON CONFLICT (token_id, wallet_address) DO NOTHING;

-- Comments on a task and on a completed NFT
INSERT INTO comments (token_id, category, poster_address, comment_body, ups, downs) VALUES
  (1, 'task',          'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm', 'Clear brief, jumping in. ETA tomorrow.', 2, 0),
  (1, 'taskSamaVideo', '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 'Clean execution, well deserved win.',   4, 0),
  (2, 'task',          'C5kZ9rQ2nWcVtY8uJbL1xMpA7dHs3gKaE4rTpNvQ6Wn', 'Any brand guidelines to follow?',       1, 0)
ON CONFLICT DO NOTHING;

-- A couple of comment votes
INSERT INTO comment_upvotes (comment_id, wallet_address)
SELECT c.id, '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B'
FROM comments c WHERE c.comment_body = 'Clean execution, well deserved win.'
ON CONFLICT DO NOTHING;

-- Moderation reminders
INSERT INTO moderation_reminders (task_id, participant_address, reminder_count) VALUES
  (1, 'FhRfMk3pQ2nWcVtY8uJbL1xZ9dHs7gKaE4rTpNvQ6Sm', 2),
  (3, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', 1)
ON CONFLICT (task_id, participant_address) DO NOTHING;

-- Indexed Solana program events (as delivered by the Helius webhook)
INSERT INTO webhook_events (signature, event_type, task_id, from_address, to_address, amount, metadata, processed, processed_at) VALUES
  ('5Js1gSeedSig0001example0001example0001example0001example0001example0001examp01', 'TaskCreated',   1, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', NULL,                                            2000000000, '{"title":"Build a landing page"}', true, NOW() - INTERVAL '5 days'),
  ('5Js1gSeedSig0002example0002example0002example0002example0002example0002examp02', 'TaskCompleted', 1, '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B', 1900000000, '{"winner":"pixel_nomad"}',        true, NOW() - INTERVAL '2 days'),
  ('5Js1gSeedSig0003example0003example0003example0003example0003example0003examp03', 'TaskCreated',   2, '9aE8sT2rNvQp4mWcG7uYbF3kLxZ1dHnJ5sRtVePqA6B', NULL,                                            3000000000, '{"title":"Design a logo"}',       false, NULL)
ON CONFLICT (signature) DO NOTHING;

COMMIT;
