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

// 2. Synchronize PostgreSQL database schema if DATABASE_URL is configured
const dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('[CALLIVO DB] Remote PostgreSQL detected. Synchronizing database tables...');
  try {
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
    console.log('[CALLIVO DB] Database schema synchronized successfully.');
  } catch (err) {
    console.error('[CALLIVO DB] Note on schema synchronization:', err.message);
  }
}

// 3. Start CALLIVO backend and SPA server
console.log('[CALLIVO APP] Launching server process...');
require('../dist/index.js');
