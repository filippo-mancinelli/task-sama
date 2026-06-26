# Task-Sama frontend (Vue 3 + Vite) — build then serve as static files via nginx.
# Build context: repo root.

# ---- Stage 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for layer caching (.npmrc carries legacy-peer-deps=true)
COPY package.json .npmrc ./
RUN npm install --no-audit --no-fund

# App source
COPY . .

# Vite inlines VITE_* at build time, so they must be present before `npm run build`
ARG VITE_BACKEND_URL
ARG VITE_DEMO_MODE=true
ARG VITE_SOLANA_NETWORK=devnet
ARG VITE_PROGRAM_ID=TaskSama11111111111111111111111111111111111
ARG VITE_HELIUS_DEVNET_RPC
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_DEMO_MODE=$VITE_DEMO_MODE \
    VITE_SOLANA_NETWORK=$VITE_SOLANA_NETWORK \
    VITE_PROGRAM_ID=$VITE_PROGRAM_ID \
    VITE_HELIUS_DEVNET_RPC=$VITE_HELIUS_DEVNET_RPC

RUN npm run build

# ---- Stage 2: serve ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
