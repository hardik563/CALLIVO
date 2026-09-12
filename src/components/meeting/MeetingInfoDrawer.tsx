import React from 'react';
import { Drawer } from '../ui/Drawer';
import { Copy, Check, ShieldCheck, Share2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { copyToClipboard } from '../../lib/utils';
import { useToast } from '../ui/Toast';

interface MeetingInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    id: string;
    title: string;
    passcode: string;
    hostName: string;
  };
}

export const MeetingInfoDrawer: React.FC<MeetingInfoDrawerProps> = ({ isOpen, onClose, meeting }) => {
  const { success } = useToast();
  const [copiedId, setCopiedId] = React.useState(false);
  const [copiedInvite, setCopiedInvite] = React.useState(false);

  const handleCopyId = async () => {
    await copyToClipboard(meeting.id);
    setCopiedId(true);
    success('Meeting ID Copied', meeting.id);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyInvitation = async () => {
    const inviteText = `Join my CALLIVO Meeting: ${meeting.title}\nMeeting ID: ${meeting.id}\nPasscode: ${meeting.passcode}\nJoin Link: ${window.location.origin}/meetings/${meeting.id}/lobby`;
    await copyToClipboard(inviteText);
    setCopiedInvite(true);
    success('Meeting Invitation Copied', 'Invite details copied to clipboard.');
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Meeting Information"
      subtitle="Encrypted CALLIVO WebRTC Conference"
      className="w-full sm:w-96"
    >
      <div className="space-y-5">
        {/* Security Badge */}
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-indigo-200">End-to-End Encrypted</p>
            <p className="text-slate-400 mt-0.5">
              Audio and video streams are protected with 256-bit AES encryption.
            </p>
          </div>
        </div>

        {/* Meeting Details */}
        <div className="space-y-3 bg-surface-elevated/50 p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Meeting Topic
            </label>
            <p className="text-sm font-semibold text-white mt-0.5">{meeting.title}</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Meeting ID
              </label>
              <p className="text-sm font-mono text-brand-300 mt-0.5">{meeting.id}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyId}
              leftIcon={copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              className="text-xs h-8"
            >
              {copiedId ? 'Copied' : 'Copy'}
            </Button>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Passcode
            </label>
            <p className="text-sm font-mono text-slate-200 mt-0.5">{meeting.passcode}</p>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Host
            </label>
            <p className="text-sm text-slate-300 mt-0.5">{meeting.hostName}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="primary"
            onClick={handleCopyInvitation}
            leftIcon={copiedInvite ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            className="w-full"
          >
            {copiedInvite ? 'Invitation Copied!' : 'Copy Full Invitation'}
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
