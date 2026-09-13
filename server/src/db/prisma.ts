import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Ensure Neon pooled URLs include pgbouncer=true and bounded connect_timeout
function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;
  if (!rawUrl.startsWith('postgres://') && !rawUrl.startsWith('postgresql://')) {
    return rawUrl;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.hostname.includes('-pooler') && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '15');
    }
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

const optimizedUrl = getOptimizedDatabaseUrl();
if (optimizedUrl && optimizedUrl !== process.env.DATABASE_URL) {
  process.env.DATABASE_URL = optimizedUrl;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: optimizedUrl
      ? {
          db: {
            url: optimizedUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

