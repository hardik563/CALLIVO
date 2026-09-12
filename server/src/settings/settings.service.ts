import { prisma } from '../db/prisma';

export class SettingsService {
  async getSettings(userId: string) {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: any) {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(data.theme !== undefined && { theme: data.theme }),
        ...(data.audioNoiseSuppression !== undefined && { audioNoiseSuppression: data.audioNoiseSuppression }),
        ...(data.audioEchoCancellation !== undefined && { audioEchoCancellation: data.audioEchoCancellation }),
        ...(data.audioAutoGainControl !== undefined && { audioAutoGainControl: data.audioAutoGainControl }),
        ...(data.videoResolution !== undefined && { videoResolution: data.videoResolution }),
        ...(data.videoFramerate !== undefined && { videoFramerate: data.videoFramerate }),
        ...(data.virtualBackground !== undefined && { virtualBackground: data.virtualBackground }),
        ...(data.emailNotifications !== undefined && { emailNotifications: data.emailNotifications }),
        ...(data.inAppNotifications !== undefined && { inAppNotifications: data.inAppNotifications }),
        ...(data.meetingReminders !== undefined && { meetingReminders: data.meetingReminders }),
      },
      create: {
        userId,
        ...data,
      },
    });

    return settings;
  }
}

export const settingsService = new SettingsService();
