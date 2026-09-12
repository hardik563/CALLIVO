import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';

export interface ParticipantState {
  socketId: string;
  participantId?: string;
  userId?: string;
  name: string;
  avatar?: string;
  role: 'host' | 'co-host' | 'participant' | 'guest';
  isAudioMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  networkQuality: 'excellent' | 'good' | 'poor';
  joinedAt: Date;
}

export interface WaitingParticipant {
  socketId: string;
  userId?: string;
  name: string;
  avatar?: string;
  requestedAt: Date;
}

interface RoomData {
  meetingId: string;
  hostSocketId?: string;
  isLocked: boolean;
  waitingRoom: boolean;
  participants: Map<string, ParticipantState>; // socketId -> ParticipantState
  waitingList: Map<string, WaitingParticipant>; // socketId -> WaitingParticipant
}

// In-memory room registry
const rooms = new Map<string, RoomData>();

function getOrCreateRoom(meetingId: string, waitingRoomEnabled = false): RoomData {
  let room = rooms.get(meetingId);
  if (!room) {
    room = {
      meetingId,
      isLocked: false,
      waitingRoom: waitingRoomEnabled,
      participants: new Map(),
      waitingList: new Map(),
    };
    rooms.set(meetingId, room);
  }
  return room;
}

export function registerSignalingGateway(io: Server) {
  // Socket Authentication Middleware: verifies JWT token or establishes unique guest identity
  io.use(async (socket: Socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (socket.handshake.headers['authorization']?.startsWith('Bearer ')
          ? socket.handshake.headers['authorization'].split(' ')[1]
          : undefined);

      if (rawToken && rawToken !== 'undefined' && rawToken !== 'null' && rawToken.trim() !== '') {
        try {
          const decoded = jwt.verify(rawToken, config.jwt.secret) as { sub: string };
          const user = await prisma.user.findUnique({
            where: { id: decoded.sub },
            select: { id: true, email: true, name: true, avatar: true, role: true },
          });
          if (user) {
            socket.data.user = user;
            console.log(`[AUTH] Socket ${socket.id} authenticated as: ${user.name} (${user.id})`);
            return next();
          }
        } catch (jwtErr) {
          console.warn(`[AUTH] Invalid token on socket ${socket.id}, assigning guest identity`);
        }
      }

      // Guest socket: completely isolated unique guest session
      socket.data.user = null;
      socket.data.guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
      console.log(`[AUTH] Socket ${socket.id} assigned unique guest identity: ${socket.data.guestId}`);
      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    let currentMeetingId: string | null = null;
    let currentUserSocketId = socket.id;

    // --- JOIN / LOBBY FLOW ---
    socket.on('meeting:join', async (payload: {
      meetingId: string;
      userId?: string;
      name: string;
      avatar?: string;
      passcode?: string;
      initialAudioMuted?: boolean;
      initialVideoOff?: boolean;
    }) => {
      try {
        const meetingId = payload.meetingId?.trim().toLowerCase();
        currentMeetingId = meetingId;

        // 1. Verify meeting exists in DB
        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          include: { host: true },
        });

        if (!meeting) {
          console.warn(`[JOIN] Rejected: Meeting ${meetingId} does not exist in DB`);
          socket.emit('meeting:error', { message: 'Meeting room does not exist.' });
          return;
        }

        if (meeting.isLocked) {
          console.warn(`[JOIN] Rejected: Meeting ${meetingId} is locked`);
          socket.emit('meeting:error', { message: 'Meeting is locked by the host.' });
          return;
        }

        if (meeting.status === 'ended' || meeting.status === 'cancelled') {
          console.warn(`[JOIN] Rejected: Meeting ${meetingId} has ended`);
          socket.emit('meeting:error', { message: 'This meeting has already concluded.' });
          return;
        }

        const room = getOrCreateRoom(meetingId, meeting.waitingRoom);

        // 2. Determine authentic identity (Socket session takes priority, then DB lookup, then guest)
        const authUser = socket.data.user;
        const resolvedUserId = authUser?.id || (payload.userId && payload.userId !== 'undefined' ? payload.userId : null);
        const isHost = Boolean(
          (authUser && meeting.hostId === authUser.id) ||
          (resolvedUserId && meeting.hostId === resolvedUserId) ||
          (!room.hostSocketId && room.participants.size === 0)
        );

        let participantName = authUser?.name || payload.name?.trim() || 'Guest Participant';
        let participantAvatar = authUser?.avatar || payload.avatar;

        if (!authUser && resolvedUserId) {
          const dbUser = await prisma.user.findUnique({
            where: { id: resolvedUserId },
            select: { id: true, name: true, avatar: true },
          });
          if (dbUser) {
            participantName = dbUser.name;
            participantAvatar = dbUser.avatar || undefined;
          }
        }

        if (!participantAvatar) {
          participantAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(participantName)}&backgroundColor=059669`;
        }

        // 3. Check passcode if required and not host
        if (!isHost && meeting.passcode && payload.passcode && payload.passcode !== meeting.passcode) {
          console.warn(`[JOIN] Rejected: Incorrect passcode for meeting ${meetingId}`);
          socket.emit('meeting:error', { message: 'Incorrect meeting passcode.' });
          return;
        }

        if (isHost) {
          room.hostSocketId = socket.id;
        }

        // 4. Waiting room check (only for non-hosts when waitingRoom is enabled)
        if (!isHost && room.waitingRoom) {
          const waitingEntry: WaitingParticipant = {
            socketId: socket.id,
            userId: resolvedUserId || undefined,
            name: participantName,
            avatar: participantAvatar,
            requestedAt: new Date(),
          };
          room.waitingList.set(socket.id, waitingEntry);

          socket.join(`waiting:${meetingId}`);
          socket.emit('meeting:waiting', {
            message: 'Waiting for the host to admit you into the meeting...',
            meetingTitle: meeting.title,
            hostName: meeting.host.name,
          });

          console.log(`[JOIN] Participant placed in waiting room: ${participantName} (${socket.id}) for meeting ${meetingId}`);

          // Notify host with notification banner
          if (room.hostSocketId) {
            io.to(room.hostSocketId).emit('lobby:participant-waiting', waitingEntry);
          }
          return;
        }

        // 5. Participant admitted to meeting
        await admitParticipantToRoom(io, socket, room, {
          userId: resolvedUserId || undefined,
          name: participantName,
          avatar: participantAvatar,
          role: isHost ? 'host' : (authUser ? 'participant' : 'guest'),
          isAudioMuted: payload.initialAudioMuted ?? (meeting.muteOnEntry || false),
          isVideoOff: payload.initialVideoOff ?? false,
        });

      } catch (err: any) {
        console.error('[JOIN] Exception joining meeting:', err);
        socket.emit('meeting:error', { message: err.message || 'Failed to join meeting.' });
      }
    });

    // --- HOST ADMITS / REJECTS WAITING PARTICIPANT ---
    socket.on('lobby:admit', async (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;

      const waiting = room.waitingList.get(payload.targetSocketId);
      if (!waiting) return;

      room.waitingList.delete(payload.targetSocketId);
      const targetSocket = io.sockets.sockets.get(payload.targetSocketId);
      if (targetSocket) {
        targetSocket.leave(`waiting:${payload.meetingId}`);
        await admitParticipantToRoom(io, targetSocket, room, {
          userId: waiting.userId,
          name: waiting.name,
          avatar: waiting.avatar,
          role: 'participant',
          isAudioMuted: true,
          isVideoOff: false,
        });
      }
    });

    socket.on('lobby:reject', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;

      room.waitingList.delete(payload.targetSocketId);
      const targetSocket = io.sockets.sockets.get(payload.targetSocketId);
      if (targetSocket) {
        targetSocket.emit('meeting:error', { message: 'The host has denied admission to this meeting.' });
        targetSocket.disconnect(true);
      }
    });

    socket.on('lobby:admit-all', async (payload: { meetingId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;

      for (const [waitingSocketId, waiting] of Array.from(room.waitingList.entries())) {
        room.waitingList.delete(waitingSocketId);
        const targetSocket = io.sockets.sockets.get(waitingSocketId);
        if (targetSocket) {
          targetSocket.leave(`waiting:${payload.meetingId}`);
          await admitParticipantToRoom(io, targetSocket, room, {
            userId: waiting.userId,
            name: waiting.name,
            avatar: waiting.avatar,
            role: 'participant',
            isAudioMuted: true,
            isVideoOff: false,
          });
        }
      }
    });

    // --- WEBRTC SIGNALING (OFFER, ANSWER, ICE CANDIDATE) ---
    socket.on('webrtc:offer', (payload: { toSocketId: string; sdp: any }) => {
      io.to(payload.toSocketId).emit('webrtc:offer', {
        fromSocketId: socket.id,
        sdp: payload.sdp,
      });
    });

    socket.on('webrtc:answer', (payload: { toSocketId: string; sdp: any }) => {
      io.to(payload.toSocketId).emit('webrtc:answer', {
        fromSocketId: socket.id,
        sdp: payload.sdp,
      });
    });

    socket.on('webrtc:ice-candidate', (payload: { toSocketId: string; candidate: any }) => {
      io.to(payload.toSocketId).emit('webrtc:ice-candidate', {
        fromSocketId: socket.id,
        candidate: payload.candidate,
      });
    });

    // --- MEDIA STATE CHANGES ---
    socket.on('media:toggle-audio', (payload: { meetingId: string; isMuted: boolean }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.isAudioMuted = payload.isMuted;
        socket.to(`room:${payload.meetingId}`).emit('participant:audio-toggled', {
          socketId: socket.id,
          isAudioMuted: payload.isMuted,
        });
      }
    });

    socket.on('media:toggle-video', (payload: { meetingId: string; isVideoOff: boolean }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.isVideoOff = payload.isVideoOff;
        socket.to(`room:${payload.meetingId}`).emit('participant:video-toggled', {
          socketId: socket.id,
          isVideoOff: payload.isVideoOff,
        });
      }
    });

    socket.on('media:toggle-screen', (payload: { meetingId: string; isScreenSharing: boolean }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.isScreenSharing = payload.isScreenSharing;
        socket.to(`room:${payload.meetingId}`).emit('participant:screen-toggled', {
          socketId: socket.id,
          isScreenSharing: payload.isScreenSharing,
        });
      }
    });

    socket.on('media:active-speaker', (payload: { meetingId: string; isSpeaking: boolean }) => {
      socket.to(`room:${payload.meetingId}`).emit('participant:active-speaker', {
        socketId: socket.id,
        isSpeaking: payload.isSpeaking,
      });
    });

    socket.on('media:quality', (payload: { meetingId: string; quality: 'excellent' | 'good' | 'poor' }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.networkQuality = payload.quality;
        socket.to(`room:${payload.meetingId}`).emit('participant:quality-changed', {
          socketId: socket.id,
          quality: payload.quality,
        });
      }
    });

    // --- INTERACTIVITY: CHAT, REACTIONS, HAND RAISE ---
    socket.on('chat:message', async (payload: {
      meetingId: string;
      message: string;
      senderName: string;
      toSocketId?: string; // for private message
    }) => {
      const messageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        senderSocketId: socket.id,
        senderName: payload.senderName,
        message: payload.message,
        timestamp: new Date().toISOString(),
        isPrivate: !!payload.toSocketId,
      };

      if (payload.toSocketId) {
        // Send to targeted peer and self
        io.to(payload.toSocketId).emit('chat:message', messageData);
        socket.emit('chat:message', messageData);
      } else {
        // Broadcast to everyone in room
        io.to(`room:${payload.meetingId}`).emit('chat:message', messageData);
      }
    });

    socket.on('reaction:send', (payload: { meetingId: string; emoji: string; senderName: string }) => {
      io.to(`room:${payload.meetingId}`).emit('reaction:received', {
        id: `react-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        emoji: payload.emoji,
        senderName: payload.senderName,
        senderSocketId: socket.id,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('hand:toggle', (payload: { meetingId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.isHandRaised = !participant.isHandRaised;
        io.to(`room:${payload.meetingId}`).emit('participant:hand-toggled', {
          socketId: socket.id,
          isHandRaised: participant.isHandRaised,
          name: participant.name,
        });
      }
    });

    // --- HOST MANAGEMENT CONTROLS ---
    const isHostOrCoHost = (room: RoomData, socketId: string) => {
      if (room.hostSocketId === socketId) return true;
      const p = room.participants.get(socketId);
      return p?.role === 'host' || p?.role === 'co-host';
    };

    socket.on('host:mute-participant', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(payload.targetSocketId).emit('host:force-mute');
    });

    socket.on('host:ask-unmute', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(payload.targetSocketId).emit('host:prompt-unmute', {
        hostName: room.participants.get(socket.id)?.name || 'Host',
      });
    });

    socket.on('host:stop-video', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(payload.targetSocketId).emit('host:force-video-off');
    });

    socket.on('host:ask-video', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(payload.targetSocketId).emit('host:prompt-video', {
        hostName: room.participants.get(socket.id)?.name || 'Host',
      });
    });

    socket.on('host:mute-all', (payload: { meetingId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      socket.to(`room:${payload.meetingId}`).emit('host:force-mute');
    });

    socket.on('host:lower-hand', (payload: { meetingId: string; targetSocketId?: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      if (payload.targetSocketId) {
        const target = room.participants.get(payload.targetSocketId);
        if (target) {
          target.isHandRaised = false;
          io.to(`room:${payload.meetingId}`).emit('participant:hand-toggled', {
            socketId: payload.targetSocketId,
            isHandRaised: false,
            name: target.name,
          });
        }
      } else {
        // Lower all hands
        for (const [sId, p] of room.participants.entries()) {
          if (p.isHandRaised) {
            p.isHandRaised = false;
            io.to(`room:${payload.meetingId}`).emit('participant:hand-toggled', {
              socketId: sId,
              isHandRaised: false,
              name: p.name,
            });
          }
        }
      }
    });

    socket.on('host:promote-cohost', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return; // Only primary host can promote
      const target = room.participants.get(payload.targetSocketId);
      if (target) {
        target.role = 'co-host';
        io.to(`room:${payload.meetingId}`).emit('participant:role-changed', {
          socketId: payload.targetSocketId,
          role: 'co-host',
          name: target.name,
        });
      }
    });

    socket.on('host:demote-cohost', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;
      const target = room.participants.get(payload.targetSocketId);
      if (target) {
        target.role = 'participant';
        io.to(`room:${payload.meetingId}`).emit('participant:role-changed', {
          socketId: payload.targetSocketId,
          role: 'participant',
          name: target.name,
        });
      }
    });

    socket.on('host:transfer-host', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;
      const target = room.participants.get(payload.targetSocketId);
      if (target) {
        const oldHost = room.participants.get(socket.id);
        if (oldHost) oldHost.role = 'co-host';
        target.role = 'host';
        room.hostSocketId = payload.targetSocketId;
        io.to(`room:${payload.meetingId}`).emit('host:transferred', {
          newHostSocketId: target.socketId,
          newHostName: target.name,
        });
      }
    });

    socket.on('host:put-in-waiting-room', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      const target = room.participants.get(payload.targetSocketId);
      if (!target) return;

      room.participants.delete(payload.targetSocketId);
      const waitingEntry: WaitingParticipant = {
        socketId: payload.targetSocketId,
        userId: target.userId,
        name: target.name,
        avatar: target.avatar,
        requestedAt: new Date(),
      };
      room.waitingList.set(payload.targetSocketId, waitingEntry);

      const targetSocket = io.sockets.sockets.get(payload.targetSocketId);
      if (targetSocket) {
        targetSocket.leave(`room:${payload.meetingId}`);
        targetSocket.join(`waiting:${payload.meetingId}`);
        targetSocket.emit('meeting:put-in-waiting-room', {
          message: 'You have been placed in the waiting room by the host.',
        });
      }

      io.to(`room:${payload.meetingId}`).emit('participant:left', {
        socketId: payload.targetSocketId,
        userId: target.userId,
        name: target.name,
      });

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit('lobby:participant-waiting', waitingEntry);
      }
    });

    socket.on('host:spotlight', (payload: { meetingId: string; targetSocketId: string | null }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(`room:${payload.meetingId}`).emit('room:spotlight', {
        spotlightSocketId: payload.targetSocketId,
      });
    });

    socket.on('host:remove-participant', (payload: { meetingId: string; targetSocketId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(payload.targetSocketId).emit('host:removed', {
        message: 'You have been removed from the meeting by the host.',
      });
      const targetSocket = io.sockets.sockets.get(payload.targetSocketId);
      if (targetSocket) {
        targetSocket.disconnect(true);
      }
    });

    socket.on('host:lock-room', (payload: { meetingId: string; isLocked: boolean }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      room.isLocked = payload.isLocked;
      io.to(`room:${payload.meetingId}`).emit('meeting:lock-status', { isLocked: payload.isLocked });
    });

    socket.on('host:update-settings', (payload: { meetingId: string; settings: any }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      if (payload.settings.waitingRoom !== undefined) {
        room.waitingRoom = payload.settings.waitingRoom;
      }
      io.to(`room:${payload.meetingId}`).emit('room:settings-updated', payload.settings);
    });

    // --- RECORDING SYNC ---
    socket.on('recording:status', (payload: { meetingId: string; isRecording: boolean; startedAt?: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || !isHostOrCoHost(room, socket.id)) return;
      io.to(`room:${payload.meetingId}`).emit('recording:status-changed', {
        isRecording: payload.isRecording,
        startedAt: payload.startedAt,
        triggeredByName: room.participants.get(socket.id)?.name || 'Host',
      });
    });

    // --- LIVE SPEECH CAPTIONS ---
    socket.on('captions:transcript', (payload: { meetingId: string; text: string; isFinal: boolean; speakerName?: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room) return;
      const speaker = room.participants.get(socket.id);
      io.to(`room:${payload.meetingId}`).emit('captions:broadcast', {
        socketId: socket.id,
        speakerName: payload.speakerName || speaker?.name || 'Participant',
        text: payload.text,
        isFinal: payload.isFinal,
        timestamp: new Date().toISOString(),
      });
    });

    // --- REALTIME Q&A & COMMENTS NOTIFICATIONS ---
    socket.on('qa:broadcast', (payload: { meetingId: string; action: 'created' | 'voted' | 'answered' | 'pinned'; question: any }) => {
      io.to(`room:${payload.meetingId}`).emit('qa:updated', payload);
    });

    socket.on('comment:broadcast', (payload: { meetingId: string; comment: any }) => {
      io.to(`room:${payload.meetingId}`).emit('comment:created', payload.comment);
    });

    socket.on('host:end-meeting', async (payload: { meetingId: string }) => {
      const room = rooms.get(payload.meetingId);
      if (!room || room.hostSocketId !== socket.id) return;

      io.to(`room:${payload.meetingId}`).emit('meeting:ended', {
        message: 'The host has ended the meeting for all participants.',
      });

      // Update DB
      try {
        await prisma.meeting.update({
          where: { id: payload.meetingId },
          data: { status: 'ended', endedAt: new Date() },
        });
      } catch (err) {
        console.error('Error updating ended meeting:', err);
      }

      rooms.delete(payload.meetingId);
    });

    // --- DISCONNECT HANDLING ---
    socket.on('disconnect', async () => {
      if (currentMeetingId) {
        const room = rooms.get(currentMeetingId);
        if (room) {
          // Remove from waiting list if pending
          if (room.waitingList.has(socket.id)) {
            room.waitingList.delete(socket.id);
            if (room.hostSocketId) {
              io.to(room.hostSocketId).emit('lobby:participant-cancelled', { socketId: socket.id });
            }
          }

          // Remove from active participants
          if (room.participants.has(socket.id)) {
            const participant = room.participants.get(socket.id);
            room.participants.delete(socket.id);

            // Update leftAt in database
            try {
              await prisma.meetingParticipant.updateMany({
                where: {
                  meetingId: currentMeetingId,
                  socketId: socket.id,
                  leftAt: null,
                },
                data: { leftAt: new Date() },
              });
              console.log(`[DISCONNECT] Participant left DB marked: ${participant?.name} (${socket.id}) in ${currentMeetingId}`);
            } catch (dbErr) {
              console.warn('[DISCONNECT] Error updating leftAt in DB:', dbErr);
            }

            // Broadcast participant left to remaining peers
            socket.to(`room:${currentMeetingId}`).emit('participant:left', {
              socketId: socket.id,
              participantId: participant?.participantId || socket.id,
              userId: participant?.userId,
              name: participant?.name,
            });
            console.log(`[BROADCAST] participant:left broadcast in room:${currentMeetingId} for ${participant?.name}`);

            // If host left, assign new host or clean up room
            if (room.hostSocketId === socket.id) {
              const remaining = Array.from(room.participants.values());
              if (remaining.length > 0) {
                const nextHost = remaining[0];
                nextHost.role = 'host';
                room.hostSocketId = nextHost.socketId;
                io.to(`room:${currentMeetingId}`).emit('host:transferred', {
                  newHostSocketId: nextHost.socketId,
                  newHostName: nextHost.name,
                });
                console.log(`[HOST] Host transferred to ${nextHost.name} (${nextHost.socketId})`);
              } else {
                rooms.delete(currentMeetingId);
                console.log(`[ROOM] Room closed: ${currentMeetingId}`);
              }
            }
          }
        }
      }
    });
  });
}

async function admitParticipantToRoom(
  io: Server,
  socket: Socket,
  room: RoomData,
  details: {
    userId?: string;
    name: string;
    avatar?: string;
    role: 'host' | 'co-host' | 'participant' | 'guest';
    isAudioMuted: boolean;
    isVideoOff: boolean;
  }
) {
  // 1. Create/upsert participant in Database
  let dbParticipantId: string = socket.id;
  try {
    if (details.userId) {
      const existing = await prisma.meetingParticipant.findFirst({
        where: { meetingId: room.meetingId, userId: details.userId },
      });
      if (existing) {
        const updated = await prisma.meetingParticipant.update({
          where: { id: existing.id },
          data: {
            socketId: socket.id,
            displayName: details.name,
            avatarUrl: details.avatar,
            role: details.role,
            isMuted: details.isAudioMuted,
            isCameraOff: details.isVideoOff,
            leftAt: null,
            connection: 'excellent',
          },
        });
        dbParticipantId = updated.id;
      } else {
        const created = await prisma.meetingParticipant.create({
          data: {
            meetingId: room.meetingId,
            userId: details.userId,
            socketId: socket.id,
            displayName: details.name,
            avatarUrl: details.avatar,
            role: details.role,
            isMuted: details.isAudioMuted,
            isCameraOff: details.isVideoOff,
            connection: 'excellent',
          },
        });
        dbParticipantId = created.id;
      }
    } else {
      const created = await prisma.meetingParticipant.create({
        data: {
          meetingId: room.meetingId,
          userId: null,
          socketId: socket.id,
          displayName: details.name,
          avatarUrl: details.avatar,
          role: details.role,
          isMuted: details.isAudioMuted,
          isCameraOff: details.isVideoOff,
          connection: 'excellent',
        },
      });
      dbParticipantId = created.id;
    }
    console.log(`[JOIN] Participant persisted in DB: ${details.name} (id: ${dbParticipantId}, socket: ${socket.id})`);
  } catch (dbErr) {
    console.warn('[JOIN] Warning persisting participant in DB:', dbErr);
  }

  const participantState: ParticipantState = {
    socketId: socket.id,
    participantId: dbParticipantId,
    userId: details.userId,
    name: details.name,
    avatar: details.avatar,
    role: details.role,
    isAudioMuted: details.isAudioMuted,
    isVideoOff: details.isVideoOff,
    isScreenSharing: false,
    isHandRaised: false,
    networkQuality: 'excellent',
    joinedAt: new Date(),
  };

  // 2. Add to in-memory room map and join Socket.IO room
  room.participants.set(socket.id, participantState);
  socket.join(`room:${room.meetingId}`);
  console.log(`[SOCKET] Socket ${socket.id} joined room:${room.meetingId}`);

  // 3. Get existing peers before broadcast
  const allParticipants = Array.from(room.participants.values());
  const otherParticipants = allParticipants.filter((p) => p.socketId !== socket.id);

  // 4. Send official join acknowledgement
  socket.emit('meeting:join:ack', {
    success: true,
    meetingId: room.meetingId,
    participantId: dbParticipantId,
    socketId: socket.id,
    userId: details.userId,
    role: details.role,
    displayName: details.name,
    avatarUrl: details.avatar,
    joinedAt: participantState.joinedAt.toISOString(),
  });

  // 5. Send authoritative meeting state containing ALL participants
  socket.emit('meeting:state', {
    meetingId: room.meetingId,
    participants: allParticipants,
  });

  // 6. Send room:joined event for compatibility
  socket.emit('room:joined', {
    meetingId: room.meetingId,
    self: participantState,
    existingParticipants: otherParticipants,
    isHost: details.role === 'host',
  });

  // 7. Broadcast participant:joined to all other participants in the room
  socket.to(`room:${room.meetingId}`).emit('participant:joined', participantState);
  console.log(`[BROADCAST] participant:joined emitted to room:${room.meetingId} for ${details.name} (${socket.id})`);

  // 8. If this participant is host, send current waiting list
  if (details.role === 'host') {
    const waitingArray = Array.from(room.waitingList.values());
    if (waitingArray.length > 0) {
      socket.emit('lobby:waiting-list', waitingArray);
    }
  }
}
