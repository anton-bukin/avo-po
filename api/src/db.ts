import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/pspay',
});

export default pool;

export async function initDB() {
  // Schema and seed data are managed via docker-entrypoint-initdb.d SQL scripts.
  // This function only verifies connectivity.
  await pool.query('SELECT 1');
}
