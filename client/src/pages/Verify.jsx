import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Link as LinkIcon, FileText, Upload, ShieldCheck,
  ChevronRight, ChevronDown, Clock, Activity, Search, Mic, MicOff, ShieldAlert,
  Sparkles, Zap, AlertTriangle, Info, CheckCircle2, ExternalLink,
  BarChart3, Globe, XCircle, ArrowRight, RotateCcw, Download,
  Eye, BookOpen, Scale, Fingerprint, TrendingUp, Hash, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';
import AnalysisProcessing from '../components/AnalysisProcessing';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { generatePDF } from '../utils/pdfGenerator';
import { useVoice } from '../context/VoiceContext';

/* ─── Design tokens ─────────────────────────────── */
const GOLD  = 'var(--gold)';
const LINE  = 'var(--line)';
const TEXT  = 'var(--text-main)';
const DIM   = 'var(--text-dim)';
const MUTED = 'var(--text-muted)';

/* ─── Animated Score Ring ─────────────────────────── */
const ScoreRing = ({ score, size = 160, stroke = 8 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171';
  const glowColor = pct >= 70 ? 'rgba(74,222,128,0.25)' : pct >= 40 ? 'rgba(251,191,36,0.25)' : 'rgba(248,113,113,0.25)';

  return (
    <div style={{ position:'relative', width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(var(--overlay-rgb),0.06)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 1.8, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          style={{ fontFamily:"var(--font-serif)", fontSize: size * 0.28, fontWeight: 400, color, lineHeight:1 }}
        >
          {Math.round(score)}
        </motion.span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize: 9, color: DIM, letterSpacing:'0.15em', marginTop:4 }}>/ 100</span>
      </div>
    </div>
  );
};

/* ─── Verdict Badge ──────────────────────────────── */
const VerdictBadge = ({ verdict, size = 'sm' }) => {
  const v = (verdict || '').toLowerCase();
  let bg, fg, border, dot;

  if (['true','accurate','verified','correct','likely true'].some(t => v === t || v === `likely ${t}`)) {
    bg = 'rgba(74,222,128,0.08)'; fg = '#4ade80'; border = 'rgba(74,222,128,0.2)'; dot = '#4ade80';
  } else if (['false','inaccurate','refuted','fake'].some(t => v.includes(t))) {
    bg = 'rgba(248,113,113,0.08)'; fg = '#f87171'; border = 'rgba(248,113,113,0.2)'; dot = '#f87171';
  } else if (['unverified','partially','mixed','inconclusive','caution','suspicious'].some(t => v.includes(t))) {
    bg = 'rgba(251,191,36,0.08)'; fg = '#fbbf24'; border = 'rgba(251,191,36,0.2)'; dot = '#fbbf24';
  } else {
    bg = 'rgba(var(--overlay-rgb),0.04)'; fg = DIM; border = 'rgba(var(--overlay-rgb),0.1)'; dot = DIM;
  }

  const fontSize = size === 'lg' ? 11 : 9;
  const pad = size === 'lg' ? '5px 14px' : '3px 10px';

  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background: bg, color: fg, border: `1px solid ${border}`,
      fontSize, fontWeight: 700, letterSpacing:'0.08em', textTransform:'uppercase',
      padding: pad, borderRadius: 5, fontFamily:"var(--font-mono)", whiteSpace:'nowrap'
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background: dot }} />
      {verdict || 'Pending'}
    </span>
  );
};

/* ─── Confidence Bar ─────────────────────────────── */
const ConfidenceBar = ({ value, delay = 0 }) => {
  const pct = value > 1 ? value : value * 100;
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, width:'100%' }}>
      <div style={{ flex:1, height:4, background:'rgba(var(--overlay-rgb),0.06)', borderRadius:2, overflow:'hidden' }}>
        <motion.div
          initial={{ width:0 }}
          animate={{ width:`${pct}%` }}
          transition={{ duration:1.2, delay, ease:[0.34,1.56,0.64,1] }}
          style={{ height:'100%', borderRadius:2, background:color }}
        />
      </div>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:12, fontWeight:700, color, minWidth:36, textAlign:'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
};

/* ─── Expandable Claim Card ──────────────────────── */
const ClaimCard = ({ claim, index, delay = 0 }) => {
  const [open, setOpen] = useState(false);
  const isHindi = document.body.classList.contains('hi-mode');
  const v = (claim.verdict || '').toLowerCase();
  const isTrue = ['true','accurate','verified','correct'].some(t => v.includes(t));
  const isFalse = ['false','inaccurate','refuted','fake'].some(t => v.includes(t));
  const accentColor = isTrue ? '#4ade80' : isFalse ? '#f87171' : '#fbbf24';

  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.45, delay }}
      style={{
        background: 'rgba(var(--overlay-rgb),0.02)',
        border: `1px solid rgba(var(--overlay-rgb),0.06)`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '2px 14px 14px 2px',
        overflow:'hidden',
        transition:'border-color 0.2s, background 0.2s'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(var(--overlay-rgb),0.12)`; e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.035)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `rgba(var(--overlay-rgb),0.06)`; e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.02)'; }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'20px 24px', cursor:'pointer' }}
      >
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8,
          background: isTrue ? 'rgba(74,222,128,0.08)' : isFalse ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)',
          flexShrink:0, marginTop:2
        }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:700, color: accentColor }}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:8 }}>
            <VerdictBadge verdict={claim.verdict} />
            {claim.primaryEntity && (
              <span style={{ fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>
                {claim.primaryEntity}
              </span>
            )}
          </div>
          <p style={{ margin:0, fontSize:15, fontWeight:500, color:TEXT, lineHeight:1.55 }}>
            {claim.claim}
          </p>
          {claim.reasoning && !open && (
            <p style={{ margin:'8px 0 0', fontSize:12, color:MUTED, lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {claim.reasoning}
            </p>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
          <ConfidenceBar value={claim.confidence || 0} delay={delay + 0.2} />
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
            <ChevronDown size={16} color={DIM} />
          </motion.div>
        </div>
      </div>

      {/* Expandable Detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.3 }}
            style={{ overflow:'hidden' }}
          >
            <div style={{ padding:'0 24px 24px', borderTop:'1px solid rgba(var(--overlay-rgb),0.05)' }}>
              {/* Reasoning */}
              {claim.reasoning && (
                <div style={{ padding:'16px 0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                    <BookOpen size={12} color={GOLD} />
                    <span style={{ fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"var(--font-mono)" }}>{isHindi ? 'विश्लेषण तर्क और सबूत' : 'Analysis Reasoning'}</span>
                  </div>
                  <p style={{ margin:0, fontSize:13, color:MUTED, lineHeight:1.7 }}>{claim.reasoning}</p>
                </div>
              )}

              {/* Evidence Sources */}
              {claim.evidence && claim.evidence.length > 0 && (
                <div style={{ paddingTop:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                    <Globe size={12} color={GOLD} />
                    <span style={{ fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"var(--font-mono)" }}>
                      {claim.evidence.length} Source{claim.evidence.length > 1 ? 's' : ''} Referenced
                    </span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {claim.evidence.slice(0, 4).map((ev, j) => (
                      <a
                        key={j}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display:'flex', alignItems:'center', gap:10,
                          padding:'10px 14px',
                          background:'rgba(var(--overlay-rgb),0.03)',
                          border:'1px solid rgba(var(--overlay-rgb),0.06)',
                          borderRadius:8, textDecoration:'none',
                          transition:'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.background = 'rgba(201,168,76,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.06)'; e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.03)'; }}
                      >
                        <LinkIcon size={12} color={DIM} style={{ flexShrink:0 }} />
                        <span style={{ flex:1, fontSize:12, color:MUTED, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {ev.url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] || 'Source'}
                        </span>
                        <ExternalLink size={10} color={DIM} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const safeStr = (v) => {
  if (v === null || v === undefined) return "";
  let val = v;
  if (typeof v === 'string' && (v.trim().startsWith('{') || v.trim().startsWith('['))) {
    try { val = JSON.parse(v); } catch(e) {}
  }
  if (typeof val === 'object' && val !== null) {
    if (Array.isArray(val)) {
      const first = val[0] || {};
      return first.reasoning || first.summary || first.text || first.verdict || JSON.stringify(val);
    }
    return val.summary || val.text || val.reasoning || val.analysis || val.overview || 
           val.ExecutiveSummary?.text || val.claims?.[0]?.claim || JSON.stringify(val);
  }
  return String(val);
};

/* ─── Verdict Hero ───────────────────────────────── */
const VerdictHero = ({ score, claims = [], summary }) => {
  const isHindi = document.body.classList.contains('hi-mode');
  const isTrue = score > 65;
  const isMixed = score > 35 && score <= 65;
  const isFalse = score <= 35;

  let title, subtitle, color, icon, bgGrad;
  if (isTrue) {
    title = isHindi ? "सटीक के रूप में सत्यापित" : "Verified as Accurate";
    subtitle = isHindi 
      ? "क्रॉस-रेफरेंसिड इंटेलिजेंस मुख्य दावों को विश्वसनीय होने की पुष्टि करती है।" 
      : "Cross-referenced intelligence confirms the core assertions as reliable.";
    color = '#4ade80'; icon = <CheckCircle2 size={23} />; bgGrad = 'from-green-500/8 to-transparent';
  } else if (isMixed) {
    title = isHindi ? "आंशिक रूप से सत्यापित" : "Partially Verified";
    subtitle = isHindi 
      ? "मिश्रित संकेत — कुछ दावे पुष्ट, अन्य को और समीक्षा की आवश्यकता है।" 
      : "Mixed signals — some assertions confirmed, others require further review.";
    color = '#fbbf24'; icon = <AlertTriangle size={23} />; bgGrad = 'from-yellow-500/8 to-transparent';
  } else {
    title = isHindi ? "गलत के रूप में चिह्नित" : "Flagged as Inaccurate";
    subtitle = isHindi 
      ? "सबूत मुख्य दावों का खंडन करते हैं। स्रोत की विश्वसनीयता पर कम भरोसा है।" 
      : "Evidence contradicts core assertions. Low confidence in source reliability.";
    color = '#f87171'; icon = <ShieldAlert size={23} />; bgGrad = 'from-red-500/8 to-transparent';
  }

  const trueCount = claims.filter(c => ['true','accurate','verified','correct'].some(t => (c.verdict||'').toLowerCase().includes(t))).length;
  const falseCount = claims.filter(c => ['false','inaccurate','refuted'].some(t => (c.verdict||'').toLowerCase().includes(t))).length;
  const otherCount = claims.length - trueCount - falseCount;

  return (
    <motion.div
      initial={{ opacity:0, y:20 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.6 }}
      style={{
        display:'flex', alignItems:'center', gap:40,
        padding:'40px 48px',
        background:'rgba(var(--overlay-rgb),0.02)',
        border:'1px solid rgba(var(--overlay-rgb),0.06)',
        borderRadius:24,
        position:'relative', overflow:'hidden',
        flexWrap:'wrap'
      }}
    >
      {/* Background accent */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${color}, transparent)` }} />

      {/* Score Ring */}
      <ScoreRing score={score} size={140} />

      {/* Verdict Text */}
      <div style={{ flex:1, minWidth:240 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <span style={{ color }}>{icon}</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color, letterSpacing:'0.12em', textTransform:'uppercase' }}>
            {isHindi ? 'अंतिम फैसला' : 'Final Verdict'}
          </span>
        </div>
        <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(32px,4vw,48px)', fontWeight:400, color:TEXT, margin:'0 0 12px', letterSpacing:'-0.02em', lineHeight:1.1 }}>
          {title}.
        </h2>
        <p style={{ fontSize:16, color:TEXT, lineHeight:1.6, margin:0, maxWidth:620, opacity:0.95, fontWeight:450 }}>
          {safeStr(summary) || subtitle}
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display:'flex', gap:20, flexShrink:0 }}>
        {[
          { label: isHindi ? 'सत्यापित' : 'Verified', count: trueCount, color:'#4ade80', icon: CheckCircle2 },
          { label: isHindi ? 'खंडन' : 'Refuted', count: falseCount, color:'#f87171', icon: XCircle },
          { label: isHindi ? 'मिश्रित' : 'Mixed', count: otherCount, color:'#fbbf24', icon: AlertTriangle },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', minWidth:60 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', width:40, height:40, borderRadius:10, background:`${s.color}10`, margin:'0 auto 8px' }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div style={{ fontFamily:"var(--font-serif)", fontSize:22, fontWeight:500, color: s.count > 0 ? s.color : DIM }}>{s.count}</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:8, color:DIM, letterSpacing:'0.1em', textTransform:'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* ─── Narrative Duel ─────────────────────────────── */
const NarrativeDuel = ({ analysis }) => {
  if (!analysis) return null;
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} style={{ marginBottom:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(201,168,76,0.15)' }}>
        <Zap size={18} color={GOLD} />
        <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(18px,2.5vw,26px)', fontWeight:400, color:TEXT, margin:0 }}>Narrative Comparison</h3>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:16 }}>
        {[
          { data: analysis.sourceA, label:'Source A', isCorrect: analysis.sourceACorrect, color:'#60a5fa', bg:'rgba(96,165,250,0.05)', border:'rgba(96,165,250,0.12)' },
          { data: analysis.sourceB, label:'Source B', isCorrect: analysis.sourceBCorrect, color:'#f472b6', bg:'rgba(244,114,182,0.05)', border:'rgba(244,114,182,0.12)' },
        ].map(src => (
          <div key={src.label} style={{ 
            padding:24, borderRadius:16, 
            background: src.isCorrect ? 'rgba(74,222,128,0.08)' : src.bg, 
            border: src.isCorrect ? '1px solid #4ade80' : `1px solid ${src.border}`,
            position: 'relative'
          }}>
            {src.isCorrect && (
              <div style={{ position:'absolute', top:12, right:12, background:'#4ade80', color:'black', fontSize:8, fontWeight:800, padding:'2px 8px', borderRadius:100, letterSpacing:'0.1em' }}>VERIFIED CORRECT</div>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: src.isCorrect ? '#4ade80' : src.color }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color: src.isCorrect ? '#4ade80' : src.color, letterSpacing:'0.1em', textTransform:'uppercase' }}>{src.label}</span>
            </div>
            <p style={{ fontSize:14, color:TEXT, lineHeight:1.6, margin:'0 0 16px' }}>{src.data?.framing}</p>
            <div style={{ padding:12, background:'rgba(0,0,0,0.2)', borderRadius:10, border:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ display:'block', fontSize:9, fontWeight:700, color:'rgba(var(--overlay-rgb),0.3)', marginBottom:4, textTransform:'uppercase' }}>Strategic Focus</span>
              <p style={{ fontSize:12, fontWeight:600, color: src.isCorrect ? '#4ade80' : src.color, margin:0 }}>{src.data?.focus}</p>
            </div>
          </div>
        ))}
      </div>
      {analysis.verdict && (
        <div style={{ marginTop:20, padding:'24px 28px', borderRadius:18, background:'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)', border:'1px solid var(--gold)', boxShadow:'0 10px 40px -10px rgba(0,0,0,0.4)', position:'relative', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <ShieldCheck size={18} color={GOLD} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:11, fontWeight:800, color:GOLD, letterSpacing:'0.15em', textTransform:'uppercase' }}>Final Narrative Verdict</span>
          </div>
          <p style={{ fontSize:15, fontWeight:600, color:TEXT, lineHeight:1.6, margin:0, position:'relative', zIndex:1 }}>{analysis.verdict}</p>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:GOLD, opacity:0.05, filter:'blur(40px)' }} />
        </div>
      )}
      {analysis.comparativeBias?.length > 0 && (
        <div style={{ marginTop:16, padding:20, borderRadius:14, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(var(--overlay-rgb),0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <Activity size={13} color={DIM} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color:DIM, letterSpacing:'0.1em', textTransform:'uppercase' }}>Bias & Omissions</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:8 }}>
            {analysis.comparativeBias.map((b, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, fontSize:12, color:MUTED, lineHeight:1.5 }}>
                <span style={{ color:GOLD, marginTop:2, flexShrink:0 }}>·</span> {b}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};


/* ═══════════════════════════════════════════════════
   MAIN VERIFY COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Verify() {
  const { user } = useAuth();
  const [lang, setLang] = useState('en');
  const [mode, setMode] = useState('normal');
  const isHindi = lang === 'hi';

  useEffect(() => {
    if (lang === 'hi') {
      document.body.classList.add('hi-mode');
    } else {
      document.body.classList.remove('hi-mode');
    }
  }, [lang]);

  const [url, setUrl] = useState('');
  const [url2, setUrl2] = useState('');
  const [text, setText] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [recentReports, setRecentReports] = useState(() => {
    if (!localStorage.getItem('token')) {
      return JSON.parse(localStorage.getItem('guest_verifications') || '[]').map(v => ({
        id: v.id,
        input_text: v.input || v.text || 'Guest Audit',
        truth_score: v.truthScore,
        claims_count: v.claims?.length || 0,
        full_data: v,
        timestamp: v.timestamp || new Date().toISOString()
      }));
    }
    return [];
  });
  const [activeFilter, setActiveFilter] = useState('All');
  const [listening, setListening] = useState(null);
  const [voiceReady, setVoiceReady] = useState(false);
  const [interim, setInterim] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportName, setExportName] = useState('');
  const [credits, setCredits] = useState(() => {
    const saved = localStorage.getItem('guest_credits');
    return saved !== null ? parseInt(saved) : 3;
  });
  const [showCreditModal, setShowCreditModal] = useState(false);

  const navigate = useNavigate();
  const recRef = useRef(null);
  const abortRef = useRef(null);
  const { speak } = useVoice();

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setVoiceReady(true);
  }, []);

  const handleCancel = () => { if (abortRef.current) { abortRef.current.abort(); setLoading(false); setStep(0); setLogs([]); } };

  const handleVerify = useCallback(async () => {
    const input = url.trim() || text.trim();
    if (!input) return;
    if (mode === 'adversarial' && !((url.trim() && url2.trim()) || (text.trim() && text2.trim()))) return;
    if (!user && credits <= 0) { setShowCreditModal(true); return; }

    setLoading(true); setResults(null); setError(null); setStep(1); setElapsed(0);
    setLogs([{ msg: 'Initializing analysis pipeline…', id: Date.now() }]);
    const controller = new AbortController(); abortRef.current = controller;
    const token = localStorage.getItem('token');

    try {
      let payload = { mode, language: lang };
      if (mode === 'adversarial') {
        if (url.trim()) payload = { ...payload, url: url.trim(), url2: url2.trim() };
        else payload = { ...payload, text: text.trim(), text2: text2.trim() };
      } else {
        if (url.trim()) payload = { ...payload, url: url.trim() };
        else payload = { ...payload, text: text.trim() };
      }

      const clock = setInterval(() => setElapsed(e => e + 1), 1000);
      const res = await fetch(`${API_BASE}/verify-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', finalResults = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop();
        for (const chunk of chunks) {
          if (chunk.startsWith('data:')) {
            const ev = JSON.parse(chunk.slice(5).trim());
            if (ev.type === 'progress') setLogs(l => [...l.slice(-10), { msg: ev.data, id: Date.now() }]);
            else if (ev.type === 'complete') finalResults = ev.data;
            else if (ev.type === 'error') throw new Error(ev.data);
          }
        }
      }
      clearInterval(clock);
      if (!finalResults) throw new Error('Stream terminated.');
      setStep(4); setResults(finalResults); setLoading(false);

      // ── Voice Adjudication ──
      const score = finalResults.truthScore || 0;
      const verdict = finalResults.verdict || (score > 65 ? 'Verified' : score > 35 ? 'Mixed' : 'Refuted');
      const intro = isHindi ? `विश्लेषण पूर्ण। सत्यता स्कोर: ${Math.round(score)} प्रतिशत। निष्कर्ष: ${verdict}। ` : `Analysis Complete. Truth Index: ${Math.round(score)} percent. Verdict: ${verdict}. `;
      speak(intro + (finalResults.summary || ''));

      if (!user) {
        const guestData = JSON.parse(localStorage.getItem('guest_verifications') || '[]');
        const newItem = { ...finalResults, timestamp: new Date().toISOString(), type: 'verification' };
        guestData.unshift(newItem);
        localStorage.setItem('guest_verifications', JSON.stringify(guestData.slice(0, 5)));
        setRecentReports(guestData.slice(0, 5).map(v => ({
          id: v.id, input_text: v.input || v.text || 'Guest Audit',
          truth_score: v.truthScore, claims_count: v.claims?.length || 0,
          full_data: v, timestamp: v.timestamp
        })));
        const n = Math.max(0, credits - 1);
        setCredits(n);
        localStorage.setItem('guest_credits', n);
      }

      if (token) axios.get(`${API_BASE}/history?limit=10`, { headers: { Authorization: `Bearer ${token}` } }).then(r => setRecentReports(r.data));
      if (finalResults.truthScore >= 80) confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 }, colors: ['#C9A84C', '#fff'] });
    } catch (err) {
      if (!axios.isCancel(err)) setError('Audit failed or interrupted.');
      setLoading(false);
    }
  }, [url, url2, text, text2, mode, lang, user, credits]);

  const handleFileAudit = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50 * 1024 * 1024) { setError('File too large (>50MB).'); return; }
    if (!user && credits <= 0) { setShowCreditModal(true); return; }
    setLoading(true); setStep(1); setElapsed(0);
    setLogs([{ msg: 'Decoding encrypted media stream…', id: Date.now() }]);
    const formData = new FormData(); formData.append('media', file);
    try {
      const res = await axios.post(`${API_BASE}/transcribe-and-verify`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResults(res.data); setStep(4); setLoading(false);
    } catch (err) { setError('Media audit failed.'); setLoading(false); }
  };

  const toggleVoice = (target) => {
    if (listening === target) {
      if (recRef.current) try { recRef.current.stop(); } catch(e){}
      setListening(null);
    } else {
      if (recRef.current) try { recRef.current.stop(); } catch(e){}
      setListening(target);
      if (voiceReady) {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SR();
        rec.continuous = true; rec.interimResults = true;
        rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        rec.onresult = (e) => {
          let f='', i='';
          for(let j=e.resultIndex; j<e.results.length; j++){ if(e.results[j].isFinal) f+=e.results[j][0].transcript; else i+=e.results[j][0].transcript; }
          setInterim(i);
          if(f) {
            const cmd = f.trim().toLowerCase();

            // ── Voice Commands (intercepted, not appended) ──
            if (['clear','delete','reset','क्लियर','डिलीट','मिटाओ','हटाओ'].some(c => cmd.includes(c))) {
              setText(''); setText2(''); setUrl(''); setUrl2(''); setError(null);
              setInterim('');
              return;
            }
            if (['switch to hindi','hindi','हिंदी','हिन्दी'].some(c => cmd.includes(c))) {
              setLang('hi');
              if (recRef.current) try { recRef.current.stop(); } catch(ex){}
              setListening(null); setInterim('');
              setTimeout(() => toggleVoice(target), 300); // restart in new lang
              return;
            }
            if (['switch to english','english','इंग्लिश','अंग्रेजी'].some(c => cmd.includes(c))) {
              setLang('en');
              if (recRef.current) try { recRef.current.stop(); } catch(ex){}
              setListening(null); setInterim('');
              setTimeout(() => toggleVoice(target), 300);
              return;
            }
            if (['stop','terminate','रुको','बंद करो'].some(c => cmd.includes(c))) {
              if (recRef.current) try { recRef.current.stop(); } catch(ex){}
              setListening(null); setInterim('');
              return;
            }
            // ── Expanded Analysis Trigger ──
            const analyzeCommands = [
              'analyze','analyse','analysis','verify','verifying','run','start','begin','go','audit','interrogate',
              'चलाओ','जांचो','जांच करो','जांच','जांचिये','जांचें','शुरू करो','शुरू','शुरू करें','देखें',
              'jaanch karo','jaanch','jach karo','jach','jaanchiye','janche','jancho','jaanch akro','jach akro','jachakro','janchna'
            ];
            if (analyzeCommands.some(c => cmd.includes(c))) {
              setLogs(l => [...l, { msg: isHindi ? 'वॉइस कमांड: विश्लेषण शुरू हो रहा है...' : 'Voice Command: Starting analysis...', id: Date.now() }]);
              handleVerify();
              setListening(null);
              setInterim('');
              if (recRef.current) try { recRef.current.stop(); } catch(ex){}
              return;
            }

            // ── Normal dictation (append to field) ──
            if (target === 'text') setText(p => p ? `${p} ${f}` : f);
            else setText2(p => p ? `${p} ${f}` : f);
          }
        };
        rec.onend = () => { if (listening === target) setListening(null); };
        rec.start(); recRef.current = rec;
      }
    }
  };

  const canRun = mode === 'adversarial'
    ? ((url.trim() && url2.trim()) || (text.trim() && text2.trim()))
    : (url.trim() || text.trim() || interim.trim());

  const resetAll = () => { setResults(null); setUrl(''); setUrl2(''); setText(''); setText2(''); setError(null); };

  /* ── Mode Definitions ── */
  const MODES = [
    { id:'normal',      label: isHindi ? 'मानक' : 'Standard',       desc: isHindi ? 'मल्टी-सोर्स आम सहमति' : 'Multi-source consensus', icon: Scale,        color:'#60a5fa' },
    { id:'adversarial', label: isHindi ? 'तुलना' : 'Compare',         desc: isHindi ? 'कथा द्वंद्व विश्लेषण' : 'Narrative duel analysis', icon: Layers,      color:'#f472b6' },
    { id:'deep',        label: isHindi ? 'गहन ओएसइंट' : 'Deep OSINT',      desc: isHindi ? 'संपूर्ण खुफिया' : 'Exhaustive intelligence', icon: Fingerprint, color:'#a78bfa' },
    { id:'pro',         label: isHindi ? 'मल्टी-एजेंट' : 'Multi-Agent',     desc: isHindi ? 'एआई एन्सेम्बल पाइपलाइन' : 'AI ensemble pipeline',    icon: Zap,         color: GOLD },
  ];

  /* ═══════════════════════════════════════════════════ */
  return (
    <div style={{ display:'flex', background:'var(--bg-main)', minHeight:'100vh', color:TEXT, fontFamily:"var(--font-body)" }}>
      <style>{`
        .v-input-field {
          width:100%; box-sizing:border-box;
          background: rgba(var(--overlay-rgb),0.025);
          border: 1px solid rgba(var(--overlay-rgb),0.08);
          border-radius: 12px;
          color: ${TEXT}; outline:none;
          font-family: var(--font-body);
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
        }
        .v-input-field:focus {
          border-color: rgba(201,168,76,0.45);
          background: rgba(201,168,76,0.035);
          box-shadow: 0 0 0 3px rgba(201,168,76,0.06), 0 2px 12px rgba(201,168,76,0.04);
        }
        .v-input-field:hover:not(:focus) { border-color: rgba(var(--overlay-rgb),0.14); }
        .v-input-field::placeholder { color: ${DIM}; }

        .v-mode-card {
          display:flex; align-items:center; gap:12px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(var(--overlay-rgb),0.06);
          background: rgba(var(--overlay-rgb),0.02);
          cursor:pointer; transition: all 0.2s;
          text-align:left;
        }
        .v-mode-card:hover { border-color: rgba(var(--overlay-rgb),0.12); background: rgba(var(--overlay-rgb),0.04); }
        .v-mode-card.active { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.06); box-shadow: 0 0 0 1px rgba(201,168,76,0.15); }

        .v-cta-btn {
          display:inline-flex; align-items:center; gap:10px;
          height:48px; padding:0 32px;
          background: var(--gold); color: var(--bg-main);
          border:none; border-radius:13px;
          font-family: var(--font-body);
          font-weight:700; font-size:14px;
          cursor:pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(201,168,76,0.2);
        }
        .v-cta-btn:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 25px rgba(201,168,76,0.3); }
        .v-cta-btn:active { transform: translateY(0); }
        .v-cta-btn:disabled { opacity:0.3; pointer-events:none; }

        .v-ghost-btn {
          display:inline-flex; align-items:center; gap:8px;
          height:44px; padding:0 20px;
          background:transparent; color: var(--gold);
          border: 1px solid rgba(201,168,76,0.25);
          border-radius:12px;
          font-family: var(--font-body);
          font-weight:600; font-size:13px;
          cursor:pointer; transition: all 0.2s;
        }
        .v-ghost-btn:hover { background: rgba(201,168,76,0.08); border-color: rgba(201,168,76,0.4); }

        @media (max-width: 768px) {
          .v-results-hero { flex-direction: column !important; text-align: center; }
          .v-input-grid { grid-template-columns: 1fr !important; }
          .v-mode-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      <Sidebar data-html2canvas-ignore activeFilter={activeFilter} onFilterChange={setActiveFilter} onExport={() => setShowExportModal(true)} />

      <main style={{ flex:1, maxWidth:1100, margin:'0 auto', padding:'28px 28px 24px', overflowY:'auto' }}>
        <AnimatePresence mode="wait">

          {/* ═══════════ INPUT STATE ═══════════ */}
          {!loading && !results && (
            <motion.div key="input" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.4 }}>

              {/* Page Header */}
              <header style={{ marginBottom:32, paddingBottom:24, borderBottom:'1px solid rgba(var(--overlay-rgb),0.06)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:20 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:20, flex:1, minWidth:300 }}>
                    <div style={{ width:4, height:48, borderRadius:2, background:GOLD }} />
                    <div>
                      <h1 style={{ fontFamily: "var(--font-serif)", fontSize:'clamp(36px,5vw,52px)', fontWeight:400, color:TEXT, margin:0, letterSpacing:'-0.03em', lineHeight:1 }}>
                        {isHindi ? 'विश्लेषण और सत्यापन' : 'Analyze & Verify.'}
                      </h1>
                      <p style={{ fontSize:15, color:MUTED, margin:'10px 0 0', lineHeight:1.5, maxWidth:600 }}>
                        {isHindi ? 'सत्यापित खुफिया स्रोतों के विरुद्ध दावों की जिरह करें। URL पेस्ट करें, दावा टाइप करें या मीडिया अपलोड करें।' : 'Cross-examine claims against verified intelligence sources. AI-driven forensic interrogation for the digital age.'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    {/* Live Status Pill */}
                    
                    {!user && (
                      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'6px 14px', background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:100 }}>
                        <Zap size={11} color={GOLD} />
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.08em' }}>{credits} / 3 {isHindi ? 'क्रेडिट्स' : 'Credits'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </header>
              <style>{`@keyframes ap-pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }`}</style>

              {/* Mode + Language — single row */}
              <section style={{ display:'flex', alignItems:'flex-end', gap:20, marginBottom:20, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <span style={{ display:'block', fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>{isHindi ? 'विश्लेषण मोड' : 'Analysis Mode'}</span>
                  <div className="v-mode-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
                    {MODES.map(m => (
                      <button key={m.id} className={`v-mode-card ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
                        <div style={{ width:32, height:32, borderRadius:8, background: mode === m.id ? `${m.color}18` : 'rgba(var(--overlay-rgb),0.04)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.2s' }}>
                          <m.icon size={15} color={mode === m.id ? m.color : DIM} />
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color: mode === m.id ? TEXT : MUTED, lineHeight:1.15 }}>{m.label}</div>
                          <div style={{ fontSize:10, color:DIM, marginTop:2 }}>{m.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink:0 }}>
                  <span style={{ display:'block', fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:10 }}>{isHindi ? 'भाषा' : 'Language'}</span>
                  <div style={{ display:'inline-flex', padding:3, background:'rgba(var(--overlay-rgb),0.04)', borderRadius:10, border:'1px solid rgba(var(--overlay-rgb),0.06)' }}>
                    {[{id:'en', label:'English'},{id:'hi', label:'हिंदी'}].map(l => (
                      <button key={l.id} onClick={() => setLang(l.id)} style={{ padding:'8px 18px', borderRadius:7, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: lang === l.id ? 'rgba(201,168,76,0.15)' : 'transparent', color: lang === l.id ? GOLD : DIM, transition:'all 0.2s', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Input Card */}
              <div style={{
                padding:'24px 28px', borderRadius:18,
                background:'rgba(var(--overlay-rgb),0.015)',
                border:'1px solid rgba(var(--overlay-rgb),0.06)',
                marginBottom:18,
                position:'relative', overflow:'hidden'
              }}>
                {/* Card top accent */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)' }} />

                <section className="v-input-grid" style={{ display:'grid', gridTemplateColumns: mode === 'adversarial' ? '1fr 1fr' : '1fr', gap:20 }}>

                  {/* Source A / Primary */}
                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, minHeight:28 }}>
                      <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
                        <Search size={10} color={DIM} />
                        {mode === 'adversarial' ? (isHindi ? 'स्रोत क' : 'Source A') : (isHindi ? 'स्रोत इनपुट' : 'Source Input')}
                      </span>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:10, color:GOLD, fontFamily:"var(--font-mono)", transition:'opacity 0.2s', padding:'4px 10px', borderRadius:6, background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.12)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.12)'; }}
                      >
                        <Upload size={10} /> {isHindi ? 'अपलोड करें' : 'Upload'}
                        <input type="file" style={{ display:'none' }} onChange={handleFileAudit} />
                      </label>
                    </div>

                    {/* URL Input */}
                    <div style={{ position:'relative', marginBottom:10 }}>
                      <LinkIcon size={14} color={DIM} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input
                        type="text" value={url} onChange={e => setUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="v-input-field"
                        style={{ height:46, paddingLeft:42, paddingRight:16, fontSize:14 }}
                      />
                    </div>

                    {/* Text Input */}
                    <div style={{ position:'relative' }}>
                      <textarea
                        value={text + (listening === 'text' ? interim : '')}
                        onChange={e => listening !== 'text' && setText(e.target.value)}
                        className="v-input-field"
                        placeholder={isHindi ? 'दावा, विवरण दर्ज करें या लेख का टेक्स्ट पेस्ट करें...' : "Enter a claim, statement, or paste article text…"}
                        style={{ minHeight:140, maxHeight:200, padding:'14px 48px 14px 18px', fontSize:14, lineHeight:1.6, resize:'vertical' }}
                      />
                      {voiceReady && (
                        <button onClick={() => toggleVoice('text')} style={{
                          position:'absolute', bottom:12, right:12,
                          width:36, height:36, borderRadius:'50%',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background: listening === 'text' ? '#ec4899' : 'rgba(var(--overlay-rgb),0.06)',
                          border:'none', cursor:'pointer',
                          transition:'all 0.2s',
                          boxShadow: listening === 'text' ? '0 0 20px rgba(236,72,153,0.4)' : 'none'
                        }}>
                          {listening === 'text' ? <MicOff size={14} color="#fff" /> : <Mic size={14} color={DIM} />}
                        </button>
                      )}
                      <div style={{ position:'absolute', bottom:14, left:18, fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>
                        {text.length}/8000
                      </div>
                    </div>
                  </div>

                  {/* Source B (Adversarial only) */}
                  {mode === 'adversarial' && (
                    <div>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, minHeight:28 }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
                          <Search size={10} color={DIM} />
                          {isHindi ? 'स्रोत ख (जवाब)' : 'Source B (Counter)'}
                        </span>
                        <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:10, color:GOLD, fontFamily:"var(--font-mono)", transition:'opacity 0.2s', padding:'4px 10px', borderRadius:6, background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.12)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.12)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,0.12)'; }}
                        >
                          <Upload size={10} /> Upload
                          <input type="file" style={{ display:'none' }} onChange={handleFileAudit} />
                        </label>
                      </div>
                      <div style={{ position:'relative', marginBottom:10 }}>
                        <LinkIcon size={14} color={DIM} style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                        <input type="text" value={url2} onChange={e => setUrl2(e.target.value)} placeholder="https://example.com/counter-article" className="v-input-field" style={{ height:46, paddingLeft:42, paddingRight:16, fontSize:14 }} />
                      </div>
                      <div style={{ position:'relative' }}>
                        <textarea
                          value={text2 + (listening === 'text2' ? interim : '')}
                          onChange={e => listening !== 'text2' && setText2(e.target.value)}
                          className="v-input-field"
                          placeholder={isHindi ? 'वैकल्पिक दावा या जवाबी नरेटिव दर्ज करें...' : "Enter alternative claim or counter-narrative…"}
                          style={{ minHeight:140, maxHeight:200, padding:'14px 48px 14px 18px', fontSize:14, lineHeight:1.6, resize:'vertical' }}
                        />
                        {voiceReady && (
                          <button onClick={() => toggleVoice('text2')} style={{
                            position:'absolute', bottom:12, right:12,
                            width:36, height:36, borderRadius:'50%',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            background: listening === 'text2' ? '#ec4899' : 'rgba(var(--overlay-rgb),0.06)',
                            border:'none', cursor:'pointer', transition:'all 0.2s'
                          }}>
                            {listening === 'text2' ? <MicOff size={14} color="#fff" /> : <Mic size={14} color={DIM} />}
                          </button>
                        )}
                        <div style={{ position:'absolute', bottom:14, left:18, fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>
                          {text2.length}/8000
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Action Bar */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <button className="v-cta-btn" onClick={handleVerify} disabled={!canRun}>
                    <Gavel size={16} />
                    {mode === 'adversarial' ? 'Compare Perspectives' : 'Run Verification'}
                  </button>
                  {(url || text) && (
                    <button onClick={resetAll} style={{ background:'none', border:'1px solid rgba(var(--overlay-rgb),0.08)', borderRadius:10, padding:'10px 16px', cursor:'pointer', color:DIM, fontSize:12, display:'flex', alignItems:'center', gap:6, transition:'all 0.2s', fontFamily:"'DM Sans',system-ui,sans-serif" }}
                      onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.15)'; }} onMouseLeave={e => { e.currentTarget.style.color = DIM; e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.08)'; }}
                    >
                      <RotateCcw size={12} /> {isHindi ? 'साफ करें' : 'Clear'}
                    </button>
                  )}
                  {error && <span style={{ fontSize:12, color:'#f87171', fontWeight:500 }}>{error}</span>}
                </div>
                {/* Trust badges */}
                <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                  {[
                    { icon: ShieldCheck, label: 'Multi-source audit' },
                    { icon: Globe, label: 'OSINT indexed' },
                    { icon: Fingerprint, label: 'AI detection' },
                  ].map((b, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <b.icon size={11} color={DIM} />
                      <span style={{ fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>{b.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Reports — compact */}
              {recentReports.length > 0 && (
                <section style={{ marginTop:20, paddingTop:16, borderTop:`1px solid rgba(var(--overlay-rgb),0.06)` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.14em', textTransform:'uppercase' }}>Recent Audits</span>
                    <button onClick={() => navigate('/history')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:10, color:GOLD, fontFamily:"var(--font-mono)", letterSpacing:'0.06em' }}>
                      View All →
                    </button>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
                    {recentReports.slice(0, 3).map((d, i) => (
                      <div key={i} onClick={() => navigate(`/history/${d.id}`)} style={{
                        padding:16, borderRadius:14,
                        background:'rgba(var(--overlay-rgb),0.02)', border:'1px solid rgba(var(--overlay-rgb),0.06)',
                        cursor:'pointer', transition:'all 0.2s',
                        display:'flex', alignItems:'center', gap:14
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'; e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.06)'; e.currentTarget.style.background = 'rgba(var(--overlay-rgb),0.02)'; }}
                      >
                        <div style={{ width:40, height:40, borderRadius:10, background:'rgba(201,168,76,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:16, fontWeight:400, color:GOLD }}>{Math.round(d.truth_score || d.truthScore || 0)}</span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:13, color:TEXT, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {d.input_text || d.input || 'Analysis'}
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                            <span style={{ fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>
                              {new Date(d.timestamp || d.created_at).toLocaleDateString()}
                            </span>
                            <span style={{ fontSize:10, color:DIM }}>·</span>
                            <span style={{ fontSize:10, color:DIM, fontFamily:"var(--font-mono)" }}>
                              {d.claims_count || d.claimsCount || 0} claims
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} color={DIM} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {/* ═══════════ LOADING STATE ═══════════ */}
          {loading && (
            <motion.div key="load" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <AnalysisProcessing elapsed={elapsed} step={step} logs={logs} inputTitle={url || text.slice(0,60)} onCancel={handleCancel} listening={listening} interim={interim} lang={lang} />
            </motion.div>
          )}

          {/* ═══════════ RESULTS STATE ═══════════ */}
          {results && !loading && (
            <motion.div key="results" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }} style={{ display:'flex', flexDirection:'column', gap:32 }}>

              {/* Verdict Hero */}
              <VerdictHero score={results.truthScore} claims={results.claims || []} summary={results.summary} />

              {/* Narrative Duel (if adversarial) */}
              {results.narrativeAnalysis && <NarrativeDuel analysis={results.narrativeAnalysis} />}

              {/* AI Detection & Bias Metrics */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                {[
                  { label:'AI Text Detection', value: results.aiTextDetection?.score != null ? `${results.aiTextDetection.score}%` : 'N/A', desc: results.aiTextDetection?.explanation || 'Baseline', icon: Fingerprint, color:'#a78bfa' },
                  { label:'Bias Spectrum',      value: results.biasSpectrum?.leaning || 'Neutral', desc: `Score: ${results.biasSpectrum?.score ?? 0}`, icon: BarChart3, color:'#f472b6' },
                  { label:'Claims Analyzed',    value: results.claims?.length || 0, desc: `Truth Index: ${Math.round(results.truthScore)}%`, icon: Scale, color: GOLD },
                  { label:'Forensic Engine',    value: results.meta?.models?.adjudication || 'Truecast Core', desc: `Latency: ${results.meta?.latency || '0s'}`, icon: Zap, color:'#4ade80' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity:0, y:12 }}
                    animate={{ opacity:1, y:0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    style={{
                      padding:20, borderRadius:16,
                      background:'rgba(var(--overlay-rgb),0.02)',
                      border:'1px solid rgba(var(--overlay-rgb),0.06)'
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                      <m.icon size={14} color={m.color} />
                      <span style={{ fontSize:10, fontWeight:700, color:DIM, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"var(--font-mono)" }}>{m.label}</span>
                    </div>
                    <div style={{ fontSize:20, fontWeight:600, color:TEXT, fontFamily:"'DM Serif Display',serif", marginBottom:4 }}>{m.value}</div>
                    <div style={{ fontSize:11, color:MUTED }}>{m.desc}</div>
                  </motion.div>
                ))}
              </div>

              {/* Claims Section */}
              <section>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(var(--overlay-rgb),0.06)' }}>
                  <div>
                    <h3 style={{ fontFamily:"var(--font-serif)", fontSize:'clamp(22px,3vw,30px)', fontWeight:400, color:TEXT, margin:0 }}>
                      Claim Analysis
                    </h3>
                    <p style={{ margin:'4px 0 0', fontSize:12, color:DIM }}>{results.claims?.length} assertions verified · click to expand evidence</p>
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {results.claims?.map((c, i) => (
                    <ClaimCard key={i} claim={c} index={i} delay={0.06 * i} />
                  ))}
                </div>
              </section>

              {/* Action Footer */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16,
                padding:'28px 32px',
                background:'rgba(201,168,76,0.04)',
                border:'1px solid rgba(201,168,76,0.12)',
                borderRadius:20
              }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <Sparkles size={14} color={GOLD} />
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.12em', textTransform:'uppercase' }}>Audit Complete</span>
                  </div>
                  <p style={{ fontSize:13, color:MUTED, margin:0 }}>
                    Confidence level of <strong style={{ color:TEXT }}>{Math.round(results.truthScore)}%</strong> across {results.claims?.length} verified assertions.
                  </p>
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button className="v-cta-btn" onClick={() => navigate(`/history/${results.id || results.reportId}`)} style={{ height:44, fontSize:13 }}>
                    {isHindi ? 'पूरी रिपोर्ट' : 'Full Report'} <ChevronRight size={15} />
                  </button>
                  <button className="v-ghost-btn" onClick={() => setShowExportModal(true)}>
                    <Download size={14} /> {isHindi ? 'PDF निर्यात करें' : 'Export PDF'}
                  </button>
                  <button onClick={resetAll} style={{
                    height:44, padding:'0 18px', background:'none', border:'1px solid rgba(var(--overlay-rgb),0.1)',
                    borderRadius:12, color:DIM, fontSize:12, fontWeight:600, cursor:'pointer',
                    display:'flex', alignItems:'center', gap:6, transition:'all 0.2s',
                    fontFamily:"var(--font-body)"
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.2)'; e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(var(--overlay-rgb),0.1)'; e.currentTarget.style.color = DIM; }}
                  >
                    <RotateCcw size={12} /> {isHindi ? 'नया ऑडिट' : 'New Audit'}
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════════ MODALS ═══════════ */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(12px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
            onClick={() => setShowExportModal(false)}
          >
            <motion.div initial={{ scale:0.95, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:16 }}
              onClick={e => e.stopPropagation()}
              style={{ width:'100%', maxWidth:440, background:'var(--bg-main)', border:'1px solid rgba(var(--overlay-rgb),0.1)', borderRadius:28, padding:'40px 36px', position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
              <h3 style={{ fontFamily:"var(--font-serif)", fontSize:28, fontWeight:400, margin:'0 0 8px', color:TEXT }}>Export Report</h3>
              <p style={{ fontSize:13, color:MUTED, lineHeight:1.6, margin:'0 0 28px' }}>Enter your name to sign the verified intelligence dossier.</p>
              <div style={{ marginBottom:24 }}>
                <span style={{ display:'block', fontFamily:"var(--font-mono)", fontSize:9, color:DIM, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{isHindi ? 'लेखक के हस्ताक्षर' : 'Author Signature'}</span>
                <input type="text" value={exportName} onChange={e => setExportName(e.target.value)} placeholder="e.g. Agent J. Smith"
                  className="v-input-field" style={{ height:48, padding:'0 18px', fontSize:14 }} autoFocus />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setShowExportModal(false)} style={{
                  flex:1, height:48, borderRadius:12, border:'1px solid rgba(var(--overlay-rgb),0.1)',
                  background:'transparent', color:MUTED, fontWeight:600, fontSize:13,
                  cursor:'pointer', transition:'all 0.2s', fontFamily:"var(--font-body)"
                }}>Cancel</button>
                <button onClick={() => { setShowExportModal(false); generatePDF(results, exportName, user?.organization||'', user?.logoUrl||''); }}
                  className="v-cta-btn" style={{ flex:1, justifyContent:'center' }}>
                  Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCreditModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(16px)', zIndex:10000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          >
            <motion.div initial={{ scale:0.9, y:30 }} animate={{ scale:1, y:0 }}
              style={{ width:'100%', maxWidth:480, padding:'56px 48px', background:'var(--bg-main)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:32, textAlign:'center', position:'relative', overflow:'hidden' }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
              <div style={{ width:64, height:64, borderRadius:20, background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
                <Zap size={32} color={GOLD} />
              </div>
              <h3 style={{ fontFamily:"var(--font-serif)", fontSize:32, fontWeight:400, margin:'0 0 12px', color:TEXT }}>Limit Reached.</h3>
              <p style={{ fontSize:15, color:MUTED, lineHeight:1.65, margin:'0 0 36px' }}>
                Free access allows 3 analyses. Sign up for unlimited audits, full reports, and more.
              </p>
              <button className="v-cta-btn" onClick={() => navigate('/auth')} style={{ width:'100%', justifyContent:'center', height:52, fontSize:15, marginBottom:12 }}>
                Get Full Access
              </button>
              <button onClick={() => setShowCreditModal(false)} style={{
                width:'100%', height:44, background:'transparent', border:'1px solid rgba(var(--overlay-rgb),0.1)', borderRadius:14,
                color:MUTED, fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                fontFamily:"var(--font-body)"
              }}>
                Return to Dashboard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}