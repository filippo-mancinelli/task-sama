const Router = require('@koa/router');
const router = new Router();
const { query } = require('../db-postgres');
const crypto = require('crypto');
require('dotenv').config();

/* Helius webhook endpoint for Solana program events
###############################################################
###################### heliusWebhook ###########################
############################################################### */
router.post('/helius-webhook', async (ctx, next) => {
  if (ctx.request.path === '/helius-webhook') {
    console.log("\n ####################################### \n '/helius-webhook' " + new Date() + "\n ####################################### \n ");

    // Verify webhook signature if HELIUS_WEBHOOK_SECRET is set
    if (process.env.HELIUS_WEBHOOK_SECRET) {
      const signature = ctx.headers['x-helius-signature'];
      const body = JSON.stringify(ctx.request.body);

      const hmac = crypto.createHmac('sha256', process.env.HELIUS_WEBHOOK_SECRET);
      const expectedSignature = hmac.update(body).digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        ctx.throw(401, 'Invalid signature');
      }
    }

    const events = ctx.request.body;
    console.log('Received webhook events:', JSON.stringify(events, null, 2));

    try {
      // Process each event
      for (const event of events) {
        await processEvent(event);
      }

      ctx.body = {
        message: 'Webhook processed successfully',
        eventsProcessed: events.length
      };
    } catch (error) {
      console.error('Error processing webhook:', error);
      ctx.throw(500, 'Failed to process webhook', error);
    }
  }
  await next();
});

/* Process individual Solana event
###############################################################
##################### processEvent #############################
############################################################### */
async function processEvent(event) {
  const { signature, type, transaction, timestamp } = event;

  // Check if event already processed
  const existing = await query(
    'SELECT id FROM webhook_events WHERE signature = $1',
    [signature]
  );

  if (existing.rows.length > 0) {
    console.log(`Event ${signature} already processed, skipping`);
    return;
  }

  // Parse event based on type
  let eventType = 'UNKNOWN';
  let taskId = null;
  let fromAddress = null;
  let toAddress = null;
  let amount = null;
  let metadata = event;

  // Detect event type from transaction instructions
  if (transaction && transaction.message) {
    const instructions = transaction.message.instructions || [];

    for (const instruction of instructions) {
      // Check if it's our program
      if (instruction.programId === process.env.PROGRAM_ID) {
        // Parse instruction data to determine event type
        // This is simplified - you'll need to decode based on your program's instruction format
        const data = Buffer.from(instruction.data, 'base64');

        // Example discriminator parsing (first 8 bytes typically)
        const discriminator = data.slice(0, 8);

        // Map discriminators to event types (these are examples)
        // You'll need to match these with your Anchor program's discriminators
        if (discriminator.toString('hex') === '0000000000000000') {
          eventType = 'TaskCreated';
          // Parse task_id from remaining data
        } else if (discriminator.toString('hex') === '0100000000000000') {
          eventType = 'ParticipantAdded';
        } else if (discriminator.toString('hex') === '0200000000000000') {
          eventType = 'TaskCompleted';
        } else if (discriminator.toString('hex') === '0300000000000000') {
          eventType = 'VideoApproved';
        }

        // Extract accounts from instruction
        if (instruction.accounts && instruction.accounts.length > 0) {
          fromAddress = instruction.accounts[0]; // Usually the signer
          if (instruction.accounts.length > 1) {
            toAddress = instruction.accounts[1];
          }
        }
      }
    }
  }

  // Store event in database
  await query(
    `INSERT INTO webhook_events
    (signature, event_type, task_id, from_address, to_address, amount, metadata, processed, received_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
    [
      signature,
      eventType,
      taskId,
      fromAddress,
      toAddress,
      amount,
      JSON.stringify(metadata),
      false // Not processed yet
    ]
  );

  console.log(`Stored event ${signature} with type ${eventType}`);

  // Optionally process event immediately
  await handleEvent(eventType, {
    signature,
    taskId,
    fromAddress,
    toAddress,
    amount,
    metadata
  });
}

/* Handle specific event types
###############################################################
##################### handleEvent ##############################
############################################################### */
async function handleEvent(eventType, data) {
  console.log(`Handling event type: ${eventType}`);

  switch (eventType) {
    case 'TaskCreated':
      // Auto-create NFT like document for future task completion
      if (data.taskId) {
        await query(
          'INSERT INTO nft_likes (token_id, like_count) VALUES ($1, 0) ON CONFLICT (token_id) DO NOTHING',
          [data.taskId]
        );
        console.log(`Created like document for task ${data.taskId}`);
      }
      break;

    case 'ParticipantAdded':
      // Could send notification, update cache, etc.
      console.log(`Participant ${data.fromAddress} added to task ${data.taskId}`);
      break;

    case 'TaskCompleted':
      // Auto-create NFT like document when task is completed
      if (data.taskId) {
        await query(
          'INSERT INTO nft_likes (token_id, like_count) VALUES ($1, 0) ON CONFLICT (token_id) DO NOTHING',
          [data.taskId]
        );
        console.log(`Task ${data.taskId} completed, NFT minted`);
      }
      break;

    case 'VideoApproved':
      // Update video moderation status
      console.log(`Video approved for task ${data.taskId}`);
      break;

    default:
      console.log(`Unknown event type: ${eventType}`);
  }

  // Mark event as processed
  await query(
    'UPDATE webhook_events SET processed = true, processed_at = NOW() WHERE signature = $1',
    [data.signature]
  );
}

/* Get webhook events (admin endpoint)
###############################################################
##################### getWebhookEvents #########################
############################################################### */
router.get('/webhook-events', async (ctx, next) => {
  if (ctx.request.path === '/webhook-events') {
    console.log("\n ####################################### \n '/webhook-events' " + new Date() + "\n ####################################### \n ");

    const limit = parseInt(ctx.request.query.limit) || 50;
    const offset = parseInt(ctx.request.query.offset) || 0;
    const processed = ctx.request.query.processed;

    let queryText = 'SELECT * FROM webhook_events';
    const params = [];

    if (processed !== undefined) {
      queryText += ' WHERE processed = $1';
      params.push(processed === 'true');
    }

    queryText += ' ORDER BY received_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    try {
      const result = await query(queryText, params);

      ctx.body = {
        message: 'Webhook events fetched successfully',
        data: result.rows,
        count: result.rowCount
      };
    } catch (error) {
      ctx.throw(500, 'Failed to fetch webhook events', error);
    }
  }
  await next();
});

module.exports = router;
