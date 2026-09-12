# Callivo

A professional real-world video conferencing web application.

Callivo is a modern, high-performance, real-time video conferencing platform engineered for seamless virtual collaboration. Built with modern WebRTC peer-to-peer media streams, real-time Socket.IO signaling, high-fidelity spatial 3D conference visualization with Three.js, and an enterprise-grade backend powered by Node.js, Express, and Prisma ORM.

---

## 1. Project Overview

Callivo provides an end-to-end, zero-install, browser-native video conferencing experience. Users can host instant meetings, schedule upcoming conferences, invite team members, exchange real-time in-meeting chat, share screens, record sessions locally with browser-side media composition, and customize audio/video settings with real-time audio visualizers.

---

## 2. Key Features

- **Ultra-Low Latency Peer-to-Peer Video & Audio**: Direct browser-to-browser WebRTC media streams with DTLS-SRTP encryption.
- **Dynamic STUN / TURN Fallback**: Automated ICE server resolution for traversing strict corporate firewalls, NATs, and mobile networks.
- **Audio & Video Controls**: Toggle camera, microphone mute/unmute, device switching, and real-time audio volume visualizer with Web Audio API.
- **Screen Sharing**: High-resolution screen, application window, or browser tab sharing with audio pass-through.
- **In-Meeting Chat & Reactions**: Real-time messaging with timestamped history, emojis, and live floating reaction animations.
- **Interactive Q&A & Comments**: Structured question submissions, upvoting/downvoting, host pinning, and attendee commenting.
- **Waiting Room & Lobby Control**: Host-governed admission, guest screening, and one-click admit/reject controls.
- **Meeting Passcodes & Room Locking**: Secure private sessions with optional passcode authentication and host room lock capabilities.
- **Meeting Recording**: Client-side media recording using the MediaRecorder API, with automatic WebM file export and backend storage.
- **3D Spatial Audio & Room Visualization**: Interactive 3D spatial conference room built using Three.js, React Three Fiber, and Drei.
- **Contacts & Direct Conversations**: Directory search, connection requests, favorites, and 1-on-1 private messaging.
- **Calendar & Meeting Scheduler**: Schedule meetings, track agendas, and access direct lobby join links.
- **Helpdesk & Support Ticketing**: Integrated support ticket submission with tracking codes and status monitoring.
- **User Settings & Diagnostics**: Customizable audio processing (echo cancellation, noise suppression, auto-gain), video resolution/framerate selection, theme toggling (dark/light), and live network/ICE connection diagnostics.

---

## 3. Tech Stack

### Frontend
- **Framework**: React 18.3.1 (with TypeScript 5.6.3)
- **Build Tool**: Vite 5.4.10
- **Styling**: TailwindCSS 3.4.15, PostCSS, Autoprefixer
- **Icons & Visuals**: Lucide React 0.460.0, Canvas Confetti
- **3D Spatial Engine**: Three.js 0.170.0, `@react-three/fiber` 8.17.10, `@react-three/drei` 9.120.4
- **Animation**: Framer Motion 11.11.17
- **State Management**: Zustand 5.0.1
- **Forms & Validation**: React Hook Form 7.53.2, Zod 3.23.8
- **Client Realtime**: Socket.IO Client 4.8.3

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express 4.21.1 (TypeScript 5.6.3)
- **Database ORM**: Prisma 5.22.0
- **Database Engine**: SQLite (default local development) / PostgreSQL (production)
- **Signaling Server**: Socket.IO 4.8.1
- **Security & Hardening**: Helmet 8.0.0, Express Rate Limit 7.4.1, CORS 2.8.5
- **Authentication**: JSON Web Tokens (`jsonwebtoken` 9.0.2), `bcryptjs` 2.4.3
- **Email Delivery**: Resend SDK 4.0.1
- **Cache / PubSub**: ioredis 5.4.1 (with automatic in-memory fallback)

---

## 4. Architecture

```
                                  +-----------------------------+
                                  |       Client Browser        |
                                  |   (React 18 + Vite SPA)     |
                                  +--------------+--------------+
                                                 |
                     +---------------------------+---------------------------+
                     | HTTPS / REST API          | WSS / Socket.IO           | WebRTC (DTLS-SRTP)
                     v                           v                           v
        +-------------------------+ +-------------------------+ +-------------------------+
        |   Express HTTP API      | |   Socket.IO Gateway     | | Peer-to-Peer Mesh / TURN|
        | - Auth & User Sessions  | | - Meeting Lobby / Join  | | - Direct Media Tracks   |
        | - Meeting Management    | | - SDP Offer / Answer    | | - Audio & Video Streams |
        | - Calendar & Contacts   | | - ICE Candidate Relay   | | - Screen Share Stream   |
        | - Helpdesk & Settings   | | - Chat & Reactions      | |                         |
        +------------+------------+ +------------+------------+ +-------------------------+
                     |                           |
                     +-------------+-------------+
                                   |
                     +-------------v-------------+
                     |    Prisma ORM Layer       |
                     +-------------+-------------+
                                   |
                     +-------------v-------------+
                     |   SQLite / PostgreSQL     |
                     +---------------------------+
```

### Architecture Highlights
1. **Unified Host Model**: In production, the Express backend serves the compiled static SPA assets from `dist/` and handles API/WebSocket connections on a single port (default `5000`), eliminating CORS complexity and simplifying deployments.
2. **Decoupled Deployment Model (Supported)**: The frontend can optionally be hosted separately (e.g., on Vercel or Netlify) by configuring `VITE_API_URL` and `VITE_SERVER_URL` to point to the backend domain.

---

## 5. Project Structure

```
CALLIVO/
├── .env.example              # Unified root environment template
├── .gitignore                # Production Git ignore rules
├── .dockerignore             # Docker build ignore rules
├── Dockerfile                # Multi-stage production container definition
├── index.html                # Single Page Application entry HTML
├── package.json              # Frontend & monorepo scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # TailwindCSS design system & palette
├── tsconfig.json             # Root TypeScript configuration
├── vite.config.ts            # Vite bundler configuration & local dev proxy
├── public/                   # Static assets, icons, favicons, site manifest
│   ├── favicon.svg
│   ├── og-image.png
│   └── site.webmanifest
├── scripts/                  # Build & asset generation utilities
├── uploads/                  # Runtime uploads directory (avatars, recordings)
├── src/                      # Frontend source code (React + TypeScript)
│   ├── App.tsx               # Main application component & routing
│   ├── main.tsx              # React DOM mount
│   ├── components/           # UI components (audio visualizer, dialogs, modals)
│   │   ├── common/           # Buttons, cards, inputs, tabs
│   │   ├── meeting/          # Meeting room controls, participant grid, 3D room
│   │   └── navigation/       # Top navigation, sidebar
│   ├── layouts/              # AuthLayout, DashboardLayout
│   ├── lib/                  # Utilities, API client, Socket.IO client, WebRTC engine
│   │   ├── api.ts            # Typed REST API client & auth handlers
│   │   ├── recorder.ts       # In-browser session recording controller
│   │   ├── socket.ts         # Singleton Socket.IO connection manager
│   │   └── webrtc.ts         # WebRTC Manager (mesh, tracks, ICE handling)
│   ├── pages/                # Application views (Meeting Room, Lobby, Dashboard, etc.)
│   ├── stores/               # Zustand state stores (auth, meeting, chat, settings)
│   └── types/                # TypeScript data contracts & interfaces
└── server/                   # Backend source code (Express + TypeScript)
    ├── .env.example          # Server environment template
    ├── package.json          # Backend dependencies & scripts
    ├── tsconfig.json         # Backend TypeScript configuration
    ├── prisma/
    │   └── schema.prisma     # Prisma database schema definition
    └── src/
        ├── app.ts            # Express application setup, routes & middleware
        ├── index.ts          # Server bootstrap & Socket.IO server initialization
        ├── auth/             # Authentication controller & service
        ├── calendar/         # Calendar event management
        ├── common/           # Auth & error middleware, rate limiting
        ├── config/           # Centralized environment configuration
        ├── contacts/         # Contacts & connection requests
        ├── db/               # Prisma client singleton
        ├── email/            # Resend email templates & delivery
        ├── helpdesk/         # Support ticketing system
        ├── meetings/         # Meeting CRUD, participant tracking, waiting queue
        ├── messages/         # 1-on-1 direct conversations
        ├── notifications/    # In-app notifications
        ├── recordings/       # Recording metadata & storage
        ├── settings/         # User preferences & audio/video device options
        ├── signaling/        # WebRTC signaling gateway & Socket.IO event handlers
        └── users/            # Profile management & device tracking
```

---

## 6. Prerequisites

- **Node.js**: `v18.18.0` or higher (`v20.x` LTS recommended)
- **npm**: `v9.x` or higher
- **Git**: `v2.x` or higher
- **Modern Web Browser**: Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari with WebRTC support

---

## 7. Installation

Clone the repository and install dependencies for both the frontend root and the server:

```bash
# Clone the repository
git clone https://github.com/hardikdhamija/Callivo.git
cd Callivo

# Install root (frontend) dependencies
npm install

# Install server (backend) dependencies
cd server
npm install
cd ..
```

---

## 8. Environment Variables

Callivo ships with `.env.example` templates containing safe placeholder values.

Create your local environment files:

```bash
# Root environment file
cp .env.example .env

# Server environment file
cp server/.env.example server/.env
```

### Key Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | Yes | `5000` | Port for the backend API and SPA server |
| `NODE_ENV` | Yes | `development` | Environment mode (`development` or `production`) |
| `CLIENT_URL` | Yes | `http://localhost:5000` | Public URL of the web client |
| `SERVER_URL` | Yes | `http://localhost:5000` | Public URL of the backend API |
| `DATABASE_URL` | Yes | `file:./dev.db` | Database connection string (SQLite or PostgreSQL) |
| `JWT_SECRET` | Yes | *(set securely)* | Secret key for signing access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Yes | *(set securely)* | Secret key for refresh tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRES_IN`| No | `7d` | Refresh token lifespan |
| `RESEND_API_KEY` | No | *(blank)* | Resend API key for sending system emails |
| `EMAIL_FROM` | No | `support@callivo.com` | From header for outgoing system emails |
| `STUN_SERVER_URL` | No | `stun:stun.l.google.com:19302` | STUN server URL for NAT traversal |
| `TURN_SERVER_URL` | No | *(blank)* | TURN server URL (e.g. `turn:turn.domain.com:3478`) |
| `TURN_USERNAME` | No | *(blank)* | TURN server username |
| `TURN_PASSWORD` | No | *(blank)* | TURN server password |
| `VITE_API_URL` | No | *(blank)* | Optional API base URL for decoupled frontend hosting |
| `VITE_SERVER_URL` | No | *(blank)* | Optional WebSocket URL for decoupled frontend hosting |

> **Security Note**: Never commit `.env` files to source control. They are strictly excluded in `.gitignore`.

---

## 9. Local Development

To run the complete application locally with hot-reloading:

### Terminal 1 — Backend Server
```bash
cd server
npm run dev
```
*Backend API and WebSocket signaling start on `http://localhost:5000`.*

### Terminal 2 — Frontend Dev Server
```bash
npm run dev
```
*Vite development server starts on `http://localhost:3000` and automatically proxies `/api`, `/socket.io`, and `/uploads` to port `5000`.*

---

## 10. Frontend Setup

The frontend is configured via Vite.

```bash
# Start Vite development server
npm run dev

# Compile TypeScript and bundle frontend for production
npm run build

# Preview the production build locally
npm run preview
```

---

## 11. Backend Setup

The backend uses `ts-node-dev` in development and standard Node.js in production:

```bash
cd server

# Run backend development server
npm run dev

# Compile TypeScript to dist/
npm run build

# Start compiled production server
npm run start
```

---

## 12. Database Setup

Callivo uses **Prisma ORM**. It is pre-configured with SQLite for instant local development, with zero external database dependencies required.

```bash
cd server

# Generate Prisma Client types
npm run prisma:generate

# Push schema changes to the local SQLite database
npm run prisma:push

# (Optional) Open Prisma Studio visual database GUI
npm run prisma:studio
```

### Switching to PostgreSQL in Production
To use PostgreSQL (e.g. on Render, Neon, Supabase, or AWS RDS):
1. In `server/prisma/schema.prisma`, update datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update `DATABASE_URL` in your production environment variables to your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/callivo?schema=public&sslmode=require"
   ```
3. Run `npm run prisma:push` or `npx prisma migrate deploy`.

---

## 13. WebRTC Configuration

Callivo establishes WebRTC peer-to-peer connections among meeting participants:
- Audio tracks are initialized with automatic echo cancellation, noise suppression, and auto-gain control.
- Video tracks are configured with adaptive resolution (720p/1080p) and 30fps ideal framerate.
- Dynamic track renegotiation seamlessly handles camera toggling, microphone muting, and screen sharing without breaking peer connections.
- Peer streams are routed through an in-meeting state manager that monitors network quality (`excellent`, `good`, `poor`) and detects active speakers via Web Audio API analysis.

---

## 14. STUN/TURN Configuration

NAT traversal is managed through ICE (Interactive Connectivity Establishment):
- By default, Callivo connects using reputable public STUN servers (`stun:stun.l.google.com:19302`).
- The backend exposes a dynamic ICE server configuration endpoint at `/api/webrtc/ice-servers`.
- When deploying behind restrictive corporate firewalls or symmetric NATs where direct P2P connections are blocked, configure TURN credentials in your environment variables:
  ```env
  TURN_SERVER_URL="turn:your-turn-server.com:3478"
  TURN_USERNAME="your-turn-username"
  TURN_PASSWORD="your-turn-password"
  ```
- The backend automatically injects these credentials into the ICE candidate exchange process.

---

## 15. Authentication

Callivo features a secure authentication system:
- **Password Hashing**: Bcrypt with 10 salt rounds.
- **Access Tokens**: Short-lived JWTs (15 minutes) sent via `Authorization: Bearer <token>` headers.
- **Refresh Tokens**: Long-lived JWTs (7 days) with cryptographic hash verification against the database `RefreshToken` table.
- **Guest Access**: Attendees joining a meeting link without an account are assigned an isolated, unique guest session with randomized guest identifiers, allowing instant participation without registration.

---

## 16. API Overview

All REST API endpoints are prefixed with `/api`:

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **System** | `/health` | `GET` | Service health, uptime, and status check |
| **WebRTC** | `/api/webrtc/ice-servers` | `GET` | Dynamic STUN/TURN configuration |
| **Auth** | `/api/auth/register` | `POST` | Register new user account |
| **Auth** | `/api/auth/login` | `POST` | Authenticate user & receive tokens |
| **Auth** | `/api/auth/me` | `GET` | Get authenticated user profile |
| **Auth** | `/api/auth/refresh` | `POST` | Refresh expired access token |
| **Auth** | `/api/auth/logout` | `POST` | Revoke session & refresh token |
| **Meetings** | `/api/meetings` | `GET` / `POST`| List user meetings or create new meeting |
| **Meetings** | `/api/meetings/:id` | `GET` / `PATCH`| Get meeting details or update settings |
| **Meetings** | `/api/meetings/:id/end` | `POST` | Conclude meeting session (host only) |
| **Contacts** | `/api/contacts` | `GET` / `POST`| List contacts or send contact request |
| **Messages** | `/api/messages/:userId` | `GET` / `POST`| Fetch direct chat history or send message |
| **Calendar** | `/api/calendar` | `GET` / `POST`| Manage scheduled calendar meetings |
| **Helpdesk** | `/api/helpdesk/tickets` | `POST` / `GET`| Submit support ticket or track status |
| **Settings** | `/api/settings` | `GET` / `PUT` | Retrieve or update user preferences |

---

## 17. WebSocket / Signaling

Socket.IO handles real-time signaling and in-meeting events under the `/socket.io` namespace:

| Event | Direction | Payload Description |
|---|---|---|
| `meeting:join` | Client -> Server | Join meeting with ID, name, passcode, initial media state |
| `meeting:participant-joined` | Server -> Client | Broadcast new attendee admission to room |
| `webrtc:offer` | Bi-directional | Relay SDP offer between peer sockets |
| `webrtc:answer` | Bi-directional | Relay SDP answer between peer sockets |
| `webrtc:ice-candidate`| Bi-directional | Relay ICE candidates between peer sockets |
| `media:toggle-audio` | Client -> Server | Broadcast microphone mute/unmute state |
| `media:toggle-video` | Client -> Server | Broadcast camera on/off state |
| `media:toggle-screen`| Client -> Server | Broadcast screen sharing stream toggle |
| `lobby:admit` | Client -> Server | Host admits waiting participant from lobby |
| `lobby:reject` | Client -> Server | Host denies waiting participant admission |
| `chat:send` | Client -> Server | Send in-meeting message |
| `reaction:send` | Client -> Server | Broadcast floating emoji reaction |

---

## 18. Production Deployment

### Recommended Architecture: Unified Web Service (Render / Railway / VPS)
The simplest and most reliable deployment method is hosting the unified Node.js service:
- One single domain for both Frontend SPA, REST API, WebSockets, and media uploads.
- Zero CORS issues and zero cross-domain cookie complications.

### Option A: Deploying on Render

1. Create a new account at [Render](https://render.com).
2. Click **New +** -> **Blueprint** and connect your GitHub repository.
3. Render will automatically detect the provided [render.yaml](file:///c:/Users/hardi/OneDrive/Desktop/CALLIVO/render.yaml) specification:
   - **Build Command**: `npm install && npm run build && cd server && npm install && npm run prisma:generate && npm run build`
   - **Start Command**: `cd server && npm run start`
   - **Health Check Path**: `/health`
4. Add any custom environment variables (such as `RESEND_API_KEY` or `TURN_SERVER_URL`) in the Render Dashboard under **Environment**.
5. Click **Apply** to deploy.

### Option B: Deploying with Docker

Build and run using the included multi-stage `Dockerfile`:

```bash
# Build production Docker image
docker build -t callivo:latest .

# Run container with environment file
docker run -d \
  --name callivo-app \
  -p 5000:5000 \
  --env-file server/.env \
  callivo:latest
```

---

## 19. Build Commands

All build scripts are managed from the root `package.json`:

```bash
# Build frontend SPA only
npm run build

# Build backend server only
npm run build:server

# Build both frontend and backend
npm run build:full

# Build complete project including Prisma client generation
npm run build:all

# Start unified production server
npm run start
```

---

## 20. Security

- **Environment Secrets**: Sensitive keys (`JWT_SECRET`, `RESEND_API_KEY`, etc.) are loaded purely from environment variables and never checked into source control.
- **Rate Limiting**: Configured across all `/api` endpoints with strict limiters on `/api/auth` to prevent credential stuffing and brute-force attacks.
- **Security Headers**: Powered by Helmet with customized CSP allowances for WebRTC media streams, WebSockets, and audio contexts.
- **Input Sanitization**: Request parameters and bodies are validated using Zod schemas.
- **Safe Room Access**: Meetings can be protected with passcodes, waiting room moderation, and room locking.

---

## 21. Troubleshooting

### 1. Camera / Microphone Permission Errors
- Ensure browser permissions for camera and microphone are allowed.
- Modern browsers require HTTPS (or `localhost`) to access media capture devices (`navigator.mediaDevices.getUserMedia`). Ensure production is served via HTTPS.

### 2. Peer Video Not Connecting (Black Screens)
- Verify STUN/TURN configuration. In networks with strict NAT or corporate firewalls, a TURN server is required to relay media streams.
- Check the in-app Connection Diagnostics modal to inspect ICE connection states.

### 3. Database Schema Mismatch
- If you modify `schema.prisma`, regenerate client types and push schema:
  ```bash
  cd server && npm run prisma:generate && npm run prisma:push
  ```

---

## 22. Testing

Run automated build and validation checks:

```bash
# Test frontend compilation
npm run build

# Test backend compilation
cd server && npm run build

# Test test suites
npm test
```

---

## 23. Future Improvements

- [ ] Selective Forwarding Unit (SFU) architecture integration (e.g. mediasoup / LiveKit) for ultra-large meetings (100+ attendees).
- [ ] End-to-end meeting recording server-side synthesis via headless Chromium / GStreamer.
- [ ] Breakout rooms for small group discussions during large sessions.
- [ ] Native mobile apps using React Native with WebRTC bridge.

---

## 24. License

This project is licensed under the MIT License — see the LICENSE file for details.
