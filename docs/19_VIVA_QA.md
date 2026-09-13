# 19. Academic Viva & Oral Examination Guide (75+ Questions) — CALLIVO

> **CALLIVO — Meet. Connect. Collaborate.**  
> Beginner-Friendly, High-Clarity Viva Questions & Answers for B.Tech CSE & Engineering Students

---

## Section 1: Web Fundamentals & Core Concepts (Q1–Q15)

### Q1: What is React and why did you use it?
**Answer:** React is a popular open-source JavaScript library developed by Meta for building interactive user interfaces using reusable components. I used it in CALLIVO because video calling interfaces have many fast-changing elements—like video tiles, mute icons, and chat messages—and React’s virtual DOM updates the screen efficiently without full page refreshes.

### Q2: What is TypeScript and how is it different from JavaScript?
**Answer:** TypeScript is a superset of JavaScript that adds static types. In plain JavaScript, typos or passing the wrong data only cause errors when the code runs. TypeScript catches those bugs during development before running the app. In CALLIVO, it ensures all WebRTC payloads and API requests follow strict schemas.

### Q3: What is Vite and why did you choose it over Create React App (CRA)?
**Answer:** Vite is a modern frontend build tool that is much faster than older tools like Create React App. It uses native ES modules during development for instant startup and hot module reloading (HMR), and uses Rollup to produce highly optimized, minified production files.

### Q4: What is a Single Page Application (SPA)?
**Answer:** A Single Page Application is a web app that loads a single HTML file once. When the user navigates between pages, JavaScript dynamically updates the content without reloading the entire page from the server. This makes CALLIVO feel fast and smooth like a native desktop app.

### Q5: What is a REST API?
**Answer:** REST stands for Representational State Transfer. It is an architectural style where clients interact with a server using standard HTTP methods—like `GET` to read data, `POST` to create, `PATCH` to update, and `DELETE` to remove. In CALLIVO, the REST API manages users, meetings, contacts, and calendar events.

### Q6: What is a JSON Web Token (JWT)?
**Answer:** A JWT is a compact, URL-safe string used to securely transmit identity information between client and server. It consists of three parts separated by dots: Header, Payload, and Signature. Once signed with a secret key on the server, the client can present it with every request to prove who they are without storing session state in server memory.

### Q7: What is the difference between an Access Token and a Refresh Token?
**Answer:** An access token is short-lived (15 minutes in CALLIVO) and is sent in HTTP headers to authorize requests. A refresh token is long-lived (7 days) and stored in a secure HTTP-only cookie. When the access token expires, the client uses the refresh token to get a new access token without forcing the user to log in again.

### Q8: What is password hashing and why don't we store plain passwords?
**Answer:** Password hashing is a one-way mathematical function that turns a password into a fixed-length string of characters that cannot be reversed. We never store plain text passwords so that even if the database is leaked, attackers cannot see users' real passwords. CALLIVO uses the `bcryptjs` algorithm.

### Q9: What is a salt in password hashing?
**Answer:** A salt is random data added to the password before it is hashed. This ensures that two users with the same password will have completely different hashes, protecting against precomputed dictionary attacks known as rainbow tables.

### Q10: What is CORS (Cross-Origin Resource Sharing)?
**Answer:** CORS is a browser security mechanism that restricts a web page from making requests to a different domain than the one that served it. CALLIVO configures CORS on Express to allow requests from the Vercel frontend while blocking unauthorized third-party websites.

### Q11: What is Tailwind CSS?
**Answer:** Tailwind CSS is a utility-first CSS framework. Instead of writing custom CSS classes in separate stylesheets, developers apply predefined classes directly in HTML/JSX (like `flex`, `p-4`, `bg-slate-900`). It ensures consistent styling, dark mode support, and produces tiny production CSS bundles.

### Q12: What is Zustand?
**Answer:** Zustand is a small, fast state management library for React. It holds global data—like the currently logged-in user, active meeting settings, and participant lists—and makes them accessible anywhere in the app without boilerplate.

### Q13: What is the difference between Client-Side Routing and Server-Side Routing?
**Answer:** Server-side routing asks the web server for a new HTML file whenever a user clicks a link. Client-side routing (using React Router in CALLIVO) intercepts link clicks and swaps React components instantly in the browser without contacting the server.

### Q14: Why is HTTPS required for CALLIVO?
**Answer:** Web browsers mandate HTTPS for security and privacy. Browsers strictly block access to sensitive hardware—like web cameras and microphones via `getUserMedia`—on unencrypted HTTP connections (except on `localhost`).

### Q15: What is Docker?
**Answer:** Docker is a platform that packages an application and all its dependencies into an isolated container. This guarantees that CALLIVO runs exactly the same way on a student’s laptop, on a continuous integration server, and on cloud production servers.

---

## Section 2: WebRTC & Real-Time Media (Q16–Q35)

### Q16: What is WebRTC?
**Answer:** WebRTC stands for Web Real-Time Communication. It is an open standard and set of browser APIs that enables web browsers to stream audio, video, and data directly between each other in real time with sub-second latency, without installing plugins.

### Q17: How does one user's voice reach another user in CALLIVO?
**Answer:** 
1. The microphone captures analog voice and the browser digitizes it via `getUserMedia()`.
2. The browser encodes the audio using the Opus codec into digital RTP packets.
3. The packets are encrypted using DTLS/SRTP.
4. The encrypted packets travel directly across the P2P connection over UDP to the remote peer.
5. The remote peer decrypts the packets, decodes Opus audio, and plays it through the speakers using an `<audio>` tag and Web Audio API.

### Q18: Why is UDP used for video calls instead of TCP?
**Answer:** TCP guarantees that every packet arrives by retransmitting lost packets. In a live video call, a late packet is useless because speech has already moved on; TCP retransmissions cause noticeable freezes. UDP sends packets immediately without waiting. If a packet is lost, the call continues with a tiny blip rather than a long pause.

### Q19: What is SDP (Session Description Protocol)?
**Answer:** SDP is a text format that browsers use to introduce themselves to each other. It describes the media capabilities of a device: which audio and video codecs it supports (Opus, VP8), what resolution it can handle, and its encryption keys.

### Q20: What is the Offer/Answer model in WebRTC?
**Answer:** It is the negotiation process between two browsers:
- The caller creates an **Offer** (an SDP text document saying "Here are my codecs and media tracks").
- The receiver accepts it and creates an **Answer** (an SDP document saying "I accept those codecs; here are mine").

### Q21: What is ICE (Interactive Connectivity Establishment)?
**Answer:** ICE is a framework used by WebRTC to find the best network route between two computers. It tests direct local LAN addresses, public internet IP addresses found via STUN, and relay addresses via TURN to pick the fastest working path.

### Q22: What is an ICE Candidate?
**Answer:** An ICE candidate is a network address (an IP address, port number, and protocol like UDP) that a browser might be reachable on. Browsers exchange multiple ICE candidates until they find a pair that works.

### Q23: What is a STUN server?
**Answer:** STUN stands for Session Traversal Utilities for NAT. It is a lightweight server with a public IP. A browser behind a home Wi-Fi router asks the STUN server: *"What is my public IP address and port?"* The STUN server replies with the address, which the browser then shares with its peer.

### Q24: What is a TURN server and when is it needed?
**Answer:** TURN stands for Traversal Using Relays around NAT. When users are on restrictive enterprise networks or mobile 4G/5G connections with Symmetric NAT, direct peer-to-peer connections are blocked by the firewall. A TURN server acts as a relay, forwarding encrypted media packets between the peers.

### Q25: What is the difference between STUN and TURN?
**Answer:** 
- STUN only tells the browser its public IP; media never passes through a STUN server. It is free and lightweight.
- TURN actually relays the media packets when direct connections fail. It requires more server bandwidth.

### Q26: What is DTLS and SRTP?
**Answer:**
- **DTLS (Datagram Transport Layer Security):** Negotiates encryption keys over UDP during call setup.
- **SRTP (Secure Real-time Transport Protocol):** Encrypts every audio and video packet in transit using AES encryption, ensuring nobody on the network can eavesdrop on the call.

### Q27: What happens when a user turns off their camera?
**Answer:** CALLIVO sets `videoTrack.enabled = false`. The WebRTC connection remains connected, but black frames are transmitted, saving bandwidth. It also emits a `media:toggle-video` event over Socket.IO so other users see an avatar instead of a black box.

### Q28: What happens when a user mutes their microphone?
**Answer:** CALLIVO sets `audioTrack.enabled = false`. The audio hardware stops sending audio frames, ensuring complete privacy. A Socket.IO event `media:toggle-audio` updates the red mute badge on peers' screens.

### Q29: How does Screen Sharing work in CALLIVO?
**Answer:** 
1. The browser calls `navigator.mediaDevices.getDisplayMedia({ video: true })`.
2. The user picks a screen or window to share.
3. CALLIVO uses `sender.replaceTrack(screenTrack)` to swap the video track without dropping the call.
4. When sharing stops, it calls `sender.replaceTrack(cameraTrack)` to switch back to the webcam.

### Q30: What is an RTCRtpTransceiver?
**Answer:** A transceiver represents a paired sender (`RTCRtpSender`) and receiver (`RTCRtpReceiver`) for a single media track (audio or video). Its direction property (like `sendrecv`) tells the browser whether it should both send and receive media on that track.

### Q31: What is the Browser Audio Autoplay restriction?
**Answer:** Modern web browsers block websites from playing audio automatically unless the user has clicked or tapped on the page. In CALLIVO, if a peer joins and audio is blocked, the app shows an "Unmute Audio" prompt and unlocks all audio elements on the first click.

### Q32: How does Active Speaker Detection work in CALLIVO?
**Answer:** CALLIVO attaches a Web Audio API `AnalyserNode` to the local microphone stream. It samples audio frequencies every 200 milliseconds. If the sound level passes a threshold, it emits an event so the active speaker's video tile gets a glowing emerald border.

### Q33: What is the Opus audio codec?
**Answer:** Opus is a versatile open-source audio codec designed for interactive speech and music over the internet. It dynamically adapts its bitrate between 6 kbps and 510 kbps, handles background noise well, and has very low latency.

### Q34: What is `replaceTrack()` and why is it better than renegotiation?
**Answer:** `replaceTrack()` changes the media track being sent without performing a new SDP Offer/Answer negotiation. This makes switching between front/rear cameras or webcam/screen share instantaneous with zero lag.

### Q35: What happens if WebRTC fails to connect?
**Answer:** CALLIVO monitors `pc.connectionState`. If it transitions to `'failed'`, the app automatically calls `pc.restartIce()` to gather fresh network candidates and attempt reconnection.

---

## Section 3: Signaling & Real-Time WebSockets (Q36–Q45)

### Q36: What is Socket.IO?
**Answer:** Socket.IO is a library that enables real-time, bi-directional, event-based communication between web clients and servers. It runs on WebSockets with automatic fallback to HTTP long-polling if WebSockets are blocked.

### Q37: Why do we need a signaling server if WebRTC is peer-to-peer?
**Answer:** Before two browsers can talk directly, they must discover each other. They do not know each other’s IP addresses or media settings. The signaling server acts as a middleman that passes the initial connection details (SDP and ICE candidates). Once connected, media flows directly between browsers without the server.

### Q38: Does audio or video travel through Socket.IO?
**Answer:** **No, never.** Socket.IO only transports small JSON text messages (signaling, chat messages, mute indicators, emoji reactions). The heavy audio and video media travels directly between browsers via WebRTC.

### Q39: What is a Socket.IO Room?
**Answer:** A room is a server-side channel that sockets can join and leave. It allows the server to broadcast events to a specific group of users (like everyone in meeting `clv-123`) using `io.to('room:clv-123').emit(...)` without broadcasting to the whole website.

### Q40: How does the waiting room lobby work in CALLIVO?
**Answer:** When a guest joins a meeting that has a waiting room enabled, the server places them in a separate room (`waiting:meetingId`). The host receives an alert with an "Admit" button. Only when the host clicks "Admit" is the guest transferred to the main meeting room.

### Q41: How are public chat messages sent during a meeting?
**Answer:** The client emits `chat:message` to the server with the text. The server broadcasts the event to all sockets in that meeting room (`io.to('room:' + meetingId).emit('chat:message', data)`), and all attendees see the message.

### Q42: How are private chat messages sent?
**Answer:** The client sends `chat:message` with a `toSocketId` field. The server sends the message only to that specific socket and echoes it back to the sender, keeping it private from other attendees.

### Q43: What is the purpose of the `meeting:join:ack` event?
**Answer:** It is an acknowledgement sent by the server to confirm that the user has successfully entered the meeting, providing their assigned participant ID, role (host or participant), and room configuration.

### Q44: How does CALLIVO handle emoji reactions in real time?
**Answer:** When an attendee clicks an emoji, a `reaction:send` event is emitted. The server broadcasts `reaction:received` to everyone in the room, and each client renders an animated floating emoji rising from that user's video tile.

### Q45: What happens when the host ends the meeting for everyone?
**Answer:** The host emits `host:end-meeting`. The server updates the meeting status to `ended` in the database, emits `meeting:ended` to all participants in the room, and all attendees are redirected back to the dashboard with an alert.

---

## Section 4: Backend, Database & Storage (Q46–Q60)

### Q46: What is Node.js?
**Answer:** Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside of a web browser, commonly used to build scalable network servers.

### Q47: What is Express?
**Answer:** Express is a fast, minimalist web framework for Node.js that provides routing, middleware support, and HTTP utilities for building REST APIs.

### Q48: What is PostgreSQL?
**Answer:** PostgreSQL is a powerful, open-source object-relational database management system (RDBMS) known for its reliability, data integrity, and support for complex SQL queries and transactions.

### Q49: What is Prisma?
**Answer:** Prisma is a modern Object-Relational Mapper (ORM) for Node.js and TypeScript. It allows developers to define their database schema in a readable format (`schema.prisma`) and auto-generates a type-safe TypeScript client for querying the database.

### Q50: What is SQLite and why is it in this project?
**Answer:** SQLite is a self-contained, file-based SQL database engine that requires zero installation. CALLIVO uses it for local offline development so any developer can clone and run the project immediately without setting up PostgreSQL.

### Q51: How does CALLIVO automatically switch between SQLite and PostgreSQL?
**Answer:** It runs a script called `sync-db-provider.cjs` before building. The script checks `DATABASE_URL`: if it starts with `postgres://`, it sets the provider to PostgreSQL; if it starts with `file:`, it sets it to SQLite.

### Q52: What is Neon?
**Answer:** Neon is a serverless, cloud-hosted PostgreSQL database. It automatically scales computing resources up and down based on demand, provides instant branching, and includes built-in connection pooling via PgBouncer.

### Q53: What is Connection Pooling and PgBouncer?
**Answer:** Opening a new database connection for every incoming HTTP request is slow and consumes server memory. A connection pool keeps a set of database connections open and reuses them. PgBouncer manages this pool efficiently for PostgreSQL.

### Q54: What are the main tables/models in CALLIVO's database?
**Answer:** CALLIVO has 26 models, including `User`, `Meeting`, `MeetingParticipant`, `Contact`, `Message`, `CalendarEvent`, `Recording`, `UserSettings`, `Notification`, and `HelpdeskTicket`.

### Q55: How are avatar image uploads handled?
**Answer:** Users crop an avatar in the browser, which is converted into a base64 string. The backend validates the binary magic bytes (ensuring it is truly a JPEG, PNG, or WEBP) and stores the file in `/uploads/avatars/`, saving the file path in the database.

### Q56: How does rate limiting protect the backend?
**Answer:** Rate limiting limits how many requests a single IP address can make in a given time window. For example, auth routes allow only 30 requests per 15 minutes, preventing automated bots from guessing user passwords.

### Q57: What is Helmet in Express?
**Answer:** Helmet is a security middleware for Express that automatically sets secure HTTP response headers to defend against common web attacks like clickjacking and sniffing.

### Q58: What is an AuditLog and why is it useful?
**Answer:** An audit log is a record of security events—such as user logins, account registrations, and meeting creations—with timestamps and IP addresses. It helps administrators monitor platform security and troubleshoot issues.

### Q59: What does the `/health` endpoint do?
**Answer:** It is a public endpoint that returns `{ "status": "healthy", "uptime": 120 }`. Cloud hosting platforms like Render query it periodically to verify that the container is alive and ready to receive traffic.

### Q60: What happens if the database is temporarily unreachable on startup?
**Answer:** The server binds port 5000 immediately so cloud health checks pass, and retries the database connection in the background up to 3 times. If the database is slow, users can still connect to WebRTC calls.

---

## Section 5: Deployment, 3D & Architecture (Q61–Q75)

### Q61: Where is the frontend of CALLIVO deployed?
**Answer:** On **Vercel** at `https://callivo.vercel.app`. Vercel distributes the compiled HTML, CSS, and JavaScript files across global edge servers for fast loading anywhere in the world.

### Q62: Where is the backend of CALLIVO deployed?
**Answer:** On **Render** at `https://callivo-f1n8.onrender.com`. Render runs the Node.js application in a Docker container that stays online to handle WebSocket signaling and REST API calls.

### Q63: Why did you separate the frontend and backend deployments?
**Answer:** 
1. **Performance:** The static frontend is cached globally on Vercel's edge network.
2. **Scalability:** The frontend and backend scale independently based on traffic.
3. **Reliability:** A spike in API traffic will not slow down the loading of static website pages.

### Q64: What is Three.js?
**Answer:** Three.js is an open-source JavaScript library used to create and display animated 3D computer graphics in a web browser using WebGL.

### Q65: What is React Three Fiber (R3F)?
**Answer:** React Three Fiber is a React renderer for Three.js. It allows developers to build 3D scenes declaratively using React components (like `<mesh>`, `<ambientLight>`, `<pointLight>`) instead of imperative JavaScript.

### Q66: Where is 3D used in CALLIVO?
**Answer:** On the landing page (`Hero3D.tsx`) to render an interactive 3D conference hub with floating participant nodes that react to mouse movements, and in `SpatialMeetingRoom.tsx` to project video streams onto 3D virtual panels.

### Q67: What is a WebGL shader?
**Answer:** A shader is a small program written in GLSL that runs directly on the user's graphics card (GPU) to calculate lighting, color, and reflections for 3D objects at high speed.

### Q68: What is a Monorepo?
**Answer:** A monorepo is a single Git repository that contains multiple distinct projects. CALLIVO holds both the frontend React client and the backend Node.js server in one repository, making it easy to share types and manage versions.

### Q69: What is Rollup and how does Vite use it?
**Answer:** Rollup is a module bundler for JavaScript. When building CALLIVO for production (`npm run build`), Vite uses Rollup to combine, minify, and tree-shake code into small, fast-loading bundles.

### Q70: What is Tree-Shaking?
**Answer:** Tree-shaking is an optimization process during bundling that removes unused code (dead code) from the final JavaScript bundle, keeping the download size as small as possible.

### Q71: What is a Webhook?
**Answer:** A webhook is an automated HTTP callback triggered by an event. In CALLIVO, when code is pushed to GitHub, GitHub fires webhooks to Vercel and Render to automatically build and deploy the updated application.

### Q72: What is the Web Speech API in CALLIVO?
**Answer:** It is a browser API used for speech recognition. In CALLIVO, `CaptionsOverlay.tsx` uses it to convert spoken English into text subtitles and broadcasts them in real time to all attendees.

### Q73: What is the purpose of `render.yaml`?
**Answer:** It is an infrastructure-as-code blueprint file for Render that defines the web service, environment variables, build commands, and the PostgreSQL database, enabling one-click deployment.

### Q74: What is the purpose of `vercel.json`?
**Answer:** It configures Vercel's edge routing. It specifies the build command (`npm run build:client`), the output directory (`dist`), and rewrites all incoming URLs to `/index.html` so client-side routing works on page refreshes.

### Q75: If you had 6 more months, what would you improve in CALLIVO?
**Answer:**
1. **Transition to an SFU (Selective Forwarding Unit):** Integrate mediasoup to support calls with 50+ participants by routing streams through an optimized media server.
2. **End-to-End Encrypted Messaging:** Implement the Signal Protocol for client-side encrypted chat.
3. **Server-Side Recording:** Deploy headless Chromium workers to record and composite meeting grids into full-fidelity MP4 files on the cloud.
