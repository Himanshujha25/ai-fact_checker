
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config — store uploads in memory for direct Gemini processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    cb(null, ext || mime);
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

// ─── PostgreSQL (with graceful fallback) ───
let db = null;
const initDB = async () => {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factchecker',
      connectionTimeoutMillis: 3000
    });
    // Test connection
    await pool.query('SELECT NOW()');
    // Auto-create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
    `);
    db = pool;
    console.log('✅ PostgreSQL connected & tables ready');
  } catch (err) {
    console.warn('⚠️  PostgreSQL not available — using in-memory storage (data won\'t persist)');
    console.warn('   To enable PG: set DATABASE_URL in .env and run: node db-setup.js');
    db = null;
  }
};
initDB();

// ─── In-memory fallback cache ───
const cache = new Map();
const memoryHistory = []; // fallback if no PG
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

// ─── DB Helper Functions (User-Aware) ───
async function dbSaveVerification(userId, id, inputText, truthScore, claimsCount, fullData) {
  if (!db) {
    // Fallback to memory with user session
    memoryHistory.push({ userId, id, input: inputText.substring(0, 100), truthScore, claimsCount, timestamp: fullData.timestamp, fullData });
    return;
  }
  try {
    await db.query(
      `INSERT INTO verifications (id, user_id, input_text, truth_score, claims_count, full_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET full_data = $6, truth_score = $4`,
      [id, userId, inputText.substring(0, 500), truthScore, claimsCount, JSON.stringify(fullData)]
    );
  } catch (err) {
    console.error('DB Save Error:', err.message);
    memoryHistory.push({ userId, id, input: inputText.substring(0, 100), truthScore, claimsCount, timestamp: fullData.timestamp, fullData });
  }
}

async function dbGetHistory(userId) {
  if (!db) {
    return memoryHistory.filter(h => h.userId === userId).slice(-50).reverse().map(formatHistoryItem);
  }
  try {
    const result = await db.query(
      'SELECT id, input_text, truth_score, claims_count, full_data, created_at FROM verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return result.rows.map(row => {
      const fullData = row.full_data;
      return formatHistoryItem({
        id: row.id,
        input: row.input_text,
        truthScore: parseFloat(row.truth_score),
        claimsCount: row.claims_count,
        timestamp: row.created_at,
        fullData
      });
    });
  } catch (err) {
    console.error('DB History Error:', err.message);
    return memoryHistory.filter(h => h.userId === userId).slice(-50).reverse().map(formatHistoryItem);
  }
}

async function dbGetReport(userId, id) {
  if (!db) {
    const entry = memoryHistory.find(h => h.id === id && h.userId === userId);
    return entry ? entry.fullData : null;
  }
  try {
    const result = await db.query('SELECT full_data FROM verifications WHERE id = $1 AND user_id = $2', [id, userId]);
    if (result.rows.length === 0) {
      const entry = memoryHistory.find(h => h.id === id && h.userId === userId);
      return entry ? entry.fullData : null;
    }
    return result.rows[0].full_data;
  } catch (err) {
    console.error('DB Report Error:', err.message);
    const entry = memoryHistory.find(h => h.id === id && h.userId === userId);
    return entry ? entry.fullData : null;
  }
}

async function dbDeleteHistory(userId) {
  // Clear user-specific cache
  const prefix = `history:${userId}`;
  for (const key of cache.keys()) { if (key.startsWith(prefix)) cache.delete(key); }
  
  // Clear memory fallback
  for (let i = memoryHistory.length - 1; i >= 0; i--) { if (memoryHistory[i].userId === userId) memoryHistory.splice(i, 1); }

  if (!db) return true;
  try {
    await db.query('DELETE FROM verifications WHERE user_id = $1', [userId]);
    return true;
  } catch (err) {
    console.error('DB Delete Error:', err.message);
    return false;
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
    timestamp: h.timestamp,
    verdicts,
    topClaims: claims.slice(0, 3).map(c => ({ claim: c.claim?.substring(0, 80), verdict: c.verdict }))
  };
}

// ─── Middleware ───
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Try again in 15 minutes.' }
});
app.use('/api/', apiLimiter);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ─── Routes ───
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: db ? 'connected' : 'in-memory', uptime: process.uptime() });
});

// POST: Analyze uploaded media (images/videos) for AI generation
app.post('/api/analyze-media', upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const results = [];

    for (const file of req.files) {
      try {
        const base64 = file.buffer.toString('base64');
        const isVideo = file.mimetype.startsWith('video/');

        const analysisPrompt = isVideo
          ? `Analyze this video for signs of AI generation, deepfake manipulation, or synthetic content. Look for:
1. Face-swapping artifacts (misaligned features, flickering edges)
2. Unnatural body movements or lip-sync issues
3. Temporal inconsistencies between frames
4. Background warping or morphing artifacts
5. Audio-visual desynchronization clues
Return ONLY JSON: {"isAIGenerated": boolean, "confidence": number(0-100), "indicators": ["string"], "verdict": "Authentic"|"Likely AI-Generated"|"Possibly Manipulated"|"Inconclusive", "mediaType": "video", "details": "string"}`
          : `Analyze this image for signs of AI generation or synthetic manipulation (deepfake indicators). Look for:
1. Unnatural skin textures, warped backgrounds, extra fingers/limbs
2. Inconsistent lighting, reflections, or shadows
3. Repeating patterns, blurring artifacts, watermark remnants
4. GAN artifacts, diffusion model artifacts, face-swapping signs
5. Text rendering errors (common in AI-generated images)
Return ONLY JSON: {"isAIGenerated": boolean, "confidence": number(0-100), "indicators": ["string"], "verdict": "Authentic"|"Likely AI-Generated"|"Possibly Manipulated"|"Inconclusive", "mediaType": "image", "details": "string"}`;

        const result = await model.generateContent([
          { inlineData: { mimeType: file.mimetype, data: base64 } },
          analysisPrompt
        ]);

        const json = result.response.text().match(/\{[\s\S]*\}/)?.[0] || '{}';
        const parsed = JSON.parse(json);
        results.push({
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          ...parsed
        });
      } catch (err) {
        results.push({
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          isAIGenerated: false,
          confidence: 0,
          indicators: [],
          verdict: 'Analysis Failed',
          error: err.message
        });
      }
    }

    const aiGenCount = results.filter(r => r.isAIGenerated).length;
    res.json({
      filesAnalyzed: results.length,
      results,
      summary: aiGenCount > 0
        ? `${aiGenCount} of ${results.length} files flagged as potentially AI-generated`
        : `All ${results.length} files appear authentic`,
      verdict: aiGenCount > 0 ? 'Suspicious' : 'Authentic',
      overallScore: Math.round((aiGenCount / results.length) * 100)
    });
  } catch (error) {
    console.error('Media analysis error:', error);
    res.status(500).json({ error: error.message || 'Media analysis failed' });
  }
});

// ─── Authentication Middleware ───
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vericheck_secret_key_2026');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// ─── Auth Routes ───
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!db) {
       // Mock for memory mode
       return res.json({ message: 'User registered (Memory Mode)', userId: 1 });
    }
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id',
      [email, hashedPassword]
    );
    res.status(201).json({ message: 'User created', userId: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message.includes('unique') ? 'Email already exists' : 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!db) {
      // Mock for memory mode
      const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
      return res.json({ token, userId: 1, email: 'guest@vericheck.ai' });
    }
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'vericheck_secret_key_2026', { expiresIn: '7d' });
    res.json({ token, userId: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  if (!db) return res.json({ userId: 1, email: 'guest@vericheck.ai' });
  try {
    const result = await db.query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(404).json({ error: 'User not found' });
  }
});

// ─── Restricted Data Routes ───
app.get('/api/history', authenticate, async (req, res) => {
  const summaries = await dbGetHistory(req.userId);
  res.json(summaries);
});

app.get('/api/history/:id', authenticate, async (req, res) => {
  const data = await dbGetReport(req.userId, req.params.id);
  if (!data) return res.status(404).json({ error: 'Report not found' });
  res.json(data);
});

app.delete('/api/history', authenticate, async (req, res) => {
  const success = await dbDeleteHistory(req.userId);
  if (success) res.json({ message: 'History deleted' });
  else res.status(500).json({ error: 'Failed to delete history' });
});

// Helper: Extract Text AND Images from URL
async function extractFromUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      validateStatus: false
    });
    
    if (response.status !== 200) {
      console.warn(`  ⚠ Scraper blocked or error (Status ${response.status}) for ${url}`);
      return { 
        text: `[Scraper Warning] The website at ${url} blocked direct access or returned status ${response.status}. Primary Subject: ${url.split('/').pop() || 'Unknown'}. Please verify the status/identity associated with this URL via search.`,
        imageUrls: [],
        blocked: true
      };
    }

    const html = response.data;
    const title = html.match(/<title[^>]*>([\s\S]*)<\/title>/i)?.[1] || 'No Title';
    let content = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ||
                  html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html;
    const cleanText = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const imageUrls = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let imgUrl = match[1];
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/') && !imgUrl.startsWith('//')) imgUrl = new URL(imgUrl, url).href;
      if (!imgUrl.includes('favicon') && !imgUrl.includes('pixel') && !imgUrl.includes('1x1') && 
          !imgUrl.includes('.svg') && !imgUrl.includes('logo') && imageUrls.length < 5) {
        imageUrls.push(imgUrl);
      }
    }

    return {
      text: `Source URL: ${url}\nTitle: ${title}\n\nContent Preview: ${cleanText.substring(0, 15000)}`,
      imageUrls
    };
  } catch (error) {
    console.error(`  ✗ Scraper Fatal Error for ${url}:`, error.message);
    return { 
      text: `[Scraper Fatal Error] Could not reach ${url}. Error: ${error.message}. Please investigate the entity or claims associated with this URL manually via search tools.`,
      imageUrls: [],
      error: true
    };
  }
}

// Backward-compat wrapper
async function extractTextFromUrl(url) {
  const result = await extractFromUrl(url);
  return result.text;
}

// Helper: Analyze an image for AI-generation / deepfake indicators
async function analyzeImageForAI(imageUrl) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    // Fetch image as base64
    const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 8000 });
    const base64 = Buffer.from(imgResponse.data).toString('base64');
    const mimeType = imgResponse.headers['content-type'] || 'image/jpeg';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64
        }
      },
      `Analyze this image for signs of AI generation or synthetic manipulation (deepfake indicators). Look for:
      1. Unnatural skin textures, warped backgrounds, extra fingers/limbs
      2. Inconsistent lighting, reflections, or shadows
      3. Repeating patterns, blurring artifacts, watermark remnants
      4. Signs of GAN artifacts, diffusion model artifacts, or face-swapping
      Return ONLY JSON: {
        "isAIGenerated": boolean,
        "confidence": number (0-100),
        "indicators": ["string"],
        "verdict": "Authentic" | "Likely AI-Generated" | "Possibly Manipulated" | "Inconclusive"
      }`
    ]);
    const json = result.response.text().match(/\{[\s\S]*\}/)?.[0] || '{}';
    return { url: imageUrl, ...JSON.parse(json) };
  } catch (err) {
    return { url: imageUrl, isAIGenerated: false, confidence: 0, indicators: [], verdict: 'Analysis Failed', error: err.message };
  }
}

// ─── Entity Image Fetcher (Wikipedia API) ───
async function fetchEntityImage(entityName) {
  if (!entityName) return null;
  const userAgent = `VeriCheck-Bot/1.1 (https://vericheck.ai; contact@vericheck.ai) Google-Gemini-Agentic-Pipeline`;
  console.log(`  [Wiki] Searching for entity: "${entityName}"...`);
  
  const fetchWithRetry = async (url, retries = 2) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await axios.get(url, { 
          timeout: 10000, 
          headers: { 'User-Agent': userAgent }
        });
      } catch (err) {
        if (err.response?.status === 429) {
          console.warn(`  [Wiki] Rate limited (429). Retrying after 2s...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw err;
      }
    }
  };

  try {
    // Step 1: Search Wikipedia for the entity with strictness
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${entityName}"`)}&format=json&utf8=1&srlimit=1`;
    const searchRes = await fetchWithRetry(searchUrl);
    const searchResult = searchRes.data?.query?.search?.[0];
    const pageTitle = searchResult?.title;
    
    // Strictness Check: If name doesn't partially match, ignore
    if (!pageTitle) {
      console.log(`  [Wiki] No results for "${entityName}"`);
      return null;
    }

    const inputTerms = entityName.toLowerCase().split(' ').filter(t => t.length > 2);
    const resultTitle = pageTitle.toLowerCase();
    const isMatch = inputTerms.every(term => resultTitle.includes(term));

    if (!isMatch) {
       console.log(`  [Wiki] Rejecting mismatch: Search="${entityName}" Result="${pageTitle}"`);
       return { name: entityName, description: "Identified private profile (no public Wikipedia matches found)", isPrivate: true };
    }

    console.log(`  [Wiki] Valid match found: "${pageTitle}"`);

    // Step 2: Get page image and summary
    const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
    const pageRes = await fetchWithRetry(pageUrl);
    const data = pageRes.data;

    const result = {
      name: data.title || pageTitle,
      description: data.description || "No description available",
      extract: data.extract?.substring(0, 300) || "No extract available",
      image: data.thumbnail?.source || data.originalimage?.source || null,
      wikipediaUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`
    };
    
    if (result.image) console.log(`  [Wiki] Image FOUND for "${pageTitle}"`);
    else console.log(`  [Wiki] Summary found for "${pageTitle}" but NO IMAGE.`);

    return result;
  } catch (err) {
    console.log(`  [Wiki] Final Error fetching "${entityName}":`, err.message);
    // Return a basic entity object if we identified name but no Wiki profile
    return { name: entityName, description: "Identified private entity (no public biography found)", isPrivate: true };
  }
}

// ─── Retry with Exponential Backoff (handles 429 rate limits) ───
async function retryWithBackoff(fn, retries = 3, baseDelay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate');
      const delay = isRateLimit ? baseDelay * Math.pow(2, i) + Math.random() * 1000 : baseDelay;
      console.warn(`  ↻ Retry ${i + 1}/${retries} after ${Math.round(delay)}ms — ${err.message?.substring(0, 60)}`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Core verification pipeline — Chain-of-Thought + Self-Reflection + Entity Validation
async function runVerificationPipeline(contentToProcess) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  const currentDate = new Date().toISOString().split('T')[0];

  // ─── PHASE 1: Claim Extraction with Entity Clarity Scoring ───
  console.log('  [Phase 1] Extracting claims with entity validation...');
  const extractionPrompt = `You are a precision fact-extraction agent. Today's date is ${currentDate}.

TASK: Extract every atomic, verifiable factual claim from the text below. 

DYNAMIC AGENTIC MODE:
- If the text provided is a URL, a query, or a short direct question (e.g., "Is this person employed?", "Analyze this link"), you MUST generate the implicit factual claims that need to be verified to answer the user's intent. 
- Example input: "https://linkedin.com/in/user is he employed?" -> Extract: "The person associated with LinkedIn profile 'user' is currently employed."
- Always try to identify the SUBJECT (Person, Place, Project) and the specific ASSERTION.

CRITICAL RULES:
- Only extract specific, verifiable FACTS (not opinions, predictions, or subjective statements).
- For each claim, assess ENTITY CLARITY — can you clearly identify WHO or WHAT the claim is about?
  - "HIGH": Named, well-known entity (e.g., "Elon Musk", "Himanshu Jha", "Google")
  - "MEDIUM": Partially identifiable (e.g., "the CEO of Apple", "the profile at this URL")
  - "LOW": Ambiguous, vague, or unidentifiable (e.g., "someone", "he", "they" - unless the URL or context identifies them)
- If entity_clarity is LOW, the claim is likely UNVERIFIABLE — flag this.
- For temporal claims (e.g., "The current CEO is..."), mark them as time-sensitive.
- Classify importance: "high" (core factual assertion), "medium", or "low".

FORMAT: Return ONLY a JSON array:
[{
  "id": number,
  "claim": "exact factual claim",
  "context": "surrounding context from text",
  "importance": "high" | "medium" | "low",
  "isTemporalSensitive": boolean,
  "temporalNote": "string or null",
  "entityClarity": "HIGH" | "MEDIUM" | "LOW",
  "entityClarityReason": "Why the entity is or isn't clearly identifiable",
  "primaryEntity": "Specific name of the person/organization to lookup (e.g. 'Honey Singh', 'Himanshu Jha') or null"
}]

TEXT:
${contentToProcess}`;

  const extractionResult = await retryWithBackoff(() => model.generateContent(extractionPrompt));
  let claims;
  try {
    claims = JSON.parse(extractionResult.response.text().match(/\[[\s\S]*\]/)?.[0] || '[]');
  } catch (e) {
    claims = [];
  }
  console.log(`  [Phase 1] Extracted ${claims.length} claims (${claims.filter(c => c.entityClarity === 'LOW').length} ambiguous)`);

  // ─── PHASE 2: Chain-of-Thought Verification with Anti-Hallucination ───
  console.log('  [Phase 2] Verifying claims with CoT + entity validation...');
  const verificationResults = [];
  for (const claim of claims.slice(0, 6)) {
    try {
      const verifyResult = await retryWithBackoff(async () => {
        const verifyPrompt = `You are a meticulous, skeptical fact-verification agent. Today is ${currentDate}.
Use Chain-of-Thought reasoning to verify this claim. BE SKEPTICAL BY DEFAULT.

CLAIM: "${claim.claim}"
CONTEXT: "${claim.context}"
ENTITY CLARITY: ${claim.entityClarity || 'UNKNOWN'} — ${claim.entityClarityReason || 'Not assessed'}
${claim.isTemporalSensitive ? `⚠️ TEMPORAL WARNING: ${claim.temporalNote || 'Time-sensitive claim.'}` : ''}

═══════════════════════════════════════════
CRITICAL ANTI-HALLUCINATION RULES (MUST FOLLOW):
═══════════════════════════════════════════

1. NEVER mark a claim as "True" unless you have SPECIFIC, CONCRETE evidence from KNOWN, RELIABLE sources.
2. If the subject/entity is AMBIGUOUS (e.g., "honey", "someone", a nickname, a pronoun without clear referent):
   → Verdict MUST be "Unverifiable"
   → Confidence MUST be ≤ 0.25
   → Reasoning MUST explain: "The subject cannot be clearly identified"
3. If you cannot find SPECIFIC evidence from NAMED sources:
   → Verdict MUST be "Unverifiable"
   → Do NOT assume or guess
4. "No evidence found" does NOT mean "True". It means "Unverifiable".
5. Your DEFAULT assumption should be SKEPTICISM, not trust.
6. If confidence would be below 0.6, the verdict CANNOT be "True" — use "Partially True" or "Unverifiable".

═══════════════════════════════════════════

VERIFICATION STEPS (follow each one carefully):

Step 1 — ENTITY CHECK: Is the subject of this claim a clearly identifiable, real-world entity?
  - If NO → immediately set verdict to "Unverifiable" with low confidence and skip to Step 7.
  - If YES → continue.
Step 2 — DECOMPOSE: Break the claim into its core assertions.
Step 3 — SEARCH STRATEGY: Formulate 2-3 targeted search queries.
Step 4 — EVIDENCE: What do the most reliable sources say? Name specific sources.
  - If NO reliable sources found → verdict must be "Unverifiable".
Step 5 — SOURCE CONFLICT CHECK: Do sources agree or conflict?
  - Weight: academic > .gov/.edu > major news > blog > social media.
Step 6 — TEMPORAL CHECK: Is this still accurate as of ${currentDate}?
Step 7 — SELF-REFLECTION: 
  - "Am I hallucinating? Do I actually have evidence, or am I making this up?"
  - "Could this be a trick question with an ambiguous subject?"
  - "If I showed this to a skeptic, would they agree?"
  - If uncertain, LOWER confidence substantially.
Step 8 — FINAL VERDICT: Only mark "True" if ALL of the following are met:
  a) Entity is clearly identified
  b) You have named, concrete evidence
  c) Confidence is ≥ 0.6

Return ONLY JSON:
{
  "claimId": ${claim.id},
  "verdict": "True"|"False"|"Partially True"|"Unverifiable",
  "confidence": number (0.0-1.0),
  "reasoning": "multi-sentence explanation",
  "chainOfThought": ["Step 1: ...", "Step 2: ...", ...],
  "searchQueriesUsed": ["query1", "query2"],
  "evidence": [{"text": "snippet", "source": "source name", "credibility": number}],
  "sourceConflicts": "string or null",
  "temporalWarning": "string or null",
  "entityClarity": "HIGH"|"MEDIUM"|"LOW",
  "entityClarityReason": "why entity is/isn't identifiable",
  "originalSentence": "matching sentence from original text"
}`;
        return await model.generateContent(verifyPrompt);
      });

      let parsed;
      try {
        parsed = JSON.parse(verifyResult.response.text().match(/\{[\s\S]*\}/)?.[0] || '{}');
      } catch (e) {
        parsed = { claimId: claim.id, verdict: 'Unverifiable', confidence: 0.2,
          reasoning: 'Failed to parse verification result.', evidence: [], searchQueriesUsed: [] };
      }

      // ─── POST-VERIFICATION VALIDATION ───
      // Guard: if entity clarity is LOW, force Unverifiable
      if ((claim.entityClarity === 'LOW' || parsed.entityClarity === 'LOW') && parsed.verdict === 'True') {
        console.log(`  ⚠ Overriding claim ${claim.id}: LOW entity clarity cannot be "True"`);
        parsed.verdict = 'Unverifiable';
        parsed.confidence = Math.min(parsed.confidence, 0.25);
        parsed.reasoning = `[Entity Validation Override] ${parsed.reasoning}. The subject of this claim is ambiguous and cannot be reliably verified.`;
      }
      // Guard: if no real evidence but marked True, demote
      if (parsed.verdict === 'True' && (!parsed.evidence || parsed.evidence.length === 0)) {
        console.log(`  ⚠ Overriding claim ${claim.id}: No evidence but marked True`);
        parsed.verdict = 'Unverifiable';
        parsed.confidence = Math.min(parsed.confidence, 0.3);
        parsed.reasoning = `[Evidence Validation Override] ${parsed.reasoning}. No concrete evidence was provided to support this claim.`;
      }

      // ─── NEW: Fetch Entity Metadata with aggressive name detection fallback ───
      const entityToFetch = claim.primaryEntity || parsed.primaryEntity || (claim.entityClarity !== 'LOW' && claim.claim.split(' ').slice(0, 3).join(' '));
      
      if (entityToFetch && (claim.entityClarity !== 'LOW' || parsed.entityClarity !== 'LOW')) {
        console.log(`  [Phase 2] Attempting to fetch metadata for entity: "${entityToFetch}"`);
        parsed.entityMetadata = await fetchEntityImage(entityToFetch);
      } else {
        console.log(`  [Phase 2] Skipping metadata fetch: clarity="${claim.entityClarity}", entity="${entityToFetch}"`);
      }

      verificationResults.push(parsed);
    } catch (err) {
      console.error(`  ✗ Claim ${claim.id} failed after retries: ${err.message?.substring(0, 80)}`);
      verificationResults.push({
        claimId: claim.id, verdict: 'Unverifiable', confidence: 0, pipelineError: true,
        reasoning: `Verification failed (pipeline recovered): ${err.message?.substring(0, 100)}`,
        evidence: [], searchQueriesUsed: []
      });
    }
  }

  // ─── PHASE 3: AI Text Detection ───
  console.log('  [Phase 3] AI text detection...');
  let aiDetection = { score: 0, explanation: 'Analysis unavailable' };
  try {
    const aiRes = await retryWithBackoff(() =>
      model.generateContent(`You are an AI text detection specialist. Today is ${currentDate}.
Analyze this text and estimate probability (0-100) it was AI-generated.
Consider: sentence structure uniformity, vocabulary diversity, hedging patterns, factual precision, paragraph flow.
Return ONLY JSON: {"score": number, "explanation": "string"}.
Text: ${contentToProcess.substring(0, 1500)}`)
    );
    aiDetection = JSON.parse(aiRes.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "explanation": "Unavailable"}');
  } catch (err) {
    console.error('  ✗ AI text detection failed (non-blocking):', err.message?.substring(0, 60));
  }

  // ─── PHASE 4: Aggregate & Score ───
  const successfulResults = verificationResults.filter(v => !v.pipelineError);
  const trueCount = successfulResults.filter(v => v.verdict === 'True').length;
  const partialCount = successfulResults.filter(v => v.verdict === 'Partially True').length;
  const totalVerified = successfulResults.length || 1;
  const truthScore = ((trueCount + partialCount * 0.5) / totalVerified) * 100;

  const pipelineMeta = {
    totalClaims: claims.length,
    verifiedClaims: successfulResults.length,
    failedClaims: verificationResults.filter(v => v.pipelineError).length,
    temporalClaims: claims.filter(c => c.isTemporalSensitive).length,
    conflictingClaims: verificationResults.filter(v => v.sourceConflicts).length,
    ambiguousClaims: claims.filter(c => c.entityClarity === 'LOW').length,
  };
  console.log(`  [Phase 4] Score: ${Math.round(truthScore)}% | ${pipelineMeta.verifiedClaims} verified, ${pipelineMeta.ambiguousClaims} ambiguous`);

  return {
    originalText: contentToProcess,
    claims: claims.map(c => ({ ...c, ...verificationResults.find(v => v.claimId === c.id) })),
    aiTextDetection: aiDetection,
    aiMediaDetection: null,
    truthScore,
    pipelineMeta,
    cached: false,
    timestamp: new Date().toISOString()
  };
}

// POST: Single Fact-Check (Protected)
app.post('/api/verify', authenticate, async (req, res) => {
  const { text, url } = req.body;
  const userId = req.userId;
  let identifier = url || text;
  const hashKey = getHash(identifier);

  try {
    // Check in-memory cache first (user-specific)
    const cacheKey = `verify:${userId}:${hashKey}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      console.log('Cache Hit for User', userId, identifier.substring(0, 30));
      return res.json({ ...cached, cached: true });
    }

    let contentToProcess = text || '';
    let imageUrls = [];
    
    // Smart URL Detection: If text contains a URL but 'url' field is empty
    const urlPattern = /https?:\/\/[^\s]+/;
    const detectedUrl = text?.match(urlPattern)?.[0];
    const targetUrl = url || detectedUrl;

    if (targetUrl) {
      console.log(`  [Dynamic] Processing URL: ${targetUrl}`);
      const extracted = await extractFromUrl(targetUrl);
      
      // Combine user text (questions) with scraped text (evidence)
      contentToProcess = `USER QUERY/CONTEXT: ${text || 'None'}\n\nSCRAPED CONTENT:\n${extracted.text}`;
      imageUrls = extracted.imageUrls || [];
    }

    if (!contentToProcess.trim()) return res.status(400).json({ error: 'No content provided' });

    console.log(`  [Dynamic] Processing payload: ${contentToProcess.substring(0, 50)}...`);
    const responseData = await runVerificationPipeline(contentToProcess);

    // AI Media Detection: analyze extracted images
    if (imageUrls.length > 0) {
      console.log(`Analyzing ${imageUrls.length} images for deepfake detection...`);
      const imageAnalysis = [];
      for (const imgUrl of imageUrls.slice(0, 3)) {
        const analysis = await analyzeImageForAI(imgUrl);
        imageAnalysis.push(analysis);
      }
      const aiGenCount = imageAnalysis.filter(a => a.isAIGenerated).length;
      responseData.aiMediaDetection = {
        imagesFound: imageUrls.length,
        imagesAnalyzed: imageAnalysis.length,
        results: imageAnalysis,
        summary: aiGenCount > 0
          ? `${aiGenCount} of ${imageAnalysis.length} images flagged as potentially AI-generated`
          : `All ${imageAnalysis.length} analyzed images appear authentic`,
        verdict: aiGenCount > 0 ? 'Suspicious' : 'Authentic',
        score: Math.round((aiGenCount / imageAnalysis.length) * 100)
      };
    } else {
      // Text-only input — use text-based media analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const mediaPrompt = `Analyze this text for references to synthetic/AI-generated media. Return JSON: {"score": number, "mediaFound": string[], "verdict": "string", "summary": "string"}. Text: ${contentToProcess.substring(0, 1000)}`;
      const mediaResult = await model.generateContent(mediaPrompt);
      responseData.aiMediaDetection = JSON.parse(mediaResult.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "mediaFound": [], "verdict": "Clear", "summary": "No media references detected"}');
    }
    const reportId = hashKey.substring(0, 12);
    responseData.reportId = reportId;

    // Save with User ID
    await dbSaveVerification(userId, reportId, url || text, responseData.truthScore, responseData.claims.length, responseData);

    // Save to speed cache
    cacheSet(cacheKey, responseData);

    res.json(responseData);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message || 'Internal pipeline error' });
  }
});

// POST: Bulk URL Verification (Protected)
app.post('/api/verify/bulk', authenticate, async (req, res) => {
  const { urls } = req.body;
  const userId = req.userId;
  if (!urls || !Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: 'Provide an array of URLs' });
  if (urls.length > 5) return res.status(400).json({ error: 'Maximum 5 URLs per bulk request' });

  try {
    const results = [];
    for (const url of urls) {
      try {
        const content = await extractTextFromUrl(url);
        const result = await runVerificationPipeline(content);
        const reportId = getHash(url).substring(0, 12);
        result.reportId = reportId;
        await dbSaveVerification(userId, reportId, url, result.truthScore, result.claims.length, result);
        results.push({ url, status: 'success', data: result });
      } catch (err) {
        results.push({ url, status: 'error', error: err.message });
      }
    }
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 VeriCheck server running on port ${PORT}`);
});
