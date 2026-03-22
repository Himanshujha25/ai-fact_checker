import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, ShieldCheck, Network } from 'lucide-react';

/* ─── Design tokens ───────────────────────────────────────────── */
const GOLD  = '#C9A84C';
const GOLD2 = 'rgba(201,168,76,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const SURF  = 'rgba(255,255,255,0.035)';

const formatTime = (s) => {
  const m  = Math.floor(s / 60);
  const rs = s % 60;
  return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
};

const PLACEHOLDER_LOGS = [
  'GET https://api.worldbank.org/v2/country/WLD/indicator/NV.IND…',
  'POST query://semantic_search/carbon_sequestration_stats_2024',
  'GET https://reuters.com/business/archive/semiconductor-q3…',
  'GET https://scholar.google.com/scholar?q=climate+proxy+2024',
];

const PLACEHOLDER_CLAIMS = [
  {
    id: '#042',
    text: 'Global semiconductor demand is projected to decline by 14% in Q3 due to supply chain pivot.',
    entity: 'Finance',
    confidence: '98.2%',
    active: true,
  },
  {
    id: '#041',
    text: 'New carbon sequestration facilities in Iceland have tripled capacity since 2022.',
    entity: 'Environment',
    confidence: null,
    active: false,
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function AnalysisProcessing({ elapsed, step, logs, inputTitle, onCancel }) {

  const STEPS = [
    { icon: FileText,   label: 'Claim Extraction',  active: step === 1, done: step > 1, pct: step === 1 ? 84 : step > 1 ? 100 : 0,  status: step === 1 ? '84% complete'    : step > 1 ? 'Complete'  : 'Pending' },
    { icon: Search,     label: 'Evidence Retrieval', active: step === 2, done: step > 2, pct: step === 2 ? 65 : step > 2 ? 100 : 0,  status: step === 2 ? 'Active research'  : step > 2 ? 'Complete'  : 'In queue' },
    { icon: ShieldCheck,label: 'Final Synthesis',    active: step === 3, done: step > 3, pct: step === 3 ? 40 : step > 3 ? 100 : 0,  status: step === 3 ? 'Synthesising…'   : step > 3 ? 'Complete'  : 'Awaiting' },
  ];

  const displayLogs = logs.length > 0 ? logs : PLACEHOLDER_LOGS.map((msg, i) => ({ id: i, msg }));

  return (
    <div style={{ paddingTop: 40, paddingBottom: 100, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        @keyframes ap-spin    { to { transform: rotate(360deg); } }
        @keyframes ap-ping    { 0%,100% { transform: scale(1);   opacity:.5 } 50% { transform: scale(1.5); opacity:0 } }
        @keyframes ap-pulse   { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes ap-blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes ap-scan    { 0% { transform:translateY(0) } 100% { transform:translateY(100%) } }

        .ap-log-row {
          display: flex; align-items: center; gap: 10;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 10px 14px;
          font-family: 'DM Mono', monospace; font-size: 11px;
          transition: background 0.18s;
          overflow: hidden;
        }
        .ap-log-row:hover { background: rgba(255,255,255,0.04); }

        .ap-claim-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 20px 22px;
          transition: border-color 0.2s;
        }
        .ap-claim-card.active {
          border-color: rgba(201,168,76,0.3);
          background: rgba(201,168,76,0.05);
        }

        .ap-metric {
          display: flex; flex-direction: column; gap: 5;
        }
      `}</style>

      {/* ── Session header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${LINE}` }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, animation: 'ap-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Jurist Protocol Active
            </span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Analysis Session: ID-2948-B
          </h1>
          {inputTitle && (
            <p style={{ marginTop: 8, fontSize: 12, color: DIM, maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>
              ↳ {inputTitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Elapsed
            </span>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 38, fontWeight: 400, color: GOLD, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {formatTime(elapsed)}
            </span>
          </div>
          
          <button 
            onClick={onCancel}
            style={{
              background: 'rgba(248,113,113,0.06)',
              border: '1px solid rgba(248,113,113,0.15)',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#f87171',
              fontFamily: "'DM Mono', monospace",
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.15)'; }}
          >
            Cancel Audit
          </button>
        </div>
      </div>

      {/* ── Pipeline steps ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 36, position: 'relative' }}>
        {/* connector line */}
        <div style={{ position: 'absolute', top: 22, left: '16.67%', right: '16.67%', height: 1, background: LINE, zIndex: 0 }} />

        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: step >= i + 1 ? 1 : 0.25, transition: 'opacity 0.5s', position: 'relative', zIndex: 1 }}>
            {/* Icon ring */}
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: s.active ? GOLD2 : s.done ? 'rgba(74,222,128,0.08)' : SURF,
              border: `1px solid ${s.active ? 'rgba(201,168,76,0.4)' : s.done ? 'rgba(74,222,128,0.25)' : LINE}`,
              position: 'relative',
              transition: 'background 0.4s, border-color 0.4s',
              boxShadow: s.active ? `0 0 20px rgba(201,168,76,0.2)` : 'none',
            }}>
              <s.icon size={17} color={s.active ? GOLD : s.done ? '#4ade80' : DIM} />
              {s.active && (
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: `1px solid ${GOLD}`,
                  animation: 'ap-ping 2s ease-in-out infinite',
                  opacity: 0.3,
                }} />
              )}
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 600, color: s.active ? TEXT : s.done ? 'rgba(232,228,220,0.6)' : DIM, marginBottom: 3 }}>
                {s.label}
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: s.active ? GOLD : s.done ? '#4ade80' : DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {s.status}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ width: '80%', height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: s.done ? '#4ade80' : GOLD, borderRadius: 4 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Left: claims feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header */}
          <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '18px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: DIM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Extracted Claims Pipeline
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, animation: 'ap-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Live
                </span>
              </div>
            </div>
          </div>

          {/* Claim cards */}
          {PLACEHOLDER_CLAIMS.map((c, i) => (
            <motion.div
              key={i}
              className={`ap-claim-card ${c.active ? 'active' : ''}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.35 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Claim {c.id}
                </span>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9,
                  color: c.active ? GOLD : DIM,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  animation: c.active ? 'ap-pulse 2s ease-in-out infinite' : 'none',
                }}>
                  {c.active ? 'Extracting context…' : 'Queued for evidence'}
                </span>
              </div>

              <p style={{ fontSize: 14, color: c.active ? TEXT : MUTED, lineHeight: 1.6, fontWeight: c.active ? 500 : 400, marginBottom: 14 }}>
                "{c.text}"
              </p>

              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                  background: SURF, border: `1px solid ${LINE}`,
                  color: DIM, padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase',
                }}>
                  {c.entity}
                </span>
                {c.confidence && (
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.1em',
                    background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                    color: '#4ade80', padding: '3px 10px', borderRadius: 4, textTransform: 'uppercase',
                  }}>
                    {c.confidence}
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {/* Scanning placeholder */}
          <div style={{
            background: SURF, border: `1px dashed rgba(255,255,255,0.08)`,
            borderRadius: 12, padding: '22px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              animation: 'ap-pulse 2.5s ease-in-out infinite',
            }}>
              Scanning next segment…
            </span>
          </div>
        </div>

        {/* Right: log feed + telemetry */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Log feed */}
          <div style={{ background: 'rgba(10,10,18,0.95)', border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 14, padding: '0', overflow: 'hidden', flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            {/* terminal bar */}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.6 }} />
                ))}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.06em' }}>
                osint-stream
              </span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }} />
            </div>

            <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflowY: 'auto' }}>
              <AnimatePresence>
                {displayLogs.map((log, i) => (
                  <motion.div
                    key={log.id ?? i}
                    className="ap-log-row"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.25 }}
                  >
                    <span style={{ color: GOLD, fontWeight: 500, flexShrink: 0 }}>GET</span>
                    <span style={{ color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: 10 }}>
                      {log.msg}
                    </span>
                    <span style={{ color: '#4ade80', flexShrink: 0, fontSize: 9 }}>200</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* blinking cursor */}
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: GOLD, paddingLeft: 2, paddingTop: 4 }}>
                $ <span style={{ borderRight: `2px solid ${GOLD}`, paddingRight: 2, animation: 'ap-blink 1.1s step-start infinite' }} />
              </div>
            </div>
          </div>

          {/* Telemetry card */}
          <div style={{
            background: GOLD2, border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: 14, padding: '22px 22px',
            position: 'relative', overflow: 'hidden',
          }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 18, opacity: 0.7 }}>
              Telemetry
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                { label: 'Citations',   val: '1,204' },
                { label: 'Sources',     val: '48' },
                { label: 'Drift',       val: '0.02%', gold: true },
                { label: 'Token vel.', val: '4.2k/s' },
              ].map((m, i) => (
                <div key={i} className="ap-metric">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: DIM, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {m.label}
                  </span>
                  <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, fontWeight: 400, color: m.gold ? GOLD : TEXT, lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {m.val}
                  </span>
                </div>
              ))}
            </div>
            {/* ambient glow */}
            <div style={{ position: 'absolute', bottom: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity: 0.08, pointerEvents: 'none' }} />
          </div>

          {/* Node cluster status */}
          <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid rgba(201,168,76,0.2)`, borderTopColor: GOLD, animation: 'ap-spin 1.2s linear infinite' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: GOLD2 }} />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: TEXT, fontWeight: 500, marginBottom: 2 }}>
                Node Cluster Sigma-9
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.06em' }}>
                Processing · 3 agents active
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[0.4, 0.7, 1].map((o, i) => (
                <div key={i} style={{ width: 4, borderRadius: 2, background: GOLD, opacity: o, height: 12 + i * 6, animation: `ap-pulse ${1.2 + i * 0.3}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}