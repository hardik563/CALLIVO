import React, { useState, useRef, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { Send, Smile } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { meetingMessages, addMeetingMessage, addMessageReaction, clearUnreadCount, isTyping, typingUser } = useChatStore();
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      clearUnreadCount();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, clearUnreadCount, meetingMessages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const guestName = sessionStorage.getItem('callivo_guest_name') || 'Guest';
    const senderId = user?.id || 'guest-' + Date.now();
    const senderName = user?.name || guestName;
    const senderAvatar = user?.avatar || '';

    addMeetingMessage({
      senderId,
      senderName,
      senderAvatar,
      message: inputValue.trim(),
    });

    setInputValue('');
  };

  const quickEmojis = ['👍', '❤️', '👏', '🔥', '🚀', '🎉'];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Chat"
      subtitle={`${meetingMessages.length} messages in current call`}
      className="w-full sm:w-96"
    >
      <div className="flex flex-col h-full -m-5">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {meetingMessages.map((msg) => {
            const isMe = msg.senderId === (user?.id || 'local') || msg.senderName.includes('(You)');

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <Avatar name={msg.senderName} src={msg.senderAvatar} size="sm" />
                )}

                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                      isMe
                        ? 'bg-brand-600 text-white rounded-tr-xs'
                        : 'bg-surface-elevated text-slate-200 border border-slate-700/60 rounded-tl-xs'
                    }`}
                  >
                    {msg.message}
                  </div>

                  {/* Message Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(msg.reactions).map(([emoji, count]) => (
                        <button
                          key={emoji}
                          onClick={() => addMessageReaction(msg.id, emoji)}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 hover:bg-slate-700"
                        >
                          <span>{emoji}</span>
                          <span>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              <span>{typingUser} is typing...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-surface">
          {showEmojiPicker && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-surface-elevated rounded-xl border border-slate-700/60">
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

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Smile className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Send message to everyone..."
              className="flex-1 bg-surface-elevated border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />

            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white rounded-xl transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </Drawer>
  );
};
