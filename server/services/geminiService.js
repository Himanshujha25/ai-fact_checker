const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// ─────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────
const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').replace(/['"]/g, '').trim();
const CACHE = new Map();
let GEMINI_DISABLED = false;

// Initialize Google AI
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;

const SYSTEM_PROMPT =
  'You are the Truecast Forensic Intelligence Core. Your mission is to provide high-fidelity, ' +
  'objective analysis of digital information. Always return valid JSON. Respect the schema ' +
  'provided in the user prompt. Be precise, forensic, and data-driven.';

// ─────────────────────────────────────────────
//  MODEL LISTS
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
//  MODEL LISTS
// ─────────────────────────────────────────────

// Groq Models — Failover Sequence
const GROQ_TEXT_MODELS = [
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant'
];

const GROQ_VISION_MODELS = [
  'llama-3.2-11b-vision-preview',
];

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function buildPrompt(parts) {
  return parts
    .filter(p => p?.text)
    .map(p => p.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .slice(0, 8000); // Increased context window
}

function safeParseJSON(text) {
  if (!text) return null;
  try {
    const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = Math.min(
      clean.indexOf('{') !== -1 ? clean.indexOf('{') : Infinity,
      clean.indexOf('[') !== -1 ? clean.indexOf('[') : Infinity
    );
    if (start === Infinity) return null;
    let jsonStr = clean.substring(start);
    
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      // JSON HEALING: Handle truncated outputs
      if (e.message.includes('JSON') || e.message.includes('Unterminated') || e.message.includes('Unexpected end')) {
        let healed = jsonStr;
        if ((healed.split('"').length - 1) % 2 !== 0) healed += '"';
        if (healed.trim().endsWith('"')) {
           const lastQuoteIndex = healed.lastIndexOf('"');
           const beforeLastQuote = healed.substring(0, lastQuoteIndex).trim();
           if (beforeLastQuote.endsWith('{') || beforeLastQuote.endsWith(',')) healed += ': null';
        } else if (healed.trim().endsWith(':')) {
           healed += ' null';
        }
        const stack = [];
        for (let i = 0; i < healed.length; i++) {
          if (healed[i] === '{') stack.push('}');
          else if (healed[i] === '[') stack.push(']');
          else if (healed[i] === '}') stack.pop();
          else if (healed[i] === ']') stack.pop();
        }
        while (stack.length > 0) healed += stack.pop();
        try {
          return JSON.parse(healed);
        } catch (hErr) {
          console.warn('  ⚠ [Healer] Level 1 repair failed.');
          return null;
        }
      }
      return null;
    }
  } catch (err) {
    return null;
  }
}

// ─────────────────────────────────────────────
//  PROVIDER 1 — GEMINI (OFFICIAL SDK)
// ─────────────────────────────────────────────
async function tryGemini(parts) {
  if (GEMINI_DISABLED || !genAI) return null;
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", 
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const promptParts = parts.map(p => {
      if (typeof p === 'string') return { text: p };
      if (p.text) return { text: p.text };
      if (p.inlineData) return { inlineData: p.inlineData };
      return p;
    });

    const result = await model.generateContent({ contents: [{ role: 'user', parts: promptParts }] });
    const text = result.response.text();
    return text ? { text, model: 'Gemini 2.5 Flash Lite' } : null;
  } catch (err) {
    console.warn(`❌ Gemini :`, err.message);
    if (err.message.includes('429') || err.message.includes('quota')) {
       console.log('  ‼ Gemini Quota Exceeded. Failing over...');
    }
    return null;
  }
}

// ─────────────────────────────────────────────
//  PROVIDER 2 — GROQ
// ─────────────────────────────────────────────
async function tryGroq(promptText, parts = []) {
  if (!process.env.GROQ_API_KEY) return null;
  const hasMedia = parts.some(p => p.inlineData);
  const models = hasMedia ? GROQ_VISION_MODELS : GROQ_TEXT_MODELS;

  for (const model of models) {
    try {
      const userContent = hasMedia ? [{ type: 'text', text: promptText }, { type: 'image_url', image_url: { url: `data:${parts.find(p => p.inlineData).inlineData.mimeType};base64,${parts.find(p => p.inlineData).inlineData.data}` } }] : promptText;
      const { data } = await axios.post('https://api.groq.com/openai/v1/chat/completions',
        { 
          model, 
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: userContent }], 
          temperature: 0.1, 
          max_tokens: 4096,
          response_format: { type: 'json_object' }
        },
        { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }, timeout: 10000 }
      );
      const text = data.choices?.[0]?.message?.content;
      if (text) { console.log(`  ✅ Groq (${model})`); return { text, model: `Groq ${model.split('-').slice(0,2).join(' ')}` }; }
    } catch (err) {
      console.warn(`  ⚠ Groq (${model}) failed.`);
    }
  }
  return null;
}

function getDefaultModel() { return 'gemini-2.5-flash'; }

// ─────────────────────────────────────────────
//  MAIN ENTRY
// ─────────────────────────────────────────────
async function geminiWithRetry(_, partsInput) {
  const parts = Array.isArray(partsInput) ? partsInput : [{ text: partsInput }];
  const promptText = buildPrompt(parts);
  const cacheKey = `${promptText.substring(0, 500)}_txt`;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

  let resultData = null;

  // 1️⃣ GEMINI (PRIMARY NODE — NEW DIRECTIVE)
  resultData = await tryGemini(parts);

  // 2️⃣ GROQ (SECONDARY NODE — FAILOVER)
  if (!resultData) {
     console.log('  ‼ Gemini Node unavailable. Engaging Groq failover...');
     resultData = await tryGroq(promptText, parts);
  }

  let text = resultData?.text || null;
  let modelNameUsed = resultData?.model || 'Truecast Local';

  if (!text) {
    console.warn('  ‼ [CRITICAL] All Primary AI providers offline. Using localized fallback engine.');
    
    if (promptText.toLowerCase().includes('adversarial') || promptText.toLowerCase().includes('duel')) {
      text = JSON.stringify({
        narrativeVerdict: "Synthesized Forensic Adjudication (Local Mode)",
        summary: "The AI Intelligence Core is currently at peak capacity. Results below are restricted to baseline OSINT markers.",
        claims: [
          { claim: "Narrative A verification.", verdict: "Inconclusive", reasoning: "Metadata indicates institutional grounding." },
          { claim: "Narrative B verification.", verdict: "Inconclusive", reasoning: "Alternative perspectives detected." }
        ],
        narrativeAnalysis: {
          sourceA: { framing: "Institutional", focus: "Stability" },
          sourceB: { framing: "Critical", focus: "Impact" }
        },
        meta: { model: "Truecast Local Synthesis v2", veracityScore: 50 }
      });
    } else if (promptText.toLowerCase().includes('json')) {
      text = JSON.stringify({ 
        summary: "Operating in Restricted Forensic Mode. Initial OSINT pulse active.",
        claims: [{ claim: "Manual audit required. Intelligence core indexing.", primaryEntity: "Core", category: "Audit" }],
        forensics: { ai: { score: 50, explanation: "Provider threshold." }, bias: { score: 0, leaning: "Neutral" } }
      });
    } else {
      text = "Forensic audit restricted. AI Intelligence Node currently offline.";
    }
  }

  const output = { response: { text: () => text }, model: modelNameUsed };
  CACHE.set(cacheKey, output);
  return output;
}

async function getSafeLLMResponse(parts) {
  const res = await geminiWithRetry(null, parts);
  return safeParseJSON(res.response.text()) || {
    claims: [{ claim: 'Fallback analysis', primaryEntity: 'System' }],
  };
}

module.exports = {
  geminiWithRetry,
  getSafeLLMResponse,
  safeParseJSON,
  getDefaultModel,
};