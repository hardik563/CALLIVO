import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useCalendarStore } from '../stores/calendarStore';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/ui/Toast';
import { meetingsApi } from '../lib/api';
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  KeyRound,
  Shield,
  Video,
  Mic,
  ArrowRight,
  Users,
} from 'lucide-react';

export const ScheduleMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addEvent } = useCalendarStore();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('14:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [timezone, setTimezone] = useState('GMT+05:30 (India Standard Time)');
  const [passcode, setPasscode] = useState(String(Math.floor(100000 + Math.random() * 900000)));
  const [inviteEmails, setInviteEmails] = useState('');

  // Meeting parameters
  const [waitingRoom, setWaitingRoom] = useState(true);
  const [muteOnEntry, setMuteOnEntry] = useState(true);
  const [autoRecord, setAutoRecord] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const durationOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
  ];

  const timezoneOptions = [
    { value: 'GMT+05:30 (India Standard Time)', label: 'GMT+05:30 (India Standard Time / IST)' },
    { value: 'GMT-07:00 (Pacific Time)', label: 'GMT-07:00 (Pacific Time / PT)' },
    { value: 'GMT-04:00 (Eastern Time)', label: 'GMT-04:00 (Eastern Time / ET)' },
    { value: 'GMT+01:00 (Central European Time)', label: 'GMT+01:00 (Central European Time / CET)' },
  ];

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toastError('Title Required', 'Please enter a meeting topic.');
      return;
    }

    try {
      setIsLoading(true);

      const parsedInvites = inviteEmails
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x.includes('@'));

      const res = await meetingsApi.create({
        title: title.trim(),
        passcode: passcode.trim(),
        scheduledAt: `${date}T${startTime}:00`,
        durationMinutes,
        timezone,
        waitingRoom,
        muteOnEntry,
        autoRecord,
        inviteEmails: parsedInvites,
      });

      if (res.success && res.meeting) {
        success(
          'Meeting Scheduled!',
          `Session "${res.meeting.title}" (${res.meeting.id}) saved to database.`
        );
        navigate('/meetings');
      }
    } catch (err: any) {
      toastError('Scheduling Failed', err.message || 'Could not schedule meeting.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Schedule a Meeting</h1>
        <p className="text-xs text-slate-400 mt-1">
          Plan upcoming video conferences with custom security, participant controls, and calendar invites
        </p>
      </div>

      <form onSubmit={handleSchedule} className="space-y-6">
        {/* Core Info */}
        <div className="p-6 rounded-3xl bg-[#101318] border border-[#242A33] space-y-4 shadow-sm">
          <Input
            label="Meeting Topic / Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Executive Architecture Sync & Sprint Alignment"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />

            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />

            <Select
              label="Duration"
              options={durationOptions}
              value={String(durationMinutes)}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
            />
          </div>

          <Select
            label="Timezone"
            options={timezoneOptions}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          />

          <Input
            label="Invite Attendees (Comma-separated emails)"
            placeholder="colleague@company.com, client@partner.io"
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
          />
        </div>

        {/* Security & Access Controls */}
        <div className="p-6 rounded-3xl bg-[#101318] border border-[#242A33] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Security & Access Controls
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Passcode (6-digit numeric)"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              required
            />

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#15191F] border border-[#242A33]">
              <div>
                <span className="text-xs font-semibold text-white block">Waiting Room</span>
                <span className="text-[11px] text-slate-400 block">Host must admit attendees before entry</span>
              </div>
              <input
                type="checkbox"
                checked={waitingRoom}
                onChange={(e) => setWaitingRoom(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Audio / Video Entry Settings */}
        <div className="p-6 rounded-3xl bg-[#101318] border border-[#242A33] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Video className="w-4 h-4 text-indigo-400" />
            Participant Rules Upon Entry
          </h3>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#15191F] border border-[#242A33]">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Mute participants on entry</span>
                  <span className="text-[11px] text-slate-400 block">Microphone disabled by default when entering</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={muteOnEntry}
                onChange={(e) => setMuteOnEntry(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-800 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#15191F] border border-[#242A33]">
              <div>
                <span className="text-xs font-semibold text-white block">Automatic cloud recording</span>
                <span className="text-[11px] text-slate-400 block">Automatically start recording when conference begins</span>
              </div>
              <input
                type="checkbox"
                checked={autoRecord}
                onChange={(e) => setAutoRecord(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-800 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/meetings')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="glow"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shadow-glow-sm"
          >
            Schedule & Save
          </Button>
        </div>
      </form>
    </div>
  );
};
