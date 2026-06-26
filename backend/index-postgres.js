const Koa = require('koa');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const app = new Koa();
const http = require('http');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(bodyParser());

// Import PostgreSQL route files
// Import PostgreSQL route files
const webhooksRouter = require('./routes/webhooks');
const usersRouter = require('./routes/users-postgres');
const likesRouter = require('./routes/likes-postgres');
const imagesRouter = require('./routes/images-postgres');
const commentsRouter = require('./routes/comments-postgres');
const videosRouter = require('./routes/videos-postgres');
const taskRouter = require('./routes/tasks-postgres');

// Use routes
app.use(webhooksRouter.routes());
app.use(usersRouter.routes());
app.use(likesRouter.routes());
app.use(imagesRouter.routes());
app.use(commentsRouter.routes());
app.use(videosRouter.routes());
app.use(taskRouter.routes());

// Error handler
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
});

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.request.path === '/health') {
    ctx.body = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };
    return;
  }
  await next();
});

// 404 handler
app.use(async (ctx) => {
  ctx.status = 404;
  ctx.body = {
    error: 'Not Found',
    path: ctx.request.path
  };
});

// Create server based on environment
if (process.env.NODE_ENV === 'production' && process.env.SSL_KEY_PATH) {
  // Production with SSL
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH, 'utf8'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH, 'utf8'),
    ca: fs.readFileSync(process.env.SSL_CA_PATH, 'utf8'),
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
  // Development
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DATABASE_URL ? 'PostgreSQL connected' : 'No database configured'}`);
    console.log(`Solana RPC: ${process.env.SOLANA_RPC_URL || 'Not configured'}`);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});
