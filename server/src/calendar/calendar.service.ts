import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';

export interface CreateEventDTO {
  title: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  duration?: string;
  category?: string;
  description?: string;
  createMeetingLink?: boolean;
}

export class CalendarService {
  async getEvents(userId: string, month?: string) {
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        ...(month && { date: { startsWith: month } }),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return events;
  }

  async createEvent(userId: string, data: CreateEventDTO) {
    if (!data.title?.trim() || !data.date || !data.startTime || !data.endTime) {
      throw new AppError('Title, date, start time and end time are required', 400);
    }

    let meetingId: string | undefined = undefined;

    if (data.createMeetingLink) {
      // Auto-generate meeting for this event
      const part1 = Math.floor(100 + Math.random() * 900);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      const mId = `clv-${part1}-${part2}`;

      const meeting = await prisma.meeting.create({
        data: {
          id: mId,
          title: data.title.trim(),
          passcode: '123456',
          hostId: userId,
          scheduledAt: new Date(`${data.date}T${data.startTime}:00`),
          durationMinutes: 45,
          status: 'scheduled',
        },
      });

      meetingId = meeting.id;
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        title: data.title.trim(),
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        duration: data.duration || '45 min',
        category: data.category || 'team',
        description: data.description?.trim() || null,
        meetingId,
      },
    });

    return event;
  }

  async updateEvent(userId: string, eventId: string, data: Partial<CreateEventDTO>) {
    const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.userId !== userId) throw new AppError('Unauthorized', 403);

    return prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title && { title: data.title.trim() }),
        ...(data.date && { date: data.date }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.duration && { duration: data.duration }),
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
      },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await prisma.calendarEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError('Event not found', 404);
    if (event.userId !== userId) throw new AppError('Unauthorized', 403);

    await prisma.calendarEvent.delete({ where: { id: eventId } });
    return { success: true, message: 'Event deleted' };
  }
}

export const calendarService = new CalendarService();
