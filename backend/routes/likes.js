const Router = require('@koa/router');
const router = new Router();
const { connectToDatabase } = require('../db');

/* Fetch only the mapping between video and likes. The projection argument explicit which field to include/exclude.
###############################################################
####################### initLikes #############################
############################################################### */

router.get('/initLikes', async (ctx, next) => {
    if(ctx.request.path === '/initLikes') {
      console.log("Chiamata: 'http://localhost:3000/initLikes'")
  
      const db = await connectToDatabase();
      const collection = db.collection('videos');
      const documents = await collection.find({}, {projection: {_id: 0, tokenId: 1, likes: 1, likeWallets: 1}}).toArray();
      
      ctx.body = {
        message: 'likes to video',
        data: documents,
      };
    } 
    await next();
  });

  
/* Update like count endpoint
###############################################################
####################### like ##################################
############################################################### */

router.post('/like', async (ctx, next) => {
    if(ctx.request.path == '/like') {
      console.log("Chiamata: 'http://localhost:3000/like'")

      const db = await connectToDatabase();
      const collection = db.collection('videos');
      const tokenId = ctx.request.body.tokenId;
      const isLiked = ctx.request.body.isLiked;
      const walletAddress = ctx.request.body.walletAddress;
      
      // Find the video document by ID and increment/decrement the like count by 1 and push/pull walletAssociated
      const updateQuery = { };
      if (isLiked) {
        updateQuery.$push = { likeWallets: walletAddress };
        updateQuery.$inc = { likes: 1 };
      } else {
        updateQuery.$pull = { likeWallets: walletAddress };
        updateQuery.$inc = { likes: -1 };
      }
      
      const result = await collection.updateOne({ tokenId: tokenId }, updateQuery);
  
      // Check if the update was successful and return the updated like count
      if (result.modifiedCount === 1) {
        const updatedVideo = await collection.findOne({ tokenId: tokenId });
        ctx.body = updatedVideo.likes.toString();
      } else {
        ctx.throw(400, 'Unable to update like count');
      }
    }
    await next();
  });


module.exports = router;