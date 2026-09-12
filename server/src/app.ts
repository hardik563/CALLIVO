import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './common/error.middleware';
import { apiRateLimiter, authRateLimiter, helpdeskRateLimiter } from './common/rateLimiter';
import { authRouter } from './auth/auth.controller';
import { usersRouter } from './users/users.controller';
import { meetingsRouter } from './meetings/meetings.controller';
import { helpdeskRouter } from './helpdesk/helpdesk.controller';
import { contactsRouter } from './contacts/contacts.controller';
import { messagesRouter } from './messages/messages.controller';
import { calendarRouter } from './calendar/calendar.controller';
import { recordingsRouter } from './recordings/recordings.controller';
import { notificationsRouter } from './notifications/notifications.controller';
import { settingsRouter } from './settings/settings.controller';

const app = express();

// Allowed origins validator for Cloudflare tunnels, local development, and mobile devices
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/([a-zA-Z0-9-]+\.)*trycloudflare\.com(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/([a-zA-Z0-9-]+\.)*cloudflareaccess\.com(:\d+)?$/.test(origin)) return true;
  if (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL)) return true;
  return true;
};

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // Ensure STUN, TURN, WSS and media blobs are not blocked
}));
app.use(cors({
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin) ? (origin || true) : false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Global API rate limiter
app.use('/api', apiRateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CALLIVO Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// WebRTC ICE servers configuration endpoint (Dynamic STUN + TURN from environment)
app.get('/api/webrtc/ice-servers', (req, res) => {
  const stunUrl = process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302';
  const turnUrl = process.env.TURN_SERVER_URL;
  const turnUsername = process.env.TURN_USERNAME;
  const turnPassword = process.env.TURN_PASSWORD;

  const iceServers: any[] = [
    {
      urls: [
        stunUrl,
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun.services.mozilla.com',
      ],
    },
  ];

  // Only append TURN servers when valid credentials/URL are configured
  if (turnUrl) {
    const turnServer: any = {
      urls: turnUrl.includes(',') ? turnUrl.split(',').map((u: string) => u.trim()) : [turnUrl],
    };
    if (turnUsername) turnServer.username = turnUsername;
    if (turnPassword) turnServer.credential = turnPassword;
    iceServers.push(turnServer);
  }

  res.json({
    success: true,
    iceServers,
  });
});

// Route registration
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/helpdesk', helpdeskRateLimiter, helpdeskRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/recordings', recordingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/settings', settingsRouter);

// Serve uploaded assets (avatars, recordings, attachments)
const candidateUploadsPaths = [
  process.env.UPLOADS_PATH,
  path.resolve(__dirname, '../../uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(process.cwd(), '../uploads'),
].filter(Boolean) as string[];
const uploadsPath = candidateUploadsPaths.find(p => fs.existsSync(p)) || candidateUploadsPaths[1];
const recordingsPath = path.join(uploadsPath, 'recordings');
const avatarsPath = path.join(uploadsPath, 'avatars');
[uploadsPath, recordingsPath, avatarsPath].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});
app.use('/uploads', express.static(uploadsPath));

// Resolve and serve frontend static assets & SPA client fallback
const candidateDistPaths = [
  process.env.DIST_PATH,
  path.resolve(__dirname, '../../dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(process.cwd(), '../dist'),
].filter(Boolean) as string[];

const distPath = candidateDistPaths.find(p => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')));

if (distPath) {
  console.log(`[CALLIVO SPA] Serving frontend production bundle from: ${distPath}`);

  // Serve static assets with appropriate caching
  app.use(express.static(distPath, {
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // SPA fallback for all non-API GET routes
  app.get('*', (req, res, next) => {
    // Exclude API, Socket.IO, uploads, health check, and missing static file requests
    if (
      req.originalUrl.startsWith('/api') ||
      req.originalUrl.startsWith('/socket.io') ||
      req.originalUrl.startsWith('/uploads') ||
      req.originalUrl === '/health' ||
      req.path.startsWith('/assets/') ||
      /\.(js|css|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|mp4|webm|wav|mp3|webmanifest)$/i.test(req.path)
    ) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  console.warn('[CALLIVO SPA] Frontend dist directory not found. Run `npm run build` to generate production assets.');

  app.get('/', (_req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html>
        <head><title>CALLIVO - Build Required</title><meta charset="utf-8"><style>body{background:#0b0d10;color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}div{background:#13171f;border:1px solid #1e293b;padding:32px;border-radius:12px;max-width:520px;text-align:center}h1{color:#10b981;margin-bottom:12px}code{background:#0b0d10;padding:4px 8px;border-radius:4px;color:#38bdf8}</style></head>
        <body>
          <div>
            <h1>CALLIVO Unified Server Active</h1>
            <p>Backend API & WebSockets are listening on port 5000.</p>
            <p>Frontend production assets have not been built yet.</p>
            <p>Run <code>npm run build</code> in the root directory to generate the SPA bundle.</p>
          </div>
        </body>
      </html>
    `);
  });
}

// 404 handler for unmatched API routes and missing files
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
