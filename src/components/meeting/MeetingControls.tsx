import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  StopCircle,
  Hand,
  Smile,
  MessageSquare,
  Users,
  LayoutGrid,
  Sparkles,
  Settings,
  Radio,
  PhoneOff,
  MoreVertical,
  Check,
  HelpCircle,
  Subtitles,
  Activity,
  Sliders,
  MessageCircle,
} from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import { useMeetingStore } from '../../stores/meetingStore';
import { useParticipantStore } from '../../stores/participantStore';
import { useChatStore } from '../../stores/chatStore';
import { useToast } from '../ui/Toast';
import { MeetingViewMode } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface MeetingControlsProps {
  onToggleChat: () => void;
  isChatOpen: boolean;
  onToggleParticipants: () => void;
  isParticipantsOpen: boolean;
  onOpenSettings: () => void;
  onToggleScreenShare: () => void;
  onToggleQnA?: () => void;
  isQnAOpen?: boolean;
  onToggleComments?: () => void;
  isCommentsOpen?: boolean;
  isCaptionsOn?: boolean;
  onToggleCaptions?: () => void;
  onOpenDiagnostics?: () => void;
  onOpenMeetingSettings?: () => void;
  isHost?: boolean;
}

export const MeetingControls: React.FC<MeetingControlsProps> = ({
  onToggleChat,
  isChatOpen,
  onToggleParticipants,
  isParticipantsOpen,
  onOpenSettings,
  onToggleScreenShare,
  onToggleQnA,
  isQnAOpen,
  onToggleComments,
  isCommentsOpen,
  isCaptionsOn,
  onToggleCaptions,
  onOpenDiagnostics,
  onOpenMeetingSettings,
  isHost,
}) => {
  const navigate = useNavigate();
  const { toast, success, warning } = useToast();

  const {
    isMuted,
    toggleMute,
    isCameraOff,
    toggleCamera,
    isScreenSharing,
    isHandRaised,
    toggleHandRaise,
    isRecording,
    toggleRecording,
    viewMode,
    setViewMode,
  } = useMeetingStore();

  const { participants, addReaction } = useParticipantStore();
  const { unreadMeetingCount } = useChatStore();

  const [showReactions, setShowReactions] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Mute toggle with speaking detection warning
  const handleToggleMute = () => {
    toggleMute();
    if (!isMuted) {
      toast('Microphone muted', 'Others can no longer hear you.', 'info');
    } else {
      success('Microphone unmuted', 'You are now live.');
    }
  };

  const handleToggleHand = () => {
    toggleHandRaise();
    const myParticipant = participants.find((p) => p.isLocal);
    if (myParticipant) {
      if (!isHandRaised) {
        toast('Hand raised', 'The host has been notified.', 'warning');
      }
    }
  };

  const handleSendReaction = (emoji: string) => {
    const myParticipant = participants.find((p) => p.isLocal);
    if (myParticipant) {
      addReaction(myParticipant.id, emoji);
    }
    setShowReactions(false);
  };

  const handleToggleRecording = () => {
    toggleRecording();
    if (!isRecording) {
      warning('Recording Started', 'All participants have been notified that this session is being recorded.');
    } else {
      success('Recording Saved', 'Session recording has been saved to your recordings library.');
    }
    setShowMoreMenu(false);
  };

  const emojis = ['👍', '❤️', '😂', '👏', '🎉', '🔥'];

  const views: { id: MeetingViewMode; label: string; icon: React.ReactNode }[] = [
    { id: 'grid', label: 'Grid View', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'speaker', label: 'Speaker View', icon: <Users className="w-4 h-4" /> },
    { id: 'spatial', label: '3D Spatial Room', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <>
      <div className="relative flex items-center justify-center gap-2 sm:gap-3 p-3 bg-surface-elevated/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-30">
        {/* Microphone */}
        <IconButton
          variant={isMuted ? 'control-active' : 'control'}
          label={isMuted ? 'Unmute (M)' : 'Mute (M)'}
          onClick={handleToggleMute}
          size="md"
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </IconButton>

        {/* Camera */}
        <IconButton
          variant={isCameraOff ? 'control-active' : 'control'}
          label={isCameraOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
          onClick={toggleCamera}
          size="md"
        >
          {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
        </IconButton>

        {/* Screen Sharing */}
        <IconButton
          variant={isScreenSharing ? 'control-active' : 'control'}
          label={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          onClick={onToggleScreenShare}
          size="md"
          className="hidden sm:inline-flex"
        >
          {isScreenSharing ? <StopCircle className="w-5 h-5" /> : <ScreenShare className="w-5 h-5" />}
        </IconButton>

        {/* Raise Hand */}
        <IconButton
          variant={isHandRaised ? 'control-active' : 'control'}
          label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
          onClick={handleToggleHand}
          size="md"
        >
          <Hand className="w-5 h-5" />
        </IconButton>

        {/* Reactions Picker */}
        <div className="relative">
          <IconButton
            variant="control"
            label="Reactions"
            onClick={() => setShowReactions(!showReactions)}
            size="md"
          >
            <Smile className="w-5 h-5" />
          </IconButton>

          <AnimatePresence>
            {showReactions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-surface-elevated border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex items-center gap-1.5 z-40 backdrop-blur-md"
              >
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:scale-125 transition-transform rounded-xl hover:bg-slate-700/50"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-6 w-[1px] bg-slate-700/80 mx-1 hidden sm:block" />

        {/* Chat Drawer Toggle */}
        <IconButton
          variant="control"
          label="Open Chat"
          onClick={onToggleChat}
          isActive={isChatOpen}
          badge={unreadMeetingCount > 0 ? unreadMeetingCount : undefined}
          size="md"
        >
          <MessageSquare className="w-5 h-5" />
        </IconButton>

        {/* Q&A Drawer Toggle */}
        {onToggleQnA && (
          <IconButton
            variant="control"
            label="Q&A"
            onClick={onToggleQnA}
            isActive={isQnAOpen}
            size="md"
            className="hidden sm:inline-flex"
          >
            <HelpCircle className="w-5 h-5" />
          </IconButton>
        )}

        {/* Comments Drawer Toggle */}
        {onToggleComments && (
          <IconButton
            variant="control"
            label="Live Discussion"
            onClick={onToggleComments}
            isActive={isCommentsOpen}
            size="md"
            className="hidden sm:inline-flex"
          >
            <MessageCircle className="w-5 h-5" />
          </IconButton>
        )}

        {/* Participants Drawer Toggle */}
        <IconButton
          variant="control"
          label="Participants"
          onClick={onToggleParticipants}
          isActive={isParticipantsOpen}
          badge={participants.length}
          size="md"
        >
          <Users className="w-5 h-5" />
        </IconButton>

        {/* View Switcher Menu */}
        <div className="relative hidden md:block">
          <IconButton
            variant="control"
            label="Change View"
            onClick={() => setShowViewMenu(!showViewMenu)}
            size="md"
          >
            <LayoutGrid className="w-5 h-5" />
          </IconButton>

          <AnimatePresence>
            {showViewMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 right-0 w-48 bg-surface-elevated border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-40 backdrop-blur-md"
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Layout Mode
                </div>
                {views.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setViewMode(v.id);
                      setShowViewMenu(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {v.icon}
                      <span>{v.label}</span>
                    </div>
                    {viewMode === v.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* More Actions Menu */}
        <div className="relative">
          <IconButton
            variant="control"
            label="More Options"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            size="md"
          >
            <MoreVertical className="w-5 h-5" />
          </IconButton>

          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full mb-3 right-0 w-56 bg-surface-elevated border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 z-40 backdrop-blur-md"
              >
                {/* Mobile Q&A and Comments if hidden from main bar */}
                {onToggleQnA && (
                  <button
                    onClick={() => {
                      onToggleQnA();
                      setShowMoreMenu(false);
                    }}
                    className="flex sm:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-brand-400" />
                    <span>Q&A Session</span>
                  </button>
                )}

                {onToggleComments && (
                  <button
                    onClick={() => {
                      onToggleComments();
                      setShowMoreMenu(false);
                    }}
                    className="flex sm:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <MessageCircle className="w-4 h-4 text-brand-400" />
                    <span>Discussion Comments</span>
                  </button>
                )}

                {/* Live Captions (CC) */}
                {onToggleCaptions && (
                  <button
                    onClick={() => {
                      onToggleCaptions();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Subtitles className={`w-4 h-4 ${isCaptionsOn ? 'text-brand-400' : 'text-slate-400'}`} />
                      <span>Live Captions (CC)</span>
                    </div>
                    {isCaptionsOn && <span className="text-[10px] text-brand-400 font-bold uppercase">ON</span>}
                  </button>
                )}

                {/* Recording Toggle */}
                <button
                  onClick={handleToggleRecording}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <Radio className={isRecording ? 'w-4 h-4 text-rose-500 animate-pulse' : 'w-4 h-4 text-slate-400'} />
                  <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                </button>

                {/* Connection Diagnostics */}
                {onOpenDiagnostics && (
                  <button
                    onClick={() => {
                      onOpenDiagnostics();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Connection Diagnostics</span>
                  </button>
                )}

                {/* Host Meeting Settings */}
                {isHost && onOpenMeetingSettings && (
                  <button
                    onClick={() => {
                      onOpenMeetingSettings();
                      setShowMoreMenu(false);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Host Controls & Security</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setViewMode('spatial');
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-purple-300 hover:bg-purple-900/30 transition-colors text-left"
                >
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Enter 3D Spatial Mode</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowMoreMenu(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors text-left"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Device & Audio Settings</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Leave Meeting Button */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold text-xs tracking-wide shadow-md transition-all duration-150"
          title="Leave Meeting"
        >
          <PhoneOff className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Leave Confirmation Dialog */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave this meeting?"
        description="Are you sure you want to exit the current CALLIVO conference session?"
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowLeaveModal(false)}>
            Stay in Meeting
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setShowLeaveModal(false);
              navigate('/dashboard');
            }}
          >
            Leave Session
          </Button>
        </div>
      </Modal>
    </>
  );
};
