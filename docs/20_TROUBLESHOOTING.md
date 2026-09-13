# 20. Engineering Troubleshooting & Diagnostic Runbook — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Post-Mortem Retrospectives, Root Cause Analyses, and Field Diagnostic Procedures

---

## 1. Troubleshooting Index

This runbook documents real technical bugs, architectural edge-cases, and network anomalies encountered during the development and multi-cloud deployment of CALLIVO.

---

## 2. Deep Dive: The 10 Major Production Incidents

### Issue 1: Asymmetric Audio (One-Way Audio Stall)
- **Problem:** User A can hear User B, but User B cannot hear User A, despite both microphones indicating active audio levels.
- **Possible Cause:**
  - The answerer’s browser generated a duplicate audio transceiver section in its SDP Answer.
  - The offerer had an audio line with `direction: 'sendrecv'`, but the answerer called `pc.addTransceiver()` before handling the offer, resulting in an SDP containing a `recvonly` line followed by an unmapped second `sendonly` line.
- **How CALLIVO Fixed It:**
  - In `src/lib/webrtc.ts`, the answerer does **not** call `pc.addTransceiver()`.
  - Instead, after calling `setRemoteDescription(offer)`, the answerer searches for the existing audio transceiver created automatically by the offer:
    ```typescript
    const audioTransceiver = pc.getTransceivers().find(
      (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
    );
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
      await audioTransceiver.sender.replaceTrack(localAudioTrack);
    }
    ```
- **How to Diagnose It:**
  - Open Chrome Developer Tools $\rightarrow$ `chrome://webrtc-internals`.
  - Inspect the negotiated SDP on the answerer: verify there is exactly **one** `m=audio` line and that it contains `a=sendrecv`.

---

### Issue 2: Browser Audio Autoplay Blockade
- **Problem:** Remote audio is arriving across the network (`bytesReceived` is climbing in WebRTC stats), but no sound comes out of the physical speakers or headphones.
- **Possible Cause:**
  - Modern web browsers (Chromium, Safari, Edge) block audio elements from playing without an explicit user gesture (click, tap, keypress).
  - Calling `audioEl.play()` programmatically when an incoming peer joins throws an unhandled `NotAllowedError`.
- **How CALLIVO Fixed It:**
  1. Traps `audioEl.play().catch(err => ...)` and flags `isAudioAutoplayBlocked = true`.
  2. The UI renders a prominent glowing **"Click to Enable Audio"** banner.
  3. Attaches global passive event listeners (`click`, `touchstart`, `keydown`) that automatically call `play()` on all queued audio elements and resume the Web Audio `AudioContext`.
- **How to Diagnose It:**
  - Inspect browser console for: `NotAllowedError: play() failed because the user didn't interact with the document first`.

---

### Issue 3: Duplicate Video Transceivers & Black Screen Glitch
- **Problem:** Participant tile renders as a black rectangle or flickers between an avatar and a frozen video frame.
- **Possible Cause:**
  - Calling `addTrack` repeatedly on the same `RTCPeerConnection` creates multiple media sections in the SDP.
  - The browser attaches the first (stale/ended) video track to the DOM instead of the live active stream.
- **How CALLIVO Fixed It:**
  - Configured transceivers once upon connection initialization.
  - Swapping cameras or toggling screen share executes `sender.replaceTrack(newTrack)` rather than re-adding tracks.
  - In `pc.ontrack`, generates a fresh `MediaStream` instance (`new MediaStream(remoteStream.getTracks())`) to trigger React's shallow equality check and force video element rebinding.
- **How to Diagnose It:**
  - Check `track.readyState` in console. If `readyState === 'ended'`, the tile is bound to an expired track.

---

### Issue 4: Render Deployment Port Binding Timeout
- **Problem:** Backend deploys to Render fail after 4 minutes with: `Port scan timeout: Container did not bind to port 5000 within 120 seconds`.
- **Possible Cause:**
  - `server.listen(PORT)` was placed at the end of an asynchronous bootstrap chain after `prisma.$connect()` and schema synchronization.
  - If the cloud PostgreSQL database had network latency, the HTTP server never opened its port in time.
- **How CALLIVO Fixed It:**
  - Modified `server/src/index.ts` so `server.listen(PORT)` executes **immediately** (<1 second) on container launch.
  - Moved database initialization and table checks into a background asynchronous task (`initializeDatabase()`) with a bounded 10-second timeout and 3 retry attempts.
- **How to Diagnose It:**
  - Inspect Render deployment logs: ensure `🚀 CALLIVO Unified Server listening on http://localhost:5000` appears in the very first line of output.

---

### Issue 5: Neon PostgreSQL Connection Pooling & PgBouncer Lock Hangs
- **Problem:** Backend crashes or stalls during `prisma db push` or startup with: `ERROR: prepared statement "s0" already exists` or advisory lock deadlocks.
- **Possible Cause:**
  - Neon's pooled connection strings (`-pooler.eastus2.neon.tech`) use PgBouncer in transaction mode, which does not support prepared statements or Prisma schema migrations.
- **How CALLIVO Fixed It:**
  - In `server/scripts/start-production.cjs` and `server/src/db/prisma.ts`:
    - Automatically appends `?pgbouncer=true` and `&connect_timeout=15` to pooled URLs.
    - If schema synchronization (`prisma db push`) is executed, automatically strips `-pooler` to route migrations through the direct, unpooled endpoint.
- **How to Diagnose It:**
  - Check `DATABASE_URL`: ensure pooled URLs include `pgbouncer=true`.

---

### Issue 6: ICE Candidate Early Arrival (Null Remote Description)
- **Problem:** Console throws: `Failed to execute 'addIceCandidate' on 'RTCPeerConnection': The remote description was null`.
- **Possible Cause:**
  - Under fast network conditions, WebSocket ICE candidates arrive before the browser has finished executing the asynchronous `setRemoteDescription(offer)` promise.
- **How CALLIVO Fixed It:**
  - Implemented an in-memory candidate queue:
    ```typescript
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      await pc.addIceCandidate(data.candidate);
    } else {
      pendingCandidates.get(socketId).push(data.candidate);
    }
    ```
  - Calls `drainPendingCandidates()` immediately after `setRemoteDescription()` resolves.
- **How to Diagnose It:**
  - Inspect console logs for candidate arrival order relative to `setRemoteDescription`.

---

### Issue 7: Leaking Backend Secrets via Frontend `VITE_` Prefix
- **Problem:** Database credentials, JWT secrets, or Resend API keys appearing in public GitHub repositories or compiled client JS bundles.
- **Possible Cause:**
  - Vite automatically exposes any variable prefixed with `VITE_` to client-side code via `import.meta.env.VITE_*`.
- **How CALLIVO Fixed It:**
  - Enforced strict naming discipline in `.env.example`:
    - Only `VITE_API_URL` and `VITE_SERVER_URL` may have the `VITE_` prefix.
    - All backend secrets (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`) remain un-prefixed and are accessed exclusively through `process.env` in Node.js.
- **How to Diagnose It:**
  - Search compiled files in `dist/assets/*.js` for strings matching secret patterns.

---

### Issue 8: Vercel SPA Page Refresh 404 Not Found
- **Problem:** Navigating to `https://callivo.vercel.app/` works, but refreshing while inside `/dashboard` or `/room/clv-123` returns a generic 404 error.
- **Possible Cause:**
  - Because CALLIVO is a Single Page Application, `/dashboard` does not exist as a physical file on Vercel's edge storage. Vercel must rewrite the request to `/index.html`.
- **How CALLIVO Fixed It:**
  - Added a rewrite rule in `vercel.json`:
    ```json
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
    ```
- **How to Diagnose It:**
  - Directly load a deep route like `/help` in an incognito browser window.

---

### Issue 9: CORS Failure on WebSocket Upgrade
- **Problem:** Browser console reports: `Access to XMLHttpRequest at '...' from origin 'https://callivo.vercel.app' has been blocked by CORS policy`.
- **Possible Cause:**
  - Express CORS middleware or Socket.IO origin validator rejected the Vercel edge domain.
- **How CALLIVO Fixed It:**
  - Implemented the `isAllowedOrigin` regex validator in `server/src/app.ts`, explicitly permitting all `*.vercel.app` subdomains and any origin specified in `CLIENT_URL`.
- **How to Diagnose It:**
  - Check network tab for the `socket.io/?EIO=4&transport=polling` handshake request and inspect response headers for `Access-Control-Allow-Origin`.

---

### Issue 10: NAT Traversal Failure Across Symmetric Mobile Networks
- **Problem:** WebRTC connection state remains stuck in `'connecting'` and eventually transitions to `'failed'` when one participant is on mobile data (4G/5G).
- **Possible Cause:**
  - Mobile carriers use Symmetric NAT and Carrier-Grade NAT (CGNAT), which assign unpredictable public ports for each new destination, making direct STUN peer-to-peer routing impossible.
- **How CALLIVO Fixed It:**
  - Configured high-availability TURN relay fallback servers (`turn:openrelay.metered.ca`) in `DEFAULT_ICE_SERVERS` and `/api/webrtc/ice-servers`.
  - Both browsers route encrypted media through the TURN relay when direct UDP fails.
- **How to Diagnose It:**
  - Open `ConnectionDiagnosticsModal.tsx` and inspect the `Selected Candidate Pair`. If type is `relay`, the connection successfully traversed NAT using the TURN relay.
