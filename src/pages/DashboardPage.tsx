import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useMeetingStore } from '../stores/meetingStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { copyToClipboard } from '../lib/utils';
import { useToast } from '../components/ui/Toast';
import { meetingsApi, contactsApi } from '../lib/api';
import {
  Video,
  PlusCircle,
  Calendar,
  Clock,
  Users,
  Copy,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Radio,
  CalendarDays,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setJoinModalOpen } = useUiStore();
  const { setActiveMeeting } = useMeetingStore();
  const { success, error: toastError } = useToast();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [mRes, cRes] = await Promise.allSettled([
          meetingsApi.list(),
          contactsApi.list(),
        ]);

        if (mRes.status === 'fulfilled' && mRes.value.success) {
          setMeetings(mRes.value.meetings || []);
        }
        if (cRes.status === 'fulfilled' && cRes.value.success) {
          setContacts(cRes.value.contacts || []);
        }
      } catch (err) {
        console.warn('Dashboard data load warning:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleStartInstantMeeting = async () => {
    const userName = user?.name || 'My';
    try {
      const res = await meetingsApi.create({
        title: `${userName}'s Instant Meeting`,
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
    } catch (err: any) {
      console.warn('Meeting API warning, routing to direct instant room session:', err.message);
    }

    // Direct room entry fallback
    const fallbackId = `clv-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveMeeting({
      id: fallbackId,
      title: `${userName}'s Instant Meeting`,
      passcode: '123456',
      isHost: true,
    });
    navigate(`/room/${fallbackId}`);
  };

  const handleJoinMeeting = (meeting: any) => {
    setActiveMeeting({
      id: meeting.id,
      title: meeting.title,
      passcode: meeting.passcode,
      isHost: Boolean(user?.id && meeting.hostId === user.id),
    });
    navigate(`/lobby/${meeting.id}`);
  };

  const handleCopyLink = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyToClipboard(`${window.location.origin}/lobby/${id}`);
    success('Link Copied', 'Meeting link copied to clipboard.');
  };

  const upcomingMeetings = meetings.filter((m) => m.status === 'active' || m.status === 'scheduled');
  const displayName = user?.name || 'there';

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}, {displayName} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome to your CALLIVO enterprise workspace.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="glow"
            size="sm"
            onClick={handleStartInstantMeeting}
            leftIcon={<Radio className="w-4 h-4 text-emerald-500" />}
            className="shadow-glow-sm"
          >
            Start Instant Meeting
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setJoinModalOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4 text-emerald-500" />}
          >
            Join Meeting
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/schedule')}
            leftIcon={<Calendar className="w-4 h-4 text-indigo-500" />}
          >
            Schedule
          </Button>
        </div>
      </div>

      {/* Meeting Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card interactive={true} className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Hosted</span>
            <Video className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{meetings.length}</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Real-time DB Sync
          </p>
        </Card>

        <Card interactive={true} className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Teammates</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{contacts.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise Network</p>
        </Card>

        <Card interactive={true} className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Encryption</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">AES-256</div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">WebRTC DTLS-SRTP</p>
        </Card>

        <Card interactive={true} className="p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Spatial 3D</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">Enabled</div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400">Three.js Room Ready</p>
        </Card>
      </div>

      {/* Main Grid: Upcoming Meetings (Left 2/3) & Favorite Contacts (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Meetings List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active & Upcoming Meetings</h2>
              <Badge variant="purple" size="sm">{upcomingMeetings.length}</Badge>
            </div>
            <button
              onClick={() => navigate('/meetings')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
            >
              View directory <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-surface rounded-2xl border border-slate-200 dark:border-slate-800">
                Loading meetings...
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 bg-surface rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
                <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
                <p>No active or scheduled meetings found.</p>
                <div className="flex justify-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleStartInstantMeeting}
                    leftIcon={<Radio className="w-3.5 h-3.5" />}
                  >
                    Start Instant Meeting
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate('/schedule')}
                  >
                    Schedule One
                  </Button>
                </div>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  interactive={true}
                  glow={true}
                  onClick={() => handleJoinMeeting(meeting)}
                  className="p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                          {meeting.id}
                        </span>
                        {user?.id && meeting.hostId === user.id && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                            Host
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {meeting.scheduledAt
                            ? new Date(meeting.scheduledAt).toLocaleString()
                            : 'Active Now'}
                        </span>
                        <span>{meeting.durationMinutes || 45} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleCopyLink(meeting.id, e)}
                        className="p-2 h-9 w-9 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                        title="Copy meeting link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleJoinMeeting(meeting)}
                        leftIcon={<Video className="w-3.5 h-3.5" />}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Favorite Contacts Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Quick Contacts</h2>
            <button
              onClick={() => navigate('/contacts')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
            >
              All contacts <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card className="p-4 divide-y divide-slate-200 dark:divide-slate-800">
            {contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-2">
                <Users className="w-6 h-6 text-slate-400 mx-auto" />
                <p>No teammates added yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/contacts')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                >
                  Add Contacts
                </Button>
              </div>
            ) : (
              contacts.slice(0, 5).map((contact) => (
                <div
                  key={contact.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      name={contact.name}
                      src={contact.avatar}
                      size="sm"
                      status={contact.status}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{contact.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{contact.role}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/messages')}
                    className="h-7 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    Chat
                  </Button>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
