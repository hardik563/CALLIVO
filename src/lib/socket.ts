import { io, Socket } from 'socket.io-client';
import { getAuthToken } from './api';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = getAuthToken();
    const socketUrl = import.meta.env.VITE_SERVER_URL || import.meta.env.VITE_API_URL || '/';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: {
        token,
      },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[CALLIVO Socket] Connected successfully:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[CALLIVO Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[CALLIVO Socket] Disconnected:', reason);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
