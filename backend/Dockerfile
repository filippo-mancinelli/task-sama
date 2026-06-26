# Task-Sama backend (Solana + PostgreSQL)
# Build context: ./backend
FROM node:20-alpine

# psql is used by the entrypoint to apply schema + seed on first boot
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Install production dependencies first for better layer caching
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev

# Application source
COPY . .
RUN chmod +x docker-entrypoint.sh

ENV NODE_ENV=staging
ENV PORT=3000
EXPOSE 3000

# Container health: the Koa /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT}/health" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "index-postgres.js"]
