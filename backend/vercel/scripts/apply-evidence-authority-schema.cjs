/**
 * Explicit Wave 4A evidence-authority schema setup.
 * Run once per database before serving /api/evidence-authority:
 *   node backend/vercel/scripts/apply-evidence-authority-schema.cjs
 * Requires DATABASE_URL or POSTGRES_URL. Request handlers do not run this.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const sqlPath = path.join(__dirname, '../../../db/migrations/20260928_wave4a_evidence_authority.sql');

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL or POSTGRES_URL is required');
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await pool.query(sql);
    console.log('evidence authority schema applied');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
