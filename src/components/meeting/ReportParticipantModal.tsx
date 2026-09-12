import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { AlertTriangle, Send } from 'lucide-react';
import { API_BASE_URL } from '../../lib/api';

interface ReportParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  reportedParticipant: {
    userId?: string;
    socketId: string;
    name: string;
  } | null;
}

const REPORT_REASONS = [
  'Inappropriate behavior or language',
  'Harassment or bullying',
  'Spam or advertising',
  'Impersonation',
  'Disruptive audio or video',
  'Other violation',
];

export const ReportParticipantModal: React.FC<ReportParticipantModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  reportedParticipant,
}) => {
  const { success, error: toastError } = useToast();
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportedParticipant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reportedUserId: reportedParticipant.userId,
          reportedName: reportedParticipant.name,
          reason,
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }

      success(
        'Report Submitted',
        `Your report regarding ${reportedParticipant.name} has been received for moderation.`
      );
      setDetails('');
      onClose();
    } catch (err: any) {
      toastError('Report Submission Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Participant"
      description={`Submit a report regarding ${reportedParticipant.name}. Reports are confidential and reviewed by session moderators.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Reason Select */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">Reason for report</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full text-xs bg-surface border border-slate-700/80 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Details */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Additional context <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what occurred during the session..."
            maxLength={500}
            className="w-full text-xs bg-surface border border-slate-700/80 rounded-xl p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
};
