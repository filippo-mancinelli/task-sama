const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const formidable = require('koa2-formidable');
const app = new Koa();
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
app.use(formidable());
app.use(bodyParser());

// We import route files and use them
const videosRouter = require('./routes/videos');
const likesRouter = require('./routes/likes');
app.use(videosRouter.routes());
app.use(likesRouter.routes());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
