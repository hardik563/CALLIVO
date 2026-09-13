# 09. Signaling Protocol & Socket.IO Gateway — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Comprehensive Event Catalog for Real-Time Signaling & Control

---

## 1. Signaling Protocol Overview

Signaling is the control plane of CALLIVO. It is implemented via a high-performance **Socket.IO 4.8** gateway running on the Node.js HTTP server (`server/src/signaling/signaling.gateway.ts`).

```mermaid
sequenceDiagram
    autonumber
    participant Alice as Browser A (Client)
    participant Gateway as Socket.IO Signaling Gateway
    participant Bob as Browser B (Peer)

    Note over Alice,Bob: Control Plane Signaling (Socket.IO over TLS/TCP)
    Alice->>Gateway: webrtc:offer { toSocketId: Bob.id, sdp }
    Gateway->>Bob: webrtc:offer { fromSocketId: Alice.id, sdp }
    Bob->>Gateway: webrtc:answer { toSocketId: Alice.id, sdp }
    Gateway->>Alice: webrtc:answer { fromSocketId: Bob.id, sdp }
    Alice->>Gateway: webrtc:ice-candidate { toSocketId: Bob.id, candidate }
    Gateway->>Bob: webrtc:ice-candidate { fromSocketId: Alice.id, candidate }

    Note over Alice,Bob: Media Transport Plane (Direct Encrypted SRTP over UDP)
    Alice<<==>>Bob: Direct Audio (Opus) & Video (VP8) Streams
```

> [!CRITICAL]
> **Cardinal Rule of CALLIVO Architecture:**  
> **Socket.IO carries JSON control messages ONLY.**  
> Audio and video binary data packets are **NEVER** routed through Socket.IO.

---

## 2. Authentication & Handshake Middleware

Before a socket is allowed to establish an active connection, it passes through the authentication middleware in `signaling.gateway.ts`:
1. Extracts JWT token from `socket.handshake.auth.token` or `socket.handshake.headers['authorization']`.
2. Verifies cryptographic signature using `jwt.verify(token, config.jwt.secret)`.
3. If valid, retrieves the user record from the database and tags the socket: `socket.data.user = user`.
4. If missing, invalid, or expired, securely assigns an isolated guest session:
   - `socket.data.user = null`
   - `socket.data.guestId = 'guest_' + Math.random().toString(36).substring(2, 10)`

---

## 3. Authoritative Signaling Event Dictionary

Every event listed below is actively implemented in the current CALLIVO codebase:

### Category 1: Room Lifecycle & Joining Flow

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `meeting:join` | Client $\rightarrow$ Server | `{ meetingId, name, avatar, passcode, initialAudioMuted, initialVideoOff }` | Requests entrance into a specific meeting room. |
| `meeting:waiting` | Server $\rightarrow$ Client | `{ message, meetingTitle, hostName }` | Emitted to a guest when placed in the waiting room lobby. |
| `lobby:participant-waiting`| Server $\rightarrow$ Host | `{ socketId, userId, name, avatar, requestedAt }` | Notifies the meeting host that an attendee is in the waiting room. |
| `meeting:join:ack` | Server $\rightarrow$ Client | `{ success, meetingId, participantId, socketId, role, displayName }` | Confirms successful admission and provides authoritative session IDs. |
| `meeting:state` | Server $\rightarrow$ Client | `{ meetingId, participants: ParticipantState[] }` | Delivers complete authoritative roster of all active participants in the room. |
| `room:joined` | Server $\rightarrow$ Client | `{ meetingId, self, existingParticipants, isHost }` | Signals client to initiate peer connections with existing participants. |
| `participant:joined` | Server $\rightarrow$ Room | `ParticipantState` (full object) | Broadcasts newly admitted attendee to all other attendees in the room. |
| `participant:left` | Server $\rightarrow$ Room | `{ socketId, participantId, userId, name }` | Broadcasts attendee departure, triggering peer connection cleanup. |
| `meeting:error` | Server $\rightarrow$ Client | `{ message }` | Alerts client of validation failure (e.g., locked room, invalid passcode). |

---

### Category 2: WebRTC Peer-to-Peer Signaling

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `webrtc:offer` | Client $\rightarrow$ Server | `{ toSocketId: string, sdp: RTCSessionDescriptionInit }` | Forwards caller's SDP Offer to targeted peer. |
| `webrtc:offer` | Server $\rightarrow$ Client | `{ fromSocketId: string, sdp: RTCSessionDescriptionInit }` | Delivers received SDP Offer to target answerer. |
| `webrtc:answer` | Client $\rightarrow$ Server | `{ toSocketId: string, sdp: RTCSessionDescriptionInit }` | Forwards answerer's SDP Answer back to caller. |
| `webrtc:answer` | Server $\rightarrow$ Client | `{ fromSocketId: string, sdp: RTCSessionDescriptionInit }` | Delivers received SDP Answer to caller. |
| `webrtc:ice-candidate` | Client $\rightarrow$ Server | `{ toSocketId: string, candidate: RTCIceCandidateInit }`| Sends discovered network candidate to remote peer. |
| `webrtc:ice-candidate` | Server $\rightarrow$ Client | `{ fromSocketId: string, candidate: RTCIceCandidateInit }`| Delivers network candidate to remote peer. |

---

### Category 3: Waiting Room & Lobby Moderation

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `lobby:admit` | Host $\rightarrow$ Server | `{ meetingId: string, targetSocketId: string }` | Host admits a specific participant from the waiting room. |
| `lobby:reject` | Host $\rightarrow$ Server | `{ meetingId: string, targetSocketId: string }` | Host rejects and disconnects a waiting attendee. |
| `lobby:admit-all` | Host $\rightarrow$ Server | `{ meetingId: string }` | Host admits all currently waiting participants in bulk. |
| `lobby:participant-cancelled`| Server $\rightarrow$ Host | `{ socketId: string }` | Alerts host if an attendee left the waiting room before admission. |

---

### Category 4: Media State & Device Telemetry

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `media:toggle-audio` | Client $\rightarrow$ Server | `{ meetingId: string, isMuted: boolean }` | Informs server of local mic mute/unmute state. |
| `participant:audio-toggled`| Server $\rightarrow$ Room | `{ socketId: string, isAudioMuted: boolean }` | Broadcasts mute state to update video tile badges. |
| `media:toggle-video` | Client $\rightarrow$ Server | `{ meetingId: string, isVideoOff: boolean }` | Informs server of camera toggle. |
| `participant:video-toggled`| Server $\rightarrow$ Room | `{ socketId: string, isVideoOff: boolean }` | Broadcasts camera state to toggle video/avatar display. |
| `media:toggle-screen` | Client $\rightarrow$ Server | `{ meetingId: string, isScreenSharing: boolean }` | Informs server of screen share start/stop. |
| `participant:screen-toggled`| Server $\rightarrow$ Room| `{ socketId: string, isScreenSharing: boolean }` | Broadcasts screen share state to trigger Stage Mode grid. |
| `media:active-speaker` | Client $\rightarrow$ Server | `{ meetingId: string, isSpeaking: boolean }` | Reports active speech detected via Web Audio analyser. |
| `participant:active-speaker`| Server $\rightarrow$ Room| `{ socketId: string, isSpeaking: boolean }` | Broadcasts active speaker to render glowing border. |
| `media:quality` | Client $\rightarrow$ Server | `{ meetingId: string, quality: 'excellent'\|'good'\|'poor' }` | Reports calculated network quality based on RTT/loss. |
| `participant:quality-changed`| Server $\rightarrow$ Room| `{ socketId: string, quality }` | Updates network quality icon in remote participant tile. |

---

### Category 5: In-Call Collaboration (Chat, Reactions, Hand Raise)

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `chat:message` | Client $\rightarrow$ Server | `{ meetingId, message, senderName, toSocketId? }` | Sends public message or targeted private message. |
| `chat:message` | Server $\rightarrow$ Client/Room| `{ id, senderSocketId, senderName, message, timestamp, isPrivate }` | Delivers chat payload to room or private recipient. |
| `reaction:send` | Client $\rightarrow$ Server | `{ meetingId, emoji, senderName }` | Emits an emoji reaction. |
| `reaction:received` | Server $\rightarrow$ Room | `{ id, emoji, senderName, senderSocketId, timestamp }` | Broadcasts reaction to trigger floating particle animations. |
| `hand:toggle` | Client $\rightarrow$ Server | `{ meetingId }` | Toggles local hand-raise state. |
| `participant:hand-toggled` | Server $\rightarrow$ Room | `{ socketId, isHandRaised, name }` | Updates hand-raise badge and triggers host notification. |

---

### Category 6: Host Moderation & Administrative Controls

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `host:mute-participant` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Forces target peer's microphone to mute. |
| `host:force-mute` | Server $\rightarrow$ Client | None | Directs client to mute microphone immediately. |
| `host:ask-unmute` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Sends respectful unmute request prompt to attendee. |
| `host:prompt-unmute` | Server $\rightarrow$ Client | `{ hostName }` | Displays "Host is asking you to unmute" dialog. |
| `host:stop-video` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Forces target peer's camera off. |
| `host:force-video-off` | Server $\rightarrow$ Client | None | Directs client to turn camera off. |
| `host:mute-all` | Host $\rightarrow$ Server | `{ meetingId }` | Mutes all non-host participants simultaneously. |
| `host:lower-hand` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId? }` | Lowers a specific hand or all raised hands. |
| `host:promote-cohost` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Grants co-host moderation privileges to participant. |
| `host:demote-cohost` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Revokes co-host privileges. |
| `host:transfer-host` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Transfers primary room ownership to another peer. |
| `host:put-in-waiting-room`| Host $\rightarrow$ Server| `{ meetingId, targetSocketId }` | Demotes participant back to the waiting room queue. |
| `host:spotlight` | Host $\rightarrow$ Server | `{ meetingId, targetSocketId }` | Focuses and enlarges a chosen speaker for all attendees. |
| `host:remove-participant`| Host $\rightarrow$ Server| `{ meetingId, targetSocketId }` | Ejects participant and immediately severs connection. |
| `host:lock-room` | Host $\rightarrow$ Server | `{ meetingId, isLocked }` | Prevents any new participants from joining. |
| `host:update-settings` | Host $\rightarrow$ Server | `{ meetingId, settings }` | Modifies in-call permissions (chat, screen share, etc.). |
| `host:end-meeting` | Host $\rightarrow$ Server | `{ meetingId }` | Concludes meeting, ejects everyone, updates DB. |

---

### Category 7: Real-Time Captions, Q&A, and Recordings

| Event Name | Direction | Payload Structure | Purpose |
| :--- | :--- | :--- | :--- |
| `recording:status` | Host $\rightarrow$ Server | `{ meetingId, isRecording, startedAt? }` | Broadcasts recording start/stop across all tiles. |
| `captions:transcript` | Client $\rightarrow$ Server | `{ meetingId, text, isFinal, speakerName? }` | Transmits speech recognition text to the room. |
| `captions:broadcast` | Server $\rightarrow$ Room | `{ socketId, speakerName, text, isFinal, timestamp }`| Displays synchronized subtitle overlay on peers' screens. |
| `qa:broadcast` | Client $\rightarrow$ Server | `{ meetingId, action, question }` | Notifies peers of question creation, upvote, or pin. |
| `comment:broadcast` | Client $\rightarrow$ Server | `{ meetingId, comment }` | Broadcasts new timestamped meeting note to attendees. |
