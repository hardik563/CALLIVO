const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8999;

// HTML page that will run in two browser contexts (or two iframes / two windows)
// Even better: Client A and Client B running in two separate browser processes or separate contexts!
const html = `<!DOCTYPE html>
<html>
<head><title>WebRTC Audio Test</title></head>
<body>
<h1>WebRTC Audio Pipeline Verification</h1>
<div id="status">Starting...</div>
<pre id="logs" style="background:#111;color:#0f0;padding:10px;font-family:monospace;"></pre>
<audio id="remoteAudio" autoplay></audio>

<script>
const logsEl = document.getElementById('logs');
const statusEl = document.getElementById('status');
function log(msg) {
  console.log(msg);
  logsEl.textContent += msg + '\\n';
}

window.runTest = async function(role, signalingWsUrl) {
  log('Starting role: ' + role);
  const isOfferer = (role === 'offerer');
  
  // Step 1: getUserMedia
  log('Step 1: Requesting local microphone...');
  const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  const audioTrack = localStream.getAudioTracks()[0];
  log('Mic track: id=' + audioTrack.id + ', kind=' + audioTrack.kind + ', enabled=' + audioTrack.enabled + ', muted=' + audioTrack.muted + ', readyState=' + audioTrack.readyState);
  
  // Step 2: PeerConnection setup
  log('Step 2: Creating RTCPeerConnection with max-bundle and require rtcpMux...');
  const pc = new RTCPeerConnection({
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  const ws = new WebSocket(signalingWsUrl);
  await new Promise(resolve => { ws.onopen = resolve; });
  log('Signaling WebSocket connected');

  let remoteAudioStream = new MediaStream();
  const audioEl = document.getElementById('remoteAudio');

  pc.ontrack = (event) => {
    log('Step 8: ontrack fired! kind=' + event.track.kind + ', id=' + event.track.id + ', readyState=' + event.track.readyState);
    if (event.track.kind === 'audio') {
      remoteAudioStream.addTrack(event.track);
      audioEl.srcObject = remoteAudioStream;
      audioEl.play().then(() => {
        log('Step 9: audioEl.play() SUCCEEDED! paused=' + audioEl.paused + ', muted=' + audioEl.muted + ', volume=' + audioEl.volume);
      }).catch(err => {
        log('Step 9: audioEl.play() FAILED: ' + err.message);
      });

      // Web Audio verification
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(remoteAudioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        window._analyser = analyser;
        log('Web Audio Analyser connected to remote stream');
      } catch (e) {
        log('Web Audio error: ' + e.message);
      }
    }
  };

  pc.onicecandidate = (e) => {
    if (e.candidate) {
      ws.send(JSON.stringify({ type: 'candidate', candidate: e.candidate, role }));
    }
  };

  pc.onconnectionstatechange = () => {
    log('ConnectionState: ' + pc.connectionState + ', ICEState: ' + pc.iceConnectionState);
  };

  let audioTransceiver;

  if (isOfferer) {
    log('OFFERER Flow:');
    audioTransceiver = pc.addTransceiver(audioTrack, {
      direction: 'sendrecv',
      streams: [localStream]
    });
    log('Offerer transceiver: mid=' + audioTransceiver.mid + ', direction=' + audioTransceiver.direction);

    const offer = await pc.createOffer();
    log('Offer created. SDP contains m=audio? ' + offer.sdp.includes('m=audio'));
    log('Offer audio sendrecv? ' + offer.sdp.includes('a=sendrecv'));
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'offer', sdp: offer.sdp, role }));

    // Wait for answer
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'answer') {
        log('Offerer received answer');
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
        log('Answer set on offerer. currentDirection=' + audioTransceiver.currentDirection);
      } else if (data.type === 'candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  } else {
    log('ANSWERER Flow:');
    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'offer') {
        log('Answerer received offer. Setting remote description...');
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
        
        // Find transceiver created by offer
        audioTransceiver = pc.getTransceivers().find(t => t.receiver.track?.kind === 'audio');
        log('Answerer found offer audio transceiver: mid=' + (audioTransceiver ? audioTransceiver.mid : 'none'));
        
        if (audioTransceiver) {
          audioTransceiver.direction = 'sendrecv';
          await audioTransceiver.sender.replaceTrack(audioTrack);
          log('Answerer attached local mic track to sender: id=' + audioTransceiver.sender.track?.id);
        }

        const answer = await pc.createAnswer();
        log('Answer created. SDP contains m=audio? ' + answer.sdp.includes('m=audio'));
        log('Answer audio sendrecv? ' + answer.sdp.includes('a=sendrecv'));
        await pc.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'answer', sdp: answer.sdp, role }));
      } else if (data.type === 'candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    };
  }

  window._pc = pc;
  window._audioTransceiver = audioTransceiver;
  window._audioEl = audioEl;

  // Function to poll stats
  window.getAudioStats = async function() {
    const stats = await pc.getStats();
    let outbound = { packetsSent: 0, bytesSent: 0 };
    let inbound = { packetsReceived: 0, bytesReceived: 0, packetsLost: 0, jitter: 0 };
    let selectedCandidatePair = null;

    stats.forEach(report => {
      if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        outbound.packetsSent = report.packetsSent || 0;
        outbound.bytesSent = report.bytesSent || 0;
      }
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        inbound.packetsReceived = report.packetsReceived || 0;
        inbound.bytesReceived = report.bytesReceived || 0;
        inbound.packetsLost = report.packetsLost || 0;
        inbound.jitter = report.jitter || 0;
      }
      if (report.type === 'transport' && report.selectedCandidatePairId) {
        selectedCandidatePair = report.selectedCandidatePairId;
      }
    });

    let frequencyAvg = 0;
    if (window._analyser) {
      const data = new Uint8Array(window._analyser.frequencyBinCount);
      window._analyser.getByteFrequencyData(data);
      const sum = data.reduce((a, b) => a + b, 0);
      frequencyAvg = sum / data.length;
    }

    return {
      connectionState: pc.connectionState,
      iceConnectionState: pc.iceConnectionState,
      audioDirection: audioTransceiver ? audioTransceiver.direction : null,
      audioCurrentDirection: audioTransceiver ? audioTransceiver.currentDirection : null,
      outbound,
      inbound,
      audioElPaused: audioEl.paused,
      audioElReadyState: audioEl.readyState,
      frequencyAvg,
      selectedCandidatePair
    };
  };

  return true;
};
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/test.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }
  res.writeHead(404);
  res.end();
});

// Setup minimal WebSocket server for signaling
const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ server });

let clientA = null;
let clientB = null;

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    const data = JSON.parse(msg.toString());
    // Broadcast to other client
    wss.clients.forEach(c => {
      if (c !== ws && c.readyState === 1) {
        c.send(JSON.stringify(data));
      }
    });
  });
});

server.listen(PORT, async () => {
  console.log(`Test server running at http://localhost:${PORT}/test.html`);
  
  // Launch two Chrome instances
  const userDataA = path.join(process.cwd(), '.tmp_chrome_a');
  const userDataB = path.join(process.cwd(), '.tmp_chrome_b');
  fs.mkdirSync(userDataA, { recursive: true });
  fs.mkdirSync(userDataB, { recursive: true });

  const chromeFlagsA = [
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataA}`,
    '--headless=new',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${PORT}/test.html`
  ];

  const chromeFlagsB = [
    '--remote-debugging-port=9223',
    `--user-data-dir=${userDataB}`,
    '--headless=new',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run',
    '--no-default-browser-check',
    `http://localhost:${PORT}/test.html`
  ];

  console.log('Launching Chrome A...');
  const procA = spawn(CHROME_PATH, chromeFlagsA);
  console.log('Launching Chrome B...');
  const procB = spawn(CHROME_PATH, chromeFlagsB);

  // Helper to connect to Chrome DevTools Protocol
  async function connectCDP(port) {
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const targets = await res.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (pageTarget && pageTarget.webSocketDebuggerUrl) {
          const { WebSocket: WsClient } = require('ws');
          const ws = new WsClient(pageTarget.webSocketDebuggerUrl);
          await new Promise(r => ws.on('open', r));
          let id = 1;
          const send = (method, params = {}) => new Promise((resolve, reject) => {
            const reqId = id++;
            const handler = (data) => {
              const msg = JSON.parse(data.toString());
              if (msg.id === reqId) {
                ws.off('message', handler);
                if (msg.error) reject(msg.error);
                else resolve(msg.result);
              }
            };
            ws.on('message', handler);
            ws.send(JSON.stringify({ id: reqId, method, params }));
          });
          const evalJs = async (expr) => {
            const res = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
            return res.result?.value;
          };
          return { ws, send, evalJs };
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    throw new Error(`Failed to connect to CDP on port ${port}`);
  }

  try {
    await new Promise(r => setTimeout(r, 2000));
    console.log('Connecting to Chrome A CDP on 9222...');
    const cdpA = await connectCDP(9222);
    console.log('Connecting to Chrome B CDP on 9223...');
    const cdpB = await connectCDP(9223);

    console.log('Initializing Client B (Answerer)...');
    await cdpB.evalJs(`runTest('answerer', 'ws://localhost:${PORT}')`);

    await new Promise(r => setTimeout(r, 1000));

    console.log('Initializing Client A (Offerer)...');
    await cdpA.evalJs(`runTest('offerer', 'ws://localhost:${PORT}')`);

    // Poll for media flow
    console.log('\\n==================== POLLING WEBRTC AUDIO FLOW ====================');
    let passed = false;

    for (let t = 1; t <= 15; t++) {
      await new Promise(r => setTimeout(r, 1000));
      const statsA = await cdpA.evalJs(`getAudioStats()`);
      const statsB = await cdpB.evalJs(`getAudioStats()`);

      console.log(`\\n[T+${t}s]`);
      console.log(`Client A: state=${statsA?.connectionState}, ice=${statsA?.iceConnectionState}, dir=${statsA?.audioDirection}, curDir=${statsA?.audioCurrentDirection}`);
      console.log(`  A Outbound: pkts=${statsA?.outbound?.packetsSent}, bytes=${statsA?.outbound?.bytesSent}`);
      console.log(`  A Inbound:  pkts=${statsA?.inbound?.packetsReceived}, bytes=${statsA?.inbound?.bytesReceived}, loss=${statsA?.inbound?.packetsLost}, jitter=${statsA?.inbound?.jitter}`);
      console.log(`  A Playback: paused=${statsA?.audioElPaused}, freqAvg=${statsA?.frequencyAvg?.toFixed(1)}`);

      console.log(`Client B: state=${statsB?.connectionState}, ice=${statsB?.iceConnectionState}, dir=${statsB?.audioDirection}, curDir=${statsB?.audioCurrentDirection}`);
      console.log(`  B Outbound: pkts=${statsB?.outbound?.packetsSent}, bytes=${statsB?.outbound?.bytesSent}`);
      console.log(`  B Inbound:  pkts=${statsB?.inbound?.packetsReceived}, bytes=${statsB?.inbound?.bytesReceived}, loss=${statsB?.inbound?.packetsLost}, jitter=${statsB?.inbound?.jitter}`);
      console.log(`  B Playback: paused=${statsB?.audioElPaused}, freqAvg=${statsB?.frequencyAvg?.toFixed(1)}`);

      if (
        statsA?.outbound?.packetsSent > 50 &&
        statsB?.inbound?.packetsReceived > 50 &&
        statsB?.outbound?.packetsSent > 50 &&
        statsA?.inbound?.packetsReceived > 50 &&
        statsA?.audioCurrentDirection === 'sendrecv' &&
        statsB?.audioCurrentDirection === 'sendrecv' &&
        !statsA?.audioElPaused &&
        !statsB?.audioElPaused
      ) {
        console.log('\n>>> STAGE 1 PASSED: Initial bidirectional audio flow verified! <<<');
        
        // Step 11: Mic Toggle Test (ON -> OFF -> ON)
        console.log('\n==================== STEP 11: MIC TOGGLE TEST ====================');
        console.log('Toggling Client A microphone OFF (track.enabled = false)...');
        await cdpA.evalJs(`
          const track = window._pc.getSenders().find(s => s.track && s.track.kind === 'audio').track;
          track.enabled = false;
        `);
        await new Promise(r => setTimeout(r, 2000));
        const statsMuted = await cdpA.evalJs(`getAudioStats()`);
        console.log(`Client A while muted: packetsSent=${statsMuted?.outbound?.packetsSent}`);

        console.log('Toggling Client A microphone back ON (track.enabled = true)...');
        await cdpA.evalJs(`
          const track = window._pc.getSenders().find(s => s.track && s.track.kind === 'audio').track;
          track.enabled = true;
        `);
        await new Promise(r => setTimeout(r, 2000));
        const statsUnmuted = await cdpA.evalJs(`getAudioStats()`);
        const statsBPostToggle = await cdpB.evalJs(`getAudioStats()`);
        console.log(`Client A after unmuting: packetsSent=${statsUnmuted?.outbound?.packetsSent}`);
        console.log(`Client B inbound after unmuting: packetsReceived=${statsBPostToggle?.inbound?.packetsReceived}`);

        if (statsUnmuted?.outbound?.packetsSent > statsMuted?.outbound?.packetsSent &&
            statsBPostToggle?.inbound?.packetsReceived > statsMuted?.outbound?.packetsSent) {
          console.log('>>> STEP 11 PASSED: Mic toggle restored audio packet flow cleanly! <<<');
        } else {
          console.error('>>> STEP 11 FAILED: Packets did not resume after unmute <<<');
        }

        passed = true;
        console.log('\n>>> ALL VERIFICATION CHECKS PASSED: REAL BIDIRECTIONAL WEBRTC AUDIO! <<<');
        break;
      }
    }

    if (!passed) {
      console.error('\n>>> TEST FAILED: Media flow criteria not met within timeout <<<');
    }

    // Cleanup
    procA.kill();
    procB.kill();
    server.close();
    process.exit(passed ? 0 : 1);
  } catch (err) {
    console.error('Test error:', err);
    procA.kill();
    procB.kill();
    server.close();
    process.exit(1);
  }
});
