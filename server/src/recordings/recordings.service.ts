import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma';
import { AppError } from '../common/error.middleware';

export class RecordingsService {
  async getUserRecordings(userId: string) {
    const recordings = await prisma.recording.findMany({
      where: {
        meeting: {
          OR: [
            { hostId: userId },
            { participants: { some: { userId } } },
          ],
        },
      },
      include: {
        meeting: {
          select: { id: true, title: true, startedAt: true, endedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recordings;
  }

  async createRecording(userId: string, data: {
    meetingId: string;
    meetingTitle: string;
    duration?: string;
    size?: string;
    videoUrl?: string;
  }) {
    const recording = await prisma.recording.create({
      data: {
        meetingId: data.meetingId,
        meetingTitle: data.meetingTitle,
        duration: data.duration || '00:00',
        size: data.size || '0 MB',
        videoUrl: data.videoUrl || null,
        status: 'completed',
      },
    });

    return recording;
  }

  async saveUploadedRecording(userId: string, data: {
    meetingId: string;
    meetingTitle?: string;
    duration?: string;
    videoBase64: string;
    mimeType?: string;
  }) {
    if (!data.videoBase64) {
      throw new AppError('No recording video data provided', 400);
    }

    const meeting = await prisma.meeting.findUnique({ where: { id: data.meetingId } });
    const meetingTitle = data.meetingTitle || meeting?.title || 'CALLIVO Session Recording';

    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const isWebm = (data.mimeType && data.mimeType.includes('webm')) || data.videoBase64.includes('video/webm');
    const ext = isWebm ? 'webm' : 'mp4';
    const filename = `${recordingId}.${ext}`;

    const uploadsDir = path.resolve(__dirname, '../../../uploads/recordings');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);
    const cleanBase64 = data.videoBase64.replace(/^data:video\/[a-zA-Z0-9.-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    const sizeInMB = (buffer.length / (1024 * 1024)).toFixed(1);
    const sizeStr = `${sizeInMB} MB`;
    const videoUrl = `/uploads/recordings/${filename}`;

    const recording = await prisma.recording.create({
      data: {
        id: recordingId,
        meetingId: data.meetingId,
        meetingTitle,
        duration: data.duration || '00:00',
        size: sizeStr,
        videoUrl,
        status: 'completed',
      },
    });

    return recording;
  }

  async deleteRecording(userId: string, recordingId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: { meeting: true },
    });

    if (!recording) throw new AppError('Recording not found', 404);
    if (recording.meeting.hostId !== userId) {
      throw new AppError('Only the host can delete meeting recordings', 403);
    }

    // Try deleting file from disk
    if (recording.videoUrl) {
      try {
        const filePath = path.resolve(__dirname, '../../../', recording.videoUrl.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {
        console.warn('Failed to delete recording file from disk:', e);
      }
    }

    await prisma.recording.delete({ where: { id: recordingId } });
    return { success: true, message: 'Recording deleted' };
  }
}

export const recordingsService = new RecordingsService();
