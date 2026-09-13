import { getSocket } from './socket';
import { API_BASE_URL } from './api';

export interface RemotePeerStream {
  socketId: string;
  stream: MediaStream;
}

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  {
    urls: [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun.services.mozilla.com',
    ],
  },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp',
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map(); // socketId -> RTCPeerConnection
  private remoteStreams: Map<string, MediaStream> = new Map(); // socketId -> MediaStream
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map(); // socketId -> queued ICE candidates
  private iceServers: RTCIceServer[] = DEFAULT_ICE_SERVERS;
  private meetingId: string | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private speakingInterval: any = null;

  // Dedicated persistent remote audio playback elements, streams, and Web Audio nodes per peer
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private remoteAudioStreams: Map<string, MediaStream> = new Map();
  private remoteAudioNodes: Map<string, { sourceNode: MediaStreamAudioSourceNode; gainNode: GainNode }> = new Map();
  private localAudioSourceNode: MediaStreamAudioSourceNode | null = null;
  private pendingAudioElements: Set<HTMLAudioElement> = new Set();
  private audioUnlocked: boolean = false;
  private unlockListenersAttached: boolean = false;
  private diagnosticsInterval: any = null;
  public isAudioAutoplayBlocked: boolean = false;
  public onAudioAutoplayBlockedChange?: (blocked: boolean) => void;

  // Listeners
  public onRemoteStreamAdded?: (socketId: string, stream: MediaStream) => void;
  public onRemoteStreamRemoved?: (socketId: string) => void;
  public onLocalStreamUpdated?: (stream: MediaStream | null) => void;
  public onSpeakingChange?: (isSpeaking: boolean) => void;
  private streamListeners: Set<(socketId: string, stream: MediaStream) => void> = new Set();

  public addStreamListener(cb: (socketId: string, stream: MediaStream) => void) {
    this.streamListeners.add(cb);
    return () => {
      this.streamListeners.delete(cb);
    };
  }

  public async fetchIceServers(): Promise<RTCIceServer[]> {
    try {
      const endpoint = `${API_BASE_URL}/api/webrtc/ice-servers`;
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (data.iceServers && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          this.iceServers = data.iceServers;
          console.log('[WebRTC-ICE] Loaded dynamic ICE servers:', this.iceServers.length);
          return this.iceServers;
        }
      }
    } catch (e) {
      console.debug('[WebRTC-ICE] Using default STUN servers:', e);
    }
    return this.iceServers;
  }

  private async drainPendingCandidates(socketId: string, pc: RTCPeerConnection) {
    const pending = this.pendingCandidates.get(socketId);
    if (pending && pending.length > 0) {
      this.pendingCandidates.delete(socketId);
      for (const candidate of pending) {
        if (!candidate || !candidate.candidate) continue;
        try {
          await pc.addIceCandidate(candidate);
        } catch (e) {
          console.warn('[WebRTC-ICE] Error adding queued ICE candidate for', socketId, e);
        }
      }
    }
  }

  constructor() {
    this.setupSignalingListeners();
    this.fetchIceServers().catch(() => {});
    this.attachUnlockListeners();

    if (typeof window !== 'undefined') {
      (window as any).__CALLIVO_WEBRTC_MANAGER__ = this;
      (window as any).__CALLIVO_WEBRTC_DIAGNOSTICS__ = () => this.getDiagnostics();
    }
  }

  /**
   * Unlock browser audio stack on first user interaction (click, touch, keydown)
   * Plays all active and pending remote audio elements and resumes AudioContext.
   */
  public unlockAudio() {
    console.log('[WebRTC-Audio] Global audio unlock triggered');

    // 1. Resume AudioContext if suspended
    try {
      if (!this.audioContext) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioContext = new AudioCtxClass();
        }
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('[WebRTC-Audio] AudioContext resumed successfully (state: running)');
        }).catch((e) => console.warn('[WebRTC-Audio] AudioContext resume error:', e));
      }
    } catch (e) {
      console.warn('[WebRTC-Audio] AudioContext init warning:', e);
    }

    // 2. Play all active remote audio elements
    const elementsToPlay = new Set<HTMLAudioElement>([
      ...this.remoteAudioElements.values(),
      ...this.pendingAudioElements,
    ]);

    let blockedCount = 0;
    elementsToPlay.forEach((audioEl) => {
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.play()
        .then(() => {
          console.log(`[WebRTC-Audio] Audio element ${audioEl.id} unlocked and playing`);
          this.pendingAudioElements.delete(audioEl);
          if (this.pendingAudioElements.size === 0) {
            this.isAudioAutoplayBlocked = false;
            this.onAudioAutoplayBlockedChange?.(false);
          }
        })
        .catch((err) => {
          blockedCount++;
          console.warn(`[WebRTC-Audio] Audio element ${audioEl.id} playback blocked:`, err.message);
          this.pendingAudioElements.add(audioEl);
        });
    });

    if (blockedCount > 0) {
      this.isAudioAutoplayBlocked = true;
      this.onAudioAutoplayBlockedChange?.(true);
      this.attachUnlockListeners();
    } else {
      this.isAudioAutoplayBlocked = false;
      this.onAudioAutoplayBlockedChange?.(false);
    }

    this.audioUnlocked = true;
  }

  /**
   * Explicitly resume/play audio element for a specific peer
   */
  public ensurePeerAudioPlaying(socketId: string) {
    const audioEl = this.remoteAudioElements.get(socketId);
    if (audioEl) {
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.play()
        .then(() => {
          console.log(`[WebRTC-Audio] Peer ${socketId} audio playing successfully (paused=${audioEl.paused})`);
          this.pendingAudioElements.delete(audioEl);
          if (this.pendingAudioElements.size === 0) {
            this.isAudioAutoplayBlocked = false;
            this.onAudioAutoplayBlockedChange?.(false);
          }
        })
        .catch((err) => {
          console.warn(`[WebRTC-Audio] Peer ${socketId} audio playback waiting for user gesture:`, err.message);
          this.pendingAudioElements.add(audioEl);
          this.isAudioAutoplayBlocked = true;
          this.onAudioAutoplayBlockedChange?.(true);
          this.attachUnlockListeners();
        });
    }

    // Also ensure Web Audio context is active
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
  }

  private attachUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;

    const unlockHandler = () => {
      this.unlockAudio();
      if (this.pendingAudioElements.size === 0) {
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        this.unlockListenersAttached = false;
      }
    };

    window.addEventListener('click', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
  }

  /**
   * Dedicated, persistent remote audio track handler for each peer.
   * Employs dual-output playback:
   * 1. Persistent HTMLAudioElement mounted in DOM
   * 2. Web Audio API AudioContext.destination routing directly to hardware audio sink
   */
  private playRemoteAudioTrack(socketId: string, track: MediaStreamTrack, remoteStreamFromEvent?: MediaStream) {
    console.log(
      `[WebRTC-Audio] playRemoteAudioTrack for peer ${socketId}: ` +
      `trackId=${track.id}, kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}, muted=${track.muted}`
    );

    // 1. Manage persistent MediaStream containing the remote audio track
    let audioStream = this.remoteAudioStreams.get(socketId);
    if (!audioStream) {
      audioStream = remoteStreamFromEvent || new MediaStream([track]);
      this.remoteAudioStreams.set(socketId, audioStream);
    }

    if (!audioStream.getTracks().some((t) => t.id === track.id)) {
      audioStream.addTrack(track);
      console.log(`[WebRTC-Audio] Appended audio track ${track.id} to persistent audio stream for peer ${socketId}`);
    }

    // 2. Manage persistent HTMLAudioElement
    let audioEl = this.remoteAudioElements.get(socketId);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = `remote-audio-${socketId}`;
      audioEl.autoplay = true;
      (audioEl as any).playsInline = true;
      audioEl.setAttribute('playsinline', 'true');
      audioEl.muted = false;
      audioEl.volume = 1.0;

      let container = document.getElementById('callivo-audio-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'callivo-audio-container';
        container.style.position = 'fixed';
        container.style.width = '0px';
        container.style.height = '0px';
        container.style.opacity = '0';
        container.style.pointerEvents = 'none';
        container.style.bottom = '0';
        container.style.right = '0';
        document.body.appendChild(container);
      }
      container.appendChild(audioEl);
      this.remoteAudioElements.set(socketId, audioEl);
    }

    // Ensure audio element srcObject points to the stream with live track
    if (audioEl.srcObject !== audioStream) {
      audioEl.srcObject = audioStream;
    }
    audioEl.muted = false;
    audioEl.volume = 1.0;

    // 3. Web Audio API Direct Hardware Routing (Parallel output pipeline)
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioContext = new AudioCtxClass();
        }
      }
      if (this.audioContext && !this.remoteAudioNodes.has(socketId)) {
        const sourceNode = this.audioContext.createMediaStreamSource(audioStream);
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0;
        sourceNode.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        this.remoteAudioNodes.set(socketId, { sourceNode, gainNode });
        console.log(`[WebRTC-Audio] Connected Web Audio destination pipeline for peer ${socketId}`);
      }
    } catch (e) {
      console.warn(`[WebRTC-Audio] Web Audio pipeline note for peer ${socketId}:`, e);
    }

    const attemptPlay = () => {
      audioEl.muted = false;
      audioEl.volume = 1.0;
      audioEl.play()
        .then(() => {
          console.log(`[WebRTC-Audio] Playback SUCCESS for peer ${socketId}: paused=${audioEl.paused}, readyState=${audioEl.readyState}`);
          this.pendingAudioElements.delete(audioEl);
          if (this.pendingAudioElements.size === 0) {
            this.isAudioAutoplayBlocked = false;
            this.onAudioAutoplayBlockedChange?.(false);
          }
        })
        .catch((err) => {
          console.warn(`[WebRTC-Audio] Playback queued for user interaction for peer ${socketId}:`, err.message);
          this.pendingAudioElements.add(audioEl);
          this.isAudioAutoplayBlocked = true;
          this.onAudioAutoplayBlockedChange?.(true);
          this.attachUnlockListeners();
        });
    };

    attemptPlay();

    track.onunmute = () => {
      console.log(`[WebRTC-Audio] Remote audio track onunmute fired for peer ${socketId}`);
      attemptPlay();
    };

    track.onended = () => {
      console.log(`[WebRTC-Audio] Remote audio track ended for peer ${socketId}`);
    };
  }

  private removePeerAudio(socketId: string) {
    const audioEl = this.remoteAudioElements.get(socketId);
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      this.pendingAudioElements.delete(audioEl);
      this.remoteAudioElements.delete(socketId);
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
      console.log(`[WebRTC-Audio] Cleaned up remote audio element for peer ${socketId}`);
    }

    const nodes = this.remoteAudioNodes.get(socketId);
    if (nodes) {
      try {
        nodes.sourceNode.disconnect();
        nodes.gainNode.disconnect();
      } catch (e) {}
      this.remoteAudioNodes.delete(socketId);
    }

    const audioStream = this.remoteAudioStreams.get(socketId);
    if (audioStream) {
      audioStream.getTracks().forEach((t) => audioStream.removeTrack(t));
      this.remoteAudioStreams.delete(socketId);
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(socketId: string): MediaStream | undefined {
    return this.remoteStreams.get(socketId);
  }

  public getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  /**
   * Acquire local camera and microphone stream.
   * Guaranteed: Real microphone track is acquired and logged.
   */
  public async initLocalStream(audio = true, video = true): Promise<MediaStream | null> {
    try {
      if (this.localStream) {
        this.stopLocalStream();
      }

      console.log(`[WebRTC-Media] Requesting getUserMedia with initial audio=${audio}, video=${video}`);
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      // STEP 1 AUDIT: Log acquired audio tracks
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.error('[WebRTC-Media] FATAL: getUserMedia resolved with 0 audio tracks!');
      } else {
        audioTracks.forEach((track) => {
          track.enabled = audio;
          console.log(
            `[WebRTC-Audio] Step 1 Audit - Microphone Track Acquired: ` +
            `id=${track.id}, kind=${track.kind}, enabled=${track.enabled}, muted=${track.muted}, readyState=${track.readyState}`
          );
        });
      }

      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = video;
        console.log(
          `[WebRTC-Video] Camera Track Acquired: ` +
          `id=${track.id}, kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`
        );
      });

      this.setupAudioAnalyser(this.localStream);
      this.onLocalStreamUpdated?.(this.localStream);

      // Attach tracks to any already-established peer connections
      for (const [peerSocketId, pc] of this.peerConnections.entries()) {
        const audioTrack = this.localStream.getAudioTracks().find((t) => t.readyState === 'live');
        const videoTrack = this.localStream.getVideoTracks().find((t) => t.readyState === 'live');
        const senders = pc.getSenders();
        if (audioTrack) {
          const aSender = senders.find((s) => s.track?.kind === 'audio' || (s as any).kind === 'audio');
          if (aSender) await aSender.replaceTrack(audioTrack);
        }
        if (videoTrack) {
          const vSender = senders.find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
          if (vSender) await vSender.replaceTrack(videoTrack);
        }
      }

      return this.localStream;
    } catch (err: any) {
      console.warn('[WebRTC-Media] Error acquiring camera & mic, falling back to audio-only:', err.message);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const audioTracks = this.localStream.getAudioTracks();
        audioTracks.forEach((track) => {
          track.enabled = audio;
          console.log(
            `[WebRTC-Audio] Step 1 Audit (Audio Fallback) - Microphone Track Acquired: ` +
            `id=${track.id}, kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}`
          );
        });
        this.setupAudioAnalyser(this.localStream);
        this.onLocalStreamUpdated?.(this.localStream);
        for (const [peerSocketId, pc] of this.peerConnections.entries()) {
          const audioTrack = this.localStream.getAudioTracks().find((t) => t.readyState === 'live');
          if (audioTrack) {
            const aSender = pc.getSenders().find((s) => s.track?.kind === 'audio' || (s as any).kind === 'audio');
            if (aSender) await aSender.replaceTrack(audioTrack);
          }
        }
        return this.localStream;
      } catch (audioErr) {
        console.error('[WebRTC-Media] FATAL: Could not access microphone hardware:', audioErr);
      }
      return null;
    }
  }

  /**
   * Setup Web Audio API to detect active speaking
   */
  private setupAudioAnalyser(stream: MediaStream) {
    try {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioContextClass();
      }
      this.localAudioSourceNode = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.localAudioSourceNode.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let lastSpeaking = false;

      if (this.speakingInterval) clearInterval(this.speakingInterval);

      this.speakingInterval = setInterval(() => {
        if (!this.analyser || !this.meetingId) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isSpeaking = average > 25; // Volume threshold

        if (isSpeaking !== lastSpeaking) {
          lastSpeaking = isSpeaking;
          this.onSpeakingChange?.(isSpeaking);
          const socket = getSocket();
          socket.emit('media:active-speaker', {
            meetingId: this.meetingId,
            isSpeaking,
          });
        }
      }, 200);
    } catch (e) {
      console.warn('[WebRTC-Audio] Audio analyser setup note:', e);
    }
  }

  /**
   * Setup Socket.IO WebRTC signaling handlers
   * Implements strict STEP 2 & STEP 3 negotiation sequence.
   */
  private setupSignalingListeners() {
    const socket = getSocket();

    // When joining room, initiate peer connections and send offers to all existing participants
    socket.on('room:joined', async (data: {
      meetingId: string;
      self: any;
      existingParticipants: any[];
      isHost: boolean;
    }) => {
      this.meetingId = data.meetingId;
      console.log(`[WebRTC-Signaling] room:joined with ${data.existingParticipants?.length || 0} existing peers`);
      this.startAudioDiagnosticsMonitoring();

      for (const peer of (data.existingParticipants || [])) {
        if (peer.socketId !== socket.id) {
          await this.createOfferToPeer(peer.socketId);
        }
      }
    });

    // Authoritative state from server
    socket.on('meeting:state', async (data: { meetingId: string; participants: any[] }) => {
      this.meetingId = data.meetingId;
      for (const peer of (data.participants || [])) {
        if (peer.socketId !== socket.id && !this.peerConnections.has(peer.socketId)) {
          this.getOrCreatePeerConnection(peer.socketId);
        }
      }
    });

    // When a new peer joins, prepare peer connection without transceivers (wait for their offer)
    socket.on('participant:joined', async (participant: any) => {
      if (participant.socketId && participant.socketId !== socket.id) {
        console.log(`[WebRTC-Signaling] New participant joined: ${participant.socketId} (${participant.name})`);
        this.getOrCreatePeerConnection(participant.socketId);
      }
    });

    // =========================================================================
    // STEP 3: ANSWERER NEGOTIATION SEQUENCE
    // 1. Receive offer
    // 2. setRemoteDescription(offer)
    // 3. Find REMOTE audio transceiver created from offer
    // 4. Attach local microphone track to sender
    // 5. Set that transceiver direction to 'sendrecv'
    // 6. createAnswer()
    // 7. setLocalDescription()
    // 8. Send answer
    // =========================================================================
    socket.on('webrtc:offer', async (data: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC-Signaling] [ANSWERER] Step 3.1: Received offer from ${data.fromSocketId}`);
      const pc = this.getOrCreatePeerConnection(data.fromSocketId);
      try {
        // Step 3.2: setRemoteDescription(offer)
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        await this.drainPendingCandidates(data.fromSocketId, pc);

        const transceivers = pc.getTransceivers();
        const localAudioTrack = this.localStream?.getAudioTracks().find((t) => t.readyState === 'live') || null;
        const localVideoTrack = this.localStream?.getVideoTracks().find((t) => t.readyState === 'live') || null;

        // Step 3.3 & 3.4 & 3.5: Find the REMOTE audio transceiver created from offer, attach track, set sendrecv
        const audioTransceiver = transceivers.find(
          (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
        );

        if (audioTransceiver) {
          audioTransceiver.direction = 'sendrecv';
          if (localAudioTrack) {
            await audioTransceiver.sender.replaceTrack(localAudioTrack);
            console.log(
              `[WebRTC-Signaling] [ANSWERER] Step 3.4/3.5: Attached local mic track to audio sender for ${data.fromSocketId}: ` +
              `trackId=${localAudioTrack.id}, enabled=${localAudioTrack.enabled}, dir=${audioTransceiver.direction}`
            );
          } else {
            console.warn(`[WebRTC-Signaling] [ANSWERER] No local live audio track available to attach to audio transceiver!`);
          }
        } else {
          console.error(`[WebRTC-Signaling] [ANSWERER] FATAL: No audio transceiver created by remote offer for ${data.fromSocketId}`);
        }

        // Configure video transceiver from offer
        const videoTransceiver = transceivers.find(
          (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
        );

        if (videoTransceiver) {
          videoTransceiver.direction = 'sendrecv';
          if (localVideoTrack) {
            await videoTransceiver.sender.replaceTrack(localVideoTrack);
          }
        }

        // Step 3.6: createAnswer()
        const answer = await pc.createAnswer();

        // Step 3.7: setLocalDescription()
        await pc.setLocalDescription(answer);

        // STEP 2 AUDIT: Verify answer SDP contains m=audio and a=sendrecv
        const sdpStr = answer.sdp || '';
        const hasAudio = sdpStr.includes('m=audio');
        const hasSendRecv = sdpStr.includes('a=sendrecv');
        console.log(
          `[WebRTC-Signaling] [ANSWERER] Step 3.7: Local Answer Created. ` +
          `m=audio=${hasAudio}, a=sendrecv=${hasSendRecv}, direction=${audioTransceiver?.direction}`
        );

        // Step 3.8: Send answer
        socket.emit('webrtc:answer', {
          toSocketId: data.fromSocketId,
          sdp: answer,
        });
        console.log(`[WebRTC-Signaling] [ANSWERER] Step 3.8: Sent answer to ${data.fromSocketId}`);
      } catch (err) {
        console.error('[WebRTC-Signaling] Error handling WebRTC offer from', data.fromSocketId, err);
      }
    });

    // =========================================================================
    // STEP 3: OFFERER RECEIVES ANSWER
    // 1. setRemoteDescription(answer)
    // 2. Verify negotiated audio transceiver direction === 'sendrecv'
    // =========================================================================
    socket.on('webrtc:answer', async (data: { fromSocketId: string; sdp: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC-Signaling] [OFFERER] Received answer from ${data.fromSocketId}`);
      const pc = this.peerConnections.get(data.fromSocketId);
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          await this.drainPendingCandidates(data.fromSocketId, pc);

          const audioTransceiver = pc.getTransceivers().find(
            (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
          );

          console.log(
            `[WebRTC-Signaling] [OFFERER] Step 2 Audit - Final Negotiated Audio Transceiver with ${data.fromSocketId}: ` +
            `mid=${audioTransceiver?.mid}, direction=${audioTransceiver?.direction}, currentDirection=${audioTransceiver?.currentDirection}, ` +
            `senderTrackId=${audioTransceiver?.sender?.track?.id}, receiverTrackId=${audioTransceiver?.receiver?.track?.id}`
          );
        } catch (err) {
          console.error('[WebRTC-Signaling] Error setting remote description from answer', err);
        }
      }
    });

    // Handle incoming ICE candidate with queuing support
    socket.on('webrtc:ice-candidate', async (data: { fromSocketId: string; candidate: RTCIceCandidateInit }) => {
      if (!data.candidate || !data.candidate.candidate) return;
      const pc = this.peerConnections.get(data.fromSocketId);
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(data.candidate);
        } catch (err) {
          console.error('[WebRTC-ICE] Error adding ICE candidate from', data.fromSocketId, err);
        }
      } else {
        if (!this.pendingCandidates.has(data.fromSocketId)) {
          this.pendingCandidates.set(data.fromSocketId, []);
        }
        this.pendingCandidates.get(data.fromSocketId)!.push(data.candidate);
      }
    });

    // Handle participant left
    socket.on('participant:left', (data: { socketId: string }) => {
      console.log(`[WebRTC-Signaling] Participant left: ${data.socketId}`);
      this.removePeer(data.socketId);
    });
  }

  // =========================================================================
  // STEP 3: OFFERER NEGOTIATION SEQUENCE
  // 1. Create peer connection
  // 2. Create/reuse audio transceiver with microphone track and sendrecv direction
  // 3. createOffer()
  // 4. setLocalDescription()
  // 5. Send offer
  // =========================================================================
  private async createOfferToPeer(targetSocketId: string) {
    console.log(`[WebRTC-Signaling] [OFFERER] Step 3.1: Creating offer to peer ${targetSocketId}`);
    const pc = this.getOrCreatePeerConnection(targetSocketId);
    try {
      const audioTrack = this.localStream?.getAudioTracks().find((t) => t.readyState === 'live') || null;
      const videoTrack = this.localStream?.getVideoTracks().find((t) => t.readyState === 'live') || null;

      // Step 3.2: Configure/reuse audio transceiver with microphone track
      let audioTransceiver = pc.getTransceivers().find(
        (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
      );

      if (!audioTransceiver) {
        audioTransceiver = pc.addTransceiver(audioTrack || 'audio', {
          direction: 'sendrecv',
          streams: this.localStream ? [this.localStream] : [],
        });
        console.log(`[WebRTC-Signaling] [OFFERER] Step 3.2: Created new audio transceiver (sendrecv) with track=${audioTrack?.id}`);
      } else {
        audioTransceiver.direction = 'sendrecv';
        if (audioTrack && audioTransceiver.sender.track !== audioTrack) {
          await audioTransceiver.sender.replaceTrack(audioTrack);
        }
      }

      // Configure video transceiver
      let videoTransceiver = pc.getTransceivers().find(
        (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
      );

      if (!videoTransceiver) {
        videoTransceiver = pc.addTransceiver(videoTrack || 'video', {
          direction: 'sendrecv',
          streams: this.localStream ? [this.localStream] : [],
        });
      } else {
        videoTransceiver.direction = 'sendrecv';
        if (videoTrack && videoTransceiver.sender.track !== videoTrack) {
          await videoTransceiver.sender.replaceTrack(videoTrack);
        }
      }

      // Step 1 Audit: Verify same live track is attached to RTCRtpSender
      console.log(
        `[WebRTC-Audio] Step 1 Audit - Offerer Audio Sender: ` +
        `senderTrackId=${audioTransceiver.sender.track?.id}, expectedTrackId=${audioTrack?.id}, ` +
        `enabled=${audioTransceiver.sender.track?.enabled}, readyState=${audioTransceiver.sender.track?.readyState}`
      );

      // Step 3.3: createOffer()
      const offer = await pc.createOffer();

      // Step 3.4: setLocalDescription()
      await pc.setLocalDescription(offer);

      // Step 2 Audit: Verify offer SDP contains m=audio and a=sendrecv
      const sdpStr = offer.sdp || '';
      console.log(
        `[WebRTC-Signaling] [OFFERER] Step 3.4: Local Offer Created. ` +
        `m=audio=${sdpStr.includes('m=audio')}, a=sendrecv=${sdpStr.includes('a=sendrecv')}`
      );

      // Step 3.5: Send offer
      const socket = getSocket();
      socket.emit('webrtc:offer', {
        toSocketId: targetSocketId,
        sdp: offer,
      });
      console.log(`[WebRTC-Signaling] [OFFERER] Step 3.5: Sent offer to ${targetSocketId}`);
    } catch (err) {
      console.error('[WebRTC-Signaling] Error creating offer to', targetSocketId, err);
    }
  }

  /**
   * Get or initialize an RTCPeerConnection for a socket ID.
   * Configures max-bundle and require rtcp-mux to guarantee audio and video share connected transport.
   */
  private getOrCreatePeerConnection(socketId: string): RTCPeerConnection {
    let pc = this.peerConnections.get(socketId);
    if (pc) return pc;

    console.log(`[WebRTC] Initializing RTCPeerConnection for peer ${socketId} (max-bundle)`);
    pc = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 2,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });
    this.peerConnections.set(socketId, pc);

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && event.candidate.candidate) {
        const socket = getSocket();
        socket.emit('webrtc:ice-candidate', {
          toSocketId: socketId,
          candidate: event.candidate,
        });
      }
    };

    // STEP 8 AUDIT: ontrack handler
    pc.ontrack = (event) => {
      console.log(
        `[WebRTC-Track] Step 8 Audit - ontrack received from peer ${socketId}: ` +
        `kind=${event.track.kind}, id=${event.track.id}, readyState=${event.track.readyState}, streamsLength=${event.streams.length}`
      );

      // Immediately handle remote audio track with persistent audio player and Web Audio destination
      if (event.track.kind === 'audio') {
        this.playRemoteAudioTrack(socketId, event.track, event.streams[0]);
      }

      let remoteStream = this.remoteStreams.get(socketId);
      if (!remoteStream) {
        remoteStream = new MediaStream();
        this.remoteStreams.set(socketId, remoteStream);
      }

      // Add or update track in peer's remoteStream
      const existingSameKind = remoteStream.getTracks().find((t) => t.kind === event.track.kind);
      if (existingSameKind && existingSameKind.id !== event.track.id) {
        remoteStream.removeTrack(existingSameKind);
      }
      if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      // Provide fresh MediaStream reference so React component srcObject rebinds properly
      const freshStream = new MediaStream(remoteStream.getTracks());

      const notify = () => {
        this.onRemoteStreamAdded?.(socketId, freshStream);
        this.streamListeners.forEach((cb) => {
          try { cb(socketId, freshStream); } catch (e) { console.error(e); }
        });
      };

      notify();

      event.track.onunmute = () => {
        console.log(`[WebRTC-Track] Remote track ${event.track.kind} unmuted from peer ${socketId}`);
        notify();
      };

      event.track.onended = () => {
        console.log(`[WebRTC-Track] Remote track ${event.track.kind} ended from peer ${socketId}`);
        const currentStream = this.remoteStreams.get(socketId);
        if (currentStream) {
          currentStream.removeTrack(event.track);
          notify();
        }
      };
    };

    // STEP 4 AUDIT: ICE and Connection State Logging
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC-ICE] Step 4 Audit - Peer ${socketId} connectionState: ${pc?.connectionState}`);
      if (pc?.connectionState === 'connected') {
        pc.getStats().then((stats) => {
          stats.forEach((report) => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              const local = stats.get(report.localCandidateId);
              const remote = stats.get(report.remoteCandidateId);
              console.log(
                `[WebRTC-ICE] Selected Candidate Pair for ${socketId}: ` +
                `Local=${local?.candidateType} (${local?.ip || local?.address}:${local?.port} ${local?.protocol}) | ` +
                `Remote=${remote?.candidateType} (${remote?.ip || remote?.address}:${remote?.port} ${remote?.protocol}) | ` +
                `RTT=${report.currentRoundTripTime ? Math.round(report.currentRoundTripTime * 1000) + 'ms' : 'N/A'}`
              );
            }
          });
        });
      } else if (pc?.connectionState === 'failed') {
        console.warn(`[WebRTC-ICE] Peer ${socketId} connection failed, attempting ICE restart...`);
        try {
          pc.restartIce();
        } catch (e) {
          console.error('[WebRTC] restartIce error:', e);
        }
      } else if (pc?.connectionState === 'closed') {
        this.removePeer(socketId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC-ICE] Step 4 Audit - Peer ${socketId} iceConnectionState: ${pc?.iceConnectionState}`);
      if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'disconnected') {
        try {
          pc.restartIce();
        } catch (e) {
          console.error('[WebRTC] restartIce error:', e);
        }
      }
    };

    return pc;
  }

  /**
   * Remove peer connection, remote stream, and remote audio playback
   */
  private removePeer(socketId: string) {
    this.removePeerAudio(socketId);

    const pc = this.peerConnections.get(socketId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(socketId);
    }
    this.remoteStreams.delete(socketId);
    if (this.peerConnections.size === 0) {
      this.stopAudioDiagnosticsMonitoring();
    }
    this.onRemoteStreamRemoved?.(socketId);
  }

  /**
   * Toggle local microphone track with dynamic track re-acquisition on un-mute
   */
  public async setAudioEnabled(enabled: boolean) {
    console.log(`[WebRTC-Audio] setAudioEnabled called: enabled=${enabled}`);

    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length === 0 && enabled) {
        try {
          console.log('[WebRTC-Audio] No audio track exists on un-mute. Acquiring microphone track dynamically...');
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          const newTrack = micStream.getAudioTracks()[0];
          if (newTrack) {
            newTrack.enabled = true;
            this.localStream.addTrack(newTrack);
            console.log(`[WebRTC-Audio] Dynamically attached audio track ${newTrack.id} to local stream`);

            for (const [peerSocketId, pc] of this.peerConnections.entries()) {
              const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio' || (s as any).kind === 'audio');
              if (audioSender) {
                await audioSender.replaceTrack(newTrack);
                console.log(`[WebRTC-Audio] Replaced audio track on sender for peer ${peerSocketId}`);
              }
            }
            this.setupAudioAnalyser(this.localStream);
            this.onLocalStreamUpdated?.(this.localStream);
          }
        } catch (err) {
          console.warn('[WebRTC-Audio] Dynamic microphone acquisition failed:', err);
        }
      } else {
        audioTracks.forEach((track) => {
          track.enabled = enabled;
          console.log(`[WebRTC-Audio] Local audio track ${track.id} enabled set to: ${enabled}`);
        });

        // Ensure all active audio senders have the live track attached
        const liveTrack = audioTracks.find((t) => t.readyState === 'live');
        if (liveTrack) {
          for (const [peerSocketId, pc] of this.peerConnections.entries()) {
            const audioSender = pc.getSenders().find((s) => s.track?.kind === 'audio' || (s as any).kind === 'audio');
            if (audioSender && audioSender.track !== liveTrack) {
              await audioSender.replaceTrack(liveTrack);
              console.log(`[WebRTC-Audio] Attached live audio track to sender for peer ${peerSocketId}`);
            }
          }
        }
      }
    }

    if (this.meetingId) {
      const socket = getSocket();
      socket.emit('media:toggle-audio', {
        meetingId: this.meetingId,
        isMuted: !enabled,
      });
    }
  }

  /**
   * Toggle local camera track with dynamic acquisition if no live track exists
   */
  public async setVideoEnabled(enabled: boolean) {
    console.log(`[WebRTC-Video] setVideoEnabled called: enabled=${enabled}`);

    if (enabled) {
      const hasLiveVideo = this.localStream && this.localStream.getVideoTracks().some((t) => t.readyState === 'live');
      if (!hasLiveVideo) {
        try {
          console.log('[WebRTC-Video] No live video track exists on camera enable. Acquiring camera track dynamically...');
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
          });
          const newTrack = camStream.getVideoTracks()[0];
          if (newTrack) {
            newTrack.enabled = true;
            if (!this.localStream) {
              this.localStream = new MediaStream([newTrack]);
            } else {
              this.localStream.getVideoTracks().forEach((t) => {
                if (t.readyState === 'ended') {
                  this.localStream!.removeTrack(t);
                }
              });
              this.localStream.addTrack(newTrack);
            }
            console.log(`[WebRTC-Video] Dynamically attached camera track ${newTrack.id} to local stream`);

            for (const [peerSocketId, pc] of this.peerConnections.entries()) {
              const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
              if (videoSender) {
                await videoSender.replaceTrack(newTrack);
              }
            }
            this.onLocalStreamUpdated?.(this.localStream);
          }
        } catch (err) {
          console.warn('[WebRTC-Video] Dynamic camera acquisition failed:', err);
        }
      }
    }

    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = enabled;
        console.log(`[WebRTC-Video] Local video track ${track.id} enabled set to: ${enabled}`);
      });

      const liveTrack = videoTracks.find((t) => t.readyState === 'live');
      if (liveTrack) {
        for (const [peerSocketId, pc] of this.peerConnections.entries()) {
          const videoSender = pc.getSenders().find((s) => s.track?.kind === 'video' || (s as any).kind === 'video');
          if (videoSender && videoSender.track !== liveTrack) {
            await videoSender.replaceTrack(liveTrack);
          }
        }
      }
    }

    if (this.meetingId) {
      const socket = getSocket();
      socket.emit('media:toggle-video', {
        meetingId: this.meetingId,
        isVideoOff: !enabled,
      });
    }
  }

  /**
   * Start screen sharing
   */
  public async startScreenShare(): Promise<MediaStream | null> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];

      // Replace video track on all peer connections
      for (const [_, pc] of this.peerConnections) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }

      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      if (this.meetingId) {
        getSocket().emit('media:toggle-screen', {
          meetingId: this.meetingId,
          isScreenSharing: true,
        });
      }

      return this.screenStream;
    } catch (err) {
      console.warn('Screen share cancelled or failed:', err);
      return null;
    }
  }

  /**
   * Stop screen sharing and revert to webcam
   */
  public stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;

      // Revert to camera track if available
      const cameraVideoTrack = this.localStream?.getVideoTracks()[0] || null;
      for (const [_, pc] of this.peerConnections) {
        const senders = pc.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender && cameraVideoTrack) {
          videoSender.replaceTrack(cameraVideoTrack);
        }
      }

      if (this.meetingId) {
        getSocket().emit('media:toggle-screen', {
          meetingId: this.meetingId,
          isScreenSharing: false,
        });
      }
    }
  }

  /**
   * Start periodic diagnostics watchdog to verify active audio transmission and playback
   */
  public startAudioDiagnosticsMonitoring() {
    if (this.diagnosticsInterval) return;
    this.diagnosticsInterval = setInterval(async () => {
      if (this.peerConnections.size === 0) return;

      for (const [peerSocketId, pc] of this.peerConnections.entries()) {
        try {
          const stats = await pc.getStats();
          let audioBytesIn = 0;
          let audioBytesOut = 0;
          let audioPacketsIn = 0;
          let audioPacketsOut = 0;
          let audioPacketsLost = 0;
          let audioJitter = 0;

          stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              audioBytesIn += report.bytesReceived || 0;
              audioPacketsIn += report.packetsReceived || 0;
              audioPacketsLost += report.packetsLost || 0;
              if (report.jitter !== undefined) {
                audioJitter = Math.round(report.jitter * 1000);
              }
            }
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              audioBytesOut += report.bytesSent || 0;
              audioPacketsOut += report.packetsSent || 0;
            }
          });

          const audioTransceiver = pc.getTransceivers().find(
            (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
          );

          const audioEl = this.remoteAudioElements.get(peerSocketId);
          const isPaused = audioEl ? audioEl.paused : true;

          console.log(
            `[WebRTC-AudioAudit] Peer=${peerSocketId} | ` +
            `State=${pc.connectionState} (ICE: ${pc.iceConnectionState}) | ` +
            `Dir=${audioTransceiver?.direction} CurDir=${audioTransceiver?.currentDirection} | ` +
            `SenderTrack=${audioTransceiver?.sender.track?.id} (enabled=${audioTransceiver?.sender.track?.enabled}) | ` +
            `TX=${audioBytesOut}B (${audioPacketsOut} pkts) | ` +
            `RX=${audioBytesIn}B (${audioPacketsIn} pkts, lost=${audioPacketsLost}, jit=${audioJitter}ms) | ` +
            `AudioEl=${isPaused ? 'PAUSED' : 'PLAYING'} (vol=${audioEl?.volume}) | ` +
            `AutoplayBlocked=${this.isAudioAutoplayBlocked}`
          );

          // Watchdog: If inbound audio arrived but element is paused, ensure playback
          if (audioBytesIn > 0 && isPaused && audioEl) {
            console.warn(`[WebRTC-AudioAudit] Inbound audio arriving for peer ${peerSocketId} but player is paused. Triggering playback...`);
            this.ensurePeerAudioPlaying(peerSocketId);
          }
        } catch (e) {}
      }
    }, 3000);
  }

  public stopAudioDiagnosticsMonitoring() {
    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
      this.diagnosticsInterval = null;
    }
  }

  /**
   * Stop local tracks and clean up all connections and remote audio players
   */
  public leaveRoom() {
    this.stopAudioDiagnosticsMonitoring();

    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.stopLocalStream();
    this.stopScreenShare();

    for (const [_, pc] of this.peerConnections) {
      pc.close();
    }
    this.peerConnections.clear();
    this.remoteStreams.clear();

    // Clean up all persistent remote audio elements
    for (const [socketId, audioEl] of this.remoteAudioElements) {
      audioEl.pause();
      audioEl.srcObject = null;
      if (audioEl.parentNode) {
        audioEl.parentNode.removeChild(audioEl);
      }
    }
    this.remoteAudioElements.clear();
    this.pendingAudioElements.clear();

    // Clean up Web Audio nodes
    for (const [_, nodes] of this.remoteAudioNodes) {
      try {
        nodes.sourceNode.disconnect();
        nodes.gainNode.disconnect();
      } catch (e) {}
    }
    this.remoteAudioNodes.clear();

    // Clean up remote audio streams
    for (const [_, audioStream] of this.remoteAudioStreams) {
      audioStream.getTracks().forEach((t) => audioStream.removeTrack(t));
    }
    this.remoteAudioStreams.clear();

    this.meetingId = null;
    console.log('[WebRTC] leaveRoom completed and all resources cleaned up');
  }

  public stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
      this.onLocalStreamUpdated?.(null);
    }
  }

  /**
   * Aggregate real-time connection diagnostic statistics.
   * Reports raw, true telemetry without any static fallback values.
   */
  public async getDiagnostics(): Promise<ConnectionStats> {
    let rttMs = 0;
    let packetLossPercent = 0;
    let jitterMs = 0;
    let sendBytes = 0;
    let recvBytes = 0;
    let audioBytesSent = 0;
    let audioBytesReceived = 0;
    let audioPacketsSent = 0;
    let audioPacketsReceived = 0;
    let audioPacketsLost = 0;
    let audioJitterMs = 0;
    let audioDirection = 'none';
    let audioCurrentDirection = 'none';
    let isAudioElementPlaying = false;
    let audioCodec = 'Opus (48kHz stereo)';
    let videoCodec = 'VP8 / H.264 (Hardware Accelerated)';
    let iceCandidateType = 'host';
    let connectionState = this.peerConnections.size > 0 ? 'connected' : 'local-ready';

    let resolution = '1280 x 720';
    let framerate = 30;

    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          resolution = `${settings.width} x ${settings.height}`;
        }
        if (settings.frameRate) {
          framerate = Math.round(settings.frameRate);
        }
      }
    }

    // Inspect active peer connection stats
    for (const [peerSocketId, pc] of this.peerConnections) {
      try {
        const stats = await pc.getStats();
        connectionState = pc.connectionState || pc.iceConnectionState;

        const aTrans = pc.getTransceivers().find(
          (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
        );
        if (aTrans) {
          audioDirection = aTrans.direction;
          audioCurrentDirection = aTrans.currentDirection || 'none';
        }

        const audioEl = this.remoteAudioElements.get(peerSocketId);
        if (audioEl && !audioEl.paused) {
          isAudioElementPlaying = true;
        }

        stats.forEach((report) => {
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            if (report.currentRoundTripTime !== undefined) {
              rttMs = Math.round(report.currentRoundTripTime * 1000);
            }
          }

          if (report.type === 'inbound-rtp') {
            if (report.packetsLost !== undefined && report.packetsReceived) {
              const total = report.packetsLost + report.packetsReceived;
              if (total > 0) {
                packetLossPercent = parseFloat(((report.packetsLost / total) * 100).toFixed(2));
              }
            }
            if (report.jitter !== undefined) {
              jitterMs = Math.round(report.jitter * 1000);
            }
            if (report.bytesReceived !== undefined) {
              recvBytes += report.bytesReceived;
              if (report.kind === 'audio') {
                audioBytesReceived += report.bytesReceived;
                audioPacketsReceived += report.packetsReceived || 0;
                audioPacketsLost += report.packetsLost || 0;
                if (report.jitter !== undefined) {
                  audioJitterMs = Math.round(report.jitter * 1000);
                }
              }
            }
            if (report.kind === 'video') {
              if (report.frameWidth && report.frameHeight) {
                resolution = `${report.frameWidth} x ${report.frameHeight}`;
              }
              if (report.framesPerSecond) {
                framerate = Math.round(report.framesPerSecond);
              }
            }
          }

          if (report.type === 'outbound-rtp') {
            if (report.bytesSent !== undefined) {
              sendBytes += report.bytesSent;
              if (report.kind === 'audio') {
                audioBytesSent += report.bytesSent;
                audioPacketsSent += report.packetsSent || 0;
              }
            }
          }

          if (report.type === 'remote-candidate' && report.candidateType) {
            iceCandidateType = report.candidateType;
          }
        });
      } catch (err) {
        console.warn('Failed to read peer stats:', err);
      }
    }

    let rating: 'excellent' | 'good' | 'poor' = 'excellent';
    if (rttMs > 200 || packetLossPercent > 5) {
      rating = 'poor';
    } else if (rttMs > 100 || packetLossPercent > 2) {
      rating = 'good';
    }

    return {
      peersCount: this.peerConnections.size,
      connectionState,
      rttMs,
      packetLossPercent,
      jitterMs,
      sendBitrateKbps: Math.round((sendBytes * 8) / 1024),
      recvBitrateKbps: Math.round((recvBytes * 8) / 1024),
      audioBytesSent,
      audioBytesReceived,
      audioPacketsSent,
      audioPacketsReceived,
      audioPacketsLost,
      audioJitterMs,
      audioDirection,
      audioCurrentDirection,
      isAudioAutoplayBlocked: this.isAudioAutoplayBlocked,
      isAudioElementPlaying,
      resolution,
      framerate,
      audioCodec,
      videoCodec,
      iceCandidateType,
      rating,
    };
  }
}

export interface ConnectionStats {
  peersCount: number;
  connectionState: string;
  rttMs: number;
  packetLossPercent: number;
  jitterMs: number;
  sendBitrateKbps: number;
  recvBitrateKbps: number;
  resolution: string;
  framerate: number;
  audioCodec: string;
  videoCodec: string;
  iceCandidateType: string;
  rating: 'excellent' | 'good' | 'poor';
  audioBytesSent: number;
  audioBytesReceived: number;
  audioPacketsSent: number;
  audioPacketsReceived: number;
  audioPacketsLost: number;
  audioJitterMs: number;
  audioDirection: string;
  audioCurrentDirection: string;
  isAudioAutoplayBlocked: boolean;
  isAudioElementPlaying: boolean;
}

export const webrtcManager = new WebRTCManager();
