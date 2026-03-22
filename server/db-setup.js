
require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factchecker';
const isRemote = connectionString.includes('neon.tech') || connectionString.includes('render.com');
const pool = new Pool({
  connectionString,
  ssl: isRemote ? { rejectUnauthorized: false } : false
});

async function setup() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255),
        organization VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS verifications (
        id VARCHAR(12) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
