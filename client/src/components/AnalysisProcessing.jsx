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

const getDynamicClaims = (input) => {
  if (!input) return [
    { id: '#001', text: 'Analysing source stream for verifiable assertions...', entity: 'General', confidence: null, active: true }
  ];

  // Try to split input into a few "claims" if possible, otherwise use fragments
  const cleanInput = input.replace(/https?:\/\/[^\s]+/g, '').trim();
  const fragments = cleanInput.split(/[.?!,]/).filter(s => s.trim().length > 10).map(s => s.trim());
  
  if (fragments.length > 0) {
    return fragments.slice(0, 2).map((f, i) => ({
      id: `#0${80 + i}`,
      text: f.length > 80 ? f.substring(0, 80) + '...' : f,
      entity: f.length % 2 === 0 ? 'Context' : 'Evidence',
      confidence: i === 0 ? 'EXTRACTING...' : null,
      active: i === 0
    }));
  }

  return [
    { id: '#081', text: `Evaluating: "${input.substring(0, 50)}..."`, entity: 'Analysis', confidence: '74.2%', active: true },
    { id: '#080', text: 'Scanning for secondary entity cross-links...', entity: 'OSINT', confidence: null, active: false }
  ];
};

/* ═══════════════════════════════════════════════════════════════ */
export default function AnalysisProcessing({ elapsed, step, logs, inputTitle, onCancel }) {
  const [dynamicClaims, setDynamicClaims] = React.useState(() => getDynamicClaims(inputTitle));

  React.useEffect(() => {
    // Refresh claims if inputTitle changes or periodically
    setDynamicClaims(getDynamicClaims(inputTitle));
  }, [inputTitle]);

  const [sessionID] = React.useState(() => `ID-${Math.floor(1000 + Math.random() * 9000)}-${['A', 'B', 'X', 'Z'][Math.floor(Math.random() * 4)]}`);
  const [telemetry, setTelemetry] = React.useState({
    citations: 0,
    sources: 0,
    drift: 0.01,
    velocity: 0,
  });
  const [agents, setAgents] = React.useState(3);
  const [dynamicProb, setDynamicProb] = React.useState(74.2);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => ({
        citations: prev.citations + Math.floor(Math.random() * 12),
        sources: Math.min(60, prev.sources + (Math.random() > 0.7 ? 1 : 0)),
        drift: (Math.random() * 0.05).toFixed(2),
        velocity: (2.5 + Math.random() * 3).toFixed(1),
      }));
      setAgents(Math.floor(2 + Math.random() * 4));
      
      setDynamicProb(prev => {
        if (prev >= 98.8) return prev;
        const increment = Math.random() * 0.35;
        return parseFloat((prev + increment).toFixed(1));
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const STEPS = [
    { icon: FileText,   label: 'Claim Extraction',  active: step === 1, done: step > 1, pct: step === 1 ? 84 : step > 1 ? 100 : 0,  status: step === 1 ? '84% complete'    : step > 1 ? 'Complete'  : 'Pending' },
    { icon: Search,     label: 'Evidence Retrieval', active: step === 2, done: step > 2, pct: step === 2 ? 65 : step > 2 ? 100 : 0,  status: step === 2 ? 'Active research'  : step > 2 ? 'Complete'  : 'In queue' },
    { icon: ShieldCheck,label: 'Final Synthesis',    active: step === 3, done: step > 3, pct: step === 3 ? 40 : step > 3 ? 100 : 0,  status: step === 3 ? 'Synthesising…'   : step > 3 ? 'Complete'  : 'Awaiting' },
  ];

  const displayLogs = (logs && logs.length > 0) ? logs : [
    { id: 1, msg: 'GET https://api.osint.archive/v2/fetch_primary_stream…' },
    { id: 2, msg: 'POST query://semantic_audit/entity_verification_vector' },
    { id: 3, msg: 'GET https://reuters.com/business/archive/live_feed_8271' },
    { id: 4, msg: 'CONNECT node://cluster_sigma_9/agent_handshake' },
  ];

  return (
    <div style={{ paddingTop: 40, paddingBottom: 100, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <style>{`
        @keyframes ap-spin    { to { transform: rotate(360deg); } }
        @keyframes ap-ping    { 0%,100% { transform: scale(1);   opacity:.5 } 50% { transform: scale(1.5); opacity:0 } }
        @keyframes ap-pulse   { 0%,100% { opacity:1 } 50% { opacity:.35 } }
        @keyframes ap-blink   { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes ap-scan    { 0% { transform:translateY(0) } 100% { transform:translateY(100%) } }

        .ap-log-row {
          display: flex; align-items: center; gap: 10px;
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
          display: flex; flex-direction: column; gap: 5px;
        }

        @media (max-width: 768px) {
          .ap-log-row { font-size: 9px !important; }
          .ap-claim-card { padding: 16px !important; }
          .ap-header-flex { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
        }
      `}</style>

      {/* ── Session header ── */}
      <div className="ap-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, paddingBottom: 24, borderBottom: `1px solid ${LINE}` }}>
        <div>
          <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 400, color: TEXT, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Analysis Session: {sessionID}
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
              fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase',
              cursor: 'pointer', transition: '0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.15)' }}
          >
            Terminal
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
        
        {/* Left Col: Protocol Progression */}
        <div>
          <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
            Audit Progression
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ opacity: s.done || s.active ? 1 : 0.35, transition: 'opacity 0.5s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.done ? 'rgba(74,222,128,0.06)' : s.active ? 'rgba(201,168,76,0.08)' : SURF, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={16} color={s.done ? '#4ade80' : s.active ? GOLD : DIM} />
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: s.active ? 600 : 500, color: s.done ? '#4ade80' : s.active ? TEXT : DIM }}>{s.label}</span>
                      <span style={{ fontSize: 9, color: DIM, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase' }}>{s.status}</span>
                    </div>
                  </div>
                </div>
                <div style={{ height: 4, background: SURF, borderRadius: 2, overflow: 'hidden' }}>
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${s.pct}%` }}
                     style={{ height: '100%', background: s.done ? '#4ade80' : GOLD, boxShadow: s.active ? `0 0 10px ${GOLD}60` : 'none' }}
                   />
                </div>
              </div>
            ))}
          </div>

          {/* Engine Status (Static) moved to bottom or side? No, let's keep it here */}
          <div style={{ marginTop: 40, padding: 20, background: SURF, border: `1px solid ${LINE}`, borderRadius: 12 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'ap-pulse 2s infinite' }} />
                <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: DIM, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Neural Engine v4.2 · Operational</span>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="ap-metric">
                  <span style={{ fontSize: 9, color: DIM, textTransform: 'uppercase' }}>Est. Confidence</span>
                  <span style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color: TEXT }}>{dynamicProb}%</span>
                </div>
                <div className="ap-metric">
                  <span style={{ fontSize: 9, color: DIM, textTransform: 'uppercase' }}>Latency</span>
                  <span style={{ fontSize: 18, fontFamily: "'DM Serif Display', serif", color: TEXT }}>{telemetry.velocity}ms</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Active Claims & Live Stream */}
        <div>
           <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
            Claim Decomposition & Cross-Ref
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32 }}>
            {dynamicClaims.map(c => (
              <div key={c.id} className={`ap-claim-card ${c.active ? 'active' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                   <span style={{ px: 6, py: 2, borderRadius: 4, background: c.active ? 'rgba(201,168,76,0.15)' : SURF, color: c.active ? GOLD : DIM, fontSize: 8, fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em' }}>
                     {c.id} // {c.entity}
                   </span>
                   {c.confidence && (
                     <span style={{ fontSize: 9, color: '#4ade80', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                        {c.confidence}
                     </span>
                   )}
                </div>
                <p style={{ fontSize: 13, color: c.active ? TEXT : DIM, lineHeight: 1.5 }}>
                  {c.text}
                </p>
                {c.active && (
                  <div style={{ marginTop: 12, height: 1, background: `linear-gradient(90deg, ${GOLD}40 0%, transparent 100%)` }} />
                )}
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: DIM, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16 }}>
            Verification Stream
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflow: 'hidden' }}>
            <AnimatePresence>
              {displayLogs.slice(-5).map((log, i) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ap-log-row"
                  style={{ opacity: 1 - i*0.15 }}
                >
                   <span style={{ color: GOLD, marginRight: 8 }}>›</span>
                   <span style={{ color: TEXT, whiteSpace: 'nowrap' }}>{log.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}