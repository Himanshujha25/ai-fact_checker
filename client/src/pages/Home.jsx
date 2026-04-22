import React, { useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Gavel, ArrowRight, ShieldCheck, Edit3, Network,
  CheckCircle2, BarChart3, Globe, Search, FileText,
  TrendingUp, Database, Layers, Link as LinkIcon, ExternalLink,
  ShieldAlert, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoice } from '../context/VoiceContext';

const GOLD = 'var(--gold)';
const GOLD_D = 'rgba(201,168,76,0.1)';
const SURF = 'var(--surf)';
const SURF2 = 'rgba(var(--overlay-rgb),0.055)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

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

function PipelineCard({ num, icon: Icon, title, body, children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`bg-surf border border-line rounded-2xl p-8 relative overflow-hidden transition-colors hover:border-[rgba(var(--overlay-rgb),0.13)] ${className}`}
    >
      <span className="absolute top-5 right-6 font-serif text-[72px] font-normal庆 text-[rgba(var(--overlay-rgb),0.04)] select-none pointer-events-none leading-none">
        {num}
      </span>
      <div className="w-9 h-9 rounded-[9px] bg-gold/10 flex items-center justify-center mb-5.5">
        <Icon size={17} className="text-gold" />
      </div>
      <h3 className="font-serif text-[22px] font-normal text-text-main mb-2.5 tracking-tight">
        {title}
      </h3>
      <p className="text-[13px] text-text-muted leading-[1.7]">{body}</p>
      {children}
    </motion.div>
  );
}

function SourceCard({ name, url, label, confidence, category, delay = 0 }) {
  const isTrusted = label === 'Trusted';
  const isBiased = label === 'Biased';

  const labelColorClass = isTrusted ? 'text-green-400' : isBiased ? 'text-amber-400' : 'text-red-400';
  const labelBgClass = isTrusted ? 'bg-green-400/8' : isBiased ? 'bg-amber-400/8' : 'bg-red-400/8';
  const labelBorderClass = isTrusted ? 'border-green-400/20' : isBiased ? 'border-amber-400/20' : 'border-red-400/20';
  const dotColorClass = isTrusted ? 'bg-green-400' : isBiased ? 'bg-amber-400' : 'bg-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay }}
      whileHover={{ y: -6, borderColor: 'rgba(201,168,76,0.4)', background: 'rgba(var(--overlay-rgb),0.05)' }}
      className="bg-surf border border-line rounded-[18px] p-7 flex flex-col gap-5 transition-all duration-300 ease-in-out shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)]"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex gap-3 items-center min-w-0">
          <div className={`w-10 h-10 rounded-max bg-[rgba(var(--overlay-rgb),0.03)] border border-line flex items-center justify-center flex-shrink-0 ${isTrusted ? 'bg-green-400/6 border-green-400/15' : ''}`}>
            {isTrusted ? <ShieldCheck size={18} className="text-green-400" /> : isBiased ? <ShieldAlert size={18} className="text-amber-400" /> : <AlertTriangle size={18} className="text-red-400" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-text-main mb-1 truncate">{name}</h4>
            <span className="text-[10px] text-text-dim font-mono uppercase tracking-[0.08em] flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full ${dotColorClass}`} />
              {category}
            </span>
          </div>
        </div>
        <div className={`px-3 py-1.25 rounded-md border ${labelBgClass} ${labelBorderClass} ${labelColorClass} text-[10px] font-bold uppercase tracking-[0.1em] font-mono flex-shrink-0 shadow-[0_0_15px_rgba(var(--overlay-rgb),0.05)]`}>
          {label}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="text-[13px] text-gold no-underline flex items-center gap-2 opacity-75 transition-all duration-200 px-3.5 py-2.5 bg-[rgba(var(--overlay-rgb),0.02)] rounded-lg border border-line hover:opacity-100 hover:border-gold/20 hover:bg-gold/5"
        >
          <LinkIcon size={13} />
          <span className="truncate flex-1">{url.replace(/https?:\/\/(www\.)?/, '')}</span>
          <ExternalLink size={11} className="opacity-50" />
        </a>
      </div>

      <div className="pt-5 border-t border-line flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-text-dim uppercase tracking-[0.12em] font-mono font-semibold">Forensic Authenticity</span>
          <span className="text-[12px] text-text-muted">Decision Confidence</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="w-20 h-1.25 bg-[rgba(var(--overlay-rgb),0.06)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${confidence}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: delay + 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              className={`h-full rounded-full ${confidence > 85 ? 'bg-green-400' : confidence > 50 ? 'bg-gold' : 'bg-red-400'}`}
            />
          </div>
          <span className={`text-xl font-bold font-mono leading-none ${confidence > 85 ? 'text-green-400' : confidence > 50 ? 'text-gold' : 'text-red-400'}`}>
            {confidence}<span className="text-[12px] opacity-60">%</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { speak } = useVoice();

  useEffect(() => {
    // Initial Neural Briefing
    const timer = setTimeout(() => {
      speak("Welcome to Truecast Forensic. System initialized. Global veracity index is nominal. Monitoring one hundred plus sources for narrative drift.");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Claims Audited', value: '100+   ', raw: '100' },
    { label: 'Error Margin', value: '0.02%', raw: '0.02' },
    { label: 'Trusted Sources', value: '10+', raw: '10 ' },
    { label: 'Verification Latency', value: '98ms', raw: '98' },
  ];

  return (
    <div className="bg-bg-main text-text-main font-sans min-h-screen overflow-x-hidden">
      <style>{`
        /* ── Custom Animations & Effects ── */
        @keyframes scan-line {
          0%   { top: 0%;   opacity: 0.4; }
          50%  {             opacity: 0.8; }
          100% { top: 100%; opacity: 0.4; }
        }
        .scan { animation: scan-line 3.5s ease-in-out infinite; }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor-blink { animation: blink 1.1s step-start infinite; }
      `}</style>

      {/* ══════════ HERO ══════════════════════════════════════════ */}
      <section className="min-h-[92vh] flex items-center px-6 py-20 md:px-10 lg:px-16 max-w-[1280px] mx-auto flex-col md:flex-row gap-12 lg:gap-[72px]">

        {/* Left copy */}
        <motion.div
          className="flex-1 min-w-0"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        >
          <h1 className="font-serif text-[38px] sm:text-[48px] lg:text-[76px] font-normal text-text-main leading-[1.07] tracking-tighter mb-6">
            The Standard for<br />
            <span className="text-gold">Truth</span> Representation.
          </h1>

          <p className="text-base text-text-muted leading-[1.75] max-w-[480px] mb-10">
            We don't just fact-check — we adjudicate. The Digital Jurist Protocol transforms raw information into legally-sound evidence through a transparent, editorial-grade verification pipeline.
          </p>

          <div className="flex flex-wrap gap-3">
            <button 
              className="bg-gold text-bg-main rounded-lg px-8 py-3.5 font-bold text-[13px] tracking-wide inline-flex items-center gap-2 transition-all hover:opacity-85 hover:-translate-y-px active:translate-y-0 whitespace-nowrap"
              onClick={() => navigate('/verify')}
            >
              Start New Analysis <ArrowRight size={15} />
            </button>
            <button 
              className="bg-surf text-text-muted border border-line rounded-lg px-7 py-3.5 font-medium text-[13px] inline-flex items-center gap-2 transition-all hover:border-[rgba(var(--overlay-rgb),0.15)] hover:text-text-main/75 whitespace-nowrap"
              onClick={() => navigate('/architecture')}
            >
              System Roadmap
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-12 pt-7 border-t border-line">
            {[
              { icon: Database, label: '100+ sources indexed' },
              { icon: ShieldCheck, label: '99.98% accuracy' },
              { icon: Globe, label: 'Live OSINT streams' },
            ].map(({ icon: Ic, label }, i) => (
              <div key={i} className="flex items-center gap-1.75">
                <Ic size={12} className="text-text-dim" />
                <span className="text-[11px] text-text-dim font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right: Statue Hero */}
        <motion.div
          className="relative flex justify-center perspective-1000 w-full md:w-[420px] max-w-[420px]"
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-15 bg-radial-[circle] from-gold/10 via-transparent to-transparent blur-[40px] z-0" />
          
          <div className="relative z-1 flex-1">
            <motion.img 
              src="/lady_justice.png"
              alt="Truecast Lady Justice" 
              className="w-full max-w-[520px] rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-line"
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ══════════ PIPELINE ══════════════════════════════════════ */}
      <section className="px-6 py-24 md:px-10 lg:px-16 border-t border-line max-w-[1280px] mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-px bg-gold/55" />
            <span className="font-mono text-[10px] font-medium text-gold tracking-[0.14em] uppercase">
              The Process
            </span>
          </div>
          <h2 className="font-serif text-[28px] sm:text-[40px] lg:text-[52px] font-normal tracking-tight text-text-main mb-3.5 leading-[1.1]">
            The Adjudication Pipeline.
          </h2>
          <p className="text-[15px] text-text-muted leading-[1.7] max-w-[520px]">
            A rigorous three-stage mechanism ensuring every verdict is backed by immutable proof and peer-reviewed citations.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          <div className="md:col-span-6 lg:col-span-4 h-full">
            <PipelineCard num="01" icon={Edit3} title="Ingest & Isolate"
              body="Every incoming claim is atomized into its core propositions. We strip rhetorical noise to isolate the verifiable intent."
              delay={0} className="h-full" />
          </div>

          <div className="md:col-span-6 lg:col-span-8 h-full">
            <PipelineCard num="02" icon={Network} title="Evidence Mapping"
              body="Our protocol cross-references 12,000+ primary sources — from legislative archives to live data feeds — creating a weighted web of evidence."
              delay={0.1} className="h-full">
              <div className="mt-7 flex flex-col gap-2">
                {[
                  { label: 'Academic archives', w: 88 },
                  { label: 'Live OSINT feeds', w: 63 },
                  { label: 'Government indices', w: 94 },
                  { label: 'Cross-validation', w: 71 },
                ].map((bar, i) => (
                  <div key={i} className="flex items-center gap-3.5">
                    <span className="font-mono text-[10px] text-text-dim w-32 flex-shrink-0">{bar.label}</span>
                    <div className="flex-1 h-0.75 bg-[rgba(var(--overlay-rgb),0.06)] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${bar.w}%` }} viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${i === 2 ? 'bg-gold' : 'bg-[rgba(232,228,220,0.18)]'}`} />
                    </div>
                    <span className={`font-mono text-[10px] w-7 text-right ${i === 2 ? 'text-gold' : 'text-text-dim'}`}>
                      {bar.w}%
                    </span>
                  </div>
                ))}
              </div>
            </PipelineCard>
          </div>

          <div className="md:col-span-7 h-full">
            <PipelineCard num="03" icon={Gavel} title="The Verdict Release"
              body="A final judgment is rendered based on the Digital Jurist scoring rubric. Every verdict includes a direct evidence trail for public audit."
              delay={0.2} className="h-full">
              <div className="flex flex-wrap gap-2 mt-5.5">
                <span className="px-2.5 py-1 rounded-[4px] border font-mono text-[9px] font-bold uppercase tracking-widest bg-green-400/8 text-green-400 border-green-400/20">True</span>
                <span className="px-2.5 py-1 rounded-[4px] border font-mono text-[9px] font-bold uppercase tracking-widest bg-red-400/8 text-red-400 border-red-400/20">False</span>
                <span className="px-2.5 py-1 rounded-[4px] border font-mono text-[9px] font-bold uppercase tracking-widest bg-amber-400/8 text-amber-400 border-amber-400/20">Partial</span>
              </div>
            </PipelineCard>
          </div>

          <div className="md:col-span-5 h-full">
            <motion.div className="bg-gold/10 border border-gold/22 rounded-2xl p-9 lg:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-250 relative overflow-hidden h-full hover:border-gold/45 hover:bg-gold/14" 
              onClick={() => navigate('/verify')}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}>
              <div className="absolute -top-15 -right-15 w-[200px] h-[200px] bg-radial-[circle] from-gold to-transparent opacity-[0.07] pointer-events-none rounded-full" />
              <div className="relative z-1">
                <div className="w-11 h-11 rounded-11 bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-5">
                  <Gavel size={20} className="text-gold" />
                </div>
                <h3 className="font-serif text-[26px] font-normal text-text-main mb-2 tracking-tight">
                  Ready to audit?
                </h3>
                <p className="text-[13px] text-text-muted mb-6">
                  Open the workbench and run your first verification.
                </p>
                <button className="bg-gold text-bg-main rounded-lg px-8 py-3.5 font-bold text-[13px] tracking-wide inline-flex items-center gap-2 transition-all pointer-events-none">
                  Open Workbench <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ SOURCES ══════════════════════════════════════ */}
      <section className="px-6 py-24 md:px-10 lg:px-16 border-t border-line max-w-[1280px] mx-auto">
        <motion.header
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.45 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-6 h-px bg-gold/55" />
            <span className="font-mono text-[10px] font-medium text-gold tracking-[0.14em] uppercase">
              Transparency
            </span>
          </div>
          <div className="flex justify-between items-end flex-wrap gap-6">
            <div className="max-w-[600px]">
              <h2 className="font-serif text-[28px] sm:text-[40px] lg:text-[52px] font-normal tracking-tight text-text-main mb-3.5 leading-[1.1]">
                High-Fidelity Evidence.
              </h2>
              <p className="text-[15px] text-text-muted leading-[1.7]">
                Sources are never obscured. We provide direct access to the primary material used for adjudication, classified by our proprietary trust scoring algorithm.
              </p>
            </div>
            <div className="flex items-center gap-2 px-[18px] py-2.5 bg-[rgba(var(--overlay-rgb),0.03)] border border-line rounded-xl">
              <ShieldCheck size={14} className="text-green-400" />
              <span className="text-[11px] text-text-dim font-medium font-mono">OSINT INDEXED: 12.4K</span>
            </div>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
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

        <div className="mt-16 p-8 bg-red-400/5 border border-red-400/15 rounded-[20px] flex items-center gap-6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />
          <div className="w-12 h-12 rounded-full bg-red-400/12 flex items-center justify-center flex-shrink-0 border border-red-400/20">
            <AlertTriangle size={24} className="text-red-400" strokeWidth={2.5} />
          </div>
          <div>
            <h5 className="text-[15px] font-bold text-red-400 mb-1.5 uppercase tracking-wider">Zero-Tolerance for Source Hallucination</h5>
            <p className="text-[13px] text-[rgba(232,228,220,0.6)] leading-[1.7] max-w-[800px]">
              Unlike generic AI tools that may fabricate citations or mislabel sources to fit a narrative, Truecast enforces a strict <strong>Forensic Handshake™</strong>. Every source undergoing adjudication must pass a multi-vector validation check—verifying its cryptographic SSL certificate, domain authority, and historical neutrality index before it enters our ledger.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ═════════════════════════════════════════ */}
      <section className="px-6 py-20 md:px-10 lg:px-16 border-t border-line max-w-[1280px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              className="px-0 md:px-8 border-l border-line first:border-l-0 first:pl-0">
              <div className="font-serif text-[36px] md:text-[60px] font-normal tracking-tighter text-text-main leading-none mb-2.5">
                <Counter target={s.raw} />
                <span className="text-[0.55em] opacity-40">{s.value.replace(/[0-9.]/g, '')}</span>
              </div>
              <div className="font-mono text-[10px] font-medium text-text-dim tracking-[0.12em] uppercase">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}