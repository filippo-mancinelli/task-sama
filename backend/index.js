const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
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

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['POST'],
  allowHeaders: ['Access-Control-Allow-Origin', 'Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  ctx.set('Access-Control-Allow-Methods', 'POST');
  await next();
});

// Use koa-bodyparser middleware to parse request bodies
app.use(bodyParser());



//Fetch all videos metadata - cardTable.vue
app.use(async (ctx, next) => {
  if (ctx.request.path === '/getAllVideos') {
    console.log("Chiamata: 'http://localhost:3000/getAllVideos'", )

    const collection = db.collection('videos');

    // Query to find all documents in the "videos" collection
    const documents = await collection.find({}).toArray();
    console.log("docs",documents)
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

//Fetch only the mapping between video and likes. The projection argument explicit which field to include/exclude.
app.use(async (ctx, next) => {
  if(ctx.request.path === '/getLikes') {
    console.log("Chiamata: 'http://localhost:3000/getLikes'", )

    const collection = db.collection('videos');
    const documents = await collection.find({}, {projection: {_id: 0, tokenId: 1, likes: 1}}).toArray();
    console.log("docsLikes", documents);
    ctx.body = {
      message: 'likes to video',
      data: documents,
    };
  } 
  await next();
});


// Update like count endpoint
app.use(async (ctx, next) => {
  if(ctx.request.path == '/like') {
    console.log("#######################################",ctx.request.body)
    const collection = db.collection('videos');
    const tokenId = ctx.request.body.tokenId;
    const isLiked = ctx.request.body.isLiked;

    // Find the video document by ID and increment/decrement the like count by 1
    const result = await collection.updateOne(
      { tokenId: tokenId },
      { $inc: { likes: isLiked ? 1 : -1 } }
    );

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


app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
