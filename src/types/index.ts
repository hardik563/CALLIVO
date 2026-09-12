export type ConnectionQuality = 'excellent' | 'good' | 'poor';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  timezone: string;
  bio?: string;
  status: 'online' | 'in_meeting' | 'offline';
  role?: string;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  isLocal: boolean;
  isHost: boolean;
  isCoHost?: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isHandRaised: boolean;
  isSpeaking: boolean;
  isPinned?: boolean;
  isSpotlighted?: boolean;
  connectionQuality: ConnectionQuality;
  socketId?: string;
  userId?: string;
  role?: string;
  reaction?: {
    emoji: string;
    timestamp: number;
  };
}

export type MeetingStatus = 'upcoming' | 'past' | 'scheduled' | 'cancelled';

export interface Meeting {
  id: string;
  title: string;
  passcode: string;
  date: string;
  time: string;
  duration: string; // e.g. "45 min"
  participants: User[];
  status: MeetingStatus;
  hostId: string;
  isHost?: boolean;
  waitingRoom: boolean;
  muteOnEntry: boolean;
  autoRecord: boolean;
  hostVideo: boolean;
  participantVideo: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: string;
  isDirect?: boolean;
  isPrivate?: boolean;
  recipientId?: string;
  reactions?: { [emoji: string]: number };
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar: string;
  status: 'online' | 'in_meeting' | 'offline';
  isFavorite: boolean;
}

export interface Recording {
  id: string;
  meetingTitle: string;
  meetingId: string;
  date: string;
  duration: string;
  size: string;
  thumbnail: string;
  participants: string[];
  videoUrl?: string;
}

export type NotificationType = 'meeting' | 'invite' | 'system' | 'message' | 'recording';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: string;
  meetingId: string;
  participants: string[];
  category: 'team' | '1-on-1' | 'all-hands' | 'client';
}

export type MeetingViewMode = 'grid' | 'speaker' | 'gallery' | 'spatial';

export type VirtualBackground = 'none' | 'blur' | 'office' | 'studio' | 'room';

export type AppTheme = 'dark' | 'light' | 'system';
