import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';

export class ContactsService {
  async getContacts(userId: string) {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      include: {
        contactUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            status: true,
            bio: true,
            lastSeenAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return contacts.map(c => ({
      id: c.id,
      contactId: c.contactId,
      name: c.nickname || c.contactUser.name,
      email: c.contactUser.email,
      avatar: c.contactUser.avatar,
      role: c.contactUser.role,
      status: c.contactUser.status,
      bio: c.contactUser.bio,
      lastSeenAt: c.contactUser.lastSeenAt,
      isFavorite: c.isFavorite,
      isBlocked: c.isBlocked,
    }));
  }

  async addContactByEmail(userId: string, email: string) {
    const trimmed = email.trim().toLowerCase();
    const targetUser = await prisma.user.findUnique({ where: { email: trimmed } });

    if (!targetUser) {
      throw new AppError('No CALLIVO user registered with that email address.', 404);
    }

    if (targetUser.id === userId) {
      throw new AppError('You cannot add yourself as a contact.', 400);
    }

    // Check if already contact
    const existing = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId,
          contactId: targetUser.id,
        },
      },
    });

    if (existing) {
      throw new AppError('This user is already in your contacts.', 400);
    }

    // Create bidirectional contact
    const contact = await prisma.contact.create({
      data: {
        userId,
        contactId: targetUser.id,
      },
      include: {
        contactUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            status: true,
            bio: true,
            lastSeenAt: true,
          },
        },
      },
    });

    // Also add reciprocal entry if not exists
    await prisma.contact.upsert({
      where: {
        userId_contactId: {
          userId: targetUser.id,
          contactId: userId,
        },
      },
      update: {},
      create: {
        userId: targetUser.id,
        contactId: userId,
      },
    });

    return contact;
  }

  async toggleFavorite(userId: string, contactId: string) {
    const contact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
    });

    if (!contact) throw new AppError('Contact not found', 404);

    return prisma.contact.update({
      where: {
        userId_contactId: {
          userId,
          contactId,
        },
      },
      data: {
        isFavorite: !contact.isFavorite,
      },
    });
  }

  async removeContact(userId: string, contactId: string) {
    await prisma.contact.deleteMany({
      where: {
        OR: [
          { userId, contactId },
          { userId: contactId, contactId: userId },
        ],
      },
    });

    return { success: true, message: 'Contact removed successfully' };
  }
}

export const contactsService = new ContactsService();
