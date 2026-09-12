import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5000',
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  redisUrl: process.env.REDIS_URL || '',
  jwt: {
    secret: process.env.JWT_SECRET || 'callivo_default_jwt_secret_dev_key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'callivo_default_refresh_secret_dev_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'CALLIVO Support <onboarding@resend.dev>',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@callivo.com',
    supportPhone: process.env.SUPPORT_PHONE || '+1 (555) 019-2834',
  },
  webrtc: {
    stunServerUrl: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
    turnServerUrl: process.env.TURN_SERVER_URL || '',
    turnUsername: process.env.TURN_USERNAME || '',
    turnPassword: process.env.TURN_PASSWORD || '',
  },
};
