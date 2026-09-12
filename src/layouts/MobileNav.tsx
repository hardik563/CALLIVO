import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Video, Plus, MessageSquare, User as UserIcon, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../stores/uiStore';
import { useMeetingStore } from '../stores/meetingStore';
import { generateMeetingId } from '../lib/utils';
import { meetingsApi } from '../lib/api';

export const MobileNav: React.FC = () => {
  const navigate = useNavigate();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const { setJoinModalOpen } = useUiStore();
  const { setActiveMeeting } = useMeetingStore();

  const handleStartInstant = async () => {
    setShowActionSheet(false);
    try {
      const res = await meetingsApi.create({
        title: 'Instant CALLIVO Session',
        waitingRoom: false,
      });
      if (res.success && res.meeting) {
        setActiveMeeting({
          id: res.meeting.id,
          title: res.meeting.title,
          passcode: res.meeting.passcode,
          isHost: true,
        });
        navigate(`/room/${res.meeting.id}`);
        return;
      }
    } catch (err) {
      console.warn('Instant meeting notice:', err);
    }
    const id = generateMeetingId();
    setActiveMeeting({ id, title: 'Instant CALLIVO Session', isHost: true });
    navigate(`/room/${id}`);
  };

  const handleJoin = () => {
    setShowActionSheet(false);
    setJoinModalOpen(true);
  };

  const handleSchedule = () => {
    setShowActionSheet(false);
    navigate('/schedule');
  };

  return (
    <>
      {/* Mobile Floating Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/90 backdrop-blur-xl border-t border-slate-800 py-1.5 px-4 flex items-center justify-around z-40">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/meetings"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Video className="w-5 h-5" />
          <span>Meetings</span>
        </NavLink>

        {/* Center Prominent Plus Button */}
        <button
          onClick={() => setShowActionSheet(!showActionSheet)}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-glow border-2 border-background active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <MessageSquare className="w-5 h-5" />
          <span>Messages</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* Action Sheet Modal */}
      <AnimatePresence>
        {showActionSheet && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowActionSheet(false)}
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-surface border-t border-slate-700 rounded-t-3xl p-5 space-y-3 z-10"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-sm font-semibold text-white">Create or Join Meeting</span>
                <button
                  onClick={() => setShowActionSheet(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={handleStartInstant}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-brand-600/20 border border-brand-500/30 text-white hover:bg-brand-600/30 transition-colors text-left"
                >
                  <div className="p-2 rounded-xl bg-brand-600 text-white">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Start Instant Meeting</p>
                    <p className="text-xs text-slate-400">Launch a meeting room and invite others</p>
                  </div>
                </button>

                <button
                  onClick={handleJoin}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-elevated border border-slate-700 text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Join a Meeting</p>
                    <p className="text-xs text-slate-400">Enter with a Meeting ID and Passcode</p>
                  </div>
                </button>

                <button
                  onClick={handleSchedule}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-elevated border border-slate-700 text-white hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="p-2 rounded-xl bg-purple-600 text-white">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Schedule Meeting</p>
                    <p className="text-xs text-slate-400">Plan ahead with calendar sync</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
