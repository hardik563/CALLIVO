import { create } from 'zustand';
import { ChatMessage } from '../types';

interface ChatState {
  meetingMessages: ChatMessage[];
  unreadMeetingCount: number;
  isTyping: boolean;
  typingUser: string | null;

  addMeetingMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  addMessageReaction: (messageId: string, emoji: string) => void;
  clearUnreadCount: () => void;
  clearMeetingMessages: () => void;
  setTyping: (isTyping: boolean, userName?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  meetingMessages: [],
  unreadMeetingCount: 0,
  isTyping: false,
  typingUser: null,

  addMeetingMessage: (msg) => {
    const newMessage: ChatMessage = {
      ...msg,
      id: msg.id || 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
    };
    set((state) => ({
      meetingMessages: [...state.meetingMessages, newMessage],
      unreadMeetingCount: state.unreadMeetingCount + 1,
    }));
  },

  clearMeetingMessages: () => set({ meetingMessages: [], unreadMeetingCount: 0 }),

  addMessageReaction: (messageId, emoji) =>
    set((state) => ({
      meetingMessages: state.meetingMessages.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }),
    })),

  clearUnreadCount: () => set({ unreadMeetingCount: 0 }),

  setTyping: (isTyping, userName) =>
    set({ isTyping, typingUser: isTyping ? userName || null : null }),
}));
