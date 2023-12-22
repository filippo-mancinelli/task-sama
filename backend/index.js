const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const { spawn } = require("child_process");
const http = require('http');
const https = require('https');
const fs = require('fs');

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['POST'],
  allowHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Use koa-bodyparser middleware to parse request bodies
app.use(bodyParser());

// Import and use route files
const videosRouter = require('./routes/videos');
const imagesRouter = require('./routes/images');
const likesRouter = require('./routes/likes');
const taskRouter = require('./routes/tasks');
const commentsRouter = require('./routes/comments');
const usersRouter = require('./routes/users');
app.use(videosRouter.routes());
app.use(imagesRouter.routes());
app.use(likesRouter.routes());
app.use(taskRouter.routes());
app.use(commentsRouter.routes());
app.use(usersRouter.routes());

// Create HTTPS server only on production
if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('/task-sama/backend/certificates/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/task-sama/backend/certificates/cert.pem', 'utf8'),
    ca: fs.readFileSync('/task-sama/backend/certificates/chain.pem', 'utf8'),
  };

  const httpServer = http.createServer(app.callback());
  const httpsServer = https.createServer(options, app.callback());

  httpServer.listen(80, () => {
    console.log('HTTP Server running on port 80');
  });

  httpsServer.listen(443, () => {
    console.log('HTTPS Server running on port 443');
  });
} else {
  app.listen(3000, () => {
    console.log('Server is running on port 3000');
  });
}

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