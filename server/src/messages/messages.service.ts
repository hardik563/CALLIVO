import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';

export class MessagesService {
  private getConversationKey(id1: string, id2: string) {
    return id1 < id2 ? { user1Id: id1, user2Id: id2 } : { user1Id: id2, user2Id: id1 };
  }

  async getConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const results = [];
    for (const conv of conversations) {
      const partnerId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
      const partner = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { id: true, name: true, email: true, avatar: true, status: true, lastSeenAt: true },
      });

      if (partner) {
        const lastMsg = conv.messages[0];
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            recipientId: userId,
            isRead: false,
          },
        });

        results.push({
          id: conv.id,
          partner,
          lastMessage: lastMsg?.content || '',
          lastMessageAt: lastMsg?.createdAt || conv.lastMessageAt,
          unreadCount,
        });
      }
    }

    return results;
  }

  async getMessages(userId: string, partnerId: string) {
    const key = this.getConversationKey(userId, partnerId);
    const conversation = await prisma.conversation.findUnique({
      where: {
        user1Id_user2Id: key,
      },
    });

    if (!conversation) {
      return [];
    }

    // Mark messages sent to this user as read
    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
      },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      recipientId: m.recipientId,
      content: m.content,
      isRead: m.isRead,
      createdAt: m.createdAt,
      isSelf: m.senderId === userId,
    }));
  }

  async sendMessage(senderId: string, recipientId: string, content: string) {
    if (!content?.trim()) {
      throw new AppError('Message content cannot be empty', 400);
    }

    const key = this.getConversationKey(senderId, recipientId);
    let conversation = await prisma.conversation.findUnique({
      where: { user1Id_user2Id: key },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          user1Id: key.user1Id,
          user2Id: key.user2Id,
          lastMessageAt: new Date(),
        },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        recipientId,
        content: content.trim(),
        isDirect: true,
      },
    });

    return {
      id: message.id,
      conversationId: conversation.id,
      senderId: message.senderId,
      recipientId: message.recipientId,
      content: message.content,
      createdAt: message.createdAt,
      isRead: false,
      isSelf: true,
    };
  }
}

export const messagesService = new MessagesService();
