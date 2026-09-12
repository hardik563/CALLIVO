import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMeetingStore } from '../stores/meetingStore';
import { useMediaStream } from '../hooks/useMediaStream';
import { useAudioMeter } from '../hooks/useAudioMeter';
import { VirtualBackgroundPicker } from '../components/meeting/VirtualBackgroundPicker';
import { DeviceSettingsModal } from '../components/meeting/DeviceSettingsModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ErrorState } from '../components/ui/ErrorState';
import { Logo } from '../components/ui/Logo';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { VirtualBackground } from '../types';
import { meetingsApi } from '../lib/api';
import { webrtcManager } from '../lib/webrtc';

export const MeetingLobbyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, updateProfile } = useAuthStore();
  const {
    activeMeeting,
    setActiveMeeting,
    isMuted,
    setMuted,
    isCameraOff,
    setCameraOff,
    virtualBackground,
    setVirtualBackground,
  } = useMeetingStore();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [meetingDetails, setMeetingDetails] = useState<any>(null);
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);
  const [meetingNotFound, setMeetingNotFound] = useState(false);
  const [meetingFetchError, setMeetingFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name && !displayName) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    if (!id) {
      setMeetingNotFound(true);
      return;
    }
    meetingsApi.getById(id).then((res) => {
      if (res.success && res.meeting) {
        setMeetingDetails(res.meeting);
        setActiveMeeting({
          id: res.meeting.id,
          title: res.meeting.title,
          passcode: res.meeting.passcode,
          isHost: Boolean(user?.id && res.meeting.hostId === user.id),
        });
      } else {
        setMeetingNotFound(true);
        setMeetingFetchError('Meeting not found or invalid link.');
      }
    }).catch((err) => {
      console.warn('Lobby meeting fetch notice:', err.message);
      setMeetingNotFound(true);
      setMeetingFetchError(err.message || 'Meeting not found or invalid link.');
    });
  }, [id, user?.id, setActiveMeeting]);

  // Real Camera & Mic Stream
  const {
    stream,
    error,
    errorMessage,
    isLoading,
    isUsingFallback,
    restartStream,
  } = useMediaStream({
    videoEnabled: !isCameraOff,
    audioEnabled: !isMuted,
  });

  // Real Audio Level Analyser
  const { volume, frequencies, isSpeaking } = useAudioMeter(stream, isMuted);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleJoinNow = () => {
    // Proactively unlock browser audio engine on direct user click gesture
    webrtcManager.unlockAudio();

    const finalName = displayName.trim() || user?.name || 'Guest Participant';
    sessionStorage.setItem('callivo_guest_name', finalName);

    if (user && displayName.trim() && displayName !== user.name) {
      updateProfile({ name: displayName.trim() });
    }

    navigate(`/room/${id}`);
  };

  // Virtual background CSS styling for preview
  const getBgClass = () => {
    if (virtualBackground === 'blur') return 'filter blur-[2px]';
    if (virtualBackground === 'office')
      return 'bg-[url("https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    if (virtualBackground === 'studio')
      return 'bg-[url("https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    if (virtualBackground === 'room')
      return 'bg-[url("https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80")] bg-cover bg-center';
    return '';
  };

  if (meetingNotFound) {
    return (
      <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#101318] border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Meeting Not Found</h2>
            <p className="text-sm text-slate-400">
              {meetingFetchError || 'The meeting code does not exist or has already concluded.'}
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full bg-brand-600 hover:bg-brand-500 text-white"
            onClick={() => navigate('/dashboard')}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-800 z-10">
        <Logo size="md" showTagline={true} />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-surface-elevated/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Room: {id}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Left (Camera Preview) & Right (Setup Controls) */}
      <div className="max-w-6xl mx-auto w-full my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* LEFT: Large Camera Preview & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-surface/90 border border-slate-800 shadow-2xl flex items-center justify-center">
            {/* Error UI when hardware permission denied or not found */}
            {error && !isUsingFallback ? (
              <ErrorState
                title="Camera or Microphone Access Blocked"
                message={errorMessage || 'Please check your browser permissions to allow video and audio.'}
                onRetry={restartStream}
                onSettings={() => setIsDeviceSettingsOpen(true)}
              />
            ) : isCameraOff ? (
              <div className="flex flex-col items-center justify-center space-y-3 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center text-slate-400 border border-slate-700">
                  <VideoOff className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-white">Your camera is off</p>
                <p className="text-xs text-slate-400">Others will see your profile avatar.</p>
              </div>
            ) : (
              <div className={`relative w-full h-full ${getBgClass()}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform -scale-x-100 ${
                    virtualBackground === 'blur' ? 'filter blur-[1.5px]' : ''
                  }`}
                />
              </div>
            )}

            {/* Speaking / Audio Ripple Indicator */}
            {isSpeaking && (
              <div className="absolute inset-0 border-2 border-brand-400 rounded-3xl pointer-events-none animate-pulse-subtle" />
            )}

            {/* In-Preview Hardware Badges */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {isUsingFallback ? 'Virtual HD Camera Stream' : 'Live Camera'}
              </span>
            </div>

            {/* Camera / Mic Quick Toggle Bar Inside Preview */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
              <button
                onClick={() => setMuted(!isMuted)}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all duration-200 shadow-lg ${
                  isMuted
                    ? 'bg-rose-600/90 border-rose-500 text-white'
                    : 'bg-black/60 border-white/10 text-white hover:bg-black/80'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setCameraOff(!isCameraOff)}
                className={`p-3 rounded-2xl backdrop-blur-md border transition-all duration-200 shadow-lg ${
                  isCameraOff
                    ? 'bg-rose-600/90 border-rose-500 text-white'
                    : 'bg-black/60 border-white/10 text-white hover:bg-black/80'
                }`}
                title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* REAL MICROPHONE TEST METER */}
          <div className="p-4 rounded-2xl bg-surface border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-brand-400" /> Live Microphone Input Meter
              </span>
              <span className="font-mono text-slate-400">
                {isMuted ? 'MUTED' : isSpeaking ? 'VOICE DETECTED' : 'READY'}
              </span>
            </div>

            {/* Audio frequency bars */}
            <div className="flex items-center gap-1.5 h-6 bg-surface-elevated/60 p-1 rounded-xl border border-slate-800">
              {frequencies.map((f, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm transition-all duration-75 ${
                    isMuted
                      ? 'bg-slate-800 h-1'
                      : f > 60
                      ? 'bg-emerald-400'
                      : f > 30
                      ? 'bg-brand-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ height: isMuted ? '4px' : `${Math.max(15, f)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Meeting Setup (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
              Ready to collaborate?
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {meetingDetails?.title || activeMeeting?.title || 'CALLIVO Conference Room'}
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Meeting ID: {id} • Host: {meetingDetails?.host?.name || (activeMeeting?.isHost ? user?.name : 'Meeting Host')}
            </p>
            {!user && (
              <p className="text-[11px] text-emerald-400/90 pt-0.5">
                Joining as guest. <a href="/login" className="underline hover:text-emerald-300">Sign in</a> to access your enterprise account.
              </p>
            )}
          </div>

          {/* Name Confirmation Input */}
          <div className="space-y-3 bg-surface p-5 rounded-3xl border border-slate-800">
            <Input
              label="Your Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your Name"
              required
            />

            {/* Virtual Background Picker */}
            <VirtualBackgroundPicker
              selected={virtualBackground}
              onChange={(bg) => setVirtualBackground(bg as VirtualBackground)}
            />

            {/* Audio/Video Settings Trigger */}
            <button
              onClick={() => setIsDeviceSettingsOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface-elevated hover:bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Audio & Video Device Preferences</span>
              </div>
              <span className="text-brand-400 text-[11px]">Configure →</span>
            </button>
          </div>

          {/* Join Meeting CTA */}
          <div className="space-y-3">
            <Button
              variant="glow"
              size="lg"
              onClick={handleJoinNow}
              className="w-full shadow-glow py-3.5 text-sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Join Meeting Now
            </Button>

            <p className="text-center text-[11px] text-slate-500">
              By joining, you agree to CALLIVO's audio/video recording policy.
            </p>
          </div>
        </div>
      </div>

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
      />
    </div>
  );
};
