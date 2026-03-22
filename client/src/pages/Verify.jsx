import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel, Link as LinkIcon, FileText, Upload, ShieldCheck,
  ChevronRight, Clock, Activity, Search, Mic, MicOff,
  Sparkles, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AnalysisProcessing from '../components/AnalysisProcessing';
import confetti from 'canvas-confetti';

const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '/api'
    : 'https://ai-fact-checker-rvih.onrender.com/api';

/* ─── Tokens ──────────────────────────────────────────────────── */
const GOLD   = '#C9A84C';
const GOLD_L = 'rgba(201,168,76,0.12)';
const LINE   = 'rgba(255,255,255,0.07)';
const SURF   = 'rgba(255,255,255,0.04)';
const TEXT   = '#E8E4DC';
const MUTED  = 'rgba(232,228,220,0.42)';
const DIM    = 'rgba(232,228,220,0.22)';
const MIC_C  = '#EC4899';

/* ─── Verdict badge ───────────────────────────────────────────── */
const verdictStyle = v => {
  const l = v?.toLowerCase();
  if (['true','accurate','verified'].includes(l))  return { color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.22)' };
  if (['false','inaccurate'].includes(l))           return { color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.22)' };
  if (['partially true','mixed'].includes(l))       return { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.22)' };
  return { color: DIM, bg: SURF, border: LINE };
};

const VerdictBadge = ({ verdict }) => {
  const s = verdictStyle(verdict);
  return (
    <span style={{ color:s.color, background:s.bg, border:`1px solid ${s.border}`, fontSize:9, letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', padding:'4px 10px', borderRadius:4, whiteSpace:'nowrap', fontFamily:'DM Mono,monospace' }}>
      {verdict || 'Pending'}
    </span>
  );
};

/* ─── Score arc ───────────────────────────────────────────────── */
const ScoreArc = ({ score }) => {
  const r = 50, circ = 2 * Math.PI * r;
  const dash = (Math.min(100, score) / 100) * circ;
  const color = score >= 70 ? GOLD : score >= 40 ? '#fbbf24' : '#f87171';
  return (
    <svg viewBox="0 0 112 112" width="112" height="112" style={{ transform:'rotate(-90deg)' }}>
      <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx="56" cy="56" r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function Verify() {
  const [url,            setUrl]            = useState('');
  const [text,           setText]           = useState('');
  const [loading,        setLoading]        = useState(false);
  const [results,        setResults]        = useState(null);
  const [error,          setError]          = useState(null);
  const [step,           setStep]           = useState(0);
  const [logs,           setLogs]           = useState([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [recentDossiers, setRecentDossiers] = useState([]);
  const [activeFilter,   setActiveFilter]   = useState('All');
  const [mode,           setMode]           = useState('normal');
  const [listening,      setListening]      = useState(false);
  const [voiceReady,     setVoiceReady]     = useState(false);
  const [interim,        setInterim]        = useState('');

  const recRef     = useRef(null);
  const abortRef   = useRef(null);
  const navigate   = useNavigate();

  /* ── Voice ── */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) setVoiceReady(true);
  }, []);

  const toggleVoice = useCallback(() => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      setInterim('');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += t; else tmp += t;
      }
      setInterim(tmp);

      if (fin) {
        const lowerFinal = fin.toLowerCase();
        const triggers = ['analyze', 'analyse', 'verify', 'run verification', 'audit now', 'start audit'];
        const foundTrigger = triggers.find(t => lowerFinal.includes(t));

        if (foundTrigger) {
          const content = fin.trim();
          const triggerIdx = content.toLowerCase().indexOf(foundTrigger);
          const prefix = content.substring(0, triggerIdx).trim();
          if (prefix) setText(p => p ? `${p.trimEnd()} ${prefix}` : prefix);
          
          setInterim('');
          rec.stop();
          setListening(false);
          setTimeout(() => {
             const btn = document.getElementById('vfy-run-btn');
             if (btn && !btn.disabled) btn.click();
          }, 400); 
        } else {
          setText(p => p ? `${p.trimEnd()} ${fin.trim()}` : fin.trim());
          setInterim('');
        }
      }
    };

    rec.onerror = () => { setListening(false); setInterim(''); };
    rec.onend = () => { setListening(false); setInterim(''); };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch (err) {
      console.error('SR Start failed:', err);
    }
  }, [listening]);

  /* ── History ── */
  useEffect(() => {
    axios.get(`${API_BASE}/history?limit=10`).then(r => setRecentDossiers(r.data)).catch(() => {});
  }, []);

  const filteredDossiers = (activeFilter === 'All' ? recentDossiers : recentDossiers.filter(d => {
    const v = (d.topClaims?.[0]?.verdict || d.claims?.[0]?.verdict || '').toLowerCase();
    if (activeFilter === 'Verified')     return ['true','accurate','verified'].includes(v);
    if (activeFilter === 'Refuted')      return ['false','inaccurate'].includes(v);
    if (activeFilter === 'Inconclusive') return ['partially true','mixed','inconclusive'].includes(v);
    return true;
  })).slice(0, 3);

  /* ── Run analysis ── */
  const handleVerify = useCallback(async () => {
    const input = url.trim() || text.trim();
    if (!input) return;
    if (listening) { recRef.current?.stop(); setListening(false); setInterim(''); }

    setLoading(true); setResults(null); setError(null);
    setStep(1); setElapsed(0);
    setLogs([{ msg: 'Initializing analysis pipeline…', id: Date.now() }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const payload = url.trim() ? { url: url.trim(), mode } : { text: text.trim(), mode };
      const thoughts = [
        'Deconstructing source narrative…','Extracting verifiable assertions…',
        'Cross-referencing fact indices…', 'Querying live OSINT streams…',
        'Semantic integrity analysis…',    'Consensus aggregation — 3 agents…',
        'Validating academic provenance…', 'Assembling forensic dossier…',
      ];
      const clock   = setInterval(() => setElapsed(e => e + 1), 1000);
      const stepper = setInterval(() => setStep(s => Math.min(s + 1, 3)), 4000);
      const logger  = setInterval(() => setLogs(l => [...l.slice(-8), { msg: thoughts[Math.floor(Math.random() * thoughts.length)], id: Date.now() }]), 2000);
      
      const res = await axios.post(`${API_BASE}/verify`, payload, { signal: controller.signal });
      
      [clock, stepper, logger].forEach(clearInterval);
      setStep(4); setResults(res.data); setLoading(false);
      if (res.data.truthScore >= 80) confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 }, colors: [GOLD, '#fff'] });
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError('Analysis interrupted or connection lost.');
      }
      setStep(0); setLoading(false);
    }
  }, [url, text, mode, listening]);

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      setLoading(false);
      setStep(0);
      setLogs([]);
    }
  };

  const canRun = !!(url.trim() || text.trim() || interim.trim());

  const MODES = [
    { id:'normal', label:'Standard',      sub:'Fast consensus',         icon:Activity  },
    { id:'deep',   label:'Deep Research', sub:'Exhaustive OSINT',       icon:Search    },
    { id:'pro',    label:'Pro Forensic',  sub:'Multi-agent academic',   icon:ShieldCheck },
  ];

  /* ────────────────────────────── render ────────────────────────── */
  return (
    <div style={{ minHeight:'calc(100vh - 60px)', background:'#08080E', color:TEXT, fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', paddingBottom:64 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        /* ── inputs ── */
        .vf-input {
          width:100%; box-sizing:border-box;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.09);
          border-radius:10px; color:${TEXT};
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:14px; outline:none;
          transition:border-color .2s,background .2s,box-shadow .2s;
        }
        .vf-input::placeholder { color:${DIM}; }
        .vf-input:focus {
          border-color:rgba(201,168,76,.5);
          background:rgba(201,168,76,.035);
          box-shadow:0 0 0 3px rgba(201,168,76,.08);
        }
        .vf-url  { padding:13px 16px 13px 42px; }
        .vf-area { padding:16px 52px 16px 16px; resize:none; min-height:200px; line-height:1.75; }

        /* ── primary CTA ── */
        .vf-run {
          background:${GOLD}; color:#08080E; border:none; border-radius:9px;
          padding:13px 28px; font-family:'DM Sans',system-ui,sans-serif;
          font-weight:600; font-size:14px; cursor:pointer;
          display:inline-flex; align-items:center; gap:8px;
          box-shadow:0 4px 20px rgba(201,168,76,.28);
          transition:opacity .18s,transform .15s,box-shadow .18s;
        }
        .vf-run:hover:not(:disabled) { opacity:.88; transform:translateY(-1px); box-shadow:0 6px 28px rgba(201,168,76,.42); }
        .vf-run:active:not(:disabled){ transform:none; }
        .vf-run:disabled { opacity:.28; cursor:default; box-shadow:none; }

        /* ── ghost button ── */
        .vf-ghost {
          background:rgba(255,255,255,0.04); color:${MUTED};
          border:1px solid rgba(255,255,255,0.09); border-radius:9px;
          padding:13px 20px; font-family:'DM Sans',system-ui,sans-serif;
          font-weight:500; font-size:14px; cursor:pointer;
          display:inline-flex; align-items:center; gap:7px;
          transition:border-color .2s,color .2s;
        }
        .vf-ghost:hover { border-color:rgba(255,255,255,.16); color:${TEXT}; }

        /* ── mic ── */
        .vf-mic {
          position:absolute; bottom:12px; right:12px;
          width:34px; height:34px; border-radius:50%; border:none;
          background:rgba(255,255,255,0.06);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; transition:background .2s,box-shadow .2s;
          flex-shrink:0;
        }
        .vf-mic:hover { background:rgba(236,72,153,.14); }
        .vf-mic.on {
          background:rgba(236,72,153,.15);
          box-shadow:0 0 0 3px rgba(236,72,153,.15), 0 0 18px rgba(236,72,153,.25);
          animation:mic-pulse 1.5s ease-in-out infinite;
        }
        @keyframes mic-pulse {
          0%,100%{ box-shadow:0 0 0 3px rgba(236,72,153,.15),0 0 18px rgba(236,72,153,.25); }
          50%    { box-shadow:0 0 0 6px rgba(236,72,153,.07),0 0 26px rgba(236,72,153,.35); }
        }

        /* ── mode cards ── */
        .vf-mode {
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);
          border-radius:11px; padding:15px 16px; cursor:pointer;
          display:flex; align-items:center; gap:12px; text-align:left;
          transition:border-color .2s,background .2s;
        }
        .vf-mode:hover:not(.on){ border-color:rgba(255,255,255,.14); }
        .vf-mode.on { border-color:rgba(201,168,76,.5); background:rgba(201,168,76,.07); }

        /* ── dossier rows ── */
        .vf-dos {
          padding:13px 15px; border-radius:10px;
          border:1px solid rgba(255,255,255,0.06);
          background:rgba(255,255,255,0.02);
          cursor:pointer; display:flex; gap:10px; align-items:flex-start;
          transition:border-color .18s,background .18s;
        }
        .vf-dos:hover { border-color:rgba(255,255,255,.13); background:rgba(255,255,255,.04); }

        /* ── claim rows ── */
        .vf-claim {
          padding:20px 24px; border-bottom:1px solid rgba(255,255,255,.05);
          display:grid; grid-template-columns:130px 1fr 76px;
          gap:18px; align-items:start; transition:background .15s;
        }
        .vf-claim:last-child { border-bottom:none; }
        .vf-claim:hover { background:rgba(255,255,255,.02); }

        /* ── filter tabs ── */
        .vf-tab {
          background:none; border:none; cursor:pointer;
          font-family:'DM Sans',system-ui,sans-serif;
          font-size:11px; font-weight:500; padding:4px 10px;
          border-radius:1000px; color:${DIM}; transition:background .18s,color .18s;
        }
        .vf-tab.on { background:rgba(201,168,76,.13); color:${GOLD}; }
        .vf-tab:hover:not(.on){ color:${MUTED}; }
        
        .vf-transcript {
          position: absolute; bottom: 55px; left: 16px; right: 55px;
          background: rgba(8,8,14,0.95); border: 1px solid ${GOLD_L};
          border-radius: 8px; padding: 12px 14px;
          font-family: 'DM Mono', monospace; font-size: 11px; color: ${GOLD};
          box-shadow: 0 4px 25px rgba(0,0,0,0.4);
          z-index: 10; pointer-events: none;
          display: flex; gap: 10px; align-items: flex-start;
        }

        /* ── misc ── */
        .vf-chip { display:flex; align-items:center; gap:4px; font-size:10px; color:${DIM}; font-family:'DM Mono',monospace; }
        .vf-link { background:none; border:none; cursor:pointer; font-family:'DM Sans',system-ui,sans-serif; font-size:11px; color:${DIM}; text-decoration:underline; text-decoration-color:transparent; transition:color .2s,text-decoration-color .2s; padding:0; }
        .vf-link:hover { color:${GOLD}; text-decoration-color:${GOLD}; }
        .ft-btn { background:none; border:none; cursor:pointer; font-size:11px; color:${DIM}; padding:0; transition:color .2s; font-family:'DM Sans',system-ui,sans-serif; }
        .ft-btn:hover { color:${MUTED}; }
        
        /* ── voice waveform ── */
        @keyframes vwave { 0%,100%{height:3px} 50%{height:13px} }
        .vf-wave span { display:inline-block; width:3px; border-radius:3px; background:${MIC_C}; margin:0 1.5px; animation:vwave .75s ease-in-out infinite; }
        .vf-wave span:nth-child(2){ animation-delay:.1s }
        .vf-wave span:nth-child(3){ animation-delay:.2s }
        .vf-wave span:nth-child(4){ animation-delay:.12s }
        .vf-wave span:nth-child(5){ animation-delay:.05s }
      `}</style>

      <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      <main style={{ flex:1, maxWidth:1080, margin:'0 auto', padding:'0 44px', width:'100%', overflowY:'auto' }}>
        <AnimatePresence mode="wait">

          {/* ═══ WORKBENCH ═══ */}
          {!loading && !results && (
            <motion.div key="wb"
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }} transition={{ duration:.35, ease:[.4,0,.2,1] }}
              style={{ paddingTop:6, paddingBottom:40 }}
            >
              <header style={{ marginBottom:1 }}>
                <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(34px,4vw,54px)', fontWeight:400, color:TEXT, lineHeight:1.1, letterSpacing:'-0.022em', marginBottom:12 }}>
                  Initiate an Audit.
                </h1>
                <p style={{ fontSize:17, color:MUTED, lineHeight:1.7, maxWidth:650 }}>
                  Cross-examine claims against verified archival data and live intelligence sources.
                </p>
              </header>

              <div style={{ marginBottom:32 }}>
                <p style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:10 }}>Analysis depth</p>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {MODES.map(m => (
                    <button key={m.id} onClick={() => setMode(m.id)} className={`vf-mode ${mode===m.id?'on':''}`}>
                      <div style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:mode===m.id ? GOLD_L : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <m.icon size={14} color={mode===m.id ? GOLD : DIM} />
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:mode===m.id ? TEXT : MUTED, marginBottom:2 }}>{m.label}</div>
                        <div style={{ fontSize:11, color:DIM }}>{m.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 276px', gap:24 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div>
                    <label style={{ display:'block', fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8 }}>
                      Source URL
                    </label>
                    <div style={{ position:'relative' }}>
                      <LinkIcon size={14} color={DIM} style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                      <input type="text" value={url} onChange={e=>setUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        className="vf-input vf-url" />
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ flex:1, height:1, background:LINE }} />
                    <span style={{ fontSize:11, color:DIM }}>or paste text</span>
                    <div style={{ flex:1, height:1, background:LINE }} />
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <label style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.12em' }}>
                        Claim or article text
                      </label>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        {listening && (
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <div className="vf-wave"><span/><span/><span/><span/><span/></div>
                            <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:MIC_C }}>Listening…</span>
                          </div>
                        )}
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:DIM }}>
                          {(text + interim).length}/8,000
                        </span>
                      </div>
                    </div>

                    <div style={{ position:'relative' }}>
                      <textarea
                        value={text + (interim ? (text ? ' ' : '') + interim : '')}
                        onChange={e => { if (!listening) setText(e.target.value); }}
                        readOnly={listening}
                        maxLength={8000}
                        placeholder={voiceReady
                          ? 'Type or paste text here. Click the mic to speak — say "analyze" to run automatically…'
                          : 'Paste the claim or article for comprehensive cross-examination…'
                        }
                        className="vf-input vf-area"
                      />
                      
                      {listening && interim && (
                        <div className="vf-transcript">
                          <span style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>[LIVE TRANSCRIPT]</span>
                          <span style={{ lineHeight: 1.4 }}>{interim}</span>
                        </div>
                      )}
                      
                      {voiceReady && (
                        <button onClick={toggleVoice} className={`vf-mic ${listening?'on':''}`}
                          title={listening ? 'Stop recording' : 'Start voice input'}>
                          {listening ? <MicOff size={14} color={MIC_C}/> : <Mic size={14} color={DIM}/>}
                        </button>
                      )}
                    </div>

                    {voiceReady && (
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:8 }}>
                        <Zap size={11} color={DIM} />
                        <span style={{ fontSize:11, color:DIM }}>
                          {listening
                            ? <>Say <strong style={{ color:MIC_C }}>"analyze"</strong> to trigger verification hands-free</>
                            : <>Click mic to dictate · say <strong style={{ color:GOLD }}>"analyze"</strong> to run automatically</>
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:10, paddingTop:4 }}>
                    <button id="vfy-run-btn" className="vf-run" onClick={handleVerify} disabled={!canRun}>
                      <Gavel size={15} /> Run Verification
                    </button>
                    <button className="vf-ghost">
                      <Upload size={13} /> Import File
                    </button>
                    {error && <span style={{ fontSize:12, color:'#f87171', marginLeft:4 }}>{error}</span>}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:12, padding:'18px 18px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${LINE}` }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase' }}>Engine</span>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:'#4ade80', fontWeight:500 }}>● Operational</span>
                    </div>
                    {[['Neural Engine','v4.2'],['Fact Index','4m ago'],['Latency','24 ms']].map(([k,v],i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:i<2?10:0 }}>
                        <span style={{ fontSize:12, color:MUTED }}>{k}</span>
                        <span style={{ fontFamily:'DM Mono,monospace', fontSize:11, color:DIM }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:9, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase' }}>Recent</span>
                      <div style={{ display:'flex', gap:2 }}>
                        {['All','Verified','Refuted'].map(f => (
                          <button key={f} onClick={() => setActiveFilter(f)} className={`vf-tab ${activeFilter===f?'on':''}`}>{f}</button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                      {filteredDossiers.map((h, i) => {
                        const v = h.topClaims?.[0]?.verdict || h.claims?.[0]?.verdict || '';
                        return (
                          <div key={i} className="vf-dos" onClick={() => navigate(`/history/${h.id}`)}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ marginBottom:5 }}><VerdictBadge verdict={v} /></div>
                              <p style={{ fontSize:12, color:MUTED, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:5 }}>
                                {h.input || 'Redacted'}
                              </p>
                              <div style={{ display:'flex', gap:10 }}>
                                <span className="vf-chip"><FileText size={9}/> {h.claims?.length||0} claims</span>
                                <span className="vf-chip"><ShieldCheck size={9}/> {Math.round(h.truthScore)}%</span>
                                <span className="vf-chip"><Clock size={9}/> {new Date(h.timestamp).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <ChevronRight size={12} color={DIM} style={{ flexShrink:0, marginTop:3 }} />
                          </div>
                        );
                      })}
                      {filteredDossiers.length === 0 && (
                        <div style={{ padding:'20px 12px', textAlign:'center', border:'1px dashed rgba(255,255,255,.07)', borderRadius:10, fontSize:12, color:DIM }}>
                          No {activeFilter==='All' ? '' : activeFilter.toLowerCase()} dossiers yet.
                        </div>
                      )}
                    </div>
                    <button className="vf-link" onClick={() => navigate('/history')} style={{ marginTop:10, display:'block' }}>
                      View full history →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {loading && (
            <motion.div key="load" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ width:'100%' }}>
              <AnalysisProcessing 
                elapsed={elapsed} 
                step={step} 
                logs={logs} 
                inputTitle={url || text.substring(0,100)} 
                onCancel={handleCancel}
              />
            </motion.div>
          )}

          {results && !loading && (
            <motion.div key="res"
              initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:.38, ease:[.4,0,.2,1] }}
              style={{ paddingTop:48, paddingBottom:80 }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:40, padding:'32px 36px', background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:16, marginBottom:36 }}>
                <div style={{ position:'relative', width:112, height:112, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ScoreArc score={results.truthScore} />
                  <div style={{ position:'absolute', display:'flex', flexDirection:'column', alignItems:'center' }}>
                    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT, lineHeight:1 }}>{Math.round(results.truthScore)}</span>
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:8, color:GOLD, letterSpacing:'0.08em' }}>/100</span>
                  </div>
                </div>

                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <Sparkles size={13} color={GOLD} />
                    <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:GOLD, letterSpacing:'0.12em', textTransform:'uppercase' }}>Forensic Summary</span>
                  </div>
                  <h2 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:30, fontWeight:400, color:TEXT, letterSpacing:'-0.018em', marginBottom:8, lineHeight:1.15 }}>
                    Audit Complete.
                  </h2>
                  <p style={{ fontSize:14, color:MUTED, lineHeight:1.65 }}>
                    Confidence index of <strong style={{ color:TEXT }}>{Math.round(results.truthScore)}%</strong> derived from {results.claims?.length} verified assertions.
                  </p>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                  <button className="vf-run" onClick={() => navigate(`/history/${results.reportId}`)} style={{ justifyContent:'center' }}>
                    Open Dossier <ChevronRight size={14}/>
                  </button>
                  <button className="vf-link" style={{ textAlign:'center' }}
                    onClick={() => { setResults(null); setUrl(''); setText(''); }}>
                    Start new audit
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:24, fontWeight:400, color:TEXT, letterSpacing:'-0.01em' }}>
                  Verified Assertions
                </h3>
                <span style={{ fontFamily:'DM Mono,monospace', fontSize:10, color:DIM }}>{results.claims?.length} claims reviewed</span>
              </div>

              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'130px 1fr 76px', gap:18, padding:'10px 24px', borderBottom:`1px solid ${LINE}`, background:'rgba(255,255,255,0.025)' }}>
                  {['Verdict','Assertion & Reasoning','Confidence'].map(h => (
                    <span key={h} style={{ fontFamily:'DM Mono,monospace', fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:DIM, textTransform:'uppercase' }}>{h}</span>
                  ))}
                </div>
                {results.claims?.map((c, i) => (
                  <motion.div key={i} className="vf-claim"
                    initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay:i * .05, duration:.28 }}>
                    <div style={{ paddingTop:2 }}><VerdictBadge verdict={c.verdict} /></div>
                    <div>
                      <p style={{ fontSize:14, fontWeight:500, color:TEXT, lineHeight:1.55, marginBottom:5 }}>{c.claim}</p>
                      <p style={{ fontSize:12, color:DIM, lineHeight:1.55 }}>{c.reasoning}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:18, fontWeight:500, color:Math.round((c.confidence||0)*100) >= 70 ? GOLD : DIM }}>
                        {Math.round((c.confidence||0)*100)}<span style={{ fontSize:10, opacity:.5 }}>%</span>
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}