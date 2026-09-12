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
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install OpenSSL for Prisma engine
RUN apk add --no-cache openssl

# Copy server package definitions and install production dependencies only
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy built artifacts
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=backend-builder /app/server/prisma ./prisma
COPY --from=frontend-builder /app/dist /app/dist

# Create uploads directory structure
RUN mkdir -p /app/uploads/avatars /app/uploads/recordings

WORKDIR /app
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server/dist/index.js"]
