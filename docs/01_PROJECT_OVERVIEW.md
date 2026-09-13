# 01. Project Overview — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> **Live Website:** [https://callivo.vercel.app](https://callivo.vercel.app)  
> **Production Backend:** [https://callivo-f1n8.onrender.com](https://callivo-f1n8.onrender.com)  
> **Source Repository:** [https://github.com/hardik563/CALLIVO](https://github.com/hardik563/CALLIVO)

---

## 1. Executive Summary

**CALLIVO is a real-time video conferencing application.**

Designed to deliver seamless, low-latency communication directly within modern web browsers, CALLIVO removes the friction of proprietary desktop installers, account paywalls, and bloated third-party plugins. By unifying high-performance WebRTC peer-to-peer audio/video streaming with a robust, enterprise-ready TypeScript server architecture and an interactive 3D spatial interface, CALLIVO provides a full-featured collaboration platform suitable for spontaneous meetings, scheduled team syncs, and large-scale organizational collaboration.

```mermaid
graph TD
    subgraph Client Layer
        A[User Browser A] 
        B[User Browser B]
    end

    subgraph Signaling & Control Plane
        C[Socket.IO Gateway / Node.js Server]
        D[REST API Express Backend]
    end

    subgraph Data Persistence Plane
        E[(PostgreSQL Neon Database)]
        F[(Local SQLite Cache / Fallback)]
    end

    subgraph Media Transport Plane
        G((P2P WebRTC Direct Audio/Video))
        H[STUN / TURN Relays Google & Metered]
    end

    A -- REST HTTP Auth/State --> D
    B -- REST HTTP Auth/State --> D
    D <--> E
    D -.-> F

    A <== WebSocket Signaling Control ==> C
    B <== WebSocket Signaling Control ==> C

    A <=== Encrypted SRTP/RTP Audio & Video ===> G
    G <=== Encrypted SRTP/RTP Audio & Video ===> B
    A -. NAT Traversal .-> H
    B -. NAT Traversal .-> H
```

---

## 2. The Problem CALLIVO Solves

Contemporary digital communication platforms suffer from several recurring friction points:

1. **Mandatory Software Downloads & OS Barriers:** Many proprietary meeting tools force users to download native desktop packages, frequently triggering corporate firewall restrictions and slow onboarding.
2. **High Latency and Server Bottlenecks:** Centralized media servers that decode and re-encode video feeds introduce perceptible latency, heavy computing costs, and single points of infrastructure failure.
3. **Complex User Experiences:** Traditional conferencing user interfaces are often cluttered with obscure submenus, confusing audio device configuration, and opaque connection health states.
4. **Data Isolation & Vendor Lock-in:** Small-to-medium teams often lack control over meeting records, chat archives, scheduling databases, and participant access controls.

**How CALLIVO Solves This:**
- **Zero-Install WebRTC Engine:** Operates natively inside any standard browser supporting HTML5 and WebRTC standards (Chrome, Edge, Firefox, Safari) across desktop and mobile devices.
- **Direct P2P Media Flow:** Audio and video packets travel directly between participant browsers with sub-100ms latency, bypassing backend media processing bottlenecks.
- **Transparent Audio & Video Diagnostics:** Real-time round-trip time (RTT), packet loss percentage, jitter calculations, and active speaker visualizers empower users with full visibility into connection health.
- **Unified Full-Stack Suite:** Integrates in-meeting controls with account profiles, direct messaging, interactive calendars, call recordings, participant reporting, and customer helpdesk ticketing.

---

## 3. Core Objectives

- **Ultra-Low Latency Communication:** Maintain sub-150ms round-trip latency for audio and video media streams across diverse networking environments.
- **Resilient Media Transport:** Employ dual-playback audio pipelines (HTMLAudioElement + Web Audio API `AudioContext`) and browser autoplay-unlock watchers to guarantee incoming voice streams are heard without manual browser restarts.
- **Enterprise-Grade Control:** Provide meeting hosts with strict security tools, including waiting room lobbies, room locking, force mute, participant removal, spotlighting, and granular permissions.
- **Immersive Visual Aesthetics:** Deliver a modern, dark-mode glassmorphic user experience augmented with Three.js / React Three Fiber spatial meeting visualizations and responsive Tailwind CSS layout grids.
- **Clean Architectural Separation:** Maintain strict decoupling between signaling control messages (Socket.IO), media transmission (WebRTC RTP), application state (Zustand), and data persistence (Prisma ORM).

---

## 4. Target Audience

- **Distributed Engineering & Product Teams:** Requiring rapid, screen-sharing-enabled standups without software friction.
- **Educational Institutions & Mentorship Programs:** Demanding waiting room approval flows, in-meeting Q&A with upvoting, pinned questions, and real-time live captions.
- **Enterprise & Client Consultations:** Requiring branded lobbies, custom passcodes, participant reports, and direct contact management.
- **General Consumers:** Seeking instant, link-based video calls with friends and family without mandatory registration.

---

## 5. Major Features Overview

| Functional Area | Key Capabilities |
| :--- | :--- |
| **Video Conferencing** | HD Video (up to 1080p 60fps), dynamic grid layouts, speaker spotlighting, camera toggle, virtual backgrounds (blur/presets). |
| **Audio Engine** | WebRTC Opus stereo audio, noise suppression, acoustic echo cancellation, auto-gain control, active speaker detection, and dual-output playback. |
| **Collaboration** | Screen sharing via `getDisplayMedia`, in-meeting public and private chat, floating emoji reactions, hand raising with host alerts, interactive Q&A upvoting. |
| **Meeting Governance** | Host waiting room lobby, admit/reject controls, room locking, passcode protection, participant removal, host transfer, co-host assignment. |
| **Live Captions** | Real-time browser speech recognition with broadcast subtitles and speaker attribution. |
| **Productivity Tools** | Integrated personal calendar, direct messaging with contacts, meeting recording upload and playback, customer support helpdesk ticket tracking. |
| **3D Spatial Interface** | Interactive Three.js / React Three Fiber 3D spatial room on landing and preview stages with floating participant panels and dynamic lighting. |

---

## 6. How a User Uses the Application

### A. Instant Guest Call Flow
1. User receives an invitation link (`https://callivo.vercel.app/room/clv-849-2180`).
2. User enters the **Meeting Lobby** (`/meetings/:id/lobby`), previews their camera and microphone, enters their display name, and clicks **Join Meeting**.
3. If the host enabled a **Waiting Room**, the user waits in a branded queue while the host receives an alert with an **Admit** button.
4. Once admitted, the client connects to Socket.IO signaling, performs automated WebRTC SDP offer/answer exchange, and enters the **Meeting Room** (`/room/:id`).
5. Live audio and video stream directly between peers; users can mute/unmute, share their screen, send chat messages, or trigger emoji bursts.

### B. Registered Host & Productivity Flow
1. User logs in via email/password or account federation.
2. The **Dashboard** (`/dashboard`) presents scheduled meetings, quick actions (Create Instant Meeting, Schedule Meeting, Join via Code), and recent activity metrics.
3. The user schedules a meeting for an upcoming date, setting passcode requirements and toggling the waiting room.
4. The meeting appears instantly in the integrated **Calendar** (`/calendar`).
5. Upon launching the meeting, the user possesses host privileges: ability to mute participants, lock the room, record the session, lower raised hands, or end the meeting for all attendees.

---

## 7. Architecture Boundaries: The Core Subsystems

Understanding CALLIVO requires understanding the distinct responsibilities of its core layers:

```mermaid
classDiagram
    class Frontend {
        React 18 + Vite SPA
        Zustand Stores
        Tailwind CSS + Three.js
        Captures Mic & Camera
    }
    class SignalingServer {
        Socket.IO on Node.js
        Routes SDP Offers & Answers
        Relays ICE Candidates
        Manages Room Presence
    }
    class BackendAPI {
        Express REST Endpoints
        JWT Authentication
        Meeting Authorization
        Rate Limiting & Helmet
    }
    class Database {
        PostgreSQL on Neon
        Prisma ORM Client
        Stores Users, Meetings, Logs
    }
    class WebRTCMediaPlane {
        Peer-to-Peer RTCPeerConnection
        SRTP/SRTCP Encrypted Packets
        Direct Browser-to-Browser
    }
    class CloudInfrastructure {
        Vercel (Client Edge CDN)
        Render (Node Container)
        STUN/TURN Relay Network
    }

    Frontend --> BackendAPI : REST HTTP (Auth, CRUD)
    Frontend <--> SignalingServer : WebSocket Events (Signaling)
    Frontend <--> WebRTCMediaPlane : Direct Media Stream Tracks
    BackendAPI <--> Database : Prisma Connection Pool
    SignalingServer <--> Database : Presence Updates
    WebRTCMediaPlane -.-> CloudInfrastructure : ICE Candidates & Relays
```

### 1. Frontend (Client-Side Application)
- **Role:** The user-facing interface running entirely inside the visitor's browser.
- **Technologies:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Three.js / React Three Fiber, Zustand.
- **Responsibilities:** Renders pages and interactive controls; accesses user hardware devices via `navigator.mediaDevices.getUserMedia`; renders remote video tracks into HTML5 `<video>` tags; routes audio streams into DOM audio nodes.

### 2. Backend (REST API Server)
- **Role:** The stateless HTTP application server that manages business logic, authorization, and persistence.
- **Technologies:** Node.js, Express, TypeScript, Zod schema validation, JSON Web Tokens (JWT), bcryptjs.
- **Responsibilities:** Authenticates credentials, validates input payloads, issues and verifies JWT tokens, controls access to meeting metadata, handles avatar uploads, and manages support tickets.

### 3. Database & ORM
- **Role:** The durable persistence layer holding system state.
- **Technologies:** PostgreSQL (hosted on Neon Serverless) in production, SQLite for local offline development; managed through Prisma ORM.
- **Responsibilities:** Stores users, meetings, participants, contacts, direct messages, calendar events, recording metadata, device logs, and system audit trails.

### 4. Signaling Gateway (Socket.IO)
- **Role:** The bidirectional messaging hub that coordinates connection setup between browsers.
- **Technologies:** Socket.IO running atop the Node.js HTTP server.
- **Critical Distinction:** **Signaling carries control messages ONLY (SDP offers, SDP answers, ICE candidates, chat strings, mute flags). It NEVER carries audio or video media data.**

### 5. WebRTC Engine (Media Transport Plane)
- **Role:** The native browser subsystem executing peer-to-peer real-time communication.
- **Protocols:** RTP (Real-time Transport Protocol), SRTP (Secure RTP), DTLS (Datagram Transport Layer Security), SCTP.
- **Responsibilities:** Compresses voice using Opus and video using VP8/H.264; encrypts media packets end-to-end; negotiates network traversal paths (ICE); streams packets directly from Browser A to Browser B.

### 6. Deployment & Infrastructure
- **Role:** The global cloud environment hosting and delivering CALLIVO.
- **Components:**
  - **Vercel:** Hosts the pre-compiled React SPA bundle with global Edge CDN caching.
  - **Render:** Runs the Node.js/Express/Socket.IO backend container with zero-downtime restarts.
  - **Neon Serverless PostgreSQL:** Provides autoscaling cloud SQL storage with PgBouncer connection pooling.
  - **Google & Metered STUN/TURN Relays:** Provide NAT discovery and relay fallback for symmetric enterprise firewalls.

---

## 8. Why CALLIVO is Technically Interesting

1. **Complex Asynchronous State Synchronization:** Coordinating real-time WebRTC peer connection lifecycles across multiple browsers alongside distributed Socket.IO signaling events and Zustand local stores requires strict state machine management.
2. **Dual-Pipeline Audio Transport & Autoplay Recovery:** Modern browser security policies aggressively block unmuted audio playback without user interaction. CALLIVO incorporates a self-healing audio architecture combining background DOM audio elements, Web Audio API destination routing, and global gesture-unlock listeners.
3. **Optimized Multi-Cloud Deployment Architecture:** Cleanly isolates the frontend on edge-routed static CDN infrastructure (Vercel) from the long-lived stateful WebSocket backend (Render) while maintaining shared session authentication and strict CORS boundary enforcement.
4. **Hybrid Database Provider Engine:** Implements runtime provider synchronization that seamlessly transitions between lightweight local SQLite development and high-concurrency cloud PostgreSQL (Neon PgBouncer) without manual code alterations.
