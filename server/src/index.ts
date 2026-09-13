import http from 'http';
import path from 'path';
import { exec } from 'child_process';
import { Server as SocketIOServer } from 'socket.io';
import app, { isAllowedOrigin } from './app';
import { registerSignalingGateway } from './signaling/signaling.gateway';
import { prisma } from './db/prisma';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

const server = http.createServer(app);

// Setup Socket.IO for WebRTC signaling and real-time events
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin) ? (origin || true) : false);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

// Register WebRTC signaling handlers
registerSignalingGateway(io);

async function safeSchemaSync(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
    return;
  }

  // If using a pooled Neon URL, use direct unpooled endpoint for schema push to bypass PgBouncer advisory lock limitation
  let syncUrl = dbUrl;
  try {
    const parsed = new URL(dbUrl);
    if (parsed.hostname.includes('-pooler')) {
      parsed.hostname = parsed.hostname.replace('-pooler', '');
      parsed.searchParams.delete('pgbouncer');
      syncUrl = parsed.toString();
    }
  } catch {}

  console.log('[CALLIVO DB] Synchronizing database tables (bounded 25s timeout)...');
  return new Promise<void>((resolve) => {
    const env = { ...process.env, DATABASE_URL: syncUrl };
    exec(
      'npx prisma db push --skip-generate',
      {
        cwd: path.resolve(__dirname, '..'),
        env,
        timeout: 25000,
      },
      (error) => {
        if (error) {
          console.warn('[CALLIVO DB] Schema synchronization notice (non-fatal):', error.message);
        } else {
          console.log('[CALLIVO DB] Database schema synchronized successfully.');
        }
        resolve();
      }
    );
  });
}

async function initializeDatabase(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL || '';
  const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
  console.log(`[CALLIVO DB] Initializing database (Provider: ${isPostgres ? 'PostgreSQL/Neon' : 'SQLite'})...`);

  const maxAttempts = 3;
  let connected = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[CALLIVO DB] Connecting to database (attempt ${attempt}/${maxAttempts})...`);
      const connectPromise = prisma.$connect().then(() => prisma.$queryRaw`SELECT 1`);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timed out after 10000ms')), 10000)
      );

      await Promise.race([connectPromise, timeoutPromise]);
      connected = true;
      console.log('[CALLIVO DB] Database connected successfully.');
      break;
    } catch (err: any) {
      console.warn(`[CALLIVO DB] Connection attempt ${attempt} warning: ${err.message}`);
      if (attempt < maxAttempts) {
        console.log('[CALLIVO DB] Waiting 3s before retry...');
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  if (!connected) {
    console.error(
      '[CALLIVO DB] Notice: Neon PostgreSQL connection could not be established immediately during startup. The server remains online for WebRTC/SPA traffic; database queries will auto-reconnect on demand.'
    );
    return;
  }

  // Check if tables already exist
  try {
    await prisma.$queryRaw`SELECT 1 FROM "User" LIMIT 1`;
    console.log('[CALLIVO DB] Database schema is verified and ready.');
  } catch (schemaErr: any) {
    console.log('[CALLIVO DB] User table not detected or schema check notice:', schemaErr.message);
    if (isPostgres) {
      await safeSchemaSync();
    }
  }
}

async function bootstrap() {
  try {
    // 1. Immediately bind HTTP server so Render detects port 5000 in <1 second
    server.listen(PORT, () => {
      console.log('========================================================');
      console.log(`🚀 CALLIVO Unified Server listening on http://localhost:${PORT}`);
      console.log(`🌐 Web SPA Frontend: http://localhost:${PORT}`);
      console.log(`📡 REST API:          http://localhost:${PORT}/api`);
      console.log(`⚡ Realtime & WebRTC: http://localhost:${PORT}/socket.io`);
      console.log(`🩺 Health Endpoint:   http://localhost:${PORT}/health`);
      console.log(`🔒 Single Tunnel:     cloudflared tunnel --url http://localhost:${PORT}`);
      console.log('========================================================');
    });

    // 2. Initialize database connection with bounded timeout and safe retry
    initializeDatabase().catch((err) => {
      console.warn('[CALLIVO DB] Background database initialization notice:', err.message);
    });
  } catch (error) {
    console.error('Failed to start CALLIVO server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed, DB disconnected');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed, DB disconnected');
    process.exit(0);
  });
});

bootstrap();
