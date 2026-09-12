import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AppError } from '../common/error.middleware';
import { emailService } from '../email/email.service';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO) {
    const emailNormalized = data.email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user and default settings in a transaction
    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        name: data.name.trim(),
        passwordHash,
        phone: data.phone?.trim(),
        avatar: data.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name.trim())}&backgroundColor=059669`,
        settings: {
          create: {},
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        bio: true,
        timezone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    // Generate JWT tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  /**
   * Log in user
   */
  async login(data: LoginDTO) {
    const emailNormalized = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new AppError('Invalid email or password.', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password.', 401);
    }

    // Update last seen
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'online', lastSeenAt: new Date() },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      bio: user.bio,
      timezone: user.timezone,
      role: user.role,
      status: 'online',
      createdAt: user.createdAt,
    };

    const tokens = await this.generateTokens(userResponse);

    return { user: userResponse, ...tokens };
  }

  /**
   * Refresh session tokens
   */
  async refreshTokens(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        sub: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          avatar: true,
          bio: true,
          timezone: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new AppError('User session expired.', 401);
      }

      const tokens = await this.generateTokens(user);
      return { user, ...tokens };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token.', 403);
    }
  }

  /**
   * Forgot password request
   */
  async forgotPassword(email: string) {
    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailNormalized } });

    if (!user) {
      // Do not leak email presence
      return { success: true, message: 'If an account exists with this email, a reset link has been dispatched.' };
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    await emailService.sendPasswordResetEmail(user.email, token);

    return { success: true, message: 'If an account exists with this email, a reset link has been dispatched.' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const resetEntry = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetEntry || resetEntry.usedAt || resetEntry.expiresAt < new Date()) {
      throw new AppError('Invalid or expired password reset token.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetEntry.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetEntry.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true, message: 'Password has been updated successfully.' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, oldPass: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const isValid = await bcrypt.compare(oldPass, user.passwordHash);
    if (!isValid) {
      throw new AppError('Current password is incorrect.', 400);
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { success: true, message: 'Password has been updated successfully.' };
  }

  /**
   * Generate access and refresh JWT tokens
   */
  private async generateTokens(user: { id: string; email: string; name: string; role: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as any,
    });

    const refreshToken = jwt.sign({ sub: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });

    // Store refresh token hash
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: uuidv4(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Log in or register via Google OAuth
   */
  async loginWithGoogle(data?: { email?: string; name?: string; avatar?: string; idToken?: string }) {
    if (!data || !data.email || typeof data.email !== 'string' || !data.email.trim()) {
      throw new AppError('Google account email is required.', 400);
    }

    const email = data.email.trim().toLowerCase();
    const name = data.name?.trim() || email.split('@')[0];
    const avatar =
      data.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff`;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      const randomPassword = uuidv4();
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          phone: '',
          avatar,
          timezone: 'Asia/Kolkata',
          settings: {
            create: {},
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          status: 'online',
          lastSeenAt: new Date(),
          avatar: user.avatar || avatar,
        },
      });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone || '',
      avatar: user.avatar || avatar,
      bio: user.bio,
      timezone: user.timezone,
      role: user.role,
      status: 'online',
      createdAt: user.createdAt,
    };

    const tokens = await this.generateTokens(user);
    return { user: userResponse, ...tokens };
  }
}

export const authService = new AuthService();
