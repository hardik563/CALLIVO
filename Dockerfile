# ========================================================
# CALLIVO — MULTI-STAGE PRODUCTION DOCKERFILE
# ========================================================

# --- Stage 1: Build Frontend SPA ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: Build Backend Service ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma/ ./prisma/
COPY server/scripts/ ./scripts/
RUN npm ci
COPY server/ ./
RUN node scripts/sync-db-provider.cjs && npx prisma generate
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl

# Set working directory for server dependencies and runtime
WORKDIR /app/server

# Copy server package files, prisma schema, and scripts
COPY server/package*.json ./
COPY server/prisma/ ./prisma/
COPY server/scripts/ ./scripts/

# Install production dependencies
RUN npm ci --omit=dev

# Generate Prisma Client for the production container
RUN node scripts/sync-db-provider.cjs && npx prisma generate

# Copy built backend from backend-builder
COPY --from=backend-builder /app/server/dist ./dist

# Copy built frontend from frontend-builder to /app/dist (matched by server SPA fallback)
COPY --from=frontend-builder /app/dist /app/dist

# Create uploads directory structure
RUN mkdir -p /app/uploads/avatars /app/uploads/recordings /app/server/uploads/avatars

# Expose port and configure health check
WORKDIR /app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server/scripts/start-production.cjs"]
