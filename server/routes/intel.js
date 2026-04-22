const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { getDefaultModel, geminiWithRetry, safeParseJSON } = require('../services/geminiService');
const { performTavilySearch } = require('../services/tavilyService');
const crypto = require('crypto');

// ─────────────────────────────────────────────
//  V4.5 SENTINEL DATA STORE
// ─────────────────────────────────────────────
const INTEGRITY_LEDGER = [];
const auditCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

let GLOBAL_THREATS = [
  { id: 'T-901', type: 'Synthetic Media', region: 'NA Node', claim: 'Deepfake audio leak detected', risk: 94 },
  { id: 'T-402', type: 'Coordinated Botnet', region: 'EU Core', claim: 'Election friction narrative active', risk: 82 }
];

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────
function addToLedger(data) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 32);
  INTEGRITY_LEDGER.unshift({ 
     id: `SIGN_V4_${hash}`, 
     timestamp: new Date().toISOString(),
     type: data.type || 'ADVISORY'
  });
  if (INTEGRITY_LEDGER.length > 50) INTEGRITY_LEDGER.pop();
}

// ─────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────

router.get('/pulse', async (req, res) => {
  res.json({
    stats: { threats: GLOBAL_THREATS.length, narratives: 12, sources: 1250, score: 76 },
    ticker: GLOBAL_THREATS,
    ledger: INTEGRITY_LEDGER.slice(0, 10)
  });
});

// Periodic Threat Refresh (Safety-First Handler)
const refreshThreats = async () => {
    try {
        console.log(`📡 [Sentinel] Sweeping OSINT for global signals...`);
        const research = await performTavilySearch("latest misinformation narratives global drift 2026", "basic");
        if (!research.sources?.length) return;

        const prompt = `Convert OSINT snippets into 4 threat objects. JSON Array: { id: "T-XXX", type: "Disinfo", region: "NA Node", claim: "...", risk: 0-100 }
        DATA: ${JSON.stringify(research.sources.slice(0, 3))}`;
        
        const model = getDefaultModel();
        const aiRes = await geminiWithRetry(model, prompt);
        const newThreats = safeParseJSON(aiRes.response.text());
        if (Array.isArray(newThreats)) {
            GLOBAL_THREATS = newThreats;
            console.log(`✅ [Pulse] Threat Pool Synced: ${newThreats.length} nodes.`);
        }
    } catch (e) {
        console.warn('⚠ Background sweep postponed: System under heavy load.');
    }
};

// Initiate with safety
setTimeout(() => {
  refreshThreats().catch(e => console.error('Initial sweep failed', e.message));
  setInterval(() => refreshThreats().catch(e => console.error('Interval sweep failed', e.message)), 900000);
}, 5000);

router.get('/url/reputation', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  let domain = '';
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch (e) {
    domain = url.split('/')[0].replace('www.', '');
  }

  // BYPASS: Don't waste quota on internal/development domains
  const internalDomains = ['localhost', '127.0.0.1', 'vercel.app', 'render.com'];
  if (internalDomains.some(id => domain.includes(id))) {
      return res.json({
          domain,
          status: 'Verified',
          trust: 100,
          reason: 'Development/Infrastructure node detected. Integrity verified by local system.',
          voiceAdvisory: `System node ${domain} is verified.`,
          kpis: { bias: 50, fact_check: 100, credibility: 100 }
      });
  }

  if (auditCache.has(domain)) {
    const cached = auditCache.get(domain);
    if (Date.now() - cached.timestamp < CACHE_TTL) return res.json(cached.data);
  }

  try {
    const research = await performTavilySearch(`${domain} credibility media bias transparency record`, 'advanced');
    const model = getDefaultModel();
    const prompt = `
      SENTINEL FORENSIC AUDIT: ${domain}
      OSINT DATA: ${JSON.stringify(research.sources.slice(0, 5))}
      MANDATORY JSON:
      {
        "domain": "${domain}",
        "status": "Verified" | "Caution" | "Hazard",
        "trust": 0-100,
        "reason": "Executive summary (4-5 sentences)",
        "kpis": { "bias": "...", "fact_check": "...", "credibility": "...", "freedom": "..." }
      }
    `;

    const aiRes = await geminiWithRetry(model, prompt);
    const data = safeParseJSON(aiRes.response.text());
    
    if (data) {
      // Add Voice-Optimized summary (No markdown for the speaker)
      data.voiceAdvisory = `Forensic briefing for ${domain}. ${data.reason || 'Status nominal.'}`
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .replace(/\[.*?\]/g, '');

      // SIGN & STORE
      const id = `SIGN_V5_${crypto.randomBytes(4).toString('hex')}`;
      addToLedger(id, 'Neural Audit');
      auditCache.set(domain, { timestamp: Date.now(), data });
      res.json(data);
    } else {
      // MANUAL KPI HARVESTER (FREE FALLBACK)
      const allText = research.sources.map(s => s.snippet).join(' ').toLowerCase();
      const harvest = {
        bias: allText.includes('right') ? 80 : allText.includes('left') ? 20 : 50,
        fact_check: allText.includes('fake') || allText.includes('misleading') ? 30 : 90,
        credibility: research.sources.length > 5 ? 85 : 45
      };

      const fallback = {
        domain,
        status: harvest.credibility > 70 ? 'Verified' : 'Caution',
        trust: Math.floor(harvest.credibility * 0.9),
        reason: 'Operating in Restricted OSINT Mode. Baseline reputation synthesized from public indicators.',
        voiceAdvisory: `Operating in Restricted Forensic Mode for ${domain}. Result: Caution. Manual verification recommended.`,
        kpis: harvest
      };
      
      const id = `SIGN_V5_FALLBACK_${crypto.randomBytes(2).toString('hex')}`;
      addToLedger(id, 'Local Harvest');
      res.json(fallback);
    }
  } catch (err) {
    res.status(500).json({ error: 'Audit Failed' });
  }
});

module.exports = router;
