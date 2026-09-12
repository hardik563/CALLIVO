import React, { useEffect, useRef, useState } from 'react';
import { Participant } from '../../types';
import { Mic, MicOff, VideoOff, Pin, Crown, Wifi } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { ReactionAnimation } from './ReactionAnimation';
import { cn } from '../../lib/utils';
import { useParticipantStore } from '../../stores/participantStore';
import { webrtcManager } from '../../lib/webrtc';

interface ParticipantTileProps {
  participant: Participant;
  localStream?: MediaStream | null;
  virtualBackground?: string;
  isLarge?: boolean;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  localStream,
  virtualBackground = 'none',
  isLarge = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { togglePinParticipant, toggleMuteParticipant } = useParticipantStore();
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Autoplay recovery for browser policies
  const ensureMediaPlay = (el: HTMLMediaElement | null) => {
    if (!el) return;
    el.play().catch((err) => {
      console.debug('[ParticipantTile] Autoplay pending interaction:', err);
      const unlock = () => {
        el.play().catch(() => {});
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('click', unlock, { once: true });
      window.addEventListener('touchstart', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    });
  };

  // Attach local or remote media stream to video and audio elements
  useEffect(() => {
    const targetSocketId = participant.socketId || participant.id;
    if (participant.isLocal) {
      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
        ensureMediaPlay(videoRef.current);
      }
    } else {
      const stream = webrtcManager.getRemoteStream(targetSocketId) || webrtcManager.getRemoteStream(participant.id);
      if (stream) {
        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          ensureMediaPlay(videoRef.current);
        }
        if (audioRef.current) {
          if (audioRef.current.srcObject !== stream) {
            audioRef.current.srcObject = stream;
          }
          ensureMediaPlay(audioRef.current);
        }
        const vTracks = stream.getVideoTracks();
        setHasRemoteVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled));
      }
    }
  }, [participant.isLocal, participant.id, participant.socketId, localStream]);

  // Listen for newly arriving remote tracks
  useEffect(() => {
    if (participant.isLocal) return;
    const targetSocketId = participant.socketId || participant.id;

    const checkStream = () => {
      const stream = webrtcManager.getRemoteStream(targetSocketId) || webrtcManager.getRemoteStream(participant.id);
      if (stream) {
        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          ensureMediaPlay(videoRef.current);
        }
        if (audioRef.current) {
          if (audioRef.current.srcObject !== stream) {
            audioRef.current.srcObject = stream;
          }
          ensureMediaPlay(audioRef.current);
        }
        const vTracks = stream.getVideoTracks();
        setHasRemoteVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled));
      }
    };

    checkStream();
    const removeListener = webrtcManager.addStreamListener((socketId, stream) => {
      if (socketId === targetSocketId || socketId === participant.id) {
        if (videoRef.current) {
          if (videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
          }
          ensureMediaPlay(videoRef.current);
        }
        if (audioRef.current) {
          if (audioRef.current.srcObject !== stream) {
            audioRef.current.srcObject = stream;
          }
          ensureMediaPlay(audioRef.current);
        }
        const vTracks = stream.getVideoTracks();
        setHasRemoteVideo(vTracks.length > 0 && vTracks.some((t) => t.enabled));
      }
    });

    const interval = setInterval(checkStream, 1000);
    return () => {
      removeListener();
      clearInterval(interval);
    };
  }, [participant.id, participant.socketId, participant.isLocal]);

  const connectionColors = {
    excellent: 'text-emerald-400',
    good: 'text-amber-400',
    poor: 'text-rose-400',
  };

  // Virtual background CSS styling for local preview
  const getBgStyle = () => {
    if (!participant.isLocal) return '';
    if (virtualBackground === 'blur') return 'backdrop-blur-md';
    if (virtualBackground === 'office')
      return 'bg-[url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    if (virtualBackground === 'studio')
      return 'bg-[url("https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    if (virtualBackground === 'room')
      return 'bg-[url("https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    return '';
  };

  return (
    <div
      className={cn(
        'group relative w-full h-full rounded-2xl overflow-hidden bg-surface/90 border transition-all duration-300 flex items-center justify-center select-none shadow-elevated',
        participant.isSpeaking
          ? 'border-brand-500 shadow-glow-sm'
          : 'border-slate-800/80 hover:border-slate-700/80',
        participant.isPinned && 'ring-2 ring-indigo-500',
        getBgStyle()
      )}
    >
      {/* Remote Audio Track Playback Element (active in DOM without display:none to prevent engine throttling) */}
      {!participant.isLocal && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
          muted={false}
          onLoadedMetadata={() => ensureMediaPlay(audioRef.current)}
          onCanPlay={() => ensureMediaPlay(audioRef.current)}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
        />
      )}

      {/* Video Content & Camera Fallback */}
      {participant.isLocal ? (
        !participant.isCameraOff ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              'w-full h-full object-cover transform -scale-x-100',
              virtualBackground === 'blur' && 'filter blur-[1.5px]'
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 space-y-3">
            <Avatar
              name={participant.name}
              src={participant.avatar}
              size={isLarge ? '2xl' : 'xl'}
              isSpeaking={participant.isSpeaking}
            />
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated/80 border border-slate-700/60 text-xs text-slate-400">
              <VideoOff className="w-3.5 h-3.5" />
              <span>Camera is off</span>
            </div>
          </div>
        )
      ) : (
        // Remote Participant: Video element stays mounted at all times to decode frames continuously
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={true}
            onLoadedMetadata={() => {
              setHasRemoteVideo(true);
              ensureMediaPlay(videoRef.current);
            }}
            onPlaying={() => setHasRemoteVideo(true)}
            onCanPlay={() => ensureMediaPlay(videoRef.current)}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-300',
              !hasRemoteVideo || participant.isCameraOff
                ? 'opacity-0 pointer-events-none absolute inset-0'
                : 'opacity-100'
            )}
          />
          {(!hasRemoteVideo || participant.isCameraOff) && (
            <div className="flex flex-col items-center justify-center p-6 space-y-3 z-10">
              <Avatar
                name={participant.name}
                src={participant.avatar}
                size={isLarge ? '2xl' : 'xl'}
                isSpeaking={participant.isSpeaking}
              />
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-elevated/80 border border-slate-700/60 text-xs text-slate-400">
                <VideoOff className="w-3.5 h-3.5" />
                <span>{participant.isCameraOff ? 'Camera is off' : 'Awaiting video feed...'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speaking Glow Animation */}
      {participant.isSpeaking && (
        <div className="absolute inset-0 border-2 border-brand-400/80 rounded-2xl pointer-events-none animate-pulse-subtle" />
      )}

      {/* Floating Reaction */}
      <ReactionAnimation reaction={participant.reaction} />

      {/* Top Left Indicators: Host / Pinned */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
        {participant.isHost && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/85 backdrop-blur-md text-[10px] font-bold text-white shadow-sm">
            <Crown className="w-3 h-3" /> Host
          </span>
        )}
        {participant.isPinned && (
          <span className="p-1 rounded-md bg-slate-800/80 backdrop-blur-md text-brand-300">
            <Pin className="w-3 h-3" />
          </span>
        )}
      </div>

      {/* Top Right Actions & Connection Indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-md text-[10px] font-medium',
            connectionColors[participant.connectionQuality]
          )}
          title={`Network Quality: ${participant.connectionQuality}`}
        >
          <Wifi className="w-3 h-3" />
          <span className="capitalize">{participant.connectionQuality}</span>
        </div>

        {/* Quick Hover Controls */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => togglePinParticipant(participant.id)}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-200 backdrop-blur-md transition-colors"
            title={participant.isPinned ? 'Unpin' : 'Pin for everyone'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          {!participant.isLocal && (
            <button
              onClick={() => toggleMuteParticipant(participant.id)}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-slate-800 text-slate-200 backdrop-blur-md transition-colors"
              title="Mute participant"
            >
              <MicOff className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Info Bar: Name, Mic Status, Raised Hand */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 max-w-[85%]">
          {/* Mic Status */}
          <div
            className={cn(
              'p-1 rounded-md',
              participant.isMuted ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
            )}
          >
            {participant.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
          </div>

          {/* Name */}
          <span className="text-xs font-semibold text-white truncate">
            {participant.name}
          </span>
        </div>

        {/* Raised Hand Badge */}
        {participant.isHandRaised && (
          <div className="px-2.5 py-1 rounded-xl bg-amber-500/90 text-white font-bold text-xs flex items-center gap-1 shadow-lg animate-bounce">
            <span>✋</span>
            <span>Raised</span>
          </div>
        )}
      </div>
    </div>
  );
};
