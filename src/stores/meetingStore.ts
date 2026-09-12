import { create } from 'zustand';
import { MeetingViewMode, VirtualBackground, ConnectionQuality } from '../types';

interface ActiveMeeting {
  id: string;
  title: string;
  passcode: string;
  isHost: boolean;
  hostId?: string;
  startTime: number;
}

interface MeetingState {
  activeMeeting: ActiveMeeting | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  isRecording: boolean;
  recordingStartTime: number | null;
  recordingSeconds: number;
  viewMode: MeetingViewMode;
  virtualBackground: VirtualBackground;
  isSpatialAudioEnabled: boolean;
  networkQuality: ConnectionQuality;
  selectedParticipantId: string | null;

  // Actions
  setActiveMeeting: (meeting: Partial<ActiveMeeting>) => void;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  toggleCamera: () => void;
  setCameraOff: (off: boolean) => void;
  toggleScreenShare: () => void;
  setScreenSharing: (sharing: boolean) => void;
  toggleHandRaise: () => void;
  toggleRecording: () => void;
  setViewMode: (mode: MeetingViewMode) => void;
  setVirtualBackground: (bg: VirtualBackground) => void;
  toggleSpatialAudio: () => void;
  setNetworkQuality: (quality: ConnectionQuality) => void;
  setSelectedParticipantId: (id: string | null) => void;
  resetMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  activeMeeting: null,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isHandRaised: false,
  isRecording: false,
  recordingStartTime: null,
  recordingSeconds: 0,
  viewMode: 'grid',
  virtualBackground: 'none',
  isSpatialAudioEnabled: true,
  networkQuality: 'excellent',
  selectedParticipantId: null,

  setActiveMeeting: (meeting) =>
    set((state) => ({
      activeMeeting: {
        id: meeting.id || 'clv-' + Math.floor(100 + Math.random() * 900) + '-' + Math.floor(1000 + Math.random() * 9000),
        title: meeting.title || 'Instant CALLIVO Meeting',
        passcode: meeting.passcode || String(Math.floor(100000 + Math.random() * 900000)),
        isHost: meeting.isHost !== undefined ? meeting.isHost : true,
        startTime: Date.now(),
      },
    })),

  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setMuted: (isMuted) => set({ isMuted }),

  toggleCamera: () => set((state) => ({ isCameraOff: !state.isCameraOff })),
  setCameraOff: (isCameraOff) => set({ isCameraOff }),

  toggleScreenShare: () => set((state) => ({ isScreenSharing: !state.isScreenSharing })),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),

  toggleHandRaise: () => set((state) => ({ isHandRaised: !state.isHandRaised })),

  toggleRecording: () =>
    set((state) => {
      const isStarting = !state.isRecording;
      return {
        isRecording: isStarting,
        recordingStartTime: isStarting ? Date.now() : null,
        recordingSeconds: isStarting ? 0 : state.recordingSeconds,
      };
    }),

  setViewMode: (viewMode) => set({ viewMode }),
  setVirtualBackground: (virtualBackground) => set({ virtualBackground }),
  toggleSpatialAudio: () => set((state) => ({ isSpatialAudioEnabled: !state.isSpatialAudioEnabled })),
  setNetworkQuality: (networkQuality) => set({ networkQuality }),
  setSelectedParticipantId: (selectedParticipantId) => set({ selectedParticipantId }),

  resetMeeting: () =>
    set({
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isHandRaised: false,
      isRecording: false,
      recordingStartTime: null,
      recordingSeconds: 0,
      viewMode: 'grid',
      selectedParticipantId: null,
    }),
}));
