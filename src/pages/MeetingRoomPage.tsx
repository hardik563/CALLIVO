import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../stores/meetingStore';
import { useParticipantStore } from '../stores/participantStore';
import { useAuthStore } from '../stores/authStore';
import { useChatStore } from '../stores/chatStore';
import { ParticipantGrid } from '../components/meeting/ParticipantGrid';
import { MeetingControls } from '../components/meeting/MeetingControls';
import { ChatDrawer } from '../components/meeting/ChatDrawer';
import { ParticipantsDrawer } from '../components/meeting/ParticipantsDrawer';
import { MeetingInfoDrawer } from '../components/meeting/MeetingInfoDrawer';
import { DeviceSettingsModal } from '../components/meeting/DeviceSettingsModal';
import { QnADrawer } from '../components/meeting/QnADrawer';
import { CommentsDrawer } from '../components/meeting/CommentsDrawer';
import { MeetingSettingsModal } from '../components/meeting/MeetingSettingsModal';
import { ConnectionDiagnosticsModal } from '../components/meeting/ConnectionDiagnosticsModal';
import { CaptionsOverlay } from '../components/meeting/CaptionsOverlay';
import { SpatialMeetingRoom } from '../components/three/SpatialMeetingRoom';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';
import { copyToClipboard, formatTime } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { getSocket } from '../lib/socket';
import { webrtcManager } from '../lib/webrtc';
import { meetingsApi } from '../lib/api';
import { inMeetingRecorder } from '../lib/recorder';
import {
  ShieldCheck,
  Sparkles,
  StopCircle,
  Copy,
  LayoutGrid,
  Wifi,
  Clock,
  Check,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const MeetingRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { success, warning, error: toastError, toast } = useToast();

  const {
    activeMeeting,
    setActiveMeeting,
    isMuted,
    isCameraOff,
    viewMode,
    setViewMode,
    isRecording,
    virtualBackground,
    isScreenSharing,
    setScreenSharing,
  } = useMeetingStore();

  const {
    participants,
    setParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addReaction,
  } = useParticipantStore();

  const { addMeetingMessage, clearMeetingMessages } = useChatStore();

  // Drawers and Modals
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isMeetingInfoOpen, setIsMeetingInfoOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQnAOpen, setIsQnAOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isMeetingSettingsOpen, setIsMeetingSettingsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);

  // Timers, Streams and Waiting Room
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [recSeconds, setRecSeconds] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<any>(null);

  // Waiting Room state
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitingHostName, setWaitingHostName] = useState('the host');
  const [waitingParticipants, setWaitingParticipants] = useState<
    Array<{ socketId: string; name: string; avatar?: string; joinedAt?: string }>
  >([]);

  const localParticipantIdRef = useRef<string>('local');
  const isHost = Boolean(activeMeeting?.isHost || (user?.id && activeMeeting?.hostId === user.id));

  // Room connection lifecycle state
  const [roomStatus, setRoomStatus] = useState<'loading' | 'connecting' | 'connected' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initialize meeting & fetch details from API
  useEffect(() => {
    if (!id) {
      setRoomStatus('error');
      setErrorMessage('No meeting ID provided.');
      return;
    }

    setRoomStatus('loading');
    meetingsApi.getById(id).then((res) => {
      if (res.success && res.meeting) {
        setActiveMeeting({
          id: res.meeting.id,
          title: res.meeting.title,
          passcode: res.meeting.passcode,
          isHost: res.meeting.isHost,
          hostId: res.meeting.hostId,
        });
        setMeetingConfig({
          waitingRoom: res.meeting.waitingRoom,
          muteOnEntry: res.meeting.muteOnEntry,
          allowScreenShare: res.meeting.allowScreenShare,
          allowChat: res.meeting.allowChat,
          allowReactions: res.meeting.allowReactions,
          allowQuestions: res.meeting.allowQuestions,
          allowComments: res.meeting.allowComments,
          isLocked: res.meeting.isLocked,
        });
        setRoomStatus('connecting');
      } else {
        setRoomStatus('error');
        setErrorMessage('Meeting not found. Please verify the meeting ID.');
      }
    }).catch((err) => {
      console.warn('Could not fetch meeting metadata:', err);
      setRoomStatus('error');
      setErrorMessage(err.message || 'Meeting not found or invalid link.');
    });
  }, [id, setActiveMeeting]);

  // 2. Initialize media & WebRTC Socket.IO signaling
  useEffect(() => {
    if (!id) return;

    clearMeetingMessages();

    // Trigger immediate audio unlock for browser autoplay policies
    webrtcManager.unlockAudio();
    const unlockOnGesture = () => webrtcManager.unlockAudio();
    window.addEventListener('click', unlockOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });

    const guestName = sessionStorage.getItem('callivo_guest_name') || 'Guest Participant';
    const effectiveName = user?.name || guestName;
    const effectiveAvatar = user?.avatar || undefined;
    const effectiveUserId = user?.id || undefined;

    // Initial local participant state
    const initialLocalP = {
      id: 'local',
      name: `${effectiveName} (You)`,
      avatar: effectiveAvatar || '',
      isLocal: true,
      isHost,
      isMuted,
      isCameraOff,
      isHandRaised: false,
      isSpeaking: false,
      connectionQuality: 'excellent' as const,
    };
    setParticipants([initialLocalP]);
    const socket = getSocket();
    let isCancelled = false;

    // Setup local media stream first so tracks are ready when WebRTC peer offers are initiated
    webrtcManager
      .initLocalStream(!isMuted, !isCameraOff)
      .then((stream) => {
        if (isCancelled) return;
        setLocalStream(stream);
        console.log(`[CLIENT] Joining meeting ${id} as ${effectiveName} with tracks ready`);
        socket.emit('meeting:join', {
          meetingId: id,
          userId: effectiveUserId,
          name: effectiveName,
          avatar: effectiveAvatar,
          initialAudioMuted: isMuted,
          initialVideoOff: isCameraOff,
        });
      })
      .catch((err) => {
        console.warn('Could not init media stream before join, joining room:', err);
        if (isCancelled) return;
        socket.emit('meeting:join', {
          meetingId: id,
          userId: effectiveUserId,
          name: effectiveName,
          avatar: effectiveAvatar,
          initialAudioMuted: isMuted,
          initialVideoOff: isCameraOff,
        });
      });

    webrtcManager.onLocalStreamUpdated = (stream) => {
      setLocalStream(stream);
    };

    webrtcManager.onSpeakingChange = (isSpeaking) => {
      updateParticipant(localParticipantIdRef.current, { isSpeaking });
    };

    // 1. Join Acknowledgement
    socket.on('meeting:join:ack', (data: { meetingId: string; participant: any; roomState: any }) => {
      console.log('[CLIENT] meeting:join:ack received:', data);
      setIsWaiting(false);
      setRoomStatus('connected');
      if (data.participant?.role === 'host') {
        setActiveMeeting({
          ...activeMeeting,
          id: data.meetingId,
          title: activeMeeting?.title || 'CALLIVO Meeting',
          isHost: true,
        });
      }
    });

    // 2. Authoritative Meeting State containing ALL participants
    socket.on('meeting:state', (data: { meetingId: string; participants: any[] }) => {
      console.log('[CLIENT] meeting:state received:', data.participants?.length, 'participants');
      setIsWaiting(false);
      setRoomStatus('connected');

      const mapped = (data.participants || []).map((p: any) => {
        const isSelf = p.socketId === socket.id || p.isSelf;
        if (isSelf) {
          localParticipantIdRef.current = p.socketId;
        }
        return {
          id: p.socketId,
          socketId: p.socketId,
          userId: p.userId,
          name: isSelf ? `${p.name} (You)` : p.name,
          avatar: p.avatar || '',
          isLocal: isSelf,
          isHost: p.role === 'host',
          isCoHost: p.role === 'co-host',
          role: p.role,
          isMuted: p.isAudioMuted ?? false,
          isCameraOff: p.isVideoOff ?? false,
          isHandRaised: p.isHandRaised ?? false,
          isSpeaking: false,
          connectionQuality: (p.connectionQuality || 'excellent') as any,
        };
      });

      setParticipants(mapped);
    });

    // 3. Room joined callback (backward compatibility)
    socket.on('room:joined', (data: {
      meetingId: string;
      self: any;
      existingParticipants: any[];
      isHost: boolean;
    }) => {
      console.log('[CLIENT] room:joined received:', data);
      setIsWaiting(false);
      setRoomStatus('connected');
      localParticipantIdRef.current = data.self.socketId;

      const selfParticipant = {
        id: data.self.socketId,
        socketId: data.self.socketId,
        userId: data.self.userId,
        name: `${data.self.name} (You)`,
        avatar: data.self.avatar || '',
        isLocal: true,
        isHost: data.isHost,
        isMuted: data.self.isAudioMuted ?? isMuted,
        isCameraOff: data.self.isVideoOff ?? isCameraOff,
        isHandRaised: false,
        isSpeaking: false,
        connectionQuality: 'excellent' as const,
      };

      const remotePeers = (data.existingParticipants || []).map((p) => ({
        id: p.socketId,
        socketId: p.socketId,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar || '',
        isLocal: false,
        isHost: p.role === 'host',
        isCoHost: p.role === 'co-host',
        role: p.role,
        isMuted: p.isAudioMuted ?? false,
        isCameraOff: p.isVideoOff ?? false,
        isHandRaised: p.isHandRaised ?? false,
        isSpeaking: false,
        connectionQuality: (p.networkQuality || p.connectionQuality || 'excellent') as any,
      }));

      setParticipants([selfParticipant, ...remotePeers]);
    });

    // 4. When a new peer joins the room
    socket.on('participant:joined', (p: any) => {
      console.log('[CLIENT] participant:joined:', p);
      if (p.socketId === socket.id) return; // ignore self
      success('Participant Joined', `${p.name} has joined the room.`);
      const newPeer = {
        id: p.socketId,
        socketId: p.socketId,
        userId: p.userId,
        name: p.name,
        avatar: p.avatar || '',
        isLocal: false,
        isHost: p.role === 'host',
        isCoHost: p.role === 'co-host',
        role: p.role,
        isMuted: p.isAudioMuted ?? false,
        isCameraOff: p.isVideoOff ?? false,
        isHandRaised: p.isHandRaised ?? false,
        isSpeaking: false,
        connectionQuality: (p.networkQuality || p.connectionQuality || 'excellent') as any,
      };

      addParticipant(newPeer);
    });

    // 5. When a participant leaves
    socket.on('participant:left', (p: { socketId: string; name?: string }) => {
      console.log('[CLIENT] participant:left:', p);
      warning('Participant Left', `${p.name || 'A participant'} left the meeting.`);
      removeParticipant(p.socketId);
    });

    // 6. Waiting Room Handlers
    socket.on('meeting:waiting', (data: { message: string; hostName?: string }) => {
      console.log('[CLIENT] In waiting room:', data);
      setIsWaiting(true);
      if (data.hostName) setWaitingHostName(data.hostName);
    });

    socket.on('lobby:participant-waiting', (data: { socketId: string; name: string; avatar?: string; joinedAt: string }) => {
      console.log('[HOST] Participant waiting in lobby:', data);
      setWaitingParticipants((prev) => {
        if (prev.some((wp) => wp.socketId === data.socketId)) return prev;
        return [...prev, data];
      });
      toast(`${data.name} is in the waiting room`, 'Click Admit to let them join.', 'info');
    });

    socket.on('lobby:waiting-list', (list: any[]) => {
      setWaitingParticipants(list || []);
    });

    socket.on('lobby:participant-cancelled', (data: { socketId: string }) => {
      setWaitingParticipants((prev) => prev.filter((wp) => wp.socketId !== data.socketId));
    });

    // 7. Host Transfer
    socket.on('host:transferred', (data: { newHostSocketId: string; newHostName: string }) => {
      toast('Host Transferred', `${data.newHostName} is now the host.`, 'info');
      updateParticipant(data.newHostSocketId, { isHost: true });
      if (data.newHostSocketId === socket.id) {
        setActiveMeeting({
          ...activeMeeting,
          id: id!,
          title: activeMeeting?.title || 'CALLIVO Meeting',
          isHost: true,
        });
      }
    });

    // Media toggle events
    socket.on('participant:audio-toggled', (payload: { socketId: string; isAudioMuted: boolean }) => {
      updateParticipant(payload.socketId, { isMuted: payload.isAudioMuted });
      if (!payload.isAudioMuted) {
        webrtcManager.ensurePeerAudioPlaying(payload.socketId);
      }
    });

    socket.on('participant:video-toggled', (payload: { socketId: string; isVideoOff: boolean }) => {
      updateParticipant(payload.socketId, { isCameraOff: payload.isVideoOff });
    });

    socket.on('participant:active-speaker', (payload: { socketId: string; isSpeaking: boolean }) => {
      updateParticipant(payload.socketId, { isSpeaking: payload.isSpeaking });
    });

    socket.on('participant:hand-toggled', (payload: { socketId: string; isHandRaised: boolean; name: string }) => {
      updateParticipant(payload.socketId, { isHandRaised: payload.isHandRaised });
      if (payload.isHandRaised) {
        toast(`${payload.name} raised hand ✋`, '', 'warning');
      }
    });

    socket.on('reaction:received', (payload: { senderSocketId: string; emoji: string }) => {
      addReaction(payload.senderSocketId, payload.emoji);
    });

    socket.on('chat:message', (msg: any) => {
      addMeetingMessage({
        id: msg.id,
        senderId: msg.senderSocketId,
        senderName: msg.senderName,
        senderAvatar: '',
        message: msg.message,
        isPrivate: msg.isPrivate,
        timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    });

    // Host control triggers
    socket.on('host:force-mute', () => {
      warning('Muted by Host', 'The meeting host has muted your microphone.');
      webrtcManager.setAudioEnabled(false);
      useMeetingStore.setState({ isMuted: true });
      updateParticipant(localParticipantIdRef.current, { isMuted: true });
    });

    socket.on('host:prompt-unmute', (payload: { hostName: string }) => {
      toast(`${payload.hostName} requested you to unmute`, 'You can turn on your microphone if you wish.', 'info');
    });

    socket.on('host:force-video-off', () => {
      warning('Camera Stopped', 'The meeting host turned off your camera.');
      webrtcManager.setVideoEnabled(false);
      useMeetingStore.setState({ isCameraOff: true });
      updateParticipant(localParticipantIdRef.current, { isCameraOff: true });
    });

    socket.on('host:prompt-video', (payload: { hostName: string }) => {
      toast(`${payload.hostName} requested you to start video`, 'You can enable your camera.', 'info');
    });

    socket.on('room:spotlight', (payload: { spotlightSocketId: string | null }) => {
      if (payload.spotlightSocketId) {
        useParticipantStore.getState().participants.forEach((p) => {
          updateParticipant(p.id, { isPinned: p.id === payload.spotlightSocketId });
        });
        toast('Spotlight Active', 'A participant has been spotlighted by the host.', 'info');
      }
    });

    socket.on('participant:role-changed', (payload: { socketId: string; role: string; name: string }) => {
      updateParticipant(payload.socketId, { isHost: payload.role === 'host' || payload.role === 'co-host' });
      toast('Role Updated', `${payload.name} is now a ${payload.role}.`, 'info');
    });

    socket.on('recording:status-changed', (payload: { isRecording: boolean; triggeredByName: string }) => {
      useMeetingStore.setState({ isRecording: payload.isRecording });
      if (payload.isRecording) {
        warning('Recording in Progress', `${payload.triggeredByName} started recording the meeting.`);
      } else {
        success('Recording Stopped', 'The meeting recording has concluded.');
      }
    });

    socket.on('meeting:put-in-waiting-room', () => {
      warning('Placed in Waiting Room', 'The host has placed you in the waiting room.');
      setIsWaiting(true);
    });

    socket.on('host:removed', (payload: { message: string }) => {
      toastError('Removed from Meeting', payload.message || 'The host removed you.');
      navigate('/dashboard');
    });

    socket.on('meeting:ended', (payload: { message: string }) => {
      toast('Meeting Ended', payload.message || 'The host has ended the session.', 'info');
      navigate('/dashboard');
    });

    socket.on('meeting:error', (payload: { message: string }) => {
      toastError('Meeting Error', payload.message);
      setRoomStatus('error');
      setErrorMessage(payload.message || 'Failed to join meeting.');
    });

    socket.on('disconnect', (reason) => {
      console.warn('[CLIENT] Socket disconnected:', reason);
    });

    socket.on('connect', () => {
      console.log('[CLIENT] Socket reconnected');
      if (roomStatus === 'error') {
        setRoomStatus('connecting');
      }
    });

    return () => {
      isCancelled = true;
      webrtcManager.leaveRoom();
      socket.emit('meeting:leave', { meetingId: id });
      socket.off('meeting:join:ack');
      socket.off('meeting:state');
      socket.off('room:joined');
      socket.off('participant:joined');
      socket.off('participant:left');
      socket.off('meeting:waiting');
      socket.off('lobby:participant-waiting');
      socket.off('lobby:waiting-list');
      socket.off('lobby:participant-cancelled');
      socket.off('host:transferred');
      socket.off('participant:audio-toggled');
      socket.off('participant:video-toggled');
      socket.off('participant:active-speaker');
      socket.off('participant:hand-toggled');
      socket.off('reaction:received');
      socket.off('chat:message');
      socket.off('host:force-mute');
      socket.off('host:prompt-unmute');
      socket.off('host:force-video-off');
      socket.off('host:prompt-video');
      socket.off('room:spotlight');
      socket.off('participant:role-changed');
      socket.off('recording:status-changed');
      socket.off('meeting:put-in-waiting-room');
      socket.off('host:removed');
      socket.off('meeting:ended');
      socket.off('meeting:error');
      window.removeEventListener('click', unlockOnGesture);
      window.removeEventListener('touchstart', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
  }, [id]);

  const handleAdmitWaiting = (targetSocketId: string) => {
    const socket = getSocket();
    socket.emit('lobby:admit', { meetingId: id, targetSocketId });
    setWaitingParticipants((prev) => prev.filter((wp) => wp.socketId !== targetSocketId));
  };

  const handleAdmitAllWaiting = () => {
    const socket = getSocket();
    socket.emit('lobby:admit-all', { meetingId: id });
    setWaitingParticipants([]);
  };

  // Sync mute with webrtc and local participant
  useEffect(() => {
    webrtcManager.setAudioEnabled(!isMuted);
    updateParticipant(localParticipantIdRef.current, { isMuted });
  }, [isMuted, updateParticipant]);

  // Sync camera with webrtc and local participant
  useEffect(() => {
    webrtcManager.setVideoEnabled(!isCameraOff);
    updateParticipant(localParticipantIdRef.current, { isCameraOff });
  }, [isCameraOff, updateParticipant]);

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Recording timer
  useEffect(() => {
    let recTimer: NodeJS.Timeout;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecSeconds(0);
    }
    return () => clearInterval(recTimer);
  }, [isRecording]);

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      webrtcManager.stopScreenShare();
      setScreenStream(null);
      setScreenSharing(false);
    } else {
      const stream = await webrtcManager.startScreenShare();
      if (stream) {
        setScreenStream(stream);
        setScreenSharing(true);
      }
    }
  };

  const handleToggleRecording = () => {
    if (inMeetingRecorder.isRecording) {
      inMeetingRecorder.stop();
      useMeetingStore.setState({ isRecording: false });
      success('Recording Saved', 'Session recording has been uploaded and saved.');
    } else {
      // Record screen stream if sharing, else local stream
      const streamToRecord = screenStream || localStream;
      if (!streamToRecord) {
        toastError('Cannot Record', 'No active audio or video stream available to record.');
        return;
      }

      inMeetingRecorder.start({
        meetingId: id || 'clv-meeting',
        meetingTitle: activeMeeting?.title || 'CALLIVO Session',
        stream: streamToRecord,
        onRecordingStart: () => {
          useMeetingStore.setState({ isRecording: true });
          warning('Recording Started', 'All participants are notified that this session is being recorded.');
        },
        onRecordingStop: (blob) => {
          inMeetingRecorder.downloadLocally(blob);
          success('Recording Downloaded', 'A backup copy of your recording was saved to downloads.');
        },
        onError: (err) => {
          toastError('Recording Error', err.message || 'Failed to initialize recording.');
        },
      });
    }
  };

  const handleCopyMeetingLink = async () => {
    const meetingUrl = `${window.location.origin}/meetings/${id}/lobby`;
    await copyToClipboard(meetingUrl);
    setCopiedLink(true);
    success('Meeting Link Copied', 'Share this link with anyone to join the call.');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyMeetingId = async () => {
    await copyToClipboard(id || '');
    success('Meeting ID Copied', id || '');
  };

  const remoteParticipantsCount = participants.filter((p) => !p.isLocal).length;

  if (roomStatus === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#0B0D10] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans z-50">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-[#101318] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Joining meeting...</h2>
            <p className="text-sm text-slate-400">Verifying credentials and preparing media session...</p>
          </div>
          <div className="p-3 bg-[#15191F] border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted Room: {id}</span>
          </div>
        </div>
      </div>
    );
  }

  if (roomStatus === 'connecting') {
    return (
      <div className="fixed inset-0 bg-[#0B0D10] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans z-50">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-[#101318] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto animate-pulse">
            <Wifi className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Connecting to Callivo...</h2>
            <p className="text-sm text-slate-400">Establishing real-time WebRTC audio & video pipeline...</p>
          </div>
          <div className="p-3 bg-[#15191F] border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Room ID: {id}</span>
          </div>
        </div>
      </div>
    );
  }

  if (roomStatus === 'error') {
    return (
      <div className="fixed inset-0 bg-[#0B0D10] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans z-50">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-[#101318] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Unable to Open Meeting</h2>
            <p className="text-sm text-slate-400">{errorMessage || 'Meeting room could not be loaded.'}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-700 hover:bg-slate-800 text-white"
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-brand-600 hover:bg-brand-500 text-white"
              onClick={() => window.location.reload()}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isWaiting) {
    return (
      <div className="fixed inset-0 bg-[#0B0D10] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none font-sans z-50">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-md w-full bg-[#101318] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Please wait for the host</h2>
            <p className="text-sm text-slate-400">
              The meeting host ({waitingHostName}) will admit you into the room shortly.
            </p>
          </div>
          <div className="p-3 bg-[#15191F] border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted Room: {id}</span>
          </div>
          <Button
            variant="outline"
            className="w-full border-slate-700 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30"
            onClick={() => navigate('/dashboard')}
          >
            Leave Waiting Room
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#0B0D10] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* TOP NAVIGATION BAR */}
      <header className="h-14 px-4 sm:px-6 bg-[#101318]/95 backdrop-blur-md border-b border-[#242A33] flex items-center justify-between z-30 shrink-0">
        {/* Left: Brand & Meeting Info */}
        <div className="flex items-center gap-3">
          <Logo size="sm" clickable={false} />
          <div className="h-4 w-[1px] bg-[#242A33] hidden sm:block" />

          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-semibold text-white max-w-[140px] sm:max-w-xs truncate">
              {activeMeeting?.title || 'CALLIVO Video Session'}
            </h2>

            <button
              onClick={handleCopyMeetingId}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#15191F] hover:bg-[#242A33] text-[11px] font-mono text-emerald-400 transition-colors border border-[#242A33]"
              title="Click to copy Meeting ID"
            >
              <span>{id}</span>
              <Copy className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Center: Meeting Duration & Recording Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>REC</span>
              <span className="font-mono">{formatTime(recSeconds)}</span>
            </div>
          )}

          <span className="text-xs font-mono text-slate-300 bg-[#15191F] px-2.5 py-0.5 rounded-md border border-[#242A33]">
            {formatTime(meetingSeconds)}
          </span>
        </div>

        {/* Right: Security, Copy Link & View Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMeetingLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#15191F] hover:bg-[#242A33] border border-[#242A33] text-xs font-medium text-slate-200 transition-colors"
            title="Copy invitation link"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Copy Link'}</span>
          </button>

          {viewMode !== 'spatial' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('spatial')}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
              className="hidden sm:inline-flex text-xs h-8 border-purple-500/40 hover:bg-purple-950/30 text-purple-200"
            >
              Enter Spatial 3D
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setViewMode('grid')}
              leftIcon={<LayoutGrid className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex text-xs h-8"
            >
              Grid View
            </Button>
          )}

          <button
            onClick={() => setIsMeetingInfoOpen(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#15191F] transition-colors"
            title="Meeting Security & Encryption Info"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={() => setIsDiagnosticsOpen(true)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#15191F] hover:bg-[#242A33] border border-[#242A33] text-emerald-400 text-[11px] transition-colors"
            title="Open WebRTC Diagnostics"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[10px] text-slate-300">Live</span>
          </button>
        </div>
      </header>

      {/* HOST ADMIT BANNER */}
      {waitingParticipants.length > 0 && isHost && (
        <div className="bg-brand-950/90 border-b border-brand-700/50 px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-brand-200 z-30 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="truncate">
              <strong>{waitingParticipants.length}</strong> {waitingParticipants.length === 1 ? 'person is' : 'people are'} in the waiting room:
              {' '}<span className="text-white font-medium">{waitingParticipants.map((w) => w.name).join(', ')}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              onClick={handleAdmitAllWaiting}
            >
              Admit All
            </Button>
            {waitingParticipants.map((wp) => (
              <Button
                key={wp.socketId}
                size="sm"
                variant="outline"
                className="h-7 text-xs border-brand-700 hover:bg-brand-800 text-white"
                onClick={() => handleAdmitWaiting(wp.socketId)}
              >
                Admit {wp.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* MAIN STAGE AREA */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-[#0B0D10]">
        {/* Alone banner */}
        {remoteParticipantsCount === 0 && viewMode !== 'spatial' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#15191F]/90 border border-[#242A33] backdrop-blur-md shadow-xl text-xs text-slate-300">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>You are the only participant in this meeting.</span>
            <button
              onClick={handleCopyMeetingLink}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-colors"
            >
              Invite Others
            </button>
          </div>
        )}

        {/* Live Subtitles Overlay */}
        <CaptionsOverlay isEnabled={isCaptionsOn} meetingId={id || ''} />

        {viewMode === 'spatial' ? (
          <SpatialMeetingRoom />
        ) : isScreenSharing && screenStream ? (
          <div className="relative w-full h-full p-3 flex items-center justify-center">
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && screenStream) el.srcObject = screenStream;
              }}
              className="w-full h-full object-contain rounded-2xl bg-black border border-[#242A33] shadow-2xl"
            />

            <div className="absolute top-6 right-6 w-48 sm:w-60 aspect-video rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl z-20">
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el && localStream) el.srcObject = localStream;
                }}
                className="w-full h-full object-cover transform -scale-x-100"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-semibold text-white">
                {user?.name || sessionStorage.getItem('callivo_guest_name') || 'You'} (You)
              </div>
            </div>

            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#15191F]/95 border border-[#242A33] shadow-xl backdrop-blur-md z-20">
              <span className="text-xs text-white">You are sharing your screen</span>
              <button
                onClick={handleToggleScreenShare}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm"
              >
                <StopCircle className="w-3.5 h-3.5" /> Stop Sharing
              </button>
            </div>
          </div>
        ) : (
          <ParticipantGrid
            participants={participants}
            localStream={localStream}
            virtualBackground={virtualBackground}
            viewMode={viewMode}
          />
        )}
      </main>

      {/* BOTTOM MEETING CONTROLS BAR */}
      <footer className="shrink-0 p-3 sm:p-4 flex items-center justify-center pointer-events-auto z-30">
        <MeetingControls
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
          isParticipantsOpen={isParticipantsOpen}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleScreenShare={handleToggleScreenShare}
          onToggleQnA={() => setIsQnAOpen(!isQnAOpen)}
          isQnAOpen={isQnAOpen}
          onToggleComments={() => setIsCommentsOpen(!isCommentsOpen)}
          isCommentsOpen={isCommentsOpen}
          isCaptionsOn={isCaptionsOn}
          onToggleCaptions={() => {
            setIsCaptionsOn(!isCaptionsOn);
            toast(isCaptionsOn ? 'Captions disabled' : 'Live captions enabled (CC)', '', 'info');
          }}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenMeetingSettings={() => setIsMeetingSettingsOpen(true)}
          isHost={isHost}
        />
      </footer>

      {/* DRAWERS & MODALS */}
      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      <ParticipantsDrawer
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        meetingId={id || ''}
        isHostOrCoHost={isHost}
      />

      <QnADrawer
        isOpen={isQnAOpen}
        onClose={() => setIsQnAOpen(false)}
        meetingId={id || ''}
        isHostOrCoHost={isHost}
      />

      <CommentsDrawer
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        meetingId={id || ''}
        isHostOrCoHost={isHost}
      />

      <MeetingSettingsModal
        isOpen={isMeetingSettingsOpen}
        onClose={() => setIsMeetingSettingsOpen(false)}
        meetingId={id || ''}
        initialSettings={meetingConfig}
      />

      <ConnectionDiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      <MeetingInfoDrawer
        isOpen={isMeetingInfoOpen}
        onClose={() => setIsMeetingInfoOpen(false)}
        meeting={{
          id: id || '',
          title: activeMeeting?.title || 'CALLIVO Video Session',
          passcode: activeMeeting?.passcode || '',
          hostName: user?.name || 'Host',
        }}
      />

      <DeviceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
