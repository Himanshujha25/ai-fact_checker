import React, { useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Gavel, ArrowRight, ShieldCheck, Edit3, Network,
  CheckCircle2, BarChart3, Globe, Search, FileText,
  TrendingUp, Database, Layers, Link as LinkIcon, ExternalLink,
  ShieldAlert, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GOLD = '#C9A84C';
const GOLD_D = 'rgba(201,168,76,0.1)';
const SURF = 'rgba(255,255,255,0.035)';
const SURF2 = 'rgba(255,255,255,0.055)';
const LINE = 'rgba(255,255,255,0.07)';
const TEXT = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM = 'rgba(232,228,220,0.18)';

function Counter({ target, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [val, setVal] = React.useState(0);

  useEffect(() => {
    if (!isInView) return;
    const numeric = parseFloat(target.replace(/[^0-9.]/g, ''));
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(ease * numeric * 10) / 10);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, target]);

  const display = target.includes('.') ? val.toFixed(2) : val % 1 === 0 ? val.toFixed(0) : val;
  const unit = target.replace(/[0-9.]/g, '');

  return <span ref={ref}>{display}{unit}{suffix}</span>;
}

function PipelineCard({ num, icon: Icon, title, body, children, style = {}, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      style={{
        background: SURF,
        border: `1px solid ${LINE}`,
        borderRadius: 16,
        padding: '32px 32px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.25s',
        ...style,
      }}
      whileHover={{ borderColor: 'rgba(255,255,255,0.13)' }}
    >
      <span style={{
        position: 'absolute', top: 20, right: 24,
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 72, fontWeight: 400, lineHeight: 1,
        color: 'rgba(255,255,255,0.04)',
        userSelect: 'none', pointerEvents: 'none',
      }}>
        {num}
      </span>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: GOLD_D,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 22,
      }}>
        <Icon size={17} color={GOLD} />
      </div>
      <h3 style={{
        fontFamily: "'DM Serif Display', Georgia, serif",
        fontSize: 22, fontWeight: 400,
        color: TEXT, marginBottom: 10, letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{body}</p>
      {children}
    </motion.div>
  );
}

function SourceCard({ name, url, label, confidence, category, delay = 0 }) {
  const isTrusted = label === 'Trusted';
  const isBiased = label === 'Biased';
  const isUnreliable = label === 'Unreliable';

  const labelColor = isTrusted ? '#4ade80' : isBiased ? '#fbbf24' : '#f87171';
  const labelBg = isTrusted ? 'rgba(74,222,128,0.08)' : isBiased ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)';
  const labelBorder = isTrusted ? 'rgba(74,222,128,0.2)' : isBiased ? 'rgba(251,191,36,0.2)' : 'rgba(248,113,113,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -6, borderColor: 'rgba(201,168,76,0.4)', background: 'rgba(255,255,255,0.05)' }}
      style={{
        background: SURF,
        border: `1px solid ${LINE}`,
        borderRadius: 18,
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: isTrusted ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${isTrusted ? 'rgba(74,222,128,0.15)' : LINE}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {isTrusted ? <ShieldCheck size={18} color="#4ade80" /> : isBiased ? <ShieldAlert size={18} color="#fbbf24" /> : <AlertTriangle size={18} color="#f87171" />}
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{ fontSize: 16, fontWeight: 600, color: TEXT, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h4>
            <span style={{
              fontSize: 10, color: DIM, fontFamily: "'DM Mono', monospace",
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 6
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: labelColor }} />
              {category}
            </span>
          </div>
        </div>
        <div style={{
          padding: '5px 12px', borderRadius: 6,
          background: labelBg, border: `1px solid ${labelBorder}`,
          color: labelColor, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          fontFamily: "'DM Mono', monospace", flexShrink: 0,
          boxShadow: `0 0 15px ${labelColor}15`
        }}>
          {label}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={url} target="_blank" rel="noopener noreferrer"
          style={{
            fontSize: 13, color: GOLD, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: 0.75, transition: 'all 0.2s ease',
            padding: '10px 14px', background: 'rgba(255,255,255,0.02)',
            borderRadius: 8, border: `1px solid ${LINE}`
          }}
          onMouseOver={e => {
            e.currentTarget.style.opacity = 1;
            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.2)';
            e.currentTarget.style.background = 'rgba(201,168,76,0.05)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.opacity = 0.75;
            e.currentTarget.style.borderColor = LINE;
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
          }}
        >
          <LinkIcon size={13} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{url.replace(/https?:\/\/(www\.)?/, '')}</span>
          <ExternalLink size={11} style={{ opacity: 0.5 }} />
        </a>
      </div>

      <div style={{ paddingTop: 20, borderTop: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 9, color: DIM, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>Forensic Authenticity</span>
          <span style={{ fontSize: 12, color: MUTED }}>Decision Confidence</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ width: 80, height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${confidence}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: '100%', background: confidence > 85 ? '#4ade80' : confidence > 50 ? GOLD : '#f87171', borderRadius: 3 }}
            />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: confidence > 85 ? '#4ade80' : confidence > 50 ? GOLD : '#f87171', fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>
            {confidence}<span style={{ fontSize: 12, opacity: 0.6 }}>%</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Claims Audited', value: '100+   ', raw: '100' },
    { label: 'Error Margin', value: '0.02%', raw: '0.02' },
    { label: 'Trusted Sources', value: '10+', raw: '10 ' },
    { label: 'Verification Latency', value: '98ms', raw: '98' },
  ];

  return (
    <div style={{ background: '#08080E', color: TEXT, fontFamily: "'DM Sans', system-ui, sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        /* ── Buttons ── */
        .hm-btn-gold {
          background: ${GOLD}; color: #08080E; border: none; border-radius: 9px;
          padding: 14px 30px; font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 13px; letter-spacing: 0.02em; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
        }
        .hm-btn-gold:hover { opacity: 0.85; transform: translateY(-1px); }
        .hm-btn-gold:active { transform: translateY(0); }

        .hm-btn-ghost {
          background: ${SURF}; color: ${MUTED}; border: 1px solid ${LINE};
          border-radius: 9px; padding: 14px 28px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 500; font-size: 13px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: border-color 0.2s, color 0.2s; white-space: nowrap;
        }
        .hm-btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,228,220,0.75); }

        .hm-cta-block {
          background: ${GOLD_D}; border: 1px solid rgba(201,168,76,0.22);
          border-radius: 16px; padding: 40px 36px;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; text-align: center; cursor: pointer;
          transition: border-color 0.25s, background 0.25s;
          position: relative; overflow: hidden;
        }
        .hm-cta-block:hover { border-color: rgba(201,168,76,0.45); background: rgba(201,168,76,0.14); }

        .verdict-pill {
          display: inline-flex; align-items: center;
          font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 4px; font-family: 'DM Mono', monospace;
        }

        /* ── Stats row ── */
        .stat-item { border-left: 1px solid ${LINE}; padding: 0 0 0 32px; }
        .stat-item:first-child { border-left: none; padding-left: 0; }

        /* ── Animations ── */
        @keyframes scan-line {
          0%   { top: 0%;   opacity: 0.4; }
          50%  {             opacity: 0.8; }
          100% { top: 100%; opacity: 0.4; }
        }
        .scan { animation: scan-line 3.5s ease-in-out infinite; }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-blink { animation: blink 1.1s step-start infinite; }

        /* ══════════ RESPONSIVE LAYOUT ══════════════════════════ */

        /* Hero */
        .hero-section {
          min-height: 92vh;
          display: flex; align-items: center;
          padding: 80px 64px;
          max-width: 1280px; margin: 0 auto;
          gap: 72px;
        }
        .hero-copy   { flex: 1 1 0; min-width: 0; }
        .hero-card   { flex: 0 0 420px; max-width: 420px; }

        /* Pipeline */
        .pipeline-section { padding: 100px 64px; border-top: 1px solid ${LINE}; max-width: 1280px; margin: 0 auto; }
        .pipeline-grid    { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
        .col-4  { grid-column: span 4; }
        .col-5  { grid-column: span 5; }
        .col-7  { grid-column: span 7; }
        .col-8  { grid-column: span 8; }

        /* Stats */
        .stats-section { border-top: 1px solid ${LINE}; padding: 80px 64px; max-width: 1280px; margin: 0 auto; }
        .stats-grid    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; }

        /* ── Tablet (≤ 1024px) ── */
        @media (max-width: 1024px) {
          .hero-section   { padding: 60px 40px; gap: 48px; }
          .hero-card      { flex: 0 0 360px; max-width: 360px; }
          .pipeline-section { padding: 80px 40px; }
          .stats-section  { padding: 60px 40px; }
          .col-4  { grid-column: span 6; }
          .col-8  { grid-column: span 6; }
          .col-7  { grid-column: span 7; }
          .col-5  { grid-column: span 5; }
        }

        /* ── Mobile-large (≤ 768px) ── */
        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
            align-items: flex-start;
            min-height: unset;
            padding: 48px 24px 56px;
            gap: 40px;
          }
          .hero-card { flex: unset; max-width: 100%; width: 100%; }

          .pipeline-section { padding: 64px 24px; }
          .pipeline-grid    { grid-template-columns: 1fr; }
          .col-4, .col-5, .col-7, .col-8 { grid-column: span 1; }

          .stats-section { padding: 56px 24px; }
          .stats-grid    { grid-template-columns: repeat(2, 1fr); gap: 32px 0; }
          .stat-item                  { border-left: 1px solid ${LINE}; padding-left: 24px; }
          .stat-item:nth-child(odd)   { border-left: none; padding-left: 0; }
        }

        /* ── Mobile-small (≤ 480px) ── */
        @media (max-width: 480px) {
          .hero-section   { padding: 36px 20px 48px; }
          .pipeline-section { padding: 52px 20px; }
          .stats-section  { padding: 44px 20px; }
          .stats-grid     { grid-template-columns: 1fr 1fr; gap: 28px 0; }
          .hm-btn-gold, .hm-btn-ghost { padding: 12px 20px; font-size: 12px; }
          .hm-cta-block   { padding: 32px 24px; }
        }
      `}</style>

      {/* ══════════ HERO ══════════════════════════════════════════ */}
      <section className="hero-section">

        {/* Left copy */}
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', color: GOLD, textTransform: 'uppercase' }}>
              Digital Jurist Protocol v1.0
            </span>
          </div> */}

          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(38px, 5.5vw, 76px)',
            fontWeight: 400, color: TEXT,
            lineHeight: 1.07, letterSpacing: '-0.025em', marginBottom: 24,
          }}>
            The Standard for<br />
            <span style={{ color: GOLD }}>Truth</span>{' '}Representation.
          </h1>

          <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, maxWidth: 480, marginBottom: 40 }}>
            We don't just fact-check — we adjudicate. The Digital Jurist Protocol transforms raw information into legally-sound evidence through a transparent, editorial-grade verification pipeline.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button className="hm-btn-gold" onClick={() => navigate('/verify')}>
              Start New Analysis <ArrowRight size={15} />
            </button>
            <button className="hm-btn-ghost" onClick={() => navigate('/architecture')}>
              View Documentation
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginTop: 48, paddingTop: 28, borderTop: `1px solid ${LINE}` }}>
            {[
              { icon: Database, label: '100+ sources indexed' },
              { icon: ShieldCheck, label: '99.98% accuracy' },
              { icon: Globe, label: 'Live OSINT streams' },
            ].map(({ icon: Ic, label }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Ic size={12} color={DIM} />
                <span style={{ fontSize: 11, color: DIM, fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Statue Hero */}
        <motion.div
          className="hero-card"
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          style={{ position:'relative', display:'flex', justifyContent:'center', perspective: 1000 }}
        >
          {/* Ambient Glow */}
          <div style={{ position: 'absolute', inset: -60, background: `radial-gradient(circle, ${GOLD}10 0%, transparent 60%)`, filter: 'blur(40px)', zIndex: 0 }} />
          
          <div style={{ position:'relative', zIndex: 1, flex: 1 }}>
            <motion.img 
              src="/lady_justice.png"
              alt="Truecast Lady Justice" 
              style={{ width: '100%', maxWidth: 520, borderRadius: 24, boxShadow: '0 50px 100px rgba(0,0,0,0.6)', border: `1px solid ${LINE}` }}
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            {/* Status Overlay */}
            
          </div>
        </motion.div>
      </section>

      {/* ══════════ PIPELINE ══════════════════════════════════════ */}
      <section className="pipeline-section">
        <motion.header
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          style={{ marginBottom: 56 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: GOLD, opacity: 0.55 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              The Process
            </span>
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, letterSpacing: '-0.02em', color: TEXT, marginBottom: 14, lineHeight: 1.1 }}>
            The Adjudication Pipeline.
          </h2>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 520 }}>
            A rigorous three-stage mechanism ensuring every verdict is backed by immutable proof and peer-reviewed citations.
          </p>
        </motion.header>

        <div className="pipeline-grid">
          <div className="col-4">
            <PipelineCard num="01" icon={Edit3} title="Ingest & Isolate"
              body="Every incoming claim is atomized into its core propositions. We strip rhetorical noise to isolate the verifiable intent."
              delay={0} style={{ height: '100%' }} />
          </div>

          <div className="col-8">
            <PipelineCard num="02" icon={Network} title="Evidence Mapping"
              body="Our protocol cross-references 12,000+ primary sources — from legislative archives to live data feeds — creating a weighted web of evidence."
              delay={0.1} style={{ height: '100%' }}>
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Academic archives', w: 88 },
                  { label: 'Live OSINT feeds', w: 63 },
                  { label: 'Government indices', w: 94 },
                  { label: 'Cross-validation', w: 71 },
                ].map((bar, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, width: 130, flexShrink: 0 }}>{bar.label}</span>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${bar.w}%` }} viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: i === 2 ? GOLD : 'rgba(232,228,220,0.18)', borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: i === 2 ? GOLD : DIM, width: 28, textAlign: 'right' }}>
                      {bar.w}%
                    </span>
                  </div>
                ))}
              </div>
            </PipelineCard>
          </div>

          <div className="col-7">
            <PipelineCard num="03" icon={Gavel} title="The Verdict Release"
              body="A final judgment is rendered based on the Digital Jurist scoring rubric. Every verdict includes a direct evidence trail for public audit."
              delay={0.2} style={{ height: '100%' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 22 }}>
                <span className="verdict-pill" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>True</span>
                <span className="verdict-pill" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>False</span>
                <span className="verdict-pill" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Partial</span>
              </div>
            </PipelineCard>
          </div>

          <div className="col-5">
            <motion.div className="hm-cta-block" style={{ height: '100%' }} onClick={() => navigate('/verify')}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}>
              <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity: 0.07, pointerEvents: 'none', borderRadius: '50%' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: GOLD_D, border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <Gavel size={20} color={GOLD} />
                </div>
                <h3 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, fontWeight: 400, color: TEXT, marginBottom: 8, letterSpacing: '-0.01em' }}>
                  Ready to audit?
                </h3>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
                  Open the workbench and run your first verification.
                </p>
                <button className="hm-btn-gold" style={{ pointerEvents: 'none' }}>
                  Open Workbench <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ SOURCES ══════════════════════════════════════ */}
      <section className="pipeline-section" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 100 }}>
        <motion.header
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          style={{ marginBottom: 56 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: GOLD, opacity: 0.55 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Transparency
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ maxWidth: 600 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 400, letterSpacing: '-0.02em', color: TEXT, marginBottom: 14, lineHeight: 1.1 }}>
                High-Fidelity Evidence.
              </h2>
              <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7 }}>
                Sources are never obscured. We provide direct access to the primary material used for adjudication, classified by our proprietary trust scoring algorithm.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${LINE}`, borderRadius: 10 }}>
              <ShieldCheck size={14} color="#4ade80" />
              <span style={{ fontSize: 11, color: DIM, fontWeight: 500, fontFamily: "'DM Mono', monospace" }}>OSINT INDEXED: 12.4K</span>
            </div>
          </div>
        </motion.header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {[
            { name: 'Reuters World News', url: 'https://www.reuters.com/world/exclusive-report-2026', label: 'Trusted', confidence: 98, category: 'Legacy Media' },
            { name: 'The Associated Press', url: 'https://apnews.com/article/financial-audit-protocol', label: 'Trusted', confidence: 96, category: 'News Agency' },
            { name: 'Bellingcat Investigator', url: 'https://www.bellingcat.com/news/uk-2026-audit', label: 'Trusted', confidence: 92, category: 'OSINT Expert' },
            { name: 'Government Archive', url: 'https://archive.gov/records/2026/policy-audit', label: 'Trusted', confidence: 99, category: 'Official Record' },
            { name: 'RT News Network', url: 'https://rt.com/news/state-sponsored-report', label: 'Biased', confidence: 45, category: 'State Media' },
            { name: 'Unverified Blog', url: 'https://truth-seeker-vlog.blogspot.com/post-401', label: 'Unreliable', confidence: 12, category: 'Social Media' },
          ].map((src, i) => (
            <SourceCard key={i} {...src} delay={i * 0.08} />
          ))}
        </div>

        <div style={{
          marginTop: 64,
          padding: '32px',
          background: 'rgba(248,113,113,0.05)',
          border: '1px solid rgba(248,113,113,0.15)',
          borderRadius: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#f87171' }} />
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(248,113,113,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, border: '1px solid rgba(248,113,113,0.2)'
          }}>
            <AlertTriangle size={24} color="#f87171" strokeWidth={2.5} />
          </div>
          <div>
            <h5 style={{ fontSize: 15, fontWeight: 700, color: '#f87171', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zero-Tolerance for Source Hallucination</h5>
            <p style={{ fontSize: 13, color: 'rgba(232,228,220,0.6)', lineHeight: 1.7, maxWidth: 800 }}>
              Unlike generic AI tools that may fabricate citations or mislabel sources to fit a narrative, Truecast enforces a strict <strong>Forensic Handshake™</strong>. Every source undergoing adjudication must pass a multi-vector validation check—verifying its cryptographic SSL certificate, domain authority, and historical neutrality index before it enters our ledger.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ═════════════════════════════════════════ */}
      <section className="stats-section">
        <div className="stats-grid">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              className="stat-item">
              <div style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 400, letterSpacing: '-0.03em', color: TEXT, lineHeight: 1, marginBottom: 10 }}>
                <Counter target={s.raw} />
                <span style={{ fontSize: '0.55em', opacity: 0.4 }}>{s.value.replace(/[0-9.]/g, '')}</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}