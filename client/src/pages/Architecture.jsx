import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogIn, Brain, Globe, Gavel, FileText,
  ShieldCheck, Network, ArrowRight, Info, Grid
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
  { id: '01', icon: LogIn,     title: 'Ingestion',    desc: 'Accepts raw URLs, PDF documents, or unstructured text via secure API endpoints with rate-limiting and provenance tracking.' },
  { id: '02', icon: Brain,     title: 'Extraction',   desc: 'NLP engines deconstruct narrative into atomic, verifiable claim units using named-entity recognition and dependency parsing.' },
  { id: '03', icon: Globe,     title: 'Retrieval',    desc: 'Autonomous agents query verified databases, public archives, and live academic repositories across 12k+ indexed sources.' },
  { id: '04', icon: Gavel,     title: 'Synthesis',    desc: 'Cross-references evidence against claims through multi-agent LLM consensus — minimum 3/3 agreement required per verdict.' },
  { id: '05', icon: FileText,  title: 'Final Report', desc: 'Generates immutable PDF dossiers with cryptographic signatures, merkle-verified audit trails, and meta-data chains.' },
];

const MODELS = [
  { name: 'Jurist-V4-Pro',    status: 'Production', version: 'v4.2.0', desc: 'Optimised for academic retrieval' },
  { name: 'Jurist-V5-Alpha',  status: 'Beta',       version: 'v5.0.1', desc: 'Neural evidence synthesis',      active: true },
  { name: 'Extractor-v3',     status: 'Deprecated', version: '–',      desc: 'Pattern-match only',             legacy: true },
];

const INTEGRITY = [
  {
    icon: ShieldCheck,
    badge: 'Active',
    badgeColor: '#4ade80',
    title: 'Cryptographic Hashing',
    desc: 'Every verification step is hashed into a merkle tree, ensuring the audit trail remains tamper-proof and mathematically verifiable.',
  },
  {
    icon: Network,
    badge: 'Redundant',
    badgeColor: GOLD,
    title: 'Multi-Node Consensus',
    desc: 'Verdicts require 3+ independent LLM agents to reach the same conclusion — mitigating hallucination and single-agent bias.',
  },
];

/* ─── Uptime bars ─────────────────────────────────────────────── */
const BARS = [1,2,3,4,5,6,7,8,9,10,11,12];

/* ═══════════════════════════════════════════════════════════════ */
export default function Architecture() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('All');

  return (
    <div style={{ background: '#08080E', minHeight: 'calc(100vh - 64px)', color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex', paddingBottom: 64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .arch-pipeline-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 24px 22px;
          position: relative; overflow: hidden;
          transition: border-color 0.25s, background 0.25s;
          display: flex; flex-direction: column; gap: 14px;
        }
        .arch-pipeline-card:hover {
          border-color: rgba(255,255,255,0.13);
          background: rgba(255,255,255,0.05);
        }
        .arch-pipeline-card.highlight {
          background: ${GOLD2};
          border-color: rgba(201,168,76,0.3);
        }
        .arch-pipeline-card.highlight:hover {
          border-color: rgba(201,168,76,0.5);
        }

        .arch-integrity-card {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 24px 24px;
          transition: border-color 0.2s;
        }
        .arch-integrity-card:hover { border-color: rgba(255,255,255,0.13); }

        .arch-model-card {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 18px 20px;
          transition: border-color 0.2s;
        }
        .arch-model-card.active {
          background: ${GOLD2};
          border-color: rgba(201,168,76,0.3);
        }
        .arch-model-card.legacy { opacity: 0.38; }

        .arch-footer-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'DM Mono', monospace; font-size: 10px; color: ${DIM};
          letter-spacing: 0.06em; transition: color 0.2s;
        }
        .arch-footer-btn:hover { color: rgba(232,228,220,0.55); }
      `}</style>

      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main style={{ flex: 1, maxWidth: 1240, margin: '0 auto', padding: '6px 48px 80px', overflowY: 'auto' }}>

        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginBottom: 2, paddingBottom: 32, borderBottom: `1px solid ${LINE}` }}
        >
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 20, height: 1, background: GOLD, opacity: 0.55 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Architecture Documentation
            </span>
          </div> */}
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.1 }}>
            Digital Jurist Protocol.
          </h1>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 560 }}>
            The DPJ-1 framework is a high-fidelity pipeline for rigorous verification of digital claims, using autonomous cross-referencing and semantic synthesis.
          </p>
        </motion.header>

        {/* ── Verification Pipeline ── */}
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, whiteSpace: 'nowrap' }}>
              Verification Pipeline
            </h2>
            <div style={{ flex: 1, height: 1, background: LINE }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {PIPELINE.map((step, i) => (
              <motion.div
                key={i}
                className={`arch-pipeline-card ${step.id === '05' ? 'highlight' : ''}`}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35 }}
              >
                {/* Step number ghost */}
                <span style={{
                  position: 'absolute', top: 14, right: 16,
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 52, fontWeight: 400, lineHeight: 1,
                  color: step.id === '05' ? `rgba(201,168,76,0.12)` : 'rgba(255,255,255,0.04)',
                  userSelect: 'none', pointerEvents: 'none',
                }}>
                  {step.id}
                </span>

                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: step.id === '05' ? 'rgba(201,168,76,0.15)' : SURF,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <step.icon size={15} color={step.id === '05' ? GOLD : DIM} />
                </div>

                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 7 }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
                    {step.desc}
                  </p>
                </div>

                {/* Arrow connector */}
                {i < PIPELINE.length - 1 && (
                  <div style={{ position: 'absolute', top: '50%', right: -14, transform: 'translateY(-50%)', zIndex: 2, color: DIM }}>
                    <ArrowRight size={14} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── System Integrity + Model Versions ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>

          {/* Left: Integrity */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT, whiteSpace: 'nowrap' }}>
                System Integrity
              </h2>
              <div style={{ flex: 1, height: 1, background: LINE }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {INTEGRITY.map((card, i) => (
                <motion.div
                  key={i}
                  className="arch-integrity-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: SURF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <card.icon size={16} color={card.badgeColor} />
                    </div>
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
                      color: card.badgeColor,
                      background: `${card.badgeColor}14`,
                      border: `1px solid ${card.badgeColor}33`,
                      padding: '3px 9px', borderRadius: 4, textTransform: 'uppercase',
                    }}>
                      {card.badge}
                    </span>
                  </div>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 8 }}>{card.title}</h4>
                  <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>{card.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Uptime monitor */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '24px 26px', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: TEXT, marginBottom: 6 }}>
                    Uptime & Real-time Monitoring
                  </h4>
                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 18, lineHeight: 1.6 }}>
                    System operates at{' '}
                    <span style={{ color: '#4ade80', fontWeight: 600 }}>99.98%</span>
                    {' '}reliability with global edge distribution active.
                  </p>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end' }}>
                    {BARS.map(b => (
                      <div
                        key={b}
                        style={{
                          width: 6, borderRadius: 3,
                          height: b === 6 ? 32 : 16 + (b % 3) * 6,
                          background: b === 6 ? '#f87171' : '#4ade80',
                          opacity: b === 6 ? 0.9 : 0.25 + (b * 0.04),
                          animation: b === 6 ? 'arch-pulse 2s ease-in-out infinite' : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <style>{`@keyframes arch-pulse { 0%,100% { opacity:.9 } 50% { opacity:.4 } }`}</style>
                </div>
                {/* Background grid watermark */}
                <div style={{ opacity: 0.03, flexShrink: 0 }}>
                  <Grid size={100} color={TEXT} />
                </div>
              </div>
            </motion.div>
          </section>

          {/* Right: Model versions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: TEXT }}>
                Models
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MODELS.map((m, i) => (
                <motion.div
                  key={i}
                  className={`arch-model-card ${m.active ? 'active' : ''} ${m.legacy ? 'legacy' : ''}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: m.legacy ? 0.38 : 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: m.active ? GOLD : m.legacy ? DIM : MUTED,
                    }}>
                      {m.status}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: m.active ? GOLD : DIM }}>
                      {m.version}
                    </span>
                  </div>
                  <h5 style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{m.name}</h5>
                  <p style={{ fontSize: 11, color: MUTED }}>{m.desc}</p>
                </motion.div>
              ))}

              {/* Integration note */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{
                  marginTop: 6,
                  background: GOLD2, border: `1px solid rgba(201,168,76,0.22)`,
                  borderRadius: 12, padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                  <Info size={12} color={GOLD} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Integration
                  </span>
                </div>
                <p style={{ fontSize: 11, color: MUTED, lineHeight: 1.65 }}>
                  Target{' '}
                  <code style={{ fontFamily: "'DM Mono', monospace", color: GOLD, fontSize: 11 }}>
                    /v1/stable/verify
                  </code>
                  {' '}for production. Webhook callbacks use{' '}
                  <span style={{ fontWeight: 600, color: TEXT }}>HMAC-SHA256</span>
                  {' '}signatures.
                </p>
              </motion.div>
            </div>
          </section>
        </div>
      </main>

      {/* ── Persistent footer ── */}
     
    </div>
  );
}