const Router = require('@koa/router');
const router = new Router();
const { query } = require('../db-postgres');
const nacl = require('tweetnacl');
const bs58 = require('bs58');
const sillyname = require('sillyname');
require('dotenv').config();

/* Verify Solana wallet signature
###############################################################
##################### verifySolanaSignature ####################
############################################################### */
function verifySolanaSignature(message, signature, publicKey) {
  try {
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/* Extract and verify auth token from Solana wallet
###############################################################
##################### verifySolanaAuth #########################
############################################################### */
async function verifySolanaAuth(ctx) {
  const authToken = ctx.headers['authorization'];

  if (!authToken) {
    ctx.throw(401, 'No authorization token provided');
  }

  try {
    // Auth token format: "message:signature:publicKey"
    const [message, signature, publicKey] = authToken.split(':');

    if (!message || !signature || !publicKey) {
      ctx.throw(401, 'Invalid token format');
    }

    // Verify signature
    const isValid = verifySolanaSignature(message, signature, publicKey);

    if (!isValid) {
      ctx.throw(401, 'Invalid signature');
    }

    // Check if message is not too old (e.g., within last 5 minutes)
    const timestamp = parseInt(message.split('Timestamp: ')[1]);
    const now = Date.now();
    if (now - timestamp > 5 * 60 * 1000) {
      ctx.throw(401, 'Token expired');
    }

    return publicKey; // Return the wallet address
  } catch (error) {
    console.error('Auth verification error:', error);
    ctx.throw(401, 'Invalid token', error);
  }
}

/*
###############################################################
######################### getUsers ############################
###############################################################
*/
router.get('/getUsers', async (ctx, next) => {
  if (ctx.request.path === '/getUsers') {
    console.log("\n ####################################### \n '/getUsers' " + new Date() + "\n ####################################### \n ");

    try {
      const result = await query('SELECT * FROM users ORDER BY created_at DESC');

      ctx.body = {
        message: 'Users fetched correctly.',
        data: result.rows,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to fetch users.', error);
    }
  }
  await next();
});

/*
###############################################################
####################### getUserData ###########################
###############################################################
*/
router.get('/getUserData', async (ctx, next) => {
  if (ctx.request.path === '/getUserData') {
    console.log("\n ####################################### \n '/getUserData' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);

    try {
      const result = await query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [walletAddress]
      );

      if (result.rows.length === 0) {
        ctx.throw(404, 'User not found.');
      }

      ctx.body = {
        message: 'User fetched correctly.',
        data: result.rows[0],
      };
    } catch (error) {
      if (error.status === 404) throw error;
      ctx.throw(500, 'Failed to fetch user.', error);
    }
  }
  await next();
});

/*
###############################################################
################### getUserDataByUsername #####################
###############################################################
*/
router.get('/getUserDataByUsername', async (ctx, next) => {
  if (ctx.request.path === '/getUserDataByUsername') {
    console.log("\n ####################################### \n '/getUserDataByUsername' " + new Date() + "\n ####################################### \n ");

    const username = ctx.request.query.username;

    try {
      const result = await query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (result.rows.length === 0) {
        ctx.throw(404, 'User not found.');
      }

      ctx.body = {
        message: 'User fetched correctly.',
        data: result.rows[0],
      };
    } catch (error) {
      if (error.status === 404) throw error;
      ctx.throw(500, 'Failed to fetch user.', error);
    }
  }
  await next();
});

/*
###############################################################
########################## verifyUser #########################
###############################################################
*/
router.post('/verifyUser', async (ctx, next) => {
  if (ctx.request.path === '/verifyUser') {
    console.log("\n ####################################### \n '/verifyUser' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);

    try {
      // Check if user exists
      let result = await query(
        'SELECT * FROM users WHERE wallet_address = $1',
        [walletAddress]
      );

      if (result.rows.length > 0) {
        ctx.body = {
          message: 'User verified correctly.',
          data: result.rows[0],
        };
        console.log('User verified correctly:', result.rows[0]);
      } else {
        // Create new user
        const seed = Math.round(Math.random() * 10000000);
        const username = sillyname();

        result = await query(
          `INSERT INTO users (wallet_address, username, seed)
          VALUES ($1, $2, $3)
          RETURNING *`,
          [walletAddress, username, seed]
        );

        ctx.body = {
          message: 'User created correctly.',
          data: result.rows[0],
        };
        console.log('User created correctly:', result.rows[0]);
      }
    } catch (error) {
      ctx.throw(500, 'Failed to verify/create user.', error);
    }
  }
  await next();
});

/*
###############################################################
######################## editUsername #########################
###############################################################
*/
router.post('/editUsername', async (ctx, next) => {
  if (ctx.request.path === '/editUsername') {
    console.log("\n ####################################### \n '/editUsername' " + new Date() + "\n ####################################### \n ");

    const walletAddress = await verifySolanaAuth(ctx);
    const username = ctx.request.body.username;

    if (!username || username.length < 2 || username.length > 25) {
      ctx.throw(400, 'Username must be between 2 and 25 characters long.');
    }

    try {
      // Check if username is already taken
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND wallet_address != $2',
        [username, walletAddress]
      );

      if (existingUser.rows.length > 0) {
        ctx.throw(400, 'Username already taken.');
      }

      // Update username
      const result = await query(
        `UPDATE users SET username = $1, updated_at = NOW()
        WHERE wallet_address = $2
        RETURNING username`,
        [username, walletAddress]
      );

      if (result.rows.length === 0) {
        ctx.throw(404, 'User not found.');
      }

      ctx.body = {
        message: 'Username updated correctly.',
        data: result.rows[0].username,
      };
    } catch (error) {
      if (error.status === 400 || error.status === 404) throw error;
      ctx.throw(500, 'Failed to update username.', error);
    }
  }
  await next();
});

module.exports = router;
