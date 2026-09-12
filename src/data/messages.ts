export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
}

export interface DirectConversation {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactAvatar?: string;
  role: string;
  status: 'online' | 'in_meeting' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export const sampleConversations: DirectConversation[] = [];
