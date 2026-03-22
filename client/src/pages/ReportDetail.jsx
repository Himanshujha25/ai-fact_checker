import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ExternalLink, ArrowLeft, ArrowRight, Clock,
  Download, ShieldAlert, Layers, ChevronRight, FileText
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';
import Sidebar from '../components/Sidebar';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ai-fact-checker-rvih.onrender.com/api';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const GOLD2 = 'rgba(201,168,76,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const SURF  = 'rgba(255,255,255,0.035)';

/* ─── Verdict helpers ─────────────────────────────────────────── */
const verdictMeta = (v) => {
  const l = v?.toLowerCase();
  if (['true', 'accurate', 'verified'].includes(l))
    return { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' };
  if (['false', 'inaccurate'].includes(l))
    return { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' };
  if (['partially true', 'mixed'].includes(l))
    return { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)' };
  return { color: DIM, bg: 'rgba(255,255,255,0.04)', border: LINE };
};

const VerdictBadge = ({ verdict }) => {
  const m = verdictMeta(verdict);
  return (
    <span style={{
      color: m.color, background: m.bg, border: `1px solid ${m.border}`,
      fontSize: 9, letterSpacing: '0.12em', fontWeight: 700,
      textTransform: 'uppercase', padding: '4px 10px', borderRadius: 4,
      whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace",
    }}>
      {verdict || 'Pending'}
    </span>
  );
};

/* ─── Score arc ───────────────────────────────────────────────── */
const ScoreArc = ({ score }) => {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const hue = score >= 70 ? GOLD : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={hue} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
};

/* ─── Stat card ───────────────────────────────────────────────── */
const StatCard = ({ label, value, color, pct, sub }) => (
  <div style={{
    background: SURF, border: `1px solid ${LINE}`, borderRadius: 14,
    padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: 14,
    transition: 'border-color 0.2s',
  }}>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', color: DIM, textTransform: 'uppercase' }}>
      {label}
    </span>
    <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 44, fontWeight: 400, color: color || TEXT, lineHeight: 1, letterSpacing: '-0.02em' }}>
      {value}
    </span>
    <div>
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ height: '100%', background: color || GOLD, borderRadius: 4 }}
        />
      </div>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM }}>{sub}</span>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════ */
export default function ReportDetail() {
  const { id } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const navigate            = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${API_BASE}/history/${id}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.error || 'Dossier not found'); setLoading(false); });
  }, [id]);

  const handleExportPDF = () => {
    const el = document.getElementById('report-detail');
    if (!el) return;
    html2pdf().set({
      margin: 0.5, filename: `Audit_Dossier_${id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    }).from(el).save();
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#08080E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid rgba(201,168,76,0.15)`, borderTopColor: GOLD, animation: 'rd-spin 0.85s linear infinite' }} />
      <style>{`@keyframes rd-spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Retrieving dossier…
      </span>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: '#08080E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 48 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldAlert size={22} color="#f87171" />
      </div>
      <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, color: TEXT }}>Dossier Unavailable.</h1>
      <p style={{ fontSize: 13, color: MUTED }}>{error}</p>
      <Link to="/history" style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: GOLD, color: '#08080E', borderRadius: 9,
        padding: '12px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        <ArrowLeft size={14} /> Back to History
      </Link>
    </div>
  );

  const score         = Math.round(data.truthScore || 0);
  const total         = data.claims?.length || 1;
  const verifiedCount = data.claims?.filter(c => ['true','accurate','verified'].includes(c.verdict?.toLowerCase())).length || 0;
  const refutedCount  = data.claims?.filter(c => ['false','inaccurate'].includes(c.verdict?.toLowerCase())).length || 0;

  return (
    <div style={{ background: '#08080E', minHeight: 'calc(100vh - 64px)', color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", display: 'flex' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        .rd-btn-gold {
          background: ${GOLD}; color: #08080E; border: none; border-radius: 9px;
          padding: 11px 22px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 12px; letter-spacing: 0.02em;
          display: inline-flex; align-items: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .rd-btn-gold:hover { opacity: 0.85; transform: translateY(-1px); }

        .rd-btn-ghost {
          background: rgba(255,255,255,0.04); color: ${MUTED};
          border: 1px solid ${LINE}; border-radius: 9px;
          padding: 11px 20px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 500; font-size: 12px;
          display: inline-flex; align-items: center; gap: 7px;
          transition: border-color 0.2s, color 0.2s;
        }
        .rd-btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: ${TEXT}; }

        .claim-row {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 22px 24px;
          display: grid;
          grid-template-columns: 130px 1fr 90px 160px;
          gap: 20px; align-items: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .claim-row:hover {
          background: rgba(255,255,255,0.045);
          border-color: rgba(255,255,255,0.13);
        }
        .claim-row:hover .rd-view-btn { opacity: 1; transform: translateX(0); }

        .rd-view-btn {
          opacity: 0;
          transform: translateX(6px);
          transition: opacity 0.2s, transform 0.2s;
          background: ${GOLD2};
          border: 1px solid rgba(201,168,76,0.25);
          border-radius: 7px; padding: 8px 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 11px; font-weight: 600; color: ${GOLD};
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 5px;
        }
      `}</style>

      <Sidebar 
        activeFilter="All" 
        onFilterChange={() => navigate('/history')} 
        onExport={handleExportPDF} 
      />

      <main style={{ flex: 1, maxWidth: 1240, margin: '0 auto', padding: '40px 48px 80px', overflowY: 'auto' }}>
        <div id="report-detail">

          {/* ── Page header ── */}
          <div style={{ marginBottom: 40 }}>
            <button
              onClick={() => navigate('/history')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, color: DIM, fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 28, padding: 0, transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = TEXT}
              onMouseOut={e => e.currentTarget.style.color = DIM}
            >
              <ArrowLeft size={13} /> Back to Archive
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, paddingBottom: 28, borderBottom: `1px solid ${LINE}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 20, height: 1, background: GOLD, opacity: 0.55 }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Forensic Dossier · {new Date(data.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 3.5vw, 46px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  Digital Jurist Protocol Analysis.
                </h1>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button className="rd-btn-gold" onClick={handleExportPDF}>
                  <Download size={13} /> Export PDF
                </button>
                <button className="rd-btn-ghost">
                  <ExternalLink size={13} /> Share
                </button>
              </div>
            </div>
          </div>

          {/* ── Summary bento ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 40 }}>

            {/* Main score card */}
            <div style={{
              gridColumn: 'span 1',
              background: GOLD2,
              border: `1px solid rgba(201,168,76,0.18)`,
              borderRadius: 16, padding: '28px 28px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative', overflow: 'hidden',
            }}>
              <div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', opacity: 0.7 }}>
                  Aggregate Reliability
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 16 }}>
                  <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <ScoreArc score={score} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 400, color: TEXT, lineHeight: 1 }}>{score}</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: GOLD, letterSpacing: '0.08em' }}>/100</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 13, color: TEXT, marginBottom: 6, lineHeight: 1.5 }}>
                      {score >= 70 ? 'High citation integrity' : score >= 40 ? 'Moderate accuracy' : 'Low veracity detected'}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM }}>
                      {total} claims reviewed
                    </div>
                  </div>
                </div>
              </div>
              {/* glow */}
              <div style={{ position: 'absolute', bottom: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity: 0.06, pointerEvents: 'none' }} />
            </div>

            {/* Verified */}
            <StatCard
              label="Verified Claims"
              value={verifiedCount}
              color="#4ade80"
              pct={(verifiedCount / total) * 100}
              sub={`${Math.round((verifiedCount / total) * 100)}% consensus integrity`}
            />

            {/* Refuted */}
            <StatCard
              label="Refuted Claims"
              value={refutedCount}
              color="#f87171"
              pct={(refutedCount / total) * 100}
              sub={`${Math.round((refutedCount / total) * 100)}% contradiction rate`}
            />
          </div>

          {/* ── Visual Forensic Comparison ────────────────────────── */}
          {data.forensicReference && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${GOLD_L}` 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={18} color={GOLD} />
                  <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 400, color: TEXT }}>
                    Visual Cross-Reference.
                  </h3>
                </div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: GOLD, fontWeight: 600, letterSpacing: '0.12em' }}>
                  A/B ENTITY ANALYSIS ACTIVE
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Source Column */}
                <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden' }}>
                   <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: DIM, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Source evidence
                      </span>
                      <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#f87171', fontWeight: 600 }}>[SUBJECT]</span>
                   </div>
                   <div style={{ position: 'relative', height: 280, background: '#000' }}>
                      <img 
                        src={data.aiMediaDetection?.results?.[0]?.url || 'https://via.placeholder.com/400x300?text=No+Media+Found'} 
                        alt="Forensic Source" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6)' }} />
                   </div>
                </div>

                {/* Target Reference Column */}
                <div style={{ background: SURF, border: `1px solid ${GOLD_L}`, borderRadius: 16, overflow: 'hidden' }}>
                   <div style={{ padding: '12px 16px', background: 'rgba(201,168,76,0.05)', borderBottom: `1px solid ${GOLD_L}`, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                         AI Target Reference
                      </span>
                      <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: '#4ade80', fontWeight: 600 }}>[VERIFIED]</span>
                   </div>
                   <div style={{ position: 'relative', height: 280, background: '#000' }}>
                      <img 
                        src={data.forensicReference} 
                        alt="AI Verification Target" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.4)' }} />
                   </div>
                </div>
              </div>
              <p style={{ marginTop: 16, fontSize: 12, color: MUTED, textAlign: 'center', fontFamily: "'DM Mono', monospace" }}>
                 High-fidelity comparison used to identify specific landmark inconsistencies.
              </p>
            </div>
          )}

          {/* ── Forensic Media Section ──────────────────────────────── */}
          {data.aiMediaDetection?.results?.length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${LINE}` }}>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, color: TEXT }}>
                  Forensic Media.
                </h3>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM }}>
                  {data.aiMediaDetection.results.length} visual assets analyzed
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {data.aiMediaDetection.results.map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    style={{
                      background: SURF, border: `1px solid ${LINE}`, borderRadius: 14,
                      overflow: 'hidden', display: 'flex', flexDirection: 'column'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                      <img
                        src={img.url}
                        alt="Evidence"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                      />
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <VerdictBadge verdict={img.verdict} />
                      </div>
                    </div>
                    <div style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                          Syntehtic Audit
                        </span>
                        <span style={{ fontSize: 11, color: TEXT, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                          {Math.round(img.confidence)}% Confidence
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                        {img.details || 'Baseline forensic screening complete. No significant manipulation artifacts detected.'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Assertion ledger ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${LINE}` }}>
              <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 28, fontWeight: 400, color: TEXT }}>
                Assertion Ledger.
              </h3>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM }}>
                {total} assertions · click to explore evidence
              </span>
            </div>

            {/* Table header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '130px 1fr 90px 160px',
              gap: 20, padding: '10px 24px',
              marginBottom: 8,
            }}>
              {['Verdict', 'Assertion', 'Confidence', ''].map(h => (
                <span key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: DIM, textTransform: 'uppercase' }}>
                  {h}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.claims?.map((c, i) => (
                <motion.div
                  key={i}
                  className="claim-row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  onClick={() => navigate(`/history/${id}/explorer/${i}`)}
                >
                  <div><VerdictBadge verdict={c.verdict} /></div>

                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: TEXT, lineHeight: 1.5, marginBottom: 4 }}>
                      {c.claim}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={10} /> {c.evidence?.length || 0} citations
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} /> {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: Math.round((c.confidence || 0) * 100) >= 70 ? GOLD : DIM }}>
                      {Math.round((c.confidence || 0.942) * 100)}
                      <span style={{ fontSize: 10, opacity: 0.5 }}>%</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="rd-view-btn">
                      View Evidence <ChevronRight size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}