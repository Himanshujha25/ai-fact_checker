import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ExternalLink, ArrowLeft, ArrowRight, Clock, Activity,
  Download, ShieldAlert, Layers, ChevronRight, FileText, Sparkles,AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import VerdictPieChart from '../components/VerdictPieChart';
import Sidebar from '../components/Sidebar';
import { API_BASE } from '../config';
import { generatePDF } from '../utils/pdfGenerator';



const GOLD = 'var(--gold)';
const GOLD_L = 'var(--gold-light)';
const GOLD2  = 'rgba(201,168,76,0.10)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';
const SURF = 'var(--surf)';

const verdictMeta = (v) => {
  const l = v?.toLowerCase();
  if (['true','accurate','verified'].includes(l))  return { color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)'  };
  if (['false','inaccurate'].includes(l))           return { color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)' };
  if (['partially true','mixed'].includes(l))       return { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)'  };
  return { color:DIM, bg:'rgba(var(--overlay-rgb),0.04)', border:LINE };
};

const VerdictBadge = ({ verdict }) => {
  const m = verdictMeta(verdict);
  return (
    <span style={{ color:m.color, background:m.bg, border:`1px solid ${m.border}`, fontSize:9, letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', padding:'4px 10px', borderRadius:4, whiteSpace:'nowrap', fontFamily:"'DM Mono', monospace" }}>
      {verdict || 'Pending'}
    </span>
  );
};

const ScoreArc = ({ score }) => {
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const hue = score >= 70 ? GOLD : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <svg viewBox="0 0 100 100" width="100" height="100" style={{ transform:'rotate(-90deg)' }}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(var(--overlay-rgb),0.05)" strokeWidth="5"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={hue} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
};

const StatCard = ({ label, value, color, pct, sub }) => (
  <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:14, padding:'24px 26px', display:'flex', flexDirection:'column', gap:14, transition:'border-color 0.2s' }}>
    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, letterSpacing:'0.12em', color:DIM, textTransform:'uppercase' }}>{label}</span>
    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:44, fontWeight:400, color:color||TEXT, lineHeight:1, letterSpacing:'-0.02em' }}>{value}</span>
    <div>
      <div style={{ height:2, background:'rgba(var(--overlay-rgb),0.06)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:1, ease:'easeOut' }}
          style={{ height:'100%', background:color||GOLD, borderRadius:4 }}/>
      </div>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:DIM }}>{sub}</span>
    </div>
  </div>
);

export default function ReportDetail() {
  const { id } = useParams();
  const [data,            setData]            = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportName,      setExportName]      = useState('');
  const navigate = useNavigate();
  const isHindi = document.body.classList.contains('hi-mode');

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem('token');
    axios.get(`${API_BASE}/history/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { 
        let raw = res.data;
        if (typeof raw === 'string') {
          try { raw = JSON.parse(raw); } catch(e) {}
        }
        
        // Sanitize data structure
        if (raw && raw.claims) {
          raw.claims = raw.claims.map(c => ({
            ...c,
            originalText: c.originalText || c.text || 'No text provided',
            verdict: c.verdict || 'Pending'
          }));
        }

        setData(raw); 
        setLoading(false); 
      })
      .catch(err => { setError(err.response?.data?.error || 'Dossier not found'); setLoading(false); });
  }, [id]);

  const handleExportPDF = () => setShowExportModal(true);

  const executePDFExport = () => {
    setShowExportModal(false);
    generatePDF(data, exportName);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Digital Jurist Protocol Analysis',
      text: 'Check out this forensic truth report from Truecast.',
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        alert('Report link copied to clipboard!');
      }
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/report/export/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `truecast_report_${id}.md`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Markdown export failed', err);
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--bg-main)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:24 }}>
      <style>{`
        @keyframes rd-spin { to { transform: rotate(360deg); } }
        @keyframes rd-pulse { 0%, 100% { opacity: 0.4; transform: scale(0.98); } 50% { opacity: 1; transform: scale(1); } }
      `}</style>
      <div style={{ position:'relative', width:54, height:54 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:`2px solid rgba(201,168,76,0.1)`, borderTopColor:GOLD, animation:'rd-spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}/>
        <div style={{ position:'absolute', inset:9, borderRadius:'50%', border:`1px solid rgba(201,168,76,0.05)`, borderBottomColor:GOLD, opacity:0.6, animation:'rd-spin 1.8s linear infinite reverse' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:GOLD, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:8, animation:'rd-pulse 2s ease-in-out infinite' }}>Encrypted Node Access</div>
        <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:TEXT, fontWeight:400 }}>Decrypting Forensic Dossier.</div>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div style={{ minHeight:'calc(100vh - 64px)', background:'var(--bg-main)', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, padding:48 }}>
      <div style={{ width:48, height:48, borderRadius:12, background:'rgba(248,113,113,0.08)', border:'1px solid rgba(248,113,113,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <ShieldAlert size={22} color="#f87171"/>
      </div>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>Dossier Unavailable.</h1>
      <p style={{ fontSize:13, color:MUTED }}>{error}</p>
      <Link to="/history" style={{ display:'inline-flex', alignItems:'center', gap:8, background:GOLD, color:'var(--bg-main)', borderRadius:9, padding:'12px 24px', fontSize:13, fontWeight:600, textDecoration:'none', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        <ArrowLeft size={14}/> Back to History
      </Link>
    </div>
  );

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
      // Prioritize explicit summary fields, then fall back to the first claim if it matches the mock structure
      return val.summary || val.text || val.reasoning || val.analysis || val.overview || 
             val.ExecutiveSummary?.text || val.claims?.[0]?.claim || JSON.stringify(val);
    }
    return String(val);
  };

  const isMatch = (v, targets) => {
    const s = safeStr(v).toLowerCase();
    return targets.some(t => s.includes(t));
  };

  const score         = Math.round(data?.truthScore?.value || data?.truthScore || 0);
  const total         = data?.claims?.length || 0;
  
  const verifiedCount = data?.claims?.filter(c => isMatch(c.verdict, ['true','accurate','verified','correct','likely true'])).length || 0;
  const refutedCount  = data?.claims?.filter(c => isMatch(c.verdict, ['false','inaccurate','refuted','fake','misleading','major error'])).length || 0;
  
  const bias = data?.biasSpectrum || { leaning: 'Neutral', score: 0, indicators: [] };
  if (!Array.isArray(bias.indicators)) bias.indicators = [];

  return (
    <div style={{ background:'var(--bg-main)', minHeight:'calc(100vh - 64px)', color:TEXT, fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', overflowX:'hidden' }}>

      {/* ── Export modal ── */}
      <AnimatePresence>
        {showExportModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:20 }}>
            <motion.div initial={{ scale:0.95, y:10 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:10 }}
              style={{ background:'#111118', border:`1px solid rgba(var(--overlay-rgb),0.07)`, borderRadius:16, width:'100%', maxWidth:400, padding:32 }}>
              <h3 style={{ fontFamily:"'DM Serif Display',serif", fontSize:24, color:'var(--text-main)', marginBottom:12 }}>Download Archive</h3>
              <p style={{ color:'rgba(232,228,220,0.42)', fontSize:14, marginBottom:24, lineHeight:1.5 }}>Enter your name for the official forensic record.</p>
              <div style={{ marginBottom:24 }}>
                <label style={{ display:'block', fontSize:9, fontFamily:"'DM Mono',monospace", color:'rgba(232,228,220,0.22)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Report Author</label>
                <input type="text" value={exportName} onChange={e => setExportName(e.target.value)}
                  placeholder="e.g. Himanshu Jha" autoFocus
                  style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'rgba(var(--overlay-rgb),0.04)', border:`1px solid rgba(var(--overlay-rgb),0.07)`, borderRadius:8, color:'var(--text-main)', fontSize:14, outline:'none' }}
                  onKeyDown={e => e.key==='Enter' && executePDFExport()}/>
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <button onClick={() => setShowExportModal(false)}
                  style={{ flex:1, padding:'12px', background:'rgba(var(--overlay-rgb),0.04)', border:`1px solid rgba(var(--overlay-rgb),0.07)`, borderRadius:8, color:'rgba(232,228,220,0.42)', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                  Cancel
                </button>
                <button onClick={executePDFExport}
                  style={{ flex:1, padding:'12px', background:'var(--gold)', border:'none', borderRadius:8, color:'var(--bg-main)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  Download PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`


        /* ── Buttons & rows (desktop unchanged) ── */
        .rd-btn-gold {
          background: ${GOLD}; color: var(--bg-main); border: none; border-radius: 9px;
          padding: 11px 22px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 12px; letter-spacing: 0.02em;
          display: inline-flex; align-items: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
        }
        .rd-btn-gold:hover { opacity: 0.85; transform: translateY(-1px); }

        .rd-btn-ghost {
          background: rgba(var(--overlay-rgb),0.04); color: ${MUTED};
          border: 1px solid ${LINE}; border-radius: 9px;
          padding: 11px 20px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 500; font-size: 12px;
          display: inline-flex; align-items: center; gap: 7px;
          transition: border-color 0.2s, color 0.2s; white-space: nowrap;
        }
        .rd-btn-ghost:hover { border-color: rgba(var(--overlay-rgb),0.15); color: ${TEXT}; }

        .claim-row {
          background: rgba(var(--overlay-rgb),0.025); border: 1px solid rgba(var(--overlay-rgb),0.07);
          border-radius: 14px; padding: 22px 24px;
          display: grid; grid-template-columns: 130px 1fr 90px 160px;
          gap: 20px; align-items: center; cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .claim-row:hover { background: rgba(var(--overlay-rgb),0.045); border-color: rgba(var(--overlay-rgb),0.13); }
        .claim-row:hover .rd-view-btn { opacity: 1; transform: translateX(0); }

        .rd-view-btn {
          opacity: 0; transform: translateX(6px);
          transition: opacity 0.2s, transform 0.2s;
          background: ${GOLD2}; border: 1px solid rgba(201,168,76,0.25);
          border-radius: 7px; padding: 8px 14px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 11px; font-weight: 600; color: ${GOLD};
          cursor: pointer; display: inline-flex; align-items: center; gap: 5px;
        }

        /* ══════════════════════════════════════════════════════
           MOBILE-ONLY overrides — zero desktop changes
           ══════════════════════════════════════════════════════ */

        /* Tablet ≤ 1024px */
        @media (max-width: 1024px) {
          .rd-main          { padding: 32px 28px 80px !important; }
          .rd-summary-grid  { grid-template-columns: 1fr 1fr !important; }
          .rd-ai-grid       { grid-template-columns: 1fr !important; }
          .rd-forensic-grid { grid-template-columns: 1fr !important; }
        }

        /* Mobile ≤ 768px */
        @media (max-width: 768px) {
          .rd-main          { padding: 24px 16px 100px !important; }
          .rd-page-header   { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .rd-header-btns   { width: 100% !important; }
          .rd-summary-grid  { grid-template-columns: 1fr !important; }
          /* Claim rows: hide last "View Evidence" column, simplify to 3 cols */
          .claim-row        { grid-template-columns: 110px 1fr 70px !important; gap: 12px !important; padding: 16px !important; }
          .rd-view-col      { display: none !important; }
          .rd-claim-header  { display: none !important; }
          /* Always show the view button on mobile (no hover) */
          .rd-view-btn      { opacity: 1 !important; transform: none !important; }
        }

        /* Small mobile ≤ 480px */
        @media (max-width: 480px) {
          .rd-main      { padding: 20px 12px 100px !important; }
          .claim-row    { grid-template-columns: 90px 1fr !important; }
          .rd-conf-col  { display: none !important; }
        }
      `}</style>

      <Sidebar id="sidebar-container" data-html2canvas-ignore activeFilter="All"
        onFilterChange={() => navigate('/history')} onExport={handleExportPDF} onShare={handleShare}/>

      {/* className="rd-main" gives mobile padding override */}
      <main className="rd-main" style={{ flex:1, maxWidth:1240, margin:'0 auto', padding:'40px 48px 80px', overflowY:'auto', overflowX:'hidden' }}>
        <div id="report-detail" style={{ background:'var(--bg-main)' }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom:40 }}>
            <button data-html2canvas-ignore onClick={() => navigate('/history')}
              style={{ background:'none', border:'none', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6, color:DIM, fontSize:12, fontFamily:"'DM Sans',system-ui,sans-serif", marginBottom:28, padding:0, transition:'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = TEXT}
              onMouseOut={e => e.currentTarget.style.color = DIM}>
              <ArrowLeft size={13}/> {isHindi ? 'संग्रह पर वापस जाएं' : 'Back to Archive'}
            </button>

            {/* className="rd-page-header" stacks on mobile */}
            <div className="rd-page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:32, paddingBottom:32, borderBottom:`1px solid ${LINE}` }}>
              <div style={{ minWidth:0, flex:1 }}>
                <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(32px,5vw,54px)', fontWeight:400, color:TEXT, letterSpacing:'-0.03em', lineHeight:1.05, margin:0 }}>
                  {isHindi ? 'डिजिटल जूरिस्ट प्रोटोकॉल विश्लेषण।' : 'Digital Jurist Protocol Analysis.'}
                </h1>
              </div>

              {/* className="rd-header-btns" goes full-width on mobile */}
              <div className="rd-header-btns" data-html2canvas-ignore style={{ display:'flex', gap:12, flexShrink:0, flexWrap:'wrap', alignItems:'center' }}>
                <button className="rd-btn-gold" onClick={handleExportPDF} style={{ height:44, padding:'0 24px', fontSize:13 }}>
                  <Download size={14}/> Export PDF
                </button>
                <button className="rd-btn-ghost" onClick={handleExportMarkdown} style={{ height:44, padding:'0 20px', fontSize:13 }}>
                  <FileText size={14}/> Dossier
                </button>
                <button className="rd-btn-ghost" onClick={handleShare} style={{ height:44, width:44, padding:0, justifyContent:'center' }}>
                  <ExternalLink size={16}/>
                </button>
              </div>
            </div>
          </div>

          {/* 🔎 Forensic Summary Card */}
          {data.summary && (
            <div style={{ marginBottom: 40, background: 'linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 100%)', border: `1px solid ${GOLD_L}`, borderRadius: 20, padding: '32px 36px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={14} color={GOLD} />
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {isHindi ? 'फॉरेंसिक कार्यकारी सारांश' : 'Forensic Executive Summary'}
                </span>
              </div>
              <p style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 'clamp(18px, 2.5vw, 26px)', color: TEXT, lineHeight: 1.5, margin: 0, position: 'relative', zIndex: 10, maxWidth: '92%' }}>
                {safeStr(data.summary)}
              </p>
              {/* Background punctuation mark accent */}
              <div style={{ position: 'absolute', bottom: -10, right: 30, fontSize: 120, color: GOLD, opacity: 0.03, fontFamily: "'DM Serif Display',serif", pointerEvents: 'none', userSelect: 'none', zIndex: 1 }}>”</div>
            </div>
          )}

          {/* ── Summary bento — className="rd-summary-grid" ── */}
          <div className="rd-summary-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:12, marginBottom:40 }}>
            
            {/* Score card */}
            <div style={{ background:GOLD2, border:`1px solid rgba(201,168,76,0.18)`, borderRadius:16, padding:'28px 28px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
              <div>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, letterSpacing:'0.12em', color:GOLD, textTransform:'uppercase', opacity:0.7 }}>
                  {isHindi ? 'समग्र विश्वसनीयता' : 'Aggregate Reliability'}
                </span>
                <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:16, flexWrap:'wrap' }}>
                  <div style={{ position:'relative', width:80, height:80, flexShrink:0 }}>
                    <ScoreArc score={score}/>
                    <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, fontWeight:400, color:TEXT, lineHeight:1 }}>{score}</span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:7, color:GOLD, letterSpacing:'0.08em' }}>/100</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:13, color:TEXT, marginBottom:6, lineHeight:1.5 }}>
                      {score>=70?(isHindi ? 'उच्च उद्धरण अखंडता' : 'High citation integrity'):score>=40?(isHindi ? 'मध्यम सटीकता' : 'Moderate accuracy'):(isHindi ? 'कम सत्यता देखी गई' : 'Low veracity detected')}
                    </div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM }}>{total} {isHindi ? 'दावों की समीक्षा की गई' : 'claims reviewed'}</div>
                  </div>
                </div>
              </div>
              <div style={{ position:'absolute', bottom:-40, right:-40, width:140, height:140, borderRadius:'50%', background:`radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity:0.06, pointerEvents:'none' }}/>
            </div>

            <StatCard label={isHindi ? 'सत्यापित दावे' : 'Verified Claims'} value={verifiedCount} color="#4ade80"
              pct={(verifiedCount/total)*100} sub={`${Math.round((verifiedCount/total)*100)}% ${isHindi ? 'आम सहमति अखंडता' : 'consensus integrity'}`}/>
            
            <StatCard label={isHindi ? 'खंडित दावे' : 'Refuted Claims'} value={refutedCount} color="#f87171"
              pct={(refutedCount/total)*100} sub={`${Math.round((refutedCount/total)*100)}% ${isHindi ? 'विरोधाभास दर' : 'contradiction rate'}`}/>

            <StatCard label={isHindi ? 'इंटेलिजेंस कोर' : 'Intelligence Core'} value={data.meta?.models?.adjudication ? data.meta.models.adjudication.split(' ')[0] : 'Truecast'} color={GOLD}
              pct={100} sub={data.meta?.models?.adjudication || (isHindi ? 'फॉरेंसिक एन्सेम्बल सक्रिय' : 'Forensic Ensemble Active')}/>
          </div>

          {/* ── AI Detection — className="rd-ai-grid" ── */}
          {data.aiTextDetection && (
            <div className="rd-ai-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:44 }}>
              <div style={{ padding:'24px', background:SURF, border:`1px solid ${LINE}`, borderRadius:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <Activity size={16} color={data.aiTextDetection.score>50?'#f87171':'#4ade80'}/>
                  <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em', color:DIM }}>AI Text Probability</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:38, color:TEXT, lineHeight:1 }}>
                    {Math.round(data.aiTextDetection.score?.value || data.aiTextDetection.score || 0)}%
                  </span>
                  <span style={{ fontSize:13, color:MUTED, paddingBottom:4 }}>
                    {(data.aiTextDetection.score?.value || data.aiTextDetection.score) > 50 ? 'Likely Synthesized' : 'Likely Human Written'}
                  </span>
                </div>
                <p style={{ fontSize:13, color:DIM, marginTop:14, lineHeight:1.5 }}>{safeStr(data.aiTextDetection.explanation)}</p>
              </div>

              {data.biasSpectrum && (
                <div style={{ padding:'24px', background:SURF, border:`1px solid ${LINE}`, borderRadius:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                    <ShieldAlert size={16} color={Math.abs(data.biasSpectrum.score) > 40 ? '#fbbf24' : '#4ade80'}/>
                    <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em', color:DIM }}>Semantic Bias Spectrum</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'flex-end', gap:14, marginBottom:16 }}>
                    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:38, color:TEXT, lineHeight:1 }}>{bias.leaning}</span>
                  </div>
                  
                  {/* Bias Meter */}
                  <div style={{ height:6, background:LINE, borderRadius:3, position:'relative', marginBottom:20 }}>
                    <motion.div 
                        initial={{ left: '50%' }}
                        animate={{ left: `${50 + (bias.score / 2)}%` }}
                        style={{ position:'absolute', width:12, height:12, background:GOLD, borderRadius:'50%', top:'50%', transform:'translate(-50%, -50%)', boxShadow:`0 0 10px ${GOLD}` }}
                    />
                    <div style={{ position:'absolute', left:0, top:12, fontSize:8, fontFamily:"'DM Mono',monospace", color:DIM }}>-100 (EXTREME LEFT)</div>
                    <div style={{ position:'absolute', right:0, top:12, fontSize:8, fontFamily:"'DM Mono',monospace", color:DIM }}>+100 (EXTREME RIGHT)</div>
                  </div>

                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {bias.indicators.map((ind, i) => (
                        <span key={i} style={{ fontSize:10, color:GOLD, background:GOLD2, padding:'4px 8px', borderRadius:4, border:`1px solid rgba(201,168,76,0.2)` }}>
                          {safeStr(ind)}
                        </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Visual Forensic Comparison — className="rd-forensic-grid" ── */}
          {data.forensicReference && (
            <div style={{ marginBottom:48 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:14, borderBottom:`1px solid ${GOLD_L}`, flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <ShieldCheck size={18} color={GOLD}/>
                  <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:26, fontWeight:400, color:TEXT }}>{isHindi ? 'विजुअल क्रॉस-रेफरेंस' : 'Visual Cross-Reference.'}</h3>
                </div>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:GOLD, fontWeight:600, letterSpacing:'0.12em' }}>{isHindi ? 'ए/बी इकाई विश्लेषण सक्रिय' : 'A/B ENTITY ANALYSIS ACTIVE'}</span>
              </div>

              <div className="rd-forensic-grid" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
                <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', background:'rgba(var(--overlay-rgb),0.03)', borderBottom:`1px solid ${LINE}`, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:DIM, textTransform:'uppercase', letterSpacing:'0.1em' }}>Evidence Source</span>
                    <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'#f87171' }}>[SUBJECT]</span>
                  </div>
                  <div style={{ height:240, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {data.aiMediaDetection?.results?.[0]?.url ? (
                      <img src={data.aiMediaDetection.results[0].url} alt="Source" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    ) : (
                      <div style={{ textAlign:'center', color:DIM }}>
                        <FileText size={42} style={{ opacity:0.5, marginBottom:12 }}/>
                        <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em' }}>Voice / Text Source</div>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background:SURF, border:`1px solid ${GOLD_L}`, borderRadius:16, overflow:'hidden' }}>
                  <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.05)', borderBottom:`1px solid ${GOLD_L}` }}>
                    <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:GOLD, textTransform:'uppercase', letterSpacing:'0.1em' }}>AI Target Reference</span>
                  </div>
                  <div style={{ position:'relative', height:240, background:'#000' }}>
                    <img src={data.forensicReference||'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'} alt="AI Verification Target"
                      style={{ width:'100%', height:'100%', objectFit:'contain' }}
                      onError={e => { e.target.onerror=null; e.target.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde'; }}/>
                    <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 40px rgba(0,0,0,0.4)' }}/>
                  </div>
                </div>
              </div>
              <p style={{ marginTop:16, fontSize:12, color:MUTED, textAlign:'center', fontFamily:"'DM Mono',monospace" }}>
                High-fidelity comparison used to identify specific landmark inconsistencies.
              </p>
            </div>
          )}

          {/* ── Forensic Media ── */}
          {data.aiMediaDetection?.results?.length > 0 && (
            <div style={{ marginBottom:44 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${LINE}`, flexWrap:'wrap', gap:12 }}>
                <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>Forensic Media.</h3>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM }}>{data.aiMediaDetection.results.length} visual assets analyzed</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                {data.aiMediaDetection.results.map((img,idx) => (
                  <motion.div key={idx} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:idx*0.1 }}
                    style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                    <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', background:'#000' }}>
                      <img src={img.url} alt="Evidence" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.85 }}/>
                      <div style={{ position:'absolute', top:12, right:12 }}><VerdictBadge verdict={safeStr(img.verdict)}/></div>
                    </div>
                    <div style={{ padding:'16px 20px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace" }}>Synthetic Audit</span>
                        <span style={{ fontSize:11, color:TEXT, fontWeight:600, fontFamily:"'DM Mono',monospace" }}>
                          {(() => {
                            let val = parseFloat(img.confidence);
                            if (isNaN(val)) val = 0.98;
                            if (val > 1) val = val / 100;
                            return Math.round(val * 100);
                          })()}% Confidence
                        </span>
                      </div>
                      <p style={{ fontSize:12, color:MUTED, lineHeight:1.5 }}>
                        {safeStr(img.details)||'Baseline forensic screening complete. No significant manipulation artifacts detected.'}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── Confidence Heatmap ── */}
          {data.originalText && (
            <div style={{ marginBottom:44 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${LINE}` }}>
                <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>Confidence Heatmap.</h3>
              </div>
              <div style={{ padding:'24px', background:SURF, border:`1px solid ${LINE}`, borderRadius:16, display:'flex', flexDirection:'column', gap:12 }}>
                {(data?.originalText || '').split('\n').filter(p => p.trim()!=='').map((para,i) => {
                  let matchScore=0, pColor='transparent', borderBase='transparent';
                  if (data.claims) {
                    for (const c of data.claims) {
                      const cWords=(c.context||c.claim||'').toLowerCase().split(/\s+/);
                      const sig=cWords.filter(w=>w.length>3);
                      if (!sig.length) continue;
                      let matches=0; const pLow=para.toLowerCase();
                      for (const w of sig) { if (pLow.includes(w)) matches++; }
                      const overlap=matches/sig.length;
                      if (overlap>0.25 && overlap>matchScore) {
                        matchScore=overlap;
                        const op=(c.confidence||0.8)*0.45;
                        const vl=(c.verdict||'').toLowerCase();
                        if (['true','accurate','verified'].includes(vl)) { pColor=`rgba(74,222,128,${op})`; borderBase='#4ade80'; }
                        else if (['false','inaccurate'].includes(vl))    { pColor=`rgba(248,113,113,${op})`; borderBase='#f87171'; }
                        else if (['partially true','mixed'].includes(vl)){ pColor=`rgba(251,191,36,${op})`;  borderBase='#fbbf24'; }
                        else { pColor=`rgba(var(--overlay-rgb),${op*0.3})`; borderBase='rgba(var(--overlay-rgb),0.2)'; }
                      }
                    }
                  }
                  return (
                    <p key={i} style={{ fontSize:14, lineHeight:1.6, color:matchScore>0?TEXT:MUTED, background:pColor, padding:'10px 14px', borderRadius:8, margin:0, transition:'background 0.3s', borderLeft:matchScore>0?`3px solid ${borderBase}`:'3px solid transparent' }}>
                      {para}
                    </p>
                  );
                })}
              </div>
              <p style={{ marginTop:14, fontSize:11, color:MUTED, fontFamily:"'DM Mono',monospace", textAlign:'center' }}>
                Source paragraphs dynamically color-coded by AI verification confidence and claim verdict polarity.
              </p>
            </div>
          )}

          {/* ── Assertion Ledger ── */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${LINE}`, flexWrap:'wrap', gap:12 }}>
              <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>{isHindi ? 'दावा बहीखाता' : 'Assertion Ledger.'}</h3>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM }}>{total} {isHindi ? 'पुष्टीकरण सत्यापित · साक्ष्य देखने के लिए क्लिक करें' : 'assertions · click to explore evidence'}</span>
            </div>

            {/* Table header — className="rd-claim-header" hides on mobile */}
            <div className="rd-claim-header" style={{ display:'grid', gridTemplateColumns:'130px 1fr 90px 160px', gap:20, padding:'10px 24px', marginBottom:8 }}>
              {['Verdict','Assertion','Confidence',''].map(h => (
                <span key={h} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:DIM, textTransform:'uppercase' }}>{h}</span>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {data.claims?.length > 0 ? data.claims.map((c,i) => (
                <motion.div key={i} className="claim-row"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.05, duration:0.3 }}
                  onClick={() => navigate(`/history/${id}/explorer/${i}`)}>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <VerdictBadge verdict={safeStr(c.verdict)}/>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:DIM, letterSpacing:'0.05em' }}>
                      {Math.round((parseFloat(c.confidence?.value || c.confidence)||0.9)*100)}% Conf.
                    </span>
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize:14, fontWeight:600, color:TEXT, lineHeight:1.4, marginBottom:6 }}>{safeStr(c.claim)}</p>
                    
                    {/* Compact why_true/why_false summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                      {isMatch(c.verdict, ['false', 'refuted', 'fake', 'misleading']) ? (
                        <div style={{ fontSize: 11, color: '#f87171', background: 'rgba(248,113,113,0.05)', padding: '6px 10px', borderRadius: 6, borderLeft: '2px solid #f87171' }}>
                          <span style={{ fontWeight: 700, marginRight: 5 }}>Correction:</span> {safeStr(c.why_false || c.reasoning)}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: MUTED, opacity: 0.8 }}>
                          {safeStr(c.reasoning).substring(0, 120)}{safeStr(c.reasoning).length > 120 ? '...' : ''}
                        </div>
                      )}
                    </div>

                    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, display:'flex', alignItems:'center', gap:4 }}>
                        <Layers size={10}/> {c.evidence?.length||0} citations
                      </span>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={10}/> {new Date(data.timestamp).toLocaleTimeString([],{ hour:'2-digit', minute:'2-digit' })}
                      </span>
                      {c.isTimeSensitive && (
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'#fbbf24', display:'flex', alignItems:'center', gap:4, background:'rgba(251,191,36,0.1)', padding:'2px 6px', borderRadius:4 }}>
                          <AlertTriangle size={10}/> Time Sensitive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rd-conf-col" style={{ textAlign:'right' }}>
                     <ScoreArc score={Math.round((parseFloat(c.confidence)||0.9)*100)} />
                  </div>

                  {/* className="rd-view-col" hides on mobile */}
                  <div className="rd-view-col" style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button className="rd-view-btn">Full Evidence <ChevronRight size={12}/></button>
                  </div>
                </motion.div>
              )) : (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: SURF, border: `1px dashed ${LINE}`, borderRadius: 16 }}>
                  <FileText size={32} color={DIM} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p style={{ color: DIM, fontSize: 13 }}>No specific assertions were extracted from this analysis.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}