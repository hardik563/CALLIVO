# 16. Codebase Anatomy & Project Structure — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Complete Architectural Directory Tree and Module Guide

---

## 1. Monorepo Organization

CALLIVO is structured as a unified monorepo housing both the **React 18 / Vite** client application in the root/`src/` directory and the **Node.js / Express / Socket.IO** backend service in the `server/` directory:

```
CALLIVO/
├── .env.example             # Template for all environment variables
├── Dockerfile               # Multi-stage production container build
├── render.yaml              # Render cloud blueprint (Backend + PostgreSQL)
├── vercel.json              # Vercel configuration (SPA rewrites + client build)
├── package.json             # Root monorepo scripts & frontend dependencies
├── vite.config.ts           # Vite bundler, plugins, and path aliases
├── tailwind.config.js       # Design tokens, color palette, and layout extensions
├── tsconfig.json            # Root TypeScript compiler options
├── index.html               # Frontend HTML5 entry point with branding metadata
│
├── public/                  # Static web assets (favicons, manifest, branding)
│   ├── favicon.svg          # Canonical CALLIVO brand favicon
│   └── site.webmanifest     # Progressive web application manifest
│
├── scripts/                 # Asset generation scripts (build-assets.mjs)
│
├── src/                     # FRONTEND SOURCE CODE (React 18 + Vite)
│   ├── components/          # Reusable UI component atoms and feature modules
│   │   ├── auth/            # AuthLayout split cards and form banners
│   │   ├── dashboard/       # Dashboard modal dialogues (JoinMeetingModal.tsx)
│   │   ├── landing/         # Marketing hero and feature preview components
│   │   ├── meeting/         # Core video conferencing UI (15 components)
│   │   ├── profile/         # AvatarCropModal and profile management
│   │   ├── three/           # 3D WebGL scenes (Hero3D, SpatialMeetingRoom)
│   │   └── ui/              # Atom UI primitives (Button, Modal, Drawer, etc.)
│   ├── data/                # Mock data fallbacks and static platform constants
│   ├── hooks/               # Custom React hooks (useMediaStream, useAudioMeter)
│   ├── layouts/             # Page structural shells (AppLayout, AuthLayout)
│   ├── lib/                 # Browser client libraries (webrtc.ts, socket.ts, api.ts)
│   ├── pages/               # Routable page views (19 full-screen pages)
│   ├── stores/              # Zustand global reactive state stores (9 stores)
│   ├── types/               # TypeScript interface and type declarations
│   ├── App.tsx              # Router declaration, ToastProvider, RouteHeadHandler
│   ├── index.css            # Tailwind directives and custom animation classes
│   └── main.tsx             # React DOM root initialization
│
└── server/                  # BACKEND SOURCE CODE (Node.js + Express + Socket.IO)
    ├── prisma/              # Database schema & migrations
    │   ├── dev.db           # SQLite database file (local development only)
    │   └── schema.prisma    # Authoritative Prisma schema (26 models)
    ├── scripts/             # Container orchestration scripts
    │   ├── start-production.cjs   # Container boot & Neon connection sanitizer
    │   ├── sync-db-provider.cjs   # PostgreSQL vs SQLite provider synchronizer
    │   └── test_signaling_production.cjs # Socket.IO signaling integration probe
    ├── src/                 # Backend TypeScript source code
    │   ├── app.ts           # Express application, middleware, and route mounting
    │   ├── index.ts         # Server entry point: HTTP bind & DB initialization
    │   ├── auth/            # Authentication controller, service, Zod schemas
    │   ├── calendar/        # Calendar events API controller and service
    │   ├── common/          # Middleware: auth, error handler, rate limiters
    │   ├── config/          # Environment configuration loader
    │   ├── contacts/        # Address book and contacts controller & service
    │   ├── db/              # Prisma client singleton and connection optimizer
    │   ├── email/           # Resend transactional email service
    │   ├── helpdesk/        # Customer support ticket controller & service
    │   ├── meetings/        # Meeting lifecycle, participants, Q&A, comments
    │   ├── messages/        # Direct 1-on-1 messaging controller & service
    │   ├── notifications/   # In-app notifications controller & service
    │   ├── recordings/      # Call recording controller and file storage service
    │   ├── settings/        # User settings & hardware preferences service
    │   ├── signaling/       # Socket.IO signaling gateway & in-memory room map
    │   ├── test-platform.ts # Comprehensive test suite runner
    │   └── users/           # User profile & binary avatar upload controller
    ├── package.json         # Backend dependencies and build scripts
    └── tsconfig.json        # Backend TypeScript compiler configuration
```

---

## 2. Key Directories & Architectural Roles

### `src/lib/` (The Core Client Engines)
- **`webrtc.ts` (`WebRTCManager`):** The heart of client media transport. Handles `getUserMedia`, `RTCPeerConnection` lifecycles, transceivers, SDP negotiation, dual-output audio playback, Web Audio API destination routing, and ICE restart.
- **`socket.ts` (`getSocket()`):** Singleton factory for the Socket.IO client, managing automatic reconnection and authentication token injection.
- **`api.ts` (`apiRequest()`):** Type-safe fetch client wrapping REST calls with `Authorization: Bearer <token>` injection and automated 401 token cleanup.

### `server/src/signaling/` (The Real-Time Hub)
- **`signaling.gateway.ts`:** Implements all WebRTC signaling event listeners (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`), in-memory room maps, host moderation commands, lobby admittance, and active speaker broadcasts.

### `server/src/db/` & `server/prisma/` (Persistence)
- **`schema.prisma`:** Defines all 26 relational models.
- **`prisma.ts`:** Exports the singleton Prisma client instance, augmented with automated connection string optimization for Neon connection pooling.

### `server/scripts/` (DevOps & Orchestration)
- **`sync-db-provider.cjs`:** Automatically modifies `schema.prisma` provider to `postgresql` or `sqlite` based on `DATABASE_URL`.
- **`start-production.cjs`:** Sanitizes Neon pooled parameters and launches the production Express server with immediate port binding.
