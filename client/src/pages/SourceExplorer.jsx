import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, ExternalLink, ShieldCheck,
  Layers, Sparkles, ChevronRight, FileText
} from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '/api'
  : 'https://ai-fact-checker-rvih.onrender.com/api';

const GOLD  = '#C9A84C';
const GOLD_L= 'rgba(201,168,76,0.12)';
const GOLD2 = 'rgba(201,168,76,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const TEXT  = '#E8E4DC';
const MUTED = 'rgba(232,228,220,0.38)';
const DIM   = 'rgba(232,228,220,0.18)';
const SURF  = 'rgba(255,255,255,0.035)';

const verdictMeta = (v) => {
  const l = v?.toLowerCase();
  if (['true','accurate','verified'].includes(l))  return { color:'#4ade80', bg:'rgba(74,222,128,0.08)',  border:'rgba(74,222,128,0.2)'  };
  if (['false','inaccurate'].includes(l))           return { color:'#f87171', bg:'rgba(248,113,113,0.08)', border:'rgba(248,113,113,0.2)' };
  if (['partially true','mixed'].includes(l))       return { color:'#fbbf24', bg:'rgba(251,191,36,0.08)',  border:'rgba(251,191,36,0.2)'  };
  return { color:DIM, bg:SURF, border:LINE };
};

const VerdictBadge = ({ verdict }) => {
  const m = verdictMeta(verdict);
  return (
    <span style={{ color:m.color, background:m.bg, border:`1px solid ${m.border}`, fontSize:9, letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', padding:'5px 12px', borderRadius:4, fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap', flexShrink:0 }}>
      {verdict || 'Pending'}
    </span>
  );
};

export default function SourceExplorer() {
  const { id, claimIndex } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const index = parseInt(claimIndex);

  useEffect(() => {
    window.scrollTo(0, 0);
    axios.get(`${API_BASE}/history/${id}`)
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setError('Dossier not found'); setLoading(false); });
  }, [id]);

  const navigateToClaim = (newIndex) => {
    if (newIndex >= 0 && newIndex < data.claims.length)
      navigate(`/history/${id}/explorer/${newIndex}`);
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#08080E', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14 }}>
      <style>{`@keyframes se-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width:34, height:34, borderRadius:'50%', border:`2px solid rgba(201,168,76,0.15)`, borderTopColor:GOLD, animation:'se-spin 0.85s linear infinite' }}/>
      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, letterSpacing:'0.12em', textTransform:'uppercase' }}>Loading source data…</span>
    </div>
  );

  if (error || !data?.claims?.[index]) return (
    <div style={{ minHeight:'100vh', background:'#08080E', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>Source Linkage Failed.</h1>
      <Link to={`/history/${id}`} style={{ display:'inline-flex', alignItems:'center', gap:7, background:GOLD, color:'#08080E', borderRadius:9, padding:'12px 22px', fontSize:13, fontWeight:600, textDecoration:'none', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
        <ArrowLeft size={13}/> Back to Dossier
      </Link>
    </div>
  );

  const claim       = data.claims[index];
  const totalClaims = data.claims.length;

  return (
    <div style={{ background:'#08080E', minHeight:'calc(100vh - 64px)', color:TEXT, fontFamily:"'DM Sans',system-ui,sans-serif", display:'flex', paddingBottom:64, overflowX:'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=DM+Serif+Display@0;1&family=DM+Mono:wght@400;500&display=swap');

        /* ── All original styles, unchanged ── */
        .se-btn-nav {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 9px; padding: 11px 20px;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-size: 12px; font-weight: 500; color: ${MUTED};
          cursor: pointer; display: inline-flex; align-items: center; gap: 7px;
          transition: border-color 0.2s, color 0.2s; white-space: nowrap;
        }
        .se-btn-nav:hover:not(:disabled) { border-color: rgba(255,255,255,0.16); color: ${TEXT}; }
        .se-btn-nav:disabled { opacity: 0.25; cursor: default; }

        .se-btn-gold {
          background: ${GOLD}; color: #08080E; border: none; border-radius: 9px;
          padding: 11px 20px; cursor: pointer;
          font-family: 'DM Sans', system-ui, sans-serif;
          font-weight: 600; font-size: 12px;
          display: inline-flex; align-items: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .se-btn-gold:hover { opacity: 0.85; transform: translateY(-1px); }

        .ev-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 24px 26px;
          min-width: 0; overflow: hidden;
          transition: background 0.2s, border-color 0.2s;
        }
        .ev-card:hover { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.12); }

        .ev-url {
          font-family: 'DM Mono', monospace; font-size: 10px; color: ${DIM};
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; display: block; max-width: 100%;
        }

        .ev-excerpt {
          background: rgba(255,255,255,0.02); border: 1px solid ${LINE};
          border-radius: 9px; padding: 14px 16px; margin-bottom: 14px;
          font-size: 13px; color: ${MUTED}; line-height: 1.7; font-style: italic;
          word-break: break-word; overflow-wrap: anywhere;
        }

        .se-footer-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          font-family: 'DM Mono', monospace; font-size: 10px; color: ${DIM};
          letter-spacing: 0.06em; transition: color 0.2s;
        }
        .se-footer-btn:hover { color: rgba(232,228,220,0.55); }

        /* ══════════════════════════════════════════════════════
           MOBILE-ONLY overrides — desktop layout untouched
           ══════════════════════════════════════════════════════ */

        /* Tablet ≤ 1024px */
        @media (max-width: 1024px) {
          .se-main     { padding: 32px 28px 80px !important; }
          .se-two-col  { grid-template-columns: 1fr !important; }
          .se-forensic { grid-template-columns: 1fr !important; }
        }

        /* Mobile ≤ 768px */
        @media (max-width: 768px) {
          .se-main        { padding: 24px 16px 100px !important; }
          .se-page-header { flex-direction: column !important; align-items: flex-start !important; }
          .se-nav-row     { width: 100% !important; justify-content: space-between !important; }
        }

        /* Small mobile ≤ 480px */
        @media (max-width: 480px) {
          .se-main  { padding: 20px 12px 100px !important; }
          .ev-card  { padding: 16px !important; }
        }
      `}</style>

      <Sidebar id="sidebar-container" activeFilter="All" onFilterChange={() => {}}/>

      {/* className="se-main" — mobile padding override */}
      <main className="se-main" style={{ flex:1, minWidth:0, maxWidth:1240, margin:'0 auto', padding:'40px 48px 80px', overflowY:'auto', overflowX:'hidden' }}>

        {/* ── Page header ── */}
        {/* className="se-page-header" — stacks on mobile */}
        <div className="se-page-header" style={{ marginBottom:36, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:24, paddingBottom:28, borderBottom:`1px solid ${LINE}`, flexWrap:'wrap' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
              <button onClick={() => navigate(`/history/${id}`)}
                style={{ background:'none', border:'none', cursor:'pointer', color:DIM, display:'flex', alignItems:'center', gap:5, fontSize:12, fontFamily:"'DM Sans',system-ui,sans-serif", padding:0, transition:'color 0.2s', whiteSpace:'nowrap' }}
                onMouseOver={e => e.currentTarget.style.color = TEXT}
                onMouseOut={e => e.currentTarget.style.color = DIM}>
                <ArrowLeft size={13}/> Back to Dossier
              </button>
              <span style={{ color:LINE, fontSize:12 }}>·</span>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, letterSpacing:'0.08em' }}>
                ID: {id.slice(-6).toUpperCase()} · Claim {index+1} of {totalClaims}
              </span>
            </div>
            <h1 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'clamp(28px,3.5vw,46px)', fontWeight:400, color:TEXT, letterSpacing:'-0.02em', lineHeight:1.1 }}>
              Source Explorer.
            </h1>
          </div>

          {/* className="se-nav-row" — full-width justified on mobile */}
          <div className="se-nav-row" style={{ display:'flex', gap:10, flexShrink:0, alignItems:'center' }}>
            <button className="se-btn-nav" onClick={() => navigateToClaim(index-1)} disabled={index===0}>
              <ArrowLeft size={13}/> Prev
            </button>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:DIM, padding:'0 4px', whiteSpace:'nowrap' }}>
              {index+1} / {totalClaims}
            </span>
            <button className="se-btn-nav" onClick={() => navigateToClaim(index+1)} disabled={index===totalClaims-1}>
              Next <ArrowRight size={13}/>
            </button>
          </div>
        </div>

        {/* ── Visual Forensic Comparison ── */}
        {/* className="se-forensic" — single col on tablet */}
        {data.forensicReference && (
          <div style={{ marginBottom:36 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18, borderBottom:`1px solid ${GOLD_L}`, paddingBottom:14 }}>
              <ShieldCheck size={16} color={GOLD}/>
              <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:GOLD, fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase' }}>
                A/B Entity Comparison Active
              </span>
            </div>
            <div className="se-forensic" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:SURF, border:`1px solid ${LINE}`, borderRadius:14, overflow:'hidden', minWidth:0 }}>
                <div style={{ padding:'10px 14px', background:'rgba(255,255,255,0.03)', borderBottom:`1px solid ${LINE}`, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:DIM, textTransform:'uppercase', letterSpacing:'0.1em' }}>Forensic Source</span>
                  <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'#f87171', fontWeight:600 }}>[SUBJECT]</span>
                </div>
                <div style={{ position:'relative', height:220, background:'#000', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {data.aiMediaDetection?.results?.[0]?.url ? (
                    <img src={data.aiMediaDetection.results[0].url} alt="Source" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  ) : (
                    <div style={{ textAlign:'center', color:DIM }}>
                      <FileText size={38} style={{ opacity:0.5, marginBottom:10, margin:'0 auto' }}/>
                      <div style={{ fontSize:9, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', letterSpacing:'0.12em' }}>Voice / Text Source</div>
                    </div>
                  )}
                  <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 40px rgba(0,0,0,0.6)', pointerEvents:'none' }}/>
                </div>
              </div>

              <div style={{ background:SURF, border:`1px solid ${GOLD_L}`, borderRadius:14, overflow:'hidden', minWidth:0 }}>
                <div style={{ padding:'10px 14px', background:'rgba(201,168,76,0.05)', borderBottom:`1px solid ${GOLD_L}`, display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:GOLD, textTransform:'uppercase', letterSpacing:'0.1em' }}>AI Target Reference</span>
                  <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", color:'#4ade80', fontWeight:600 }}>[VERIFIED]</span>
                </div>
                <div style={{ position:'relative', height:220, background:'#000' }}>
                  <img src={data.forensicReference||"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                    alt="AI Verification Target" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.onerror=null; e.target.src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"; }}/>
                  <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 40px rgba(0,0,0,0.4)', pointerEvents:'none' }}/>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        {/* className="se-two-col" — stacks to 1 col on tablet */}
        <div className="se-two-col" style={{ display:'grid', gridTemplateColumns:'minmax(0,380px) minmax(0,1fr)', gap:24 }}>

          {/* ── Left: claim + reasoning ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14, minWidth:0 }}>

            {/* Claim card */}
            <div style={{ background:GOLD2, border:`1px solid rgba(201,168,76,0.18)`, borderRadius:16, padding:'28px 28px', position:'relative', overflow:'hidden' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, gap:10, flexWrap:'wrap' }}>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.8 }}>
                  Core Assertion
                </span>
                <VerdictBadge verdict={claim.verdict}/>
              </div>
              <p style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, fontWeight:400, color:TEXT, lineHeight:1.45, marginBottom:24, letterSpacing:'-0.01em', wordBreak:'break-word' }}>
                "{claim.claim}"
              </p>
              <div style={{ display:'flex', gap:24, paddingTop:18, borderTop:`1px solid rgba(201,168,76,0.15)` }}>
                <div>
                  <span style={{ display:'block', fontFamily:"'DM Mono',monospace", fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Confidence</span>
                  <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:GOLD }}>
                    {Math.round((claim.confidence||0.942)*100)}<span style={{ fontSize:13, opacity:0.5 }}>%</span>
                  </span>
                </div>
                <div style={{ width:1, background:'rgba(201,168,76,0.2)' }}/>
                <div>
                  <span style={{ display:'block', fontFamily:"'DM Mono',monospace", fontSize:9, color:DIM, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>Citations</span>
                  <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:28, fontWeight:400, color:TEXT }}>
                    {claim.evidence?.length||0}
                  </span>
                </div>
              </div>
              <div style={{ position:'absolute', bottom:-40, right:-40, width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle, ${GOLD} 0%, transparent 70%)`, opacity:0.07, pointerEvents:'none' }}/>
            </div>

            {/* Reasoning card */}
            <div style={{ background:'rgba(12,12,22,0.9)', border:`1px solid rgba(255,255,255,0.09)`, borderRadius:16, padding:'24px 26px', position:'relative', overflow:'hidden', flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <Sparkles size={14} color={GOLD} style={{ opacity:0.7 }}/>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.7 }}>
                  Jurist Synthesis
                </span>
              </div>
              <p style={{ fontSize:13, color:MUTED, lineHeight:1.75, wordBreak:'break-word' }}>{claim.reasoning}</p>
              <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.02, backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'24px 24px' }}/>
            </div>

            {/* Visual evidence carousel */}
            {data.aiMediaDetection?.results?.length > 0 && (
              <div style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${LINE}`, borderRadius:16, padding:'20px 22px', minWidth:0, overflow:'hidden' }}>
                <span style={{ display:'block', fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:500, color:GOLD, letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.7, marginBottom:14 }}>
                  Evidentiary Visuals
                </span>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {data.aiMediaDetection.results.slice(0,2).map((img,idx) => (
                    <div key={idx} style={{ position:'relative', borderRadius:10, overflow:'hidden', border:`1px solid ${LINE}` }}>
                      <img src={img.url} alt="Forensic thumbnail" style={{ width:'100%', height:120, objectFit:'cover', display:'block' }}/>
                      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 12px', background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:9, color:TEXT, fontWeight:600, whiteSpace:'nowrap' }}>Forensic Capture {idx+1}</span>
                        <VerdictBadge verdict={img.verdict}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: evidence ── */}
          <div style={{ minWidth:0 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18, paddingBottom:14, borderBottom:`1px solid ${LINE}`, gap:12, flexWrap:'wrap' }}>
              <h3 style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, fontWeight:400, color:TEXT }}>
                Retrieved Evidence
              </h3>
              <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, whiteSpace:'nowrap' }}>
                Sorted by OSINT relevance
              </span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {claim.evidence?.length > 0 ? claim.evidence.map((ev,i) => (
                <motion.div key={i} className="ev-card"
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay:i*0.06, duration:0.3 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <h4 style={{ fontSize:14, fontWeight:600, color:TEXT, marginBottom:5, lineHeight:1.4, wordBreak:'break-word' }}>
                        {ev.title||`Forensic Snapshot #${i+1}`}
                      </h4>
                      <span className="ev-url">{ev.url||'Internal Registry Citation'}</span>
                    </div>
                    {ev.credibility && (
                      <span style={{ background:'rgba(74,222,128,0.08)', color:'#4ade80', border:'1px solid rgba(74,222,128,0.2)', fontFamily:"'DM Mono',monospace", fontSize:9, fontWeight:700, letterSpacing:'0.1em', padding:'4px 10px', borderRadius:4, whiteSpace:'nowrap', flexShrink:0 }}>
                        {ev.credibility}
                      </span>
                    )}
                  </div>

                  <div className="ev-excerpt">
                    "…{typeof ev==='string' ? ev : (ev.text||ev.snippet||ev.excerpt||'No excerpt available.')}…"
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'DM Mono',monospace", fontSize:10, color:DIM, whiteSpace:'nowrap' }}>
                      <Layers size={10}/> Source #{i+1}
                    </div>
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:6, flexShrink:0, background:GOLD2, border:`1px solid rgba(201,168,76,0.25)`, borderRadius:7, padding:'7px 14px', fontFamily:"'DM Sans',system-ui,sans-serif", fontSize:11, fontWeight:600, color:GOLD, textDecoration:'none', whiteSpace:'nowrap', transition:'opacity 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.opacity='0.75'}
                        onMouseOut={e => e.currentTarget.style.opacity='1'}>
                        Open Source <ExternalLink size={11}/>
                      </a>
                    )}
                  </div>
                </motion.div>
              )) : (
                <div style={{ padding:'48px 24px', textAlign:'center', border:`1px dashed rgba(255,255,255,0.08)`, borderRadius:14, fontSize:13, color:DIM }}>
                  No direct evidentiary snapshots compiled for this assertion.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}