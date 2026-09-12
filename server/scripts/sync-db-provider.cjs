const fs = require('fs');
const path = require('path');

// Load environment variables if available
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch {}
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch {}

const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  process.exit(0);
}

const schema = fs.readFileSync(schemaPath, 'utf8');
const dbUrl = process.env.DATABASE_URL || '';

// If DATABASE_URL starts with postgres/postgresql, configure PostgreSQL provider; otherwise SQLite
const isPostgres = dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://');
const targetProvider = isPostgres ? 'postgresql' : 'sqlite';

const updated = schema.replace(
  /provider\s*=\s*"(sqlite|postgresql)"/,
  `provider = "${targetProvider}"`
);

if (updated !== schema) {
  fs.writeFileSync(schemaPath, updated, 'utf8');
  console.log(`[CALLIVO DB] Automatically configured Prisma provider to "${targetProvider}" based on DATABASE_URL.`);
} else {
  console.log(`[CALLIVO DB] Prisma provider is already set to "${targetProvider}".`);
}
