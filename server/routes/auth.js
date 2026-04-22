const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/register', async (req, res) => {
  const { email, password, fullName, organization } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = db.getPool();
    if (!pool) return res.json({ message: 'User registered (Memory Mode)', userId: Date.now() });

    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, organization) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, fullName, organization]
    );
    res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const pool = db.getPool();
  
  if (!pool) {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
    return res.json({ token, email, fullName: 'Demo User', organization: 'Open OSINT' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
    res.json({ token, id: user.id, email: user.email, fullName: user.full_name, organization: user.organization });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/google', async (req, res) => {
  const { credential } = req.body;
  const pool = db.getPool();

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    if (!pool) {
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
      return res.json({ token, email, fullName: name, organization: 'Google' });
    }

    // Check if user exists by email or google_id
    let userResult = await pool.query('SELECT * FROM users WHERE email = $1 OR google_id = $2', [email, googleId]);
    let user;

    if (userResult.rows.length === 0) {
      // Create user if not exists
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const insertResult = await pool.query(
        'INSERT INTO users (email, password, full_name, organization, google_id, avatar_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [email, dummyPassword, name, 'Individual', googleId, picture]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];
      // Sync picture if it changed
      if (picture && user.avatar_url !== picture) {
        await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [picture, user.id]);
        user.avatar_url = picture;
      }
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
    res.json({ 
      token, 
      id: user.id, 
      email: user.email, 
      fullName: user.full_name, 
      organization: user.organization,
      picture: user.avatar_url
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// Verification route to get current user info
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vericheck_secret_key_2026');
    const pool = db.getPool();
    if (!pool) return res.json({ email: 'guest@vericheck.ai', fullName: 'Demo User' });

    const result = await pool.query('SELECT id, email, full_name, organization, avatar_url FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = result.rows[0];
    res.json({ id: user.id, email: user.email, fullName: user.full_name, organization: user.organization, picture: user.avatar_url });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const { authenticate } = require('../middleware/auth');

router.post('/sync-history', authenticate, async (req, res) => {
  const { guestVerifications, guestForensics } = req.body;
  if (!req.userId) return res.status(401).json({ error: 'Authentication required for sync' });
  
  const pool = db.getPool();
  if (!pool) return res.json({ success: true, message: 'DB offline, sync skipped' });

  try {
    // Sync Verifications
    if (Array.isArray(guestVerifications)) {
      for (const v of guestVerifications) {
        if (!v.id) continue;
        await pool.query(
          'INSERT INTO verifications (id, user_id, input_text, truth_score, claims_count, full_data) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id',
          [v.id.substring(0, 12), req.userId, (v.input || '').substring(0, 500), v.truthScore, v.claims?.length || 0, JSON.stringify(v)]
        );
      }
    }

    // Sync Forensics
    if (Array.isArray(guestForensics)) {
      for (const f of guestForensics) {
        await pool.query(
          'INSERT INTO forensics (user_id, verdict, overall_score, full_data) VALUES ($1, $2, $3, $4)',
          [req.userId, f.verdict || 'Suspicious', f.overallScore || 0, JSON.stringify(f)]
        );
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('History Sync Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
