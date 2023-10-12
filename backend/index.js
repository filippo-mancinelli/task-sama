const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const { spawn } = require("child_process");

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
const imagesRouter = require('./routes/images');
const likesRouter = require('./routes/likes');
app.use(videosRouter.routes());
app.use(imagesRouter.routes());
app.use(likesRouter.routes());

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});


// ### SPAWN BATCH JOB ### //
const batchJob = spawn("node", ["batch.js"]);

batchJob.stdout.on("data", (data) => {
  console.log(`Job stdout: ${data}`);
});

batchJob.stderr.on("data", (data) => {
  console.error(`Job stderr: ${data}`);
});

batchJob.on("close", (code) => {
  console.log(`Job exited with code ${code}`);
});