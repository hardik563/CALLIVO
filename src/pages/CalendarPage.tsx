import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarStore } from '../stores/calendarStore';
import { useMeetingStore } from '../stores/meetingStore';
import { CalendarEvent } from '../types';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { copyToClipboard } from '../lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  Users,
  Copy,
  Trash2,
  Calendar as CalendarIcon,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    events,
    fetchEvents,
    currentView,
    setCurrentView,
    selectedEvent,
    setSelectedEvent,
    deleteEvent,
  } = useCalendarStore();
  const { setActiveMeeting } = useMeetingStore();
  const { success, warning } = useToast();

  const [currentMonth, setCurrentMonth] = useState('September 2026');

  useEffect(() => {
    fetchEvents();
  }, []);

  const viewTabs = [
    { id: 'month', label: 'Month View' },
    { id: 'week', label: 'Week View' },
    { id: 'day', label: 'Day View' },
  ];

  const handleJoin = (event: CalendarEvent) => {
    setActiveMeeting({
      id: event.meetingId,
      title: event.title,
      isHost: true,
    });
    navigate(`/meetings/${event.meetingId}/lobby`);
  };

  const handleCopyInvite = async (event: CalendarEvent) => {
    const text = `Join my CALLIVO Meeting: ${event.title}\nMeeting ID: ${event.meetingId}\nTime: ${event.date} at ${event.startTime}\nJoin Link: ${window.location.origin}/meetings/${event.meetingId}/lobby`;
    await copyToClipboard(text);
    success('Meeting Invite Copied', event.title);
  };

  const handleDelete = (id: string) => {
    deleteEvent(id);
    setSelectedEvent(null);
    warning('Event Cancelled', 'Meeting removed from calendar.');
  };

  // 30 days grid simulation for September 2026
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `2026-09-${dayNum.toString().padStart(2, '0')}`;
    const dayEvents = events.filter((e) => e.date === dateStr);
    return { dayNum, dateStr, dayEvents };
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Calendar</h1>
          <p className="text-xs text-slate-400 mt-1">Schedule and view all synchronized sessions</p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            tabs={viewTabs}
            activeTab={currentView}
            onChange={(id) => setCurrentView(id as 'month' | 'week' | 'day')}
          />

          <Button
            variant="glow"
            size="sm"
            onClick={() => navigate('/schedule')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-glow-sm"
          >
            New Meeting
          </Button>
        </div>
      </div>

      {/* Month Navigation Banner */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-slate-800">
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg bg-surface-elevated hover:bg-slate-800 text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white px-2">{currentMonth}</span>
          <button className="p-1.5 rounded-lg bg-surface-elevated hover:bg-slate-800 text-slate-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-brand-400 font-medium bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
          {events.length} Synchronized Meetings
        </span>
      </div>

      {/* Calendar Grid View */}
      {currentView === 'month' && (
        <div className="rounded-3xl bg-surface border border-slate-800 overflow-hidden shadow-sm">
          {/* Day Headers */}
          <div className="grid grid-cols-7 text-center py-2.5 bg-surface-elevated/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 min-h-[500px]">
            {/* September 2026 starts on a Tuesday (2 offset empty days) */}
            <div className="p-2 bg-slate-950/20 opacity-30" />
            <div className="p-2 bg-slate-950/20 opacity-30" />

            {days.map(({ dayNum, dayEvents }) => {
              const isToday = dayNum === 10;

              return (
                <div
                  key={dayNum}
                  className={`p-2 sm:p-2.5 min-h-[90px] flex flex-col justify-between transition-colors ${
                    isToday ? 'bg-brand-500/5 ring-1 ring-inset ring-brand-500/30' : 'hover:bg-surface-elevated/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                        isToday ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {dayEvents.map((evt) => (
                      <button
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        className="w-full text-left p-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-[10px] text-indigo-200 truncate transition-colors"
                      >
                        <span className="font-semibold">{evt.startTime}</span> {evt.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week / Day View Display */}
      {currentView !== 'month' && (
        <div className="rounded-3xl bg-surface border border-slate-800 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">Upcoming Timetable</h3>
          <div className="space-y-3">
            {events.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-elevated border border-slate-800 hover:border-brand-500/50 cursor-pointer transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-brand-400 font-semibold">{evt.meetingId}</span>
                    <span className="text-xs text-slate-400">{evt.date} • {evt.startTime} - {evt.endTime}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{evt.title}</h4>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleJoin(evt)}>
                  Join
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Drawer */}
      {selectedEvent && (
        <Drawer
          isOpen={true}
          onClose={() => setSelectedEvent(null)}
          title="Meeting Event Details"
          subtitle={selectedEvent.meetingId}
          className="w-full sm:w-96"
        >
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Meeting Topic
              </span>
              <h3 className="text-lg font-bold text-white">{selectedEvent.title}</h3>
            </div>

            <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <CalendarIcon className="w-4 h-4 text-brand-400" />
                <span>{selectedEvent.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{selectedEvent.startTime} - {selectedEvent.endTime} ({selectedEvent.duration})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Users className="w-4 h-4 text-purple-400" />
                <span>{selectedEvent.participants.length} Invited Participants</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                variant="glow"
                size="md"
                onClick={() => handleJoin(selectedEvent)}
                leftIcon={<Video className="w-4 h-4" />}
                className="w-full shadow-glow-sm"
              >
                Join Meeting Now
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => handleCopyInvite(selectedEvent)}
                leftIcon={<Copy className="w-4 h-4" />}
                className="w-full"
              >
                Copy Invitation Details
              </Button>

              <Button
                variant="ghost"
                size="md"
                onClick={() => handleDelete(selectedEvent.id)}
                leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}
                className="w-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                Cancel / Delete Event
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
