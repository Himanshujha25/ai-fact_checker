import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShieldAlert, Network, Terminal as TermIcon, Activity } from 'lucide-react';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const REGION_MAP = {
  'NA Node': { x: 25, y: 35 },
  'LATAM': { x: 35, y: 70 },
  'EU Core': { x: 55, y: 30 },
  'Global Network': { x: 50, y: 50 },
  'APac Region': { x: 75, y: 40 },
  'North America': { x: 25, y: 35 },
  'Europe': { x: 55, y: 30 },
  'South Asia': { x: 70, y: 50 }
};

export default function Radar() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assetsAudited, setAssetsAudited] = useState(14820935);
  const [hoveredTrend, setHoveredTrend] = useState(null);
  const [sysLogs, setSysLogs] = useState([]);

  const canvasRef = useRef(null);

  const fetchTrends = () => {
    fetch(`${API_BASE}/radar/trends`)
      .then(res => res.json())
      .then(data => {
        setTrends(data.slice(0, 8)); // Top 8 active
        setLoading(false);
      })
      .catch(err => console.error("Radar Error:", err));
  };

  useEffect(() => {
    fetchTrends();
    const pollTimer = setInterval(fetchTrends, 8000);
    const auditTimer = setInterval(() => {
      setAssetsAudited(prev => prev + Math.floor(Math.random() * 24));
    }, 800);

    // Terminal log simulator
    const logInterval = setInterval(() => {
      const logs = [
        "Analyzing node tensor delta...",
        "Querying huggingface forensic signature...",
        "Resolving domain registrar metadata...",
        "Intercepting Sybil bot network traffic...",
        "Dumping hex trace for anomalous image data...",
        "Cross-referencing OSINT consensus ledger..."
      ];
      setSysLogs(prev => [
        ...prev.slice(-4),
        { id: Date.now(), text: `[${new Date().toISOString().split('T')[1].substring(0, 8)}] ${logs[Math.floor(Math.random() * logs.length)]}` }
      ]);
    }, 2500);

    return () => {
      clearInterval(pollTimer);
      clearInterval(auditTimer);
      clearInterval(logInterval);
    };
  }, []);

  // Cyber map connection lines drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || trends.length === 0) return;
    const ctx = canvas.getContext('2d');
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      // Draw faint grid map
      ctx.strokeStyle = 'rgba(201,168,76,0.05)';
      ctx.lineWidth = 1;
      for(let i=0; i<w; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,h); ctx.stroke(); }
      for(let j=0; j<h; j+=40) { ctx.beginPath(); ctx.moveTo(0,j); ctx.lineTo(w,j); ctx.stroke(); }

      // Draw interconnects between nodes
      ctx.strokeStyle = 'rgba(248,113,113,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      trends.forEach((t1, i) => {
        const p1 = REGION_MAP[t1.region] || REGION_MAP['Global Network'];
        trends.forEach((t2, j) => {
          if (i < j) {
            const p2 = REGION_MAP[t2.region] || REGION_MAP['Global Network'];
            // calc real pixel pos based on percents
            ctx.moveTo((p1.x/100)*w, (p1.y/100)*h);
            ctx.bezierCurveTo(
              (p1.x/100)*w, ((p1.y+p2.y)/2/100)*h, 
              (p2.x/100)*w, ((p1.y+p2.y)/2/100)*h, 
              (p2.x/100)*w, (p2.y/100)*h
            );
          }
        });
      });
      ctx.stroke();
    };
    
    // Slight delay to ensure dimensions
    const to = setTimeout(draw, 100);
    return () => clearTimeout(to);
  }, [trends]);

  const threatNodes = useMemo(() => {
    return trends.map((trend) => {
      const basePos = REGION_MAP[trend.region] || REGION_MAP['Global Network'];
      return {
        ...trend, x: basePos.x + (Math.random() * 8 - 4), y: basePos.y + (Math.random() * 8 - 4),
      };
    });
  }, [trends]);

  return (
    <div style={{ background: 'var(--bg-main)', color: TEXT, minHeight: '100vh', padding: '100px 40px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        
        <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Globe className="animate-pulse" size={20} color={GOLD} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Truecast Sentinel
              </span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 4vw, 52px)', color: TEXT, marginBottom: 0, lineHeight: 1.1 }}>
              Global Threat Topography
            </h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontFamily: "'DM Mono', monospace", fontSize: 36, fontWeight: 700, color: '#4ade80', margin: 0, textShadow: '0 0 20px rgba(74,222,128,0.3)' }}>
              {assetsAudited.toLocaleString()}
            </h2>
            <span style={{ fontSize: 11, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Deep Forensic Audits Completed</span>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 32 }}>
          
          {/* Advanced Radar Visualizer */}
          <div style={{ position: 'relative', background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, overflow: 'hidden', minHeight: 650, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header overlay */}
            <div style={{ position: 'absolute', top: 24, left: 32, right: 32, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(var(--bg-main), 0.8)', backdropFilter: 'blur(10px)', padding: '8px 16px', borderRadius: 8, border: `1px solid ${LINE}` }}>
                <Activity size={16} color="#fbbf24" />
                <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#fbbf24', fontWeight: 600 }}>C2 SERVER SYNCED</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(248,113,113,0.1)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 10px #f87171' }} />
                <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#f87171', fontWeight: 600 }}>MALICIOUS NODES: {trends.length}</span>
              </div>
            </div>

            {/* Canvas connecting lines */}
            <canvas ref={canvasRef} width={900} height={650} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

            {/* Scanner Animation */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                style={{ width: 800, height: 800, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 80%, rgba(201,168,76,0.15) 100%)', borderRight: `2px solid rgba(201,168,76,0.6)` }}
              />
            </div>

            {/* Plotted Threat Nodes */}
            <AnimatePresence>
              {threatNodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  onMouseEnter={() => setHoveredTrend(node.id)} onMouseLeave={() => setHoveredTrend(null)}
                  style={{
                    position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
                    transform: 'translate(-50%, -50%)', cursor: 'pointer',
                    zIndex: hoveredTrend === node.id ? 50 : 20
                  }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div 
                      animate={{ scale: [1, 2.5, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() }}
                      style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: node.score > 85 ? '#f87171' : '#fbbf24' }}
                    />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: node.score > 85 ? '#ef4444' : '#f59e0b', boxShadow: '0 0 15px rgba(255,0,0,0.5)', position: 'relative', zIndex: 2 }} />
                    
                    {hoveredTrend === node.id && (
                       <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        style={{ position: 'absolute', bottom: 25, left: -100, width: 240, background: 'rgba(var(--bg-main), 0.95)', backdropFilter: 'blur(10px)', border: `1px solid ${GOLD}`, padding: 16, borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                       >
                         <h4 style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: GOLD, marginBottom: 8, textTransform: 'uppercase' }}>{node.region} NODE</h4>
                         <p style={{ fontSize: 13, color: TEXT, lineHeight: 1.4, marginBottom: 12 }}>{node.claim}</p>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: `1px dashed ${LINE}` }}>
                           <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: node.score > 85 ? '#f87171' : '#fbbf24' }}>{node.score}% CRITICAL</span>
                         </div>
                       </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Terminal Logs Overlay */}
            <div style={{ position: 'absolute', bottom: 24, left: 24, padding: 16, background: 'rgba(var(--overlay-rgb), 0.05)', backdropFilter: 'blur(5px)', border: `1px solid ${LINE}`, borderRadius: 12, width: 400 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TermIcon size={12} color={DIM} />
                <span style={{ fontSize: 10, color: MUTED, fontFamily: "'DM Mono', monospace" }}>SYSTEM_TRACE_LOGS</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence>
                  {sysLogs.map(log => (
                    <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} style={{ fontSize: 11, color: GOLD, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {log.text}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Trending Threat Ledger */}
          <div style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${LINE}`, background: 'rgba(var(--overlay-rgb), 0.01)' }}>
               <h3 style={{ fontSize: 16, fontWeight: 600, color: TEXT, margin: 0 }}>Active Threat Ledger</h3>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loading ? <p style={{ color: MUTED, fontSize: 14, textAlign: 'center', marginTop: 40 }}>Syncing telemetry...</p> : 
                <AnimatePresence>
                  {trends.map((trend) => (
                    <motion.div
                      key={trend.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onMouseEnter={() => setHoveredTrend(trend.id)} onMouseLeave={() => setHoveredTrend(null)}
                      style={{
                        padding: 16, borderRadius: 16, transition: 'all 0.2s ease', cursor: 'pointer',
                        background: hoveredTrend === trend.id ? 'rgba(var(--overlay-rgb), 0.06)' : 'rgba(var(--overlay-rgb), 0.0)',
                        border: `1px solid ${hoveredTrend === trend.id ? 'rgba(201,168,76,0.4)' : LINE}`
                      }}
                    >
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ padding: 8, borderRadius: 8, background: trend.score > 85 ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)' }}>
                          <ShieldAlert size={14} color={trend.score > 85 ? "#f87171" : "#f59e0b"} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 500, color: TEXT, marginBottom: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {trend.claim}
                          </h4>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: DIM, fontFamily: "'DM Mono', monospace" }}>{trend.region}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: trend.score > 85 ? '#f87171' : '#f59e0b' }}>
                              {trend.score}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
