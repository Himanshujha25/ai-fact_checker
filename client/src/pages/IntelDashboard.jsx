import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Globe, Network, UserCheck, Search, Activity,
  AlertTriangle, Terminal, ChevronRight, Lock, Eye, Zap,
  Link2, Brain, CheckCircle, XCircle, Share2, Download,
  Cpu, Database, Radio, LayoutGrid, Layers, MousePointer2,
  Server, HardDrive, BarChart3, CloudLightning, ShieldCheck,
  Radar, Crosshair, Target, Scan, FileText, Verified, Info,
  Fingerprint, ShieldAlert, Activity as PulseIcon, RefreshCw, List, MapPin,
  Volume2, VolumeX, Mic2, Music, AudioLines
} from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../config';

const BASE = API_BASE.replace(/\/api$/, '');
const GOLD = 'var(--gold)';
const LINE = 'var(--line)';

/* ── 🎤 Neural Voice Core Component ─────────────────────── */

const VoiceOrbit = ({ isSpeaking, onToggle }) => {
  return (
    <div 
      onClick={onToggle}
      style={{ 
        cursor:'pointer', position:'relative', width:40, height:40, 
        display:'flex', alignItems:'center', justifyContent:'center',
        background: isSpeaking ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSpeaking ? GOLD : LINE}`,
        borderRadius: '50%', transition: '0.3s'
      }}
    >
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ position:'absolute', inset:0, borderRadius:'50%', background:GOLD }}
          />
        )}
      </AnimatePresence>
      {isSpeaking ? <Volume2 size={16} color={GOLD} /> : <VolumeX size={16} color="var(--text-dim)" />}
    </div>
  );
};

const AudioWave = ({ active }) => {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:12 }}>
      {[1,2,3,4,5].map(i => (
        <motion.div
          key={i}
          animate={active ? { height: [4, 12, 6, 12, 4] } : { height: 2 }}
          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
          style={{ width:2, background: GOLD, borderRadius:1 }}
        />
      ))}
    </div>
  );
};

/* ── micro-components ─────────────────────────────────────── */

const Gauge = ({ value, label }) => {
  const percent = parseInt(value) || 0;
  return (
    <div style={{ flex:1, padding:12, background:'rgba(255,255,255,0.01)', border:`1px solid ${LINE}`, borderRadius:6 }}>
      <div style={{ fontSize:7, color:'var(--text-dim)', marginBottom:8, textTransform:'uppercase', fontWeight:900 }}>{label}</div>
      <div style={{ height:4, background:LINE, borderRadius:2, overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${percent}%` }} style={{ height:'100%', background:percent > 70 ? '#4ade80' : percent > 40 ? GOLD : '#f87171' }} />
      </div>
      <div style={{ marginTop:6, fontSize:10, fontWeight:900, color:GOLD }}>{value || '--'}</div>
    </div>
  );
};

const RadarMini = ({ threats, onSelectThreat }) => {
  const canvasRef = useRef(null);
  const nodes = [
    {x:35,y:35,l:'North America', b:'NA'},
    {x:85,y:45,l:'Europe', b:'EU'},
    {x:100,y:85,l:'Asia', b:'AS'},
    {x:45,y:95,l:'Latin America', b:'LA'},
    {x:75,y:115,l:'Africa', b:'AF'}
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = (time) => {
      ctx.clearRect(0,0,240,180);
      ctx.strokeStyle = 'rgba(201,168,76,0.1)';
      ctx.beginPath(); ctx.arc(120,90,70,0,Math.PI*2); ctx.stroke();
      
      nodes.forEach(n => {
        const hasT = threats.some(t => t.region?.includes(n.b));
        ctx.fillStyle = hasT ? '#f87171' : GOLD;
        ctx.beginPath(); ctx.arc(n.x, n.y, hasT?4:1.5, 0, Math.PI*2); ctx.fill();
        if (hasT) {
           ctx.strokeStyle = 'rgba(248,113,113,0.2)';
           ctx.beginPath(); ctx.arc(n.x, n.y, 6+Math.sin(time/200)*3, 0, Math.PI*2); ctx.stroke();
        }
      });
      animationFrameId = requestAnimationFrame(render);
    };
    render(0);
    return () => cancelAnimationFrame(animationFrameId);
  }, [threats]);

  return (
    <div style={{ position:'relative', height:180 }}>
      <canvas ref={canvasRef} width={240} height={180} style={{ margin:'0 auto', display:'block' }} />
      <div style={{ position:'absolute', bottom:0, width:'100%', display:'flex', justifyContent:'center', gap:10 }}>
         {nodes.map(n => (
           <div key={n.b} onClick={()=>onSelectThreat(n.b)} style={{ fontSize:7, color:'var(--text-dim)', cursor:'pointer', border:`1px solid ${LINE}`, padding:'2px 4px', borderRadius:2 }}>{n.b}</div>
         ))}
      </div>
    </div>
  );
};

export default function IntelDashboard() {
  const [stats, setStats] = useState({ threats:0, score:76 });
  const [ticker, setTicker] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedThreat, setSelectedThreat] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState(() => {
     const saved = localStorage.getItem('sentinel_last_audit');
     return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetchPulse();
    const iv = setInterval(fetchPulse, 5000);
    return () => clearInterval(iv);
  }, []);

  const pushLog = (label, type='info') => {
    const log = { id: Math.random(), time: new Date().toLocaleTimeString(), label, type };
    setLogs(prev => [log, ...prev].slice(0, 15));
  };

  const fetchPulse = async () => {
    try {
      const r = await axios.get(`${BASE}/api/intel/pulse`);
      setStats(r.data.stats);
      setTicker(r.data.ticker);
      setLedger(r.data.ledger);
    } catch {}
  };

  const speakAdvisory = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      // Try to find a professional sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Neural')) || voices[0];
      if (preferred) utterance.voice = preferred;
      
      utterance.rate = 1.0;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const auditDomain = async () => {
    if (!urlInput.trim()) return;
    
    if (urlInput.includes('localhost') || urlInput.includes('127.0.0.1')) {
      pushLog('Forensic Block: Localhost auditing restricted.', 'error');
      const msg = 'Sentinel only audits public-facing domains. Try auditing BBC or New York Times.';
      setUrlResult({ error: msg });
      speakAdvisory(msg);
      return;
    }

    setUrlLoading(true); setUrlResult(null);
    pushLog(`Initiating Forensic Lock on ${urlInput}...`, 'warn');
    
    try {
      const url = urlInput.startsWith('http') ? urlInput : `https://${urlInput}`;
      const r = await axios.get(`${BASE}/api/intel/url/reputation`, { 
        params: { url, _t: Date.now() } 
      });
      
      if (r.data.error) throw new Error(r.data.error);

      pushLog(`Phase 1: OSINT Data Harvest complete for ${r.data.domain}.`);
      pushLog('Phase 2: AI Consensus synthesis active.');
      setUrlResult(r.data);
      localStorage.setItem('sentinel_last_audit', JSON.stringify(r.data));
      
      // Auto-summarize if advisory exists
      if (r.data.reason) {
         speakAdvisory(`Analysis complete for ${r.data.domain}. Trust index: ${r.data.trust} percent. ${r.data.reason}`);
      }

      fetchPulse();
    } catch (e) {
      pushLog('System Error: Domain footprint insufficient for audit.', 'error');
      setUrlResult({ error: e.message || 'Audit Failed' });
      speakAdvisory("Audit Failed. Intelligence footprint insufficient.");
    } finally { setUrlLoading(false); }
  };

  const statusColor = s => {
    const l = String(s || '').toLowerCase();
    if (['verified', 'legal', 'nominal', 'secure', 'active', 'success'].includes(l)) return '#4ade80';
    if (['caution', 'moderate', 'medium'].includes(l)) return '#fbbf24';
    return '#f87171';
  };

  return (
    <div style={{ background: '#050508', color: 'var(--text-main)', minHeight:'100vh', padding:24, fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        .ws-grid { display: grid; grid-template-columns: 320px 1fr 320px; gap: 24px; }
        .ws-tile { background: rgba(255,255,255,0.01); border: 1px solid var(--line); border-radius: 8px; padding: 20px; position:relative; overflow:hidden; }
        .ws-inp { width: 100%; background: #000; border: 1px solid var(--line); border-radius: 4px; padding: 14px; color: #fff; font-size: 13px; outline: none; font-family: 'DM Mono',monospace; box-sizing: border-box; }
        .ws-inp:focus { border-color: ${GOLD}; }
        .btn-action { margin-top:10px; width:100%; padding:12px; background:${GOLD}; color:#000; border:none; font-weight:900; cursor:pointer; border-radius:4px; font-family:'DM Mono',monospace; font-size:11px; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* HEADER */}
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--line)', paddingBottom:16, marginBottom:24 }}>
        <div>
           <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 10px #4ade80' }} />
              <span style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:'.3em', fontFamily:"'DM Mono',monospace" }}>TRUECAST FORENSIC // NODE_0{stats.score % 9}_ACTIVE</span>
           </div>
           <h1 style={{ fontSize:22, fontWeight:900, margin:0 }}>Sentinel Command.</h1>
        </div>
        
        <div style={{ display:'flex', gap:32, alignItems:'center' }}>
           <VoiceOrbit 
             isSpeaking={isSpeaking} 
             onToggle={() => {
               if (isSpeaking) window.speechSynthesis.cancel();
               else if (urlResult?.reason) speakAdvisory(urlResult.reason);
             }} 
           />
           <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:8, color:'var(--text-dim)' }}>SYSTEM_CONSENSUS</div>
              <div style={{ fontSize:18, fontWeight:900, color:GOLD }}>{stats.score}%</div>
           </div>
           <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:8, color:'var(--text-dim)' }}>THREATS_DETECTED</div>
              <div style={{ fontSize:18, fontWeight:900, color:'#f43f5e' }}>{stats.threats}</div>
           </div>
        </div>
      </header>

      <div className="ws-grid">
         {/* LEFT */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="ws-tile">
               <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
                  <Radar size={14} color={GOLD} />
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em' }}>TACTICAL RADAR</span>
               </div>
               <RadarMini threats={ticker} onSelectThreat={(b) => {
                  const t = ticker.find(th => th.region?.includes(b));
                  setSelectedThreat(t || { claim: 'No active threat nodes in this sector.' });
                  if (t) speakAdvisory(`Sector alert: ${t.claim}`);
               }} />
               
               {selectedThreat && (
                 <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginTop:16, padding:10, background:'rgba(244,63,94,0.05)', border:'1px solid rgba(244,63,94,0.1)', borderRadius:4 }}>
                    <div style={{ fontSize:8, color:'#f43f5e', fontWeight:900, marginBottom:4 }}>SECTOR_DATA</div>
                    <div style={{ fontSize:11, fontWeight:700 }}>{selectedThreat.claim}</div>
                 </motion.div>
               )}
            </div>

            <div className="ws-tile" style={{ flex:1 }}>
               <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
                  <Fingerprint size={14} color={GOLD} />
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em' }}>INTEGRITY LEDGER</span>
               </div>
               <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {ledger.map((l, i) => (
                    <div key={i} style={{ fontSize:8, fontFamily:"'DM Mono',monospace", color:i===0?GOLD:'var(--text-dim)', borderBottom:'1px solid var(--line)', paddingBottom:6 }}>
                       {l.id} <span style={{ opacity:0.3 }}>[{l.type}]</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* CENTER */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="ws-tile" style={{ border:`1px solid ${GOLD}20`, flex:1 }}>
               <div style={{ marginBottom:20 }}>
                  <input className="ws-inp" placeholder="Target domain target.com..." value={urlInput} onChange={e=>setUrlInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&auditDomain()} />
                  <button className="btn-action" onClick={auditDomain}>INITIATE FORENSIC HARVEST</button>
               </div>

               <AnimatePresence mode="wait">
               {urlResult ? (
                 urlResult.error ? (
                    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ padding:30, textAlign:'center', border:`1px solid #f8717140`, background:'#f8717108', borderRadius:8 }}>
                       <AlertTriangle size={32} color="#f87171" style={{ marginBottom:16 }} />
                       <div style={{ fontSize:16, fontWeight:900, color:'#f43f5e', marginBottom:10 }}>FORENSIC FAILURE</div>
                       <p style={{ fontSize:13, color:'var(--text-dim)', margin:0 }}>{urlResult.error}</p>
                    </motion.div>
                 ) : (
                    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}>
                       <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:20, background:'rgba(255,255,255,0.01)', border:'1px solid var(--line)', borderRadius:8, marginBottom:20 }}>
                          <div>
                             <div style={{ fontSize:22, fontWeight:900 }}>{urlResult.domain}</div>
                             <div style={{ fontSize:10, color:statusColor(urlResult.status), fontWeight:900 }}>{String(urlResult.status || 'UNSPECIFIED').toUpperCase()}</div>
                          </div>
                          <div style={{ textAlign:'right' }}>
                             <div style={{ fontSize:32, fontWeight:900, color:GOLD }}>{urlResult.trust}%</div>
                             <div style={{ fontSize:8, color:'var(--text-dim)' }}>TRUST_IDX</div>
                          </div>
                       </div>

                       <div style={{ display:'flex', gap:10, marginBottom:20 }}>
                          <Gauge label="Bias" value={urlResult.kpis?.bias} />
                          <Gauge label="Check" value={urlResult.kpis?.fact_check} />
                          <Gauge label="Cred" value={urlResult.kpis?.credibility} />
                       </div>

                       <div style={{ padding:20, background:'rgba(201,168,76,0.05)', border:`1px solid ${GOLD}20`, borderRadius:8 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                             <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <Brain size={14} color={GOLD} />
                                <span style={{ fontSize:10, fontWeight:900, color:GOLD }}>INTELLIGENCE CORE ADVISORY</span>
                             </div>
                             <AudioWave active={isSpeaking} />
                          </div>
                          <p style={{ fontSize:13, margin:0, lineHeight:1.6, opacity:0.9 }}>{urlResult.reason || "Institutional credibility profile successfully synthesized."}</p>
                       </div>
                    </motion.div>
                 )
               ) : (
                 <div style={{ height:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', opacity:0.1 }}>
                    {urlLoading ? <RefreshCw className="spin" size={60} /> : <Target size={100} />}
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, marginTop:24 }}>{urlLoading ? 'HARVESTING_DATA' : 'AWAITING LOCK'}</div>
                 </div>
               )}
               </AnimatePresence>
            </div>
         </div>

         {/* RIGHT */}
         <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <div className="ws-tile" style={{ height:350 }}>
               <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
                  <List size={14} color={GOLD} />
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em' }}>SENTINAL LOGS</span>
               </div>
               <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {logs.map(log => (
                    <div key={log.id} style={{ fontSize:9, fontFamily:"'DM Mono',monospace", display:'flex', gap:10 }}>
                       <span style={{ color:GOLD }}>[{log.time}]</span>
                       <span style={{ color: log.type==='warn'?'#fbbf24' : log.type==='error'?'#f87171' : 'var(--text-dim)' }}>{log.label}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="ws-tile" style={{ flex:1 }}>
               <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
                  <ShieldAlert size={14} color={GOLD} />
                  <span style={{ fontSize:10, fontWeight:900, letterSpacing:'.1em' }}>GLOBAL THREATS</span>
               </div>
               <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {ticker.slice(0, 3).map((t, i) => (
                    <div key={i} style={{ borderLeft:`2px solid ${statusColor(t.risk > 80 ? 'Hazard' : 'Caution')}`, paddingLeft:10 }}>
                       <div style={{ fontSize:10, fontWeight:900 }}>{t.type}</div>
                       <div style={{ fontSize:9, color:'var(--text-dim)' }}>{t.claim?.substring(0, 50)}...</div>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
