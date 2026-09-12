import { create } from 'zustand';
import { Participant } from '../types';

interface ParticipantState {
  participants: Participant[];
  pinnedParticipantId: string | null;
  spotlightParticipantId: string | null;

  setParticipants: (participants: Participant[]) => void;
  addParticipant: (participant: Participant) => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  toggleMuteParticipant: (id: string) => void;
  togglePinParticipant: (id: string) => void;
  toggleSpotlightParticipant: (id: string) => void;
  removeParticipant: (id: string) => void;
  addReaction: (participantId: string, emoji: string) => void;
  muteAll: () => void;
}

export const useParticipantStore = create<ParticipantState>((set) => ({
  participants: [],
  pinnedParticipantId: null,
  spotlightParticipantId: null,

  setParticipants: (participants) => set({ participants }),

  addParticipant: (participant) =>
    set((state) => {
      const existsIndex = state.participants.findIndex(
        (p) =>
          p.id === participant.id ||
          (Boolean(participant.socketId) && p.socketId === participant.socketId) ||
          (Boolean(participant.userId) && p.userId === participant.userId)
      );
      if (existsIndex >= 0) {
        const updated = [...state.participants];
        updated[existsIndex] = { ...updated[existsIndex], ...participant };
        return { participants: updated };
      }
      return { participants: [...state.participants, participant] };
    }),

  updateParticipant: (id, updates) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  toggleMuteParticipant: (id) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, isMuted: !p.isMuted } : p
      ),
    })),

  togglePinParticipant: (id) =>
    set((state) => ({
      pinnedParticipantId: state.pinnedParticipantId === id ? null : id,
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, isPinned: !p.isPinned } : { ...p, isPinned: false }
      ),
    })),

  toggleSpotlightParticipant: (id) =>
    set((state) => ({
      spotlightParticipantId: state.spotlightParticipantId === id ? null : id,
      participants: state.participants.map((p) =>
        p.id === id ? { ...p, isSpotlighted: !p.isSpotlighted } : { ...p, isSpotlighted: false }
      ),
    })),

  removeParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== id),
    })),

  addReaction: (participantId, emoji) =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.id === participantId
          ? {
              ...p,
              reaction: {
                emoji,
                timestamp: Date.now(),
              },
            }
          : p
      ),
    })),

  muteAll: () =>
    set((state) => ({
      participants: state.participants.map((p) =>
        p.isLocal ? p : { ...p, isMuted: true }
      ),
    })),
}));
