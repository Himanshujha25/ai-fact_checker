const express = require('express');
const router = express.Router();
const { getDefaultModel, geminiWithRetry, safeParseJSON } = require('../services/geminiService');
const { performTavilySearch } = require('../services/tavilyService');
const { maybeAuthenticate } = require('../middleware/auth');

router.post('/audit', maybeAuthenticate, async (req, res) => {
  const { handle, platform } = req.body;
  if (!handle) return res.status(400).json({ error: 'Handle/Username required' });

  try {
    const model = getDefaultModel();
    console.log(`  [Persona] Auditing: @${handle} (${platform || 'any platform'})`);

    const research = await performTavilySearch(`${handle} ${platform || ''} social media profile history credibility`, 'advanced');
    const sources = research?.sources || [];
    const researchSnippet = sources.map(r => `[${r.url}] ${r.snippet}`).join('\n\n');

    const prompt = `Perform a forensic persona audit for ${handle} on ${platform || 'web'}.
    RESEARCH DATA: ${researchSnippet}
    Assess: bot probability, political bias, social engineering risk, and history of disinformation.
    Return JSON {handle, score, status, bias, traits: [], riskFactors: [], summary}.`;

    const result = await geminiWithRetry(model, prompt);
    const auditData = safeParseJSON(result.response.text()) || {};
    
    // Persistence
    const { getHash } = require('../utils/helpers');
    const db = require('../config/db');
    const id = getHash(`${handle}-${Date.now()}`).substring(0, 12);
    
    const pool = db.getPool();
    if (pool && req.userId) {
      await pool.query(
        'INSERT INTO verifications (id, user_id, input_text, truth_score, claims_count, full_data) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, req.userId, `Persona Audit: @${handle}`, auditData.score || 50, auditData.traits?.length || 0, JSON.stringify({ ...auditData, type: 'persona', timestamp: new Date().toISOString() })]
      );
    }

    res.json({ id, ...auditData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
