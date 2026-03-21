
import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, RefreshCw, Clock, AlertTriangle, Layers } from 'lucide-react';

const Architecture = () => {
  const flowSteps = [
    { label: 'USER INPUT', sub: 'Text / URL', border: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    null,
    { label: 'PHASE 1: CLAIM EXTRACTION', sub: 'Temporal-aware decomposition · Importance ranking', border: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    null,
    { label: 'PHASE 2: CoT VERIFICATION', sub: '7-step Chain-of-Thought + Self-Reflection per claim', border: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    null,
    { label: 'RETRY ENGINE', sub: 'Exponential backoff · 429 rate-limit recovery · Graceful degradation', border: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
    null,
    { label: 'PHASE 3: AI TEXT DETECTION', sub: 'Sentence uniformity · Hedging patterns · Vocabulary diversity', border: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    null,
    { label: 'PHASE 4: MEDIA DEEPFAKE SCAN', sub: 'Gemini Vision · GAN artifact detection · Per-image verdict', border: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    null,
    { label: 'AGGREGATE & SCORE', sub: 'Weighted truth score · Pipeline metadata · Conflict count', border: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Main Flow */}
      <div className="glass-card" style={{ padding: '3rem', marginBottom: '2rem' }}>
        <h2 className="section-title"><BrainCircuit /> Agentic Pipeline Architecture</h2>
        <div className="arch-flow-container" style={{ padding: '2.5rem', borderRadius: '1rem', border: '1px dashed var(--border-light)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            {flowSteps.map((item, i) =>
              item === null
                ? <div key={i} style={{ color: '#6366f1', fontSize: '1rem' }}>↓</div>
                : (
                  <div key={i} style={{ padding: '12px 24px', background: item.bg, border: `1px solid ${item.border}`, borderRadius: '1rem', textAlign: 'center', minWidth: '340px', maxWidth: '500px' }}>
                    <strong style={{ fontSize: '0.8rem' }}>{item.label}</strong>
                    <br /><span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{item.sub}</span>
                  </div>
                )
            )}
          </div>
        </div>
      </div>

      {/* Three Judge-Criteria Sections */}
      <div style={{ display: 'grid', gap: '2rem' }}>

        {/* 1. Pipeline Robustness */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', marginBottom: '1.5rem' }}>
            <RefreshCw size={22} /> Pipeline Robustness & Fault Tolerance
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Retry with Exponential Backoff</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Every API call goes through a retry engine (<code>retryWithBackoff</code>). If Gemini returns a 429 rate-limit error,
                the system waits exponentially longer before retrying (1s → 2s → 4s + random jitter). 3 retries max before graceful failure.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Graceful Degradation</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                If one claim fails verification, the pipeline <strong>does not abort</strong>. It marks that claim as "Unverifiable"
                with <code>pipelineError: true</code> and continues to the next claim. The final score only counts successfully verified claims.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Multi-Layer Caching</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Results are cached in-memory (Map with 24h TTL) and persisted to PostgreSQL.
                Repeated checks return instantly with a "⚡ CACHED" badge.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Rate Limiting</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                20 requests per 15 minutes per IP via <code>express-rate-limit</code>. Prevents API cost abuse
                and protects upstream Gemini quotas.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Handling Ambiguity */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b', marginBottom: '1.5rem' }}>
            <AlertTriangle size={22} /> Handling Ambiguity & Conflict
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>⏳ Temporal Awareness</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Claims like "The current CEO of Google is..." are flagged as <strong>time-sensitive</strong> during extraction.
                The verification prompt includes today's date and asks the model to check if the fact was
                "true before but no longer." Results show ⏳ TEMPORAL badges and specific warnings.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>⚡ Source Conflict Detection</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Step 4 of the verification process explicitly checks if sources agree or conflict.
                Conflicting sources are weighted by credibility hierarchy:
                <strong> Academic &gt; .gov/.edu &gt; Major News &gt; Blog &gt; Social Media</strong>.
                Conflicts are shown as red alerts in the UI.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Importance Ranking</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Each claim is classified as "high", "medium", or "low" importance during extraction. High-importance claims
                get a red <strong>HIGH</strong> badge, helping users focus on the most impactful assertions first.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Confidence Calibration</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Self-reflection step instructs the model: "If uncertain, LOWER confidence rather than guessing."
                This prevents overconfident verdicts on ambiguous claims. Users can filter by confidence threshold.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Prompt Engineering */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#6366f1', marginBottom: '1.5rem' }}>
            <Layers size={22} /> Advanced Prompt Engineering
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>7-Step Chain-of-Thought (CoT)</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Each claim goes through a structured 7-step reasoning chain:
                <strong> Decompose → Search Strategy → Evidence → Source Conflict Check → Temporal Check → Self-Reflection → Final Verdict</strong>.
                All 7 steps are returned and displayed in the UI.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Self-Reflection</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Step 6 explicitly asks: <em>"Am I being fair? Could I be wrong? Is my evidence sufficient?"</em>
                This forces the model to second-guess its reasoning before committing to a verdict, reducing hallucination risk.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Structured JSON Output</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                All prompts enforce strict JSON output schemas, ensuring deterministic parsing.
                Failed JSON parses trigger safe fallback objects rather than crash the pipeline.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Role-Based Prompting</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                Each prompt begins with a specialist persona: "You are a precision fact-extraction agent" or
                "You are a meticulous fact-verification agent." This primes the model for domain-specific reasoning.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="glass-card" style={{ padding: '2.5rem', marginTop: '2rem' }}>
        <h3 style={{ fontSize: '0.7rem', color: '#6366f1', letterSpacing: '0.2em', marginBottom: '1.5rem' }}>TECHNOLOGY STACK</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['React 18', 'React Router DOM', 'Framer Motion', 'Node.js', 'Express', 'PostgreSQL', 'Gemini 2.5 Pro', 'Gemini Vision', 'html2pdf.js', 'express-rate-limit', 'Helmet', 'Axios'].map(t => (
            <span key={t} className="tech-pill">{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Architecture;
