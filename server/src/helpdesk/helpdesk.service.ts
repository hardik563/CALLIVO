import { prisma } from '../db/prisma';
import { emailService } from '../email/email.service';
import { AppError } from '../common/error.middleware';

export interface CreateTicketDTO {
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
  priority?: string;
  userId?: string;
}

export class HelpdeskService {
  private generateReferenceCode(): string {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `HD-${randomNum}`;
  }

  async createTicket(data: CreateTicketDTO) {
    if (!data.name?.trim() || !data.email?.trim() || !data.subject?.trim() || !data.message?.trim()) {
      throw new AppError('Name, email, subject, and message are required', 400);
    }

    let referenceCode = this.generateReferenceCode();
    let existing = await prisma.helpdeskTicket.findUnique({ where: { referenceCode } });
    while (existing) {
      referenceCode = this.generateReferenceCode();
      existing = await prisma.helpdeskTicket.findUnique({ where: { referenceCode } });
    }

    const ticket = await prisma.helpdeskTicket.create({
      data: {
        referenceCode,
        userId: data.userId || null,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        category: data.category || 'Technical Support',
        subject: data.subject.trim(),
        message: data.message.trim(),
        priority: data.priority || 'medium',
        status: 'Open',
      },
    });

    // Send email notification to Hardik Dhamija and ticket receipt to user via Resend
    try {
      await emailService.sendHelpdeskTicketNotification({
        referenceCode: ticket.referenceCode,
        name: ticket.name,
        email: ticket.email,
        phone: ticket.phone || undefined,
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
      });
    } catch (emailErr) {
      console.error('Helpdesk email dispatch warning (ticket was saved to DB):', emailErr);
    }

    return ticket;
  }

  async getTickets(userId?: string) {
    if (userId) {
      return prisma.helpdeskTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return prisma.helpdeskTicket.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicketByReference(referenceCode: string) {
    const ticket = await prisma.helpdeskTicket.findUnique({
      where: { referenceCode },
    });
    if (!ticket) throw new AppError('Ticket not found', 404);
    return ticket;
  }
}

export const helpdeskService = new HelpdeskService();
