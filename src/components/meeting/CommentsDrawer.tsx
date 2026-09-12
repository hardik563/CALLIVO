import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { getSocket } from '../../lib/socket';
import { useAuthStore } from '../../stores/authStore';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

interface CommentItem {
  id: string;
  meetingId: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  content: string;
  createdAt: string;
}

interface CommentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  isHostOrCoHost: boolean;
}

export const CommentsDrawer: React.FC<CommentsDrawerProps> = ({
  isOpen,
  onClose,
  meetingId,
  isHostOrCoHost,
}) => {
  const { user } = useAuthStore();
  const { toast, error: toastError } = useToast();

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const socket = getSocket();

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/comments`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.comments)) {
        setComments(data.comments);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.warn('Failed to load comments:', err);
    }
  }, [meetingId]);

  useEffect(() => {
    if (isOpen && meetingId) {
      loadComments();
    }
  }, [isOpen, meetingId, loadComments]);

  useEffect(() => {
    const handleNewComment = (comment: CommentItem) => {
      setComments((prev) => [...prev.filter((c) => c.id !== comment.id), comment]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    socket.on('comment:created', handleNewComment);
    return () => {
      socket.off('comment:created', handleNewComment);
    };
  }, [socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = commentText.trim();
    if (!content) return;

    try {
      setIsSubmitting(true);
      const guestName = sessionStorage.getItem('callivo_guest_name') || 'Guest';
      const authorName = user?.name || guestName;

      const res = await fetch(`/api/meetings/${meetingId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, authorName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not post comment');
      }

      setCommentText('');
      setComments((prev) => [...prev, data.comment]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

      socket.emit('comment:broadcast', {
        meetingId,
        comment: data.comment,
      });
    } catch (err: any) {
      toastError('Failed to post comment', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast('Comment deleted', '', 'info');
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Discussion Comments"
      subtitle="Share real-time thoughts, feedback, and notes"
      className="w-full sm:w-96"
    >
      <div className="flex flex-col h-full -m-5">
        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No comments yet in this discussion.</p>
              <p className="text-[11px] text-slate-600">Start the conversation below!</p>
            </div>
          ) : (
            comments.map((c) => {
              const isMyComment = user?.id ? c.userId === user.id : false;
              const canDelete = isMyComment || isHostOrCoHost;

              return (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-surface-elevated/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={c.authorName} src={c.authorAvatar || undefined} size="xs" />
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed break-words">
                    {c.content}
                  </p>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-surface-elevated/90">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a comment to the discussion..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 text-xs bg-surface border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              maxLength={400}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!commentText.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="h-8 px-3 text-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  );
};
