import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, Brain, Globe, Gavel, FileText,
  ShieldCheck, Network, ArrowRight, Grid,
  RefreshCw, AlertCircle, Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const GOLD2 = 'rgba(201,168,76,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const SURF  = 'rgba(255,255,255,0.035)';

/* ─── Pipeline data ───────────────────────────────────────────── */
const PIPELINE = [
  { id: '01', icon: LogIn,    title: 'Ingestion',    desc: 'Accepts raw URLs, PDF documents, or unstructured text via secure API endpoints with rate-limiting and provenance tracking.' },
  { id: '02', icon: Brain,    title: 'Extraction',   desc: 'NLP engines deconstruct narrative into atomic, verifiable claim units using named-entity recognition and dependency parsing.' },
  { id: '03', icon: Globe,    title: 'Retrieval',    desc: 'Autonomous agents query verified databases, public archives, and live academic repositories across 12k+ indexed sources.' },
  { id: '04', icon: Gavel,    title: 'Synthesis',    desc: 'Cross-references evidence against claims through multi-agent LLM consensus — minimum 3/3 agreement required per verdict.' },
  { id: '05', icon: FileText, title: 'Final Report', desc: 'Generates immutable PDF dossiers with cryptographic signatures, merkle-verified audit trails, and meta-data chains.' },
];

const INTEGRITY = [
  { icon: ShieldCheck, badge: 'Active',    badgeColor: '#4ade80', title: 'Cryptographic Hashing',  desc: 'Every verification step is hashed into a merkle tree, ensuring the audit trail remains tamper-proof and mathematically verifiable.' },
  { icon: Network,     badge: 'Redundant', badgeColor: GOLD,      title: 'Multi-Node Consensus',   desc: 'Verdicts require 3+ independent LLM agents to reach the same conclusion — mitigating hallucination and single-agent bias.' },
];

const BARS = [1,2,3,4,5,6,7,8,9,10,11,12];

/* ─── Intelligence modes ──────────────────────────────────────── */
const MODES = [
  {
    id:       '01',
    name:     'Standard',
    tag:      'Rapid Consensus',
    minTime:  1.0,
    maxTime:  1.5,
    unit:     'min',
    depth:    22,
    color:    '#60a5fa',
    howTo:    'Submit a URL or paste raw text. The system extracts top-level claims and cross-references them against primary indexed sources instantly.',
    result:   'Verdict card with a confidence score, top 3 supporting sources, and a one-paragraph summary. Ideal for live fact-checks.',
  },
  {
    id:       '02',
    name:     'Narrative Duel',
    tag:      'Bias Audit',
    minTime:  1.1,
    maxTime:  2.0,
    unit:     'min',
    depth:    48,
    color:    GOLD,
    howTo:    'Provide two competing narratives or articles. The engine runs a side-by-side bias audit, mapping rhetorical devices and source divergence.',
    result:   'Split-panel report highlighting claim overlaps, omissions, framing differences, and a bias gradient score per source.',
  },
  {
    id:       '03',
    name:     'Deep Research',
    tag:      'Exhaustive OSINT',
    minTime:  1.5,
    maxTime:  3.0,
    unit:     'min',
    depth:    74,
    color:    '#a78bfa',
    howTo:    'Input a topic, entity, or document. Autonomous agents conduct open-source intelligence sweeps across archives, filings, and academic repositories.',
    result:   'Multi-section dossier with timestamped evidence chains, entity graphs, and a full OSINT trail — exportable as signed PDF.',
  },
  {
    id:       '04',
    name:     'Pro Forensic',
    tag:      'Multi-Agent Audit',
    minTime:  2.0,
    maxTime:  4.0,
    unit:     'min',
    depth:    100,
    color:    '#f472b6',
    howTo:    'Upload a document or provide a high-stakes claim. Multiple independent LLM agents audit in parallel — minimum 3/3 consensus required before any verdict is issued.',
    result:   'Immutable forensic report with cryptographic hash, merkle-verified audit trail, per-agent deliberation logs, and confidence breakdown.',
  },
];

/* ─── Animated counter hook ──────────────────────────────────── */
function useCountUp(target, duration = 1200, active = true) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active || !target) return;
    const numeric = parseInt(String(target).replace(/,/g, ''), 10);
    if (isNaN(numeric)) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * numeric));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active]);
  return val.toLocaleString();
}

/* ─── Source row with animated counter ──────────────────────── */
function SourceRow({ src, index, animate }) {
  const count = useCountUp(src.count, 1000 + index * 150, animate);
  return (
    <motion.div
      className="arch-source-row"
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${src.color}12`, border: `1px solid ${src.color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>
        {src.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.2 }}>{src.label}</div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {src.description}
        </div>
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: src.color, flexShrink: 0, marginRight: 48 }}>
        {count}
      </span>
    </motion.div>
  );
}

/* ─── Skeleton loader ────────────────────────────────────────── */
function SourceSkeleton({ i }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', borderRadius: 10,
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', animation: `arch-shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ width: '55%', height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: `arch-shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
        <div style={{ width: '80%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', animation: `arch-shimmer 1.4s ease-in-out ${i * 0.1 + 0.15}s infinite` }} />
      </div>
      <div style={{ width: 36, height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.06)', animation: `arch-shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
    </div>
  );
}

/* ─── Status badge colour ────────────────────────────────────── */
function statusColor(s) {
  if (s === 'Live')    return '#4ade80';
  if (s === 'Syncing') return GOLD;
  return DIM;
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Architecture() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  /* ── Sources state ── */
  const [sources, setSources]             = useState([]);
  const [total, setTotal]                 = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [animateCounters, setAnimateCounters] = useState(false);
  const fetchingRef = useRef(false);

  async function fetchSources() {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    setAnimateCounters(false);
    setSources([]);

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a data API for a legal fact-checking system called Digital Jurist Protocol.
Return ONLY a valid JSON object — no markdown fences, no explanation, just the raw JSON.

Shape:
{
  "total": <integer — sum of all counts>,
  "refreshed": "<current ISO 8601 timestamp>",
  "sources": [
    {
      "label": "<category name>",
      "icon": "<single emoji relevant to the category>",
      "color": "<hex color — each category must have a distinct, saturated color>",
      "count": <integer>,
      "description": "<8–10 word description of this source category>",
      "status": "<one of: Live | Syncing | Cached>"
    }
  ]
}

Rules:
- Exactly 5 source categories relevant to legal/journalistic fact-checking.
- Be creative with naming — vary slightly each call (e.g. "Court Filings", "Regulatory Archives", "Wire Services", "Scientific Repositories", "Geo-Political Records").
- Counts must be realistic and uneven (e.g. 3,847 not 4,000). They must sum exactly to total.
- Colors must all be distinct from each other and from white/black.
- Vary status: mostly Live, one Syncing, one Cached.
- refreshed must be a valid ISO 8601 timestamp representing approximately now.`
          }]
        })
      });

      const data = await res.json();
      const raw = data.content?.find(b => b.type === 'text')?.text ?? '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      setSources(parsed.sources ?? []);
      setTotal(parsed.total);
      setLastRefreshed(parsed.refreshed);
      setTimeout(() => setAnimateCounters(true), 80);
    } catch (e) {
      setError('Index sync failed — retrying next cycle.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }

  useEffect(() => { fetchSources(); }, []);

  const totalCount = useCountUp(total ?? 0, 1400, animateCounters);

  return (
    <div style={{ background: '#08080E', minHeight: 'calc(100vh - 64px)', color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', paddingBottom: 64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .arch-pipeline-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 24px 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, background 0.25s;
          display: flex; flex-direction: column; gap: 14px;
        }
        .arch-pipeline-card:hover { border-color: rgba(255,255,255,0.13); background: rgba(255,255,255,0.05); }
        .arch-pipeline-card.highlight { background: ${GOLD2}; border-color: rgba(201,168,76,0.3); }
        .arch-pipeline-card.highlight:hover { border-color: rgba(201,168,76,0.5); }

        .arch-integrity-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 24px;
          transition: border-color 0.2s;
        }
        .arch-integrity-card:hover { border-color: rgba(255,255,255,0.13); }

        .arch-source-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          transition: border-color 0.2s, background 0.2s;
          position: relative;
        }
        .arch-source-row:hover { background: rgba(255,255,255,0.045); border-color: rgba(255,255,255,0.11); }

        .arch-refresh-btn {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: ${DIM}; transition: color 0.2s; line-height: 0; border-radius: 6px;
        }
        .arch-refresh-btn:hover { color: ${MUTED}; }
        .arch-refresh-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .arch-refresh-btn.spinning svg { animation: arch-spin 0.9s linear infinite; }

        @keyframes arch-pulse   { 0%,100%{opacity:.9} 50%{opacity:.4} }
        @keyframes arch-spin    { to { transform: rotate(360deg); } }
        @keyframes arch-shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }

        @media (max-width: 1024px) {
          .arch-main        { padding: 6px 28px 80px !important; }
          .arch-pipe-grid   { grid-template-columns: repeat(3, 1fr) !important; }
          .arch-modes-grid  { grid-template-columns: 1fr 1fr !important; }
          .arch-bottom-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .arch-main           { padding: 6px 16px 100px !important; }
          .arch-pipe-grid      { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .arch-modes-grid     { grid-template-columns: 1fr 1fr !important; }
          .arch-integrity-grid { grid-template-columns: 1fr !important; }
          .arch-pipe-arrow     { display: none !important; }
        }
        @media (max-width: 480px) {
          .arch-main       { padding: 6px 12px 100px !important; }
          .arch-pipe-grid  { grid-template-columns: 1fr !important; }
          .arch-modes-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main className="arch-main" style={{ flex: 1, maxWidth: 1240, margin: '0 auto', padding: '6px 48px 80px', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginBottom: 2, paddingBottom: 32, borderBottom: `1px solid ${LINE}` }}
        >
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px,4vw,52px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.1 }}>
            Digital Jurist Protocol.
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 560 }}>
            The DPJ-1 framework is a high-fidelity pipeline for rigorous verification of digital claims, using autonomous cross-referencing and semantic synthesis.
          </p>
        </motion.header>

        {/* ── Verification Pipeline ── */}
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, whiteSpace: 'nowrap' }}>Verification Pipeline</h2>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>
          <div className="arch-pipe-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {PIPELINE.map((step, i) => (
              <motion.div key={i} className={`arch-pipeline-card ${step.id === '05' ? 'highlight' : ''}`}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}>
                <span style={{ position: 'absolute', top: 14, right: 16, fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 52, fontWeight: 400, lineHeight: 1, color: step.id === '05' ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.04)', userSelect: 'none', pointerEvents: 'none' }}>{step.id}</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: step.id === '05' ? 'rgba(201,168,76,0.15)' : SURF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <step.icon size={15} color={step.id === '05' ? GOLD : DIM} />
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 7 }}>{step.title}</h3>
                  <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>{step.desc}</p>
                </div>
                {i < PIPELINE.length - 1 && (
                  <div className="arch-pipe-arrow" style={{ position: 'absolute', top: '50%', right: -14, transform: 'translateY(-50%)', zIndex: 2, color: DIM }}>
                    <ArrowRight size={14} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Multi-Mode Intelligence ── */}
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, whiteSpace: 'nowrap' }}>Multi-Mode Intelligence</h2>
            <div style={{ flex: 1, height: 1, background: LINE }} />
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Speed vs. Depth</span>
          </div>
          <p style={{ fontSize: 12, color: DIM, marginBottom: 22, fontFamily: "'DM Mono',monospace", letterSpacing: '0.03em' }}>
            These times reflect forensic depth of audit. Millions of calculations run per verification to ensure 100% certainty.
          </p>

          <div className="arch-modes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {MODES.map((mode, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                whileHover={{ borderColor: `${mode.color}40` }}
                style={{
                  background: SURF,
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderRadius: 14,
                  padding: '22px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                {/* Ghost number */}
                <span style={{ position: 'absolute', top: 10, right: 14, fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 52, fontWeight: 400, lineHeight: 1, color: `${mode.color}09`, userSelect: 'none', pointerEvents: 'none' }}>
                  {mode.id}
                </span>

                {/* Tag + name */}
                <div>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: mode.color, background: `${mode.color}14`, border: `1px solid ${mode.color}30`, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
                    {mode.tag}
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{mode.name} Mode</h3>
                </div>

                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 28, lineHeight: 1, color: mode.color, letterSpacing: '-0.03em' }}>
                    {mode.minTime}–{mode.maxTime}
                  </span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: MUTED, marginBottom: 3 }}>{mode.unit}</span>
                </div>

                {/* Depth bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: DIM, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Forensic Depth</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: mode.color }}>{mode.depth}%</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mode.depth}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                      style={{ height: '100%', borderRadius: 2, background: mode.color }}
                    />
                  </div>
                </div>

                <div style={{ height: 1, background: LINE }} />

                {/* How to use */}
                <div>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: mode.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>How to use</p>
                  <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.65 }}>{mode.howTo}</p>
                </div>

                {/* Output */}
                <div>
                  <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: mode.color, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Output</p>
                  <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.65 }}>{mode.result}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── System Integrity + Live Sources ── */}
        <div className="arch-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

          {/* Left: Integrity */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, whiteSpace: 'nowrap' }}>System Integrity</h2>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>

            <div className="arch-integrity-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {INTEGRITY.map((card, i) => (
                <motion.div key={i} className="arch-integrity-card"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: SURF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon size={16} color={card.badgeColor} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: card.badgeColor, background: `${card.badgeColor}14`, border: `1px solid ${card.badgeColor}33`, padding: '3px 9px', borderRadius: 4, textTransform: 'uppercase' }}>
                      {card.badge}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{card.title}</h4>
                  <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>{card.desc}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '24px 26px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6 }}>Uptime & Real-time Monitoring</h4>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>
                    System operates at <span style={{ color: '#4ade80', fontWeight: 600 }}>99.98%</span> reliability with global edge distribution active.
                  </p>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
                    {BARS.map(b => (
                      <div key={b} style={{ width: 6, borderRadius: 3, height: b === 6 ? 32 : 16 + (b % 3) * 6, background: b === 6 ? '#f87171' : '#4ade80', opacity: b === 6 ? 0.9 : 0.25 + (b * 0.04), animation: b === 6 ? 'arch-pulse 2s ease-in-out infinite' : 'none' }} />
                    ))}
                  </div>
                </div>
                <div style={{ opacity: 0.03, flexShrink: 0 }}><Grid size={100} color={TEXT} /></div>
              </div>
            </motion.div>
          </section>

          {/* Right: Live Sources */}
        

        </div>
      </main>
    </div>
  );
}