import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        bio: true,
        timezone: true,
        language: true,
        role: true,
        status: true,
        createdAt: true,
        settings: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: {
    name?: string;
    phone?: string | null;
    avatar?: string | null;
    bio?: string | null;
    timezone?: string;
    language?: string;
  }) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.avatar && { avatar: data.avatar }),
        ...(data.bio !== undefined && { bio: data.bio?.trim() || null }),
        ...(data.timezone && { timezone: data.timezone }),
        ...(data.language && { language: data.language }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        bio: true,
        timezone: true,
        language: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return updated;
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length < 2) return [];

    const q = query.trim().toLowerCase();
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        role: true,
      },
      take: 15,
    });

    return users;
  }
}

export const usersService = new UsersService();
