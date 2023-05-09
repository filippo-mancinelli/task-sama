const Koa = require('koa');
const cors = require('@koa/cors');
const MongoClient = require('mongodb').MongoClient;

const app = new Koa();
const mongoUrl = 'mongodb://localhost:27017'; 
const dbName = 'tasksama';

let db;

(async () => {
  try {
    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    console.log(`Connected to database ${dbName}`);

  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }
})();

//Fetch all videos metadata - cardTable.vue
app.use(async (ctx, next) => {
  if (ctx.request.path === '/getAllVideos') {
    const collection = db.collection('videos');

    // Query to find all documents in the "videos" collection
    const documents = await collection.find({}).toArray();
    console.log("docs",documents)
    ctx.body = {
      message: 'All documents in the videos collection',
      data: documents,
    };
  } else {
    ctx.status = 404;
    ctx.body = {
      message: 'Not found',
    };
  }

  await next();
});

//Fetch only the mapping between video and likes. The projection argument explicit which field to include/exclude.
app.use(async (ctx, next) => {
  if(ctx.request.path === '/getLikes') {
    const collection = db.collection('videos');
    const documents = await collection.find({}, {projection: {_id: 0, tokenId: 1, likes: 1}}).toArray();
    console.log("docsLikes", documents);
    ctx.body = {
      message: 'likes to video',
      data: documents,
    };
  } else {
    ctx.status = 404;
    ctx.body = {
      message: 'Not found',
    };
  }

  await next();
});

app.use(cors());
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
