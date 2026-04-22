const { Pool } = require('pg');

let pool = null;

const initDB = async () => {
  try {
    let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factchecker';
    if (connectionString.includes('neon.tech') && !connectionString.includes('sslmode')) {
      connectionString += (connectionString.includes('?') ? '&' : '?') + 'sslmode=require';
    }
    
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('sslmode=verify-full') 
        ? { rejectUnauthorized: false } 
        : false
    });

    // Test connection
    await pool.query('SELECT NOW()');

    // Auto-create tables
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

      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        type VARCHAR(100),
        trust DECIMAL,
        bias DECIMAL,
        transparency VARCHAR(100),
        status VARCHAR(100),
        attributes JSONB
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        requests_count INTEGER DEFAULT 0,
        requests_limit INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS forensics (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        input_preview TEXT,
        verdict VARCHAR(255),
        overall_score DECIMAL(5,2),
        full_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS source_adjustments (
        id SERIAL PRIMARY KEY,
        domain VARCHAR(255),
        suggested_trust DECIMAL,
        suggested_bias DECIMAL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
          ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organization') THEN
          ALTER TABLE users ADD COLUMN organization VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='google_id') THEN
          ALTER TABLE users ADD COLUMN google_id VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
          ALTER TABLE users ADD COLUMN avatar_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verifications' AND column_name='user_id') THEN
          ALTER TABLE verifications ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // Prepopulate
    const sourcesCount = await pool.query('SELECT COUNT(*) FROM sources');
    if (sourcesCount.rows[0].count === '0') {
      const initialSources = [
        { domain: 'reuters.com', name: 'Reuters News', type: 'News Agency', trust: 96, bias: 0, transparency: 'High', status: 'Verified', attributes: ['Wire Service', 'OSINT Gold Standard', 'Neutral'] },
        { domain: 'apnews.com', name: 'Associated Press', type: 'News Agency', trust: 98, bias: -5, transparency: 'High', status: 'Verified', attributes: ['Independent', 'Wire Service', 'Historical Reliability'] },
        { domain: 'google.com', name: 'Google News Archive', type: 'Search Engine', trust: 92, bias: 0, transparency: 'Medium', status: 'Verified', attributes: ['Consolidated Feed', 'Deep Index'] },
        { domain: 'aljazeera.com', name: 'Al Jazeera', type: 'Network', trust: 84, bias: -15, transparency: 'Medium', status: 'Verified', attributes: ['Middle East Focus', 'Agentic Research'] },
        { domain: 'infowars.com', name: 'InfoWars', type: 'Conspiracy', trust: 4, bias: 100, transparency: 'None', status: 'Hazard', attributes: ['Known Disinformation', 'Banned Archive'] },
        { domain: 'rt.com', name: 'RT News', type: 'State Media', trust: 18, bias: 90, transparency: 'None', status: 'Hazard', attributes: ['Government Controlled', 'Heavy Bias'] },
        { domain: 'theepochtimes.com', name: 'The Epoch Times', type: 'Propaganda', trust: 26, bias: 85, transparency: 'Low', status: 'Caution', attributes: ['Polarizing', 'Coordinated Action'] },
        { domain: 'bbc.com', name: 'BBC News', type: 'Public Broadcaster', trust: 91, bias: -10, transparency: 'High', status: 'Verified', attributes: ['State-Funded', 'Neutral Label', 'Global Reach'] }
      ];
      for (const src of initialSources) {
        await pool.query(
          'INSERT INTO sources (domain, name, type, trust, bias, transparency, status, attributes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (domain) DO NOTHING',
          [src.domain, src.name, src.type, src.trust, src.bias, src.transparency, src.status, JSON.stringify(src.attributes)]
        );
      }
    }

    console.log('✅ PostgreSQL connected & protocol schema verified');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
    pool = null;
  }
};

module.exports = {
  initDB,
  getPool: () => pool,
  query: (text, params) => pool ? pool.query(text, params) : null
};
