const Router = require('@koa/router');
const router = new Router();
const { connectToDatabase } = require('../db');

/* Fetch all videos metadata - cardTable.vue
###############################################################
####################### initVideoMetadata #####################
############################################################### */

router.get('/initVideoMetadata', async (ctx, next) => {
  if (ctx.request.path === '/initVideoMetadata') {
    console.log("############################## 'http://localhost:3000/initVideoMetadata'", )

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
