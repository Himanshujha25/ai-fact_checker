import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, ShieldCheck, AlertTriangle, AlertOctagon, ExternalLink, Activity, Filter, Loader } from 'lucide-react';

const GOLD = 'var(--gold)';
const LINE = 'var(--line)';
const TEXT = 'var(--text-main)';
const MUTED = 'var(--text-muted)';
const DIM = 'var(--text-dim)';
const SURF = 'var(--surf)';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Sources() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // Dynamically fetch Source intelligence
    axios.get(`${API_BASE}/sources`)
      .then(res => {
        setSources(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sources:', err);
        setLoading(false);
      });
  }, []);

  const filteredSources = sources.filter(s => {
    const matchesSearch = s.domain.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' ? true : 
                          filter === 'Verified' ? s.trust > 80 :
                          filter === 'Warning' ? s.trust > 20 && s.trust <= 80 :
                          filter === 'Critical' ? s.trust <= 20 : true;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (trust) => {
    if (trust > 80) return '#4ade80';
    if (trust > 20) return '#fbbf24';
    return '#f87171';
  };

  const getStatusIcon = (trust) => {
    if (trust > 80) return <ShieldCheck size={16} color="#4ade80" />;
    if (trust > 20) return <AlertTriangle size={16} color="#fbbf24" />;
    return <AlertOctagon size={16} color="#f87171" />;
  };

  return (
    <div style={{ background: 'var(--bg-main)', color: TEXT, minHeight: '100vh', padding: '100px 40px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        
        <header style={{ marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Database size={20} color={GOLD} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: GOLD, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Source Intelligence Index
              </span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 'clamp(36px, 4vw, 52px)', color: TEXT, marginBottom: 12, lineHeight: 1.1 }}>
              Global Credibility Registry
            </h1>
            <p style={{ fontSize: 16, color: MUTED, maxWidth: 600 }}>
              Search our actively maintained cryptographically-hashed ledger of domains, media outlets, and publishers to verify historical reliability, systemic bias, and state affiliations.
            </p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(74,222,128,0.1)', padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(74,222,128,0.3)' }}>
               <Activity size={16} color="#4ade80" />
               <span style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: '#4ade80', fontWeight: 600 }}>LEDGER SYNCED: 8,421 DOMAINS</span>
             </div>
          </div>
        </header>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} color={DIM} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Query domain (e.g., zerohedge.com, reuters)..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '18px 24px 18px 56px', background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 16, color: TEXT, fontSize: 16, outline: 'none', transition: 'border 0.2s' }}
            />
          </div>
          <div style={{ display: 'flex', background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 16, padding: 6 }}>
            {['All', 'Verified', 'Warning', 'Critical'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)}
                style={{ padding: '0 24px', background: filter === f ? 'rgba(var(--overlay-rgb), 0.05)' : 'transparent', border: 'none', borderRadius: 10, color: filter === f ? TEXT : DIM, fontWeight: filter === f ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Source Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          <AnimatePresence>
            {filteredSources.map((source, i) => (
              <motion.div
                key={source.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                style={{ background: 'rgba(var(--overlay-rgb), 0.02)', border: `1px solid ${LINE}`, borderRadius: 24, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                {/* Visual Header */}
                <div style={{ position: 'relative', padding: 24, borderBottom: `1px solid ${LINE}`, background: 'rgba(var(--overlay-rgb), 0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {getStatusIcon(source.trust)}
                      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", fontWeight: 700, letterSpacing: '0.1em', uppercase: 'true', color: getStatusColor(source.trust) }}>
                        {source.trust > 80 ? 'VERIFIED SOURCE' : source.trust > 20 ? 'CAUTION ADVISED' : 'KNOWN HAZARD'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 4 }}>{source.name}</h3>
                    <a href={`https://${source.domain}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: DIM, textDecoration: 'none', transition: 'color 0.2s' }}>
                      {source.domain} <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  {/* Trust Radial */}
                  <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(var(--overlay-rgb), 0.05)" strokeWidth="6" />
                      <motion.circle 
                        cx="32" cy="32" r="28" fill="none" stroke={getStatusColor(source.trust)} strokeWidth="6" 
                        strokeDasharray="175.92" strokeDashoffset={175.92 - (175.92 * source.trust) / 100}
                        style={{ strokeLinecap: 'round' }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: TEXT, lineHeight: 1 }}>{source.trust}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
                   
                   {/* Meta info */}
                   <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: `1px solid ${LINE}` }}>
                     <div>
                       <span style={{ display: 'block', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Entity Type</span>
                       <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{source.type}</span>
                     </div>
                     <div>
                       <span style={{ display: 'block', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Funding / Opacity</span>
                       <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{source.transparency}</span>
                     </div>
                   </div>

                   {/* Bias Meter */}
                   <div>
                     <span style={{ display: 'block', fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Political & Narrative Bias</span>
                     <div style={{ position: 'relative', height: 8, background: 'rgba(var(--overlay-rgb), 0.05)', borderRadius: 4 }}>
                       {/* Center tick */}
                       <div style={{ position: 'absolute', top: -4, bottom: -4, left: '50%', width: 2, background: LINE }} />
                       {/* Bias Dot */}
                       <div style={{ position: 'absolute', top: '50%', left: `${(source.bias + 100) / 2}%`, transform: 'translate(-50%, -50%)', width: 14, height: 14, borderRadius: '50%', background: GOLD, boxShadow: `0 0 10px ${GOLD}`, border: `2px solid var(--bg-main)` }} />
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                       <span style={{ fontSize: 10, color: DIM, textTransform: 'uppercase' }}>Left Leaning</span>
                       <span style={{ fontSize: 10, color: DIM, textTransform: 'uppercase' }}>Right Leaning</span>
                     </div>
                   </div>

                   {/* Tags */}
                   <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                     {source.attributes.map(attr => (
                       <span key={attr} style={{ padding: '6px 12px', background: 'rgba(var(--overlay-rgb), 0.03)', border: `1px solid ${LINE}`, borderRadius: 100, fontSize: 11, color: MUTED }}>
                         {attr}
                       </span>
                     ))}
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredSources.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', border: `1px dashed ${LINE}`, borderRadius: 24 }}>
               <Search size={32} color={DIM} style={{ marginBottom: 16 }} />
               <h3 style={{ fontSize: 18, color: TEXT, marginBottom: 8 }}>No domains matched</h3>
               <p style={{ color: MUTED }}>Try searching a different URL or checking alternative filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
