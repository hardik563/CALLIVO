# 18. Technical Interview Preparation Guide (50+ Questions) — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Comprehensive Interview Study Guide with Short Answers, Deep Technical Explanations, and Project-Specific Code Examples

---

## Group 1: Project Basics & System Overview

### Q1: What is CALLIVO and what core problem does it solve?
- **Short Answer:** CALLIVO is a full-stack real-time video conferencing web application providing zero-install, low-latency audio/video collaboration directly inside modern web browsers.
- **Detailed Answer:** Unlike legacy software requiring desktop executable downloads, administrative privileges, or paid account tiers, CALLIVO uses browser-native WebRTC mesh streaming combined with a TypeScript/Express backend and PostgreSQL database to offer immediate meeting creation, screen sharing, lobby security, and collaboration tools.
- **CALLIVO Example:** The user can instantly spin up a meeting via `/meetings` or share a URL like `https://callivo.vercel.app/room/clv-849-2180` to invite peers who join with zero plugin installation.

### Q2: What is the difference between the signaling plane and the media plane in CALLIVO?
- **Short Answer:** The signaling plane (Socket.IO over TCP) exchanges session control metadata like SDP offers and ICE candidates, while the media plane (WebRTC over UDP) transports encrypted audio and video directly between browsers.
- **Detailed Answer:** Media streams require low latency and can tolerate minor packet loss, making UDP the ideal transport. Signaling requires guaranteed, ordered text delivery, making WebSockets over TCP ideal. Media never passes through the Node.js backend server.
- **CALLIVO Example:** `server/src/signaling/signaling.gateway.ts` handles `webrtc:offer` and `webrtc:answer` JSON text messages, but has zero visibility into the actual binary Opus/VP8 media packets traveling between peers.

### Q3: Why did you choose a Peer-to-Peer (Mesh) architecture over an SFU (Selective Forwarding Unit)?
- **Short Answer:** Mesh P2P requires zero media server operating costs, introduces no server-side transcoding latency, and ensures end-to-end encryption between peers.
- **Detailed Answer:** For standard team meetings (2–6 participants), Mesh P2P is highly cost-effective and architecturally clean because each browser encodes and transmits directly to connected peers. An SFU (like mediasoup) requires dedicated media server clusters and high operational costs, and is planned for future enterprise scaling beyond 8–10 concurrent participants.
- **CALLIVO Example:** `WebRTCManager` maintains a `peerConnections: Map<string, RTCPeerConnection>` map containing an independent direct connection for each active peer in the room.

---

## Group 2: React & Frontend Architecture

### Q4: Why did you use React 18 for CALLIVO?
- **Short Answer:** React 18's component-based model, concurrent rendering capabilities, and mature WebGL/Three.js ecosystem integration make it ideal for managing complex real-time video interfaces.
- **Detailed Answer:** Managing dozens of interactive UI elements (video tiles, dynamic grid layouts, audio wave visualizers, chat drawers, modals) requires a reactive virtual DOM that updates efficiently without blocking the main JavaScript thread.
- **CALLIVO Example:** `ParticipantGrid.tsx` seamlessly re-computes CSS grid geometry and renders memoized `ParticipantTile.tsx` instances as peers join and leave.

### Q5: How do you prevent unnecessary re-renders in the active meeting room?
- **Short Answer:** By combining Zustand atomic selectors with isolated sub-components and React memoization.
- **Detailed Answer:** High-frequency events like audio volume metering (firing 10 times a second) would cripple performance if placed in a top-level meeting room component. CALLIVO delegates volume metering to `useAudioMeter` hooks inside individual participant tiles, and uses granular Zustand selectors (`useMeetingStore(state => state.isAudioMuted)`).
- **CALLIVO Example:** In `MeetingControls.tsx`, buttons only re-render when their specific slice of state (e.g., `isScreenSharing`) mutates.

### Q6: How does `ParticipantTile` bind and manage remote MediaStream references?
- **Short Answer:** It utilizes a `useRef<HTMLVideoElement>` and binds `videoRef.current.srcObject = stream` inside a `useEffect` hook.
- **Detailed Answer:** In React, setting `srcObject` via standard JSX attributes is not consistently supported across all browser implementations. Calling `videoRef.current.srcObject = stream` in a `useEffect` when the `stream` prop changes ensures reliable video attachment.
- **CALLIVO Example:** In `src/components/meeting/ParticipantTile.tsx`:
  ```typescript
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  ```

---

## Group 3: TypeScript & Type Safety

### Q7: Why did you choose TypeScript for both frontend and backend?
- **Short Answer:** TypeScript enforces static type contracts across the entire monorepo, eliminating runtime property mismatches in asynchronous WebRTC and Socket.IO payloads.
- **Detailed Answer:** In real-time conferencing, passing an unexpected field name in an SDP payload or participant state object can silently break call establishment. TypeScript guarantees that both frontend stores and backend gateways share identical interface definitions (`ParticipantState`, `ConnectionStats`).
- **CALLIVO Example:** `ParticipantState` in `server/src/signaling/signaling.gateway.ts` is mirrored in `src/types/` on the client, ensuring contract safety.

### Q8: How does TypeScript integrate with Zod in your project?
- **Short Answer:** Zod schemas validate runtime request payloads and automatically infer static TypeScript types using `z.infer<typeof Schema>`.
- **Detailed Answer:** This guarantees that data entering the backend is validated at runtime, while eliminating the need to write duplicate TypeScript interfaces for DTOs.
- **CALLIVO Example:** `RegisterSchema` in `server/src/auth/auth.controller.ts` validates incoming JSON and guarantees `req.body` possesses `name`, `email`, and `password` of required lengths.

---

## Group 4: State Management & Zustand

### Q9: Why did you choose Zustand over Redux or React Context?
- **Short Answer:** Zustand is lightweight, requires zero boilerplate, supports atomic state subscriptions, and allows imperative state manipulation outside React components.
- **Detailed Answer:** React Context triggers full subtree re-renders whenever any state value changes. Redux introduces heavy boilerplate (actions, reducers, dispatchers). Zustand allows imperative mutation via `store.getState().action()`, which is critical for WebRTC event callbacks (`pc.ontrack`) that execute outside the React lifecycle.
- **CALLIVO Example:** In `src/lib/webrtc.ts`, `WebRTCManager` calls `useParticipantStore.getState().updateParticipant(socketId, { ... })` directly inside raw WebRTC callbacks.

### Q10: How does `participantStore.ts` handle dynamic peer rosters?
- **Short Answer:** It stores participants in a JavaScript `Map<string, ParticipantState>` keyed by socket ID, providing $O(1)$ lookups, updates, and removals.
- **Detailed Answer:** Using an array for real-time participant lists requires repeated $O(N)$ searches when updating mute flags or hand raises. A Map ensures instantaneous access even in high-density multi-party calls.
- **CALLIVO Example:** `updateParticipant: (socketId, updates) => set(state => { ... state.participants.set(socketId, updated); })`.

---

## Group 5: Backend & Node.js Architecture

### Q11: What is the role of `server.listen` in `server/src/index.ts`?
- **Short Answer:** It binds the Express HTTP server to port 5000 immediately upon startup, satisfying cloud deployment health checks in under 1 second.
- **Detailed Answer:** Cloud platforms like Render monitor bound ports during container initialization. If database connections or schema migrations run synchronously before `server.listen()`, the container risks timing out and terminating. Binding immediately guarantees zero-downtime startup.
- **CALLIVO Example:** `server.listen(PORT)` is called first in `bootstrap()`, followed by asynchronous, non-blocking `initializeDatabase()`.

### Q12: How does CALLIVO handle centralized error handling in Express?
- **Short Answer:** Via a custom `AppError` class and an Express error-handling middleware (`(err, req, res, next)`).
- **Detailed Answer:** Business logic throws instances of `AppError(message, statusCode)`. The centralized middleware catches all thrown exceptions, distinguishes operational errors from programming bugs, logs stack traces, and returns clean JSON error responses.
- **CALLIVO Example:** `server/src/common/error.middleware.ts` intercepts errors and formats them into `{ success: false, message: err.message }`.

### Q13: How does the backend serve both API routes and static frontend assets?
- **Short Answer:** Through Express route precedence: API routes are mounted first (`/api/*`), followed by static middleware (`express.static`) and a wildcard SPA fallback (`app.get('*')`).
- **Detailed Answer:** In unified container deployments, Express serves static assets from `/app/dist`. Any unmatched GET request that does not start with `/api` or `/socket.io` returns `dist/index.html`, allowing React Router to resolve client-side routes.
- **CALLIVO Example:** In `server/src/app.ts`, `app.get('*', ... res.sendFile(path.join(distPath, 'index.html')))` enables direct browser navigation to `/room/:id`.

---

## Group 6: Database & Prisma ORM

### Q14: Why did you use Prisma ORM instead of TypeORM or raw SQL?
- **Short Answer:** Prisma provides complete type safety, automated migrations, auto-generated TypeScript clients, and robust protection against SQL injection.
- **Detailed Answer:** Prisma analyzes `schema.prisma` to generate fully typed database methods (`prisma.meeting.findUnique(...)`). Queries use parameterized statements, preventing SQL injection attacks without manual escaping.
- **CALLIVO Example:** `server/prisma/schema.prisma` declares all 26 application models and automatically generates the `@prisma/client` library.

### Q15: How does CALLIVO switch between SQLite and PostgreSQL?
- **Short Answer:** Via an automated pre-generation script (`sync-db-provider.cjs`) that inspects `DATABASE_URL`.
- **Detailed Answer:** If `DATABASE_URL` starts with `postgres://`, it rewrites the datasource provider in `schema.prisma` to `postgresql`. If it starts with `file:`, it sets it to `sqlite`. This allows seamless switching between local offline development and cloud production.
- **CALLIVO Example:** `npm run prisma:generate` runs `node scripts/sync-db-provider.cjs && prisma generate`.

### Q16: How does CALLIVO handle Neon PostgreSQL connection pooling?
- **Short Answer:** By sanitizing the connection string to append `pgbouncer=true` and `connect_timeout=15` for pooled endpoints.
- **Detailed Answer:** Neon's pooled connections (`-pooler`) run through PgBouncer, which operates in transaction mode. Adding `?pgbouncer=true` informs Prisma to disable prepared statements that conflict with transaction-level pooling.
- **CALLIVO Example:** `server/src/db/prisma.ts` executes `getOptimizedDatabaseUrl()` to enforce these query parameters.

---

## Group 7: Authentication & Security

### Q17: Explain the Dual-Token JWT strategy implemented in CALLIVO.
- **Short Answer:** Short-lived access tokens (15 minutes) authorize API requests, while long-lived refresh tokens (7 days) stored in HTTP-only cookies securely rotate sessions.
- **Detailed Answer:** If an access token is intercepted, the attacker's window of opportunity is limited to 15 minutes. Long-lived refresh tokens cannot be stolen via JavaScript XSS because they reside in `HttpOnly`, `Secure`, `SameSite=Lax` cookies and can be revoked in the database.
- **CALLIVO Example:** `server/src/auth/auth.service.ts` generates both tokens via `generateTokens()` and sets the cookie via `res.cookie('refreshToken', ...)`.

### Q18: Why is password hashing with bcrypt considered secure?
- **Short Answer:** bcrypt uses a computationally expensive key derivation function with an adaptive work factor (salt rounds) to resist brute-force and rainbow-table attacks.
- **Detailed Answer:** A raw SHA-256 hash can be computed billions of times per second on GPUs. bcrypt with 10 rounds forces deliberate CPU delays (approx. 100ms per check), making large-scale dictionary attacks computationally infeasible.
- **CALLIVO Example:** `await bcrypt.hash(data.password, 10)` in `AuthService.register`.

### Q19: How does CALLIVO protect against Cross-Site Scripting (XSS) and Clickjacking?
- **Short Answer:** Through Helmet security headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`) and React's automated HTML string escaping.
- **Detailed Answer:** Helmet configures standard HTTP headers preventing external sites from embedding CALLIVO in iframes (clickjacking). React automatically escapes strings before injecting them into the DOM, preventing script injection.
- **CALLIVO Example:** `app.use(helmet({ ... }))` configured in `server/src/app.ts`.

---

## Group 8: WebRTC & Networking

### Q20: What is the purpose of STUN and TURN servers?
- **Short Answer:** STUN discovers a browser's public IP and port behind NAT, while TURN acts as an encrypted relay when firewalls completely block direct P2P connections.
- **Detailed Answer:** Most residential routers use symmetric or cone NAT. A STUN query reflects the public mapping. In enterprise environments where symmetric NAT blocks direct UDP routing, traffic falls back to a TURN relay server.
- **CALLIVO Example:** `DEFAULT_ICE_SERVERS` in `src/lib/webrtc.ts` configures Google STUN servers with automated fallback to OpenRelay TURN servers (`openrelay.metered.ca`).

### Q21: What is an SDP (Session Description Protocol) and what does it contain?
- **Short Answer:** SDP is a text-based format describing media capabilities, codecs, encryption keys, and network settings for a real-time session.
- **Detailed Answer:** It contains media descriptions (`m=audio`, `m=video`), transport protocols (`UDP/TLS/RTP/SAVPF`), supported codecs (Opus, VP8), bandwidth parameters, and DTLS fingerprint attributes.
- **CALLIVO Example:** `const offer = await pc.createOffer();` generates an SDP string that is inspected and sent via `webrtc:offer`.

### Q22: What is `RTCRtpTransceiver` and why is its `direction` property critical?
- **Short Answer:** A transceiver represents a paired sender and receiver. Its `direction` property (`sendrecv`, `sendonly`, `recvonly`, `inactive`) governs media transmission.
- **Detailed Answer:** If direction is set to `recvonly`, the browser will receive media but refuse to send audio/video even if a live track is attached to the sender. Setting `direction = 'sendrecv'` guarantees bidirectional media flow.
- **CALLIVO Example:** In `src/lib/webrtc.ts`, `audioTransceiver.direction = 'sendrecv'` is explicitly verified on both offerer and answerer sides.

### Q23: How does CALLIVO implement screen sharing without renegotiating the WebRTC connection?
- **Short Answer:** By calling `sender.replaceTrack(newTrack)` on the existing video `RTCRtpSender`.
- **Detailed Answer:** Calling `addTrack` or `removeTrack` mutates the peer connection's media topology and requires a full SDP renegotiation cycle. `replaceTrack()` swaps the underlying video hardware source seamlessly over the existing RTP stream.
- **CALLIVO Example:** In `WebRTCManager`:
  ```typescript
  const vSender = pc.getSenders().find(s => s.track?.kind === 'video');
  if (vSender) await vSender.replaceTrack(screenTrack);
  ```

### Q24: What is the WebRTC Autoplay Policy issue and how did you resolve it?
- **Short Answer:** Browsers block unmuted audio playback if initiated without a user interaction. CALLIVO traps playback failures and presents an "Unmute Audio" gesture prompt.
- **Detailed Answer:** Calling `audioEl.play()` programmatically when an incoming peer joins throws a `NotAllowedError`. CALLIVO catches this, sets `isAudioAutoplayBlocked = true`, and binds global click/tap listeners that simultaneously call `play()` on all queued audio elements and resume the `AudioContext`.
- **CALLIVO Example:** `WebRTCManager.attachUnlockListeners()` and `MeetingControls.tsx` autoplay alert banner.

### Q25: What is `bundlePolicy: 'max-bundle'` and why is it used in CALLIVO?
- **Short Answer:** It forces all media streams (audio, video) to multiplex across a single UDP candidate pair (single IP/port).
- **Detailed Answer:** Without `max-bundle`, the browser establishes separate network candidate pairs for audio and video, doubling connection setup latency and ICE candidate traffic. `max-bundle` accelerates call setup.
- **CALLIVO Example:** Configured in `new RTCPeerConnection({ bundlePolicy: 'max-bundle' })`.

---

## Group 9: Socket.IO & Signaling

### Q26: Why is Socket.IO preferred over raw WebSockets in CALLIVO?
- **Short Answer:** Socket.IO provides automated reconnection, HTTP long-polling fallbacks, built-in room abstractions, and client acknowledgement callbacks out of the box.
- **Detailed Answer:** Raw WebSockets require writing custom heartbeat ping/pong mechanics, buffering reconnection queues, and managing socket room registries. Socket.IO simplifies room multicasting via `socket.to('room:id').emit(...)`.
- **CALLIVO Example:** `server/src/signaling/signaling.gateway.ts` utilizes `socket.join('room:' + meetingId)`.

### Q27: How does the server authenticate incoming Socket.IO connections?
- **Short Answer:** Via an `io.use()` middleware that verifies JWT tokens from `socket.handshake.auth.token`.
- **Detailed Answer:** If a valid JWT is provided, the socket is bound to the authenticated `User` record. If missing or invalid, the middleware assigns an isolated guest identity (`guest_<random>`), permitting public meeting access while isolating user data.
- **CALLIVO Example:** `server/src/signaling/signaling.gateway.ts` lines 58–91.

### Q28: What happens on the server when a socket disconnects unexpectedly?
- **Short Answer:** The server marks the participant's departure in the database, removes them from the in-memory room map, broadcasts `participant:left` to peers, and transfers host status if necessary.
- **Detailed Answer:** In `socket.on('disconnect')`, the server updates `MeetingParticipant.leftAt` in PostgreSQL, emits `participant:left` so peers can destroy `RTCPeerConnection` instances, and automatically promotes the next participant if the host departed.
- **CALLIVO Example:** `signaling.gateway.ts` lines 643–704.

---

## Group 10: 3D Graphics & Three.js

### Q29: Where is Three.js utilized in CALLIVO?
- **Short Answer:** In the landing page interactive hero (`Hero3D.tsx`) and the experimental virtual boardroom (`SpatialMeetingRoom.tsx`).
- **Detailed Answer:** Using React Three Fiber and `@react-three/drei`, CALLIVO renders hardware-accelerated 3D environments where participant video streams can be mapped as dynamic textures on 3D spatial surfaces.
- **CALLIVO Example:** `src/components/three/Hero3D.tsx` renders a 3D conference hub with floating participant nodes and dynamic particle lighting.

### Q30: How does `VideoPanel3D.tsx` project a live video stream into 3D space?
- **Short Answer:** By creating a Three.js `VideoTexture` referencing the HTML5 `<video>` element and applying it to a plane geometry mesh.
- **Detailed Answer:** Three.js samples frames from the HTML5 video tag on every render tick (`requestAnimationFrame`) and uploads them as an active GPU texture mapped to a 3D surface.
- **CALLIVO Example:** `src/components/three/VideoPanel3D.tsx`.

---

## Group 11: Deployment & Cloud Operations

### Q31: What is the separation of responsibilities between Vercel and Render in CALLIVO?
- **Short Answer:** Vercel serves the static frontend SPA via global edge CDN, while Render executes the stateful Node.js container with long-lived WebSocket connections.
- **Detailed Answer:** Serverless edge platforms like Vercel excel at fast global asset delivery, but terminate long-lived WebSocket connections after short timeouts. Render runs a persistent container ideal for Socket.IO signaling.
- **CALLIVO Example:** Frontend requests static HTML from `https://callivo.vercel.app`, which dials `https://callivo-f1n8.onrender.com` for APIs and WebSockets.

### Q32: Why must backend environment secrets never be prefixed with `VITE_`?
- **Short Answer:** Vite embeds any variable prefixed with `VITE_` directly into the public, unminified client JavaScript bundle.
- **Detailed Answer:** Frontend variables (`VITE_API_URL`) are public by design. Backend secrets (database passwords, JWT secrets, Resend API keys) must remain strictly on the server to prevent catastrophic credential leaks.
- **CALLIVO Example:** `JWT_SECRET` has no `VITE_` prefix and is only accessible inside `server/src/config/`.

---

*(Questions 33 through 55 continue across performance, diagnostics, moderation, and database optimization...)*

### Q33: How does active speaker detection work using the Web Audio API?
- **Answer:** An `AnalyserNode` connects to the local audio track. Its `getByteFrequencyData` method samples frequency bins every 200ms. If average energy exceeds a predefined threshold, `onSpeakingChange(true)` triggers.

### Q34: What happens if an ICE candidate arrives before the remote description is set?
- **Answer:** The browser throws an error. CALLIVO solves this race condition by queuing candidates in `pendingCandidates: Map<string, RTCIceCandidateInit[]>` and draining them only after `setRemoteDescription` resolves.

### Q35: How does the waiting room lobby work from a networking perspective?
- **Answer:** Non-host participants join a separate Socket.IO room (`waiting:${meetingId}`). They do not receive any peer SDP offers or WebRTC streams until the host emits `lobby:admit`.

### Q36: How does host mute enforcement work?
- **Answer:** When a host clicks "Mute Participant", the server validates host authority and emits `host:force-mute` to the target socket. The target client immediately sets `localAudioTrack.enabled = false` and updates UI state.

### Q37: How is network quality calculated in `ConnectionDiagnosticsModal`?
- **Answer:** By querying `pc.getStats()`. Round-trip time (RTT) is extracted from the active `candidate-pair`, and packet loss is calculated from inbound RTP lost packets vs. total received packets.

### Q38: What audio processing constraints are applied to `getUserMedia`?
- **Answer:** `echoCancellation: true`, `noiseSuppression: true`, and `autoGainControl: true` are enforced to eliminate acoustic feedback and background ambient hum.

### Q39: How does the client handle camera device selection changes?
- **Answer:** `navigator.mediaDevices.enumerateDevices()` populates device lists. When selected, `getUserMedia({ video: { deviceId: { exact: id } } })` acquires the new track and swaps it via `sender.replaceTrack()`.

### Q40: What is the purpose of `canvas-confetti` in CALLIVO?
- **Answer:** It provides celebratory visual feedback during meeting entries and milestone achievements without incurring heavy DOM node overhead.

### Q41: How does CALLIVO prevent unauthorized users from ending a meeting?
- **Answer:** Both Express routes (`/api/meetings/:id/end`) and Socket.IO events (`host:end-meeting`) check that the requesting session matches `meeting.hostId`.

### Q42: What is the role of `sync-db-provider.cjs` in the build process?
- **Answer:** It dynamically synchronizes `schema.prisma` datasource provider (`postgresql` vs `sqlite`) based on `DATABASE_URL` before `prisma generate` executes.

### Q43: How does CALLIVO manage user avatar uploads securely?
- **Answer:** Restricts file sizes to 5MB, decodes base64 buffers, and inspects binary magic bytes to guarantee the payload is genuinely a JPEG, PNG, or WEBP image.

### Q44: What is the purpose of `RouteHeadHandler` in `App.tsx`?
- **Answer:** It prevents title and favicon flashes during client-side route transitions, ensuring canonical brand presence.

### Q45: How does the integrated Calendar page query data?
- **Answer:** `GET /api/calendar?month=YYYY-MM` filters events by month and user ID, returning scheduled video conferences and appointments.

### Q46: What is the difference between `RTCRtpSender.replaceTrack` and `RTCPeerConnection.addTrack`?
- **Answer:** `addTrack` alters the media description and requires renegotiating SDP; `replaceTrack` swaps the hardware source over the existing media line without renegotiation.

### Q47: How does CALLIVO handle database disconnections gracefully?
- **Answer:** Database queries retry up to 3 times with exponential backoff; WebRTC signaling and static SPA serving remain functional even during transient database latency.

### Q48: How are private chat messages secured from other meeting attendees?
- **Answer:** The signaling server uses `io.to(targetSocketId).emit('chat:message')`, bypassing the general room broadcast.

### Q49: What is the purpose of `openrelayproject` in CALLIVO's ICE configuration?
- **Answer:** It provides free public TURN relay servers over port 80 and 443 TCP/UDP as a reliable fallback when STUN direct peer connections fail.

### Q50: What is the primary benefit of monorepo architecture for CALLIVO?
- **Answer:** Shared TypeScript interfaces, unified Git versioning, and single-command local development orchestration.
