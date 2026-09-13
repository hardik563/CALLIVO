const { execSync } = require('child_process');
const path = require('path');

console.log('========================================================');
console.log('🚀 CALLIVO Production Container Startup Initialized');
console.log('========================================================');

// 1. Sync DB provider (PostgreSQL vs SQLite)
try {
  require('./sync-db-provider.cjs');
} catch (err) {
  console.warn('[CALLIVO DB] Sync warning:', err.message);
}

// 2. Sanitize and optimize DATABASE_URL for Neon PgBouncer connection pooling
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  try {
    const parsed = new URL(dbUrl);
    if (parsed.hostname.includes('-pooler') && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    if (!parsed.searchParams.has('connect_timeout')) {
      parsed.searchParams.set('connect_timeout', '15');
    }
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    process.env.DATABASE_URL = parsed.toString();
    console.log('[CALLIVO DB] Optimized Neon PostgreSQL connection parameters (pgbouncer & connect_timeout).');
  } catch (err) {
    console.warn('[CALLIVO DB] DATABASE_URL parsing note:', err.message);
  }
}

// 3. Start CALLIVO backend and SPA server immediately so PORT=5000 is open for Render
console.log(`[CALLIVO APP] Launching server process on port ${process.env.PORT || 5000}...`);
require('../dist/index.js');

