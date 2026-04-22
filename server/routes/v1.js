const express = require('express');
const router = express.Router();
const { runVerificationPipeline } = require('../services/verificationService');
const { getHash } = require('../utils/helpers');

/**
 * 🛰️ TRUECAST PUBLIC API (V1)
 * Adjudication Endpoint
 */
router.post('/adjudicate', async (req, res) => {
  const auth = req.headers.authorization;
  const { claim, mode } = req.body;

  // 🛡️ API Key Validation (Forensic Alpha)
  if (!auth || !auth.startsWith('Bearer tc_live_')) {
    return res.status(401).json({
      error: 'Invalid API Key',
      message: 'Truecast Live API Key required. Format: tc_live_xxxxxxxx'
    });
  }

  if (!claim) {
    return res.status(400).json({ error: 'Claim body required for adjudication.' });
  }

  try {
    console.log(`[API_V1] Adjudicating: "${claim.substring(0, 50)}..." [Mode: ${mode || 'standard'}]`);
    
    // Execute forensic pipeline
    const verdict = await runVerificationPipeline(claim, mode || 'normal');
    
    // Determine status label based on score
    const score = verdict.truthScore || 0;
    let label = 'Unverified';
    let status = 'Caution';
    
    if (score >= 80) { label = 'Verified'; status = 'nominal'; }
    else if (score >= 40) { label = 'Partially Verified'; status = 'elevated'; }
    else { label = 'Inaccurate'; status = 'hazard'; }

    // Return structured forensic payload
    res.json({
      id: `tc_${getHash(claim).substring(0, 12)}`,
      timestamp: verdict.timestamp || new Date().toISOString(),
      verdict: {
        score: score,
        status: status,
        label: label,
        confidence: verdict.aiTextDetection?.score || 0
      },
      forensics: {
        analysis: verdict.originalText ? "Synthesis complete" : "Analysis pending",
        claims_detected: verdict.claims ? verdict.claims.length : 0,
        detailed_findings: (verdict.claims || []).map(c => ({
          claim: c.claim,
          verdict: c.verdict,
          impact: c.impact || 'low',
          evidence_summary: c.explanation || "No contradictory evidence found in global OSINT nodes."
        })),
        bias: verdict.biasSpectrum || {}
      },
      metadata: {
        mode: mode || 'standard',
        engine: 'Gemini-Forensics-Pro-3.5'
      }
    });
  } catch (error) {
    console.error('[API_V1_ERROR]', error);
    res.status(500).json({
      error: 'Forensic Pipeline Failure',
      message: error.message
    });
  }
});

/**
 * 🛠️ LLM Audit Endpoint
 */
router.post('/audit-llm', async (req, res) => {
  const auth = req.headers.authorization;
  const { prompt, response } = req.body;

  if (!auth || !auth.startsWith('Bearer tc_live_')) {
     return res.status(401).json({ error: 'Invalid API Key' });
  }

  if (!prompt || !response) return res.status(400).json({ error: 'Prompt and Response required for LLM Audit' });

  try {
    const claim = `LLM_PROMPT: ${prompt}\nLLM_RESPONSE: ${response}`;
    const verdict = await runVerificationPipeline(claim, 'adversarial');
    
    res.json({
      audit_id: `audit_${getHash(claim).substring(0, 8)}`,
      hallucination_score: 100 - (verdict.truthScore || 0),
      verdict: verdict.truthScore > 80 ? 'CLEAN' : 'DANGER',
      details: verdict.claims.map(c => ({
        point: c.claim,
        verdict: c.verdict,
        reason: c.explanation
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
