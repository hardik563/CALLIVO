# 14. Production Deployment & Cloud Architecture — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Exhaustive DevOps Guide to Multi-Cloud Production Infrastructure

---

## 1. Production Topology Overview

CALLIVO is deployed across a modern, multi-cloud production topology that cleanly separates static edge frontend delivery from long-lived stateful WebSocket signaling and serverless relational persistence:

```mermaid
graph TD
    subgraph Source Control
        Git[GitHub Repository<br/>https://github.com/hardik563/CALLIVO]
    end

    subgraph Frontend Edge Hosting
        Git -- Webhook on Push --> Vercel[Vercel Global Edge Network<br/>https://callivo.vercel.app]
        Vercel --> ClientAssets[Compiled React SPA /dist<br/>Global Anycast CDN]
    end

    subgraph Backend Container Hosting
        Git -- Webhook on Push --> Render[Render Web Service Container<br/>https://callivo-f1n8.onrender.com]
        Render --> NodeServer[Node.js 20 Express + Socket.IO<br/>Port 5000 Bound <1s]
    end

    subgraph Cloud Persistence
        NodeServer <== PgBouncer Pooler ==> Neon[Neon Serverless PostgreSQL<br/>Autoscaling Managed SQL]
    end

    subgraph NAT Traversal Network
        ClientAssets -. Query ICE Servers .-> NodeServer
        ClientAssets <== WebRTC Media ==> RemoteBrowser[Remote Participant Browser]
        ClientAssets -. STUN/TURN Relays .-> OpenRelay[Google STUN & Metered TURN Relays]
    end
```

---

## 2. Platform Infrastructure Roles

| Service | Hosting Platform | Canonical URL | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | **Vercel** | `https://callivo.vercel.app` | Serves minified React 18 production bundle via global edge CDN with zero-latency HTML delivery. |
| **Backend API & WebSockets**| **Render** | `https://callivo-f1n8.onrender.com`| Executes Node.js Express server, Socket.IO signaling gateway, JWT authentication, and REST APIs. |
| **Relational Database** | **Neon** | Cloud Database Host | Serverless PostgreSQL database with automated branching and PgBouncer connection pooling. |
| **Version Control & CI/CD** | **GitHub** | `https://github.com/hardik563/CALLIVO`| Source of truth triggering automated build webhooks to Vercel and Render upon commits to `main`. |

---

## 3. Frontend Deployment (Vercel)

### `vercel.json` Specification
The frontend is configured via [vercel.json](file:///c:/Users/hardi/OneDrive/Desktop/CALLIVO/vercel.json):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
- **`buildCommand: "npm run build:client"`:** Executes `tsc && vite build`, ensuring static TypeScript verification completes before Rollup packages production assets.
- **`outputDirectory: "dist"`:** Instructs Vercel to publish the compiled static artifacts.
- **`rewrites` Rule:** Directs all incoming URL paths (e.g., `/dashboard`, `/room/clv-123`) to `index.html`, allowing React Router v6 to handle client-side route transitions without 404 errors.

---

## 4. Backend Deployment (Render)

### `render.yaml` Blueprint Specification
The backend service and attached database are declared in [render.yaml](file:///c:/Users/hardi/OneDrive/Desktop/CALLIVO/render.yaml):
```yaml
services:
  - type: web
    name: callivo
    runtime: node
    plan: starter
    region: oregon
    buildCommand: npm install && npm run build && cd server && npm install && npm run prisma:generate && npm run build
    startCommand: cd server && npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: DATABASE_URL
        fromDatabase:
          name: callivo-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: STUN_SERVER_URL
        value: stun:stun.l.google.com:19302

databases:
  - name: callivo-db
    plan: starter
    databaseName: callivo
    user: callivo
```

### Critical Render Startup Optimizations:
1. **Immediate Port Binding:** Render monitors the assigned container port (`5000`). If a process does not bind within its initial startup grace period, Render flags the deployment as failed and aborts. CALLIVO executes `server.listen(PORT)` on line 1 of startup, achieving immediate healthy status.
2. **Health Check Endpoint:** Configured with `healthCheckPath: /health`, ensuring zero-downtime rolling deploys only switch traffic once the Express application reports `{ "status": "healthy" }`.

---

## 5. Multi-Stage Production Dockerfile

CALLIVO includes an enterprise-grade multi-stage [Dockerfile](file:///c:/Users/hardi/OneDrive/Desktop/CALLIVO/Dockerfile) for containerized deployments:

```dockerfile
# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Backend Service
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma/ ./prisma/
COPY server/scripts/ ./scripts/
RUN npm ci
COPY server/ ./
RUN node scripts/sync-db-provider.cjs && npx prisma generate
RUN npm run build

# Stage 3: Minimal Production Container Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
RUN apk add --no-cache openssl

WORKDIR /app/server
COPY server/package*.json ./
COPY server/prisma/ ./prisma/
COPY server/scripts/ ./scripts/
RUN npm ci --omit=dev
RUN node scripts/sync-db-provider.cjs && npx prisma generate

COPY --from=backend-builder /app/server/dist ./dist
COPY --from=frontend-builder /app/dist /app/dist

RUN mkdir -p /app/uploads/avatars /app/uploads/recordings /app/server/uploads/avatars
WORKDIR /app
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server/scripts/start-production.cjs"]
```

---

## 6. Environment Variables: Frontend vs. Backend Separation

> [!CAUTION]
> **Critical Security Architecture Principle:**  
> In Vite, any environment variable prefixed with `VITE_` (e.g., `VITE_API_URL`) is embedded **directly into the compiled client JavaScript bundle**.  
> **Backend secrets (database passwords, JWT secret keys, Resend API tokens) must NEVER have a `VITE_` prefix.**

### Backend Environment Variables (Configured on Render / Container)
| Variable | Sample / Template Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express & Socket.IO HTTP server. |
| `NODE_ENV` | `production` | Enables optimized caching, strict cookies, and minified logs. |
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Connection string for Neon PostgreSQL. |
| `CLIENT_URL` | `https://callivo.vercel.app` | Allowed CORS origins for browser security. |
| `JWT_SECRET` | `replace_with_min_32_character_random_string` | Secret key signing access tokens. |
| `JWT_REFRESH_SECRET`| `replace_with_min_32_character_random_string` | Secret key signing refresh tokens. |
| `JWT_EXPIRES_IN` | `15m` | Access token lifespan. |
| `JWT_REFRESH_EXPIRES_IN`| `7d` | Refresh token lifespan. |
| `RESEND_API_KEY` | `re_...` | Transactional email provider token for password resets. |
| `STUN_SERVER_URL`| `stun:stun.l.google.com:19302` | Primary STUN server for NAT discovery. |
| `TURN_SERVER_URL`| `turn:...` (Optional) | Enterprise TURN relay URL. |

### Frontend Environment Variables (Configured on Vercel)
| Variable | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://callivo-f1n8.onrender.com` | Base URL for REST API fetch requests. |
| `VITE_SERVER_URL`| `https://callivo-f1n8.onrender.com` | Base URL for Socket.IO WebSocket connections. |

---

## 7. Production Build Commands

```bash
# 1. Build Client Only (Used by Vercel)
npm run build:client      # Executes: tsc && vite build

# 2. Build Server Only (Used in server container)
npm run build:server      # Executes: cd server && npm run build (tsc)

# 3. Full Monorepo Build (Used by Render & Docker)
npm run build:all         # Executes client build, prisma generate, and server build
```
