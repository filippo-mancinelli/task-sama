const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const app = new Koa();

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['POST'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Wallet-Address'],
};

app.use(cors(corsOptions));

// Use koa-bodyparser middleware to parse request bodies
app.use(bodyParser());

// Import and use route files
const videosRouter = require('./routes/videos');
const likesRouter = require('./routes/likes');
app.use(videosRouter.routes());
app.use(likesRouter.routes());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
