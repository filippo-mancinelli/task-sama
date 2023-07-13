const Router = require('@koa/router');
const router = new Router();
const { connectToDatabase } = require('../db');

/* Fetch all videos metadata - Currently not used, metadata is fetched from blockchain
###############################################################
####################### initVideoMetadata #####################
############################################################### */

router.get('/initVideoMetadata', async (ctx, next) => {
  if (ctx.request.path === '/initVideoMetadata') {
    console.log("\n ####################################### \n 'http://localhost:3000/initVideoMetadata' \n ####################################### \n ")

    const db = await connectToDatabase();
    const collection = db.collection('videos');

    // Query to find all documents in the "videos" collection
    const documents = await collection.find({}).toArray();
    ctx.body = {
      message: 'All documents in the videos collection',
      data: documents,
    };
  }
  await next();

  if (ctx.status === 404) {
    ctx.body = {
      message: 'Not found',
    };
  }
});

module.exports = router;
