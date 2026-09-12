import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from './users.service';
import { authenticateToken } from '../common/auth.middleware';
import path from 'path';
import fs from 'fs';

export const usersRouter = Router();

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  bio: z.string().max(300).optional().nullable(),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

function isValidImageBuffer(buffer: Buffer, format: string): boolean {
  if (buffer.length < 12) return false;
  if (format === 'png') {
    // 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  }
  if (format === 'jpeg' || format === 'jpg') {
    // 0xFF 0xD8 0xFF
    return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  }
  if (format === 'webp') {
    // "RIFF" at 0..3 and "WEBP" at 8..11
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    return riff === 'RIFF' && webp === 'WEBP';
  }
  return true;
}

// GET /api/users/profile & /api/users/me
const getProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await usersService.getProfile(req.user!.id);
    res.json({ success: true, data: profile, user: profile });
  } catch (err) {
    next(err);
  }
};
usersRouter.get('/profile', authenticateToken, getProfileHandler);
usersRouter.get('/me', authenticateToken, getProfileHandler);

// POST /api/users/avatar & /api/users/me/avatar
const avatarUploadHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image, dataUrl } = req.body;
    const rawImage = image || dataUrl;
    if (!rawImage || typeof rawImage !== 'string') {
      return res.status(400).json({ success: false, message: 'Image data is required.' });
    }

    // Support base64 data URI format: data:image/(png|jpeg|jpg|webp);base64,...
    const matches = rawImage.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
    if (!matches) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Only JPEG, PNG, and WEBP are supported.',
      });
    }

    const format = matches[1].toLowerCase() === 'jpg' ? 'jpeg' : matches[1].toLowerCase();
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 5MB limit check (5 * 1024 * 1024 bytes)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'Image size exceeds maximum 5MB limit.',
      });
    }

    // Verify binary magic bytes
    if (!isValidImageBuffer(buffer, format)) {
      return res.status(400).json({
        success: false,
        message: 'File content does not match a valid image.',
      });
    }

    const uploadsDir = path.resolve(__dirname, '../../../uploads/avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${req.user!.id}-${Date.now()}.${format === 'jpeg' ? 'jpg' : format}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const avatarUrl = `/uploads/avatars/${filename}`;
    await usersService.updateProfile(req.user!.id, { avatar: avatarUrl });

    res.json({
      success: true,
      message: 'Avatar uploaded and persisted successfully.',
      avatar: avatarUrl,
      avatarUrl,
    });
  } catch (err) {
    next(err);
  }
};
usersRouter.post('/avatar', authenticateToken, avatarUploadHandler);
usersRouter.post('/me/avatar', authenticateToken, avatarUploadHandler);

// DELETE /api/users/avatar & /api/users/me/avatar
const removeAvatarHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await usersService.updateProfile(req.user!.id, { avatar: null });
    res.json({
      success: true,
      message: 'Avatar removed successfully. Reverted to initials.',
      avatar: null,
      avatarUrl: null,
    });
  } catch (err) {
    next(err);
  }
};
usersRouter.delete('/avatar', authenticateToken, removeAvatarHandler);
usersRouter.delete('/me/avatar', authenticateToken, removeAvatarHandler);

// PATCH /api/users/profile & /api/users/me
const updateProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = UpdateProfileSchema.parse(req.body);
    const updated = await usersService.updateProfile(req.user!.id, validated);
    res.json({ success: true, data: updated, user: updated });
  } catch (err) {
    next(err);
  }
};
usersRouter.patch('/profile', authenticateToken, updateProfileHandler);
usersRouter.patch('/me', authenticateToken, updateProfileHandler);

// GET /api/users/search?q=...
usersRouter.get('/search', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = String(req.query.q || '');
    const results = await usersService.searchUsers(q, req.user!.id);
    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
});
