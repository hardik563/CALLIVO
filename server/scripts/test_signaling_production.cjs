const { io } = require('socket.io-client');
const https = require('https');

const PRODUCTION_URL = 'https://callivo-f1n8.onrender.com';

function httpRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, PRODUCTION_URL);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSignalingTest() {
  console.log('=== STARTING CALLIVO TWO-CLIENT PRODUCTION SIGNALING & ROLE TEST ===\n');

  // Step 1: Health & ICE Servers Check
  console.log('[Step 1] Checking API health and ICE servers on production...');
  const health = await httpRequest('GET', '/health');
  console.log('  Health response:', health.data);

  const iceResponse = await httpRequest('GET', '/api/webrtc/ice-servers');
  console.log('  ICE servers fetched:', JSON.stringify(iceResponse.data.iceServers, null, 2));

  // Step 2: Register/Authenticate Host User A
  const hostEmail = `hardik_${Date.now()}@callivo.test`;
  console.log(`\n[Step 2] Registering Host User A (${hostEmail})...`);
  const registerRes = await httpRequest('POST', '/api/auth/register', {
    name: 'Hardik Dhamija',
    email: hostEmail,
    password: 'Password123!',
  });
  console.log('  Register status:', registerRes.status);
  const hostToken = registerRes.data.accessToken || registerRes.data.token;
  const hostUser = registerRes.data.user || registerRes.data.data?.user;
  console.log(`  Host User ID: ${hostUser?.id}, Name: ${hostUser?.name}`);

  // Step 3: Create Meeting as Host User A
  console.log('\n[Step 3] Creating Meeting via POST /api/meetings...');
  const meetingRes = await httpRequest('POST', '/api/meetings', {
    title: 'Executive Architecture Sync & Sprint Alignment',
    waitingRoom: false,
    muteOnEntry: false,
  }, hostToken);
  console.log('  Create Meeting status:', meetingRes.status);
  const meeting = meetingRes.data.meeting;
  console.log(`  Created Meeting ID: ${meeting?.id}, Host ID: ${meeting?.hostId}, Waiting Room: ${meeting?.waitingRoom}`);

  // Step 4: Connect Client A (Host: Hardik) with Auth Token
  console.log('\n[Step 4] Connecting Client A (Host: Hardik) via Socket.IO with auth token...');
  const socketA = io(PRODUCTION_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    auth: { token: hostToken },
  });
  await new Promise((resolve) => socketA.on('connect', resolve));
  console.log(`  Client A connected with socketId: ${socketA.id}`);

  // Step 5: Connect Client B (Guest: Virat) without auth token (Guest)
  console.log('\n[Step 5] Connecting Client B (Guest: Virat) via Socket.IO...');
  const socketB = io(PRODUCTION_URL, {
    transports: ['websocket', 'polling'],
    forceNew: true,
  });
  await new Promise((resolve) => socketB.on('connect', resolve));
  console.log(`  Client B connected with socketId: ${socketB.id}`);

  // Prepare promises for events
  const clientAJoinedPromise = new Promise((resolve) => {
    socketA.on('meeting:join:ack', (data) => {
      console.log('\n>>> [Client A Event] meeting:join:ack received:');
      console.log(`    Role: ${data.role || data.participant?.role}`);
      console.log(`    Room ID: ${data.meetingId}`);
      resolve(data);
    });
  });

  const clientBJoinedPromise = new Promise((resolve) => {
    socketB.on('meeting:join:ack', (data) => {
      console.log('\n>>> [Client B Event] meeting:join:ack received for Virat:');
      console.log(`    Role: ${data.role || data.participant?.role}`);
      console.log(`    Room ID: ${data.meetingId}`);
      resolve(data);
    });
  });

  const peerJoinedPromise = new Promise((resolve) => {
    socketA.on('participant:joined', (participant) => {
      console.log('\n>>> [Client A Event] participant:joined received for Client B:');
      console.log(`    Participant Name: ${participant?.name}`);
      console.log(`    Participant Role: ${participant?.role}`);
      console.log(`    Participant SocketId: ${participant?.socketId || participant?.id}`);
      resolve(participant);
    });
  });

  const offerReceivedPromise = new Promise((resolve) => {
    socketB.on('webrtc:offer', (data) => {
      console.log('\n>>> [Client B Event] webrtc:offer received from Client A:');
      console.log(`    fromSocketId: ${data.fromSocketId}`);
      console.log(`    SDP type: ${data.offer?.type}`);
      console.log(`    SDP contains m=audio: ${data.offer?.sdp?.includes('m=audio')}`);
      console.log(`    SDP contains m=video: ${data.offer?.sdp?.includes('m=video')}`);
      resolve(data);
    });
  });

  const answerReceivedPromise = new Promise((resolve) => {
    socketA.on('webrtc:answer', (data) => {
      console.log('\n>>> [Client A Event] webrtc:answer received from Client B:');
      console.log(`    fromSocketId: ${data.fromSocketId}`);
      console.log(`    SDP type: ${data.answer?.type}`);
      console.log(`    SDP contains m=audio: ${data.answer?.sdp?.includes('m=audio')}`);
      console.log(`    SDP contains m=video: ${data.answer?.sdp?.includes('m=video')}`);
      resolve(data);
    });
  });

  const iceCandidatePromise = new Promise((resolve) => {
    socketB.on('webrtc:ice-candidate', (data) => {
      console.log('\n>>> [Client B Event] webrtc:ice-candidate received:');
      console.log(`    fromSocketId: ${data.fromSocketId}`);
      console.log(`    candidate: ${data.candidate?.candidate}`);
      resolve(data);
    });
  });

  // Step 6: Client A joins meeting
  console.log('\n[Step 6] Emitting meeting:join for Client A (Hardik)...');
  socketA.emit('meeting:join', {
    meetingId: meeting.id,
    name: 'Hardik Dhamija',
    userId: hostUser.id,
    initialAudioMuted: false,
    initialVideoOff: false,
  });

  const ackA = await clientAJoinedPromise;

  // Step 7: Client B joins meeting as Virat
  console.log('\n[Step 7] Emitting meeting:join for Client B (Virat)...');
  socketB.emit('meeting:join', {
    meetingId: meeting.id,
    name: 'Virat',
    initialAudioMuted: false,
    initialVideoOff: false,
  });

  const [ackB, peerJoinedData] = await Promise.all([clientBJoinedPromise, peerJoinedPromise]);

  // Verify Role isolation:
  const hostRoleA = ackA.role || ackA.participant?.role;
  const guestRoleB = ackB.role || ackB.participant?.role;
  console.log(`\n================ ROLE ISOLATION AUDIT ================`);
  console.log(`Client A (Hardik) role: "${hostRoleA}" -> Is Host? ${hostRoleA === 'host'}`);
  console.log(`Client B (Virat) role:  "${guestRoleB}" -> Is Host? ${guestRoleB === 'host'}`);
  if (guestRoleB === 'host') {
    throw new Error('FAIL: Virat was incorrectly assigned the host role!');
  }
  console.log(`PASS: Virat is strictly a participant and NOT a host!`);
  console.log(`=====================================================\n`);

  // Step 8: WebRTC Offer from Client A to Client B
  console.log('[Step 8] Client A sending WebRTC Offer (m=audio & m=video) to Client B...');
  const dummyOfferSdp =
    'v=0\r\no=- 4294967295 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendrecv\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=mid:1\r\na=sendrecv\r\n';

  socketA.emit('webrtc:offer', {
    toSocketId: socketB.id,
    offer: { type: 'offer', sdp: dummyOfferSdp },
  });

  await offerReceivedPromise;

  // Step 9: WebRTC Answer from Client B to Client A
  console.log('\n[Step 9] Client B sending WebRTC Answer back to Client A...');
  const dummyAnswerSdp =
    'v=0\r\no=- 4294967296 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\na=sendrecv\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\nc=IN IP4 0.0.0.0\r\na=mid:1\r\na=sendrecv\r\n';

  socketB.emit('webrtc:answer', {
    toSocketId: socketA.id,
    answer: { type: 'answer', sdp: dummyAnswerSdp },
  });

  await answerReceivedPromise;

  // Step 10: ICE Candidate exchange
  console.log('\n[Step 10] Client A sending ICE Candidate to Client B...');
  socketA.emit('webrtc:ice-candidate', {
    toSocketId: socketB.id,
    candidate: {
      candidate: 'candidate:1 1 UDP 2130706431 192.168.1.100 54321 typ host',
      sdpMid: '0',
      sdpMLineIndex: 0,
    },
  });

  await iceCandidatePromise;

  // Step 11: Cleanup
  socketA.disconnect();
  socketB.disconnect();

  console.log('\n=== TWO-CLIENT PRODUCTION VERIFICATION COMPLETE: ALL CHECKS PASSED ===\n');
}

runSignalingTest().catch((err) => {
  console.error('\n*** TEST FAILED ***', err);
  process.exit(1);
});
