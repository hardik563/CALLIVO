import React, { useState, useEffect } from 'react';
import { Drawer } from '../ui/Drawer';
import { useParticipantStore } from '../../stores/participantStore';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import { getSocket } from '../../lib/socket';
import { ReportParticipantModal } from './ReportParticipantModal';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Pin,
  Crown,
  UserMinus,
  VolumeX,
  Hand,
  MoreHorizontal,
  Sparkles,
  Shield,
  Clock,
  Check,
  X,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface WaitingParticipant {
  socketId: string;
  userId?: string;
  name: string;
  avatar?: string;
  requestedAt: string;
}

interface ParticipantsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  isHostOrCoHost: boolean;
}

export const ParticipantsDrawer: React.FC<ParticipantsDrawerProps> = ({
  isOpen,
  onClose,
  meetingId,
  isHostOrCoHost,
}) => {
  const { participants, toggleMuteParticipant, togglePinParticipant, removeParticipant, muteAll } =
    useParticipantStore();
  const { success, warning } = useToast();

  const [waitingList, setWaitingList] = useState<WaitingParticipant[]>([]);
  const [participantToRemove, setParticipantToRemove] = useState<{ id: string; name: string } | null>(
    null
  );
  const [activeMenuSocketId, setActiveMenuSocketId] = useState<string | null>(null);
  const [reportingParticipant, setReportingParticipant] = useState<{
    userId?: string;
    socketId: string;
    name: string;
  } | null>(null);

  const socket = getSocket();

  // Socket listeners for waiting room
  useEffect(() => {
    const handleWaitingList = (list: WaitingParticipant[]) => {
      setWaitingList(list);
    };

    const handleParticipantWaiting = (participant: WaitingParticipant) => {
      setWaitingList((prev) => [...prev.filter((p) => p.socketId !== participant.socketId), participant]);
      warning('Waiting Room', `${participant.name} is waiting to join the meeting.`);
    };

    const handleParticipantCancelled = (payload: { socketId: string }) => {
      setWaitingList((prev) => prev.filter((p) => p.socketId !== payload.socketId));
    };

    socket.on('lobby:waiting-list', handleWaitingList);
    socket.on('lobby:participant-waiting', handleParticipantWaiting);
    socket.on('lobby:participant-cancelled', handleParticipantCancelled);

    return () => {
      socket.off('lobby:waiting-list', handleWaitingList);
      socket.off('lobby:participant-waiting', handleParticipantWaiting);
      socket.off('lobby:participant-cancelled', handleParticipantCancelled);
    };
  }, [socket, warning]);

  const handleMuteAll = () => {
    muteAll();
    socket.emit('host:mute-all', { meetingId });
    warning('All Participants Muted', 'All attendees have been muted.');
  };

  const handleLowerAllHands = () => {
    socket.emit('host:lower-hand', { meetingId });
    success('Hands Lowered', 'All raised hands have been lowered.');
  };

  const handleAdmit = (targetSocketId: string) => {
    socket.emit('lobby:admit', { meetingId, targetSocketId });
    setWaitingList((prev) => prev.filter((p) => p.socketId !== targetSocketId));
  };

  const handleReject = (targetSocketId: string) => {
    socket.emit('lobby:reject', { meetingId, targetSocketId });
    setWaitingList((prev) => prev.filter((p) => p.socketId !== targetSocketId));
  };

  const handleAdmitAll = () => {
    socket.emit('lobby:admit-all', { meetingId });
    setWaitingList([]);
    success('Admitted All', 'All waiting participants have been admitted.');
  };

  const handleConfirmRemove = () => {
    if (participantToRemove) {
      socket.emit('host:remove-participant', {
        meetingId,
        targetSocketId: participantToRemove.id,
      });
      removeParticipant(participantToRemove.id);
      success('Participant Removed', `${participantToRemove.name} has been removed.`);
      setParticipantToRemove(null);
    }
  };

  // Host context actions
  const handleAskUnmute = (targetSocketId: string) => {
    socket.emit('host:ask-unmute', { meetingId, targetSocketId });
    success('Request Sent', 'Asked participant to unmute microphone.');
    setActiveMenuSocketId(null);
  };

  const handleForceStopVideo = (targetSocketId: string) => {
    socket.emit('host:stop-video', { meetingId, targetSocketId });
    warning('Camera Stopped', 'Participant camera has been turned off.');
    setActiveMenuSocketId(null);
  };

  const handleAskVideo = (targetSocketId: string) => {
    socket.emit('host:ask-video', { meetingId, targetSocketId });
    success('Request Sent', 'Asked participant to start video.');
    setActiveMenuSocketId(null);
  };

  const handleSpotlight = (targetSocketId: string) => {
    socket.emit('host:spotlight', { meetingId, targetSocketId });
    success('Spotlight Active', 'Participant video feed is now spotlighted for everyone.');
    setActiveMenuSocketId(null);
  };

  const handlePromoteCoHost = (targetSocketId: string) => {
    socket.emit('host:promote-cohost', { meetingId, targetSocketId });
    success('Promoted', 'Participant is now a co-host.');
    setActiveMenuSocketId(null);
  };

  const handleDemoteCoHost = (targetSocketId: string) => {
    socket.emit('host:demote-cohost', { meetingId, targetSocketId });
    warning('Demoted', 'Participant co-host permissions removed.');
    setActiveMenuSocketId(null);
  };

  const handleTransferHost = (targetSocketId: string) => {
    socket.emit('host:transfer-host', { meetingId, targetSocketId });
    success('Host Transferred', 'Meeting host role has been transferred.');
    setActiveMenuSocketId(null);
  };

  const handlePutInWaitingRoom = (targetSocketId: string) => {
    socket.emit('host:put-in-waiting-room', { meetingId, targetSocketId });
    warning('Moved to Waiting Room', 'Participant moved back to waiting room.');
    setActiveMenuSocketId(null);
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title="Participants"
        subtitle={`${participants.length} in session ${waitingList.length > 0 ? `• ${waitingList.length} waiting` : ''}`}
        className="w-full sm:w-96"
      >
        <div className="flex flex-col h-full -m-5">
          {/* Host Controls Bar */}
          {isHostOrCoHost && (
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-surface-elevated/40">
              <span className="text-xs font-semibold text-slate-400">Host Controls</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLowerAllHands}
                  leftIcon={<Hand className="w-3.5 h-3.5" />}
                  className="text-xs h-7"
                >
                  Lower All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMuteAll}
                  leftIcon={<VolumeX className="w-3.5 h-3.5 text-rose-400" />}
                  className="text-xs h-7"
                >
                  Mute All
                </Button>
              </div>
            </div>
          )}

          {/* Roster & Waiting Room */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* WAITING ROOM SECTION */}
            {isHostOrCoHost && waitingList.length > 0 && (
              <div className="space-y-2 pb-3 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Waiting Room ({waitingList.length})</span>
                  </div>
                  <button
                    onClick={handleAdmitAll}
                    className="text-[11px] font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Admit All
                  </button>
                </div>

                <div className="space-y-1.5">
                  {waitingList.map((w) => (
                    <div
                      key={w.socketId}
                      className="flex items-center justify-between p-2 rounded-xl bg-amber-500/5 border border-amber-500/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={w.name} src={w.avatar} size="xs" />
                        <span className="text-xs font-semibold text-white truncate">{w.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdmit(w.socketId)}
                          className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-colors"
                          title="Admit"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReject(w.socketId)}
                          className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition-colors"
                          title="Deny"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* IN SESSION PARTICIPANTS */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
                In This Session ({participants.length})
              </div>

              {participants.map((p) => (
                <div
                  key={p.id}
                  className="relative flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-elevated/70 transition-colors border border-transparent hover:border-slate-800"
                >
                  {/* Left: Avatar & Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={p.name} src={p.avatar} size="sm" isSpeaking={p.isSpeaking} />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                        {p.isHost && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Host
                          </span>
                        )}
                        {p.isHandRaised && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-0.5 animate-bounce">
                            ✋ Hand
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {p.isLocal ? 'You' : 'Participant'} • {p.connectionQuality} net
                      </span>
                    </div>
                  </div>

                  {/* Right: Media icons & Host menu button */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleMuteParticipant(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.isMuted
                          ? 'text-rose-400 hover:bg-rose-500/10'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={p.isMuted ? 'Muted' : 'Speaking / Live'}
                    >
                      {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>

                    <div className={`p-1.5 ${p.isCameraOff ? 'text-slate-500' : 'text-emerald-400'}`}>
                      {p.isCameraOff ? (
                        <VideoOff className="w-3.5 h-3.5" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                    </div>

                    <button
                      onClick={() => togglePinParticipant(p.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.isPinned
                          ? 'text-brand-400 bg-brand-500/10'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title={p.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    {/* Action Dropdown Toggle for Other Participants */}
                    {!p.isLocal && (
                      <button
                        onClick={() =>
                          setActiveMenuSocketId(activeMenuSocketId === p.id ? null : p.id)
                        }
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="Participant Actions"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Host Action Popover Menu */}
                  {activeMenuSocketId === p.id && (
                    <div className="absolute right-2 top-full mt-1 w-48 bg-surface-elevated border border-slate-700/90 rounded-xl p-1.5 shadow-2xl z-50 flex flex-col gap-0.5 backdrop-blur-md">
                      {isHostOrCoHost && (
                        <>
                          <button
                            onClick={() => handleAskUnmute(p.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                          >
                            <Mic className="w-3.5 h-3.5 text-brand-400" />
                            <span>Ask to Unmute</span>
                          </button>

                          {p.isCameraOff ? (
                            <button
                              onClick={() => handleAskVideo(p.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                            >
                              <Video className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Ask to Start Video</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleForceStopVideo(p.id)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                            >
                              <VideoOff className="w-3.5 h-3.5 text-amber-400" />
                              <span>Stop Video</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleSpotlight(p.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>Spotlight for Everyone</span>
                          </button>

                          <button
                            onClick={() => handlePromoteCoHost(p.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                          >
                            <Crown className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Make Co-Host</span>
                          </button>

                          <button
                            onClick={() => handleTransferHost(p.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Transfer Host</span>
                          </button>

                          <button
                            onClick={() => handlePutInWaitingRoom(p.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Put in Waiting Room</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setReportingParticipant({
                            userId: (p as any).userId,
                            socketId: p.id,
                            name: p.name,
                          });
                          setActiveMenuSocketId(null);
                        }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 text-left"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Report Participant</span>
                      </button>

                      {isHostOrCoHost && (
                        <button
                          onClick={() => {
                            setParticipantToRemove({ id: p.id, name: p.name });
                            setActiveMenuSocketId(null);
                          }}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 text-left"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove from Call</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={!!participantToRemove}
        onClose={() => setParticipantToRemove(null)}
        title={`Remove ${participantToRemove?.name || 'Participant'}?`}
        description="This participant will be disconnected from the CALLIVO meeting immediately."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setParticipantToRemove(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirmRemove}>
            Remove Now
          </Button>
        </div>
      </Modal>

      {/* Report Modal */}
      <ReportParticipantModal
        isOpen={!!reportingParticipant}
        onClose={() => setReportingParticipant(null)}
        meetingId={meetingId}
        reportedParticipant={reportingParticipant}
      />
    </>
  );
};
