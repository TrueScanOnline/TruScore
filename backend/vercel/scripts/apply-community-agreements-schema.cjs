/**
 * Explicit WP-09 community_agreements schema setup.
 * Run only when authorised to migrate a target database:
 *   node backend/vercel/scripts/apply-community-agreements-schema.cjs
 * Requires DATABASE_URL or POSTGRES_URL.
 * Request handlers do not run this. WP-09 source delivery does not execute it.
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const sqlPath = path.join(__dirname, '../../../db/migrations/20261107_wp09_community_agreements.sql');

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
    console.log('community_agreements schema applied');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
