import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useUiStore } from '../../stores/uiStore';
import { useMeetingStore } from '../../stores/meetingStore';
import { KeyRound, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import { meetingsApi } from '../../lib/api';

export const JoinMeetingModal: React.FC = () => {
  const navigate = useNavigate();
  const { isJoinModalOpen, setJoinModalOpen } = useUiStore();
  const { setActiveMeeting } = useMeetingStore();

  const [meetingId, setMeetingId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = meetingId.trim().toLowerCase();

    if (!cleanId) {
      setError('Please enter a valid Meeting ID or link.');
      return;
    }

    if (cleanId.length < 4) {
      setError('Invalid Meeting ID format.');
      return;
    }

    setIsLoading(true);

    try {
      // Query backend to verify meeting existence and passcode
      let meetingTitle = `Meeting ${cleanId}`;
      let isHost = false;

      try {
        const res = await meetingsApi.getById(cleanId);
        if (res.success && res.meeting) {
          meetingTitle = res.meeting.title || meetingTitle;
          isHost = Boolean(res.meeting.isHost);
          if (res.meeting.hasPasscode && passcode && res.meeting.passcode && passcode !== res.meeting.passcode) {
            setError('Incorrect meeting passcode. Please verify and try again.');
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Allow joining dynamic ad-hoc room
      }

      setIsSuccess(true);
      setActiveMeeting({
        id: cleanId,
        title: meetingTitle,
        passcode: passcode || undefined,
        isHost,
      });

      setTimeout(() => {
        setIsSuccess(false);
        setJoinModalOpen(false);
        setMeetingId('');
        setPasscode('');
        navigate(`/meetings/${cleanId}/lobby`);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Unable to join meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isJoinModalOpen}
      onClose={() => {
        setJoinModalOpen(false);
        setError(null);
        setIsSuccess(false);
      }}
      title="Join a Meeting"
      description="Enter the meeting ID or code provided by the host."
      maxWidth="md"
    >
      <form onSubmit={handleJoin} className="space-y-4 pt-2">
        <Input
          label="Meeting ID or Code"
          placeholder="e.g. clv-abc-xyz"
          value={meetingId}
          onChange={(e) => {
            setMeetingId(e.target.value);
            setError(null);
          }}
          leftIcon={<Hash className="w-4 h-4" />}
          autoFocus
        />

        <Input
          label="Passcode (Optional)"
          type="password"
          placeholder="Enter numeric passcode if required"
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            setError(null);
          }}
          leftIcon={<KeyRound className="w-4 h-4" />}
        />

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Meeting confirmed! Connecting to lobby...</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setJoinModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isLoading}
            disabled={!meetingId.trim() || isSuccess}
          >
            Join Meeting
          </Button>
        </div>
      </form>
    </Modal>
  );
};
