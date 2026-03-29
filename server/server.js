
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const ExifParser = require('exif-parser');
const { HfInference } = require('@huggingface/inference');


// ─── Tavily Research Agent (Live Web Search) ───
async function performTavilySearch(query, depth = 'basic') {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.warn('  ⚠ TAVILY_API_KEY missing — skipping live web search');
    return null;
  }

  try {
    const cleanQuery = typeof query === 'string' ? query.substring(0, 400) : 'General research query';
    console.log(`  [Tavily] Researching query: "${cleanQuery}" (depth: ${depth})...`);
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
      query: cleanQuery,
      search_depth: depth,
      include_answer: true,
      include_images: true,
      max_results: depth === 'advanced' ? 8 : 4
    }, { timeout: 15000 });

    const results = response.data;
    console.log(`  [Tavily] Found ${results.results?.length || 0} sources and ${results.images?.length || 0} images.`);

    return {
      answer: results.answer,
      images: results.images || [],
      sources: (results.results || []).map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        score: r.score
      }))
    };
  } catch (err) {
    console.error('  ✗ Tavily Search Error:', err.message);
    return null;
  }
}
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config — store uploads in memory for direct Gemini processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov|avi|mp3|wav|ogg|m4a/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split('/')[1]);
    cb(null, ext || mime);
  }
});

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// ─── PostgreSQL (with graceful fallback) ───
let db = null;
const initDB = async () => {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/factchecker';
    const isRemote = connectionString.includes('neon.tech') || connectionString.includes('render.com');
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      ssl: isRemote ? { rejectUnauthorized: false } : false
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

      -- Ensure columns exist in case table was created by an older script
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
          ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='organization') THEN
          ALTER TABLE users ADD COLUMN organization VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='verifications' AND column_name='user_id') THEN
          ALTER TABLE verifications ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    db = pool;
    console.log('✅ PostgreSQL connected & protocol schema verified');
  } catch (err) {
    console.error('❌ Database Initialization Error:', err.message);
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
      try {
        let fd = row.full_data;
        if (typeof fd === 'string') fd = JSON.parse(fd);
        return formatHistoryItem({
          id: row.id,
          input: row.input_text,
          truthScore: parseFloat(row.truth_score),
          claimsCount: row.claims_count,
          timestamp: row.created_at,
          fullData: fd
        });
      } catch (e) {
        console.error('Record format error:', e.message);
        return null;
      }
    }).filter(x => x !== null);
  } catch (err) {
    console.error('DB History Error:', err.message);
    return memoryHistory.filter(h => h.userId === userId).slice(-50).reverse().map(formatHistoryItem);
  }
}

async function dbGetReport(userId, id) {
  if (!db) {
    const entry = memoryHistory.find(h => h.id === id);
    return entry ? entry.fullData : null;
  }
  try {
    const result = await db.query('SELECT full_data FROM verifications WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      const entry = memoryHistory.find(h => h.id === id);
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
    thumbnail: h.fullData?.aiMediaDetection?.results?.[0]?.url || h.fullData?.forensicReference || null,
    topClaims: claims.slice(0, 3).map(c => ({ claim: c.claim?.substring(0, 80), verdict: c.verdict }))
  };
}

// ─── Middleware ───
const allowedOrigins = [
  'https://ai-fact-checker-dusky.vercel.app',
  'https://ai-fact-checker-dusky-git-main-himanshujha25s-projects.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Cross-Origin Protocol Rejection'));
    }
  },
  credentials: true
}));
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false,
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

    const results = [];
    console.log(`  [Upload] Processing ${req.files.length} files through enhanced forensic pipeline...`);

    for (const file of req.files) {
      const analysis = await analyzeMediaForAI(file, 'buffer');
      results.push({
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        ...analysis
      });
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
  if (!token || token === 'null' || token === 'undefined') return res.status(401).json({ error: 'Unauthorized: No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vericheck_secret_key_2026');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

const maybeAuthenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token || token === 'null' || token === 'undefined') {
    req.userId = null;
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vericheck_secret_key_2026');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    req.userId = null;
    next();
  }
};

// ─── Auth Routes ───
app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, organization } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    if (!db) {
      // Mock for memory mode
      return res.json({ message: 'User registered (Memory Mode)', userId: 1 });
    }
    const result = await db.query(
      'INSERT INTO users (email, password, full_name, organization) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, fullName, organization]
    );
    res.status(201).json({ message: 'User created', userId: result.rows[0].id });
  } catch (err) {
    console.error('❌ Register Error:', err.message, err.stack);
    res.status(400).json({ error: err.message.includes('unique') ? 'Email already exists' : 'Registration failed: ' + err.message });
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
    console.error('❌ Login Error:', err.message, err.stack);
    res.status(500).json({ error: 'Login failed: ' + err.message });
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

app.get('/api/history/:id', maybeAuthenticate, async (req, res) => {
  const data = await dbGetReport(req.userId, req.params.id);
  if (!data) return res.status(404).json({ error: 'Report not found' });
  res.json(data);
});

app.delete('/api/history', authenticate, async (req, res) => {
  const success = await dbDeleteHistory(req.userId);
  if (success) res.json({ message: 'History deleted' });
  else res.status(500).json({ error: 'Failed to delete history' });
});

// Helper: Extract Text AND Images from URL (with AI Fallback for blocks)
async function extractFromUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      },
      validateStatus: false,
      responseType: 'arraybuffer' // Download as buffer to handle both text and binary safely
    });

    const contentType = response.headers['content-type'] || '';
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');
    const isAudio = contentType.startsWith('audio/');

    if (isImage || isVideo || isAudio) {
      console.log(`  [Dynamic] Detected media URL (${contentType}): ${url}`);
      return { 
        text: `[MEDIA FILE DETECTED]\nType: ${contentType}\nURL: ${url}\n\nThis source is a direct media file. Forensic analysis will be performed on the visual/auditory components.`,
        imageUrls: [url],
        isMedia: true
      };
    }

    // Status 999 or 403? Use Tavily as a 'Proxy Scraper' for TEXT content
    if (response.status !== 200 || url.includes('linkedin.com')) {
      console.log(`  ⚠ Direct access blocked/failed (${response.status}) for ${url}. Activating AI Proxy Fallback...`);
      const research = await performTavilySearch(`Get the full content and details of this URL: ${url}`, 'advanced');

      if (research && research.answer) {
        return {
          text: `[AI Proxy Scraper Enabled] Source: ${url}\n\nRetrieved Data: ${research.answer}\n\nSearch Excerpts: ${research.sources?.map(s => s.snippet).join('\n')}`,
          imageUrls: [],
          blocked: false,
          viaProxy: true
        };
      }
    }

    if (response.status !== 200) {
      return { text: `[Scraper Error] Status ${response.status} for ${url}.`, imageUrls: [], error: true };
    }

    // Convert buffer to string for text/html processing
    const html = response.data.toString('utf-8');
    const title = html.match(/<title[^>]*>([\s\S]*)<\/title>/i)?.[1] || 'No Title';
    let content = html.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i)?.[2] ||
      html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || html;
    const cleanText = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const imageUrls = [];
    let match;
    while ((match = imgRegex.exec(html)) !== null && imageUrls.length < 3) {
      let imgUrl = match[1];
      if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/') && !imgUrl.startsWith('//')) imgUrl = new URL(imgUrl, url).href;
      if (!imgUrl.includes('favicon') && !imgUrl.includes('.svg')) imageUrls.push(imgUrl);
    }

    return {
      text: `Source URL: ${url}\nTitle: ${title}\n\nContent: ${cleanText.substring(0, 10000)}`,
      imageUrls
    };
  } catch (error) {
    console.warn(`  ✗ Scraping failed, trying AI fallback: ${error.message}`);
    const research = await performTavilySearch(`Deep research on URL: ${url}`);
    return {
      text: research ? `[Agentic Recovery] ${research.answer}` : `Fatal Scraper Error: ${error.message}`,
      imageUrls: [],
      error: !research
    };
  }
}

// Backward-compat wrapper
async function extractTextFromUrl(url) {
  const result = await extractFromUrl(url);
  return result.text;
}

// Helper: Analyze an image/video/audio for AI-generation / deepfake indicators
// Helper: Analyze an image/video/audio for AI-generation / deepfake indicators
async function analyzeMediaForAI(input, type = 'url') {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }); // Use flash for faster descriptive analysis
    const token = (process.env.HUGGINGFACE_API_KEY || '').replace(/['"]/g, '').trim();
    
    let buffer;
    let mimeType;
    let mediaUrl = type === 'url' ? input : 'Upload';

    // 1. Fetch/Resolve media as buffer
    if (type === 'url') {
      const mediaResponse = await axios.get(input, { responseType: 'arraybuffer', timeout: 8000 });
      buffer = Buffer.from(mediaResponse.data);
      mimeType = mediaResponse.headers['content-type'] || 'image/jpeg';
    } else {
      buffer = input.buffer;
      mimeType = input.mimetype || 'image/jpeg';
    }

    const base64 = buffer.toString('base64');
    const isVideo = mimeType.startsWith('video/');
    const isAudio = mimeType.startsWith('audio/');
    const isImage = mimeType.startsWith('image/');

    const indicators = [];
    let externalScore = 0;
    let externalSource = 'None';
    let provenanceSearch = null;

    // 2. REVERSE SEARCH / PROVENANCE (Search by Description)
    try {
      console.log('  [Provenance] Generating descriptive search query for reverse lookup...');
      const descPrompt = `Describe this ${isVideo ? 'video' : isAudio ? 'audio' : 'image'} in 10 words or less. Then generate a Google search query to find the ORIGINAL source of this media.
      Return ONLY JSON: {"description": "string", "searchQuery": "string"}`;
      
      const descRes = await model.generateContent([
        { inlineData: { mimeType, data: base64 } },
        descPrompt
      ]);
      const descData = JSON.parse(descRes.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"description": "Unknown media", "searchQuery": ""}');
      
      if (descData.searchQuery) {
        console.log(`  [Provenance] Searching for: "${descData.searchQuery}"...`);
        provenanceSearch = await performTavilySearch(descData.searchQuery + ' original source true version', 'basic');
        
        if (provenanceSearch?.sources?.length > 0) {
          const sourcesStr = provenanceSearch.sources.map(s => s.title).join(', ');
          if (sourcesStr.toLowerCase().includes('deepfake') || sourcesStr.toLowerCase().includes('manipulated') || sourcesStr.toLowerCase().includes('ai-generated')) {
             indicators.push(`Fact-checking sources flag this as suspicious: ${sourcesStr.substring(0, 100)}...`);
             externalScore = 90;
          } else {
             indicators.push(`Visual match found in public reports: ${provenanceSearch.sources[0].title}`);
          }
        }
      }
    } catch (e) {
      console.warn('  ⚠ Provenance search failed:', e.message);
    }

    // 3. LOCAL LIBRARY FORENSICS: EXIF Metadata Scan
    if (isImage) {
      try {
        const parser = ExifParser.create(buffer);
        const exifRes = parser.parse();
        const tags = exifRes.tags || {};
        
        if (tags.Software?.includes('AI') || tags.Software?.includes('DALL-E') || tags.Software?.includes('Midjourney') || tags.Software?.includes('Adobe Firefly')) {
          indicators.push(`AI software signature detected in metadata: ${tags.Software}`);
          externalScore = Math.max(externalScore, 85); 
        }
        if (!tags.Model && !tags.Make) {
          indicators.push('Missing camera hardware signatures (common in synthetic images)');
        }
        if (tags.Copyright?.includes('OpenAI') || tags.UserComment?.includes('AI Generated')) {
          indicators.push('Provider-level AI metadata markers detected');
          externalScore = Math.max(externalScore, 95);
        }
      } catch (e) { }
    }

    // 4. EXTERNAL LIBRARY: Hugging Face Inference (Direct API Call for stability)
    if (token && isImage) {
      try {
        console.log('  [HF] Forensic Model Check: prithivMLmods/Deep-Fake-Detector-Model...');
        const hfResponse = await axios.post(
          'https://api-inference.huggingface.co/models/prithivMLmods/Deep-Fake-Detector-Model',
          buffer,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        const hfData = hfResponse.data;
        if (Array.isArray(hfData)) {
          const fakeLabel = hfData.find(x => 
            x.label.toLowerCase() === 'fake' || 
            x.label.toLowerCase() === 'generated' || 
            x.label.toLowerCase() === 'ai'
          );
          const fakeScore = fakeLabel?.score || 0;
          
          if (fakeScore > 0.5) {
            indicators.push(`External Forensic Model flags as synthetic: ${(fakeScore * 100).toFixed(1)}%`);
            externalScore = Math.max(externalScore, fakeScore * 100);
            externalSource = 'Hugging Face PRITHIV-VL';
          }
        }
      } catch (e) {
        console.warn('  ⚠ HF API Inference failed:', e.response?.data?.error || e.message);
      }
    }

    // 5. CORE ENGINE: Gemini Agentic Analysis
    const analysisModel = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    let prompt = '';
    if (isVideo) {
      prompt = `Critically analyze this video for deepfake signs (temporal flickers, face-swapping artifacts, lip-sync errors). Return ONLY JSON: {"isAIGenerated": boolean, "confidence": number(0-100), "indicators": ["string"], "verdict": "Authentic"|"Likely AI-Generated"|"Possibly Manipulated"|"Inconclusive"}`;
    } else if (isAudio) {
      prompt = `Critically analyze this audio for synthetic voice cloning artifacts (unnatural breathing, robotic cadence, spectral mismatch). Return ONLY JSON: {"isAIGenerated": boolean, "confidence": number(0-100), "indicators": ["string"], "verdict": "Authentic"|"Likely AI-Generated"|"Possibly Manipulated"|"Inconclusive"}`;
    } else {
      prompt = `Critically analyze this image for GAN artifacts, diffusion anomalies, or synthetic face signatures (warped backgrounds, asymmetrical eyes, unnatural skin). Return ONLY JSON: {"isAIGenerated": boolean, "confidence": number(0-100), "indicators": ["string"], "verdict": "Authentic"|"Likely AI-Generated"|"Possibly Manipulated"|"Inconclusive"}`;
    }

    const geminiRes = await analysisModel.generateContent([
      { inlineData: { mimeType, data: base64 } },
      prompt
    ]);
    const jsonStr = geminiRes.response.text().match(/\{[\s\S]*\}/)?.[0] || '{}';
    const geminiData = JSON.parse(jsonStr);

    // MERGE RESULTS
    const finalConfidence = Math.max(geminiData.confidence || 0, externalScore);
    const finalIndicators = [...new Set([...(geminiData.indicators || []), ...indicators])];
    const isActuallyFake = finalConfidence > 60;

    return { 
      url: mediaUrl, 
      isAIGenerated: isActuallyFake,
      confidence: finalConfidence,
      indicators: finalIndicators,
      verdict: isActuallyFake ? 'Likely AI-Generated' : geminiData.verdict,
      externalScan: externalSource !== 'None' ? { source: externalSource, score: externalScore } : null,
      provenance: provenanceSearch ? { found: provenanceSearch.sources?.length > 0, matches: provenanceSearch.sources?.slice(0, 2) } : null
    };
  } catch (err) {
    return { url: input?.originalname || 'Media', isAIGenerated: false, confidence: 0, indicators: [], verdict: 'Analysis Failed', error: err.message };
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
    console.log(`  [Wiki] Attempting broader fallback for "${entityName}"...`);
    try {
      const fallbackUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(entityName)}&prop=pageimages|extracts&exintro&explaintext&pithumbsize=500&format=json`;
      const fallbackRes = await axios.get(fallbackUrl, { timeout: 8000, headers: { 'User-Agent': userAgent } });
      const pages = fallbackRes.data?.query?.pages || {};
      const page = Object.values(pages)[0];
      if (page && page.thumbnail) {
        return {
          name: page.title,
          image: page.thumbnail.source,
          description: page.extract?.substring(0, 100),
          wikipediaUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`
        };
      }
    } catch (e) { }

    return { name: entityName, description: "Identified private entity", isPrivate: true };
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

// Core verification pipeline — Chain-of-Thought + Multi-Mode Research Agent
async function runVerificationPipeline(contentToProcess, mode = 'normal', language = 'en', mediaForensics = null, onProgress = null) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  const currentDate = new Date().toISOString().split('T')[0];
  
  const notify = (msg) => {
    console.log(msg);
    if (onProgress) onProgress(msg);
  };

  // UNIFIED CLAIM LIMITS
  const claimLimits = {
    'normal': 3,
    'adversarial': 5,
    'deep': 5,
    'pro': 8,
    'deepfake': 2
  };
  const claimLimit = claimLimits[mode] || 3;

  notify(`🚀 Starting ${mode.toUpperCase()} Agentic Research Pipeline (Limit: ${claimLimit} claims)...`);

  // ─── PHASE 1: Claim Extraction ───
  notify(`  [Phase 1] Extracting claims (Lang: ${language})...`);
  const extractionPrompt = `You are a precision fact-extraction agent. Today's date is ${currentDate}.
  TASK: Extract AT MOST ${claimLimit} verifiable factual assertions from the text. 
  
  ${mode === 'deepfake' ? `
  SPECIAL CASE (FORENSIC DEEPFAKE MODE):
  - The input contains metadata about a media file ([MEDIA FILE DETECTED]).
  - Your task is NOT to extract the specific file type or URL as a claim.
  - Instead, formulate the core AUTHENTICITY claim.
  - Example: "The provided image/video/audio is an authentic, non-AI-generated recording."
  - If a subject is mentioned (e.g. "Deepfake of Obama"), the claim should be: "The provided media is a genuine recording of [Subject]."
  ` : ''}

  LANGUAGE: Provide all "claim" and "context" strings in ${language === 'hi' ? 'Hindi' : 'English'}.

  EXAMPLES OF REPHRASING QUESTIONS:
  - "Is Messi the goat?" -> "Lionel Messi is the greatest football player of all time."
  - "Is it raining in London?" -> "It is currently raining in London."
  
  SPECIAL CASE (Dossiers):
  If the text starts with "FORENSIC DOSSIER IMPORT", focus on the core factual assertions buried in the document summary, ignoring the metadata.

  Return ONLY a JSON array: [{"id": 1, "claim": "string", "context": "string", "primaryEntity": "string"}].
  Text: ${contentToProcess.substring(0, 5000)}`;

  const extractionResult = await retryWithBackoff(() => model.generateContent(extractionPrompt));
  let claims;
  try {
    claims = JSON.parse(extractionResult.response.text().match(/\[[\s\S]*\]/)?.[0] || '[]');
  } catch (e) { claims = []; }

  // FAILSAFE: If extraction returned nothing but we have input, force-inject a claim
  if (claims.length === 0 && contentToProcess.trim().length > 3) {
    notify('  [Failsafe] Manual claim injection triggered.');
    let fakeClaim = contentToProcess.substring(0, 500);
    
    // If it's pure media metadata, simplify it for the pipeline
    if (contentToProcess.includes('[MEDIA FILE DETECTED]')) {
      fakeClaim = "Forensic media authentication and source verification";
    }

    const genericSubject = contentToProcess.split(' ').slice(0, 5).join(' ');
    claims = [{ id: 1, claim: fakeClaim, context: "Direct User Inquiry", primaryEntity: genericSubject }];
  }

  // ─── PHASE 2: Verification with Multi-Mode Tools ───
  notify(`  [Phase 2] Verifying ${claims.length} claims (Mode: ${mode})...`);

  const verificationResults = await Promise.all(claims.map(async (claim) => {
    try {
      let researchData = null;

      // DEEP, PRO, or ADVERSARIAL Mode: Activate Tavily Live Web Research
      if (mode !== 'normal') {
        let query = claim.primaryEntity ? `${claim.claim} regarding ${claim.primaryEntity}` : claim.claim;
        
        // ADVERSARIAL: Specifically ask for conflicting perspectives
        if (mode === 'adversarial') {
          query = `Opposing viewpoints and conflicting reports on: ${claim.claim}`;
        }
        
        researchData = await performTavilySearch(query, mode === 'pro' ? 'advanced' : 'basic');
      }

      // ─── DYNAMIC PROMPT ROUTING ───
      const isIdentityClaim = claim.primaryEntity?.toLowerCase().includes('himanshu') ||
        claim.claim.toLowerCase().includes('person') ||
        claim.claim.toLowerCase().includes('employed');

      const verifyPrompt = `You are a state-of-the-art Fact-Checking Agent. 
  Date: ${currentDate}.
  CLAIM: "${claim.claim}"
  CONTEXT/SUBJECT: "${claim.primaryEntity || 'General Information'}"
  MODE: ${mode.toUpperCase()}
  RESEARCH DATA: ${researchData ? JSON.stringify(researchData) : "NONE (Use internal knowledge if this is a general fact)"}
  MEDIA FORENSICS: ${mediaForensics ? JSON.stringify(mediaForensics) : "N/A"}

  ${mode === 'deepfake' ? `
  [PROTOCOL: MEDIA FORENSICS]
  - Use MEDIA FORENSICS as the primary ground truth for the claim.
  - If MEDIA FORENSICS flags an image as suspicious/fake, the verdict for the "authenticity" claim MUST be "False" or "Likely False".
  - Perform extreme analytical scrutiny for identifying AI-generated media clones or deepfakes.
  - Look for technical artifacts: lighting mismatch, texture blurring, unnatural movements.
  - If a person is mentioned, check for digital identity preservation/spoofing.
  ` : ''}

  LANGUAGE REQUIREMENT:
  - You MUST return all text fields (verdict, reasoning, evidence text, chainOfThought) in ${language === 'hi' ? 'Hindi' : 'English'}.
  ${language === 'hi' ? '- For the "verdict" field, use only: "सही", "संभवतः सही", "आंशिक रूप से सही", "संभवतः गलत", "गलत", "पुष्टि नहीं की जा सकती".' : '- For the "verdict" field, use: "True", "Likely True", "Partially True", "Likely False", "False", "Unverifiable".'}

  ${isIdentityClaim ? `
  [PROTOCOL: IDENTITY RESOLUTION]
  - Subject appears to be a person. Use strict name-collision defense.
  - Target profile handle hint: himanshujha25
  - Filter out unrelated people with the same name.
  ` : `
  [PROTOCOL: GENERAL FACT-CHECK]
  - Subject is a factual claim, event, or statement.
  - If RESEARCH DATA is empty, use your vast INTERNAL KNOWLEDGE to verify (e.g., world capitals, historical facts).
  `}

  VERDICT RULES:
  1. DO NOT return "Unverifiable" for common knowledge (e.g., capitals, basic history) even if RESEARCH DATA is empty.
  2. For identity checks, mark as "Unverifiable" only if the specific target profile isn't found in research.
  3. VERDICT SPECTRUM: "True", "Likely True", "Partially True", "Likely False", "False", "Unverifiable".

  Return JSON: 
  { 
    "verdict": "string", 
    "confidence": number, 
    "isTimeSensitive": boolean,
    "sourceType": "INTERNAL_KNOWLEDGE" | "WEB_RESEARCH",
    "referenceImage": "URL string (pick best match from research images if relevant)",
    "identityCheck": "CONFIRMED" | "AMBIGUOUS" | "N/A",
    "persona": { "id": "string", "summary": "string", "isTarget": boolean },
    "reasoning": "multi-sentence explanation", 
    "evidence": [{"text": "snippet/fact", "source": "name", "url": "url"}],
    "chainOfThought": ["step-by-step logic"]
  }`;

      const verifyResult = await retryWithBackoff(() => model.generateContent(verifyPrompt));
      const jsonText = verifyResult.response.text().match(/\{[\s\S]*\}/)?.[0] || '{}';
      let parsed = JSON.parse(jsonText);
      parsed.claimId = claim.id;

      // Extra Entity Validation (Wikipedia) — run for potential reference images
      // Improved: Skip filenames or generic dossier references
      const skipWiki = !claim.primaryEntity || 
                       claim.primaryEntity.includes('.') || 
                       claim.primaryEntity.toLowerCase().includes('dossier') ||
                       claim.primaryEntity.length < 3;

      if (!skipWiki) {
        parsed.entityMetadata = await fetchEntityImage(claim.primaryEntity);
      }

      return parsed;
    } catch (err) {
      console.error(`  ✗ Error on claim ${claim.id}:`, err.message);
      return { claimId: claim.id, verdict: 'Unverifiable', confidence: 0, reasoning: 'Pipeline error: ' + err.message };
    }
  }));

  // ─── PHASE 3: AI Text Detection ───
  notify('  [Phase 3] AI text detection...');
  let aiDetection = { score: 0, explanation: 'Analysis unavailable' };
  try {
    const aiRes = await retryWithBackoff(() =>
      model.generateContent(`Analyze this text for AI generation probability (0-100). Return JSON: {"score": number, "explanation": "string"}. Text: ${contentToProcess.substring(0, 1000)}`)
    );
    aiDetection = JSON.parse(aiRes.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "explanation": "Unavailable"}');
  } catch (err) { }

  // ─── PHASE 4: Aggregate & Score ───
  const successfulResults = verificationResults.filter(v => v && v.verdict);
  const trueCount = successfulResults.filter(v => {
    const vLower = (v.verdict || '').toLowerCase();
    return ['true', 'likely true', 'accurate', 'verified', 'सही', 'संभवतः सही'].includes(vLower);
  }).length;
  const partialCount = successfulResults.filter(v => {
    const vLower = (v.verdict || '').toLowerCase();
    return ['partially true', 'mixed', 'आंशिक रूप से सही'].includes(vLower);
  }).length;
  const totalVerified = successfulResults.length || 1;
  let truthScore = Math.min(100, ((trueCount + partialCount * 0.5) / totalVerified) * 100);

  // For deepfake mode, truthScore reflects the probability of AI generation (the focus)
  if (mode === 'deepfake' && mediaForensics) {
    truthScore = mediaForensics.score || (mediaForensics.results?.[0]?.confidence) || 0;
  }

  const finalResponse = {
    originalText: contentToProcess,
    claims: claims.slice(0, claimLimit).map(c => ({ ...c, ...verificationResults.find(v => v.claimId === c.id) })),
    aiTextDetection: aiDetection,
    truthScore,
    forensicReference: verificationResults.map(v => v.entityMetadata?.image || v.referenceImage).find(img => img) || null,
    pipelineMeta: { mode, totalClaims: claims.length, verifiedCount: successfulResults.length },
    timestamp: new Date().toISOString()
  };

  // ─── PHASE 5: Narrative Duel (Adversarial Mode Only) ───
  if (mode === 'adversarial') {
    notify('  [Phase 5] Generating Narrative Duel analysis...');
    try {
      const narrativePrompt = `You are a Media Analyst & Forensic Linguist.
      TASK: Analyze the provided text and research data to identify two conflicting narratives or framing styles (Source A vs Source B).
      
      TEXT TO ANALYZE: ${contentToProcess.substring(0, 3000)}
      
      INSTRUCTIONS:
      1. Identify two distinct "Sources" or "Narratives" (e.g., Optimistic vs Pessimistic, Corporate vs Public, Pro-Regulation vs Anti-Regulation).
      2. For each, define their "framing" (how they present the facts) and their primary "focus".
      3. Generate a "comparativeBias" list: specific linguistic or data-driven differences (e.g., "Source A uses 40% more emotional language").
      
      LANGUAGE: All analysis text must be in ${language === 'hi' ? 'Hindi' : 'English'}.
      
      Return JSON:
      {
        "sourceA": { "framing": "string", "focus": "string" },
        "sourceB": { "framing": "string", "focus": "string" },
        "comparativeBias": ["string", "string", "string"]
      }`;

      const narrativeRes = await retryWithBackoff(() => model.generateContent(narrativePrompt));
      const narrativeJson = narrativeRes.response.text().match(/\{[\s\S]*\}/)?.[0];
      if (narrativeJson) {
        finalResponse.narrativeAnalysis = JSON.parse(narrativeJson);
      }
    } catch (err) {
      console.error('Narrative Analysis Error:', err.message);
    }
  }

  return finalResponse;
}

// POST: Single Fact-Check (Guest-Friendly)
app.post('/api/verify', maybeAuthenticate, async (req, res) => {
  const { text, url, mode, language = 'en' } = req.body;
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

    let mediaForensics = null;
    // AI Media Detection: analyze extracted images or text references
    if (imageUrls.length > 0) {
      console.log(`Analyzing ${imageUrls.length} media items for deepfake detection...`);
      const mediaAnalysis = await Promise.all(imageUrls.slice(0, 3).map(imgUrl => analyzeMediaForAI(imgUrl)));
      const aiGenCount = mediaAnalysis.filter(a => a.isAIGenerated).length;
      mediaForensics = {
        imagesFound: imageUrls.length,
        imagesAnalyzed: mediaAnalysis.length,
        results: mediaAnalysis,
        summary: aiGenCount > 0
          ? `${aiGenCount} of ${mediaAnalysis.length} items flagged as potentially AI-generated`
          : `All ${mediaAnalysis.length} analyzed items appear authentic`,
        verdict: aiGenCount > 0 ? 'Suspicious' : 'Authentic',
        score: Math.round((aiGenCount / mediaAnalysis.length) * 100)
      };
    } else {
      // Text-only input — use text-based media analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const mediaPrompt = `Analyze this text for references to synthetic/AI-generated media. Return JSON: {"score": number, "mediaFound": string[], "verdict": "string", "summary": "string"}. Text: ${contentToProcess.substring(0, 1000)}`;
      const mediaResult = await model.generateContent(mediaPrompt);
      mediaForensics = JSON.parse(mediaResult.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "mediaFound": [], "verdict": "Clear", "summary": "No media references detected"}');
    }

    console.log(`  [Dynamic] Processing payload: ${contentToProcess.substring(0, 50)}... (Lang: ${language})`);
    const responseData = await runVerificationPipeline(contentToProcess, mode || 'normal', language, mediaForensics);
    responseData.aiMediaDetection = mediaForensics;
    const reportId = hashKey.substring(0, 12);
    responseData.reportId = reportId;

    // Save with User ID (only if logged in)
    if (userId) {
      await dbSaveVerification(userId, reportId, url || text, responseData.truthScore, responseData.claims.length, responseData);
      // Save to speed cache
      cacheSet(cacheKey, responseData);
    }

    res.json(responseData);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: error.message || 'Internal pipeline error' });
  }
});

// POST: Streamed Fact-Check (SSE)
app.post('/api/verify-stream', maybeAuthenticate, async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendEvent = (type, data) => res.write(`data: ${JSON.stringify({ type, data })}\n\n`);

  const { text, url, mode, language = 'en' } = req.body;
  const userId = req.userId;
  let identifier = url || text;
  const hashKey = getHash(identifier);

  try {
    const cacheKey = `verify:${userId}:${hashKey}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      sendEvent('progress', 'Found cached forensic evidence. Restoring report...');
      sendEvent('complete', { ...cached, cached: true });
      return res.end();
    }

    sendEvent('progress', 'Initializing analysis pipeline...');

    let contentToProcess = text || '';
    let imageUrls = [];

    const urlPattern = /https?:\/\/[^\s]+/;
    const detectedUrl = text?.match(urlPattern)?.[0];
    const targetUrl = url || detectedUrl;

    if (targetUrl) {
      sendEvent('progress', `Processing URL: ${targetUrl}`);
      const extracted = await extractFromUrl(targetUrl);
      contentToProcess = `USER QUERY/CONTEXT: ${text || 'None'}\n\nSCRAPED CONTENT:\n${extracted.text}`;
      imageUrls = extracted.imageUrls || [];
    }

    if (!contentToProcess.trim()) {
      sendEvent('error', 'No content provided');
      return res.end();
    }

    let mediaForensics = null;
    if (imageUrls.length > 0) {
      sendEvent('progress', `Analyzing ${imageUrls.length} media items for deepfake detection...`);
      const mediaAnalysis = await Promise.all(imageUrls.slice(0, 3).map(imgUrl => analyzeMediaForAI(imgUrl)));
      const aiGenCount = mediaAnalysis.filter(a => a.isAIGenerated).length;
      mediaForensics = {
        imagesFound: imageUrls.length,
        imagesAnalyzed: mediaAnalysis.length,
        results: mediaAnalysis,
        summary: aiGenCount > 0
          ? `${aiGenCount} of ${mediaAnalysis.length} items flagged as potentially AI-generated`
          : `All ${mediaAnalysis.length} analyzed items appear authentic`,
        verdict: aiGenCount > 0 ? 'Suspicious' : 'Authentic',
        score: Math.round((aiGenCount / mediaAnalysis.length) * 100)
      };
    } else {
      sendEvent('progress', 'Analyzing text for media references...');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const mediaPrompt = `Analyze this text for references to synthetic/AI-generated media. Return JSON: {"score": number, "mediaFound": string[], "verdict": "string", "summary": "string"}. Text: ${contentToProcess.substring(0, 1000)}`;
      const mediaResult = await model.generateContent(mediaPrompt);
      mediaForensics = JSON.parse(mediaResult.response.text().match(/\{[\s\S]*\}/)?.[0] || '{"score": 0, "mediaFound": [], "verdict": "Clear", "summary": "No media references detected"}');
    }

    const responseData = await runVerificationPipeline(contentToProcess, mode || 'normal', language, mediaForensics, (msg) => {
      sendEvent('progress', msg);
    });

    responseData.aiMediaDetection = mediaForensics;
    const reportId = hashKey.substring(0, 12);
    responseData.reportId = reportId;

    if (userId) {
      await dbSaveVerification(userId, reportId, url || text, responseData.truthScore, responseData.claims.length, responseData);
      cacheSet(cacheKey, responseData);
    }

    sendEvent('progress', 'Finalizing forensic dossier...');
    sendEvent('complete', responseData);
    res.end();
  } catch (error) {
    console.error('Verification stream error:', error);
    sendEvent('error', error.message || 'Internal pipeline error');
    res.end();
  }
});

// POST: Bulk URL Verification (Protected)
app.post('/api/verify/bulk', authenticate, async (req, res) => {
  const { urls, mode } = req.body;
  const userId = req.userId;
  if (!urls || !Array.isArray(urls) || urls.length === 0) return res.status(400).json({ error: 'Provide an array of URLs' });
  if (urls.length > 5) return res.status(400).json({ error: 'Maximum 5 URLs per bulk request' });

  try {
    const results = [];
    for (const url of urls) {
      try {
        const content = await extractTextFromUrl(url);
        const result = await runVerificationPipeline(content, mode || 'normal');
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

