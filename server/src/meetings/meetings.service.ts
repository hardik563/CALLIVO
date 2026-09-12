import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';
import { emailService } from '../email/email.service';

export interface CreateMeetingDTO {
  id?: string;
  title?: string;
  passcode?: string;
  scheduledAt?: string;
  durationMinutes?: number;
  timezone?: string;
  waitingRoom?: boolean;
  muteOnEntry?: boolean;
  autoRecord?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  allowReactions?: boolean;
  allowQuestions?: boolean;
  allowComments?: boolean;
  allowFileShare?: boolean;
  allowRecording?: boolean;
  inviteEmails?: string[];
}

export class MeetingsService {
  /**
   * Generates a clean, unique CALLIVO meeting ID in the format clv-XXX-XXXX
   */
  generateMeetingId(): string {
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    return `clv-${part1}-${part2}`;
  }

  generatePasscode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  /**
   * Create meeting (instant or scheduled)
   */
  async createMeeting(userId?: string, data: CreateMeetingDTO = {}) {
    let meetingId = data.id?.trim().toLowerCase() || this.generateMeetingId();
    
    // If specific ID requested and already exists, return it
    if (data.id) {
      const existing = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: { host: true },
      });
      if (existing) {
        return this.getMeetingById(meetingId, userId);
      }
    } else {
      // Ensure uniqueness for generated ID
      let exists = await prisma.meeting.findUnique({ where: { id: meetingId } });
      while (exists) {
        meetingId = this.generateMeetingId();
        exists = await prisma.meeting.findUnique({ where: { id: meetingId } });
      }
    }

    const passcode = data.passcode?.trim() || this.generatePasscode();
    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    const isInstant = !scheduledAt;

    let hostId = userId;
    if (!hostId) {
      const guestHost = await prisma.user.create({
        data: {
          email: `guest-host-${Date.now()}-${Math.random().toString(36).substring(2, 7)}@callivo.internal`,
          name: 'Guest Host',
          passwordHash: 'none',
          role: 'user',
        },
      });
      hostId = guestHost.id;
    }

    const host = await prisma.user.findUnique({ where: { id: hostId } });
    if (!host) throw new AppError('Host user not found', 404);

    const meeting = await prisma.meeting.create({
      data: {
        id: meetingId,
        title: data.title?.trim() || (isInstant ? 'Instant CALLIVO Session' : 'Scheduled CALLIVO Meeting'),
        passcode,
        hostId: hostId,
        scheduledAt,
        durationMinutes: data.durationMinutes || 45,
        timezone: data.timezone || host.timezone || 'UTC',
        waitingRoom: data.waitingRoom !== undefined ? data.waitingRoom : false,
        muteOnEntry: data.muteOnEntry !== undefined ? data.muteOnEntry : true,
        autoRecord: data.autoRecord !== undefined ? data.autoRecord : false,
        allowScreenShare: data.allowScreenShare !== undefined ? data.allowScreenShare : true,
        allowChat: data.allowChat !== undefined ? data.allowChat : true,
        allowReactions: data.allowReactions !== undefined ? data.allowReactions : true,
        status: isInstant ? 'active' : 'scheduled',
        startedAt: isInstant ? new Date() : null,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Create participant entry for the host
    await prisma.meetingParticipant.create({
      data: {
        meetingId: meeting.id,
        userId: host.id,
        role: 'host',
      },
    });

    // If invites were specified, send emails via Resend
    if (data.inviteEmails && data.inviteEmails.length > 0) {
      for (const email of data.inviteEmails) {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail.includes('@')) {
          await prisma.meetingInvite.create({
            data: {
              meetingId: meeting.id,
              userId: host.id,
              email: trimmedEmail,
            },
          });

          await emailService.sendMeetingInvitation(trimmedEmail, {
            id: meeting.id,
            title: meeting.title,
            hostName: host.name,
            scheduledAt: meeting.scheduledAt,
          });
        }
      }
    }

    return meeting;
  }

  /**
   * Get all meetings for user (hosted or invited)
   */
  async getUserMeetings(userId: string) {
    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { hostId: userId },
          { participants: { some: { userId } } },
        ],
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return meetings;
  }

  /**
   * Get meeting by ID
   */
  async getMeetingById(id: string, userId?: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting not found or invalid link.', 404);
    }

    const isHost = userId ? meeting.hostId === userId : false;

    return {
      ...meeting,
      isHost,
    };
  }

  /**
   * Join verification & lobby check
   */
  async joinLobby(meetingId: string, userId?: string, guestName?: string, passcode?: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting room does not exist.', 404);
    }

    if (meeting.isLocked) {
      throw new AppError('This meeting has been locked by the host.', 403);
    }

    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      throw new AppError('This meeting has already ended.', 410);
    }

    const isHost = userId ? meeting.hostId === userId : false;

    // Verify passcode if not host and passcode is provided
    if (!isHost && meeting.passcode && passcode && passcode !== meeting.passcode) {
      throw new AppError('Incorrect meeting passcode.', 401);
    }

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        waitingRoom: meeting.waitingRoom,
        muteOnEntry: meeting.muteOnEntry,
        isLocked: meeting.isLocked,
        hostName: meeting.host.name,
        hostAvatar: meeting.host.avatar,
        status: meeting.status,
      },
      isHost,
      requiresWaitingRoom: !isHost && meeting.waitingRoom,
    };
  }

  /**
   * Real REST Join: Validate meeting, passcode, and create/upsert participant in DB
   */
  async joinMeeting(meetingId: string, userId?: string, guestName?: string, passcode?: string) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!meeting) {
      throw new AppError('Meeting room does not exist.', 404);
    }

    if (meeting.isLocked) {
      throw new AppError('This meeting has been locked by the host.', 403);
    }

    if (meeting.status === 'ended' || meeting.status === 'cancelled') {
      throw new AppError('This meeting has already ended.', 410);
    }

    const isHost = userId ? meeting.hostId === userId : false;

    if (!isHost && meeting.passcode && passcode && passcode !== meeting.passcode) {
      throw new AppError('Incorrect meeting passcode.', 401);
    }

    let displayName = guestName?.trim() || 'Guest Participant';
    let avatarUrl: string | undefined = undefined;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        displayName = user.name;
        avatarUrl = user.avatar || undefined;
      }
    }

    // Upsert participant
    let participant;
    if (userId) {
      const existing = await prisma.meetingParticipant.findFirst({
        where: { meetingId, userId },
      });
      if (existing) {
        participant = await prisma.meetingParticipant.update({
          where: { id: existing.id },
          data: {
            leftAt: null,
            displayName,
            avatarUrl,
            role: isHost ? 'host' : existing.role,
          },
        });
      } else {
        participant = await prisma.meetingParticipant.create({
          data: {
            meetingId,
            userId,
            displayName,
            avatarUrl,
            role: isHost ? 'host' : 'participant',
          },
        });
      }
    } else {
      participant = await prisma.meetingParticipant.create({
        data: {
          meetingId,
          userId: null,
          displayName,
          avatarUrl,
          role: 'guest',
        },
      });
    }

    return {
      meeting: {
        id: meeting.id,
        title: meeting.title,
        waitingRoom: meeting.waitingRoom,
        muteOnEntry: meeting.muteOnEntry,
        isLocked: meeting.isLocked,
        hostName: meeting.host.name,
        hostAvatar: meeting.host.avatar,
        status: meeting.status,
      },
      participant: {
        id: participant.id,
        userId: participant.userId,
        displayName: participant.displayName,
        avatarUrl: participant.avatarUrl,
        role: participant.role,
        joinedAt: participant.joinedAt,
      },
      isHost,
      requiresWaitingRoom: !isHost && meeting.waitingRoom,
    };
  }

  /**
   * Leave meeting: Update leftAt timestamp
   */
  async leaveMeeting(meetingId: string, userId?: string, participantId?: string) {
    if (participantId) {
      await prisma.meetingParticipant.updateMany({
        where: { id: participantId, meetingId },
        data: { leftAt: new Date() },
      });
    } else if (userId) {
      await prisma.meetingParticipant.updateMany({
        where: { meetingId, userId, leftAt: null },
        data: { leftAt: new Date() },
      });
    }
    return { success: true };
  }

  /**
   * Get all active participants in a meeting
   */
  async getParticipants(meetingId: string) {
    const participants = await prisma.meetingParticipant.findMany({
      where: {
        meetingId,
        leftAt: null,
      },
      orderBy: { joinedAt: 'asc' },
    });
    return participants;
  }

  /**
   * Update meeting settings (lock, muteOnEntry, waitingRoom, etc.)
   */
  async updateMeeting(meetingId: string, hostId: string, updates: Partial<CreateMeetingDTO & { isLocked?: boolean }>) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== hostId) throw new AppError('Unauthorized: Only the host can modify meeting settings', 403);

    const updated = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        ...(updates.title && { title: updates.title.trim() }),
        ...(updates.passcode && { passcode: updates.passcode.trim() }),
        ...(updates.waitingRoom !== undefined && { waitingRoom: updates.waitingRoom }),
        ...(updates.muteOnEntry !== undefined && { muteOnEntry: updates.muteOnEntry }),
        ...(updates.autoRecord !== undefined && { autoRecord: updates.autoRecord }),
        ...(updates.allowScreenShare !== undefined && { allowScreenShare: updates.allowScreenShare }),
        ...(updates.allowChat !== undefined && { allowChat: updates.allowChat }),
        ...(updates.allowReactions !== undefined && { allowReactions: updates.allowReactions }),
        ...(updates.allowQuestions !== undefined && { allowQuestions: updates.allowQuestions }),
        ...(updates.allowComments !== undefined && { allowComments: updates.allowComments }),
        ...(updates.allowFileShare !== undefined && { allowFileShare: updates.allowFileShare }),
        ...(updates.allowRecording !== undefined && { allowRecording: updates.allowRecording }),
        ...(updates.isLocked !== undefined && { isLocked: updates.isLocked }),
      },
    });

    return updated;
  }

  async isHostOrCoHost(meetingId: string, userId: string): Promise<boolean> {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) return false;
    if (meeting.hostId === userId) return true;
    const participant = await prisma.meetingParticipant.findFirst({
      where: { meetingId, userId, role: { in: ['host', 'co_host'] } }
    });
    return !!participant;
  }

  // ===================== Q&A =====================
  async getQuestions(meetingId: string, currentUserId?: string) {
    const questions = await prisma.question.findMany({
      where: { meetingId },
      include: {
        votes: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return questions.map(q => {
      const upvotes = q.votes.filter(v => v.voteType === 'up').length;
      const downvotes = q.votes.filter(v => v.voteType === 'down').length;
      const userVote = currentUserId ? q.votes.find(v => v.userId === currentUserId)?.voteType : null;
      return {
        id: q.id,
        meetingId: q.meetingId,
        userId: q.userId,
        authorName: q.authorName,
        authorAvatar: q.authorAvatar,
        question: q.question,
        isAnswered: q.isAnswered,
        answer: q.answer,
        isPinned: q.isPinned,
        score: upvotes - downvotes,
        upvotes,
        downvotes,
        userVote: userVote || null,
        createdAt: q.createdAt,
      };
    });
  }

  async createQuestion(meetingId: string, data: { userId?: string; authorName: string; authorAvatar?: string; question: string }) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (!meeting.allowQuestions) throw new AppError('Q&A is disabled for this meeting', 403);

    const question = await prisma.question.create({
      data: {
        meetingId,
        userId: data.userId || null,
        authorName: data.authorName.trim() || 'Anonymous',
        authorAvatar: data.authorAvatar || null,
        question: data.question.trim(),
      },
      include: {
        votes: true,
      },
    });

    return {
      ...question,
      score: 0,
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    };
  }

  async voteQuestion(questionId: string, userId: string, voteType: 'up' | 'down') {
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new AppError('Question not found', 404);

    const existingVote = await prisma.questionVote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Toggle off
        await prisma.questionVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Change vote
        await prisma.questionVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });
      }
    } else {
      await prisma.questionVote.create({
        data: {
          questionId,
          userId,
          voteType,
        },
      });
    }

    return this.getQuestions(question.meetingId, userId);
  }

  async answerQuestion(meetingId: string, questionId: string, hostId: string, answer: string) {
    const isAuthorized = await this.isHostOrCoHost(meetingId, hostId);
    if (!isAuthorized) throw new AppError('Only hosts or co-hosts can answer questions', 403);

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        answer: answer.trim() || null,
        isAnswered: Boolean(answer.trim()),
      },
      include: { votes: true },
    });

    return updated;
  }

  async pinQuestion(meetingId: string, questionId: string, hostId: string, isPinned: boolean) {
    const isAuthorized = await this.isHostOrCoHost(meetingId, hostId);
    if (!isAuthorized) throw new AppError('Only hosts or co-hosts can pin questions', 403);

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { isPinned },
      include: { votes: true },
    });

    return updated;
  }

  // ===================== COMMENTS =====================
  async getComments(meetingId: string) {
    return prisma.meetingComment.findMany({
      where: { meetingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createComment(meetingId: string, data: { userId?: string; authorName: string; authorAvatar?: string; content: string }) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (!meeting.allowComments) throw new AppError('Live comments are disabled for this meeting', 403);

    return prisma.meetingComment.create({
      data: {
        meetingId,
        userId: data.userId || null,
        authorName: data.authorName.trim() || 'Anonymous',
        authorAvatar: data.authorAvatar || null,
        content: data.content.trim(),
      },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.meetingComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Comment not found', 404);

    const isAuthorized = comment.userId === userId || (await this.isHostOrCoHost(comment.meetingId, userId));
    if (!isAuthorized) throw new AppError('Unauthorized to delete comment', 403);

    await prisma.meetingComment.delete({ where: { id: commentId } });
    return { success: true };
  }

  // ===================== PARTICIPANT REPORTS =====================
  async createReport(meetingId: string, data: { reporterId?: string; reportedUserId?: string; reportedName: string; reason: string; details?: string }) {
    return prisma.participantReport.create({
      data: {
        meetingId,
        reporterId: data.reporterId || null,
        reportedUserId: data.reportedUserId || null,
        reportedName: data.reportedName,
        reason: data.reason,
        details: data.details || null,
      },
    });
  }

  /**
   * End meeting
   */
  async endMeeting(meetingId: string, hostId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== hostId) throw new AppError('Only the host can end the meeting', 403);

    const ended = await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: 'ended',
        endedAt: new Date(),
      },
    });

    return ended;
  }

  /**
   * Delete meeting
   */
  async deleteMeeting(meetingId: string, hostId: string) {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new AppError('Meeting not found', 404);
    if (meeting.hostId !== hostId) throw new AppError('Unauthorized', 403);

    await prisma.meeting.delete({ where: { id: meetingId } });
    return { success: true, message: 'Meeting deleted successfully' };
  }
}

export const meetingsService = new MeetingsService();
