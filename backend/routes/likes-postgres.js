const Router = require('@koa/router');
const router = new Router();
const { query, getClient } = require('../db-postgres');

/* Fetch likes metadata for all NFTs
###############################################################
####################### initLikes #############################
############################################################### */
router.post('/initLikes', async (ctx, next) => {
  if (ctx.request.path === '/initLikes') {
    console.log("\n ####################################### \n '/initLikes' " + new Date() + "\n ####################################### \n ");

    const walletAddress = ctx.request.body.walletAddress;

    try {
      let queryText = `
        SELECT
          nl.token_id,
          nl.like_count as likes,
          COALESCE(
            json_agg(unl.wallet_address) FILTER (WHERE unl.wallet_address IS NOT NULL),
            '[]'
          ) as like_wallets
        FROM nft_likes nl
        LEFT JOIN user_nft_likes unl ON nl.token_id = unl.token_id
        GROUP BY nl.token_id, nl.like_count
        ORDER BY nl.token_id DESC
      `;

      const result = await query(queryText);

      // Add isLiked flag for each NFT
      const documents = result.rows.map(row => ({
        tokenId: row.token_id.toString(),
        likes: row.likes,
        likeWallets: row.like_wallets,
        isLiked: walletAddress ? row.like_wallets.includes(walletAddress) : false
      }));

      ctx.body = {
        message: 'likes metadata',
        data: documents,
      };
    } catch (error) {
      console.error('Error fetching likes:', error);
      ctx.throw(500, 'Failed to fetch likes metadata', error);
    }
  }
  await next();
});

/* Update like count for an NFT
###############################################################
####################### like ##################################
###############################################################
*/
router.post('/like', async (ctx, next) => {
  if (ctx.request.path === '/like') {
    console.log("\n ####################################### \n '/like' " + new Date() + "\n ####################################### \n ");

    const tokenId = ctx.request.body.tokenId;
    const isLiked = ctx.request.body.isLiked;
    const walletAddress = ctx.request.body.walletAddress;

    if (!tokenId || isLiked === undefined || !walletAddress) {
      ctx.throw(400, 'Missing required fields: tokenId, isLiked, walletAddress');
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      if (isLiked) {
        // Add like
        // First, check if already liked
        const existingLike = await client.query(
          'SELECT id FROM user_nft_likes WHERE token_id = $1 AND wallet_address = $2',
          [tokenId, walletAddress]
        );

        if (existingLike.rows.length > 0) {
          await client.query('ROLLBACK');
          ctx.throw(400, 'Already liked this NFT');
        }

        // Insert like
        await client.query(
          'INSERT INTO user_nft_likes (token_id, wallet_address) VALUES ($1, $2)',
          [tokenId, walletAddress]
        );

        // Increment count
        await client.query(
          'UPDATE nft_likes SET like_count = like_count + 1, updated_at = NOW() WHERE token_id = $1',
          [tokenId]
        );
      } else {
        // Remove like
        const deleteResult = await client.query(
          'DELETE FROM user_nft_likes WHERE token_id = $1 AND wallet_address = $2',
          [tokenId, walletAddress]
        );

        if (deleteResult.rowCount === 0) {
          await client.query('ROLLBACK');
          ctx.throw(400, 'Like not found');
        }

        // Decrement count
        await client.query(
          'UPDATE nft_likes SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW() WHERE token_id = $1',
          [tokenId]
        );
      }

      // Get updated like count
      const result = await client.query(
        'SELECT like_count FROM nft_likes WHERE token_id = $1',
        [tokenId]
      );

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        ctx.throw(404, 'NFT not found in likes table');
      }

      ctx.body = result.rows[0].like_count.toString();
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating like:', error);
      if (error.status === 400 || error.status === 404) throw error;
      ctx.throw(500, 'Failed to update like count', error);
    } finally {
      client.release();
    }
  }
  await next();
});

/* Initialize NFT like document
###############################################################
################ addNewNftLikeDocument ########################
###############################################################
*/
router.post('/addNewNftLikeDocument', async (ctx, next) => {
  if (ctx.request.path === '/addNewNftLikeDocument') {
    console.log("\n ####################################### \n '/addNewNftLikeDocument' " + new Date() + "\n ####################################### \n ");

    const tokenId = ctx.request.body.tokenId;

    if (!tokenId) {
      ctx.throw(400, 'Missing required field: tokenId');
    }

    try {
      const result = await query(
        `INSERT INTO nft_likes (token_id, like_count)
        VALUES ($1, 0)
        ON CONFLICT (token_id) DO NOTHING
        RETURNING *`,
        [tokenId]
      );

      if (result.rows.length === 0) {
        // Already exists
        const existing = await query(
          'SELECT * FROM nft_likes WHERE token_id = $1',
          [tokenId]
        );
        ctx.body = {
          message: 'NFT like document already exists',
          data: existing.rows[0]
        };
      } else {
        ctx.body = {
          message: 'NFT like document created',
          data: result.rows[0]
        };
      }
    } catch (error) {
      console.error('Error creating NFT like document:', error);
      ctx.throw(500, 'Failed to create NFT like document', error);
    }
  }
  await next();
});

/* Get like count for specific NFT
###############################################################
####################### getLikeCount ###########################
###############################################################
*/
router.get('/getLikeCount', async (ctx, next) => {
  if (ctx.request.path === '/getLikeCount') {
    const tokenId = ctx.request.query.tokenId;

    if (!tokenId) {
      ctx.throw(400, 'Missing required parameter: tokenId');
    }

    try {
      const result = await query(
        'SELECT token_id, like_count FROM nft_likes WHERE token_id = $1',
        [tokenId]
      );

      if (result.rows.length === 0) {
        ctx.body = {
          message: 'NFT not found',
          data: { tokenId, likes: 0 }
        };
      } else {
        ctx.body = {
          message: 'Like count fetched',
          data: {
            tokenId: result.rows[0].token_id,
            likes: result.rows[0].like_count
          }
        };
      }
    } catch (error) {
      console.error('Error fetching like count:', error);
      ctx.throw(500, 'Failed to fetch like count', error);
    }
  }
  await next();
});

module.exports = router;
