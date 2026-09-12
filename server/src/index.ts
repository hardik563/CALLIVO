import http from 'http';
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

async function bootstrap() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully.');

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
  } catch (error) {
    console.error('Failed to bootstrap CALLIVO server:', error);
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
