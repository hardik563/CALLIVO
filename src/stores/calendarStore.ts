import { create } from 'zustand';
import { CalendarEvent } from '../types';
import { calendarApi } from '../lib/api';

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  selectedDate: string; // YYYY-MM-DD
  currentView: 'month' | 'week' | 'day';
  selectedEvent: CalendarEvent | null;

  fetchEvents: (month?: string) => Promise<void>;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<any>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: string) => void;
  setCurrentView: (view: 'month' | 'week' | 'day') => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  isLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],
  currentView: 'month',
  selectedEvent: null,

  fetchEvents: async (month) => {
    try {
      set({ isLoading: true });
      const res = await calendarApi.list(month);
      if (res.success && Array.isArray(res.events)) {
        const mapped: CalendarEvent[] = res.events.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          duration: e.duration || '45 min',
          meetingId: e.meetingId || '',
          participants: [],
          category: (e.category as any) || 'team',
        }));
        set({ events: mapped, isLoading: false });
        return;
      }
    } catch (err: any) {
      console.warn('Failed to fetch calendar events:', err.message);
    }
    set({ isLoading: false });
  },

  setEvents: (events) => set({ events }),

  addEvent: async (newEvent) => {
    try {
      const res = await calendarApi.create({
        title: newEvent.title,
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        duration: newEvent.duration,
        category: newEvent.category,
        createMeetingLink: true,
      });
      if (res.success && res.event) {
        const e = res.event;
        const mapped: CalendarEvent = {
          id: e.id,
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          duration: e.duration,
          meetingId: e.meetingId || '',
          participants: [],
          category: (e.category as any) || 'team',
        };
        set((state) => ({ events: [...state.events, mapped] }));
        return mapped;
      }
    } catch (err) {
      console.warn('Could not save calendar event to backend:', err);
    }
  },

  deleteEvent: async (id) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
    }));

    try {
      await calendarApi.delete(id);
    } catch (err) {
      console.warn('Could not delete calendar event from backend:', err);
    }
  },

  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setCurrentView: (currentView) => set({ currentView }),
  setSelectedEvent: (selectedEvent) => set({ selectedEvent }),
}));
