
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factchecker'
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verifications (
        id VARCHAR(12) PRIMARY KEY,
        input_text TEXT NOT NULL,
        truth_score DECIMAL(5,2) DEFAULT 0,
        claims_count INTEGER DEFAULT 0,
        full_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_verifications_created ON verifications(created_at DESC);
    `);
    console.log('✅ Database tables created successfully!');
  } catch (err) {
    console.error('❌ Database setup failed:', err.message);
  } finally {
    await pool.end();
  }
}

setup();
