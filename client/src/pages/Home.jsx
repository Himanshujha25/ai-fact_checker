import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Gavel, ArrowRight, ShieldCheck, Edit3, Network,
  CheckCircle2, BarChart3, Globe, Search, FileText,
  TrendingUp, Database, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Design tokens (shared with Verify.jsx) ─────────────────── */
const GOLD   = '#C9A84C';
const GOLD_D = 'rgba(201,168,76,0.1)';
const SURF   = 'rgba(255,255,255,0.035)';
const SURF2  = 'rgba(255,255,255,0.055)';
const LINE   = 'rgba(255,255,255,0.07)';
const TEXT   = '#E8E4DC';
const MUTED  = 'rgba(232,228,220,0.38)';
const DIM    = 'rgba(232,228,220,0.18)';

/* ─── Animated number counter ────────────────────────────────── */
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

  return (
    <span ref={ref}>
      {display}{unit}{suffix}
    </span>
  );
}

/* ─── Pipeline step card ─────────────────────────────────────── */
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
      {/* Ghost step number */}
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
      <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
        {body}
      </p>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Claims Audited',        value: '4.2M',  raw: '4.2' },
    { label: 'Error Margin',          value: '0.02%', raw: '0.02' },
    { label: 'Trusted Sources',       value: '12k+',  raw: '12' },
    { label: 'Verification Latency',  value: '98ms',  raw: '98' },
  ];

  return (
    <div style={{
      background: '#08080E',
      color: TEXT,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      minHeight: '100vh',
    }}>

      {/* Font injection */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&display=swap');

        .hm-btn-gold {
          background: ${GOLD};
          color: #08080E;
          border: none;
          border-radius: 9px;
          padding: 14px 30px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 13px;
          letter-spacing: 0.02em;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .hm-btn-gold:hover { opacity: 0.85; transform: translateY(-1px); }
        .hm-btn-gold:active { transform: translateY(0); }

        .hm-btn-ghost {
          background: ${SURF};
          color: ${MUTED};
          border: 1px solid ${LINE};
          border-radius: 9px;
          padding: 14px 28px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 500; font-size: 13px;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: border-color 0.2s, color 0.2s;
        }
        .hm-btn-ghost:hover { border-color: rgba(255,255,255,0.15); color: rgba(232,228,220,0.75); }

        .hm-cta-block {
          background: ${GOLD_D};
          border: 1px solid rgba(201,168,76,0.22);
          border-radius: 16px;
          padding: 40px 36px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center; cursor: pointer;
          transition: border-color 0.25s, background 0.25s;
          position: relative; overflow: hidden;
        }
        .hm-cta-block:hover {
          border-color: rgba(201,168,76,0.45);
          background: rgba(201,168,76,0.14);
        }

        .verdict-pill {
          display: inline-flex; align-items: center;
          font-size: 9px; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 4px;
          font-family: 'DM Mono', monospace;
        }

        .stat-item {
          border-left: 1px solid ${LINE};
          padding: 0 0 0 32px;
        }
        .stat-item:first-child { border-left: none; padding-left: 0; }

        @keyframes bar-grow {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .bar-anim {
          transform-origin: left;
          animation: bar-grow 1.2s cubic-bezier(.4,0,.2,1) both;
        }

        @keyframes scan-line {
          0% { top: 0%; opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { top: 100%; opacity: 0.4; }
        }
        .scan { animation: scan-line 3.5s ease-in-out infinite; }

        @keyframes blink {
          0%,100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .cursor-blink { animation: blink 1.1s step-start infinite; }
      `}</style>

      {/* ══════════ HERO ══════════════════════════════════════════ */}
      <section style={{
        minHeight: '92vh',
        display: 'flex', alignItems: 'center',
        padding: '8px 64px',
        maxWidth: 1280, margin: '0 auto',
        gap: 72,
      }}>

        {/* Left copy */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: '1 1 0', minWidth: 0 }}
        >
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 10, fontWeight: 500, letterSpacing: '0.16em',
              color: GOLD, textTransform: 'uppercase',
            }}>
              Digital Jurist Protocol v1.0
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(44px, 5.5vw, 76px)',
            fontWeight: 400,
            color: TEXT,
            lineHeight: 1.07,
            letterSpacing: '-0.025em',
            marginBottom: 24,
          }}>
            The Standard for<br />
            <span style={{ color: GOLD }}>Truth</span>{' '}
            Representation.
          </h1>

          <p style={{
            fontSize: 16, color: MUTED, lineHeight: 1.75,
            maxWidth: 480, marginBottom: 40,
          }}>
            We don't just fact-check — we adjudicate. The Digital Jurist Protocol transforms raw information into legally-sound evidence through a transparent, editorial-grade verification pipeline.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <button className="hm-btn-gold" onClick={() => navigate('/verify')}>
              Start New Analysis
              <ArrowRight size={15} />
            </button>
            <button className="hm-btn-ghost" onClick={() => navigate('/architecture')}>
              View Documentation
            </button>
          </div>

          {/* Trust micro-row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            marginTop: 48, paddingTop: 28,
            borderTop: `1px solid ${LINE}`,
          }}>
            {[
              { icon: Database, label: '12k+ sources indexed' },
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

        {/* Right: terminal-style audit card */}
        <motion.div
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          style={{ flex: '0 0 420px', maxWidth: 420 }}
        >
          <div style={{
            background: 'rgba(12,12,20,0.9)',
            border: `1px solid rgba(255,255,255,0.09)`,
            borderRadius: 18,
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            position: 'relative',
          }}>
            {/* Card header bar */}
            <div style={{
              padding: '14px 20px',
              borderBottom: `1px solid ${LINE}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ display: 'flex', gap: 7 }}>
                {['#ff5f57','#febc2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
                ))}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, letterSpacing: '0.08em' }}>
                jurist-audit — session DPJ-1-884
              </span>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px rgba(74,222,128,0.5)' }} />
            </div>

            {/* Terminal body */}
            <div style={{ padding: '24px 24px 0', position: 'relative' }}>
              {/* Scanning line */}
              <div className="scan" style={{
                position: 'absolute', left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                pointerEvents: 'none', zIndex: 2,
              }} />

              {[
                { label: '→ Ingesting source…',           color: DIM,   delay: 0 },
                { label: '→ Extracting 7 claims…',         color: DIM,   delay: 0.1 },
                { label: '→ Cross-referencing index…',     color: DIM,   delay: 0.2 },
                { label: '→ Agent consensus: 3/3…',        color: MUTED, delay: 0.3 },
                { label: '✓ Forensic dossier ready.',      color: '#4ade80', delay: 0.4, bold: true },
              ].map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 + line.delay, duration: 0.4 }}
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12, lineHeight: 2,
                    color: line.color,
                    fontWeight: line.bold ? 500 : 400,
                  }}
                >
                  {line.label}
                </motion.p>
              ))}

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: GOLD, lineHeight: 2 }}
              >
                $ <span className="cursor-blink" style={{ borderRight: `2px solid ${GOLD}`, paddingRight: 2 }} />
              </motion.p>
            </div>

            {/* Score bar section */}
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{
                background: SURF,
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                padding: '16px 18px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, color: DIM, fontFamily: "'DM Mono', monospace", letterSpacing: '0.08em' }}>
                    Analysis Pipeline
                  </span>
                  <span style={{ fontSize: 11, color: GOLD, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
                    67%
                  </span>
                </div>
                <div style={{
                  height: 3, background: 'rgba(255,255,255,0.06)',
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '67%' }}
                    transition={{ delay: 0.8, duration: 1.5, ease: 'easeOut' }}
                    style={{ height: '100%', background: GOLD, borderRadius: 10 }}
                  />
                </div>

                {/* Verdict chips */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <span className="verdict-pill" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>Verified ×4</span>
                  <span className="verdict-pill" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Refuted ×1</span>
                  <span className="verdict-pill" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Mixed ×2</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ══════════ PIPELINE ══════════════════════════════════════ */}
      <section style={{
        padding: '100px 64px',
        borderTop: `1px solid ${LINE}`,
        maxWidth: 1280, margin: '0 auto',
      }}>
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: 56 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 24, height: 1, background: GOLD, opacity: 0.55 }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 500, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              The Process
            </span>
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 400, letterSpacing: '-0.02em',
            color: TEXT, marginBottom: 14, lineHeight: 1.1,
          }}>
            The Adjudication Pipeline.
          </h2>
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, maxWidth: 520 }}>
            A rigorous three-stage mechanism ensuring every verdict is backed by immutable proof and peer-reviewed citations.
          </p>
        </motion.header>

        {/* Bento grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>

          {/* Step 01 */}
          <div style={{ gridColumn: 'span 4' }}>
            <PipelineCard
              num="01" icon={Edit3}
              title="Ingest & Isolate"
              body="Every incoming claim is atomized into its core propositions. We strip rhetorical noise to isolate the verifiable intent."
              delay={0}
              style={{ height: '100%' }}
            />
          </div>

          {/* Step 02 — wider with live bar visual */}
          <div style={{ gridColumn: 'span 8' }}>
            <PipelineCard
              num="02" icon={Network}
              title="Evidence Mapping"
              body="Our protocol cross-references 12,000+ primary sources — from legislative archives to live data feeds — creating a weighted web of evidence."
              delay={0.1}
              style={{ height: '100%' }}
            >
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Academic archives', w: 88 },
                  { label: 'Live OSINT feeds',  w: 63 },
                  { label: 'Government indices', w: 94 },
                  { label: 'Cross-validation',  w: 71 },
                ].map((bar, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: DIM, width: 130, flexShrink: 0 }}>{bar.label}</span>
                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.w}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: 'easeOut' }}
                        style={{
                          height: '100%',
                          background: i === 2 ? GOLD : 'rgba(232,228,220,0.18)',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: i === 2 ? GOLD : DIM, width: 28, textAlign: 'right' }}>
                      {bar.w}%
                    </span>
                  </div>
                ))}
              </div>
            </PipelineCard>
          </div>

          {/* Step 03 */}
          <div style={{ gridColumn: 'span 7' }}>
            <PipelineCard
              num="03" icon={Gavel}
              title="The Verdict Release"
              body="A final judgment is rendered based on the Digital Jurist scoring rubric. Every verdict includes a direct evidence trail for public audit."
              delay={0.2}
              style={{ height: '100%' }}
            >
              <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                <span className="verdict-pill" style={{ background: 'rgba(74,222,128,0.08)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>True</span>
                <span className="verdict-pill" style={{ background: 'rgba(248,113,113,0.08)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>False</span>
                <span className="verdict-pill" style={{ background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>Partial</span>
              </div>
            </PipelineCard>
          </div>

          {/* CTA block */}
          <div style={{ gridColumn: 'span 5' }}>
            <motion.div
              className="hm-cta-block"
              style={{ height: '100%' }}
              onClick={() => navigate('/verify')}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200,
                background: `radial-gradient(circle, ${GOLD} 0%, transparent 70%)`,
                opacity: 0.07, pointerEvents: 'none', borderRadius: '50%',
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: GOLD_D, border: `1px solid rgba(201,168,76,0.3)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}>
                  <Gavel size={20} color={GOLD} />
                </div>
                <h3 style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 26, fontWeight: 400, color: TEXT,
                  marginBottom: 8, letterSpacing: '-0.01em',
                }}>
                  Ready to audit?
                </h3>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
                  Open the workbench and run your first verification.
                </p>
                <button className="hm-btn-gold" style={{ pointerEvents: 'none' }}>
                  Open Workbench
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ═════════════════════════════════════════ */}
      <section style={{
        borderTop: `1px solid ${LINE}`,
        padding: '80px 64px',
        maxWidth: 1280, margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}>
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="stat-item"
            >
              <div style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: 'clamp(40px, 4vw, 60px)',
                fontWeight: 400, letterSpacing: '-0.03em',
                color: TEXT, lineHeight: 1, marginBottom: 10,
              }}>
                <Counter target={s.raw} />
                <span style={{ fontSize: '0.55em', opacity: 0.4 }}>
                  {s.value.replace(/[0-9.]/g, '')}
                </span>
              </div>
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, fontWeight: 500,
                color: DIM, letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}