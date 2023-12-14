const { connectToDatabase } = require('../db');
const Router = require('@koa/router');
const router = new Router();
const { ObjectId } = require('mongodb');
require('dotenv').config();


/* 
###############################################################
######################### getComments #########################
############################################################### 
*/
router.get('/getComments', async (ctx, next) => {
    if (ctx.request.path === '/getComments') {
      console.log("\n ####################################### \n '/getComments' " + new Date() + "\n ####################################### \n ");
  
      const tokenId = ctx.request.query.tokenId;
      const db = await connectToDatabase();
      const collection = db.collection('comments');
  
      try {
        const documents = await collection.find({'tokenId': tokenId}).toArray();
        console.log("comments retrieved:", documents);
        
        if(documents.length === 0){
          ctx.body = {
            message: 'No comments found.',
          };
        } else {
          ctx.body = {
            message: 'Comments fetched correctly.',
            data: documents,
          };
        }
      } catch (error) {
        ctx.throw(500, 'Failed to fetch comments.', error);
      }
    }
    await next();
  
    if (ctx.status === 404) {
      ctx.body = {
        message: 'Not found',
      };
    }
  });



/* 
###############################################################
######################### postComment #########################
############################################################### 
*/
router.post('/postComment', async (ctx, next) => {
  if (ctx.request.path === '/postComment') {
    console.log("\n ####################################### \n '/postComment' " + new Date() + "\n ####################################### \n ");
  
    const tokenId = ctx.request.body.tokenId;
    const commentBody = ctx.request.body.commentBody;
    const walletAddress = ctx.headers['x-wallet-address'];
    const currentDate = new Date();
    const formattedDate = formatDateToString(currentDate);

    try {
      const db = await connectToDatabase();
      const collection = db.collection('comments');
      

      const commentData = {
        tokenId: tokenId,
        posterAddress: walletAddress,
        commentBody: commentBody,
        ups: 0,
        downs: 0,
        upsAddresses: [],
        downsAddresses: [],
        postDate: formattedDate
      };

      await collection.insertOne(commentData);
      console.log("doc inserted:", commentData);

      ctx.body = {
        message: 'Comment posted and saved successfully.',
        data: commentData,
      };
    } catch (error) {
      ctx.throw(500, 'Failed to post comment: ', error);
    }
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});

/* 
###############################################################
########################## upComment ##########################
############################################################### 
*/
router.post('/upComment', async (ctx, next) => {
  if (ctx.request.path === '/upComment') {
    console.log("\n ####################################### \n '/upComment' " + new Date() + "\n ####################################### \n ");
  
    // Ensure the commentId is converted to ObjectId if using MongoDB's default ObjectId
    const commentId = new ObjectId(ctx.request.body.commentId); 
    const isUp = ctx.request.body.isUp;
    const walletAddress = ctx.headers['x-wallet-address'];

    try {
      const db = await connectToDatabase();
      const collection = db.collection('comments');
      
      const updateQuery = {};
      if (isUp) {
        updateQuery.$push = { upsAddresses: walletAddress };
        updateQuery.$inc = { ups: 1 };
      } else {
        updateQuery.$pull = { upsAddresses: walletAddress };
        updateQuery.$inc = { ups: -1 };
      }
      
      const result = await collection.updateOne({ _id: commentId }, updateQuery);
      
      if (result.modifiedCount === 1) {
        var updatedComment = await collection.findOne({ _id: commentId });
        updatedComment.isUp = isUp;
        ctx.body = updatedComment;
      } else {
        ctx.throw(400, 'Unable to update comment');
      }
    } catch (error) {
      ctx.throw(500, 'Failed to up comment: ' + error.message);
    }
  }

  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});


/* 
###############################################################
######################### downComment #########################
############################################################### 
*/
router.post('/downComment', async (ctx, next) => {
  if (ctx.request.path === '/downComment') {
    console.log("\n ####################################### \n '/downComment' " + new Date() + "\n ####################################### \n ");
  
    // Ensure the commentId is converted to ObjectId if using MongoDB's default ObjectId
    const commentId = new ObjectId(ctx.request.body.commentId); 
    const isDown = ctx.request.body.isDown;
    const walletAddress = ctx.headers['x-wallet-address'];

    try {
      const db = await connectToDatabase();
      const collection = db.collection('comments');

      // Find the comment document by ID and increment/decrement the up count by 1 and push/pull walletAssociated
      const updateQuery = { };
      if (isDown) {
        updateQuery.$push = { downsAddresses: walletAddress };
        updateQuery.$inc = { downs: 1 };
      } else {
        updateQuery.$pull = { downsAddresses: walletAddress };
        updateQuery.$inc = { downs: -1 };
      }
      
      const result = await collection.updateOne({ _id: commentId }, updateQuery);
  
      // Check if the update was successful and return the updated like count
      if (result.modifiedCount === 1) {
        var updatedComment = await collection.findOne({ _id: commentId });
        updatedComment.isDown = isDown;
        ctx.body = updatedComment;
      } else {
        ctx.throw(400, 'Unable to update comment');
      }
    } catch (error) {
      ctx.throw(500, 'Failed to down comment: ', error);
    }
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});

/* 
###############################################################
############################ UTILS ############################
############################################################### 
*/
function formatDateToString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

module.exports = router;
