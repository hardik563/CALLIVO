import React, { useState, useEffect, useCallback } from 'react';
import { Drawer } from '../ui/Drawer';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { getSocket } from '../../lib/socket';
import { API_BASE_URL } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import {
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Pin,
  CheckCircle,
  MessageCircle,
  Send,
  Sparkles,
} from 'lucide-react';

interface QuestionItem {
  id: string;
  meetingId: string;
  userId?: string | null;
  authorName: string;
  authorAvatar?: string | null;
  question: string;
  isAnswered: boolean;
  answer?: string | null;
  isPinned: boolean;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  createdAt: string;
}

interface QnADrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  isHostOrCoHost: boolean;
}

type TabType = 'all' | 'unanswered' | 'answered' | 'top';

export const QnADrawer: React.FC<QnADrawerProps> = ({
  isOpen,
  onClose,
  meetingId,
  isHostOrCoHost,
}) => {
  const { user } = useAuthStore();
  const { success, error: toastError } = useToast();

  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState<{ [qId: string]: string }>({});

  const socket = getSocket();

  // Load questions
  const loadQuestions = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/questions`, { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.warn('Failed to fetch questions:', err);
    }
  }, [meetingId]);

  useEffect(() => {
    if (isOpen && meetingId) {
      loadQuestions();
    }
  }, [isOpen, meetingId, loadQuestions]);

  // Real-time socket updates
  useEffect(() => {
    const handleQaUpdate = () => {
      loadQuestions();
    };

    socket.on('qa:updated', handleQaUpdate);
    return () => {
      socket.off('qa:updated', handleQaUpdate);
    };
  }, [socket, loadQuestions]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newQuestionText.trim();
    if (!text) return;

    try {
      setIsSubmitting(true);
      const guestName = sessionStorage.getItem('callivo_guest_name') || 'Participant';
      const authorName = user?.name || guestName;

      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: text, authorName }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not post question');
      }

      setNewQuestionText('');
      success('Question Submitted', 'Your question has been posted to the meeting Q&A.');
      loadQuestions();

      socket.emit('qa:broadcast', {
        meetingId,
        action: 'created',
        question: data.question,
      });
    } catch (err: any) {
      toastError('Failed to Submit', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (questionId: string, voteType: 'up' | 'down') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ voteType }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setQuestions(data.questions);
        socket.emit('qa:broadcast', { meetingId, action: 'voted', question: { id: questionId } });
      }
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    const answer = (answerDraft[questionId] || '').trim();
    if (!answer) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/questions/${questionId}/answer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      if (data.success) {
        success('Answer Published', 'Your response is now visible to all participants.');
        setAnsweringQuestionId(null);
        loadQuestions();
        socket.emit('qa:broadcast', { meetingId, action: 'answered', question: data.question });
      }
    } catch (err: any) {
      toastError('Failed to Answer', err.message);
    }
  };

  const handleTogglePin = async (questionId: string, currentPin: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/questions/${questionId}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPinned: !currentPin }),
      });
      const data = await res.json();
      if (data.success) {
        loadQuestions();
        socket.emit('qa:broadcast', { meetingId, action: 'pinned', question: data.question });
      }
    } catch (err: any) {
      toastError('Action Failed', err.message);
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (activeTab === 'unanswered') return !q.isAnswered;
    if (activeTab === 'answered') return q.isAnswered;
    return true;
  });

  if (activeTab === 'top') {
    filteredQuestions.sort((a, b) => b.score - a.score);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Q&A Session"
      subtitle="Ask questions, upvote topics, and view official host answers"
      className="w-full sm:w-96"
    >
      <div className="flex flex-col h-full -m-5">
        {/* Filter Navigation Tabs */}
        <div className="p-3 border-b border-slate-800 bg-surface-elevated/50 flex items-center gap-1 overflow-x-auto">
          {(['all', 'unanswered', 'answered', 'top'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab === 'top' ? '🔥 Most Upvoted' : tab}
            </button>
          ))}
        </div>

        {/* Questions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500 space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No questions in this section yet.</p>
              <p className="text-[11px] text-slate-600">Be the first to ask something below!</p>
            </div>
          ) : (
            filteredQuestions.map((q) => (
              <div
                key={q.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  q.isPinned
                    ? 'bg-brand-950/20 border-brand-500/40 shadow-sm'
                    : 'bg-surface-elevated/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: Author + Pin + Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={q.authorName} src={q.authorAvatar || undefined} size="xs" />
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {q.authorName}
                    </span>
                    {q.isPinned && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {q.isAnswered ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Answered
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium">
                        Open
                      </span>
                    )}

                    {isHostOrCoHost && (
                      <button
                        onClick={() => handleTogglePin(q.id, q.isPinned)}
                        className={`p-1 rounded text-slate-400 hover:text-white transition-colors ${
                          q.isPinned ? 'text-amber-400' : ''
                        }`}
                        title={q.isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Body */}
                <p className="text-xs text-slate-100 font-normal leading-relaxed break-words mb-3">
                  {q.question}
                </p>

                {/* Host Answer Block */}
                {q.answer && (
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-3 space-y-1">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                      <span>Host Answer:</span>
                    </div>
                    <p className="text-xs text-slate-200">{q.answer}</p>
                  </div>
                )}

                {/* Host Answer Form */}
                {isHostOrCoHost && answeringQuestionId === q.id && (
                  <div className="mb-3 space-y-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <textarea
                      rows={2}
                      placeholder="Type official answer..."
                      value={answerDraft[q.id] || ''}
                      onChange={(e) =>
                        setAnswerDraft({ ...answerDraft, [q.id]: e.target.value })
                      }
                      className="w-full text-xs bg-surface border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAnsweringQuestionId(null)}
                        className="text-xs h-6 px-2"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleAnswerSubmit(q.id)}
                        className="text-xs h-6 px-3"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  </div>
                )}

                {/* Footer: Votes & Reply Action */}
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVote(q.id, 'up')}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                        q.userVote === 'up'
                          ? 'bg-brand-500/20 text-brand-400 font-bold'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                      title="Upvote"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{q.score}</span>
                    </button>
                    <button
                      onClick={() => handleVote(q.id, 'down')}
                      className={`p-1 rounded-md transition-colors ${
                        q.userVote === 'down'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                      title="Downvote"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>

                  {isHostOrCoHost && answeringQuestionId !== q.id && (
                    <button
                      onClick={() => {
                        setAnsweringQuestionId(q.id);
                        if (q.answer) {
                          setAnswerDraft({ ...answerDraft, [q.id]: q.answer });
                        }
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>{q.answer ? 'Edit Answer' : 'Answer'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Footer: Ask a question */}
        <form onSubmit={handleAskQuestion} className="p-3 border-t border-slate-800 bg-surface-elevated/90">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a question to the room..."
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="flex-1 text-xs bg-surface border border-slate-700/80 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              maxLength={280}
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newQuestionText.trim() || isSubmitting}
              isLoading={isSubmitting}
              className="h-8 px-3 text-xs shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
            <span>Posted as {user?.name || sessionStorage.getItem('callivo_guest_name') || 'Guest'}</span>
            <span>{280 - newQuestionText.length} chars</span>
          </div>
        </form>
      </div>
    </Drawer>
  );
};
