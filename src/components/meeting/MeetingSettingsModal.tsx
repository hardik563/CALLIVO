import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { getSocket } from '../../lib/socket';
import { API_BASE_URL } from '../../lib/api';
import {
  Shield,
  Lock,
  MicOff,
  ScreenShare,
  MessageSquare,
  Smile,
  HelpCircle,
  MessageCircle,
  Save,
} from 'lucide-react';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
      checked ? 'bg-emerald-500' : 'bg-slate-700'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-5' : 'translate-x-0'
      }`}
    />
  </button>
);

interface MeetingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  initialSettings?: {
    waitingRoom?: boolean;
    muteOnEntry?: boolean;
    allowScreenShare?: boolean;
    allowChat?: boolean;
    allowReactions?: boolean;
    allowQuestions?: boolean;
    allowComments?: boolean;
    isLocked?: boolean;
  };
}

export const MeetingSettingsModal: React.FC<MeetingSettingsModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  initialSettings,
}) => {
  const { success, error: toastError } = useToast();

  const [waitingRoom, setWaitingRoom] = useState(initialSettings?.waitingRoom ?? true);
  const [muteOnEntry, setMuteOnEntry] = useState(initialSettings?.muteOnEntry ?? true);
  const [allowScreenShare, setAllowScreenShare] = useState(initialSettings?.allowScreenShare ?? true);
  const [allowChat, setAllowChat] = useState(initialSettings?.allowChat ?? true);
  const [allowReactions, setAllowReactions] = useState(initialSettings?.allowReactions ?? true);
  const [allowQuestions, setAllowQuestions] = useState(initialSettings?.allowQuestions ?? true);
  const [allowComments, setAllowComments] = useState(initialSettings?.allowComments ?? true);
  const [isLocked, setIsLocked] = useState(initialSettings?.isLocked ?? false);

  const [isSaving, setIsSaving] = useState(false);
  const socket = getSocket();

  useEffect(() => {
    if (initialSettings) {
      if (initialSettings.waitingRoom !== undefined) setWaitingRoom(initialSettings.waitingRoom);
      if (initialSettings.muteOnEntry !== undefined) setMuteOnEntry(initialSettings.muteOnEntry);
      if (initialSettings.allowScreenShare !== undefined) setAllowScreenShare(initialSettings.allowScreenShare);
      if (initialSettings.allowChat !== undefined) setAllowChat(initialSettings.allowChat);
      if (initialSettings.allowReactions !== undefined) setAllowReactions(initialSettings.allowReactions);
      if (initialSettings.allowQuestions !== undefined) setAllowQuestions(initialSettings.allowQuestions);
      if (initialSettings.allowComments !== undefined) setAllowComments(initialSettings.allowComments);
      if (initialSettings.isLocked !== undefined) setIsLocked(initialSettings.isLocked);
    }
  }, [initialSettings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updates = {
        waitingRoom,
        muteOnEntry,
        allowScreenShare,
        allowChat,
        allowReactions,
        allowQuestions,
        allowComments,
        isLocked,
      };

      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update meeting settings');
      }

      // Broadcast changes over socket
      socket.emit('host:update-settings', { meetingId, settings: updates });
      if (isLocked !== initialSettings?.isLocked) {
        socket.emit('host:lock-room', { meetingId, isLocked });
      }

      success('Settings Applied', 'Meeting configuration has been updated.');
      onClose();
    } catch (err: any) {
      toastError('Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Host Controls & Permissions"
      description="Configure real-time security and interaction options for all participants in this room."
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        {/* Security & Access Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Security & Access
          </h4>

          {/* Lock Meeting */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Lock Meeting</p>
                <p className="text-[11px] text-slate-400">Prevent any new participants from entering</p>
              </div>
            </div>
            <ToggleSwitch checked={isLocked} onChange={setIsLocked} />
          </div>

          {/* Waiting Room */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Enable Waiting Room</p>
                <p className="text-[11px] text-slate-400">Admit attendees individually or all at once</p>
              </div>
            </div>
            <ToggleSwitch checked={waitingRoom} onChange={setWaitingRoom} />
          </div>

          {/* Mute on Entry */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <MicOff className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Mute Participants on Entry</p>
                <p className="text-[11px] text-slate-400">Participants join with their microphone muted</p>
              </div>
            </div>
            <ToggleSwitch checked={muteOnEntry} onChange={setMuteOnEntry} />
          </div>
        </div>

        {/* Participant Features Section */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Participant Permissions
          </h4>

          {/* Screen Share */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <ScreenShare className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-200">Allow Screen Sharing</span>
            </div>
            <ToggleSwitch checked={allowScreenShare} onChange={setAllowScreenShare} />
          </div>

          {/* Chat */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-200">Allow In-Meeting Chat</span>
            </div>
            <ToggleSwitch checked={allowChat} onChange={setAllowChat} />
          </div>

          {/* Reactions */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <Smile className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-200">Allow Live Floating Reactions</span>
            </div>
            <ToggleSwitch checked={allowReactions} onChange={setAllowReactions} />
          </div>

          {/* Q&A */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-200">Allow Q&A System</span>
            </div>
            <ToggleSwitch checked={allowQuestions} onChange={setAllowQuestions} />
          </div>

          {/* Comments */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-slate-700/80">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-medium text-slate-200">Allow Live Discussion Comments</span>
            </div>
            <ToggleSwitch checked={allowComments} onChange={setAllowComments} />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
