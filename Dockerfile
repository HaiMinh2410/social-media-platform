# --- BASE BUILD ---
FROM node:20-slim AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- PRISMA GENERATE (Separate stage to avoid issues) ---
FROM base AS prisma-gen
COPY prisma ./prisma
RUN npx prisma generate

# --- WEB BUILD ---
FROM prisma-gen AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# --- WEB RUNNER ---
FROM node:20-slim AS web-runner
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "run", "start"]

# --- WORKER RUNNER ---
FROM node:20-slim AS worker-runner
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
# Use ts-node directly for worker or build it first.
# To keep it simple, we use ts-node-esm if installed.
# For production stability, we usually build or use ts-node.
# Let's ensure ts-node is available.
ENV NODE_PATH=./src
CMD ["npx", "ts-node", "--esm", "-r", "tsconfig-paths/register", "src/infrastructure/worker/main.ts"]
