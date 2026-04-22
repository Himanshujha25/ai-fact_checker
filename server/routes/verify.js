const express = require('express');
const router = express.Router();
const axios = require('axios');
const { runVerificationPipeline } = require('../services/verificationService');
const { getHash, cacheGet, cacheSet, sendError, formatHistoryItem } = require('../utils/helpers');
const { maybeAuthenticate } = require('../middleware/auth');
const db = require('../config/db');

// Universal Harvester for scraping URL content
const harvest = async (target, label = '') => {
  if (target && typeof target === 'string' && target.match(/^https?:\/\//i)) {
    try {
      const pageRes = await axios.get(target, { 
        timeout: 10000, 
        headers: { 'User-Agent': 'Truecast-Forensics/2.0 (Forensic Intelligence Node)' } 
      });
      // Basic HTML to Text cleaning
      return pageRes.data
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 12000); 
    } catch (err) {
      console.warn(`[Harvester] Access restricted for ${target}. Using URL as fallback.`);
      return target;
    }
  }
  return target;
};

router.post('/verify', maybeAuthenticate, async (req, res) => {
  const { content, url, text, content1, content2, url2, text2, mode, language } = req.body;
  
  // Align standard and adversarial inputs
  let input1 = content || url || text || content1;
  let input2 = content2 || url2 || text2;

  if (!input1) return res.status(400).json({ error: 'Source Vector A content required' });

  try {
    // 1. Harvest content if inputs are URLs
    const finalInput1 = await harvest(input1, 'Source A');
    const finalInput2 = input2 ? await harvest(input2, 'Source B') : null;

    // 2. Run Forensic Pipeline
    const payload = mode === 'adversarial' ? { content1: finalInput1, content2: finalInput2 } : finalInput1;
    const result = await runVerificationPipeline(payload, mode || 'normal', language || 'en');
    
    const id = getHash(input1 + (input2 || '')).substring(0, 12);
    
    // 3. Persist if DB available
    const pool = db.getPool();
    if (pool && req.userId) {
      await pool.query(
        'INSERT INTO verifications (id, user_id, input_text, truth_score, claims_count, full_data) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET full_data = EXCLUDED.full_data',
        [id, req.userId, input1.substring(0, 500), result.truthScore, result.claims.length, JSON.stringify(result)]
      );
    }

    res.json({ id, ...result });
  } catch (error) {
    console.error('[Verify Route Error]', error);
    sendError(res, error, 'Verification');
  }
});

router.get('/history', maybeAuthenticate, async (req, res) => {
  if (!req.userId) return res.json([]);
  const pool = db.getPool();
  if (!pool) return res.json([]);

  try {
    const result = await pool.query(
      'SELECT id, input_text, truth_score, claims_count, full_data, created_at FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.userId]
    );
    res.json(result.rows.map(row => formatHistoryItem({
      id: row.id,
      input: row.input_text,
      truthScore: parseFloat(row.truth_score),
      claimsCount: row.claims_count,
      timestamp: row.created_at,
      fullData: row.full_data
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Streaming Route for Real-time Progress
router.post('/verify-stream', maybeAuthenticate, async (req, res) => {
  const { content, url, text, url2, text2, mode, language } = req.body;
  const input1 = content || url || text;
  const input2 = url2 || text2;
  
  if (!input1) return res.status(400).json({ error: 'Verification input required' });

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  const harvest = async (target, label = '') => {
    if (target && target.match(/^https?:\/\//i)) {
      send('progress', `[Network] Fetching ${label} content from source URL...`);
      try {
        const pageRes = await axios.get(target, { timeout: 8000, headers: { 'User-Agent': 'Truecast-Forensics/1.0' } });
        send('progress', `[Network] ${label} Source data harvested.`);
        return pageRes.data
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000);
      } catch (err) {
        send('progress', `[Warning] ${label} Access restricted. Analyzing URL only.`);
        return target;
      }
    }
    return target;
  };

  try {
    let contentToProcess = await harvest(input1, mode === 'adversarial' ? 'Source A' : '');
    let content2 = null;

    if (mode === 'adversarial' && input2) {
      content2 = await harvest(input2, 'Source B');
    }

    const payload = mode === 'adversarial' ? { content1: contentToProcess, content2 } : contentToProcess;

    const result = await runVerificationPipeline(payload, mode || 'normal', language || 'en', (msg) => {
      send('progress', msg);
    });

    const id = getHash(input1 + (input2 || '')).substring(0, 12);
    const pool = db.getPool();
    if (pool) {
      await pool.query(
        'INSERT INTO verifications (id, user_id, input_text, truth_score, claims_count, full_data) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO UPDATE SET full_data = EXCLUDED.full_data',
        [id, req.userId || null, input1.substring(0, 500), result.truthScore, result.claims.length, JSON.stringify(result)]
      );
    }

    send('complete', { id, ...result });
    res.end();
  } catch (error) {
    console.error('Stream Error:', error);
    send('error', error.message);
    res.end();
  }
});

// Get single report by ID (Match frontend /api/history/:id)
router.get('/history/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    if (!pool) return res.status(503).json({ error: 'Database offline' });

    const result = await pool.query('SELECT full_data FROM verifications WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dossier not found' });
    
    res.json(result.rows[0].full_data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for frontend inconsistencies (some parts use /api/report/export)
router.get('/report/export/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    const result = await pool.query('SELECT full_data FROM verifications WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dossier not found' });
    res.json(result.rows[0].full_data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alias for /api/api/report/export/... if frontend is double-prefixing
router.get('/api/report/export/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = db.getPool();
    const result = await pool.query('SELECT full_data FROM verifications WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Dossier not found' });
    res.json(result.rows[0].full_data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public/Admin All Reports
router.get('/all-reports', async (req, res) => {
  try {
    const pool = db.getPool();
    if (!pool) return res.json([]);
    const result = await pool.query('SELECT id, input_text, truth_score, claims_count, full_data, created_at FROM verifications ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows.map(row => formatHistoryItem({
      id: row.id,
      input: row.input_text,
      truthScore: parseFloat(row.truth_score),
      claimsCount: row.claims_count,
      timestamp: row.created_at,
      fullData: row.full_data
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete single history item
router.delete('/history/:id', maybeAuthenticate, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  const { id } = req.params;
  try {
    const pool = db.getPool();
    // Verify ownership
    const check = await pool.query('SELECT user_id FROM verifications WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    if (check.rows[0].user_id !== req.userId) return res.status(403).json({ error: 'Unauthorized to delete this record' });

    await pool.query('DELETE FROM verifications WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete entire history for user
router.delete('/history', maybeAuthenticate, async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Auth required' });
  try {
    const pool = db.getPool();
    await pool.query('DELETE FROM verifications WHERE user_id = $1', [req.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
