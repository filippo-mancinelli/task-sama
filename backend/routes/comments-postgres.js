const Router = require('@koa/router');
const router = new Router();
const { query, getClient } = require('../db-postgres');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
require('dotenv').config();

/* Verify Solana auth */
function verifySolanaSignature(message, signature, publicKey) {
  try {
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    return false;
  }
}

async function verifySolanaAuth(ctx) {
  const authToken = ctx.headers['authorization'];
  if (!authToken) ctx.throw(401, 'No authorization token');

  const [message, signature, publicKey] = authToken.split(':');
  if (!message || !signature || !publicKey) ctx.throw(401, 'Invalid token format');

  const isValid = verifySolanaSignature(message, signature, publicKey);
  if (!isValid) ctx.throw(401, 'Invalid signature');

  const timestamp = parseInt(message.split('Timestamp: ')[1]);
  if (Date.now() - timestamp > 5 * 60 * 1000) ctx.throw(401, 'Token expired');

  return publicKey;
}

/*
###############################################################
######################### getComments #########################
###############################################################
*/
router.get('/getComments', async (ctx, next) => {
  if (ctx.request.path === '/getComments') {
    console.log("\n ####################################### \n '/getComments' " + new Date() + "\n ####################################### \n ");

    const tokenId = ctx.request.query.tokenId;
    const category = ctx.request.query.category;

    if (!tokenId || !category) {
      ctx.throw(400, 'Missing required parameters: tokenId, category');
    }

    try {
      // Fetch comments with user info
      const result = await query(
        `SELECT
          c.id,
          c.token_id,
          c.category,
          c.poster_address,
          c.comment_body,
          c.ups,
          c.downs,
          c.posted_at,
          u.username,
          u.seed
        FROM comments c
        JOIN users u ON c.poster_address = u.wallet_address
        WHERE c.token_id = $1 AND c.category = $2
        ORDER BY c.posted_at DESC`,
        [tokenId, category]
      );

      if (result.rows.length === 0) {
        ctx.body = {
          message: 'No comments found.',
        };
      } else {
        // Format data to match old MongoDB format
        const comments = result.rows.map(row => ({
          _id: row.id,
          tokenId: row.token_id.toString(),
          category: row.category,
          posterAddress: row.poster_address,
          commentBody: row.comment_body,
          ups: row.ups,
          downs: row.downs,
          postDate: row.posted_at,
          username: row.username,
          seed: row.seed
        }));

        ctx.body = {
          message: 'Comments fetched correctly.',
          data: comments,
        };
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      ctx.throw(500, 'Failed to fetch comments', error);
    }
  }
  await next();
});

/*
###############################################################
######################### postComment #########################
###############################################################
*/
router.post('/postComment', async (ctx, next) => {
  if (ctx.request.path === '/postComment') {
    console.log("\n ####################################### \n '/postComment' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);
    const tokenId = ctx.request.body.tokenId;
    const commentBody = ctx.request.body.commentBody;
    const category = ctx.request.body.category;

    if (!tokenId || !commentBody || !category) {
      ctx.throw(400, 'Missing required fields');
    }

    if (commentBody.length > 1000) {
      ctx.throw(400, 'Comment body too long (max 1000 characters)');
    }

    try {
      const result = await query(
        `INSERT INTO comments (token_id, category, poster_address, comment_body)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [tokenId, category, walletAddress, commentBody]
      );

      // Fetch username and seed
      const userResult = await query(
        'SELECT username, seed FROM users WHERE wallet_address = $1',
        [walletAddress]
      );

      const comment = {
        _id: result.rows[0].id,
        tokenId: result.rows[0].token_id.toString(),
        posterAddress: result.rows[0].poster_address,
        commentBody: result.rows[0].comment_body,
        ups: result.rows[0].ups,
        downs: result.rows[0].downs,
        postDate: result.rows[0].posted_at,
        category: result.rows[0].category,
        username: userResult.rows[0].username,
        seed: userResult.rows[0].seed
      };

      console.log("Comment inserted:", comment);

      ctx.body = {
        message: 'Comment posted and saved successfully.',
        data: comment,
      };
    } catch (error) {
      console.error('Error posting comment:', error);
      ctx.throw(500, 'Failed to post comment', error);
    }
  }
  await next();
});

/*
###############################################################
####################### deleteComment #########################
###############################################################
*/
router.post('/deleteComment', async (ctx, next) => {
  if (ctx.request.path === '/deleteComment') {
    console.log("\n ####################################### \n '/deleteComment' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);
    const commentId = ctx.request.body.commentId;

    if (!commentId) {
      ctx.throw(400, 'Missing required field: commentId');
    }

    try {
      // Check ownership
      const ownerCheck = await query(
        'SELECT id FROM comments WHERE id = $1 AND poster_address = $2',
        [commentId, walletAddress]
      );

      if (ownerCheck.rows.length === 0) {
        ctx.throw(401, 'Unauthorized to delete this comment');
      }

      // Delete comment (cascading will delete votes)
      const result = await query(
        'DELETE FROM comments WHERE id = $1',
        [commentId]
      );

      if (result.rowCount === 0) {
        ctx.throw(400, 'Unable to delete comment');
      }

      ctx.body = {
        message: 'Comment deleted successfully.',
        data: { deletedCount: result.rowCount }
      };
    } catch (error) {
      if (error.status === 401 || error.status === 400) throw error;
      console.error('Error deleting comment:', error);
      ctx.throw(500, 'Failed to delete comment', error);
    }
  }
  await next();
});

/*
###############################################################
########################## upComment ##########################
###############################################################
*/
router.post('/upComment', async (ctx, next) => {
  if (ctx.request.path === '/upComment') {
    console.log("\n ####################################### \n '/upComment' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);
    const commentId = ctx.request.body.commentId;
    const isUp = ctx.request.body.isUp;

    if (!commentId || isUp === undefined) {
      ctx.throw(400, 'Missing required fields');
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if already upvoted
      const existingVote = await client.query(
        'SELECT id FROM comment_upvotes WHERE comment_id = $1 AND wallet_address = $2',
        [commentId, walletAddress]
      );

      if (isUp && existingVote.rows.length > 0) {
        await client.query('ROLLBACK');
        ctx.throw(400, 'Already upvoted');
      }

      if (!isUp && existingVote.rows.length === 0) {
        await client.query('ROLLBACK');
        ctx.throw(400, "Can't remove an upvote you haven't made");
      }

      if (isUp) {
        // Add upvote
        await client.query(
          'INSERT INTO comment_upvotes (comment_id, wallet_address) VALUES ($1, $2)',
          [commentId, walletAddress]
        );
        await client.query(
          'UPDATE comments SET ups = ups + 1 WHERE id = $1',
          [commentId]
        );
      } else {
        // Remove upvote
        await client.query(
          'DELETE FROM comment_upvotes WHERE comment_id = $1 AND wallet_address = $2',
          [commentId, walletAddress]
        );
        await client.query(
          'UPDATE comments SET ups = GREATEST(ups - 1, 0) WHERE id = $1',
          [commentId]
        );
      }

      // Get updated comment
      const result = await client.query(
        'SELECT * FROM comments WHERE id = $1',
        [commentId]
      );

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        ctx.throw(404, 'Comment not found');
      }

      const comment = result.rows[0];
      ctx.body = {
        _id: comment.id,
        ups: comment.ups,
        downs: comment.downs,
        isUp: isUp
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.status === 400 || error.status === 404) throw error;
      console.error('Error updating upvote:', error);
      ctx.throw(500, 'Failed to update comment upvote', error);
    } finally {
      client.release();
    }
  }
  await next();
});

/*
###############################################################
######################### downComment #########################
###############################################################
*/
router.post('/downComment', async (ctx, next) => {
  if (ctx.request.path === '/downComment') {
    console.log("\n ####################################### \n '/downComment' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);
    const commentId = ctx.request.body.commentId;
    const isDown = ctx.request.body.isDown;

    if (!commentId || isDown === undefined) {
      ctx.throw(400, 'Missing required fields');
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Check if already downvoted
      const existingVote = await client.query(
        'SELECT id FROM comment_downvotes WHERE comment_id = $1 AND wallet_address = $2',
        [commentId, walletAddress]
      );

      if (isDown && existingVote.rows.length > 0) {
        await client.query('ROLLBACK');
        ctx.throw(400, 'Already downvoted');
      }

      if (!isDown && existingVote.rows.length === 0) {
        await client.query('ROLLBACK');
        ctx.throw(400, "Can't remove a downvote you haven't made");
      }

      if (isDown) {
        // Add downvote
        await client.query(
          'INSERT INTO comment_downvotes (comment_id, wallet_address) VALUES ($1, $2)',
          [commentId, walletAddress]
        );
        await client.query(
          'UPDATE comments SET downs = downs + 1 WHERE id = $1',
          [commentId]
        );
      } else {
        // Remove downvote
        await client.query(
          'DELETE FROM comment_downvotes WHERE comment_id = $1 AND wallet_address = $2',
          [commentId, walletAddress]
        );
        await client.query(
          'UPDATE comments SET downs = GREATEST(downs - 1, 0) WHERE id = $1',
          [commentId]
        );
      }

      // Get updated comment
      const result = await client.query(
        'SELECT * FROM comments WHERE id = $1',
        [commentId]
      );

      await client.query('COMMIT');

      if (result.rows.length === 0) {
        ctx.throw(404, 'Comment not found');
      }

      const comment = result.rows[0];
      ctx.body = {
        _id: comment.id,
        ups: comment.ups,
        downs: comment.downs,
        isDown: isDown
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.status === 400 || error.status === 404) throw error;
      console.error('Error updating downvote:', error);
      ctx.throw(500, 'Failed to update comment downvote', error);
    } finally {
      client.release();
    }
  }
  await next();
});

module.exports = router;
