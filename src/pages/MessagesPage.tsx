import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useMeetingStore } from '../stores/meetingStore';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { generateMeetingId } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { messagesApi } from '../lib/api';
import {
  Search,
  Send,
  Smile,
  Video,
  MessageSquare,
  Users,
  Loader2,
} from 'lucide-react';

interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
}

interface ConversationItem {
  id: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  contactAvatar?: string;
  status: 'online' | 'in_meeting' | 'offline';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: DirectMessage[];
}

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setActiveMeeting } = useMeetingStore();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeContactId, setActiveContactId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations from backend API
  useEffect(() => {
    messagesApi.getConversations().then((res) => {
      if (res.success && Array.isArray(res.conversations)) {
        const mapped: ConversationItem[] = res.conversations.map((c: any) => ({
          id: c.id,
          contactId: c.partner.id,
          contactName: c.partner.name,
          contactEmail: c.partner.email,
          contactAvatar: c.partner.avatar,
          status: c.partner.status || 'offline',
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unreadCount: c.unreadCount || 0,
          messages: [],
        }));
        setConversations(mapped);
        if (mapped.length > 0) {
          setActiveContactId(mapped[0].contactId);
        }
      }
    }).catch((err) => {
      console.warn('Failed to load conversations:', err);
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const activeConversation = conversations.find((c) => c.contactId === activeContactId) || (conversations.length > 0 ? conversations[0] : null);

  // Load messages for the active partner
  useEffect(() => {
    if (!activeConversation) return;

    messagesApi.getMessages(activeConversation.contactId).then((res) => {
      if (res.success && Array.isArray(res.messages)) {
        const msgs: DirectMessage[] = res.messages.map((m: any) => {
          const isMe = m.senderId === user?.id;
          return {
            id: m.id,
            senderId: m.senderId,
            senderName: isMe ? (user?.name || 'You') : activeConversation.contactName,
            senderAvatar: isMe ? user?.avatar : activeConversation.contactAvatar,
            message: m.content,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.contactId === activeConversation.contactId
              ? { ...c, messages: msgs }
              : c
          )
        );
      }
    }).catch((err) => {
      console.warn('Failed to load partner messages:', err);
    });
  }, [activeConversation?.contactId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversation || !user) return;

    const text = inputValue.trim();
    setInputValue('');
    setSending(true);

    const tempMsg: DirectMessage = {
      id: 'msg-' + Date.now(),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      message: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Optimistically update local conversation state
    setConversations((prev) =>
      prev.map((c) => {
        if (c.contactId === activeConversation.contactId) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: 'Just now',
            messages: [...c.messages, tempMsg],
          };
        }
        return c;
      })
    );

    try {
      await messagesApi.send(activeConversation.contactId, text);
    } catch (err) {
      console.warn('Message send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleStartCall = () => {
    if (!activeConversation) return;
    const id = generateMeetingId();
    setActiveMeeting({
      id,
      title: `Call with ${activeConversation.contactName}`,
      isHost: true,
    });
    navigate(`/meetings/${id}/lobby`);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const quickEmojis = ['👍', '❤️', '👏', '🔥', '🎉', '🚀'];

  return (
    <div className="h-[calc(100vh-8.5rem)] rounded-3xl bg-surface border border-slate-200 dark:border-slate-800 overflow-hidden flex shadow-xl">
      {/* LEFT: Conversations Sidebar */}
      <div className="w-full sm:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-surface/60">
        {/* Sidebar Header & Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Direct Messages</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-elevated/70 border border-slate-300 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 space-y-3">
              <MessageSquare className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
              <p>No conversations yet.</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => navigate('/contacts')}
                leftIcon={<Users className="w-3.5 h-3.5" />}
              >
                Find Contacts
              </Button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeConversation?.contactId === conv.contactId;

              return (
                <button
                  key={conv.contactId}
                  onClick={() => setActiveContactId(conv.contactId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? 'bg-surface-elevated border border-brand-500/30 shadow-sm'
                      : 'hover:bg-surface-elevated/50'
                  }`}
                >
                  <Avatar
                    name={conv.contactName}
                    src={conv.contactAvatar}
                    size="md"
                    status={conv.status}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{conv.contactName}</p>
                      <span className="text-[10px] text-slate-400">{conv.lastMessageTime}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{conv.lastMessage || 'No messages yet'}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Conversation Window */}
      {activeConversation ? (
        <div className="hidden sm:flex flex-1 flex-col bg-surface/30">
          {/* Header */}
          <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-surface-elevated/40">
            <div className="flex items-center gap-3">
              <Avatar
                name={activeConversation.contactName}
                src={activeConversation.contactAvatar}
                size="md"
                status={activeConversation.status}
              />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{activeConversation.contactName}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {activeConversation.contactEmail} • <span className="capitalize">{activeConversation.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="glow"
                size="sm"
                onClick={handleStartCall}
                leftIcon={<Video className="w-3.5 h-3.5" />}
                className="text-xs shadow-glow-sm"
              >
                Start Video Call
              </Button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-400 opacity-50" />
                <p>Say hello to start the conversation!</p>
              </div>
            ) : (
              activeConversation.messages.map((msg) => {
                const isMe = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {!isMe && (
                      <Avatar name={msg.senderName} src={msg.senderAvatar} size="sm" />
                    )}

                    <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {isMe ? 'You' : msg.senderName}
                        </span>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isMe
                            ? 'bg-brand-600 text-white rounded-tr-xs shadow-sm'
                            : 'bg-surface-elevated text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-tl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-surface/80">
            {showEmojiPicker && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-surface-elevated rounded-2xl border border-slate-200 dark:border-slate-700/60 w-fit">
                {quickEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInputValue((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Message ${activeConversation.contactName}...`}
                className="flex-1 bg-surface-elevated border border-slate-300 dark:border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={!inputValue.trim() || sending}
                leftIcon={<Send className="w-4 h-4" />}
                className="rounded-xl px-4"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-500 dark:text-slate-400 p-8 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-400 opacity-40" />
          <p className="text-sm font-medium">Select a conversation to begin messaging</p>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            Connect with team members or contacts for instant direct messages and quick video meetings.
          </p>
        </div>
      )}
    </div>
  );
};
