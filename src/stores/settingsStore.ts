import { create } from 'zustand';
import { AppTheme } from '../types';

interface SettingsState {
  // Theme
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;

  // Audio settings
  selectedMic: string;
  selectedSpeaker: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  spatialAudio: boolean;
  setSelectedMic: (id: string) => void;
  setSelectedSpeaker: (id: string) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setSpatialAudio: (enabled: boolean) => void;

  // Video settings
  selectedCamera: string;
  mirrorVideo: boolean;
  hdVideo: boolean;
  setSelectedCamera: (id: string) => void;
  setMirrorVideo: (mirror: boolean) => void;
  setHdVideo: (hd: boolean) => void;

  // Meeting behaviors
  muteOnJoin: boolean;
  cameraOffOnJoin: boolean;
  playEntrySound: boolean;
  showMeetingTimer: boolean;
  setMuteOnJoin: (enabled: boolean) => void;
  setCameraOffOnJoin: (enabled: boolean) => void;
  setPlayEntrySound: (enabled: boolean) => void;
  setShowMeetingTimer: (enabled: boolean) => void;

  // Accessibility
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

export const applyThemeToDocument = (theme: AppTheme) => {
  if (typeof document === 'undefined') return;
  try {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    }
  } catch (e) {
    console.error('Failed to apply theme:', e);
  }
};

const getInitialTheme = (): AppTheme => {
  try {
    const saved = localStorage.getItem('callivo_theme') as AppTheme;
    if (saved && ['dark', 'light', 'system'].includes(saved)) {
      return saved;
    }
  } catch (e) {
    console.error(e);
  }
  return 'dark';
};

const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

// Listen to OS color scheme changes if system theme is selected
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    try {
      const current = localStorage.getItem('callivo_theme');
      if (current === 'system') {
        applyThemeToDocument('system');
      }
    } catch {}
  });
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    try {
      localStorage.setItem('callivo_theme', theme);
      applyThemeToDocument(theme);
    } catch (e) {
      console.error(e);
    }
    set({ theme });
  },

  selectedMic: 'default',
  selectedSpeaker: 'default',
  noiseSuppression: true,
  echoCancellation: true,
  spatialAudio: true,
  setSelectedMic: (selectedMic) => set({ selectedMic }),
  setSelectedSpeaker: (selectedSpeaker) => set({ selectedSpeaker }),
  setNoiseSuppression: (noiseSuppression) => set({ noiseSuppression }),
  setSpatialAudio: (spatialAudio) => set({ spatialAudio }),

  selectedCamera: 'default',
  mirrorVideo: true,
  hdVideo: true,
  setSelectedCamera: (selectedCamera) => set({ selectedCamera }),
  setMirrorVideo: (mirrorVideo) => set({ mirrorVideo }),
  setHdVideo: (hdVideo) => set({ hdVideo }),

  muteOnJoin: false,
  cameraOffOnJoin: false,
  playEntrySound: true,
  showMeetingTimer: true,
  setMuteOnJoin: (muteOnJoin) => set({ muteOnJoin }),
  setCameraOffOnJoin: (cameraOffOnJoin) => set({ cameraOffOnJoin }),
  setPlayEntrySound: (playEntrySound) => set({ playEntrySound }),
  setShowMeetingTimer: (showMeetingTimer) => set({ showMeetingTimer }),

  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
