import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useMeetingStore } from '../stores/meetingStore';
import {
  Search,
  Video,
  PlusCircle,
  Calendar,
  Users,
  MessageSquare,
  Film,
  Settings,
  Moon,
  Keyboard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { generateMeetingId } from '../lib/utils';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setJoinModalOpen,
    setKeyboardShortcutsOpen,
  } = useUiStore();
  const { theme, setTheme } = useSettingsStore();
  const { setActiveMeeting } = useMeetingStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    {
      id: 'start-meeting',
      title: 'Start Instant Meeting',
      category: 'Meetings',
      icon: <Video className="w-4 h-4 text-emerald-400" />,
      action: () => {
        const id = generateMeetingId();
        setActiveMeeting({ id, title: 'Instant CALLIVO Session', isHost: true });
        navigate(`/meetings/${id}/lobby`);
      },
    },
    {
      id: 'join-meeting',
      title: 'Join Meeting with ID',
      category: 'Meetings',
      icon: <PlusCircle className="w-4 h-4 text-brand-400" />,
      action: () => {
        setJoinModalOpen(true);
      },
    },
    {
      id: 'schedule-meeting',
      title: 'Schedule New Meeting',
      category: 'Meetings',
      icon: <Calendar className="w-4 h-4 text-indigo-400" />,
      action: () => navigate('/schedule'),
    },
    {
      id: 'calendar',
      title: 'Go to Calendar',
      category: 'Navigation',
      icon: <Calendar className="w-4 h-4 text-slate-300" />,
      action: () => navigate('/calendar'),
    },
    {
      id: 'contacts',
      title: 'Go to Contacts',
      category: 'Navigation',
      icon: <Users className="w-4 h-4 text-slate-300" />,
      action: () => navigate('/contacts'),
    },
    {
      id: 'messages',
      title: 'Go to Messages',
      category: 'Navigation',
      icon: <MessageSquare className="w-4 h-4 text-slate-300" />,
      action: () => navigate('/messages'),
    },
    {
      id: 'recordings',
      title: 'Go to Recording Library',
      category: 'Navigation',
      icon: <Film className="w-4 h-4 text-slate-300" />,
      action: () => navigate('/recordings'),
    },
    {
      id: 'settings',
      title: 'Open Settings',
      category: 'Preferences',
      icon: <Settings className="w-4 h-4 text-slate-300" />,
      action: () => navigate('/settings'),
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      category: 'Preferences',
      icon: <Moon className="w-4 h-4 text-amber-400" />,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    },
    {
      id: 'shortcuts',
      title: 'View Keyboard Shortcuts',
      category: 'Help',
      icon: <Keyboard className="w-4 h-4 text-slate-400" />,
      action: () => setKeyboardShortcutsOpen(true),
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setCommandPaletteOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-surface border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-800">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search actions..."
                className="w-full bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-400 border border-slate-700/60">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((cmd, idx) => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      setCommandPaletteOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                      idx === selectedIndex
                        ? 'bg-brand-600/90 text-white'
                        : 'text-slate-300 hover:bg-surface-elevated'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="p-1 rounded-lg bg-black/20">{cmd.icon}</span>
                      <span>{cmd.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                        {cmd.category}
                      </span>
                      {idx === selectedIndex && <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-800 bg-surface-elevated/50 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
              </div>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-brand-400" /> CALLIVO Quick Engine
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
