const CryptoJS = require('crypto-js');

// ─── In-memory fallback cache ───
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}

function cacheSet(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

const getHash = (text) => CryptoJS.SHA256(text).toString();

/** Shared error responder — sends 503 for Gemini overload, 500 otherwise */
function sendError(res, error, context = '') {
  if (context) console.error(`${context} Error:`, error.message || error);
  if (error?.isGeminiOverload || /503|high demand|service unavailable/i.test(error?.message || '')) {
    return res.status(503).json({
      error: 'The AI service is temporarily busy. Please try again in a few seconds.',
      retryable: true
    });
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
}

/** ─── Retry with Exponential Backoff ─── */
async function retryWithBackoff(fn, retries = 4, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status || err?.httpStatus || (err?.message?.match(/\[(\d{3})/)?.[1]);
      const isRetryable = ['503', '429', 503, 429].includes(status) ||
        /503|429|high demand|quota|rate limit/i.test(err?.message || '');
      
      const delay = isRetryable
        ? Math.min(baseDelay * Math.pow(2, i) + Math.random() * 1000, 15000)
        : baseDelay;
      
      console.warn(`  ↻ Retry ${i + 1}/${retries} after ${Math.round(delay)}ms — ${err.message?.substring(0, 80)}`);
      
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

function formatHistoryItem(h) {
  const claims = h.fullData?.claims || [];
  const verdicts = { true: 0, false: 0, partial: 0, unverifiable: 0 };
  claims.forEach(c => {
    const v = (c.verdict || '').toLowerCase();
    if (v === 'true') verdicts.true++;
    else if (v === 'false') verdicts.false++;
    else if (v === 'partially true') verdicts.partial++;
    else verdicts.unverifiable++;
  });
  return {
    id: h.id,
    input: h.input,
    truthScore: h.truthScore,
    claimsCount: h.claimsCount,
    timestamp: h.timestamp ? new Date(h.timestamp).toISOString() : new Date().toISOString(),
    verdicts,
    thumbnail: h.fullData?.aiMediaDetection?.results?.[0]?.url || h.fullData?.forensicReference || null,
    topClaims: claims.slice(0, 3).map(c => ({ claim: c.claim?.substring(0, 80), verdict: c.verdict }))
  };
}

module.exports = {
  cacheGet,
  cacheSet,
  getHash,
  sendError,
  retryWithBackoff,
  formatHistoryItem
};
